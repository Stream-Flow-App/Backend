const jwtHelper = require("../utils/jwt");
const User = require("../models/user.Model");
const cookie = require("../utils/cookie");

exports.checkAuthenticated = async (req, res, next) => {
  try {
    let accessToken, refreshToken;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      accessToken = req.cookies.accessToken;
    }

    refreshToken = req.cookies?.refreshToken;

    let decoded;
    if (accessToken) {
      try {
        decoded = jwtHelper.verifyToken(accessToken, "access");
      } catch (err) {
        decoded = null;
      }
    }

    if (!decoded && refreshToken) {
      try {
        const decodedRefresh = jwtHelper.verifyToken(refreshToken, "refresh");

        if (!decodedRefresh || !decodedRefresh.id) {
          return res
            .status(401)
            .json({ message: "Invalid refresh token payload." });
        }

        const user = await User.findById(decodedRefresh.id);
        if (!user)
          return res
            .status(401)
            .json({ message: "Invalid refresh token user." });

        if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
          return res.status(403).json({ message: "Your account has been suspended." });
        }

        const newAccessToken = jwtHelper.generateAccessToken(user);
        cookie.setAccessTokenCookie(res, newAccessToken);

        req.user = user;
        req.isAuthenticated = true;
        return next();
      } catch (err) {
        console.error("Refresh token invalid:", err);
        return res.status(401).json({ message: "Not authenticated!" });
      }
    }

    if (!decoded && !refreshToken) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found!" });
    }

    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      return res.status(403).json({ message: "Your account has been suspended." });
    }

    req.user = user;
    req.isAuthenticated = true;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong in auth check!" });
  }
};

exports.checkOptionalAuthenticated = async (req, res, next) => {
  try {
    let accessToken, refreshToken;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      accessToken = req.cookies.accessToken;
    }

    refreshToken = req.cookies?.refreshToken;

    let decoded;
    if (accessToken) {
      try {
        decoded = jwtHelper.verifyToken(accessToken, "access");
      } catch (err) {
        decoded = null;
      }
    }

    if (!decoded && refreshToken) {
      try {
        const decodedRefresh = jwtHelper.verifyToken(refreshToken, "refresh");

        if (decodedRefresh && decodedRefresh.id) {
          const user = await User.findById(decodedRefresh.id);
          if (user) {
            if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
              // User is banned
            } else {
              const newAccessToken = jwtHelper.generateAccessToken(user);
              cookie.setAccessTokenCookie(res, newAccessToken);
              req.user = user;
              req.isAuthenticated = true;
              return next();
            }
          }
        }
      } catch (err) {
        // Ignore refresh token errors for optional auth
      }
    }

    if (!decoded && !req.user) {
      req.user = null;
      req.isAuthenticated = false;
      return next();
    }

    if (decoded && !req.user) {
      const user = await User.findById(decoded.id);
      if (user && user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
        req.user = null;
        req.isAuthenticated = false;
      } else {
        req.user = user || null;
        req.isAuthenticated = !!user;
      }
    }
    
    next();
  } catch (err) {
    console.error(err);
    req.user = null;
    req.isAuthenticated = false;
    next();
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden! Insufficient permissions." });
    }
    next();
  };
};
