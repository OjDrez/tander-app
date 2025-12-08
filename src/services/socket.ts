import { io, Socket } from "socket.io-client";

// TODO: Replace this with your backend Socket.IO URL
const SOCKET_URL = "https://your-backend-url.com";

export const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  autoConnect: false,
});

/**
 * Ensures the Socket.IO client is connected.
 */
export const ensureSocketConnection = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Helper to register a listener and automatically provide cleanup.
 */
export const registerSocketListener = <T = unknown>(
  event: string,
  callback: (payload: T) => void
) => {
  socket.on(event, callback);
  return () => socket.off(event, callback);
};

export default socket;
