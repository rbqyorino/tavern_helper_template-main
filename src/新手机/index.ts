import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Phone from './Phone.vue';

// 统一的日志函数，便于诊断
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[Phone][${timestamp}] ${message}`, data || '');
}

function debugError(message: string, error?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[Phone ERROR][${timestamp}] ${message}`, error || '');
}

export function teleport_style() {
  try {
    debugLog('开始传送样式到父文档');
    deteleport_style();

    const styleContainer = document.createElement('div');
    styleContainer.setAttribute('script_id', getScriptId());

    const styles = document.querySelectorAll('head > style');
    debugLog('找到样式标签数量', styles.length);

    styles.forEach(style => {
      styleContainer.appendChild(style.cloneNode(true));
    });

    window.parent.document.head.appendChild(styleContainer);
    debugLog('样式传送成功');
  } catch (error) {
    debugError('样式传送失败', error);
  }
}

export function deteleport_style() {
  try {
    const styleContainer = window.parent.document.querySelector(`head > div[script_id="${getScriptId()}"]`);
    if (styleContainer) {
      styleContainer.remove();
      debugLog('清理旧的样式容器');
    }
  } catch (error) {
    debugError('清理样式容器失败', error);
  }
}

// 检测是否在移动环境
function detectMobileEnvironment(): boolean {
  const viewport = window.innerWidth;
  const isSmallViewport = viewport < 800; // 小于 800px 认为是移动设备
  debugLog('检测环境', { viewport, isSmallViewport });
  return isSmallViewport;
}

// 检查父窗口 jQuery 是否可用
function isParentJQueryAvailable(): boolean {
  try {
    return typeof (window.parent as any).$ === 'function';
  } catch {
    return false;
  }
}

// 尝试添加容器到父文档（jQuery 或 fallback）
function addContainerToParent($appContainer: JQuery): boolean {
  try {
    // 方式1：使用 jQuery（优先）
    const parentBody = (window.parent as any).$?.(window.parent.document.body);
    if (parentBody && parentBody.length > 0) {
      parentBody.append($appContainer);
      debugLog('使用 jQuery 成功添加容器到父文档');
      return true;
    }
  } catch (error) {
    debugError('jQuery 方式添加容器失败', error);
  }

  try {
    // 方式2：使用原生 DOM（fallback）
    const body = window.parent.document.body;
    if (body) {
      const nativeElement = $appContainer[0];
      if (nativeElement) {
        body.appendChild(nativeElement);
        debugLog('使用原生 DOM 成功添加容器到父文档');
        return true;
      }
    }
  } catch (error) {
    debugError('原生 DOM 方式添加容器失败', error);
  }

  return false;
}

