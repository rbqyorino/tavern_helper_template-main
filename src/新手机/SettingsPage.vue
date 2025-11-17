<template>
  <!--
    功能 1：调整手机尺寸（宽度 / 高度）
    - SettingsPage 仍只负责写入 Pinia 中的设置，不直接操作 Phone.vue DOM
    - Phone.vue 通过 phoneSettings 决定实际宽度、高宽比
  -->
  <div class="mimi-settings-page">
    <header class="mimi-settings-header">
      <button class="mimi-settings-back" type="button" @click="handleClose">
        <svg viewBox="0 0 24 24" class="mimi-settings-back-icon">
          <path
            d="M15.5 5 9 11.5 15.5 18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="mimi-settings-title">设置</div>
    </header>

    <main class="mimi-settings-body">
      <!-- 手机尺寸设置：宽度 / 高度 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">手机尺寸</h2>
        <div class="mimi-settings-group">
          <div class="mimi-settings-item">
            <label class="mimi-settings-label" for="mimi-phone-width">宽度 (px)</label>
            <input
              id="mimi-phone-width"
              v-model.number="tempWidth"
              type="number"
              class="mimi-settings-input"
              @keyup.enter="applyDimensions"
            />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label" for="mimi-phone-height">高度 (px)</label>
            <input
              id="mimi-phone-height"
              v-model.number="tempHeight"
              type="number"
              class="mimi-settings-input"
              @keyup.enter="applyDimensions"
            />
          </div>
          <p class="mimi-settings-hint">
            按 Enter 应用尺寸。最小宽高 {{ MIN_SIZE }}px，若低于最小值会自动修正并提示。
          </p>
        </div>
      </section>

      <!-- 玩家对话样式 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">玩家对话样式</h2>
        <div class="mimi-settings-group">
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">气泡颜色</label>
            <ColorPicker v-model="settings.player.bubbleColor" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">文字颜色</label>
            <ColorPicker v-model="settings.player.textColor" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label" for="mimi-player-font-size">字体大小 (px)</label>
            <input
              id="mimi-player-font-size"
              v-model.number="settings.player.fontSize"
              type="number"
              class="mimi-settings-input"
              min="10"
              max="32"
            />
          </div>
        </div>
      </section>

      <!-- 对话预览 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">效果预览</h2>
        <ChatPreview />
      </section>

      <!-- 角色对话样式 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">角色对话样式</h2>
        <div class="mimi-settings-group">
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">气泡颜色</label>
            <ColorPicker v-model="settings.character.bubbleColor" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">文字颜色</label>
            <ColorPicker v-model="settings.character.textColor" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label" for="mimi-character-font-size">字体大小 (px)</label>
            <input
              id="mimi-character-font-size"
              v-model.number="settings.character.fontSize"
              type="number"
              class="mimi-settings-input"
              min="10"
              max="32"
            />
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePhoneSettingsStore } from './stores/phoneSettings';
import ColorPicker from './ColorPicker.vue';
import ChatPreview from './ChatPreview.vue';

const MIN_SIZE = 300;

const emit = defineEmits<{
  close: [];
}>();

const settingsStore = usePhoneSettingsStore();
const settings = settingsStore.settings;

// 使用临时变量承载输入框值，避免未确认输入立即改变手机尺寸
const tempWidth = ref(settings.phoneWidth);
const tempHeight = ref(settings.phoneHeight);

function applyDimensions() {
  let adjusted = false;

  if (!tempWidth.value || tempWidth.value < MIN_SIZE) {
    tempWidth.value = MIN_SIZE;
    adjusted = true;
  }

  if (!tempHeight.value || tempHeight.value < MIN_SIZE) {
    tempHeight.value = MIN_SIZE;
    adjusted = true;
  }

  // 写回全局设置，Phone.vue 会据此调整宽度和 aspect-ratio
  settings.phoneWidth = tempWidth.value;
  settings.phoneHeight = tempHeight.value;

  if (adjusted) {
    toastr.warning(`手机尺寸已调整，最小宽高为 ${MIN_SIZE}px`, '提示');
  } else {
    toastr.success('手机尺寸已更新', '提示');
  }
}

function handleClose() {
  emit('close');
}
</script>

<style scoped lang="scss">
/* 与 ChatPage 一致：占满 .mimi-phone-screen，不额外嵌套手机壳
   注意：这里就是“设置页的整块内容”，必须有自己的背景，不要透出主页 */
.mimi-settings-page {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  background: #f4f6ff;
}

/* 顶部栏保持简洁，与现有手机头部风格靠近 */
.mimi-settings-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  box-sizing: border-box;
}

.mimi-settings-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  color: #333;
  cursor: pointer;
}

.mimi-settings-back-icon {
  width: 16px;
  height: 16px;
}

.mimi-settings-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #222;
}

/* 主体内容：在手机内部区域内滚动；填满屏幕，避免与主页内容叠在一起 */
.mimi-settings-body {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  padding: 4px 8px 8px;
  overflow-y: auto;
  overflow-x: hidden;
  background: transparent;
}

/* 手机尺寸设置块：轻量分组样式，避免整屏“方块感” */
.mimi-settings-section {
  margin-bottom: 6px;
}

.mimi-settings-section-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.mimi-settings-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mimi-settings-item {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.mimi-settings-label {
  flex-shrink: 0;
  width: 80px;
  font-size: 12px;
  color: #6b7280;
}

.mimi-settings-input {
  flex: 1;
  min-width: 0;
  max-width: calc(60% - 50px);
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  box-sizing: border-box;
  outline: none;
  color: #111111; /* 输入文字采用深色，避免刺眼的纯白 */
}

.mimi-settings-input:focus {
  border-color: #6366f1;
  background-color: #ffffff;
}

.mimi-settings-hint {
  margin: 2px 0 0;
  font-size: 10px;
  color: #9ca3af;
}

/* 文本 + 调色盘容器：输入框 + 色块选择器（仅展示色块，不再重复文本） */
.mimi-color-inputs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mimi-color-inputs :deep(.mimi-color-picker),
.mimi-color-inputs :deep(input[type='color']) {
  flex-shrink: 0;
}

/* 极端窄屏适配：缩小字体，防止文字撑开布局 */
@media (max-width: 320px) {
  .mimi-settings-section-title {
    font-size: 12px;
  }
  .mimi-settings-label,
  .mimi-settings-input {
    font-size: 11px;
  }
}
</style>
