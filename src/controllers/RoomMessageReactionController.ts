import { Request, Response } from "express";
import { RoomMessageReactionService } from "../services/RoomMessageReactionService";

export class RoomMessageReactionController {
  static async create(req: Request, res: Response) {
    try {
      const roomMessageReaction = await RoomMessageReactionService.create(req.body);
      res.status(201).json(roomMessageReaction);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const roomMessageReactions = await RoomMessageReactionService.getAll();
      res.status(200).json(roomMessageReactions);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const roomMessageReaction = await RoomMessageReactionService.getById(req.params.id);
      if (roomMessageReaction) {
        res.status(200).json(roomMessageReaction);
      } else {
        res.status(404).json({ error: "RoomMessageReaction not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const roomMessageReaction = await RoomMessageReactionService.update(req.params.id, req.body);
      if (roomMessageReaction) {
        res.status(200).json(roomMessageReaction);
      } else {
        res.status(404).json({ error: "RoomMessageReaction not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await RoomMessageReactionService.delete(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "RoomMessageReaction not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}