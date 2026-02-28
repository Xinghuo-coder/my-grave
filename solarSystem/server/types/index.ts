/**
 * 类型定义 - 应用全局类型
 */

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface AuthResponse {
  token?: string;
  user?: {
    id: number;
    username: string;
    email: string;
    isVerified: boolean;
  };
  expiresIn?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DatabaseConfig {
  type: 'mysql' | 'sqlite' | 'postgresql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filepath?: string;
}

export interface SessionData {
  userId: number;
  username: string;
  email: string;
  isVerified: boolean;
}

export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  uptime: number;
}

export interface HealthMetrics {
  databaseConnected: boolean;
  uptime: number;
  memoryUsage: number;
  requestCount: number;
  errorCount: number;
}
