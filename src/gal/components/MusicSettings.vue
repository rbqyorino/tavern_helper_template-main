<template>
  <div class="music-settings-container" @contextmenu="handleContextMenu">
    <!-- 背景 -->
    <div class="music-background"></div>

    <!-- 内容区域 -->
    <div class="settings-content">
      <!-- BGM 名称显示 -->
      <div class="bgm-name-section">
        <div class="bgm-name-text">{{ bgmName || '无音乐播放' }}</div>
      </div>

      <!-- 音量控制 -->
      <div class="control-section">
        <div class="volume-section-title">音量</div>
        <div class="slider-container">
          <span class="volume-label">0%</span>
          <div class="slider-track" ref="volumeTrack" @click="handleVolumeTrackClick">
            <div
              class="slider-thumb"
              ref="volumeThumb"
              :style="{ left: volumeThumbPosition + 'px' }"
              @mousedown="startVolumeDrag"
            ></div>
          </div>
          <span class="volume-label">100%</span>
        </div>
        <div class="volume-value">{{ Math.round(volume * 100) }}%</div>
      </div>

      <!-- 进度控制 -->
      <div class="control-section">
        <div class="progress-section-title">进度</div>
        <div class="slider-container">
          <span class="progress-label">{{ formatTime(currentTime) }}</span>
          <div class="slider-track" ref="progressTrack" @click="handleProgressTrackClick">
            <div
              class="slider-thumb"
              ref="progressThumb"
              :style="{ left: progressThumbPosition + 'px' }"
              @mousedown="startProgressDrag"
            ></div>
          </div>
          <span class="progress-label">{{ formatTime(duration) }}</span>
        </div>
        <div class="play-pause-button" @click.stop="togglePlayPause">
          <span v-if="isPlaying" class="pause-icon">⏸</span>
          <span v-else class="play-icon">▶</span>
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <div
      class="back-button"
      :class="{ 'btn-hover': hoveredIcon === 'back' }"
      @mouseenter="hoveredIcon = 'back'"
      @mouseleave="hoveredIcon = null"
      @click="handleBack"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

// Props
const props = defineProps<{
  bgmName: string;
  volume: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}>();

// Emits
const emit = defineEmits<{
  back: [];
  volumeChange: [volume: number];
  seek: [time: number];
  togglePlayPause: [];
}>();

// 响应式数据
const hoveredIcon = ref<string | null>(null);
const volumeTrack = ref<HTMLElement | null>(null);
const volumeThumb = ref<HTMLElement | null>(null);
const progressTrack = ref<HTMLElement | null>(null);
const progressThumb = ref<HTMLElement | null>(null);
const volumeThumbPosition = ref(0);
const progressThumbPosition = ref(0);
const isDraggingVolume = ref(false);
const isDraggingProgress = ref(false);
const dragStartX = ref(0);
const dragStartThumbPos = ref(0);

// 时间格式化
const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// 更新音量滑块位置
const updateVolumeThumbPosition = () => {
  if (!volumeTrack.value) return;
  const trackWidth = volumeTrack.value.clientWidth;
  const thumbWidth = 50;
  volumeThumbPosition.value = props.volume * (trackWidth - thumbWidth);
};

// 更新进度滑块位置
const updateProgressThumbPosition = () => {
  if (!progressTrack.value || props.duration === 0) return;
  const trackWidth = progressTrack.value.clientWidth;
  const thumbWidth = 50;
  const ratio = props.currentTime / props.duration;
  progressThumbPosition.value = ratio * (trackWidth - thumbWidth);
};

// 监听 props 变化自动更新滑块位置
watch(() => props.volume, updateVolumeThumbPosition);
watch(() => props.currentTime, updateProgressThumbPosition);
watch(() => props.duration, updateProgressThumbPosition);

// 点击音量轨道跳转
const handleVolumeTrackClick = (event: MouseEvent) => {
  if (!volumeTrack.value) return;
  if ((event.target as HTMLElement).classList.contains('slider-thumb')) return;

  const trackRect = volumeTrack.value.getBoundingClientRect();
  const clickX = event.clientX - trackRect.left;
  const trackWidth = volumeTrack.value.clientWidth;
  const thumbWidth = 50;

  const ratio = Math.max(0, Math.min(1, clickX / (trackWidth - thumbWidth)));
  emit('volumeChange', ratio);
};

// 点击进度轨道跳转
const handleProgressTrackClick = (event: MouseEvent) => {
  if (!progressTrack.value || props.duration === 0) return;
  if ((event.target as HTMLElement).classList.contains('slider-thumb')) return;

  const trackRect = progressTrack.value.getBoundingClientRect();
  const clickX = event.clientX - trackRect.left;
  const trackWidth = progressTrack.value.clientWidth;
  const thumbWidth = 50;

  const ratio = Math.max(0, Math.min(1, clickX / (trackWidth - thumbWidth)));
  emit('seek', ratio * props.duration);
};

// 开始拖动音量滑块
const startVolumeDrag = (event: MouseEvent) => {
  isDraggingVolume.value = true;
  dragStartX.value = event.clientX;
  dragStartThumbPos.value = volumeThumbPosition.value;

  document.addEventListener('mousemove', onVolumeDrag);
  document.addEventListener('mouseup', stopVolumeDrag);
  event.preventDefault();
};

const onVolumeDrag = (event: MouseEvent) => {
  if (!isDraggingVolume.value || !volumeTrack.value) return;

  const deltaX = event.clientX - dragStartX.value;
  const trackWidth = volumeTrack.value.clientWidth;
  const thumbWidth = 50;
  const maxThumbPos = trackWidth - thumbWidth;

  const newThumbPos = Math.max(0, Math.min(maxThumbPos, dragStartThumbPos.value + deltaX));
  volumeThumbPosition.value = newThumbPos;

  const ratio = newThumbPos / maxThumbPos;
  emit('volumeChange', ratio);
};

