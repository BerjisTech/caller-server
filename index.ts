import "reflect-metadata";
import express, { Application } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { AppDataSource } from './src/ormconfig';
import { initializeSockets } from './src/sockets';

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/socket.io',
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

AppDataSource.initialize().then(() => {

    initializeSockets(io);

    /** const signalNamespace = io.of('/signal');
      * signalNamespace.on('connection', (socket: Socket) => {
      *    console.log('User connected:', socket.id);
      *    // User joins a room
      *    socket.on('joinRoom', async ({ room_name, user_id }) => {
      *        try {
      *            const roomRepository = AppDataSource.getRepository(Room);
      *            const room = await roomRepository.findOne({ where: { name: room_name }, relations: ['roomMembers'] });
      *            if (room) {
      *                socket.join(room_name);
      *                socket.data.room_name = room_name;
      *                socket.data.user_id = user_id;
      *                const profileRepository = AppDataSource.getRepository(Profile);
      *                const profile = await profileRepository.findOne({ where: { id: user_id } });
      *                if (!profile) {
      *                    socket.emit('error', 'Profile not found');
      *                    return;
      *                }
      *                const roomMemberRepository = AppDataSource.getRepository(RoomMember);
      *                // Check if user is already a member
      *                let roomMember = await roomMemberRepository.findOne({ where: { room: room, profile: profile } });
      *                if (!roomMember) {
      *                    roomMember = roomMemberRepository.create({
      *                        isAdmin: false,
      *                        room: room,
      *                        profile: profile
      *                    });
      *                    await roomMemberRepository.save(roomMember);
      *                }
      *                // Notify existing users
      *                socket.to(room_name).emit('userJoined', { socket_id: socket.id, user_id: user_id });
      *                // Send existing users to the new user
      *                const existingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
      *                const existingUsers = existingMembers.map((member: RoomMember) => ({
      *                    socket_id: member.profile?.id ?? '', // Adjust this as needed
      *                    user_id: member.profile?.id ?? ''
      *                })).filter((user: { socket_id: string; user_id: string }) => { user.user_id !== user_id });
      *                socket.emit('existingUsers', existingUsers);
      *                // Update room isActive status
      *                if (!room.isActive) {
      *                    room.isActive = true;
      *                    await roomRepository.save(room);
      *                }
      *            } else {
      *                socket.emit('roomJoinError', 'Room not found');
      *            }
      *        } catch (error) {
      *            console.error('Error in joinRoom:', error);
      *            socket.emit('error', 'An error occurred while joining the room');
      *        }
      *    });
      *    // User creates a room
      *    socket.on('createRoom', async ({ room_name, user_id }) => {
      *        try {
      *            const roomRepository = AppDataSource.getRepository(Room);
      *            const existingRoom = await roomRepository.findOne({ where: { name: room_name } });
      *            if (existingRoom) {
      *                socket.emit('roomExists', 'Room already exists');
      *            } else {
      *                const profileRepository = AppDataSource.getRepository(Profile);
      *                const profile = await profileRepository.findOne({ where: { id: user_id } });
      *                if (!profile) {
      *                    socket.emit('error', 'Profile not found');
      *                    return;
      *                }
      *                const room = roomRepository.create({
      *                    name: room_name,
      *                    isActive: true,
      *                    profile: profile
      *                });
      *                await roomRepository.save(room);
      *                const roomMemberRepository = AppDataSource.getRepository(RoomMember);
      *                const roomMember = roomMemberRepository.create({
      *                    isAdmin: true,
      *                    room: room,
      *                    profile: profile
      *                });
      *                await roomMemberRepository.save(roomMember);
      *                socket.join(room_name);
      *                socket.data.room_name = room_name;
      *                socket.data.user_id = user_id;
      *                socket.emit('roomCreated', room_name);
      *            }
      *        } catch (error) {
      *            console.error('Error in createRoom:', error);
      *            socket.emit('error', 'An error occurred while creating the room');
      *        }
      *    });
      *    // User leaves a room
      *    socket.on('leaveRoom', async ({ room_name, user_id }) => {
      *        try {
      *            const roomRepository = AppDataSource.getRepository(Room);
      *            const room = await roomRepository.findOne({ where: { name: room_name } });
      *            if (room) {
      *                socket.leave(room_name);
      *                socket.data.room_name = null;
      *                socket.data.user_id = null;
      *                const roomMemberRepository = AppDataSource.getRepository(RoomMember);
      *                await roomMemberRepository.delete({ room: room, profile: { id: user_id } });
      *                socket.to(room_name).emit('userLeft', { socket_id: socket.id });
      *                // Check for admin reassignment
      *                const remainingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
      *                if (remainingMembers.length > 0 && !remainingMembers.some((member: RoomMember) => member.isAdmin)) {
      *                    remainingMembers[0].isAdmin = true;
      *                    await roomMemberRepository.save(remainingMembers[0]);
      *                    io.to(remainingMembers[0].profile?.id ?? '').emit('adminAssigned');
      *                }
      *                // Deactivate room if empty
      *                if (remainingMembers.length === 0) {
      *                    room.isActive = false;
      *                    await roomRepository.save(room);
      *                }
      *            }
      *        } catch (error) {
      *            console.error('Error in leaveRoom:', error);
      *            socket.emit('error', 'An error occurred while leaving the room');
      *        }
      *    });
      *    // Handle offers
      *    socket.on('offer', (data) => {
      *        socket.to(data.receiver_id).emit('offer', {
      *            offer: data.offer,
      *            sender_id: socket.id,
      *            sender_user_id: socket.data.user_id,
      *        });
      *    });
      *    // Handle answers
      *    socket.on('answer', (data) => {
      *        socket.to(data.receiver_id).emit('answer', {
      *            answer: data.answer,
      *            sender_id: socket.id,
      *            sender_user_id: socket.data.user_id,
      *        });
      *    });
      *    // Handle ICE candidates
      *    socket.on('ice-candidate', (data) => {
      *        socket.to(data.receiver_id).emit('ice-candidate', {
      *            candidate: data.candidate,
      *            sender_id: socket.id,
      *        });
      *    });
      *    // Handle chat messages
      *    socket.on('chatMessage', async (message) => {
      *        const room_name = socket.data.room_name;
      *        const user_id = socket.data.user_id;
      *        if (room_name && user_id) {
      *            socket.to(room_name).emit('chatMessage', {
      *                user_id: user_id,
      *                message,
      *            });
      *            // Save message to database
      *            const roomRepository = AppDataSource.getRepository(Room);
      *            const profileRepository = AppDataSource.getRepository(Profile);
      *            const roomMessageRepository = AppDataSource.getRepository(RoomMessage);
      *            const room = await roomRepository.findOne({ where: { name: room_name } });
      *            const profile = await profileRepository.findOne({ where: { id: user_id } });
      *            if (room && profile) {
      *                const roomMessage = roomMessageRepository.create({
      *                    content: message,
      *                    isEdited: false,
      *                    isDeleted: false,
      *                    room: room,
      *                    profile: profile
      *                });
      *                await roomMessageRepository.save(roomMessage);
      *            }
      *        }
      *    });
      *    // Handle reactions
      *    socket.on('sendReaction', async (reaction) => {
      *        const room_name = socket.data.room_name;
      *        const user_id = socket.data.user_id;
      *        if (room_name && user_id) {
      *            socket.to(room_name).emit('receiveReaction', {
      *                user_id: user_id,
      *                reaction,
      *            });
      *            // Save reaction to database if needed
      *        }
      *    });
      *    // Admin actions
      *    socket.on('adminAction', async (data) => {
      *        try {
      *            const room_name = socket.data.room_name;
      *            const user_id = socket.data.user_id;
      *            if (!room_name || !user_id) {
      *                socket.emit('error', 'Not in a room');
      *                return;
      *            }
      *            const roomMemberRepository = AppDataSource.getRepository(RoomMember);
      *            const isAdmin = await roomMemberRepository.findOne({
      *                where: {
      *                    room: { name: room_name },
      *                    profile: { id: user_id },
      *                    isAdmin: true
      *                }
      *            });
      *            if (isAdmin) {
      *                const { action, target_socket_id } = data;
      *                io.to(target_socket_id).emit('adminAction', { action });
      *                if (action === 'kick') {
      *                    const targetSocket = io.of('/signal').sockets.get(target_socket_id);
      *                    if (targetSocket) {
      *                        targetSocket.leave(room_name);
      *                        // Remove user from RoomMember table
      *                        await roomMemberRepository.delete({
      *                            room: { name: room_name },
      *                            profile: { id: targetSocket.data.user_id }
      *                        });
      *                        socket.to(room_name).emit('userLeft', { socket_id: target_socket_id });
      *                    }
      *                }
      *            } else {
      *                socket.emit('error', 'Not authorized');
      *            }
      *        } catch (error) {
      *            console.error('Error in adminAction:', error);
      *            socket.emit('error', 'An error occurred while performing admin action');
      *        }
      *    });
      *    // User disconnects
      *    socket.on('disconnect', async () => {
      *        const room_name = socket.data.room_name;
      *        const user_id = socket.data.user_id;
      *        if (room_name && user_id) {
      *            try {
      *                const roomRepository = AppDataSource.getRepository(Room);
      *                const roomMemberRepository = AppDataSource.getRepository(RoomMember);
      *                const room = await roomRepository.findOne({ where: { name: room_name } });
      *                if (room) {
      *                    await roomMemberRepository.delete({ room: room, profile: { id: user_id } });
      *                    socket.to(room_name).emit('userLeft', { socket_id: socket.id });
      *                    const remainingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
      *                    if (remainingMembers.length > 0 && !remainingMembers.some((member: RoomMember) => member.isAdmin)) {
      *                        remainingMembers[0].isAdmin = true;
      *                        await roomMemberRepository.save(remainingMembers[0]);
      *                        io.to(remainingMembers[0].profile?.id ?? '').emit('adminAssigned');
      *                    }
      *                    if (remainingMembers.length === 0) {
      *                        room.isActive = false;
      *                        await roomRepository.save(room);
      *                    }
      *                }
      *            } catch (error) {
      *                console.error('Error in disconnect:', error);
      *            }
      *        }
      *        console.log('User disconnected:', socket.id);
      *    });
      * });
      */

    // Root path
    app.get('/', (req, res) => {
        res.send('Hello, World!');
    });

    // Start the server
    server.listen(3006, () => {
        console.log('Listening on *:3006');
    });

}).catch((error: any) => console.log("TypeORM initialization error:", error));
