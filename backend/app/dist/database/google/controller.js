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
exports.login = login;
const service_1 = require("@databaseAccess/auth/service");
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!clientId || !clientSecret || !redirectUri)
            return res.status(401).json({ success: false, data: "Client id/secret are not properly set up" });
        const code = req.body.code;
        const tokens = yield (yield fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            })
        })).json();
        if (!tokens.access_token) {
            console.error(tokens.error);
            return res.status(401).json({ success: false, data: "Request rejected by google" });
        }
        const userReq = yield fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${tokens.access_token}`
            }
        });
        const userData = yield userReq.json();
        if (!userData.given_name || !userData.email)
            return res.status(401).json({ success: false, data: "Unknown token...?" });
        if (!userData.email_verified)
            return res.status(401).json({ success: false, data: "Verify your google email address first" });
        const login = yield (0, service_1.loginUserGoogle)(userData.email, userData.given_name, userData.picture);
        const newTokens = yield (0, service_1.generateTokens)(login);
        res.status(200).json({
            success: true,
            data: Object.assign({ user: login }, newTokens)
        });
    });
}
