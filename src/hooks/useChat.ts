import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateDirectRoomId,
  getCurrentUserId,
  joinRoom,
  leaveRoom,
  markMessagesAsRead,
  registerSocketListener,
  sendMessage as socketSendMessage,
  sendTypingIndicator,
  socket,
} from '../services/socket';
import {
  ChatListItem,
  DateSeparator,
  MessageDisplay,
  MessageReceivedPayload,
  UserTypingPayload,
} from '../types/chat';
import { formatMessageDate, formatMessageTime, getDateLabel } from '../api/chatApi';

// Key for storing pending messages in AsyncStorage
const PENDING_MESSAGES_KEY = '@tander_pending_messages';

// Interface for queued messages
interface QueuedMessage {
  id: string;
  roomId: string;
  text: string;
  receiverId: number;
  timestamp: number;
  retryCount: number;
}

interface UseChatOptions {
  conversationId: number;
  otherUserId: number;
  initialMessages?: MessageDisplay[];
  onNewMessage?: (message: MessageDisplay) => void;
  providedRoomId?: string; // Optional room ID from backend
}

interface UseChatReturn {
  messages: MessageDisplay[];
  formattedMessages: ChatListItem[];
  isTyping: boolean;
  typingUsername: string | null;
  sendMessage: (text: string) => Promise<boolean>;
  retryMessage: (messageId: string) => Promise<boolean>;
  deleteFailedMessage: (messageId: string) => void;
  setTyping: (isTyping: boolean) => void;
  markAsRead: () => void;
  isLoading: boolean;
  error: string | null;
  roomId: string;
  hasFailedMessages: boolean;
  isOnline: boolean; // Network connectivity status
  pendingCount: number; // Number of messages waiting to be sent
  flushPendingMessages: () => Promise<void>; // Manually flush pending messages
}

/**
 * Hook for managing chat messages and real-time communication
 * Includes offline message queuing and automatic retry on reconnection
 */
