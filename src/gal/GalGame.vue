<template>
  <div class="gal-container">
    <!-- 背景层 -->
    <div class="background-layer">
      <transition name="bg-transition">
        <img
          v-if="currentBackground"
          :key="currentBackground"
          :src="currentBackground"
          class="background-image"
          alt="背景"
        />
      </transition>
    </div>

    <!-- CG层 -->
    <transition name="fade">
      <div v-if="currentCg && !hideCg" class="cg-layer">
        <img :src="currentCg" class="cg-image" alt="CG" />
      </div>
    </transition>

    <!-- 角色立绘层 -->
    <div class="character-layer">
      <div
        v-for="pos in ['L1', 'L2', 'L3', 'L4']"
        :key="pos"
        :class="['character-slot', `position-${pos}`]"
      >
        <transition name="fade">
          <img
            v-if="characters[pos]"
            :src="characters[pos]!.sprite"
            :class="[
              'character-sprite',
              { active: characters[pos]!.isActive, inactive: !characters[pos]!.isActive },
            ]"
            :style="getCharacterStyle(pos)"
            alt="角色立绘"
          />
        </transition>
      </div>
    </div>

    <!-- 对话框层 -->
    <div class="dialogue-layer" @click="nextLine">
      <div class="dialogue-box">
        <!-- 角色名 -->
        <div v-if="currentDialogue && currentDialogue.type === 'character'" class="character-name">
          {{ currentDialogue.characterName }}
        </div>

        <!-- 对话内容 -->
        <div class="dialogue-content">
          <span ref="dialogueText">{{ displayedText }}</span>
          <span v-if="isTyping" class="typing-cursor">▼</span>
        </div>
      </div>
    </div>

    <!-- 选择层 -->
    <transition name="fade">
      <div v-if="choices.length > 0" class="choice-layer">
        <div class="choice-container">
          <button
            v-for="(choice, index) in choices"
            :key="index"
            class="choice-button"
            @click="selectChoice(choice)"
          >
            {{ choice }}
          </button>
        </div>
      </div>
    </transition>

    <!-- BGM通知 -->
    <transition name="slide-down">
      <div v-if="showBgmNotification" class="bgm-notification">
        <i class="fas fa-music"></i>
        <span>{{ currentBgmName }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { MessageParser, type DialogueContent } from './parser';
import gsap from 'gsap';

// 状态定义
interface Character {
  name: string;
  sprite: string;
  isActive: boolean;
  animating?: string;
  scale?: number;
}

const currentBackground = ref<string>('');
const currentCg = ref<string>('');
const hideCg = ref(false);
const currentBgmName = ref<string>('');
const showBgmNotification = ref(false);

const characters = ref<Record<string, Character | undefined>>({
  L1: undefined,
  L2: undefined,
  L3: undefined,
  L4: undefined,
});

const currentDialogue = ref<DialogueContent | undefined>();
const displayedText = ref('');
const isTyping = ref(false);
const dialogueText = ref<HTMLElement>();

const choices = ref<string[]>([]);

// 用于追踪当前处理的行数
const allLines = ref<string[]>([]);
const currentLineIndex = ref(0);
const isWaitingForClick = ref(false);

// 待执行的动作
const pendingAction = ref<{ character: string; type: string } | null>(null);

let bgmAudio: HTMLAudioElement | null = null;
let typingInterval: ReturnType<typeof setInterval> | null = null;

// 获取角色样式
const getCharacterStyle = (pos: string) => {
  const char = characters.value[pos];
  if (!char) return {};

  return {
    transform: `scale(${char.scale || 1})`,
  };
};

// 处理选择点击
const selectChoice = (choice: string) => {
  choices.value = [];

  // 在SillyTavern的输入框中输入选择的内容
  if (typeof triggerSlash !== 'undefined') {
    triggerSlash(`/setinput ${choice}`);
  }
};

// 打字机效果
const typeWriter = (text: string, speed = 50) => {
  displayedText.value = '';
  isTyping.value = true;

  let index = 0;

  if (typingInterval) {
    clearInterval(typingInterval);
  }

  typingInterval = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index];
      index++;
    } else {
      isTyping.value = false;
      if (typingInterval) {
        clearInterval(typingInterval);
        typingInterval = null;
      }
      // 打字完成后执行待执行的动作
      executePendingAction();
    }
  }, speed);
};

