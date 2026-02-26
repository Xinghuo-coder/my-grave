const http = require('http');

console.log('🧪 开始测试登录功能...\n');

// 测试配置
const API_BASE = 'http://localhost:3000';
const tests = [];
let passedTests = 0;
let failedTests = 0;

// 辅助函数：发送HTTP请求
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// 测试函数
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${error.message}`);
    failedTests++;
  }
}

// 主测试流程
async function runTests() {
  // 测试1: 服务器健康检查
  await test('服务器健康检查', async () => {
    const res = await makeRequest('GET', '/api/health');
    if (res.status !== 200) throw new Error('服务器响应异常');
    if (!res.data.status === 'ok') throw new Error('健康检查失败');
  });

  // 测试2: 发送邮箱验证码
  await test('发送邮箱验证码', async () => {
    const res = await makeRequest('POST', '/api/auth/send-code', {
      type: 'email',
      target: 'test@example.com',
      purpose: 'register'
    });
    if (!res.data.success) throw new Error(res.data.message);
  });

  // 测试3: 发送手机验证码
  await test('发送手机验证码', async () => {
    const res = await makeRequest('POST', '/api/auth/send-code', {
      type: 'phone',
      target: '13800138000',
      purpose: 'register'
    });
    if (!res.data.success) throw new Error(res.data.message);
  });

  // 测试4: 检查未登录状态
  await test('检查未登录状态', async () => {
    const res = await makeRequest('GET', '/api/auth/check');
    if (res.data.authenticated !== false) throw new Error('应该返回未登录状态');
  });

  // 测试5: 无效登录
  await test('无效登录测试', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      username: 'nonexistent',
      password: 'wrongpassword'
    });
    if (res.status === 200) throw new Error('应该返回401错误');
  });

  // 输出测试结果
  console.log('\n====================================');
  console.log('📊 测试结果汇总');
  console.log('====================================');
  console.log(`✅ 通过: ${passedTests} 个测试`);
  console.log(`❌ 失败: ${failedTests} 个测试`);
  console.log(`📈 成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('====================================\n');

  if (failedTests === 0) {
    console.log('🎉 所有测试通过！系统运行正常。\n');
    console.log('📝 下一步：');
    console.log('   1. 访问 http://localhost:8095/auth.html 注册账号');
    console.log('   2. 使用注册的账号登录');
    console.log('   3. 体验太阳系可视化功能\n');
  } else {
    console.log('⚠️  部分测试失败，请检查：');
    console.log('   1. 后端服务器是否正常运行（npm run server:dev）');
    console.log('   2. 数据库文件是否正常创建');
    console.log('   3. 网络连接是否正常\n');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('\n❌ 测试运行失败:', error.message);
  console.error('\n请确保后端服务器正在运行:');
  console.error('   npm run server:dev\n');
  process.exit(1);
});
