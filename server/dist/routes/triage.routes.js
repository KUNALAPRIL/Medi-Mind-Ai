"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triageRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const triage_service_1 = __importDefault(require("../services/triage.service"));
const app_error_1 = require("../errors/app-error");
exports.triageRouter = (0, express_1.Router)();
exports.triageRouter.use(auth_middleware_1.authenticate);
exports.triageRouter.post('/symptom-check', async (req, res, next) => {
    try {
        const { symptoms, age, gender, medicalHistory } = req.body;
        if (!symptoms || !age || !gender) {
            throw new app_error_1.BadRequestError('Symptoms description, age, and gender are required fields');
        }
        const lang = (req.headers['x-language'] || req.headers['accept-language'] || 'en');
        const data = await triage_service_1.default.evaluateSymptoms(symptoms, Number(age), gender, medicalHistory, lang);
        res.status(200).json({
            status: 'success',
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.triageRouter.get('/analytics', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        const lang = (req.headers['x-language'] || req.headers['accept-language'] || 'en');
        const data = await triage_service_1.default.getPredictiveWellness(userId, lang);
        res.status(200).json({
            status: 'success',
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.triageRouter;
