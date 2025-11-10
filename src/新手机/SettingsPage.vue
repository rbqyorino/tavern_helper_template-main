<template>
  <div class="mimi-settings-page">
    <!-- Header -->
    <header class="mimi-settings-header">
      <button class="mimi-settings-close" @click="$emit('close')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
      <h1 class="mimi-settings-title">设置</h1>
    </header>

    <!-- Content -->
    <main class="mimi-settings-content">
      <!-- 手机尺寸设置 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">手机尺寸</h2>
        <div class="mimi-settings-group">
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">宽度（px）</label>
            <input
              v-model.number="tempWidth"
              type="number"
              class="mimi-settings-input"
              placeholder="375"
              min="200"
              @keyup.enter="applyDimensions"
            />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">高度（px）</label>
            <input
              v-model.number="tempHeight"
              type="number"
              class="mimi-settings-input"
              placeholder="812"
              min="200"
              @keyup.enter="applyDimensions"
            />
          </div>
          <div class="mimi-settings-hint">输入数值后按回车键应用更改（最小值：200px）</div>
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
            <label class="mimi-settings-label">字体颜色</label>
            <ColorPicker v-model="settings.player.textColor" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">字体大小（px）</label>
            <input
              v-model.number="settings.player.fontSize"
              type="number"
              class="mimi-settings-input"
              placeholder="14"
              min="10"
              max="24"
            />
          </div>
        </div>
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
            <label class="mimi-settings-label">字体颜色</label>
            <ColorPicker v-model="settings.character.textColor" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">字体大小（px）</label>
            <input
              v-model.number="settings.character.fontSize"
              type="number"
              class="mimi-settings-input"
              placeholder="14"
              min="10"
              max="24"
            />
          </div>
        </div>
      </section>

      <!-- 预览区域 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">预览</h2>
        <div class="mimi-preview-container">
          <div class="mimi-preview-message mimi-preview-message--character">
            <div
              class="mimi-preview-bubble"
              :style="{
                backgroundColor: settings.character.bubbleColor,
                color: settings.character.textColor,
                fontSize: settings.character.fontSize + 'px',
              }"
            >
              这是角色的消息示例
            </div>
          </div>
          <div class="mimi-preview-message mimi-preview-message--player">
            <div
              class="mimi-preview-bubble"
              :style="{
                backgroundColor: settings.player.bubbleColor,
                color: settings.player.textColor,
                fontSize: settings.player.fontSize + 'px',
              }"
            >
              这是玩家的消息示例
            </div>
          </div>
        </div>
      </section>

      <!-- 主题设置 -->
      <section class="mimi-settings-section">
        <h2 class="mimi-settings-section-title">主题</h2>
        <div class="mimi-settings-group">
          <div class="mimi-settings-item mimi-settings-item--full">
            <label class="mimi-settings-label">外观</label>
            <div class="mimi-theme-toggle">
              <button
                :class="['mimi-theme-option', { active: settings.theme === 'light' }]"
                @click="settings.theme = 'light'"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <circle cx="12" cy="12" r="5" fill="currentColor" />
                  <path
                    d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span>浅色</span>
              </button>
              <button
                :class="['mimi-theme-option', { active: settings.theme === 'dark' }]"
                @click="settings.theme = 'dark'"
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
                </svg>
                <span>深色</span>
              </button>
            </div>
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">浅色背景</label>
            <ColorPicker v-model="settings.lightBg" />
          </div>
          <div class="mimi-settings-item">
            <label class="mimi-settings-label">深色背景</label>
            <ColorPicker v-model="settings.darkBg" />
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="mimi-settings-footer">
      <button class="mimi-settings-btn mimi-settings-btn--reset" @click="resetSettings">重置为默认</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ColorPicker from './ColorPicker.vue';
import { usePhoneSettingsStore } from './stores/phoneSettings';

defineEmits<{
  close: [];
}>();

// 使用 Pinia store 管理设置
const settingsStore = usePhoneSettingsStore();
const settings = settingsStore.settings;

// 本地临时状态（用于宽高输入）
const tempWidth = ref(settings.phoneWidth);
const tempHeight = ref(settings.phoneHeight);

