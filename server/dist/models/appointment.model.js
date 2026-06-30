"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = exports.Doctor = void 0;
const mongoose_1 = require("mongoose");
const availabilitySlotSchema = new mongoose_1.Schema({
    dayOfWeek: { type: Number, required: true }, // 0 = Sunday, 1 = Monday, etc.
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
});
const doctorSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    npi: { type: String, required: true, unique: true },
    specialty: { type: String, required: true },
    availabilitySlots: [availabilitySlotSchema],
}, { timestamps: true });
const appointmentSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING',
    },
    notes: { type: String },
}, { timestamps: true });
// Prevent double booking at database level
appointmentSchema.index({ doctorId: 1, startTime: 1 }, { unique: true });
exports.Doctor = (0, mongoose_1.model)('Doctor', doctorSchema);
exports.Appointment = (0, mongoose_1.model)('Appointment', appointmentSchema);
