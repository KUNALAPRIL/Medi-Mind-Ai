"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const mongoose_1 = require("mongoose");
const tokenSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['REFRESH', 'VERIFICATION', 'PASSWORD_RESET'],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // Automatically delete document when current date passes expiresAt
    },
}, {
    timestamps: true,
});
exports.Token = (0, mongoose_1.model)('Token', tokenSchema);
exports.default = exports.Token;
