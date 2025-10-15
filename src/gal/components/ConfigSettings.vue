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

    <!-- 中间测试区域 -->
    <div class="test-area">
      <ToggleSwitch v-model="testValue" />
      <p class="test-info">当前值: {{ testValue ? '是' : '否' }}</p>
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
import { ref } from 'vue';
import ToggleSwitch from './ToggleSwitch.vue';

// 定义事件
const emit = defineEmits<{
  back: [];
}>();

// 测试用的响应式变量
const testValue = ref(true);

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
  } else {
    // TODO: 实现其他按钮的具体功能
  }
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

// 测试区域
.test-area {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.test-info {
  color: white;
  font-size: 18px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin: 0;
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
