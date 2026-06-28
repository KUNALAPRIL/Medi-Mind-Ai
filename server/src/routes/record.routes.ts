import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';
import recordService from '../services/record.service';
import { BadRequestError } from '../errors/app-error';

export const recordRouter = Router();

recordRouter.use(authenticate);

recordRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    const { search } = req.query;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context is missing' });
      return;
    }
    const records = await recordService.getRecords(userId, search as string);
    res.status(200).json({ status: 'success', data: records });
  } catch (error) {
    next(error);
  }
});

recordRouter.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.currentUser?.userId;
      const file = req.file;

      if (!userId) {
        res.status(400).json({ status: 'error', message: 'User context is missing' });
        return;
      }

      if (!file) {
        throw new BadRequestError('Upload payload is missing a valid file');
      }

      const record = await recordService.processUpload(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.status(201).json({
        status: 'success',
        message: 'Medical report uploaded and parsed successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }
);

recordRouter.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await recordService.getRecordById(id);
    if (!record) {
      res.status(404).json({ status: 'error', message: 'Medical record not found' });
      return;
    }
    res.status(200).json({ status: 'success', data: record });
  } catch (error) {
    next(error);
  }
});

recordRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await recordService.deleteRecord(id);
    res.status(200).json({ status: 'success', message: 'Medical record deleted' });
  } catch (error) {
    next(error);
  }
});

export default recordRouter;
