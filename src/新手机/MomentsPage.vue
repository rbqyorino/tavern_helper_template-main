<template>
  <div class="mimi-moments-page">
    <!-- 动态列表页面 -->
    <div v-show="currentView === 'list'" class="mimi-moments-view">
      <header class="mimi-moments-header" :style="momentsHeaderStyle">
        <button
          class="mimi-header-button mimi-header-button--back"
          type="button"
          aria-label="返回聊天列表"
          @click="goBack"
        >
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <span class="mimi-moments-title">动态</span>
        <div class="mimi-actions">
          <button class="mimi-icon-button" type="button" aria-label="发布动态" @click="handlePublishMoment">
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <main class="mimi-moments-list">
      <article v-for="moment in moments" :key="moment.id" class="mimi-moment-card">
        <header class="mimi-moment-card-header">
          <div class="mimi-moment-user">
            <img :src="moment.avatar || ''" alt="" class="mimi-moment-avatar" />
            <div class="mimi-moment-user-info">
              <span class="mimi-moment-name">{{ moment.name }}</span>
            </div>
          </div>
          <div class="mimi-moment-more-wrapper">
            <button class="mimi-moment-more" type="button" aria-label="更多" @click="toggleMomentMenu(moment.id)">
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"
                />
              </svg>
            </button>
            <div v-if="activeMomentMenu === moment.id" class="mimi-moment-menu">
              <button class="mimi-moment-menu-item" @click="deleteMoment(moment.id)">删除</button>
            </div>
          </div>
        </header>
        <div class="mimi-moment-body">
          <p class="mimi-moment-content">{{ moment.content }}</p>
          <span class="mimi-moment-timestamp">{{ moment.timestamp }}</span>
        </div>
        <ul v-if="moment.comments.length" class="mimi-moment-comments">
          <li v-for="comment in moment.comments" :key="comment.id" class="mimi-moment-comment">
            <span class="mimi-moment-comment-text">
              <span class="mimi-moment-comment-author">{{ comment.author }}</span
              >：{{ comment.content }}
            </span>
            <div class="mimi-comment-more-wrapper">
              <button
                class="mimi-comment-more"
                type="button"
                aria-label="删除评论"
                @click="toggleCommentMenu(comment.id)"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"
                  />
                </svg>
              </button>
              <div v-if="activeCommentMenu === comment.id" class="mimi-comment-menu">
                <button class="mimi-comment-menu-item" @click="deleteComment(moment.id, comment.id)">删除</button>
              </div>
            </div>
          </li>
        </ul>
        <div class="mimi-moment-reply">
          <input
            class="mimi-moment-reply-input"
            type="text"
            placeholder="说点什么吧"
            @keypress.enter="handleReplySubmit(moment.id)"
            v-model="replyInputs[moment.id]"
          />
        </div>
      </article>

      <div v-if="moments.length === 0" class="mimi-empty-state">
        <svg viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 2.5l2.47 5.01 5.53.8-4 3.89.94 5.5L12 15.77 7.06 17.7l.94-5.5-4-3.89 5.53-.8L12 2.5z"
          />
        </svg>
        <p>暂无动态</p>
      </div>
    </main>
    </div>

    <!-- 发布动态页面 -->
    <div v-show="currentView === 'publish'" class="mimi-publish-view">
      <PublishMomentPage
        @go-back="handlePublishBack"
        @publish="handleMomentPublish"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PublishMomentPage from './PublishMomentPage.vue';

// 定义发射事件和props
const emit = defineEmits<{
  goBack: [];
  momentDeleted: [];
}>();

const props = defineProps<{
  momentsData?: any[];
  userMomentsData?: any[]; // 用户自己的动态数据
  userInfo?: {
    name: string;
    avatar?: string;
  };
}>();

// 页面状态
const currentView = ref<'list' | 'publish'>('list');
const activeMomentMenu = ref<string | null>(null);
const activeCommentMenu = ref<string | null>(null);

// 回复输入框的状态
const replyInputs = ref<Record<string, string>>({});

interface MomentComment {
  id: string;
  author: string;
  content: string;
}

interface MomentItem {
  id: string;
  contactName: string;
  name: string;
  content: string;
  timestamp: string;
  timeValue: number;
  comments: MomentComment[];
  avatar?: string;
}

// 动态页面状态栏颜色计算
const momentsHeaderStyle = computed(() => ({
  backgroundColor: '#ffffff',
  color: '#222222',
}));

