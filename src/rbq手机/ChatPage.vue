<template>
  <div class="rbq-chat-page">
    <!-- 聊天列表视图 -->
    <div v-if="!phoneState.currentChatId" class="rbq-chat-list-view">
      <div class="rbq-chat-list-header">
        <h2>消息</h2>
      </div>

      <div class="rbq-chat-list-container">
        <div v-if="chatList.length === 0" class="rbq-empty-state">
          <div class="rbq-empty-icon">💬</div>
          <div class="rbq-empty-text">暂无消息</div>
        </div>

        <div v-for="chat in chatList" :key="chat.id" class="rbq-chat-item" @click="openChat(chat.id)">
          <div class="rbq-chat-avatar">
            <img v-if="chat.otherAvatar" :src="chat.otherAvatar" :alt="chat.otherName" />
            <div v-else class="rbq-avatar-placeholder">{{ chat.otherName.charAt(0) }}</div>
          </div>

          <div class="rbq-chat-info">
            <div class="rbq-chat-header">
              <div class="rbq-chat-name">{{ chat.otherName }}</div>
              <div class="rbq-chat-time">{{ chat.lastTime }}</div>
            </div>
            <div class="rbq-chat-preview">
              {{ getMessagePreview(chat.lastMessage) }}
            </div>
          </div>

          <div v-if="chat.unread > 0" class="rbq-unread-badge">
            {{ chat.unread > 99 ? '99+' : chat.unread }}
          </div>
        </div>
      </div>
    </div>

    <!-- 单聊视图 -->
    <div v-else class="rbq-single-chat-view">
      <!-- 聊天头部 -->
      <div class="rbq-chat-header-bar">
        <button class="rbq-back-btn" @click="closeChat">
          <span>&lt;</span>
        </button>
        <div class="rbq-chat-title">{{ currentChat?.otherName }}</div>
        <div class="rbq-header-right"></div>
      </div>

      <!-- 消息列表 -->
      <div class="rbq-messages-container">
        <div v-if="currentChat && currentChat.messages.length === 0" class="rbq-empty-state">
          <div class="rbq-empty-icon">👋</div>
          <div class="rbq-empty-text">开始聊天吧</div>
        </div>

        <Bubble
          v-for="message in currentChat?.messages"
          :key="message.id"
          :message="message"
          :current-user="currentUserName"
        />
      </div>

      <!-- 输入框 -->
      <div class="rbq-input-area">
        <input
          v-model="messageInput"
          type="text"
          class="rbq-input-field"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
        />
        <button class="rbq-send-btn" @click="sendMessageButton">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { phoneState, currentChat, chatList, setCurrentChat, loadPhoneDataFromMvu } from './stores/phone-state';
import Bubble from './components/Bubble.vue';
import type { Message } from './types';

const currentUserName = ref('user');
const messageInput = ref('');

/**
 * 打开聊天
 */
function openChat(chatId: string) {
  setCurrentChat(chatId);
}

/**
 * 关闭聊天
 */
function closeChat() {
  setCurrentChat(undefined);
}

/**
 * 获取消息预览文本
 */
function getMessagePreview(message: Message | undefined): string {
  if (!message) return '暂无消息';

  switch (message.type) {
    case 'text':
      return message.content.substring(0, 50);
    case 'image':
      return '[图片]';
    case 'emoji':
      return '[表情]';
    case 'music':
      return '[音乐]';
    case 'system':
      return message.content;
    default:
      return '新消息';
  }
}

/**
 * 获取格式化的当前时间 YYYY-MM-DD HH:MM:SS
 */
function getFormattedTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 处理发送消息逻辑（提取为共享函数）
 */
