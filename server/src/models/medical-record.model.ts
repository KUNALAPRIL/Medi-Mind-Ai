import { Schema, model, Document, Types } from 'mongoose';

export interface IBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange?: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
}

export interface IMedicalRecord extends Document {
  patientId: Types.ObjectId;
  originalFileName: string;
  fileUrl: string;
  extractedData: {
    biomarkers: IBiomarker[];
    rawText?: string;
  };
  aiAnalysisSummary?: string;
  parsedAt: Date;
}

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

export const MedicalRecord = model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
