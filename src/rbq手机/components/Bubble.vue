<template>
  <div class="rbq-bubble-wrapper" :class="{ 'is-mine': isMine }">
    <!-- 头像 -->
    <div v-if="!isMine" class="rbq-bubble-avatar">
      <img v-if="message.senderAvatar" :src="message.senderAvatar" :alt="message.sender" />
      <div v-else class="rbq-avatar-placeholder">{{ message.sender.charAt(0) }}</div>
    </div>

    <!-- 气泡内容 -->
    <div class="rbq-bubble-content">
      <!-- 发送者名称（对方消息显示）-->
      <div v-if="!isMine" class="rbq-bubble-sender">{{ message.sender }}</div>

      <!-- 消息主体 -->
      <div class="rbq-bubble-body" :style="bubbleStyle">
        <div v-if="message.type === 'text'" class="rbq-bubble-text">
          {{ message.content }}
        </div>

        <div v-else-if="message.type === 'image'" class="rbq-bubble-image">
          <img :src="message.content" :alt="message.content" />
          <span class="rbq-image-desc">{{ message.content }}</span>
        </div>

        <div v-else-if="message.type === 'emoji'" class="rbq-bubble-emoji">
          <div class="rbq-emoji-content">{{ message.content }}</div>
        </div>

        <div v-else-if="message.type === 'music'" class="rbq-bubble-music">
          <span class="rbq-music-icon">🎵</span>
          <div class="rbq-music-info">
            <div class="rbq-music-name">{{ getMusicName(message.content) }}</div>
            <div class="rbq-music-artist">{{ getMusicArtist(message.content) }}</div>
          </div>
        </div>

        <div v-else-if="message.type === 'system'" class="rbq-bubble-system">
          {{ message.content }}
        </div>
      </div>

      <!-- 时间戳（可选，仅在特定消息显示） -->
      <div class="rbq-bubble-time">{{ message.timestamp }}</div>
    </div>

    <!-- 头像（自己的消息） -->
    <div v-if="isMine" class="rbq-bubble-avatar">
      <img v-if="message.senderAvatar" :src="message.senderAvatar" :alt="message.sender" />
      <div v-else class="rbq-avatar-placeholder">{{ message.sender.charAt(0) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from '../types';

interface Props {
  message: Message;
  currentUser?: string;
}

const props = withDefaults(defineProps<Props>(), {
  currentUser: 'user',
});

/**
 * 是否是当前用户的消息
 */
const isMine = computed(() => props.message.sender === props.currentUser);

/**
 * 计算气泡样式
 */
const bubbleStyle = computed(() => {
  const isSystem = props.message.type === 'system';
  const color = isMine.value ? 'var(--bubble-color-mine)' : 'var(--bubble-color-other)';

  return {
    backgroundColor: isSystem ? 'transparent' : color,
    borderRadius: isSystem ? '0' : '18px',
    padding: isSystem ? '0' : '10px 15px',
    maxWidth: isSystem ? '100%' : '80%',
    wordBreak: 'break-word' as const,
  };
});

/**
 * 从音乐标记中提取歌名
 */
function getMusicName(content: string): string {
  const parts = content.split('$');
  return parts[0] || '未知歌曲';
}

/**
 * 从音乐标记中提取歌手
 */
function getMusicArtist(content: string): string {
  const parts = content.split('$');
  return parts[1] || '未知歌手';
}
</script>

<style scoped lang="scss">
.rbq-bubble-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 10px;

  &.is-mine {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
}

.rbq-bubble-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;

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
  font-size: 14px;
}

.rbq-bubble-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .is-mine & {
    align-items: flex-end;
  }
}

.rbq-bubble-sender {
  font-size: 12px;
  color: #999;
  padding: 0 10px;
  max-width: 80%;
}

.rbq-bubble-body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  line-height: 1.4;
  font-size: 14px;
}

.rbq-bubble-text {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.rbq-bubble-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  img {
    max-width: 200px;
    max-height: 200px;
    border-radius: 12px;
    object-fit: cover;
  }
}

.rbq-image-desc {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.rbq-bubble-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;

  .rbq-emoji-content {
    font-size: 40px;
    line-height: 1;
  }
}

.rbq-bubble-music {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.rbq-music-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.rbq-music-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rbq-music-name {
  font-size: 13px;
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rbq-music-artist {
  font-size: 12px;
  color: #999;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rbq-bubble-system {
  font-size: 12px;
  color: #999;
  text-align: center;
  font-style: italic;
}

.rbq-bubble-time {
  font-size: 11px;
  color: #ccc;
  text-align: center;
  margin-top: 2px;
}
</style>
