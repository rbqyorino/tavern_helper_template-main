<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import gsap from 'gsap';

// 定义 props
const props = defineProps<{
  isAutoPlaying: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  toggleUI: [];
  toggleAuto: [];
  toggleLog: [];
  toggleMusic: [];
  toggleConfig: [];
}>();

// 响应式数据
const currentDescription = ref(''); // 当前显示的功能描述
const isLocked = ref(true);         // Lock 图标的锁定状态，初始为锁定
const menuElement = ref<HTMLElement | null>(null); // 菜单 DOM 引用

// 图标配置数据
const menuIcons = [
  { name: 'skip', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_skip.png', width: 71, desc: '快进文本（未制作）' },
  { name: 'auto', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_auto.png', width: 68, desc: '自动阅读文本' },
  { name: 'prev', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_selback.png', width: 72, desc: '回到上个选项（未制作）' },
  { name: 'next', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_selnext.png', width: 74, desc: '前往下个选项（未制作）' },
  { name: 'voice', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_voice.png', width: 84, desc: '音乐设置' },
  { name: 'fav', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_favo.png', width: 62, desc: '进行语言收藏（未制作）' },
  { name: 'log', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_blog.png', width: 67, desc: '打开剧情回想' },
  { name: 'config', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_config.png', width: 92, desc: '打开设置界面' },
  { name: 'graph', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_graph.png', width: 81, desc: '打开甜蜜量表（未制作）' },
  { name: 'lock', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_lock.png', width: 32, desc: '固定系统菜单' },
  { name: 'close', url: 'https://gitgud.io/RBQ/amakano3/-/raw/master/menu/bt_close.png', width: 32, desc: '隐藏文本框' }
];

// 事件处理函数
function showDescription(text: string) {
  currentDescription.value = text;
}

function hideDescription() {
  currentDescription.value = '';
}

function toggleLock() {
  isLocked.value = !isLocked.value;

  // 切换为锁定状态时，确保菜单完全显示
  if (isLocked.value && menuElement.value) {
    showMenu();
  }
}

function handleIconClick(iconName: string) {
  if (iconName === 'lock') {
    toggleLock();
  } else if (iconName === 'close') {
    emit('toggleUI');
  } else if (iconName === 'auto') {
    emit('toggleAuto');
  } else if (iconName === 'log') {
    emit('toggleLog');
  } else if (iconName === 'voice') {
    emit('toggleMusic');
  } else if (iconName === 'config') {
    emit('toggleConfig');
  }
}

// 菜单显示/隐藏动画
function showMenu() {
  if (menuElement.value) {
    gsap.to(menuElement.value, {
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    });
  }
}

function hideMenu() {
  // 只有在非锁定状态下才隐藏菜单
  if (!isLocked.value && menuElement.value) {
    gsap.to(menuElement.value, {
      y: 52, // 菜单高度
      duration: 0.3,
      ease: 'power2.in'
    });
  }
}

// 鼠标进入菜单区域
function handleMouseEnter() {
  showMenu();
}

// 鼠标离开菜单区域
function handleMouseLeave() {
  if (!isLocked.value) {
    hideMenu();
  }
}

// 初始化：锁定状态下菜单完全显示
onMounted(() => {
  if (menuElement.value) {
    gsap.set(menuElement.value, { y: 0 });
  }
});

// 监听自动播放状态，自动隐藏/显示菜单
watch(() => props.isAutoPlaying, (isAuto) => {
  if (isAuto) {
    // 自动播放时隐藏菜单
    if (menuElement.value) {
      gsap.to(menuElement.value, {
        y: 52,
        duration: 0.3,
        ease: 'power2.in'
      });
    }
  } else {
    // 取消自动播放时显示菜单
    if (menuElement.value) {
      gsap.to(menuElement.value, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }
});
</script>

<template>
  <div
    ref="menuElement"
    class="bottom-menu"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 左侧信息区域 -->
    <div class="info-section">
      <div class="info-icon"></div>
      <div class="description-text">{{ currentDescription }}</div>
    </div>

    <!-- 右侧功能图标组 -->
    <div class="icons-section">
      <div
        v-for="icon in menuIcons"
        :key="icon.name"
        class="menu-icon"
        :class="[
          `icon-${icon.name}`,
          icon.name === 'lock' ? (isLocked ? 'locked' : 'unlocked') : '',
          icon.name === 'auto' && isAutoPlaying ? 'auto-active' : ''
        ]"
        :style="{
          backgroundImage: `url(${icon.url})`,
          width: `${icon.width}px`
        }"
        @mouseenter="showDescription(icon.desc)"
        @mouseleave="hideDescription"
        @click="handleIconClick(icon.name)"
      ></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bottom-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 52px;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/dock01.png') center no-repeat;
  background-size: 1920px 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
}

// 左侧信息区域
.info-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #3e2723;
  background-color: #ffffff;
  position: relative;

  &::after {
    content: 'i';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #3e2723;
    font-size: 14px;
    font-weight: bold;
    font-style: italic;
  }
}

.description-text {
  color: #3e2723;
  font-size: 15px;
    font-weight: 600;       // 示例：添加半粗体
  min-width: 120px;
  white-space: nowrap;
}

// 右侧图标区域
.icons-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  height: 34px;
  background-repeat: no-repeat;
  background-position: center top;
  cursor: pointer;
  transition: background-position-y 0.15s ease;

  // 普通图标悬停效果
  &:not(.unlocked):not(.locked):hover {
    background-position-y: -34px;
  }

  // Lock 图标特殊处理
  &.unlocked {
    background-position-y: -68px;

    &:hover {
      background-position-y: -102px;
    }
  }

  &.locked {
    background-position-y: 0;

    &:hover {
      background-position-y: -34px;
    }
  }

  // Auto 图标激活状态
  &.auto-active {
    background-position-y: -34px;
    filter: brightness(1.2);
  }
}

// 小屏幕响应式：隐藏不常用按钮（< 1000px）
@media (max-width: 999px) {
  .icon-skip,
  .icon-prev,
  .icon-next,
  .icon-fav,
  .icon-graph,
  .icon-lock {
    display: none;
  }
}
</style>
