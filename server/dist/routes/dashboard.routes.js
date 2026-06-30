"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
exports.dashboardRouter = (0, express_1.Router)();
exports.dashboardRouter.get('/summary', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const userId = req.currentUser?.userId;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User context is missing' });
            return;
        }
        const data = await dashboard_service_1.default.getDashboardSummary(userId);
        res.status(200).json({
            status: 'success',
            data,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = exports.dashboardRouter;
