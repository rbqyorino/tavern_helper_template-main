<template>
  <div class="config-settings" @contextmenu.prevent="handleBack">
    <!-- 背景 -->
    <div class="config-background"></div>

    <!-- 顶部标签页 -->
    <div class="tab-buttons">
      <button class="tab-btn tab-basic active" @click="handleTabClick('basic')"></button>
      <button class="tab-btn tab-sound" @click="handleTabClick('sound')"></button>
      <button class="tab-btn tab-voice" @click="handleTabClick('voice')"></button>
      <button class="tab-btn tab-dialog" @click="handleTabClick('dialog')"></button>
      <button class="tab-btn tab-guide" @click="handleTabClick('guide')"></button>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧设置区域 -->
      <div class="left-section">
        <!-- 呼吸特效设置 -->
        <div class="setting-item">
          <div class="breathing-title">是否开启呼吸特效</div>
          <ToggleSwitch v-model="breathingEffect" />
        </div>

        <!-- 快捷键设置 -->
        <div class="setting-item">
          <div class="keyboard-title">是否启动快捷键推进对话</div>
          <div class="keyboard-hint">快捷键包括空格/方向键"↓"/滚轮向下</div>
          <ToggleSwitch v-model="keyboardShortcut" />
        </div>

        <!-- 双击全屏设置 -->
        <div class="setting-item">
          <div class="fullscreen-title">是否开启双击全屏功能</div>
          <ToggleSwitch v-model="fullscreenDblClick" />
        </div>

        <!-- 自动模式速度 -->
        <div class="setting-item">
          <div class="autospeed-title">自动模式速度</div>
          <div class="slider-container">
            <span class="autospeed-label-left">慢</span>
            <div class="slider-track" ref="autoSpeedTrack" @click="handleAutoSpeedTrackClick">
              <div
                class="slider-thumb"
                ref="autoSpeedThumb"
                :style="{ left: autoSpeedThumbPosition + 'px' }"
                @mousedown="startAutoSpeedDrag"
              ></div>
            </div>
            <span class="autospeed-label-right">快</span>
          </div>
        </div>
      </div>

      <!-- 右侧设置区域 -->
      <div class="right-section">
        <!-- 对话框字体大小 -->
        <div class="control-section">
          <div class="fontsize-title">对话框字体大小</div>
          <div class="slider-container">
            <span class="fontsize-label-left">小</span>
            <div class="slider-track" ref="fontSizeTrack" @click="handleFontSizeTrackClick">
              <div
                class="slider-thumb"
                ref="fontSizeThumb"
                :style="{ left: fontSizeThumbPosition + 'px' }"
                @mousedown="startFontSizeDrag"
              ></div>
            </div>
            <span class="fontsize-label-right">大</span>
          </div>
        </div>

        <!-- 文本速度 -->
        <div class="control-section">
          <div class="textspeed-title">文本速度</div>
          <div class="slider-container">
            <span class="textspeed-label-left">慢</span>
            <div class="slider-track" ref="textSpeedTrack" @click="handleTextSpeedTrackClick">
              <div
                class="slider-thumb"
                ref="textSpeedThumb"
                :style="{ left: textSpeedThumbPosition + 'px' }"
                @mousedown="startTextSpeedDrag"
              ></div>
            </div>
            <span class="textspeed-label-right">快</span>
          </div>
        </div>

        <!-- 背景不透明度 -->
        <div class="control-section">
          <div class="bgopacity-title">背景不透明度</div>
          <div class="slider-container">
            <span class="bgopacity-label-left">0%</span>
            <div class="slider-track" ref="opacityTrack" @click="handleOpacityTrackClick">
              <div
                class="slider-thumb"
                ref="opacityThumb"
                :style="{ left: opacityThumbPosition + 'px' }"
                @mousedown="startOpacityDrag"
              ></div>
            </div>
            <span class="bgopacity-label-right">100%</span>
          </div>
        </div>

        <!-- 展示界面 -->
        <div class="preview-section">
          <div class="preview-title">展示界面</div>
          <div class="preview-box">
            <div class="preview-bg" :style="{ opacity: opacity }"></div>
            <span ref="previewText" class="preview-text" :style="{ fontSize: fontSize + 'px' }">甜蜜女友3真好玩</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮组 -->
    <div class="bottom-buttons">
      <button class="bottom-btn btn-default" @click="handleBottomClick('default')"></button>
      <button class="bottom-btn btn-return" @click="handleBottomClick('return')"></button>
      <button class="bottom-btn btn-title" @click="handleBottomClick('title')"></button>
      <button class="bottom-btn btn-end" @click="handleBottomClick('end')"></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';
