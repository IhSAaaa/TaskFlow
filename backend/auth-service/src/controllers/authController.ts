import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../../shared/src/utils/logger';
import { AuthRequest } from '../../shared/src/types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName, tenantId } = req.body;
      
      const result = await this.authService.register({
        email,
        password,
        firstName,
        lastName,
        tenantId
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      const result = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed'
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      await this.authService.logout(refreshToken);

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Logout failed'
      });
    }
  };

  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Token required'
        });
        return;
      }

      const result = await this.authService.validateToken(token);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Token validation error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Token validation failed'
      });
    }
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      logger.error('Password change error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Password change failed'
      });
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      await this.authService.forgotPassword(email);

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send reset email'
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      
      await this.authService.resetPassword(token, newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      logger.error('Password reset error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Password reset failed'
      });
    }
  };
} 