// 合并用户动态和联系人动态，并按时间排序
const moments = computed<MomentItem[]>(() => {
  const contactMoments = props.momentsData && Array.isArray(props.momentsData) ? props.momentsData : [];
  const userMoments = props.userMomentsData && Array.isArray(props.userMomentsData) ? props.userMomentsData : [];

  // 合并两个数组
  const allMoments = [...contactMoments, ...userMoments];

  // 按时间倒序排序（最新的在前）
  return allMoments.sort((a, b) => b.timeValue - a.timeValue);
});

function goBack() {
  emit('goBack');
}

function handlePublishMoment() {
  currentView.value = 'publish';
}

function handlePublishBack() {
  currentView.value = 'list';
}

async function handleMomentPublish(content: string) {
  // 返回列表页面
  currentView.value = 'list';

  // 将发布的内容发送到酒馆
  publishMomentToTavern(content);
}

// 将动态发布到酒馆的函数
function publishMomentToTavern(content: string) {
  try {
    // 使用固定格式 [AZ中发布动态-"${动态}"]
    const processedMoment = `[AZ中发布动态-"${content}"]`;

    console.log('[MomentsPage] 发布动态:', processedMoment);

    // 将动态填入酒馆输入框
    fillMomentToTavernInput(processedMoment);

    toastr.success('动态已发送到酒馆', '成功');

  } catch (error) {
    console.error('[MomentsPage] 发布动态时出错:', error);
    toastr.error('发布动态失败', '错误');
  }
}

// 将动态填入酒馆输入框的函数
function fillMomentToTavernInput(moment: string) {
  try {
    // 使用jQuery来操作酒馆的输入框
    const $tavernTextarea = $('#send_textarea');

    if ($tavernTextarea.length === 0) {
      console.warn('[MomentsPage] 未找到酒馆输入框 #send_textarea');
      toastr.warning('未找到酒馆输入框', '提示');
      return;
    }

    // 获取当前输入框的内容
    const currentContent = $tavernTextarea.val()?.toString().trim() || '';

    // 如果输入框已有内容，需要在前面添加换行
    let newContent: string;
    if (currentContent) {
      newContent = currentContent + '\n' + moment;
    } else {
      newContent = moment;
    }

    // 设置新的内容并触发input事件
    $tavernTextarea
      .val(newContent.trim())
      .get(0)?.dispatchEvent(new Event('input', { bubbles: true }));

    // 将焦点设置到输入框
    $tavernTextarea.focus();

    // 将光标移动到末尾
    const textarea = $tavernTextarea.get(0) as HTMLTextAreaElement;
    if (textarea) {
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

    console.log('[MomentsPage] 动态已填入酒馆输入框:', moment);

  } catch (error) {
    console.error('[MomentsPage] 填入动态到输入框时出错:', error);
    throw error;
  }
}

function toggleMomentMenu(momentId: string) {
  if (activeMomentMenu.value === momentId) {
    activeMomentMenu.value = null;
  } else {
    activeMomentMenu.value = momentId;
  }
}

function toggleCommentMenu(commentId: string) {
  if (activeCommentMenu.value === commentId) {
    activeCommentMenu.value = null;
  } else {
    activeCommentMenu.value = commentId;
  }
}

async function deleteMoment(momentId: string) {
  try {
    console.log(`[MomentsPage] 准备删除动态: ${momentId}`);

    // 检查 Mvu 是否可用
    if (typeof Mvu === 'undefined') {
      console.error('[MomentsPage] Mvu 未定义，无法删除动态');
      toastr.error('删除动态失败：MVU未初始化', '错误');
      return;
    }

    // 1. 解析 momentId
    const [contactName, ...timestampParts] = momentId.split('-');
    const timestampKey = timestampParts.join('-');

    if (!contactName || !timestampKey) {
      console.error('[MomentsPage] 删除失败: momentId 格式不正确', momentId);
      toastr.error('删除动态失败', '错误');
      return;
    }

    // 2. 遵循 MVU 模式: get -> modify -> replace
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const phoneData = Mvu.getMvuVariable(mvuData, '手机数据', { default_value: {} });

    let deletePath: string;
    if (contactName === 'user') {
      deletePath = `用户.空间动态.${timestampKey}`;
    } else {
      deletePath = `联系人.${contactName}.空间动态.${timestampKey}`;
    }

    console.log(`[MomentsPage] 构造的删除路径 (基于phoneData): ${deletePath}`);

    // 3. 使用 lodash 的 unset 来删除数据
    const deleteOccurred = _.unset(phoneData, deletePath);

    if (deleteOccurred) {
      // 4. 将修改后的数据写回
      Mvu.setMvuVariable(mvuData, '手机数据', phoneData);
      await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });

      toastr.success('动态已删除', '成功');
      console.log(`[MomentsPage] 动态 ${momentId} 已成功删除`);

      // 5. 通知父组件刷新数据
      emit('momentDeleted');
    } else {
      console.warn(`[MomentsPage] 动态 ${momentId} 删除失败或已被删除`);
      toastr.warning('动态删除失败或已被删除', '提示');
    }
  } catch (error) {
    console.error('[MomentsPage] 删除动态时发生错误:', error);
    toastr.error('删除动态时出错', '错误');
  } finally {
    // 6. 关闭菜单
    activeMomentMenu.value = null;
  }
}

