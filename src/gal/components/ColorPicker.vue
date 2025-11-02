<template>
  <div class="color-picker-container">
    <!-- 颜色选择器 -->
    <div class="color-picker-wrapper">
      <!-- 颜色面板 -->
      <div class="color-panel" @mousedown="handlePanelMouseDown" ref="colorPanel">
        <div class="color-gradient" :style="{ backgroundColor: hueColor }"></div>
        <div class="color-brightness"></div>
        <div
          class="color-picker-dot"
          :style="{
            left: saturationPercentage + '%',
            top: brightnessPercentage + '%',
          }"
        ></div>
      </div>

      <!-- 色调条 -->
      <div class="hue-slider-container">
        <div class="hue-slider" @mousedown="handleHueMouseDown" ref="hueSlider">
          <div
            class="hue-slider-thumb"
            :style="{ top: huePercentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 十六进制输入框 -->
    <div class="hex-input-container">
      <span class="hex-label">#</span>
      <input
        v-model="hexValue"
        @input="handleHexInput"
        @blur="handleHexBlur"
        class="hex-input"
        placeholder="FFFFFF"
        maxlength="6"
      />
    </div>

    <!-- 颜色预览 -->
    <div class="color-preview" :style="{ backgroundColor: modelValue }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

defineProps<Props>();

const emit = defineEmits<Emits>();

// 颜色选择器 refs
const colorPanel = ref<HTMLElement | null>(null);
const hueSlider = ref<HTMLElement | null>(null);

// 状态
const isDraggingPanel = ref(false);
const isDraggingHue = ref(false);

// HSB 颜色值 (Hue, Saturation, Brightness)
const hue = ref(0); // 0-360
const saturation = ref(100); // 0-100
const brightness = ref(100); // 0-100
const hexValue = ref('FFFFFF');

// 计算当前色调颜色
const hueColor = computed(() => {
  const h = hue.value;
  const c = 255;
  const x = 0;
  const r = Math.round(c);
  const g = Math.round(0);
  const b = Math.round(x);

  // HSL 简化版本用于显示色调
  return `hsl(${h}, 100%, 50%)`;
});

// 计算百分比位置
const saturationPercentage = computed(() => saturation.value);
const brightnessPercentage = computed(() => 100 - brightness.value);
const huePercentage = computed(() => (hue.value / 360) * 100);

