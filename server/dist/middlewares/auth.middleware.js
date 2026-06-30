"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = __importDefault(require("../config/environment"));
const app_error_1 = require("../errors/app-error");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new app_error_1.UnauthorizedError('Authentication token missing or invalid');
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, environment_1.default.JWT_ACCESS_SECRET);
        req.currentUser = payload;
        next();
    }
    catch (error) {
        throw new app_error_1.UnauthorizedError('Authentication token verification failed');
    }
};
exports.authenticate = authenticate;
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.currentUser) {
            throw new app_error_1.UnauthorizedError('Authentication required');
        }
        if (!allowedRoles.includes(req.currentUser.role)) {
            throw new app_error_1.ForbiddenError('Access forbidden: insufficient permissions');
        }
        next();
    };
};
exports.requireRoles = requireRoles;
