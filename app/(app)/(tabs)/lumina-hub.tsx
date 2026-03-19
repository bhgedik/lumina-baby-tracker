// ============================================================
// Nodd — Lumina AI Chat Screen
// "Şefkatli Rehber" — Compassionate Guide
// Full-screen conversational UI with action cards,
// quick prompts, typing animation, and haptic feedback
// ============================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';

const luminaMascot = require('../../../assets/illustrations/lumina-mascot.png');
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, typography, spacing, borderRadius, shadows } from '../../../src/shared/constants/theme';
import { sendChatMessage } from '../../../src/modules/insights/services/insightChatService';
import { useBabyStore } from '../../../src/stores/babyStore';
import { useDashboardData } from '../../../src/modules/dashboard/hooks/useDashboardData';
import { buildChatContext } from '../../../src/modules/insights/utils/buildChatContext';
import { scanMessageForSafety } from '../../../src/ai/chatSafetyScanner';
import { validateChatResponse } from '../../../src/ai/contentFilter';
import { useLuminaThreadStore } from '../../../src/stores/luminaThreadStore';
import type { ChatMessage } from '../../../src/modules/insights/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ──

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Quick Prompt Starters ──

interface QuickPrompt {
  text: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  color: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  { text: 'Why is my baby crying?', icon: 'heart', color: '#E8DDF3' },
  { text: 'Quick play idea for today', icon: 'star', color: '#FEE8DC' },
  { text: 'Is this amount of sleep normal?', icon: 'moon', color: '#DDE3F3' },
  { text: 'When should I call the doctor?', icon: 'alert-circle', color: '#FFEBEE' },
];

