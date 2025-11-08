/**
 * 手机应用模拟器 - 全局状态管理
 * Phone Simulator - Global State Management
 */

import { ref, reactive, computed } from 'vue';
import type { PhoneState, Chat, Post, Message, PhoneTheme, PhoneSize } from '../types';

/**
 * 默认主题配置
 */
const DEFAULT_THEME: PhoneTheme = {
  borderColor: '#333333',
  backgroundColor: '#FFFFFF',
  bubbleColor: {
    mine: '#DCF8C6',
    other: '#FFFFFF',
  },
  textColor: '#000000',
  statusBarColor: '#F0F0F0',
};

/**
 * 默认尺寸
 */
const DEFAULT_SIZE: PhoneSize = {
  width: 400,
  height: 800,
};

/**
 * 默认设置
 */
const DEFAULT_SETTINGS = {
  messageMode: 'direct' as 'direct' | 'input', // 'direct': 直接发送, 'input': 添加到输入框
  fontSize: 'medium' as 'small' | 'medium' | 'large',
};

/**
 * 全局手机状态
 */
export const phoneState = reactive<PhoneState>({
  isVisible: false,
  position: { x: 100, y: 100 },
  size: DEFAULT_SIZE,
  theme: { ...DEFAULT_THEME },
  chats: new Map(),
  posts: [],
  currentChatId: undefined,
  currentPage: 'chat',
  settings: { ...DEFAULT_SETTINGS },
});

/**
 * 初始化手机状态
 * 从IndexedDB加载UI状态，从MVU变量加载数据
 */
export async function initializePhoneState() {
  try {
    // 1. 从IndexedDB加载UI状态（位置、尺寸等）
    const uiState = await loadUIStateFromIDB();
    if (uiState) {
      phoneState.isVisible = uiState.isVisible ?? false;
      phoneState.position = uiState.position ?? { x: 100, y: 100 };
      phoneState.size = uiState.size ?? DEFAULT_SIZE;
      phoneState.currentPage = uiState.currentPage ?? 'chat';
      phoneState.settings = { ...DEFAULT_SETTINGS, ...uiState.settings };
    }

    // 2. 从MVU加载数据（聊天记录、动态等）
    await loadPhoneDataFromMvu();

    console.log('[PhoneState] 初始化完成', phoneState);
  } catch (error) {
    console.error('[PhoneState] 初始化失败:', error);
  }
}

/**
 * 从MVU变量加载手机数据
 */
export async function loadPhoneDataFromMvu() {
  try {
    const { loadAndTransformPhoneData } = await import('../utils/mvu-loader');

    // 获取用户头像（从酒馆动态获取）
    let userAvatar = '';
    try {
      if (typeof triggerSlash === 'function') {
        const avatarPath = await triggerSlash('/pass {{userAvatarPath}}');
        if (avatarPath && typeof avatarPath === 'string' && avatarPath !== 'undefined') {
          userAvatar = avatarPath;
        }
      }
    } catch (error) {
      console.warn('[PhoneState] 获取用户头像失败:', error);
    }

    // 加载并转换MVU数据
    const result = await loadAndTransformPhoneData(userAvatar);
    if (result) {
      phoneState.chats = result.chats;
      phoneState.posts = result.posts;
      console.log('[PhoneState] MVU数据已加载');
    }
  } catch (error) {
    console.error('[PhoneState] 加载MVU数据失败:', error);
  }
}

/**
 * 设置MVU事件监听
 */
export function setupMvuListener() {
  if (typeof eventOn !== 'function' || typeof Mvu === 'undefined') {
    console.warn('[PhoneState] MVU框架不可用，无法设置监听');
    return;
  }

  // 监听MVU变量更新事件
  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async () => {
    console.log('[PhoneState] 检测到MVU变量更新');
    await loadPhoneDataFromMvu();
  });

  // 监听消息楼层变量变化
  if (Mvu.events.MESSAGE_VARIABLE_CHANGED) {
    eventOn(Mvu.events.MESSAGE_VARIABLE_CHANGED, async () => {
      console.log('[PhoneState] 检测到消息楼层变量变化');
      setTimeout(async () => {
        await loadPhoneDataFromMvu();
      }, 100);
    });
  }

  // 监听AI生成完成事件
  if (typeof tavern_events !== 'undefined') {
    eventOn(tavern_events.GENERATION_ENDED, async () => {
      console.log('[PhoneState] 检测到AI生成完成');
      setTimeout(async () => {
        await loadPhoneDataFromMvu();
      }, 300);
    });
  }

  console.log('[PhoneState] MVU事件监听已设置');
}

/**
 * 保存状态到酒馆变量
 */
export async function savePhoneStateToVariables() {
  try {
    const chatsArray = Array.from(phoneState.chats.values());
    const dataToSave = {
      chats: chatsArray,
      posts: phoneState.posts,
      theme: phoneState.theme,
      lastUpdated: Date.now(),
      version: 1,
    };

    await replaceVariables(dataToSave, { type: 'script', script_id: getScriptId() });
    console.log('[PhoneState] 数据已保存到酒馆变量');
  } catch (error) {
    console.error('[PhoneState] 保存失败:', error);
  }
}

