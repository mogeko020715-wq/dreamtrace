export interface Stats {
  hp: number;
  maxHp: number;
  san: number;
  maxSan: number;
  atk: number;
  def: number;
  gold: number;
}

export interface Relic {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export type EnemyKind = 'mob' | 'boss' | 'final';

export interface Enemy {
  id: string;
  name: string;
  icon: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  kind: EnemyKind;
  intro: string;
}

export interface Effect {
  hp?: number;
  maxHp?: number;
  san?: number;
  maxSan?: number;
  atk?: number;
  def?: number;
  gold?: number;
  healPct?: number; // 按最大生命百分比回复
  relic?: string; // 遗物 id，或 'random'
  combat?: string; // 敌人 id，或 'random'
  depth?: number; // 额外深入
  nextEvent?: string; // 连锁：紧接着触发指定事件（不推进深度）
  removeCurse?: boolean; // 净化：移除一件诅咒遗物
  log: string;
}

export interface Choice {
  text: string;
  hint?: string;
  requires?: { stat: 'gold' | 'san'; min: number };
  requiresCurse?: boolean; // 身上需带有诅咒遗物才可选
  effect?: Effect;
  gamble?: { chance: number; success: Effect; fail: Effect };
}

export interface GameEvent {
  id: string;
  title: string;
  icon: string;
  text: string;
  choices: Choice[];
  minDepth?: number;
  chainOnly?: boolean; // 仅由连锁触发，不进随机池
}

export type LogTone = 'info' | 'good' | 'bad' | 'combat' | 'system' | 'relic';

export interface LogEntry {
  id: number;
  text: string;
  tone: LogTone;
}

export interface CombatState {
  enemy: Enemy;
  fled: boolean;
  rounds: number; // 战斗回合数：Boss 超过 8 回合进入狂暴
}

export type RunPhase = 'event' | 'combat' | 'dead' | 'victory';

export interface RunState {
  stats: Stats;
  relics: string[];
  depth: number;
  kills: number;
  current: GameEvent;
  combat: CombatState | null;
  log: LogEntry[];
  phase: RunPhase;
  deathCause?: string;
  recentEvents: string[];
  bossesDone: number[];
  seenEvents: string[];
  seenEnemies: string[];
  seenRelics: string[];
  nightmare: boolean;
  dustEarned: number;
}

export interface CodexState {
  events: string[];
  enemies: string[];
  relics: string[];
}

export interface MetaState {
  dust: number;
  upgrades: {
    vitality: number; // 初始生命
    power: number; // 初始攻击
    mind: number; // 初始精神
    fortune: number; // 初始梦晶
  };
  bestDepth: number;
  runs: number;
  victories: number;
  nightmareVictories: number; // 梦魇难度通关次数（≥1 解锁称号「清醒者」）
  codex: CodexState;
  nightmare: boolean; // 梦魇难度开关（通关后解锁）
}
