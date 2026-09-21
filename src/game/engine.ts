import type {
  Choice, Effect, Enemy, GameEvent, LogEntry, LogTone, MetaState, RunState, Stats,
} from './types';
import { CURSED_RELICS, EVENTS, RELICS, relicById, spawnBoss, spawnMob } from './data';

// ───────────────────────────── 局外成长（轮回殿） ─────────────────────────────

const META_KEY = 'dream-journey-meta-v1';

export const UPGRADES = [
  { id: 'vitality' as const, name: '强韧之魂', icon: '❤️', desc: '每级初始生命上限 +12', max: 10 },
  { id: 'power' as const, name: '觉醒之力', icon: '⚔️', desc: '每级初始攻击 +2', max: 10 },
  { id: 'mind' as const, name: '澄明之心', icon: '🧠', desc: '每级初始精神上限 +8', max: 10 },
  { id: 'fortune' as const, name: '衔金之梦', icon: '💰', desc: '每级初始梦晶 +15', max: 10 },
];

export function upgradeCost(level: number): number {
  return 25 * (level + 1);
}

export function defaultMeta(): MetaState {
  return {
    dust: 0,
    upgrades: { vitality: 0, power: 0, mind: 0, fortune: 0 },
    bestDepth: 0,
    runs: 0,
    victories: 0,
    nightmareVictories: 0,
    codex: { events: [], enemies: [], relics: [] },
    nightmare: false,
  };
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw);
    const base = defaultMeta();
    return {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades ?? {}) },
      codex: { ...base.codex, ...(parsed.codex ?? {}) },
    };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: MetaState) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// ───────────────────────────── 工具 ─────────────────────────────

let logSeq = 1;
function mkLog(text: string, tone: LogTone): LogEntry {
  return { id: logSeq++, text, tone };
}

const rand = (n: number) => Math.floor(Math.random() * (n + 1));

const hasRelic = (run: RunState, id: string) => run.relics.includes(id);

export function effectiveAtk(run: RunState): number {
  let atk = run.stats.atk;
  if (hasRelic(run, 'thorn_crown')) atk += 3;
  if (hasRelic(run, 'blood_dagger')) atk += 4;
  if (hasRelic(run, 'broken_crown')) atk += 5;
  if (hasRelic(run, 'eye_of_dreamlord')) atk += 2;
  return atk;
}

export function effectiveDef(run: RunState): number {
  let def = run.stats.def;
  if (hasRelic(run, 'mirror_mask')) def += 2;
  if (hasRelic(run, 'broken_crown')) def -= 2;
  return def;
}

export function skillCost(run: RunState): number {
  return hasRelic(run, 'feather') ? 2 : 4;
}

// ───────────────────────────── 开局 ─────────────────────────────

export function newRun(meta: MetaState): RunState {
  const u = meta.upgrades;
  const stats: Stats = {
    hp: 46 + u.vitality * 12,
    maxHp: 46 + u.vitality * 12,
    san: 30 + u.mind * 8,
    maxSan: 30 + u.mind * 8,
    atk: 6 + u.power * 2,
    def: 0,
    gold: 10 + u.fortune * 15,
  };
  const run: RunState = {
    stats,
    relics: [],
    depth: 0,
    kills: 0,
    current: EVENTS[0],
    combat: null,
    log: [
      mkLog('你坠入了梦境。', 'system'),
      mkLog('传说走到梦境尽头的人，能带回一个愿望。', 'info'),
    ],
    phase: 'event',
    recentEvents: [],
    bossesDone: [],
    seenEvents: [],
    seenEnemies: [],
    seenRelics: [],
    nightmare: meta.nightmare ?? false,
    dustEarned: 0,
  };
  run.current = pickEvent(run);
  run.seenEvents = [run.current.id];
  return run;
}

