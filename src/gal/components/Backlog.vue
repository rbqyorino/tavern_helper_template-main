<template>
  <div class="backlog-container" @contextmenu="handleContextMenu">
    <!-- 背景 -->
    <div class="backlog-background"></div>

    <!-- 中间对话列表区域 -->
    <div class="dialogue-list-wrapper">
      <div class="dialogue-list" ref="dialogueList" @scroll="handleScroll">
        <div v-for="(dialogue, index) in dialogues" :key="index" class="dialogue-item">
          <!-- 左侧图标区 -->
          <div class="icon-column">
            <div
              class="icon-btn icon-jump"
              :class="{ 'icon-hover': hoveredIcon === `jump-${index}` }"
              @mouseenter="hoveredIcon = `jump-${index}`"
              @mouseleave="hoveredIcon = null"
              @click="handleJumpTo(dialogue)"
            ></div>
            <div
              class="icon-btn icon-voice"
              :class="{ 'icon-hover': hoveredIcon === `voice-${index}` }"
              @mouseenter="hoveredIcon = `voice-${index}`"
              @mouseleave="hoveredIcon = null"
            ></div>
            <div
              class="icon-btn icon-favo"
              :class="{ 'icon-hover': hoveredIcon === `favo-${index}` }"
              @mouseenter="hoveredIcon = `favo-${index}`"
              @mouseleave="hoveredIcon = null"
            ></div>
          </div>

          <!-- 右侧文本区 -->
          <div class="text-column">
            <!-- 说话人 -->
            <div v-if="dialogue.speaker" class="speaker-name">
              {{ dialogue.speaker }}
            </div>
            <!-- 对话内容 -->
            <div class="dialogue-content" :class="{ 'has-speaker': dialogue.speaker }">
              {{ dialogue.content }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧自定义滚动条 -->
    <div class="custom-scrollbar">
      <!-- 向上翻页 -->
      <div
        class="scroll-btn btn-pageup"
        :class="{ 'btn-hover': hoveredIcon === 'pageup' }"
        @mouseenter="hoveredIcon = 'pageup'"
        @mouseleave="hoveredIcon = null"
        @click="scrollPageUp"
      ></div>

      <!-- 向上单行 -->
      <div
        class="scroll-btn btn-up"
        :class="{ 'btn-hover': hoveredIcon === 'up' }"
        @mouseenter="hoveredIcon = 'up'"
        @mouseleave="hoveredIcon = null"
        @click="scrollUp"
      ></div>

      <!-- 滚动轨道 -->
      <div class="scroll-track" :class="{ 'is-active': isDragging }" ref="scrollTrack" @click="handleTrackClick">
        <!-- 滑块 -->
        <div class="scroll-thumb" ref="scrollThumb" :style="{ top: thumbPosition + 'px' }" @mousedown="startDrag"></div>
      </div>

      <!-- 向下单行 -->
      <div
        class="scroll-btn btn-down"
        :class="{ 'btn-hover': hoveredIcon === 'down' }"
        @mouseenter="hoveredIcon = 'down'"
        @mouseleave="hoveredIcon = null"
        @click="scrollDown"
      ></div>

      <!-- 向下翻页 -->
      <div
        class="scroll-btn btn-pagedown"
        :class="{ 'btn-hover': hoveredIcon === 'pagedown' }"
        @mouseenter="hoveredIcon = 'pagedown'"
        @mouseleave="hoveredIcon = null"
        @click="scrollPageDown"
      ></div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { MessageParser } from '../parser';

// 对话数据接口
interface Dialogue {
  messageId: number;
  lineIndex: number;
  speaker: string | null;
  content: string;
  background?: string;
  characters?: Record<string, any>;
}

// Props
const props = defineProps<{
  allMessages: any[];
  currentLineIndex: number; // 当前已播放到的行号
}>();

// 解析所有消息,提取对话,只显示已播放的对话
const dialogues = computed<Dialogue[]>(() => {
  const result: Dialogue[] = [];

  props.allMessages.forEach(msg => {
    const lines = msg.message.split('\n');
    let currentBg = '';
    let currentChars: Record<string, any> = {};
    const characterPositions = new Map<string, string>(); // 角色名 -> 位置映射

    lines.forEach((line: string, lineIndex: number) => {
      // 只处理已播放的行
      if (lineIndex > props.currentLineIndex) {
        return;
      }

      const trimmed = line.trim();
      if (!trimmed) return;

      // 记录背景
      const bg = MessageParser.parseBg(trimmed);
      if (bg) {
        currentBg = MessageParser.resolveAssetUrl(bg, 'image');
        return;
      }

      // 处理角色登场 [show|角色名|立绘|位置]
      const showCmd = MessageParser.parseShow(trimmed);
      if (showCmd) {
        const url = MessageParser.resolveAssetUrl(showCmd.sprite, 'image');
        currentChars[showCmd.position] = {
          name: showCmd.name,
          sprite: url,
          isActive: false,
        };
        characterPositions.set(showCmd.name, showCmd.position);
        return;
      }

      // 处理立绘变更 [alter|角色名|立绘]
      const alterCmd = MessageParser.parseAlter(trimmed);
      if (alterCmd) {
        const position = characterPositions.get(alterCmd.name);
        if (position) {
          const url = MessageParser.resolveAssetUrl(alterCmd.sprite, 'image');
          currentChars[position] = {
            name: alterCmd.name,
            sprite: url,
            isActive: currentChars[position]?.isActive || false,
          };
        }
        return;
      }

      // 处理角色离场 [leave|角色名]
      const leaveName = MessageParser.parseLeave(trimmed);
      if (leaveName) {
        const position = characterPositions.get(leaveName);
        if (position) {
          currentChars[position] = undefined;
          characterPositions.delete(leaveName);
        }
        return;
      }

      // 处理角色移动 [move|角色名|位置]
      const moveCmd = MessageParser.parseMove(trimmed);
      if (moveCmd) {
        const oldPosition = characterPositions.get(moveCmd.name);
        if (oldPosition && currentChars[oldPosition]) {
          const char = currentChars[oldPosition];
          currentChars[moveCmd.position] = char;
          currentChars[oldPosition] = undefined;
          characterPositions.set(moveCmd.name, moveCmd.position);
        }
        return;
      }

      // 处理 BGM [bgm|音乐名]
      const bgm = MessageParser.parseBgm(trimmed);
      if (bgm) {
        return; // 跳过，不记录到 Backlog
      }

      // 处理 CG [cg|图片]
      const cg = MessageParser.parseCg(trimmed);
      if (cg) {
        return; // 跳过，不记录到 Backlog
      }

      // 处理隐藏 CG [hide_cg]
      if (MessageParser.parseHideCg(trimmed)) {
        return; // 跳过，不记录到 Backlog
      }

      // 处理选择分支 [choice|选项1|选项2]
      const choices = MessageParser.parseChoices(trimmed);
      if (choices) {
        return; // 跳过，不记录到 Backlog
      }

      // 处理单独成行的动作命令 [action|角色名|动作]
      const standaloneAction = MessageParser.parseStandaloneAction(trimmed);
      if (standaloneAction) {
        return; // 跳过，不记录到 Backlog
      }

      // 解析对话 - 使用 MessageParser
      const dialogue = MessageParser.parseDialogue(trimmed);
      if (dialogue) {
        // 去掉 [action|...] 命令
        const cleanContent = dialogue.content.replace(/\[action\|[^\]]+\]/g, '').trim();

        // 更新角色激活状态
        if (dialogue.type === 'character' && dialogue.characterName) {
          const position = characterPositions.get(dialogue.characterName);
          if (position) {
            // 设置所有角色为非激活
            Object.keys(currentChars).forEach(pos => {
              if (currentChars[pos]) {
                currentChars[pos].isActive = false;
              }
            });
            // 设置当前说话角色为激活
            if (currentChars[position]) {
              currentChars[position].isActive = true;
            }
          }
        }

        result.push({
          messageId: msg.id,
          lineIndex,
          speaker: dialogue.type === 'character' ? (dialogue.characterName ?? null) : null,
          content: cleanContent,
          background: currentBg,
          characters: { ...currentChars },
        });
      }
    });
  });

  return result;
});

