export const API_BASE_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

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

    const headers: any = {
      ...options.headers,
    };

    // Only set Content-Type to application/json if not sending FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Jika 401 Unauthorized dan bukan di endpoint login, coba refresh token
      if (response.status === 401 && endpoint !== '/auth/login' && retryCount === 0) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, options, retryCount + 1);
        }
        // Token refresh gagal, clear tokens dan redirect ke login
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }

      // Jika 403 Forbidden dan bukan di login, kemungkinan besar token valid tapi payload salah (state mismatch)
      // Kita redirect ke login agar user dapat token baru yang fresh
      if (response.status === 403 && endpoint !== '/auth/login') {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Access denied. Please login again.');
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
      body: userData instanceof FormData ? userData : JSON.stringify(userData),
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
      body: userData instanceof FormData ? userData : JSON.stringify(userData),
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

  // ============= CATEGORY ENDPOINTS =============

  async getCategories() {
    const response = await this.request<ApiResponse>('/categories?limit=100', { method: 'GET' });
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch categories');
  }

  async createCategory(name: string) {
    const response = await this.request<ApiResponse>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to create category');
  }

  async updateCategory(id: number, name: string) {
    const response = await this.request<ApiResponse>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to update category');
  }

  async deleteCategory(id: number) {
    const response = await this.request<ApiResponse>(`/categories/${id}`, { method: 'DELETE' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to delete category');
  }

  // ============= TOPPING ENDPOINTS =============

  async getToppings() {
    const response = await this.request<ApiResponse>('/toppings', { method: 'GET' });
    if (response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch toppings');
  }

  async createTopping(data: { name: string; price: number }) {
    const response = await this.request<ApiResponse>('/toppings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to create topping');
  }

  async updateTopping(id: number, data: { name?: string; price?: number; isAvailable?: boolean }) {
    const response = await this.request<ApiResponse>(`/toppings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to update topping');
  }

  async deleteTopping(id: number) {
    const response = await this.request<ApiResponse>(`/toppings/${id}`, { method: 'DELETE' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to delete topping');
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
      body: employeeData instanceof FormData ? employeeData : JSON.stringify(employeeData),
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
      body: employeeData instanceof FormData ? employeeData : JSON.stringify(employeeData),
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

  // ============= DISCOUNT ENDPOINTS =============

  /**
   * Get semua discounts
   */
  async getDiscounts() {
    const response = await this.request<ApiResponse>('/discounts', {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch discounts');
  }

  /**
   * Create discount baru
   */
  async createDiscount(discountData: any) {
    const response = await this.request<ApiResponse>('/discounts', {
      method: 'POST',
      body: JSON.stringify(discountData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to create discount');
  }

  /**
   * Update discount
   */
  async updateDiscount(id: number, discountData: any) {
    const response = await this.request<ApiResponse>(`/discounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(discountData),
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to update discount');
  }

  /**
   * Delete discount
   */
  async deleteDiscount(id: number) {
    const response = await this.request<ApiResponse>(`/discounts/${id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to delete discount');
  }

  /**
   * Get all menus
   */
  async getMenus(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/menus${query ? `?${query}` : ''}`;
    const response = await this.request<ApiResponse>(endpoint, {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Failed to fetch menus');
  }

  // == Transaction / Checkout Methods ==

  async createOrder(data: {
    customerName?: string;
    orderType?: string;
    notes?: string;
    items: Array<{ menuId: number; variantId?: number; qty: number; price: number; toppings?: { toppingId: number; price: number }[] }>;
  }) {
    const response = await this.request<ApiResponse>('/transactions/order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal membuat order');
  }

  async payOrder(transactionId: number, data: { paymentMethod: string; paidAmount: number }) {
    const response = await this.request<ApiResponse>(`/transactions/${transactionId}/pay`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal memproses pembayaran');
  }

  async getUnpaidOrders() {
    const response = await this.request<ApiResponse>('/transactions/unpaid', { method: 'GET' });
    if (response.success) return response.data ?? [];
    throw new Error(response.error || 'Gagal memuat pesanan belum dibayar');
  }

  async getTransactionDetail(id: number) {
    const response = await this.request<ApiResponse>(`/transactions/${id}`, { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal memuat detail transaksi');
  }

  async getTransactions(options?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const response = await this.request<ApiResponse>(`/transactions?${params.toString()}`, { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal mengambil daftar transaksi');
  }

  async createMenu(data: any) {
    const response = await this.request<ApiResponse>('/menus', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    if (response.success) return response.data || (response as any).menu;
    throw new Error(response.error || response.message || 'Failed to create menu');
  }

  async updateMenu(id: number, data: any) {
    const response = await this.request<ApiResponse>(`/menus/${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    if (response.success) return response.data || (response as any).menu;
    throw new Error(response.error || response.message || 'Failed to update menu');
  }

  async deleteMenu(id: number) {
    const response = await this.request<ApiResponse>(`/menus/${id}`, { method: 'DELETE' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Failed to delete menu');
  }


  /**
   * Verify discount code
   */
  async verifyDiscount(code: string) {
    const response = await this.request<ApiResponse>(`/discounts/verify/${code}`, {
      method: 'GET',
    });

    if (response.data) {
      return response.data;
    }

    throw new Error(response.error || 'Invalid discount code');
  }

  /**
   * Get image URL
   */
  getImageUrl(path: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
  }

  // == Report Methods ==

  async getDashboardStats() {
    const response = await this.request<ApiResponse>('/reports/dashboard-stats', { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal mengambil stats dashboard');
  }

  async getRevenueGraph(type: 'monthly' | 'daily' = 'daily') {
    const response = await this.request<ApiResponse>(`/reports/revenue-graph?type=${type}`, { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal mengambil grafik pendapatan');
  }

  async getFinancialSummary(start?: string, end?: string) {
    const query = start && end ? `?start=${start}&end=${end}` : '';
    const response = await this.request<ApiResponse>(`/reports/financial-summary${query}`, { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal mengambil laporan keuangan');
  }

  async getSalesByCategory(start?: string, end?: string) {
    const query = start && end ? `?start=${start}&end=${end}` : '';
    const response = await this.request<ApiResponse>(`/reports/sales-category${query}`, { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal mengambil laporan penjualan kategori');
  }

  async getSalesByProduct(start?: string, end?: string) {
    const query = start && end ? `?start=${start}&end=${end}` : '';
    const response = await this.request<ApiResponse>(`/reports/sales-product${query}`, { method: 'GET' });
    if (response.success) return response.data;
    throw new Error(response.error || response.message || 'Gagal mengambil laporan penjualan produk');
  }
}

export const apiClient = new ApiClient();
