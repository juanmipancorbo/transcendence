"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameReqSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.GameReqSchema = zod_1.default.strictObject({
    id: zod_1.default.uuid(),
});
