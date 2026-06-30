"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationLog = exports.MedicineReminder = void 0;
const mongoose_1 = require("mongoose");
const medicineReminderSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "1 pill", "2 puffs"
    times: [{ type: String, required: true }], // e.g. ["08:00", "20:00"]
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
const medicationLogSchema = new mongoose_1.Schema({
    reminderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'MedicineReminder', required: true },
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledTime: { type: Date, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'TAKEN', 'MISSED'],
        default: 'PENDING',
    },
    takenTime: { type: Date },
}, { timestamps: true });
// Indexing for quick analytics aggregations
medicationLogSchema.index({ patientId: 1, scheduledTime: -1 });
exports.MedicineReminder = (0, mongoose_1.model)('MedicineReminder', medicineReminderSchema);
exports.MedicationLog = (0, mongoose_1.model)('MedicationLog', medicationLogSchema);
