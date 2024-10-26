import { getRepository } from "typeorm";
import { RoomMessage } from "../models/RoomMessage";

export class RoomMessageService {
  static async create(data: Partial<RoomMessage>) {
    const roomMessageRepository = getRepository(RoomMessage);
    const roomMessage = roomMessageRepository.create(data);
    return roomMessageRepository.save(roomMessage);
  }

  static async getAll() {
    const roomMessageRepository = getRepository(RoomMessage);
    return roomMessageRepository.find();
  }

  static async getById(id: string) {
    const roomMessageRepository = getRepository(RoomMessage);
    return roomMessageRepository.findOne(id);
  }

  static async update(id: string, data: Partial<RoomMessage>) {
    const roomMessageRepository = getRepository(RoomMessage);
    await roomMessageRepository.update(id, data);
    return roomMessageRepository.findOne(id);
  }

  static async delete(id: string) {
    const roomMessageRepository = getRepository(RoomMessage);
    const result = await roomMessageRepository.delete(id);
    return result.affected > 0;
  }
}