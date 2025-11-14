# 新手机设置界面开发说明

> 面向：没有看过源码的开发者  
> 目标：说明「新手机」脚本中设置界面是如何实现的，以及如何按同样模式添加新的设置功能。

---

## 一、整体结构：手机是谁控制的？

### 1. Phone.vue 是「唯一手机外壳」

[`Phone.vue`](src/新手机/Phone.vue:128) 是手机 UI 的核心组件，负责：

1. 决定手机整体尺寸：宽度、高度、外壳、屏幕区域。
2. 控制当前显示哪个页面：主页 / 聊天页 / 设置页。
3. 将用户设置（颜色、字体、尺寸等）应用到各个子组件。

关键点：

- 使用 Pinia 管理设置：

  ```ts
  import { usePhoneSettingsStore } from './stores/phoneSettings';

  const settingsStore = usePhoneSettingsStore();
  const phoneSettings = computed(() => settingsStore.settings);
  ```

- 手机外壳宽度由 `phoneSettings` 决定：

  ```ts
  const phoneWrapperStyle = computed(() => ({
    width: phoneSettings.value.phoneWidth
      ? `${phoneSettings.value.phoneWidth}px`
      : 'min(390px, 90vw, calc(100vw - 32px))',
    maxWidth: phoneSettings.value.phoneWidth
      ? `${phoneSettings.value.phoneWidth}px`
      : 'min(390px, 90vw)',
  }));
  ```

- 通过 `currentView` 控制展示的页面：

  ```vue
  <div class="mimi-phone-screen">
    <div v-show="currentView === 'home'">...</div>

    <ChatPage
      v-show="currentView === 'chat'"
      :player-bubble-color="phoneSettings.player.bubbleColor"
      :player-text-color="phoneSettings.player.textColor"
      :player-font-size="phoneSettings.player.fontSize"
      :character-bubble-color="phoneSettings.character.bubbleColor"
      :character-text-color="phoneSettings.character.textColor"
      :character-font-size="phoneSettings.character.fontSize"
    />

    <SettingsPage v-show="currentView === 'settings'" @close="goHome" />
  </div>
  ```

**结论：**

- 所有外观和行为都应该来源于 `phoneSettings`。
- `Phone.vue` 负责「读设置并渲染」。
- 设置页组件只负责「写设置」，不直接控制 DOM。

---

### 2. SettingsPage.vue 是「设置 UI」

[`SettingsPage.vue`](src/新手机/SettingsPage.vue:1) 的职责：

1. 展示当前设置值：手机宽高、玩家/角色气泡颜色、字体大小等。
2. 当用户修改内容时，把修改写回 `usePhoneSettingsStore`。
3. 提供重置为默认设置的方法。

核心模式：

```ts
import { usePhoneSettingsStore } from './stores/phoneSettings';

const settingsStore = usePhoneSettingsStore();
const settings = settingsStore.settings; // 引用同一个响应式对象
```

然后在模板中：

```vue
<input v-model.number="settings.player.fontSize" type="number" />
<ColorPicker v-model="settings.player.bubbleColor" />
```

**注意：**

- `settings` 是对 Pinia `state` 的直接引用。
- 在设置页中对 `settings.xxx` 的任何修改，都会立刻影响 `Phone.vue` 等所有使用这些值的组件。

---

## 二、现有设置项是如何生效的？

下面按功能说明从「设置 UI」到「实际效果」的完整链路。

### 1. 手机尺寸：宽度 / 高度

在 SettingsPage 中：

1. 使用本地变量存储输入框值：

   ```ts
   const tempWidth = ref(settings.phoneWidth);
   const tempHeight = ref(settings.phoneHeight);
   ```

2. 用户输入结束后按回车，调用：

   ```ts
   function applyDimensions() {
     const MIN_SIZE = 300;
     let adjusted = false;

     if (tempWidth.value < MIN_SIZE) {
       tempWidth.value = MIN_SIZE;
       adjusted = true;
     }

     if (tempHeight.value < MIN_SIZE) {
       tempHeight.value = MIN_SIZE;
       adjusted = true;
     }

     // 把最终值写回全局设置
     settings.phoneWidth = tempWidth.value;
     settings.phoneHeight = tempHeight.value;

     if (adjusted) {
       toastr.warning('手机尺寸已调整，最小宽高为200px', '提示');
     } else {
       toastr.success('手机尺寸已更新', '提示');
     }
   }
   ```

3. Phone.vue 使用这些值：

   - 宽度：`phoneWrapperStyle`。
   - 高宽比：`phoneContainerStyle` 通过 `phoneWidth/phoneHeight` 算 `aspect-ratio`。

**总结：**

- 设置页只负责确定数值并写回 `settings.phoneWidth/phoneHeight`。
- 手机壳如何渲染由 Phone.vue 决定。

---

