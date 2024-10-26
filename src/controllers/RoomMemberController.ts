import { Request, Response } from "express";
import { RoomMemberService } from "../services/RoomMemberService";

export class RoomMemberController {
  static async create(req: Request, res: Response) {
    try {
      const roomMember = await RoomMemberService.create(req.body);
      res.status(201).json(roomMember);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const roomMembers = await RoomMemberService.getAll();
      res.status(200).json(roomMembers);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const roomMember = await RoomMemberService.getById(req.params.id);
      if (roomMember) {
        res.status(200).json(roomMember);
      } else {
        res.status(404).json({ error: "RoomMember not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const roomMember = await RoomMemberService.update(req.params.id, req.body);
      if (roomMember) {
        res.status(200).json(roomMember);
      } else {
        res.status(404).json({ error: "RoomMember not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await RoomMemberService.delete(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "RoomMember not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}