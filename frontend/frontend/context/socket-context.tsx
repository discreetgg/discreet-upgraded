"use client";

import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { type Socket, io } from "socket.io-client";
import { useGlobal } from "./global-context-provider";
import { NotificationType } from "@/types/global";
import { getOnlineUsersService } from "@/lib/services";

type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

type SocketContextValue = {
	socket: Socket | null;
	isConnected: boolean;
	connectionQuality: ConnectionQuality;
	onlineUsers: Set<string>;
	isUserOnline: (userId: string) => boolean;
	newNotifications: NotificationType | undefined;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketContextProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { user } = useGlobal();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('disconnected');
	const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
	const [newNotifications, setNewNotifications] = useState<NotificationType>();
	const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const latencyHistoryRef = useRef<number[]>([]);
	const reconnectCountRef = useRef(0);
	const lastMessageTimeRef = useRef<number>(Date.now());

	// Initial fetch of online users on mount - no polling
	useEffect(() => {
		if (!user?.discordId) return;

		const fetchOnlineUsers = async () => {
			try {
				const users = await getOnlineUsersService();
				setOnlineUsers(new Set(users));
			} catch (error) {
				console.error("Failed to fetch online users:", error);
			}
		};

		// Initial fetch only - no interval polling
		fetchOnlineUsers();
	}, [user?.discordId]);

	useEffect(() => {
		if (!user?.discordId) return;

		// Initialize socket connection
		const s = io("https://api.discreet.fans", {
			query: { discordId: user?.discordId },
		});

		// Calculate connection quality based on latency
		const calculateConnectionQuality = (latency: number): ConnectionQuality => {
			if (latency < 50) return 'excellent';
			if (latency < 100) return 'good';
			if (latency < 200) return 'fair';
			if (latency < 500) return 'poor';
			return 'disconnected';
		};

		// Measure latency periodically
		// Use message acknowledgment times or connection stability
		const measureLatency = () => {
			if (!s.connected) {
				setConnectionQuality('disconnected');
				return;
			}

			// Measure based on time since last successful message
			// If messages are flowing regularly, connection is good
			const timeSinceLastMessage = Date.now() - lastMessageTimeRef.current;
			
			// If we haven't received messages recently, test with a ping
			if (timeSinceLastMessage > 10000) {
				const startTime = Date.now();
				// Use a lightweight test - emit a simple event that server should acknowledge
				// If server doesn't support custom ping, we'll use connection stability
				s.emit('ping', { timestamp: startTime }, (response: any) => {
					const latency = Date.now() - startTime;
					latencyHistoryRef.current.push(latency);
					
					// Keep only last 10 measurements
					if (latencyHistoryRef.current.length > 10) {
						latencyHistoryRef.current.shift();
					}
					
					// Calculate average latency
					const avgLatency = latencyHistoryRef.current.length > 0
						? latencyHistoryRef.current.reduce((a, b) => a + b, 0) / latencyHistoryRef.current.length
						: latency;
					setConnectionQuality(calculateConnectionQuality(avgLatency));
				});
			} else {
				// Messages are flowing, estimate based on connection stability
				// Good connection if messages are recent and no reconnects
				if (reconnectCountRef.current === 0) {
					setConnectionQuality('good');
				} else if (reconnectCountRef.current < 3) {
					setConnectionQuality('fair');
				} else {
					setConnectionQuality('poor');
				}
			}
		};

		s.on("connect", () => {
			setIsConnected(true);
			setConnectionQuality('good'); // Initial state
			latencyHistoryRef.current = [];
			lastMessageTimeRef.current = Date.now();
			reconnectCountRef.current = 0; // Reset on fresh connection
			
			// Start measuring latency every 10 seconds (less frequent to reduce overhead)
			pingIntervalRef.current = setInterval(measureLatency, 10000);
			// Measure immediately
			measureLatency();
		});
		
		// Track reconnection attempts
		s.io.on("reconnect_attempt", () => {
			reconnectCountRef.current += 1;
		});
		
		s.io.on("reconnect", () => {
			// Reset after successful reconnect
			reconnectCountRef.current = 0;
			lastMessageTimeRef.current = Date.now();
		});

		s.on("connect_error", (err) => {
			setIsConnected(false);
			setConnectionQuality('disconnected');
			if (pingIntervalRef.current) {
				clearInterval(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}
			// Log connection errors for debugging (but not DNS errors which are expected in dev)
			if (process.env.NODE_ENV === 'development') {
				console.warn('Socket connection error:', err.message);
			}
		});

		s.on("disconnect", () => {
			setIsConnected(false);
			setConnectionQuality('disconnected');
			if (pingIntervalRef.current) {
				clearInterval(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}
		});

		// Real-time notification events
		s.on("notification:new", (data: NotificationType) => {
			// console.log("NEW NOTIFICATION:", data);
			setNewNotifications(data);
			lastMessageTimeRef.current = Date.now();
		});
		
		// Track any incoming message to measure connection health
		s.onAny(() => {
			lastMessageTimeRef.current = Date.now();
		});

		// Socket-based online status updates (replacing polling)
		s.on("user:online", (userId: string) => {
			setOnlineUsers((prev) => {
				const updated = new Set(prev);
				updated.add(userId);
				return updated;
			});
		});

		s.on("user:offline", (userId: string) => {
			setOnlineUsers((prev) => {
				const updated = new Set(prev);
				updated.delete(userId);
				return updated;
			});
		});

		// Batch update of all online users
		s.on("users:online", (userIds: string[]) => {
			setOnlineUsers(new Set(userIds));
		});

		setSocket(s);

		return () => {
			if (pingIntervalRef.current) {
				clearInterval(pingIntervalRef.current);
				pingIntervalRef.current = null;
			}
			s.disconnect();
		};
	}, [user?.discordId]);

	const isUserOnline = useCallback(
		(userId: string) => {
			return onlineUsers.has(userId);
		},
		[onlineUsers]
	);

	const value = useMemo(
		() => ({
			socket,
			isConnected,
			connectionQuality,
			onlineUsers,
			isUserOnline,
			newNotifications,
		}),
		[socket, isConnected, connectionQuality, onlineUsers, isUserOnline, newNotifications]
	);

	return (
		<SocketContext.Provider value={value}>{children}</SocketContext.Provider>
	);
};

export const useSocket = () => {
	const ctx = useContext(SocketContext);
	if (!ctx) {
		throw new Error("useSocket must be used within a SocketContextProvider");
	}
	return ctx;
};
