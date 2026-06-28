import multer from 'multer';
import { BadRequestError } from '../errors/app-error';

// Config memory storage to read file buffer directly
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PNG, JPG, JPEG, and PDF files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size limit
  },
});

export default upload;
