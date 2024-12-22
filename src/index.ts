// server.ts
import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import axios from "axios";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*", // Allow all origins for simplicity, adjust as needed
    methods: ["GET", "POST"],
  },
});

// Define environment-specific API paths
let apiPath =
  process.env.NODE_ENV === "production"
    ? "https://nichapie.com"
    : "http://localhost:8089";

// Define types for user and room structures
interface User {
  socket_id: string;
  user_id: string;
  is_admin: boolean;
}

interface Room {
  users: User[];
}

interface BroadcasterInfo {
  id: string;
  viewers: Viewer[];
  user_id: string;
  socket_id: string;
  name?: string;
  viewerCount?: number;
}

export interface Viewer {
  id: string;
  name: string;
}

let broadcasters = new Map<string, BroadcasterInfo>();

// Store user status and room details
let users: Record<string, any> = {};
let rooms: Record<string, Room> = {};

// Signal namespace
io.of("signal").on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);

  // User joins a room
  socket.on(
    "joinRoom",
    ({ room_name, user_id }: { room_name: string; user_id: string }) => {
      const room = rooms[room_name];
      if (room) {
        socket.join(room_name);
        (socket as any).room_name = room_name;
        (socket as any).user_id = user_id;

        room.users.push({ socket_id: socket.id, user_id, is_admin: false });

        // Notify existing users in the room
        socket
          .to(room_name)
          .emit("userJoined", { socket_id: socket.id, user_id });

        // Send existing users to the new user
        socket.emit(
          "existingUsers",
          room.users.filter((u) => u.socket_id !== socket.id)
        );

        // Update room status to active
        axios
          .put(`${apiPath}/api/rooms/${room_name}`, {
            room: { is_active: true },
          })
          .then((response) => {
            console.log("Room status updated:", response.data);
          })
          .catch((error) => {
            console.error("Error updating room status:", error);
          });
      } else {
        socket.emit("roomJoinError", "Room not found");
      }
    }
  );

  // User creates a room
  socket.on(
    "createRoom",
    ({ room_name, user_id }: { room_name: string; user_id: string }) => {
      if (rooms[room_name]) {
        socket.emit("roomExists", "Room already exists");
      } else {
        rooms[room_name] = {
          users: [{ socket_id: socket.id, user_id, is_admin: true }],
        };
        socket.join(room_name);
        (socket as any).room_name = room_name;
        (socket as any).user_id = user_id;
        socket.emit("roomCreated", room_name);
      }
    }
  );

  // User leaves a room
  socket.on(
    "leaveRoom",
    ({ room_name, user_id }: { room_name: string; user_id: string }) => {
      const room = rooms[room_name];
      if (room) {
        socket.leave(room_name);
        (socket as any).room_name = null;
        (socket as any).user_id = null;
        room.users = room.users.filter((u) => u.socket_id !== socket.id);
        socket.to(room_name).emit("userLeft", { socket_id: socket.id });

        // If admin leaves, assign a new admin
        if (room.users.length > 0 && !room.users.some((u) => u.is_admin)) {
          room.users[0].is_admin = true;
          io.to(room.users[0].socket_id).emit("adminAssigned");
        }

        // Delete room if empty
        if (room.users.length === 0) {
          axios
            .put(`${apiPath}/api/rooms/${room_name}`, {
              room: { is_active: false },
            })
            .then((response) => {
              console.log("Room status updated:", response.data);
            })
            .catch((error) => {
              console.error("Error updating room status:", error);
            });
          delete rooms[room_name];
        }
      }
    }
  );

  // Handle offers
  socket.on("offer", (data: { offer: any; receiver_id: string }) => {
    socket.to(data.receiver_id).emit("offer", {
      offer: data.offer,
      sender_id: socket.id,
      sender_user_id: (socket as any).user_id,
    });
  });

  // Handle answers
  socket.on("answer", (data: { answer: any; receiver_id: string }) => {
    socket.to(data.receiver_id).emit("answer", {
      answer: data.answer,
      sender_id: socket.id,
      sender_user_id: (socket as any).user_id,
    });
  });

  // Handle ICE candidates
  socket.on(
    "ice-candidate",
    (data: { candidate: any; receiver_id: string }) => {
      socket.to(data.receiver_id).emit("ice-candidate", {
        candidate: data.candidate,
        sender_id: socket.id,
      });
    }
  );

  // Handle errors
  socket.on("error", (err: Error) => {
    console.error("Socket error:", err.message);
    socket.emit("error", err.message);
  });

  // Handle chat messages
  socket.on("chatMessage", (message: string) => {
    const room_name = (socket as any).room_name;
    if (room_name) {
      socket.to(room_name).emit("chatMessage", {
        user_id: (socket as any).user_id,
        message,
      });
    }
  });

  // Handle reactions
  socket.on("sendReaction", (reaction: string) => {
    const room_name = (socket as any).room_name;
    if (room_name) {
      socket.to(room_name).emit("receiveReaction", {
        user_id: (socket as any).user_id,
        reaction,
      });
    }
  });

  // Admin actions
  socket.on(
    "adminAction",
    (data: { action: string; target_socket_id: string }) => {
      const room_name = (socket as any).room_name;
      const room = rooms[room_name];
      const is_admin = room.users.some(
        (u) => u.socket_id === socket.id && u.is_admin
      );

      if (is_admin) {
        const { action, target_socket_id } = data;
        io.to(target_socket_id).emit("adminAction", { action });
        if (action === "kick") {
          io.of("/signal").sockets.get(target_socket_id)?.leave(room_name);
          room.users = room.users.filter(
            (u) => u.socket_id !== target_socket_id
          );
          socket
            .to(room_name)
            .emit("userLeft", { socket_id: target_socket_id });
        }
      } else {
        socket.emit("error", "Not authorized");
      }
    }
  );

  /**
     * Streaming feature
     * Broadcaster starts streaming
     * Viewer joins a broadcaster's stream
     * Handle streaming-specific WebRTC signaling
     */
  // Helper function to get current broadcasters list
  const getBroadcastersList = () => {
    let broadcasterArray = Array.from(broadcasters.entries()).map(([id, data]) => ({
      id,
      name: data.user_id || 'Anonymous',
      viewerCount: data.viewers.length,
      viewers: data.viewers,
      user_id: data.user_id,
      socket_id: data.id
    }));

    console.log('Current broadcasters:', broadcasterArray);
    return broadcasterArray;
  };

  // Helper function to broadcast current broadcaster list to all clients
  const broadcastBroadcastersList = () => {
    const list = getBroadcastersList();
    console.log('Broadcasting updated broadcaster list:', list);
    io.of("/signal").emit('broadcaster-available', list);
  };

  // Broadcaster starts streaming
  socket.on('start-stream', ({ user_id }) => {
    console.log('=== Start Stream Event ===');
    console.log(`Broadcaster ${socket.id} started streaming with user_id: ${user_id}`);

    broadcasters.set(socket.id, {
      id: socket.id,
      viewers: [],
      user_id,
      socket_id: socket.id
    });

    broadcastBroadcastersList();
  });


  // Viewer joins a broadcaster's stream
  socket.on('join-stream', ({ broadcaster_id, viewer }) => {
    console.log(`Viewer ${socket.id} attempting to join broadcaster ${broadcaster_id}`);
    const broadcaster = broadcasters.get(broadcaster_id);
    viewer.id = socket.id;

    if (broadcaster) {
      broadcaster.viewers.push(viewer);
      console.log(`Viewer ${socket.id} successfully joined broadcaster ${broadcaster_id}`);
      console.log('Current viewers for broadcaster:', Array.from(broadcaster.viewers));

      socket.to(broadcaster_id).emit('viewer-joined', { viewer_id: socket.id });
      broadcastBroadcastersList(); // Update all clients with new viewer count
    } else {
      console.error('Broadcaster not found for ID:', broadcaster_id);
      socket.emit('error', 'Broadcaster not found');
    }
  });

  // Stream chat messages
  socket.on('stream-chat', ({ message, broadcaster_id, name }) => {
    console.log(`Received chat message: ${message} from viewer ${socket.id} for broadcaster ${broadcaster_id}`);
    const broadcaster = broadcasters.get(broadcaster_id);
    if (broadcaster) {
      console.log('Broadcasting chat to viewers:', Array.from(broadcaster.viewers));

      broadcaster.viewers.forEach((viewer) => {
        console.log('Sending chat to viewer:', viewer.id);
        socket.to(viewer.id).emit('stream-chat', { name: name, message });
      });
      socket.to(broadcaster.id).emit('stream-chat', { name: name, message });
    } else {
      console.error('Broadcaster not found for socket ID:', broadcaster_id);
    }
  });

  // Stream reactions
  socket.on('stream-reaction', (reaction: string) => {
    console.log('Received reaction:', reaction);
    const broadcaster = broadcasters.get(socket.id);
    if (broadcaster) {
      console.log('Broadcasting reaction to viewers:', Array.from(broadcaster.viewers));

      broadcaster.viewers.forEach((viewer) => {
        socket.to(viewer.id).emit('stream-reaction', { user_id: broadcaster.user_id, reaction });
      });
      socket.to(broadcaster.id).emit('stream-reaction', { user_id: broadcaster.user_id, reaction });
    } else {
      console.error('Broadcaster not found for socket ID:', socket.id);
    }
  });


  // Request broadcasters list
  socket.on('request-broadcasters', () => {
    console.log('Client requesting broadcasters list');
    const broadcastersList = getBroadcastersList();
    socket.emit('broadcaster-available', broadcastersList);
    socket.to(socket.id).emit('broadcaster-available', broadcastersList); // Send back to stream creator
  });

  // Handle preview stream signaling
  socket.on('request-preview', ({ broadcaster_id }) => {
    console.log(`Preview requested from broadcaster ${broadcaster_id} by viewer ${socket.id}`);
    socket.to(broadcaster_id).emit('request-preview', { viewer_id: socket.id });
  });

  socket.on('preview-offer', (data) => {
    console.log('Received preview offer:', data);
    socket.to(data.target_id).emit('preview-offer', {
      offer: data.offer,
      sender_id: socket.id
    });
  });

  socket.on('preview-answer', (data) => {
    console.log('Received preview answer:', data);
    socket.to(data.target_id).emit('preview-answer', {
      answer: data.answer,
      sender_id: socket.id
    });
  });

  // Handle streaming-specific WebRTC signaling
  socket.on('stream-offer', (data) => {
    console.log('Received stream offer from:', socket.id, 'to:', data.target_id, 'Offer:', data.offer);
    socket.to(data.target_id).emit('stream-offer', { offer: data.offer, sender_id: socket.id });
  });

  socket.on('stream-answer', (data) => {
    console.log('Received stream answer from:', socket.id, 'to:', data.target_id, 'Answer:', data.answer);
    socket.to(data.target_id).emit('stream-answer', { answer: data.answer, sender_id: socket.id });
  });


  socket.on('stream-ice-candidate', (data) => {
    console.log('Received stream ICE candidate:', data);
    const { target_id, candidate } = data;
    socket.to(target_id).emit('stream-ice-candidate', { candidate, sender_id: socket.id });
  });

  socket.on('leave-stream', ({ broadcaster_id }) => {
    console.log(`Viewer ${socket.id} leaving broadcaster ${broadcaster_id}`);
    const broadcaster = broadcasters.get(broadcaster_id);

    if (broadcaster) {
      // broadcaster.viewers.delete(socket.id);
      broadcaster.viewers = broadcaster.viewers.filter((viewer) => viewer.id !== socket.id);
      console.log(`Viewer ${socket.id} successfully left broadcaster ${broadcaster_id}`);
      console.log('Current viewers for broadcaster:', Array.from(broadcaster.viewers));

      socket.to(broadcaster_id).emit('viewer-left', { viewer_id: socket.id });
      broadcastBroadcastersList(); // Update all clients with new viewer count
    } else {
      console.error('Broadcaster not found for ID:', broadcaster_id);
      socket.emit('error', 'Broadcaster not found');
    }
  });


  // User disconnects
  socket.on("disconnect", () => {
    const room_name = (socket as any).room_name;
    if (room_name) {
      const room = rooms[room_name];
      if (room) {
        room.users = room.users.filter((u) => u.socket_id !== socket.id);
        socket.to(room_name).emit("userLeft", { socket_id: socket.id });

        if (room.users.length > 0 && !room.users.some((u) => u.is_admin)) {
          room.users[0].is_admin = true;
          io.to(room.users[0].socket_id).emit("adminAssigned");
        }
        if (room.users.length === 0) delete rooms[room_name];
      }
    }
    // Check if disconnected user was a broadcaster
    if (broadcasters.has(socket.id)) {
      const broadcaster = broadcasters.get(socket.id)!;

      // Notify all viewers that broadcaster has disconnected
      broadcaster.viewers.forEach((viewer) => {
        io.to(viewer.id).emit('broadcaster-disconnected', { broadcaster_id: socket.id });
      });

      broadcasters.delete(socket.id);
      broadcastBroadcastersList();
    } else {
      // Check if disconnected user was a viewer
      broadcasters.forEach((broadcaster) => {
        // if (broadcaster.viewers.has(socket.id)) {
        //   broadcaster.viewers.delete(socket.id);
        //   broadcastBroadcastersList();
        // }
        broadcaster.viewers = broadcaster.viewers.filter((viewer) => viewer.id !== socket.id);
        broadcastBroadcastersList();
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

// Default / path, hello world
app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

// /user/status route
app.get("/user/status", (req: Request, res: Response) => {
  res.json(users);
});

// Start the server
server.listen(3006, () => {
  console.log("Listening on *:3006");
});
