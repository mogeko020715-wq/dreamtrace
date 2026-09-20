import { useEffect, useMemo, useRef, useState } from 'react';
import type { LogTone, MetaState, RunState } from './game/types';
import {
  UPGRADES, applyChoice, calcDust, combatAction, effectiveAtk, effectiveDef,
  loadMeta, newRun, saveMeta, settleRun, skillCost, upgradeCost,
} from './game/engine';
import { ALL_ENEMIES, EVENTS, RELICS, hasCurse, relicById } from './game/data';

const toneColor: Record<LogTone, string> = {
  info: 'text-indigo-200/80',
  good: 'text-emerald-300',
  bad: 'text-rose-300',
  combat: 'text-amber-300',
  system: 'text-violet-300 font-medium',
  relic: 'text-yellow-200',
};

function Bar({ value, max, from, to }: { value: number; max: number; from: string; to: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${from} ${to} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function App() {
  const [meta, setMeta] = useState<MetaState>(loadMeta);
  const [screen, setScreen] = useState<'title' | 'meta' | 'game' | 'codex'>('title');
  const [run, setRun] = useState<RunState | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [run?.log.length]);

  const startRun = () => {
    setRun(newRun(meta));
    setScreen('game');
  };

  const settle = (r: RunState) => {
    const next = settleRun(r, meta);
    setMeta(next);
    saveMeta(next);
    return next;
  };

  const afterEnd = (r: RunState, again: boolean) => {
    const m = settle(r);
    if (again) {
      setRun(newRun(m));
    } else {
      setRun(null);
      setScreen('title');
    }
  };

  return (
    <div className="min-h-screen bg-[#07040f] font-serif text-indigo-100 [background-image:radial-gradient(ellipse_at_top,rgba(88,60,180,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(20,80,120,0.15),transparent_60%)]">
      {screen === 'title' && <TitleScreen meta={meta} onStart={startRun} onMeta={() => setScreen('meta')} onCodex={() => setScreen('codex')} onToggleNightmare={() => {
        const next = { ...meta, nightmare: !meta.nightmare };
        setMeta(next);
        saveMeta(next);
      }} />}
      {screen === 'codex' && <CodexScreen meta={meta} onBack={() => setScreen('title')} />}
      {screen === 'meta' && (
        <MetaScreen meta={meta} onBack={() => setScreen('title')} onBuy={(id) => {
          const level = meta.upgrades[id];
          const cost = upgradeCost(level);
          if (meta.dust < cost || level >= 10) return;
          const next: MetaState = { ...meta, dust: meta.dust - cost, upgrades: { ...meta.upgrades, [id]: level + 1 } };
          setMeta(next);
          saveMeta(next);
        }} />
      )}
      {screen === 'game' && run && (
        <GameScreen
          run={run}
          logRef={logRef}
          onChoice={(i) => setRun(applyChoice(run, i))}
          onCombat={(a) => setRun(combatAction(run, a))}
          onEnd={afterEnd}
        />
      )}
    </div>
  );
}

// ───────────────────────────── 标题 ─────────────────────────────

/** 全局按钮语言：哑金细线 · 宋体质感 · 提灯暖光 hover */
const BTN_BASE =
  'cursor-pointer rounded border border-[#c9a86a]/45 bg-transparent px-8 py-3 text-base tracking-[0.35em] text-[#dcd6c8] transition-all duration-300 hover:border-[#c9a86a]/90 hover:text-[#f5edd8] hover:shadow-[0_0_26px_rgba(201,168,106,0.25)]';
const BTN_PRIMARY =
  BTN_BASE + ' bg-gradient-to-br from-[#c9a86a]/25 to-[#c9a86a]/10 text-[#f0e6cd]';

function TitleScreen({ meta, onStart, onMeta, onCodex, onToggleNightmare }: { meta: MetaState; onStart: () => void; onMeta: () => void; onCodex: () => void; onToggleNightmare: () => void }) {
  const seenTotal = meta.codex.events.length + meta.codex.enemies.length + meta.codex.relics.length;
  const allTotal = EVENTS.length + ALL_ENEMIES.length + RELICS.length;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 overflow-hidden px-5 py-10 text-center [background:radial-gradient(ellipse_90%_70%_at_50%_30%,#171029_0%,#0a0616_55%,#05030c_100%)]">
      <div>
        <div className="text-5xl tracking-[0.55em] text-[#e9e2f5] drop-shadow-[0_0_30px_rgba(167,139,250,0.55)] md:text-6xl">溯 梦</div>
        <div className="mt-3 text-[11px] tracking-[0.5em] text-violet-300/50">D R E A M T R A C E</div>
        {meta.nightmareVictories >= 1 && (
          <div className="mt-3 inline-block rounded-full border border-red-300/40 bg-gradient-to-r from-red-500/15 via-amber-400/15 to-red-500/15 px-5 py-1 text-xs tracking-[0.4em] text-amber-200">
            👁️ 清 醒 者 {meta.nightmareVictories > 1 ? `× ${meta.nightmareVictories}` : ''}
          </div>
        )}
      </div>

      {/* 画廊画框：哑金双细线 */}
      <div className="border border-[#c9a86a]/55 bg-[#080510]/60 p-3 shadow-[0_0_60px_rgba(201,168,106,0.10),0_30px_80px_rgba(0,0,0,0.7)]">
        <div className="border border-[#c9a86a]/30 p-1">
          <img src="./art/ui-title.webp" alt="梦境之门" className="h-[42vh] w-auto max-w-[86vw] object-cover" />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onStart} className={BTN_PRIMARY}>入 梦</button>
        <button onClick={onMeta} className={BTN_BASE}>轮回殿</button>
        <button onClick={onCodex} className={BTN_BASE}>梦境图鉴</button>
      </div>

      <div className="flex items-center gap-4 text-xs tracking-[0.3em] text-[#c9a86a]/70">
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a86a]/50 md:w-24" />
        一 梦 一 轮 回
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a86a]/50 md:w-24" />
      </div>

      <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-[11px] tracking-[0.25em] text-indigo-300/60">
        <span>梦尘 ✨ {meta.dust}</span>
        <span>最深 {meta.bestDepth} 层</span>
        <span>入梦 {meta.runs} 次</span>
        <span>抵达尽头 {meta.victories} 次</span>
        <span>图鉴 {seenTotal} / {allTotal}</span>
      </div>

      {meta.victories >= 1 && (
        <button
          onClick={onToggleNightmare}
          className={`rounded border px-6 py-2 text-sm tracking-[0.25em] transition-all duration-300 ${
            meta.nightmare
              ? 'border-red-400/60 bg-red-500/15 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
              : 'border-[#c9a86a]/25 text-indigo-300/50 hover:border-[#c9a86a]/60 hover:text-[#dcd6c8]'
          }`}
        >
          {meta.nightmare ? '👁️ 梦魇难度 · 已开启' : '👁️ 梦魇难度 · 关闭'}
          <div className="mt-1 text-[10px] tracking-normal opacity-70">敌人大幅强化 · 梦尘 +50%</div>
        </button>
      )}
    </div>
  );
}

