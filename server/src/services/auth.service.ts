import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import { Doctor, Appointment } from '../models/appointment.model';
import { MedicalRecord } from '../models/medical-record.model';
import { MedicineReminder, MedicationLog } from '../models/reminder.model';
import env from '../config/environment';
import emailService from './email.service';
import { ConflictError, BadRequestError, UnauthorizedError } from '../errors/app-error';

export class AuthService {
  private generateTokens(userId: string, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, email, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    return { accessToken, refreshToken };
  }

  public async register(email: string, password: string, role: 'PATIENT' | 'DOCTOR' | 'NURSE') {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('Email address is already in use');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({
      email,
      password,
      role,
      verificationToken,
    });

    await user.save();
    await emailService.sendVerificationEmail(email, verificationToken);

    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  public async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Please verify your email address to log in');
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    // Save refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const tokenDoc = new Token({
      userId: user._id,
      token: tokens.refreshToken,
      type: 'REFRESH',
      expiresAt,
    });
    await tokenDoc.save();

    return {
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  public async verifyEmail(token: string) {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
  }

  public async requestPasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found to avoid account harvesting
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiration
    await user.save();

    await emailService.sendPasswordResetEmail(email, resetToken);
  }

  public async resetPassword(token: string, newPassword: string) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset password token');
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  public async refresh(token: string) {
    const tokenDoc = await Token.findOne({ token, type: 'REFRESH' });
    if (!tokenDoc) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Rotate refresh tokens
      await tokenDoc.deleteOne();

      const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const newRefreshTokenDoc = new Token({
        userId: user._id,
        token: tokens.refreshToken,
        type: 'REFRESH',
        expiresAt,
      });
      await newRefreshTokenDoc.save();

      return {
        user: {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        ...tokens,
      };
    } catch (error) {
      await tokenDoc.deleteOne();
      throw new UnauthorizedError('Refresh token verification failed');
    }
  }

  public async googleLogin(idToken: string, requestedRole: 'PATIENT' | 'DOCTOR' | 'NURSE' = 'PATIENT') {
    // In a real application, we would use the OAuth2 client validation:
    // const ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    // const payload = ticket.getPayload();
    // For local mockup and demonstration, we parse or extract email, defaulting to verified
    let email = '';
    
    try {
      // Mocking validation logic if mock token payload is provided
      if (idToken.startsWith('mock_google_token_')) {
        email = idToken.replace('mock_google_token_', '');
      } else {
        // Decode payload dynamically for preview without complete network credentials setup
        const decoded = jwt.decode(idToken) as { email?: string; email_verified?: boolean } | null;
        if (!decoded || !decoded.email) {
          throw new BadRequestError('Invalid Google ID token signature');
        }
        email = decoded.email;
      }
    } catch (error) {
      throw new BadRequestError('Google verification failed');
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create user automatically
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        email,
        password: generatedPassword,
        role: requestedRole,
        isVerified: true, // Google accounts are pre-verified
      });
      await user.save();
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const tokenDoc = new Token({
      userId: user._id,
      token: tokens.refreshToken,
      type: 'REFRESH',
      expiresAt,
    });
    await tokenDoc.save();

    return {
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  public async logout(token: string) {
    await Token.deleteOne({ token, type: 'REFRESH' });
  }

  public async seedDemo(userId: string) {
    // 1. Check or create Doctor 1 User & Doctor profile
    let docUser1 = await User.findOne({ email: 'robert.chen@medimind.ai' });
    if (!docUser1) {
      docUser1 = new User({
        email: 'robert.chen@medimind.ai',
        password: 'Password123!',
        role: 'DOCTOR',
        isVerified: true,
      });
      await docUser1.save();
    } else {
      docUser1.isVerified = true;
      docUser1.role = 'DOCTOR';
      await docUser1.save();
    }

    let doctor1 = await Doctor.findOne({ lastName: 'Chen' });
    if (!doctor1) {
      doctor1 = new Doctor({
        userId: docUser1._id,
        firstName: 'Robert',
        lastName: 'Chen',
        specialty: 'Cardiologist',
        npi: '1092837465',
        availabilitySlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
        ],
      });
      await doctor1.save();
    } else if (!doctor1.userId) {
      doctor1.userId = docUser1._id;
      await doctor1.save();
    }

    // Check or create Doctor 2 User & Doctor profile
    let docUser2 = await User.findOne({ email: 'sarah.jenkins@medimind.ai' });
    if (!docUser2) {
      docUser2 = new User({
        email: 'sarah.jenkins@medimind.ai',
        password: 'Password123!',
        role: 'DOCTOR',
        isVerified: true,
      });
      await docUser2.save();
    } else {
      docUser2.isVerified = true;
      docUser2.role = 'DOCTOR';
      await docUser2.save();
    }

    let doctor2 = await Doctor.findOne({ lastName: 'Jenkins' });
    if (!doctor2) {
      doctor2 = new Doctor({
        userId: docUser2._id,
        firstName: 'Sarah',
        lastName: 'Jenkins',
        specialty: 'Endocrinologist',
        npi: '1982736450',
        availabilitySlots: [
          { dayOfWeek: 2, startTime: '10:00', endTime: '15:00' },
          { dayOfWeek: 4, startTime: '10:00', endTime: '15:00' },
        ],
      });
      await doctor2.save();
    } else if (!doctor2.userId) {
      doctor2.userId = docUser2._id;
      await doctor2.save();
    }

    // Clear user's existing records/reminders/appointments/logs to avoid duplicates
    await MedicalRecord.deleteMany({ patientId: userId });
    await MedicineReminder.deleteMany({ patientId: userId });
    await MedicationLog.deleteMany({ patientId: userId });
    await Appointment.deleteMany({ patientId: userId });

    // 2. Insert Medical Records
    const record1 = new MedicalRecord({
      patientId: userId,
      originalFileName: 'Complete_Blood_Count_Mar2026.pdf',
      fileUrl: 'http://localhost:5000/uploads/mock_blood_count.pdf',
      extractedData: {
        biomarkers: [
          { name: 'Fasting Blood Sugar', value: 106, unit: 'mg/dL', referenceRange: '70-100', status: 'HIGH' },
          { name: 'Hemoglobin A1c', value: 5.9, unit: '%', referenceRange: '4.0-5.6', status: 'HIGH' },
          { name: 'Total Cholesterol', value: 192, unit: 'mg/dL', referenceRange: '120-200', status: 'NORMAL' },
        ],
        rawText: 'Mock scanned report output text.',
      },
      aiAnalysisSummary: 'Fasting blood sugar is slightly high, suggesting early signs of prediabetes. Recommended lowering dietary refined sugars and increasing physical exercise.',
    });
    await record1.save();

    const record2 = new MedicalRecord({
      patientId: userId,
      originalFileName: 'Lipid_Panel_May2026.jpg',
      fileUrl: 'http://localhost:5000/uploads/mock_lipid_panel.jpg',
      extractedData: {
        biomarkers: [
          { name: 'LDL Cholesterol', value: 122, unit: 'mg/dL', referenceRange: '0-99', status: 'HIGH' },
          { name: 'HDL Cholesterol', value: 45, unit: 'mg/dL', referenceRange: '40-60', status: 'NORMAL' },
          { name: 'Triglycerides', value: 165, unit: 'mg/dL', referenceRange: '0-149', status: 'HIGH' },
        ],
        rawText: 'Mock scanned lipid panel output text.',
      },
      aiAnalysisSummary: 'LDL cholesterol and Triglycerides are slightly elevated. Consider reducing saturated fat intake and engaging in regular cardio training.',
    });
    await record2.save();

    // 3. Insert Reminders
    const rem1 = new MedicineReminder({
      patientId: userId,
      medicineName: 'Atorvastatin',
      dosage: '10mg',
      times: ['21:00'],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await rem1.save();

    const rem2 = new MedicineReminder({
      patientId: userId,
      medicineName: 'Metformin',
      dosage: '500mg',
      times: ['08:00', '20:00'],
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await rem2.save();

    // 4. Generate logs for past 14 days + today
    const logs: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 14; i >= 0; i--) {
      const logDate = new Date(today);
      logDate.setDate(logDate.getDate() - i);

      // Reminder 1: Atorvastatin (21:00)
      const time1 = new Date(logDate);
      time1.setHours(21, 0, 0, 0);

      let status1: 'TAKEN' | 'MISSED' | 'PENDING' = 'TAKEN';
      if (i === 0 && time1 > new Date()) {
        status1 = 'PENDING';
      } else if (Math.random() < 0.15) {
        status1 = 'MISSED';
      }

      logs.push({
        reminderId: rem1._id,
        patientId: userId,
        scheduledTime: time1,
        status: status1,
        takenTime: status1 === 'TAKEN' ? time1 : undefined,
      });

      // Reminder 2: Metformin (08:00 and 20:00)
      const time2a = new Date(logDate);
      time2a.setHours(8, 0, 0, 0);
      let status2a: 'TAKEN' | 'MISSED' | 'PENDING' = 'TAKEN';
      if (i === 0 && time2a > new Date()) {
        status2a = 'PENDING';
      } else if (Math.random() < 0.15) {
        status2a = 'MISSED';
      }

      logs.push({
        reminderId: rem2._id,
        patientId: userId,
        scheduledTime: time2a,
        status: status2a,
        takenTime: status2a === 'TAKEN' ? time2a : undefined,
      });

      const time2b = new Date(logDate);
      time2b.setHours(20, 0, 0, 0);
      let status2b: 'TAKEN' | 'MISSED' | 'PENDING' = 'TAKEN';
      if (i === 0 && time2b > new Date()) {
        status2b = 'PENDING';
      } else if (Math.random() < 0.15) {
        status2b = 'MISSED';
      }

      logs.push({
        reminderId: rem2._id,
        patientId: userId,
        scheduledTime: time2b,
        status: status2b,
        takenTime: status2b === 'TAKEN' ? time2b : undefined,
      });
    }

    await MedicationLog.insertMany(logs);

    // 5. Insert Appointment in next 2 days
    const nextAppTime = new Date();
    nextAppTime.setDate(nextAppTime.getDate() + 2);
    nextAppTime.setHours(10, 0, 0, 0);

    const app = new Appointment({
      patientId: userId,
      doctorId: doctor2._id,
      startTime: nextAppTime,
      endTime: new Date(nextAppTime.getTime() + 30 * 60 * 1000),
      notes: 'Initial check-up for thyroid panel results.',
      status: 'CONFIRMED',
    });
    await app.save();
  }

  public async seedBulkPatients() {
    // 1. Ensure doctors exist and have User accounts linked
    let docUser1 = await User.findOne({ email: 'robert.chen@medimind.ai' });
    if (!docUser1) {
      docUser1 = new User({
        email: 'robert.chen@medimind.ai',
        password: 'Password123!',
        role: 'DOCTOR',
        isVerified: true,
      });
      await docUser1.save();
    }

    let doctor1 = await Doctor.findOne({ lastName: 'Chen' });
    if (!doctor1) {
      doctor1 = new Doctor({
        userId: docUser1._id,
        firstName: 'Robert',
        lastName: 'Chen',
        specialty: 'Cardiologist',
        npi: '1092837465',
        availabilitySlots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
          { dayOfWeek: 3, startTime: '13:00', endTime: '17:00' },
        ],
      });
      await doctor1.save();
    } else if (!doctor1.userId) {
      doctor1.userId = docUser1._id;
      await doctor1.save();
    }

    let docUser2 = await User.findOne({ email: 'sarah.jenkins@medimind.ai' });
    if (!docUser2) {
      docUser2 = new User({
        email: 'sarah.jenkins@medimind.ai',
        password: 'Password123!',
        role: 'DOCTOR',
        isVerified: true,
      });
      await docUser2.save();
    }

    let doctor2 = await Doctor.findOne({ lastName: 'Jenkins' });
    if (!doctor2) {
      doctor2 = new Doctor({
        userId: docUser2._id,
        firstName: 'Sarah',
        lastName: 'Jenkins',
        specialty: 'Endocrinologist',
        npi: '1982736450',
        availabilitySlots: [
          { dayOfWeek: 2, startTime: '10:00', endTime: '15:00' },
          { dayOfWeek: 4, startTime: '10:00', endTime: '15:00' },
        ],
      });
      await doctor2.save();
    } else if (!doctor2.userId) {
      doctor2.userId = docUser2._id;
      await doctor2.save();
    }

    // Now seed 20 patients
    const patientEmails = Array.from({ length: 20 }, (_, i) => `patient${i + 1}@medimind.ai`);
    
    for (let i = 0; i < patientEmails.length; i++) {
      const email = patientEmails[i];
      let pUser = await User.findOne({ email });
      if (!pUser) {
        pUser = new User({
          email,
          password: 'Password123!',
          role: 'PATIENT',
          isVerified: true,
        });
        await pUser.save();
      }

      const pId = pUser._id;

      // Clear existing records/reminders/appointments/logs for this seeded patient
      await MedicalRecord.deleteMany({ patientId: pId });
      await MedicineReminder.deleteMany({ patientId: pId });
      await MedicationLog.deleteMany({ patientId: pId });
      await Appointment.deleteMany({ patientId: pId });

      // Determine compliance tier based on index
      // Tier 1: Patient 1-5 (High compliance, 95%)
      // Tier 2: Patient 6-10 (Med compliance, 80%)
      // Tier 3: Patient 11-15 (Low compliance, 55%)
      // Tier 4: Patient 16-20 (Very low compliance, 25%)
      let missChance = 0.05;
      if (i >= 5 && i < 10) missChance = 0.20;
      else if (i >= 10 && i < 15) missChance = 0.45;
      else if (i >= 15) missChance = 0.75;

      // Create reminders
      const rem1 = new MedicineReminder({
        patientId: pId,
        medicineName: i % 2 === 0 ? 'Metformin' : 'Atorvastatin',
        dosage: i % 2 === 0 ? '500mg' : '10mg',
        times: ['08:00', '20:00'],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await rem1.save();

      const rem2 = new MedicineReminder({
        patientId: pId,
        medicineName: i % 2 === 0 ? 'Lisinopril' : 'Albuterol',
        dosage: i % 2 === 0 ? '20mg' : '2mg',
        times: ['12:00'],
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await rem2.save();

      // Create 14 days logs
      const logs: any[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 14; day >= 0; day--) {
        const logDate = new Date(today);
        logDate.setDate(logDate.getDate() - day);

        // Reminder 1 - 08:00
        const t1 = new Date(logDate);
        t1.setHours(8, 0, 0, 0);
        let s1: 'TAKEN' | 'MISSED' | 'PENDING' = Math.random() >= missChance ? 'TAKEN' : 'MISSED';
        if (day === 0 && t1 > new Date()) s1 = 'PENDING';
        logs.push({ reminderId: rem1._id, patientId: pId, scheduledTime: t1, status: s1, takenTime: s1 === 'TAKEN' ? t1 : undefined });

        // Reminder 1 - 20:00
        const t2 = new Date(logDate);
        t2.setHours(20, 0, 0, 0);
        let s2: 'TAKEN' | 'MISSED' | 'PENDING' = Math.random() >= missChance ? 'TAKEN' : 'MISSED';
        if (day === 0 && t2 > new Date()) s2 = 'PENDING';
        logs.push({ reminderId: rem1._id, patientId: pId, scheduledTime: t2, status: s2, takenTime: s2 === 'TAKEN' ? t2 : undefined });

        // Reminder 2 - 12:00
        const t3 = new Date(logDate);
        t3.setHours(12, 0, 0, 0);
        let s3: 'TAKEN' | 'MISSED' | 'PENDING' = Math.random() >= missChance ? 'TAKEN' : 'MISSED';
        if (day === 0 && t3 > new Date()) s3 = 'PENDING';
        logs.push({ reminderId: rem2._id, patientId: pId, scheduledTime: t3, status: s3, takenTime: s3 === 'TAKEN' ? t3 : undefined });
      }
      await MedicationLog.insertMany(logs);

      // Create Medical Record
      const record = new MedicalRecord({
        patientId: pId,
        originalFileName: `Health_Screening_Report_Patient_${i + 1}.pdf`,
        fileUrl: `http://localhost:5000/uploads/patient_${i + 1}_report.pdf`,
        extractedData: {
          biomarkers: [
            {
              name: 'Fasting Blood Glucose',
              value: missChance > 0.3 ? 128 : 88,
              unit: 'mg/dL',
              referenceRange: '70-100',
              status: missChance > 0.3 ? 'HIGH' : 'NORMAL'
            },
            {
              name: 'Hemoglobin A1c',
              value: missChance > 0.3 ? 6.7 : 5.2,
              unit: '%',
              referenceRange: '4.0-5.6',
              status: missChance > 0.3 ? 'HIGH' : 'NORMAL'
            },
            {
              name: 'Total Cholesterol',
              value: missChance > 0.3 ? 245 : 172,
              unit: 'mg/dL',
              referenceRange: '120-200',
              status: missChance > 0.3 ? 'HIGH' : 'NORMAL'
            }
          ],
          rawText: 'Mock lab screening panel.',
        },
        aiAnalysisSummary: missChance > 0.3 
          ? 'Glucose and Cholesterol levels are high, reflecting poor adherence to treatment. Recommended immediate clinical consultation.'
          : 'Biomarkers are well-controlled within normal ranges, indicating excellent compliance.',
      });
      await record.save();

      // Create appointment
      const nextApp = new Date();
      nextApp.setDate(nextApp.getDate() + (i % 7) + 1);
      nextApp.setHours(9 + (i % 6), 0, 0, 0);

      const appointment = new Appointment({
        patientId: pId,
        doctorId: i % 2 === 0 ? doctor1._id : doctor2._id,
        startTime: nextApp,
        endTime: new Date(nextApp.getTime() + 30 * 60 * 1000),
        notes: `Routine follow-up on biomarkers control.`,
        status: 'CONFIRMED',
      });
      await appointment.save();
    }
  }
}

export const authService = new AuthService();
export default authService;