function pickEvent(run: RunState): GameEvent {
  const pool = EVENTS.filter(
    (e) =>
      (e.minDepth ?? 0) <= run.depth &&
      !run.recentEvents.includes(e.id) &&
      // 已获得唯一遗物的专属事件降权处理：食梦貘有角后仍可出现（喂食无效），简单起见直接排除
      !(e.id === 'dream_eater' && hasRelic(run, 'tapir_horn')) &&
      !(e.id === 'mask' && hasRelic(run, 'mirror_mask')) &&
      !(e.id === 'cursed_box' && hasRelic(run, 'whisper_box')) &&
      !(e.id === 'thorn_throne' && hasRelic(run, 'broken_crown')) &&
      !e.chainOnly,
  );
  const ev = pool[Math.floor(Math.random() * pool.length)] ?? EVENTS[0];
  return ev;
}

// ───────────────────────────── 效果结算 ─────────────────────────────

function applyEffect(run: RunState, eff: Effect): RunState {
  const s = { ...run.stats };
  const log = [...run.log];
  const relics = [...run.relics];

  let goldDelta = eff.gold ?? 0;
  if (goldDelta > 0 && hasRelic(run, 'purse')) goldDelta = Math.ceil(goldDelta * 1.3);
  let sanDelta = eff.san ?? 0;
  if (sanDelta < 0 && hasRelic(run, 'lucid_ring')) sanDelta = -Math.ceil(-sanDelta / 2);

  if (eff.maxHp) { s.maxHp += eff.maxHp; s.hp += eff.maxHp; }
  if (eff.maxSan) { s.maxSan += eff.maxSan; s.san += eff.maxSan; }
  if (eff.healPct) s.hp = Math.min(s.maxHp, s.hp + Math.floor((s.maxHp * eff.healPct) / 100));
  s.hp = Math.min(s.maxHp, s.hp + (eff.hp ?? 0));
  s.san = Math.min(s.maxSan, s.san + sanDelta);
  s.atk += eff.atk ?? 0;
  s.def += eff.def ?? 0;
  s.gold = Math.max(0, s.gold + goldDelta);
  // 钳制：上限下降时当前值不得越界
  s.hp = Math.min(s.hp, s.maxHp);
  s.san = Math.min(s.san, s.maxSan);

  if (eff.removeCurse) {
    const idx = relics.findIndex((r) => CURSED_RELICS.includes(r));
    if (idx >= 0) {
      const [rid] = relics.splice(idx, 1);
      log.push(mkLog(`泉水没过头顶的那一刻，「${relicById(rid)?.name}」在你怀中化为乌有。反噬平息了。`, 'relic'));
    }
  }

  if (eff.relic) {
    let rid = eff.relic;
    if (rid === 'random') {
      const unowned = RELICS.filter((r) => !relics.includes(r.id) && r.id !== 'eye_of_dreamlord');
      rid = unowned.length > 0
        ? unowned[Math.floor(Math.random() * unowned.length)].id
        : '';
    }
    if (rid && !relics.includes(rid)) {
      relics.push(rid);
      log.push(mkLog(`获得遗物「${relicById(rid)?.name}」—— ${relicById(rid)?.desc}`, 'relic'));
    } else if (rid === '' || relics.includes(rid)) {
      s.gold += 20;
      log.push(mkLog('遗物化作了 20 枚梦晶。（遗物已集齐/重复）', 'info'));
    }
  }

  log.push(mkLog(eff.log, toneOf(eff)));

  const seenRelics = relics.length > run.relics.length
    ? [...new Set([...run.seenRelics, ...relics])]
    : run.seenRelics;

  let next: RunState = { ...run, stats: s, relics, log, seenRelics };

  if (eff.depth) next = { ...next, depth: next.depth + eff.depth };

  if (eff.combat) {
    const enemy: Enemy = eff.combat === 'random'
      ? spawnMob(next.depth, undefined, next.nightmare)
      : spawnMob(next.depth, eff.combat, next.nightmare);
    next = startCombat(next, enemy);
  }
  return next;
}

function toneOf(eff: Effect): LogTone {
  if (eff.combat) return 'combat';
  const bad = (eff.hp ?? 0) < 0 || (eff.san ?? 0) < 0;
  const good =
    (eff.hp ?? 0) > 0 || (eff.san ?? 0) > 0 || (eff.gold ?? 0) > 0 ||
    (eff.atk ?? 0) > 0 || (eff.def ?? 0) > 0 || !!eff.relic || !!eff.healPct;
  if (bad && !good) return 'bad';
  if (good && !bad) return 'good';
  return 'info';
}

