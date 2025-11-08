/**
 * RBQ 手机 - MVU数据加载工具
 * 从MVU变量读取手机数据并转换为应用需要的格式
 */

import type { Chat, Message, Post } from '../types';

/**
 * MVU手机数据结构
 */
interface MvuPhoneData {
  当前时间: string;
  用户: {
    昵称: string;
    头像: string;
    空间动态: Array<{
      时间: string;
      内容: string;
      评论列表: Array<{
        ID: string;
        发言内容: string;
      }>;
    }>;
  };
  联系人: Record<
    string,
    {
      昵称: string;
      头像: string;
      聊天记录: Record<
        string,
        {
          is_user: boolean;
          message: string;
        }
      >;
      空间动态: Array<{
        时间: string;
        内容: string;
        评论列表: Array<{
          ID: string;
          发言内容: string;
        }>;
      }>;
    }
  >;
}

/**
 * 等待MVU框架初始化完成
 */
export async function waitForMvu(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Mvu !== 'undefined') {
      resolve();
      return;
    }

    let attempts = 0;
    const checkMvu = setInterval(() => {
      if (typeof Mvu !== 'undefined') {
        clearInterval(checkMvu);
        resolve();
      }
      attempts++;
      if (attempts > 100) {
        clearInterval(checkMvu);
        console.warn('[MvuLoader] MVU框架初始化超时');
        resolve();
      }
    }, 100);
  });
}

/**
 * 从MVU变量读取手机数据
 */
export async function loadPhoneDataFromMvu(): Promise<{
  phoneData: MvuPhoneData | null;
  currentTime: number;
}> {
  try {
    await waitForMvu();

    if (typeof Mvu === 'undefined') {
      console.warn('[MvuLoader] MVU框架不可用');
      return { phoneData: null, currentTime: Date.now() };
    }

    // 获取聊天级别的MVU数据
    const mvuData = Mvu.getMvuData({ type: 'chat' });
    if (!mvuData) {
      console.warn('[MvuLoader] 无法获取MVU数据');
      return { phoneData: null, currentTime: Date.now() };
    }

    // 从MVU数据中提取手机数据变量
    const phoneData = Mvu.getMvuVariable(mvuData, '手机数据', {
      default_value: null,
    }) as MvuPhoneData | null;

    if (!phoneData) {
      console.warn('[MvuLoader] 手机数据变量未找到');
      return { phoneData: null, currentTime: Date.now() };
    }

    // 解析当前时间
    const currentTime = phoneData.当前时间
      ? new Date(phoneData.当前时间).getTime()
      : Date.now();

    console.log('[MvuLoader] 成功加载手机数据:', phoneData);
    return { phoneData, currentTime };
  } catch (error) {
    console.error('[MvuLoader] 加载MVU数据失败:', error);
    return { phoneData: null, currentTime: Date.now() };
  }
}

/**
 * 格式化时间戳为相对时间
 * @param timestamp 消息时间戳
 * @param currentTime 当前时间戳
 * @returns 格式化后的时间字符串
 */
