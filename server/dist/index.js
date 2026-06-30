"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_1 = __importDefault(require("./config/environment"));
const database_1 = __importDefault(require("./config/database"));
const logger_1 = __importDefault(require("./config/logger"));
const startServer = async () => {
    await (0, database_1.default)();
    const server = app_1.default.listen(environment_1.default.PORT, () => {
        logger_1.default.info(`Server is running in ${environment_1.default.NODE_ENV} mode on port ${environment_1.default.PORT}`);
    });
    const handleShutdown = (signal) => {
        logger_1.default.info(`Received ${signal}. Gracefully shutting down...`);
        server.close(() => {
            logger_1.default.info('Http server closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
};
startServer().catch((err) => {
    logger_1.default.error(`Critical server initialization error: ${err}`);
    process.exit(1);
});