// 执行待执行的动作
const executePendingAction = async () => {
  if (pendingAction.value) {
    await nextTick();
    performAction(pendingAction.value.character, pendingAction.value.type);
    pendingAction.value = null;
  }
};

// 播放BGM
const playBgm = (bgmName: string) => {
  const url = MessageParser.resolveAssetUrl(bgmName, 'audio');

  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
  }

  bgmAudio = new Audio(url);
  bgmAudio.loop = true;
  bgmAudio.volume = 0.5;

  bgmAudio.play().catch((error) => {
    console.error('播放BGM失败:', error);
  });

  // 显示BGM通知
  currentBgmName.value = bgmName;
  showBgmNotification.value = true;

  setTimeout(() => {
    showBgmNotification.value = false;
  }, 2000);
};

// 设置背景
const setBackground = (bg: string) => {
  const url = MessageParser.resolveAssetUrl(bg, 'image');
  currentBackground.value = url;
};

// 设置CG
const setCg = (cg: string) => {
  const url = MessageParser.resolveAssetUrl(cg, 'image');
  currentCg.value = url;
  hideCg.value = false;
};

// 设置角色
const setCharacter = (
  position: 'L1' | 'L2' | 'L3' | 'L4',
  characterName: string,
  sprite: string | undefined,
  isActive: boolean
) => {
  if (!sprite) {
    characters.value[position] = undefined;
    return;
  }

  const url = MessageParser.resolveAssetUrl(sprite, 'image');

  characters.value[position] = {
    name: characterName,
    sprite: url,
    isActive,
    scale: 1,
  };
};

// 执行角色动作
const performAction = (characterName: string, actionType: string) => {
  // 根据角色名称找到角色所在位置
  const pos = Object.keys(characters.value).find((key) => {
    const char = characters.value[key];
    return char !== undefined && char.name === characterName;
  });

  if (!pos) {
    console.warn(`未找到角色: ${characterName}`);
    return;
  }

  const char = characters.value[pos];
  if (!char) return;

  const element = document.querySelector(`.position-${pos} .character-sprite`) as HTMLElement;
  if (!element) {
    console.warn(`未找到角色元素: .position-${pos} .character-sprite`);
    return;
  }

  switch (actionType) {
    case 'shake':
      gsap.to(element, {
        x: -10,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut',
        onComplete: () => {
          gsap.set(element, { x: 0 });
        },
      });
      break;

    case 'jump_up':
      gsap.to(element, {
        y: -30,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(element, {
            y: 0,
            duration: 0.3,
            ease: 'power2.in',
          });
        },
      });
      break;

    case 'jump_down':
      gsap.to(element, {
        y: 20,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(element, {
            y: 0,
            duration: 0.3,
            ease: 'power2.in',
          });
        },
      });
      break;

    case 'near':
      char.scale = 1.2;
      gsap.to(element, {
        scale: 1.2,
        duration: 0.5,
        ease: 'power2.out',
      });
      break;

    case 'away':
      char.scale = 0.8;
      gsap.to(element, {
        scale: 0.8,
        duration: 0.5,
        ease: 'power2.out',
      });
      break;
  }
};

// 处理单行内容
const processLine = async (line: string) => {
  console.log('处理行:', line);

  // 处理背景
  const bg = MessageParser.parseBg(line);
  if (bg) {
    console.log('设置背景:', bg);
    setBackground(bg);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return true; // 继续处理下一行
  }

  // 处理CG
  const cg = MessageParser.parseCg(line);
  if (cg) {
    console.log('设置CG:', cg);
    setCg(cg);
    return false; // 停止处理，等待用户点击
  }

  // 检查隐藏CG
  if (MessageParser.parseHideCg(line)) {
    console.log('隐藏CG');
    hideCg.value = true;
    return false; // 停止处理，等待用户点击
  }

  // 处理BGM
  const bgm = MessageParser.parseBgm(line);
  if (bgm) {
    console.log('播放BGM:', bgm);
    playBgm(bgm);
    return true; // 继续处理下一行
  }

  // 处理选择
  const parsedChoices = MessageParser.parseChoices(line);
  if (parsedChoices) {
    console.log('显示选择:', parsedChoices);
    choices.value = parsedChoices;
    return false; // 停止处理，等待用户选择
  }

  // 处理对话
  const dialogue = MessageParser.parseDialogue(line);
  if (dialogue) {
    console.log('显示对话:', dialogue);
    currentDialogue.value = dialogue;

    if (dialogue.type === 'character') {
      // 设置所有角色为非激活状态
      Object.keys(characters.value).forEach((pos) => {
        if (characters.value[pos]) {
          characters.value[pos]!.isActive = false;
        }
      });

      // 设置当前说话角色
      if (dialogue.position && dialogue.sprite && dialogue.characterName) {
        console.log(`设置角色 ${dialogue.characterName} 在位置 ${dialogue.position}`);
        setCharacter(dialogue.position, dialogue.characterName, dialogue.sprite, true);
      }

      // 保存动作，等待打字完成后执行
      if (dialogue.action) {
        console.log('保存待执行动作:', dialogue.action);
        pendingAction.value = dialogue.action;
      } else {
        pendingAction.value = null;
      }
    }

    // 使用打字机效果显示对话内容
    typeWriter(dialogue.content);
    return false; // 停止处理，等待用户点击
  }

  return true; // 继续处理下一行
};

