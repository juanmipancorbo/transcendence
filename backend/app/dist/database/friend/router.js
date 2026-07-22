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
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const EPSchema = __importStar(require("@endpoints/friend-request"));
const validation_middelwares_1 = require("@utils/validation-middelwares");
const auth_middleware_1 = require("../../middleware/auth-middleware");
const router = (0, express_1.Router)();
exports.router = router;
// Every friend action is scoped to the authenticated user.
router.use(auth_middleware_1.authMiddleware);
// Friends
router.get("/", controller_1.getFriends);
router.get("/profiles", controller_1.getFriendProfiles);
router.get("/status/:id", (0, validation_middelwares_1.validateParams)(EPSchema.FriendParamReqSchema), controller_1.getFriendStatus);
router.delete("/", (0, validation_middelwares_1.validateBody)(EPSchema.FriendTargetReqSchema), controller_1.removeFriend);
// Friend requests
router.get("/requests/incoming", controller_1.getIncomingRequests);
router.get("/requests/outgoing", controller_1.getOutgoingRequests);
router.post("/requests", (0, validation_middelwares_1.validateBody)(EPSchema.FriendTargetReqSchema), controller_1.sendRequest);
router.post("/requests/accept", (0, validation_middelwares_1.validateBody)(EPSchema.RespondRequestReqSchema), controller_1.acceptRequest);
router.post("/requests/decline", (0, validation_middelwares_1.validateBody)(EPSchema.RespondRequestReqSchema), controller_1.declineRequest);
router.delete("/requests", (0, validation_middelwares_1.validateBody)(EPSchema.FriendTargetReqSchema), controller_1.cancelRequest);
