<template>
  <div class="gal-container" :class="{ 'no-transition': isFastForwarding }">
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
      <div v-for="pos in ['L1', 'L2', 'L3', 'L4', 'L5']" :key="pos" :class="['character-slot', `position-${pos}`]">
        <transition name="fade">
          <img
            v-if="characters[pos]"
            :src="characters[pos]!.sprite"
            :class="['character-sprite', { active: characters[pos]!.isActive, inactive: !characters[pos]!.isActive }]"
            :style="getCharacterStyle(pos)"
            alt="角色立绘"
          />
        </transition>
      </div>
    </div>

    <!-- 对话框层 -->
    <div v-show="!isUIHidden" class="dialogue-layer" @click="handleDialogueClick">
      <!-- 主对话框 -->
      <div class="dialogue-box" :style="{ '--dialogue-bg-opacity': opacity }">
        <!-- 名字框 -->
        <div v-if="currentDialogue && currentDialogue.type === 'character'" class="character-name-box">
          <span class="character-name">{{ currentDialogue.characterName }}</span>
        </div>

        <!-- 对话内容 -->
        <div class="dialogue-content" :style="{ fontSize: fontSize + 'px' }">
          <span ref="dialogueText">{{ displayedText }}</span>
          <span v-if="isTyping" class="typing-cursor"></span>
        </div>

        <!-- 自动播放指示图标 -->
        <transition name="fade">
          <div v-if="isAutoPlaying" class="auto-indicator">
            <img src="https://gitgud.io/RBQ/amakano3/-/raw/master/menu/auto.png" alt="自动" />
          </div>
        </transition>
      </div>
    </div>

    <!-- 选择层 -->
    <transition name="fade">
      <div v-if="choices.length > 0 && !isUIHidden" class="choice-layer">
        <div class="choice-container">
          <button v-for="(choice, index) in choices" :key="index" class="choice-button" @click="selectChoice(choice)">
            {{ choice }}
          </button>
        </div>
      </div>
    </transition>

    <!-- BGM通知 -->
    <transition name="slide-down">
      <div v-if="showBgmNotification && !isUIHidden" class="bgm-notification">
        <i class="fas fa-music"></i>
        <span>{{ currentBgmName }}</span>
      </div>
    </transition>

    <!-- 底部菜单 -->
    <BottomMenu
      v-show="!isUIHidden"
      :is-auto-playing="isAutoPlaying"
      @toggle-u-i="toggleUIHidden"
      @toggle-auto="toggleAutoPlay"
      @toggle-log="openBacklog"
      @toggle-music="openMusicSettings"
      @toggle-config="openConfigSettings"
    />

    <!-- Backlog 剧情回想 -->
    <transition name="fade">
      <Backlog
        v-if="showBacklog"
        :all-messages="allMessagesForBacklog"
        :current-line-index="currentLineIndex"
        @back="closeBacklog"
        @jump-to="jumpToDialogue"
      />
    </transition>

    <!-- 音乐设置 -->
    <transition name="fade">
      <MusicSettings
        v-if="showMusicSettings"
        :bgm-name="currentBgmName"
        :volume="bgmVolume"
        :current-time="bgmCurrentTime"
        :duration="bgmDuration"
        :is-playing="bgmIsPlaying"
        @back="closeMusicSettings"
        @volume-change="handleVolumeChange"
        @seek="handleSeek"
        @toggle-play-pause="handleTogglePlayPause"
      />
    </transition>

    <!-- 配置设置 -->
    <transition name="fade">
      <ConfigSettings v-if="showConfigSettings" @back="closeConfigSettings" />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import { MessageParser, type DialogueContent } from './parser';
import gsap from 'gsap';
import BottomMenu from './components/BottomMenu.vue';
import Backlog from './components/Backlog.vue';
import MusicSettings from './components/MusicSettings.vue';
import ConfigSettings from './components/ConfigSettings.vue';
import { useConfigStore } from './stores/config';
import { storeToRefs } from 'pinia';

// 使用配置 store
const configStore = useConfigStore();
const { breathingEffect, keyboardShortcut, fontSize, textSpeed, opacity } = storeToRefs(configStore);

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
  L5: undefined,
});

// 角色名到位置的映射
const characterPositions = ref<Map<string, string>>(new Map());

const currentDialogue = ref<DialogueContent | undefined>();
const displayedText = ref('');
const isTyping = ref(false);
const dialogueText = ref<HTMLElement>();

const choices = ref<string[]>([]);

// UI 隐藏状态
const isUIHidden = ref(false);

// 用于追踪当前处理的行数
const allLines = ref<string[]>([]);
const currentLineIndex = ref(0);
const isWaitingForClick = ref(false);

// 待执行的动作
const pendingAction = ref<{ character: string; type: string } | null>(null);

// 自动播放状态
const isAutoPlaying = ref(false);
let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

let bgmAudio: HTMLAudioElement | null = null;
let typingInterval: ReturnType<typeof setInterval> | null = null;

// 呼吸特效动画实例
const breathingAnimations = new Map<string, gsap.core.Tween>(); // 存储每个角色的呼吸动画

// 全局 BGM 管理 - 确保只有最新的实例播放音乐
const GLOBAL_BGM_EVENT = 'gal-game-bgm-play';
const GLOBAL_BGM_STATE_KEY = 'gal_global_bgm_state'; // 全局变量的 key
const GLOBAL_BGM_VOLUME_KEY = 'gal_global_bgm_volume'; // 全局音量设置的 key
const instanceId = ref<string>(''); // 当前实例的唯一标识

