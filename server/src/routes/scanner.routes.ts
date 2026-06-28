import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';
import scannerService from '../services/scanner.service';
import { BadRequestError } from '../errors/app-error';

export const scannerRouter = Router();

scannerRouter.use(authenticate);

scannerRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context is missing' });
      return;
    }
    const prescriptions = await scannerService.getPrescriptions(userId);
    res.status(200).json({ status: 'success', data: prescriptions });
  } catch (error) {
    next(error);
  }
});

scannerRouter.post(
  '/scan',
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

      const prescription = await scannerService.processUpload(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.status(201).json({
        status: 'success',
        message: 'Prescription scanned and parsed successfully',
        data: prescription,
      });
    } catch (error) {
      next(error);
    }
  }
);

scannerRouter.put('/:id/verify', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const verifiedPrescription = await scannerService.verifyPrescription(id, updatedData);
    res.status(200).json({
      status: 'success',
      message: 'Prescription data verified and logged',
      data: verifiedPrescription,
    });
  } catch (error) {
    next(error);
  }
});

scannerRouter.post('/:id/sync', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const reminders = await scannerService.syncPrescriptionToReminders(id);
    res.status(200).json({
      status: 'success',
      message: 'Prescription synced to active daily reminders checklist successfully',
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
});

export default scannerRouter;
