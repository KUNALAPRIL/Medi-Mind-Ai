"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../errors/app-error");
const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            req.body = parsed.body;
            req.query = parsed.query;
            req.params = parsed.params;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
                next(new app_error_1.BadRequestError(errorMessages));
                return;
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
exports.default = exports.validateRequest;
