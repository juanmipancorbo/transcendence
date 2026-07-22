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
exports.sendFriendRequest = sendFriendRequest;
exports.acceptFriendRequest = acceptFriendRequest;
exports.declineFriendRequest = declineFriendRequest;
exports.cancelFriendRequest = cancelFriendRequest;
exports.removeFriend = removeFriend;
exports.readFriends = readFriends;
exports.readFriendProfiles = readFriendProfiles;
exports.readIncomingRequests = readIncomingRequests;
exports.readOutgoingRequests = readOutgoingRequests;
exports.areFriends = areFriends;
const Repo = __importStar(require("./repository"));
const pg_1 = require("pg");
const error_1 = require("@utils/error");
// Send a friend request from senderId to receiverId. Rejects self-requests,
// duplicate requests and requests between users that are already friends.
function sendFriendRequest(senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (senderId === receiverId)
            throw (new error_1.ApiError("INVALID_CREDENTIAL", 400));
        if (yield Repo.selectAreFriends(senderId, receiverId))
            throw (new error_1.ApiError("ALREADY_FRIENDS", 409));
        // If the other side already invited us, just accept it instead of stacking a request.
        if (yield Repo.selectFriendRequest(receiverId, senderId)) {
            yield Repo.acceptFriendRequest(receiverId, senderId);
            return;
        }
        try {
            yield Repo.insertFriendRequest(senderId, receiverId);
        }
        catch (err) {
            if (!(err instanceof pg_1.DatabaseError) || err.code !== "23505")
                throw err;
            throw (new error_1.ApiError("ALREADY_REQUESTED", 409));
        }
    });
}
// Accept a request that senderId sent to receiverId (the current user).
function acceptFriendRequest(receiverId, senderId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield Repo.selectFriendRequest(senderId, receiverId)))
            throw (new error_1.ApiError("REQUEST_NOT_FOUND", 404));
        yield Repo.acceptFriendRequest(senderId, receiverId);
    });
}
// Decline a request that senderId sent to receiverId (the current user).
function declineFriendRequest(receiverId, senderId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield Repo.selectFriendRequest(senderId, receiverId)))
            throw (new error_1.ApiError("REQUEST_NOT_FOUND", 404));
        yield Repo.deleteFriendRequest(senderId, receiverId);
    });
}
// Cancel a request the current user (senderId) sent to receiverId.
function cancelFriendRequest(senderId, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield Repo.selectFriendRequest(senderId, receiverId)))
            throw (new error_1.ApiError("REQUEST_NOT_FOUND", 404));
        yield Repo.deleteFriendRequest(senderId, receiverId);
    });
}
function removeFriend(userId, friendId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield Repo.selectAreFriends(userId, friendId)))
            throw (new error_1.ApiError("NOT_FRIENDS", 404));
        yield Repo.deleteFriend(userId, friendId);
    });
}
function readFriends(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.selectFriends(userId);
    });
}
function readFriendProfiles(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.selectFriendProfiles(userId);
    });
}
function readIncomingRequests(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.selectIncomingRequests(userId);
    });
}
function readOutgoingRequests(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.selectOutgoingRequests(userId);
    });
}
function areFriends(userId, friendId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Repo.selectAreFriends(userId, friendId);
    });
}
