import { v2 as cloudinary } from 'cloudinary';
import env from './environment';
import logger from './logger';

if (env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  logger.warn('CLOUDINARY_URL is missing. Uploads will fallback to local folder cache stubs.');
}

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  if (!env.CLOUDINARY_URL) {
    // Return mock URL
    return `http://localhost:5000/uploads/mock_${Date.now()}_${fileName}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'medimind-records',
        public_id: `${Date.now()}_${fileName.split('.')[0]}`,
        resource_type: mimeType === 'application/pdf' ? 'raw' : 'image',
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload error: ${error.message}`);
          reject(error);
          return;
        }
        resolve(result?.secure_url || '');
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