// 全局 BGM 状态数据结构
interface GlobalBgmState {
  playingInstanceId: string; // 当前正在播放的实例 ID
  messageId: number; // 该实例所属的消息楼层 ID
  bgmName: string; // 当前播放的 BGM 名称
  timestamp: number; // 最后更新时间戳
}

// 获取父窗口（用于跨 iframe 通信）
const getParentWindow = (): Window => {
  try {
    // 尝试访问 parent.window，如果失败则使用当前 window
    return parent !== window ? parent : window;
  } catch (e) {
    console.warn('无法访问父窗口，使用当前 window', e);
    return window;
  }
};

// Backlog 状态
const showBacklog = ref(false);

// MusicSettings 状态
const showMusicSettings = ref(false);
const bgmVolume = ref(0.5);
const bgmCurrentTime = ref(0);
const bgmDuration = ref(0);
const bgmIsPlaying = ref(false);

// ConfigSettings 状态
const showConfigSettings = ref(false);

// 当前消息ID
const currentMessageId = ref<number>(-1);

// Backlog 对话数据接口
interface BacklogDialogue {
  messageId: number;
  lineIndex: number;
  speaker: string | null;
  content: string;
  background?: string;
  characters?: Record<string, Character | undefined>;
}

// 历史对话数据
const backlogDialogues = ref<BacklogDialogue[]>([]);

// 快进模式状态（用于禁用过渡动画）
const isFastForwarding = ref(false);

// 初始化当前消息ID
const initCurrentMessageId = () => {
  try {
    if (typeof getCurrentMessageId !== 'undefined') {
      currentMessageId.value = getCurrentMessageId();
      console.log('当前消息ID:', currentMessageId.value);
    }
  } catch (error) {
    console.error('获取当前消息ID失败:', error);
  }
};

// 获取当前消息用于 Backlog (只显示当前消息,不是所有消息)
const allMessagesForBacklog = computed(() => {
  try {
    if (typeof getChatMessages !== 'undefined' && currentMessageId.value >= 0) {
      const messages = getChatMessages(currentMessageId.value);
      console.log('Backlog 获取到的消息:', messages);
      // 添加 id 字段以供 Backlog 使用
      return messages ? messages.map((msg: any) => ({ ...msg, id: currentMessageId.value })) : [];
    }
  } catch (error) {
    console.error('获取当前消息失败:', error);
  }
  return [];
});

// 获取角色样式
const getCharacterStyle = (pos: string) => {
  const char = characters.value[pos];
  if (!char) return {};

  return {
    transform: `scale(${char.scale || 1})`,
  };
};

// 启动角色呼吸动画
const startBreathing = (pos: string) => {
  if (!breathingEffect.value) return;

  // 如果已经有动画在运行，先停止
  stopBreathing(pos);

  const element = document.querySelector(`.position-${pos} .character-sprite`) as HTMLElement;
  if (!element) return;

  // 创建呼吸动画：轻微的上下浮动
  const animation = gsap.to(element, {
    y: -8, // 向上浮动 8 像素
    duration: 2.5, // 一次呼吸周期 2.5 秒
    ease: 'sine.inOut', // 平滑的正弦曲线
    repeat: -1, // 无限循环
    yoyo: true, // 来回往复
  });

  breathingAnimations.set(pos, animation);
};

// 停止角色呼吸动画
const stopBreathing = (pos: string) => {
  const animation = breathingAnimations.get(pos);
  if (animation) {
    animation.kill(); // 停止动画
    breathingAnimations.delete(pos);

    // 重置位置
    const element = document.querySelector(`.position-${pos} .character-sprite`) as HTMLElement;
    if (element) {
      gsap.set(element, { y: 0 });
    }
  }
};

// 监听呼吸特效配置变化
watch(breathingEffect, enabled => {
  if (enabled) {
    // 开启：为所有现有角色启动呼吸动画
    Object.keys(characters.value).forEach(pos => {
      if (characters.value[pos]) {
        startBreathing(pos);
      }
    });
  } else {
    // 关闭：停止所有呼吸动画
    Object.keys(characters.value).forEach(pos => {
      stopBreathing(pos);
    });
  }
});

// 处理选择点击
const selectChoice = (choice: string) => {
  choices.value = [];

  // 在SillyTavern的输入框中输入选择的内容
  if (typeof triggerSlash !== 'undefined') {
    triggerSlash(`/setinput ${choice}`);
  }
};

