"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triageService = exports.TriageService = void 0;
const groq_service_1 = __importDefault(require("./groq.service"));
const logger_1 = __importDefault(require("../config/logger"));
const medical_record_model_1 = require("../models/medical-record.model");
const reminder_model_1 = require("../models/reminder.model");
class TriageService {
    async evaluateSymptoms(symptoms, age, gender, medicalHistory, lang = 'en') {
        let mockResult = {
            conditions: [
                { name: 'Acute Bronchitis', likelihood: 'Possible', explanation: 'Inflammation of the bronchial tubes, commonly triggered by viral infections.' },
                { name: 'Mild Asthma Exacerbation', likelihood: 'Possible', explanation: 'Airway hyperresponsiveness causing wheezing, exacerbated by history of asthma.' }
            ],
            urgency: 'MEDIUM',
            specialist: 'Pulmonologist / General Physician',
            tests: ['Spirometry (Lung Function Test)', 'Chest X-Ray'],
            lifestyleAdvice: [
                'Use a humidifier to keep airway passages moist.',
                'Avoid known triggers such as dust, pollen, or smoke.',
                'Maintain high hydration levels.'
            ],
            disclaimer: 'This is an informational triage check and not a formal clinical diagnosis. Seek professional medical evaluation.'
        };
        try {
            const prompt = `
        You are a medical triage assistant. Analyze these symptoms:
        Symptoms: "${symptoms}"
        Age: ${age}
        Gender: "${gender}"
        Medical History: "${medicalHistory || 'None reported'}"
        
        Evaluate the potential conditions. Never present output as a confirmed diagnosis. Always include a disclaimer stating this is not clinical advice.
        Recommend the urgency level ('LOW', 'MEDIUM', 'HIGH', or 'EMERGENCY'), recommended specialist type, suggested tests, and lifestyle advice.
        
        Format the output strictly as a JSON object matching this schema:
        {
          "conditions": [
            { "name": "condition name", "likelihood": "Possible | Unlikely", "explanation": "why this condition is considered" }
          ],
          "urgency": "LOW | MEDIUM | HIGH | EMERGENCY",
          "specialist": "recommended specialist title",
          "tests": ["test 1", "test 2"],
          "lifestyleAdvice": ["tip 1", "tip 2"],
          "disclaimer": "mandatory medical warning"
        }
      `;
            let systemPrompt = 'You are a professional clinical triage expert. Evaluate symptoms and output strictly valid JSON content matching the requested JSON schema.';
            if (lang === 'hi') {
                systemPrompt += ' IMPORTANT: All textual values inside the JSON properties (name, explanation, specialist, tests, lifestyleAdvice, disclaimer) MUST be output strictly in Hindi language (हिंदी भाषा).';
            }
            const completion = await groq_service_1.default.chatCompletion(systemPrompt, prompt, 'json_object');
            let clean = completion.trim();
            if (clean.startsWith('```')) {
                clean = clean.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            }
            return JSON.parse(clean);
        }
        catch (error) {
            logger_1.default.error(`Groq symptom evaluator parsing failure: ${error}`);
            return mockResult;
        }
    }
    async getPredictiveWellness(userId, lang = 'en') {
        // 1. Gather all medical records biomarker history sorted by date
        const records = await medical_record_model_1.MedicalRecord.find({ patientId: userId }).sort({ parsedAt: 1 });
        const biomarkerHistory = [];
        records.forEach((record) => {
            const dateStr = record.parsedAt.toISOString().split('T')[0];
            const biomarkers = record.extractedData?.biomarkers || [];
            let glucoseVal;
            let cholesterolVal;
            let a1cVal;
            biomarkers.forEach((b) => {
                const nameLower = b.name.toLowerCase();
                if (nameLower.includes('glucose') || nameLower.includes('sugar')) {
                    glucoseVal = Number(b.value);
                }
                else if (nameLower.includes('cholesterol')) {
                    cholesterolVal = Number(b.value);
                }
                else if (nameLower.includes('a1c') || nameLower.includes('hemoglobin')) {
                    a1cVal = Number(b.value);
                }
            });
            if (glucoseVal !== undefined || cholesterolVal !== undefined || a1cVal !== undefined) {
                biomarkerHistory.push({
                    date: dateStr,
                    glucose: glucoseVal,
                    cholesterol: cholesterolVal,
                    a1c: a1cVal,
                });
            }
        });
        // 2. Gather weekly compliance rate for last 4 weeks (28 days)
        const weeklyCompliance = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let w = 3; w >= 0; w--) {
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            const logs = await reminder_model_1.MedicationLog.find({
                patientId: userId,
                scheduledTime: { $gte: weekStart, $lt: weekEnd },
            });
            const total = logs.length;
            const taken = logs.filter((l) => l.status === 'TAKEN').length;
            const rate = total > 0 ? Math.round((taken / total) * 100) : 100;
            weeklyCompliance.push({
                weekName: w === 0 ? 'This Week' : `${w} Wk${w > 1 ? 's' : ''} Ago`,
                rate,
            });
        }
        // 3. Generate AI Wellness Forecast
        let forecast = 'Based on your stable medication compliance and biomarker telemetry, your fasting blood sugar is projected to remain controlled. Maintain your current daily dosage and hydration habits.';
        try {
            const averageCompliance = weeklyCompliance.reduce((acc, curr) => acc + curr.rate, 0) / 4;
            const latestBiomarkers = biomarkerHistory[biomarkerHistory.length - 1] || {};
            const promptContext = `
        Medication Compliance Average (last 4 weeks): ${averageCompliance}%.
        Latest blood glucose: ${latestBiomarkers.glucose || 'N/A'} mg/dL.
        Latest cholesterol: ${latestBiomarkers.cholesterol || 'N/A'} mg/dL.
        Latest HbA1c: ${latestBiomarkers.a1c || 'N/A'}%.
      `;
            const prompt = `
        Based on this patient wellness telemetry context:
        ${promptContext}
        Generate an AI wellness trend projection and forecast in exactly 3 supportive, clinical sentences. Predict how their sugar/cholesterol will normalize if they sustain or improve their compliance. Include a target advice.
        Output strictly as a JSON object matching schema: { "forecast": "forecast text" }
      `;
            let systemPrompt = 'You are a professional clinical predictive analytics doctor. Answer strictly in a JSON object format: { "forecast": "forecast text" }';
            if (lang === 'hi') {
                systemPrompt += ' IMPORTANT: The "forecast" text value MUST be output strictly in Hindi language (हिंदी भाषा).';
            }
            const completion = await groq_service_1.default.chatCompletion(systemPrompt, prompt, 'json_object');
            let clean = completion.trim();
            if (clean.startsWith('```')) {
                clean = clean.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(clean);
            forecast = parsed.forecast || forecast;
        }
        catch (err) {
            logger_1.default.error(`Failed to compile AI wellness forecast: ${err}`);
        }
        return {
            biomarkerHistory,
            weeklyCompliance,
            forecast,
        };
    }
}
exports.TriageService = TriageService;
exports.triageService = new TriageService();
exports.default = exports.triageService;
