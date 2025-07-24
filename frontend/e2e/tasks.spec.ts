import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigate to tasks page
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('userId', '1');
      localStorage.setItem('tenantId', 'tenant1');
    });

    await page.goto('http://localhost:3000/tasks');
  });

  test('should display tasks page with empty state', async ({ page }) => {
    // Mock empty tasks response
    await page.route('**/api/tasks**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [],
            total: 0,
            page: 1,
            limit: 10
          }
        })
      });
    });

    await expect(page.getByText('Tasks')).toBeVisible();
    await expect(page.getByText('No tasks found')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();
  });

  test('should display list of tasks', async ({ page }) => {
    // Mock tasks response
    await page.route('**/api/tasks**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [
              {
                id: '1',
                title: 'Complete project documentation',
                description: 'Write comprehensive documentation for the project',
                status: 'in_progress',
                priority: 'high',
                assignee_id: '2',
                project_id: 'project1',
                tenant_id: 'tenant1',
                due_date: '2024-01-15T00:00:00Z',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                created_by: '1'
              },
              {
                id: '2',
                title: 'Review code changes',
                description: 'Review pull request #123',
                status: 'todo',
                priority: 'medium',
                assignee_id: '1',
                project_id: 'project1',
                tenant_id: 'tenant1',
                created_at: '2024-01-01T09:00:00Z',
                updated_at: '2024-01-01T09:00:00Z',
                created_by: '2'
              }
            ],
            total: 2,
            page: 1,
            limit: 10
          }
        })
      });
    });

    await expect(page.getByText('Complete project documentation')).toBeVisible();
    await expect(page.getByText('Review code changes')).toBeVisible();
    await expect(page.getByText('In Progress')).toBeVisible();
    await expect(page.getByText('To Do')).toBeVisible();
  });

  test('should create new task', async ({ page }) => {
    // Mock projects for task creation
    await page.route('**/api/projects**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [
              {
                id: 'project1',
                name: 'Test Project',
                status: 'active',
                tenant_id: 'tenant1',
                owner_id: '1'
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          }
        })
      });
    });

    // Mock users for assignment
    await page.route('**/api/users/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '1',
              email: 'user1@example.com',
              username: 'user1',
              first_name: 'User',
              last_name: 'One',
              tenant_id: 'tenant1'
            },
            {
              id: '2',
              email: 'user2@example.com',
              username: 'user2',
              first_name: 'User',
              last_name: 'Two',
              tenant_id: 'tenant1'
            }
          ]
        })
      });
    });

    // Mock task creation
    await page.route('**/api/tasks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '3',
              title: 'New Task',
              description: 'Task description',
              status: 'todo',
              priority: 'high',
              assignee_id: '2',
              project_id: 'project1',
              tenant_id: 'tenant1',
              due_date: '2024-01-20T00:00:00Z',
              created_at: '2024-01-01T12:00:00Z',
              updated_at: '2024-01-01T12:00:00Z',
              created_by: '1'
            }
          })
        });
      } else {
        // GET request - return updated task list
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: '3',
                  title: 'New Task',
                  description: 'Task description',
                  status: 'todo',
                  priority: 'high',
                  assignee_id: '2',
                  project_id: 'project1',
                  tenant_id: 'tenant1',
                  due_date: '2024-01-20T00:00:00Z',
                  created_at: '2024-01-01T12:00:00Z',
                  updated_at: '2024-01-01T12:00:00Z',
                  created_by: '1'
                }
              ],
              total: 1,
              page: 1,
              limit: 10
            }
          })
        });
      }
    });

    // Click new task button
    await page.getByRole('button', { name: 'New Task' }).click();

    // Fill in task form
    await page.getByLabel('Title').fill('New Task');
    await page.getByLabel('Description').fill('Task description');
    await page.getByLabel('Priority').selectOption('high');
    await page.getByLabel('Project').selectOption('project1');
    await page.getByLabel('Assignee').selectOption('2');
    await page.getByLabel('Due Date').fill('2024-01-20');

    // Submit form
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Should show success message and new task
    await expect(page.getByText('Task created successfully')).toBeVisible();
    await expect(page.getByText('New Task')).toBeVisible();
  });

  test('should edit existing task', async ({ page }) => {
    // Mock initial tasks
    await page.route('**/api/tasks**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  title: 'Original Task',
                  description: 'Original description',
                  status: 'todo',
                  priority: 'medium',
                  project_id: 'project1',
                  tenant_id: 'tenant1',
                  created_at: '2024-01-01T10:00:00Z',
                  updated_at: '2024-01-01T10:00:00Z',
                  created_by: '1'
                }
              ],
              total: 1,
              page: 1,
              limit: 10
            }
          })
        });
      }
    });

    // Mock task update
    await page.route('**/api/tasks/1', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: '1',
              title: 'Updated Task',
              description: 'Updated description',
              status: 'in_progress',
              priority: 'high',
              project_id: 'project1',
              tenant_id: 'tenant1',
              created_at: '2024-01-01T10:00:00Z',
              updated_at: '2024-01-01T13:00:00Z',
              created_by: '1'
            }
          })
        });
      }
    });

    // Click edit button on task
    await page.getByRole('button', { name: 'Edit' }).first().click();

    // Update task fields
    await page.getByLabel('Title').fill('Updated Task');
    await page.getByLabel('Description').fill('Updated description');
    await page.getByLabel('Status').selectOption('in_progress');
    await page.getByLabel('Priority').selectOption('high');

    // Submit form
    await page.getByRole('button', { name: 'Update Task' }).click();

    // Should show success message
    await expect(page.getByText('Task updated successfully')).toBeVisible();
  });

  test('should delete task', async ({ page }) => {
    // Mock initial tasks
    await page.route('**/api/tasks**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  title: 'Task to Delete',
                  status: 'todo',
                  priority: 'medium',
                  project_id: 'project1',
                  tenant_id: 'tenant1',
                  created_at: '2024-01-01T10:00:00Z',
                  updated_at: '2024-01-01T10:00:00Z',
                  created_by: '1'
                }
              ],
              total: 1,
              page: 1,
              limit: 10
            }
          })
        });
      }
    });

    // Mock task deletion
    await page.route('**/api/tasks/1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 204,
          contentType: 'application/json'
        });
      }
    });

    // Click delete button
    await page.getByRole('button', { name: 'Delete' }).first().click();

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).last().click();

    // Should show success message
    await expect(page.getByText('Task deleted successfully')).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    // Mock filtered tasks response
    await page.route('**/api/tasks**', async route => {
      const url = route.request().url();
      if (url.includes('status=in_progress')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  title: 'In Progress Task',
                  status: 'in_progress',
                  priority: 'high',
                  project_id: 'project1',
                  tenant_id: 'tenant1',
                  created_at: '2024-01-01T10:00:00Z',
                  updated_at: '2024-01-01T10:00:00Z',
                  created_by: '1'
                }
              ],
              total: 1,
              page: 1,
              limit: 10
            }
          })
        });
      } else {
        // Default response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [],
              total: 0,
              page: 1,
              limit: 10
            }
          })
        });
      }
    });

    // Select status filter
    await page.getByLabel('Status').selectOption('in_progress');

    // Should show filtered tasks
    await expect(page.getByText('In Progress Task')).toBeVisible();
  });

  test('should search tasks', async ({ page }) => {
    // Mock search response
    await page.route('**/api/tasks**', async route => {
      const url = route.request().url();
      if (url.includes('search=documentation')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  title: 'Complete documentation',
                  status: 'todo',
                  priority: 'medium',
                  project_id: 'project1',
                  tenant_id: 'tenant1',
                  created_at: '2024-01-01T10:00:00Z',
                  updated_at: '2024-01-01T10:00:00Z',
                  created_by: '1'
                }
              ],
              total: 1,
              page: 1,
              limit: 10
            }
          })
        });
      } else {
        // Default response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              data: [],
              total: 0,
              page: 1,
              limit: 10
            }
          })
        });
      }
    });

    // Enter search term
    await page.getByPlaceholder('Search tasks...').fill('documentation');

    // Should show search results
    await expect(page.getByText('Complete documentation')).toBeVisible();
  });

  test('should assign task to user', async ({ page }) => {
    // Mock initial task
    await page.route('**/api/tasks**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            data: [
              {
                id: '1',
                title: 'Unassigned Task',
                status: 'todo',
                priority: 'medium',
                project_id: 'project1',
                tenant_id: 'tenant1',
                created_at: '2024-01-01T10:00:00Z',
                updated_at: '2024-01-01T10:00:00Z',
                created_by: '1'
              }
            ],
            total: 1,
            page: 1,
            limit: 10
          }
        })
      });
    });

    // Mock users for assignment
    await page.route('**/api/users/search**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: '2',
              email: 'user2@example.com',
              username: 'user2',
              first_name: 'User',
              last_name: 'Two',
              tenant_id: 'tenant1'
            }
          ]
        })
      });
    });

    // Mock task assignment
    await page.route('**/api/tasks/1/assign', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: '1',
            title: 'Unassigned Task',
            status: 'todo',
            priority: 'medium',
            assignee_id: '2',
            project_id: 'project1',
            tenant_id: 'tenant1',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T14:00:00Z',
            created_by: '1'
          }
        })
      });
    });

    // Click assign button
    await page.getByRole('button', { name: 'Assign' }).first().click();

    // Select assignee
    await page.getByLabel('Assignee').selectOption('2');

    // Submit assignment
    await page.getByRole('button', { name: 'Assign Task' }).click();

    // Should show success message
    await expect(page.getByText('Task assigned successfully')).toBeVisible();
  });

  test('should handle task creation validation errors', async ({ page }) => {
    // Click new task button
    await page.getByRole('button', { name: 'New Task' }).click();

    // Try to submit without required fields
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Should show validation errors
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByText('Project is required')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/tasks**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    // Should show error message
    await expect(page.getByText(/error|failed/i)).toBeVisible();
  });
}); 