// ───────────────────────────── 战斗 ─────────────────────────────

function startCombat(run: RunState, enemy: Enemy): RunState {
  const log = [...run.log, mkLog(enemy.intro, 'combat'), mkLog(`遭遇战斗：${enemy.icon} ${enemy.name}（生命 ${enemy.hp} / 攻击 ${enemy.atk} / 防御 ${enemy.def}）`, 'combat')];
  const seenEnemies = run.seenEnemies.includes(enemy.id) ? run.seenEnemies : [...run.seenEnemies, enemy.id];
  let next: RunState = { ...run, combat: { enemy, fled: false, rounds: 0 }, phase: 'combat', log, seenEnemies };
  if (hasRelic(next, 'blood_dagger')) {
    const s = { ...next.stats, hp: next.stats.hp - 3 };
    next = { ...next, stats: s, log: [...log, mkLog('棘梦匕首吮吸着你的体温。（生命 -3）', 'bad')] };
  }
  return next;
}

export type CombatAction = 'attack' | 'skill' | 'flee';

export function combatAction(run: RunState, action: CombatAction): RunState {
  if (!run.combat || run.phase !== 'combat') return run;
  const enemy = { ...run.combat.enemy };
  const s = { ...run.stats };
  const log = [...run.log];
  const atk = effectiveAtk(run);
  const def = effectiveDef(run);
  const isBoss = enemy.kind !== 'mob';
  let fleeFailed = false;
  const rounds = run.combat.rounds + 1;
  // Boss 狂暴：超过 8 回合攻击 ×1.5
  const enraged = isBoss && rounds > 8;
  const enemyAtk = enraged ? Math.ceil(enemy.atk * 1.5) : enemy.atk;
  if (enraged && rounds === 9) {
    log.push(mkLog(`${enemy.name} 的耐心耗尽了——它开始狂暴！（攻击提升）`, 'combat'));
  }

  if (action === 'flee') {
    if (isBoss) {
      log.push(mkLog('守护者封住了退路——此战唯有一胜！', 'combat'));
    } else if (Math.random() < 0.55) {
      log.push(mkLog(`你甩开了 ${enemy.name}，消失在梦的褶皱里。`, 'info'));
      return finishTurn({ ...run, combat: null, phase: 'event', log });
    } else {
      fleeFailed = true;
      log.push(mkLog('逃跑失败！对方抓住了你的破绽。', 'bad'));
      const dmg = Math.max(1, enemyAtk + rand(1) - def);
      s.hp -= dmg;
      log.push(mkLog(`${enemy.name} 对你造成 ${dmg} 点伤害。`, 'bad'));
    }
  } else if (action === 'skill') {
    const cost = skillCost(run);
    if (s.san < cost) {
      log.push(mkLog('精神不足，无法凝神！', 'bad'));
      return { ...run, log };
    }
    s.san -= cost;
    const mult = hasRelic(run, 'eye_of_dreamlord') ? 2.2 : 1.7;
    const dmg = Math.max(2, Math.floor(atk * mult) + rand(3) - enemy.def);
    enemy.hp -= dmg;
    log.push(mkLog(`你凝神一击，对 ${enemy.name} 造成 ${dmg} 点伤害！（精神 -${cost}）`, 'good'));
  } else {
    const dmg = Math.max(1, atk + rand(2) - enemy.def);
    enemy.hp -= dmg;
    log.push(mkLog(`你挥刃攻击，对 ${enemy.name} 造成 ${dmg} 点伤害。`, 'combat'));
  }

  // 敌人反击（逃跑失败已在上方结算过免费一击）
  if (enemy.hp > 0 && !fleeFailed) {
    const dmg = Math.max(1, enemyAtk + rand(1) - def);
    s.hp -= dmg;
    log.push(mkLog(`${enemy.name} ${action === 'flee' ? '趁你无路可退' : '反击'}，对你造成 ${dmg} 点伤害。`, 'bad'));
  }

  let next: RunState = { ...run, stats: s, log };

  // 战败
  if (s.hp <= 0) return die(next, `被 ${enemy.name} 击碎了梦境`);

  // 战胜
  if (enemy.hp <= 0) {
    return combatWin(next, enemy);
  }

  return { ...next, combat: { enemy, fled: false, rounds } };
}

