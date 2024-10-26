import { Request, Response } from "express";
import { ProfileService } from "../services/ProfileService";

export class ProfileController {
  static async create(req: Request, res: Response) {
    try {
      const profile = await ProfileService.create(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const profiles = await ProfileService.getAll();
      res.status(200).json(profiles);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const profile = await ProfileService.getById(req.params.id);
      if (profile) {
        res.status(200).json(profile);
      } else {
        res.status(404).json({ error: "Profile not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const profile = await ProfileService.update(req.params.id, req.body);
      if (profile) {
        res.status(200).json(profile);
      } else {
        res.status(404).json({ error: "Profile not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await ProfileService.delete(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Profile not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}