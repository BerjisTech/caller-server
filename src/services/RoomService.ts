import { getRepository } from "typeorm";
import { Room } from "../models/Room";

export class RoomService {
  static async create(data: Partial<Room>) {
    const roomRepository = getRepository(Room);
    const room = roomRepository.create(data);
    return roomRepository.save(room);
  }

  static async getAll() {
    const roomRepository = getRepository(Room);
    return roomRepository.find();
  }

  static async getById(id: string) {
    const roomRepository = getRepository(Room);
    return roomRepository.findOne(id);
  }

  static async update(id: string, data: Partial<Room>) {
    const roomRepository = getRepository(Room);
    await roomRepository.update(id, data);
    return roomRepository.findOne(id);
  }

  static async delete(id: string) {
    const roomRepository = getRepository(Room);
    const result = await roomRepository.delete(id);
    return result.affected > 0;
  }
}