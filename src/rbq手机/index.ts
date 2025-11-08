/**
 * RBQ手机模拟器 - 脚本主入口
 * Phone Simulator - Main Entry Point
 *
 * 本脚本在酒馆后台运行，负责：
 * 1. 初始化手机界面
 * 2. 监听酒馆事件
 * 3. 解析AI输出中的消息
 * 4. 管理数据持久化
 */

import { createApp } from 'vue';
import Phone from './Phone.vue';
import {
  initializePhoneState,
  savePhoneStateToVariables,
  saveUIStateToIDB,
  togglePhoneVisibility,
  addMessageToChat,
  getOrCreateChat,
  addPost,
  setupMvuListener,
} from './stores/phone-state';
import { processPrivateMessage, processHomeMessage, extractPhoneMessagesFromChat } from './utils/message-parser';
import type { Message, Post } from './types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 样式teleport函数
 * 将iframe内的样式传送到主页面的<head>中
 */
function teleport_style() {
  const styles = document.querySelectorAll('style');
  const styleContainer = $(`<div>`).attr('phone_simulator_id', getScriptId());

  styles.forEach((style) => {
    styleContainer.append($(style).clone());
  });

  $(window.parent.document.head).append(styleContainer);
}

/**
 * 清除样式
 */
function deteleport_style() {
  $(window.parent.document.head)
    .find(`div[phone_simulator_id="${getScriptId()}"]`)
    .remove();
}

/**
 * 初始化脚本
 */
async function init() {
  try {
    console.log('[RBQ Phone Simulator] 初始化中...');

    // 1. 初始化手机状态
    await initializePhoneState();

    // 2. 注册脚本按钮
    replaceScriptButtons([
      {
        name: '召唤手机',
        visible: true,
      },
    ]);

    // 3. 创建Vue应用容器
    const $appContainer = $('<div id="rbq-phone-app"></div>');
    $(window.parent.document.body).append($appContainer);

    // 4. 确保容器已添加到DOM
    await new Promise(resolve => setTimeout(resolve, 100));

    // 5. 创建Vue应用
    const app = createApp(Phone);
    const mountElement = $appContainer[0];
    if (mountElement) {
      app.mount(mountElement);
      console.log('[RBQ Phone Simulator] Vue应用已挂载');
    } else {
      throw new Error('Failed to mount Vue app - container not found');
    }

    // 6. 传送样式到主页面
    teleport_style();

    // 7. 监听按钮事件
    eventOn(getButtonEvent('召唤手机'), () => {
      console.log('[RBQ Phone Simulator] 召唤手机按钮被点击');
      togglePhoneVisibility();
    });

    // 8. 监听聊天消息事件
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
      handleNewMessage();
    });

    // 9. 监听角色卡切换事件
    eventOn(tavern_events.CHARACTER_CHANGED, () => {
      console.log('[RBQ Phone Simulator] 角色卡已切换');
    });

    // 10. 监听聊天切换事件
    eventOn(tavern_events.CHAT_CHANGED, () => {
      console.log('[RBQ Phone Simulator] 聊天已切换');
      // 可以在这里重新加载聊天数据
      loadHistoryMessages();
    });

    // 11. 设置MVU事件监听（用于手机数据实时更新）
    setupMvuListener();

    console.log('[RBQ Phone Simulator] 初始化完成');
  } catch (error) {
    console.error('[RBQ Phone Simulator] 初始化失败:', error);
  }
}

/**
 * 处理新消息
 * 从最新的聊天消息中提取Phone格式的消息
 */
