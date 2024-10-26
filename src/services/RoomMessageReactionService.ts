import { getRepository } from "typeorm";
import { RoomMessageReaction } from "../models/RoomMessageReaction";

export class RoomMessageReactionService {
  static async create(data: Partial<RoomMessageReaction>) {
    const roomMessageReactionRepository = getRepository(RoomMessageReaction);
    const roomMessageReaction = roomMessageReactionRepository.create(data);
    return roomMessageReactionRepository.save(roomMessageReaction);
  }

  static async getAll() {
    const roomMessageReactionRepository = getRepository(RoomMessageReaction);
    return roomMessageReactionRepository.find();
  }

  static async getById(id: string) {
    const roomMessageReactionRepository = getRepository(RoomMessageReaction);
    return roomMessageReactionRepository.findOne(id);
  }

  static async update(id: string, data: Partial<RoomMessageReaction>) {
    const roomMessageReactionRepository = getRepository(RoomMessageReaction);
    await roomMessageReactionRepository.update(id, data);
    return roomMessageReactionRepository.findOne(id);
  }

  static async delete(id: string) {
    const roomMessageReactionRepository = getRepository(RoomMessageReaction);
    const result = await roomMessageReactionRepository.delete(id);
    return result.affected > 0;
  }
}