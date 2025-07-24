import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Validate token
router.get('/validate', authController.validateToken);

// Change password
router.post('/change-password', authController.changePassword);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password
router.post('/reset-password', authController.resetPassword);

export default router; 