"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardService = exports.DashboardService = void 0;
const appointment_model_1 = require("../models/appointment.model");
const reminder_model_1 = require("../models/reminder.model");
const medical_record_model_1 = require("../models/medical-record.model");
const groq_service_1 = __importDefault(require("./groq.service"));
const logger_1 = __importDefault(require("../config/logger"));
class DashboardService {
    async getDashboardSummary(userId) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        // 1. Fetch upcoming appointments
        const appointments = await appointment_model_1.Appointment.find({
            patientId: userId,
            startTime: { $gte: new Date() },
        })
            .sort({ startTime: 1 })
            .limit(3)
            .populate('doctorId', 'firstName lastName specialty');
        // 2. Fetch medication logs due today
        const medicationLogs = await reminder_model_1.MedicationLog.find({
            patientId: userId,
            scheduledTime: { $gte: todayStart, $lte: todayEnd },
        })
            .sort({ scheduledTime: 1 })
            .populate('reminderId', 'medicineName dosage');
        // 3. Fetch recent medical records
        const records = await medical_record_model_1.MedicalRecord.find({ patientId: userId })
            .sort({ parsedAt: -1 })
            .limit(3);
        // 4. Compile compliance trends for last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const pastLogs = await reminder_model_1.MedicationLog.find({
            patientId: userId,
            scheduledTime: { $gte: fourteenDaysAgo, $lt: new Date() },
        });
        const totalLogs = pastLogs.length;
        const takenLogs = pastLogs.filter((log) => log.status === 'TAKEN').length;
        const complianceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100;
        // Calculate Health Score
        const outOfRangeCount = records.reduce((count, record) => {
            const abnormalList = record.extractedData?.biomarkers?.filter((b) => b.status !== 'NORMAL') || [];
            return count + abnormalList.length;
        }, 0);
        const biomarkerScore = Math.max(0, 100 - outOfRangeCount * 10);
        const healthScore = Math.round(complianceRate * 0.5 + 70 * 0.2 + biomarkerScore * 0.3);
        // 5. Generate AI Suggestions using Groq
        let aiSuggestions = [
            'Maintain your daily water intake above 2.5 Liters.',
            'Remember to record your asthma inhaler usage logs.',
            'Ensure a buffer of 1 hour between taking antacids and iron supplements.',
        ];
        try {
            const summaryContext = `
        Patient Compliance Rate: ${complianceRate}%.
        Out-of-range biomarkers count: ${outOfRangeCount}.
        Upcoming appointments count: ${appointments.length}.
        Daily pending medications count: ${medicationLogs.length}.
      `;
            const prompt = `
        You are a professional clinical assistant. Based on the following patient dashboard metrics summary, generate exactly 3 concise, bulleted health suggestions/tips for the patient dashboard. Be supportive but clinical, and do not make direct diagnoses. Ensure each tip is under 15 words.
        Context:
        ${summaryContext}
        Output the tips as a JSON string array.
      `;
            const systemPrompt = 'You are a professional clinical assistant dashboard generator. Output your responses strictly as a JSON string array matching format: ["tip 1", "tip 2", "tip 3"]';
            const completion = await groq_service_1.default.chatCompletion(systemPrompt, prompt, 'json_object');
            let clean = completion.trim();
            if (clean.startsWith('```')) {
                clean = clean.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(clean);
            if (Array.isArray(parsed)) {
                aiSuggestions = parsed;
            }
            else if (parsed && typeof parsed === 'object') {
                const possibleArray = Object.values(parsed).find((val) => Array.isArray(val));
                if (possibleArray) {
                    aiSuggestions = possibleArray;
                }
            }
        }
        catch (err) {
            logger_1.default.error(`Failed to generate AI insights from Groq: ${err}`);
        }
        return {
            healthScore,
            complianceRate,
            appointments: appointments.map((a) => ({
                id: a._id.toString(),
                doctorName: `Dr. ${a.doctorId.firstName} ${a.doctorId.lastName}`,
                specialty: a.doctorId.specialty,
                startTime: a.startTime,
                status: a.status,
            })),
            medications: medicationLogs.map((m) => ({
                id: m._id.toString(),
                name: m.reminderId?.medicineName || 'Medication',
                dosage: m.reminderId?.dosage || '',
                scheduledTime: m.scheduledTime,
                status: m.status,
            })),
            recentReports: records.map((r) => ({
                id: r._id.toString(),
                name: r.originalFileName,
                parsedAt: r.parsedAt,
                biomarkerCount: r.extractedData?.biomarkers?.length || 0,
            })),
            aiSuggestions,
        };
    }
}
exports.DashboardService = DashboardService;
exports.dashboardService = new DashboardService();
exports.default = exports.dashboardService;
