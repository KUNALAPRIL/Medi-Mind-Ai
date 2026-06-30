"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = __importDefault(require("./environment"));
const logger_1 = __importDefault(require("./logger"));
const connectDatabase = async () => {
    try {
        mongoose_1.default.connection.on('connected', () => {
            logger_1.default.info('MongoDB connected successfully');
        });
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error(`MongoDB connection error: ${err}`);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        await mongoose_1.default.connect(environment_1.default.MONGO_URI);
    }
    catch (error) {
        logger_1.default.error(`Initial MongoDB connection error: ${error}`);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
exports.default = exports.connectDatabase;
