import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { Doctor, Appointment } from '../models/appointment.model';
import { User } from '../models/user.model';
import { MedicineReminder, MedicationLog } from '../models/reminder.model';
import { MedicalRecord } from '../models/medical-record.model';
import { BadRequestError } from '../errors/app-error';

export const doctorRouter = Router();

doctorRouter.use(authenticate);
doctorRouter.use(requireRoles('DOCTOR'));

// 1. Fetch appointments for logged in doctor
doctorRouter.get('/appointments', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await Doctor.findOne({ userId: req.currentUser?.userId });
    if (!doctor) {
      throw new BadRequestError('Clinician profile context not found');
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'email')
      .sort({ startTime: 1 });

    res.status(200).json({ status: 'success', data: appointments });
  } catch (error) {
    next(error);
  }
});

// 2. Fetch patients directory under clinician care with complete compliance & biomarkers telemetry
doctorRouter.get('/patients', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctor = await Doctor.findOne({ userId: req.currentUser?.userId });
    if (!doctor) {
      throw new BadRequestError('Clinician profile context not found');
    }

    // Get unique patients who have scheduled with this doctor
    const appointments = await Appointment.find({ doctorId: doctor._id });
    const patientIds = Array.from(new Set(appointments.map((a) => a.patientId.toString())));

    const patientsData = [];

    for (const pId of patientIds) {
      const patientUser = await User.findById(pId).select('email createdAt');
      if (!patientUser) continue;

      // Calculate compliance rate (last 14 days)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const logs = await MedicationLog.find({
        patientId: pId,
        scheduledTime: { $gte: fourteenDaysAgo },
      });
      const total = logs.length;
      const taken = logs.filter((l) => l.status === 'TAKEN').length;
      const complianceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

      // Fetch latest medical records and biomarkers
      const records = await MedicalRecord.find({ patientId: pId })
        .sort({ parsedAt: -1 })
        .limit(1);
      const latestBiomarkers = records[0]?.extractedData?.biomarkers || [];

      patientsData.push({
        patientId: pId,
        email: patientUser.email,
        joinedAt: patientUser.createdAt,
        complianceRate,
        biomarkers: latestBiomarkers,
        latestRecordSummary: records[0]?.aiAnalysisSummary || 'No diagnostic records uploaded.'
      });
    }

    res.status(200).json({ status: 'success', data: patientsData });
  } catch (error) {
    next(error);
  }
});

export default doctorRouter;
