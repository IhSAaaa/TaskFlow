import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

const router = Router();
const projectController = new ProjectController();

// CRUD operations
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

// Team management
router.get('/:projectId/members', projectController.getProjectMembers);
router.post('/:projectId/members', projectController.addProjectMember);
router.put('/:projectId/members/:memberId', projectController.updateProjectMember);
router.delete('/:projectId/members/:memberId', projectController.removeProjectMember);

export default router; 