"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const controller_1 = require("./controller");
const EPSchema = __importStar(require("@endpoints/users-request"));
const validation_middelwares_1 = require("@utils/validation-middelwares");
const auth_middleware_1 = require("../../middleware/auth-middleware");
const router = (0, express_1.Router)();
exports.router = router;
const uploadDir = path_1.default.resolve(process.cwd(), "uploads", "avatars");
fs_1.default.mkdirSync(uploadDir, { recursive: true });
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const mimeToExtension = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
};
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        var _a;
        const ext = (_a = mimeToExtension[file.mimetype]) !== null && _a !== void 0 ? _a : ".jpg";
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, uniqueName);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: MAX_AVATAR_SIZE_BYTES,
    },
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype))
            return cb(null, true);
        cb(new Error("Only JPG, PNG, and WebP images up to 5MB are allowed"));
    },
});
// Profile routes
router.get("/profile/:id", (0, validation_middelwares_1.validateParams)(EPSchema.ProfileReqSchema), controller_1.getProfile);
router.patch("/username", auth_middleware_1.authMiddleware, (0, validation_middelwares_1.validateBody)(EPSchema.FullUserReqSchema), controller_1.updateUsername);
router.patch("/bio", auth_middleware_1.authMiddleware, (0, validation_middelwares_1.validateBody)(EPSchema.UpdateBioReqSchema), controller_1.updateBio);
router.post("/avatar", auth_middleware_1.authMiddleware, (req, res, _next) => {
    upload.single("avatar")(req, res, (err) => {
        if (err) {
            const message = err instanceof multer_1.default.MulterError
                ? (err.code === "LIMIT_FILE_SIZE"
                    ? "Image must be 5MB or smaller."
                    : err.message)
                : err instanceof Error
                    ? err.message
                    : "Unknown upload error";
            return res.status(400).json({ success: false, data: message });
        }
        return (0, controller_1.updateAvatar)(req, res);
    });
});
