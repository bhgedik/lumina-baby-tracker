// ============================================================
// Nodd — Chat Sheet
// Modern conversational UI in a bottom sheet
// User bubbles right, AI Nurse bubbles left, typing indicator
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
import type { InsightCardData, ChatMessage } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  insight: InsightCardData | null;
  babyName: string | null;
  babyAgeDays: number | null;
  feedingMethod: string;
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

export function ChatSheet({ visible, onClose, insight, babyName, babyAgeDays, feedingMethod }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Reset messages when insight changes
  useEffect(() => {
    if (insight && visible) {
      const initialMessage: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: `I see you want to discuss **"${insight.title}"**. I'm here to help. What questions do you have? Feel free to ask anything — there are no silly questions.`,
        timestamp: Date.now(),
      };
      setMessages([initialMessage]);
      setInputText('');
    }
  }, [insight?.id, visible]);

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

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Build messages for API
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: (m.role === 'nurse' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.text,
    }));

    try {
      const response = await sendChatMessage({
        insightContext: insight?.title ?? '',
        messages: apiMessages,
        babyName: babyName ?? undefined,
        babyAgeDays: babyAgeDays ?? undefined,
        feedingMethod,
      });

      const nurseMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: response.reply ?? "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, nurseMsg]);
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
  }, [inputText, isTyping, messages, insight, babyName, babyAgeDays, feedingMethod]);

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
              <Text style={styles.headerTitle}>Your AI Nurse</Text>
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

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask a follow-up question..."
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="default"
              editable={!isTyping}
            />
            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || isTyping) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isTyping}
              accessibilityLabel="Send message"
            >
              <Feather
                name="send"
                size={18}
                color={inputText.trim() && !isTyping ? colors.textInverse : colors.textTertiary}
              />
            </Pressable>
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
  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
});
