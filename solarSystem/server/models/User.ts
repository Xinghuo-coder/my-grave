/**
 * 用户模型 - TypeScript 版本
 */

interface IUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  lastLogin?: Date;
}

class User implements IUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  lastLogin?: Date;

  constructor(data: Partial<IUser>) {
    this.id = data.id || 0;
    this.username = data.username || '';
    this.email = data.email || '';
    this.passwordHash = data.passwordHash || '';
    this.salt = data.salt || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isVerified = data.isVerified || false;
    this.lastLogin = data.lastLogin;
  }

  /**
   * 转换为 JSON（排除敏感信息）
   */
  toJSON(): Omit<IUser, 'passwordHash' | 'salt'> {
    const { passwordHash, salt, ...rest } = this;
    return rest as Omit<IUser, 'passwordHash' | 'salt'>;
  }
}

export { User, IUser };