// HSB 转 RGB
const hsb2rgb = (h: number, s: number, b: number) => {
  h = h % 360;
  s = s / 100;
  b = b / 100;

  const c = b * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = b - c;

  let r = 0,
    g = 0,
    bl = 0;

  if (h < 60) {
    r = c;
    g = x;
    bl = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    bl = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    bl = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    bl = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    bl = c;
  } else {
    r = c;
    g = 0;
    bl = x;
  }

  const R = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const G = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const B = Math.round((bl + m) * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${R}${G}${B}`.toUpperCase();
};

// RGB 转 HSB
const rgb2hsb = (hex: string) => {
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const c = max - min;

  let h = 0;
  if (c !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / c) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / c + 2);
    } else {
      h = 60 * ((r - g) / c + 4);
    }
  }

  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (c / max) * 100;
  const br = max * 100;

  return { h: Math.round(h), s: Math.round(s), br: Math.round(br) };
};

// 将外部 prop 的颜色转换为内部 HSB 值
watch(
  () => {
    // 这个 watch 不使用 props，而是监听 hexValue 的变化
  },
  () => {},
  { immediate: true }
);

// 初始化颜色
const initializeColor = (color: string) => {
  try {
    let hex = color.replace('#', '').toUpperCase();
    if (hex.length === 6) {
      const hsb = rgb2hsb(hex);
      hue.value = hsb.h;
      saturation.value = hsb.s;
      brightness.value = hsb.br;
      hexValue.value = hex;
    }
  } catch (e) {
    console.error('颜色解析失败:', e);
  }
};

// 监听 modelValue 变化
watch(
  () => {
    // 监听 prop 变化时初始化
  },
  () => {},
  { immediate: true }
);

// 面板鼠标按下
const handlePanelMouseDown = (e: MouseEvent) => {
  isDraggingPanel.value = true;
  updatePanelPosition(e);
  document.addEventListener('mousemove', handlePanelMouseMove);
  document.addEventListener('mouseup', handlePanelMouseUp);
};

// 面板鼠标移动
const handlePanelMouseMove = (e: MouseEvent) => {
  if (isDraggingPanel.value) {
    updatePanelPosition(e);
  }
};

// 面板鼠标抬起
const handlePanelMouseUp = () => {
  isDraggingPanel.value = false;
  document.removeEventListener('mousemove', handlePanelMouseMove);
  document.removeEventListener('mouseup', handlePanelMouseUp);
};

// 更新面板位置
const updatePanelPosition = (e: MouseEvent) => {
  if (!colorPanel.value) return;

  const rect = colorPanel.value.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

  saturation.value = Math.round((x / rect.width) * 100);
  brightness.value = Math.round(100 - (y / rect.height) * 100);

  updateHexColor();
};

// 色调条鼠标按下
const handleHueMouseDown = (e: MouseEvent) => {
  isDraggingHue.value = true;
  updateHuePosition(e);
  document.addEventListener('mousemove', handleHueMouseMove);
  document.addEventListener('mouseup', handleHueMouseUp);
};

// 色调条鼠标移动
const handleHueMouseMove = (e: MouseEvent) => {
  if (isDraggingHue.value) {
    updateHuePosition(e);
  }
};

// 色调条鼠标抬起
const handleHueMouseUp = () => {
  isDraggingHue.value = false;
  document.removeEventListener('mousemove', handleHueMouseMove);
  document.removeEventListener('mouseup', handleHueMouseUp);
};

// 更新色调位置
const updateHuePosition = (e: MouseEvent) => {
  if (!hueSlider.value) return;

  const rect = hueSlider.value.getBoundingClientRect();
  const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

  hue.value = Math.round((y / rect.height) * 360);
  updateHexColor();
};

// 更新十六进制颜色
const updateHexColor = () => {
  const hex = hsb2rgb(hue.value, saturation.value, brightness.value);
  hexValue.value = hex.substring(1);
  emit('update:modelValue', hex);
};

// 处理十六进制输入
const handleHexInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  let hex = input.value.toUpperCase();

  // 只允许十六进制字符
  hex = hex.replace(/[^0-9A-F]/g, '');

  if (hex.length === 6) {
    const hsb = rgb2hsb(hex);
    hue.value = hsb.h;
    saturation.value = hsb.s;
    brightness.value = hsb.br;
    emit('update:modelValue', `#${hex}`);
  }

  hexValue.value = hex;
};

// 处理十六进制失焦
const handleHexBlur = () => {
  if (hexValue.value.length !== 6) {
    // 恢复为当前颜色
    const hex = hsb2rgb(hue.value, saturation.value, brightness.value);
    hexValue.value = hex.substring(1);
  }
};

// 初始化组件时设置颜色
initializeColor('#FFFFFF');
</script>

<style scoped lang="scss">
.color-picker-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.color-picker-wrapper {
  display: flex;
  gap: 10px;
  height: 200px;
}

.color-panel {
  position: relative;
  flex: 1;
  border-radius: 4px;
  overflow: hidden;
  cursor: crosshair;
  border: 1px solid #ccc;
}

.color-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
}

.color-brightness {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
}

.color-picker-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hue-slider-container {
  width: 20px;
  height: 200px;
}

.hue-slider {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    #ff0000,
    #ffff00,
    #00ff00,
    #00ffff,
    #0000ff,
    #ff00ff,
    #ff0000
  );
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #ccc;
}

.hue-slider-thumb {
  position: absolute;
  left: -4px;
  width: 28px;
  height: 4px;
  background: white;
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transform: translateY(-50%);
  pointer-events: none;
}

.hex-input-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.hex-label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.hex-input {
  flex: 1;
  border: none;
  background: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 14px;
  text-transform: uppercase;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
}

.color-preview {
  height: 30px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}
</style>
