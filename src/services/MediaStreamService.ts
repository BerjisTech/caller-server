import { getRepository } from "typeorm";
import { MediaStream } from "../models/MediaStream";

export class MediaStreamService {
  static async create(data: Partial<MediaStream>) {
    const mediaStreamRepository = getRepository(MediaStream);
    const mediaStream = mediaStreamRepository.create(data);
    return mediaStreamRepository.save(mediaStream);
  }

  static async getAll() {
    const mediaStreamRepository = getRepository(MediaStream);
    return mediaStreamRepository.find();
  }

  static async getById(id: string) {
    const mediaStreamRepository = getRepository(MediaStream);
    return mediaStreamRepository.findOne(id);
  }

  static async update(id: string, data: Partial<MediaStream>) {
    const mediaStreamRepository = getRepository(MediaStream);
    await mediaStreamRepository.update(id, data);
    return mediaStreamRepository.findOne(id);
  }

  static async delete(id: string) {
    const mediaStreamRepository = getRepository(MediaStream);
    const result = await mediaStreamRepository.delete(id);
    return result.affected > 0;
  }
}