import gsap from 'gsap';
import { useConfigStore } from '../stores/config';
import { storeToRefs } from 'pinia';

// 定义事件
const emit = defineEmits<{
  back: [];
}>();

// 使用 config store
const configStore = useConfigStore();
const { breathingEffect, keyboardShortcut, fullscreenDblClick, fontSize, textSpeed, opacity, autoSpeed } = storeToRefs(configStore);

// 监听配置变化并自动保存
watch([breathingEffect, keyboardShortcut, fullscreenDblClick, fontSize, textSpeed, opacity, autoSpeed], () => {
  configStore.saveConfig();
}, { deep: true });

// 滑动条相关的 refs
const fontSizeTrack = ref<HTMLElement | null>(null);
const fontSizeThumb = ref<HTMLElement | null>(null);
const fontSizeThumbPosition = ref(0);

const textSpeedTrack = ref<HTMLElement | null>(null);
const textSpeedThumb = ref<HTMLElement | null>(null);
const textSpeedThumbPosition = ref(0);

const opacityTrack = ref<HTMLElement | null>(null);
const opacityThumb = ref<HTMLElement | null>(null);
const opacityThumbPosition = ref(0);

const autoSpeedTrack = ref<HTMLElement | null>(null);
const autoSpeedThumb = ref<HTMLElement | null>(null);
const autoSpeedThumbPosition = ref(0);

const previewText = ref<HTMLElement | null>(null);

// 拖拽状态
const isDraggingFontSize = ref(false);
const isDraggingTextSpeed = ref(false);
const isDraggingOpacity = ref(false);
const isDraggingAutoSpeed = ref(false);
const dragStartX = ref(0);
const dragStartThumbPos = ref(0);

// 更新滑块位置的通用函数
const updateThumbPosition = (
  value: number,
  min: number,
  max: number,
  track: HTMLElement | null,
  thumbPosition: { value: number }
) => {
  if (!track) return;
  const trackWidth = track.clientWidth;
  const thumbWidth = 50;
  const ratio = (value - min) / (max - min);
  thumbPosition.value = ratio * (trackWidth - thumbWidth);
};

// 更新各个滑块位置
const updateFontSizeThumbPosition = () => {
  updateThumbPosition(fontSize.value, 16, 32, fontSizeTrack.value, fontSizeThumbPosition);
};

const updateTextSpeedThumbPosition = () => {
  updateThumbPosition(textSpeed.value, 0, 1, textSpeedTrack.value, textSpeedThumbPosition);
};

const updateOpacityThumbPosition = () => {
  updateThumbPosition(opacity.value, 0, 1, opacityTrack.value, opacityThumbPosition);
};

const updateAutoSpeedThumbPosition = () => {
  updateThumbPosition(autoSpeed.value, 0, 1, autoSpeedTrack.value, autoSpeedThumbPosition);
};

// 监听值变化更新滑块
watch(fontSize, updateFontSizeThumbPosition);
watch(textSpeed, updateTextSpeedThumbPosition);
watch(opacity, updateOpacityThumbPosition);
watch(autoSpeed, updateAutoSpeedThumbPosition);

// 点击轨道跳转的通用函数
const handleTrackClick = (
  event: MouseEvent,
  track: HTMLElement | null,
  min: number,
  max: number,
  setValue: (value: number) => void
) => {
  if (!track) return;
  if ((event.target as HTMLElement).classList.contains('slider-thumb')) return;

  const trackRect = track.getBoundingClientRect();
  const clickX = event.clientX - trackRect.left;
  const trackWidth = track.clientWidth;
  const thumbWidth = 50;

  const ratio = Math.max(0, Math.min(1, clickX / (trackWidth - thumbWidth)));
  setValue(min + ratio * (max - min));
};

// 各个滑块的点击处理
const handleFontSizeTrackClick = (event: MouseEvent) => {
  handleTrackClick(event, fontSizeTrack.value, 16, 32, (value) => (fontSize.value = value));
};