// 应用宽高设置
function applyDimensions() {
  const MIN_SIZE = 300;
  let adjusted = false;

  // 确保宽度至少为300px
  if (tempWidth.value < MIN_SIZE) {
    tempWidth.value = MIN_SIZE;
    adjusted = true;
  }

  // 确保高度至少为300px
  if (tempHeight.value < MIN_SIZE) {
    tempHeight.value = MIN_SIZE;
    adjusted = true;
  }

  settings.phoneWidth = tempWidth.value;
  settings.phoneHeight = tempHeight.value;

  if (adjusted) {
    toastr.warning('手机尺寸已调整，最小宽高为200px', '提示');
  } else {
    toastr.success('手机尺寸已更新', '提示');
  }
}

// 重置设置
function resetSettings() {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    settingsStore.resetSettings();
    tempWidth.value = settings.phoneWidth;
    tempHeight.value = settings.phoneHeight;
    toastr.info('设置已重置为默认值', '提示');
  }
}
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

.mimi-settings-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(246, 248, 255, 0.82) 0%,
    rgba(240, 242, 255, 0.92) 60%,
    rgba(229, 233, 255, 0.96) 100%
  );
  overflow: hidden;
  color: rgba(32, 36, 50, 0.9);
}

.mimi-settings-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: clamp(8px, 2vh, 16px) clamp(12px, 3vw, 18px);
  background: transparent;
  border-bottom: none;
}

.mimi-settings-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(32px, 8vw, 36px);
  height: clamp(32px, 8vw, 36px);
  border: none;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  color: rgba(32, 36, 50, 0.8);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(49, 55, 82, 0.12);

  &:hover {
    background: rgba(255, 255, 255, 0.7);
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(49, 55, 82, 0.18);
  }

  &:active {
    transform: scale(0.95);
  }
}

.mimi-settings-title {
  flex: 1;
  margin: 0;
  padding-left: clamp(12px, 3vw, 16px);
  font-size: clamp(18px, 4.5vw, 22px);
  font-weight: 600;
  color: rgba(32, 36, 50, 0.9);
  letter-spacing: 0.5px;
}

.mimi-settings-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(90, 104, 149, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(90, 104, 149, 0.5);
    }
  }
}

.mimi-settings-section {
  margin-bottom: clamp(20px, 5vw, 28px);
  &:last-child {
    margin-bottom: 0;
  }
}

.mimi-settings-section-title {
  margin: 0 0 clamp(10px, 2.5vw, 14px) 0;
  font-size: clamp(15px, 3.8vw, 17px);
  font-weight: 600;
  color: rgba(32, 36, 50, 0.85);
  letter-spacing: 0.3px;
}

.mimi-settings-group {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.5vw, 14px);
  padding: clamp(12px, 3vw, 18px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(238, 242, 255, 0.85) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: clamp(16px, 3.5vw, 22px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    0 12px 32px rgba(90, 104, 149, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.6),
      0 16px 40px rgba(90, 104, 149, 0.2);
  }
}

.mimi-settings-hint {
  font-size: clamp(11px, 2.8vw, 13px);
  color: rgba(32, 36, 50, 0.55);
  text-align: center;
  padding: clamp(4px, 1vw, 6px) 0;
  margin-top: clamp(-4px, -1vw, -2px);
  letter-spacing: 0.2px;
}

.mimi-settings-item {
  display: flex;
  align-items: center;
  gap: clamp(10px, 2.5vw, 14px);

  &--full {
    flex-direction: column;
    align-items: stretch;
  }
}

.mimi-settings-label {
  min-width: max(60px, 25%);
  font-size: clamp(13px, 3.2vw, 14px);
  font-weight: 500;
  color: rgba(32, 36, 50, 0.7);
  flex-shrink: 0;
  letter-spacing: 0.2px;
}

.mimi-settings-input {
  flex: 1;
  height: clamp(36px, 9vw, 40px);
  padding: 0 clamp(12px, 3vw, 14px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: clamp(10px, 2.5vw, 12px);
  font-size: clamp(13px, 3.2vw, 14px);
  color: rgba(32, 36, 50, 0.9);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(90, 104, 149, 0.08);

  &:hover {
    border-color: rgba(91, 134, 229, 0.4);
    background: rgba(255, 255, 255, 0.75);
  }

  &:focus {
    outline: none;
    border-color: rgba(91, 134, 229, 0.8);
    background: rgba(255, 255, 255, 0.85);
    box-shadow:
      0 0 0 3px rgba(91, 134, 229, 0.15),
      0 4px 12px rgba(90, 104, 149, 0.12);
  }

  &::placeholder {
    color: rgba(32, 36, 50, 0.35);
  }
}

.mimi-theme-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(10px, 2.5vw, 12px);
  margin-top: clamp(6px, 1.5vw, 8px);
}

