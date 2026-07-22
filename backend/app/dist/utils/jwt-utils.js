"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
}
exports.tokenUtils = {
    signAccessToken(payload) {
        return jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { tokenType: 'access' }), JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    },
    signRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { tokenType: 'refresh' }), JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    },
    verifyAccessToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (payload.tokenType !== 'access')
                throw new Error();
            return payload;
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    },
    verifyRefreshToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (payload.tokenType !== 'refresh')
                throw new Error();
            return payload;
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    },
    decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
};