// 等待父文档就绪（jQuery 和容器访问）
async function waitForParentReady(maxRetries: number = 10): Promise<boolean> {
  debugLog('开始等待父文档就绪，最多重试次数', maxRetries);

  for (let i = 0; i < maxRetries; i++) {
    try {
      // 检查是否能访问父文档
      const body = window.parent.document.body;
      if (body) {
        debugLog('父文档 body 已就绪', { 尝试次数: i + 1 });
        return true;
      }
    } catch {
      // 继续重试
    }

    // 等待 100ms 后重试
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  debugLog('等待父文档超时');
  return false;
}

$(() => {
  debugLog('jQuery 就绪，开始初始化脚本');

  try {
    replaceScriptButtons([{ name: '召唤手机', visible: true }]);
    debugLog('脚本按钮已创建');
  } catch (error) {
    debugError('创建脚本按钮失败', error);
  }

  // 检测环境
  const isMobileEnv = detectMobileEnvironment();
  debugLog('环境检测结果', { 是否移动设备: isMobileEnv });

  setTimeout(async () => {
    debugLog('开始 Vue 应用初始化（延迟 500ms）');

    try {
      // 0. 等待父文档就绪
      debugLog('等待父文档就绪...');
      const parentReady = await waitForParentReady();
      if (!parentReady) {
        throw new Error('等待父文档超时：无法访问父窗口 document.body');
      }

      // 1. 创建容器
      debugLog('创建容器元素');
      const $appContainer = $('<div id="mimi-phone-app"></div>');

      // 添加初始样式防止闪烁
      $appContainer.css({
        'visibility': 'hidden', // 初始隐藏，等待初始化完成后显示
      });

      debugLog('尝试添加容器到父文档');
      const containerAdded = addContainerToParent($appContainer);
      if (!containerAdded) {
        throw new Error('无法将容器添加到父文档，jQuery 和原生 DOM 都失败');
      }

      debugLog('容器已添加到父文档');

      // 验证容器是否成功添加
      const containerCheck = window.parent.document.querySelector('#mimi-phone-app');
      if (!containerCheck) {
        throw new Error('容器添加失败：在 DOM 中找不到 #mimi-phone-app');
      }
      debugLog('容器验证成功，已在 DOM 中找到');

      // 2. 传送样式
      debugLog('开始传送样式');
      teleport_style();

      // 3. 创建 Vue 应用
      debugLog('创建 Vue 应用实例');
      const phoneApp = createApp(Phone);
      debugLog('Vue App 创建成功');

      // 4. 创建 Pinia store
      debugLog('创建 Pinia 存储');
      const pinia = createPinia();
      phoneApp.use(pinia);
      debugLog('Pinia 存储已绑定到 Vue App');

      // 5. 挂载应用
      debugLog('挂载 Vue 应用到容器');
      const mountTarget = $appContainer[0];
      if (!mountTarget) {
        throw new Error('容器元素不存在，无法挂载');
      }

      const phoneInstance = phoneApp.mount(mountTarget) as any;
      debugLog('Vue 应用挂载成功');

      // 6. 验证实例
      if (!phoneInstance) {
        throw new Error('应用挂载后 phoneInstance 为 undefined');
      }

      if (typeof phoneInstance.showPhone !== 'function' || typeof phoneInstance.hidePhone !== 'function') {
        debugError('phoneInstance 缺少必要的方法', {
          hasShowPhone: typeof phoneInstance.showPhone,
          hasHidePhone: typeof phoneInstance.hidePhone,
          instanceKeys: Object.keys(phoneInstance),
        });
        throw new Error('phoneInstance 缺少 showPhone 或 hidePhone 方法');
      }

      debugLog('phoneInstance 验证成功，包含所有必要方法');

      // 7. 保存全局引用
      (window as any).mimiPhoneInstance = phoneInstance;
      debugLog('phoneInstance 已保存到全局变量 window.mimiPhoneInstance');

      // 8. 注册按钮事件
      debugLog('注册"召唤手机"按钮点击事件');
      const buttonEvent = getButtonEvent('召唤手机');
      debugLog('按钮事件 ID', buttonEvent);

      eventOn(buttonEvent, () => {
        try {
          debugLog('按钮点击事件触发');
          debugLog('当前 phoneInstance.visible 状态', phoneInstance.visible);

          if (phoneInstance.visible) {
            debugLog('准备隐藏手机');
            phoneInstance.hidePhone();
            debugLog('隐藏手机调用成功');
          } else {
            debugLog('准备显示手机');
            phoneInstance.showPhone();
            debugLog('显示手机调用成功');
          }
        } catch (error) {
          debugError('按钮点击事件回调执行失败', error);
        }
      });

      debugLog('按钮事件监听器已注册');

      // 9. 注册卸载事件
      debugLog('注册页面卸载事件');
      $(window).on('pagehide', () => {
        try {
          debugLog('页面即将卸载，开始清理资源');
          phoneApp.unmount();
          debugLog('Vue 应用已卸载');

          (window.parent as any).$($appContainer).remove();
          debugLog('容器已从 DOM 中删除');

          deteleport_style();
          debugLog('样式已清理');

          delete (window as any).mimiPhoneInstance;
          debugLog('全局变量已删除');

          debugLog('页面卸载清理完成');
        } catch (error) {
          debugError('页面卸载时清理资源失败', error);
        }
      });

      debugLog('========== 手机脚本初始化完成 ==========');

      // 初始化完成后显示容器
      try {
        $appContainer.css('visibility', 'visible');
        debugLog('容器已显示');
      } catch (error) {
        debugError('显示容器失败', error);
      }
    } catch (error) {
      debugError('Vue 应用初始化失败', error);
      console.error('完整错误堆栈:', error instanceof Error ? error.stack : error);

      // 尝试显示容器即使初始化失败（便于调试）
      try {
        const $container = $('#mimi-phone-app');
        if ($container.length > 0) {
          $container.css('visibility', 'visible');
          $container.html('<div style="padding: 20px; color: red; font-family: monospace; white-space: pre-wrap;">初始化失败，请查看控制台获取错误信息</div>');
        }
      } catch {
        // 忽略
      }
    }
  }, 500);
});
