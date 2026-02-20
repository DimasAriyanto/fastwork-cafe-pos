const API_BASE_URL = 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    roleId: number;
  };
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get access token dari localStorage
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get refresh token dari localStorage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Set tokens di localStorage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear tokens dari localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Attempt to refresh access token menggunakan refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data: ApiResponse<{ accessToken: string }> = await response.json();
      if (data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        return true;
      }

      this.clearTokens();
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Generic fetch method dengan auto-retry jika token expired
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const accessToken = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Jika 401 Unauthorized dan masih belum retry, coba refresh token
      if (response.status === 401 && retryCount === 0) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        // Token refresh gagal, clear tokens dan redirect ke login
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const error: ApiResponse = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(error.error || error.message || response.statusText);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ============= AUTH ENDPOINTS =============

  /**
   * Login dengan username dan password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    }

    throw new Error(response.error || 'Login failed');
  }

  /**
   * Register user baru
   */
  async register(email: string, password: string, name: string, roleId: number = 1) {
    const response = await this.request<ApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, roleId }),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Registration failed');
  }

  /**
   * Logout dan clear tokens
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user info
   */
  async getMe() {
    const response = await this.request<ApiResponse>('/auth/me', {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch user');
  }

  // ============= ROLE ENDPOINTS =============

  /**
   * Get semua roles
   */
  async getRoles() {
    const response = await this.request<ApiResponse>('/roles', {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch roles');
  }

  // ============= USER ENDPOINTS =============

  /**
   * Get semua users
   */
  async getUsers() {
    const response = await this.request<ApiResponse>('/users', {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch users');
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number) {
    const response = await this.request<ApiResponse>(`/users/${id}`, {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch user');
  }

  /**
   * Create user baru
   */
  async createUser(userData: any) {
    const response = await this.request<ApiResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create user');
  }

  /**
   * Update user
   */
  async updateUser(id: number, userData: any) {
    const response = await this.request<ApiResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update user');
  }

  /**
   * Delete user
   */
  async deleteUser(id: number) {
    const response = await this.request<ApiResponse>(`/users/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to delete user');
  }

  // ============= OUTLET ENDPOINTS =============

  /**
   * Get semua outlets
   */
  async getOutlets() {
    const response = await this.request<ApiResponse>('/outlets', {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch outlets');
  }

  /**
   * Get outlet by ID
   */
  async getOutletById(id: number) {
    const response = await this.request<ApiResponse>(`/outlets/${id}`, {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch outlet');
  }

  /**
   * Create outlet baru
   */
  async createOutlet(outletData: any) {
    const response = await this.request<ApiResponse>('/outlets', {
      method: 'POST',
      body: JSON.stringify(outletData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create outlet');
  }

  /**
   * Update outlet
   */
  async updateOutlet(id: number, outletData: any) {
    const response = await this.request<ApiResponse>(`/outlets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(outletData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update outlet');
  }

  /**
   * Delete outlet
   */
  async deleteOutlet(id: number) {
    const response = await this.request<ApiResponse>(`/outlets/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to delete outlet');
  }

  // ============= EMPLOYEE ENDPOINTS =============

  /**
   * Get semua employees
   */
  async getEmployees() {
    const response = await this.request<ApiResponse>('/employees', {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch employees');
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: number) {
    const response = await this.request<ApiResponse>(`/employees/${id}`, {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch employee');
  }

  /**
   * Create employee baru
   */
  async createEmployee(employeeData: any) {
    const response = await this.request<ApiResponse>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create employee');
  }

  /**
   * Update employee
   */
  async updateEmployee(id: number, employeeData: any) {
    const response = await this.request<ApiResponse>(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update employee');
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id: number) {
    const response = await this.request<ApiResponse>(`/employees/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to delete employee');
  }
}

export const apiClient = new ApiClient();
