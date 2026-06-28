import { Schema, model } from 'mongoose';

const prescribedMedicineSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
});

const prescriptionSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
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
  },
  { timestamps: true }
);

export const Prescription = model('Prescription', prescriptionSchema);
export default Prescription;
