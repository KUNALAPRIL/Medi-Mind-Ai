"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const reminder_model_1 = require("../models/reminder.model");
const app_error_1 = require("../errors/app-error");
exports.reminderRouter = (0, express_1.Router)();
exports.reminderRouter.use(auth_middleware_1.authenticate);
// 1. Fetch patient reminders list
exports.reminderRouter.get('/', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        const reminders = await reminder_model_1.MedicineReminder.find({ patientId: userId, isActive: true });
        res.status(200).json({ status: 'success', data: reminders });
    }
    catch (error) {
        next(error);
    }
});
// 2. Create a reminder
exports.reminderRouter.post('/', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        const { medicineName, dosage, times, startDate, endDate } = req.body;
        if (!userId || !medicineName || !dosage || !times || !startDate || !endDate) {
            throw new app_error_1.BadRequestError('Medicine name, dosage, schedule times, and date bounds are required');
        }
        const reminder = new reminder_model_1.MedicineReminder({
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
        const logs = times.map((timeStr) => {
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
        await reminder_model_1.MedicationLog.insertMany(logs);
        res.status(201).json({ status: 'success', data: reminder });
    }
    catch (error) {
        next(error);
    }
});
// 3. Delete / deactivate a reminder
exports.reminderRouter.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await reminder_model_1.MedicineReminder.findByIdAndUpdate(id, { $set: { isActive: false } });
        res.status(200).json({ status: 'success', message: 'Medication reminder deactivated' });
    }
    catch (error) {
        next(error);
    }
});
// 4. Retrieve medication logs list for today
exports.reminderRouter.get('/logs', async (req, res, next) => {
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
        const logs = await reminder_model_1.MedicationLog.find({
            patientId: userId,
            scheduledTime: { $gte: todayStart, $lte: todayEnd },
        })
            .sort({ scheduledTime: 1 })
            .populate('reminderId', 'medicineName dosage');
        res.status(200).json({ status: 'success', data: logs });
    }
    catch (error) {
        next(error);
    }
});
// 5. Update medication log taken status
exports.reminderRouter.post('/logs/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'TAKEN' | 'MISSED' | 'PENDING'
        if (!['TAKEN', 'MISSED', 'PENDING'].includes(status)) {
            throw new app_error_1.BadRequestError('Invalid status value');
        }
        const updatedLog = await reminder_model_1.MedicationLog.findByIdAndUpdate(id, {
            $set: {
                status,
                takenTime: status === 'TAKEN' ? new Date() : undefined,
            },
        }, { new: true });
        res.status(200).json({
            status: 'success',
            message: `Medication status marked as ${status}`,
            data: updatedLog,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.reminderRouter;
