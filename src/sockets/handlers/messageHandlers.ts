// src/sockets/handlers/messageHandlers.ts

import { Namespace, Socket } from 'socket.io';
import { AppDataSource } from '../../ormconfig';
import { Room } from '../../models/Room';
import { Profile } from '../../models/Profile';
import { RoomMessage } from '../../models/RoomMessage';

export async function handleChatMessage(io: Namespace, socket: Socket, message: string) {
    const room_name = socket.data.room_name;
    const user_id = socket.data.user_id;
    if (room_name && user_id) {
        socket.to(room_name).emit('chatMessage', {
            user_id: user_id,
            message,
        });
        // Save message to database
        const roomRepository = AppDataSource.getRepository(Room);
        const profileRepository = AppDataSource.getRepository(Profile);
        const roomMessageRepository = AppDataSource.getRepository(RoomMessage);
        const room = await roomRepository.findOne({ where: { name: room_name } });
        const profile = await profileRepository.findOne({ where: { id: user_id } });
        if (room && profile) {
            const roomMessage = roomMessageRepository.create({
                content: message,
                isEdited: false,
                isDeleted: false,
                room: room,
                profile: profile
            });
            await roomMessageRepository.save(roomMessage);
        }
    }
}

export async function handleSendReaction(io: Namespace, socket: Socket, reactionData: any) {
    const room_name = socket.data.room_name;
    const user_id = socket.data.user_id;

    if (room_name && user_id) {
        // Broadcast the reaction to other users in the room
        socket.to(room_name).emit('receiveReaction', {
            user_id: user_id,
            reaction: reactionData,
        });

        // Optionally, save the reaction to the database
        // If you have a RoomMessageReaction model and repository, you can save it like this:
        /*
        try {
          const roomMessageReactionRepository = AppDataSource.getRepository(RoomMessageReaction);
          const profileRepository = AppDataSource.getRepository(Profile);
    
          const profile = await profileRepository.findOne({ where: { id: user_id } });
    
          if (profile) {
            const roomMessageReaction = roomMessageReactionRepository.create({
              reaction: reactionData.reaction, // Adjust based on your data structure
              roomMessageId: reactionData.messageId, // Assuming you have a message ID
              profile: profile,
            });
            await roomMessageReactionRepository.save(roomMessageReaction);
          }
        } catch (error) {
          console.error('Error saving reaction:', error);
          socket.emit('error', 'An error occurred while saving the reaction');
        }
        */
    } else {
        socket.emit('error', 'You are not in a room or user ID is missing');
    }
}
