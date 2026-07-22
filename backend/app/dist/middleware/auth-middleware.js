"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_utils_1 = require("@utils/jwt-utils");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    try {
        const payload = jwt_utils_1.tokenUtils.verifyAccessToken(token);
        req.userId = payload.id;
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
