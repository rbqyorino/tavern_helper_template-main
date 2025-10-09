# 美丽时光 - Galgame界面

一个简洁美观的Galgame/视觉小说界面，专注于视觉体验。

## 特点

- 美观的半透明对话框设计
- 支持CG图片切换，带有淡入淡出效果
- 打字机效果显示文本
- 点击屏幕或按空格键进行下一步操作
- 响应式设计，适应不同屏幕尺寸

## 如何使用

1. 克隆或下载本仓库
2. 直接在浏览器中打开 `index.html` 文件
3. 点击屏幕任意位置或按空格键进行下一步对话

## 自定义内容

你可以通过修改 `galgame.js` 文件中的以下部分来自定义游戏内容：

### 修改CG图片

```javascript
// 初始化CG图片
const cgUrls = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
];
```

### 修改对话内容

```javascript
// 初始化对话数据
this.dialogData = [
    { name: '角色1', text: '这是第一句对话...', image: cgUrls[0] },
    { name: '角色2', text: '这是第二句对话...', image: cgUrls[0] },
    // 添加更多对话...
];
```

## 技术栈

- HTML5
- CSS3（带有现代特效如模糊效果和渐变）
- JavaScript/TypeScript（面向对象设计）

## 开发

如果你想修改TypeScript源码并重新编译：

1. 确保安装了Node.js和npm
2. 安装TypeScript: `npm install -g typescript`
3. 编译: `tsc`

## 许可

MIT 