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
  action?: {
    character: string;
    type: 'shake' | 'jump_up' | 'jump_down' | 'near' | 'away';
  };
}

// 新增指令接口
export interface ShowCommand {
  name: string;
  sprite: string;
  position: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

export interface AlterCommand {
  name: string;
  sprite: string;
}

export interface MoveCommand {
  name: string;
  position: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

export interface ActionCommand {
  character: string;
  type: 'shake' | 'jump_up' | 'jump_down' | 'near' | 'away';
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

  // 解析动作 [action|角色名|动作类型] - 用于对话内容中的动作提取
  static parseAction(text: string): { character: string; type: string } | undefined {
    const match = text.match(/\[action\|([^|]+)\|([^\]]+)\]/);
    if (!match) return undefined;

    return {
      character: match[1].trim(),
      type: match[2].trim(),
    };
  }

  // 解析单独成行的动作指令 [action|角色名|动作类型]
  static parseStandaloneAction(text: string): ActionCommand | undefined {
    const match = text.match(/^\[action\|([^|]+)\|([^\]]+)\]$/);
    if (!match) return undefined;

    return {
      character: match[1].trim(),
      type: match[2].trim() as 'shake' | 'jump_up' | 'jump_down' | 'near' | 'away',
    };
  }

  // 解析角色登场 [show|角色名|立绘名|位置]
  static parseShow(text: string): ShowCommand | undefined {
    const match = text.match(/^\[show\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);
    if (!match) return undefined;

    return {
      name: match[1].trim(),
      sprite: match[2].trim(),
      position: match[3].trim() as 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
    };
  }

  // 解析立绘变更 [alter|角色名|立绘名]
  static parseAlter(text: string): AlterCommand | undefined {
    const match = text.match(/^\[alter\|([^|]+)\|([^\]]+)\]$/);
    if (!match) return undefined;

    return {
      name: match[1].trim(),
      sprite: match[2].trim(),
    };
  }

  // 解析角色离场 [leave|角色名]
  static parseLeave(text: string): string | undefined {
    const match = text.match(/^\[leave\|([^\]]+)\]$/);
    return match ? match[1].trim() : undefined;
  }

  // 解析角色移动 [move|角色名|位置]
  static parseMove(text: string): MoveCommand | undefined {
    const match = text.match(/^\[move\|([^|]+)\|([^\]]+)\]$/);
    if (!match) return undefined;

    return {
      name: match[1].trim(),
      position: match[2].trim() as 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
    };
  }

  // 解析对话内容 - 新格式: 角色名|对话内容[action|角色名|动作]
  static parseDialogue(text: string): DialogueContent | undefined {
    // 对话格式: ${角色名}|${对话内容}
    const dialogueMatch = text.match(/^([^|]+)\|(.+)$/);
    if (!dialogueMatch) return undefined;

    const [, name, content] = dialogueMatch;
    const characterName = name.trim();

    // 提取动作指令（必须在末尾）
    const action = this.parseAction(content);
    const cleanContent = content.replace(/\[action\|[^\]]+\]/, '').trim();

    // 判断是否为旁白
    if (characterName === '旁白') {
      return {
        type: 'narrator',
        content: cleanContent,
      };
    }

    // 角色对话
    return {
      type: 'character',
      characterName,
      content: cleanContent,
      action,
    };
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
