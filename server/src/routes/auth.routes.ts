import { Router } from 'express';
import authController from '../controllers/auth.controller';
import validateRequest from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', validateRequest(registerSchema), authController.register);
authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/google', validateRequest(googleAuthSchema), authController.googleLogin);
authRouter.post('/logout', authController.logout);
authRouter.post('/seed-demo', authenticate, authController.seedDemo);

export default authRouter;
