import type { Enemy, GameEvent, Relic } from './types';

// ───────────────────────────── 遗物 ─────────────────────────────

export const RELICS: Relic[] = [
  { id: 'moon_shard', name: '月光碎片', icon: '🌙', desc: '每深入一层梦境，回复 2 点生命。' },
  { id: 'thorn_crown', name: '荆棘之冠', icon: '👑', desc: '攻击 +3，但每深入一层精神 -1。' },
  { id: 'tapir_horn', name: '梦貘之角', icon: '🦣', desc: '战斗胜利额外获得 8 梦晶。' },
  { id: 'feather', name: '沉眠之羽', icon: '🪶', desc: '「凝神一击」的精神消耗减半。' },
  { id: 'mirror_mask', name: '镜面具', icon: '🎭', desc: '防御 +2。' },
  { id: 'blood_dagger', name: '血契匕首', icon: '🗡️', desc: '攻击 +4，但每场战斗开始时失去 3 点生命。' },
  { id: 'candle', name: '不灭烛火', icon: '🕯️', desc: '击败每层守护者后，完全回复生命与精神。' },
  { id: 'stardust', name: '星尘瓶', icon: '✨', desc: '轮回时获得的梦尘 +50%。' },
  { id: 'purse', name: '饕餮钱袋', icon: '👛', desc: '从事件获得的梦晶 +30%。' },
  { id: 'lucid_ring', name: '清醒之戒', icon: '💍', desc: '受到的精神伤害减半（向上取整）。' },
  { id: 'whisper_box', name: '呢喃之匣', icon: '📦', desc: '【诅咒】每深入一层 MP -2，但战斗胜利额外获得 10 梦晶。' },
  { id: 'broken_crown', name: '碎梦王冠', icon: '👑', desc: '【诅咒】ATK +5，但 DEF -2。' },
  { id: 'eye_of_dreamlord', name: '梦主之瞳', icon: '👁️', desc: '【梦魇限定】攻击 +2，「凝神一击」伤害提升至 2.2 倍。唯有在梦魇尽头仍保持清醒者，方能持有此瞳。' },
];

export const relicById = (id: string) => RELICS.find((r) => r.id === id);

// ───────────────────────────── 敌人 ─────────────────────────────

const MOBS: Enemy[] = [
  { id: 'whisper', name: '低语之影', icon: '👤', hp: 14, maxHp: 14, atk: 5, def: 0, kind: 'mob', intro: '墙角的黑影立了起来，对你窃窃私语。' },
  { id: 'pup', name: '梦魇幼兽', icon: '🐺', hp: 18, maxHp: 18, atk: 6, def: 1, kind: 'mob', intro: '一只长着眼睛的雾兽低吼着扑来。' },
  { id: 'ghost', name: '镜中怨影', icon: '🪞', hp: 16, maxHp: 16, atk: 7, def: 0, kind: 'mob', intro: '碎镜里爬出另一个你，眼神怨毒。' },
  { id: 'ghoul', name: '食尸梦鬼', icon: '🧟', hp: 22, maxHp: 22, atk: 6, def: 2, kind: 'mob', intro: '腐臭的梦鬼拖着残躯逼近。' },
  { id: 'thief', name: '拾梦窃贼', icon: '🦝', hp: 15, maxHp: 15, atk: 5, def: 0, kind: 'mob', intro: '窃贼抱紧偷来的梦晶，龇牙咧嘴。' },
  { id: 'eater', name: '噬光者', icon: '🕷️', hp: 26, maxHp: 26, atk: 8, def: 1, kind: 'mob', intro: '一团会移动的黑暗亮起八只眼睛，周围的光正被它吸走。' },
  { id: 'spider', name: '织梦蛛', icon: '🕸️', hp: 24, maxHp: 24, atk: 7, def: 2, kind: 'mob', intro: '巨蛛倒挂在梦的经纬之间，每一根丝都连着一段别人的噩梦。' },
];

const BOSSES: Record<number, Enemy> = {
  10: { id: 'knight', name: '夜魇骑士', icon: '♞', hp: 52, maxHp: 52, atk: 9, def: 2, kind: 'boss', intro: '第一层梦境的守护者。黑甲骑士横剑拦住去路：「回头，或长眠。」' },
  20: { id: 'queen', name: '遗忘女王', icon: '👸', hp: 82, maxHp: 82, atk: 13, def: 4, kind: 'boss', intro: '第二层梦境的守护者。女王端坐白骨王座：「你叫什么？……想不起来，就留下吧。」' },
  30: { id: 'dreamlord', name: '梦 主', icon: '🌑', hp: 125, maxHp: 125, atk: 16, def: 5, kind: 'final', intro: '梦境尽头，万物的梦中倒影。它没有形状，因为你就是它的形状。' },
};

/** 梦魇难度加成：HP ×1.6，攻击 ×1.45，防御 +2 */
function nightmareScale(e: Enemy): Enemy {
  const hp = Math.ceil(e.hp * 1.6);
  return { ...e, hp, maxHp: hp, atk: Math.ceil(e.atk * 1.45), def: e.def + 2 };
}

export function spawnMob(depth: number, forceId?: string, nightmare = false): Enemy {
  const base = forceId
    ? MOBS.find((m) => m.id === forceId) ?? MOBS[0]
    : MOBS[Math.floor(Math.random() * MOBS.length)];
  const hp = base.hp + Math.round(depth * 1.4);
  const mob = { ...base, hp, maxHp: hp, atk: base.atk + Math.floor(depth / 5) };
  return nightmare ? nightmareScale(mob) : mob;
}

export function spawnBoss(depth: number, nightmare = false): Enemy {
  const key = depth >= 30 ? 30 : depth >= 20 ? 20 : 10;
  const boss = { ...BOSSES[key] };
  return nightmare ? nightmareScale(boss) : boss;
}

/** 图鉴用：全部敌人（梦魇 + 守护者） */
export const ALL_ENEMIES: Enemy[] = [...MOBS, BOSSES[10], BOSSES[20], BOSSES[30]];

/** 诅咒遗物 */
export const CURSED_RELICS = ['whisper_box', 'broken_crown'];

