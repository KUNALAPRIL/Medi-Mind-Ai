import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import dashboardService from '../services/dashboard.service';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/summary',
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.currentUser?.userId;
      if (!userId) {
        res.status(400).json({ status: 'error', message: 'User context is missing' });
        return;
      }
      const data = await dashboardService.getDashboardSummary(userId);
      res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default dashboardRouter;
