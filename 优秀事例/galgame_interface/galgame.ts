/**
 * Galgame界面核心功能
 * 提供简单的对话显示和点击/空格下一步功能
 */

interface DialogData {
    name: string;
    text: string;
    image?: string;
}

class GalgameEngine {
    private currentIndex: number = 0;
    private dialogBox: HTMLElement;
    private characterName: HTMLElement;
    private dialogText: HTMLElement;
    private backgroundImage: HTMLImageElement;
    private isAnimating: boolean = false;
    private dialogData: DialogData[] = [];
    
    constructor() {
        // 获取DOM元素
        this.dialogBox = document.getElementById('dialog-box') as HTMLElement;
        this.characterName = document.getElementById('character-name') as HTMLElement;
        this.dialogText = document.getElementById('dialog-text') as HTMLElement;
        this.backgroundImage = document.getElementById('background-image') as HTMLImageElement;
        
        // 初始化CG图片
        const cgUrls = [
            'https://gitgud.io/lolodesu/lolobabytutorial/-/raw/master/lologame/hcg/%E5%B7%B7%E5%AD%90%E5%85%A8%E8%A3%B8%E6%AD%A3%E9%9D%A2M%E8%85%BF.png?ref_type=heads',
            'https://gitgud.io/lolodesu/lolobabytutorial/-/raw/master/lologame/hcg/%E5%B7%B7%E5%AD%90%E6%89%B6%E5%A2%99%E5%90%8E%E5%85%A51.png?ref_type=heads'
        ];
        
        // 初始化对话数据
        this.dialogData = [
            { name: '巷子', text: '呼...终于找到了这个地方...', image: cgUrls[0] },
            { name: '巷子', text: '没想到你会叫我来这种偏僻的地方呢...', image: cgUrls[0] },
            { name: '你', text: '我想找一个不会被打扰的地方。', image: cgUrls[0] },
            { name: '巷子', text: '是吗...那你想做什么呢？', image: cgUrls[0] },
            { name: '你', text: '你知道的...', image: cgUrls[0] },
            { name: '巷子', text: '啊...这样啊...', image: cgUrls[1] },
            { name: '巷子', text: '其实我也想要这样...', image: cgUrls[1] },
            { name: '巷子', text: '只要是你的话...', image: cgUrls[1] },
            { name: '你', text: '那我们开始吧...', image: cgUrls[1] },
            { name: '巷子', text: '嗯...请温柔一点...', image: cgUrls[1] },
        ];
        
        // 初始化事件监听
        this.initEventListeners();
        
        // 显示第一条对话
        this.showDialog(0);
    }
    
    private initEventListeners(): void {
        // 点击屏幕任意位置进入下一步
        document.addEventListener('click', () => {
            this.nextDialog();
        });
        
        // 按空格键进入下一步
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.nextDialog();
            }
        });
    }
    
    private showDialog(index: number): void {
        if (index >= this.dialogData.length) {
            // 对话结束，可以添加结束画面或循环播放
            this.currentIndex = 0;
            this.showDialog(0);
            return;
        }
        
        const dialog = this.dialogData[index];
        
        // 更新背景图片(如果有变化)
        if (dialog.image && this.backgroundImage.src !== dialog.image) {
            this.fadeOutIn(() => {
                this.backgroundImage.src = dialog.image || '';
            });
        }
        
        // 应用打字机效果
        this.characterName.textContent = dialog.name;
        this.applyTypingEffect(dialog.text);
    }
    
    private nextDialog(): void {
        // 如果正在动画中，则跳过打字效果直接显示全部文本
        if (this.isAnimating) {
            this.isAnimating = false;
            const currentDialog = this.dialogData[this.currentIndex];
            this.dialogText.textContent = currentDialog.text;
            return;
        }
        
        // 否则，显示下一条对话
        this.currentIndex++;
        this.showDialog(this.currentIndex);
    }
    
    private applyTypingEffect(text: string): void {
        this.isAnimating = true;
        this.dialogText.textContent = '';
        
        let i = 0;
        const speed = 30; // 打字速度，可以调整
        
        const typeWriter = () => {
            if (i < text.length && this.isAnimating) {
                this.dialogText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            } else {
                this.isAnimating = false;
            }
        };
        
        typeWriter();
    }
    
    private fadeOutIn(callback: () => void): void {
        // 淡出
        this.backgroundImage.style.opacity = '0';
        
        // 等待淡出完成后执行回调并淡入
        setTimeout(() => {
            callback();
            setTimeout(() => {
                this.backgroundImage.style.opacity = '1';
            }, 50);
        }, 400);
    }
}

// 当页面加载完成后初始化游戏引擎
window.addEventListener('DOMContentLoaded', () => {
    new GalgameEngine();
}); 