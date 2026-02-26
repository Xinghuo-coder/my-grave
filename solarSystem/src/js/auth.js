// API 基础URL
const API_BASE = 'http://localhost:3000/api';

// 全局状态
let currentForm = 'login';
let forgotPasswordData = {};
let codeTimers = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 检查登录状态
  checkAuthStatus();

  // 绑定表单提交事件
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('forgotStep1Form').addEventListener('submit', handleForgotStep1);
  document.getElementById('forgotStep2Form').addEventListener('submit', handleForgotStep2);
  document.getElementById('forgotStep3Form').addEventListener('submit', handleForgotStep3);
});

// ============ 表单切换 ============

function showForm(formName) {
  // 隐藏所有表单
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });

  // 显示目标表单
  const targetForm = document.getElementById(`${formName}-form`);
  if (targetForm) {
    targetForm.classList.add('active');
    currentForm = formName;

    // 重置忘记密码步骤
    if (formName === 'forgot') {
      showForgotStep(1);
      forgotPasswordData = {};
    }
  }
}

function showForgotStep(step) {
  document.querySelectorAll('.forgot-step').forEach(s => s.classList.remove('active'));
  document.getElementById(`forgot-step${step}`).classList.add('active');
}

// ============ 消息提示 ============

function showMessage(text, type = 'info') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type} show`;

  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}

// ============ 验证码相关 ============

function sendCode(type, purpose) {
  // 只支持邮箱验证码
  if (type !== 'email') {
    showMessage('当前只支持邮箱验证，手机号短信验证暂未开放', 'error');
    return;
  }

  const btn = document.getElementById('email-code-btn');
  const input = document.getElementById('reg-email');
  const target = input.value.trim();

  if (!target) {
    showMessage('请先输入邮箱', 'error');
    input.focus();
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    showMessage('请输入有效的邮箱地址', 'error');
    return;
  }

  // 发送验证码
  btn.disabled = true;
  
  fetch(`${API_BASE}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'email', target, purpose })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showMessage(data.message, 'success');
        
        // 显示验证码（开发环境）
        if (data.code) {
          console.log(`🔐 验证码: ${data.code}`);
          showMessage(`验证码已发送: ${data.code}`, 'info');
        }
        
        // 倒计时
        startCountdown(btn, 60);
      } else {
        showMessage(data.message, 'error');
        btn.disabled = false;
      }
    })
    .catch(err => {
      console.error('发送验证码失败:', err);
      showMessage('发送失败，请重试', 'error');
      btn.disabled = false;
    });
}

function sendResetCode() {
  const btn = document.getElementById('reset-code-btn');
  const target = forgotPasswordData.email;

  if (!target) {
    showMessage('无法获取邮箱信息', 'error');
    return;
  }

  btn.disabled = true;

  fetch(`${API_BASE}/auth/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      type: 'email', 
      target, 
      purpose: 'reset_password' 
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showMessage(data.message, 'success');
        
        // 显示验证码（开发环境）
        if (data.code) {
          console.log(`🔐 验证码: ${data.code}`);
          showMessage(`验证码已发送: ${data.code}`, 'info');
        }
        
        startCountdown(btn, 60);
      } else {
        showMessage(data.message, 'error');
        btn.disabled = false;
      }
    })
    .catch(err => {
      console.error('发送验证码失败:', err);
      showMessage('发送失败，请重试', 'error');
      btn.disabled = false;
    });
}

function startCountdown(btn, seconds) {
  let count = seconds;
  const originalText = btn.textContent;
  
  const timer = setInterval(() => {
    btn.textContent = `${count}秒后重试`;
    count--;

    if (count < 0) {
      clearInterval(timer);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }, 1000);
}

// ============ 登录 ============

async function handleLogin(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      showMessage('登录成功！', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      showMessage(result.message, 'error');
    }
  } catch (error) {
    console.error('登录失败:', error);
    showMessage('登录失败，请重试', 'error');
  }
}

// ============ 注册 ============

async function handleRegister(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // 验证密码长度
  if (data.password.length < 6) {
    showMessage('密码至少需要6位', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      showMessage('注册成功！正在跳转...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      showMessage(result.message, 'error');
    }
  } catch (error) {
    console.error('注册失败:', error);
    showMessage('注册失败，请重试', 'error');
  }
}

// ============ 忘记密码 ============

async function handleForgotStep1(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const username = formData.get('username');

  try {
    const response = await fetch(`${API_BASE}/auth/get-security-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username })
    });

    const result = await response.json();

    if (result.success) {
      forgotPasswordData.username = username;
      document.getElementById('security-question-display').textContent = result.securityQuestion;
      document.getElementById('masked-email').textContent = `(${result.email})`;
      document.getElementById('masked-phone').textContent = `(${result.phone})`;
      showForgotStep(2);
    } else {
      showMessage(result.message, 'error');
    }
  } catch (error) {
    console.error('获取安全问题失败:', error);
    showMessage('操作失败，请重试', 'error');
  }
}

async function handleForgotStep2(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const answer = formData.get('answer');

  try {
    const response = await fetch(`${API_BASE}/auth/verify-security-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        username: forgotPasswordData.username, 
        answer 
      })
    });

    const result = await response.json();

    if (result.success) {
      forgotPasswordData.email = result.email;
      forgotPasswordData.phone = result.phone;
      showForgotStep(3);
      
      // 显示邮箱信息
      const maskedEmail = maskString(result.email, 'email');
      document.getElementById('masked-email').textContent = maskedEmail;
      
      showMessage('验证成功，请通过邮箱验证找回密码', 'success');
    } else {
      showMessage(result.message, 'error');
    }
  } catch (error) {
    console.error('验证安全答案失败:', error);
    showMessage('验证失败，请重试', 'error');
  }
}

async function handleForgotStep3(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // 验证密码
  if (data.newPassword.length < 6) {
    showMessage('密码至少需要6位', 'error');
    return;
  }

  if (data.newPassword !== data.confirmPassword) {
    showMessage('两次输入的密码不一致', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: forgotPasswordData.username,
        newPassword: data.newPassword,
      body: JSON.stringify({
        username: forgotPasswordData.username,
        newPassword: data.newPassword,
        verificationCode: data.code,
        verificationType: 'email'  // 固定使用邮箱验证
      })
    });

    const result = await response.json();

    if (result.success) {
      showMessage('密码重置成功！正在跳转到登录页...', 'success');
      setTimeout(() => {
        showForm('login');
      }, 2000);
    } else {
      showMessage(result.message, 'error');
    }
  } catch (error) {
    console.error('重置密码失败:', error);
    showMessage('重置失败，请重试', 'error');
  }
}

// ============ 检查登录状态 ============

async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE}/auth/check`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.authenticated) {
      // 已登录，跳转到主页
      window.location.href = '/';
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
  }
}
