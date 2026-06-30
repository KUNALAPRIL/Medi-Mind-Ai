import { Schema, model, Document, Types } from 'mongoose';

export interface IAvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface IDoctor extends Document {
  userId: Types.ObjectId;
  firstName: string;
  lastName: string;
  npi: string;
  specialty: string;
  availabilitySlots: IAvailabilitySlot[];
}

export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
}

const availabilitySlotSchema = new Schema({
  dayOfWeek: { type: Number, required: true }, // 0 = Sunday, 1 = Monday, etc.
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
});

const doctorSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    npi: { type: String, required: true, unique: true },
    specialty: { type: String, required: true },
    availabilitySlots: [availabilitySlotSchema],
  },
  { timestamps: true }
);

const appointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Prevent double booking at database level
appointmentSchema.index({ doctorId: 1, startTime: 1 }, { unique: true });

export const Doctor = model<IDoctor>('Doctor', doctorSchema);
export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
