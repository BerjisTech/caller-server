// src/sockets/signalNamespace.ts

import { Namespace, Socket } from 'socket.io';
import { handleJoinRoom, handleCreateRoom, handleLeaveRoom } from './handlers/roomHandlers';
import { handleOffer, handleAnswer, handleIceCandidate } from './handlers/webrtcHandlers';
import { handleChatMessage, handleSendReaction } from './handlers/messageHandlers';
import { handleAdminAction } from './handlers/adminHandlers';

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
        socket.on('disconnect', () => {
            // Handle disconnection
        });
    });
}
