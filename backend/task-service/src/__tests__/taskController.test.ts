import { TaskController } from '../controllers/taskController';
import { TaskService } from '../services/taskService';
import { TestUtils } from '@taskflow/shared/src/utils/testUtils';
import { TaskStatus, TaskPriority, Task } from '../types/task';

// Mock TaskService
jest.mock('../services/taskService');

describe('TaskController', () => {
  let taskController: TaskController;
  let mockTaskService: jest.Mocked<TaskService>;
  let testTenant: any;
  let testUser: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock service
    mockTaskService = new TaskService() as jest.Mocked<TaskService>;
    taskController = new TaskController(mockTaskService);
    
    // Generate test data
    testTenant = TestUtils.generateTestTenant();
    testUser = TestUtils.generateTestUser({ tenant_id: testTenant.id });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: TaskPriority.HIGH,
        project_id: 'project-id',
        due_date: new Date()
      };

      const mockTask = {
        id: 'task-id',
        ...taskData,
        status: TaskStatus.TODO,
        tenant_id: testTenant.id,
        created_by: testUser.id,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockTaskService.createTask.mockResolvedValue(mockTask);

      const req = TestUtils.createTestRequest({
        body: taskData,
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.createTask(req, res);

      expect(mockTaskService.createTask).toHaveBeenCalledWith(taskData, testTenant.id, testUser.id);
      TestUtils.expectSuccessResponse(res, mockTask);
    });

    it('should handle service errors', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: 'project-id'
      };

      const error = new Error('Database error');
      mockTaskService.createTask.mockRejectedValue(error);

      const req = TestUtils.createTestRequest({
        body: taskData,
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.createTask(req, res);

      expect(mockTaskService.createTask).toHaveBeenCalledWith(taskData, testTenant.id, testUser.id);
      TestUtils.expectErrorResponse(res, 500, 'Internal server error');
    });
  });

  describe('getTask', () => {
    it('should get a task by ID successfully', async () => {
      const taskId = 'task-id';
      const mockTask: Task = {
        id: taskId,
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        project_id: 'project-id',
        tenant_id: testTenant.id,
        created_by: testUser.id,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockTaskService.getTaskById.mockResolvedValue(mockTask);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getTask(req, res);

      expect(mockTaskService.getTaskById).toHaveBeenCalledWith(taskId, testTenant.id);
      TestUtils.expectSuccessResponse(res, mockTask);
    });

    it('should return 404 for non-existent task', async () => {
      const taskId = 'non-existent-id';
      mockTaskService.getTaskById.mockResolvedValue(null);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getTask(req, res);

      expect(mockTaskService.getTaskById).toHaveBeenCalledWith(taskId, testTenant.id);
      TestUtils.expectErrorResponse(res, 404, 'Task not found');
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const taskId = 'task-id';
      const updateData = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH
      };

      const mockUpdatedTask = {
        id: taskId,
        ...updateData,
        project_id: 'project-id',
        tenant_id: testTenant.id,
        created_by: testUser.id
      };

      mockTaskService.updateTask.mockResolvedValue(mockUpdatedTask);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        body: updateData,
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.updateTask(req, res);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(taskId, updateData, testTenant.id);
      TestUtils.expectSuccessResponse(res, mockUpdatedTask);
    });

    it('should return 404 for non-existent task', async () => {
      const taskId = 'non-existent-id';
      const updateData = { title: 'Updated Task' };

      mockTaskService.updateTask.mockResolvedValue(null);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        body: updateData,
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.updateTask(req, res);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(taskId, updateData, testTenant.id);
      TestUtils.expectErrorResponse(res, 404, 'Task not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = 'task-id';
      mockTaskService.deleteTask.mockResolvedValue(true);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.deleteTask(req, res);

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(taskId, testTenant.id);
      TestUtils.expectSuccessResponse(res, { message: 'Task deleted successfully' });
    });

    it('should return 404 for non-existent task', async () => {
      const taskId = 'non-existent-id';
      mockTaskService.deleteTask.mockResolvedValue(false);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.deleteTask(req, res);

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(taskId, testTenant.id);
      TestUtils.expectErrorResponse(res, 404, 'Task not found');
    });
  });

  describe('assignTask', () => {
    it('should assign a task successfully', async () => {
      const taskId = 'task-id';
      const assigneeId = 'assignee-id';
      const assignData = { assignee_id: assigneeId };

      const mockAssignedTask = {
        id: taskId,
        title: 'Test Task',
        assignee_id: assigneeId,
        project_id: 'project-id',
        tenant_id: testTenant.id
      };

      mockTaskService.assignTask.mockResolvedValue(mockAssignedTask);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        body: assignData,
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.assignTask(req, res);

      expect(mockTaskService.assignTask).toHaveBeenCalledWith(taskId, assigneeId, testUser.id, testTenant.id);
      TestUtils.expectSuccessResponse(res, mockAssignedTask);
    });

    it('should return 404 for non-existent task', async () => {
      const taskId = 'non-existent-id';
      const assignData = { assignee_id: 'assignee-id' };

      mockTaskService.assignTask.mockResolvedValue(null);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        body: assignData,
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.assignTask(req, res);

      expect(mockTaskService.assignTask).toHaveBeenCalledWith(taskId, 'assignee-id', testUser.id, testTenant.id);
      TestUtils.expectErrorResponse(res, 404, 'Task not found');
    });
  });

  describe('getTasks', () => {
    it('should get tasks with filters successfully', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          project_id: 'project-id',
          tenant_id: testTenant.id
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
          project_id: 'project-id',
          tenant_id: testTenant.id
        }
      ];

      const mockResult = {
        tasks: mockTasks,
        total: 2,
        page: 1,
        limit: 10
      };

      mockTaskService.getTasks.mockResolvedValue(mockResult);

      const req = TestUtils.createTestRequest({
        query: {
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          page: '1',
          limit: '10'
        },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getTasks(req, res);

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(
        {
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          page: 1,
          limit: 10
        },
        testTenant.id
      );
      TestUtils.expectSuccessResponse(res, mockResult);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockTaskService.getTasks.mockRejectedValue(error);

      const req = TestUtils.createTestRequest({
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getTasks(req, res);

      expect(mockTaskService.getTasks).toHaveBeenCalledWith({}, testTenant.id);
      TestUtils.expectErrorResponse(res, 500, 'Internal server error');
    });
  });

  describe('getTasksByProject', () => {
    it('should get tasks by project successfully', async () => {
      const projectId = 'project-id';
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          project_id: projectId,
          tenant_id: testTenant.id
        },
        {
          id: 'task-2',
          title: 'Task 2',
          project_id: projectId,
          tenant_id: testTenant.id
        }
      ];

      mockTaskService.getTasksByProject.mockResolvedValue(mockTasks);

      const req = TestUtils.createTestRequest({
        params: { projectId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getTasksByProject(req, res);

      expect(mockTaskService.getTasksByProject).toHaveBeenCalledWith(projectId, testTenant.id);
      TestUtils.expectSuccessResponse(res, mockTasks);
    });
  });

  describe('getTasksByAssignee', () => {
    it('should get tasks by assignee successfully', async () => {
      const assigneeId = 'assignee-id';
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task 1',
          assignee_id: assigneeId,
          tenant_id: testTenant.id
        },
        {
          id: 'task-2',
          title: 'Task 2',
          assignee_id: assigneeId,
          tenant_id: testTenant.id
        }
      ];

      mockTaskService.getTasksByAssignee.mockResolvedValue(mockTasks);

      const req = TestUtils.createTestRequest({
        params: { assigneeId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getTasksByAssignee(req, res);

      expect(mockTaskService.getTasksByAssignee).toHaveBeenCalledWith(assigneeId, testTenant.id);
      TestUtils.expectSuccessResponse(res, mockTasks);
    });
  });

  describe('getSubTasks', () => {
    it('should get subtasks successfully', async () => {
      const taskId = 'parent-task-id';
      const mockSubTasks = [
        {
          id: 'subtask-1',
          title: 'Subtask 1',
          parent_task_id: taskId,
          tenant_id: testTenant.id
        },
        {
          id: 'subtask-2',
          title: 'Subtask 2',
          parent_task_id: taskId,
          tenant_id: testTenant.id
        }
      ];

      mockTaskService.getSubTasks.mockResolvedValue(mockSubTasks);

      const req = TestUtils.createTestRequest({
        params: { taskId },
        headers: {
          'x-tenant-id': testTenant.id,
          'x-user-id': testUser.id
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.getSubTasks(req, res);

      expect(mockTaskService.getSubTasks).toHaveBeenCalledWith(taskId, testTenant.id);
      TestUtils.expectSuccessResponse(res, mockSubTasks);
    });
  });
}); 