/**
 * 保存UI状态到IndexedDB
 */
export async function saveUIStateToIDB() {
  try {
    const uiState = {
      position: phoneState.position,
      size: phoneState.size,
      isVisible: phoneState.isVisible,
      currentPage: phoneState.currentPage,
      settings: phoneState.settings,
    };

    // 简单的localStorage实现（可替换为真实IndexedDB）
    localStorage.setItem('rbq_phone_ui_state', JSON.stringify(uiState));
    console.log('[PhoneState] UI状态已保存到存储');
  } catch (error) {
    console.error('[PhoneState] UI状态保存失败:', error);
  }
}

/**
 * 从IndexedDB加载UI状态
 */
export async function loadUIStateFromIDB() {
  try {
    const stored = localStorage.getItem('rbq_phone_ui_state');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('[PhoneState] UI状态加载失败:', error);
    return null;
  }
}

/**
 * 添加或更新聊天
 */
export function addOrUpdateChat(chat: Chat) {
  phoneState.chats.set(chat.id, chat);
  savePhoneStateToVariables();
}

/**
 * 添加消息到聊天
 */
export function addMessageToChat(chatId: string, message: Message) {
  const chat = phoneState.chats.get(chatId);
  if (chat) {
    chat.messages.push(message);
    chat.lastMessage = message;
    chat.lastTime = message.timestamp;
    savePhoneStateToVariables();
  }
}

/**
 * 获取或创建聊天对象
 */
export function getOrCreateChat(chatId: string, otherName: string, otherAvatar?: string): Chat {
  let chat = phoneState.chats.get(chatId);
  if (!chat) {
    chat = {
      id: chatId,
      otherName,
      otherAvatar,
      messages: [],
      unread: 0,
      lastTime: '',
    };
    phoneState.chats.set(chatId, chat);
  }
  return chat;
}

/**
 * 添加动态
 */
export function addPost(post: Post) {
  phoneState.posts.unshift(post); // 新动态在最前面
  savePhoneStateToVariables();
}

/**
 * 切换手机显示/隐藏
 */
export function togglePhoneVisibility() {
  phoneState.isVisible = !phoneState.isVisible;
  saveUIStateToIDB();
}

/**
 * 显示手机
 */
export function showPhone() {
  phoneState.isVisible = true;
  saveUIStateToIDB();
}

/**
 * 隐藏手机
 */
export function hidePhone() {
  phoneState.isVisible = false;
  saveUIStateToIDB();
}

/**
 * 设置当前聊天
 */
export function setCurrentChat(chatId: string | undefined) {
  phoneState.currentChatId = chatId;
}

/**
 * 切换页面
 */
export function setCurrentPage(page: 'chat' | 'home' | 'settings') {
  phoneState.currentPage = page;
  saveUIStateToIDB();
}

/**
 * 更新手机尺寸
 */
export function updatePhoneSize(width: number, height: number) {
  phoneState.size = { width, height };
  saveUIStateToIDB();
}

/**
 * 更新手机位置
 */
export function updatePhonePosition(x: number, y: number) {
  phoneState.position = { x, y };
  saveUIStateToIDB();
}

/**
 * 更新主题
 */
export function updateTheme(theme: Partial<PhoneTheme>) {
  phoneState.theme = { ...phoneState.theme, ...theme };
  savePhoneStateToVariables();
}

/**
 * 重置主题为默认值
 */
export function resetThemeToDefault() {
  phoneState.theme = { ...DEFAULT_THEME };
  savePhoneStateToVariables();
}

/**
 * 更新设置
 */
export function updateSettings(settings: Partial<typeof DEFAULT_SETTINGS>) {
  phoneState.settings = { ...phoneState.settings, ...settings };
  saveUIStateToIDB();
}

/**
 * 获取字体大小倍数
 */
export function getFontSizeMultiplier(): number {
  const sizes = { small: 0.85, medium: 1, large: 1.15 };
  return sizes[phoneState.settings.fontSize];
}

/**
 * 清空所有数据（调试用）
 */
export function clearAllData() {
  phoneState.chats.clear();
  phoneState.posts = [];
  phoneState.currentChatId = undefined;
  savePhoneStateToVariables();
  console.log('[PhoneState] 所有数据已清空');
}

/**
 * 获取当前聊天
 */
export const currentChat = computed(() => {
  if (!phoneState.currentChatId) return null;
  return phoneState.chats.get(phoneState.currentChatId) || null;
});

/**
 * 获取所有聊天列表
 */
export const chatList = computed(() => {
  return Array.from(phoneState.chats.values()).sort((a, b) => {
    // 按最后交互时间排序（最近的在前）
    return b.lastTime.localeCompare(a.lastTime);
  });
});

/**
 * 获取未读消息总数
 */
export const totalUnread = computed(() => {
  return Array.from(phoneState.chats.values()).reduce((sum, chat) => sum + chat.unread, 0);
});
