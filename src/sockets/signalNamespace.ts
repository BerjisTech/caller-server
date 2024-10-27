// src/sockets/signalNamespace.ts

import { Namespace, Socket } from 'socket.io';
import { handleJoinRoom, handleCreateRoom, handleLeaveRoom } from './handlers/roomHandlers';
import { handleOffer, handleAnswer, handleIceCandidate } from './handlers/webrtcHandlers';
import { handleChatMessage, handleSendReaction } from './handlers/messageHandlers';
import { handleAdminAction } from './handlers/adminHandlers';
import { AppDataSource } from '../ormconfig';
import { Room } from '../models/Room';
import { RoomMember } from '../models/RoomMember';

export function setupSignalNamespace(io: Namespace) {
    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // Room events
        socket.on('joinRoom', (data) => handleJoinRoom(io, socket, data));
        socket.on('createRoom', (data) => handleCreateRoom(io, socket, data));
        socket.on('leaveRoom', (data) => handleLeaveRoom(io, socket, data));

        // WebRTC events
        socket.on('offer', (data) => handleOffer(io, socket, data));
        socket.on('answer', (data) => handleAnswer(io, socket, data));
        socket.on('ice-candidate', (data) => handleIceCandidate(io, socket, data));

        // Message events
        socket.on('chatMessage', (message) => handleChatMessage(io, socket, message));
        socket.on('sendReaction', (reaction) => handleSendReaction(io, socket, reaction));

        // Admin events
        socket.on('adminAction', (data) => handleAdminAction(io, socket, data));

        // Disconnect event
        socket.on('disconnect', async () => {
            const room_name = socket.data.room_name;
            const user_id = socket.data.user_id;
            if (room_name && user_id) {
                try {
                    const roomRepository = AppDataSource.getRepository(Room);
                    const roomMemberRepository = AppDataSource.getRepository(RoomMember);
                    const room = await roomRepository.findOne({ where: { name: room_name } });
                    if (room) {
                        await roomMemberRepository.delete({ room: room, profile: { id: user_id } });
                        socket.to(room_name).emit('userLeft', { socket_id: socket.id });
                        const remainingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
                        if (remainingMembers.length > 0 && !remainingMembers.some((member: RoomMember) => member.isAdmin)) {
                            remainingMembers[0].isAdmin = true;
                            await roomMemberRepository.save(remainingMembers[0]);
                            io.to(remainingMembers[0].profile?.id ?? '').emit('adminAssigned');
                        }
                        if (remainingMembers.length === 0) {
                            room.isActive = false;
                            await roomRepository.save(room);
                        }
                    }
                } catch (error) {
                    console.error('Error in disconnect:', error);
                }
            }
            console.log('User disconnected:', socket.id);
        });
    });
}