.mimi-theme-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1.5vw, 8px);
  padding: clamp(10px, 2.5vw, 12px);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: clamp(10px, 2.5vw, 12px);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(32, 36, 50, 0.7);
  font-size: clamp(12px, 3vw, 13px);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(90, 104, 149, 0.08);

  &:hover {
    border-color: rgba(91, 134, 229, 0.5);
    background: rgba(255, 255, 255, 0.7);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(90, 104, 149, 0.15);
  }

  &:active {
    transform: scale(0.97);
  }

  &.active {
    border-color: rgba(91, 134, 229, 0.8);
    background: linear-gradient(140deg, #5b86e5 0%, #36d1dc 100%);
    color: #ffffff;
    box-shadow: 0 6px 20px rgba(91, 134, 229, 0.35);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(91, 134, 229, 0.4);
    }
  }
}

.mimi-preview-container {
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 2.5vw, 12px);
  padding: clamp(14px, 3.5vw, 16px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.6) 0%, rgba(238, 242, 255, 0.75) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: clamp(14px, 3.5vw, 18px);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.4),
    0 4px 16px rgba(90, 104, 149, 0.1);
}

.mimi-preview-message {
  display: flex;

  &--character {
    justify-content: flex-start;
  }

  &--player {
    justify-content: flex-end;
  }
}

.mimi-preview-bubble {
  max-width: 85%;
  padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 14px);
  border-radius: clamp(14px, 3.5vw, 18px);
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: 0 4px 12px rgba(90, 104, 149, 0.15);
}

.mimi-settings-footer {
  flex-shrink: 0;
  display: flex;
  padding: clamp(16px, 4vw, 20px) clamp(12px, 4vw, 22px) clamp(20px, 5vw, 24px);
  border-top: none;
  background: transparent;
}

.mimi-settings-btn {
  width: 100%;
  padding: clamp(11px, 2.8vw, 13px);
  border: none;
  border-radius: clamp(12px, 3vw, 14px);
  font-size: clamp(13px, 3.2vw, 15px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;

  &:active {
    transform: scale(0.97);
  }

  &--reset {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #ff3b30;
    border: 2px solid rgba(255, 59, 48, 0.4);
    box-shadow: 0 6px 20px rgba(255, 59, 48, 0.15);

    &:hover {
      background: rgba(255, 245, 245, 0.9);
      border-color: #ff3b30;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 59, 48, 0.25);
    }
  }
}

// 小宽度适配
@media (max-width: 350px) {
  .mimi-settings-header {
    padding: clamp(6px, 1.5vh, 10px) clamp(6px, 1.5vw, 10px);
  }

  .mimi-settings-content {
    padding: clamp(6px, 1.5vw, 10px) clamp(6px, 1.5vw, 10px) clamp(16px, 4vw, 20px);
  }

  .mimi-settings-section {
    margin-bottom: clamp(12px, 3vw, 16px);
  }

  .mimi-settings-group {
    padding: clamp(8px, 2vw, 12px);
    gap: clamp(8px, 2vw, 10px);
  }

  .mimi-settings-item {
    flex-direction: column;
    align-items: stretch;
    gap: clamp(6px, 1.5vw, 8px);
  }

  .mimi-settings-label {
    min-width: unset;
  }

  .mimi-settings-input {
    width: 100%;
  }
}

// 极端窄屏适配
@media (max-width: 280px) {
  .mimi-settings-header {
    padding: clamp(4px, 1vh, 8px) clamp(4px, 1vw, 6px);
  }

  .mimi-settings-content {
    padding: clamp(4px, 1vw, 6px) clamp(4px, 1vw, 6px) clamp(12px, 3vw, 16px);
  }

  .mimi-settings-group {
    padding: clamp(6px, 1.5vw, 8px);
    gap: clamp(6px, 1.5vw, 8px);
  }

  .mimi-settings-item {
    gap: clamp(4px, 1vw, 6px);
  }
}
</style>