// ── Typing Indicator (Graceful Pulsing Dots) ──

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(400 - delay),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 200);
    const a3 = animate(dot3, 400);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }],
  });

  return (
    <View style={chatStyles.aiRow}>
      <Image source={luminaMascot} style={chatStyles.aiAvatarImg} resizeMode="contain" />
      <View style={chatStyles.aiBubble}>
        <View style={chatStyles.typingDots}>
          <Animated.View style={[chatStyles.dot, dotStyle(dot1)]} />
          <Animated.View style={[chatStyles.dot, dotStyle(dot2)]} />
          <Animated.View style={[chatStyles.dot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

// ── Rich Message Text (Markdown-lite) ──

function RichMessageText({ text, isUser }: { text: string; isUser: boolean }) {
  // Split on **bold**, bullet points (• or -), and newlines
  const lines = text.split('\n');

  return (
    <Text style={isUser ? chatStyles.userText : chatStyles.aiText}>
      {lines.map((line, li) => {
        const isBullet = /^\s*[•\-]\s+/.test(line);
        const cleanLine = isBullet ? line.replace(/^\s*[•\-]\s+/, '') : line;
        const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

        return (
          <Text key={li}>
            {li > 0 && '\n'}
            {isBullet && '  •  '}
            {parts.map((part, pi) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={pi} style={isUser ? chatStyles.userTextBold : chatStyles.aiTextBold}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return part;
            })}
          </Text>
        );
      })}
    </Text>
  );
}

// ── Message Bubble with entrance animation ──

function MessageBubble({ msg, isNew }: { msg: ChatMessage; isNew: boolean }) {
  const fadeIn = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideUp = useRef(new Animated.Value(isNew ? 12 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [isNew, fadeIn, slideUp]);

  const isUser = msg.role === 'user';

  return (
    <Animated.View
      style={[
        isUser ? chatStyles.userRow : chatStyles.aiRow,
        { opacity: fadeIn, transform: [{ translateY: slideUp }] },
      ]}
    >
      {!isUser && (
        <Image source={luminaMascot} style={chatStyles.aiAvatarImg} resizeMode="contain" />
      )}
      <View style={isUser ? chatStyles.userBubble : chatStyles.aiBubble}>
        <RichMessageText text={msg.text} isUser={isUser} />
      </View>
    </Animated.View>
  );
}

// ── History Panel ──

function HistoryPanel({
  visible,
  onClose,
  onSelectThread,
  onDeleteThread,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string, title: string) => void;
}) {
  const threads = useLuminaThreadStore((s) => s.threads);
  const recentThreads = useMemo(
    () => threads.filter((t) => !t.isCarePlan).sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  );

  if (!visible) return null;

  return (
    <View style={historyStyles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={historyStyles.panel}>
        <View style={historyStyles.panelHeader}>
          <Text style={historyStyles.panelTitle}>Conversation History</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Feather name="x" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView style={historyStyles.list} showsVerticalScrollIndicator={false}>
          {recentThreads.length === 0 ? (
            <View style={historyStyles.empty}>
              <Feather name="message-circle" size={28} color={colors.textTertiary} />
              <Text style={historyStyles.emptyText}>No conversations yet</Text>
            </View>
          ) : (
            recentThreads.map((thread) => (
              <Pressable
                key={thread.id}
                style={historyStyles.threadRow}
                onPress={() => { onSelectThread(thread.id); onClose(); }}
              >
                <View style={historyStyles.threadContent}>
                  <Text style={historyStyles.threadTitle} numberOfLines={1}>{thread.title}</Text>
                  <Text style={historyStyles.threadPreview} numberOfLines={1}>{thread.preview}</Text>
                </View>
                <Pressable
                  style={historyStyles.deleteBtn}
                  onPress={() => onDeleteThread(thread.id, thread.title)}
                  hitSlop={8}
                >
                  <Feather name="trash-2" size={14} color={colors.textTertiary} />
                </Pressable>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ============================================================
// Main Chat Screen
// ============================================================

export default function LuminaHubScreen() {
  const { babyName, babyAge, feedingMethod } = useDashboardData();
  const activeBaby = useBabyStore((s) => s.getActiveBaby());
  const isPregnant = activeBaby?.is_pregnant ?? false;

  const threadStore = useLuminaThreadStore;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<ScrollView>(null);
  const currentThreadId = useRef<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const displayName = babyName || 'Baby';
  const babyAgeDays = babyAge?.days ?? null;

  // ── Initialize with welcome message ──
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: generateId(),
      role: 'nurse',
      text: `Hello! I'm Lumina, your compassionate parenting companion. Whether it's 3 AM doubts or a quick question about ${displayName}'s day — I'm here. What's on your mind?`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    currentThreadId.current = null;
  }, []);

  // ── Send Message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessageIds((prev) => new Set(prev).add(userMsg.id));
    setInputText('');
    setIsTyping(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Safety check
    const safetyResult = scanMessageForSafety(text.trim());
    if (safetyResult.isRedFlag) {
      const safetyMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: safetyResult.message!,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, safetyMsg]);
      setNewMessageIds((prev) => new Set(prev).add(safetyMsg.id));
      setIsTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    // Build API messages
    const apiMessages = [...messages, userMsg].map((m) => ({
      role: (m.role === 'nurse' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.text,
    }));

    const context = activeBaby ? buildChatContext(activeBaby.id) : null;

    try {
      const response = await sendChatMessage({
        insightContext: '',
        messages: apiMessages,
        babyName: babyName ?? undefined,
        babyAgeDays: babyAgeDays ?? undefined,
        feedingMethod,
        isPregnant,
        recentLogs: context?.recentLogs,
      });

      const replyText = response.reply ?? "I'm having trouble connecting right now. Please try again in a moment.";

      const validation = activeBaby
        ? validateChatResponse(replyText, feedingMethod, activeBaby.known_allergies ?? [])
        : { safe: true, warnings: [] };

      const nurseMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: validation.safe
          ? replyText
          : replyText + '\n\n**Note:** This response may contain content not tailored to your preferences. Please consult your pediatrician for personalized advice.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, nurseMsg]);
      setNewMessageIds((prev) => new Set(prev).add(nurseMsg.id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Persist thread
      if (currentThreadId.current) {
        threadStore.getState().appendMessage(currentThreadId.current, userMsg);
        threadStore.getState().appendMessage(currentThreadId.current, nurseMsg);
      } else {
        const title = userMsg.text.length > 60 ? userMsg.text.slice(0, 57) + '...' : userMsg.text;
        const allMsgs = [...messages, userMsg, nurseMsg];
        const newId = threadStore.getState().createThread(title, allMsgs);
        currentThreadId.current = newId;
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'nurse',
        text: "I'm having trouble connecting right now. In the meantime, trust your instincts — you're doing a great job.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setNewMessageIds((prev) => new Set(prev).add(errorMsg.id));
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [isTyping, messages, babyName, babyAgeDays, feedingMethod, activeBaby, isPregnant, threadStore, displayName]);

  const handleSend = useCallback(() => sendMessage(inputText), [inputText, sendMessage]);

  const handleQuickPrompt = useCallback((text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(text);
  }, [sendMessage]);

  // ── New conversation ──
  const handleNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const welcomeMsg: ChatMessage = {
      id: generateId(),
      role: 'nurse',
      text: `Fresh start! What would you like to talk about, ${displayName}'s parent?`,
      timestamp: Date.now(),
    };
    setMessages([welcomeMsg]);
    setNewMessageIds(new Set([welcomeMsg.id]));
    currentThreadId.current = null;
    setInputText('');
  }, [displayName]);

  // ── Load existing thread ──
  const handleSelectThread = useCallback((threadId: string) => {
    const thread = threadStore.getState().getThread(threadId);
    if (thread) {
      currentThreadId.current = threadId;
      setMessages(thread.messages);
      setNewMessageIds(new Set());
      setInputText('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [threadStore]);

  const handleDeleteThread = useCallback((threadId: string, title: string) => {
    Alert.alert(
      'Delete Conversation',
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            threadStore.getState().deleteThread(threadId);
            if (currentThreadId.current === threadId) {
              handleNewChat();
            }
          },
        },
      ],
    );
  }, [threadStore, handleNewChat]);

  const hasOnlyWelcome = messages.length === 1 && messages[0]?.role === 'nurse';

  return (
    <SafeAreaView style={chatStyles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#FDFCF8', '#F5F0FA', '#F8F5F0']}
        locations={[0, 0.5, 1]}
        style={chatStyles.gradient}
      >
        <KeyboardAvoidingView
          style={chatStyles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* ── Header ── */}
          <View style={chatStyles.header}>
            <Pressable
              style={chatStyles.headerBtn}
              onPress={handleNewChat}
              hitSlop={8}
              accessibilityLabel="New conversation"
            >
              <Feather name="edit" size={20} color={colors.primary[600]} />
            </Pressable>

            <View style={chatStyles.headerCenter}>
              <Image source={luminaMascot} style={chatStyles.headerMascot} resizeMode="contain" />
              <View>
                <Text style={chatStyles.headerTitle}>Lumina</Text>
                <Text style={chatStyles.headerOnline}>Online</Text>
              </View>
            </View>

            <Pressable
              style={chatStyles.headerBtn}
              onPress={() => setShowHistory(true)}
              hitSlop={8}
              accessibilityLabel="Conversation history"
            >
              <Feather name="clock" size={20} color={colors.primary[600]} />
            </Pressable>
          </View>

          {/* ── Messages ── */}
          <ScrollView
            ref={scrollRef}
            style={chatStyles.messageList}
            contentContainerStyle={chatStyles.messageContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isNew={newMessageIds.has(msg.id)}
              />
            ))}
            {isTyping && <TypingIndicator />}

            {/* ── Quick Prompts (only on fresh chat) ── */}
            {hasOnlyWelcome && !isTyping && (
              <View style={chatStyles.quickPromptsSection}>
                <Text style={chatStyles.quickPromptsLabel}>Try asking</Text>
                <View style={chatStyles.quickPromptsGrid}>
                  {QUICK_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt.text}
                      style={chatStyles.quickPromptCard}
                      onPress={() => handleQuickPrompt(prompt.text)}
                    >
                      <View style={[chatStyles.quickPromptIcon, { backgroundColor: prompt.color }]}>
                        <Feather name={prompt.icon} size={16} color={colors.primary[700]} />
                      </View>
                      <Text style={chatStyles.quickPromptText}>{prompt.text}</Text>
                      <Feather name="arrow-up-right" size={14} color={colors.textTertiary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* ── Input Area ── */}
          <View style={chatStyles.inputContainer}>
            <View style={chatStyles.inputRow}>
              <Pressable
                style={chatStyles.micBtn}
                onPress={() => {/* Voice input — wired later */}}
                hitSlop={8}
                accessibilityLabel="Voice input"
              >
                <Feather name="mic" size={20} color={colors.primary[500]} />
              </Pressable>

              <TextInput
                ref={inputRef}
                style={chatStyles.textInput}
                placeholder="Ask Lumina anything..."
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
                  chatStyles.sendBtn,
                  (!inputText.trim() || isTyping) && chatStyles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}
                accessibilityLabel="Send message"
              >
                <Feather
                  name="zap"
                  size={18}
                  color={inputText.trim() && !isTyping ? '#FFFFFF' : colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* ── History Panel ── */}
      <HistoryPanel
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectThread={handleSelectThread}
        onDeleteThread={handleDeleteThread}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Styles
// ============================================================

const chatStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFCF8',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167,139,186,0.15)',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167,139,186,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerMascot: {
    width: 36,
    height: 36,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerOnline: {
    fontSize: typography.fontSize.xs,
    color: '#4CAF50',
    fontWeight: '500',
  },

  // ── Messages ──
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },

  // AI (Lumina) messages
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.base,
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  aiAvatarImg: {
    width: 28,
    height: 28,
    marginBottom: 2,
  },
  aiBubble: {
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderTopLeftRadius: 6,
    padding: spacing.base,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  aiText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: typography.fontSize.base * 1.65,
    letterSpacing: 0.1,
  },
  aiTextBold: {
    fontWeight: '700',
    color: colors.primary[800],
  },

  // User messages
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.base,
  },
  userBubble: {
    maxWidth: '78%',
    backgroundColor: colors.primary[500],
    borderRadius: 20,
    borderTopRightRadius: 6,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  userText: {
    fontSize: typography.fontSize.base,
    color: '#FFFFFF',
    lineHeight: typography.fontSize.base * 1.6,
  },
  userTextBold: {
    fontWeight: '700',
  },

  // Typing indicator
  typingDots: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[400],
  },

  // ── Quick Prompts ──
  quickPromptsSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  quickPromptsLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  quickPromptsGrid: {
    gap: spacing.sm,
  },
  quickPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(167,139,186,0.1)',
  },
  quickPromptIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: typography.fontSize.sm * 1.4,
  },

  // ── Input Area ──
  inputContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xs : spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(167,139,186,0.12)',
    backgroundColor: 'rgba(253,252,248,0.95)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  micBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
});

// ── History Panel Styles ──

const historyStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  panelTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
    gap: 12,
  },
  threadContent: {
    flex: 1,
    gap: 3,
  },
  threadTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  threadPreview: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
  deleteBtn: {
    padding: 6,
  },
});
