/**
 * 消息解析工具
 * 用于解析AI输出中的Phone格式消息
 */

import type {
  ParsedPrivateMessage,
  ParsedHomeMessage,
  ParsedMessageContent,
  Message,
} from '../types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 解析私聊消息
 * 识别 Phone.Private('sender','receiver','content','HH:MM') 格式
 */
export function parsePrivateMessage(text: string): ParsedPrivateMessage | null {
  const regex = /Phone\.Private\('([^']+)','([^']+)','([^']*)','([^']+)'\);/;
  const match = text.match(regex);

  if (!match) {
    return null;
  }

  const [, sender, receiver, content, timestamp] = match;

  return {
    sender: sender.trim(),
    receiver: receiver.trim(),
    contents: parseMessageContent(content),
    timestamp: timestamp.trim(),
  };
}

/**
 * 解析动态消息
 * 识别 Phone.Home('author','content','HH:MM') 格式
 */
export function parseHomeMessage(text: string): ParsedHomeMessage | null {
  const regex = /Phone\.Home\('([^']+)','([^']*)','([^']+)'\);/;
  const match = text.match(regex);

  if (!match) {
    return null;
  }

  const [, author, content, timestamp] = match;

  return {
    author: author.trim(),
    content: content.trim(),
    timestamp: timestamp.trim(),
  };
}

/**
 * 解析消息内容
 * 从内容中提取文本块和特殊标记（表情、图片、音乐等）
 *
 * 示例：
 * "今天天气真好[emoji-开心]，看我的照片[image-公园]"
 * 返回：
 * [
 *   { type: 'text', content: '今天天气真好' },
 *   { type: 'emoji', content: '开心' },
 *   { type: 'text', content: '，看我的照片' },
 *   { type: 'image', content: '公园' }
 * ]
 */
export function parseMessageContent(content: string): ParsedMessageContent[] {
  const result: ParsedMessageContent[] = [];

  // 分解成文本和标记
  const parts = content.split(/(\[[^\]]+\])/);

  for (const part of parts) {
    if (!part) continue;

    // 检查是否是标记
    const tagMatch = part.match(/^\[([a-z]+)-([^\]]+)\]$/);

    if (tagMatch) {
      const [, type, value] = tagMatch;

      if (type === 'emoji') {
        result.push({ type: 'emoji', content: value });
      } else if (type === 'image') {
        result.push({ type: 'image', content: value });
      } else if (type === 'music') {
        // 音乐格式: [music-歌名$歌手]
        result.push({ type: 'music', content: value });
      } else {
        // 未知标记，作为文本处理
        result.push({ type: 'text', content: part });
      }
    } else {
      // 普通文本
      result.push({ type: 'text', content: part });
    }
  }

  // 合并相邻的文本块
  return mergeTextBlocks(result);
}

/**
 * 合并相邻的文本块
 */
function mergeTextBlocks(
  blocks: ParsedMessageContent[]
): ParsedMessageContent[] {
  const result: ParsedMessageContent[] = [];

  for (const block of blocks) {
    if (block.type === 'text' && result.length > 0 && result[result.length - 1].type === 'text') {
      result[result.length - 1].content += block.content;
    } else if (block.type !== 'text' || block.content.trim()) {
      // 跳过空文本块
      result.push(block);
    }
  }

  return result;
}

/**
 * 从ParsedMessageContent创建Message对象
 */
export function createMessageObject(
  sender: string,
  contents: ParsedMessageContent[],
  timestamp: string,
  senderAvatar?: string
): Message[] {
  return contents.map((content) => ({
    id: generateId(),
    type: content.type as 'text' | 'image' | 'emoji' | 'music',
    content: content.content,
    sender,
    senderAvatar,
    timestamp,
    reactions: [],
  }));
}

/**
 * 处理私聊消息（完整流程）
 * 返回消息对象数组
 */
export function processPrivateMessage(
  text: string,
  senderAvatar?: string
): Message[] | null {
  const parsed = parsePrivateMessage(text);
  if (!parsed) {
    return null;
  }

  return createMessageObject(parsed.sender, parsed.contents, parsed.timestamp, senderAvatar);
}

/**
 * 处理动态消息
 * 返回动态内容和时间戳信息
 */
export function processHomeMessage(
  text: string
): { author: string; content: string; images: string[]; timestamp: string } | null {
  const parsed = parseHomeMessage(text);
  if (!parsed) {
    return null;
  }

  // 从内容中提取图片
  const images: string[] = [];
  const contentBlocks = parseMessageContent(parsed.content);
  let mainContent = '';

  for (const block of contentBlocks) {
    if (block.type === 'image') {
      images.push(block.content);
    } else if (block.type === 'text') {
      mainContent += block.content;
    } else if (block.type === 'emoji') {
      mainContent += `[${block.content}]`;
    }
  }

  return {
    author: parsed.author,
    content: mainContent.trim(),
    images,
    timestamp: parsed.timestamp,
  };
}

/**
 * 从聊天消息中提取所有Phone格式的消息
 * 用于初始化时从酒馆聊天记录中恢复数据
 */
export function extractPhoneMessagesFromChat(
  chatMessage: string
): { private: ParsedPrivateMessage[]; home: ParsedHomeMessage[] } {
  const privateMessages: ParsedPrivateMessage[] = [];
  const homeMessages: ParsedHomeMessage[] = [];

  // 提取私聊消息
  const privateRegex = /Phone\.Private\('([^']+)','([^']+)','([^']*)','([^']+)'\);/g;
  let match;
  while ((match = privateRegex.exec(chatMessage))) {
    const [, sender, receiver, content, timestamp] = match;
    privateMessages.push({
      sender: sender.trim(),
      receiver: receiver.trim(),
      contents: parseMessageContent(content),
      timestamp: timestamp.trim(),
    });
  }

  // 提取动态消息
  const homeRegex = /Phone\.Home\('([^']+)','([^']*)','([^']+)'\);/g;
  while ((match = homeRegex.exec(chatMessage))) {
    const [, author, content, timestamp] = match;
    homeMessages.push({
      author: author.trim(),
      content: content.trim(),
      timestamp: timestamp.trim(),
    });
  }

  return { private: privateMessages, home: homeMessages };
}

/**
 * 验证时间格式 HH:MM
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * 获取表情包名称（从标记中）
 */
export function getEmojiName(content: string): string {
  // content 应该是从 [emoji-名称] 中提取的 "名称" 部分
  return content.trim();
}

/**
 * 获取图片描述（从标记中）
 */
export function getImageDescription(content: string): string {
  // content 应该是从 [image-描述] 中提取的 "描述" 部分
  return content.trim();
}

/**
 * 解析音乐标记
 * [music-歌名$歌手] -> { name: '歌名', artist: '歌手' }
 */
export function parseMusicTag(
  content: string
): { name: string; artist: string } | null {
  const parts = content.split('$');
  if (parts.length === 2) {
    return {
      name: parts[0].trim(),
      artist: parts[1].trim(),
    };
  }
  return null;
}
