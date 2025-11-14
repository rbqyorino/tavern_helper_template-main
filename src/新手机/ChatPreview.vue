<template>
  <div class="chat-preview-container">
    <!-- Character Message -->
    <div class="mimi-message-wrapper">
      <div class="mimi-conversation-message">
        <div class="mimi-message-content">
          <div
            class="mimi-message-bubble"
            :style="{
              backgroundColor: settings.character.bubbleColor,
              color: settings.character.textColor,
              fontSize: settings.character.fontSize + 'px',
            }"
          >
            测试文字
          </div>
        </div>
      </div>
    </div>

    <!-- Player Message -->
    <div class="mimi-message-wrapper mimi-message-wrapper--user">
      <div class="mimi-conversation-message mimi-message--user">
        <div class="mimi-message-content">
          <div
            class="mimi-message-bubble"
            :style="{
              backgroundColor: settings.player.bubbleColor,
              color: settings.player.textColor,
              fontSize: settings.player.fontSize + 'px',
            }"
          >
            测试文字
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneSettingsStore } from './stores/phoneSettings';

const settingsStore = usePhoneSettingsStore();
const settings = settingsStore.settings;
</script>

<style scoped lang="scss">
.chat-preview-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 12px;
  background-color: #f2f3f5;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.mimi-message-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.mimi-message-wrapper--user {
  align-items: flex-end;
}

.mimi-conversation-message {
  display: flex;
  gap: 8px;
  max-width: 80%;
  min-width: 0;
  box-sizing: border-box;
}

.mimi-message--user {
  align-self: flex-end;
}

.mimi-message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.mimi-message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  line-height: 1.4;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease-in-out;
}
</style>