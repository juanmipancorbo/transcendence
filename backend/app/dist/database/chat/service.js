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
exports.addChatMessage = addChatMessage;
exports.readChatHistory = readChatHistory;
const Repo = __importStar(require("./repository"));
const error_1 = require("@utils/error");
const DEFAULT_LIMIT = 50;
// Store a message from one user to another.
function addChatMessage(senderId, receiverId, content) {
    return __awaiter(this, void 0, void 0, function* () {
        if (senderId === receiverId)
            throw (new error_1.ApiError("INVALID_CREDENTIAL", 400));
        return Repo.insertMessage(senderId, receiverId, content);
    });
}
// Read the conversation between the current user and another user.
function readChatHistory(userId, otherId, limit, before) {
    return __awaiter(this, void 0, void 0, function* () {
        if (userId === otherId)
            throw (new error_1.ApiError("INVALID_CREDENTIAL", 400));
        const chatId = yield Repo.selectChatId(userId, otherId);
        if (!chatId)
            throw (new error_1.ApiError("NOT_FRIENDS", 404));
        return Repo.selectChatHistory(chatId, limit !== null && limit !== void 0 ? limit : DEFAULT_LIMIT, before);
    });
}
