import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateDirectRoomId,
  getCurrentUserId,
  joinRoom,
  leaveRoom,
  markMessagesAsRead,
  sendMessage as chatServiceSendMessage,
  sendTypingIndicator,
  subscribeToRoom,
  isConnected as chatIsConnected,
  onConnectionStateChange,
} from '../services/chatService';
import {
  ChatListItem,
  DateSeparator,
  MessageDisplay,
} from '../types/chat';
import { formatMessageDate, formatMessageTime, getDateLabel } from '../api/chatApi';

// Key for storing pending messages in AsyncStorage
const PENDING_MESSAGES_KEY = '@tander_pending_messages';

// Maximum number of retries for sending messages
const MAX_RETRIES = 5;

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
  const isFlushingRef = useRef(false);
  const pendingMessagesRef = useRef<QueuedMessage[]>([]);
  const isMountedRef = useRef(true);
  const isSendingRef = useRef(false); // Prevent double-send race condition
  const onNewMessageRef = useRef(onNewMessage); // Stable ref to avoid listener accumulation
  const flushPendingMessagesRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Keep refs in sync with their values for use in callbacks
  useEffect(() => {
    pendingMessagesRef.current = pendingMessages;
  }, [pendingMessages]);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

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
    // Set initial state based on connection
    setIsOnline(chatIsConnected());

    const unsubscribe = onConnectionStateChange((state) => {
      const connected = state === 'connected' || state === 'authenticated';
      console.log('[useChat] Connection state changed:', state, '- online:', connected);
      setIsOnline(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Flush all pending messages
   * Uses refs to avoid stale closure issues
   */
  const flushPendingMessages = useCallback(async () => {
    // Use ref to get current pending messages to avoid stale closure
    const currentPending = pendingMessagesRef.current;

    if (isFlushingRef.current || currentPending.length === 0) return;
    isFlushingRef.current = true;

    console.log('[useChat] Flushing', currentPending.length, 'pending messages');

    const remaining: QueuedMessage[] = [];

    for (const msg of currentPending) {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        remaining.push(msg);
        continue;
      }

      try {
        const result = await chatServiceSendMessage(msg.roomId, msg.text, msg.receiverId);

        if (!isMountedRef.current) {
          remaining.push(msg);
          continue;
        }

        if (result.success) {
          console.log('[useChat] Sent pending message:', msg.id);
          // Update message status to sent
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, id: result.messageId || msg.id, status: 'sent' } : m
            )
          );
        } else if (msg.retryCount < MAX_RETRIES) {
          remaining.push({ ...msg, retryCount: msg.retryCount + 1 });
        } else {
          // Max retries exceeded, mark as failed
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))
          );
        }
      } catch (err) {
        console.error('[useChat] Failed to send pending message:', err);
        if (msg.retryCount < MAX_RETRIES) {
          remaining.push({ ...msg, retryCount: msg.retryCount + 1 });
        } else {
          if (isMountedRef.current) {
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, status: 'failed' } : m))
            );
          }
        }
      }
    }

    if (isMountedRef.current) {
      setPendingMessages(remaining);
    }
    await savePendingMessages(remaining);
    isFlushingRef.current = false;
  }, [savePendingMessages]);

  // Keep ref in sync with the latest flushPendingMessages
  useEffect(() => {
    flushPendingMessagesRef.current = flushPendingMessages;
  }, [flushPendingMessages]);

  // Store roomId in a ref for use in reconnection handler
  const roomIdRef = useRef(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  /**
   * Flush pending messages and rejoin room when socket reconnects
   * Uses refs to avoid recreating listeners (prevents accumulation)
   */
  useEffect(() => {
    const handleReconnect = async () => {
      console.log('[useChat] Reconnected, rejoining room and checking pending messages');

      // Rejoin the room after reconnection to ensure we receive messages
      const currentRoomId = roomIdRef.current;
      if (currentRoomId) {
        try {
          await joinRoom(currentRoomId);
          console.log('[useChat] Rejoined room after reconnect:', currentRoomId);
        } catch (err) {
          console.error('[useChat] Failed to rejoin room:', err);
        }
      }

      // Flush any pending messages
      if (pendingMessagesRef.current.length > 0) {
        flushPendingMessagesRef.current();
      }
    };

    // Subscribe to connection state changes for reconnection handling
    const unsubscribe = onConnectionStateChange((state) => {
      if (state === 'connected' || state === 'authenticated') {
        handleReconnect();
      }
    });

    return () => {
      unsubscribe();
    };
    // Empty deps - listeners are stable via refs
  }, []);

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

    // Subscribe to room messages using unified chat service
    const unsubscribeRoom = subscribeToRoom(roomId, (payload: any) => {
      // Handle different message types from STOMP/Socket.IO
      if (payload.type === 'typing') {
        // Typing indicator
        if (payload.senderId === otherUserId || payload.userId === otherUserId) {
          setIsTyping(payload.isTyping);
          setTypingUsername(payload.isTyping ? payload.username : null);

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          if (payload.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                setIsTyping(false);
                setTypingUsername(null);
              }
            }, 7000);
          }
        }
        return;
      }

      if (payload.type === 'messages_read') {
        // Read receipt
        if (payload.readBy !== currentUserId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.isOwn && (m.status === 'sent' || m.status === 'delivered')) {
                if (payload.messageIds && payload.messageIds.length > 0) {
                  const mId = String(m.id);
                  const msgIdMatch = payload.messageIds.includes(mId) ||
                    payload.messageIds.includes(mId.replace('msg_', ''));
                  if (msgIdMatch) {
                    return { ...m, status: 'read' };
                  }
                } else {
                  return { ...m, status: 'read' };
                }
              }
              return m;
            })
          );
        }
        return;
      }

      if (payload.type === 'message_delivered') {
        // Delivery receipt
        setMessages((prev) =>
          prev.map((m) => {
            const mId = String(m.id);
            const payloadMsgId = String(payload.messageId);
            if ((mId === payloadMsgId || mId === `msg_${payloadMsgId}`) &&
                m.isOwn && m.status === 'sent') {
              return { ...m, status: 'delivered' };
            }
            return m;
          })
        );
        return;
      }

      // Regular chat message - ensure ID is always a string
      const messageId = payload.messageId || payload.id || `msg_${payload.timestamp}`;
      const newMessage: MessageDisplay = {
        id: String(messageId),
        text: payload.text || payload.content,
        time: formatMessageTime(payload.timestamp || Date.now()),
        isOwn: payload.senderId === currentUserId,
        date: formatMessageDate(payload.timestamp || Date.now()),
        status: 'delivered',
        senderId: payload.senderId,
        timestamp: payload.timestamp || Date.now(),
      };

      // Robust deduplication
      setMessages((prev) => {
        const isDuplicate = prev.some((m) => {
          const mId = String(m.id);
          if (mId === newMessage.id) return true;
          if (mId.startsWith('temp_') &&
              m.senderId === newMessage.senderId &&
              m.text === newMessage.text) {
            return true;
          }
          if (m.senderId === newMessage.senderId &&
              m.text === newMessage.text &&
              m.timestamp && newMessage.timestamp &&
              Math.abs(newMessage.timestamp - m.timestamp) < 2000) {
            return true;
          }
          return false;
        });

        if (isDuplicate) {
          return prev.map((m) => {
            const mId = String(m.id);
            if (mId.startsWith('temp_') &&
                m.senderId === newMessage.senderId &&
                m.text === newMessage.text) {
              return { ...m, id: newMessage.id, status: 'delivered' };
            }
            return m;
          });
        }

        return [...prev, newMessage];
      });

      onNewMessageRef.current?.(newMessage);
    });

    return () => {
      unsubscribeRoom();
      leaveRoom(roomId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, currentUserId, otherUserId]);

  // Send message
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text.trim() || !currentUserId) {
        return false;
      }

      // Prevent double-send race condition (rapid button taps)
      if (isSendingRef.current) {
        console.log('[useChat] Send already in progress, ignoring duplicate');
        return false;
      }
      isSendingRef.current = true;

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
        timestamp, // Numeric timestamp for reliable sorting
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setError(null);

      // If offline or not connected, queue the message
      if (!isOnline || !chatIsConnected()) {
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

        isSendingRef.current = false;
        return true; // Return true because the message is queued
      }

      try {
        const result = await chatServiceSendMessage(roomId, trimmedText, otherUserId);

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
      } finally {
        isSendingRef.current = false;
      }
    },
    [roomId, currentUserId, otherUserId, isOnline, pendingMessages, savePendingMessages]
  );

  // Send typing indicator
  const setTypingState = useCallback(
    (typing: boolean) => {
      if (typing === lastTypingRef.current) return;
      lastTypingRef.current = typing;

      sendTypingIndicator(roomId, conversationId, otherUserId, typing);
    },
    [roomId, conversationId, otherUserId]
  );

  // Mark messages as read
  const markAsRead = useCallback(() => {
    markMessagesAsRead(conversationId);
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
          const result = await chatServiceSendMessage(roomId, failedMessage.text, otherUserId);

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

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
