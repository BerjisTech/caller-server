import { Request, Response } from "express";
import { MediaStreamService } from "../services/MediaStreamService";

export class MediaStreamController {
  static async create(req: Request, res: Response) {
    try {
      const mediaStream = await MediaStreamService.create(req.body);
      res.status(201).json(mediaStream);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAll(req: Request, res: Response) {
    try {
      const mediaStreams = await MediaStreamService.getAll();
      res.status(200).json(mediaStreams);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const mediaStream = await MediaStreamService.getById(req.params.id);
      if (mediaStream) {
        res.status(200).json(mediaStream);
      } else {
        res.status(404).json({ error: "MediaStream not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const mediaStream = await MediaStreamService.update(req.params.id, req.body);
      if (mediaStream) {
        res.status(200).json(mediaStream);
      } else {
        res.status(404).json({ error: "MediaStream not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const success = await MediaStreamService.delete(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: "MediaStream not found" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}