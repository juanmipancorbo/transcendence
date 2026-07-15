"use client";

import { useMsg } from "@/hooks/useMsg";

export default function MsgBox() {
	const { content } = useMsg();
	const { msg, show, isError } = content;

	return (
		<div
			role={isError ? "alert" : "status"}
			aria-live={isError ? "assertive" : "polite"}
			aria-hidden={!show}
			className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${
				show
					? "translate-y-0 scale-100 opacity-100"
					: "translate-y-4 scale-95 opacity-0"
			}`}
		>
			<div
				className={`pixel-toast ${isError ? "error" : "info"} flex items-center gap-3 px-5 py-3 font-body text-sm`}
			>
				<span className="pixel-toast-marker" aria-hidden="true" />
				<p className="max-w-xs break-words">{msg}</p>
			</div>
		</div>
	);
}
