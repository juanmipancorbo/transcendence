"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const error_1 = require("@utils/error");
const errorHandler = (err, req, res, next) => {
    if (err instanceof error_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            data: err.message,
        });
    }
    // Fallback for unexpected errors
    res.status(500).json({
        success: false,
        data: "Internal Server Error",
    });
};
exports.errorHandler = errorHandler;
