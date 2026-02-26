/**
 * Google Secret Manager 集成
 * 用于从 Google Cloud Secret Manager 安全地获取敏感配置
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

class SecretsManager {
  constructor() {
    this.client = null;
    this.projectId = process.env.GCP_PROJECT_ID;
    this.useSecretManager = process.env.USE_SECRET_MANAGER === 'true';
    this.cache = new Map(); // 缓存已获取的密钥
  }

  /**
   * 初始化 Secret Manager 客户端
   */
  async init() {
    if (!this.useSecretManager) {
      console.log('📋 Using environment variables (Secret Manager disabled)');
      return;
    }

    try {
      this.client = new SecretManagerServiceClient();
      console.log('✅ Secret Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Secret Manager:', error.message);
      throw error;
    }
  }

  /**
   * 获取密钥值
   * @param {string} secretName - 密钥名称
   * @param {string} fallbackEnvVar - 回退的环境变量名
   * @returns {Promise<string>} 密钥值
   */
  async getSecret(secretName, fallbackEnvVar = null) {
    // 如果不使用 Secret Manager，直接返回环境变量
    if (!this.useSecretManager) {
      return process.env[fallbackEnvVar] || '';
    }

    // 检查缓存
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName);
    }

    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.client.accessSecretVersion({ name });
      const secretValue = version.payload.data.toString('utf8');
      
      // 缓存密钥值
      this.cache.set(secretName, secretValue);
      
      return secretValue;
    } catch (error) {
      console.error(`❌ Failed to get secret ${secretName}:`, error.message);
      
      // 回退到环境变量
      if (fallbackEnvVar && process.env[fallbackEnvVar]) {
        console.warn(`⚠️  Using fallback env var: ${fallbackEnvVar}`);
        return process.env[fallbackEnvVar];
      }
      
      throw error;
    }
  }

  /**
   * 获取所有必需的密钥
   * @returns {Promise<Object>} 包含所有密钥的对象
   */
  async getAllSecrets() {
    const secrets = {
      sessionSecret: await this.getSecret(
        process.env.SECRET_SESSION_KEY || 'session-secret',
        'SESSION_SECRET'
      ),
      dbPassword: await this.getSecret(
        process.env.SECRET_DB_PASSWORD || 'db-password',
        'DB_PASSWORD'
      ),
      smtpPassword: await this.getSecret(
        process.env.SECRET_SMTP_PASSWORD || 'smtp-password',
        'SMTP_PASS'
      ),
      smsApiKey: await this.getSecret(
        process.env.SECRET_SMS_API_KEY || 'sms-api-key',
        'SMS_AUTH_TOKEN'
      )
    };

    return secrets;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// 导出单例
const secretsManager = new SecretsManager();

module.exports = secretsManager;
