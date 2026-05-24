import { Request, Response, NextFunction } from 'express';
import { rankingService } from '../services/ranking.service';

export const rankingController = {
  async getByBowType(req: Request, res: Response, next: NextFunction) {
    try {
      const bowType = (req.query.bowType as string || 'RECURVE').toUpperCase();
      const data = await rankingService.getByBowType(bowType);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