// Emits
const emit = defineEmits<{
  back: [];
  jumpTo: [dialogue: Dialogue];
}>();

// 响应式数据
const hoveredIcon = ref<string | null>(null);
const dialogueList = ref<HTMLElement | null>(null);
const scrollTrack = ref<HTMLElement | null>(null);
const scrollThumb = ref<HTMLElement | null>(null);
const thumbPosition = ref(0);
const isDragging = ref(false);
const dragStartY = ref(0);
const dragStartThumbPos = ref(0);

// 处理滚动事件
const handleScroll = () => {
  updateThumbPosition();
};

// 更新滑块位置
const updateThumbPosition = () => {
  if (!dialogueList.value || !scrollTrack.value) return;

  const { scrollTop, scrollHeight, clientHeight } = dialogueList.value;
  const trackHeight = scrollTrack.value.clientHeight;
  const thumbHeight = 50; // 滑块高度

  const scrollRatio = scrollTop / (scrollHeight - clientHeight);
  thumbPosition.value = scrollRatio * (trackHeight - thumbHeight);
};

// 滚动相关方法
const scrollPageUp = () => {
  if (!dialogueList.value) return;
  dialogueList.value.scrollBy({ top: -360, behavior: 'smooth' });
};

const scrollUp = () => {
  if (!dialogueList.value) return;
  dialogueList.value.scrollBy({ top: -120, behavior: 'smooth' });
};

const scrollDown = () => {
  if (!dialogueList.value) return;
  dialogueList.value.scrollBy({ top: 120, behavior: 'smooth' });
};

const scrollPageDown = () => {
  if (!dialogueList.value) return;
  dialogueList.value.scrollBy({ top: 360, behavior: 'smooth' });
};

