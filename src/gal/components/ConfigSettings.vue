<template>
  <div class="config-settings" @contextmenu.prevent="handleBack">
    <!-- 背景 -->
    <div class="config-background"></div>
  </div>
</template>

<script setup lang="ts">
// 定义事件
const emit = defineEmits<{
  back: [];
}>();

// 右键返回处理
const handleBack = () => {
  emit('back');
};
</script>

<style scoped lang="scss">
.config-settings {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
</style>