// 打字机效果
const typeWriter = (text: string) => {
  displayedText.value = '';
  isTyping.value = true;

  let index = 0;

  if (typingInterval) {
    clearInterval(typingInterval);
  }

  // 检查文本速度：如果为最大值，则直接显示全部文本（秒出效果）
  if (textSpeed.value === 1) {
    displayedText.value = text;
    isTyping.value = false;
    // 打字完成后执行待执行的动作
    executePendingAction();

    // 如果开启了自动播放，安排下一次自动点击
    if (isAutoPlaying.value) {
      scheduleAutoPlay();
    }
    return;
  }

  // 使用配置中的文本速度（非最大速度时的逐字显示）
  const speed = configStore.getTypingSpeed();

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

      // 如果开启了自动播放，安排下一次自动点击
      if (isAutoPlaying.value) {
        scheduleAutoPlay();
      }
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

// BGM 事件处理函数（提取到外部，确保引用一致）
const updateBgmDuration = () => {
  if (bgmAudio) {
    bgmDuration.value = bgmAudio.duration;
  }
};

const updateBgmTime = () => {
  if (bgmAudio) {
    bgmCurrentTime.value = bgmAudio.currentTime;
    bgmIsPlaying.value = !bgmAudio.paused;
  }
};

// 读取当前对话的 BGM 状态
const getGlobalBgmState = (): GlobalBgmState | null => {
  try {
    const allChatVars = getVariables({ type: 'chat' });
    const state = _.get(allChatVars, GLOBAL_BGM_STATE_KEY, null);
    return state as GlobalBgmState | null;
  } catch (e) {
    console.warn('读取 BGM 状态失败:', e);
    return null;
  }
};

// 更新当前对话的 BGM 状态
const updateGlobalBgmState = async (state: GlobalBgmState) => {
  try {
    await insertOrAssignVariables({ [GLOBAL_BGM_STATE_KEY]: state }, { type: 'chat' });
    console.log('BGM 状态已更新:', state);
  } catch (e) {
    console.error('更新 BGM 状态失败:', e);
  }
};

// 读取全局音量设置
const getGlobalBgmVolume = (): number => {
  try {
    const allGlobalVars = getVariables({ type: 'global' });
    const volume = _.get(allGlobalVars, GLOBAL_BGM_VOLUME_KEY, 0.5); // 默认音量 0.5
    console.log('读取全局音量:', volume);
    return volume as number;
  } catch (e) {
    console.warn('读取全局音量失败:', e);
    return 0.5; // 默认音量
  }
};

// 保存全局音量设置
const saveGlobalBgmVolume = async (volume: number) => {
  try {
    await insertOrAssignVariables({ [GLOBAL_BGM_VOLUME_KEY]: volume }, { type: 'global' });
    console.log('全局音量已保存:', volume);
  } catch (e) {
    console.error('保存全局音量失败:', e);
  }
};

// 停止当前实例的 BGM
const stopBgm = () => {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.removeEventListener('loadedmetadata', updateBgmDuration);
    bgmAudio.removeEventListener('timeupdate', updateBgmTime);
    bgmAudio = null;
  }
  bgmIsPlaying.value = false;
};

// 监听其他实例的 BGM 播放事件（通过父窗口传递）
const handleGlobalBgmPlay = (event: CustomEvent<GlobalBgmState>) => {
  const state = event.detail;
  // 如果不是当前实例播放的音乐，则停止当前实例的音乐
  if (state.playingInstanceId !== instanceId.value) {
    console.log(`其他实例 (${state.playingInstanceId}) 开始播放 BGM，停止当前实例的播放`);
    stopBgm();
  }
};

// 播放BGM
const playBgm = (bgmName: string) => {
  // 检查是否应该播放 BGM（基于消息 ID 和时间戳判断）
  if (!checkShouldPlayBgm()) {
    console.log('当前实例不应播放 BGM，跳过播放');
    return;
  }

  const url = MessageParser.resolveAssetUrl(bgmName, 'bgm');

  // 停止当前实例的旧音乐
  stopBgm();

  // 创建新的全局状态
  const newState: GlobalBgmState = {
    playingInstanceId: instanceId.value,
    messageId: currentMessageId.value,
    bgmName: bgmName,
    timestamp: Date.now(),
  };

  // 方案 B: 更新全局变量（持久化存储）
  updateGlobalBgmState(newState);

  // 方案 A: 通过父窗口发送事件通知其他实例（实时同步）
  const parentWin = getParentWindow();
  const event = new CustomEvent(GLOBAL_BGM_EVENT, { detail: newState });
  parentWin.dispatchEvent(event);

  console.log('当前实例开始播放 BGM:', bgmName, '实例ID:', instanceId.value);

  bgmAudio = new Audio(url);
  bgmAudio.loop = true;
  bgmAudio.volume = bgmVolume.value;

  bgmAudio.addEventListener('loadedmetadata', updateBgmDuration);
  bgmAudio.addEventListener('timeupdate', updateBgmTime);

  bgmAudio.play().catch(error => {
    console.error('播放BGM失败:', error);
  });

  bgmIsPlaying.value = true;

  // 显示BGM通知
  currentBgmName.value = bgmName;
  showBgmNotification.value = true;

  // 动画展示 0.5s + 停留 2s = 2.5s
  setTimeout(() => {
    showBgmNotification.value = false;
  }, 2500);
};

// 设置背景
const setBackground = (bg: string) => {
  const url = MessageParser.resolveAssetUrl(bg, 'bg');
  currentBackground.value = url;
};

// 设置CG
const setCg = (cg: string) => {
  const url = MessageParser.resolveAssetUrl(cg, 'cg');
  currentCg.value = url;
  hideCg.value = false;
};

// 设置角色
const setCharacter = (
  position: 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
  characterName: string,
  sprite: string | undefined,
  isActive: boolean,
  silent = false,
) => {
  if (!sprite) {
    // 角色移除时，停止呼吸动画
    stopBreathing(position);
    characters.value[position] = undefined;
    return;
  }

  const url = MessageParser.resolveAssetUrl(sprite, 'sprite');

  characters.value[position] = {
    name: characterName,
    sprite: url,
    isActive,
    scale: 1,
  };

  // 静默模式下不启动呼吸动画
  if (!silent) {
    // 角色显示后，等待 DOM 更新再启动呼吸动画
    nextTick(() => {
      startBreathing(position);
    });
  }
};

// 处理角色登场 [show|角色名|立绘|位置]
const handleShow = (name: string, sprite: string, position: string, silent = false) => {
  if (!silent) {
    console.log(`角色登场: ${name} 在位置 ${position}`);
  }

  // 设置角色立绘（非激活状态）
  setCharacter(position, name, sprite, false, silent);

  // 记录角色名到位置的映射
  characterPositions.value.set(name, position);
};

