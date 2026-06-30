"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const appointment_model_1 = require("../models/appointment.model");
const app_error_1 = require("../errors/app-error");
exports.appointmentRouter = (0, express_1.Router)();
exports.appointmentRouter.use(auth_middleware_1.authenticate);
// 1. Fetch available doctors
exports.appointmentRouter.get('/doctors', async (req, res, next) => {
    try {
        const doctors = await appointment_model_1.Doctor.find({});
        res.status(200).json({ status: 'success', data: doctors });
    }
    catch (error) {
        next(error);
    }
});
// 2. Query available doctor time slots for a specific date
exports.appointmentRouter.get('/doctors/:id/available-slots', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date } = req.query; // YYYY-MM-DD format
        if (!date) {
            throw new app_error_1.BadRequestError('Date query parameter is required');
        }
        const doctor = await appointment_model_1.Doctor.findById(id);
        if (!doctor) {
            res.status(404).json({ status: 'error', message: 'Doctor not found' });
            return;
        }
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();
        // Fetch doctor's base shift slots for this weekday
        const shifts = doctor.availabilitySlots.filter((slot) => slot.dayOfWeek === dayOfWeek);
        if (shifts.length === 0) {
            res.status(200).json({ status: 'success', data: [] });
            return;
        }
        // Generate 30-minute slot intervals based on shift ranges
        const slots = [];
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
        const activeBookings = await appointment_model_1.Appointment.find({
            doctorId: id,
            startTime: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'CANCELLED' },
        });
        const bookedTimes = activeBookings.map((b) => b.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
        // Subtract occupied slots
        const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot));
        res.status(200).json({ status: 'success', data: availableSlots });
    }
    catch (error) {
        next(error);
    }
});
// 3. Book appointment
exports.appointmentRouter.post('/', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        const { doctorId, date, time, notes } = req.body; // date = "YYYY-MM-DD", time = "HH:MM"
        if (!userId || !doctorId || !date || !time) {
            throw new app_error_1.BadRequestError('Doctor ID, booking date, and time slot are required');
        }
        // Set start & end dates
        const [hour, min] = time.split(':').map(Number);
        const startTime = new Date(date);
        startTime.setHours(hour, min, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        // Check collision check
        const existing = await appointment_model_1.Appointment.findOne({
            doctorId,
            startTime,
            status: { $ne: 'CANCELLED' },
        });
        if (existing) {
            throw new app_error_1.ConflictError('This doctor slot has already been booked by another patient');
        }
        const appointment = new appointment_model_1.Appointment({
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
    }
    catch (error) {
        next(error);
    }
});
// 4. Retrieve list of user appointments
exports.appointmentRouter.get('/', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        const appointments = await appointment_model_1.Appointment.find({ patientId: userId })
            .sort({ startTime: 1 })
            .populate('doctorId', 'firstName lastName specialty');
        res.status(200).json({ status: 'success', data: appointments });
    }
    catch (error) {
        next(error);
    }
});
// 5. Cancel Appointment
exports.appointmentRouter.post('/:id/cancel', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await appointment_model_1.Appointment.findByIdAndUpdate(id, { $set: { status: 'CANCELLED' } }, { new: true });
        res.status(200).json({
            status: 'success',
            message: 'Appointment cancelled successfully',
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.appointmentRouter;
