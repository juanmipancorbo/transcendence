"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const zod_1 = require("zod");
function validateBody(bodyValidator) {
    return ((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            bodyValidator.parse(req.body);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const messages = err.issues.map((issue) => {
                    const path = issue.path.join(".");
                    return path ? `${path} ${issue.message}` : issue.message;
                });
                const uniqueMessages = Array.from(new Set(messages));
                return res.status(400).json({ success: false, error: uniqueMessages.join("; ") });
            }
            throw err;
        }
        next();
    }));
}
function validateQuery(queryValidator) {
    return ((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            queryValidator.parse(req.query);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const messages = err.issues.map((issue) => {
                    const path = issue.path.join(".");
                    return path ? `${path} ${issue.message}` : issue.message;
                });
                const uniqueMessages = Array.from(new Set(messages));
                return res.status(400).json({ success: false, error: uniqueMessages.join("; ") });
            }
            throw err;
        }
        next();
    }));
}
function validateParams(paramsValidator) {
    return ((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            paramsValidator.parse(req.params);
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const messages = err.issues.map((issue) => {
                    const path = issue.path.join(".");
                    return path ? `${path} ${issue.message}` : issue.message;
                });
                const uniqueMessages = Array.from(new Set(messages));
                return res.status(400).json({ success: false, error: uniqueMessages.join("; ") });
            }
            throw err;
        }
        next();
    }));
}
