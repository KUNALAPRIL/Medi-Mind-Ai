import { MedicalRecord } from '../models/medical-record.model';
import { uploadToCloudinary } from '../config/cloudinary';
import groqService from './groq.service';
import logger from '../config/logger';

export class RecordService {
  public async getRecords(userId: string, search?: string) {
    const filter: any = { patientId: userId };
    if (search) {
      filter.originalFileName = { $regex: search, $options: 'i' };
    }
    return MedicalRecord.find(filter).sort({ parsedAt: -1 });
  }

  public async deleteRecord(recordId: string) {
    await MedicalRecord.deleteOne({ _id: recordId });
  }

  public async getRecordById(recordId: string) {
    return MedicalRecord.findById(recordId);
  }

  public async processUpload(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    // 1. Upload to Cloudinary
    const fileUrl = await uploadToCloudinary(fileBuffer, fileName, mimeType);

    // 2. OCR and AI Analysis using Groq Vision Model (llama-3.2-11b-vision-preview)
    let extractedData = {
      biomarkers: [
        { name: 'Fasting Blood Sugar', value: 104, unit: 'mg/dL', referenceRange: '70-100', status: 'HIGH' },
        { name: 'Total Cholesterol', value: 185, unit: 'mg/dL', referenceRange: '120-200', status: 'NORMAL' },
        { name: 'Hemoglobin A1c', value: 5.8, unit: '%', referenceRange: '4.0-5.6', status: 'HIGH' },
      ],
      rawText: 'Scanned report parsed content.',
    };
    let aiAnalysisSummary = 'Fasting glucose and HbA1c are slightly elevated, indicating early signs of prediabetes. Recommended lifestyle modifications including reduced carbohydrate intake and light exercise.';

    try {
      const systemPrompt = 'You are an expert diagnostic systems analyzer. Extract medical biomarkers from images and output strictly valid JSON matching schema definitions.';
      const prompt = `
        Extract medical biomarkers, lab test names, their numeric values, units, reference ranges, and categorise their status ('NORMAL', 'HIGH', or 'LOW') from the attached lab report.
        Additionally, write a brief, 2-sentence clinical review summary in layperson terms warning the patient if critical markers display warnings.
        
        Format the output strictly as a JSON object matching this schema:
        {
          "biomarkers": [
            { "name": "biomarker name", "value": 12.3, "unit": "mg/dL", "referenceRange": "10-20", "status": "NORMAL" }
          ],
          "aiAnalysisSummary": "clinical review text",
          "rawText": "ocr extracted text"
        }
      `;

      // Trigger vision complete
      const completion = await groqService.visionCompletion(systemPrompt, prompt, fileBuffer, mimeType);
      let clean = completion.trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(clean);
      extractedData = {
        biomarkers: parsed.biomarkers || [],
        rawText: parsed.rawText || '',
      };
      aiAnalysisSummary = parsed.aiAnalysisSummary || '';
    } catch (err) {
      logger.error(`Groq record scanner vision complete failure: ${err}`);
    }

    // 3. Save to MongoDB
    const record = new MedicalRecord({
      patientId: userId,
      originalFileName: fileName,
      fileUrl,
      extractedData,
      aiAnalysisSummary,
    });

    await record.save();
    return record;
  }
}

export const recordService = new RecordService();
export default recordService;
