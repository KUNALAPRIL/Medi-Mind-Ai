import { Schema, model, Document, Types } from 'mongoose';

export interface IMedicineReminder extends Document {
  patientId: Types.ObjectId;
  medicineName: string;
  dosage: string;
  times: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface IMedicationLog extends Document {
  reminderId: Types.ObjectId;
  patientId: Types.ObjectId;
  scheduledTime: Date;
  status: 'PENDING' | 'TAKEN' | 'MISSED';
  takenTime?: Date;
}

const medicineReminderSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "1 pill", "2 puffs"
    times: [{ type: String, required: true }], // e.g. ["08:00", "20:00"]
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const medicationLogSchema = new Schema(
  {
    reminderId: { type: Schema.Types.ObjectId, ref: 'MedicineReminder', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'TAKEN', 'MISSED'],
      default: 'PENDING',
    },
    takenTime: { type: Date },
  },
  { timestamps: true }
);

// Indexing for quick analytics aggregations
medicationLogSchema.index({ patientId: 1, scheduledTime: -1 });

export const MedicineReminder = model<IMedicineReminder>('MedicineReminder', medicineReminderSchema);
export const MedicationLog = model<IMedicationLog>('MedicationLog', medicationLogSchema);
