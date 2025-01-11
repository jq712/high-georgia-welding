import { AppError } from "./errorHandlingMiddleware.js";

const authenticateSession = (req, res, next) => {
  // Check if it's an API request (starts with /api)
  const isApiRequest = req.path.startsWith('/api');

  if (!req.session || !req.session.user) {
    if (isApiRequest) {
      // For API requests, return JSON response
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    } else {
      // For page requests, redirect to login
      return res.redirect('/login');
    }
  }
  
  // User is authenticated, proceed
  res.locals.user = req.session.user;
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    const isApiRequest = req.path.startsWith('/api');

    if (!roles.includes(req.session.user.role)) {
      if (isApiRequest) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized'
        });
      } else {
        return res.redirect('/dashboard');
      }
    }
    next();
  };
};

export { authenticateSession, restrictTo };
