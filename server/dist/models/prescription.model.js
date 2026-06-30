"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prescription = void 0;
const mongoose_1 = require("mongoose");
const prescribedMedicineSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
});
const prescriptionSchema = new mongoose_1.Schema({
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    doctorName: { type: String },
    hospitalName: { type: String },
    prescriptionDate: { type: Date },
    medicines: [prescribedMedicineSchema],
    status: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'VERIFIED'],
        default: 'PENDING_VERIFICATION',
    },
}, { timestamps: true });
exports.Prescription = (0, mongoose_1.model)('Prescription', prescriptionSchema);
exports.default = exports.Prescription;
