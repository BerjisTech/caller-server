import { getRepository } from "typeorm";
import { Profile } from "../models/Profile";

export class ProfileService {
  static async create(data: Partial<Profile>) {
    const profileRepository = getRepository(Profile);
    const profile = profileRepository.create(data);
    return profileRepository.save(profile);
  }

  static async getAll() {
    const profileRepository = getRepository(Profile);
    return profileRepository.find();
  }

  static async getById(id: string) {
    const profileRepository = getRepository(Profile);
    return profileRepository.findOne(id);
  }

  static async update(id: string, data: Partial<Profile>) {
    const profileRepository = getRepository(Profile);
    await profileRepository.update(id, data);
    return profileRepository.findOne(id);
  }

  static async delete(id: string) {
    const profileRepository = getRepository(Profile);
    const result = await profileRepository.delete(id);
    return result.affected > 0;
  }
}