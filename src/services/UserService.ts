import { getRepository } from "typeorm";
import { User } from "../models/User";

export class UserService {
  static async create(data: Partial<User>) {
    const userRepository = getRepository(User);
    const user = userRepository.create(data);
    return userRepository.save(user);
  }

  static async getAll() {
    const userRepository = getRepository(User);
    return userRepository.find();
  }

  static async getById(id: string) {
    const userRepository = getRepository(User);
    return userRepository.findOne(id);
  }

  static async update(id: string, data: Partial<User>) {
    const userRepository = getRepository(User);
    await userRepository.update(id, data);
    return userRepository.findOne(id);
  }

  static async delete(id: string) {
    const userRepository = getRepository(User);
    const result = await userRepository.delete(id);
    return result.affected > 0;
  }
}