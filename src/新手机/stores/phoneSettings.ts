import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const STORAGE_KEY = 'mimi-phone-settings';

export interface PhoneSettings {
  phoneWidth: number;
  phoneHeight: number;
  theme: 'light' | 'dark';
  player: {
    bubbleColor: string;
    textColor: string;
    fontSize: number;
  };
  character: {
    bubbleColor: string;
    textColor: string;
    fontSize: number;
  };
  lightBg: string;
  darkBg: string;
}

const defaultSettings: PhoneSettings = {
  phoneWidth: 375,
  phoneHeight: 812,
  theme: 'light',
  player: {
    bubbleColor: '#95C8FF',
    textColor: '#000000',
    fontSize: 14,
  },
  character: {
    bubbleColor: '#E8E8E8',
    textColor: '#000000',
    fontSize: 14,
  },
  lightBg: '#F6F7FF',
  darkBg: '#1C1C1E',
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
    settings.value = { ...defaultSettings };
  }

  return { settings, resetSettings };
});