export const useChat = ({
  conversationId,
  otherUserId,
  initialMessages = [],
  onNewMessage,
  providedRoomId,
}: UseChatOptions): UseChatReturn => {
  const [messages, setMessages] = useState<MessageDisplay[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsername, setTypingUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<QueuedMessage[]>([]);

  const currentUserId = getCurrentUserId();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingRef = useRef<boolean>(false);
  const isFlushing = useRef(false);

  // Use provided room ID from backend, or generate one
  const roomId = useMemo(() => {
    let finalRoomId: string;

    // Prefer provided room ID from backend (more reliable)
    if (providedRoomId) {
      finalRoomId = providedRoomId;
      console.log('[useChat] Using provided roomId:', finalRoomId);
    } else if (currentUserId && otherUserId) {
      // Fallback: generate room ID
      finalRoomId = generateDirectRoomId(currentUserId, otherUserId);
      console.log('[useChat] Generated roomId:', finalRoomId, 'from users:', currentUserId, otherUserId);
    } else {
      finalRoomId = `dm_${conversationId}`;
      console.warn('[useChat] Fallback roomId (may be invalid):', finalRoomId);
    }

    return finalRoomId;
  }, [providedRoomId, currentUserId, otherUserId, conversationId]);

  // ==================== OFFLINE MESSAGE QUEUE ====================

  /**
   * Load pending messages from storage on mount
   */
  useEffect(() => {
    const loadPendingMessages = async () => {
      try {
        const stored = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
        if (stored) {
          const allPending: QueuedMessage[] = JSON.parse(stored);
          // Filter to only messages for this room
          const roomPending = allPending.filter((m) => m.roomId === roomId);
          setPendingMessages(roomPending);
          console.log('[useChat] Loaded', roomPending.length, 'pending messages for room', roomId);
        }
      } catch (err) {
        console.error('[useChat] Failed to load pending messages:', err);
      }
    };
    loadPendingMessages();
  }, [roomId]);

  /**
   * Save pending messages to storage
   */
  const savePendingMessages = useCallback(async (messages: QueuedMessage[]) => {
    try {
      // Get all pending messages from storage
      const stored = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
      const allPending: QueuedMessage[] = stored ? JSON.parse(stored) : [];

      // Remove old messages for this room and add new ones
      const otherRoomMessages = allPending.filter((m) => m.roomId !== roomId);
      const updated = [...otherRoomMessages, ...messages];

      await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('[useChat] Failed to save pending messages:', err);
    }
  }, [roomId]);

  /**
   * Monitor socket connectivity (used as proxy for network status)
   */
  useEffect(() => {
    // Set initial state based on socket connection
    setIsOnline(socket.connected);

    const handleConnect = () => {
      console.log('[useChat] Socket connected - online');
      setIsOnline(true);
    };

    const handleDisconnect = () => {
      console.log('[useChat] Socket disconnected - offline');
      setIsOnline(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  /**
   * Flush all pending messages
   */
  const flushPendingMessages = useCallback(async () => {
    if (isFlushing.current || pendingMessages.length === 0) return;
    isFlushing.current = true;

    console.log('[useChat] Flushing', pendingMessages.length, 'pending messages');

    const remaining: QueuedMessage[] = [];
    const maxRetries = 5;

    for (const msg of pendingMessages) {
      try {
        const result = await socketSendMessage(msg.roomId, msg.text, msg.receiverId);

        if (result.success) {
          console.log('[useChat] Sent pending message:', msg.id);
          // Update message status to sent
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, id: result.messageId || msg.id, status: 'sent' } : m
            )
          );
        } else if (msg.retryCount < maxRetries) {
          remaining.push({ ...msg, retryCount: msg.retryCount + 1 });
        } else {
          // Max retries exceeded, mark as failed
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))
          );
        }
      } catch (err) {
        console.error('[useChat] Failed to send pending message:', err);
        if (msg.retryCount < maxRetries) {
          remaining.push({ ...msg, retryCount: msg.retryCount + 1 });
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))
          );
        }
      }
    }

    setPendingMessages(remaining);
    await savePendingMessages(remaining);
    isFlushing.current = false;
  }, [pendingMessages, savePendingMessages]);

  /**
   * Flush pending messages when socket reconnects
   */
  useEffect(() => {
    const handleReconnect = () => {
      console.log('[useChat] Socket reconnected, flushing pending messages');
      if (pendingMessages.length > 0) {
        flushPendingMessages();
      }
    };

    socket.on('reconnect', handleReconnect);
    socket.on('authenticated', handleReconnect);

    return () => {
      socket.off('reconnect', handleReconnect);
      socket.off('authenticated', handleReconnect);
    };
  }, [pendingMessages.length, flushPendingMessages]);

  // Format messages with date separators
  const formattedMessages = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = [];
    let lastDate = '';

    messages.forEach((message) => {
      if (message.date !== lastDate) {
        items.push({
          id: `date-${message.date}`,
          type: 'date',
          label: getDateLabel(message.date),
        } as DateSeparator);
        lastDate = message.date;
      }
      items.push(message);
    });

    return items;
  }, [messages]);

  // Join room and set up listeners
  useEffect(() => {
    if (!roomId) return;

    // Join the chat room
    joinRoom(roomId).catch(console.error);

    // Listen for incoming messages
    const cleanupMessage = registerSocketListener<MessageReceivedPayload>(
      'message',
      (payload) => {
        if (payload.roomId !== roomId) return;

        const newMessage: MessageDisplay = {
          id: payload.messageId || `msg_${payload.timestamp}`,
          text: payload.text,
          time: formatMessageTime(payload.timestamp),
          isOwn: payload.senderId === currentUserId,
          date: formatMessageDate(payload.timestamp),
          status: 'delivered',
          senderId: payload.senderId,
        };

        // Avoid duplicates
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        onNewMessage?.(newMessage);
      }
    );

    // Listen for typing indicators
    const cleanupTyping = registerSocketListener<UserTypingPayload>(
      'user_typing',
      (payload) => {
        if (payload.userId === otherUserId) {
          setIsTyping(payload.isTyping);
          setTypingUsername(payload.isTyping ? payload.username : null);

          // Auto-clear typing after 5 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          if (payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
              setTypingUsername(null);
            }, 5000);
          }
        }
      }
    );

    return () => {
      cleanupMessage();
      cleanupTyping();
      leaveRoom(roomId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, currentUserId, otherUserId, onNewMessage]);

  // Send message
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text.trim() || !currentUserId) {
        return false;
      }

      const timestamp = Date.now();
      const tempId = `temp_${timestamp}`;
      const trimmedText = text.trim();

      // Optimistically add message
      const optimisticMessage: MessageDisplay = {
        id: tempId,
        text: trimmedText,
        time: formatMessageTime(timestamp),
        isOwn: true,
        date: formatMessageDate(timestamp),
        status: 'sending',
        senderId: currentUserId,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setError(null);

      // If offline or socket not connected, queue the message
      if (!isOnline || !socket.connected) {
        console.log('[useChat] Offline - queuing message for later');
        const queuedMessage: QueuedMessage = {
          id: tempId,
          roomId,
          text: trimmedText,
          receiverId: otherUserId,
          timestamp,
          retryCount: 0,
        };

        const updatedPending = [...pendingMessages, queuedMessage];
        setPendingMessages(updatedPending);
        await savePendingMessages(updatedPending);

        // Mark as pending (will be sent when online)
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m))
        );

        return true; // Return true because the message is queued
      }

      try {
        const result = await socketSendMessage(roomId, trimmedText, otherUserId);

        if (result.success) {
          // Update message status
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? { ...m, id: result.messageId || tempId, status: 'sent' }
                : m
            )
          );
          return true;
        } else {
          // Mark as failed
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, status: 'failed' } : m
            )
          );
          setError(result.error || 'Failed to send message');
          return false;
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: 'failed' } : m
          )
        );
        setError('Failed to send message');
        return false;
      }
    },
    [roomId, currentUserId, otherUserId, isOnline, pendingMessages, savePendingMessages]
  );

  // Send typing indicator
  const setTypingState = useCallback(
    (typing: boolean) => {
      if (typing === lastTypingRef.current) return;
      lastTypingRef.current = typing;

      sendTypingIndicator(conversationId.toString(), otherUserId, typing);
    },
    [conversationId, otherUserId]
  );

  // Mark messages as read
  const markAsRead = useCallback(() => {
    markMessagesAsRead(conversationId.toString());
  }, [conversationId]);

  /**
   * Retry sending a failed message with exponential backoff
   */
  const retryMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      const failedMessage = messages.find(
        (m) => m.id === messageId && m.status === 'failed'
      );

      if (!failedMessage) {
        console.warn('[useChat] Message not found or not failed:', messageId);
        return false;
      }

      // Update status to sending
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: 'sending' } : m
        )
      );
      setError(null);

      // Retry with exponential backoff (3 attempts max)
      const maxAttempts = 3;
      let attempts = 0;

      while (attempts < maxAttempts) {
        try {
          const result = await socketSendMessage(roomId, failedMessage.text, otherUserId);

          if (result.success) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === messageId
                  ? { ...m, id: result.messageId || messageId, status: 'sent' }
                  : m
              )
            );
            console.log('[useChat] Retry successful for message:', messageId);
            return true;
          }
        } catch (err) {
          console.warn('[useChat] Retry attempt', attempts + 1, 'failed:', err);
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempts - 1))
          );
        }
      }

      // All retries failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status: 'failed' } : m
        )
      );
      setError('Message failed after multiple attempts');
      console.error('[useChat] All retry attempts failed for message:', messageId);
      return false;
    },
    [messages, roomId, otherUserId]
  );

  /**
   * Delete a failed message from the local state
   */
  const deleteFailedMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  /**
   * Check if there are any failed messages
   */
  const hasFailedMessages = useMemo(
    () => messages.some((m) => m.status === 'failed'),
    [messages]
  );

  return {
    messages,
    formattedMessages,
    isTyping,
    typingUsername,
    sendMessage,
    retryMessage,
    deleteFailedMessage,
    setTyping: setTypingState,
    markAsRead,
    isLoading,
    error,
    roomId,
    hasFailedMessages,
    isOnline,
    pendingCount: pendingMessages.length,
    flushPendingMessages,
  };
};

export default useChat;
