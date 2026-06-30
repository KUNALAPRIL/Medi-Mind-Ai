"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scannerRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload.middleware"));
const scanner_service_1 = __importDefault(require("../services/scanner.service"));
const app_error_1 = require("../errors/app-error");
exports.scannerRouter = (0, express_1.Router)();
exports.scannerRouter.use(auth_middleware_1.authenticate);
exports.scannerRouter.get('/', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        const prescriptions = await scanner_service_1.default.getPrescriptions(userId);
        res.status(200).json({ status: 'success', data: prescriptions });
    }
    catch (error) {
        next(error);
    }
});
exports.scannerRouter.post('/scan', upload_middleware_1.default.single('file'), async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        const file = req.file;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        if (!file) {
            throw new app_error_1.BadRequestError('Upload payload is missing a valid file');
        }
        const prescription = await scanner_service_1.default.processUpload(userId, file.buffer, file.originalname, file.mimetype);
        res.status(201).json({
            status: 'success',
            message: 'Prescription scanned and parsed successfully',
            data: prescription,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.scannerRouter.put('/:id/verify', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const verifiedPrescription = await scanner_service_1.default.verifyPrescription(id, updatedData);
        res.status(200).json({
            status: 'success',
            message: 'Prescription data verified and logged',
            data: verifiedPrescription,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.scannerRouter.post('/:id/sync', async (req, res, next) => {
    try {
        const { id } = req.params;
        const reminders = await scanner_service_1.default.syncPrescriptionToReminders(id);
        res.status(200).json({
            status: 'success',
            message: 'Prescription synced to active daily reminders checklist successfully',
            data: reminders,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.scannerRouter;
