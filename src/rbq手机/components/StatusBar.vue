<template>
  <div class="rbq-status-bar">
    <div class="rbq-status-left">
      <span class="rbq-time">{{ currentTime }}</span>
    </div>
    <div class="rbq-status-right">
      <span class="rbq-signal">📶</span>
      <span class="rbq-battery">{{ batteryPercentage }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('12:00');
const batteryPercentage = ref(100);

let timeInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 更新时间
 */
function updateTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTime.value = `${hours}:${minutes}`;
}

onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped lang="scss">
.rbq-status-bar {
  padding: 8px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  background-color: var(--status-bar-color, #f0f0f0);
  border-bottom: 1px solid #e0e0e0;
}

.rbq-status-left,
.rbq-status-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rbq-time {
  font-weight: 600;
  font-size: 14px;
}

.rbq-signal,
.rbq-battery {
  font-size: 12px;
}
</style>