const handleTextSpeedTrackClick = (event: MouseEvent) => {
  handleTrackClick(event, textSpeedTrack.value, 0, 1, (value) => (textSpeed.value = value));
};

const handleOpacityTrackClick = (event: MouseEvent) => {
  handleTrackClick(event, opacityTrack.value, 0, 1, (value) => (opacity.value = value));
};

const handleAutoSpeedTrackClick = (event: MouseEvent) => {
  handleTrackClick(event, autoSpeedTrack.value, 0, 1, (value) => (autoSpeed.value = value));
};

// 拖拽开始的通用函数
const startDrag = (
  event: MouseEvent,
  isDragging: { value: boolean },
  thumbPosition: { value: number },
  onDragFn: (e: MouseEvent) => void,
  stopDragFn: () => void
) => {
  isDragging.value = true;
  dragStartX.value = event.clientX;
  dragStartThumbPos.value = thumbPosition.value;

  document.addEventListener('mousemove', onDragFn);
  document.addEventListener('mouseup', stopDragFn);
  event.preventDefault();
};

// 拖拽过程的通用函数
const onDrag = (
  event: MouseEvent,
  isDragging: { value: boolean },
  track: HTMLElement | null,
  thumbPosition: { value: number },
  min: number,
  max: number,
  setValue: (value: number) => void
) => {
  if (!isDragging.value || !track) return;

  const deltaX = event.clientX - dragStartX.value;
  const trackWidth = track.clientWidth;
  const thumbWidth = 50;
  const maxThumbPos = trackWidth - thumbWidth;

  const newThumbPos = Math.max(0, Math.min(maxThumbPos, dragStartThumbPos.value + deltaX));
  thumbPosition.value = newThumbPos;

  const ratio = newThumbPos / maxThumbPos;
  setValue(min + ratio * (max - min));
};

// 字体大小拖拽
const startFontSizeDrag = (event: MouseEvent) => {
  startDrag(event, isDraggingFontSize, fontSizeThumbPosition, onFontSizeDrag, stopFontSizeDrag);
};

const onFontSizeDrag = (event: MouseEvent) => {
  onDrag(
    event,
    isDraggingFontSize,
    fontSizeTrack.value,
    fontSizeThumbPosition,
    16,
    32,
    (value) => (fontSize.value = value)
  );
};

const stopFontSizeDrag = () => {
  isDraggingFontSize.value = false;
  document.removeEventListener('mousemove', onFontSizeDrag);
  document.removeEventListener('mouseup', stopFontSizeDrag);
};

// 文本速度拖拽
const startTextSpeedDrag = (event: MouseEvent) => {
  startDrag(event, isDraggingTextSpeed, textSpeedThumbPosition, onTextSpeedDrag, stopTextSpeedDrag);
};

const onTextSpeedDrag = (event: MouseEvent) => {
  onDrag(
    event,
    isDraggingTextSpeed,
    textSpeedTrack.value,
    textSpeedThumbPosition,
    0,
    1,
    (value) => (textSpeed.value = value)
  );
};

const stopTextSpeedDrag = () => {
  isDraggingTextSpeed.value = false;
  document.removeEventListener('mousemove', onTextSpeedDrag);
  document.removeEventListener('mouseup', stopTextSpeedDrag);
};

// 不透明度拖拽
const startOpacityDrag = (event: MouseEvent) => {
  startDrag(event, isDraggingOpacity, opacityThumbPosition, onOpacityDrag, stopOpacityDrag);
};

const onOpacityDrag = (event: MouseEvent) => {
  onDrag(
    event,
    isDraggingOpacity,
    opacityTrack.value,
    opacityThumbPosition,
    0,
    1,
    (value) => (opacity.value = value)
  );
};

const stopOpacityDrag = () => {
  isDraggingOpacity.value = false;
  document.removeEventListener('mousemove', onOpacityDrag);
  document.removeEventListener('mouseup', stopOpacityDrag);
};

// 自动速度拖拽
const startAutoSpeedDrag = (event: MouseEvent) => {
  startDrag(event, isDraggingAutoSpeed, autoSpeedThumbPosition, onAutoSpeedDrag, stopAutoSpeedDrag);
};

