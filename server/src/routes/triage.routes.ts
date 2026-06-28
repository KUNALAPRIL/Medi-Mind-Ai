import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import triageService from '../services/triage.service';
import { BadRequestError } from '../errors/app-error';

export const triageRouter = Router();

triageRouter.use(authenticate);

triageRouter.post('/symptom-check', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { symptoms, age, gender, medicalHistory } = req.body;
    if (!symptoms || !age || !gender) {
      throw new BadRequestError('Symptoms description, age, and gender are required fields');
    }

    const lang = (req.headers['x-language'] || req.headers['accept-language'] || 'en') as string;
    const data = await triageService.evaluateSymptoms(symptoms, Number(age), gender, medicalHistory, lang);
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
});

triageRouter.get('/analytics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context is missing' });
      return;
    }

    const lang = (req.headers['x-language'] || req.headers['accept-language'] || 'en') as string;
    const data = await triageService.getPredictiveWellness(userId, lang);
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default triageRouter;
