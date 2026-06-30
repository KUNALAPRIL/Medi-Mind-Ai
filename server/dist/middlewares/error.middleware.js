"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../errors/app-error");
const logger_1 = __importDefault(require("../config/logger"));
const errorHandler = (err, req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || 'no-correlation-id';
    if (err instanceof app_error_1.AppError) {
        logger_1.default.warn(`[AppError] [CorrelationID: ${correlationId}] Status: ${err.statusCode} - ${err.message}`);
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
        return;
    }
    logger_1.default.error(`[UnhandledError] [CorrelationID: ${correlationId}] Stack: ${err.stack}`);
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
