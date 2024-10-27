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
            const profile = await profileRepository.findOne({ where: { username: user_id } });
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
                    profile: profile
                });
                await roomMemberRepository.save(roomMember);
            }
            // Notify existing users
            socket.to(room_name).emit('userJoined', { socket_id: socket.id, user_id: user_id });
            // Send existing users to the new user
            const existingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
            const existingUsers = existingMembers.map((member: RoomMember) => ({
                socket_id: member.profile?.id ?? '', // Adjust this as needed
                user_id: member.profile?.id ?? ''
            })).filter((user: { socket_id: string; user_id: string }) => { user.user_id !== user_id });
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
    try {
        const roomRepository = AppDataSource.getRepository(Room);
        const existingRoom = await roomRepository.findOne({ where: { name: room_name } });
        if (existingRoom) {
            socket.emit('roomExists', 'Room already exists');
        } else {
            const profileRepository = AppDataSource.getRepository(Profile);
            const profile = await profileRepository.findOne({ where: { username: user_id } });
            if (!profile) {
                socket.emit('error', 'Profile not found');
                return;
            }
            const room = roomRepository.create({
                name: room_name,
                isActive: true,
                profile: profile
            });
            await roomRepository.save(room);
            const roomMemberRepository = AppDataSource.getRepository(RoomMember);
            const roomMember = roomMemberRepository.create({
                isAdmin: true,
                room: room,
                profile: profile
            });
            await roomMemberRepository.save(roomMember);
            socket.join(room_name);
            socket.data.room_name = room_name;
            socket.data.user_id = user_id;
            socket.emit('roomCreated', room_name);
        }
    } catch (error) {
        console.error('Error in createRoom:', error);
        socket.emit('error', 'An error occurred while creating the room');
    }
}

export async function handleLeaveRoom(io: Namespace, socket: Socket, { room_name, user_id }: { room_name: string; user_id: string }) {
    try {
        const roomRepository = AppDataSource.getRepository(Room);
        const room = await roomRepository.findOne({ where: { name: room_name } });
        if (room) {
            socket.leave(room_name);
            socket.data.room_name = null;
            socket.data.user_id = null;
            const roomMemberRepository = AppDataSource.getRepository(RoomMember);
            await roomMemberRepository.delete({ room: room, profile: { id: user_id } });
            socket.to(room_name).emit('userLeft', { socket_id: socket.id });
            // Check for admin reassignment
            const remainingMembers = await roomMemberRepository.find({ where: { room: room }, relations: ['profile'] });
            if (remainingMembers.length > 0 && !remainingMembers.some((member: RoomMember) => member.isAdmin)) {
                remainingMembers[0].isAdmin = true;
                await roomMemberRepository.save(remainingMembers[0]);
                io.to(remainingMembers[0].profile?.id ?? '').emit('adminAssigned');
            }
            // Deactivate room if empty
            if (remainingMembers.length === 0) {
                room.isActive = false;
                await roomRepository.save(room);
            }
        }
    } catch (error) {
        console.error('Error in leaveRoom:', error);
        socket.emit('error', 'An error occurred while leaving the room');
    }
}
