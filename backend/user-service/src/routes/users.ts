import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

// Get user by ID
router.get('/:id', userController.getUserById);

// Search users
router.get('/search', userController.searchUsers);

// Get users by project
router.get('/project/:projectId', userController.getUsersByProject);

export default router; 