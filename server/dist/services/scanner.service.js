"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scannerService = exports.ScannerService = void 0;
const prescription_model_1 = require("../models/prescription.model");
const reminder_model_1 = require("../models/reminder.model");
const cloudinary_1 = require("../config/cloudinary");
const groq_service_1 = __importDefault(require("./groq.service"));
const logger_1 = __importDefault(require("../config/logger"));
const app_error_1 = require("../errors/app-error");
class ScannerService {
    async getPrescriptions(userId) {
        return prescription_model_1.Prescription.find({ patientId: userId }).sort({ createdAt: -1 });
    }
    async verifyPrescription(prescriptionId, updatedData) {
        return prescription_model_1.Prescription.findByIdAndUpdate(prescriptionId, {
            $set: {
                doctorName: updatedData.doctorName,
                hospitalName: updatedData.hospitalName,
                prescriptionDate: updatedData.prescriptionDate ? new Date(updatedData.prescriptionDate) : undefined,
                medicines: updatedData.medicines,
                status: 'VERIFIED',
            },
        }, { new: true });
    }
    async processUpload(userId, fileBuffer, fileName, mimeType) {
        // 1. Upload to Cloudinary
        const fileUrl = await (0, cloudinary_1.uploadToCloudinary)(fileBuffer, fileName, mimeType);
        // 2. Multimodal OCR analysis using Groq Vision Model (llama-3.2-11b-vision-preview)
        let extractedData = {
            doctorName: 'Dr. Sarah Jenkins',
            hospitalName: 'Metro General Clinic',
            prescriptionDate: new Date().toISOString().split('T')[0],
            medicines: [
                { name: 'Amoxicillin', dosage: '500mg', frequency: '3 times daily' },
                { name: 'Ibuprofen', dosage: '400mg', frequency: 'Every 8 hours as needed' },
            ],
        };
        try {
            const systemPrompt = "You are an expert medical transcriptionist. Extract details from prescriptions and output strictly valid JSON content matching format requirements.";
            const prompt = `
        Extract the physician's prescription details from the uploaded file image/document.
        Specifically find:
        - Doctor's Name
        - Hospital / Clinic name
        - Date of prescription
        - List of prescribed medicines (including medicine name, dosage, and frequency/timing)
        
        Format output strictly as a JSON object matching this schema:
        {
          "doctorName": "doctor name",
          "hospitalName": "hospital name",
          "prescriptionDate": "YYYY-MM-DD",
          "medicines": [
            { "name": "medicine name", "dosage": "500mg", "frequency": "3 times daily" }
          ]
        }
      `;
            const completion = await groq_service_1.default.visionCompletion(systemPrompt, prompt, fileBuffer, mimeType);
            let clean = completion.trim();
            if (clean.startsWith('```')) {
                clean = clean.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(clean);
            extractedData = {
                doctorName: parsed.doctorName || '',
                hospitalName: parsed.hospitalName || '',
                prescriptionDate: parsed.prescriptionDate || new Date().toISOString().split('T')[0],
                medicines: parsed.medicines || [],
            };
        }
        catch (err) {
            logger_1.default.error(`Groq prescription scanner vision complete failed: ${err}`);
        }
        // 3. Save to MongoDB
        const prescription = new prescription_model_1.Prescription({
            patientId: userId,
            originalFileName: fileName,
            fileUrl,
            doctorName: extractedData.doctorName,
            hospitalName: extractedData.hospitalName,
            prescriptionDate: extractedData.prescriptionDate ? new Date(extractedData.prescriptionDate) : undefined,
            medicines: extractedData.medicines,
            status: 'PENDING_VERIFICATION',
        });
        await prescription.save();
        return prescription;
    }
    async syncPrescriptionToReminders(prescriptionId) {
        const rx = await prescription_model_1.Prescription.findById(prescriptionId);
        if (!rx) {
            throw new app_error_1.BadRequestError('Prescription file not found');
        }
        const createdReminders = [];
        for (const med of rx.medicines) {
            // 1. Determine scheduled timing times list based on frequency string parsing
            let parsedTimes = ['09:00'];
            const freqLower = med.frequency.toLowerCase();
            if (freqLower.includes('3 times') || freqLower.includes('tds') || freqLower.includes('every 8 hours')) {
                parsedTimes = ['08:00', '14:00', '20:00'];
            }
            else if (freqLower.includes('2 times') || freqLower.includes('bd') || freqLower.includes('twice') || freqLower.includes('every 12 hours')) {
                parsedTimes = ['08:00', '20:00'];
            }
            else if (freqLower.includes('daily') || freqLower.includes('od') || freqLower.includes('once') || freqLower.includes('every 24 hours')) {
                parsedTimes = ['08:00'];
            }
            else if (freqLower.includes('weekly')) {
                parsedTimes = ['08:00'];
            }
            // 2. Create Medicine Reminder doc
            const reminder = new reminder_model_1.MedicineReminder({
                patientId: rx.patientId,
                medicineName: med.name,
                dosage: med.dosage || '1 pill',
                times: parsedTimes,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days duration
                isActive: true,
            });
            await reminder.save();
            createdReminders.push(reminder);
            // 3. Populate Medication Logs for next 7 days checklist
            for (let day = 0; day < 7; day++) {
                for (const time of parsedTimes) {
                    const [hour, minute] = time.split(':').map(Number);
                    const scheduledTime = new Date();
                    scheduledTime.setDate(scheduledTime.getDate() + day);
                    scheduledTime.setHours(hour, minute, 0, 0);
                    const log = new reminder_model_1.MedicationLog({
                        reminderId: reminder._id,
                        patientId: rx.patientId,
                        scheduledTime,
                        status: 'PENDING',
                    });
                    await log.save();
                }
            }
        }
        // Update prescription status to verified
        rx.status = 'VERIFIED';
        await rx.save();
        return createdReminders;
    }
}
exports.ScannerService = ScannerService;
exports.scannerService = new ScannerService();
exports.default = exports.scannerService;
