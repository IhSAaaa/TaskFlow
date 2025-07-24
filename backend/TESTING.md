# TaskFlow Testing Documentation

## Overview

This document outlines the testing strategy and implementation for the TaskFlow microservices architecture, including unit tests, integration tests, and testing utilities.

## Testing Strategy

### Testing Pyramid
```
    E2E Tests (Few)
       /    \
      /      \
   Integration Tests (Some)
      /    \
     /      \
  Unit Tests (Many)
```

### Test Types

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test service interactions
3. **API Tests**: Test HTTP endpoints
4. **Database Tests**: Test data persistence
5. **Security Tests**: Test security measures

## Testing Framework

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000
};
```

### Test Utilities

#### TestUtils Class
```typescript
// Shared test utilities for all services
export class TestUtils {
  // Database management
  static async initializeTestDb(): Promise<Pool>
  static async cleanupTestDb(): Promise<void>
  static async clearTables(): Promise<void>
  
  // Test data generation
  static generateTestTenant(overrides?: any): any
  static generateTestUser(overrides?: any): any
  static generateTestProject(overrides?: any): any
  static generateTestTask(overrides?: any): any
  
  // HTTP request helpers
  static createTestRequest(overrides?: any): any
  static createTestResponse(): any
  
  // Assertion helpers
  static expectSuccessResponse(res: any, expectedData?: any): void
  static expectErrorResponse(res: any, statusCode: number, errorMessage?: string): void
  static expectValidationError(res: any, fieldName?: string): void
}
```

## Unit Testing

### Service Layer Tests

#### Example: TaskService Tests
```typescript
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

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: TaskPriority.HIGH,
        project_id: testProject.id
      };

      const task = await taskService.createTask(taskData, testTenant.id, testUser.id);

      expect(task).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(TaskStatus.TODO);
    });
  });
});
```

### Controller Layer Tests

#### Example: TaskController Tests
```typescript
describe('TaskController', () => {
  let taskController: TaskController;
  let mockTaskService: jest.Mocked<TaskService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskService = new TaskService() as jest.Mocked<TaskService>;
    taskController = new TaskController(mockTaskService);
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: 'project-id'
      };

      const mockTask = {
        id: 'task-id',
        ...taskData,
        status: TaskStatus.TODO,
        tenant_id: 'tenant-id',
        created_by: 'user-id'
      };

      mockTaskService.createTask.mockResolvedValue(mockTask);

      const req = TestUtils.createTestRequest({
        body: taskData,
        headers: {
          'x-tenant-id': 'tenant-id',
          'x-user-id': 'user-id'
        }
      });

      const res = TestUtils.createTestResponse();

      await taskController.createTask(req, res);

      expect(mockTaskService.createTask).toHaveBeenCalledWith(taskData, 'tenant-id', 'user-id');
      TestUtils.expectSuccessResponse(res, mockTask);
    });
  });
});
```

## Integration Testing

### API Endpoint Tests

#### Example: Task API Tests
```typescript
describe('Task API', () => {
  let app: Express;
  let testPool: any;
  let testTenant: any;
  let testUser: any;

  beforeAll(async () => {
    testPool = await TestUtils.initializeTestDb();
    app = createApp(); // Your Express app
  });

  beforeEach(async () => {
    await TestUtils.clearTables();
    
    testTenant = TestUtils.generateTestTenant();
    testUser = TestUtils.generateTestUser({ tenant_id: testTenant.id });
    
    await TestUtils.insertTestTenant(testPool, testTenant);
    await TestUtils.insertTestUser(testPool, testUser);
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const taskData = {
        title: 'Test Task',
        project_id: 'project-id'
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('x-tenant-id', testTenant.id)
        .set('x-user-id', testUser.id)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('x-tenant-id', testTenant.id)
        .set('x-user-id', testUser.id)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});
```

## Database Testing

### Test Database Setup
```typescript
// Test database configuration
export const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  database: process.env.TEST_DB_NAME || 'taskflow_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
};
```

### Database Test Utilities
```typescript
// Database test helpers
export class DatabaseTestUtils {
  static async setupTestDatabase(): Promise<void> {
    // Create test database if not exists
    // Run migrations
    // Setup test data
  }

  static async cleanupTestDatabase(): Promise<void> {
    // Clean up test data
    // Reset sequences
    // Close connections
  }

  static async seedTestData(): Promise<void> {
    // Insert test tenants, users, projects
    // Create test scenarios
  }
}
```

## Security Testing

### Input Validation Tests
```typescript
describe('Input Validation', () => {
  it('should reject SQL injection attempts', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/tasks')
      .set('x-tenant-id', testTenant.id)
      .set('x-user-id', testUser.id)
      .send({
        title: maliciousInput,
        project_id: 'project-id'
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  it('should reject XSS attempts', async () => {
    const xssInput = '<script>alert("xss")</script>';
    
    const response = await request(app)
      .post('/api/tasks')
      .set('x-tenant-id', testTenant.id)
      .set('x-user-id', testUser.id)
      .send({
        title: xssInput,
        project_id: 'project-id'
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });
});
```

### Rate Limiting Tests
```typescript
describe('Rate Limiting', () => {
  it('should limit authentication attempts', async () => {
    const authData = {
      email: 'test@example.com',
      password: 'password'
    };

    // Make 6 requests (exceeding limit of 5)
    for (let i = 0; i < 6; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send(authData);

      if (i < 5) {
        expect(response.status).not.toBe(429);
      } else {
        expect(response.status).toBe(429);
        expect(response.body.error).toBe('Rate limit exceeded');
      }
    }
  });
});
```

## Performance Testing

### Load Testing
```typescript
describe('Performance', () => {
  it('should handle concurrent requests', async () => {
    const concurrentRequests = 100;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/api/tasks')
          .set('x-tenant-id', testTenant.id)
          .set('x-user-id', testUser.id)
      );
    }

    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should respond within acceptable time', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/tasks')
      .set('x-tenant-id', testTenant.id)
      .set('x-user-id', testUser.id)
      .expect(200);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(1000); // 1 second
  });
});
```

## Test Coverage

### Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage
- **API Tests**: 95%+ coverage
- **Security Tests**: 100% coverage

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Test Commands

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- taskService.test.ts

# Run tests for specific service
cd task-service && npm test
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit"
  }
}
```

## Test Data Management

### Test Data Factories
```typescript
// Test data factories for consistent test data
export class TestDataFactory {
  static createTenant(overrides?: Partial<Tenant>): Tenant {
    return {
      id: uuidv4(),
      name: `Test Tenant ${Date.now()}`,
      domain: `test-${Date.now()}.taskflow.com`,
      status: 'active',
      plan: 'professional',
      ...overrides
    };
  }

  static createUser(overrides?: Partial<User>): User {
    return {
      id: uuidv4(),
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      first_name: 'Test',
      last_name: 'User',
      ...overrides
    };
  }
}
```

### Test Database Seeding
```typescript
// Database seeding for integration tests
export class TestDatabaseSeeder {
  static async seedBasicData(): Promise<{
    tenant: Tenant;
    user: User;
    project: Project;
  }> {
    const tenant = TestDataFactory.createTenant();
    const user = TestDataFactory.createUser({ tenant_id: tenant.id });
    const project = TestDataFactory.createProject({ 
      tenant_id: tenant.id, 
      owner_id: user.id 
    });

    await TestUtils.insertTestTenant(testPool, tenant);
    await TestUtils.insertTestUser(testPool, user);
    await TestUtils.insertTestProject(testPool, project);

    return { tenant, user, project };
  }
}
```

## Continuous Integration

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: taskflow_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:coverage
```

## Best Practices

### Test Organization
1. **Arrange**: Set up test data and conditions
2. **Act**: Execute the code being tested
3. **Assert**: Verify the expected outcomes

### Test Naming
- Use descriptive test names
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests in describe blocks

### Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use beforeEach/afterEach for setup/cleanup
- Mock external dependencies

### Test Data
- Use factories for consistent test data
- Avoid hardcoded test data
- Use realistic but minimal test data
- Clean up test data properly

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure test database is running
2. **Port Conflicts**: Use different ports for test services
3. **Async Tests**: Use proper async/await patterns
4. **Mock Issues**: Clear mocks between tests
5. **Environment Variables**: Set test environment variables

### Debugging Tests
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should create task"

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

**Note**: This testing documentation should be updated as new testing patterns and tools are introduced to the project. 