const onAutoSpeedDrag = (event: MouseEvent) => {
  onDrag(
    event,
    isDraggingAutoSpeed,
    autoSpeedTrack.value,
    autoSpeedThumbPosition,
    0,
    1,
    (value) => (autoSpeed.value = value)
  );
};

const stopAutoSpeedDrag = () => {
  isDraggingAutoSpeed.value = false;
  document.removeEventListener('mousemove', onAutoSpeedDrag);
  document.removeEventListener('mouseup', stopAutoSpeedDrag);
};

// 监听文本速度变化，重新播放预览文本的打字机效果
watch(textSpeed, () => {
  if (previewText.value) {
    const text = '甜蜜女友3真好玩';
    const element = previewText.value;

    // 清空文本
    element.textContent = '';

    // 根据速度计算每个字符的延迟时间
    const baseDelay = 0.1; // 基础延迟
    const delay = baseDelay * (1 - textSpeed.value * 0.8); // 速度越快，延迟越短

    // 使用 GSAP 创建打字机效果
    gsap.to({}, {
      duration: text.length * delay,
      onUpdate: function() {
        const progress = this.progress();
        const charCount = Math.floor(progress * text.length);
        element.textContent = text.substring(0, charCount);
      }
    });
  }
});

// 右键返回处理
const handleBack = () => {
  emit('back');
};

// 标签页点击处理（暂时只是占位）
const handleTabClick = (tab: string) => {
  console.log('Tab clicked:', tab);
  // TODO: 实现标签页切换逻辑
};

// 底部按钮点击处理
const handleBottomClick = (action: string) => {
  console.log('Bottom button clicked:', action);

  if (action === 'return') {
    // RETURN 按钮：退出配置界面
    handleBack();
  } else if (action === 'default') {
    // DEFAULT 按钮：重置为默认配置
    configStore.resetToDefault();
    // 更新滑块位置
    updateFontSizeThumbPosition();
    updateTextSpeedThumbPosition();
    updateOpacityThumbPosition();
    updateAutoSpeedThumbPosition();
  } else {
    // TODO: 实现其他按钮的具体功能
  }
};

// 生命周期
onMounted(() => {
  updateFontSizeThumbPosition();
  updateTextSpeedThumbPosition();
  updateOpacityThumbPosition();
  updateAutoSpeedThumbPosition();
});

onUnmounted(() => {
  if (isDraggingFontSize.value) stopFontSizeDrag();
  if (isDraggingTextSpeed.value) stopTextSpeedDrag();
  if (isDraggingOpacity.value) stopOpacityDrag();
  if (isDraggingAutoSpeed.value) stopAutoSpeedDrag();
});
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

.config-settings {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  font-family: 'Noto Serif SC', serif;
  cursor: context-menu;
}

// 背景层
.config-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/sy_bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  z-index: 0;
}

// 主要内容区域
.main-content {
  position: absolute;
  top: 10%;
  left: 0;
  width: 100%;
  height: 80%;
  display: flex;
  z-index: 1;
}

// 左侧设置区域
.left-section {
  position: absolute;
  left: 10%;
  top: 15%;
  display: flex;
  flex-direction: column;
  gap: clamp(20px, 4vw, 40px);
  width: 30%;
  max-height: 75%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px; // 为滚动条留空间
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5vw, 15px);
}

// 左侧独立标题样式
.breathing-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
}

.keyboard-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
}

.keyboard-hint {
  font-size: clamp(0.8rem, 1.5vw, 1.5rem);
  font-weight: 800;
  color: #453118;
  margin-top: -10px;
}

.fullscreen-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
}

.autospeed-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  text-align: left;
}

// 右侧设置区域
.right-section {
  position: absolute;
  right: 10%;
  top: 10%;
  width: 35%;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.5vw, 15px);
  max-height: 80%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px; // 为滚动条留空间
}

.control-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(5px, 1vw, 10px);
}

// 右侧独立标题样式
.fontsize-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  text-align: center;
}

.textspeed-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  text-align: center;
}

.bgopacity-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  text-align: center;
}

.slider-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.5vw, 15px);
  justify-content: center;
}

// 左侧 setting-item 中的滑动条左对齐
.setting-item .slider-container {
  justify-content: flex-start;
}

