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
} from 'react-native';
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
  { text: 'Why is my baby crying?', icon: 'heart', color: '#F0E8F7' },
  { text: 'Play ideas for today', icon: 'star', color: '#FDF0E8' },
  { text: 'Is this sleep normal?', icon: 'moon', color: '#E8EDF7' },
  { text: 'Call the doctor?', icon: 'alert-circle', color: '#FBEAEA' },
];

// Pressed-state pastel glow colors per chip
const CHIP_PRESSED_COLORS: string[][] = [
  ['#E8DDF3', '#F5F0FA'],
  ['#FEE8DC', '#FFF5F0'],
  ['#DDE3F3', '#F0F3FA'],
  ['#FFEBEE', '#FFF5F5'],
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
        <View style={chatStyles.aiAvatar}>
          <Feather name="heart" size={12} color="#FFFFFF" />
        </View>
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
    <SafeAreaView style={chatStyles.safeArea} edges={['bottom']}>
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
              <View style={chatStyles.headerDot} />
              <Text style={chatStyles.headerTitle}>Lumina</Text>
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
                <Text style={chatStyles.quickPromptsLabel}>Tap to ask:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={chatStyles.quickPromptsRow}
                >
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <Pressable
                      key={prompt.text}
                      style={({ pressed }) => [
                        chatStyles.quickChip,
                        pressed && {
                          backgroundColor: CHIP_PRESSED_COLORS[idx][0],
                          transform: [{ scale: 0.96 }],
                        },
                      ]}
                      onPress={() => handleQuickPrompt(prompt.text)}
                    >
                      <View style={[chatStyles.quickChipDot, { backgroundColor: prompt.color }]}>
                        <Feather name={prompt.icon} size={12} color={colors.primary[600]} />
                      </View>
                      <Text style={chatStyles.quickChipText}>{prompt.text}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* ── Input Area ── */}
          <View style={chatStyles.inputContainer}>
            {/* Inset clay "havuz" — carved pool for typing */}
            <View style={chatStyles.inputHavuz}>
              <TextInput
                ref={inputRef}
                style={chatStyles.textInput}
                placeholder="Type here..."
                placeholderTextColor="#8B7BA0"
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
                  name="send"
                  size={16}
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
    borderBottomWidth: 0,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle clay button
    shadowColor: '#C8B8DB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.7)',
    borderLeftWidth: 0.5,
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: '#4A3F60',
    letterSpacing: -0.3,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    // Mini clay pill
    shadowColor: '#B199CE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  aiBubble: {
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderTopLeftRadius: 6,
    padding: spacing.base,
    paddingHorizontal: spacing.lg,
    // Soft clay card shadow
    shadowColor: '#C8B8DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
    borderTopWidth: 1,
    borderLeftWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.9)',
    borderLeftColor: 'rgba(255,255,255,0.5)',
  },
  aiText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: '#3D2E4C',
    lineHeight: typography.fontSize.base * 1.65,
    letterSpacing: 0.1,
  },
  aiTextBold: {
    fontFamily: typography.fontFamily.bold,
    color: '#4A3860',
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
    borderRadius: 22,
    borderTopRightRadius: 6,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    // Puffy clay bubble
    shadowColor: '#8E72A4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  userText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: '#FFFFFF',
    lineHeight: typography.fontSize.base * 1.6,
  },
  userTextBold: {
    fontFamily: typography.fontFamily.bold,
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

  // ── Quick Prompt Chips ──
  quickPromptsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  quickPromptsLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: '#8B7BA0',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  quickPromptsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 63, 96, 0.06)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickChipDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: '#5D4E78',
  },

  // ── Input Area — Inset Clay Havuz ──
  inputContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    backgroundColor: 'transparent',
  },
  inputHavuz: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    // Inset hack — no shadows, border-only concave illusion
    backgroundColor: '#F4F3F7',
    borderRadius: 30,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    paddingVertical: 6,
    // Darker top-left = shadow falling inside
    borderWidth: 1,
    borderTopColor: '#E0DDE5',
    borderLeftColor: '#E0DDE5',
    // Lighter bottom-right = highlight catching light
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: '#3D2E4C',
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    // Puffy clay pill — matches home action buttons
    shadowColor: '#B199CE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
    // Clay highlight — top-left light
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.45)',
    borderLeftColor: 'rgba(255,255,255,0.25)',
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomColor: 'rgba(100,70,140,0.1)',
    borderRightColor: 'rgba(100,70,140,0.05)',
  },
  sendBtnDisabled: {
    backgroundColor: colors.neutral[300],
    shadowColor: '#AAA',
    shadowOpacity: 0.1,
    elevation: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
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
