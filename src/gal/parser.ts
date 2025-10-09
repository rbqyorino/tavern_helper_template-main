// 解析GAL消息格式的工具类

export interface ParsedMessage {
  background?: string;
  cg?: string;
  hideCg?: boolean;
  bgm?: string;
  dialogue?: DialogueContent;
  choices?: string[];
}

export interface DialogueContent {
  type: 'narrator' | 'character';
  content: string;
  characterName?: string;
  position?: 'L1' | 'L2' | 'L3' | 'L4';
  sprite?: string;
  action?: {
    character: string;
    type: 'shake' | 'jump_up' | 'jump_down' | 'near' | 'away';
  };
}

export class MessageParser {
  // 解析背景 [bg|图片链接或别名]
  static parseBg(text: string): string | undefined {
    const match = text.match(/\[bg\|([^\]]+)\]/);
    return match ? match[1] : undefined;
  }

  // 解析CG [cg|图片链接或别名]
  static parseCg(text: string): string | undefined {
    const match = text.match(/\[cg\|([^\]]+)\]/);
    return match ? match[1] : undefined;
  }

  // 检查是否隐藏CG [hide_cg]
  static parseHideCg(text: string): boolean {
    return /\[hide_cg\]/.test(text);
  }

  // 解析BGM [bgm|音乐名]
  static parseBgm(text: string): string | undefined {
    const match = text.match(/\[bgm\|([^\]]+)\]/);
    return match ? match[1] : undefined;
  }

  // 解析选择 [choice|选项1|选项2|选项3]
  static parseChoices(text: string): string[] | undefined {
    const match = text.match(/\[choice\|([^\]]+)\]/);
    if (!match) return undefined;

    const choices = match[1]
      .split('|')
      .map(c => c.trim())
      .filter(c => c);
    return choices.length > 0 ? choices : undefined;
  }

  // 解析动作 [action|角色名|动作类型]
  static parseAction(text: string): { character: string; type: string } | undefined {
    const match = text.match(/\[action\|([^|]+)\|([^\]]+)\]/);
    if (!match) return undefined;

    return {
      character: match[1].trim(),
      type: match[2].trim(),
    };
  }

  // 解析对话内容
  static parseDialogue(text: string): DialogueContent | undefined {
    // 旁白格式: 旁白||${旁白内容}
    const narratorMatch = text.match(/^旁白\|\|(.+)/);
    if (narratorMatch) {
      return {
        type: 'narrator',
        content: narratorMatch[1].trim(),
      };
    }

    // 角色对话格式: ${角色名}|${位置}|${立绘名}|${对话内容}
    const dialogueMatch = text.match(/^([^|]+)\|([^|]*)\|([^|]*)\|(.+)/);
    if (dialogueMatch) {
      const [, characterName, position, sprite, content] = dialogueMatch;

      // 提取动作指令
      const action = this.parseAction(content);
      const cleanContent = content.replace(/\[action\|[^\]]+\]/, '').trim();

      return {
        type: 'character',
        characterName: characterName.trim(),
        position: (position.trim() || undefined) as 'L1' | 'L2' | 'L3' | 'L4' | undefined,
        sprite: sprite.trim() || undefined,
        content: cleanContent,
        action,
      };
    }

    return undefined;
  }

  // 完整解析消息
  static parseMessage(text: string): ParsedMessage {
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l);
    const result: ParsedMessage = {};

    for (const line of lines) {
      // 解析背景
      const bg = this.parseBg(line);
      if (bg) {
        result.background = bg;
        continue;
      }

      // 解析CG
      const cg = this.parseCg(line);
      if (cg) {
        result.cg = cg;
        continue;
      }

      // 检查隐藏CG
      if (this.parseHideCg(line)) {
        result.hideCg = true;
        continue;
      }

      // 解析BGM
      const bgm = this.parseBgm(line);
      if (bgm) {
        result.bgm = bgm;
        continue;
      }

      // 解析选择
      const choices = this.parseChoices(line);
      if (choices) {
        result.choices = choices;
        continue;
      }

      // 解析对话
      const dialogue = this.parseDialogue(line);
      if (dialogue) {
        result.dialogue = dialogue;
        continue;
      }
    }

    return result;
  }

  // 将别名转换为完整URL
  static resolveAssetUrl(alias: string, type: 'image' | 'audio'): string {
    // 如果已经是完整URL，直接返回
    if (alias.startsWith('http://') || alias.startsWith('https://')) {
      return alias;
    }

    const baseUrl = 'https://gitgud.io/RBQ/amakano3/-/raw/master';

    // 如果已经有扩展名，直接使用
    if (/\.(png|jpg|jpeg|gif|webp|mp3|ogg|wav)$/i.test(alias)) {
      return `${baseUrl}/${alias}`;
    }

    // 根据类型添加默认扩展名
    const extension = type === 'image' ? '.png' : '.mp3';
    return `${baseUrl}/${alias}${extension}`;
  }
}