async function deleteComment(momentId: string, commentId: string) {
  try {
    console.log(`[MomentsPage] 准备删除评论: momentId=${momentId}, commentId=${commentId}`);

    // 检查 Mvu 是否可用
    if (typeof Mvu === 'undefined') {
      console.error('[MomentsPage] Mvu 未定义，无法删除评论');
      toastr.error('删除评论失败：MVU未初始化', '错误');
      return;
    }

    // 1. 解析 momentId 和 commentId
    const [contactName, ...timestampParts] = momentId.split('-');
    const timestampKey = timestampParts.join('-');

    // commentId 格式：`${contactName}-${timestampKey}-${actualCommentId}`
    const commentIdParts = commentId.split('-');
    const actualCommentId = commentIdParts[commentIdParts.length - 1];

    if (!contactName || !timestampKey || !actualCommentId) {
      console.error('[MomentsPage] 删除失败: ID 格式不正确', { momentId, commentId });
      toastr.error('删除评论失败', '错误');
      return;
    }

    // 2. 遵循 MVU 模式: get -> modify -> replace
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    const phoneData = Mvu.getMvuVariable(mvuData, '手机数据', { default_value: {} });

    let deletePath: string;
    if (contactName === 'user') {
      deletePath = `用户.空间动态.${timestampKey}.评论.${actualCommentId}`;
    } else {
      deletePath = `联系人.${contactName}.空间动态.${timestampKey}.评论.${actualCommentId}`;
    }

    console.log(`[MomentsPage] 构造的删除路径: ${deletePath}`);

    // 3. 使用 lodash 的 unset 来删除评论
    const deleteOccurred = _.unset(phoneData, deletePath);

    if (deleteOccurred) {
      // 4. 将修改后的数据写回
      Mvu.setMvuVariable(mvuData, '手机数据', phoneData);
      await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: 'latest' });

      toastr.success('评论已删除', '成功');
      console.log(`[MomentsPage] 评论已成功删除`);

      // 5. 通知父组件刷新数据
      emit('momentDeleted');
    } else {
      console.warn(`[MomentsPage] 评论删除失败或已被删除`);
      toastr.warning('评论删除失败或已被删除', '提示');
    }
  } catch (error) {
    console.error('[MomentsPage] 删除评论时发生错误:', error);
    toastr.error('删除评论时出错', '错误');
  } finally {
    // 6. 关闭菜单
    activeCommentMenu.value = null;
  }
}

function handleReplySubmit(momentId: string) {
  // 获取输入内容
  const replyContent = replyInputs.value[momentId]?.trim();

  if (!replyContent) {
    return;
  }

  try {
    // 解析 momentId 获取 contactName 和 timestampKey
    const [contactName, ...timestampParts] = momentId.split('-');
    const timestampKey = timestampParts.join('-');

    if (!contactName || !timestampKey) {
      console.error('[MomentsPage] 回复失败: momentId 格式不正确', momentId);
      toastr.error('回复失败', '错误');
      return;
    }

    // 构造回复字符串
    let replyPath: string;
    if (contactName === 'user') {
      replyPath = `用户.空间动态.${timestampKey}.评论`;
    } else {
      replyPath = `联系人.${contactName}.空间动态.${timestampKey}.评论`;
    }

    const processedReply = `[AZ中回复'${replyPath}'：${replyContent}]`;

    console.log('[MomentsPage] 发送评论:', processedReply);

    // 填入酒馆输入框
    fillReplyToTavernInput(processedReply);

    // 清空当前输入框
    replyInputs.value[momentId] = '';

    toastr.success('评论已发送', '成功');
  } catch (error) {
    console.error('[MomentsPage] 发送评论时出错:', error);
    toastr.error('发送评论失败', '错误');
  }
}

