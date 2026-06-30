"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const appointment_model_1 = require("../models/appointment.model");
const user_model_1 = require("../models/user.model");
const reminder_model_1 = require("../models/reminder.model");
const medical_record_model_1 = require("../models/medical-record.model");
const app_error_1 = require("../errors/app-error");
exports.doctorRouter = (0, express_1.Router)();
exports.doctorRouter.use(auth_middleware_1.authenticate);
exports.doctorRouter.use((0, auth_middleware_1.requireRoles)('DOCTOR'));
// 1. Fetch appointments for logged in doctor
exports.doctorRouter.get('/appointments', async (req, res, next) => {
    try {
        const doctor = await appointment_model_1.Doctor.findOne({ userId: req.currentUser?.userId });
        if (!doctor) {
            throw new app_error_1.BadRequestError('Clinician profile context not found');
        }
        const appointments = await appointment_model_1.Appointment.find({ doctorId: doctor._id })
            .populate('patientId', 'email')
            .sort({ startTime: 1 });
        res.status(200).json({ status: 'success', data: appointments });
    }
    catch (error) {
        next(error);
    }
});
// 2. Fetch patients directory under clinician care with complete compliance & biomarkers telemetry
exports.doctorRouter.get('/patients', async (req, res, next) => {
    try {
        const doctor = await appointment_model_1.Doctor.findOne({ userId: req.currentUser?.userId });
        if (!doctor) {
            throw new app_error_1.BadRequestError('Clinician profile context not found');
        }
        // Get unique patients who have scheduled with this doctor
        const appointments = await appointment_model_1.Appointment.find({ doctorId: doctor._id });
        const patientIds = Array.from(new Set(appointments.map((a) => a.patientId.toString())));
        const patientsData = [];
        for (const pId of patientIds) {
            const patientUser = await user_model_1.User.findById(pId).select('email createdAt');
            if (!patientUser)
                continue;
            // Calculate compliance rate (last 14 days)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const logs = await reminder_model_1.MedicationLog.find({
                patientId: pId,
                scheduledTime: { $gte: fourteenDaysAgo },
            });
            const total = logs.length;
            const taken = logs.filter((l) => l.status === 'TAKEN').length;
            const complianceRate = total > 0 ? Math.round((taken / total) * 100) : 100;
            // Fetch latest medical records and biomarkers
            const records = await medical_record_model_1.MedicalRecord.find({ patientId: pId })
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.doctorRouter;
