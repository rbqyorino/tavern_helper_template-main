import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { z } from 'zod';
import _ from 'lodash';

// 配置数据结构定义
const ConfigSchema = z.object({
  breathingEffect: z.boolean().default(true), // 是否开启呼吸特效
  keyboardShortcut: z.boolean().default(true), // 是否启用快捷键推进对话
  fullscreenDblClick: z.boolean().default(true), // 是否开启双击全屏功能
  autoSpeed: z.number().min(0).max(1).default(0.5), // 自动模式速度 0-1 (0慢, 1快)
  fontSize: z.number().min(16).max(32).default(24), // 对话框字体大小 16-32px
  textSpeed: z.number().min(0).max(1).default(0.5), // 文本速度 0-1 (0慢, 1快)
  opacity: z.number().min(0).max(1).default(0.8), // 背景不透明度 0-1
});

type Config = z.infer<typeof ConfigSchema>;

export const useConfigStore = defineStore('galConfig', () => {
  // 配置数据
  const breathingEffect = ref(true);
  const keyboardShortcut = ref(true);
  const fullscreenDblClick = ref(true);
  const autoSpeed = ref(0.5);
  const fontSize = ref(24);
  const textSpeed = ref(0.5);
  const opacity = ref(0.8);

  // 从酒馆变量加载配置
  const loadConfig = () => {
    try {
      if (typeof getVariables === 'undefined' || typeof getIframeName === 'undefined') {
        console.warn('酒馆接口未就绪，使用默认配置');
        return;
      }

      const iframeName = getIframeName();
      const savedConfig = getVariables({ type: 'global', key: `gal_config_${iframeName}` });

      if (savedConfig) {
        const parsed = ConfigSchema.parse(savedConfig);
        breathingEffect.value = parsed.breathingEffect;
        keyboardShortcut.value = parsed.keyboardShortcut;
        fullscreenDblClick.value = parsed.fullscreenDblClick;
        autoSpeed.value = parsed.autoSpeed;
        fontSize.value = parsed.fontSize;
        textSpeed.value = parsed.textSpeed;
        opacity.value = parsed.opacity;

        console.log('已加载配置:', parsed);
      } else {
        console.log('未找到已保存的配置，使用默认值');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 保存配置到酒馆变量
  const saveConfig = () => {
    try {
      if (typeof replaceVariables === 'undefined' || typeof getIframeName === 'undefined') {
        console.warn('酒馆接口未就绪，无法保存配置');
        return;
      }

      const config: Config = {
        breathingEffect: breathingEffect.value,
        keyboardShortcut: keyboardShortcut.value,
        fullscreenDblClick: fullscreenDblClick.value,
        autoSpeed: autoSpeed.value,
        fontSize: fontSize.value,
        textSpeed: textSpeed.value,
        opacity: opacity.value,
      };

      const iframeName = getIframeName();
      replaceVariables(_.cloneDeep(config), { type: 'global', key: `gal_config_${iframeName}` });

      console.log('已保存配置:', config);
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  // 重置为默认配置
  const resetToDefault = () => {
    const defaultConfig = ConfigSchema.parse({});
    breathingEffect.value = defaultConfig.breathingEffect;
    keyboardShortcut.value = defaultConfig.keyboardShortcut;
    fullscreenDblClick.value = defaultConfig.fullscreenDblClick;
    autoSpeed.value = defaultConfig.autoSpeed;
    fontSize.value = defaultConfig.fontSize;
    textSpeed.value = defaultConfig.textSpeed;
    opacity.value = defaultConfig.opacity;

    saveConfig();
    console.log('已重置为默认配置');
  };

  // 计算实际打字机速度（ms）
  const getTypingSpeed = () => {
    // textSpeed: 0 = 慢(100ms), 0.5 = 中(50ms), 1 = 快(10ms)
    return 100 - textSpeed.value * 90;
  };

  // 计算自动播放延迟（ms）
  const getAutoPlayDelay = () => {
    // autoSpeed: 0 = 慢(3000ms), 0.5 = 中(1500ms), 1 = 快(500ms)
    return 3000 - autoSpeed.value * 2500;
  };

  return {
    // 配置项
    breathingEffect,
    keyboardShortcut,
    fullscreenDblClick,
    autoSpeed,
    fontSize,
    textSpeed,
    opacity,

    // 方法
    loadConfig,
    saveConfig,
    resetToDefault,
    getTypingSpeed,
    getAutoPlayDelay,
  };
});
