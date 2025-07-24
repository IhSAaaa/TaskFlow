import { TaskService } from '../services/taskService';
import { TestUtils } from '@taskflow/shared/src/utils/testUtils';
import { TaskStatus, TaskPriority } from '../types/task';

describe('TaskService', () => {
  let taskService: TaskService;
  let testPool: any;
  let testTenant: any;
  let testUser: any;
  let testProject: any;

  beforeAll(async () => {
    testPool = await TestUtils.initializeTestDb();
    taskService = new TaskService();
  });

  beforeEach(async () => {
    await TestUtils.clearTables();
    
    // Create test data
    testTenant = TestUtils.generateTestTenant();
    testUser = TestUtils.generateTestUser({ tenant_id: testTenant.id });
    testProject = TestUtils.generateTestProject({ 
      tenant_id: testTenant.id, 
      owner_id: testUser.id 
    });

    await TestUtils.insertTestTenant(testPool, testTenant);
    await TestUtils.insertTestUser(testPool, testUser);
    await TestUtils.insertTestProject(testPool, testProject);
  });

  afterAll(async () => {
    await TestUtils.cleanupTestDb();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        priority: TaskPriority.HIGH,
        project_id: testProject.id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const task = await taskService.createTask(taskData, testTenant.id, testUser.id);

      expect(task).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.project_id).toBe(taskData.project_id);
      expect(task.tenant_id).toBe(testTenant.id);
      expect(task.created_by).toBe(testUser.id);
    });

    it('should create a task with default values', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: testProject.id
      };

      const task = await taskService.createTask(taskData, testTenant.id, testUser.id);

      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.status).toBe(TaskStatus.TODO);
    });

    it('should create a task with subtask', async () => {
      const parentTaskData = {
        title: 'Parent Task',
        project_id: testProject.id
      };

      const parentTask = await taskService.createTask(parentTaskData, testTenant.id, testUser.id);

      const subtaskData = {
        title: 'Subtask',
        project_id: testProject.id,
        parent_task_id: parentTask.id
      };

      const subtask = await taskService.createTask(subtaskData, testTenant.id, testUser.id);

      expect(subtask.parent_task_id).toBe(parentTask.id);
    });
  });

  describe('getTaskById', () => {
    it('should get a task by ID', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: testProject.id
      };

      const createdTask = await taskService.createTask(taskData, testTenant.id, testUser.id);
      const task = await taskService.getTaskById(createdTask.id, testTenant.id);

      expect(task).toBeDefined();
      expect(task?.id).toBe(createdTask.id);
      expect(task?.title).toBe(taskData.title);
    });

    it('should return null for non-existent task', async () => {
      const task = await taskService.getTaskById('non-existent-id', testTenant.id);
      expect(task).toBeNull();
    });

    it('should return null for task from different tenant', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: testProject.id
      };

      const createdTask = await taskService.createTask(taskData, testTenant.id, testUser.id);
      const task = await taskService.getTaskById(createdTask.id, 'different-tenant-id');

      expect(task).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const taskData = {
        title: 'Original Title',
        project_id: testProject.id
      };

      const createdTask = await taskService.createTask(taskData, testTenant.id, testUser.id);

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH
      };

      const updatedTask = await taskService.updateTask(createdTask.id, updateData, testTenant.id);

      expect(updatedTask).toBeDefined();
      expect(updatedTask?.title).toBe(updateData.title);
      expect(updatedTask?.description).toBe(updateData.description);
      expect(updatedTask?.status).toBe(updateData.status);
      expect(updatedTask?.priority).toBe(updateData.priority);
    });

    it('should return null for non-existent task', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const task = await taskService.updateTask('non-existent-id', updateData, testTenant.id);
      expect(task).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: testProject.id
      };

      const createdTask = await taskService.createTask(taskData, testTenant.id, testUser.id);
      const result = await taskService.deleteTask(createdTask.id, testTenant.id);

      expect(result).toBe(true);

      const deletedTask = await taskService.getTaskById(createdTask.id, testTenant.id);
      expect(deletedTask).toBeNull();
    });

    it('should return false for non-existent task', async () => {
      const result = await taskService.deleteTask('non-existent-id', testTenant.id);
      expect(result).toBe(false);
    });
  });

  describe('assignTask', () => {
    it('should assign a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: testProject.id
      };

      const createdTask = await taskService.createTask(taskData, testTenant.id, testUser.id);
      const assigneeId = testUser.id;

      const assignedTask = await taskService.assignTask(createdTask.id, assigneeId, testUser.id, testTenant.id);

      expect(assignedTask).toBeDefined();
      expect(assignedTask?.assignee_id).toBe(assigneeId);
    });

    it('should return null for non-existent task', async () => {
      const assignedTask = await taskService.assignTask('non-existent-id', testUser.id, testUser.id, testTenant.id);
      expect(assignedTask).toBeNull();
    });
  });

  describe('getTasks', () => {
    beforeEach(async () => {
      // Create multiple tasks for testing
      const taskData1 = {
        title: 'Task 1',
        project_id: testProject.id,
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO
      };

      const taskData2 = {
        title: 'Task 2',
        project_id: testProject.id,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS
      };

      const taskData3 = {
        title: 'Task 3',
        project_id: testProject.id,
        priority: TaskPriority.LOW,
        status: TaskStatus.DONE
      };

      await taskService.createTask(taskData1, testTenant.id, testUser.id);
      await taskService.createTask(taskData2, testTenant.id, testUser.id);
      await taskService.createTask(taskData3, testTenant.id, testUser.id);
    });

    it('should get all tasks for tenant', async () => {
      const result = await taskService.getTasks({}, testTenant.id);

      expect(result.tasks).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter tasks by status', async () => {
      const result = await taskService.getTasks({ status: TaskStatus.TODO }, testTenant.id);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].status).toBe(TaskStatus.TODO);
    });

    it('should filter tasks by priority', async () => {
      const result = await taskService.getTasks({ priority: TaskPriority.HIGH }, testTenant.id);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].priority).toBe(TaskPriority.HIGH);
    });

    it('should filter tasks by project', async () => {
      const result = await taskService.getTasks({ project_id: testProject.id }, testTenant.id);

      expect(result.tasks).toHaveLength(3);
      expect(result.tasks.every(task => task.project_id === testProject.id)).toBe(true);
    });

    it('should support pagination', async () => {
      const result = await taskService.getTasks({ page: 1, limit: 2 }, testTenant.id);

      expect(result.tasks).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.total).toBe(3);
    });

    it('should support search', async () => {
      const result = await taskService.getTasks({ search: 'Task 1' }, testTenant.id);

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe('Task 1');
    });
  });

  describe('getTasksByProject', () => {
    it('should get tasks by project', async () => {
      const taskData1 = {
        title: 'Task 1',
        project_id: testProject.id
      };

      const taskData2 = {
        title: 'Task 2',
        project_id: testProject.id
      };

      await taskService.createTask(taskData1, testTenant.id, testUser.id);
      await taskService.createTask(taskData2, testTenant.id, testUser.id);

      const tasks = await taskService.getTasksByProject(testProject.id, testTenant.id);

      expect(tasks).toHaveLength(2);
      expect(tasks.every(task => task.project_id === testProject.id)).toBe(true);
    });
  });

  describe('getTasksByAssignee', () => {
    it('should get tasks by assignee', async () => {
      const taskData1 = {
        title: 'Task 1',
        project_id: testProject.id,
        assignee_id: testUser.id
      };

      const taskData2 = {
        title: 'Task 2',
        project_id: testProject.id,
        assignee_id: testUser.id
      };

      await taskService.createTask(taskData1, testTenant.id, testUser.id);
      await taskService.createTask(taskData2, testTenant.id, testUser.id);

      const tasks = await taskService.getTasksByAssignee(testUser.id, testTenant.id);

      expect(tasks).toHaveLength(2);
      expect(tasks.every(task => task.assignee_id === testUser.id)).toBe(true);
    });
  });

  describe('getSubTasks', () => {
    it('should get subtasks of a parent task', async () => {
      const parentTaskData = {
        title: 'Parent Task',
        project_id: testProject.id
      };

      const parentTask = await taskService.createTask(parentTaskData, testTenant.id, testUser.id);

      const subtaskData1 = {
        title: 'Subtask 1',
        project_id: testProject.id,
        parent_task_id: parentTask.id
      };

      const subtaskData2 = {
        title: 'Subtask 2',
        project_id: testProject.id,
        parent_task_id: parentTask.id
      };

      await taskService.createTask(subtaskData1, testTenant.id, testUser.id);
      await taskService.createTask(subtaskData2, testTenant.id, testUser.id);

      const subtasks = await taskService.getSubTasks(parentTask.id, testTenant.id);

      expect(subtasks).toHaveLength(2);
      expect(subtasks.every(task => task.parent_task_id === parentTask.id)).toBe(true);
    });
  });
}); 