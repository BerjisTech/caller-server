import { Request, Response } from "express";
import { RoomService } from "../services/RoomService";

export class RoomController {
  static async create(req: Request, res: Response) {
    try {
      const room = await RoomService.create(req.body);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const rooms = await RoomService.getAll();
      res.status(200).json(rooms);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const room = await RoomService.getById(req.params.id);
      if (room) {
        res.status(200).json(room);
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const room = await RoomService.update(req.params.id, req.body);
      if (room) {
        res.status(200).json(room);
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await RoomService.delete(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}