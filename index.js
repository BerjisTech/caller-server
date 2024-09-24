// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    path: '/socket.io',
});

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
        // emit error
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