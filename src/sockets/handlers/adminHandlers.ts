// src/sockets/handlers/adminHandlers.ts

import { Namespace, Socket } from 'socket.io';
import { AppDataSource } from '../../ormconfig';
import { Room } from '../../models/Room';
import { RoomMember } from '../../models/RoomMember';
import { Profile } from '../../models/Profile';

interface AdminActionData {
    action: string;
    target_socket_id: string;
}

export async function handleAdminAction(io: Namespace, socket: Socket, data: AdminActionData) {
    try {
        const room_name = socket.data.room_name;
        const user_id = socket.data.user_id;

        if (!room_name || !user_id) {
            socket.emit('error', 'Not in a room');
            return;
        }

        const roomMemberRepository = AppDataSource.getRepository(RoomMember);
        const isAdmin = await roomMemberRepository.findOne({
            where: {
                room: { name: room_name },
                profile: { id: user_id },
                isAdmin: true,
            },
        });

        if (isAdmin) {
            const { action, target_socket_id } = data;
            io.to(target_socket_id).emit('adminAction', { action });

            if (action === 'kick') {
                const targetSocket = io.sockets.get(target_socket_id);

                if (targetSocket) {
                    targetSocket.leave(room_name);

                    // Remove user from RoomMember table
                    const profileRepository = AppDataSource.getRepository(Profile);
                    const profile = await profileRepository.findOne({ where: { username: targetSocket.data.user_id } });

                    if (profile) {
                        await roomMemberRepository.delete({
                            room: { name: room_name },
                            profile: profile,
                        });

                        socket.to(room_name).emit('userLeft', { socket_id: target_socket_id });
                    }
                }
            }
            // Implement other admin actions if needed
        } else {
            socket.emit('error', 'Not authorized');
        }
    } catch (error) {
        console.error('Error in adminAction:', error);
        socket.emit('error', 'An error occurred while performing admin action');
    }
}
