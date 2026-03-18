// ============================================================
// Lumina — Chat Sheet
// Modern conversational UI in a bottom sheet
// User bubbles right, Lumina bubbles left, typing indicator
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  PanResponder,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../../shared/constants/theme';
import { sendChatMessage } from '../services/insightChatService';
import { useBabyStore } from '../../../stores/babyStore';
import { buildChatContext } from '../utils/buildChatContext';
import { scanMessageForSafety } from '../../../ai/chatSafetyScanner';
import { validateChatResponse } from '../../../ai/contentFilter';
import type { InsightCardData, ChatMessage } from '../types';
import type { ChatMode } from '../../lumina/types';
import { useLuminaThreadStore } from '../../../stores/luminaThreadStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  insight: InsightCardData | null;
  babyName: string | null;
  babyAgeDays: number | null;
  feedingMethod: string;
  isPregnant?: boolean;
  initialMessage?: string;
  mode?: ChatMode;
  threadId?: string | null;
  onThreadCreated?: (threadId: string) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    };
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={styles.typingRow}>
      <View style={styles.nurseBubble}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

/**
 * Renders message text with **bold** markers.
 */
function RichMessageText({ text, isUser }: { text: string; isUser: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={isUser ? styles.userText : styles.nurseText}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={i} style={isUser ? styles.userTextBold : styles.nurseTextBold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

const STARTER_SUGGESTIONS = ['Feeding schedules', 'Sleep patterns', 'Health concerns'];

export function ChatSheet({ visible, onClose, insight, babyName, babyAgeDays, feedingMethod, isPregnant, initialMessage, mode = 'transient', threadId = null, onThreadCreated }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const initialMessageHandled = useRef<string | null>(null);
  const currentThreadId = useRef<string | null>(null);
  const activeBaby = useBabyStore((s) => s.getActiveBaby());

  const threadStore = useLuminaThreadStore;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Reset messages when insight changes or welcome mode opens
  useEffect(() => {
    if (!visible) {
      initialMessageHandled.current = null;
      currentThreadId.current = null;
      return;
    }

    // Persistent mode: load existing thread or show Lumina welcome
    if (mode === 'persistent') {
      if (threadId) {
        const thread = threadStore.getState().getThread(threadId);
        if (thread) {
          currentThreadId.current = threadId;
          setMessages(thread.messages);
          setSuggestions([]);
          setInputText('');
          initialMessageHandled.current = null;
          return;
        }
      }
      // New persistent thread — show Lumina welcome, thread created on first send
      currentThreadId.current = null;
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: "Hello! I'm Lumina, your AI parenting companion. Whether you're feeling unsure about a symptom or just need a second opinion, I'm here to support you. What's on your mind today?",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
      setSuggestions(STARTER_SUGGESTIONS);
      setInputText('');
      initialMessageHandled.current = null;
      return;
    }

    // Transient mode (default): existing behavior
    if (insight) {
      const welcomeMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: `I see you want to discuss **"${insight.title}"**. I'm here to help. What questions do you have? Feel free to ask anything — there are no silly questions.`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMsg]);
      setSuggestions([]);
      setInputText('');
      initialMessageHandled.current = null;
    } else if (initialMessage?.trim()) {
      // User typed a question on the dashboard — skip welcome, auto-submit
      setMessages([]);
      setSuggestions([]);
      setInputText('');
      initialMessageHandled.current = initialMessage.trim();
    } else {
      const welcomeMessage: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: "Hello! I'm Lumina, your AI parenting companion. Whether you're feeling unsure about a symptom or just need a second opinion, I'm here to support you. What's on your mind today?",
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
      setSuggestions(STARTER_SUGGESTIONS);
      setInputText('');
      initialMessageHandled.current = null;
    }
  }, [insight?.id, visible, initialMessage, mode, threadId]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 10,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100 || gesture.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    setSuggestions([]);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Safety check BEFORE any AI call
    const safetyResult = scanMessageForSafety(text.trim());
    if (safetyResult.isRedFlag) {
      const safetyMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: safetyResult.message!,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, safetyMsg]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    // Build messages for API
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: (m.role === 'nurse' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.text,
    }));

    // Build RAG context from stores
    const context = activeBaby ? buildChatContext(activeBaby.id) : null;

    try {
      const response = await sendChatMessage({
        insightContext: insight?.title ?? '',
        messages: apiMessages,
        babyName: babyName ?? undefined,
        babyAgeDays: babyAgeDays ?? undefined,
        feedingMethod,
        isPregnant,
        recentLogs: context?.recentLogs,
      });

      const replyText = response.reply ?? "I'm having trouble connecting right now. Please try again in a moment.";

      // Content safety validation — defense-in-depth alongside prompt-level filtering
      const validation = activeBaby
        ? validateChatResponse(replyText, feedingMethod, activeBaby.known_allergies ?? [])
        : { safe: true, warnings: [] };

      const nurseMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: validation.safe
          ? replyText
          : replyText + '\n\nNote: This response may contain content not tailored to your preferences. Please consult your pediatrician for personalized advice.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, nurseMsg]);

      // Persist messages in persistent mode
      if (mode === 'persistent') {
        if (currentThreadId.current) {
          threadStore.getState().appendMessage(currentThreadId.current, userMsg);
          threadStore.getState().appendMessage(currentThreadId.current, nurseMsg);
        } else {
          // Create new thread from first user message
          const title = userMsg.text.length > 60 ? userMsg.text.slice(0, 57) + '...' : userMsg.text;
          const newId = threadStore.getState().createThread(title, [...messages, userMsg, nurseMsg]);
          currentThreadId.current = newId;
          onThreadCreated?.(newId);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'nurse',
          text: "I'm having trouble connecting right now. In the meantime, trust your instincts — you're doing a great job.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [isTyping, messages, insight, babyName, babyAgeDays, feedingMethod, activeBaby]);

  // Auto-submit initial message from dashboard input
  useEffect(() => {
    if (visible && initialMessageHandled.current && !isTyping && messages.length === 0) {
      const text = initialMessageHandled.current;
      initialMessageHandled.current = null;
      sendMessage(text);
    }
  }, [visible, messages.length, isTyping, sendMessage]);

  const handleSend = useCallback(() => {
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  const handleSuggestionTap = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          {/* Handle + Header */}
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.nurseAvatar}>
              <Feather name="heart" size={16} color={colors.textInverse} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Lumina</Text>
              <Text style={styles.headerSub}>
                {isTyping ? 'Typing...' : 'Online'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close chat">
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Context pill */}
          {insight && (
            <View style={styles.contextPill}>
              <Feather name={insight.tagIcon as any} size={12} color={colors.primary[600]} />
              <Text style={styles.contextText} numberOfLines={1}>
                {insight.title}
              </Text>
            </View>
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={msg.role === 'user' ? styles.userRow : styles.nurseRow}
              >
                <View style={msg.role === 'user' ? styles.userBubble : styles.nurseBubble}>
                  <RichMessageText text={msg.text} isUser={msg.role === 'user'} />
                </View>
              </View>
            ))}
            {isTyping && <TypingIndicator />}
          </ScrollView>

          {/* Suggestion chips */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsRow}>
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionTap(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={insight ? 'Ask a follow-up question...' : 'Ask me anything...'}
              placeholderTextColor="#6B5E8C"
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                if (text.length > 0) setSuggestions([]);
              }}
              multiline
              maxLength={500}
              returnKeyType="default"
              editable={!isTyping}
            />
            {inputText.trim() ? (
              <Pressable
                style={[
                  styles.sendButton,
                  isTyping && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={isTyping}
                accessibilityLabel="Send message"
              >
                <Feather
                  name="send"
                  size={18}
                  color={!isTyping ? colors.textInverse : colors.textTertiary}
                />
              </Pressable>
            ) : (
              <Pressable
                style={styles.micButton}
                onPress={() => {/* Voice input — wired later */}}
                hitSlop={12}
                accessibilityLabel="Voice input"
                accessibilityHint="Tap to dictate your message"
              >
                <Feather name="mic" size={20} color={colors.primary[600]} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,24,21,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    height: SCREEN_HEIGHT * 0.85,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.neutral[200],
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  nurseAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: typography.fontSize.xs,
    color: colors.primary[500],
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Context pill
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  contextText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[600],
  },
  // Messages
  messageList: {
    flex: 1,
  },
  messageContent: {
    padding: spacing.base,
    paddingBottom: spacing.md,
  },
  nurseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  nurseBubble: {
    maxWidth: '82%',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.xl,
    borderTopLeftRadius: 4,
    padding: spacing.md,
  },
  userBubble: {
    maxWidth: '82%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    borderTopRightRadius: 4,
    padding: spacing.md,
  },
  nurseText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  nurseTextBold: {
    fontWeight: typography.fontWeight.semibold,
  },
  userText: {
    fontSize: typography.fontSize.base,
    color: colors.textInverse,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  userTextBold: {
    fontWeight: typography.fontWeight.semibold,
  },
  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  typingDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  // Suggestion chips
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(74, 63, 96, 0.06)',
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#5D4E78',
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.md,
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    // Inset hack — border-only concave illusion, no shadows
    backgroundColor: '#F4F3F7',
    borderRadius: 30,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderTopColor: '#E0DDE5',
    borderLeftColor: '#E0DDE5',
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    // Puffy clay pill — keep shadow on the button (convex)
    shadowColor: '#C8B8DB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftColor: 'rgba(255,255,255,0.2)',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    // Puffy clay pill shadow
    shadowColor: '#C8B8DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.7)',
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
});
