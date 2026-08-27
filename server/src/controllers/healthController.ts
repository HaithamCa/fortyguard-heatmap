import type { Request, Response } from "express";
import { healthService } from "../services/healthService.js";

export const healthController = {
  getHealth: (_req: Request, res: Response): void => {
    res.json(healthService.getHealthStatus());
  },
};

export default healthController;
