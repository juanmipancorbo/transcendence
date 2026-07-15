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
				className={`pixel-toast flex items-center gap-3 border px-5 py-3 font-body text-sm shadow-lg backdrop-blur-md transition-colors duration-300 ${
					isError
						? "border-error/40 bg-error-container/30 text-error"
						: "border-primary/30 bg-surface-container/70 text-on-surface"
				}`}
			>
				<span
					className={`relative flex h-2 w-2 shrink-0`}
				>
					{show && (
						<span
							className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
								isError ? "bg-error" : "bg-primary"
							}`}
						/>
					)}
					<span
						className={`relative inline-flex h-2 w-2 rounded-full ${
							isError ? "bg-error" : "bg-primary"
						}`}
					/>
				</span>
				<p className="max-w-xs break-words">{msg}</p>
			</div>
		</div>
	);
}
