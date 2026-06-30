"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecord = void 0;
const mongoose_1 = require("mongoose");
const biomarkerSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    referenceRange: { type: String },
    status: { type: String, enum: ['NORMAL', 'HIGH', 'LOW'], default: 'NORMAL' },
});
const medicalRecordSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    extractedData: {
        biomarkers: [biomarkerSchema],
        rawText: { type: String },
    },
    aiAnalysisSummary: { type: String },
    parsedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.MedicalRecord = (0, mongoose_1.model)('MedicalRecord', medicalRecordSchema);
exports.default = exports.MedicalRecord;
