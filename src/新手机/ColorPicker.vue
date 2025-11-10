<template>
  <div class="color-picker">
    <input type="color" :value="modelValue" @input="onColorChange" class="color-picker__swatch" />
    <input
      type="text"
      :value="modelValue"
      @input="onTextChange"
      @blur="validateColor"
      placeholder="#FFFFFF"
      class="color-picker__input"
      maxlength="7"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function onColorChange(e: Event) {
  const value = (e.target as HTMLInputElement).value.toUpperCase();
  emit('update:modelValue', value);
}

function onTextChange(e: Event) {
  const value = (e.target as HTMLInputElement).value.toUpperCase();
  emit('update:modelValue', value);
}

function validateColor(e: Event) {
  const input = e.target as HTMLInputElement;
  const value = input.value.trim().toUpperCase();

  // 验证 HEX 颜色格式
  const hexRegex = /^#[0-9A-F]{6}$/;

  if (!hexRegex.test(value)) {
    // 尝试修复常见格式错误
    let fixed = value;

    // 如果没有 #，添加它
    if (!fixed.startsWith('#')) {
      fixed = '#' + fixed;
    }

    // 如果是 3 位 HEX，扩展为 6 位
    if (fixed.length === 4 && /^#[0-9A-F]{3}$/.test(fixed)) {
      fixed = '#' + fixed[1] + fixed[1] + fixed[2] + fixed[2] + fixed[3] + fixed[3];
    }

    // 如果还是不合法，恢复原值
    if (!hexRegex.test(fixed)) {
      emit('update:modelValue', props.modelValue);
      return;
    }

    emit('update:modelValue', fixed);
  }
}
</script>

<style lang="scss" scoped>
.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 1000%;
  max-width: 80%;
  box-sizing: border-box;

  &__swatch {
    width: 50px;
    height: 36px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: rgba(0, 0, 0, 0.3);
    }

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: 6px;
    }
  }

  &__input {
    flex: 1;
    max-width: calc(100% - 60px);
    height: 36px;
    padding: 0 12px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: 500;
    color: #000000;
    text-transform: uppercase;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #007aff;
    }

    &::placeholder {
      color: rgba(0, 0, 0, 0.3);
    }
  }
}

// 小宽度适配
@media (max-width: 400px) {
  .color-picker {
    gap: 4px;

    &__swatch {
      width: 32px;
      height: 26px;
    }

    &__input {
      height: 26px;
      padding: 0 6px;
      font-size: 11px;
    }
  }
}

// 极端窄屏 - 垂直布局
@media (max-width: 320px) {
  .color-picker {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;

    &__swatch {
      width: 100%;
      height: 32px;
    }

    &__input {
      width: 100%;
      height: 32px;
      padding: 0 8px;
      font-size: 12px;
    }
  }
}
</style>
