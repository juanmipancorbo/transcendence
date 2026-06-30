"use client";

import { GameSocket } from "@/lib/ws/socket";
import React, { createContext, useEffect, useState } from "react";
import { getTokens } from "./useAuth";

interface WsContextValue {
	socket: GameSocket,
}

export const WsContext = createContext<WsContextValue | null>(null);
