<template>
  <div
    v-if="phoneState.isVisible"
    ref="phoneContainerRef"
    class="rbq-phone-container"
    :style="phoneContainerStyle"
    @mousedown="startDrag"
  >
    <!-- 手机外观 -->
    <div class="rbq-phone-body" :style="phoneBodyStyle">
      <!-- 顶部凹口 (仿iPhone) -->
      <div class="rbq-phone-notch"></div>

      <!-- 状态栏 -->
      <StatusBar />

      <!-- 页面内容容器 -->
      <div class="rbq-phone-content">
        <!-- 聊天页面 -->
        <ChatPage v-show="phoneState.currentPage === 'chat'" />

        <!-- 动态页面 -->
        <HomePage v-show="phoneState.currentPage === 'home'" />

        <!-- 设置页面 -->
        <SettingPage v-show="phoneState.currentPage === 'settings'" />
      </div>

      <!-- 底部导航栏 -->
      <div class="rbq-phone-nav-bar">
        <button
          class="rbq-nav-btn"
          :class="{ active: phoneState.currentPage === 'chat' }"
          @click="setCurrentPage('chat')"
        >
          <span class="icon">💬</span>
          <span class="label">聊天</span>
        </button>
        <button
          class="rbq-nav-btn"
          :class="{ active: phoneState.currentPage === 'home' }"
          @click="setCurrentPage('home')"
        >
          <span class="icon">🏠</span>
          <span class="label">动态</span>
        </button>
        <button
          class="rbq-nav-btn"
          :class="{ active: phoneState.currentPage === 'settings' }"
          @click="setCurrentPage('settings')"
        >
          <span class="icon">⚙️</span>
          <span class="label">设置</span>
        </button>
      </div>

      <!-- 右边框线 -->
      <div class="rbq-phone-side-frame"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import $ from 'jquery';
import { phoneState, setCurrentPage, updatePhonePosition } from './stores/phone-state';
import ChatPage from './ChatPage.vue';
import HomePage from './HomePage.vue';
import SettingPage from './SettingPage.vue';
import StatusBar from './components/StatusBar.vue';

// DOM 引用
const phoneContainerRef = ref<HTMLElement>();

// 拖动状态（使用普通变量，不使用ref）
let isDragging = false;
let startX = 0;
let startY = 0;
let initialLeft = 0;
let initialTop = 0;

/**
 * 挂载后的初始化
 */
onMounted(() => {
  const container = phoneContainerRef.value;
  if (container) {
    // 应用初始位置
    container.style.left = `${phoneState.position.x}px`;
    container.style.top = `${phoneState.position.y}px`;
    console.log('[Phone.vue] 容器已挂载，初始位置:', phoneState.position);
  }
});

/**
 * 计算手机容器的样式
 */
const phoneContainerStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${phoneState.position.x}px`,
  top: `${phoneState.position.y}px`,
  width: `${phoneState.size.width}px`,
  height: `${phoneState.size.height}px`,
  zIndex: 10000,
  userSelect: isDragging ? 'none' : 'auto',
  cursor: isDragging ? 'grabbing' : 'grab',
}));

/**
 * 计算手机body的样式（包括主题）
 */
const phoneBodyStyle = computed(() => ({
  borderColor: phoneState.theme.borderColor,
  backgroundColor: phoneState.theme.backgroundColor,
  color: phoneState.theme.textColor,
  '--bubble-color-mine': phoneState.theme.bubbleColor.mine,
  '--bubble-color-other': phoneState.theme.bubbleColor.other,
  '--status-bar-color': phoneState.theme.statusBarColor,
} as any));

/**
 * 开始拖动
 */
function startDrag(event: MouseEvent) {
  // 检查是否点击在容器上
  const target = event.target as HTMLElement;
  const container = phoneContainerRef.value;

  if (!container) return;

  // 计算点击位置相对于容器顶部的距离
  const rect = container.getBoundingClientRect();
  const clickY = event.clientY - rect.top;

  // 只有点击在顶部约100px的区域才能拖动
  if (clickY > 100) {
    return;
  }

  event.preventDefault();

  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  initialLeft = container.offsetLeft;
  initialTop = container.offsetTop;

  // 使用jQuery在body上绑定事件
  $('body').on('mousemove', onDrag);
  $('body').on('mouseup', stopDrag);
}

/**
 * 拖动中
 */
function onDrag(event: MouseEvent) {
  if (!isDragging) return;

  const container = phoneContainerRef.value;
  if (!container) return;

  const currentX = event.clientX;
  const currentY = event.clientY;

  const dx = currentX - startX;
  const dy = currentY - startY;

  // 更新容器位置
  container.style.left = `${initialLeft + dx}px`;
  container.style.top = `${initialTop + dy}px`;

  event.preventDefault();
}

/**
 * 停止拖动
 */
function stopDrag() {
  isDragging = false;
  $('body').off('mousemove', onDrag);
  $('body').off('mouseup', stopDrag);

  // 保存最终位置
  const container = phoneContainerRef.value;
  if (container) {
    updatePhonePosition(container.offsetLeft, container.offsetTop);
  }
}
</script>

<style scoped lang="scss">
.rbq-phone-container {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border-radius: 40px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    border-radius: 20px;
  }
}

.rbq-phone-body {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 12px solid;
  border-radius: 40px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    border-width: 8px;
    border-radius: 20px;
  }
}

/* 顶部凹口 (仿iPhone) */
.rbq-phone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 30px;
  background-color: inherit;
  border-radius: 0 0 30px 30px;
  border: 8px solid;
  border-top: none;
  border-color: inherit;
  z-index: 10;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  @media (max-width: 768px) {
    width: 50%;
    height: 20px;
    border-radius: 0 0 20px 20px;
    border-width: 5px;
    border-top: none;
  }
}

/* 状态栏 */
.rbq-phone-status-bar {
  padding-top: 35px;
  padding-bottom: 10px;
  padding-left: 15px;
  padding-right: 15px;
  background-color: var(--status-bar-color, #f0f0f0);
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding-top: 25px;
    padding-bottom: 8px;
    font-size: 11px;
  }
}

/* 页面内容容器 */
.rbq-phone-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 底部导航栏 */
.rbq-phone-nav-bar {
  display: flex;
  border-top: 1px solid #e0e0e0;
  background-color: inherit;
}

.rbq-nav-btn {
  flex: 1;
  padding: 10px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  transition: all 0.2s ease;

  .icon {
    font-size: 20px;
  }

  .label {
    font-size: 11px;
  }

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    color: #007aff;
    background-color: #f9f9f9;

    .icon {
      font-size: 22px;
    }
  }

  @media (max-width: 768px) {
    padding: 8px;

    .icon {
      font-size: 18px;
    }

    .label {
      font-size: 10px;
    }

    &.active .icon {
      font-size: 20px;
    }
  }
}

/* 右边框线（模拟手机侧面） */
.rbq-phone-side-frame {
  position: absolute;
  right: -6px;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.05) 100%
  );
  pointer-events: none;

  @media (max-width: 768px) {
    width: 4px;
    right: -4px;
  }
}
</style>
