import { Router } from 'express';
import { TaskController } from '../controllers/taskController';

const router = Router();
const taskController = new TaskController();

// CRUD operations
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:taskId', taskController.getTask);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// Task assignment
router.post('/:taskId/assign', taskController.assignTask);

// Task filtering and grouping
router.get('/project/:projectId', taskController.getTasksByProject);
router.get('/assignee/:assigneeId', taskController.getTasksByAssignee);
router.get('/:taskId/subtasks', taskController.getSubTasks);

export default router; 