// ───────────────────────────── 梦境图鉴 ─────────────────────────────

function CodexScreen({ meta, onBack }: { meta: MetaState; onBack: () => void }) {
  const [tab, setTab] = useState<'events' | 'enemies' | 'relics'>('events');
  const tabs = [
    { id: 'events' as const, name: '梦境见闻', seen: meta.codex.events.length, total: EVENTS.length },
    { id: 'enemies' as const, name: '梦魇众生', seen: meta.codex.enemies.length, total: ALL_ENEMIES.length },
    { id: 'relics' as const, name: '梦中遗物', seen: meta.codex.relics.length, total: RELICS.length },
  ];
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-12">
      <div className="mb-1 text-3xl tracking-[0.4em] text-cyan-200 drop-shadow-[0_0_20px_rgba(103,232,249,0.4)]">梦 境 图 鉴</div>
      <p className="mb-8 text-sm text-indigo-200/60">每一世见过的事物，醒来后便记在枕边。</p>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded border px-4 py-2 text-sm tracking-wider transition-all duration-300 ${
              tab === t.id
                ? 'border-[#c9a86a]/80 bg-[#c9a86a]/15 text-[#f0e6cd] shadow-[0_0_18px_rgba(201,168,106,0.15)]'
                : 'border-[#c9a86a]/25 text-indigo-300/60 hover:border-[#c9a86a]/60 hover:text-[#dcd6c8]'
            }`}
          >
            {t.name} <span className="ml-1 text-xs opacity-70">{t.seen}/{t.total}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {tab === 'events' && EVENTS.map((e) => {
          const seen = meta.codex.events.includes(e.id);
          return (
            <div key={e.id} className={`rounded border p-4 ${seen ? 'border-[#c9a86a]/20 bg-[#0b0716]/60' : 'border-white/5'}`}>
              <div className={`mb-1 text-lg ${seen ? 'text-indigo-100' : 'text-indigo-300/30'}`}>
                {seen ? `${e.icon} ${e.title}` : '❔ ？？？'}
                {seen && e.minDepth ? <span className="ml-2 text-xs text-indigo-300/50">深度 {e.minDepth}+ 出现</span> : null}
              </div>
              <div className={`text-sm leading-6 ${seen ? 'text-indigo-200/60' : 'text-indigo-300/25'}`}>
                {seen ? e.text : '尚未在梦中遇见。'}
              </div>
            </div>
          );
        })}
        {tab === 'enemies' && ALL_ENEMIES.map((e) => {
          const seen = meta.codex.enemies.includes(e.id);
          return (
            <div key={e.id} className={`rounded border p-4 ${seen ? 'border-rose-300/20 bg-rose-400/[0.04]' : 'border-white/5'}`}>
              <div className={`mb-1 text-lg ${seen ? 'text-rose-100' : 'text-indigo-300/30'}`}>
                {seen ? `${e.icon} ${e.name}` : '❔ ？？？'}
                {seen && (
                  <span className="ml-2 text-xs text-indigo-300/50">
                    {e.kind === 'final' ? '梦之主宰' : e.kind === 'boss' ? '梦境守护者' : '梦魇'} · 生命 {e.maxHp} · 攻击 {e.atk} · 防御 {e.def}
                  </span>
                )}
              </div>
              <div className={`text-sm leading-6 ${seen ? 'text-indigo-200/60' : 'text-indigo-300/25'}`}>
                {seen ? e.intro : '尚未与它交手。'}
              </div>
            </div>
          );
        })}
        {tab === 'relics' && RELICS.map((r) => {
          const seen = meta.codex.relics.includes(r.id);
          return (
            <div key={r.id} className={`rounded border p-4 ${seen ? 'border-[#c9a86a]/25 bg-[#c9a86a]/[0.05]' : 'border-white/5'}`}>
              <div className={`mb-1 text-lg ${seen ? 'text-[#f0e6cd]' : 'text-indigo-300/30'}`}>
                {seen ? `${r.icon} ${r.name}` : '❔ ？？？'}
              </div>
              <div className={`text-sm leading-6 ${seen ? 'text-indigo-200/60' : 'text-indigo-300/25'}`}>
                {seen ? r.desc : '尚未拾得。'}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onBack} className="mt-10 self-center rounded border border-[#c9a86a]/45 px-8 py-2 text-sm tracking-[0.3em] text-[#dcd6c8]/80 transition-all duration-300 hover:border-[#c9a86a]/90 hover:text-[#f5edd8] hover:shadow-[0_0_20px_rgba(201,168,106,0.2)]">
        返 回
      </button>
    </div>
  );
}

// ───────────────────────────── 轮回殿 ─────────────────────────────

function MetaScreen({ meta, onBack, onBuy }: { meta: MetaState; onBack: () => void; onBuy: (id: keyof MetaState['upgrades']) => void }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <img src="./art/scene-samsara-hall.webp" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#07040f]/80 via-[#07040f]/60 to-[#07040f]/90" />
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col px-6 py-12">
      <div className="mb-1 text-3xl tracking-[0.4em] text-amber-200 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">轮 回 殿</div>
      <p className="mb-8 text-sm text-indigo-200/60">每一世的尘埃，都是下一世的根基。</p>

      <div className="mb-8 rounded border border-[#c9a86a]/40 bg-[#c9a86a]/[0.08] px-5 py-3 text-[#f0e6cd]">
        持有梦尘：<span className="text-xl">✨ {meta.dust}</span>
      </div>

      <div className="flex flex-col gap-4">
        {UPGRADES.map((u) => {
          const level = meta.upgrades[u.id];
          const cost = upgradeCost(level);
          const maxed = level >= u.max;
          const affordable = meta.dust >= cost;
          return (
            <div key={u.id} className="flex items-center justify-between rounded border border-[#c9a86a]/20 bg-[#0b0716]/70 p-4">
              <div>
                <div className="mb-1 text-lg text-indigo-100">{u.icon} {u.name} <span className="ml-2 text-sm text-indigo-300/60">Lv.{level}</span></div>
                <div className="text-sm text-indigo-200/60">{u.desc}</div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: u.max }).map((_, i) => (
                    <span key={i} className={`h-1.5 w-4 rounded-full ${i < level ? 'bg-amber-300' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
              <button
                disabled={maxed || !affordable}
                onClick={() => onBuy(u.id)}
                className={`ml-4 shrink-0 rounded border px-4 py-2 text-sm tracking-wider transition-all duration-300 ${
                  maxed
                    ? 'cursor-default border-white/5 text-indigo-300/40'
                    : affordable
                      ? 'border-[#c9a86a]/60 bg-[#c9a86a]/15 text-[#f0e6cd] hover:border-[#c9a86a]/90 hover:shadow-[0_0_18px_rgba(201,168,106,0.2)]'
                      : 'cursor-not-allowed border-white/5 text-indigo-300/40'
                }`}
              >
                {maxed ? '已满级' : `✨ ${cost}`}
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={onBack} className="mt-10 self-center rounded border border-[#c9a86a]/45 px-8 py-2 text-sm tracking-[0.3em] text-[#dcd6c8]/80 transition-all duration-300 hover:border-[#c9a86a]/90 hover:text-[#f5edd8] hover:shadow-[0_0_20px_rgba(201,168,106,0.2)]">
        返 回
      </button>
      </div>
    </div>
  );
}

