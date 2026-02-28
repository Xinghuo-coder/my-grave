/**
 * 坟墓信息加密服务
 *
 * 目标：
 * - 登录账号的坟墓信息按账号独立加密后再落库
 * - 同一条密文仅可通过对应账号衍生密钥解密
 *
 * 方案：
 * - 主密钥：GRAVE_ENCRYPTION_MASTER_KEY（环境变量）
 * - 用户密钥：HKDF(masterKey, userId)
 * - 算法：AES-256-GCM
 * - 密文格式：enc:v1:<ivBase64Url>:<tagBase64Url>:<cipherBase64Url>
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from 'crypto';

type FieldKind = 'text' | 'json' | 'date' | 'number';

interface FieldMapping {
  kind: FieldKind;
  keys: string[];
}

export class GraveEncryptionService {
  private static readonly ENCRYPTION_PREFIX = 'enc:v1:';
  private static readonly ENCRYPTION_VERSION = 'v1';
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12;
  private static readonly AUTH_TAG_LENGTH = 16;

  private static cachedMasterKey: Buffer | null = null;

  /**
   * 需要加密的字段（兼容 camelCase 与 snake_case）
   */
  private static readonly ENCRYPTED_FIELD_MAPPINGS: FieldMapping[] = [
    { kind: 'text', keys: ['deceasedName', 'deceased_name'] },
    { kind: 'date', keys: ['deceasedBirthDate', 'deceased_birth_date'] },
    { kind: 'date', keys: ['deceasedDeathDate', 'deceased_death_date'] },
    { kind: 'number', keys: ['deceasedAge', 'deceased_age'] },

    { kind: 'text', keys: ['epitaph'] },
    { kind: 'text', keys: ['lifeOverview', 'life_overview'] },
    { kind: 'text', keys: ['selfEvaluation', 'self_evaluation'] },
    { kind: 'text', keys: ['othersEvaluation', 'others_evaluation'] },
    { kind: 'text', keys: ['influenceOnOthers', 'influence_on_others'] },

    { kind: 'json', keys: ['wishesBeforeDeath', 'wishes_before_death'] },
    { kind: 'json', keys: ['video'] },
    { kind: 'json', keys: ['photos'] },

    { kind: 'text', keys: ['will'] },
    { kind: 'text', keys: ['willDocUrl', 'will_doc_url'] },
    { kind: 'text', keys: ['inheritancePlan', 'inheritance_plan'] },
    { kind: 'text', keys: ['inheritancePlanUrl', 'inheritance_plan_url'] },

    { kind: 'json', keys: ['socialAccounts', 'social_accounts'] },
  ];

  /**
   * 判断文本是否已加密
   */
  static isEncrypted(value: string): boolean {
    return typeof value === 'string' && value.startsWith(this.ENCRYPTION_PREFIX);
  }

  /**
   * 对单个文本进行加密
   */
  static encryptText(plainText: string, userId: number): string {
    if (plainText.length === 0 || this.isEncrypted(plainText)) {
      return plainText;
    }

    const userKey = this.deriveUserKey(userId);
    const iv = randomBytes(this.IV_LENGTH);

    const cipher = createCipheriv(this.ALGORITHM, userKey, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      'enc',
      this.ENCRYPTION_VERSION,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  /**
   * 对单个文本进行解密
   */
  static decryptText(encryptedText: string, userId: number): string {
    if (!this.isEncrypted(encryptedText)) {
      return encryptedText;
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== this.ENCRYPTION_VERSION) {
      throw new Error('密文格式无效');
    }

    const iv = Buffer.from(parts[2], 'base64url');
    const authTag = Buffer.from(parts[3], 'base64url');
    const cipherText = Buffer.from(parts[4], 'base64url');

    if (iv.length !== this.IV_LENGTH) {
      throw new Error('密文 IV 长度无效');
    }

    if (authTag.length !== this.AUTH_TAG_LENGTH) {
      throw new Error('密文认证标签长度无效');
    }

    const userKey = this.deriveUserKey(userId);
    const decipher = createDecipheriv(this.ALGORITHM, userKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    return decrypted.toString('utf8');
  }

  /**
   * 对坟墓数据进行字段级加密（存储前调用）
   */
  static encryptGravePayload<T extends Record<string, unknown>>(userId: number, payload: T): T {
    return this.transformPayload(payload, userId, 'encrypt') as T;
  }

  /**
   * 对坟墓数据进行字段级解密（读取后调用）
   */
  static decryptGravePayload<T extends Record<string, unknown>>(userId: number, payload: T): T {
    return this.transformPayload(payload, userId, 'decrypt') as T;
  }

  private static transformPayload(
    payload: Record<string, unknown>,
    userId: number,
    mode: 'encrypt' | 'decrypt'
  ): Record<string, unknown> {
    const cloned: Record<string, unknown> = { ...payload };

    for (const mapping of this.ENCRYPTED_FIELD_MAPPINGS) {
      for (const key of mapping.keys) {
        if (!Object.prototype.hasOwnProperty.call(payload, key)) {
          continue;
        }

        const value = payload[key];
        if (value === undefined || value === null) {
          continue;
        }

        cloned[key] = mode === 'encrypt'
          ? this.encryptByKind(value, mapping.kind, userId)
          : this.decryptByKind(value, mapping.kind, userId);
      }
    }

    return cloned;
  }

  private static encryptByKind(value: unknown, kind: FieldKind, userId: number): string {
    switch (kind) {
      case 'text':
        return this.encryptText(String(value), userId);
      case 'json':
        return this.encryptText(JSON.stringify(value), userId);
      case 'date': {
        const dateValue = value instanceof Date ? value.toISOString() : String(value);
        return this.encryptText(dateValue, userId);
      }
      case 'number':
        return this.encryptText(String(value), userId);
      default:
        return this.encryptText(String(value), userId);
    }
  }

  private static decryptByKind(value: unknown, kind: FieldKind, userId: number): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const decrypted = this.decryptText(value, userId);

    switch (kind) {
      case 'text':
        return decrypted;
      case 'json':
        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }
      case 'date': {
        const date = new Date(decrypted);
        return Number.isNaN(date.getTime()) ? decrypted : date;
      }
      case 'number': {
        const num = Number(decrypted);
        return Number.isNaN(num) ? decrypted : num;
      }
      default:
        return decrypted;
    }
  }

  /**
   * 生成用户级别密钥（同用户稳定，不同用户不同）
   */
  private static deriveUserKey(userId: number): Buffer {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('无效的 userId，无法生成用户加密密钥');
    }

    const masterKey = this.getMasterKey();
    const salt = Buffer.from('mygrave-grave-data-salt-v1', 'utf8');
    const info = Buffer.from(`grave-user-${userId}`, 'utf8');

    const derived = hkdfSync('sha256', masterKey, salt, info, 32);
    return Buffer.isBuffer(derived) ? derived : Buffer.from(derived);
  }

  /**
   * 获取主密钥（固定 32 字节）
   */
  private static getMasterKey(): Buffer {
    if (this.cachedMasterKey) {
      return this.cachedMasterKey;
    }

    const raw = (process.env.GRAVE_ENCRYPTION_MASTER_KEY || '').trim();

    if (!raw) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('生产环境必须配置 GRAVE_ENCRYPTION_MASTER_KEY');
      }

      // 开发环境回退：仅用于本地调试
      this.cachedMasterKey = createHash('sha256')
        .update('mygrave-dev-grave-encryption-master-key')
        .digest();

      // eslint-disable-next-line no-console
      console.warn('⚠️ 未配置 GRAVE_ENCRYPTION_MASTER_KEY，当前使用开发环境回退密钥');
      return this.cachedMasterKey;
    }

    // 优先支持 64 位 hex（32 字节）
    if (/^[a-fA-F0-9]{64}$/.test(raw)) {
      this.cachedMasterKey = Buffer.from(raw, 'hex');
      return this.cachedMasterKey;
    }

    // 支持 base64 或普通字符串，统一 hash 到 32 字节
    let keyMaterial: Buffer;
    try {
      const decoded = Buffer.from(raw, 'base64');
      keyMaterial = decoded.length > 0 ? decoded : Buffer.from(raw, 'utf8');
    } catch {
      keyMaterial = Buffer.from(raw, 'utf8');
    }

    this.cachedMasterKey = createHash('sha256').update(keyMaterial).digest();
    return this.cachedMasterKey;
  }
}