function combatWin(run: RunState, enemy: Enemy): RunState {
  const s = { ...run.stats };
  const log = [...run.log];
  let relics = [...run.relics];
  const bossesDone = [...run.bossesDone];

  log.push(mkLog(`${enemy.icon} ${enemy.name} 溃散成一地碎光。你赢了！`, 'good'));

  let gold = enemy.kind === 'mob' ? 10 + Math.floor(run.depth / 2) + rand(5) : 30 + run.depth + rand(10);
  if (hasRelic(run, 'tapir_horn')) gold += 8;
  if (hasRelic(run, 'whisper_box')) gold += 10;
  if (hasRelic(run, 'purse')) gold = Math.ceil(gold * 1.3);
  s.gold += gold;
  s.san = Math.min(s.maxSan, s.san + 3);
  log.push(mkLog(`拾取梦晶 +${gold}，精神 +3。`, 'good'));

  if (enemy.kind !== 'mob') {
    bossesDone.push(enemy.kind === 'final' ? 30 : enemy.id === 'queen' ? 20 : 10);
    // 梦魇难度通关梦主：必掉隐藏遗物「梦主之瞳」
    if (enemy.kind === 'final' && run.nightmare && !relics.includes('eye_of_dreamlord')) {
      relics.push('eye_of_dreamlord');
      const r = relicById('eye_of_dreamlord')!;
      log.push(mkLog(`梦主溃散的余烬中，一只竖瞳缓缓睁开，望进了你的眼睛。获得隐藏遗物「${r.name}」！`, 'relic'));
    } else {
      const unowned = RELICS.filter((r) => !relics.includes(r.id) && r.id !== 'eye_of_dreamlord');
      if (unowned.length > 0) {
        const r = unowned[Math.floor(Math.random() * unowned.length)];
        relics.push(r.id);
        log.push(mkLog(`守护者遗落了一件遗物：「${r.name}」—— ${r.desc}`, 'relic'));
      }
    }
    if (hasRelic(run, 'candle')) {
      s.hp = s.maxHp;
      s.san = s.maxSan;
      log.push(mkLog('不灭烛火静静燃烧，你的生命与精神完全恢复了。', 'relic'));
    }
  }

  const seenRelics = relics.length > run.relics.length
    ? [...new Set([...run.seenRelics, ...relics])]
    : run.seenRelics;
  const next: RunState = { ...run, stats: s, log, relics, bossesDone, kills: run.kills + 1, combat: null, seenRelics };

  if (enemy.kind === 'final') {
    return { ...next, phase: 'victory', log: [...next.log, mkLog('梦境尽头，你睁开了眼睛——而你手中，握着一个愿望。', 'system')] };
  }
  return finishTurn({ ...next, phase: 'event' });
}

// ───────────────────────────── 回合推进 ─────────────────────────────

export function applyChoice(run: RunState, choiceIdx: number): RunState {
  if (run.phase !== 'event') return run;
  const choice: Choice = run.current.choices[choiceIdx];
  if (!choice) return run;
  if (choice.requires) {
    const v = run.stats[choice.requires.stat];
    if (v < choice.requires.min) return run; // UI 层也会禁用
  }
  if (choice.requiresCurse && !run.relics.some((r) => CURSED_RELICS.includes(r))) return run;

  let eff: Effect | undefined;
  if (choice.gamble) {
    const ok = Math.random() < choice.gamble.chance;
    eff = ok ? choice.gamble.success : choice.gamble.fail;
  } else {
    eff = choice.effect;
  }

  let next = run;
  if (eff) next = applyEffect(run, eff);

  if (next.phase === 'combat') return next;

  // 连锁事件：同一场景继续，不推进深度
  if (eff?.nextEvent) {
    const dead = checkDeath(next);
    if (dead) return dead;
    const ev = EVENTS.find((e) => e.id === eff.nextEvent);
    if (ev) {
      return {
        ...next,
        current: ev,
        seenEvents: next.seenEvents.includes(ev.id) ? next.seenEvents : [...next.seenEvents, ev.id],
        log: [...next.log, mkLog(`【连锁】${ev.icon} ${ev.title}`, 'system')],
      };
    }
  }

  return finishTurn(next);
}

