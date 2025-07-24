import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('http://localhost:3000/login');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Don\'t have an account?')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click sign in without filling any fields
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for validation messages
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Fill in invalid email
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');
    
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Check for email validation error
    await expect(page.getByText('Please enter a valid email')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click on register link
    await page.getByText('Sign up').click();
    
    // Should navigate to register page
    await expect(page).toHaveURL('http://localhost:3000/register');
    await expect(page.getByText('Create Account')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              username: 'testuser',
              first_name: 'Test',
              last_name: 'User',
              tenant_id: 'tenant1',
              status: 'active'
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            tenant: {
              id: 'tenant1',
              name: 'Test Tenant',
              domain: 'test.com',
              plan: 'basic'
            }
          }
        })
      });
    });

    // Fill in valid credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Click sign in
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Mock failed login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid email or password'
        })
      });
    });

    // Fill in invalid credentials
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    
    // Click sign in
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/login', async route => {
      await route.abort();
    });

    // Fill in credentials
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Click sign in
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show error message
    await expect(page.getByText(/network error|connection failed/i)).toBeVisible();
  });

  test('should remember login state after page reload', async ({ page }) => {
    // Mock successful login and set localStorage
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('userId', '1');
      localStorage.setItem('tenantId', 'tenant1');
    });

    // Navigate to protected route
    await page.goto('http://localhost:3000/');
    
    // Should be on dashboard (not redirected to login)
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Mock successful login first
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              username: 'testuser',
              first_name: 'Test',
              last_name: 'User',
              tenant_id: 'tenant1',
              status: 'active'
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            tenant: {
              id: 'tenant1',
              name: 'Test Tenant',
              domain: 'test.com',
              plan: 'basic'
            }
          }
        })
      });
    });

    // Login first
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for dashboard to load
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Mock logout response
    await page.route('**/api/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully'
        })
      });
    });

    // Click logout (assuming there's a logout button in header/sidebar)
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('http://localhost:3000/login');
  });
});

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show validation error for weak password', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Password').fill('123'); // Weak password
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.getByText(/password must be at least/i)).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    // Mock successful registration
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'newuser@example.com',
              username: 'newuser',
              first_name: 'New',
              last_name: 'User',
              tenant_id: 'tenant1',
              status: 'active'
            },
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            tenant: {
              id: 'tenant1',
              name: 'New Tenant',
              domain: 'newtenant.com',
              plan: 'basic'
            }
          }
        })
      });
    });

    // Fill in registration form
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('First Name').fill('New');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Password').fill('password123');
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should show error for existing email', async ({ page }) => {
    // Mock registration failure
    await page.route('**/api/auth/register', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Email already exists'
        })
      });
    });

    // Fill in form with existing email
    await page.getByLabel('Email').fill('existing@example.com');
    await page.getByLabel('Username').fill('newuser');
    await page.getByLabel('First Name').fill('New');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Password').fill('password123');
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.getByText('Email already exists')).toBeVisible();
  });
}); 