const stopVolumeDrag = () => {
  isDraggingVolume.value = false;
  document.removeEventListener('mousemove', onVolumeDrag);
  document.removeEventListener('mouseup', stopVolumeDrag);
};

// 开始拖动进度滑块
const startProgressDrag = (event: MouseEvent) => {
  isDraggingProgress.value = true;
  dragStartX.value = event.clientX;
  dragStartThumbPos.value = progressThumbPosition.value;

  document.addEventListener('mousemove', onProgressDrag);
  document.addEventListener('mouseup', stopProgressDrag);
  event.preventDefault();
};

const onProgressDrag = (event: MouseEvent) => {
  if (!isDraggingProgress.value || !progressTrack.value || props.duration === 0) return;

  const deltaX = event.clientX - dragStartX.value;
  const trackWidth = progressTrack.value.clientWidth;
  const thumbWidth = 50;
  const maxThumbPos = trackWidth - thumbWidth;

  const newThumbPos = Math.max(0, Math.min(maxThumbPos, dragStartThumbPos.value + deltaX));
  progressThumbPosition.value = newThumbPos;

  const ratio = newThumbPos / maxThumbPos;
  emit('seek', ratio * props.duration);
};

const stopProgressDrag = () => {
  isDraggingProgress.value = false;
  document.removeEventListener('mousemove', onProgressDrag);
  document.removeEventListener('mouseup', stopProgressDrag);
};

// 事件处理
const handleBack = () => {
  emit('back');
};

const togglePlayPause = () => {
  emit('togglePlayPause');
};

// 右键退出
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  emit('back');
};

// 生命周期
onMounted(() => {
  updateVolumeThumbPosition();
  updateProgressThumbPosition();
});

onUnmounted(() => {
  if (isDraggingVolume.value) {
    stopVolumeDrag();
  }
  if (isDraggingProgress.value) {
    stopProgressDrag();
  }
});
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

.music-settings-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Noto Serif SC', serif;
  z-index: 10000;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/music/bg_favo.webp') no-repeat center / 100% 100%;
}

// 背景
.music-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/music/bg_favo.webp') no-repeat center / 100% 100%;
  z-index: 0;
  pointer-events: none;
}

// 内容区域
.settings-content {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-height: 80%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  z-index: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 10px; // 为滚动条留空间
}

// BGM 名称区域
.bgm-name-section {
  text-align: center;
  margin-bottom: clamp(30px, 5vw, 60px);
}

.bgm-name-text {
  font-size: clamp(1rem, 2.5vw, 2rem);
  font-weight: 800;
  color: #453118;
}

// 控制区域
.control-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(10px, 2vw, 20px);
  margin-bottom: clamp(20px, 3vw, 40px);
}

// 音量部分样式
.volume-section-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  margin-bottom: 10px;
}

.volume-label {
  font-size: clamp(1rem, 1.5vw, 2rem);
  font-weight: 800;
  color: #453118;
  flex-shrink: 0;
  min-width: 60px;
  text-align: center;
}

.volume-value {
  font-size: clamp(1rem, 1.5vw, 2rem);
  font-weight: 800;
  color: #453118;
  margin-top: 10px;
}

// 进度部分样式
.progress-section-title {
  font-size: clamp(1rem, 2vw, 2rem);
  font-weight: 800;
  color: #453118;
  margin-bottom: 10px;
}

.progress-label {
  font-size: clamp(1rem, 1.5vw, 2rem);
  font-weight: 800;
  color: #453118;
  flex-shrink: 0;
  min-width: 60px;
  text-align: center;
}

.progress-value {
  font-size: clamp(1rem, 1.5vw, 2rem);
  font-weight: 800;
  color: #453118;
  margin-top: 10px;
}

// 播放/暂停按钮
.play-pause-button {
  margin-top: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
  height: 3rem; /* 固定高度，防止图标切换时布局变化 */
  min-height: 3rem;

  &:hover {
    transform: scale(1.2);
  }

  &:active {
    transform: scale(0.95);
  }
}

.play-icon,
.pause-icon {
  /* 保留通用样式 */
  font-weight: 800;
  color: #453118;
  user-select: none;
}

.play-icon {
  /* 播放图标使用原来的大小 */
  font-size: clamp(1rem, 1vw, 2.5rem);
}

.pause-icon {
  /* 暂停图标稍微小一点，比如设置为原来的 90% */
  font-size: clamp(1.35rem, 1.8vw, 2.25rem); /* 这里的数值是原先的 0.9 倍 */
  /* 你也可以为了对齐，稍微调整一下位置 */
  position: relative;
  top: -0.05em; /* 稍微向上移动一点，根据实际效果调整 */
}

// 滑块容器
.slider-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: clamp(10px, 2vw, 20px);
  justify-content: center;
}

// 滑块轨道
.slider-track {
  width: 60%;
  max-width: 600px;
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
  transform: translateY(-50%) rotate(90deg); // 旋转90度使竖向图片变横向
  width: 50px; // 调整为 75px (30 * 2.5) 以完美匹配 spin.webp 旋转后的比例
  height: 50px; // 恢复为 30px
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/spin.webp') no-repeat center;
  background-size: contain;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

// 返回按钮
.back-button {
  position: absolute;
  right: 5px;
  bottom: 10px;
  width: 150px;
  height: 60px;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_ret.webp') no-repeat center top;
  background-size: 100% 200%;
  cursor: pointer;
  transition: background-position 0.15s ease;
  z-index: 2;

  &.btn-hover {
    background-position: center bottom;
  }
}
</style>
