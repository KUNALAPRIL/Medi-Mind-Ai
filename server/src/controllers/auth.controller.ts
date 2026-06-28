import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body;
      const result = await authService.register(email, password, role);
      res.status(201).json({
        status: 'success',
        message: 'Registration successful. Please check your email to verify your account.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      await authService.verifyEmail(token);
      res.status(200).json({
        status: 'success',
        message: 'Email address verified successfully. You can now log in.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await authService.requestPasswordReset(email);
      res.status(200).json({
        status: 'success',
        message: 'If the email exists, a password reset link has been dispatched.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful. You can now log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ status: 'error', message: 'Refresh token is required' });
        return;
      }
      const result = await authService.refresh(refreshToken);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken, role } = req.body;
      const result = await authService.googleLogin(idToken, role);
      res.status(200).json({
        status: 'success',
        message: 'Google login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      res.status(200).json({
        status: 'success',
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  public async seedDemo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.currentUser?.userId;
      if (!userId) {
        res.status(400).json({ status: 'error', message: 'User context is missing' });
        return;
      }
      await authService.seedDemo(userId);
      res.status(200).json({
        status: 'success',
        message: 'Mock telemetry data successfully seeded for this profile',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