// 处理立绘变更 [alter|角色名|立绘]
const handleAlter = async (name: string, sprite: string, silent = false) => {
  const position = characterPositions.value.get(name);
  if (!position) {
    console.warn(`未找到角色: ${name}，无法更改立绘`);
    return;
  }

  if (!silent) {
    console.log(`更改立绘: ${name} -> ${sprite}`);
  }

  const character = characters.value[position];
  if (!character) return;

  // 保存当前激活状态和缩放
  const isActive = character.isActive;
  const scale = character.scale;

  // 先淡出（移除角色触发 fade-leave）
  stopBreathing(position);
  characters.value[position] = undefined;

  // 等待淡出动画完成（fade transition 持续时间）
  if (!silent) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 再淡入（添加新立绘触发 fade-enter）
  const url = MessageParser.resolveAssetUrl(sprite, 'sprite');
  characters.value[position] = {
    name,
    sprite: url,
    isActive,
    scale,
  };

  // 启动呼吸动画
  if (!silent) {
    nextTick(() => {
      startBreathing(position);
    });
  }
};

// 处理角色离场 [leave|角色名]
const handleLeave = (name: string, silent = false) => {
  const position = characterPositions.value.get(name);
  if (!position) {
    console.warn(`未找到角色: ${name}，无法离场`);
    return;
  }

  if (!silent) {
    console.log(`角色离场: ${name}`);
  }

  // 停止呼吸动画
  stopBreathing(position);

  // 移除角色立绘
  characters.value[position] = undefined;

  // 删除映射
  characterPositions.value.delete(name);
};

