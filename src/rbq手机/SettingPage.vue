<template>
  <div class="rbq-settings-page">
    <!-- 页面头部 -->
    <div class="rbq-settings-header">
      <h2>设置</h2>
    </div>

    <!-- 设置内容 -->
    <div class="rbq-settings-container">
      <!-- 手机尺寸部分 -->
      <div class="rbq-setting-section">
        <div class="rbq-section-title">手机尺寸</div>

        <!-- 宽度设置 -->
        <div class="rbq-setting-item">
          <div class="rbq-label">
            <span>宽度</span>
            <span class="rbq-value">{{ phoneState.size.width }}px</span>
          </div>
          <input
            v-model.number="tempWidth"
            type="range"
            min="300"
            max="600"
            step="10"
            class="rbq-slider"
            @change="updateSize"
          />
          <div class="rbq-slider-label">300px - 600px</div>
        </div>

        <!-- 高度设置 -->
        <div class="rbq-setting-item">
          <div class="rbq-label">
            <span>高度</span>
            <span class="rbq-value">{{ phoneState.size.height }}px</span>
          </div>
          <input
            v-model.number="tempHeight"
            type="range"
            min="600"
            max="1000"
            step="10"
            class="rbq-slider"
            @change="updateSize"
          />
          <div class="rbq-slider-label">600px - 1000px</div>
        </div>
      </div>

      <!-- 气泡颜色部分 -->
      <div class="rbq-setting-section">
        <div class="rbq-section-title">消息气泡</div>

        <!-- 玩家气泡色 -->
        <div class="rbq-setting-item">
          <div class="rbq-label">玩家消息气泡</div>
          <div class="rbq-color-picker">
            <input
              v-model="phoneState.theme.bubbleColor.mine"
              type="color"
              class="rbq-color-input"
              @change="saveBubbleColor"
            />
            <span class="rbq-color-text">{{ phoneState.theme.bubbleColor.mine }}</span>
          </div>
        </div>

        <!-- NPC气泡色 -->
        <div class="rbq-setting-item">
          <div class="rbq-label">NPC消息气泡</div>
          <div class="rbq-color-picker">
            <input
              v-model="phoneState.theme.bubbleColor.other"
              type="color"
              class="rbq-color-input"
              @change="saveBubbleColor"
            />
            <span class="rbq-color-text">{{ phoneState.theme.bubbleColor.other }}</span>
          </div>
        </div>
      </div>

      <!-- 字体部分 -->
      <div class="rbq-setting-section">
        <div class="rbq-section-title">字体大小</div>

        <div class="rbq-setting-item">
          <div class="rbq-label">选择字体大小</div>
          <div class="rbq-radio-group">
            <label class="rbq-radio-item">
              <input
                v-model="phoneState.settings.fontSize"
                type="radio"
                value="small"
                @change="updateSettings"
              />
              <span>小</span>
            </label>
            <label class="rbq-radio-item">
              <input
                v-model="phoneState.settings.fontSize"
                type="radio"
                value="medium"
                @change="updateSettings"
              />
              <span>中</span>
            </label>
            <label class="rbq-radio-item">
              <input
                v-model="phoneState.settings.fontSize"
                type="radio"
                value="large"
                @change="updateSettings"
              />
              <span>大</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 发送消息模式部分 -->
      <div class="rbq-setting-section">
        <div class="rbq-section-title">发送消息</div>

        <div class="rbq-setting-item">
          <div class="rbq-label">选择发送方式</div>
          <div class="rbq-radio-group">
            <label class="rbq-radio-item">
              <input
                v-model="phoneState.settings.messageMode"
                type="radio"
                value="direct"
                @change="updateSettings"
              />
              <span class="rbq-radio-label-text">
                <div>直接发送</div>
                <div class="rbq-radio-desc">将消息直接发送到手机聊天界面</div>
              </span>
            </label>
            <label class="rbq-radio-item">
              <input
                v-model="phoneState.settings.messageMode"
                type="radio"
                value="input"
                @change="updateSettings"
              />
              <span class="rbq-radio-label-text">
                <div>添加到输入框</div>
                <div class="rbq-radio-desc">将消息添加到SillyTavern的输入框</div>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- 其他设置部分 -->
      <div class="rbq-setting-section">
        <div class="rbq-section-title">其他</div>

        <div class="rbq-setting-item">
          <button class="rbq-btn rbq-btn-secondary" @click="resetTheme">
            重置主题为默认值
          </button>
        </div>

        <div class="rbq-setting-item">
          <button class="rbq-btn rbq-btn-danger" @click="clearAllPhoneData">
            清空所有手机数据
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { phoneState, updatePhoneSize, updateTheme, updateSettings as updateAppSettings, resetThemeToDefault, clearAllData } from './stores/phone-state';

const tempWidth = ref(400);
const tempHeight = ref(800);

onMounted(() => {
  tempWidth.value = phoneState.size.width;
  tempHeight.value = phoneState.size.height;
});

/**
 * 更新手机尺寸
 */
function updateSize() {
  updatePhoneSize(tempWidth.value, tempHeight.value);
}

/**
 * 保存气泡颜色
 */
function saveBubbleColor() {
  updateTheme({
    bubbleColor: { ...phoneState.theme.bubbleColor },
  });
}

/**
 * 更新设置
 */
function updateSettings() {
  updateAppSettings({
    fontSize: phoneState.settings.fontSize,
    messageMode: phoneState.settings.messageMode,
  });
}

/**
 * 重置主题
 */
function resetTheme() {
  if (confirm('确定要重置主题为默认值吗？')) {
    resetThemeToDefault();
  }
}

/**
 * 清空所有手机数据
 */
function clearAllPhoneData() {
  if (confirm('确定要清空所有手机数据吗？此操作不可撤销。')) {
    clearAllData();
    alert('已清空所有数据');
  }
}
</script>

<style scoped lang="scss">
.rbq-settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* === 页面头部 === */
.rbq-settings-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;

  h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
}

/* === 设置内容 === */
.rbq-settings-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f5f5f5;
}

/* === 设置分组 === */
.rbq-setting-section {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rbq-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

/* === 设置项 === */
.rbq-setting-item {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.rbq-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.rbq-value {
  color: #007aff;
  font-weight: 600;
}

/* === 滑块 === */
.rbq-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007aff;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 122, 255, 0.3);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007aff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 122, 255, 0.3);
  }
}

.rbq-slider-label {
  font-size: 12px;
  color: #999;
  text-align: right;
}

/* === 颜色选择器 === */
.rbq-color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rbq-color-input {
  width: 60px;
  height: 40px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
}

.rbq-color-text {
  font-size: 14px;
  color: #666;
  font-family: monospace;
  flex: 1;
}

/* === 单选按钮组 === */
.rbq-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rbq-radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:active {
    background-color: #f5f5f5;
  }

  input[type='radio'] {
    cursor: pointer;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  span {
    font-size: 14px;
    color: #333;
  }
}

.rbq-radio-label-text {
  display: flex;
  flex-direction: column;
  gap: 2px;

  & > div:first-child {
    font-weight: 500;
  }
}

.rbq-radio-desc {
  font-size: 12px;
  color: #999;
}

/* === 按钮 === */
.rbq-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  &:active {
    opacity: 0.8;
  }
}

.rbq-btn-secondary {
  background-color: #f0f0f0;
  color: #333;

  &:active {
    background-color: #e0e0e0;
  }
}

.rbq-btn-danger {
  background-color: #ff3b30;
  color: white;

  &:active {
    background-color: #e62a1f;
  }
}
</style>
