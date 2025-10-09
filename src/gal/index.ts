import { createApp } from 'vue';
import App from './GalGame.vue';
import './styles.scss';

console.log('=== GAL 模块已加载 ===');
console.log('jQuery 可用:', typeof $ !== 'undefined');
console.log('Vue 可用:', typeof createApp !== 'undefined');

$(() => {
  console.log('=== jQuery ready 触发 ===');
  console.log('#app 元素:', document.querySelector('#app'));

  try {
    const app = createApp(App);
    console.log('Vue app 创建成功');

    const mountedApp = app.mount('#app');
    console.log('Vue app 挂载成功:', mountedApp);
  } catch (error) {
    console.error('Vue 挂载失败:', error);
  }
});

$(window).on('pagehide', () => {
  console.log('GAL游戏界面卸载');
});
