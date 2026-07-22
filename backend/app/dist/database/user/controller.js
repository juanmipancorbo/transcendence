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
exports.getProfile = getProfile;
exports.updateUsername = updateUsername;
exports.updateBio = updateBio;
exports.updateAvatar = updateAvatar;
const Service = __importStar(require("./service"));
const socket_1 = require("@gameLogic/sync/socket");
function getProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield Service.readProfile(req.params.id);
        (0, socket_1.injectStatus)([data]);
        res.status(200).json({ success: true, data });
    });
}
function updateUsername(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, data: "User not authenticated" });
        }
        if (!(yield Service.updateUsername(userId, req.body.username)))
            return res.status(404).json({ success: false, data: "User likely doesn't exist" });
        res.status(200).json({ success: true, data: null });
    });
}
function updateBio(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ success: false, data: "User not authenticated" });
        }
        if (!(yield Service.updateBio(userId, req.body.bio)))
            return res.status(404).json({ success: false, data: "User likely doesn't exist" });
        res.status(200).json({ success: true, data: null });
    });
}
function updateAvatar(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.userId;
        const file = req.file;
        if (!userId) {
            return res.status(401).json({ success: false, data: "User not authenticated" });
        }
        if (!(file === null || file === void 0 ? void 0 : file.filename)) {
            return res.status(400).json({ success: false, data: "No image file provided" });
        }
        try {
            const avatarUrl = `/uploads/avatars/${file.filename}`;
            const savedAvatarUrl = yield Service.updateAvatar(userId, avatarUrl);
            return res.status(200).json({ success: true, data: { avatarUrl: savedAvatarUrl } });
        }
        catch (e) {
            return res.status(500).json({ success: false, data: "Unknown error" });
        }
    });
}
