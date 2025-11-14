import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'mimi-phone-settings';

export interface PhoneSettings {
  /** 手机整体宽度（像素） */
  phoneWidth: number;
  /** 手机整体高度（像素） */
  phoneHeight: number;

  /** 聊天主题：light/dark，用于决定整体背景与状态栏方案 */
  theme: 'light' | 'dark';

  /** 浅色主题下的聊天背景色 */
  lightBg: string;

  /** 深色主题下的聊天背景色 */
  darkBg: string;

  /** 玩家（用户）消息样式 */
  player: {
    /** 玩家气泡背景色 */
    bubbleColor: string;
    /** 玩家文字颜色 */
    textColor: string;
    /** 玩家字体大小（px） */
    fontSize: number;
  };

  /** 角色消息样式 */
  character: {
    /** 角色气泡背景色 */
    bubbleColor: string;
    /** 角色文字颜色 */
    textColor: string;
    /** 角色字体大小（px） */
    fontSize: number;
  };
}

const defaultSettings: PhoneSettings = {
  // 默认尺寸为接近 iPhone X 的大小
  phoneWidth: 375,
  phoneHeight: 812,

  // 默认主题与背景
  theme: 'light',
  lightBg: '#f6f7ff',
  darkBg: '#050816',

  // 玩家对话样式
  player: {
    bubbleColor: '#377DFF', // 稍微鲜明一点的主色
    textColor: '#ffffff',
    fontSize: 14,
  },

  // 角色对话样式
  character: {
    bubbleColor: '#E8E8E8',
    textColor: '#111111',
    fontSize: 14,
  },
};

export const usePhoneSettingsStore = defineStore('phoneSettings', () => {
  const MIN_SIZE = 200; // 最小宽高限制

  // 从 localStorage 加载设置
  function loadSettings(): PhoneSettings | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PhoneSettings;

        // 验证并修正尺寸：确保宽度和高度至少为 MIN_SIZE
        let corrected = false;
        if (parsed.phoneWidth < MIN_SIZE) {
          console.warn(`[PhoneSettings] 宽度 ${parsed.phoneWidth}px 小于最小值，已修正为 ${MIN_SIZE}px`);
          parsed.phoneWidth = MIN_SIZE;
          corrected = true;
        }
        if (parsed.phoneHeight < MIN_SIZE) {
          console.warn(`[PhoneSettings] 高度 ${parsed.phoneHeight}px 小于最小值，已修正为 ${MIN_SIZE}px`);
          parsed.phoneHeight = MIN_SIZE;
          corrected = true;
        }

        if (corrected) {
          // 如果修正了值，立即保存回 localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          console.log('[PhoneSettings] 已自动修正并保存尺寸');
        }

        return parsed;
      } catch (error) {
        console.warn('[PhoneSettings] 加载设置失败:', error);
      }
    }
    return null;
  }

  // 初始化：优先使用保存的设置，否则用默认值
  const settings = ref<PhoneSettings>(loadSettings() || { ...defaultSettings });

  // 自动保存到 localStorage
  watch(
    settings,
    (newSettings) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      console.log('[PhoneSettings] 设置已保存:', newSettings);
    },
    { deep: true },
  );

  // 重置为默认设置
  function resetSettings() {
    // 使用结构展开，确保丢弃外部引用，避免历史脏数据残留
    settings.value = {
      phoneWidth: defaultSettings.phoneWidth,
      phoneHeight: defaultSettings.phoneHeight,
      theme: defaultSettings.theme,
      lightBg: defaultSettings.lightBg,
      darkBg: defaultSettings.darkBg,
      player: { ...defaultSettings.player },
      character: { ...defaultSettings.character },
    };
  }

  return { settings, resetSettings };
});