// ───────────────────────────── 对局 ─────────────────────────────

function GameScreen({
  run, logRef, onChoice, onCombat, onEnd,
}: {
  run: RunState;
  logRef: React.RefObject<HTMLDivElement | null>;
  onChoice: (i: number) => void;
  onCombat: (a: 'attack' | 'skill' | 'flee') => void;
  onEnd: (r: RunState, again: boolean) => void;
}) {
  const s = run.stats;
  const ended = run.phase === 'dead' || run.phase === 'victory';
  const dust = run.phase === 'victory' ? calcDust(run, true) : run.dustEarned;
  const cost = skillCost(run);
  const [showRelics, setShowRelics] = useState(false);
  const [dismissedIntro, setDismissedIntro] = useState<string | null>(null);
  const bossEnemy = run.combat && run.combat.enemy.kind !== 'mob' ? run.combat.enemy : null;
  const bossIntroKey = bossEnemy ? `${bossEnemy.id}-${run.depth}` : null;
  const showBossIntro = bossEnemy !== null && dismissedIntro !== bossIntroKey;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      {/* 顶部状态栏 */}
      <div className="mb-4 rounded border border-[#c9a86a]/20 bg-[#0b0716]/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between text-xs tracking-widest text-indigo-300/70">
          <span>梦 境 深 度{run.nightmare && <span className="ml-2 text-red-300">👁️ 梦魇</span>}</span>
          <span className="text-violet-200">{run.depth} / 30 层</span>
        </div>
        <Bar value={run.depth} max={30} from="from-violet-500" to="to-fuchsia-400" />
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm"><span>❤️ 生命</span><span className="text-rose-200">{s.hp} / {s.maxHp}</span></div>
            <Bar value={s.hp} max={s.maxHp} from="from-rose-500" to="to-red-400" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm"><span>🧠 精神</span><span className="text-sky-200">{s.san} / {s.maxSan}</span></div>
            <Bar value={s.san} max={s.maxSan} from="from-sky-500" to="to-cyan-400" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-indigo-200/80">
          <span>⚔️ 攻击 {effectiveAtk(run)}</span>
          <span>🛡️ 防御 {effectiveDef(run)}</span>
          <span>💰 梦晶 {s.gold}</span>
          <span>💀 击杀 {run.kills}</span>
        </div>
        {run.relics.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#c9a86a]/15 pt-3">
            {run.relics.map((id) => {
              const r = relicById(id);
              return r ? (
                <button
                  key={id}
                  onClick={() => setShowRelics(true)}
                  title={`${r.name}：${r.desc}`}
                  className="cursor-pointer rounded-full border border-[#c9a86a]/35 bg-[#c9a86a]/10 px-2.5 py-1 text-xs text-[#f0e6cd] transition hover:border-[#c9a86a]/80 hover:bg-[#c9a86a]/20"
                >
                  {r.icon} {r.name}
                </button>
              ) : null;
            })}
            <button
              onClick={() => setShowRelics(true)}
              className="rounded-full border border-[#c9a86a]/20 px-2.5 py-1 text-xs text-indigo-300/50 transition hover:border-[#c9a86a]/50 hover:text-[#dcd6c8]"
            >
              查看效果
            </button>
          </div>
        )}
      </div>

      {/* 主面板：事件 / 战斗 */}
      <div className="mb-4 rounded border border-[#c9a86a]/25 bg-gradient-to-b from-[#c9a86a]/[0.06] to-transparent p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        {run.phase === 'combat' && run.combat ? (
          <CombatPanel run={run} onCombat={onCombat} skillCost={cost} />
        ) : (
          <>
            <div className="mb-3 text-2xl tracking-widest text-[#ece5f7]">
              {run.current.icon} {run.current.title}
            </div>
            <p className="mb-6 leading-8 text-indigo-100/85">{run.current.text}</p>
            <div className="flex flex-col gap-3">
              {run.current.choices.map((c, i) => {
                const locked =
                  (c.requires ? run.stats[c.requires.stat] < c.requires.min : false) ||
                  (c.requiresCurse ? !hasCurse(run.relics) : false);
                return (
                  <button
                    key={i}
                    disabled={locked || ended}
                    onClick={() => onChoice(i)}
                    className={`rounded border px-5 py-3 text-left transition-all duration-300 ${
                      locked
                        ? 'cursor-not-allowed border-white/5 text-indigo-300/30'
                        : 'border-[#c9a86a]/30 text-[#e3ddcf] hover:border-[#c9a86a]/80 hover:bg-[#c9a86a]/[0.08] hover:shadow-[0_0_20px_rgba(201,168,106,0.15)]'
                    }`}
                  >
                    <span className="mr-2 text-[#c9a86a]">{['壹', '贰', '叁', '肆'][i]}.</span>
                    {c.text}
                    {c.hint && <span className="ml-2 text-xs text-indigo-300/50">（{c.hint}）</span>}
                    {locked && <span className="ml-2 text-xs text-rose-300/60">（条件不足）</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 日志 */}
      <div ref={logRef} className="h-48 overflow-y-auto rounded border border-[#c9a86a]/15 bg-black/50 p-4 text-sm leading-7">
        {run.log.map((l) => (
          <div key={l.id} className={toneColor[l.tone]}>{l.text}</div>
        ))}
      </div>

      {/* 遗物一览浮层 */}
      {showRelics && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowRelics(false)}>
          <div className="w-full max-w-md rounded border border-[#c9a86a]/30 bg-[#0d0819] p-6 shadow-[0_0_60px_rgba(201,168,106,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 text-xl tracking-[0.3em] text-[#f0e6cd]">本世的遗物</div>
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
              {run.relics.map((id) => {
                const r = relicById(id);
                return r ? (
                  <div key={id} className="rounded border border-[#c9a86a]/20 bg-[#c9a86a]/[0.06] p-3">
                    <div className="mb-1 text-[#f0e6cd]">{r.icon} {r.name}</div>
                    <div className="text-sm leading-6 text-indigo-200/70">{r.desc}</div>
                  </div>
                ) : null;
              })}
            </div>
            <button
              onClick={() => setShowRelics(false)}
              className="mt-5 w-full rounded border border-[#c9a86a]/45 py-2 text-sm tracking-[0.3em] text-[#dcd6c8]/80 transition-all duration-300 hover:border-[#c9a86a]/90 hover:text-[#f5edd8]"
            >
              收 起
            </button>
          </div>
        </div>
      )}

      {/* Boss 登场过场 */}
      {showBossIntro && bossEnemy && bossIntroKey && (
        <div
          onClick={() => setDismissedIntro(bossIntroKey)}
          className="fixed inset-0 z-20 flex cursor-pointer flex-col items-center justify-end overflow-hidden bg-[#07040f]"
        >
          <img
            src={ENEMY_ART[bossEnemy.id]}
            alt={bossEnemy.name}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-0 drop-shadow-[0_0_60px_rgba(88,60,180,0.6)]"
            onLoad={(ev) => ev.currentTarget.classList.remove('opacity-0')}
            style={{ transition: 'opacity 1.2s ease-in' }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07040f] via-transparent to-[#07040f]/60" />
          <div className="relative z-10 mb-16 max-w-xl px-6 text-center">
            <div className="mb-2 text-xs tracking-[0.5em] text-rose-300/80">
              {bossEnemy.kind === 'final' ? '梦 之 主 宰' : '梦 境 守 护 者'}
            </div>
            <div className="mb-4 text-4xl tracking-[0.3em] text-rose-100 drop-shadow-[0_0_20px_rgba(244,63,94,0.5)]">
              {bossEnemy.icon} {bossEnemy.name}
            </div>
            <p className="mb-6 leading-7 text-indigo-100/85">{bossEnemy.intro}</p>
            <div className="text-xs tracking-[0.4em] text-indigo-300/50">点 击 任 意 处 · 拔 剑</div>
          </div>
        </div>
      )}

      {/* 结算浮层 */}
      {ended && (
        <div className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden">
          <img
            src={run.phase === 'victory' ? './art/scene-ending-victory.webp' : './art/scene-ending-death.webp'}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/55" />
          <div className="relative w-full max-w-md rounded border border-[#c9a86a]/30 bg-[#0d0819]/90 p-8 text-center shadow-[0_0_60px_rgba(201,168,106,0.15)] backdrop-blur-sm">
            {run.phase === 'victory' ? (
              <>
                <div className="mb-2 text-4xl tracking-[0.4em] text-amber-200 drop-shadow-[0_0_25px_rgba(251,191,36,0.7)]">梦 醒</div>
                {run.nightmare && (
                  <div className="mb-2 text-sm tracking-[0.3em] text-red-300">👁️ 梦魇难度通关 · 获得称号「清醒者」</div>
                )}
                <p className="mb-6 leading-7 text-indigo-100/80">
                  你走到了梦境的尽头。梦主溃散的那一刻，整个梦境为你静止了一瞬。
                  你握紧掌心的愿望，睁开了眼睛。
                </p>
              </>
            ) : (
              <>
                <div className="mb-2 text-4xl tracking-[0.4em] text-rose-300 drop-shadow-[0_0_25px_rgba(244,63,94,0.6)]">梦 碎</div>
                <p className="mb-6 leading-7 text-indigo-100/80">{run.deathCause}。</p>
              </>
            )}
            <div className="mb-6 flex justify-center gap-6 text-sm text-indigo-200/70">
              <span>抵达 {run.depth} 层</span>
              <span>击杀 {run.kills}</span>
              <span className="text-amber-200">梦尘 +{dust}</span>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => onEnd(run, true)}
                className={BTN_PRIMARY + ' !px-6 !py-2 !text-sm'}
              >
                再入轮回
              </button>
              <button
                onClick={() => onEnd(run, false)}
                className={BTN_BASE + ' !px-6 !py-2 !text-sm'}
              >
                回到现实
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────── 战斗面板 ─────────────────────────────

/** 敌人立绘（暂无立绘的敌人回退为图标） */
const ENEMY_ART: Record<string, string> = {
  knight: './art/boss-knight.webp',
  queen: './art/boss-queen.webp',
  dreamlord: './art/boss-dreamlord.webp',
  whisper: './art/mob-whisper.webp',
  pup: './art/mob-pup.webp',
  ghost: './art/mob-ghost.webp',
  ghoul: './art/mob-ghoul.webp',
  thief: './art/mob-thief.webp',
  eater: './art/mob-eater.webp',
  spider: './art/mob-spider.webp',
};

function CombatPanel({ run, onCombat, skillCost: cost }: { run: RunState; onCombat: (a: 'attack' | 'skill' | 'flee') => void; skillCost: number }) {
  const e = run.combat!.enemy;
  const isBoss = e.kind !== 'mob';
  const canSkill = run.stats.san >= cost;
  const kindLabel = useMemo(() => (e.kind === 'final' ? '梦之主宰' : e.kind === 'boss' ? '梦境守护者' : '梦魇'), [e.kind]);
  const art = ENEMY_ART[e.id];
  return (
    <div>
      <div className="mb-1 text-xs tracking-widest text-rose-300/70">⚔ {kindLabel} ⚔</div>
      {art ? (
        <div className="relative mb-3 overflow-hidden rounded border border-[#c9a86a]/25 bg-gradient-to-b from-[#151028] to-[#07040f]">
          <img src={art} alt={e.name} className={`mx-auto object-contain drop-shadow-[0_0_30px_rgba(88,60,180,0.45)] ${isBoss ? 'max-h-80' : 'max-h-64'}`} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-2 pt-8">
            <div className="text-2xl tracking-widest text-rose-100">{e.icon} {e.name}</div>
          </div>
        </div>
      ) : (
        <div className="mb-2 text-2xl tracking-widest text-rose-100">{e.icon} {e.name}</div>
      )}
      <div className="mb-1 flex justify-between text-sm text-indigo-200/70">
        <span>生命 {Math.max(0, e.hp)} / {e.maxHp}</span>
        <span>攻击 {e.atk} · 防御 {e.def}</span>
      </div>
      <Bar value={e.hp} max={e.maxHp} from="from-rose-600" to="to-orange-400" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button
          onClick={() => onCombat('attack')}
          className="rounded border border-rose-300/40 bg-rose-500/15 py-3 text-rose-100 transition-all duration-300 hover:bg-rose-500/30 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]"
        >
          攻 击
        </button>
        <button
          disabled={!canSkill}
          onClick={() => onCombat('skill')}
          className={`rounded border py-3 transition-all duration-300 ${
            canSkill
              ? 'border-sky-300/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]'
              : 'cursor-not-allowed border-white/10 text-indigo-300/30'
          }`}
        >
          凝神一击
          <div className="text-xs opacity-70">精神 -{cost} · 1.7 倍伤害</div>
        </button>
        <button
          disabled={isBoss}
          onClick={() => onCombat('flee')}
          className={`rounded border py-3 transition-all duration-300 ${
            isBoss
              ? 'cursor-not-allowed border-white/10 text-indigo-300/30'
              : 'border-indigo-300/30 text-indigo-100 hover:border-indigo-200/60 hover:bg-indigo-400/15'
          }`}
        >
          逃 离
          <div className="text-xs opacity-70">{isBoss ? '不死不休' : '55% 成功'}</div>
        </button>
      </div>
    </div>
  );
}
