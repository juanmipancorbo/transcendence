"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMsg } from "@/hooks/useMsg";
import { useAuth } from "@/hooks/useAuth";

function GoogleCallbackContent() {
	const router = useRouter();
	const params = useSearchParams();
	const { loginGoogle } = useAuth();
	const code = params.get("code");
	const state = params.get("state");
	const { error } = useMsg();

	function getCookie(name: string) {
		const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
		return match ? decodeURIComponent(match[1]) : null;
	}

	useEffect(() => {
		async function login() {
			const storedState = getCookie("oauth_state");
			if (!code || !storedState || storedState !== state) {
				error("Incorrect login flow");
				router.push("/login");
				return;
			}

			document.cookie = 'oauth_state=; path=/; max-age=0'; // Clear state
			return loginGoogle(code);
		}

		login().then(() => router.push("/lobby"))
			.catch(e => {
				error(e.message);
				router.push("/login");
			});
	}, []);

	return (
		<div className="page-root">
			<div className="page-glow-layer">
				<div className="page-glow-tr" />
				<div className="page-glow-bl" />
			</div>
			<main className="relative z-10 min-h-screen flex items-center justify-center px-6">
				<div className="glass-panel p-10 rounded-lg border border-outline-variant/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center gap-6">
					<div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
					<span className="label-micro accent tracking-[0.4em]">
						Verifying_Identity...
					</span>
				</div>
			</main>
		</div>
	);
}

export default function GoogleCallbackPage() {
	return (
		<Suspense fallback={
			<div className="page-root">
				<main className="relative z-10 min-h-screen flex items-center justify-center px-6">
					<div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
				</main>
			</div>
		}>
			<GoogleCallbackContent />
		</Suspense>
	);
}