// 处理角色移动 [move|角色名|新位置] - 使用淡入淡出效果
const handleMove = async (name: string, newPosition: string, silent = false) => {
  const oldPosition = characterPositions.value.get(name);
  if (!oldPosition) {
    console.warn(`未找到角色: ${name}，无法移动`);
    return;
  }

  const character = characters.value[oldPosition];
  if (!character) return;

  if (!silent) {
    console.log(`角色移动: ${name} 从 ${oldPosition} 到 ${newPosition}`);
  }

  // 1. 停止旧位置的呼吸动画
  stopBreathing(oldPosition);

  // 2. 淡出（旧位置）
  characters.value[oldPosition] = undefined;

  // 3. 等待淡出动画完成（Vue transition fade 时长约 300ms）
  if (!silent) {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 4. 淡入（新位置）
  characters.value[newPosition] = {
    name: character.name,
    sprite: character.sprite,
    isActive: character.isActive,
    scale: character.scale || 1,
  };

  // 5. 更新映射
  characterPositions.value.set(name, newPosition);

  // 6. 重新启动呼吸动画
  if (!silent) {
    nextTick(() => {
      startBreathing(newPosition);
    });
  }
};

// 执行角色动作
const performAction = (characterName: string, actionType: string) => {
  // 根据角色名称找到角色所在位置
  const pos = Object.keys(characters.value).find(key => {
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
      // 双方向抖动：从右到左再回来
      gsap.fromTo(
        element,
        { x: 30 },
        {
          x: -30,
          duration: 0.2,
          repeat: 4,
          yoyo: true,
          ease: 'power1.inOut',
          onComplete: () => {
            gsap.set(element, { x: 0 });
          },
        },
      );
      break;

    case 'jump_up':
    
      gsap.to(element, {
        y: -90,
        duration: 0.4,
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
        y: 80, 
        duration: 0.4,
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
      char.scale = 1.3;
      gsap.to(element, {
        scale: 1.3,
        duration: 0.5,
        ease: 'power2.out',
      });
      break;

    case 'away':
      char.scale = 0.85;
      gsap.to(element, {
        scale: 0.85,
        duration: 0.5,
        ease: 'power2.out',
      });
      break;
  }
};

// 处理单行内容
// @param line 要处理的行内容
// @param silent 静默模式：true=快速执行不显示对话，false=正常显示
const processLine = async (line: string, silent = false) => {
  if (!silent) {
    console.log('处理行:', line);
  }

  // 处理背景
  const bg = MessageParser.parseBg(line);
  if (bg) {
    if (!silent) console.log('设置背景:', bg);
    setBackground(bg);
    // 静默模式跳过延迟，正常模式等待500ms让背景过渡完成
    if (!silent) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return true; // 继续处理下一行
  }

  // 处理CG
  const cg = MessageParser.parseCg(line);
  if (cg) {
    if (!silent) console.log('设置CG:', cg);
    setCg(cg);
    // 静默模式继续，正常模式暂停
    return silent ? true : false;
  }

  // 检查隐藏CG
  if (MessageParser.parseHideCg(line)) {
    if (!silent) console.log('隐藏CG');
    hideCg.value = true;
    // 静默模式继续，正常模式暂停
    return silent ? true : false;
  }

  // 处理BGM
  const bgm = MessageParser.parseBgm(line);
  if (bgm) {
    if (!silent) console.log('播放BGM:', bgm);
    playBgm(bgm);
    return true; // 继续处理下一行
  }

  // 处理角色登场 [show|角色名|立绘|位置]
  const showCmd = MessageParser.parseShow(line);
  if (showCmd) {
    handleShow(showCmd.name, showCmd.sprite, showCmd.position, silent);
    // 自动执行，立刻继续处理下一行
    return true;
  }

  // 处理立绘变更 [alter|角色名|立绘]
  const alterCmd = MessageParser.parseAlter(line);
  if (alterCmd) {
    await handleAlter(alterCmd.name, alterCmd.sprite, silent);
    // 静默模式继续，正常模式暂停
    return silent ? true : false;
  }

  // 处理角色离场 [leave|角色名]
  const leaveName = MessageParser.parseLeave(line);
  if (leaveName) {
    handleLeave(leaveName, silent);
    // 静默模式继续，正常模式暂停
    return silent ? true : false;
  }

  // 处理角色移动 [move|角色名|位置]
  const moveCmd = MessageParser.parseMove(line);
  if (moveCmd) {
    await handleMove(moveCmd.name, moveCmd.position, silent);
    // 静默模式继续，正常模式暂停
    return silent ? true : false;
  }

  // 处理单独成行的动作指令 [action|角色名|动作类型] - 模式2
  const standaloneAction = MessageParser.parseStandaloneAction(line);
  if (standaloneAction) {
    if (!silent) {
      console.log('执行单独动作:', standaloneAction);
      performAction(standaloneAction.character, standaloneAction.type);
    }
    // 静默模式继续，正常模式继续处理下一行（动作指令不暂停）
    return true;
  }

  // 处理选择
  const parsedChoices = MessageParser.parseChoices(line);
  if (parsedChoices) {
    if (!silent) console.log('显示选择:', parsedChoices);
    choices.value = parsedChoices;
    // 静默模式继续，正常模式暂停
    return silent ? true : false;
  }

  // 处理对话 - 新格式: 角色名|对话内容[action|角色名|动作]
  const dialogue = MessageParser.parseDialogue(line);
  if (dialogue) {
    if (!silent) console.log('显示对话:', dialogue);
    currentDialogue.value = dialogue;

    if (dialogue.type === 'character' && dialogue.characterName) {
      // 从映射中查找角色位置
      const position = characterPositions.value.get(dialogue.characterName);

      if (position) {
        // 设置所有角色为非激活状态
        Object.keys(characters.value).forEach(pos => {
          if (characters.value[pos]) {
            characters.value[pos]!.isActive = false;
          }
        });

        // 设置当前说话角色为激活状态（高亮）
        const character = characters.value[position];
        if (character) {
          character.isActive = true;
        }
      } else {
        console.warn(`角色 ${dialogue.characterName} 未登场，无法高亮`);
      }

      // 静默模式下不保存和执行动作
      if (!silent) {
        if (dialogue.action) {
          console.log('保存待执行动作:', dialogue.action);
          pendingAction.value = dialogue.action;
        } else {
          pendingAction.value = null;
        }
      }
    }

    if (silent) {
      // 静默模式：直接显示完整文本，不播放打字机，不保存动作
      displayedText.value = dialogue.content;
      return true; // 继续下一行
    } else {
      // 正常模式：使用打字机效果显示对话内容
      typeWriter(dialogue.content);
      return false; // 停止处理，等待用户点击
    }
  }

  return true; // 继续处理下一行
};

// 处理对话框点击
const handleDialogueClick = () => {
  // 如果正在自动播放，取消自动播放
  if (isAutoPlaying.value) {
    stopAutoPlay();

    // 如果正在打字，不中断打字机，只停止自动播放
    if (isTyping.value) {
      return;
    }
  }

  // 正常的点击逻辑
  nextLine();
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

      // 如果开启了自动播放，启动自动播放计时器
      if (isAutoPlaying.value) {
        scheduleAutoPlay();
      }

      break;
    }

    currentLineIndex.value++;
  }
};

// 启动自动播放
const startAutoPlay = () => {
  isAutoPlaying.value = true;

  // 如果当前正在等待点击，立即启动自动播放
  if (isWaitingForClick.value && !isTyping.value) {
    scheduleAutoPlay();
  }
};

// 停止自动播放
const stopAutoPlay = () => {
  isAutoPlaying.value = false;

  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }
};

// 安排自动播放的下一次触发
const scheduleAutoPlay = () => {
  // 清除之前的计时器
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }

  // 如果有选择项，停止自动播放
  if (choices.value.length > 0) {
    stopAutoPlay();
    return;
  }

  // 如果正在打字，等待打字完成后再安排
  if (isTyping.value) {
    return; // 打字机完成时会再次调用 scheduleAutoPlay
  }

  // 使用配置中的自动播放延迟
  const delay = configStore.getAutoPlayDelay();
  autoPlayTimer = setTimeout(() => {
    if (isAutoPlaying.value) {
      nextLine();
    }
  }, delay);
};

// 切换自动播放状态
const toggleAutoPlay = () => {
  if (isAutoPlaying.value) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
};

// 重置游戏状态（用于回溯功能）
const resetGameState = () => {
  console.log('重置游戏状态');

  // 重置对话
  currentDialogue.value = undefined;
  displayedText.value = '';
  isTyping.value = false;

  // 重置界面元素
  choices.value = [];
  isWaitingForClick.value = false;
  pendingAction.value = null;

  // 重置场景
  currentBackground.value = '';
  currentCg.value = '';
  hideCg.value = false;

  // 重置角色并停止呼吸动画
  Object.keys(characters.value).forEach(pos => {
    stopBreathing(pos);
  });
  characters.value = {
    L1: undefined,
    L2: undefined,
    L3: undefined,
    L4: undefined,
    L5: undefined,
  };

  // 清空角色位置映射
  characterPositions.value.clear();

  // 停止并重置BGM
  stopBgm();
  currentBgmName.value = '';
  showBgmNotification.value = false;

  // 清除定时器
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
  if (autoPlayTimer) {
    clearTimeout(autoPlayTimer);
    autoPlayTimer = null;
  }

  // 停止自动播放
  isAutoPlaying.value = false;
};