function handleSendMessage(content: string) {
  if (!content || !currentChat.value) return;

  if (phoneState.settings.messageMode === 'direct') {
    // 模式1: 直接发送消息到手机UI，并向酒馆输入框注入文本
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'text',
      content: content,
      sender: currentUserName.value,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    const chat = phoneState.chats.get(phoneState.currentChatId!);
    if (chat) {
      // 1. 本地显示消息
      chat.messages.push(newMessage);
      chat.lastMessage = newMessage;
      chat.lastTime = newMessage.timestamp;

      // 2. 向酒馆输入框注入格式化文本
      const currentTime = getFormattedTime();
      const formattedText = `[给${chat.otherName}发送了消息]：${content}\n时间: ${currentTime}`;

      const inputElement = document.querySelector('textarea.edit-textarea') ||
        (document.activeElement?.getRootNode() as any)?.querySelector?.('.user-input-area textarea');

      if (inputElement) {
        inputElement.value = (inputElement.value || '') + '\n' + formattedText;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  } else if (phoneState.settings.messageMode === 'input') {
    // 模式2: 把消息添加到酒馆的输入框
    const inputElement = (document.activeElement?.getRootNode() as any)?.querySelector?.('.user-input-area textarea') ||
      document.querySelector('textarea.edit-textarea');

    if (inputElement) {
      inputElement.value = (inputElement.value || '') + '\n' + content;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  messageInput.value = '';
}

/**
 * 发送消息（按回车键）
 */
function sendMessage(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement;
  const content = input.value.trim();
  handleSendMessage(content);
}

/**
 * 发送消息（点击按钮）
 */
function sendMessageButton() {
  const content = messageInput.value.trim();
  handleSendMessage(content);
}

/**
 * 初始化MVU事件监听
 */
onMounted(() => {
  // 初始加载一次数据
  loadPhoneDataFromMvu();

  // 监听MVU变量更新
  if (typeof eventOn === 'function' && typeof Mvu !== 'undefined') {
    // 监听变量更新完成事件
    if (Mvu.events?.VARIABLE_UPDATE_ENDED) {
      eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async () => {
        console.log('[ChatPage] 检测到MVU变量更新');
        await loadPhoneDataFromMvu();
      });
    }

    // 监听消息楼层变量变化
    if (Mvu.events?.MESSAGE_VARIABLE_CHANGED) {
      eventOn(Mvu.events.MESSAGE_VARIABLE_CHANGED, async () => {
        console.log('[ChatPage] 检测到消息楼层变量变化');
        setTimeout(async () => {
          await loadPhoneDataFromMvu();
        }, 100);
      });
    }

    // 监听AI生成完成事件
    if (typeof tavern_events !== 'undefined' && tavern_events.GENERATION_ENDED) {
      eventOn(tavern_events.GENERATION_ENDED, async () => {
        console.log('[ChatPage] 检测到AI生成完成');
        setTimeout(async () => {
          await loadPhoneDataFromMvu();
        }, 300);
      });
    }
  }
});
</script>

<style scoped lang="scss">
.rbq-chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* === 聊天列表视图 === */
.rbq-chat-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.rbq-chat-list-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
}

.rbq-chat-list-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.rbq-chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:active {
    background-color: #f5f5f5;
  }
}

.rbq-chat-avatar {
  flex-shrink: 0;
  width: 50px;
  height: 50px;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.rbq-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.rbq-chat-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rbq-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rbq-chat-name {
  font-size: 15px;
  font-weight: 600;
  color: #000;
}

.rbq-chat-time {
  font-size: 12px;
  color: #999;
}

.rbq-chat-preview {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rbq-unread-badge {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background-color: #ff3b30;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

/* === 单聊视图 === */
.rbq-single-chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.rbq-chat-header-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.rbq-back-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:active {
    background-color: #e0e0e0;
  }
}

.rbq-chat-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
}

.rbq-header-right {
  width: 32px;
}

.rbq-messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.rbq-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;
  color: #999;
}

.rbq-empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.rbq-empty-text {
  font-size: 14px;
}

/* === 输入框 === */
.rbq-input-area {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e0e0e0;
  background-color: #f9f9f9;
}

.rbq-input-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #007aff;
  }
}

.rbq-send-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.2s;

  &:active {
    background-color: #0051d5;
  }
}
</style>