function finishTurn(run: RunState): RunState {
  // 死亡判定
  const dead = checkDeath(run);
  if (dead) return dead;

  const s = { ...run.stats };
  const log = [...run.log];

  // 深入一层
  let depth = run.depth + 1;

  // 遗物：回合钩子
  if (hasRelic(run, 'moon_shard')) s.hp = Math.min(s.maxHp, s.hp + 2);
  if (hasRelic(run, 'thorn_crown')) s.san -= 1;
  if (hasRelic(run, 'whisper_box')) s.san -= 2;

  let next: RunState = { ...run, stats: s, depth, log };

  // 深入过程中的精神伤害也可能致死
  const dead2 = checkDeath(next);
  if (dead2) return dead2;

  // Boss 节点
  for (const t of [10, 20, 30]) {
    if (depth >= t && !next.bossesDone.includes(t)) {
      next = { ...next, bossesDone: [...next.bossesDone, t] };
      const boss = spawnBoss(t, next.nightmare);
      const withMsg: RunState = { ...next, log: [...next.log, mkLog(`—— 梦境第 ${t} 层 · 守护者现身 ——`, 'system')] };
      return startCombat(withMsg, boss);
    }
  }

  // 抽取下一个事件
  const ev = pickEvent(next);
  next = {
    ...next,
    current: ev,
    recentEvents: [...next.recentEvents, ev.id].slice(-3),
    seenEvents: next.seenEvents.includes(ev.id) ? next.seenEvents : [...next.seenEvents, ev.id],
    log: [...next.log, mkLog(`【梦境深度 ${next.depth}】${ev.icon} ${ev.title}`, 'system')],
  };
  return next;
}

function checkDeath(run: RunState): RunState | null {
  if (run.stats.hp <= 0) return die(run, '生命耗尽，梦境碎裂');
  if (run.stats.san <= 0) return die(run, '精神涣散，迷失在梦中');
  return null;
}

function die(run: RunState, cause: string): RunState {
  const dust = calcDust(run, false);
  return {
    ...run,
    phase: 'dead',
    deathCause: cause,
    dustEarned: dust,
    combat: null,
    log: [...run.log, mkLog(`${cause}。你在深夜惊醒，枕边落着一层细碎的尘。`, 'system')],
  };
}

export function calcDust(run: RunState, victory: boolean): number {
  let dust = run.depth * 3 + run.kills * 2 + (victory ? 60 : 0);
  if (hasRelic(run, 'stardust')) dust = Math.floor(dust * 1.5);
  if (run.nightmare) dust = Math.floor(dust * 1.5);
  return dust;
}

// ───────────────────────────── 轮回结算 ─────────────────────────────

export function settleRun(run: RunState, meta: MetaState): MetaState {
  const victory = run.phase === 'victory';
  const dust = victory ? calcDust(run, true) : run.dustEarned;
  return {
    ...meta,
    dust: meta.dust + dust,
    bestDepth: Math.max(meta.bestDepth, run.depth),
    runs: meta.runs + 1,
    victories: meta.victories + (victory ? 1 : 0),
    nightmareVictories: meta.nightmareVictories + (victory && run.nightmare ? 1 : 0),
    codex: {
      events: [...new Set([...meta.codex.events, ...run.seenEvents])],
      enemies: [...new Set([...meta.codex.enemies, ...run.seenEnemies])],
      relics: [...new Set([...meta.codex.relics, ...run.seenRelics])],
    },
  };
}