// 点击轨道跳转
const handleTrackClick = (event: MouseEvent) => {
  if (!scrollTrack.value || !dialogueList.value) return;
  if ((event.target as HTMLElement).classList.contains('scroll-thumb')) return;

  const trackRect = scrollTrack.value.getBoundingClientRect();
  const clickY = event.clientY - trackRect.top;
  const trackHeight = scrollTrack.value.clientHeight;
  const thumbHeight = 50;

  const scrollRatio = clickY / (trackHeight - thumbHeight);
  const { scrollHeight, clientHeight } = dialogueList.value;
  dialogueList.value.scrollTop = scrollRatio * (scrollHeight - clientHeight);
};

// 拖动滑块
const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  dragStartY.value = event.clientY;
  dragStartThumbPos.value = thumbPosition.value;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  event.preventDefault();
};

const onDrag = (event: MouseEvent) => {
  if (!isDragging.value || !scrollTrack.value || !dialogueList.value) return;

  const deltaY = event.clientY - dragStartY.value;
  const trackHeight = scrollTrack.value.clientHeight;
  const thumbHeight = 50;
  const maxThumbPos = trackHeight - thumbHeight;

  const newThumbPos = Math.max(0, Math.min(maxThumbPos, dragStartThumbPos.value + deltaY));
  thumbPosition.value = newThumbPos;

  const scrollRatio = newThumbPos / maxThumbPos;
  const { scrollHeight, clientHeight } = dialogueList.value;
  dialogueList.value.scrollTop = scrollRatio * (scrollHeight - clientHeight);
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 事件处理
const handleBack = () => {
  emit('back');
};

const handleJumpTo = (dialogue: Dialogue) => {
  emit('jumpTo', dialogue);
};

// 鼠标右键退出
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  emit('back');
};

// 生命周期
onMounted(() => {
  updateThumbPosition();
});

onUnmounted(() => {
  if (isDragging.value) {
    stopDrag();
  }
});
</script>

<style lang="scss" scoped>
.backlog-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Noto Serif SC', serif;
  z-index: 10000;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bg.png') no-repeat center / cover;
}

// 背景
.backlog-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bg.png') no-repeat center / cover;
  z-index: 0;
  pointer-events: none;
}

// 中间对话列表区域
.dialogue-list-wrapper {
  position: absolute;
  top: 10%;
  left: 20%;
  width: 58%;
  height: 75%;
  z-index: 1;
  overflow: hidden;
}

.dialogue-list {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;

  // 隐藏默认滚动条
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
}

// 对话条目
.dialogue-item {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  min-height: 120px;
}

// 左侧图标列
.icon-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  width: 35px;
  height: 50px;
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 100% 200%;
  cursor: pointer;
  transition: background-position 0.15s ease;

  &.icon-hover {
    background-position: center bottom;
  }
}

.icon-jump {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_jump.png');
}

.icon-voice {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_voice.png');
}

.icon-favo {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_favo.png');
}

// 右侧文本列
.text-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.speaker-name {
  font-size: clamp(1.2rem, 2.4vw, 1.6rem);
  font-weight: 800;
  color: #ffffff;
  -webkit-text-stroke: 3px #453118;
  paint-order: stroke fill;
  letter-spacing: 0.2em;
  padding: 8px 12px;
}

.dialogue-content {
  font-size: clamp(1.1rem, 2.2vw, 1.5rem);
  font-weight: 800;
  color: #ffffff;
  -webkit-text-stroke: 2.5px #000000;
  paint-order: stroke fill;
  line-height: 1.8;
  padding: 12px 16px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
  }

  &.has-speaker {
    margin-top: 0;
  }
}

// 右侧自定义滚动条
.custom-scrollbar {
  position: absolute;
  right: 50px;
  top: 10%;
  height: 75%;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.scroll-btn {
  width: 42px;
  height: 44px;
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 100% 200%;
  cursor: pointer;
  transition: background-position 0.15s ease;
  flex-shrink: 0;

  &.btn-hover {
    background-position: center bottom;
  }
}

.btn-pageup {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_pageup.png');
}

.btn-up {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_up.png');
  margin-top: 8px;
}

.btn-down {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_down.png');
  margin-bottom: 8px;
}

.btn-pagedown {
  background-image: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_pagedown.png');
}

// 滚动轨道
.scroll-track {
  width: 20px;
  height: calc(100% - 200px);
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_slider.png') no-repeat center top;
  background-size: 100% 200%;
  position: relative;
  cursor: pointer;
  margin: 8px 0;
  transition: background-position 0.15s ease;

  &:hover {
    background-position: center bottom;
  }

  &.is-active {
    background-position: center bottom;
  }
}

// 滑块
.scroll-thumb {
  position: absolute;
  left: 0;
  width: 20px;
  height: 50px;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/spin.png') no-repeat center;
  background-size: 100% 100%;
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
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/blog/bt_ret.png') no-repeat center top;
  background-size: 100% 200%;
  cursor: pointer;
  transition: background-position 0.15s ease;
  z-index: 2;

  &.btn-hover {
    background-position: center bottom;
  }
}
</style>