export const hasCurse = (relics: string[]) => relics.some((r) => CURSED_RELICS.includes(r));

// ───────────────────────────── 事件池 ─────────────────────────────

export const EVENTS: GameEvent[] = [
  {
    id: 'well', title: '月下古井', icon: '🌕',
    text: '井沿爬满青苔，井水倒映着一轮不属于任何夜晚的月亮。你听见井底传来细微的水声，像有人在低语。',
    choices: [
      { text: '投一枚梦晶许愿', hint: '梦晶 -5', requires: { stat: 'gold', min: 5 }, effect: { gold: -5, san: 8, log: '硬币坠入井中，月亮眨了眨眼。你感到内心一片宁静。（精神 +8）' } },
      { text: '掬一捧井水饮下', effect: { hp: 6, log: '井水清冽甘甜，伤口微微发热。（生命 +6）' } },
      { text: '凝望井底的月亮', hint: '未知的回响', gamble: { chance: 0.5,
        success: { maxSan: 4, san: 4, log: '你在月亮里看见了自己的前世。精神上限 +4。' },
        fail: { san: -6, log: '月亮突然睁开了眼睛！你仓皇移开视线。（精神 -6）' } } },
    ],
  },
  {
    id: 'mirror', title: '破碎的镜子', icon: '🪞',
    text: '路中央立着一面布满裂纹的落地镜。镜中的你慢半拍才跟上你的动作，嘴角挂着你不曾有过的笑。',
    choices: [
      { text: '与镜中人对视', hint: '一半一半', gamble: { chance: 0.5,
        success: { atk: 3, log: '镜中人向你点头致意，将一份力量渡给了你。（攻击 +3）' },
        fail: { san: -6, log: '镜中人突然贴到镜面上嘶吼！你踉跄后退。（精神 -6）' } } },
      { text: '打碎镜子', effect: { hp: -3, gold: 10, log: '碎片划伤了手，但你在镜框夹层里找到前人藏的梦晶。（生命 -3，梦晶 +10）' } },
      { text: '绕开它', effect: { log: '你不去看它。身后的镜子里，似乎有什么一直目送着你。' } },
    ],
  },
  {
    id: 'merchant', title: '游梦商人', icon: '🎪',
    text: '一个戴着高帽的商人支起小摊，货品漂浮在半空。「做梦也要讲实惠。」他冲你挤挤眼。',
    choices: [
      { text: '买一瓶回梦药水', hint: '梦晶 -20，生命 +15', requires: { stat: 'gold', min: 20 }, effect: { gold: -20, hp: 15, log: '药水入喉，暖意流遍全身。（生命 +15）' } },
      { text: '买一炷凝神香', hint: '梦晶 -15，精神 +10', requires: { stat: 'gold', min: 15 }, effect: { gold: -15, san: 10, log: '香烟袅袅，杂念尽消。（精神 +10）' } },
      { text: '买一柄锋利梦刃', hint: '梦晶 -35，攻击 +2', requires: { stat: 'gold', min: 35 }, effect: { gold: -35, atk: 2, log: '刀刃薄得像一层月光。（攻击 +2）' } },
      { text: '离开', effect: { log: '商人在背后喊：「下次可就涨价啦！」' } },
    ],
  },
  {
    id: 'shrine', title: '无名梦龛', icon: '⛩️',
    text: '一座小小的神龛嵌在树洞里，供奉着一块看不出形状的黑色石头，香火未熄。',
    choices: [
      { text: '虔诚祈祷', effect: { san: 8, log: '你双手合十。黑暗变得温柔了些。（精神 +8）' } },
      { text: '以血献祭', hint: '生命 -8，攻击 +2', effect: { hp: -8, atk: 2, log: '黑石吸走了你的血，吐出一缕红光没入掌心。（生命 -8，攻击 +2）' } },
      { text: '偷走供品', hint: '富贵险中求', gamble: { chance: 0.6,
        success: { gold: 20, log: '你揣起供品就跑，什么也没发生……暂时。（梦晶 +20）' },
        fail: { combat: 'whisper', log: '龛中黑石裂开，一道怨影扑了出来！' } } },
    ],
  },
  {
    id: 'campfire', title: '蓝火营地', icon: '🔥',
    text: '一堆蓝色的篝火在无风处静静燃烧，火边空无一人，木柴却添得很整齐。',
    choices: [
      { text: '烤火休息', hint: '回复 30% 生命', effect: { healPct: 30, log: '蓝火不烫，反而凉丝丝的。你沉沉打了个盹。（生命大幅回复）' } },
      { text: '替营地守夜', hint: '或有谢礼', gamble: { chance: 0.6,
        success: { gold: 15, log: '天亮前，一只看不见的手在你掌心放了几枚梦晶。（梦晶 +15）' },
        fail: { san: -6, log: '夜里一直有声音喊你的名字。你不敢答应。（精神 -6）' } } },
    ],
  },
  {
    id: 'door', title: '血色木门', icon: '🚪',
    text: '一扇鲜红的门突兀地立在旷野上，没有墙。门后传来抓挠声，一下，又一下。',
    choices: [
      { text: '推门而入', hint: '有埋伏', effect: { combat: 'random', log: '门后扑出一团黑影！' } },
      { text: '远远绕行', effect: { san: -2, log: '抓挠声跟了你一路才消失。（精神 -2）' } },
    ],
  },
  {
    id: 'library', title: '沉没图书馆', icon: '📚',
    text: '半截图书馆沉在湖水里，书籍干燥地漂浮着，书页像鱼群一样翻动。',
    choices: [
      { text: '静心阅读', hint: '精神上限 +4', effect: { maxSan: 4, san: 4, log: '你读到一个关于清醒的故事。精神上限 +4。' } },
      { text: '撕下金箔书页', effect: { gold: 12, san: -3, log: '书群愤怒地扑打你，但你抢到了一页纯金序言。（梦晶 +12，精神 -3）' } },
    ],
  },
  {
    id: 'puppet', title: '提线木偶', icon: '🎎',
    text: '一具木偶被看不见的线吊在半空，关节处缠着红线。它转动眼珠看你：「帮帮我。」',
    choices: [
      { text: '剪断它的线', hint: '或许有回报', gamble: { chance: 0.5,
        success: { relic: 'random', log: '木偶落地向你鞠了一躬，留下一件发光的遗物。' },
        fail: { hp: -5, log: '线断了，木偶落地后却露出獠牙咬了你一口才逃走。（生命 -5）' } } },
      { text: '转身离开', effect: { log: '「帮我……」身后的声音渐渐远了。' } },
    ],
  },
  {
    id: 'tide', title: '记忆潮汐', icon: '🌊',
    text: '银色的潮水漫上来，每一朵浪花里都封着一段陌生的记忆：笑声、争吵、一个你没去过的夏天。',
    choices: [
      { text: '潜入潮中畅游', hint: '危险与机遇', gamble: { chance: 0.5,
        success: { maxHp: 8, hp: 8, log: '千万段记忆冲刷过你，生命变得更加厚重。生命上限 +8。' },
        fail: { hp: -8, log: '一段溺亡者的记忆缠住了你！你挣扎着上岸。（生命 -8）' } } },
      { text: '捡拾退潮的遗留', effect: { gold: 8, log: '潮水退去，留下几枚亮晶晶的梦晶。（梦晶 +8）' } },
    ],
  },
  {
    id: 'mask', title: '面具摊', icon: '🎭',
    text: '无人看管的地摊上摆满面具，每一张都在轻微地呼吸。一张镜子般的面具正对着你。',
    choices: [
      { text: '试戴镜面具', hint: '它也在看你', gamble: { chance: 0.5,
        success: { relic: 'mirror_mask', log: '面具与你的脸严丝合缝，然后变得透明。获得遗物「镜面具」！' },
        fail: { san: -5, log: '面具内侧长满了眼睛。你一把扯下它。（精神 -5）' } } },
      { text: '买下镜面具', hint: '梦晶 -40', requires: { stat: 'gold', min: 40 }, effect: { gold: -40, relic: 'mirror_mask', log: '你在摊上留了钱，取走了面具。获得遗物「镜面具」！' } },
      { text: '快步走开', effect: { log: '所有面具一起转动，目送你离开。' } },
    ],
  },
  {
    id: 'garden', title: '安眠花园', icon: '🌷',
    text: '大片无名的花散发着甜香，花丛间散落着沉睡的旅人，面容安详。',
    choices: [
      { text: '采一朵花别在襟前', effect: { san: 10, hp: 3, log: '花香萦绕不去，你感到久违的安心。（精神 +10，生命 +3）' } },
      { text: '在花丛中小睡', hint: '回复 50% 生命，梦晶 -10', requires: { stat: 'gold', min: 10 }, effect: { gold: -10, healPct: 50, log: '你醒来时口袋轻了些，但浑身舒坦。（生命大幅回复，梦晶 -10）' } },
    ],
  },
  {
    id: 'storm', title: '噩梦风暴', icon: '🌪️',
    text: '漆黑的旋风横在前方，风里裹挟着尖叫、碎玻璃和闪闪发亮的梦晶。',
    choices: [
      { text: '硬闯过去', effect: { hp: -10, gold: 15, log: '玻璃划破了皮肤，但你抓到了一把风里的梦晶。（生命 -10，梦晶 +15）' } },
      { text: '伏低躲避', effect: { san: -4, log: '尖叫声贴着头皮掠过去，久久不散。（精神 -4）' } },
    ],
  },
  {
    id: 'blacksmith', title: '梦铁匠', icon: '⚒️',
    text: '铁匠铺的炉火是冷的，铁匠却满头大汗。「梦里的铁，要用骨头里的热来打。」',
    choices: [
      { text: '请他打磨武器', hint: '梦晶 -30，攻击 +2', requires: { stat: 'gold', min: 30 }, effect: { gold: -30, atk: 2, log: '锤声如雷，火星四溅。（攻击 +2）' } },
      { text: '请他锻造护甲', hint: '梦晶 -30，防御 +1', requires: { stat: 'gold', min: 30 }, effect: { gold: -30, def: 1, log: '一层薄薄的梦铁覆上你的肩背。（防御 +1）' } },
      { text: '离开', effect: { log: '铁匠头也不抬，锤声依旧。' } },
    ],
  },
  {
    id: 'choir', title: '无声唱诗班', icon: '🎵',
    text: '一排白衣歌者张着嘴歌唱，却没有任何声音。他们的表情安详得近乎诡异。',
    choices: [
      { text: '静静聆听', effect: { san: 12, log: '无声的歌直接响在你的颅腔内，竟无比安宁。（精神 +12）' } },
      { text: '加入合唱', hint: '唱错会怎样？', gamble: { chance: 0.5,
        success: { maxSan: 6, san: 6, log: '你跟上了那不存在旋律。精神上限 +6。' },
        fail: { san: -10, log: '你唱出了一个「音」。所有歌者同时转头看你。（精神 -10）' } } },
    ],
  },
  {
    id: 'thief_event', title: '拾梦窃贼', icon: '🦝',
    text: '一个瘦小的身影从你脚边窜过，顺手捞走了几枚梦晶，跑出几步还回头挑衅地晃了晃。',
    choices: [
      { text: '追上去！', hint: '夺回财物', effect: { combat: 'thief', log: '窃贼被逼到死角，龇牙扑了上来！' } },
      { text: '算了，破财免灾', effect: { gold: -8, log: '你摸摸口袋，叹了口气。（梦晶 -8）' } },
    ],
  },
  {
    id: 'fountain', title: '逆涌泉', icon: '⛲',
    text: '泉水违反常理地向天上流去，水珠悬在半空，每一颗里都裹着微光。',
    choices: [
      { text: '直接饮用泉水', hint: '吉凶难料', gamble: { chance: 0.55,
        success: { hp: 15, log: '泉水化作暖流涌入四肢百骸！（生命 +15）' },
        fail: { hp: -6, log: '泉水在你体内逆流，五脏六腑都错了位。（生命 -6）' } } },
      { text: '装一瓶慢慢喝', hint: '梦晶 -5，生命 +8', requires: { stat: 'gold', min: 5 }, effect: { gold: -5, hp: 8, log: '你用一枚梦晶跟泉眼「换」了一瓶水。（生命 +8）' } },
    ],
  },
  {
    id: 'bridge', title: '断桥', icon: '🌉',
    text: '石桥从中间断开，裂口下是深不见底的云海。对岸隐约有宝光闪烁。',
    choices: [
      { text: '纵身跳过去', hint: '拼一把', gamble: { chance: 0.55,
        success: { atk: 2, gold: 10, log: '你在对岸捡到前人遗落的装备！（攻击 +2，梦晶 +10）' },
        fail: { hp: -12, log: '你扒住断桥边缘，指甲翻了两个才爬上来。（生命 -12）' } } },
      { text: '用梦晶铺路', hint: '梦晶 -10', requires: { stat: 'gold', min: 10 }, effect: { gold: -10, log: '梦晶化作点点浮桥，你安然走过。（梦晶 -10）' } },
    ],
  },
  {
    id: 'altar', title: '血祭坛', icon: '🩸',
    text: '祭坛上的血槽还是湿的，空气中飘着铁锈味。坛顶的浮雕是一只攥紧的拳头。',
    choices: [
      { text: '献血换力', hint: '生命 -12，攻击 +3', effect: { hp: -12, atk: 3, log: '血槽亮起红光，力量灼烧着你的血管。（生命 -12，攻击 +3）' } },
      { text: '砸开祭坛', effect: { san: -5, gold: 18, log: '坛底藏着贡金。拳头浮雕似乎瞪了你一眼。（精神 -5，梦晶 +18）' } },
    ],
  },
  {
    id: 'owl', title: '守夜猫头鹰', icon: '🦉',
    text: '一只猫头鹰站在路牌上，脖子转了一百八十度盯着你：「咕。过路要交学费，或者伙食费。」',
    choices: [
      { text: '请教梦境的知识', effect: { san: 6, log: '猫头鹰讲了一整夜梦的规矩。你似懂非懂，但心里踏实了。（精神 +6）' } },
      { text: '喂食换取谢礼', hint: '梦晶 -6', requires: { stat: 'gold', min: 6 }, effect: { gold: -6, relic: 'random', log: '猫头鹰咽下梦晶，从翅膀底下抖出一件遗物相赠！' } },
      { text: '不理会', effect: { log: '「咕。吝啬。」猫头鹰闭上了眼睛。' } },
    ],
  },
  {
    id: 'coffin', title: '空棺', icon: '⚰️',
    text: '一口崭新的棺材摆在路边，盖子半开，里面铺着柔软的天鹅绒，大小正好适合你。',
    choices: [
      { text: '躺进去试试', hint: '谁会拒绝呢', gamble: { chance: 0.5,
        success: { healPct: 60, log: '棺材里舒服得不可思议，你美美睡了一觉。（生命大幅回复）' },
        fail: { combat: 'ghoul', log: '棺盖「砰」地合上了！黑暗中有什么东西压了上来！' } } },
      { text: '搜查棺底夹层', effect: { gold: 10, log: '夹层里塞着陪葬的梦晶。（梦晶 +10）' } },
    ],
  },
  {
    id: 'dice', title: '命运骰局', icon: '🎲',
    text: '两个骰子自己在桌上滚动，桌边空着两把椅子。椅子上方悬着一行字：「赢家通吃。」',
    choices: [
      { text: '押注一搏', hint: '梦晶 -10，输赢看命', requires: { stat: 'gold', min: 10 }, gamble: { chance: 0.5,
        success: { gold: 30, log: '骰子停在你喊的数字上！桌面吐出一堆梦晶。（净赚梦晶 +20）' },
        fail: { log: '骰子转出了嘲讽的表情。你的注金消失了。（梦晶 -10）' } } },
      { text: '离开赌桌', effect: { log: '骰子在你身后悻悻地停了。' } },
    ],
  },
  {
    id: 'statue', title: '哭泣石像', icon: '🗿',
    text: '一尊少女石像跪坐在路边，眼泪不断从石眼里涌出，在脚边积成一小洼晶莹的水潭。',
    choices: [
      { text: '为她拭去眼泪', effect: { san: 5, maxHp: 4, log: '石像的嘴角微微上扬了。一股暖意流入你的身体。（精神 +5，生命上限 +4）' } },
      { text: '收集凝固的泪晶', effect: { gold: 15, san: -4, log: '泪晶很美，但哭声在你耳边响了一路。（梦晶 +15，精神 -4）' } },
    ],
  },
  {
    id: 'mist', title: '无名浓雾', icon: '🌫️',
    text: '前方涌起乳白色的浓雾，雾里隐约有岔路的影子，也有细碎的脚步声。',
    choices: [
      { text: '穿雾而行', hint: '也许能抄近路', gamble: { chance: 0.5,
        success: { depth: 1, log: '你走出浓雾，发现自己已在梦境的更深处！（深度 +1）' },
        fail: { hp: -8, log: '雾里伸出冰冷的手，你拼力挣脱出来。（生命 -8）' } } },
      { text: '原地等雾散', effect: { san: -2, log: '雾里的脚步声绕着你走了很久才散。（精神 -2）' } },
    ],
  },
  {
    id: 'relic_shop', title: '遗物商人', icon: '🧿', minDepth: 6,
    text: '一个把自己裹在斗篷里的商人拦住你，掀开衣襟——内衬上挂满了发光的小物件。「只卖给走得够深的人。」',
    choices: [
      { text: '买一件遗物', hint: '梦晶 -45', requires: { stat: 'gold', min: 45 }, effect: { gold: -45, relic: 'random', log: '你挑了一件合眼缘的。商人咧嘴一笑，消失在雾里。' } },
      { text: '离开', effect: { log: '商人耸耸肩，像雾一样散了。' } },
    ],
  },
  {
    id: 'forge_heart', title: '心之火炉', icon: '❤️‍🔥', minDepth: 10,
    text: '一颗巨大的心脏悬在半空搏动，每一次收缩都迸出火花。靠近能感到滚烫的生命力。',
    choices: [
      { text: '以心头血淬炼', hint: '生命 -8，生命上限 +10', effect: { hp: -8, maxHp: 10, log: '疼痛过后，你的心跳变得如鼓点般有力。生命上限 +10。' } },
      { text: '在炉边取暖', effect: { san: 6, log: '心跳声像母亲的摇篮曲。（精神 +6）' } },
    ],
  },
  {
    id: 'dream_eater', title: '食梦貘', icon: '🐘', minDepth: 5,
    text: '一只貘趴在路中央打哈欠，长鼻子一卷一卷，把周围的噩梦吸进肚里。它看起来……有点温顺？',
    choices: [
      { text: '喂它梦晶', hint: '梦晶 -12', requires: { stat: 'gold', min: 12 }, effect: { gold: -12, relic: 'tapir_horn', log: '食梦貘满足地打了个嗝，从鼻子里喷出一截发光的角。获得遗物「梦貘之角」！' } },
      { text: '驱赶它', hint: '它不乐意', effect: { combat: 'pup', log: '食梦貘的梦里窜出一只幼兽护主！' } },
      { text: '绕路走', effect: { log: '貘打了个哈欠，翻了个身。' } },
    ],
  },
  {
    id: 'oracle', title: '梦境先知', icon: '🔮', minDepth: 15,
    text: '白发先知盘坐在半空，眼睛的位置是两片星空。「我知道你为什么而来。我也知道你能走多远。」',
    choices: [
      { text: '求一段预言', hint: '梦晶 -15', requires: { stat: 'gold', min: 15 }, effect: { gold: -15, maxSan: 6, san: 10, log: '先知在你额头点了一下：「守住心神，梦主不过如此。」（精神上限 +6，精神 +10）' } },
      { text: '「我命由我。」', effect: { atk: 2, log: '先知笑了：「好胆色。」你感觉手中之刃更稳了。（攻击 +2）' } },
    ],
  },
  {
    id: 'sleepwalker', title: '梦游者', icon: '🚶', minDepth: 3,
    text: '一个紧闭双眼的旅人迎面走来，怀里死死抱着一个包裹，嘴里念叨着：「不是我的梦……不是我的梦……」',
    choices: [
      { text: '叫醒他', gamble: { chance: 0.5,
        success: { gold: 12, san: 4, log: '他惊醒后感激不尽，把包裹里的梦晶分了你一半。（梦晶 +12，精神 +4）' },
        fail: { hp: -5, log: '他暴起挥拳，把你当成梦魇揍了一拳才醒。（生命 -5）' } } },
      { text: '悄悄摸走包裹', hint: '不道德，但诱人', gamble: { chance: 0.6,
        success: { gold: 18, log: '包裹里全是梦晶！你良心微痛，但很快乐。（梦晶 +18）' },
        fail: { san: -5, gold: -5, log: '他突然睁眼抓住了你的手腕！你扔下几枚梦晶才挣脱。（精神 -5，梦晶 -5）' } } },
    ],
  },
  // ──────────────── 第二批：以物易物 / 连锁 / 诅咒 ────────────────
  {
    id: 'pawnshop', title: '当梦铺', icon: '⚖️',
    text: '柜台后的掌柜没有脸，声音却热络：「梦里的东西都能当——困意、旧梦、心跳，样样收。」',
    choices: [
      { text: '典当一整个下午的困意', hint: '精神上限 -4，梦晶 +25', effect: { maxSan: -4, gold: 25, log: '掌柜收走一团灰色的雾。你清醒得有些过头了。（精神上限 -4，梦晶 +25）' } },
      { text: '典当一段温暖的旧梦', hint: '生命上限 -6，梦晶 +30', effect: { maxHp: -6, hp: -6, gold: 30, log: '某段关于夏天的记忆被抽走了，心口空了一块。（生命上限 -6，梦晶 +30）' } },
      { text: '什么都不当', effect: { log: '掌柜耸耸肩：「梦里人人都有自己的价格。」' } },
    ],
  },
  {
    id: 'shadow_deal', title: '影子掮客', icon: '🌒',
    text: '你的影子突然立了起来，比你高出一头，指了指你的刀，又指了指它自己：「做笔买卖？」',
    choices: [
      { text: '影子换利刃', hint: '生命上限 -6，攻击 +4', effect: { maxHp: -6, hp: -6, atk: 4, log: '影子淡了一截，你的刀沉了一分。（生命上限 -6，攻击 +4）' } },
      { text: '影子换坚韧', hint: '精神上限 -6，防御 +2', effect: { maxSan: -6, def: 2, log: '影子薄了一层，你的皮肤泛起淡淡的铁光。（精神上限 -6，防御 +2）' } },
      { text: '拒绝交易', effect: { san: -2, log: '影子悻悻地缩回脚下，比原来更黑了一点。（精神 -2）' } },
    ],
  },
  {
    id: 'vine_gate', title: '藤蔓之门', icon: '🌿',
    text: '发光的藤蔓绞成一扇门，缝隙里透出暖黄色的光。藤蔓轻轻摆动，像在呼吸。',
    choices: [
      { text: '拨开藤蔓进去', hint: '门后还有东西', effect: { nextEvent: 'vine_deep', log: '藤蔓温顺地让开一条路，暖光把你吞了进去。' } },
      { text: '绕开', effect: { log: '你绕开了。藤蔓在身后轻轻合拢，像什么都没发生过。' } },
    ],
  },
  {
    id: 'vine_deep', title: '藤蔓深处', icon: '🌸', chainOnly: true,
    text: '门内是一座小小的温室，中央开着一朵拳头大的发光花朵，根系扎进一团跳动的红光里。',
    choices: [
      { text: '摘下那朵花', effect: { hp: 12, san: 4, log: '花瓣入口即化，一股暖流治愈了你。（生命 +12，精神 +4）' } },
      { text: '烧掉根系取红光', effect: { atk: 2, hp: -4, log: '火焰腾起，红光凝成一粒火种没入你的刀。（攻击 +2，灼伤生命 -4）' } },
    ],
  },
  {
    id: 'wind_eye', title: '风暴之眼', icon: '🌀',
    text: '狂风环抱着一片诡异的平静。风眼正中悬着一颗缓慢旋转的青色核心。',
    choices: [
      { text: '走入风眼', hint: '靠近核心', effect: { nextEvent: 'wind_core', log: '风墙在你身后合拢，核心近在咫尺。' } },
      { text: '远远避开', effect: { san: -2, log: '风声如泣如诉，跟了你很久。（精神 -2）' } },
    ],
  },
  {
    id: 'wind_core', title: '风眼之核', icon: '💠', chainOnly: true,
    text: '青色核心触手可及，里面蜷缩着一场小小的飓风。',
    choices: [
      { text: '取出核心', effect: { atk: 3, hp: -8, log: '飓风顺着手臂钻进你的血脉！（攻击 +3，风刃割伤生命 -8）' } },
      { text: '将其封印', effect: { san: 8, maxSan: 2, log: '风暴归于沉寂，你的心也跟着静了。（精神 +8，精神上限 +2）' } },
    ],
  },
  {
    id: 'triple_door', title: '三重门', icon: '🚪',
    text: '三扇门嵌套着立在雾里，第一重门上写着：「进者不退。」',
    choices: [
      { text: '推开第一重', hint: '进退之间', effect: { nextEvent: 'door_two', log: '门后还是门。空气更稠了。' } },
      { text: '不进', effect: { log: '你退开了。雾里传来一声轻笑。' } },
    ],
  },
  {
    id: 'door_two', title: '第二重门', icon: '🚪', chainOnly: true,
    text: '第二重门上没有字，只有一个掌印，大小正好是你的手。',
    choices: [
      { text: '按上去推开', hint: '最后一重', effect: { nextEvent: 'door_three', log: '门认得你。它无声地开了。' } },
      { text: '就此回头', effect: { gold: 5, log: '你退了出来，掌心多了几枚门缝里的梦晶。（梦晶 +5）' } },
    ],
  },
  {
    id: 'door_three', title: '第三重门', icon: '✨', chainOnly: true,
    text: '最后一重门后是纯粹的黑暗，黑暗正中悬着一枚光点，像整个梦境的心脏。',
    choices: [
      { text: '触碰光点', hint: '孤注一掷', gamble: { chance: 0.5,
        success: { relic: 'random', maxHp: 6, log: '光点没入眉心，你听见梦境对你说了声谢谢。（生命上限 +6，并获得一件遗物！）' },
        fail: { hp: -12, log: '黑暗咬了你一口。你跌出三重门外。（生命 -12）' } } },
      { text: '躬身退出', effect: { san: 5, log: '你向黑暗行了一礼，退了出来。黑暗回以沉默的善意。（精神 +5）' } },
    ],
  },
  {
    id: 'cursed_box', title: '无主之匣', icon: '📦',
    text: '路中央放着一只精致的乌木匣子，锁孔里透出微光，匣身刻着一行小字：「赠予有缘人。」',
    choices: [
      { text: '打开匣子', hint: '免费的东西最贵', effect: { relic: 'whisper_box', gold: 10, log: '匣中躺着几枚梦晶，还有一叠写满字的纸条。你收下了这份「礼物」。（梦晶 +10，获得遗物「呢喃之匣」）' } },
      { text: '原样放回', effect: { san: 2, log: '你直觉这不是善物。走出很远，还能听见匣子在原地轻轻作响。（精神 +2）' } },
    ],
  },
  {
    id: 'thorn_throne', title: '荆棘王座', icon: '🪑',
    text: '一座由荆棘盘成的王座立在空地中央，扶手上搁着一顶碎裂的王冠，似乎一直在等谁坐上去。',
    choices: [
      { text: '坐上王座', hint: '王权皆有代价', effect: { relic: 'broken_crown', hp: -5, log: '荆棘刺入你的身体，碎冠落在你的头上。从这一刻起，你即是梦境的暴君。（生命 -5，获得遗物「碎梦王冠」）' } },
      { text: '绕行', effect: { log: '王座在你身后发出一声悠长的叹息。' } },
    ],
  },
  {
    id: 'echo_market', title: '回声集市', icon: '🏮',
    text: '集市上没有商品，只有一个个玻璃罐，罐里封着声音：笑声、哭声、一声没说出口的再见。',
    choices: [
      { text: '出售一段回忆', hint: '精神上限 -4，梦晶 +25', effect: { maxSan: -4, gold: 25, log: '你卖掉了一段雨天的记忆。罐子里多了一声遥远的雷。（精神上限 -4，梦晶 +25）' } },
      { text: '收购一段回忆', hint: '梦晶 -20，精神上限 +6', requires: { stat: 'gold', min: 20 }, effect: { gold: -20, maxSan: 6, san: 6, log: '陌生人的童年在你脑海里放映了一遍。你的心变大了。（精神上限 +6）' } },
      { text: '穿过集市', effect: { log: '满街的玻璃罐目送你离开，嗡嗡作响。' } },
    ],
  },
  {
    id: 'night_train', title: '夜行列车', icon: '🚂',
    text: '一列没有车头的列车静静停在旷野上，车窗透出暖光。车门旁挂着牌子：「直行三站，不停靠。」',
    choices: [
      { text: '买票上车', hint: '梦晶 -10，深度 +2', requires: { stat: 'gold', min: 10 }, effect: { gold: -10, depth: 2, log: '列车无声滑行，窗外的梦景飞速后退。（深入两层梦境！）' } },
      { text: '扒在车顶上逃票', hint: '风险自负', gamble: { chance: 0.5,
        success: { depth: 2, log: '你趴在车顶看完了三站风景。（深入两层梦境！）' },
        fail: { combat: 'eater', log: '检票员发现了你——如果那团长着八只眼睛的黑影也算检票员的话。' } } },
      { text: '目送列车离开', effect: { log: '尾灯消失在梦的深处，像一颗坠落的星。' } },
    ],
  },
  {
    id: 'painter', title: '梦境画师', icon: '🎨',
    text: '画师支着画架坐在路边，画布上是一片空白。「我画什么，什么就是真的。要试试吗？」',
    choices: [
      { text: '请他为你画像', hint: '梦晶 -10，生命上限 +6', requires: { stat: 'gold', min: 10 }, effect: { gold: -10, maxHp: 6, hp: 6, log: '画里的你比现实中的你健壮了一圈，于是你也是了。生命上限 +6。' } },
      { text: '撕毁画纸', effect: { san: -3, atk: 1, log: '画师哭了，但你从撕碎的画布里汲取了一丝狠劲。（精神 -3，攻击 +1）' } },
    ],
  },
  {
    id: 'insomniac', title: '失眠者', icon: '🌃',
    text: '一个满眼血丝的人坐在悬崖边数羊：「……九千九百九十八……九千九百九十九……」',
    choices: [
      { text: '陪他聊会儿天', effect: { san: 5, gold: 5, log: '他讲了很多现实里的事。临别时塞给你几枚梦晶。（精神 +5，梦晶 +5）' } },
      { text: '试着催眠他', hint: '积德或有损', gamble: { chance: 0.5,
        success: { san: 10, maxSan: 2, log: '他终于睡着了，整个梦境都安静了一瞬。你悟到了安宁的法门。（精神 +10，精神上限 +2）' },
        fail: { hp: -5, log: '他数羊数到暴躁，抓起一块石头丢了过来。（生命 -5）' } } },
    ],
  },
  {
    id: 'paper_boat', title: '纸船渡口', icon: '⛵',
    text: '一条纸叠的小船停在墨色河边，艄公是一只戴斗笠的纸鹤。「过河吗？河底沉着好东西。」',
    choices: [
      { text: '买船票渡河', hint: '梦晶 -8，深度 +1', requires: { stat: 'gold', min: 8 }, effect: { gold: -8, depth: 1, log: '纸船穿过墨色河水，对岸已是更深的梦境。（深度 +1）' } },
      { text: '涉水过河', hint: '河底有货', gamble: { chance: 0.5,
        success: { atk: 2, gold: 8, log: '你在河底摸到一把沉剑和几枚梦晶！（攻击 +2，梦晶 +8）' },
        fail: { hp: -10, log: '河水冷得像无数根针，你拼力爬上岸。（生命 -10）' } } },
    ],
  },
  {
    id: 'mirror_maze', title: '镜廊', icon: '🪞',
    text: '一条两侧立满镜子的长廊，每个镜面里的你动作都略有不同，有的快半拍，有的慢半拍。',
    choices: [
      { text: '闭眼穿行', hint: '相信直觉', gamble: { chance: 0.55,
        success: { def: 1, log: '你凭直觉走出了镜廊，皮肤泛起一层镜光。（防御 +1）' },
        fail: { san: -8, log: '你在镜廊里看见了一万个自己同时尖叫。（精神 -8）' } } },
      { text: '砸镜开路', effect: { hp: -4, gold: 8, log: '碎片划伤了手，但镜框夹层里藏着梦晶。（生命 -4，梦晶 +8）' } },
    ],
  },
  {
    id: 'vending', title: '梦境贩卖机', icon: '🥤',
    text: '一台老式贩卖机亮着幽幽的蓝光，货架上的饮料瓶里装着发光的雾气。出货口贴着纸条：「概不找零。」',
    choices: [
      { text: '投币买瓶汽水', hint: '梦晶 -8，生命 +10', requires: { stat: 'gold', min: 8 }, effect: { gold: -8, hp: 10, log: '汽水带着月光的气泡，一口下去浑身通透。（生命 +10）' } },
      { text: '用力摇晃机器', hint: '经典操作', gamble: { chance: 0.4,
        success: { gold: 20, log: '哗啦啦——出货口吐出一堆梦晶！（梦晶 +20）' },
        fail: { combat: 'ghost', log: '贩卖机的蓝光变成了红光，一只怨影从出货口爬了出来！' } } },
    ],
  },
  {
    id: 'lullaby', title: '摇篮曲', icon: '🎶',
    text: '空气里飘着一支极轻的摇篮曲，听不出方向。歌声经过的地方，连梦魇都安静了下来。',
    choices: [
      { text: '循着歌声小憩', hint: '回复 25% 生命', effect: { healPct: 25, san: 5, log: '你在歌声里睡了一个没有梦的觉。（生命回复，精神 +5）' } },
      { text: '寻找歌声的来源', hint: '或有所得', gamble: { chance: 0.5,
        success: { relic: 'random', log: '歌声的尽头是一只八音盒，盒底压着一件遗物！' },
        fail: { san: -6, log: '歌声在你靠近时戛然而止，四周只剩你自己的心跳。（精神 -6）' } } },
    ],
  },
  {
    id: 'debt_collector', title: '讨债鬼', icon: '👻',
    text: '一只提着灯笼的鬼拦住你，翻开一本血账：「你上上世欠的梦晶，连本带利，该还了。」',
    choices: [
      { text: '如数偿还', hint: '梦晶 -15', requires: { stat: 'gold', min: 15 }, effect: { gold: -15, san: 8, log: '账销了，鬼走了，你一身轻松。（精神 +8）' } },
      { text: '讨价还价', hint: '梦晶 -8', requires: { stat: 'gold', min: 8 }, effect: { gold: -8, log: '你们磨了半个时辰，最终以半价成交。鬼嘟囔着走了。' } },
      { text: '拔腿就跑', hint: '它不干', effect: { combat: 'ghoul', log: '讨债鬼把灯笼一摔，现出本相扑了上来！' } },
    ],
  },
  {
    id: 'dream_grave', title: '梦冢', icon: '🪦',
    text: '一片小小的墓地，每块墓碑上都刻着同一个名字——你的名字。只是生卒年份各不相同。',
    choices: [
      { text: '祭拜前世的自己', effect: { san: 6, log: '你上了一炷香。某一世的你似乎投来了感激的一瞥。（精神 +6）' } },
      { text: '掘开最新的一座', hint: '有违天和', gamble: { chance: 0.5,
        success: { gold: 25, log: '棺中没有尸骨，只有陪葬的梦晶。（梦晶 +25）' },
        fail: { hp: -10, log: '棺中伸出一只和你一模一样的手，抓住了你的脚踝！（生命 -10）' } } },
    ],
  },
  {
    id: 'hourglass', title: '倒流沙漏', icon: '⏳',
    text: '一只巨大的沙漏悬在半空，金色的沙时而向上流，时而向下流，偶尔停住，发出钟摆般的声响。',
    choices: [
      { text: '将沙漏倒转', hint: '梦晶 -20，生命 +10，精神 +10', requires: { stat: 'gold', min: 20 }, effect: { gold: -20, hp: 10, san: 10, log: '时光在你周身倒淌了一小段，伤口和杂念一并退去了。（生命 +10，精神 +10）' } },
      { text: '催沙漏快流', hint: '深度 +2', effect: { depth: 2, san: -5, log: '沙流如瀑，你眼前的梦境飞速翻页。（深入两层，精神 -5）' } },
      { text: '不碰它', effect: { log: '有些时间不该被惊动。' } },
    ],
  },
  {
    id: 'beggar_god', title: '乞讨的神', icon: '🙏',
    text: '一个衣衫褴褛的老者盘坐在路中央，面前摆着一只缺口的碗。他的眼睛亮得不像乞丐。',
    choices: [
      { text: '往碗里放梦晶', hint: '梦晶 -10', requires: { stat: 'gold', min: 10 }, gamble: { chance: 0.6,
        success: { relic: 'random', log: '老者咧嘴一笑，从袖中取出一件遗物放进你手里：「善有善报。」（梦晶 -10）' },
        fail: { maxSan: 4, log: '老者只点了点头。但你感到心境开阔了些。（梦晶 -10，精神上限 +4）' } } },
      { text: '径直走过', effect: { san: -2, log: '那双过于明亮的眼睛一直跟着你。（精神 -2）' } },
    ],
  },
  {
    id: 'theater', title: '木偶剧场', icon: '🎪',
    text: '一座小剧场正在上演木偶戏，台下坐满了木偶观众。台上的木偶演员冲你鞠躬，比了个「请」的手势。',
    choices: [
      { text: '坐下看戏', effect: { san: 8, log: '戏演的是一个旅人走出梦境的故事。你看得入神。（精神 +8）' } },
      { text: '上台献演一段', hint: '技惊四座？', gamble: { chance: 0.5,
        success: { atk: 3, gold: 10, log: '满堂木偶起立鼓掌，打赏如雨！你从掌声里悟到了表演的力度。（攻击 +3，梦晶 +10）' },
        fail: { hp: -8, log: '你演砸了。木偶观众们把手里的座椅拆了丢上来。（生命 -8）' } } },
    ],
  },
  {
    id: 'moon_bath', title: '月浴池', icon: '🌙', minDepth: 12,
    text: '一池凝固的月光，池水银亮。池边石碑刻着：「沐浴者，以梦抵资。」',
    choices: [
      { text: '入池沐浴', hint: '回复 40% 生命', effect: { healPct: 40, maxSan: 4, log: '月光渗入四肢百骸，你感到自己被轻轻擦拭了一遍。（生命大幅回复，精神上限 +4）' } },
      { text: '掬水卖给路人', effect: { gold: 15, log: '有人愿意为一口月光付梦晶。（梦晶 +15）' } },
    ],
  },
  {
    id: 'bone_gamble', title: '白骨赌局', icon: '☠️', minDepth: 10,
    text: '几只白骨围坐一圈，用指骨当筹码。见你来了，它们让出一个位置，眼窝里的鬼火晃了晃。',
    choices: [
      { text: '押上气血入局', hint: '赢了脱胎换骨', gamble: { chance: 0.55,
        success: { atk: 5, log: '白骨们哗啦一声散了架——愿赌服输，它们的力量归你了！（攻击 +5）' },
        fail: { hp: -15, log: '白骨们从你身上抽走了一管血气当彩头。（生命 -15）' } } },
      { text: '谢绝邀请', effect: { log: '白骨们耸耸肩，继续它们的赌局。指骨碰撞声清脆得像风铃。' } },
    ],
  },
  {
    id: 'veil_gate', title: '界门缝隙', icon: '🌌', minDepth: 20,
    text: '梦境的边界在这里裂开一道缝，缝外是旋转的星海。缝隙边缘闪烁着危险的光。',
    choices: [
      { text: '向星海祈祷', effect: { san: 15, log: '星海回应了你。亿万光年外的宁静注入你的意识。（精神 +15）' } },
      { text: '强行拓宽缝隙', hint: '生命 -10，攻击 +2', effect: { hp: -10, atk: 2, log: '你撕开缝隙，一缕星光缠上你的刀刃。（生命 -10，攻击 +2）' } },
    ],
  },
  {
    id: 'star_fisher', title: '垂钓星河', icon: '🎣', minDepth: 8,
    text: '一条星河横在头顶，有人坐在河边垂钓，钓钩垂进星星里。他把备用钓竿递给你。',
    choices: [
      { text: '下钩垂钓', hint: '看运气', gamble: { chance: 0.5,
        success: { gold: 30, log: '你钓起一颗熟透的星星，它在你掌心碎成了一堆梦晶！（梦晶 +30）' },
        fail: { san: -5, log: '钓上来的是一只破靴子。星河那头的垂钓者笑出了声。（精神 -5）' } } },
      { text: '坐在河边看星', effect: { san: 8, log: '星河无声流淌。你很久没有这样什么都不做了。（精神 +8）' } },
    ],
  },
  {
    id: 'atonement_spring', title: '赎罪泉', icon: '⛲', minDepth: 12,
    text: '一眼泉水从白骨堆中涌出，水清得近乎透明。碑上刻着：「此泉不洗血污，只洗契约有痕者。」',
    choices: [
      { text: '以泉水净化诅咒', hint: '梦晶 -20，移除一件诅咒遗物', requires: { stat: 'gold', min: 20 }, requiresCurse: true, effect: { gold: -20, removeCurse: true, san: 5, log: '你沉入泉中，泉水凉得像一场宽恕。（梦晶 -20，精神 +5）' } },
      { text: '掬水洗把脸', effect: { san: 8, log: '水清冽甘甜，洗去了几分疲惫。（精神 +8）' } },
      { text: '离开', effect: { log: '泉水映出你的倒影——倒影的脖子上，似乎缠着细细的红线。' } },
    ],
  },
];
