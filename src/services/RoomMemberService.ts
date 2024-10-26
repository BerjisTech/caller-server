import { getRepository } from "typeorm";
import { RoomMember } from "../models/RoomMember";

export class RoomMemberService {
  static async create(data: Partial<RoomMember>) {
    const roomMemberRepository = getRepository(RoomMember);
    const roomMember = roomMemberRepository.create(data);
    return roomMemberRepository.save(roomMember);
  }

  static async getAll() {
    const roomMemberRepository = getRepository(RoomMember);
    return roomMemberRepository.find();
  }

  static async getById(id: string) {
    const roomMemberRepository = getRepository(RoomMember);
    return roomMemberRepository.findOne(id);
  }

  static async update(id: string, data: Partial<RoomMember>) {
    const roomMemberRepository = getRepository(RoomMember);
    await roomMemberRepository.update(id, data);
    return roomMemberRepository.findOne(id);
  }

  static async delete(id: string) {
    const roomMemberRepository = getRepository(RoomMember);
    const result = await roomMemberRepository.delete(id);
    return result.affected > 0;
  }
}