// 将评论填入酒馆输入框的函数
function fillReplyToTavernInput(reply: string) {
  try {
    // 使用jQuery来操作酒馆的输入框
    const $tavernTextarea = $('#send_textarea');

    if ($tavernTextarea.length === 0) {
      console.warn('[MomentsPage] 未找到酒馆输入框 #send_textarea');
      toastr.warning('未找到酒馆输入框', '提示');
      return;
    }

    // 获取当前输入框的内容
    const currentContent = $tavernTextarea.val()?.toString().trim() || '';

    // 如果输入框已有内容，需要在前面添加换行
    let newContent: string;
    if (currentContent) {
      newContent = currentContent + '\n' + reply;
    } else {
      newContent = reply;
    }

    // 设置新的内容并触发input事件
    $tavernTextarea
      .val(newContent.trim())
      .get(0)?.dispatchEvent(new Event('input', { bubbles: true }));

    // 将焦点设置到输入框
    $tavernTextarea.focus();

    // 将光标移动到末尾
    const textarea = $tavernTextarea.get(0) as HTMLTextAreaElement;
    if (textarea) {
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

    console.log('[MomentsPage] 评论已填入酒馆输入框:', reply);
  } catch (error) {
    console.error('[MomentsPage] 填入评论到输入框时出错:', error);
    throw error;
  }
}
</script>

<style lang="scss" scoped>
.mimi-moments-page {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #f6f6f7;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.mimi-moments-page::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.mimi-moments-view,
.mimi-publish-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.mimi-moments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 12px;
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border-bottom: 1px solid #e8e8ea;
  color: #1f1f1f;
  cursor: default;
  user-select: none;
}

.mimi-moments-title {
  font-weight: 600;
  font-size: 16px;
}

.mimi-header-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: #424249;
  padding: 4px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.mimi-header-button:hover {
  color: #1f1f1f;
}

.mimi-header-button svg {
  width: 32px;
  height: 32px;
}

.mimi-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.mimi-icon-button {
  border: none;
  background: none;
  color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.mimi-icon-button svg {
  width: 32px;
  height: 32px;
}

.mimi-moments-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #ffffff;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.mimi-moment-card {
  background-color: #fff;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid #ededf0;
}

.mimi-moment-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.mimi-moment-user {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mimi-moment-avatar {
  width: clamp(38px, 11vw, 42px);
  height: clamp(38px, 11vw, 42px);
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e5e5e8;
  flex-shrink: 0;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.mimi-moment-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mimi-moment-name {
  font-weight: 600;
  color: #1f1f1f;
}

.mimi-moment-timestamp {
  font-size: 12px;
  color: #9b9b9f;
}

.mimi-moment-more {
  border: none;
  background: none;
  color: #9b9b9f;
  cursor: pointer;
  padding: 4px;
}

.mimi-moment-more svg {
  width: 16px;
  height: 16px;
}

.mimi-moment-more-wrapper {
  position: relative;
}

.mimi-moment-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 10;
  width: 100px;
}

.mimi-moment-menu-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #000; /* 设置为黑色 */
}

.mimi-moment-menu-item:hover {
  background-color: #f5f5f5;
}

.mimi-moment-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.mimi-moment-content {
  color: #2c2c2e;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

.mimi-moment-comments {
  margin: 0;
  padding: 8px 0;
  border-radius: 12px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #4c4c52;
  font-size: 15px;
}

.mimi-moment-comment {
  line-height: 1.4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.mimi-moment-comment-text {
  flex: 1;
}

.mimi-moment-comment-author {
  color: #3271ff;
  font-weight: 500;
}

.mimi-comment-more-wrapper {
  position: relative;
  flex-shrink: 0;
}

.mimi-comment-more {
  border: none;
  background: none;
  color: #9b9b9f;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.mimi-comment-more:hover {
  opacity: 1;
}

.mimi-comment-more svg {
  width: 14px;
  height: 14px;
}

.mimi-comment-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 10;
  width: 80px;
}

.mimi-comment-menu-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: #000;
}

.mimi-comment-menu-item:hover {
  background-color: #f5f5f5;
}

.mimi-moment-reply {
  margin-top: 4px;
}

.mimi-moment-reply-input {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background-color: #f3f4f6;
  color: #2c2c2e;
  font-size: 14px;
  outline: none;
}

.mimi-moment-reply-input::placeholder {
  color: #9b9b9f;
}

.mimi-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #9b9b9f;
  padding: 32px;
}

.mimi-empty-state svg {
  width: 48px;
  height: 48px;
}

/* WebKit 隐藏滚动条 */
.mimi-moments-list::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 手机应用输入框样式隔离 */
.mimi-moments-page input[type='text'],
.mimi-moments-page input[type='number'],
.mimi-moments-page input:not([type]),
.mimi-moments-page textarea:not([type='search']) {
  background-color: #f3f4f6 !important;
  border: none !important;
  color: #2c2c2e !important;
}

.mimi-moments-page .mimi-moment-reply-input {
  background-color: #f3f4f6 !important;
  border: none !important;
  color: #2c2c2e !important;
}

.mimi-moments-page .mimi-moment-reply-input::placeholder {
  color: #9b9b9f !important;
}
</style>
