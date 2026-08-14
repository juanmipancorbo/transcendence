import { generateTokens, loginUserGoogle } from "@databaseAccess/auth/service";
import { selectProfileByEmail, isUsernameAvailable } from "@databaseAccess/user/repository";
import { GoogleLoginReq, UserSetupReq } from "@endpoints/users-request";
import { Request, Response } from "express";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

interface State {
	email: string,
	picture: string,
	timeout: NodeJS.Timeout,
}

const pending: Map<string, State> = new Map();

export async function setupUsername(req: Request<unknown, unknown, UserSetupReq>, res: Response) {
	const stateId = req.body.state;
	const username = req.body.username;
	const isAvailable = await isUsernameAvailable(username);
	if (!isAvailable)
		return res.status(400).json({ success: false, data: "This username is already in use" });
	const state = pending.get(stateId);
	if (!state)
		return res.status(404).json({ success: false, data: "The state has expired." });

	const login = await loginUserGoogle(state.email, username, state.picture);
	const newTokens = await generateTokens(login);

	res.status(200).json({
		success: true,
		data: {
			setup: true,
			user: login,
			...newTokens
		}
	});
}

export async function login(req: Request<unknown, unknown, GoogleLoginReq>, res: Response) {
	if (!clientId || !clientSecret)
		return res.status(401).json({ success: false, data: "Client id/secret are not properly set up" });

	const code = req.body.code;
	const redirect = req.body.redirect;
	const tokens = await (await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: new URLSearchParams({
			code,
			client_id: clientId,
			client_secret: clientSecret,
			redirect_uri: redirect,
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
	if (!userData.email)
		return res.status(401).json({ success: false, data: "Invalid payload" });

	if (!userData.email_verified)
		return res.status(401).json({ success: false, data: "Verify your google email address first" });

	const profile = await selectProfileByEmail(userData.email);
	if (!profile) {
		const state = req.body.state;
		if (!pending.has(state)) {
			pending.set(state, { email: userData.email, picture: userData.picture, timeout: setTimeout(() => {
				pending.delete(state);
			}, 180000)}); // 3 minutes
		}
		return res.status(200).json({
			success: true,
			data: {
				setup: false,
			}
		});
	}

	const login = await loginUserGoogle(userData.email, userData.given_name, userData.picture);
	const newTokens = await generateTokens(login);

	res.status(200).json({
		success: true,
		data: {
			setup: true,
			user: login,
			...newTokens
		}
	});
}
