import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { MedicineReminder, MedicationLog } from '../models/reminder.model';
import { BadRequestError } from '../errors/app-error';

export const reminderRouter = Router();

reminderRouter.use(authenticate);

// 1. Fetch patient reminders list
reminderRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context is missing' });
      return;
    }
    const reminders = await MedicineReminder.find({ patientId: userId, isActive: true });
    res.status(200).json({ status: 'success', data: reminders });
  } catch (error) {
    next(error);
  }
});

// 2. Create a reminder
reminderRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    const { medicineName, dosage, times, startDate, endDate } = req.body;

    if (!userId || !medicineName || !dosage || !times || !startDate || !endDate) {
      throw new BadRequestError('Medicine name, dosage, schedule times, and date bounds are required');
    }

    const reminder = new MedicineReminder({
      patientId: userId,
      medicineName,
      dosage,
      times,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    await reminder.save();

    // Dynamically generate upcoming today logs for the new reminder immediately
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = times.map((timeStr: string) => {
      const [hour, min] = timeStr.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(hour, min, 0, 0);
      return {
        reminderId: reminder._id,
        patientId: userId,
        scheduledTime,
        status: 'PENDING',
      };
    });

    await MedicationLog.insertMany(logs);

    res.status(201).json({ status: 'success', data: reminder });
  } catch (error) {
    next(error);
  }
});

// 3. Delete / deactivate a reminder
reminderRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await MedicineReminder.findByIdAndUpdate(id, { $set: { isActive: false } });
    res.status(200).json({ status: 'success', message: 'Medication reminder deactivated' });
  } catch (error) {
    next(error);
  }
});

// 4. Retrieve medication logs list for today
reminderRouter.get('/logs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context is missing' });
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const logs = await MedicationLog.find({
      patientId: userId,
      scheduledTime: { $gte: todayStart, $lte: todayEnd },
    })
      .sort({ scheduledTime: 1 })
      .populate('reminderId', 'medicineName dosage');

    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    next(error);
  }
});

// 5. Update medication log taken status
reminderRouter.post('/logs/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'TAKEN' | 'MISSED' | 'PENDING'

    if (!['TAKEN', 'MISSED', 'PENDING'].includes(status)) {
      throw new BadRequestError('Invalid status value');
    }

    const updatedLog = await MedicationLog.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          takenTime: status === 'TAKEN' ? new Date() : undefined,
        },
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      message: `Medication status marked as ${status}`,
      data: updatedLog,
    });
  } catch (error) {
    next(error);
  }
});

export default reminderRouter;
