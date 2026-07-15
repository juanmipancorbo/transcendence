"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMsg } from "@/hooks/useMsg";
import { useAuth } from "@/hooks/useAuth";
import PixelLoader from "@/components/ui/PixelLoader";

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
		<div className="pixel-auth page-root">
			<div className="page-glow-layer">
				<div className="page-glow-tr" />
				<div className="page-glow-bl" />
			</div>
			<main className="relative z-10 min-h-screen flex items-center justify-center px-6">
				<div className="pixel-auth-card p-10 flex flex-col items-center gap-6">
					<PixelLoader label="Verifying identity..." />
				</div>
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
