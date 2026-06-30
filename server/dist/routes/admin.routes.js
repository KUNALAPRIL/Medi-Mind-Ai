"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const user_model_1 = require("../models/user.model");
const appointment_model_1 = require("../models/appointment.model");
const medical_record_model_1 = require("../models/medical-record.model");
const token_model_1 = require("../models/token.model");
const app_error_1 = require("../errors/app-error");
const auth_service_1 = __importDefault(require("../services/auth.service"));
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_middleware_1.authenticate);
exports.adminRouter.use((0, auth_middleware_1.requireRoles)('ADMIN'));
// 1. Manage Users: Retrieve all users
exports.adminRouter.get('/users', async (req, res, next) => {
    try {
        const users = await user_model_1.User.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', data: users });
    }
    catch (error) {
        next(error);
    }
});
// 2. Role Management: Adjust user role
exports.adminRouter.put('/users/:id/role', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role || !['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'COMPLIANCE'].includes(role)) {
            throw new app_error_1.BadRequestError('Invalid role value');
        }
        const updatedUser = await user_model_1.User.findByIdAndUpdate(id, { $set: { role } }, { new: true }).select('-password');
        res.status(200).json({
            status: 'success',
            message: `User role elevated to ${role}`,
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
});
// 3. User Activation: Enable or disable account status
exports.adminRouter.put('/users/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body; // toggle access approval
        const updatedUser = await user_model_1.User.findByIdAndUpdate(id, { $set: { isVerified } }, { new: true }).select('-password');
        res.status(200).json({
            status: 'success',
            message: `User activation status set to ${isVerified}`,
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
});
// 4. Manage Doctors: Fetch registered doctors listing
exports.adminRouter.get('/doctors', async (req, res, next) => {
    try {
        const doctors = await appointment_model_1.Doctor.find({}).populate('userId', 'email isVerified');
        res.status(200).json({ status: 'success', data: doctors });
    }
    catch (error) {
        next(error);
    }
});
// 5. Verify Doctor Credentials
exports.adminRouter.post('/doctors/:id/verify', async (req, res, next) => {
    try {
        const { id } = req.params; // doctor document ID
        const doctor = await appointment_model_1.Doctor.findById(id);
        if (!doctor) {
            res.status(404).json({ status: 'error', message: 'Doctor profile not found' });
            return;
        }
        // Mark doctor's user credentials as verified
        await user_model_1.User.findByIdAndUpdate(doctor.userId, { $set: { isVerified: true } });
        res.status(200).json({
            status: 'success',
            message: 'Doctor credentials verified and account activated successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
// 6. System Analytics
exports.adminRouter.get('/analytics/system', async (req, res, next) => {
    try {
        const totalUsers = await user_model_1.User.countDocuments({});
        const totalDoctors = await appointment_model_1.Doctor.countDocuments({});
        const totalReports = await medical_record_model_1.MedicalRecord.countDocuments({});
        const activeRefreshTokens = await token_model_1.Token.countDocuments({ type: 'REFRESH' });
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
    }
    catch (error) {
        next(error);
    }
});
// 7. Seed Bulk Patients
exports.adminRouter.post('/seed-bulk', async (req, res, next) => {
    try {
        await auth_service_1.default.seedBulkPatients();
        res.status(200).json({ status: 'success', message: 'Seeded 20 patients demo data successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.adminRouter;
