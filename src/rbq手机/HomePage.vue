<template>
  <div class="rbq-home-page">
    <!-- 页面头部 -->
    <div class="rbq-home-header">
      <h2>动态</h2>
      <button class="rbq-post-btn" @click="showPublishModal = true">
        <span>+</span>
      </button>
    </div>

    <!-- 动态列表 -->
    <div class="rbq-posts-container">
      <div v-if="phoneState.posts.length === 0" class="rbq-empty-state">
        <div class="rbq-empty-icon">🌟</div>
        <div class="rbq-empty-text">暂无动态</div>
      </div>

      <div v-for="post in phoneState.posts" :key="post.id" class="rbq-post-card">
        <!-- 发布者信息 -->
        <div class="rbq-post-header">
          <div class="rbq-post-avatar">
            <img v-if="post.authorAvatar" :src="post.authorAvatar" :alt="post.authorName" />
            <div v-else class="rbq-avatar-placeholder">{{ post.authorName.charAt(0) }}</div>
          </div>
          <div class="rbq-post-author-info">
            <div class="rbq-post-author-name">{{ post.authorName }}</div>
            <div class="rbq-post-timestamp">{{ post.timestamp }}</div>
          </div>
        </div>

        <!-- 发布内容 -->
        <div class="rbq-post-content">
          <p>{{ post.content }}</p>
        </div>

        <!-- 发布的图片 -->
        <div v-if="post.images && post.images.length > 0" class="rbq-post-images">
          <img
            v-for="(image, index) in post.images"
            :key="index"
            :src="image"
            :alt="`image-${index}`"
            class="rbq-post-image"
          />
        </div>

        <!-- 互动数据 -->
        <div class="rbq-post-stats">
          <span class="rbq-stat-item">
            <span class="rbq-icon">👍</span>
            {{ post.likes }}
          </span>
          <span class="rbq-stat-item">
            <span class="rbq-icon">💬</span>
            {{ post.comments }}
          </span>
        </div>

        <!-- 互动按钮 -->
        <div class="rbq-post-actions">
          <button class="rbq-action-btn" @click="likePost(post.id)">
            <span>👍</span>
            <span>赞</span>
          </button>
          <button class="rbq-action-btn" @click="commentPost(post.id)">
            <span>💬</span>
            <span>评论</span>
          </button>
          <button class="rbq-action-btn" @click="sharePost(post.id)">
            <span>🔗</span>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 发布动态的模态框 （可选） -->
    <div v-if="showPublishModal" class="rbq-modal-overlay" @click="showPublishModal = false">
      <div class="rbq-modal" @click.stop>
        <div class="rbq-modal-header">
          <h3>发布动态</h3>
          <button class="rbq-close-btn" @click="showPublishModal = false">×</button>
        </div>
        <div class="rbq-modal-body">
          <textarea class="rbq-modal-textarea" placeholder="说点什么..."></textarea>
        </div>
        <div class="rbq-modal-footer">
          <button class="rbq-cancel-btn" @click="showPublishModal = false">取消</button>
          <button class="rbq-publish-btn">发布</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { phoneState, loadPhoneDataFromMvu } from './stores/phone-state';

const showPublishModal = ref(false);

/**
 * 点赞
 */
function likePost(postId: string) {
  const post = phoneState.posts.find((p) => p.id === postId);
  if (post) {
    post.likes += 1;
  }
}

/**
 * 评论
 */
function commentPost(postId: string) {
  console.log('评论帖子:', postId);
  // TODO: 实现评论功能
}

/**
 * 分享
 */
function sharePost(postId: string) {
  console.log('分享帖子:', postId);
  // TODO: 实现分享功能
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
        console.log('[HomePage] 检测到MVU变量更新');
        await loadPhoneDataFromMvu();
      });
    }

    // 监听消息楼层变量变化
    if (Mvu.events?.MESSAGE_VARIABLE_CHANGED) {
      eventOn(Mvu.events.MESSAGE_VARIABLE_CHANGED, async () => {
        console.log('[HomePage] 检测到消息楼层变量变化');
        setTimeout(async () => {
          await loadPhoneDataFromMvu();
        }, 100);
      });
    }

    // 监听AI生成完成事件
    if (typeof tavern_events !== 'undefined' && tavern_events.GENERATION_ENDED) {
      eventOn(tavern_events.GENERATION_ENDED, async () => {
        console.log('[HomePage] 检测到AI生成完成');
        setTimeout(async () => {
          await loadPhoneDataFromMvu();
        }, 300);
      });
    }
  }
});
</script>

<style scoped lang="scss">
.rbq-home-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* === 页面头部 === */
.rbq-home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
}

.rbq-post-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: #007aff;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:active {
    background-color: #0051d5;
  }
}

/* === 动态列表 === */
.rbq-posts-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f5f5f5;
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

/* === 动态卡片 === */
.rbq-post-card {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rbq-post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.rbq-post-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;

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
  font-size: 16px;
}

.rbq-post-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rbq-post-author-name {
  font-size: 14px;
  font-weight: 600;
  color: #000;
}

.rbq-post-timestamp {
  font-size: 12px;
  color: #999;
}

.rbq-post-content {
  margin-bottom: 12px;

  p {
    margin: 0;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }
}

/* === 发布的图片 === */
.rbq-post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;

  &:has(.rbq-post-image:only-child) {
    grid-template-columns: 1fr;
  }

  &:has(.rbq-post-image:nth-child(2)) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.rbq-post-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.8;
  }
}

/* === 互动数据 === */
.rbq-post-stats {
  display: flex;
  gap: 15px;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 10px;
  font-size: 12px;
  color: #999;
}

.rbq-stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rbq-icon {
  font-size: 14px;
}

/* === 互动按钮 === */
.rbq-post-actions {
  display: flex;
  gap: 0;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.rbq-action-btn {
  flex: 1;
  padding: 8px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  transition: color 0.2s;

  &:active {
    color: #007aff;
  }

  span:first-child {
    font-size: 16px;
  }
}

/* === 模态框 === */
.rbq-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.rbq-modal {
  width: 100%;
  background-color: white;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  max-height: 80vh;
}

.rbq-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;

  h3 {
    margin: 0;
    font-size: 16px;
  }
}

.rbq-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.rbq-modal-body {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.rbq-modal-textarea {
  width: 100%;
  height: 100px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;

  &:focus {
    border-color: #007aff;
  }
}

.rbq-modal-footer {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #e0e0e0;
}

.rbq-cancel-btn,
.rbq-publish-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.rbq-cancel-btn {
  background-color: #f0f0f0;
  color: #666;

  &:active {
    opacity: 0.7;
  }
}

.rbq-publish-btn {
  background-color: #007aff;
  color: white;

  &:active {
    opacity: 0.8;
  }
}
</style>
