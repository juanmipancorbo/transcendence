"use client";

import React, { createContext, useContext, useState, useRef } from "react";

interface Message {
	msg: string,
	show: boolean,
	isError: boolean
};

interface MsgContextValue {
	content: Message,
	message: (message: string, timeMs?: number) => void,
	error: (message: string, timeMs?: number) => void,
};

const MsgContext = createContext<MsgContextValue | null>(null);

export function MsgProvider({ children }: { children: React.ReactNode }) {
	const [msg, setMsg] = useState<Message>({ msg: "", show: false, isError: false });
	const timer = useRef<number | undefined>(undefined);

	const message = (message: string, timeMs?: number) => {
		window.clearTimeout(timer.current);
		setMsg({ msg: message, show: true, isError: false });
		timer.current = window.setTimeout(() => setMsg({ ...msg, show: false }), timeMs ?? 3000)
	};

	const error = (message: string, timeMs?: number) => {
		window.clearTimeout(timer.current);
		setMsg({ msg: message, show: true, isError: true });
		timer.current = window.setTimeout(() => setMsg({ ...msg, show: false }), timeMs ?? 3000);
	};

	return (
		<MsgContext.Provider
			value={{
				content: msg,
				message,
				error
			}}
		>
			{children}
		</MsgContext.Provider>
	);
}

export function useMsg(): MsgContextValue {
	const ctx = useContext(MsgContext);
	if (!ctx) throw new Error("useMsg must be used inside <MsgProvider>");
	return ctx;
}