async function handleNewMessage() {
  try {
    const messages = await getChatMessages();
    if (!messages || messages.length === 0) return;

    // 获取最后一条消息
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // 检查消息内容是否包含Phone格式
    const hasPhoneFormat = /Phone\.(Private|Home)\(/.test(lastMessage.mes || '');
    if (!hasPhoneFormat) return;

    // 处理私聊消息
    const privateMatch = lastMessage.mes?.match(/Phone\.Private\('([^']+)','([^']+)','([^']*)','([^']+)'\);/);
    if (privateMatch) {
      const [, sender, receiver, content, timestamp] = privateMatch;
      const messages = processPrivateMessage(lastMessage.mes, lastMessage.extra?.avatar);

      if (messages && messages.length > 0) {
        // 创建或获取聊天
        const chatId = `${sender}_${receiver}`;
        const chat = getOrCreateChat(chatId, receiver); // 假设receiver是对方

        // 添加所有消息
        messages.forEach((msg) => {
          addMessageToChat(chatId, msg);
        });

        console.log('[RBQ Phone Simulator] 已处理私聊消息:', { sender, receiver, messageCount: messages.length });
      }
    }

    // 处理动态消息
    const homeMatch = lastMessage.mes?.match(/Phone\.Home\('([^']+)','([^']*)','([^']+)'\);/);
    if (homeMatch) {
      const [, author, content, timestamp] = homeMatch;
      const homeData = processHomeMessage(lastMessage.mes);

      if (homeData) {
        const post: Post = {
          id: generateId(),
          authorName: homeData.author,
          authorAvatar: lastMessage.extra?.avatar,
          content: homeData.content,
          images: homeData.images,
          timestamp: homeData.timestamp,
          likes: 0,
          comments: 0,
        };

        addPost(post);
        console.log('[RBQ Phone Simulator] 已处理动态消息:', { author, timestamp });
      }
    }
  } catch (error) {
    console.error('[RBQ Phone Simulator] 处理新消息失败:', error);
  }
}

/**
 * 加载历史消息
 * 从聊天记录中恢复Phone格式的消息
 */
async function loadHistoryMessages() {
  try {
    const messages = await getChatMessages();
    if (!messages || messages.length === 0) return;

    let privateCount = 0;
    let homeCount = 0;

    // 遍历所有消息
    for (const message of messages) {
      if (!message.mes) continue;

      // 处理私聊消息
      const privateRegex = /Phone\.Private\('([^']+)','([^']+)','([^']*)','([^']+)'\);/g;
      let match;
      while ((match = privateRegex.exec(message.mes))) {
        const [, sender, receiver, content, timestamp] = match;
        const msgObjects = processPrivateMessage(match[0], message.extra?.avatar);

        if (msgObjects && msgObjects.length > 0) {
          const chatId = `${sender}_${receiver}`;
          const chat = getOrCreateChat(chatId, receiver);

          msgObjects.forEach((msg) => {
            addMessageToChat(chatId, msg);
          });

          privateCount++;
        }
      }

      // 处理动态消息
      const homeRegex = /Phone\.Home\('([^']+)','([^']*)','([^']+)'\);/g;
      while ((match = homeRegex.exec(message.mes))) {
        const [, author, content, timestamp] = match;
        const homeData = processHomeMessage(match[0]);

        if (homeData) {
          const post: Post = {
            id: generateId(),
            authorName: homeData.author,
            authorAvatar: message.extra?.avatar,
            content: homeData.content,
            images: homeData.images,
            timestamp: homeData.timestamp,
            likes: 0,
            comments: 0,
          };

          addPost(post);
          homeCount++;
        }
      }
    }

    if (privateCount > 0 || homeCount > 0) {
      await savePhoneStateToVariables();
      console.log('[RBQ Phone Simulator] 已加载历史消息:', { privateCount, homeCount });
    }
  } catch (error) {
    console.error('[RBQ Phone Simulator] 加载历史消息失败:', error);
  }
}

/**
 * 脚本加载
 */
$(() => {
  console.log('[RBQ Phone Simulator] 脚本加载中...');
  console.log('[RBQ Phone Simulator] 检查酒馆接口...');
  console.log('[RBQ Phone Simulator] - getScriptId:', typeof getScriptId);
  console.log('[RBQ Phone Simulator] - eventOn:', typeof eventOn);
  console.log('[RBQ Phone Simulator] - getButtonEvent:', typeof getButtonEvent);
  console.log('[RBQ Phone Simulator] - replaceScriptButtons:', typeof replaceScriptButtons);

  init();
});

/**
 * 脚本卸载
 */
$(window).on('pagehide', () => {
  try {
    deteleport_style();
    console.log('[RBQ Phone Simulator] 脚本已卸载');
  } catch (error) {
    console.error('[RBQ Phone Simulator] 卸载失败:', error);
  }
});
