// 登录验证中间件
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
}

// 检查登录状态的中间件（不强制登录）
function checkAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.isAuthenticated = true;
    req.userId = req.session.userId;
    req.username = req.session.username;
  } else {
    req.isAuthenticated = false;
  }
  next();
}

module.exports = {
  requireAuth,
  checkAuth
};