### 2. 玩家对话样式

在 SettingsPage 中：

```vue
<ColorPicker v-model="settings.player.bubbleColor" />
<ColorPicker v-model="settings.player.textColor" />
<input
  v-model.number="settings.player.fontSize"
  type="number"
  class="mimi-settings-input"
/>
```

特点：

- 不需要额外方法，直接 `v-model` 绑定到 `settings.player.xxx`。
- 每一次修改都会实时更新 Pinia store。

在 Phone.vue 中，这些值被传入 ChatPage：

```vue
<ChatPage
  :player-bubble-color="phoneSettings.player.bubbleColor"
  :player-text-color="phoneSettings.player.textColor"
  :player-font-size="phoneSettings.player.fontSize"
  ...
/>
```

ChatPage 内部根据 props 决定气泡颜色/字体大小。

---

### 3. 角色对话样式

与玩家设置一致，只是字段换成 `settings.character.xxx`。

- 设置页直接修改 `settings.character.bubbleColor/textColor/fontSize`。
- Phone.vue 将这些值作为 props 传给 ChatPage。
- ChatPage 使用这些值渲染角色气泡。

---

### 4. 重置所有设置

在 SettingsPage 中：

```ts
function resetSettings() {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    settingsStore.resetSettings();               // 调用 store 内逻辑
    tempWidth.value = settings.phoneWidth;       // 同步本地输入框
    tempHeight.value = settings.phoneHeight;
    toastr.info('设置已重置为默认值', '提示');
  }
}
```

**要点：**

- 具体默认值由 `settingsStore.resetSettings()` 决定。
- 设置页只调用这个方法，不重复写默认值，避免两边配置不一致。

---

## 三、如何添加新的设置功能（可直接照抄的模板）

假设要添加一个「是否显示顶部时间」的设置。

### 步骤 1：在 Pinia Store 中定义字段

在 phoneSettings 的定义中添加：

```ts
state: () => ({
  // ...已有字段
  showStatusTime: true,
}),
actions: {
  resetSettings() {
    // ...重置其它字段
    this.showStatusTime = true;
  },
}
```

### 步骤 2：在 SettingsPage.vue 中加入 UI

```vue
<section class="mimi-settings-section">
  <h2 class="mimi-settings-section-title">显示选项</h2>
  <div class="mimi-settings-group">
    <div class="mimi-settings-item">
      <label class="mimi-settings-label">显示顶部时间</label>
      <input type="checkbox" v-model="settings.showStatusTime" />
    </div>
  </div>
</section>
```

特点：

- 直接 `v-model="settings.showStatusTime"`。
- 不需要中间函数。

### 步骤 3：在 Phone.vue 中使用该设置

在状态栏渲染处：

```vue
<div class="mimi-phone-status-left">
  <span
    v-if="phoneSettings.showStatusTime"
    class="mimi-phone-time"
  >
    {{ currentTimeText }}
  </span>
</div>
```

**遵循同一模式：**

1. Store 定义字段。
2. 设置页通过 v-model 修改字段。
3. Phone.vue/ChatPage 通过字段决定显示。

---

## 四、编写设置界面时需要遵守的约定（功能相关）

为了保证设置功能可维护、行为一致，编写新的设置页 / 扩展设置功能时，请遵守以下功能性约定（不涉及视觉美化）：

1. **只操作 store，不直接改主壳 DOM**

   - 设置页通过 `usePhoneSettingsStore().settings` 修改数据。
   - `Phone.vue` 是唯一负责根据这些数据渲染外观和布局。

2. **设置值集中在 Pinia 中管理**

   - 所有需要在多处使用的配置项（尺寸、主题、样式开关等）都应在 store 中定义。
   - 设置页不单独维护一份「默认配置」，统一调用 store 的 `resetSettings()`。

3. **通过 v-model 直接绑定到 store 字段**

   - 典型写法：`v-model="settings.xxx"` 或 `v-model.number="settings.xxx"`。
   - 避免在多个地方手动同步同一字段，减少状态不一致风险。

4. **通过 props 将设置值传给实际使用组件**

   - 例：`Phone.vue` 将 `phoneSettings.player.bubbleColor` 作为 prop 传给 `ChatPage`。
   - 任何实际的显示逻辑，只依赖这些 props，不直接读取 DOM 或全局变量。

5. **重置逻辑统一走 store**

   - 在 store 中实现 `resetSettings()`，集中定义默认值。
   - 设置页只调用 `settingsStore.resetSettings()`，不重复写默认值。

---

## 五、一句话记忆（功能视角）

- 「Phone.vue 是手机外壳和路由，SettingsPage.vue 是设置面板。」
- 「所有设置写进 Pinia store，所有展示从 Pinia store 读。」
- 「新增设置 = store 加字段 + 设置页 v-model + 使用处读该字段。」