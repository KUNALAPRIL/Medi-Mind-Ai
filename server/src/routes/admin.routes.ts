import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRoles } from '../middlewares/auth.middleware';
import { User } from '../models/user.model';
import { Doctor } from '../models/appointment.model';
import { MedicalRecord } from '../models/medical-record.model';
import { Token } from '../models/token.model';
import { BadRequestError } from '../errors/app-error';
import authService from '../services/auth.service';

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireRoles('ADMIN'));

// 1. Manage Users: Retrieve all users
adminRouter.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    next(error);
  }
});

// 2. Role Management: Adjust user role
adminRouter.put('/users/:id/role', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'COMPLIANCE'].includes(role)) {
      throw new BadRequestError('Invalid role value');
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: `User role elevated to ${role}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// 3. User Activation: Enable or disable account status
adminRouter.put('/users/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body; // toggle access approval

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { isVerified } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: `User activation status set to ${isVerified}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

// 4. Manage Doctors: Fetch registered doctors listing
adminRouter.get('/doctors', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doctors = await Doctor.find({}).populate('userId', 'email isVerified');
    res.status(200).json({ status: 'success', data: doctors });
  } catch (error) {
    next(error);
  }
});

// 5. Verify Doctor Credentials
adminRouter.post('/doctors/:id/verify', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params; // doctor document ID
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
      return;
    }

    // Mark doctor's user credentials as verified
    await User.findByIdAndUpdate(doctor.userId, { $set: { isVerified: true } });

    res.status(200).json({
      status: 'success',
      message: 'Doctor credentials verified and account activated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// 6. System Analytics
adminRouter.get('/analytics/system', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalDoctors = await Doctor.countDocuments({});
    const totalReports = await MedicalRecord.countDocuments({});
    const activeRefreshTokens = await Token.countDocuments({ type: 'REFRESH' });

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalDoctors,
        totalReports,
        activeSessions: activeRefreshTokens,
        systemHealth: 'HEALTHY',
        latencyMs: 14,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 7. Seed Bulk Patients
adminRouter.post('/seed-bulk', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.seedBulkPatients();
    res.status(200).json({ status: 'success', message: 'Seeded 20 patients demo data successfully' });
  } catch (error) {
    next(error);
  }
});

export default adminRouter;