// 各个滑动条标签的独立样式
.fontsize-label-left,
.fontsize-label-right,
.textspeed-label-left,
.textspeed-label-right,
.bgopacity-label-left,
.bgopacity-label-right,
.autospeed-label-left,
.autospeed-label-right {
  font-size: clamp(1rem, 1.5vw, 2rem);
  font-weight: 800;
  color: #453118;
  flex-shrink: 0;
  min-width: 50px;
  text-align: center;
}

// 滑块轨道
.slider-track {
  flex: 1;
  max-width: 400px;
  height: 10px;
  background: #453118;
  border-radius: 5px;
  position: relative;
  cursor: pointer;
}

// 滑块
.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
  width: 50px;
  height: 50px;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/spin.png') no-repeat center;
  background-size: contain;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

// 预览区域
.preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(5px, 1vw, 10px);
  margin-top: clamp(5px, 1vw, 10px);
}

.preview-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  text-align: center;
}

.preview-box {
  width: 100%;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  position: relative;
}

.preview-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 8px 32px 0 rgba(69, 49, 24, 0.15),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
  z-index: 1;
  pointer-events: none;
}

.preview-text {
  font-weight: 800;
  color: #ffffff;
  -webkit-text-stroke: 2.5px #000000;
  paint-order: stroke fill;
  text-align: center;
  line-height: 1.8;
  position: relative;
  z-index: 2;
}

// 顶部标签页区域
.tab-buttons {
  position: absolute;
  top: 0px;
  right: 60px;
  display: flex;
  gap: 6.5px; // 5px * 1.3
  z-index: 1;
}

// 标签按钮通用样式
.tab-btn {
  width: 117.65px; // 90.5px * 1.3 = 117.65px (181 * 0.65)
  height: 44.85px; // 34.5px * 1.3 = 44.85px (69 * 0.65)
  border: none;
  background-repeat: no-repeat;
  background-position: top;
  background-size: 117.65px 134.55px; // 90.5px * 1.3, 103.5px * 1.3
  cursor: pointer;
  transition: background-position 0.15s ease;
  padding: 0;
  outline: none;

  &:hover {
    background-position: center;
  }

  // 各个标签的背景图
  &.tab-basic {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_tabbasic.png');
  }

  &.tab-sound {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_tabsound.png');
  }

  &.tab-voice {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_tabvoice.png');
  }

  &.tab-dialog {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_tabdialog.png');
  }

  &.tab-guide {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_tabguide.png');
  }
}

// 底部按钮区域
.bottom-buttons {
  position: absolute;
  bottom: 0px;
  right: 60px; // 改为右对齐
  display: flex;
  gap: 9.75px; // 7.5px * 1.3
  z-index: 1;
}

// 底部按钮通用样式
.bottom-btn {
  border: none;
  background-repeat: no-repeat;
  background-position: top;
  cursor: pointer;
  transition: background-position 0.15s ease;
  padding: 0;
  outline: none;

  &:hover {
    background-position: center;
  }

  // DEFAULT 按钮
  &.btn-default {
    width: 141.7px; // 109px * 1.3 = 141.7px (218 * 0.65)
    height: 54.6px; // 42px * 1.3 = 54.6px (84 * 0.65)
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_default.png');
    background-size: 141.7px 163.8px; // 109px * 1.3, 126px * 1.3
  }

  // RETURN 按钮
  &.btn-return {
    width: 128.05px; // 98.5px * 1.3 = 128.05px (197 * 0.65)
    height: 54.6px; // 42px * 1.3
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_return.png');
    background-size: 128.05px 163.8px; // 98.5px * 1.3, 126px * 1.3
  }

  // TITLE 按钮
  &.btn-title {
    width: 150.15px; // 115.5px * 1.3 = 150.15px (231 * 0.65)
    height: 54.6px; // 42px * 1.3
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_title.png');
    background-size: 150.15px 163.8px; // 115.5px * 1.3, 126px * 1.3
  }

  // END 按钮
  &.btn-end {
    width: 139.75px; // 107.5px * 1.3 = 139.75px (215 * 0.65)
    height: 54.6px; // 42px * 1.3
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_end.png');
    background-size: 139.75px 163.8px; // 107.5px * 1.3, 126px * 1.3
  }
}
</style>
