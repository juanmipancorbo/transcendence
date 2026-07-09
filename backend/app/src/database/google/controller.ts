import { generateTokens, loginUserGoogle } from "@databaseAccess/auth/service";
import { GoogleLoginReq } from "@endpoints/users-request";
import { Request, Response } from "express";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

export async function login(req: Request<unknown, unknown, GoogleLoginReq>, res: Response) {
	if (!clientId || !clientSecret || !redirectUri)
		return res.status(401).json({ success: false, data: "Client id/secret are not properly set up" });

	const code = req.body.code;
	const tokens = await (await fetch("https://oauth2.googleapis.com/token", {
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

	const userReq = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${tokens.access_token}`
		}
	});
	const userData = await userReq.json();
	if (!userData.given_name || !userData.email)
		return res.status(401).json({ success: false, data: "Unknown token...?" });

	if (!userData.email_verified)
		return res.status(401).json({ success: false, data: "Verify your google email address first" });

	const login = await loginUserGoogle(userData.email, userData.given_name);
	const newTokens = await generateTokens(login);

	res.status(200).json({
		success: true,
		data: {
			user: login,
			...newTokens
		}
	});
}