// 切换UI隐藏状态
const toggleUIHidden = () => {
  isUIHidden.value = true;
  setupRestoreListeners();
};

// 打开 Backlog
const openBacklog = () => {
  console.log('打开 Backlog');
  console.log('当前消息ID:', currentMessageId.value);
  console.log('当前行索引:', currentLineIndex.value);
  console.log('可用消息:', allMessagesForBacklog.value);
  showBacklog.value = true;
};

// 关闭 Backlog
const closeBacklog = () => {
  showBacklog.value = false;
};

// 处理滚轮事件
const handleWheel = (event: WheelEvent) => {
  // 向上滚动：打开 backlog
  if (!showBacklog.value && !isUIHidden.value && choices.value.length === 0 && event.deltaY < -50) {
    event.preventDefault();
    openBacklog();
    return;
  }

  // 向下滚动：推进对话（需要启用快捷键）
  if (keyboardShortcut.value && !showBacklog.value && !isUIHidden.value && event.deltaY > 50) {
    event.preventDefault();
    handleDialogueClick();
  }
};

// 处理键盘事件（快捷键推进对话）
const handleKeydown = (event: KeyboardEvent) => {
  // 只有启用快捷键时才响应
  if (!keyboardShortcut.value) return;

  // 如果显示了 backlog、UI 隐藏或有选择项，不响应快捷键
  if (showBacklog.value || isUIHidden.value || showMusicSettings.value || showConfigSettings.value) return;

  // 空格键或方向键↓推进对话
  if (event.code === 'Space' || event.code === 'ArrowDown') {
    event.preventDefault();
    handleDialogueClick();
  }
};

// 打开 MusicSettings
const openMusicSettings = () => {
  console.log('打开音乐设置');
  showMusicSettings.value = true;
};

// 关闭 MusicSettings
const closeMusicSettings = () => {
  showMusicSettings.value = false;
};

// 打开 ConfigSettings
const openConfigSettings = () => {
  console.log('打开配置设置');
  showConfigSettings.value = true;
};

// 关闭 ConfigSettings
const closeConfigSettings = () => {
  showConfigSettings.value = false;
};

// 处理音量变化
const handleVolumeChange = (volume: number) => {
  bgmVolume.value = volume;
  if (bgmAudio) {
    bgmAudio.volume = volume;
  }

  // 保存音量到全局变量，以便后续实例使用
  saveGlobalBgmVolume(volume);
};

// 处理进度跳转
const handleSeek = (time: number) => {
  if (bgmAudio) {
    bgmAudio.currentTime = time;
    bgmCurrentTime.value = time;
  }
};

// 切换播放/暂停
const handleTogglePlayPause = () => {
  if (!bgmAudio) return;

  if (bgmAudio.paused) {
    bgmAudio.play().catch(error => {
      console.error('播放BGM失败:', error);
    });
    bgmIsPlaying.value = true;
  } else {
    bgmAudio.pause();
    bgmIsPlaying.value = false;
  }
};

// 回溯到指定对话
const jumpToDialogue = async (dialogue: BacklogDialogue) => {
  console.log('跳转到对话:', dialogue);

  // 1. 关闭 Backlog
  showBacklog.value = false;

  // 2. 启用快进模式，禁用所有过渡动画
  isFastForwarding.value = true;

  // 3. 完全重置游戏状态（清空背景、BGM、角色、对话等）
  resetGameState();

  // 4. 重新加载消息并快速播放到目标行
  try {
    if (typeof getChatMessages !== 'undefined' && currentMessageId.value >= 0) {
      const messages = getChatMessages(currentMessageId.value);

      if (messages && messages[0]) {
        // 分解消息为行
        const lines = messages[0].message
          .split('\n')
          .map(l => l.trim())
          .filter(l => l);

        console.log('总行数:', lines.length, '目标行:', dialogue.lineIndex);

        // 存储所有行
        allLines.value = lines;

        // 5. 快速播放到目标行之前的所有行（设置背景、BGM、角色等）
        if (dialogue.lineIndex > 0) {
          console.log('开始快速播放从第 0 行到第', dialogue.lineIndex - 1, '行');

          for (let i = 0; i < dialogue.lineIndex; i++) {
            await processLine(lines[i], true); // silent=true 快速执行，无打字机、无动作、无过渡动画
          }

          console.log('快速播放完成，场景已就位');
        }

        // 6. 等待一帧，确保所有资源（背景、角色等）都已渲染
        await nextTick();

        // 7. 关闭快进模式，恢复所有过渡动画
        isFastForwarding.value = false;

        // 8. 再次等待 DOM 更新，确保 no-transition 类已移除
        await nextTick();

        // 9. 设置索引为目标行的前一行
        // 这样 nextLine() 会自增索引到目标行，然后正常播放
        console.log('准备正常播放目标行:', dialogue.lineIndex);
        currentLineIndex.value = dialogue.lineIndex - 1;

        // 10. 调用 nextLine()，它会：
        //     - 自增 currentLineIndex 到 dialogue.lineIndex
        //     - 正常播放目标行（有打字机效果、有动作、有动画）
        await nextLine();

        console.log('跳转完成');
      }
    }
  } catch (error) {
    console.error('跳转失败:', error);
    // 确保出错时也恢复状态
    isFastForwarding.value = false;
  }
};

