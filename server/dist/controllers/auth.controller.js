"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_1 = __importDefault(require("../services/auth.service"));
class AuthController {
    async register(req, res, next) {
        try {
            const { email, password, role } = req.body;
            const result = await auth_service_1.default.register(email, password, role);
            res.status(201).json({
                status: 'success',
                message: 'Registration successful. Please check your email to verify your account.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.default.login(email, password);
            res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { token } = req.body;
            await auth_service_1.default.verifyEmail(token);
            res.status(200).json({
                status: 'success',
                message: 'Email address verified successfully. You can now log in.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            await auth_service_1.default.requestPasswordReset(email);
            res.status(200).json({
                status: 'success',
                message: 'If the email exists, a password reset link has been dispatched.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            await auth_service_1.default.resetPassword(token, password);
            res.status(200).json({
                status: 'success',
                message: 'Password reset successful. You can now log in with your new password.',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ status: 'error', message: 'Refresh token is required' });
                return;
            }
            const result = await auth_service_1.default.refresh(refreshToken);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async googleLogin(req, res, next) {
        try {
            const { idToken, role } = req.body;
            const result = await auth_service_1.default.googleLogin(idToken, role);
            res.status(200).json({
                status: 'success',
                message: 'Google login successful',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await auth_service_1.default.logout(refreshToken);
            }
            res.status(200).json({
                status: 'success',
                message: 'Logout successful',
            });
        }
        catch (error) {
            next(error);
        }
    }
    async seedDemo(req, res, next) {
        try {
            const userId = req.currentUser?.userId;
            if (!userId) {
                res.status(400).json({ status: 'error', message: 'User context is missing' });
                return;
            }
            await auth_service_1.default.seedDemo(userId);
            res.status(200).json({
                status: 'success',
                message: 'Mock telemetry data successfully seeded for this profile',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
exports.default = exports.authController;
