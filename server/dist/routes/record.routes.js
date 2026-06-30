"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload.middleware"));
const record_service_1 = __importDefault(require("../services/record.service"));
const app_error_1 = require("../errors/app-error");
exports.recordRouter = (0, express_1.Router)();
exports.recordRouter.use(auth_middleware_1.authenticate);
exports.recordRouter.get('/', async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        const { search } = req.query;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        const records = await record_service_1.default.getRecords(userId, search);
        res.status(200).json({ status: 'success', data: records });
    }
    catch (error) {
        next(error);
    }
});
exports.recordRouter.post('/upload', upload_middleware_1.default.single('file'), async (req, res, next) => {
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
        const record = await record_service_1.default.processUpload(userId, file.buffer, file.originalname, file.mimetype);
        res.status(201).json({
            status: 'success',
            message: 'Medical report uploaded and parsed successfully',
            data: record,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.recordRouter.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const record = await record_service_1.default.getRecordById(id);
        if (!record) {
            res.status(404).json({ status: 'error', message: 'Medical record not found' });
            return;
        }
        res.status(200).json({ status: 'success', data: record });
    }
    catch (error) {
        next(error);
    }
});
exports.recordRouter.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await record_service_1.default.deleteRecord(id);
        res.status(200).json({ status: 'success', message: 'Medical record deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.recordRouter;