// 解析所有历史消息并提取对话
const parseHistoryDialogues = () => {
  const dialogues: BacklogDialogue[] = [];

  try {
    if (typeof getChatMessages !== 'undefined') {
      const messages = getChatMessages();

      if (messages && messages.length > 0) {
        messages.forEach((msg, messageId) => {
          if (!msg || !msg.message) return;

          const lines = msg.message
            .split('\n')
            .map(l => l.trim())
            .filter(l => l);
          let currentBg = '';
          let currentChars: Record<string, Character | undefined> = {
            L1: undefined,
            L2: undefined,
            L3: undefined,
            L4: undefined,
            L5: undefined,
          };

          lines.forEach((line, lineIndex) => {
            // 跟踪背景变化
            const bg = MessageParser.parseBg(line);
            if (bg) {
              currentBg = MessageParser.resolveAssetUrl(bg, 'bg');
              return;
            }

            // 解析对话
            const dialogue = MessageParser.parseDialogue(line);
            if (dialogue) {
              // 更新立绘状态
              if (dialogue.type === 'character' && dialogue.position && dialogue.sprite) {
                currentChars[dialogue.position] = {
                  name: dialogue.characterName || '',
                  sprite: MessageParser.resolveAssetUrl(dialogue.sprite, 'sprite'),
                  isActive: true,
                  scale: 1,
                };
              }

              // 移除 [action|...] 标记
              const cleanContent = dialogue.content.replace(/\[action\|[^\]]+\]/g, '').trim();

              dialogues.push({
                messageId,
                lineIndex,
                speaker: dialogue.type === 'character' ? dialogue.characterName : null,
                content: cleanContent,
                background: currentBg,
                characters: { ...currentChars },
              });
            }
          });
        });
      }
    }
  } catch (error) {
    console.error('解析历史对话失败:', error);
  }

  backlogDialogues.value = dialogues;
};

// 设置恢复UI的监听器
const setupRestoreListeners = () => {
  const restoreUI = (e: Event) => {
    e.stopPropagation();
    isUIHidden.value = false;
  };

  window.addEventListener('click', restoreUI, { once: true, capture: true });
  window.addEventListener('keydown', restoreUI, { once: true, capture: true });
};

// 处理消息 - 初始化消息并开始处理
const handleMessage = async (message: string) => {
  console.log('处理消息内容:', message);

  const lines = message
    .split('\n')
    .map(l => l.trim())
    .filter(l => l);
  console.log('分解后的行数:', lines.length);

  // 存储所有行并重置索引
  allLines.value = lines;
  currentLineIndex.value = 0;

  // 开始处理第一行
  if (allLines.value.length > 0) {
    await nextLine();
  }
};

// 检查是否应该播放当前实例的 BGM
const checkShouldPlayBgm = (): boolean => {
  try {
    // 获取实时的最新楼层 ID
    const latestMessageId = getLastMessageId();
    console.log(
      `[BGM 播放检查] 当前实例消息 ID: ${currentMessageId.value}, 最新楼层 ID: ${latestMessageId}`
    );

    // 只允许最新楼层播放音乐
    if (currentMessageId.value !== latestMessageId) {
      console.log(
        `[BGM 播放检查] 当前实例 (${currentMessageId.value}) 不是最新楼层 (${latestMessageId})，不播放`
      );
      return false;
    }

    const globalState = getGlobalBgmState();

    // 如果没有全局状态，说明是第一次播放，允许播放
    if (!globalState) {
      console.log('[BGM 播放检查] 没有全局 BGM 状态，允许播放');
      return true;
    }

    console.log(
      `[BGM 播放检查] 全局状态消息 ID: ${globalState.messageId}, 时间戳: ${globalState.timestamp}`
    );

    // 如果当前实例的消息 ID 更大（更新），允许播放
    if (currentMessageId.value > globalState.messageId) {
      console.log(
        `[BGM 播放检查] 当前消息 ID (${currentMessageId.value}) > 全局状态消息 ID (${globalState.messageId})，允许播放`
      );
      return true;
    }

    // 如果消息 ID 相同，检查时间戳
    if (currentMessageId.value === globalState.messageId) {
      // 允许稍微晚一点加载的实例覆盖（比如页面刷新后的情况）
      const timeDiff = Date.now() - globalState.timestamp;
      if (timeDiff > 1000) {
        // 超过 1 秒，认为是新加载的
        console.log('[BGM 播放检查] 消息 ID 相同但时间差超过 1 秒，允许播放');
        return true;
      }
    }

    console.log(
      `[BGM 播放检查] 当前消息 ID (${currentMessageId.value}) <= 全局状态消息 ID (${globalState.messageId})，不播放`
    );
    return false;
  } catch (e) {
    console.error('[BGM 播放检查] 检查失败:', e);
    return true; // 出错时默认允许播放
  }
};

