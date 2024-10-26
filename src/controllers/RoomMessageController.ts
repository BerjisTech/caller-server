import { Request, Response } from "express";
import { RoomMessageService } from "../services/RoomMessageService";

export class RoomMessageController {
  static async create(req: Request, res: Response) {
    try {
      const roomMessage = await RoomMessageService.create(req.body);
      res.status(201).json(roomMessage);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const roomMessages = await RoomMessageService.getAll();
      res.status(200).json(roomMessages);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const roomMessage = await RoomMessageService.getById(req.params.id);
      if (roomMessage) {
        res.status(200).json(roomMessage);
      } else {
        res.status(404).json({ error: "RoomMessage not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const roomMessage = await RoomMessageService.update(req.params.id, req.body);
      if (roomMessage) {
        res.status(200).json(roomMessage);
      } else {
        res.status(404).json({ error: "RoomMessage not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await RoomMessageService.delete(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "RoomMessage not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}