// src/sockets/handlers/roomHandlers.ts

import { Namespace, Socket } from 'socket.io';
import { AppDataSource } from '../../ormconfig';
import { Room } from '../../models/Room';
import { Profile } from '../../models/Profile';
import { RoomMember } from '../../models/RoomMember';

export async function handleJoinRoom(io: Namespace, socket: Socket, { room_name, user_id }: { room_name: string; user_id: string }) {
    try {
        const roomRepository = AppDataSource.getRepository(Room);
        const room = await roomRepository.findOne({ where: { name: room_name }, relations: ['roomMembers'] });

        if (room) {
            socket.join(room_name);
            socket.data.room_name = room_name;
            socket.data.user_id = user_id;

            const profileRepository = AppDataSource.getRepository(Profile);
            const profile = await profileRepository.findOne({ where: { id: user_id } });

            if (!profile) {
                socket.emit('error', 'Profile not found');
                return;
            }

            const roomMemberRepository = AppDataSource.getRepository(RoomMember);

            // Check if user is already a member
            let roomMember = await roomMemberRepository.findOne({ where: { room: room, profile: profile } });
            if (!roomMember) {
                roomMember = roomMemberRepository.create({
                    isAdmin: false,
                    room: room,
                    profile: profile,
                });
                await roomMemberRepository.save(roomMember);
            }

            // Notify existing users
            socket.to(room_name).emit('userJoined', { socket_id: socket.id, user_id: user_id });

            // Send existing users to the new user
            const existingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
            const existingUsers = existingMembers
                .map((member: RoomMember) => ({
                    socket_id: member.profile?.id ?? '',
                    user_id: member.profile?.id ?? '',
                }))
                .filter((user) => user.user_id !== user_id);

            socket.emit('existingUsers', existingUsers);

            // Update room isActive status
            if (!room.isActive) {
                room.isActive = true;
                await roomRepository.save(room);
            }
        } else {
            socket.emit('roomJoinError', 'Room not found');
        }
    } catch (error) {
        console.error('Error in joinRoom:', error);
        socket.emit('error', 'An error occurred while joining the room');
    }
}

export async function handleCreateRoom(io: Namespace, socket: Socket, { room_name, user_id }: { room_name: string; user_id: string }) {
    // Implement the create room logic here
}

export async function handleLeaveRoom(io: Namespace, socket: Socket, { room_name, user_id }: { room_name: string; user_id: string }) {
    // Implement the leave room logic here
}
