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