export function formatRelativeTime(timestamp: number, currentTime: number): string {
  const diff = currentTime - timestamp;
  const diffMinutes = Math.floor(diff / 60000);
  const diffHours = Math.floor(diff / 3600000);
  const diffDays = Math.floor(diff / 86400000);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  // 超过7天显示具体时间
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * 格式化时间戳为HH:MM格式
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 将聊天记录对象转换为消息数组
 */
export function convertChatRecordsToMessages(
  chatRecords: Record<string, { is_user: boolean; message: string }>,
  currentTime: number,
  senderName: string,
  senderAvatar?: string
): Message[] {
  return Object.entries(chatRecords)
    .map(([timeStr, record]) => {
      const timestamp = new Date(timeStr).getTime();
      return {
        id: timeStr,
        type: 'text' as const,
        content: record.message,
        sender: record.is_user ? 'user' : senderName,
        senderAvatar: record.is_user ? undefined : senderAvatar,
        timestamp: formatTime(timestamp),
      };
    })
    .sort((a, b) => {
      // 按时间顺序排序
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
}

/**
 * 从MVU手机数据创建Chat对象
 */
export function createChatsFromMvuData(
  phoneData: MvuPhoneData,
  currentTime: number
): Map<string, Chat> {
  const chatsMap = new Map<string, Chat>();

  if (!phoneData.联系人) {
    return chatsMap;
  }

  Object.entries(phoneData.联系人).forEach(([contactName, contactData]) => {
    const chatRecords = contactData.聊天记录 || {};
    const messages = convertChatRecordsToMessages(
      chatRecords,
      currentTime,
      contactData.昵称,
      contactData.头像
    );

    // 获取最后一条消息
    const lastMessage = messages[messages.length - 1];
    const lastTime = lastMessage
      ? formatRelativeTime(new Date(lastMessage.timestamp).getTime(), currentTime)
      : '';

    const chat: Chat = {
      id: contactName,
      otherName: contactData.昵称,
      otherAvatar: contactData.头像,
      messages,
      lastMessage,
      unread: 0,
      lastTime,
    };

    chatsMap.set(contactName, chat);
  });

  return chatsMap;
}

/**
 * 从MVU手机数据创建Post数组（动态列表）
 */
export function createPostsFromMvuData(
  phoneData: MvuPhoneData,
  userAvatar: string,
  currentTime: number
): Post[] {
  const posts: Post[] = [];

  // 添加用户的动态
  if (phoneData.用户.空间动态 && Array.isArray(phoneData.用户.空间动态)) {
    phoneData.用户.空间动态.forEach((moment, index) => {
      const timestamp = new Date(moment.时间).getTime();
      posts.push({
        id: `user-${index}`,
        authorName: phoneData.用户.昵称,
        authorAvatar: userAvatar,
        content: moment.内容,
        timestamp: formatRelativeTime(timestamp, currentTime),
        likes: 0,
        comments: moment.评论列表 ? moment.评论列表.length : 0,
      });
    });
  }

  // 添加所有联系人的动态
  if (phoneData.联系人) {
    Object.entries(phoneData.联系人).forEach(([contactName, contactData]) => {
      if (contactData.空间动态 && Array.isArray(contactData.空间动态)) {
        contactData.空间动态.forEach((moment, index) => {
          const timestamp = new Date(moment.时间).getTime();
          posts.push({
            id: `${contactName}-${index}`,
            authorName: contactData.昵称,
            authorAvatar: contactData.头像,
            content: moment.内容,
            timestamp: formatRelativeTime(timestamp, currentTime),
            likes: 0,
            comments: moment.评论列表 ? moment.评论列表.length : 0,
          });
        });
      }
    });
  }

  // 按时间倒序排列（最新的在前）
  posts.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return posts;
}

/**
 * 主函数：从MVU加载完整的手机数据
 */
export async function loadAndTransformPhoneData(userAvatar: string): Promise<{
  chats: Map<string, Chat>;
  posts: Post[];
  currentTime: number;
} | null> {
  try {
    const { phoneData, currentTime } = await loadPhoneDataFromMvu();

    if (!phoneData) {
      console.warn('[MvuLoader] 无法加载手机数据');
      return null;
    }

    // 转换聊天数据
    const chats = createChatsFromMvuData(phoneData, currentTime);

    // 转换动态数据
    const posts = createPostsFromMvuData(phoneData, userAvatar, currentTime);

    console.log('[MvuLoader] 数据转换完成:', { chats, posts, currentTime });

    return {
      chats,
      posts,
      currentTime,
    };
  } catch (error) {
    console.error('[MvuLoader] 数据加载和转换失败:', error);
    return null;
  }
}

/**
 * 获取当前时间（用于动态更新）
 */
export async function getCurrentTimeFromMvu(): Promise<number> {
  const { phoneData, currentTime } = await loadPhoneDataFromMvu();
  return currentTime;
}
