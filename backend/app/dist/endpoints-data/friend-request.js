"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendParamReqSchema = exports.RespondRequestReqSchema = exports.FriendTargetReqSchema = void 0;
const zod_1 = __importDefault(require("zod"));
// Send / cancel a friend request, or remove an existing friend: the other
// user is identified by their id.
exports.FriendTargetReqSchema = zod_1.default.strictObject({
    userId: zod_1.default.uuid(),
});
// Accept / decline an incoming request: identified by the user who sent it.
exports.RespondRequestReqSchema = zod_1.default.strictObject({
    senderId: zod_1.default.uuid(),
});
// Route param for friendship lookups (/friends/status/:id).
exports.FriendParamReqSchema = zod_1.default.strictObject({
    id: zod_1.default.uuid(),
});
