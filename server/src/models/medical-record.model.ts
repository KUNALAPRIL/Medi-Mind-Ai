import { Schema, model } from 'mongoose';

const biomarkerSchema = new Schema({
  name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  referenceRange: { type: String },
  status: { type: String, enum: ['NORMAL', 'HIGH', 'LOW'], default: 'NORMAL' },
});

const medicalRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalFileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    extractedData: {
      biomarkers: [biomarkerSchema],
      rawText: { type: String },
    },
    aiAnalysisSummary: { type: String },
    parsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MedicalRecord = model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
