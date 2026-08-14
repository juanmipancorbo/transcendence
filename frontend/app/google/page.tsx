"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMsg } from "@/hooks/useMsg";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/lib/api";
import PixelLoader from "@/components/ui/PixelLoader";

type Hint = { ok: boolean; msg: string };

function validateUsername(username: string): string | null {
	if (username.length < 3 || username.length > 16)
		return "Username must be between 3 and 16 characters";
	if (!/^[a-zA-Z0-9_-]+$/.test(username))
		return "Username can only contain letters, numbers, hyphen (-) and underscore (_)";
	return null;
}

function GoogleCallbackContent() {
	const router = useRouter();
	const params = useSearchParams();
	const { loginGoogle, setupGoogleUsername } = useAuth();
	const code = params.get("code");
	const state = params.get("state");
	const { error } = useMsg();

	const [needsUsername, setNeedsUsername] = useState(false);
	const [username, setUsername] = useState("");
	const [hint, setHint] = useState<Hint | null>(null);
	const [formError, setFormError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	function getCookie(name: string) {
		const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
		return match ? decodeURIComponent(match[1]) : null;
	}

	useEffect(() => {
		async function login() {
			const storedState = getCookie("oauth_state");
			if (!code || !state || !storedState || storedState !== state) {
				error("Incorrect login flow");
				router.push("/login");
				return;
			}

			document.cookie = 'oauth_state=; path=/; max-age=0'; // Clear state
			return loginGoogle(code, state);
		}

		login().then(outcome => {
			// No outcome means the flow was already redirected to /login.
			if (!outcome)
				return;
			if (outcome === "username-required")
				setNeedsUsername(true);
			else
				router.push("/lobby");
		}).catch(e => {
			error(e.message);
			router.push("/login");
		});
	}, []);

	// Live availability check, so the name is vetted before the state expires.
	useEffect(() => {
		const name = username.trim();
		if (!needsUsername || validateUsername(name)) {
			setHint(null);
			return;
		}

		let active = true;
		const timer = setTimeout(() => {
			userApi.checkUsernameAvailability(name)
				.then(() => active && setHint({ ok: true, msg: "Username is available" }))
				.catch(e => active && setHint({ ok: false, msg: e.message }));
		}, 400);

		return () => {
			active = false;
			clearTimeout(timer);
		};
	}, [username, needsUsername]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!state)
			return;

		const name = username.trim();
		const invalid = validateUsername(name);
		if (invalid) {
			setFormError(invalid);
			return;
		}

		setFormError("");
		setSubmitting(true);
		try {
			await setupGoogleUsername(name, state);
			router.push("/lobby");
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Could not finish signing up");
			setSubmitting(false);
		}
	}

	return (
		<div className="pixel-auth page-root">
			<div className="page-glow-layer">
				<div className="page-glow-tr" />
				<div className="page-glow-bl" />
			</div>
			<main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
				{needsUsername ? (
					<div className="w-full max-w-md">
						<div className="mb-8">
							<h1 className="text-5xl font-headline font-bold tracking-tighter text-on-surface">
								PICK YOUR
								<span> USERNAME</span>
							</h1>
							<p className="mt-4 label-micro tracking-wider">
								This Google account has no profile yet. Choose a name to finish signing up.
							</p>
						</div>

						<div className="pixel-auth-card glass-panel p-10">
							<form className="space-y-5" onSubmit={handleSubmit}>
								<div className="field-group">
									<label htmlFor="google-username" className="field-label">Username</label>
									<div className="field-wrap">
										<input
											id="google-username"
											name="username"
											autoComplete="username"
											type="text"
											placeholder="USERNAME"
											className="field-input"
											value={username}
											onChange={e => setUsername(e.target.value)}
											autoFocus
											required
										/>
										<div className="field-underline" />
									</div>
								</div>

								{hint && (
									<p className={`label-micro tracking-wider ${hint.ok ? "text-primary" : "text-red-400"}`}>
										{hint.msg}
									</p>
								)}

								{formError && (
									<div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
										{formError}
									</div>
								)}

								<button
									type="submit"
									className="retro-shell auth btn-primary mt-4"
									disabled={submitting || hint?.ok === false}
								>
									{submitting ? "Finishing..." : "Continue"}
								</button>
							</form>

							<p className="text-center mt-6 label-micro tracking-wider">
								Wrong account?{" "}
								<Link href="/login" className="text-on-surface underline underline-offset-4">
									Back to sign in
								</Link>
							</p>
						</div>
					</div>
				) : (
					<div className="pixel-auth-card p-10 flex flex-col items-center gap-6">
						<PixelLoader label="Verifying identity..." />
					</div>
				)}
			</main>
		</div>
	);
}

export default function GoogleCallbackPage() {
	return (
		<Suspense fallback={
			<div className="pixel-auth page-root">
				<main className="relative z-10 min-h-screen flex items-center justify-center px-6">
					<PixelLoader label="Loading..." />
				</main>
			</div>
		}>
			<GoogleCallbackContent />
		</Suspense>
	);
}
