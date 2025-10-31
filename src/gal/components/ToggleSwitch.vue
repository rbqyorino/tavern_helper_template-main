<template>
  <div class="toggle-switch">
    <button
      class="toggle-btn btn-on"
      :class="{ active: modelValue }"
      @click="$emit('update:modelValue', true)"
    ></button>
    <button
      class="toggle-btn btn-off"
      :class="{ active: !modelValue }"
      @click="$emit('update:modelValue', false)"
    ></button>
  </div>
</template>

<script setup lang="ts">
// Props
defineProps<{
  modelValue: boolean;
}>();

// Emits
defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped lang="scss">
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 20px; // 两按钮之间的间距
}

.toggle-btn {
  width: 132.6px; // 204 * 0.65
  height: 36.4px; // (224 / 4) * 0.65 = 56 * 0.65
  border: none;
  background-repeat: no-repeat;
  background-position: 0 0; // 默认显示第1部分（非选中）
  background-size: 132.6px 145.6px; // 宽度 * 0.65, 高度 * 0.65
  cursor: pointer;
  transition: background-position 0.15s ease;
  padding: 0;
  outline: none;

  // "是" 按钮
  &.btn-on {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_on02.webp');
  }

  // "否" 按钮
  &.btn-off {
    background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/config/bt_off02.webp');
  }

  // 选中状态：显示雪碧图第2部分（向上偏移一个等分的高度）
  &.active {
    background-position: 0 -36.4px; // -(56 * 0.65)
  }

  // Hover 效果（可选）
  &:hover:not(.active) {
    opacity: 0.9;
  }
}
</style>
