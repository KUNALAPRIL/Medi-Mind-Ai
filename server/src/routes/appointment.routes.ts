import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { Doctor, Appointment } from '../models/appointment.model';
import { BadRequestError, ConflictError } from '../errors/app-error';

export const appointmentRouter = Router();

appointmentRouter.use(authenticate);

// 1. Fetch available doctors
appointmentRouter.get('/doctors', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).json({ status: 'success', data: doctors });
  } catch (error) {
    next(error);
  }
});

// 2. Query available doctor time slots for a specific date
appointmentRouter.get('/doctors/:id/available-slots', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD format

    if (!date) {
      throw new BadRequestError('Date query parameter is required');
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      res.status(404).json({ status: 'error', message: 'Doctor not found' });
      return;
    }

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.getDay();

    // Fetch doctor's base shift slots for this weekday
    const shifts = doctor.availabilitySlots.filter((slot) => slot.dayOfWeek === dayOfWeek);
    if (shifts.length === 0) {
      res.status(200).json({ status: 'success', data: [] });
      return;
    }

    // Generate 30-minute slot intervals based on shift ranges
    const slots: string[] = [];
    for (const shift of shifts) {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const [endHour, endMin] = shift.endTime.split(':').map(Number);

      const start = new Date(targetDate);
      start.setHours(startHour, startMin, 0, 0);

      const end = new Date(targetDate);
      end.setHours(endHour, endMin, 0, 0);

      const current = new Date(start);
      while (current < end) {
        const timeString = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + 30);
      }
    }

    // Query active bookings for that doctor and date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const activeBookings = await Appointment.find({
      doctorId: id,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'CANCELLED' },
    });

    const bookedTimes = activeBookings.map((b) =>
      b.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    );

    // Subtract occupied slots
    const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));

    res.status(200).json({ status: 'success', data: availableSlots });
  } catch (error) {
    next(error);
  }
});

// 3. Book appointment
appointmentRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    const { doctorId, date, time, notes } = req.body; // date = "YYYY-MM-DD", time = "HH:MM"

    if (!userId || !doctorId || !date || !time) {
      throw new BadRequestError('Doctor ID, booking date, and time slot are required');
    }

    // Set start & end dates
    const [hour, min] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hour, min, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    // Check collision check
    const existing = await Appointment.findOne({
      doctorId,
      startTime,
      status: { $ne: 'CANCELLED' },
    });

    if (existing) {
      throw new ConflictError('This doctor slot has already been booked by another patient');
    }

    const appointment = new Appointment({
      patientId: userId,
      doctorId,
      startTime,
      endTime,
      notes,
      status: 'CONFIRMED',
    });

    await appointment.save();

    res.status(201).json({
      status: 'success',
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

// 4. Retrieve list of user appointments
appointmentRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;
    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User context is missing' });
      return;
    }

    const appointments = await Appointment.find({ patientId: userId })
      .sort({ startTime: 1 })
      .populate('doctorId', 'firstName lastName specialty');

    res.status(200).json({ status: 'success', data: appointments });
  } catch (error) {
    next(error);
  }
});

// 5. Cancel Appointment
appointmentRouter.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Appointment.findByIdAndUpdate(
      id,
      { $set: { status: 'CANCELLED' } },
      { new: true }
    );
    res.status(200).json({
      status: 'success',
      message: 'Appointment cancelled successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default appointmentRouter;