// 监听酒馆消息
onMounted(() => {
  console.log('GAL游戏界面已加载');

  // 生成唯一实例 ID
  instanceId.value = `gal-instance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  console.log('实例ID:', instanceId.value);

  // 注册全局 BGM 事件监听器 - 在父窗口上监听
  const parentWin = getParentWindow();
  parentWin.addEventListener(GLOBAL_BGM_EVENT, handleGlobalBgmPlay as EventListener);
  console.log('已在父窗口注册 BGM 事件监听器');

  // 加载配置
  configStore.loadConfig();

  // 读取并应用全局音量设置
  const savedVolume = getGlobalBgmVolume();
  bgmVolume.value = savedVolume;
  console.log('已应用全局音量设置:', savedVolume);

  // 初始化当前消息ID用于Backlog
  initCurrentMessageId();

  // 注册滚轮监听器
  window.addEventListener('wheel', handleWheel, { passive: false });

  // 注册键盘监听器
  window.addEventListener('keydown', handleKeydown);

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
  // 移除全局 BGM 事件监听器 - 从父窗口移除
  const parentWin = getParentWindow();
  parentWin.removeEventListener(GLOBAL_BGM_EVENT, handleGlobalBgmPlay as EventListener);
  console.log('已从父窗口移除 BGM 事件监听器');

  // 移除滚轮监听器
  window.removeEventListener('wheel', handleWheel);

  // 移除键盘监听器
  window.removeEventListener('keydown', handleKeydown);

  // 清理所有呼吸动画
  Object.keys(characters.value).forEach(pos => {
    stopBreathing(pos);
  });

  // 停止 BGM
  stopBgm();

  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
});
</script>

<style lang="scss" scoped>
@import url('https://fontsapi.zeoseven.com/285/main/result.css');

.gal-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: hidden;
  background: #000;
  font-family: 'Noto Serif CJK', serif;
  font-weight: normal;
}

// 禁用快进模式时的所有过渡动画
.gal-container.no-transition {
  * {
    transition: none !important;
    animation: none !important;
  }

  .bg-transition-enter-active,
  .bg-transition-leave-active,
  .fade-enter-active,
  .fade-leave-active,
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: none !important;
  }
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

// 背景切换动画 - 从左往右擦除效果
.bg-transition-enter-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  animation: wipeFromLeft 2s ease-in-out;
  z-index: 2; // 确保新背景在旧背景上方
}

.bg-transition-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: opacity 1.7s ease-in-out;
  z-index: 1; // 旧背景在下方
}

.bg-transition-leave-to {
  opacity: 1; // 保持旧背景可见，直到被新背景完全覆盖
}

@keyframes wipeFromLeft {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
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
  align-items: flex-start;  // 改为顶部对齐，然后用偏移控制位置
  justify-content: space-around;
  pointer-events: none;
  overflow: visible;  // 允许超出边界
  padding-top: 8%;  // 增加顶部空间，为 jump_up 留出空间（从5%增加到8%）
}

.character-slot {
  flex: 1;
  display: flex;
  align-items: flex-end;  // 保持立绘在 slot 内底部对齐
  justify-content: center;
  overflow: visible;
  transform: translateY(-5%);  // 或者用 transform 整体下移
}

// 设置 z-index 实现显示优先级: L3 > L4=L2 > L5=L1
.position-L1,
.position-L5 {
  z-index: 30;
}

.position-L2,
.position-L4 {
  z-index: 40;
}

.position-L3 {
  z-index: 50;
}

.character-sprite {
  max-width: 200%;      // 保留原来的上限
  aspect-ratio: 1 /1.65;  // 固定宽高比（举例）
  object-fit: contain;   // 保持宽高比，不变形
  transition:
    filter 0.3s ease,
    transform 0.3s ease;
  &.active {
    filter: brightness(1);
  }

  &.inactive {
    filter: brightness(1);
  }
}

// 对话框层
.dialogue-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 4;
  cursor: pointer;
}

// 主对话框
.dialogue-box {
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  padding: 0 8% 0 5%;
}

// 对话框背景图片 - 使用 CSS 变量控制不透明度
.dialogue-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/mw01.png') no-repeat center / cover;
  opacity: var(--dialogue-bg-opacity, 0.7);
  z-index: 0;
  pointer-events: none;
}

// 名字框
.character-name-box {
  position: absolute;
  left: 13%;
  top: 0;
  transform: translateY(20%);
  width: 16.3%;
  max-width: 300px; /* 限制最大宽度，防止宽屏时过大 */
  max-height: 47px; /* 限制最大高度 */
  aspect-ratio: 313 / 200;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

// 名字框背景 - 半透明
.character-name-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/name.png') no-repeat center / 100% 100%;
  opacity: 0.8;
  z-index: -1;
  pointer-events: none;
}

.character-name {
  font-size: clamp(1rem, 2.2vw, 2rem);
  font-weight: 800;
  transform: translateY(-13%);
  padding: 5px 25px;
  color: #ffffff;
  text-align: center;
  padding: 0 10%;
  -webkit-text-stroke: 4px #453118;
  paint-order: stroke fill;
  letter-spacing: 0.3em;
  position: relative;
  z-index: 1;
}

.dialogue-content {
  // 字体大小由内联样式控制，不再使用固定值
  color: #ffffff;
  line-height: 1.8;
  width: 100%;
  font-weight: 800;
  -webkit-text-stroke: 3px #000000;
  paint-order: stroke fill;
  margin-left: 15%;
  position: relative;
  z-index: 1;
}

.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
}

// 自动播放指示图标
.auto-indicator {
  position: absolute;
  right: 8%;
  top: 20px;
  z-index: 2;
  pointer-events: none;

  img {
    width: auto;
    height: 30px;
    opacity: 0.9;
  }
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
  left: 0;
  background: url('https://gitgud.io/RBQ/amakano3/-/raw/master/menu/music/bt_bgm.png') no-repeat center / 100% 100%;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(200px, 40vw, 300px);
  aspect-ratio: 3 / 0.5;
  border-radius: 12px;
  overflow: hidden;
  i {
    display: none;
  }

  span {
    font-size: clamp(1rem, 1.5vw, 2rem);
    font-weight: 800;
    color: #453118;
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 横向滑动动画 (BGM通知)
.slide-down-enter-active {
  transition: all 0.5s ease;
}

.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 1;
  transform: translateX(-100%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>
