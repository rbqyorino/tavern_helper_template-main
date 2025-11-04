// 解析GAL消息格式的工具类
import cgSeriesConfig from './cg-series.yaml';

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
  position: 'L' | 'R' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

export interface AlterCommand {
  name: string;
  sprite: string;
}

export interface MoveCommand {
  name: string;
  position: 'L' | 'R' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
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
  static parseAction(text: string): { character: string; type: 'shake' | 'jump_up' | 'jump_down' | 'near' | 'away' } | undefined {
    const match = text.match(/\[action\|([^|]+)\|([^\]]+)\]/);
    if (!match) return undefined;

    return {
      character: match[1].trim(),
      type: match[2].trim() as 'shake' | 'jump_up' | 'jump_down' | 'near' | 'away',
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
      position: match[3].trim() as 'L' | 'R' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
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
      position: match[2].trim() as 'L' | 'R' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
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
  static resolveAssetUrl(alias: string, type: 'sprite' | 'bg' | 'cg' | 'bgm'): string {
    // 如果已经是完整URL，直接返回
    if (alias.startsWith('http://') || alias.startsWith('https://')) {
      return alias;
    }

    // 根据类型确定基础URL
    let baseUrl = '';
    let extension = '.png';

    switch (type) {
      case 'sprite':
        baseUrl = 'https://gitgud.io/RBQ/amakano3/-/raw/master/sprite/';
        extension = '.webp';
        break;
      case 'bg':
        baseUrl = 'https://gitgud.io/RBQ/amakano3/-/raw/master/bg/';
        extension = '.webp';
        break;
      case 'cg':
        baseUrl = 'https://gitgud.io/RBQ/amakano3/-/raw/master/cg/';
        extension = '.webp';
        break;
      case 'bgm':
        baseUrl = 'https://gitgud.io/RBQ/amakano3/-/raw/master/bgm/';
        extension = '.mp3';
        break;
    }

    // CG 类型特殊处理：系列随机选择
    if (type === 'cg') {
      // 检测是否已经包含序号（如 "冬桦被舔小穴2"）
      const numberMatch = alias.match(/^(.+?)(\d+)$/);

      if (numberMatch) {
        // 已经指定序号，直接使用
        const finalAlias = alias;

        // 如果已经有扩展名，直接使用
        if (/\.(png|jpg|jpeg|gif|webp|mp3|ogg|wav)$/i.test(finalAlias)) {
          return `${baseUrl}${finalAlias}`;
        }

        // 添加默认扩展名
        return `${baseUrl}${finalAlias}${extension}`;
      } else {
        // 没有指定序号，检查是否是系列名
        if (cgSeriesConfig[alias]) {
          // 是系列名，随机选择一个序号
          const count = cgSeriesConfig[alias];
          const randomIndex = Math.floor(Math.random() * count) + 1;
          const finalAlias = `${alias}${randomIndex}`;

          console.log(`[CG系列随机] ${alias} -> ${finalAlias} (共${count}张)`);

          // 如果已经有扩展名，直接使用
          if (/\.(png|jpg|jpeg|gif|webp|mp3|ogg|wav)$/i.test(finalAlias)) {
            return `${baseUrl}${finalAlias}`;
          }

          // 添加默认扩展名
          return `${baseUrl}${finalAlias}${extension}`;
        }
        // 不是系列名，按原逻辑处理（可能是单张CG或不存在的CG）
      }
    }

    // 如果已经有扩展名，直接使用
    if (/\.(png|jpg|jpeg|gif|webp|mp3|ogg|wav)$/i.test(alias)) {
      return `${baseUrl}${alias}`;
    }

    // 添加默认扩展名
    return `${baseUrl}${alias}${extension}`;
  }
}
