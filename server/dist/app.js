"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const app_error_1 = require("./errors/app-error");
const routes_1 = require("./routes");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes',
    },
});
app.use('/api', limiter);
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
// App Router mount
app.use('/api/v1', routes_1.mainRouter);
app.all('*', (req, res, next) => {
    next(new app_error_1.NotFoundError(`Can't find ${req.originalUrl} on this server`));
});
app.use(error_middleware_1.default);
exports.default = app;
