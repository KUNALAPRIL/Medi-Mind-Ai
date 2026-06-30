"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const environment_1 = __importDefault(require("./environment"));
const logger_1 = __importDefault(require("./logger"));
if (environment_1.default.CLOUDINARY_URL) {
    cloudinary_1.v2.config({
        secure: true,
    });
}
else {
    logger_1.default.warn('CLOUDINARY_URL is missing. Uploads will fallback to local folder cache stubs.');
}
const uploadToCloudinary = async (fileBuffer, fileName, mimeType) => {
    if (!environment_1.default.CLOUDINARY_URL) {
        // Return mock URL
        return `http://localhost:5000/uploads/mock_${Date.now()}_${fileName}`;
    }
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder: 'medimind-records',
            public_id: `${Date.now()}_${fileName.split('.')[0]}`,
            resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
        }, (error, result) => {
            if (error) {
                logger_1.default.error(`Cloudinary upload error: ${error.message}`);
                reject(error);
                return;
            }
            resolve(result?.secure_url || '');
        });
        uploadStream.end(fileBuffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
exports.default = cloudinary_1.v2;
