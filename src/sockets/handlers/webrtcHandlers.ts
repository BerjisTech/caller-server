// src/sockets/handlers/webrtcHandlers.ts

import { Namespace, Socket } from 'socket.io';

export function handleOffer(io: Namespace, socket: Socket, data: any) {
    socket.to(data.receiver_id).emit('offer', {
        offer: data.offer,
        sender_id: socket.id,
        sender_user_id: socket.data.user_id,
    });
}

export function handleAnswer(io: Namespace, socket: Socket, data: any) {
    socket.to(data.receiver_id).emit('answer', {
        answer: data.answer,
        sender_id: socket.id,
        sender_user_id: socket.data.user_id,
    });
}

export function handleIceCandidate(io: Namespace, socket: Socket, data: any) {
    socket.to(data.receiver_id).emit('ice-candidate', {
        candidate: data.candidate,
        sender_id: socket.id,
    });
}
