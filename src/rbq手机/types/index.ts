/**
 * 沉浸式手机应用模拟器 - 核心数据结构定义
 * Phone Simulator Core Type Definitions
 */

/**
 * 消息对象
 */
export interface Message {
  id: string;                      // 唯一标识符
  type: 'text' | 'image' | 'emoji' | 'music' | 'system';  // 消息类型
  content: string;                 // 消息内容
  sender: string;                  // 发送者名称
  senderAvatar?: string;           // 发送者头像URL
  timestamp: string;               // 时间戳 HH:MM 格式
  reactions?: string[];            // 表情反应（点赞等）
}

/**
 * 聊天对象
 */
export interface Chat {
  id: string;                      // 聊天唯一标识符
  otherName: string;               // 对方名称
  otherAvatar?: string;            // 对方头像URL
  messages: Message[];             // 聊天消息列表
  lastMessage?: Message;           // 最后一条消息
  unread: number;                  // 未读消息数
  lastTime: string;                // 最后交互时间
}

/**
 * 动态/朋友圈帖子
 */
export interface Post {
  id: string;                      // 动态唯一标识符
  authorName: string;              // 发布者名称
  authorAvatar?: string;           // 发布者头像URL
  content: string;                 // 动态内容
  images?: string[];               // 动态中的图片URL列表
  timestamp: string;               // 发布时间
  likes: number;                   // 点赞数
  comments: number;                // 评论数
}

/**
 * 手机主题配置
 */
export interface PhoneTheme {
  borderColor: string;             // 边框色 (HEX格式)
  backgroundColor: string;         // 背景色 (HEX格式)
  bubbleColor: {
    mine: string;                  // 自己的消息气泡色
    other: string;                 // 他人的消息气泡色
  };
  textColor: string;               // 字体色 (HEX格式)
  statusBarColor?: string;         // 状态栏颜色
}

/**
 * 手机UI尺寸
 */
export interface PhoneSize {
  width: number;                   // 宽度 (像素)
  height: number;                  // 高度 (像素)
}

/**
 * 手机位置（用于拖动）
 */
export interface PhonePosition {
  x: number;                       // X坐标
  y: number;                       // Y坐标
}

/**
 * 手机全局状态
 */
export interface PhoneState {
  // === UI状态 ===
  isVisible: boolean;              // 手机是否显示
  position: PhonePosition;         // 拖动位置
  size: PhoneSize;                 // 手机尺寸

  // === 主题/外观 ===
  theme: PhoneTheme;               // 主题配置

  // === 数据 ===
  chats: Map<string, Chat>;        // 所有聊天 (使用Map便于查找)
  posts: Post[];                   // 所有动态列表

  // === 导航状态 ===
  currentChatId?: string;          // 当前打开的聊天ID
  currentPage: 'chat' | 'home' | 'settings';    // 当前页面 (聊天、动态或设置)

  // === 应用设置 ===
  settings: {
    messageMode: 'direct' | 'input';  // 消息发送模式: 直接发送或添加到输入框
    fontSize: 'small' | 'medium' | 'large';  // 字体大小
  };
}

/**
 * 消息解析结果
 * 用于从原始文本解析出结构化消息
 */
export interface ParsedMessageContent {
  type: 'text' | 'image' | 'emoji' | 'music';
  content: string;                 // 对于emoji和image，content是标识符或URL
}

/**
 * 私聊消息解析结果
 */
export interface ParsedPrivateMessage {
  sender: string;                  // 发送者名称
  receiver: string;                // 接收者名称
  contents: ParsedMessageContent[]; // 消息内容块列表
  timestamp: string;               // 时间戳 HH:MM
}

/**
 * 动态消息解析结果
 */
export interface ParsedHomeMessage {
  author: string;                  // 发布者名称
  content: string;                 // 动态内容
  timestamp: string;               // 时间戳 HH:MM
}

/**
 * 世界书配置
 */
export interface WorldbookConfig {
  borderColor: string;
  backgroundColor: string;
  bubbleColorMine: string;
  bubbleColorOther: string;
  textColor: string;
  defaultWidth: number;
  defaultHeight: number;
  emojiMap: Record<string, string>; // 表情名称 -> URL映射
  avatarMap: Record<string, string>; // 角色名称 -> 头像URL映射
}

/**
 * 持久化数据结构（保存到酒馆变量）
 */
export interface PhonePersistentData {
  chats: Chat[];                   // 聊天列表（转换为数组用于序列化）
  posts: Post[];                   // 动态列表
  lastUpdated: number;             // 最后更新时间戳
  version: number;                 // 数据版本号
}

/**
 * UI状态持久化（保存到IndexedDB）
 */
export interface PhoneUIState {
  position: PhonePosition;
  size: PhoneSize;
  isVisible: boolean;
  currentPage: 'chat' | 'home';
}
