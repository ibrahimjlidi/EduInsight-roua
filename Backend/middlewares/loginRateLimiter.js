const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const loginRateLimiter = (req, res, next) => {
  const key = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const current = attempts.get(key) || { count: 0, resetAt: now + WINDOW_MS };

  if (now > current.resetAt) {
    current.count = 0;
    current.resetAt = now + WINDOW_MS;
  }

  current.count += 1;
  attempts.set(key, current);

  if (current.count > MAX_ATTEMPTS) {
    return res.status(429).json({ message: "Too many login attempts. Please try again later." });
  }

  next();
};

module.exports = loginRateLimiter;