// 处理下一行
const nextLine = async () => {
  // 如果正在打字，立即显示全部文本
  if (isTyping.value) {
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
    displayedText.value = currentDialogue.value?.content || '';
    isTyping.value = false;
    // 点击跳过打字时也执行待执行的动作
    await executePendingAction();
    return;
  }

  // 如果有选择项，不响应点击
  if (choices.value.length > 0) {
    return;
  }

  // 继续处理下一行
  currentLineIndex.value++;

  while (currentLineIndex.value < allLines.value.length) {
    const line = allLines.value[currentLineIndex.value];
    const shouldContinue = await processLine(line);

    if (!shouldContinue) {
      // 遇到对话或选择，等待用户交互
      isWaitingForClick.value = true;
      break;
    }

    currentLineIndex.value++;
  }
};

// 处理消息 - 初始化消息并开始处理
const handleMessage = async (message: string) => {
  console.log('处理消息内容:', message);

  const lines = message.split('\n').map((l) => l.trim()).filter((l) => l);
  console.log('分解后的行数:', lines.length);

  // 存储所有行并重置索引
  allLines.value = lines;
  currentLineIndex.value = 0;

  // 开始处理第一行
  if (allLines.value.length > 0) {
    await nextLine();
  }
};

// 监听酒馆消息
onMounted(() => {
  console.log('GAL游戏界面已加载');

  // 获取当前消息
  try {
    if (typeof getCurrentMessageId !== 'undefined' && typeof getChatMessages !== 'undefined') {
      const messageId = getCurrentMessageId();
      console.log('当前消息ID:', messageId);

      const messages = getChatMessages(messageId);
      console.log('获取到的消息:', messages);

      if (messages && messages.length > 0) {
        const lastMessage = messages[0];
        if (lastMessage && lastMessage.message) {
          console.log('开始处理消息:', lastMessage.message);
          handleMessage(lastMessage.message);
        }
      }
    }
  } catch (error) {
    console.error('获取消息失败:', error);
  }
});

onUnmounted(() => {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
  }

  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
});
</script>

<style lang="scss" scoped>
.gal-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: hidden;
  background: #000;
}

// 背景层
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// 背景切换动画
.bg-transition-enter-active,
.bg-transition-leave-active {
  transition: opacity 1s ease;
}

.bg-transition-enter-from {
  opacity: 0;
}

.bg-transition-leave-to {
  opacity: 0;
}

// CG层
.cg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 70%;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cg-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

// 角色层
.character-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  pointer-events: none;
}

.character-slot {
  flex: 1;
  height: 80%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.character-sprite {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: filter 0.3s ease, transform 0.3s ease;

  &.active {
    filter: brightness(1);
  }

  &.inactive {
    filter: brightness(0.6);
  }
}

// 对话框层
.dialogue-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  cursor: pointer;
}

.dialogue-box {
  width: 100%;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  padding: 20px;
  position: relative;
}

.character-name {
  font-size: 1.2em;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.dialogue-content {
  font-size: 1em;
  color: #fff;
  line-height: 1.6;
  min-height: 3em;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 4px;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

// 选择层
.choice-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.choice-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
  width: 90%;
}

.choice-button {
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #333;
  border-radius: 8px;
  font-size: 1.1em;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fff;
    transform: translateX(10px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}

// BGM通知
.bgm-notification {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 15px 25px;
  border-radius: 8px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);

  i {
    font-size: 1.2em;
  }

  span {
    font-size: 1em;
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 下滑动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-50px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}
</style>
