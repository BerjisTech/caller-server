// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios'); // Import Axios

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    path: '/socket.io',
    cors: {
        origin: "*", // Allow all origins for simplicity, adjust as needed
        methods: ["GET", "POST"]
    }
});
// const api_path = localhost:8089 in dev or nichapie.com in production
let api_path = 'http://localhost:8089';
if (process.env.NODE_ENV === 'production') {
    api_path = 'https://nichapie.com';
}

let users = {}; // Store user status
let rooms = {}; // Store rooms and their details

io.of('signal').on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins a room
    socket.on('joinRoom', ({ room_name, user_id }) => {
        const room = rooms[room_name];
        if (room) {
            socket.join(room_name);
            socket.room_name = room_name;
            socket.user_id = user_id;

            room.users.push({ socket_id: socket.id, user_id: socket.user_id, is_admin: false });

            // Notify existing users
            socket.to(room_name).emit('userJoined', { socket_id: socket.id, user_id: socket.user_id });

            // Send existing users to the new user
            socket.emit(
                'existingUsers',
                room.users.filter((u) => u.socket_id !== socket.id)
            );

            // Send update request to Rails to set is_active to true
            axios.put(`${api_path}/api/rooms/${room_name}`, { room: { is_active: true } })
                .then(response => {
                    console.log('Room status updated:', response.data);
                })
                .catch(error => {
                    console.error('Error updating room status:', error);
                });
        } else {
            socket.emit('roomJoinError', 'Room not found');
        }
    });

    // User creates a room
    socket.on('createRoom', ({ room_name, user_id }) => {
        if (rooms[room_name]) {
            socket.emit('roomExists', 'Room already exists');
        } else {
            rooms[room_name] = {
                users: [{ socket_id: socket.id, user_id, is_admin: true }]
            };
            socket.join(room_name);
            socket.room_name = room_name;
            socket.user_id = user_id;
            socket.emit('roomCreated', room_name);
        }
    });

    socket.on('leaveRoom', ({ room_name, user_id }) => {
        const room = rooms[room_name];
        if (room) {
            socket.leave(room_name);
            socket.room_name = null;
            socket.user_id = null;
            room.users = room.users.filter((u) => u.socket_id !== socket.id);
            socket.to(room_name).emit('userLeft', { socket_id: socket.id });

            // If admin leaves, assign new admin
            if (room.users.length > 0 && !room.users.some((u) => u.is_admin)) {
                room.users[0].is_admin = true;
                io.to(room.users[0].socket_id).emit('adminAssigned');
            }

            // Delete room if empty
            if (room.users.length === 0) {
                // Set room is_active to false
                axios.put(`${api_path}/api/rooms/${room_name}`, { room: { is_active: false } })
                    .then(response => {
                        console.log('Room status updated:', response.data);
                    })
                    .catch(error => {
                        console.error('Error updating room status:', error);
                    });
                delete rooms[room_name];
            }
        }
    });

    // Handle offers
    socket.on('offer', (data) => {
        socket.to(data.receiver_id).emit('offer', {
            offer: data.offer,
            sender_id: socket.id,
            sender_user_id: socket.user_id,
        });
    });

    // Handle answers
    socket.on('answer', (data) => {
        socket.to(data.receiver_id).emit('answer', {
            answer: data.answer,
            sender_id: socket.id,
            sender_user_id: socket.user_id,
        });
    });

    // Handle ICE candidates
    socket.on('ice-candidate', (data) => {
        socket.to(data.receiver_id).emit('ice-candidate', {
            candidate: data.candidate,
            sender_id: socket.id,
        });
    });

    // Handle errors
    socket.on('error', (message) => {
        console.error('Socket error:', message);
        socket.emit('error', message);
    });

    // Handle chat messages
    socket.on('chatMessage', (message) => {
        const room_name = socket.room_name;
        if (room_name) {
            socket.to(room_name).emit('chatMessage', {
                user_id: socket.user_id,
                message,
            });
        }
    });

    // Handle reactions
    socket.on('sendReaction', (reaction) => {
        const room_name = socket.room_name;
        if (room_name) {
            socket.to(room_name).emit('receiveReaction', {
                user_id: socket.user_id,
                reaction,
            });
        }
    });

    // Admin actions
    socket.on('adminAction', (data) => {
        const room_name = socket.room_name;
        const room = rooms[room_name];
        const is_admin = room.users.find(
            (u) => u.socket_id === socket.id && u.is_admin
        );

        if (is_admin) {
            const { action, target_socket_id } = data;
            io.to(target_socket_id).emit('adminAction', { action });
            if (action === 'kick') {
                io.of('/signal').sockets.get(target_socket_id).leave(room_name);
                room.users = room.users.filter((u) => u.socket_id !== target_socket_id);
                socket.to(room_name).emit('userLeft', { socket_id: target_socket_id });
            }
        } else {
            socket.emit('error', 'Not authorized');
        }
    });

    /**
     * Streaming feature
     * Broadcaster starts streaming
     * Viewer joins a broadcaster's stream
     * Handle streaming-specific WebRTC signaling
     */
    let broadcasters = new Map(); // Maps broadcaster ID to a set of viewer IDs

    // Broadcaster starts streaming
    socket.on('start-stream', ({ user_id }) => {
        console.log(`Broadcaster ${socket.id} started streaming with user_id: ${user_id}`);
        broadcasters.set(socket.id, { viewers: new Set(), user_id });
        console.log('Current broadcasters:', Array.from(broadcasters.keys()));
        io.emit('broadcaster-available', Array.from(broadcasters.keys()).map((id) => ({
            id,
            name: broadcasters.get(id).user_id || 'Anonymous'
        })));
    });


    // Viewer joins a broadcaster's stream
    socket.on('join-stream', ({ broadcaster_id }) => {
        console.log(`Viewer ${socket.id} attempting to join broadcaster ${broadcaster_id}`);
        const broadcaster = broadcasters.get(broadcaster_id);

        if (broadcaster) {
            broadcaster.viewers.add(socket.id);
            console.log(`Viewer ${socket.id} successfully joined broadcaster ${broadcaster_id}`);
            console.log('Current viewers for broadcaster:', Array.from(broadcaster.viewers));
            socket.to(broadcaster_id).emit('viewer-joined', { viewer_id: socket.id });
        } else {
            console.error('Broadcaster not found for ID:', broadcaster_id);
            socket.emit('error', 'Broadcaster not found');
        }
    });


    socket.on('request-broadcasters', () => {
        console.log('Requesting broadcasters');
        socket.emit('broadcaster-available', broadcasters); // Send list to requester
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

    // User disconnects
    socket.on('disconnect', () => {
        const room_name = socket.room_name;
        if (room_name) {
            const room = rooms[room_name];
            if (room) {
                room.users = room.users.filter((u) => u.socket_id !== socket.id);
                socket.to(room_name).emit('userLeft', { socket_id: socket.id });
                // If admin leaves, assign new admin
                if (room.users.length > 0 && !room.users.some((u) => u.is_admin)) {
                    room.users[0].is_admin = true;
                    io.to(room.users[0].socket_id).emit('adminAssigned');
                }
                // Delete room if empty
                if (room.users.length === 0) {
                    delete rooms[room_name];
                }
            }
        } else {
            broadcasters.forEach((broadcaster, id) => {
                if (id === socket.id) {
                    // Remove broadcaster and notify viewers
                    broadcaster.viewers.forEach((viewerId) => {
                        io.to(viewerId).emit('broadcaster-disconnected');
                    });
                    broadcasters.delete(id);
                } else if (broadcaster.viewers.has(socket.id)) {
                    // Remove viewer from the broadcaster's list
                    broadcaster.viewers.delete(socket.id);
                }
            });

            io.emit('broadcaster-available', Array.from(broadcasters.keys()).map((id) => ({
                id,
                name: broadcasters.get(id).user_id || 'Anonymous'
            })));
        }
        console.log('User disconnected:', socket.id);
    });
});

// /user/status
app.get('/user/status', (req, res) => {
    res.json(users);
});

// Start the server
server.listen(3006, () => {
    console.log('Listening on *:3006');
});