// ==UserScript==
// @name           HV Utils Isekai 汉化
// @namespace      HVUT
// @description    A comprehensive out-of-battle script for Hentaiverse
// @homepageURL    https://forums.e-hentai.org/index.php?showtopic=211883
// @supportURL     https://forums.e-hentai.org/index.php?showtopic=211883
// @version        4.1.1
// @icon           https://hentaiverse.org/y/favicon.png
// @author         sssss2
// @match          *://*.hentaiverse.org/isekai/*
// @match          *://e-hentai.org/*
// @connect        hentaiverse.org
// @connect        e-hentai.org
// @exclude        *://hentaiverse.org/isekai/equip/*
// @exclude        *://alt.hentaiverse.org/isekai/equip/*
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addStyle
// @grant          GM_xmlhttpRequest
// @grant          GM_setClipboard
// @grant          unsafeWindow
// @run-at         document-end
// ==/UserScript==

const settings = {

  // [GENERAL]
  /*
  reNotification: true,
  reBattle: true,
  reGallery: true,
  reGalleryAlt: false,
  reBeep: [0.2, 500, 0.5], // [volume, frequency, duration]
  */

  topMenuIntegration: true,
  topMenuLinks: ['Character', 'Equipment', 'Item Inventory', 'Item Shop', 'The Shrine', 'The Market', 'Monster Lab', 'MoogleMail', 'Organize', 'Purchase', 'Sell', 'The Arena', 'The Tower', 'Ring of Blood', 'GrindFest', 'Item World'],
  confirmStaminaRestorative: true,
  disableStaminaRestorative: 79,
  warnLowStamina: 10,

  showCredits: 0, // 0:disable, 2:always
  showEquipCapacity: 1, // 0:disable, 1:on battle pages only, 2:always
  warnEquipCapacity: 50,
  trainingNotification: true,
  lotteryNotification: true,
  lotteryFilters: [
    'Rapier && Slaughter',
    'Ethereal && (Rapier || Wakizashi) && (Balance || Nimble)',
    'Wakizashi && Battlecaster',
    'Ethereal && (Axe || Club || Shortsword || Estoc || Katana || Longsword || Mace) && Slaughter',
    'Force Shield || Buckler && (Barrier || Battlecaster)',
    'Fiery && (Willow || Redwood) && (Destruction || Elementalist || Surtr)',
    'Arctic && (Willow || Redwood) && (Destruction || Elementalist || Niflheim)',
    'Shocking && (Willow || Redwood) && (Destruction || Elementalist || Mjolnir)',
    'Tempestuous && (Willow || Redwood) && (Destruction || Elementalist || Freyr)',
    'Hallowed && (Oak || Katalox) && (Destruction || Heaven-sent || Heimdall)',
    'Demonic && (Willow || Katalox) && (Destruction || Demon-fiend || Fenrir)',
    '(Radiant || Charged) && Phase',
    'Charged && (Elementalist || Heaven-sent || Demon-fiend)',
    '(Savage || Agile) && Shadowdancer',
    'Power && Slaughter',
    'Power && Savage && Balance',
  ],

  // [EQUIPMENT]
  equipmentIntegration: true,
  equipSort: true,
  equipColor: true,
  equipShowLevel: true,
  equipShowPAB: true,
  equipHoverFunctions: true,
  equipTouchFunctions: false,
  equipCode: '[{$_eid}] [url={$url}]{$namecode}[/url] ({$level?Lv.$level}{$soulbound?Soulbound}{$unassigned?Unassigned}, {$pab}{$note?, $note}){$price? @ $price}',
  equipNameCode: [
    'Peerless : quality=rainbow, name=bold',
    'Legendary : quality=#f90, quality=bold',
    'Magnificent : quality=#69f',
    'Exquisite : quality=#3c3',
    '(Rapier || Shortsword) && Slaughter : type=bold, suffix=bold ; Ethereal : prefix=#f00 ; (Hallowed || Demonic) : prefix=#f90',
    '(Club || Axe) && Slaughter && Ethereal : prefix=#f00, type=bold, suffix=bold',
    '(Rapier || Wakizashi) && (Balance || Nimble) && Ethereal : prefix=#f00, type=bold, suffix=bold',
    'Wakizashi && (Nimble || Battlecaster) && (Fiery || Arctic || Shocking || Tempestuous) : prefix=#f00, type=bold, suffix=bold',
    '(Estoc || Katana || Longsword || Great Mace || Scythe || Swordchucks) && Slaughter && Ethereal : prefix=#f00, type=bold, suffix=bold',
    'Oak && Hallowed && (Destruction || Heimdall) : prefix=#f00, type=bold, suffix=bold',
    'Willow && Demonic && (Destruction || Fenrir) : prefix=#f00, type=bold, suffix=bold',
    'Willow && (Shocking || Tempestuous) && Destruction : prefix=#f00, type=bold, suffix=bold',
    'Katalox && Hallowed && (Destruction || Heimdall || Heaven-sent) : prefix=#f90, type=bold',
    'Katalox && Demonic && (Destruction || Fenrir || Demon-fiend) : prefix=#f90, type=bold',
    'Redwood && (Fiery || Arctic || Shocking || Tempestuous) && Destruction : prefix=#f00, type=bold, suffix=bold',
    'Redwood && (Fiery || Arctic || Shocking || Tempestuous) && Elementalist : prefix=#f90, type=bold',
    'Redwood && (Fiery && Surtr || Arctic && Niflheim || Shocking && Mjolnir || Tempestuous && Freyr) : prefix=#f90, type=bold',
    'Force Shield : type=bold ; Protection : suffix=bold',
    '(Buckler || Kite Shield || Tower Shield) && (Barrier || Battlecaster) : type=bold, suffix=bold ; Reinforced : prefix=#f90',
    'Phase && (Surtr || Nilfheim || Mjolnir || Freyr || Heimdall || Fenrir) : type=bold ; Radiant || Charged : prefix=#f00 ; Mystic || Frugal : prefix=#f90',
    '(Phase || Cotton || Gossamer || Ironsilk) && (Elementalist || Heaven-sent || Demon-fiend) : suffix=bold ; Radiant || Charged : prefix=#f00 ; Elementalist && Shoes || (Heaven-sent || Demon-fiend) && Robe : slot=bold',
    'Shade && Shadowdancer : type=bold, suffix=bold ; Savage : prefix=#f00 ; Agile : prefix=#f90',
    'Power : type=bold ; Savage : prefix=#f90 ; Slaughter : suffix=bold ; Savage && Slaughter : prefix=#f00',
    'Reactive && Barrier : type=bold, suffix=bold',
  ],

  // [Equipment Shop]
  equipmentShopConfirm: 1, // 0: default, 1: auto checkbox, 2: do not confirm
  equipmentShopAutoProtect: true,
  equipmentShopPriceDeductFee: false,

  equipmentShopProtectFilters: [
    'Peerless',
    'Legendary',
    'Magnificent && (Rapier || Shortsword) && Slaughter',
    'Magnificent && (Tower || Buckler) && Barrier',
    'Magnificent && Fiery && (Oak || Redwood) && (Destruction || Elementalist || Surtr)',
    'Magnificent && Arctic && (Oak || Redwood) && (Destruction || Elementalist || Niflheim)',
    'Magnificent && Shocking && (Willow || Redwood) && (Destruction || Elementalist || Mjolnir)',
    'Magnificent && Tempestuous && (Willow || Redwood) && (Destruction || Elementalist || Freyr)',
    'Magnificent && Hallowed && (Oak || Katalox) && (Destruction || Heaven-sent || Heimdall)',
    'Magnificent && Demonic && (Willow || Katalox) && (Destruction || Demon-fiend || Fenrir)',
    'Magnificent && (Radiant || Charged) && (Surtr || Niflheim || Mjolnir || Freyr || Heimdall || Fenrir || Elementalist || Heaven-sent || Demon-fiend)',
    'Magnificent && (Savage || Agile) && Shadowdancer',
    'Magnificent && Power && (Slaughter || $pab=sde)',
    'Magnificent && Reactive && Barrier',
    'Magnificent',
    '$Superior+ && $prefix && (Rapier || Shortsword) && (Slaughter || Balance)',
    '$Superior+ && $prefix && (Wakizashi || Dagger) && (Nimble || Battlecaster || Balance)',
    '$Superior+ && Ethereal && Katana && (Slaughter || Balance)',
    '$Superior+ && ((Buckler || Tower || Kite) || (Barrier || Nimble || Battlecaster))',
    '$Superior+ && Shade && !Negation',
    '$Superior+ && Power && !Warding',
    '$Superior+ && Reactive && Barrier',
  ],

  equipmentShopBazaarFilters: [
    'Peerless',
    'Legendary',
    'Magnificent && (Rapier || Shortsword) && Slaughter',
    'Magnificent && (Tower || Buckler) && Barrier',
    'Magnificent && Fiery && (Oak || Redwood) && (Destruction || Elementalist || Surtr)',
    'Magnificent && Arctic && (Oak || Redwood) && (Destruction || Elementalist || Niflheim)',
    'Magnificent && Shocking && (Willow || Redwood) && (Destruction || Elementalist || Mjolnir)',
    'Magnificent && Tempestuous && (Willow || Redwood) && (Destruction || Elementalist || Freyr)',
    'Magnificent && Hallowed && (Oak || Katalox) && (Destruction || Heaven-sent || Heimdall)',
    'Magnificent && Demonic && (Willow || Katalox) && (Destruction || Demon-fiend || Fenrir)',
    'Magnificent && (Radiant || Charged) && (Surtr || Niflheim || Mjolnir || Freyr || Heimdall || Fenrir || Elementalist || Heaven-sent || Demon-fiend)',
    'Magnificent && (Savage || Agile) && Shadowdancer',
    'Magnificent && Power && (Slaughter || $pab=sde)',
    'Magnificent && Reactive && Barrier',
    '$Superior+ && $prefix && (Rapier || Shortsword) && (Slaughter || Balance)',
    '$Superior+ && $prefix && (Wakizashi || Dagger) && (Nimble || Battlecaster || Balance)',
    '$Superior+ && Ethereal && Katana && (Slaughter || Balance)',
    '$Superior+ && ((Buckler || Tower || Kite) || (Barrier || Nimble || Battlecaster))',
    '$Superior+ && Shade && !Negation',
    '$Superior+ && Power && !Warding',
    '$Superior+ && Reactive && Barrier',
  ],

  monsterLab: true,
  monsterLabDefaultSort: 'index',
  monsterLabCloseDefaultPopup: false,

  shrineHideItems: ['Figurine', 'Peerless Voucher'],
  shrineFilters: ['Peerless', 'Legendary', 'Magnificent', 'Exquisite'],

  moogleMail: true,

  // [BATTLE]
  equipPanelPosition: 'left',
  equipPanelRepairThreshold: 20,
  equipPanelItemInventory: {
    'Health Draught': 200,
    'Mana Draught': 200,
    'Spirit Draught': 200,
    'Health Potion': 100,
    'Mana Potion': 100,
    'Spirit Potion': 100,
    'Health Elixir': 10,
    'Mana Elixir': 10,
    'Spirit Elixir': 10,
  },

};

/* END OF SETTINGS */

/* eslint-disable arrow-spacing, block-spacing, comma-spacing, key-spacing, keyword-spacing, object-curly-spacing, space-before-blocks, space-before-function-paren, space-infix-ops, semi-spacing */
function $id(id,d) {return (d||document).getElementById(id);}
function $qs(q,d) {return (d||document).querySelector(q);}
function $qsa(q,d) {return Array.from((d||document).querySelectorAll(q));}
function $doc(h) {const d=document.implementation.createHTMLDocument('');d.documentElement.innerHTML=h;return d;}
function $element(t,p,a,f) {let e;if(t){e=document.createElement(t);}else if(t===''){e=document.createTextNode(a);a=null;}else{return document.createDocumentFragment();}if(a!==null&&a!==undefined){function ao(e,a){Object.entries(a).forEach(([an,av])=>{if(typeof av==='object'){let a;if(an in e){a=e[an];}else{e[an]={};a=e[an];}Object.entries(av).forEach(([an,av])=>{a[an]=av;});}else{if(an==='style'){e.style.cssText=av;}else if(an in e){e[an]=av;}else{e.setAttribute(an,av);}}});}function as(e,a){const an={'#':'id','.':'className','!':'style','/':'innerHTML'}[a[0]];if(an){e[an]=a.slice(1);}else if(a!==''){e.textContent=a;}}if(typeof a==='string'||typeof a==='number'){e.textContent=a;}else if(Array.isArray(a)){a.forEach((a)=>{if(typeof a==='string'||typeof a==='number'){as(e,a);}else if(typeof a==='object'){ao(e,a);}});}else if(typeof a==='object'){ao(e,a);}}if(f){if(typeof f==='function'){e.addEventListener('click',f);}else if(typeof f==='object'){Object.entries(f).forEach(([ft,fl])=>{e.addEventListener(ft,fl);});}}if(p){if(p.nodeType===1||p.nodeType===11){p.appendChild(e);}else if(Array.isArray(p)){if(['beforebegin','afterbegin','beforeend','afterend'].includes(p[1])){p[0].insertAdjacentElement(p[1],e);}else if(!isNaN(p[1])){p[0].insertBefore(e,p[0].childNodes[p[1]]);}else{p[0].insertBefore(e,p[1]);}}}return e;}
function $input(o,p,a,f) {if(typeof o==='string'){o=[o];}const [t,v,n,s]=o;if(!a){a={};}if(t==='select'){const i=$element('select',p,a,f);if(v){v.forEach((v)=>{v=split2(v,':');if(!v[1]){v[1]=v[0];}$element('option',i,{value:v[0],text:v[1]});});}return i;}a.type=t;if(v===undefined||v===null){const i=$element('input',p,a,f);return i;}else if(t==='button'||t==='submit'){a.value=v;const i=$element('input',p,a,f);return i;}else{const l=$element('label',p);const i=$element('input',l,a,f);if(s&&(t==='checkbox'||t==='radio')){$element('span',l);l.classList.add('hvut-label');}if(v){if(n==='before'){l.prepend(v,' ');}else{l.append(' ',v);}}return i;}}
function time_format(t,o) {t=Math.floor(t/1000);const h=Math.floor(t/3600).toString().padStart(2,'0');const m=Math.floor(t%3600/60).toString().padStart(2,'0');const s=(t%60).toString().padStart(2,'0');return !o?`${h}:${m}:${s}`:o===1?`${h}:${m}`:o===2?`${m}:${s}`:'';}
function split2(s,d,t=true) {let a;const p=s.indexOf(d);if(p===-1){a=[s];}else{const k=s.slice(0,p);const v=s.slice(p+1);a=[k,v];}if(t){a=a.map((e)=>e.trim());}return a;}
function scrollIntoView(e,p=e.parentNode) {p.scrollTop+=e.getBoundingClientRect().top-p.getBoundingClientRect().top;}
function confirm_event(n,e,m,c,f) {if(!n){return;}const a=n.getAttribute('on'+e);n.removeAttribute('on'+e);n.addEventListener(e,(e)=>{if(!c||c()){if(confirm(m)){if(f){f();}}else{e.preventDefault();e.stopImmediatePropagation();}}},true);n.setAttribute('on'+e,a);}
function toggle_button(b,s,h,e,n,d,f) {const c=(l)=>{l.forEach((m)=>{if(m.type==='attributes'&&m.attributeName==='class'){t();}});};const t=()=>{b.value=e.classList.contains(n)?s:h;};(new MutationObserver(c)).observe(e,{attributes:true,attributeFilter:['class']});if(d==='on'){e.classList.add(n);}else if(d==='off'){e.classList.remove(n);}t();if(!f){f=()=>{e.classList.toggle(n);};}b.addEventListener('click',f);}
function play_beep(volume=0.2,frequency=500,duration=0.5) {const delay=1;if(!volume){return;}const c=new window.AudioContext();const o=c.createOscillator();const g=c.createGain();o.type='sine';o.frequency.value=frequency;g.gain.value=volume;o.connect(g);g.connect(c.destination);o.start(delay);o.stop(delay+duration);}
function popup(t) {function r(e){e.preventDefault();e.stopImmediatePropagation();if(e.button===0||e.key==='Enter'||e.key===' '||e.key==='Escape'){w.remove();document.removeEventListener('keydown',r);}}const w=$element('div',document.body,['!position:fixed;top:0;left:0;width:1236px;height:702px;padding:3px 100% 100% 3px;background-color:#0006;z-index:1001;cursor:pointer;display:flex;justify-content:center;align-items:center;'],r);const d=$element('div',w,['/'+t,'!min-width:400px;min-height:100px;max-width:100%;max-height:100%;padding:10px;background-color:#fff;border:1px solid;display:flex;flex-direction:column;justify-content:center;font-size:10pt;color:#333;']);document.addEventListener('keydown',r);return d;}
function popup_text(m,wd,ht,b=[]) {let v;if(typeof m==='string'){v=m;}else{v=m.join('\n');}const w=$element('div',document.body,['!position:fixed;top:0;left:0;width:1236px;height:702px;padding:3px 100% 100% 3px;background-color:#0006;z-index:1001;display:flex;justify-content:center;align-items:center;']);const d=$element('div',w,['!border:1px solid;padding:5px;background-color:#fff;']);const t=$element('textarea',d,{value:v,spellcheck:false,style:`display:block;margin:0 0 5px;font-size:9pt;line-height:1.5em;width:stretch;min-width:${wd}px;height:${ht}px;white-space:pre;`});function c(){w.remove();}b.forEach((o)=>{$element('input',d,{type:'button',value:o.text},()=>{if(o.click==='default'){t.value=o.value;}else if(o.click==='revert'){t.value=v;}else if(typeof o.click==='function'){o.click(p);}});});$element('input',d,{type:'button',value:'Close'},c);const p={wrapper:w,textarea:t,close:c};return p;}
function get_message(d,s) {if(typeof d==='string'){d=$doc(d);}const m=$qsa('#messagebox_inner>p',d).map((p)=>p.textContent);if(s){return m;}else{return m.join('\n');}}
/* eslint-enable */

const _window = (typeof unsafeWindow === 'undefined') ? window : unsafeWindow;
const _query = Object.fromEntries(location.search.slice(1).split('&').map((q) => { const [k, v = ''] = q.split('=', 2); return [k, decodeURIComponent(v.replace(/\+/g, ' '))]; }));
const _servername = location.pathname.includes('/isekai/') ? 'isekai' : 'persistent';
const _server = {
  name: _servername,
  season: $id('world_text')?.textContent.match(/\d+ Season \d+/)?.[0] || '1',
  [_servername]: true, // _server.persistent || _server.isekai
};

// CONFIGURATION
const $config = {

  version: 4.1,
  ls_savelist: ['ch_style', 'persona', 'prices', 'equipset'],
  data: [
    /*
    { tag: 'h1', text: 'Random Encounter' },
    { key: 'reNotification', type: 'boolean', label: 'Use Random Encounter Notification.' },
    { key: 'reBattle', type: 'boolean', label: 'Enable Random Encounter Notification in the battle.' },
    { key: 'reGallery', type: 'boolean', label: 'Enable Random Encounter Notification while browsing the gallery.' },
    { key: 'reGalleryAlt', type: 'boolean', label: 'When opening Random Encounter from the gallery, it goes to alt.hentaiverse.org.' },
    { key: 'reBeep', type: 'array', input: 'text', value_type: 'number', value_sep: ',', text: 'Play a beep sound when Random Encounter is ready.\nThe order of values is [volume], [frequency], [duration].\nSet it to 0 to disable.', style: 'width: 150px;', oncreate: (o) => { $input(['button', 'BEEP TEST'], [o.node.input, 'afterend'], null, () => { const validation = $config.validate(o); if (!validation.error) { play_beep(...validation.value); } }); } },
    */

    { tag: 'h1', text: '顶部导航栏设置' },
    { key: 'topMenuIntegration', type: 'boolean', label: '将顶部菜单集成到左上角的按钮中.' },
    { key: 'topMenuLinks', type: 'array', input: 'textarea', text: '在顶部设置快速链接\n如果上面的[顶部导航栏]无法正常工作，请将列表中的项目数量设置为8个或更少.' },
    { key: 'confirmStaminaRestorative', type: 'boolean', label: '使用能量饮料前需确认.', server: 'persistent' },
    { key: 'disableStaminaRestorative', type: 'number', label: '当体力超过设定值时，禁用使用能量饮料按钮.', server: 'persistent' },
    { key: 'warnLowStamina', type: 'number', label: '当体力低于指定值时发出警告.' },


    { tag: 'h1', text: '底部导航栏设置' },
    { key: 'showCredits', type: 'number', input: 'select', options: ['0:disable', '2:always'], label: '显示Credit余额' },
    { key: 'showEquipCapacity', type: 'number', input: 'select', options: ['0:disable', '1:on battle pages only', '2:always'], label: '显示装备仓库剩余空间' },
    { key: 'warnEquipCapacity', type: 'number', label: '当装备仓库的剩余容量不足指定数量时发出警告' },
    { key: 'trainingNotification', type: 'boolean', label: '显示正在进行的训练，并自动开始下一个训练，直到达到预设的训练目标等级' },
    { key: 'lotteryNotification', type: 'boolean', label: '显示目前的武器彩票和防具彩票' },
    { key: 'lotteryFilters', type: 'array', input: 'textarea', text: '高亮显示词条正确的彩票抽奖装备\n* $装备主属性(PAB)筛选暂不可用', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '装备设置' },
    { key: 'equipmentIntegration', type: 'boolean', label: '将所有类型的装备整合到装备列表' },
    { key: 'equipSort', type: 'boolean', label: '整理和分类装备列表' },
    { key: 'equipColor', type: 'boolean', label: '不同等级的装备以不同的颜色显示' },
    { key: 'equipShowLevel', type: 'boolean', label: '显示装备的等级' },
    { key: 'equipShowPAB', type: 'boolean', label: '显示装备的属性' },
    { key: 'equipHoverFunctions', type: 'boolean', label: '当鼠标光标悬停在装备上时，启用键盘和鼠标操作' },
    { key: 'equipTouchFunctions', type: 'boolean', label: '启用移动设备上的触屏操作' },
    { key: 'equipCode', type: 'string', input: 'textarea', text: '设置论坛代码的格式', style: 'height: 80px; white-space: normal;' },
    { key: 'equipNameCode', type: 'array', input: 'textarea', text: '设置美化装备名称的代码规则' },

    { tag: 'h1', text: '装备商店设置' },
    { key: 'equipmentShopConfirm', type: 'number', input: 'select', options: ['0:默认', '1:自动点击确认', '2:无需确认'], label: '在出售或分解装备时进行二次确认' },
    { key: 'equipmentShopAutoProtect', type: 'boolean', label: '自动保护符合规则的装备' },
    { key: 'equipmentShopPriceDeductFee', type: 'boolean', label: '显示实际价格——由于市场会收取1%的手续费，因此材料的实际价值为价格的99%' },
    { key: 'equipmentShopProtectFilters', type: 'array', input: 'textarea', text: '在列表顶部集中显示高价值的装备，并阻止它们被“全选”按钮选中', desc: 'equipFilters', validator: 'equipFilters' },
    { key: 'equipmentShopBazaarFilters', type: 'array', input: 'textarea', text: '在商店中仅显示优质词条的装备，隐藏所有其他低效词条的装备', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: 'Monster Lab' },
    { key: 'monsterLab', type: 'boolean', label: '高级怪物实验室设置', server: 'persistent' },
    { key: 'monsterLabDefaultSort', type: 'string', input: 'select', options: ['index', 'name', 'class', 'pl:power level', 'wins', 'kills', 'gains:new gifts', 'gifts:total gifts', 'morale', 'hunger'], label: 'Set the default value for sorting the list.', server: 'persistent' },
    { key: 'monsterLabCloseDefaultPopup', type: 'boolean', label: '关闭默认弹窗.', server: 'persistent' },

    { tag: 'h1', text: 'The Shrine' },
    { key: 'shrineHideItems', type: 'array', input: 'textarea', text: '隐藏特定奖杯，避免误操作献祭' },
    { key: 'shrineFilters', type: 'array', input: 'textarea', text: '只显示高价值的奖励装备\n* $装备主属性(PAB)筛选暂不可用', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '邮件设置' },
    { key: 'moogleMail', type: 'boolean', label: '高级邮件功能' },

    { tag: 'h1', text: '战斗设置' },
    { key: 'equipPanelPosition', type: 'string', input: 'select', options: ['左侧', '右侧'], label: '设置药水的位置' },
    { key: 'equipPanelRepairThreshold', type: 'number', label: '装备耐久度不足设置的数值时，发出警告' },
    { key: 'equipPanelItemInventory', type: 'object', input: 'textarea', value_type: 'number', text: '显示道具的剩余数量，如果数量不足，则发出警告\n你可以通过单击列表中的道具名称，快捷地从物品商店购买指定数量' },
  ],
  text: {
    装备光标悬停功能设置: `
      [C] 在弹出窗口中打开装备链接
      [V] 在新选项卡中打开装备链接
      [L] 显示装备链接代码
      [K] 以BBcode格式显示链接代码
      [DOUBLE CLICK] 打开装备连接
    `,
    移动端装备功能设置: `
      [双击屏幕] 打开装备连接
      [长按屏幕] 打开装备连接
    `,
  },
  desc: {
    topMenuLinks: `List
    Character
    Equipment
    Abilities
    Training
    Item Inventory
    Equip Inventory
    Settings

    Equipment Shop
    Item Shop
    The Shrine
    The Market
    Monster Lab
    MoogleMail
    Weapon Lottery
    Armor Lottery

      Organize
      Modify
      Repair
      Soulbind
      Purchase
      Sell
      Salvage

      The Arena
      The Tower
      Ring of Blood
      GrindFest
      Item World
    `,
    equipCode: `Syntax
      {$name}       equipment name
      {$namecode}   equipment name in colors/bold
      {$url}        equipment url
      {$eid}        equipment id
      {$_eid}       $eid with a transparent underline for layout
      {$level}      equipment level
      {$pab}        equipment pab
      {$tier}       potency tier (IW level)
      {$price}      the value of the 'price' input field
      {$note}       the value of the 'note' input field
                  - if it contains '$featured', the equip code will be added to 'Featured' section
      {$condition ? text_if_true}
                  - if $condition is a valid value, it prints 'text_if_true', otherwise nothing
                  e.g., {$price? @ $price}
                  - if the equipment has a 'price' value in the Equipment Inventory, it prints like ' @ 10m'.
      {$condition ? text_if_true : text_if_false}
                  - if $condition is a valid value, it prints 'text_if_true', otherwise 'text_if_false'.
                  e.g., {$level ? Lv.$level : Souldbound}
                  - if the equipment has a level, it prints like 'Lv.500', otherwise 'Soulbound'.
    `,
    equipNameCode: `Syntax
      BASE MATCH : option=value, option=value, ...
      BASE MATCH : option=value, option=value, ... ; SUB MATCH : option=value, option=value, ... ; SUB MATCH : option=value, option=value, ...
      - BASE MATCH uses EQUIP FILTER rule.
      - each SUB MATCH is separate.
      - e.g., Willow Staff of Destruction : name=bold ; Demonic : prefix=red ; Tempestuous || Shocking : prefix=orange
      [Option Keywords]
      options : name (full name), quality, prefix, type, slot, suffix
      values : bold, rainbow, or any color such as 'red', '#f00'
      - e.g., Peerless : quality=rainbow, name=bold
    `,
    equipFilters: `Syntax
      ()   : 组
      &&   : 和
      ||   : 或
      !    : 非
      $QUALITY+   : 大于指定稀有度
      $pab=xyz    : 装备提供的主属性类型
      $prefix     : 装备是否有指定词缀
      $level      : 数字形式, 装备的等级
      示例., Magnificent && Power && !Warding 代表同时满足稀有度为史诗，非守护词缀的动力甲
      示例., $Exquisite+ && (Rapier || Shortsword) && Slaughter && $prefix && $pab=sd && $level<250 代表同时满足低于250级，稀有度高于精良，杀戮词缀，提供力量和敏捷属性，的西洋剑或短剑
    `,
  },
  validator: {
    topMenuLinks: function (value) {
      const errors = value.filter((v) => {
        if (_top.menu.hasOwnProperty(v)) { return false; }
        v = v.split('|');
        if (v.length < 3) { return true; }
        if (v.some((e) => e.trim() === '')) { return true; }
      });
      const error = errors.join('\n');
      const result = { value, error };
      return result;
    },
    equipNameCode: function (value) {
      const result = $equip.namecode_parse(value);
      return result;
    },
    equipFilters: function (value) {
      const result = $equip.filter.validate(value);
      return result;
    },
  },
  init: function () {
    $config.ns = _server.persistent ? 'hvut' : 'hvuti';
    $config.prefix = $config.ns + '_';
    $config.default = settings;
    $config.settings = $config.get('settings', {});
    if ($config.settings.version !== $config.version) {
      $config.migration();
    }
  },
  migration: function () {
    if (!$config.settings.version) {
      $config.reset();
      const in_equipdata = $config.ls_get('in_equipdata');
      const in_json = $config.ls_get('in_json');
      if (in_equipdata || in_json) {
        const equipdata = { version: 1 };
        Object.assign(equipdata, in_equipdata, in_json);
        $config.set('equipdata', equipdata);
      }
      const in_equipcode = $config.ls_get('in_equipcode');
      if (in_equipcode) {
        $config.settings.equipCode = in_equipcode.replace(/(\{\$\w+):/g, '$1?').replace(/\$bbcode/g, '$namecode');
      }
      const in_namecode = $config.ls_get('in_namecode');
      if (in_namecode) {
        $config.settings.equipNameCode = in_namecode;
      }

      const prices = $config.ls_get('prices');
      if (prices) {
        Object.entries(prices).forEach(([key, value]) => {
          if (typeof value === 'object') {
            Object.assign(prices, value);
            delete prices[key];
          }
        });
        setTimeout(() => { // $price is not defined yet
          $price.json = null;
          $price.init();
          $price.reset();
          $price.set(prices);
        }, 1000);
      }

      const es_protect = $config.ls_get('es_protect');
      if (es_protect) {
        $config.settings.equipmentShopProtectFilters = es_protect;
      }
      const es_bazaar = $config.ls_get('es_bazaar');
      if (es_bazaar) {
        $config.settings.equipmentShopBazaarFilters = es_bazaar;
      }

      const ml_log = $config.ls_get('ml_log');
      if (ml_log && !ml_log[0]) {
        ml_log[0] = { version: 1 };
        ml_log.forEach((log, i) => {
          if (!log || i === 0) {
            return;
          }
          log.pa = log.pa.map((e) => [e.value, e.to]);
          log.er = log.er.map((e) => [e.value, e.to]);
          log.ct = log.ct.map((e) => [e.value, e.to, e.max]);
          log.gifts = log.gift;
          log.gifts.push(...log.gifts.splice(28, 6, ...log.gifts.splice(40, 5)));
          delete log.gift;
          delete log.selected;
        });
        $config.set('ml_log', ml_log);
        $config.ls_del('ml_log');
      }

      const ls_list = ['equipset', 'ch_style', 'se_settings', 'ss_log', 'ml_log'];
      ls_list.forEach((key) => {
        const value = $config.ls_get(key);
        if (value) {
          $config.set(key, value);
        }
      });

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith($config.prefix)) {
          localStorage.removeItem(key);
        }
      }
    }

    const ss_log = $config.get('ss_log', {});
    Object.values(ss_log).forEach((list) => {
      delete list['1x'];
    });
    $config.set('ss_log', ss_log);

    Object.keys($config.settings).forEach((key) => {
      if (!(key in $config.default)) {
        delete $config.settings[key];
      }
    });
    Object.entries($config.default).forEach(([key, value]) => {
      if (!(key in $config.settings)) {
        $config.settings[key] = JSON.parse(JSON.stringify(value));
      }
    });

    $config.save();
  },
  reset: function () {
    $config.settings = JSON.parse(JSON.stringify($config.default));
  },
  get: function (key, dvalue, prefix = $config.prefix) {
    const value = GM_getValue(prefix + key, dvalue);
    return value;
  },
  set: function (key, value, prefix = $config.prefix) {
    GM_setValue(prefix + key, value);
    if ($config.ls_savelist.includes(key)) {
      $config.ls_set(key, value, prefix);
    }
  },
  del: function (key, prefix = $config.prefix) {
    GM_deleteValue(prefix + key);
  },
  ls_get: function (key, dvalue, prefix = $config.prefix) {
    const value = localStorage.getItem(prefix + key);
    return (value === null) ? dvalue : JSON.parse(value);
  },
  ls_set: function (key, value, prefix = $config.prefix) {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  },
  ls_del: function (key, prefix = $config.prefix) {
    localStorage.removeItem(prefix + key);
  },
  create: function () {
    GM_addStyle(/*css*/`
      .hvut-cfg-div { position: absolute; top: 27px; left: 0; width: 60%; height: calc(100% - 27px); padding: 0 20%; overflow: auto; font-size: 10pt; text-align: left; background-color: #EDEBDF; z-index: 9; }
      .hvut-cfg-div header { margin-bottom: 20px; padding: 10px; font-size: 15pt; font-weight: bold; border-bottom: 2px solid; }
      .hvut-cfg-div h1 { margin: 20px 0 10px; padding: 10px; font-size: 11pt; font-weight: bold; background-color: #fff9; }
      .hvut-cfg-div h2 { margin: 0; font-size: 10pt; font-weight: bold; }
      .hvut-cfg-div h3 { margin: 0; font-size: 10pt; font-weight: bold; text-decoration: underline; }
      .hvut-cfg-div div { margin-left: 10px; padding: 10px; line-height: 24px; }
      .hvut-cfg-div div:hover { background-color: #fff9; }
      .hvut-cfg-div p { margin: 0; }
      .hvut-cfg-disabled { color: #999; }
      .hvut-cfg-error { box-shadow: 0 0 0 2px #c00 inset; }
      .hvut-cfg-error p:last-child { padding: 10px; background-color: #fff9; color: #c00; }
      .hvut-cfg-div footer { position: sticky; bottom: 0; margin-top: 20px; padding: 10px; border-top: 2px solid; text-align: center; background-color: inherit; }
      .hvut-cfg-div input { vertical-align: middle; }
      .hvut-cfg-div input[type='text'] { width: 95%; }
      .hvut-cfg-div input[type='number'] { width: 50px; text-align: right; }
      .hvut-cfg-div textarea { width: 95%; min-height: 200px; white-space: nowrap; }
    `);

    $config.node = {};
    $config.node.div = $element('div', null, ['.hvut-cfg-div'], { change: $config.validate_panel });
    //$config.node.ul = $element('ul', $config.node.div);
    $element('header', $config.node.div, 'HV Utils 设置');

    $config.data.forEach((o) => {
      if (o.tag) {
        $element(o.tag, $config.node.div, o.text);
        //$element('li', $config.node.ul, o.text, () => { scrollIntoView(h); });
        return;
      }
      o.node = {};
      o.node.div = $element('div', $config.node.div);
      $element('h2', o.node.div, o.key);

      if (o.input === 'textarea') {
        //o.node.input = $element('textarea', o.node.div, { spellcheck: false });
      } else if (o.input === 'select') {
        o.node.input = $input(['select', o.options], o.node.div);
        if (o.label) {
          $element('span', o.node.div, o.label);
        }
      } else if (o.type === 'boolean') {
        o.node.input = $input(['checkbox', o.label], o.node.div);
      } else if (o.type === 'number') {
        o.node.input = $input(['number'], o.node.div);
        if (o.label) {
          $element('span', o.node.div, o.label);
        }
      } else {
        o.node.input = $input(['text'], o.node.div);
      }

      let text = $config.text[o.text || o.key] || o.text;
      if (text) {
        text = text.trim().replace(/^ +/gm, '').replace(/\n/g, '<br>');
        o.node.text = $element('p', o.node.div, ['/' + text]);
      }
      if (o.input === 'textarea') {
        $input(['button', 'Default'], o.node.div, null, () => { $config.set_input(o); });
      }
      let desc = $config.desc[o.desc || o.key];
      if (desc) {
        desc = desc.trim().replace(/^ +/gm, '').split('\n');
        const button = desc[0];
        desc = desc.slice(1).join('<br>');
        $input(['button', button], o.node.div, null, () => { o.node.desc.classList.toggle('hvut-none'); });
        //$element('br', o.node.div);
        o.node.desc = $element('p', o.node.div, ['/' + desc, '.hvut-none']);
      }

      if (o.input === 'textarea') { // append here
        o.node.input = $element('textarea', o.node.div, { spellcheck: false });
      }
      o.node.input.dataset.key = o.key;
      if (o.style) {
        o.node.input.style.cssText = o.style;
      }
      if (o.server && o.server !== _server.name) {
        o.node.div.classList.add('hvut-cfg-disabled');
        o.node.input.disabled = true;
      }
      if (o.oncreate) {
        o.oncreate(o);
      }
    });

    const bottom = $element('footer', $config.node.div);
    $input(['button', '保存设置'], bottom, null, () => { $config.save(true); });
    $input(['button', '关闭窗口'], bottom, null, () => { $config.close(); });
    $input(['button', '还原设置'], bottom, null, () => { $config.load($config.settings); });
    $input(['button', '恢复默认'], bottom, null, () => { $config.load($config.default); });
  },
  open: function (key) {
    if (!$config.node) {
      $config.create();
    }
    $id('csp').appendChild($config.node.div);
    $config.load();
    if (key) {
      const o = $config.data.find((o) => o.key === key);
      scrollIntoView(o.node.div);
    }
  },
  close: function () {
    $config.node.div.remove();
  },
  set_panel: function (obj = $config.settings) {
    $config.data.forEach((o) => {
      if (!o.key) {
        return;
      }
      const value = obj[o.key];
      $config.set_input(o, value);
    });
  },
  set_input: function (o, value) {
      const input = o.node.input;
      if (input.disabled) {
        return;
      }
      if (value === undefined) {
      //return;
      value = $config.default[o.key];
      }
      if (o.type === 'boolean') {
        input.checked = value;
      } else if (o.type === 'number') {
        input.value = value;
      } else if (o.type === 'string') {
        input.value = value;
      } else if (o.type === 'array') {
        input.value = $config.array2text(value, o.value_sep);
      } else if (o.type === 'object') {
        input.value = $config.obj2text(value, o.value_sep);
      }
  },
  get_panel: function () {
    const obj = {};
    const errors = [];
    $config.data.forEach((o) => {
      if (!o.key) {
        return;
      }
      if (o.server && o.server !== _server.name) {
        return;
      }
      const validation = $config.validate(o);
      if (validation.error) {
        errors.push(o);
        return;
      }
      obj[o.key] = validation.value;
    });
    if (errors.length) {
      scrollIntoView(errors[0].node.div);
      return false;
    }
    return obj;
  },
  validate_panel: function (e) {
    const key = e.target.dataset.key;
    const o = $config.data.find((o) => o.key === key);
    const validation = $config.validate(o);
    return validation;
  },
  validate: function (o) {
    let value;
    let error;
    if (o.type === 'boolean') {
      value = o.node.input.checked;
    } else if (o.type === 'number') {
      value = Number(o.node.input.value);
    } else if (o.type === 'string') {
      value = o.node.input.value;
    } else if (o.type === 'array') {
      ({ value, error } = $config.text2array(o.node.input.value, o.value_sep, o.value_type));
    } else if (o.type === 'object') {
      ({ value, error } = $config.text2obj(o.node.input.value, o.value_sep, o.value_type));
    }
    const validator = $config.validator[o.validator || o.key];
    if (validator) {
      const _error = error;
      ({ value, error } = validator(value));
      if (!error) {
        error = _error;
      }
    }
    if (error) {
      if (!o.node.error) {
        o.node.error = $element('p', o.node.div);
      }
      const html = error.replace(/\n/g, '<br>');
      o.node.error.innerHTML = '<h3>Validation Error</h3>' + html;
      o.node.div.appendChild(o.node.error);
      o.node.div.classList.add('hvut-cfg-error');
    } else {
      o.node.error?.remove();
      o.node.div.classList.remove('hvut-cfg-error');
    }
    const result = { value, error };
    return result;
  },
  load: function (obj = $config.settings) {
    $config.set_panel(obj);
    $config.get_panel();
  },
  save: function (panel) {
    if (panel) {
      const obj = $config.get_panel();
      if (!obj) { // error
        return;
      }
      $config.settings = obj;
    }
    $config.settings.version = $config.version;
    $config.set('settings', $config.settings);
    if (panel) {
      location.href = location.href;
    }
  },
  text2obj: function (text, sep = ['\n', ':'], type) {
    const obj = {};
    const errors = [];
    text.split(sep[0]).filter((t) => t.trim()).forEach((t) => {
      const split = split2(t, sep[1]);
      const key = split[0];
      let value = split[1];
      if (!key || !value) {
        errors.push(t);
        return true;
      }
      if (type === 'number') {
        value = Number(value);
        if (isNaN(value)) {
          errors.push(t);
          return true;
        }
      }
      obj[key] = value;
    });
    const error = errors.join('\n');
    const result = { value: obj, error };
    return result;
  },
  obj2text: function (obj, sep = ['\n', ':']) {
    const text = Object.entries(obj).map(([key, value]) => `${key} ${sep[1]} ${value}`).join(sep[0]);
    return text;
  },
  text2array: function (text, sep = '\n', type) {
    const errors = [];
    const array = text.split(sep).filter((t) => t.trim()).map((t) => {
      let value = t.trim();
      if (type === 'number') {
        value = Number(value);
        if (isNaN(value)) {
          errors.push(t);
          return true;
        }
      }
      return value;
    });
    const error = errors.join('\n');
    const result = { value: array, error };
    return result;
  },
  array2text: function (array, sep = '\n') {
    if (!sep.includes('\n')) {
      sep += ' ';
    }
    const text = array.join(sep);
    return text;
  },

};

$config.init();
//$config.settings = settings;

// AJAX
const $ajax = {

  interval: 300, // DO NOT DECREASE THIS NUMBER, OR IT MAY TRIGGER THE SERVER'S LIMITER AND YOU WILL GET BANNED
  max: 4,
  tid: null,
  conn: 0,
  index: 0,
  queue: [],

  fetch: function (url, data, method, context = {}, headers = {}) {
    return new Promise((resolve, reject) => {
      $ajax.add(method, url, data, resolve, reject, context, headers);
    });
  },
  repeat: function (count, func, ...args) {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(func(...args));
    }
    return list;
  },
  add: function (method, url, data, onload, onerror, context = {}, headers = {}) {
    console.log('ajax call', url);
    if (!data) {
      method = 'GET';
    } else if (!method) {
      method = 'POST';
    }
    if (method === 'POST') {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      if (data && typeof data === 'object') {
        data = Object.entries(data).map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value)).join('&');
      }
    } else if (method === 'FORM') {
      method = 'POST';
      //headers['Content-Type'] = 'multipart/form-data';
      if (data instanceof FormData === false) {
        data = new FormData(data);
      }
    } else if (method === 'JSON') {
      method = 'POST';
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (data && typeof data === 'object') {
        data = JSON.stringify(data);
      }
    }
    context.onload = onload;
    context.onerror = onerror;
    $ajax.queue.push({ method, url, data, headers, context, onload: $ajax.onload, onerror: $ajax.onerror });
    $ajax.next();
  },
  next: function () {
    if (!$ajax.queue[$ajax.index] || $ajax.error) {
      return;
    }
    if ($ajax.tid) {
      if (!$ajax.conn) {
        clearTimeout($ajax.tid);
        $ajax.timer();
        $ajax.send();
      }
    } else {
      if ($ajax.conn < $ajax.max) {
        $ajax.timer();
        $ajax.send();
      }
    }
  },
  timer: function () {
    $ajax.tid = setTimeout(() => {
      $ajax.tid = null;
      $ajax.next();
    }, $ajax.interval);
  },
  send: function () {
    GM_xmlhttpRequest($ajax.queue[$ajax.index]);
    $ajax.index++;
    $ajax.conn++;
  },
  onload: function (r) {
    $ajax.conn--;
    const text = r.responseText;
    if (r.status !== 200) {
      $ajax.error = `${r.status} ${r.statusText}: ${r.finalUrl}`;
      r.context.onerror?.();
    } else if (text === 'state lock limiter in effect') {
      if ($ajax.error !== text) {
        popup(`<p style="color: #f00; font-weight: bold;">${text}</p><p>You have reached the maximum connection limit.<br>Try again later.</p>`);
      }
      $ajax.error = text;
      r.context.onerror?.();
    } else {
      r.context.onload?.(text);
      $ajax.next();
    }
  },
  onerror: function (r) {
    $ajax.conn--;
    $ajax.error = `${r.status} ${r.statusText}: ${r.finalUrl}`;
    r.context.onerror?.();
    $ajax.next();
  },

};

window.addEventListener('unhandledrejection', (e) => { console.log($ajax.error || e); });

// RANDOM ENCOUNTER
const $re = {

  init: function () {
    if ($re.inited) {
      return;
    }
    $re.inited = true;
    $re.type = (!location.hostname.includes('hentaiverse.org') || _server.isekai) ? 'eh' : $id('navbar') ? 'hv' : $id('battle_top') ? 'ba' : false;
    $re.get();
  },
  clock: function (button) {
    $re.init();
    $re.button = button;
    $re.button.addEventListener('click', (e) => { $re.run(e.ctrlKey || e.shiftKey); });
    const date = new Date($re.json.date);
    const now = new Date();
    if (date.getUTCDate() !== now.getUTCDate() || date.getUTCMonth() !== now.getUTCMonth() || date.getUTCFullYear() !== now.getUTCFullYear()) {
      $re.reset();
      $re.load();
    }
    $re.start();
  },
  hv: function () {
    $re.init();
    $re.check();
    const button = $element('div', _top.node.div, ['!width: 80px; cursor: pointer;']);
    $re.clock(button);
  },
  ba: function () {
    if (!$config.settings.reBattle) {
      return;
    }
    $re.init();
    if ($id('textlog').tBodies[0].lastElementChild.textContent === 'Initializing random encounter ...') {
      $re.check();
    }
    const button = $element('div', $id('csp'), ['RE', '!position: absolute; top: 10px; left: 600px; cursor: pointer; font-size: 10pt; font-weight: bold;']);
    $re.clock(button);

    // support monsterbation that clears all timer id when a round starts
    const target = document.body;
    const options = { childList: true };
    const callback = function () {
      if (!button.parentNode.parentNode && $id('csp')) {
        $id('csp').appendChild(button);
      }
      $re.start();
    };
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
  },
  eh: function () {
    $re.init();
    const link = $qs('#eventpane a');
    const onclick = link?.getAttribute('onclick');
    const key = onclick?.match(/\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/)?.[1];
    if (key) {
      $re.set(key);
      if ($config.settings.reGalleryAlt) {
        link.setAttribute('onclick', onclick.replace('https://hentaiverse.org/', 'http://alt.hentaiverse.org/'));
      }
    }
    if ($config.settings.reGallery && $id('nb')) {
      $id('nb').style.maxWidth = '1080px';
      const button = $element('a', $element('div', $id('nb')), ['!display: inline-block; width: 70px; text-align: left; cursor: pointer;']);
      $re.clock(button);
    }
  },
  get: function () {
    $re.json = $config.get('re', { date: 0, key: '', count: 0, clear: true }, 'hvut_');
  },
  set: function (key) {
    if (key) {
      $re.json.key = key;
      $re.json.date = Date.now();
      $re.json.count++;
      $re.json.clear = false;
    }
    $config.set('re', $re.json, 'hvut_');
  },
  reset: function () {
    $re.json.date = Date.now();
    $re.json.count = 0;
    $re.json.clear = true;
    $re.set();
    $re.start();
  },
  check: function () {
    const key = /\?s=Battle&ss=ba&encounter=([A-Za-z0-9=]+)/.exec(location.search)?.[1];
    if (key) {
      const now = Date.now();
      if ($re.json.key === key) {
        if (!$re.json.clear) {
          $re.json.clear = true;
          $re.set();
        }
      } else if ($re.json.date + 1800000 < now) {
        $re.json.date = now;
        $re.json.key = key;
        $re.json.count++;
        $re.json.clear = true;
        $re.set();
      }
    }
  },
  refresh: function () {
    const remain = $re.json.date + 1800000 - Date.now();
    if (remain > 0) {
      $re.button.textContent = time_format(remain, 2) + ` [${$re.json.count}]`;
      $re.beep = true;
    } else {
      $re.button.textContent = (!$re.json.clear ? 'Expired' : 'Ready') + ` [${$re.json.count}]`;
      if ($re.beep) {
        $re.beep = false;
        play_beep(...$config.settings.reBeep);
      }
      $re.stop();
    }
  },
  run: async function (engage) {
    if ($re.type === 'ba') {
      $re.load();
    } else if ($re.type === 'hv') {
      if (!$re.json.clear || engage) {
        $re.engage();
      } else {
        $re.load(true);
      }
    } else if ($re.type === 'eh') {
      $re.stop();
      $re.button.textContent = 'Checking...';
      const html = await $ajax.fetch('https://hentaiverse.org/');
      if (html.includes('<div id="navbar">')) {
        if (!$re.json.clear || engage) {
          $re.engage();
        } else {
          $re.load(true);
        }
      } else {
        $re.load();
      }
    }
  },
  load: async function (engage) {
    $re.stop();
    $re.get();
    $re.button.textContent = 'Loading...';
    const html = await $ajax.fetch('https://e-hentai.org/news.php');
    const doc = $doc(html);
    const eventpane = $id('eventpane', doc)?.innerHTML;
    const key = eventpane?.match(/\?s=Battle&amp;ss=ba&amp;encounter=([A-Za-z0-9=]+)/)?.[1];
    if (key) {
      $re.set(key);
      if (engage) {
        $re.engage();
        return;
      }
    } else if (eventpane?.includes('It is the dawn of a new day')) {
      popup(eventpane);
      $re.reset();
    } else {
      popup('Failed to generate a new Random Encounter key');
    }
    $re.start();
  },
  engage: function () {
    if (!$re.json.key) {
      return;
    }
    const href = `?s=Battle&ss=ba&encounter=${$re.json.key}`;
    if ($re.type === 'ba') {
      return;
    } else if ($re.type === 'hv') {
      location.href = href;
    } else if ($re.type === 'eh') {
      window.open(($config.settings.reGalleryAlt ? 'http://alt.hentaiverse.org/' : 'https://hentaiverse.org/') + href, '_blank');
      $re.json.clear = true;
      $re.start();
    }
  },
  start: function () {
    $re.stop();
    if (!$re.json.clear) {
      $re.button.style.color = '#e00';
    } else {
      $re.button.style.color = '';
    }
    $re.tid = setInterval($re.refresh, 1000);
    $re.refresh();
  },
  stop: function () {
    if ($re.tid) {
      clearInterval($re.tid);
      $re.tid = 0;
    }
  },

};

/* NO-NAVBAR */
if (!$id('navbar')) {
  // BATTLE
  if ($id('battle_top')) {
    if ($config.settings.reNotification) {
      $re.ba();
    }
    //location.href = '?s=Battle';

  // RIDDLE MASTER
  } else if ($id('riddleform')) {
    //location.href = '?s=Battle';

  // GALLERY
  } else if (location.hostname === 'e-hentai.org') {
    if ($config.settings.reNotification) {
      $re.eh();
    }
  }

  return;
}

// CHECK FONT SETTINGS
const level_exec = /^(.+) Lv\.(\d+)/.exec($id('level_readout').textContent.trim());
if (!level_exec) {
  if (_query.ss === 'se') {
    alert('To use HVUT, You have to set a [Custom Font] first.');
    scrollIntoView($id('settings_cfont').parentNode, $id('settings_outer'));
    const form = $qs('#settings_outer form');
    form.fontlocal.checked = true;
    form.fontlocal.required = true;
    form.fontface.required = true;
    form.fontsize.required = true;
    form.fontface.placeholder = 'Tahoma, Arial';
    form.fontsize.placeholder = '10';
    form.fontoff.placeholder = '0';
  } else {
    location.href = '?s=Character&ss=se';
  }
  return;
}

// PLAYER DATA
const _player = {
  difficulty: level_exec[1],
  level: parseInt(level_exec[2]),
  stamina: parseInt(/Stamina: (\d+)/.exec($id('stamina_readout').textContent)[1]),
  accuracy: $qs('#stamina_readout > div:nth-child(2)').title,
  condition: $qs('#stamina_readout img[title^="Stamina"]').title,
  warn: [],
};

/* START */

/* eslint-disable one-var */
var _ch = {},
    _eq = {},
    _ab = {},
    _tr = {},
    //_it = {},
    _se = {},

    //_is = {},
    _ml = {},
    _ss = {},
    _mk = {},
    _mm = {},
    _lt = {},
    //_la = {},

    _ar = {},
    //_rb = {},
    //_gr = {},
    //_iw = {},

    _top = {},
    _bottom = {};
/* eslint-enable */

// EQUIP PARSER
const $equip = {

  dynjs_equip: _window.dynjs_equip || {},
  dynjs_eqstore: _window.dynjs_eqstore || {},

  icon: {
    equipped: '\u{1F5E1}\u{FE0F}',
    pinned: '\u{1F4CC}',
    stored: '\u{1F4E6}',
    protected: '\u{1F6E1}\u{FE0F}',
    locked: '\u{1F512}',
    highlevel: '\u{1F53A}',
  },

  index: {
    category: { 'One-handed Weapon': 1, 'Two-handed Weapon': 2, 'Staff': 3, 'Shield': 4, 'Cloth Armor': 5, 'Light Armor': 6, 'Heavy Armor': 7, 'Unknown': 99 },
    type: {
      'Rapier': 1, 'Shortsword': 2, 'Dagger': 3, 'Wakizashi': 4, 'Axe': 5, 'Club': 6,
      'Katana': 1, 'Longsword': 2, 'Estoc': 3, 'Scythe': 4, 'Great Mace': 5, 'Swordchucks': 6,
      'Oak Staff': 1, 'Willow Staff': 2, 'Katalox Staff': 3, 'Redwood Staff': 4, 'Ebony Staff': 5,
      'Force Shield': 1, 'Tower Shield': 2, 'Buckler': 3, 'Kite Shield': 4,
      'Phase': 1, 'Cotton': 2, 'Gossamer': 3, 'Ironsilk': 4,
      'Shade': 1, 'Leather': 2, 'Kevlar': 3, 'Drakehide': 4,
      'Power': 1, 'Reactive': 2, 'Plate': 3, 'Chain': 4,
    },
    quality: { 'Peerless': 1, 'Legendary': 2, 'Magnificent': 3, 'Exquisite': 4, 'Superior': 5, 'Average': 6, 'Fair': 7, 'Crude': 8 },
    prefix: {
      'Ethereal': 1, 'Fiery': 2, 'Arctic': 3, 'Shocking': 4, 'Tempestuous': 5, 'Hallowed': 6, 'Demonic': 7,
      'Radiant': 1, 'Charged': 2, 'Mystic': 3, 'Frugal': 4,
      'Savage': 1, 'Agile': 2, 'Reinforced': 3, 'Shielding': 4, 'Mithril': 5,
      'Ruby': 11, 'Cobalt': 12, 'Amber': 13, 'Jade': 14, 'Zircon': 15, 'Onyx': 16,
    },
    slot: {
      'Cap': 1, 'Robe': 2, 'Gloves': 3, 'Pants': 4, 'Shoes': 5,
      'Helmet': 1, 'Breastplate': 2, 'Cuirass': 2, 'Armor': 2, 'Gauntlets': 3, 'Greaves': 4, 'Leggings': 4, 'Sabatons': 5, 'Boots': 5,
    },
    suffix: {
      'Slaughter': 1, 'Balance': 2, 'Swiftness': 3, 'the Barrier': 4, 'the Nimble': 5, 'the Battlecaster': 6, 'the Vampire': 7, 'the Illithid': 8, 'the Banshee': 9,
      'the Shadowdancer': 31, 'the Fleet': 32, 'the Arcanist': 33, 'Negation': 34,
      'Destruction': 1, 'Focus': 2,
      'Surtr': 11, 'Niflheim': 12, 'Mjolnir': 13, 'Freyr': 14, 'Heimdall': 15, 'Fenrir': 16,
      'the Elementalist': 21, 'the Heaven-sent': 22, 'the Demon-fiend': 23, 'the Earth-walker': 24, 'the Curse-weaver': 25,
      'Protection': 41, 'Warding': 42, 'Dampening': 43, 'Stoneskin': 44, 'Deflection': 45,
      'the Fire-eater': 51, 'the Frost-born': 52, 'the Thunder-child': 53, 'the Wind-waker': 54, 'the Thrice-blessed': 55, 'the Spirit-ward': 56,
      'the Ox': 61, 'the Raccoon': 62, 'the Cheetah': 63, 'the Turtle': 64, 'the Fox': 65, 'the Owl': 66,
    },
  },
  reg: {
    name: (() => {
      const quality = 'Crude|Fair|Average|Superior|Exquisite|Magnificent|Legendary|Peerless';
      const prefix = 'Ethereal|Fiery|Arctic|Shocking|Tempestuous|Hallowed|Demonic|Ruby|Cobalt|Amber|Jade|Zircon|Onyx|Charged|Frugal|Radiant|Mystic|Agile|Reinforced|Savage|Shielding|Mithril';
      const slot = 'Cap|Robe|Gloves|Pants|Shoes|Helmet|Breastplate|Gauntlets|Leggings|Boots|Cuirass|Armor|Greaves|Sabatons';
      const onehanded = 'Shortsword|Dagger|Axe|Wakizashi|Rapier|Club';
      const twohanded = 'Longsword|Katana|Scythe|Estoc|Great Mace|Swordchucks';
      const staff = 'Ebony Staff|Redwood Staff|Oak Staff|Katalox Staff|Willow Staff';
      const shield = 'Buckler|Kite Shield|Tower Shield|Force Shield';
      const acloth = 'Cotton|Gossamer|Ironsilk|Phase';
      const alight = 'Leather|Drakehide|Kevlar|Shade';
      const aheavy = 'Chain|Plate|Reactive|Power';
      const pattern = `^(${quality})(?: (?:(${prefix})|(.+?)))? (?:(${onehanded})|(${twohanded})|(${staff})|(${shield})|(?:(?:(${acloth})|(${alight})|(${aheavy})) (${slot})))(?: of (.+))?$`;
      return new RegExp(pattern, 'i');
    })(),
    html: />([\w -]+(?<! ))(?: |&nbsp;)*(?:Level (?:(\d+)|(Unassigned))|Tier (\d+) \/ (\d+) \/ (\d+)).*(Tradeable|Untradeable|Soulbound).*(?:Condition: (\d+(?:\.\d+)?)%.*Energy: (?:(\d+(?:\.\d+)?)%|(N\/A))|(Salvaged) - Repair Required)/,magic: /Fire|Cold|Elec|Wind|Holy|Dark/i,
    pab: /Strength|Dexterity|Agility|Endurance|Intelligence|Wisdom/g,
  },

  parse: {
    name: function (name, eq) {
      eq = eq || { info: {}, data: {}, node: {} };
      if (!eq.info.name) {
        eq.info.name = name;
      }
      const exec = $equip.reg.name.exec(name);
      if (exec) {
        if (!eq.info.category) {
          eq.info.category = exec[4] ? 'One-handed Weapon' : exec[5] ? 'Two-handed Weapon' : exec[6] ? 'Staff' : exec[7] ? 'Shield' : exec[8] ? 'Cloth Armor' : exec[9] ? 'Light Armor' : exec[10] ? 'Heavy Armor' : 'Unknown';
        }
        eq.info.quality = exec[1];
        eq.info.prefix = exec[2] || exec[3];
        eq.info.type = exec[4] || exec[5] || exec[6] || exec[7] || exec[8] || exec[9] || exec[10];
        eq.info.slot = exec[11];
        eq.info.suffix = exec[12];
      } else if (!eq.info.category) {
        eq.info.category = 'Unknown';
      }
      return eq;
    },
    html: function (html) {
      const exec = $equip.reg.html.exec(html);
      if (!exec) {
        return null;
      }
      const info = {
        category: exec[1],
        level: parseInt(exec[2]) || 0,
        unassigned: exec[3] === 'Unassigned',
        upgrade: parseInt(exec[4]),
        iw: parseInt(exec[5]),
        upgrade_max: parseInt(exec[6]),
        tradeable: exec[7] === 'Tradeable',
        soulbound: exec[7] === 'Soulbound',
        condition: parseFloat(exec[8]),
        energy: exec[9] ? parseFloat(exec[9]) : null,
        salvaged: exec[10] === 'Salvaged',
        pab: html.match($equip.reg.pab)?.map((p) => p[0]).join('') || '',
      };
      return info;
    },
    dynjs: function (eid) {
      const dynjs = $equip.dynjs_equip[eid] || $equip.dynjs_eqstore[eid];
      if (!dynjs) {
        return { error: 'no data' };
      }
      const info = $equip.parse.html(dynjs.d);
      if (!info) {
        return { error: 'parse error' };
      }
      let name;
      let customname;
      if (dynjs.n) {
        name = dynjs.n;
        customname = dynjs.t;
      } else {
        name = dynjs.t;
        customname = null;
      }
      const eq = {
        info: {
          name,
          customname,
          eid,
          key: dynjs.k,
          ...info,
        },
        data: {
          html: dynjs.d,
        },
        node: {},
      };
      $equip.parse.name(eq.info.name, eq);
      return eq;
    },
    elem: function (elem) {
      const eid = /(?:hover_equip|equips\.set)\((\d+)/.exec(elem.getAttribute('onmouseover'))?.[1];
      if (!eid) {
        return { error: 'invalid element' };
      }
      const eq = $equip.parse.dynjs(eid);
      if (eq.error) {
        return eq;
      }
      const text = elem.textContent;
      eq.info.equipped = text.includes($equip.icon.equipped);
      eq.info.pinned = text.includes($equip.icon.pinned);
      eq.info.stored = text.includes($equip.icon.stored);
      eq.info.protected = text.includes($equip.icon.protected);
      eq.info.locked = text.includes($equip.icon.locked);
      eq.info.highlevel = text.includes($equip.icon.highlevel);
      elem.dataset.eid = eq.info.eid;
      elem.dataset.key = eq.info.key;
      eq.node.elem = elem;
      return eq;
    },
  },

  list: {
    table: function (table, sort = true) {
      if (!table) {
        return;
      }
      const equiplist = Array.from($qsa('tr[onmouseover*="hover_equip"]', table)).map((tr) => {
        const eq = $equip.parse.elem(tr);
        eq.node.wrapper = tr;
        eq.node.check = $qs('input[name="eqids[]"]', tr);
        if (eq.info.customname) {
          tr.classList.add('hvut-eqp-customname');
          tr.dataset.eqname = eq.info.name;
        }
        tr.classList.add('hvut-eqp-' + eq.info.quality);
        return eq;
      });

      const eqselall = $qs('.eqselall', table);
      if (eqselall) {
        eqselall.cells[0].colSpan = 10;
        const thead = $element('thead', [table, 0]);
        thead.appendChild(eqselall);
      }
      if ($config.settings.equipSort && sort) {
        $equip.list.sort(equiplist, table);
      }
      $equip.list.showinfo(equiplist, $config.settings.equipShowLevel && 'level', $config.settings.equipShowPAB && 'pab');

      return equiplist;
    },
    div: function (node, sort = true, parent = node) {
      if (!node) {
        return;
      }
      const equiplist = Array.from($qsa('div[onmouseover*="equips.set"]', node)).map((div) => {
        const eq = $equip.parse.elem(div);
        eq.node.wrapper = div.parentNode;
        if (eq.info.customname) {
          div.classList.add('hvut-eqp-customname');
          div.dataset.eqname = eq.info.name;
        }
        div.classList.add('hvut-eqp-' + eq.info.quality);
        return eq;
      });
      if ($config.settings.equipSort && sort) {
        $equip.list.sort(equiplist, parent);
      }
      return equiplist;
    },
    sort: function (equiplist, parent) {
      function create_category(text, className) {
        if (is_table) {
          const tr = $element('tr', frag, [className]);
          $element('td', tr, { textContent: text, colSpan: 10 });
        } else {
          $element('p', frag, [text, className]);
        }
      }
      const is_table = parent.nodeName === 'TABLE';

      $equip.sort(equiplist);
      const frag = $element();
      equiplist.forEach((eq, i, a) => {
        const p = a[i - 1] || { info: {} };
        if (eq.info.category !== p.info.category) {
          create_category(eq.info.category, '.hvut-eqp-category');
        }
        switch (eq.info.category) {
          case 'One-handed Weapon':
          case 'Two-handed Weapon':
            if (eq.info.type !== p.info.type) {
              create_category(eq.info.type || 'Unknown', '.hvut-eqp-type');
            } else if (eq.info.suffix !== p.info.suffix) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Staff':
            if (eq.info.type !== p.info.type) {
              create_category(eq.info.type || 'Unknown', '.hvut-eqp-type');
            } else if (eq.info.prefix !== p.info.prefix) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Shield':
            if (eq.info.type !== p.info.type) {
              create_category(eq.info.type || 'Unknown', '.hvut-eqp-type');
            } else if (eq.info.suffix !== p.info.suffix) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Cloth Armor':
            if (eq.info.suffix !== p.info.suffix) {
              create_category((eq.info.type ? (eq.info.suffix || 'suffixless') : 'Unknown'), '.hvut-eqp-type');
            } else if (eq.info.slot !== p.info.slot) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Light Armor':
          case 'Heavy Armor':
            if (eq.info.type !== p.info.type || eq.info.slot !== p.info.slot) {
              create_category((eq.info.type ? `${eq.info.type} ${eq.info.slot}` : 'Unknown'), '.hvut-eqp-type');
            } else if (eq.info.suffix !== p.info.suffix && (eq.info.type === 'Shade' || eq.info.type === 'Power')) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
        }
        frag.appendChild(eq.node.wrapper);
      });

      if (is_table) {
        const thead = $qs('.eqselall', parent)?.parentNode;
        parent.innerHTML = '';
        if (thead) {
          parent.appendChild(thead);
        }
        const tbody = $element('tbody', parent);
        tbody.appendChild(frag);
      } else {
        parent.innerHTML = '';
        parent.appendChild(frag);
      }

      return equiplist;
    },
    showinfo: function (equiplist, ...prop) {
      prop = prop.filter((p) => !!p);
      if (!prop.length) {
        return;
      }
      equiplist.forEach((eq) => {
        const frag = $element();
        prop.forEach((p) => {
          eq.node[p] = $element('td', frag, { textContent: (eq.info[p] || ''), className: `hvut-eqp-${p}` });
        });
        const tr = eq.node.wrapper;
        tr.firstElementChild.after(frag);
      });
    },
  },

  filter: {
    quality: {
      'crude': 1, 'fair': 2, 'average': 3, 'superior': 4, 'exquisite': 5, 'magnificent': 6, 'legendary': 7, 'peerless': 8,
    },
    equip: function (filters, equip) {
      if (!filters) {
        return false;
      }
      let name;
      if (typeof equip === 'string') {
        name = equip;
        equip = null;
      } else {
        name = equip.info.name;
      }
      return filters.some((f) => $equip.filter.test(f, equip, name));
    },
    test: function (filter, equip, name = equip.info.name) {
      if (!filter) {
        return false;
      }
      const n = name.toLowerCase();
      const r = filter.toLowerCase().replace(/[a-z0-9-$=<>+ ]+/g, (f) => {
        f = f.trim();
        if (!f) {
          return '';
        } else if (!/[^a-z- ]/.test(f)) {
          return n.includes(f);
        } else if (f.includes('$')) {
          return $equip.filter.details(f, equip);
        } else {
          throw new Error('Invalid Filter');
        }
      });
      return eval(r);
    },
    details: function (filter, equip) {
      if (/\$([a-z]+)\+/.test(filter)) { // $Magnificent+
        const fquality = RegExp.$1;
        const quality = equip?.info?.quality.toLowerCase() ?? 'crude';
        if (!$equip.filter.quality.hasOwnProperty(fquality)) {
          throw new Error('Invalid Filter');
        }
        return $equip.filter.quality[quality] >= $equip.filter.quality[fquality];
      }
      if (filter.includes('$pab') && /\$pab=([a-z]+)/.test(filter)) {
        const fpab = RegExp.$1;
        const pab = equip?.info?.pab?.toLowerCase() ?? '';
        return fpab.split('').every((p) => pab.includes(p));
      }
      if (filter.includes('$level')) {
        const level = equip?.info?.level ?? 0;
        return filter.replace(/\$level/, level);
      }
      if (filter.includes('$prefix')) {
        return !!equip?.info?.prefix;
      }
      throw new Error('Invalid Filter');
    },
    validate: function (filters) {
      if (!Array.isArray(filters)) {
        filters = [filters];
      }
      const errors = filters.filter((filter) => {
        try {
          $equip.filter.test(filter, null, '');
          return false;
        } catch (e) {
          return true;
        }
      });
      const error = errors.join('\n');
      const result = { value: filters, error };
      return result;
    },
  },

  sort: function (equiplist) {
    equiplist.sort((a, b) => {
      if (a.info.category !== b.info.category) {
        return $equip.index.category[a.info.category] - $equip.index.category[b.info.category];
      } else if (a.info.category === 'Unknown') {
        return (a.info.name > b.info.name) ? 1 : (a.info.name < b.info.name) ? -1 : 0;
      } else if (a.info.category !== 'Cloth Armor' && a.info.type !== b.info.type) {
        return ($equip.index.type[a.info.type] || 99) - ($equip.index.type[b.info.type] || 99);
      }
      let r = 0;
      const k = a.info.category === 'One-handed Weapon' || a.info.category === 'Two-handed Weapon' ? ['suffix', 'quality', 'prefix']
        : (a.info.category === 'Staff') ? ['prefix', 'suffix', 'quality']
        : (a.info.category === 'Shield') ? ['quality', 'suffix', 'prefix']
        : (a.info.category === 'Cloth Armor') ? ['suffix', 'slot', 'quality', 'type', 'prefix']
        : (a.info.type === 'Shade' || a.info.type === 'Power') ? ['slot', 'suffix', 'quality', 'prefix']
        : ['slot', 'quality', 'suffix', 'prefix'];
      k.some((e) => {
        if (e in $equip.index) {
          r = ($equip.index[e][a.info[e]] || 99) - ($equip.index[e][b.info[e]] || 99);
        } else {
          r = (a.info[e] > b.info[e]) ? 1 : (a.info[e] < b.info[e]) ? -1 : 0;
        }
        return r;
      });
      return r || (b.info.eid - a.info.eid);
    });
  },
  namecode: function (eq) {
    if (!$equip.namecode.rules) {
      const validation = $equip.namecode_parse();
      if (validation.error) {
        alert(`Error: invalid code\n\n${validation.error}`);
        return;
      }
      $equip.namecode.rules = validation.rules;
    }
    function rainbow(t) {
      const c = ['#f00', '#f90', '#fc0', '#0c0', '#09f', '#00c', '#c0f'];
      return t.split('').map((t, i) => `[color=${c[i % 7]}]${t}[/color]`).join('');
    }
    function color(t) {
      const s = mod[t];
      if (!s.code || !s.color) {
        return;
      }
      if (s.color === 'rainbow') {
        s.code = rainbow(s.code);
      } else {
        s.code = `[color=${s.color}]${s.code}[/color]`;
      }
    }
    function bold(t) {
      const s = mod[t];
      if (!s.code || !s.bold) {
        return;
      }
      s.code = `[b]${s.code}[/b]`;
    }

    const mod = {
      name: { code: eq.info.name },
      quality: { code: eq.info.quality },
      prefix: { code: eq.info.prefix },
      type: { code: eq.info.type },
      slot: { code: eq.info.slot },
      suffix: { code: 'of ' + eq.info.suffix },
    };
    $equip.namecode.rules.forEach((rule) => {
      rule.some((r, i) => {
        if (!$equip.filter.test(r.match, eq)) {
          if (i === 0) {
            return true; // skip the entire rule if the first fails
          } else {
            return;
          }
        }
        r.options.forEach(({ key, value }) => {
          if (!mod[key]) {
            return;
          }
          if (value === 'bold') {
            mod[key].bold = true;
          } else {
            mod[key].color = value;
          }
        });
      });
    });
    if (eq.info.type) { // obsolete equipment doesn't have any info
      mod.name.code = ['quality', 'prefix', 'type', 'slot', 'suffix'].filter((t) => eq.info[t]).map((t) => { if (mod[t].color && mod[t].color !== mod.name.color) { color(t); } if (!mod.name.bold) { bold(t); } return mod[t].code; }).join(' ');
    }
    color('name');
    bold('name');
    eq.data.namecode = mod.name.code;
    return mod.name.code;
  },
  namecode_parse: function (array = $config.settings.equipNameCode) {
    const rules = [];
    const errors = [];
    array.forEach((s) => {
      if (!s.trim()) {
        return;
      }
      const rule = [];
      s.split(';').forEach((s) => {
        if (!s.trim()) {
          return;
        }
        const [match, text] = split2(s, ':');
        if (!match) {
          errors.push(s);
          return;
        }
        const { error } = $equip.filter.validate(match);
        if (error) {
          errors.push(s);
          return;
        }
        const options = [];
        text.split(',').forEach((o) => {
          o = o.trim();
          const exec = /^(name|quality|prefix|type|slot|suffix)\s*=\s*([\w#]+)$/.exec(o);
          if (!exec) {
            errors.push(s);
            return;
          }
          options.push({ key: exec[1], value: exec[2] });
        });
        const r = { match, options };
        rule.push(r);
      });
      rules.push(rule);
    });
    const namecode = rules.map((r) => r.map((r) => r.match + ' : ' + r.options.map(({ key, value }) => `${key}=${value}`).join(', ')).join(' ; '));
    const error = errors.join('\n');
    const result = { value: namecode, error, rules };
    return result;
  },

};

// ITEM INVENTORY
const $item = {

  list: null,
  reg: {
    itemc: /show_itemc_box\(-?\d+,-?\d+,'\w+',this,'\w+',(\d+)\)/,
    itemr: /show_itemr_box\(-?\d+,-?\d+,'\w+',this,'\w+','.+?','.*?','(.+?)'\)/,
    shrine: /set_shrine_item\((\w+),(\d+),(\d+),'(.+?)'\)/,
    mooglemail: /set_mooglemail_item\((\d+),this\)/,
  },
  get_type: function (text) {
    if ($item.reg.itemr.test(text)) {
      return RegExp.$1.replace(/\W/g, '');
    } else if ($item.reg.itemc.test(text)) {
      return 'Consumable';
    } else {
      return '';
    }
  },
  get_data: function (text) {
    let exec;
    if ((exec = $item.reg.shrine.exec(text))) {
      const iid = exec[1];
      const stock = parseInt(exec[2]);
      const bulk = parseInt(exec[3]);
      const name = exec[4];
      return { iid, stock, bulk, name };
    } else if ((exec = $item.reg.mooglemail.exec(text))) {
      const iid = exec[1];
      return { iid };
    } else {
      return {};
    }
  },
  load: async function () {
    const html = await $ajax.fetch('?s=Character&ss=it');
    const doc = $doc(html);
    $item.list = {};
    $qsa('.itemlist tr', doc).forEach((tr) => {
      const name = tr.cells[0].textContent;
      const id = parseInt(tr.cells[0].firstElementChild.id.slice(5));
      const stock = parseInt(tr.cells[1].textContent);
      $item.list[name] = { id, stock };
    });
  },
  once: async function () {
    if ($item.list) {
      return;
    } else {
      await $item.load();
    }
  },
  load_shop: async function () {
    const html = await $ajax.fetch('?s=Bazaar&ss=is');
    const doc = $doc(html);
    $item.storetoken = $id('shopform', doc).elements.storetoken.value;
    $item.networth = parseInt($id('networth', doc).textContent.replace(/\D/g, ''));
    $item.shop = {};

    const reg_item = /itemshop\.set_item\('item_pane',(\d+),(\d+),(\d+)/;
    $qsa('#item_pane .itemlist tr', doc).forEach((tr) => {
      const exec = reg_item.exec(tr.cells[0].firstElementChild.getAttribute('onclick'));
      const name = tr.cells[0].textContent.trim();
      const id = parseInt(exec[1]);
      const stock = parseInt(exec[2]);
      const sell_price = parseInt(exec[3]);
      $item.shop[name] = { id, stock, sell_price };
    });

    const reg_shop = /itemshop\.set_item\('shop_pane',(\d+),(\d+),(\d+)/;
    $qsa('#shop_pane .itemlist tr', doc).forEach((tr) => {
      const exec = reg_shop.exec(tr.cells[0].firstElementChild.getAttribute('onclick'));
      const name = tr.cells[0].textContent.trim();
      const id = parseInt(exec[1]);
      const shop_stock = parseInt(exec[2]);
      const shop_price = parseInt(exec[3]);
      if (!$item.shop[name]) {
        $item.shop[name] = {};
      }
      Object.assign($item.shop[name], { id, shop_stock, shop_price });
    });
  },
  count: function (name) {
    if (name) {
      return $item.list[name]?.stock || 0;
    } else {
      const obj = {};
      for (const name in $item.list) {
        obj[name] = $item.list[name].stock || 0;
      }
      return obj;
    }
  },
  cost: function (items) {
    let cost = 0;
    items.forEach((item) => {
      cost += item.count * ($item.shop[item.name]?.shop_price || 0);
    });
    return cost;
  },
  buy: async function (items) { //items = [{ name, count }];
    if (!items.length) {
      alert('The purchase request list is empty.');
      return;
    }
    await $item.load_shop();
    const cost = $item.cost(items);
    if (cost > $item.networth) {
      alert('你没有足够的Credits！');
      return;
    }
    const nostock = items.find((item) => item.count > ($item.shop[item.name]?.shop_stock || 0));
    if (nostock) {
      alert('Insufficient number of items in the Item Shop.');
      return;
    }
    items.forEach((item) => {
      item.id = $item.shop[item.name].id;
    });

    async function buy(id, count) {
      const html = await $ajax.fetch('?s=Bazaar&ss=is', `storetoken=${$item.storetoken}&select_mode=shop_pane&select_item=${id}&select_count=${count}`);
      const doc = $doc(html);
      const error = get_message(doc);
      if (error) {
        return false;
      }
      return true;
    }

    const requests = items.map((item) => buy(item.id, item.count));
    const results = await Promise.all(requests);
    if (!results.every((r) => r)) {
      alert('An error has occurred.');
      return;
    }
    return true;
  },
};

// ITEM PRICE
const $price = {

  json: null,
  market: null,
  filters: { co: null, ma: null, tr: null, ar: null, fi: null, mo: null },
  groups: {
    'Consumables': [
      'Health Draught', 'Health Potion', 'Health Elixir', 'Mana Draught', 'Mana Potion', 'Mana Elixir', 'Spirit Draught', 'Spirit Potion', 'Spirit Elixir', 'Last Elixir', 'Energy Drink', 'Caffeinated Candy',
      'Infusion of Flames', 'Infusion of Frost', 'Infusion of Lightning', 'Infusion of Storms', 'Infusion of Divinity', 'Infusion of Darkness', 'Scroll of Swiftness', 'Scroll of Protection', 'Scroll of the Avatar', 'Scroll of Absorption', 'Scroll of Shadows', 'Scroll of Life', 'Scroll of the Gods',
      'Flower Vase', 'Bubble-Gum',
    ],
    'Materials': [
      'Low-Grade Cloth', 'Mid-Grade Cloth', 'High-Grade Cloth', 'Low-Grade Leather', 'Mid-Grade Leather', 'High-Grade Leather', 'Low-Grade Metals', 'Mid-Grade Metals', 'High-Grade Metals', 'Low-Grade Wood', 'Mid-Grade Wood', 'High-Grade Wood',
      'Scrap Cloth', 'Scrap Leather', 'Scrap Metal', 'Scrap Wood', 'Energy Cell',
      'Crystallized Phazon', 'Shade Fragment', 'Repurposed Actuator', 'Defense Matrix Modulator',
      'Binding of Slaughter', 'Binding of Balance', 'Binding of Isaac', 'Binding of Destruction', 'Binding of Focus', 'Binding of Friendship', 'Binding of Protection', 'Binding of Warding', 'Binding of the Fleet', 'Binding of the Barrier', 'Binding of the Nimble', 'Binding of Negation', 'Binding of the Elementalist', 'Binding of the Heaven-sent', 'Binding of the Demon-fiend', 'Binding of the Curse-weaver', 'Binding of the Earth-walker', 'Binding of Surtr', 'Binding of Niflheim', 'Binding of Mjolnir', 'Binding of Freyr', 'Binding of Heimdall', 'Binding of Fenrir', 'Binding of Dampening', 'Binding of Stoneskin', 'Binding of Deflection', 'Binding of the Fire-eater', 'Binding of the Frost-born', 'Binding of the Thunder-child', 'Binding of the Wind-waker', 'Binding of the Thrice-blessed', 'Binding of the Spirit-ward', 'Binding of the Ox', 'Binding of the Raccoon', 'Binding of the Cheetah', 'Binding of the Turtle', 'Binding of the Fox', 'Binding of the Owl',
      'Peerless Weapon Core', 'Legendary Weapon Core', 'Peerless Staff Core', 'Legendary Staff Core', 'Peerless Armor Core', 'Legendary Armor Core',
      'Voidseeker Shard', 'Aether Shard', 'Featherweight Shard', 'Amnesia Shard',
    ],
    'Trophies': ['ManBearPig Tail', 'Holy Hand Grenade of Antioch', "Mithra's Flower", 'Dalek Voicebox', 'Lock of Blue Hair', 'Bunny-Girl Costume', 'Hinamatsuri Doll', 'Broken Glasses', 'Black T-Shirt', 'Sapling', 'Unicorn Horn', 'Noodly Appendage'],
    'Crystals': ['Crystal of Vigor', 'Crystal of Finesse', 'Crystal of Swiftness', 'Crystal of Fortitude', 'Crystal of Cunning', 'Crystal of Knowledge', 'Crystal of Flames', 'Crystal of Frost', 'Crystal of Lightning', 'Crystal of Tempest', 'Crystal of Devotion', 'Crystal of Corruption'],
    'Figures': ['Twilight Sparkle Figurine', 'Rainbow Dash Figurine', 'Applejack Figurine', 'Fluttershy Figurine', 'Pinkie Pie Figurine', 'Rarity Figurine', 'Trixie Figurine', 'Princess Celestia Figurine', 'Princess Luna Figurine', 'Apple Bloom Figurine', 'Scootaloo Figurine', 'Sweetie Belle Figurine', 'Big Macintosh Figurine', 'Spitfire Figurine', 'Derpy Hooves Figurine', 'Lyra Heartstrings Figurine', 'Octavia Figurine', 'Zecora Figurine', 'Cheerilee Figurine', 'Vinyl Scratch Figurine', 'Daring Do Figurine', 'Doctor Whooves Figurine', 'Berry Punch Figurine', 'Bon-Bon Figurine', 'Fluffle Puff Figurine', 'Angel Bunny Figurine', 'Gummy Figurine'],
  },
  default: {
    'Peerless Weapon Core': 500000,
    'Peerless Staff Core': 500000,
    'Peerless Armor Core': 500000,
  },

  init: function () {
    if ($price.json) {
      return;
    }
    if (_server.isekai) {
      $price.groups['Consumables'] = $price.groups['Consumables'].filter((n) => !'Last Elixir|Energy Drink|Caffeinated Candy'.includes(n));
      $price.groups['Materials'] = $price.groups['Materials'].filter((n) => !n.startsWith('Binding of'));
      delete $price.groups['Crystals'];
      delete $price.groups['Figures'];
      delete $price.filters['ar'];
      delete $price.filters['fi'];
      delete $price.filters['mo'];
    }
    $price.json = $config.get('prices');
    if (!$price.json) {
      $price.reset();
    }
  },
  reset: function () {
    const json = {};
    Object.values($price.groups).forEach((g) => {
      g.forEach((n) => {
        json[n] = 0;
      });
    });
    Object.assign(json, $price.default);
    $price.json = json;
    $config.set('prices', $price.json);
    //$price.set(json, true);
  },
  get_items: function (i) {
    let items;
    if (!i) {
      items = Object.keys($price.json);
    } else if (typeof i === 'string') {
      if (i in $price.groups) {
        items = $price.groups[i];
      } else if (i in $price.filters) {
        items = $price.filters[i];
      } else {
        items = [];
        console.log('Invalid items');
      }
    } else if (Array.isArray(i)) {
      items = i;
    } else {
      items = [];
      console.log('Invalid items');
    }
    return items;
  },
  get: function (i) {
    $price.init();
    const prices = {};
    const items = $price.get_items(i);
    items.forEach((n) => { prices[n] = $price.json[n] || 0; });
    return prices;
  },
  set: function (json, replace) {
    $price.init();
    if (replace) {
      $price.json = json;
    } else {
      Object.assign($price.json, json);
    }
    $config.set('prices', $price.json);
  },
  edit: function (i, filter, callback) {
    $price.init();
    const items = $price.get_items(i);
    const prices = $price.get(items);
    const all = !filter;

    popup_text($config.obj2text(prices, ['\n', '@']), 300, 500, [
      { text: '保存', click: save },
      { text: '售价', click: (p) => { market(p, 'bid'); } },
      { text: '要价', click: (p) => { market(p, 'ask'); } },
      { text: '编辑所有材料', click: edit_all },
    ]);

    function save(p) {
      const { value: new_prices, error } = $config.text2obj(p.textarea.value, ['\n', '@'], 'number');
      if (error) { // error: invalid input
        alert(`Error: price must be a number\n\n${error}`);
        return;
      }
      if (all && p.textarea.value.trim() === '') {
        $price.reset();
      } else {
        const replace = all;
        $price.set(new_prices, replace);
      }
      p.close();
      if (JSON.stringify(prices) !== JSON.stringify(new_prices)) {
        callback?.();
      }
    }
    async function market(p, key) {
      p.textarea.disabled = true;
      const new_prices = await $price.update_market(filter, key);
      p.textarea.value = $config.obj2text(new_prices, ['\n', '@']);
      p.textarea.disabled = false;
      save(p);
    }
    function edit_all(p) {
      if (all) {
        return;
      }
      p.close();
      $price.edit('', '', callback);
    }
  },
  parse_market: function (filter, doc = document) {
    if (!$price.market) {
      $price.market = {};
    }
    $price.filters[filter] = [];
    Array.from($qs('#market_itemlist table', doc).rows).forEach((tr, i) => {
      if (i === 0) {
        return;
      }
      const name = tr.cells[0].textContent;
      const itemid = /itemid=(\d+)/.exec(tr.getAttribute('onclick'))[1];
      const stock = parseInt(tr.cells[1].textContent);
      const bid = parseFloat(tr.cells[2].textContent.slice(0, -2)) || 0;
      const ask = parseFloat(tr.cells[3].textContent.slice(0, -2)) || 0;
      const market_stock = parseInt(tr.cells[4].textContent.slice(0, -2)) || 0;
      if (!$price.market[name]) {
        $price.market[name] = {};
      }
      Object.assign($price.market[name], { itemid, stock, bid, ask, market_stock });
      $price.filters[filter].push(name);
    });
  },
  update_market: async function (filter, key, save) {
    const all = !filter;
    if (all && !$price.market_all) {
      const filters = Object.keys($price.filters);
      const requests = filters.map((filter) => update(filter));
      await Promise.all(requests);
      $price.market_all = true;
    } else if (!all && !$price.market) {
      await update(filter);
    }
    const items = $price.get_items(filter);
    const prices = $price.get(items);
    const market_prices = $price.get_market(items, key);
    const new_prices = { ...prices, ...market_prices };
    if (save) {
      $price.set(new_prices);
    }
    return new_prices;

    async function update(filter) {
      const html = await $ajax.fetch(`?s=Bazaar&ss=mk&screen=browseitems&filter=${filter}`);
      const doc = $doc(html);
      $price.parse_market(filter, doc);
    }
  },
  get_market: function (items, key) {
    const prices = {};
    items.forEach((name) => {
      if (name in $price.market) {
        prices[name] = $price.market[name][key];
      }
    });
    return prices;
  },
  set_market: function (items, key) {
    const prices = $price.get_market(items, key);
    $price.set(prices);
  },

};

// MoogleMail
const $mail = {

  queue: [],
  current: 0,
  ready: true,

  request: function (mail) {
    if (mail) {
      const chunks = $mail.chunk(mail);
      $mail.queue.push(...chunks);
    }
    return $mail.send();
  },
  send: async function () {
    const mail = $mail.queue[$mail.current];
    if (!mail) {
      return;
    }
    if (!$mail.ready) {
      return;
    }
    $mail.ready = false;

    const { to_name, subject, body, attach, cod, cod_persistent } = mail;
    const index = $mail.current + 1;
    let html;
    let doc;

    $mail.log('\n========== Sending ==========');

    if (!$mail.token) {
      if (_query.ss === 'mm' && _query.filter === 'new') {
        doc = document;
      } else {
        $mail.log(`#${index}: Checking Mailbox`);
        html = await $ajax.fetch('?s=Bazaar&ss=mm&filter=new');
        doc = $doc(html);
      }
      $mail.token = $id('mailform', doc).elements.mmtoken.value;
      if ($id('mmail_attachremove', doc)) {
        $mail.log(`#${index}: Removing attachments`);
        await $mail.discard();
      }
    }
    const token = $mail.token;

    if (attach?.length) {
      $mail.log(`#${index}: Attaching`);
      async function attach_add(e) {
        const html = await $ajax.fetch('?s=Bazaar&ss=mm&filter=new', `mmtoken=${token}&action=attach_add&select_item=${e.id}&select_count=${e.count}&select_pane=${e.pane}`);
        if ($mail.check(html)) {
          return false;
        }
        done++;
        $mail.log(`#${index}: Attached (${done}/${total})`);
        return true;
      }

      const total = attach.length;
      let done = 0;
      const requests = attach.map((e) => attach_add(e));
      const results = await Promise.all(requests);
      if (!results.every((r) => r)) {
        $mail.discard();
        return;
      }
    }

    if (cod && !cod_persistent) {
      $mail.log(`#${index}: Setting CoD`);
      html = await $ajax.fetch('?s=Bazaar&ss=mm&filter=new', `mmtoken=${token}&action=attach_cod&action_value=${cod}`);
      if ($mail.check(html)) {
        $mail.discard();
        return;
      }
    }

    if (cod && cod_persistent) {
      $mail.log(`#${index}: Preparing in Persistent`);
      html = await $ajax.fetch('/?s=Bazaar&ss=mm&filter=new');
      doc = $doc(html);
      if ($mail.check(html)) {
        $mail.discard();
        return;
      }
      if (!$id('navbar', doc)) {
        $mail.log('!!! Error: Unable to access to Persistent MoogleMail');
        return;
      }
      if ($id('mmail_attachremove', doc)) {
        $mail.log('!!! Error: Something is attached to Persistent MoogleMail');
        return;
      }

      $mail.log(`#${index}: Attaching in Persistent`);
      html = await $ajax.fetch('/?s=Bazaar&ss=mm&filter=new', `mmtoken=${token}&action=attach_add&select_item=0&select_count=1&select_pane=credits`);
      if ($mail.check(html)) {
        $mail.discard();
        return;
      }

      $mail.log(`#${index}: Setting CoD in Persistent`);
      html = await $ajax.fetch('/?s=Bazaar&ss=mm&filter=new', `mmtoken=${token}&action=attach_cod&action_value=${cod}`);
      if ($mail.check(html)) {
        $mail.discard();
        return;
      }

      $mail.log(`#${index}: Sending in Persistent`);
      html = await $ajax.fetch('/?s=Bazaar&ss=mm&filter=new', { mmtoken: token, action: 'send', message_to_name: to_name, message_subject: subject, message_body: body });
      if ($mail.check(html)) {
        $mail.discard();
        return;
      }
    }

    $mail.log(`#${index}: Sending`);
    html = await $ajax.fetch('?s=Bazaar&ss=mm&filter=new', { mmtoken: token, action: 'send', message_to_name: to_name, message_subject: subject, message_body: body });
    if ($mail.check(html)) {
      $mail.discard();
      return;
    }

    $mail.log(`#${index}: Completed`);
    $mail.ready = true;
    $mail.current++;
    if ($mail.queue[$mail.current]) {
      return $mail.send();
    } else {
      location.href = '?s=Bazaar&ss=mm&filter=sent';
      return true;
    }
  },
  chunk: function (mail) {
    if (!mail.attach?.length) {
      if (!mail.subject) {
        mail.subject = '(no subject)';
      }
      if (!mail.body) {
        mail.body = '';
      }
      return [mail];
    }
    const chunks = [];
    const size = 10;

    for (let i = 0, l = mail.attach.length; i < l; i += size) {
      const attach = mail.attach.slice(i, i + size);
      const { to_name, cod_persistent } = mail;
      let { subject, body } = mail;
      let atext = '';
      let cod_total = 0;
      attach.forEach((e) => {
        if (e.cod) {
          cod_total += e.cod;
        }
        if (e.atext) {
          atext += e.atext + '\n';
        }
      });

      let cod_deduction = 0;
      if (mail.cod_deduction) {
        cod_deduction = Math.min(cod_total, mail.cod_deduction);
        mail.cod_deduction -= cod_deduction;
      }
      let cod = cod_total - cod_deduction;
      if (cod < 10) {
        cod = 0;
      }

      if (!subject) {
        if (attach.length) {
          if (attach[0].pane === 'equip') {
            subject = attach[0].name;
          } else {
            subject = `${attach[0].count.toLocaleString()} x ${attach[0].name}`;
          }
          if (attach.length > 1) {
            subject += ` and ${attach.length - 1} item(s)`;
          }
        } else {
          subject = '(no subject)';
        }
      }
      if (!body) {
        body = '';
      }
      if (atext) {
        body += `\n\n========== Attachment ==========\n\n${atext}`;
        if (cod_total) {
          if (attach.length > 1) {
            body += `\nTotal: ${cod_total.toLocaleString()} Credits`;
          }
          if (cod_deduction) {
            body += `\nDeduction: -${cod_deduction.toLocaleString()} Credits`;
            body += `\nCoD: ${cod.toLocaleString()} Credits`;
            if (cod) {
              body += '\n=> CoD: 0 Credits';
            }
          }
          if (cod && cod_persistent) {
            body += '\n* A CoD request has been sent to Persistent';
          }
        }
        body += '\n\n================================\n\n';
      }

      const chunk = { to_name, subject, body, attach, cod, cod_persistent };
      chunks.push(chunk);
    }

    return chunks;
  },
  check: function (html) {
    const doc = $doc(html);
    const error = get_message(doc);
    if (error) {
      $mail.error = error;
      $mail.log('!!! Error: ' + error);
    }
    return error;
  },
  discard: function () {
    return $ajax.fetch('?s=Bazaar&ss=mm&filter=new', `mmtoken=${$mail.token}&action=discard`);
  },
  log: function (text, clear) {
    if (!$mail.log.popup) {
      $mail.log.popup = popup_text('', 300, 300);
    }
    const p = $mail.log.popup;
    if (!p.wrapper.parentNode) {
      document.body.appendChild(p.wrapper);
    }
    if (clear) {
      p.textarea.value = '';
    }
    p.textarea.value += text + '\n';
    p.textarea.scrollTop = p.textarea.scrollHeight;
  },

};

// Battle Panel
const $battle = {

  node: {},
  equips: [],
  eqitems: {},
  itemdata: {},

  click: function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, eid, item, count } = target.dataset;
    if (action === 'repair') {
      $battle.repair(eid);
    } else if (action === 'repairall') {
      $battle.repair('all');
    } else if (action === 'buy') {
      $battle.buy_items(item, count);
    }
  },
  hover: function (e) {
    const target = e.target.closest('[data-action="hover"]');
    if (!target) {
      $battle.hover_repair();
      return;
    }
    const { eid } = target.dataset;
    $battle.hover_repair(eid);
  },
  get: function (eid) {
    return $battle.equips.find((eq) => eq.info.eid == eid);
  },
  load_dynjs: async function (doc) {
    const src = $qs('script[src*="/dynjs/"]', doc).src;
    const html = await $ajax.fetch(src + '?t=' + Date.now());
    Object.assign($equip.dynjs_equip, JSON.parse(/dynjs_equip\s?=\s?(\{.*?\});/.exec(html)?.[1] || null));
    $battle.equips.some((eq) => {
      const dynjs = $equip.dynjs_equip[eq.info.eid];
      if (!dynjs) {
        $persona.change_p();
        return true;
      }
      eq.data.html = dynjs.d;
      const info = $equip.parse.html(eq.data.html);
      Object.assign(eq.info, info);
    });
    $battle.update_condition();
  },
  update_condition: function () {
    $battle.equips.forEach((eq) => {
      eq.node.condition.innerHTML = '';
      const thld = $config.settings.equipPanelRepairThreshold;
      $element('span', eq.node.condition, [`${eq.info.condition}%`, (eq.info.condition <= thld ? '.hvut-bt-warn' : '')]);
      if (eq.info.energy !== null) {
        $element('', eq.node.condition, ' / ');
        $element('span', eq.node.condition, [`${eq.info.energy}%`, (eq.info.energy <= thld ? '.hvut-bt-warn' : '')]);
      }
    });
  },
  repair: async function (eid) {
    let equips;
    if (eid === 'all') {
      equips = $battle.equips;
    } else if (eid) {
      const eq = $battle.get(eid);
      equips = [eq];
    } else {
      return;
    }
    equips = equips.filter((eq) => $battle.eqitems[eq.info.eid]?.m);
    if (!equips.length) {
      return;
    }

    const cost = $battle.calc_repair(equips);
    const buy_items = [];
    Object.entries(cost).forEach(([id, count]) => {
      const data = $battle.itemdata[id];
      const name = data.n;
      if (count > data.c) {
        buy_items.push({ name, count: count - data.c });
      }
    });
    if (buy_items.length) {
      if (!confirm('材料不足\n是否从物品商店购买材料来修理你的装备?')) {
        return;
      }
      $battle.node.repairall.innerHTML = '<li>...</li>';
      equips.forEach((eq) => {
        eq.node.repair.innerHTML = '<li>...</li>';
        eq.node.condition.innerHTML = '<span>...</span>';
        eq.node.ex.innerHTML = '';
      });
      await $item.buy(buy_items);
    }

    $battle.load_repair(equips);
  },
  calc_repair: function (equips = $battle.equips) {
    const cost = {};
    equips.forEach((eq) => {
      const requires = $battle.eqitems[eq.info.eid]?.m;
      if (!requires) {
        return;
      }
      Object.entries(requires).forEach(([id, count]) => {
        if (!(id in cost)) {
          cost[id] = 0;
        }
        cost[id] += count;
      });
    });
    if (!Object.keys(cost).length) {
      return null;
    } else {
      return cost;
    }
  },
  load_repair: async function (equips) {
    $battle.node.repairall.innerHTML = '<li>...</li>';
    (equips || $battle.equips).forEach((eq) => {
      eq.node.repair.innerHTML = '<li>...</li>';
      eq.node.condition.innerHTML = '<span>...</span>';
      eq.node.ex.innerHTML = '';
    });

    let data;
    if (equips) {
      const eqids = equips.map((eq) => `eqids[]=${eq.info.eid}`).join('&');
      data = `postoken=${$battle.postoken}&${eqids}`; //&replace_charms=on
    }
    const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=repair', data);
    const doc = $doc(html);
    const error = get_message(doc);
    if (error) {
      popup(error);
      $battle.load_items();
      return;
    }

    $battle.postoken = $id('equipform', doc).elements.postoken.value;
    $battle.eqitems = JSON.parse(/eqitems\s?=\s?(\{.*?\});/.exec(html)?.[1] || '{}');
    $battle.itemdata = JSON.parse(/itemdata\s?=\s?(\{.*?\});/.exec(html)?.[1] || '{}');
    $battle.load_dynjs(doc);

    $battle.equips.forEach((eq) => {
      eq.node.repair.innerHTML = '';
      const requires = $battle.eqitems[eq.info.eid]?.m;
      if (requires) {
        let replace_charms = false;
        Object.entries(requires).forEach(([id, count]) => {
          if (id > 61900 && id < 64999) {
            replace_charms = true;
            return;
          }
          const data = $battle.itemdata[id];
          const li = $element('li', eq.node.repair, `${count} x ${data.n} (${data.c})`);
          if (data.c < count) {
            li.classList.add('hvut-bt-warn');
          }
        });
        if (replace_charms) {
          $element('a', eq.node.ex, { textContent: '替换护符或护符袋', className: 'hvut-bt-charms', href: `?s=Bazaar&ss=am&screen=modify&eqids=${eq.info.eid}` });
        }
      }
    });

    $battle.node.repairall.innerHTML = '';
    const cost = $battle.calc_repair();
    if (cost) {
      Object.entries(cost).forEach(([id, count]) => {
        if (id > 61900 && id < 64999) {
          return;
        }
        const data = $battle.itemdata[id];
        const li = $element('li', $battle.node.repairall, `${count} x ${data.n} (${data.c})`);
        if (data.c < count) {
          li.classList.add('hvut-bt-warn');
        }
      });
    } else {
      $element('li', $battle.node.repairall, '你的装备无需修理');
    }

    $persona.check_warning(doc);
  },
  hover_repair: function (eid) {
    const prev = $battle.current;
    const current = eid && $battle.get(eid);
    if (prev === current) {
      return;
    }
    if (prev) {
      $battle.current = null;
      prev.node.repair.remove();
    }
    if (current) {
      $battle.current = current;
      $battle.node.div.appendChild(current.node.repair);
      $battle.node.repairall.classList.add('hvut-none');
    } else {
      $battle.node.repairall.classList.remove('hvut-none');
    }
  },
  buy_items: async function (name, count) {
    if (!confirm(`是否购买 ${count} 个 ${name}?`)) {
      return;
    }
    const items = [{ name, count }];
    await $item.buy(items);
    $battle.load_items();
  },
  load_items: async function () {
    $battle.node.items.innerHTML = '';
    await $item.load();

    if (!$item.list) {
      return;
    }
    $battle.node.items.innerHTML = '';
    const items = Object.entries($config.settings.equipPanelItemInventory);
    let dummy;
    if (items.length < 9) {
      dummy = 9 - items.length;
    } else {
      dummy = 3 - (items.length % 3 || 3);
    }
    while (dummy-- > 0) {
      items.push(['#']);
    }
    items.forEach(([name, count]) => {
      if (name.startsWith('#')) {
        $element('li', $battle.node.items);
        return;
      }
      const stock = $item.count(name);
      const textContent = `${name} (${stock})`;
      const dataset = { action: 'buy', item: name, count };
      const li = $element('li', $battle.node.items, { textContent, dataset });
      if (stock < count) {
        li.classList.add('hvut-bt-warn');
      }
    });

    $config.set('items', $item.count());
  },
  create: function () {
    const items_rows = Math.max(Math.ceil(Object.keys($config.settings.equipPanelItemInventory).length / 3), 3);
    $battle.node.items.style.height = (items_rows * 21 - 1) + 'px';
    $battle.load_items();
    $battle.equips.length = 0;
    $battle.node.equip.innerHTML = '';
    const equipset = $config.get('equipset');
    if (!equipset) {
      $persona.change_p();
      return;
    }
    equipset.forEach((info) => {
      if (!info.eid) {
        $element('li', $battle.node.equip, [`/<a>${info.slot} - Empty</a><span></span><span></span>`]);
        return;
      }

      const eq = { info, data: {}, node: {} };
      eq.info.cat = (eq.info.category === 'One-handed Weapon' || eq.info.category === 'Two-handed Weapon' || eq.info.category === 'Staff') ? 'weapon' : 'armor';
      eq.node.li = $element('li', $battle.node.equip, { dataset: { action: 'hover', eid: eq.info.eid } });
      eq.node.name = $element('a', eq.node.li, { textContent: eq.info.customname || eq.info.name, href: `equip/${eq.info.eid}/${eq.info.key}`, target: '_blank' });
      eq.node.condition = $element('span', eq.node.li, { dataset: { action: 'repair', eid: eq.info.eid } });
      eq.node.ex = $element('span', eq.node.li);
      eq.node.repair = $element('ul', null, ['.hvut-bt-repair', { dataset: { header: '修理' } }]);

      $battle.equips.push(eq);
    });

    $battle.load_repair();
  },
  init: function (outer) {
    GM_addStyle(/*css*/`
      #mainpane { padding-right: 8px; }
      .hvut-bt-outer { width: 1220px !important; }
      .hvut-bt-outer > p { width: 520px; margin-left: auto; margin-right: auto; }
      .hvut-bt-on.hvut-bt-outer { width: 620px !important; }
      .hvut-bt-on.hvut-bt-left { margin-left: 600px !important; }
      .hvut-bt-on.hvut-bt-right { margin-right: 600px !important; }
      .hvut-bt-on #hvut-bt-div { visibility: visible; }
      .hvut-bt-left #hvut-bt-div { left: 8px; }
      .hvut-bt-right #hvut-bt-div { right: 8px; }

      #hvut-bt-div { visibility: hidden; position: absolute !important; bottom: 8px; width: 598px !important; margin: 0 !important; color: #333; font-size: 9pt; line-height: 20px; font-weight: normal; white-space: nowrap; }
      #hvut-bt-div > ul { position: absolute; margin: 0; padding: 21px 0 0; border: 1px solid; list-style: none; display: flex; }
      #hvut-bt-div > ul::before { content: attr(data-header); position: absolute; top: 0; width: 100%; border-bottom: 1px solid; background-color: #edb; font-size: 10pt; font-weight: bold; }

      .hvut-bt-equip { bottom: 0; left: 0; width: 400px; height: 293px; flex-flow: column; }
      .hvut-bt-equip li { display: flex; flex-wrap: wrap; align-items: flex-start; height: 41px; border-bottom: 1px solid; }
      .hvut-bt-equip li:last-child { border-bottom: 0; }
      .hvut-bt-equip li > a { width: 100%; overflow: hidden; text-overflow: ellipsis; border-bottom: 1px dotted #333; font-size: 10pt; font-weight: bold; text-decoration: none; }
      .hvut-bt-equip li:hover > a { background-color: #fff; }
      .hvut-bt-equip li > span:nth-child(2) { width: 100px; order: 1; border-left: 1px dotted #333; cursor: pointer; }
      .hvut-bt-equip li > span:nth-child(2):hover { color: #930; background-color: #fff; }
      .hvut-bt-equip li > span:nth-child(3) { flex: 1 100px; }
      .hvut-bt-charms { color: #e00 !important; }

      .hvut-bt-items { bottom: 320px; left: 0; width: 596px; min-height: 62px; flex-flow: row wrap; justify-content: start; }
      .hvut-bt-items li { flex: 1 30%; border-width: 0 1px 1px 0; border-style: dotted; border-color: #333; overflow: hidden; text-overflow:ellipsis; }
      .hvut-bt-items li:nth-child(3n) { border-right: 0; }
      .hvut-bt-items li:nth-last-child(-n+3) { border-bottom: 0; }
      .hvut-bt-items li[data-action] { cursor: pointer; }
      .hvut-bt-items li:hover { color: #930; background-color: #fff; }
      .hvut-bt-warn { color: #e00 !important; }

      .hvut-bt-repair { bottom: 0; left: 398px; width: 198px; height: 293px; flex-flow: column; justify-content: center; gap: 1px; cursor: pointer; }
      .hvut-bt-repair li { overflow: hidden; text-overflow:ellipsis; }
      .hvut-bt-repair:hover { background-color: #fff; }

      .hvut-bt-repairall{bottom:0;left:407px;width:190px;height:293px;cursor:pointer;display:flex;flex-direction:column;justify-content:center;align-items:center;}
      .hvut-bt-repairall:hover { background-color: #fff; }
    `);

    $battle.node.outer = outer || $id('mainpane');
    $battle.node.div = $element('div', $battle.node.outer, ['#hvut-bt-div'], (e) => { $battle.click(e); });
    $battle.node.equip = $element('ul', $battle.node.div, ['.hvut-bt-equip', { dataset: { header: '装备一览' } }], { mouseover: (e) => { $battle.hover(e); }, mouseleave: () => { $battle.hover_repair(); } });
    $battle.node.repairall = $element('ul', $battle.node.div, ['.hvut-bt-repairall', { dataset: { header: '修理全部', action: 'repairall' } }]);
    $battle.node.items = $element('ul', $battle.node.div, ['.hvut-bt-items', { dataset: { header: '快捷购买' } }]);

    $battle.node.outer.classList.add('hvut-bt-outer');
    $battle.node.outer.classList.add('hvut-bt-on');

    if ($config.settings.equipPanelPosition === 'right') {
      $battle.node.outer.classList.add('hvut-bt-right');
    } else {
      $battle.node.outer.classList.add('hvut-bt-left');
    }

    $battle.create();
  },

};

// BASIC CSS
GM_addStyle(/*css*/`
  input[type='text'], input[type='number'] { margin: 0 5px; padding: 2px 4px; border-width: 1px; line-height: 16px; }
  input[type='text'][readonly], input[type='number'][readonly] { color: #666; }
  input[type='number'] { -moz-appearance: textfield; }
  input[type='number']::-webkit-outer-spin-button, input[type='number']::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type='button'] { font-weight: bold; margin: 0 5px; padding: 1px 3px; border-width: 2px; border-radius: 5px; line-height: 16px; }
  input[type='checkbox'] { width: 16px; height: 16px; margin: 0 2px; position: relative; top: 0; vertical-align: top; }
  textarea { margin: 5px; padding: 4px; border-width: 1px; line-height: 20px; }
  select { margin: 0 5px; padding: 2px; border-width: 1px; height: calc(4em/3 + 6px); }
  select[size] { height: auto; }
  select[size] option:checked { background-color: revert; color: revert; }
  .hvut-label input { display: none; }
  .hvut-label input + span { position: relative; display: inline-block; width: 14px; height: 14px; border: 1px solid #966; background-color: #fff; vertical-align: top; }
  .hvut-label:hover input + span { border-color: #5C0D11; background-color: #fff; }
  .hvut-label input[type='checkbox'] + span { border-radius: 3px; }
  .hvut-label input[type='radio'] + span { border-radius: 50%; }
  .hvut-label input[type='checkbox']:checked + span::before { content: ''; position: absolute; top: 1px; left: 4px; width: 3px; height: 7px; border: solid #5C0D11; border-width: 0 3px 3px 0; transform: rotate(45deg); }
  .hvut-label input[type='radio']:checked + span::before { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; background-color: #5C0D11; border-radius: 50%; }
  .hvut-scrollbar-none { padding: 0; scrollbar-width: none; }
  .hvut-scrollbar-none::-webkit-scrollbar { display: none; }
  .hvut-scrollbar-none option { margin: 0; border: 0; padding: 3px; }

  #mainpane { width: auto; }
  .csps { visibility: hidden; }
  .csps > img { display: none; }
  .cspp { overflow-y: auto; }
  .fc2, .fc4 { display: inline; }

  .hvut-none { display: none !important; }
  .hvut-none-cont .hvut-none-item { display: none; }
  .hvut-cphu, .hvut-cphu-sub > * { cursor: pointer; }
  .hvut-cphu:hover, .hvut-cphu-sub > *:hover { text-decoration: underline; }
  .hvut-spaceholder { flex-grow: 1; }
  .hvut-side { position: absolute; width: 100px; display: flex; flex-direction: column; }
  .hvut-side > input { margin: 3px 0; padding: 1px; white-space: normal; }
  .hvut-side-margin { margin-bottom: 10px !important; }

  /* old style equiplist */
  .equiplist { font-weight: normal; }
  .eqp { margin: 5px; width: auto; }
  .eqp:hover { background-color: #ddd; }
  .eqp > div:last-child { position: relative; padding: 1px 5px; line-height: 20px; white-space: nowrap; }
  div.hvut-eqp-customname::after { visibility: hidden; content: attr(data-eqname); position: absolute; bottom: 0; left: 0; min-width: 100%; padding: inherit; background-color: inherit; }
  div.hvut-eqp-customname:hover::after { visibility: visible; }
  p.hvut-eqp-category { margin: 10px 0 5px; padding: 2px 5px; border: 1px solid; font-size: 10pt; font-weight: bold; background-color: #edb; }
  p.hvut-eqp-type { margin: 10px 5px 5px; padding: 2px 5px; border: 1px solid; font-size: 10pt; font-weight: bold; }
  div + div.hvut-eqp-border { margin-top: 11px; }
  div + div.hvut-eqp-border::before { content: ''; position: absolute; margin-top: -6px; width: 100%; border-top: 1px solid #5C0D11; }
  .hvut-none-cont div.hvut-eqp-border { margin-top: 0; }
  .hvut-none-cont div.hvut-eqp-border::before { content: none; }
  /* */

  #equiplist td { padding: 3px 2px; font-weight: normal; }
  #equiplist td:nth-child(n+2) { text-align: center; white-space: nowrap; }
  #equiplist .hvut-eqp-category > td { padding: 10px; border-top-width: 3px; font-size: 10pt; font-weight: bold; background-color: #edb; }
  #equiplist .hvut-eqp-type > td { padding: 10px; border-top-width: 2px; font-size: 10pt; font-weight: bold; background-color: #E3E0D1; }
  #equiplist .hvut-eqp-border > td { border-top-width: 3px; border-top-style: double; }
  #equiplist .lc { height: auto; min-height: 24px; }
  .hvut-eqp-filter-on .hvut-eqp-hidden { display: none; }
  .hvut-eqp-profit { background-color: #fff6; color: #c00; }

  .itemlist { user-select: auto !important; }
  .itemlist td > div { padding: 3px 5px 3px 18px; line-height: 16px; }
  .itemlist td > div[style*='color'] { box-shadow: 0 0 0 2px inset; }
  .it, .it ~ td { padding-top: 7px; }
  .hvut-it-Consumable { color: #00B000; }
  .hvut-it-Artifact { color: #0000FF; }
  .hvut-it-Trophy { color: #461B7E; }
  .hvut-it-Token { color: #254117; }
  .hvut-it-Crystal { color: #BA05B4; }
  .hvut-it-MonsterFood { color: #489EFF; }
  .hvut-it-Material { color: #FF0000; }
  .hvut-it-Collectable { color: #0000FF; }
`);

if ($config.settings.equipColor) {
  GM_addStyle(/*css*/`
    .eqp > div:last-child:not([onclick]) { color: #966; }
    .eqp > div:last-child[style*='color'] { box-shadow: 0 0 0 2px inset; }
    .hvut-eqp-Peerless { background-color: #fbb !important; }
    .hvut-eqp-Legendary { background-color: #fd8 !important; }
    .hvut-eqp-Magnificent { background-color: #bdf !important; }
    .hvut-eqp-Exquisite { background-color: #ce9 !important; }
  `);
}

if ($id('stats_scrollable')) {
  GM_addStyle(/*css*/`
    #stats_scrollable .spc { width: auto; font-weight: bold; }
    #stats_scrollable table { font-size: 9pt; }
    #stats_scrollable td:first-child { min-width: 45px; padding-left: 3px; color: #c00; }
    #stats_scrollable td:last-child { white-space: nowrap; }
    .hvut-ch-expand #eqch_left { width: 660px; }
    .hvut-ch-expand #eqch_stats { width: 560px; }
    .hvut-ch-expand #stats_scrollable { column-count: 2; column-rule: 1px dotted; column-gap: 10px; height: 631px; padding: 5px 50px 5px 10px; line-height: 18px; overflow: visible; }
    .hvut-ch-expand #stats_scrollable .spc:nth-last-of-type(5) { break-before: column; }
    .hvut-ch-expand #stats_scrollable table:nth-last-of-type(-n+5) { width: 300px; text-align: left; }
    .hvut-ch-expand #stats_scrollable table:nth-last-of-type(-n+5) tr { display: inline-block; width: 50%; }
  `);

  $id('eqch_outer').classList.add('hvut-ch-expand');
}

// DISABLE FONT ENGINE
_window.common.get_dynamic_digit_string = function (n) { return `<div class="fc4 far fcb"><div>${n.toLocaleString()}</div></div>`; };

if ($config.settings.equipHoverFunctions) {
  // EQUIPMENT KEY FUNCTIONS
  document.addEventListener('keydown', (e) => {
    if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') {
      return;
    }
    const div = $qs('*[data-eid]:hover');
    if (div) {
      const eq = $equip.parse.elem(div);
      if (e.key === 'C') {
        div.dispatchEvent(new MouseEvent('mouseover'));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', which: 99, keyCode: 99 }));
      }
      const key = e.key.toUpperCase();
      if (key === 'V') {
        window.open(`equip/${eq.info.eid}/${eq.info.key}`, '_blank');
      } else if (key === 'L') {
        prompt('Forum Link:', `[url=${location.origin}${location.pathname}equip/${eq.info.eid}/${eq.info.key}]${eq.info.name}[/url]`);
      } else if (key === 'K') {
        $equip.namecode(eq);
        prompt('Forum Link:', `[url=${location.origin}${location.pathname}equip/${eq.info.eid}/${eq.info.key}]${eq.data.namecode}[/url]`);
      }
    }
  });

  // EQUIPMENT MOUSE FUNCTIONS
  document.addEventListener('dblclick', () => {
    const div = $qs('*[data-eid]:hover');
    if (div) {
      window.open(`equip/${div.dataset.eid}/${div.dataset.key}`, '_blank');
    }
  });
}

if ($config.settings.equipTouchFunctions) {
  // EQUIPMENT TOUCH FUNCTIONS
  function handleAction(target) {
    const div = target?.closest('*[data-eid]');
    if (!div) {
      return;
    }
    window.open(`equip/${div.dataset.eid}/${div.dataset.key}`, '_blank');
  }

  let lastTap = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      const target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      handleAction(target);
    }
    lastTap = now;
  });

  let touchTimer = null;
  document.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    touchTimer = setTimeout(() => {
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      handleAction(target);
    }, 500);
  });

  document.addEventListener('touchend', () => {
    clearTimeout(touchTimer);
  });

  document.addEventListener('touchmove', () => {
    clearTimeout(touchTimer);
  });
}

// TOP MENU
GM_addStyle(/*css*/`
  #navbar { display: none; }

  #hvut-top { display: flex; position: relative; height: 22px; padding: 2px 0; border-bottom: 1px solid; font-size: 9pt; line-height: 22px; font-weight: bold; z-index: 10; white-space: nowrap; cursor: default; }
  #hvut-top > div { position: relative; height: 22px; margin: 0 5px; }
  #hvut-top a { display: block; text-decoration: none; }

  .hvut-top-warn { background-color: #fd9; }
  .hvut-top-message { position: absolute !important; top: 100%; left: -1px; width: 100%; margin: 0 !important; padding: 2px 0; border: 1px solid #5C0D11; background-color: #fd9c; color: #e00; z-index: -1; pointer-events: none; }

  .hvut-top-sub { visibility: hidden; position: absolute; top: 22px; left: -6px; padding: 5px; border-style: solid; border-width: 0 1px 1px; background-color: #EDEBDF; opacity: 0.95; }
  div:hover > .hvut-top-sub { visibility: visible; }
  .hvut-top-sub select { display: block; margin: 0; }
  .hvut-top-stamina > p { width: 220px; border-top: 1px solid #5C0D11; white-space: normal; }
  .hvut-top-stamina > p:first-child { border-top: 0; }
  .hvut-top-exp { position: relative; width: 299px; height: 8px; margin: 0 auto; border: 1px solid; background: linear-gradient(to right, #930 1px, transparent 1px) repeat -1px 0 / 30px; }
  .hvut-top-exp::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: #fff; z-index: -1; }
  .hvut-top-exp > div { position: absolute; top: 0; left: 0; height: 100%; background-color: #9cf; z-index: -1; }
  .hvut-top-placeholder { flex-grow: 1; }
  .hvut-top-server { left: auto; right: -6px; }
  .hvut-top-config { left: auto; right: -6px; }
  .hvut-top-config > div { margin: 5px; text-align: left; cursor: pointer; }

  .hvut-top-menu { display: flex; }
  .hvut-top-menu > div { position: relative; margin: 0 5px; }
  .hvut-top-menu span { font-size: 11pt; color: #930; }
  .hvut-top-menu .hvut-top-sub { width: max-content; }
  .hvut-top-menu ul { float: left; margin: 0 0 0 5px; padding: 0; list-style: none; text-align: left; line-height: 20px; }
  .hvut-top-menu ul:first-child { margin-left: 0; }
  .hvut-top-menu a { margin: 3px 0; padding: 0 5px; }
  .hvut-top-menu a:hover { background-color: #fff; }
  .hvut-top-menu-s { padding: 0 5px; background-color: #5C0D11; color: #fff; }

  .hvut-top-links { display: flex; }
  .hvut-top-links > a { position: relative; margin: 0 1px; padding: 0 1px; min-width: 28px; font-size: 11pt; border-radius: 2px; }
  .hvut-top-links > a:hover { background-color: #fff; }
  .hvut-top-links > a > span { display: none; position: absolute; top: 100%; left: 0; margin-top: 2px; margin-left: 0; padding: 1px 4px; background-color: #fff; color: #930; border: 1px solid; font-size: 10pt; line-height: 20px; font-weight: normal; pointer-events: none; }
  .hvut-top-links > a:hover > span { display: block; }
  .hvut-top-ygm { color: transparent !important; background: url('/y/mmail/ygm.png') no-repeat center center; animation: ygm 0.5s ease-in-out 10 alternate; filter: brightness(200%); }
  .hvut-top-ygm:hover { color: #e00 !important; background-image: none; animation: none; filter: none; }
  @keyframes ygm { from { opacity: 1; } to { opacity: 0.3; } }
`);

_top.menu = {
  'Character': { s: 'Character', ss: 'ch', label: '角色', default: 'CH', title: 'Character' },
  'Equipment': { s: 'Character', ss: 'eq', label: '装备', default: 'EQ', title: 'Equipment' },
  'Abilities': { s: 'Character', ss: 'ab', label: '能力', default: 'AB', title: 'Abilities' },
  'Training': { s: 'Character', ss: 'tr', label: '训练', default: 'TR', title: 'Training', server: 'persistent' },
  'Item Inventory': { s: 'Character', ss: 'it', label: '物品', default: 'IT', title: 'Item Inventory' },
  'Settings': { s: 'Character', ss: 'se', label: '设置', default: 'SE', title: 'Settings' },

  'Item Shop': { s: 'Bazaar', ss: 'is', label: '道具店', default: 'IS', title: 'Item Shop' },
  'The Shrine': { s: 'Bazaar', ss: 'ss', label: '祭坛', default: 'SS', title: 'The Shrine' },
  'The Market': { s: 'Bazaar', ss: 'mk', label: '市场', default: 'MK', title: 'The Market' },
  'Monster Lab': { s: 'Bazaar', ss: 'ml', label: '实验室', default: 'ML', title: 'Monster Lab', server: 'persistent' },
  'MoogleMail': { s: 'Bazaar', ss: 'mm', label: '邮箱', default: 'MM', title: 'MoogleMail' },
  'Weapon Lottery': { s: 'Bazaar', ss: 'lt', label: '武器彩票', default: 'LT', title: 'Weapon Lottery', server: 'persistent' },
  'Armor Lottery': { s: 'Bazaar', ss: 'la', label: '防具彩票', default: 'LA', title: 'Armor Lottery', server: 'persistent' },

  //'The Armory': { s: 'Bazaar', ss: 'am', label: 'AM', default: 'AM', title: 'The Armory' },
  'Organize': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'organize', label: '管理', default: 'OR', title: 'Organize' },
  'Modify': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'modify', label: '改装', default: 'MO', title: 'Modify' },
  'Repair': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'repair', label: '修理', default: 'RE', title: 'Repair' },
  'Soulbind': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'soulbind', label: '魂绑', default: 'SB', title: 'Soulbind' },
  'Purchase': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'purchase', label: '购买', default: 'PU', title: 'Purchase' },
  'Sell': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'sell', label: '出售', default: 'SL', title: 'Sell' },
  'Salvage': { g: 'Armory', s: 'Bazaar', ss: 'am', screen: 'salvage', label: '分解', default: 'SA', title: 'Salvage' },

  'The Arena': { s: 'Battle', ss: 'ar', label: '竞技', default: 'AR', title: 'The Arena' },
  'The Tower': { s: 'Battle', ss: 'tw', label: '塔楼', default: 'TW', title: 'The Tower', server: 'isekai' },
  'Ring of Blood': { s: 'Battle', ss: 'rb', label: '擂台', default: 'RB', title: 'Ring of Blood' },
  'GrindFest': { s: 'Battle', ss: 'gr', label: '压榨', default: 'GR', title: 'GrindFest' },
  'Item World': { s: 'Battle', ss: 'iw', label: '道具界', default: 'IW', title: 'Item World' },
};
Object.values(_top.menu).forEach((m) => {
  if (!m.href) {
    m.href = `?s=${m.s}&ss=${m.ss}` + (m.screen ? `&screen=${m.screen}` : '');
  }
});

_top.create = function () {
  if (_top.inited) {
    return;
  }
  _top.inited = true;

  const ul = {};
  Object.values(_top.menu).forEach((m) => {
    if (m.server && m.server !== _server.name) {
      return;
    }
    const g = m.g || m.s;
    if (!ul[g]) {
      if ($config.settings.topMenuIntegration) {
        if (!_top.node.menu['SUB']) {
          _top.node.menu['SUB'] = $element('div', _top.node.menu['MENU'], ['.hvut-top-sub']);
        }
        ul[g] = $element('ul', _top.node.menu['SUB']);
        $element('li', ul[g], [g, '.hvut-top-menu-s']);
      } else {
        const menu_sub = $element('div', _top.node.menu[g], ['.hvut-top-sub']);
        ul[g] = $element('ul', menu_sub);
      }
    }
    const li = $element('li', ul[g]);
    $element('a', li, { textContent: m.title, href: m.href });
  });

  const stamina_sub = $element('div', _top.node.stamina, ['.hvut-top-sub hvut-top-stamina']);
  if (_server.persistent) {
    _top.node.stamina_form = $element('form', stamina_sub, { method: 'POST' }, { submit: (e) => { _top.stamina_submit(e); } });
    $input('hidden', _top.node.stamina_form, { name: 'recover', value: 'stamina' });
    $input('submit', _top.node.stamina_form, { value: 'USE RESTORATIVE', disabled: _player.stamina >= $config.settings.disableStaminaRestorative, style: 'width: 200px;' });
    _top.node.stamina.addEventListener('mouseenter', _top.stamina_create);
  }
  $element('p', stamina_sub, _player.condition);
  if (_player.accuracy) {
    $element('p', stamina_sub, [_player.accuracy, '!color: #e00;']);
  }

  if (_player.level !== 500) {
    const exec = /([0-9,]+) \/ ([0-9,]+)\s*Next: ([0-9,]+)/.exec($id('level_details').textContent);
    const exp = parseInt(exec[1].replace(/,/g, ''));
    const up = parseInt(exec[2].replace(/,/g, ''));
    const next = parseInt(exec[3].replace(/,/g, ''));
    const level_start = Math.round(Math.pow(_player.level + 3, Math.pow(2.850263212287058, 1 + _player.level / 1000)));
    const level_exp = exp - level_start;
    const level_up = up - level_start;
    const pct = ((level_exp / level_up) * 100).toFixed(2);
    const level_sub = $element('div', _top.node.level, ['.hvut-top-sub']);
    $element('p', level_sub, `累计经验: ${exp.toLocaleString()} / ${up.toLocaleString()}`);
    $element('p', level_sub, `升级还需: ${next.toLocaleString()}`);
    $element('p', level_sub, `当前等级: ${level_exp.toLocaleString()} / ${level_up.toLocaleString()} (${pct}%)`);
    $element('div', level_sub, ['.hvut-top-exp', `/<div style="width: ${pct}%;"></div>`]);
  }

  const server_sub = $element('div', _top.node.server, ['.hvut-top-sub hvut-top-server']);
  if (_server.persistent) {
    const server_on = 'Persistent';
    const server_to = 'Isekai';
    $element('a', server_sub, { href: '/isekai/', innerHTML: `<p>Currently playing in ${server_on}</p><p>Click to switch to ${server_to}</p>` });
  } else {
    const server_on = 'Isekai';
    const server_to = 'Persistent';
    $element('a', server_sub, { href: '/', innerHTML: `<p>Currently playing in ${server_on}</p><p>${_server.season}</p><p>Click to switch to ${server_to}</p>` });
  }

  const config_sub = $element('div', _top.node.config, ['.hvut-top-sub hvut-top-config']);
  $element('div', config_sub, 'HV Utils 设置', () => { $config.open(); });
  if ($id('mbsettings')) { // monsterbation
    config_sub.appendChild($id('mbsettings'));
    $id('mbsettings').firstElementChild.className = '';
    GM_addStyle(/*css*/`
      #mbsettings { position: relative; }
      #mbprofile { top: 100%; left: 0; min-width: 100%; box-sizing: border-box; font-weight: normal; }
    `);
  }
};

_top.stamina_create = async function () {
  if (_top.stamina_create.inited) {
    return;
  }
  _top.stamina_create.inited = true;
  const p = $element('p', _top.node.stamina_form, 'Loading...');
  await $item.once();
  const items = ['Caffeinated Candy', 'Energy Drink'].filter((e) => $item.count(e));
  if (items.length) {
    items.forEach((e) => { $element('p', _top.node.stamina_form, `${e} (${$item.count(e)})`); });
    p.remove();
  } else {
    p.textContent = 'No restorative available';
  }
};

_top.stamina_submit = function (e) {
  if ($config.settings.confirmStaminaRestorative && !confirm('你确定要使用能量饮料吗?')) {
    e.preventDefault();
  }
};

_top.init = function () {
  _top.node = {};
  _top.node.div = $element('div', null, ['#hvut-top'], { mouseenter: () => { _top.create(); } });

  const menu_div = $element('div', _top.node.div, ['.hvut-top-menu']);
  _top.node.menu = {};
  if ($config.settings.topMenuIntegration) {
    _top.node.menu['MENU'] = $element('div', menu_div, ['/<span>菜单</span>']);
  } else {
    Object.values(_top.menu).forEach((m) => {
      const g = m.g || m.s;
      if (!_top.node.menu[g]) {
        _top.node.menu[g] = $element('div', menu_div, [`/<span>${g.toUpperCase()}</span>`]);
      }
    });
  }

  const links_div = $element('div', _top.node.div, ['.hvut-top-links']);
  const links = $config.settings.topMenuLinks.slice();
  const new_mail = $id('nav_mail')?.textContent.trim();
  if (new_mail && !links.includes('MoogleMail')) {
    links.push('MoogleMail');
  }
  links.forEach((b) => {
    let m = _top.menu[b];
    if (!m) {
      const [title, label, href, server] = b.split('|').map((e) => e.trim());
      m = { title, label, href, server };
    }
    if (!m || m.server && m.server !== _server.name) {
      return;
    }
    let label = m.label;
    let cn = '';
    if (b === 'MoogleMail' && new_mail) {
      label = `[${new_mail}]`;
      cn = 'hvut-top-ygm';
    }
    if (label.startsWith('{#')) {
      label = m.default;
    }
    const a = $element('a', links_div, { textContent: label, href: m.href });
    if (cn) {
      a.classList.add(cn);
    }
    $element('span', a, m.title);
  });

  _top.node.stamina = $element('div', _top.node.div, ['!width: 90px;', `/<span>体力: ${_player.stamina}</span>`]);
  _top.node.level = $element('div', _top.node.div, ['!width: 60px;', `/<span>等级: ${_player.level}</span>`]);
  _top.node.difficulty = $element('div', _top.node.div, ['!width: 80px;', `/<span>难度: ${_player.difficulty}</span>`]);
  _top.node.persona = $element('div', _top.node.div, ['!width: 150px;', '/<span>Persona</span>']);
  if ($config.settings.reNotification) {
    $re.hv();
  }
  $element('div', _top.node.div, ['.hvut-top-placeholder']);
  _top.node.server = $element('div', _top.node.div, ['!width: 80px;', `/<span>${_server.name.toUpperCase()}</span>`]);

  _top.node.config = $element('div', _top.node.div, ['!width: 30px;']);
  $element('span', _top.node.config, ['!cursor: pointer;', '/<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="22" viewBox="0 0 50 50" fill="#630"><path d="M47.16,21.221l-5.91-0.966c-0.346-1.186-0.819-2.326-1.411-3.405l3.45-4.917c0.279-0.397,0.231-0.938-0.112-1.282 l-3.889-3.887c-0.347-0.346-0.893-0.391-1.291-0.104l-4.843,3.481c-1.089-0.602-2.239-1.08-3.432-1.427l-1.031-5.886 C28.607,2.35,28.192,2,27.706,2h-5.5c-0.49,0-0.908,0.355-0.987,0.839l-0.956,5.854c-1.2,0.345-2.352,0.818-3.437,1.412l-4.83-3.45 c-0.399-0.285-0.942-0.239-1.289,0.106L6.82,10.648c-0.343,0.343-0.391,0.883-0.112,1.28l3.399,4.863 c-0.605,1.095-1.087,2.254-1.438,3.46l-5.831,0.971c-0.482,0.08-0.836,0.498-0.836,0.986v5.5c0,0.485,0.348,0.9,0.825,0.985 l5.831,1.034c0.349,1.203,0.831,2.362,1.438,3.46l-3.441,4.813c-0.284,0.397-0.239,0.942,0.106,1.289l3.888,3.891 c0.343,0.343,0.884,0.391,1.281,0.112l4.87-3.411c1.093,0.601,2.248,1.078,3.445,1.424l0.976,5.861C21.3,47.647,21.717,48,22.206,48 h5.5c0.485,0,0.9-0.348,0.984-0.825l1.045-5.89c1.199-0.353,2.348-0.833,3.43-1.435l4.905,3.441 c0.398,0.281,0.938,0.232,1.282-0.111l3.888-3.891c0.346-0.347,0.391-0.894,0.104-1.292l-3.498-4.857 c0.593-1.08,1.064-2.222,1.407-3.408l5.918-1.039c0.479-0.084,0.827-0.5,0.827-0.985v-5.5C47.999,21.718,47.644,21.3,47.16,21.221z M25,32c-3.866,0-7-3.134-7-7c0-3.866,3.134-7,7-7s7,3.134,7,7C32,28.866,28.866,32,25,32z"></path></svg>'], () => { $config.open(); });

  $id('navbar').after(_top.node.div);
};

_top.init();

// DIFFICULTY CHANGER
const $dfct = {

  div: _top.node.difficulty,
  button: _top.node.difficulty.firstElementChild,
  list: ['普通×1', '困难×2', '噩梦×3', '地狱×5', '任天堂×10', 'I Wanna×15', '彩虹小马×20'],

  init: function () {
    const ch_style = $config.get('ch_style', {});
    if (ch_style.difficulty !== _player.difficulty) {
      ch_style.difficulty = _player.difficulty;
      $config.set('ch_style', ch_style);
    }
  },
  create: function () {
    if ($dfct.sub) {
      return;
    }
    $dfct.sub = $element('div', $dfct.div, ['.hvut-top-sub']);
    const options = $dfct.list.map((d, i) => `${i + 1}:${d}`).reverse();
    $dfct.selector = $input(['select', options], $dfct.sub, { size: $dfct.list.length, className: 'hvut-scrollbar-none', style: 'width: 80px;' }, { change: () => {
      $dfct.selector.disabled = true;
      $dfct.change($dfct.selector.value);
    } });
    $dfct.selector.value = $dfct.list.indexOf(_player.difficulty) + 1;
  },
  change: async function (value) {
    $dfct.button.textContent = '(D1...)';
    let html = await $ajax.fetch('?s=Character&ss=se');
    let doc = $doc(html);
    $dfct.button.textContent = '(D2...)';
    const data = new FormData($qs('#settings_outer form', doc));
    data.set('difflevel', value);
    data.set('submit', 'Apply Changes');
    html = await $ajax.fetch('?s=Character&ss=se', data, 'FORM');
    doc = $doc(html);
    $dfct.set_button(doc);
  },
  set_button: function (doc) {
    const value = /^(.+) Lv\.(\d+)/.exec($id('level_readout', doc).textContent.trim())[1];
    if (!value) {
      $dfct.button.textContent = '(D: ERROR)';
      return;
    }
    _player.difficulty = value;
    $dfct.button.textContent = value;
    if ($dfct.selector) {
      $dfct.selector.value = $dfct.list.indexOf(value) + 1;
      $dfct.selector.disabled = false;
    }
    const ch_style = $config.get('ch_style', {});
    ch_style.difficulty = value;
    $config.set('ch_style', ch_style);
  },

};

$dfct.div.addEventListener('mouseenter', $dfct.create);
$dfct.init();

// PERSONA & EQUIPMENT SET CHANGER
const $persona = {

  json: $config.get('persona', {}),
  div: _top.node.persona,
  button: _top.node.persona.firstElementChild,

  create: function () {
    const json = $persona.json;
    if (!json.pset || !json.eset) {
      return;
    }
    if ($persona.sub) {
      return;
    }
    $persona.sub = $element('div', $persona.div, ['.hvut-top-sub']);

    $persona.selector_p = $input('select', $persona.sub, { size: json.plen, className: 'hvut-scrollbar-none', style: 'width: 110px;' }, { change: () => {
      $persona.selector_p.disabled = true;
      $persona.change_p($persona.selector_p.value);
    } });
    for (let i = 1; i <= json.plen; i++) {
      $element('option', $persona.selector_p, { value: i, text: json[i].name });
    }
    $persona.selector_p.value = json.pset;

    $persona.selector_e = $input('select', $persona.sub, { size: json.elen, className: 'hvut-scrollbar-none', style: 'width: 110px;' }, { change: () => {
      $persona.selector_e.disabled = true;
      $persona.change_e($persona.selector_e.value);
    } });
    for (let i = 1; i <= json.elen; i++) {
      $element('option', $persona.selector_e, { value: i, text: json[json.pset][i].name || `Set ${i}` });
    }
    $persona.selector_e.value = json.eset;
  },
  check_p: function (doc) {
    const json = $persona.json;
    const pset = parseInt($id('persona_form', doc).elements.persona_set.value);
    const plen = $id('persona_form', doc).elements.persona_set.options.length;
    const checked = pset === json.pset;

    Array.from($id('persona_form', doc).elements.persona_set.options).forEach((o) => {
      const pset = parseInt(o.value);
      const pname = o.text;
      if (!json[pset]) {
        json[pset] = {};
      }
      json[pset].name = pname;
    });

    json.pset = pset;
    json.plen = plen;
    json.pname = json[pset].name;
    $persona.set_value();
    return checked;
  },
  check_e: function (doc) {
    const json = $persona.json;
    const pset = json.pset;
    const eset = parseInt($qs('img[src$="_on.png"]', doc).src.match(/set(\d+)_on/)[1]);
    const elen = $id('eqsl', doc).childElementCount;

    for (let i = 1; i <= elen; i++) {
      if (!json[pset][i]) {
        json[pset][i] = { name: '' };
      }
    }

    json.eset = eset;
    json.elen = elen;
    json.ename = json[pset][eset].name;
    $persona.set_value();
  },
  change_p: async function (pset) {
    $persona.button.textContent = '(P...)';
    $dfct.button.textContent = '(D...)';
    const html = await $ajax.fetch('?s=Character&ss=ch', pset ? `persona_set=${pset}` : null);
    const doc = $doc(html);
    $persona.check_p(doc);
    if ($persona.selector_p) {
      $persona.selector_p.value = $persona.json.pset;
      $persona.selector_p.disabled = false;
    }
    $persona.change_e();
    $dfct.set_button(doc);
  },
  change_e: async function (eset) {
    $persona.button.textContent = '(E...)';
    const html = await $ajax.fetch('?s=Character&ss=eq', eset ? `equip_set=${eset}` : null);
    const doc = $doc(html);
    $persona.check_e(doc);
    const json = $persona.json;
    if ($persona.selector_e) {
      for (let i = 1; i <= json.elen; i++) {
        const ename = json[json.pset][i].name;
        $persona.selector_e.options[i - 1].text = ename || 'Set ' + i;
      }
      $persona.selector_e.value = json.eset;
      $persona.selector_e.disabled = false;
    }
    $persona.set_button();
    $persona.load_dynjs(doc);
    $persona.check_warning(doc);
  },
  set_button: function () {
    $persona.button.textContent = $persona.json.ename || `${$persona.json.pname.slice(0, 10)} [${$persona.json.eset}]`;
  },
  load_dynjs: async function (doc) {
    const src = $qs('script[src*="/dynjs/"]', doc).src;
    const html = await $ajax.fetch(src + '?t=' + Date.now());
    Object.assign($equip.dynjs_equip, JSON.parse(/dynjs_equip\s?=\s?(\{.*?\});/.exec(html)?.[1] || null));
    $persona.save_equipset(doc);
    $persona.parse_stats_pane(doc);
    if (_query.s === 'Battle') {
      $battle?.create();
    } else if (['eq', 'ab', 'it', 'se'].includes(_query.ss)) {
      location.href = location.href;
    }
  },
  set_value: function (name, value) {
    const json = $persona.json;
    if (name) {
      json[json.pset][json.eset][name] = value;
    }
    if (name === 'name') {
      json.ename = value;
      $persona.set_button();
    }
    $config.set('persona', json);
  },
  get_value: function (name) {
    const json = $persona.json;
    return json[json.pset][json.eset][name];
  },
  save_equipset: function (doc) {
    const equipset = $qsa('.eqb', doc).map((d) => {
      const eq = $equip.parse.elem(d.children[1]);
      const slot = d.children[0].textContent;
      if (eq.info) {
        const { category, name, customname, eid, key } = eq.info;
        return { slot, category, name, customname, eid, key };
      } else {
        return { slot };
      }
    });
    $config.set('equipset', equipset);
  },
  check_warning: function (doc) {
    _top.node.message?.remove();
    _top.node.div.classList.remove('hvut-top-warn');
    _top.node.persona.firstElementChild.style.color = '';
    _player.warn = $qsa('#stamina_restore .fcr', doc).map((d) => d.textContent.trim()); // Repair weapon, Repair armor, Check equipment, Check attributes
    if (_player.warn.length) {
      if (_query.s === 'Battle') {
        _top.node.message = _top.node.message || $element('div', null, ['.hvut-top-message']);
        _top.node.message.textContent = '[警告] ' + _player.warn.join(', ');
        _top.node.div.appendChild(_top.node.message);
      }
      _top.node.div.classList.add('hvut-top-warn');
      _top.node.persona.firstElementChild.style.color = '#e00';
    }
    _top.node.stamina.firstElementChild.style.color = '';
    if (_player.condition.includes('Stamina: Exhausted') || _player.accuracy || _player.stamina <= $config.settings.warnLowStamina) {
      _top.node.div.classList.add('hvut-top-warn');
      _top.node.stamina.firstElementChild.style.color = '#e00';
    } else if (_player.condition.includes('Stamina: Great')) {
      _top.node.stamina.firstElementChild.style.color = '#03c';
    }
  },
  parse_stats_pane: function (doc) {
    const stats_pane = {};
    $qsa('#stats_scrollable > table', doc).forEach((table) => {
      const type = table.previousElementSibling.textContent;
      Array.from(table.rows).forEach((tr) => {
        const text = tr.cells[0].textContent;
        let value = parseFloat(text);
        if (text.endsWith('%')) {
          value = Math.round(value * 100) / 10000;
        }
        let name = tr.cells[1].textContent;
        if (/(Mainhand|Offhand|Magic) Attack/.test(type)) {
          const attack_type = RegExp.$1;
          if (/(Crushing|Piercing|Slashing|Void) Damage/.test(name)) {
            name = `${attack_type} Damage`;
          } else if (/Damage Bonus|Accuracy|Crit Multiplier/.test(name)) {
            name = `${attack_type} ${name}`;
          }
        } else if (type === 'Damage Mitigation') {
          name += ' MIT';
        } else if (type === 'Spell Damage Bonus') {
          name += ' EDB';
        }
        stats_pane[name] = value;
      });
    });

    let fighting_style;
    if ('Coalesced Mana on spell hit' in stats_pane) {
      fighting_style = 'Staff';
    } else if ('Offhand Damage' in stats_pane) {
      if ('Domino Strike on hit' in stats_pane) {
        fighting_style = 'Niten Ichiryu';
      } else {
        fighting_style = 'Dualwield';
      }
    } else {
      if ('Domino Strike on hit' in stats_pane) {
        fighting_style = 'Two-Handed';
      } else if ('Counter-Attack on block/parry' in stats_pane) {
        fighting_style = 'One-Handed';
      } else {
        fighting_style = 'Unarmed';
      }
    }
    const spell_type = ['Fire', 'Cold', 'Elec', 'Wind', 'Holy', 'Dark'].sort((a, b) => stats_pane[b + ' EDB'] - stats_pane[a + ' EDB'])[0];
    const spell_damage = stats_pane[spell_type + ' EDB'];
    const prof_factor = Math.max(0, Math.min(1, stats_pane[{ 'Holy': 'Divine', 'Dark': 'Forbidden' }[spell_type] || 'Elemental'] / _player.level - 1));
    const ch_style = { level: _player.level, difficulty: _player.difficulty };
    stats_pane['Fighting Style'] = fighting_style;
    ch_style['Fighting Style'] = fighting_style;
    if (fighting_style === 'Staff' || spell_damage >= 100) {
      stats_pane['Spell Type'] = spell_type;
      stats_pane['Proficiency Factor'] = prof_factor;
      ch_style['Spell Type'] = spell_type;
      ch_style['Proficiency Factor'] = Math.round(prof_factor * 1000) / 1000;
    } else {
      ch_style['Attack Base Damage'] = stats_pane['Mainhand Damage'];
    }
    $config.set('ch_style', ch_style);
    return stats_pane;
  },
  init: function () {
    if ($id('persona_form')) {
      if (!$persona.check_p()) {
        $persona.change_e();
      } else {
        $persona.set_button();
      }
    } else if (!$persona.json.pset || !$persona.json.eset) {
      $persona.change_p();
    } else {
      $persona.set_button();
    }
    $persona.check_warning();
  },

};

$persona.div.addEventListener('mouseenter', $persona.create);
$persona.init();

// BOTTOM MENU
GM_addStyle(/*css*/`
  #hvut-bottom { position: absolute; display: flex; top: 100%; left: -1px; width: 105%; border: 1px solid; font-size: 10pt; line-height: 20px; }
  #hvut-bottom:empty { display: none; }
  #hvut-bottom > div { margin: -1px 0 -1px -1px; border: 1px solid #5C0D11; padding: 0 10px; }
  #hvut-bottom > .hvut-spaceholder ~ div { margin: -1px -1px -1px 0; }
  #hvut-bottom > .hvut-spaceholder { margin: 0; border: 0; padding: 0; }
  #hvut-bottom a { color: inherit; }
  .hvut-bottom-warn { background-color: #5C0D11; color: #fff; }

  .hvut-lt-div > a { margin-right: 5px; }
  .hvut-lt-div > span { display: inline-block; width: 40px; }
  .hvut-lt-check { background-color: #fd9; }
`);

_bottom.node = {};
_bottom.node.div = $element('div', $id('csp'), ['#hvut-bottom']);

// CREDITS COUNTER
if ($config.settings.showCredits === 2) {
  _bottom.show_credits = async function () {
    _bottom.node.credits = $element('div', _bottom.node.div, 'Loading...');
    if ($id('networth')) {
      _bottom.node.credits.textContent = $id('networth').textContent;
      $id('networth').remove();
    } else {
      const html = await $ajax.fetch('?s=Bazaar&ss=is');
      const doc = $doc(html);
      _bottom.node.credits.textContent = $id('networth', doc).textContent;
    }
  };

  _bottom.show_credits();
}

// EQUIPMENT COUNTER
if ($config.settings.showEquipCapacity === 2 || $config.settings.showEquipCapacity === 1 && _query.s === 'Battle') {
  _bottom.show_equip = async function () {
    _bottom.node.equip = $element('div', _bottom.node.div, 'Loading...');
    const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=organize');
    const exec = /<td>Inventory Capacity:<\/td><td>(\d+)(?: \+ (\d+))?<\/td><td>\/<\/td><td>(\d+)<\/td>/.exec(html);
    const usage = parseInt(exec[1]) + parseInt(exec[2] || 0);
    const capacity = parseInt(exec[3]);
    const free = capacity - usage;
    _bottom.node.equip.textContent = `装备库存: ${usage} / ${capacity}`;
    if (free < $config.settings.warnEquipCapacity) {
      popup('<p style="color: #f00; font-weight: bold;">你的装备仓库快要满了.<br>\n该去整理一下了.</p>');
      _bottom.node.equip.classList.add('hvut-bottom-warn');
    } else if (free < capacity / 2) {
      _bottom.node.equip.style.color = '#c00';
    }
  };

  _bottom.show_equip();
}

// TRAINING TIMER
if ($config.settings.trainingNotification) {
  _bottom.tr = {
    json: $config.get('tr_notif', {}, 'hvut_'),
    node: {},

    init: function () {
      const json = _bottom.tr.json;
      if (!json.current_name && !json.next_name && !json.error) {
        return;
      }
      _bottom.tr.node.div = $element('div', _bottom.node.div);
      _bottom.tr.node.link = $element('a', _bottom.tr.node.div, { href: '/?s=Character&ss=tr', textContent: 'Initializing...', style: 'margin-right: 5px;' });
      _bottom.tr.node.clock = $element('span', _bottom.tr.node.div, ['!display: inline-block; width: 60px;']);
      if (json.error) {
        _bottom.tr.node.link.textContent = json.error;
      } else if (json.current_name) {
        _bottom.tr.node.link.textContent = `${json.current_name} [${json.current_level + 1}]`;
      }
      _bottom.tr.clock();
    },
    clock: function () {
      const json = _bottom.tr.json;
      const remain = json.current_end - Date.now();
      if (remain > 0) {
        _bottom.tr.node.clock.textContent = time_format(remain);
        setTimeout(_bottom.tr.clock, 1000);
      } else {
        _bottom.tr.node.link.textContent = 'Loading...';
        _bottom.tr.node.clock.textContent = '';
        _bottom.tr.load();
      }
    },
    load: async function (post) {
      const html = await $ajax.fetch('/?s=Character&ss=tr', post);
      const doc = $doc(html);
      if (!$id('train_outer', doc)) {
        _bottom.tr.node.link.textContent = 'Waiting...';
        setTimeout(_bottom.tr.clock, 60000);
        return;
      }
      const json = _bottom.tr.json;
      const level = {};
      Array.from($id('train_table', doc).rows).slice(1).forEach((tr) => {
        level[tr.cells[0].textContent] = parseInt(tr.cells[4].textContent);
      });
      json.error = '';
      if ($id('train_progress', doc)) {
        json.current_name = $id('train_progcnt', doc).previousElementSibling.textContent;
        json.current_level = level[json.current_name];
        json.current_end = /var end_time = (\d+);/.exec(html)[1] * 1000;
        _bottom.tr.node.link.textContent = `${json.current_name} [${json.current_level + 1}]`;
        _bottom.tr.clock();
      } else if (json.next_name) {
        const error = get_message(doc);
        if (error) {
          json.error = error;
          _bottom.tr.node.link.textContent = json.error;
          setTimeout(_bottom.tr.clock, 60000);
        } else if (level[json.next_name] < json.next_level) {
          if ($qs(`img[onclick*="training.start_training(${json.next_id})"]`, doc)) {
            _bottom.tr.load('start_train=' + json.next_id);
          } else {
            json.error = "Can't start Training";
            _bottom.tr.node.link.textContent = json.error;
            setTimeout(_bottom.tr.clock, 60000);
          }
        } else {
          _bottom.tr.node.link.textContent = 'Training completed!';
        }
      } else {
        _bottom.tr.node.link.textContent = 'Training completed!';
      }
      $config.set('tr_notif', json, 'hvut_');
    },
  };

  _bottom.tr.init();
}

// LOTTERY
if ($config.settings.lotteryNotification) {
  _bottom.show_lottery = function (ss) {
    const json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_');
    const lottery = json[ss];
    const now = Date.now();
    if (lottery.date > now && lottery.hide) {
      return;
    }
    _bottom.node[ss] = {};
    _bottom.node[ss].div = $element('div', _bottom.node.div, ['.hvut-lt-div']);
    _bottom.node[ss].equip = $element('a', _bottom.node[ss].div, { textContent: 'Loading...', href: `/?s=Bazaar&ss=${ss}`, target: (_server.persistent ? '_self' : '_blank') });
    _bottom.node[ss].time = $element('span', _bottom.node[ss].div, '--:--');

    if (lottery.date > now) {
      if (lottery.date - now < 3600000) {
        _bottom.node[ss].div.classList.add('hvut-bottom-warn');
      } else if (lottery.check) {
        _bottom.node[ss].div.classList.add('hvut-lt-check');
      }
      _bottom.node[ss].equip.textContent = lottery.equip;
      _bottom.node[ss].time.textContent = time_format(lottery.date - now, 1);
      return;
    }
    _bottom.node[ss].div.classList.add('hvut-bottom-warn');
    _bottom.load_lottery(ss);
  };

  _bottom.load_lottery = async function (ss) {
    const html = await $ajax.fetch('/?s=Bazaar&ss=' + ss);
    const doc = $doc(html);
    const eqname = $id('lottery_eqname', doc);
    if (!eqname) {
      _bottom.node[ss].equip.textContent = 'Failed to load';
      return;
    }
    const text = $id('rightpane', doc).lastElementChild.textContent;
    const json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_');
    const lottery = json[ss];
    const now = Date.now();
    let date = Date.now();
    let margin = 0;
    if (/Today's drawing is in (?:(\d+) hours?)?(?: and )?(?:(\d+) minutes?)?/.test(text)) {
      date += (60 * parseInt(RegExp.$1 || 0) + parseInt(RegExp.$2 || 0)) * 60000;
      margin = 2;
    } else if (text.includes("Today's ticket sale is closed")) {
      margin = 10;
    } else {
      throw new Error('Parsing Error');
    }
    const mm = (new Date(date)).getUTCMinutes();
    if (date && (mm < 1 || 60 - mm <= margin)) {
      date = Math.round(date / 3600000) * 3600000;
    }
    lottery.id = parseInt(/lottery=(\d+)/.exec($qs('img[src*="lottery_prev_a.png"]', doc)?.getAttribute('onclick'))[1] || 0) + 1;
    lottery.equip = eqname.textContent;
    lottery.date = date;
    lottery.check = $equip.filter.equip($config.settings.lotteryFilters, lottery.equip);
    lottery.hide = !$config.settings.lotteryNotification;
    $config.set('lt_notif', json, 'hvut_');
    if (lottery.check) {
      const date_text = eqname.previousElementSibling.textContent;
      popup(`<p>${date_text}</p><p style="color: #f00; font-weight: bold;">${lottery.equip}</p>`);
    }

    _bottom.node[ss].equip.textContent = lottery.equip;
    _bottom.node[ss].time.textContent = time_format(lottery.date - now, 1);
  };

  $element('div', _bottom.node.div, ['.hvut-spaceholder']);

  _bottom.show_lottery('lt');
  _bottom.show_lottery('la');
}


//* [1] Character - Character
if (_query.s === 'Character' && _query.ss === 'ch' || $id('persona_outer')) {
  _ch.persona = $id('persona_form').elements.persona_set.value;
  _ch.exp_table = [null, { total: 0 }];

  _ch.get_exp = function (level) {
    const num = parseInt(level);
    const dec = level % 1;
    if (!_ch.exp_table[num]) {
      _ch.exp_table[num] = { total: Math.round(Math.pow(num + 3, Math.pow(2.850263212287058, 1 + num / 1000))) };
    }
    let exp = _ch.exp_table[num].total;
    if (dec) {
      if (!_ch.exp_table[num].next) {
        _ch.exp_table[num].next = _ch.get_exp(num + 1) - exp;
      }
      exp += Math.round(_ch.exp_table[num].next * dec);
    }
    return exp;
  };

  _ch.get_level = function (exp, level) {
    level = parseInt(level) || 1;
    while (exp >= _ch.exp_table[level].total) {
      level++;
      if (!_ch.exp_table[level]) {
        _ch.exp_table[level] = { total: _ch.get_exp(level) };
      }
    }
    level--;
    if (!_ch.exp_table[level].next) {
      _ch.exp_table[level].next = _ch.exp_table[level + 1].total - _ch.exp_table[level].total;
    }
    return level + (exp - _ch.exp_table[level].total) / _ch.exp_table[level].next;
  };

  _ch.exp = {

    total: _window.total_exp,
    prof: {},

    init: function () {
      _ch.node.div.innerHTML = '';
      $qs('img[onclick*="do_attr_post"]').style.visibility = 'hidden';
      $id('prof_outer').classList.add('hvut-ch-prof');

      $qsa('#prof_outer tr').forEach((tr) => {
        const p = { tr: tr };
        const name = tr.cells[0].textContent;
        _ch.exp.prof[name] = p;
        p.current = parseFloat(tr.cells[1].textContent);
        p.exp = _ch.get_exp(p.current);
        tr.cells[1].textContent = p.current;
        $element('td', tr);
        $element('td', tr);
      });
      _ch.node.level = $input(['number', '角色等级', 'before'], _ch.node.div, { value: _player.level, min: 1, max: 600, style: 'width: 50px;' });
      const ass = $config.get('tr_level', {})['Assimilator'] || 0;
      _ch.node.ass = $input(['number', '训练: 同化者等级', 'before'], _ch.node.div, { value: ass, min: 0, max: 25, style: 'width: 30px;' });
      _ch.exp.calc();
    },

    calc: function () {
      const level = parseFloat(_ch.node.level.value);
      const ass = parseInt(_ch.node.ass.value);
      if (isNaN(level) || level < 1 || level > 600 || isNaN(ass) || ass < 0 || ass > 25) {
        return;
      }

      _window.total_exp = _ch.get_exp(level);
      _window.update_usable_exp();
      _window.update_display('str');

      const exp_gain = _window.total_exp - _ch.exp.total;
      const prof_gain = Math.max(0, exp_gain * 4 * (1 + ass * 0.1));
      Object.values(_ch.exp.prof).forEach((p) => {
        p.level = _ch.get_level(p.exp + prof_gain, p.current);
        p.tr.cells[2].textContent = '+' + (p.level - p.current).toFixed(3);
        p.tr.cells[3].textContent = p.level.toFixed(3);
      });
    },

  };

  GM_addStyle(/*css*/`
    #attr_table tr:last-child > td { padding-top: 10px !important; }
    .hvut-ch-div { position: absolute; margin: -25px 0 0 40px; font-size: 10pt; line-height: 22px; text-align: left; }
    .hvut-ch-div label { margin: 0 5px; }
    .hvut-ch-div label > input { text-align: right; }
    .hvut-ch-prof { width: 640px !important; font-size: 10pt; }
    .hvut-ch-prof > div { width: 310px !important; margin: 0 5px; }
    .hvut-ch-prof td:nth-child(1) { width: 105px !important; }
    .hvut-ch-prof td:nth-child(2) { width: 60px !important; }
    .hvut-ch-prof td:nth-child(3) { width: 65px; color: #c00; }
    .hvut-ch-prof td:nth-child(4) { width: 60px; font-weight: bold; }
  `);

  _ch.node = {};
  _ch.node.div = $element('div', $id('attr_outer'), ['.hvut-ch-div'], { input: () => { _ch.exp.calc(); } });
  $input(['button', 'EXP Simulator'], _ch.node.div, null, () => { _ch.exp.init(); });

  $persona.parse_stats_pane();
} else
// [END 1] Character - Character */


//* [2] Character - Equipment
if (_query.s === 'Character' && _query.ss === 'eq') {
  _eq.click_stats = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, name, value } = target.dataset;
    if (action === 'set') {
      if (value === 'this') {
        $persona.set_value(name, target.checked);
      }
    }
  };

        _eq.show_base = async function () {
            const html = await $ajax.fetch('?s=Character&ss=ch');
            const doc = $doc(html);
            const base = {};

            // 属性映射表
            const attrAlias = {
                "Strength": "力量",
                "Dexterity": "敏捷",
                "Agility": "灵巧",
                "Endurance": "体质",
                "Intelligence": "智力",
                "Wisdom": "智慧",
            };
            const toEnglish = {};
            for (const en in attrAlias) toEnglish[attrAlias[en]] = en;

            // 解析 attr_table
            $qsa('#attr_table tr:nth-last-child(n+2)', doc).forEach((tr) => {
                base[tr.children[0].textContent] = tr.children[1].textContent;
            });

            // 给 stats 表添加基础值
            $qsa('#stats_scrollable > table:nth-last-of-type(2) tr').forEach((tr) => {
                let name = tr.cells[1].textContent.trim();

                // 若是中文，转换成英文再查 base
                const eng = toEnglish[name] || name;

                if (base[eng] !== undefined) {
                    tr.cells[1].textContent = `[${base[eng]}] ${name}`;
                }
            });

    GM_addStyle(/*css*/`
      #stats_scrollable > table:nth-last-of-type(2) td:first-child { min-width: 35px; }
    `);
  };


  _eq.equip_code = function () {
    const code = _eq.equiplist.map((eq) => `[url=${location.origin}${location.pathname}equip/${eq.info.eid}/${eq.info.key}]${eq.info.name}[/url]`);
    popup_text(code, 900, 150);
  };

  _eq.equip_popups = function () {
    if (_eq.node.popups) {
      _eq.node.popups.classList.toggle('hvut-none');
      return;
    }
    _eq.node.popups = $element('div', document.body, ['.hvut-eq-popups', (_eq.equiplist.length > 6 ? '!width: 1690px;' : '')]);
    _eq.equiplist.forEach((eq) => { $element('iframe', _eq.node.popups, { src: `equip/${eq.info.eid}/${eq.info.key}`, scrolling: 'no' }); });
  };

  _eq.node = {};

  if (_query.equip_slot) {
    $equip.list.table($qs('#equiplist > table'));
  } else {
    GM_addStyle(/*css*/`
      #popup_box.hvut-eq-popupbox { margin-top: 12px; margin-left: -96px; }
      #eqsh { display: none; }
      #eqsl { margin-top: 15px; }
      #eqsb .eqb { padding: 0; height: auto; font-size: 10pt; line-height: 20px; text-align: center; overflow: hidden; }
      #eqsb .eqb > div:last-child { padding: 1px 0; }

      .hvut-eq-buttons { display: flex; width: 650px; margin: 5px auto; text-align: left; }
      .hvut-eq-info { position: absolute; top: 0; right: 0; font-size: 9pt; font-weight: normal; }
      .hvut-eq-info > span { display: inline-block; width: 80px; line-height: 16px; border-left: 1px solid #5C0D11; }
      .hvut-eq-untradeable { color: #c00; }

      .hvut-eq-popups { position: relative; width: 1270px; padding: 10px 0; line-height: 0; text-align: left; background-color: inherit; }
      .hvut-eq-popups iframe { width: 420px; height: 445px; border: 1px solid; margin: 0 -1px -1px 0; overflow: hidden; }
    `);

    $id('popup_box').classList.add('hvut-eq-popupbox');

    $persona.check_e();
    $persona.set_button();
    $persona.save_equipset();

    _eq.stats_pane = $persona.parse_stats_pane();
    _eq.show_base();
    _eq.equiplist = $equip.list.div($id('eqsb'), false);
    _eq.equiplist.forEach((eq) => {
      const div = $element('div', eq.node.wrapper.firstElementChild, ['.hvut-eq-info']);
      if (eq.info.upgrade_max) {
        $element('span', div, [`${eq.info.upgrade} / ${eq.info.iw}`]);
      } else {
        $element('span', div, [`Lv. ${eq.info.level}`, (!eq.info.tradeable ? '.hvut-eq-untradeable' : '')]);
      }
      $element('span', div, eq.info.pab);
    });

    _eq.node.buttons = $element('div', [$id('eqch_left'), 'afterbegin'], ['.hvut-eq-buttons']);
    $input(['button', 'Equip Code'], _eq.node.buttons, null, () => { _eq.equip_code(); });
    $input(['button', 'Equip Pop-ups'], _eq.node.buttons, null, () => { _eq.equip_popups(); });
    _eq.node.equipset_name = $input('text', _eq.node.buttons, { value: $persona.json.ename || 'Set ' + $persona.json.eset, style: 'width: 100px; margin-left: auto; text-align: center;' });
    $input(['button', 'Save'], _eq.node.buttons, null, () => { $persona.set_value('name', _eq.node.equipset_name.value); });

    if (_eq.stats_pane['Spell Type']) {
      //_eq.mage_stats();
    }
  }
} else
// [END 2] Character - Equipment */


//* [3] Character - Abilities
if (_query.s === 'Character' && _query.ss === 'ab') {
  _ab.ability = {
    'HP Tank': { category: 'General', img: '3.png', pos: 0, unlock: [0, 25, 50, 75, 100, 120, 150, 200, 250, 300], point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5] },
    'MP Tank': { category: 'General', img: '3.png', pos: -34, unlock: [0, 30, 60, 90, 120, 160, 210, 260, 310, 350], point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5] },
    'SP Tank': { category: 'General', img: '3.png', pos: -68, unlock: [0, 40, 80, 120, 170, 220, 270, 330, 390, 450], point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5] },
    'Better Health Pots': { category: 'General', img: '1.png', pos: 0, unlock: [0, 100, 200, 300, 400], point: [1, 2, 3, 4, 5] },
    'Better Mana Pots': { category: 'General', img: '1.png', pos: -34, unlock: [0, 80, 140, 220, 380], point: [2, 3, 5, 7, 9] },
    'Better Spirit Pots': { category: 'General', img: '1.png', pos: -68, unlock: [0, 90, 160, 240, 400], point: [2, 3, 5, 7, 9] },
    '1H Damage': { category: 'One-handed', img: 'e.png', pos: -68, unlock: [0, 100, 200], point: [2, 3, 5] },
    '1H Accuracy': { category: 'One-handed', img: 'e.png', pos: -34, unlock: [50, 150], point: [1, 2] },
    '1H Block': { category: 'One-handed', img: 'e.png', pos: 0, unlock: [250], point: [3] },
    '2H Damage': { category: 'Two-handed', img: 'k.png', pos: -34, unlock: [0, 100, 200], point: [2, 3, 5] },
    '2H Accuracy': { category: 'Two-handed', img: 'k.png', pos: 0, unlock: [50, 150], point: [1, 2] },
    '2H Parry': { category: 'Two-handed', img: 'e.png', pos: -102, unlock: [50, 200], point: [2, 3] },
    'DW Damage': { category: 'Dual-wielding', img: 'j.png', pos: 0, unlock: [0, 100, 200], point: [2, 3, 5] },
    'DW Accuracy': { category: 'Dual-wielding', img: 'k.png', pos: -68, unlock: [50, 150], point: [1, 2] },
    'DW Crit': { category: 'Dual-wielding', img: 'k.png', pos: -102, unlock: [250], point: [3] },
    'Staff Spell Damage': { category: 'Staff', img: '9.png', pos: -68, unlock: [0, 100, 200], point: [2, 3, 5] },
    'Staff Accuracy': { category: 'Staff', img: 'v.png', pos: 0, unlock: [50, 150, 300], point: [1, 2, 3] },
    'Staff Damage': { category: 'Staff', img: 'k.png', pos: -136, unlock: [0], point: [3] },
    'Cloth Spellacc': { category: 'Cloth Armor', img: '5.png', pos: 0, unlock: [0, 120, 240], point: [2, 3, 5] },
    'Cloth Spellcrit': { category: 'Cloth Armor', img: '5.png', pos: -34, unlock: [0, 40, 90, 130, 190], point: [1, 2, 3, 5, 7] },
    'Cloth Castspeed': { category: 'Cloth Armor', img: '5.png', pos: -68, unlock: [150, 250], point: [2, 5] },
    'Cloth MP': { category: 'Cloth Armor', img: 'u.png', pos: -136, unlock: [0, 60, 110, 170, 230, 290, 350], point: [1, 2, 3, 3, 4, 4, 5] },
    'Light Acc': { category: 'Light Armor', img: '7.png', pos: -34, unlock: [0], point: [3] },
    'Light Crit': { category: 'Light Armor', img: '7.png', pos: 0, unlock: [0, 40, 90, 130, 190], point: [1, 2, 3, 5, 7] },
    'Light Speed': { category: 'Light Armor', img: '6.png', pos: -68, unlock: [150, 250], point: [2, 5] },
    'Light HP/MP': { category: 'Light Armor', img: '5.png', pos: -102, unlock: [0, 60, 110, 170, 230, 290, 350], point: [1, 2, 3, 3, 4, 4, 5] },
    'Heavy Crush': { category: 'Heavy Armor', img: 'j.png', pos: -34, unlock: [0, 75, 150], point: [3, 5, 7] },
    'Heavy Prcg': { category: 'Heavy Armor', img: 'a.png', pos: -102, unlock: [0, 75, 150], point: [3, 5, 7] },
    'Heavy Slsh': { category: 'Heavy Armor', img: 'j.png', pos: -68, unlock: [0, 75, 150], point: [3, 5, 7] },
    'Heavy HP': { category: 'Heavy Armor', img: 'u.png', pos: -102, unlock: [0, 60, 110, 170, 230, 290, 350], point: [1, 2, 3, 3, 4, 4, 5] },
    'Better Weaken': { category: 'Deprecating 1', img: '4.png', pos: 0, unlock: [70, 100, 130, 190, 250], point: [1, 2, 3, 5, 7] },
    'Faster Weaken': { category: 'Deprecating 1', img: 'b.png', pos: -68, unlock: [80, 165, 250], point: [3, 5, 7] },
    'Better Imperil': { category: 'Deprecating 1', img: 'a.png', pos: -68, unlock: [130, 175, 230, 285, 330], point: [1, 2, 3, 4, 5] },
    'Faster Imperil': { category: 'Deprecating 1', img: 'r.png', pos: 0, unlock: [140, 225, 310], point: [3, 5, 7] },
    'Better Blind': { category: 'Deprecating 1', img: 'r.png', pos: -34, unlock: [110, 130, 160, 190, 220], point: [1, 2, 3, 4, 5] },
    'Faster Blind': { category: 'Deprecating 1', img: '9.png', pos: -102, unlock: [120, 215, 275], point: [1, 2, 3] },
    'Mind Control': { category: 'Deprecating 1', img: '9.png', pos: -136, unlock: [80, 130, 170], point: [1, 3, 5] },
    'Better Silence': { category: 'Deprecating 2', img: 'c.png', pos: -170, unlock: [120, 170, 215], point: [3, 5, 7] },
    'Better Immobilize': { category: 'Deprecating 2', img: 'u.png', pos: 0, unlock: [250, 295, 340, 370, 400], point: [1, 2, 3, 4, 5] },
    'Better Slow': { category: 'Deprecating 2', img: 'c.png', pos: 0, unlock: [30, 50, 75, 105, 135], point: [1, 2, 3, 4, 5] },
    'Better Drain': { category: 'Deprecating 2', img: '2.png', pos: 0, unlock: [20, 50, 90], point: [2, 3, 5] },
    'Faster Drain': { category: 'Deprecating 2', img: 'n.png', pos: 0, unlock: [30, 70, 110, 150, 200], point: [1, 2, 3, 4, 5] },
    'Ether Theft': { category: 'Deprecating 2', img: '2.png', pos: -34, unlock: [150], point: [5] },
    'Spirit Theft': { category: 'Deprecating 2', img: '2.png', pos: -68, unlock: [150], point: [5] },
    'Better Haste': { category: 'Supportive 1', img: '9.png', pos: -34, unlock: [60, 75, 90, 110, 130], point: [1, 2, 3, 4, 5] },
    'Better Shadow Veil': { category: 'Supportive 1', img: '6.png', pos: -34, unlock: [90, 105, 120, 135, 155], point: [1, 2, 3, 5, 7] },
    'Better Absorb': { category: 'Supportive 1', img: 'c.png', pos: -34, unlock: [40, 60, 80], point: [1, 2, 3] },
    'Stronger Spirit': { category: 'Supportive 1', img: 'a.png', pos: 0, unlock: [200, 220, 240, 265, 285], point: [1, 2, 3, 4, 5] },
    'Better Heartseeker': { category: 'Supportive 1', img: '6.png', pos: 0, unlock: [140, 185, 225, 265, 305, 345, 385], point: [1, 2, 3, 4, 5, 6, 7] },
    'Better Arcane Focus': { category: 'Supportive 1', img: 'q.png', pos: 0, unlock: [175, 205, 245, 285, 325, 365, 405], point: [1, 2, 3, 4, 5, 6, 7] },
    'Better Regen': { category: 'Supportive 1', img: 'b.png', pos: -34, unlock: [50, 70, 95, 145, 195, 245, 295, 375, 445, 500], point: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    'Better Cure': { category: 'Supportive 1', img: 'i.png', pos: -102, unlock: [0, 35, 65], point: [2, 3, 5] },
    'Better Spark': { category: 'Supportive 2', img: 'q.png', pos: -170, unlock: [100, 125, 150], point: [2, 3, 5] },
    'Better Protection': { category: 'Supportive 2', img: 'o.png', pos: 0, unlock: [40, 55, 75, 95, 120], point: [1, 2, 3, 4, 5] },
    'Flame Spike Shield': { category: 'Supportive 2', img: 's.png', pos: 0, unlock: [10, 65, 140, 220, 300], point: [3, 1, 2, 3, 4] },
    'Frost Spike Shield': { category: 'Supportive 2', img: 'p.png', pos: 0, unlock: [10, 65, 140, 220, 300], point: [3, 1, 2, 3, 4] },
    'Shock Spike Shield': { category: 'Supportive 2', img: 'g.png', pos: 0, unlock: [10, 65, 140, 220, 300], point: [3, 1, 2, 3, 4] },
    'Storm Spike Shield': { category: 'Supportive 2', img: 'a.png', pos: -34, unlock: [10, 65, 140, 220, 300], point: [3, 1, 2, 3, 4] },
    'Conflagration': { category: 'Elemental', img: 'h.png', pos: 0, unlock: [50, 100, 150, 200, 250, 300, 400], point: [3, 4, 5, 6, 8, 10, 12] },
    'Cryomancy': { category: 'Elemental', img: 'i.png', pos: -34, unlock: [50, 100, 150, 200, 250, 300, 400], point: [3, 4, 5, 6, 8, 10, 12] },
    'Havoc': { category: 'Elemental', img: '9.png', pos: 0, unlock: [50, 100, 150, 200, 250, 300, 400], point: [3, 4, 5, 6, 8, 10, 12] },
    'Tempest': { category: 'Elemental', img: 'i.png', pos: -68, unlock: [50, 100, 150, 200, 250, 300, 400], point: [3, 4, 5, 6, 8, 10, 12] },
    'Sorcery': { category: 'Elemental', img: 'c.png', pos: -68, unlock: [70, 140, 210, 280, 350], point: [1, 2, 3, 4, 5] },
    'Elementalism': { category: 'Elemental', img: 'c.png', pos: -136, unlock: [85, 170, 255, 340, 425], point: [2, 3, 5, 7, 9] },
    'Archmage': { category: 'Elemental', img: 'i.png', pos: 0, unlock: [90, 180, 270, 360, 450], point: [5, 7, 9, 12, 15] },
    'Better Corruption': { category: 'Forbidden', img: 't.png', pos: 0, unlock: [75, 150], point: [3, 5] },
    'Better Disintegrate': { category: 'Forbidden', img: 't.png', pos: -34, unlock: [175, 250], point: [5, 7] },
    'Better Ragnarok': { category: 'Forbidden', img: 'u.png', pos: -68, unlock: [250, 325, 400], point: [7, 9, 12] },
    'Ripened Soul': { category: 'Forbidden', img: 'u.png', pos: -34, unlock: [150, 300, 450], point: [7, 10, 15] },
    'Dark Imperil': { category: 'Forbidden', img: 't.png', pos: -68, unlock: [175, 225, 275, 325, 375], point: [2, 3, 5, 7, 9] },
    'Better Smite': { category: 'Divine', img: 'q.png', pos: -136, unlock: [75, 150], point: [3, 5] },
    'Better Banish': { category: 'Divine', img: 'q.png', pos: -34, unlock: [175, 250], point: [5, 7] },
    'Better Paradise': { category: 'Divine', img: 'q.png', pos: -68, unlock: [250, 325, 400], point: [7, 9, 12] },
    'Soul Fire': { category: 'Divine', img: 'l.png', pos: 0, unlock: [150, 300, 450], point: [7, 10, 15] },
    'Holy Imperil': { category: 'Divine', img: 'v.png', pos: -34, unlock: [175, 225, 275, 325, 375], point: [2, 3, 5, 7, 9] },
  };

  _ab.preset = {
    'Current Set': [],
    'One-handed': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', '1H Damage', '1H Accuracy', '1H Block', 'Heavy Crush', 'Heavy Prcg', 'Heavy Slsh', 'Heavy HP', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Heartseeker', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield'],
    'Two-handed': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', '2H Damage', '2H Accuracy', '2H Parry', 'Light Acc', 'Light Crit', 'Light Speed', 'Light HP/MP', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Heartseeker', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield'],
    'Dual-wielding': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', 'DW Damage', 'DW Accuracy', 'DW Crit', 'Light Acc', 'Light Crit', 'Light Speed', 'Light HP/MP', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Heartseeker', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield'],
    'Niten Ichiryu': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', '2H Damage', '2H Parry', 'DW Accuracy', 'DW Crit', 'Light Acc', 'Light Crit', 'Light Speed', 'Light HP/MP', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Heartseeker', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield'],
    'Elemental mage': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', 'Staff Spell Damage', 'Staff Accuracy', 'Cloth Spellacc', 'Cloth Spellcrit', 'Cloth Castspeed', 'Cloth MP', 'Better Imperil', 'Faster Imperil', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Arcane Focus', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield', 'Conflagration', 'Sorcery', 'Elementalism', 'Archmage'],
    'Dark mage': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', 'Staff Spell Damage', 'Staff Accuracy', 'Cloth Spellacc', 'Cloth Spellcrit', 'Cloth Castspeed', 'Cloth MP', 'Better Imperil', 'Faster Imperil', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Arcane Focus', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield', 'Better Corruption', 'Better Disintegrate', 'Better Ragnarok', 'Ripened Soul', 'Dark Imperil'],
    'Holy mage': ['HP Tank', 'MP Tank', 'SP Tank', 'Better Health Pots', 'Better Mana Pots', 'Better Spirit Pots', 'Staff Spell Damage', 'Staff Accuracy', 'Cloth Spellacc', 'Cloth Spellcrit', 'Cloth Castspeed', 'Cloth MP', 'Better Imperil', 'Faster Imperil', 'Better Haste', 'Better Shadow Veil', 'Stronger Spirit', 'Better Arcane Focus', 'Better Regen', 'Better Cure', 'Better Spark', 'Better Protection', 'Flame Spike Shield', 'Better Smite', 'Better Banish', 'Better Paradise', 'Soul Fire', 'Holy Imperil'],
  };

  _ab.point = parseInt(/Ability Points: (\d+)/.exec($id('ability_top').children[3].textContent)[1]);
  _ab.level = {};

  _ab.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, name, to } = target.dataset;
    if (action === 'unlock') {
      e.stopPropagation();
      _ab.unlock(name, to);
    }
  };

  _ab.unlock = async function (name, to) {
    const ab = _ab.ability[name];
    const count = to - ab.level;

    async function unlock(ab) {
      const html = await $ajax.fetch(location.href, 'unlock_ability=' + ab.id);
      const doc = $doc(html);
      const error = get_message(doc);
      if (error) {
        popup(error);
      } else {
        const button = $qs('div[style*="u.png"]', ab.div.children[2]);
        button.style.opacity = 0.5;
        button.style.backgroundImage = button.style.backgroundImage.replace('u.png', 'f.png');
      }
    }

    const requests = $ajax.repeat(count, unlock, ab);
    await Promise.all(requests);
    location.href = location.href;
  };

  _ab.calc = {

    node: { ability: {} },
    level: [],
    selected: [],

    init: function () {
      if (_ab.calc.inited) {
        return;
      }
      _ab.calc.inited = true;

      Object.entries(_ab.ability).forEach(([n, ab]) => {
        ab.unlock.forEach((u, i) => {
          if (!_ab.calc.level[u]) {
            _ab.calc.level[u] = [];
          }
          _ab.calc.level[u].push({ name: n, level: i + 1, point: ab.point[i] });
        });
      });

      const node = _ab.calc.node;
      node.div = $element('div', $id('mainpane'), ['.hvut-ab-calc'], (e) => { _ab.calc.click(e); });
      node.side = $element('div', node.div, ['.hvut-side hvut-ab-side']);
      node.ul = $element('ul', $element('div', node.div), ['.hvut-ab-ul']);
      node.table = $element('table', $element('div', node.div), ['.hvut-ab-table']);

      $input(['button', '关闭窗口'], node.side, { dataset: { action: 'toggle' }, className: 'hvut-side-margin' });
      Object.keys(_ab.preset).forEach((n) => { $input(['button', n], node.side, { dataset: { action: 'preset', name: n } }); });

      let category;
      let li;
      Object.entries(_ab.ability).forEach(([n, ab]) => {
        if (category !== ab.category) {
          category = ab.category;
          li = $element('li', node.ul);
          $element('span', li, [category, '.hvut-ab-category']);
        }
        const icon = $element('div', li, [{ dataset: { action: 'ability', name: n } }, '.hvut-ab-icon hvut-ab-off', `!background-image: url("/y/t/${ab.img}"); background-position-x: ${ab.pos - 2}px;`]);
        $element('span', icon, [n, '.hvut-ab-tooltip']);
        node.ability[n] = icon;
      });

      _ab.calc.preset('Current Set');
    },

    preset: function (name) {
      _ab.calc.selected.forEach((e) => { _ab.calc.node.ability[e].classList.add('hvut-ab-off'); });
      _ab.calc.selected = _ab.preset[name].slice();
      _ab.calc.selected.forEach((e) => { _ab.calc.node.ability[e].classList.remove('hvut-ab-off'); });
      _ab.calc.table();
    },

    ability: function (name) {
      const selected = _ab.calc.selected;
      if (selected.includes(name)) {
        selected.splice(selected.indexOf(name), 1);
        _ab.calc.node.ability[name].classList.add('hvut-ab-off');
      } else {
        selected.push(name);
        _ab.calc.node.ability[name].classList.remove('hvut-ab-off');
      }
      _ab.calc.table();
    },

    table: function () {
      const tbody = [];
      let sum = 0;
      _ab.calc.level.forEach((list, unlock) => {
        const selected = list.filter(({ name }) => _ab.calc.selected.includes(name));
        if (!selected.length) {
          return;
        }
        sum += selected.reduce((s, e) => (s + e.point), 0);
        const aboost = sum - unlock;
        const tr = $element('tr', null, [(_player.level < unlock ? '.hvut-ab-nolevel' : '')]);
        $element('td', tr, unlock);
        $element('td', tr, sum);
        $element('td', tr, [`/<span>${aboost}</span>`, (aboost < 0 ? '.hvut-ab-noab' : '')]);
        const td = $element('td', tr);
        selected.forEach(({ name, level, point }) => {
          const ab = _ab.ability[name];
          const icon = $element('div', td, ['.hvut-ab-icon', `!background-image: url("/y/t/${ab.img}"); background-position-x: ${ab.pos - 2}px;`]);
          $element('span', icon, [point, '.hvut-ab-point']);
          $element('span', icon, [`${name} Lv.${level}`, '.hvut-ab-tooltip']);
        });
        tbody.push(tr);
      });

      _ab.calc.node.table.innerHTML = '<thead><tr><td>Level</td><td>Ability Points</td><td>Ability Boost</td><td>Abilities</td></tr></thead><tbody></tbody>';
      _ab.calc.node.table.tBodies[0].append(...tbody);
      $qsa('.hvut-ab-table tr:not(.hvut-ab-nolevel)').at(-1).scrollIntoView({ block: 'center' });
    },

    toggle: function () {
      _ab.calc.node.div?.classList.toggle('hvut-none');
      _ab.calc.init();
    },

    click: function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, name } = target.dataset;
      if (action === 'preset') {
        _ab.calc.preset(name);
      } else if (action === 'ability') {
        _ab.calc.ability(name);
      } else if (action === 'toggle') {
        _ab.calc.toggle();
      }
    },

  };

  GM_addStyle(/*css*/`
    .hvut-ab-slot { position: absolute; bottom: -5px; left: 2px; width: 30px; font-size: 9pt; color: #fff; }
    .hvut-ab-max { background-color: #333; }
    .hvut-ab-limit { background-color: #03c; }
    .hvut-ab-up { background-color: #c00; }
    .hvut-ab-tree > img[src*='/td'] { filter: brightness(250%); }
    .hvut-ab-bar { font-size: 9pt; line-height: 30px; white-space: nowrap; }
    .hvut-ab-bu { color: #333; display: block; }
    .hvut-ab-bux { color: #999; display: block; cursor: not-allowed; }
    .hvut-ab-bx { color: #999; }

    #ability_treepane > div > div:first-child { padding-top: 13px; }
    .hvut-ab-warn { display: block; margin-top: -6px; }
    .hvut-ab-warn::before { content: attr(data-warn); display: inline-block; margin-bottom: 2px; padding: 1px 3px; border-radius: 2px; background-color: #c00; color: #fff; font-size: 9pt; }

    .hvut-ab-calc { display: flex; position: absolute; top: 27px; left: 0; width: 100%; height: 675px; justify-content: center; align-items: center; background-color: #EDEBDF; z-index: 9; font-size: 10pt; text-align: left; }
    .hvut-ab-calc > div { margin: 0 10px; height: 616px; }
    .hvut-ab-calc > div:nth-child(3) { overflow: hidden scroll; }
    .hvut-ab-icon { display: inline-block; position: relative; width: 30px; margin: 2px; height: 32px; vertical-align: middle; background-position-y: -2px; cursor: default; }
    .hvut-ab-off { filter: grayscale(100%); box-shadow: 0 0 0 20px #fff9 inset; }
    .hvut-ab-off:hover { filter: none; }
    .hvut-ab-point { position: absolute; top: 0; right: 0; width: 14px; padding: 1px; text-align: center; background-color: #333; color: #fff; font-size: 9pt; }
    .hvut-ab-tooltip { visibility: hidden; position: absolute; bottom: 32px; left: 0; padding: 0 3px; border: 1px solid; background-color: #fff; font-size: 9pt; line-height: 16px; white-space: nowrap; z-index: 1; pointer-events: none; }
    .hvut-ab-icon:hover > .hvut-ab-tooltip { visibility: visible; }

    .hvut-ab-side { position: static; }
    .hvut-ab-ul { width: 450px; margin: 0; padding: 0; border: 1px solid; list-style: none; }
    .hvut-ab-ul > li { padding: 2px; border-bottom: 1px solid; }
    .hvut-ab-ul > li:last-child { border-bottom: 0; }
    .hvut-ab-category { display: inline-block; width: 130px; margin-left: 10px; font-weight: bold; vertical-align: middle; }
    .hvut-ab-ul .hvut-ab-icon { cursor: pointer; }
    .hvut-ab-table { table-layout: fixed; border-collapse: separate; border-spacing: 0; position: relative; width: 400px; text-align: right; }
    .hvut-ab-table thead td { position: sticky; top: 0; height: 36px; border-top-width: 1px; font-weight: bold; text-align: center; background-color: #edb; z-index: 1; }
    .hvut-ab-table td { border-style: solid; border-width: 0 1px 1px 0; padding: 2px 5px; }
    .hvut-ab-table td:nth-child(1) { border-left-width: 1px; }
    .hvut-ab-table td:nth-child(2) { width: 50px; }
    .hvut-ab-table td:nth-child(3) { width: 50px; }
    .hvut-ab-table td:nth-child(4) { width: 204px; text-align: left; }
    .hvut-ab-table .hvut-ab-icon:nth-child(n+7) { margin-top: 7px; }
    .hvut-ab-nolevel { background-color: #edb; }
    .hvut-ab-noab > span { color: #999; }
  `);

  $qsa('#ability_top div[onmouseover*="overability"]').forEach((div) => {
    const exec = /overability\(\d+, '([^']+)'.+?(?:(Not Acquired)|Requires <strong>Level (\d+))/.exec(div.getAttribute('onmouseover'));
    const name = exec[1];
    const ab = _ab.ability[name];

    ab.slotted = true;
    ab.level = exec[2] ? 0 : 1 + ab.unlock.indexOf(parseInt(exec[3]));
    ab.max = ab.unlock.length;
    ab.limit = ab.unlock.findIndex((e) => e > _player.level);
    if (ab.limit === -1) {
      ab.limit = ab.max;
    }

    _ab.preset['Current Set'].push(name);
    if (ab.level) {
      _ab.level[name] = ab.level;
    }

    const span = $element('span', div, ['.hvut-ab-slot']);
    if (ab.level === ab.max) {
      span.textContent = 'max';
      span.classList.add('hvut-ab-max');
    } else if (ab.level === ab.limit) {
      span.textContent = `${ab.level}/${ab.max}`;
      span.classList.add('hvut-ab-limit');
    } else {
      span.textContent = `${ab.level}/${ab.max}`;
      span.classList.add('hvut-ab-up');
      const categories = ['General', 'One-handed', 'Two-handed', 'Dual-wielding', '', 'Staff', 'Cloth Armor', 'Light Armor', 'Heavy Armor', 'Deprecating 1', 'Deprecating 2', 'Supportive 1', 'Supportive 2', 'Elemental', 'Forbidden', 'Divine'];
      const index = categories.indexOf(ab.category);
      $qsa('#ability_treelist > div')[index].classList.add('hvut-ab-tree');
    }
  });
  $config.set('ab_level', _ab.level);

  $id('ability_treepane').addEventListener('click', _ab.click, true);
  $qsa('#ability_treepane > div').forEach((div) => {
    const name = div.firstElementChild.textContent;
    const ab = _ab.ability[name];
    let point = _ab.point;

    ab.div = div;
    ab.id = /do_unlock_ability\((\d+)\)/.exec(div.children[2].getAttribute('onclick'))?.[1] || '';
    ab.level = 0;

    Array.from(div.children[2].children).forEach((button, i) => {
      const type = /(.)\.png/.exec(button.style.backgroundImage)[1];
      button.classList.add('hvut-ab-bar');

      if (type === 'f') {
        ab.level++;
      } else if (type === 'u') {
        point -= ab.point[i];
        if (point < 0) {
          $element('span', button, [ab.point[i], '.hvut-ab-bux']);
        } else {
          $element('span', button, [ab.point[i], '.hvut-ab-bu', { dataset: { action: 'unlock', name: name, to: i + 1 } }]);
        }
      } else if (type === 'x') {
        $element('span', button, [`${ab.point[i]} (${ab.unlock[i]})`, '.hvut-ab-bx']);
      }
    });

    if (ab.level) {
      if (!ab.slotted) {
        div.firstElementChild.firstElementChild.classList.add('hvut-ab-warn');
        div.firstElementChild.firstElementChild.dataset.warn = '未配置';
      } else if (ab.level !== ab.limit) {
        div.firstElementChild.firstElementChild.classList.add('hvut-ab-warn');
        div.firstElementChild.firstElementChild.dataset.warn = '可升级';
      }
    }
  });

  $input(['button', 'Ability Simulator'], $id('ability_outer'), { style: 'position: absolute; top: 20px; left: -80px; width: 90px; white-space: normal;' }, () => { _ab.calc.toggle(); });
} else
// [END 3] Character - Abilities */


//* [4] Character - Training
if (_query.s === 'Character' && _query.ss === 'tr') {
  _tr.data = {
    'Adept Learner': { id: 50, b: 100, l: 50, e: 0.000417446 },
    'Assimilator': { id: 51, b: 50000, l: 50000, e: 0.0057969565 },
    'Ability Boost': { id: 80, b: 100, l: 100, e: 0.0005548607 },
    'Manifest Destiny': { id: 81, b: 1000000, l: 1000000, e: 0 },
    'Scavenger': { id: 70, b: 500, l: 500, e: 0.0088310825 },
    'Luck of the Draw': { id: 71, b: 2000, l: 2000, e: 0.0168750623 },
    'Quartermaster': { id: 72, b: 5000, l: 5000, e: 0.017883894 },
    'Archaeologist': { id: 73, b: 25000, l: 25000, e: 0.030981982 },
    'Metabolism': { id: 84, b: 1000000, l: 1000000, e: 0 },
    'Inspiration': { id: 85, b: 2000000, l: 2000000, e: 0 },
    'Scholar of War': { id: 90, b: 30000, l: 10000, e: 0 },
    'Tincture': { id: 91, b: 30000, l: 10000, e: 0 },
    'Pack Rat': { id: 98, b: 10000, l: 10000, e: 0 },
    'Dissociation': { id: 88, b: 1000000, l: 1000000, e: 0 },
    'Set Collector': { id: 96, b: 12500, l: 12500, e: 0 },
  };

  _tr.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, name } = target.dataset;
    if (action === 'change') {
      _tr.change(name);
    }
  };

  _tr.change = function (name, level) {
    const training = _tr.data[name];
    if (!training?.time) {
      _tr.node.select.value = '';
      _tr.node.level.value = '';
      _tr.node.level.disabled = true;
      _tr.node.cost.value = '';
      return;
    }
    if (!level) {
      level = training.level;
    }
    _tr.node.select.value = name;
    _tr.node.level.value = level;
    _tr.node.level.min = training.level;
    _tr.node.level.max = training.max;
    _tr.node.level.disabled = false;
    _tr.calc();
  };

  _tr.calc = function () {
    const name = _tr.node.select.value;
    const to = parseInt(_tr.node.level.value);
    if (!name || !to) {
      return;
    }

    const training = _tr.data[name];
    let from = training.level;
    let cost = 0;
    if (name === _tr.current) {
      from++;
    }
    while (from < to) {
      cost += Math.round(Math.pow(training.b + training.l * from, 1 + training.e * from));
      from++;
    }
    _tr.node.cost.value = cost.toLocaleString();
  };

  _tr.set = function (reload) {
    if (_tr.node.select.value) {
      _tr.json.next_name = _tr.node.select.value;
      _tr.json.next_level = parseInt(_tr.node.level.value);
      _tr.json.next_id = _tr.data[_tr.node.select.value].id;
    } else {
      _tr.json.next_name = '';
      _tr.json.next_level = 0;
      _tr.json.next_id = 0;
    }
    $config.set('tr_notif', _tr.json, 'hvut_');

    if (reload) {
      location.href = location.href;
    }
  };

  _tr.cancel = function (reload) {
    _tr.node.select.value = '';
    _tr.set(reload);
  };

  GM_addStyle(/*css*/`
    #train_table td:last-child { width: 100px; padding-right: 10px; }
    #train_table tr:last-child > td { font-weight: bold; }
  `);

  _tr.node = {};
  _tr.node.div = $element('div', [$id('train_outer'), 'afterbegin'], ['!margin: 5px;' + ($config.settings.trainingNotification ? '' : ' display: none;')]);
  _tr.node.select = $input(['select', [':Plan Training...']], _tr.node.div, null, { change: () => { _tr.change(_tr.node.select.value); } });
  _tr.node.level = $input('number', _tr.node.div, { disabled: true, style: 'width: 30px; text-align: right;' }, { input: () => { _tr.calc(); } });
  $input(['button', 'Set'], _tr.node.div, null, () => { _tr.set(true); });
  _tr.node.cost = $input('text', _tr.node.div, { readOnly: true, style: 'width: 90px; text-align: right;' });
  $input(['button', 'Cancel Planning'], _tr.node.div, null, () => { _tr.cancel(true); });

  _tr.json = $config.get('tr_notif', {}, 'hvut_');
  _tr.current = $qs('#train_progress > div:nth-child(2) > :first-child')?.textContent;
  _tr.level = {};
  _tr.spent = 0;

  if ($id('train_progress')) {
    confirm_event($qs('img[src$="/canceltrain.png"]'), 'click', '你确定要取消当前的训练计划吗?', null, _tr.cancel);
  }

  $id('train_table').addEventListener('click', _tr.click);
  Array.from($id('train_table').rows).forEach((tr, i) => {
    if (!i) {
      $element('th', tr);
      $element('th', tr, ['/<div class="fc2 fac fcb"><div>Spent Credits</div></div>']);
      return;
    }
    const name = tr.cells[0].textContent.trim();
    const time = parseFloat(tr.cells[3].textContent);
    const level = parseInt(tr.cells[4].textContent);
    const max = parseInt(tr.cells[6].textContent);

    _tr.level[name] = level;

    const training = _tr.data[name];
    if (!training) {
      return;
    }
    training.time = time;
    training.level = level;
    training.max = max;
    if (training.time) {
      tr.classList.add('hvut-cphu');
      tr.dataset.action = 'change';
      tr.dataset.name = name;
      $element('option', _tr.node.select, { text: name, value: name });
    }

    let spent = 0;
    for (let i = 0; i < level; i++) {
      spent += Math.round(Math.pow(training.b + training.l * i, 1 + training.e * i));
    }
    _tr.spent += spent;
    $element('td', tr, [`/<div class="fc4 far fcb"><div>${spent.toLocaleString()}</div></div>`]);
  });
  $element('tr', $id('train_table').tBodies[0], [`/<td colspan="9"><div class="fc4 far fcb"><div>Total ${_tr.spent.toLocaleString()}</div></div></td>`]);

  $config.set('tr_level', _tr.level);

  if (_tr.current && _tr.data[_tr.current]) {
    _tr.json.current_name = _tr.current;
    _tr.json.current_level = _tr.data[_tr.current].level;
    _tr.json.current_end = _window.end_time * 1000;
  } else {
    _tr.json.current_name = '';
    _tr.json.current_level = 0;
    _tr.json.current_end = 0;
  }
  if (_tr.json.next_name) {
    if (_tr.data[_tr.json.next_name].level < _tr.json.next_level) {
      _tr.change(_tr.json.next_name, _tr.json.next_level);
    } else {
      _tr.json.next_name = '';
      _tr.json.next_level = 0;
      _tr.json.next_id = 0;
    }
  }
  _tr.json.error = '';
  $config.set('tr_notif', _tr.json, 'hvut_');
} else
// [END 4] Character - Training */


//* [5] Character - Item Inventory
if (_query.s === 'Character' && _query.ss === 'it') {
  $qsa('.itemlist tr').forEach((tr) => {
    const div = tr.cells[0].firstElementChild;
    const type = $item.get_type(div.getAttribute('onmouseover'));
    tr.classList.add('hvut-it-' + type);
  });

  GM_addStyle(/*css*/`
    #item_left { width: 400px; }
    #item_left .cspp { overflow-y: scroll; }
    #item_list .itemlist td:nth-child(1) { width: 285px !important; }
    #item_list .itemlist td:nth-child(2) { width: 75px !important; }
    #item_right { width: 605px; }
    #item_slots { height: 572px; margin-top: 19px; }
    #item_slots > div { width: 300px; }
    .sa { height: 30px; margin: 8px auto; line-height: 20px; }
    .sa > div { height: 20px !important; padding: 5px 10px !important; }
    .sa > div:last-child > div { padding: 0; }
  `);
} else
// [END 5] Character - Item Inventory */


//* [6] Character - Settings
if (_query.s === 'Character' && _query.ss === 'se') {
  _se.form = $qs('#settings_outer form');
  _se.elements = Array.from(_se.form.elements);
  _se.json = $config.get('se_settings', {});
  _se.node = {};

  _se.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, key } = target.dataset;
    if (action === 'load') {
      _se.load(key);
    } else if (action === 'remove') {
      _se.remove(key);
    } else if (action === 'save') {
      _se.save();
    }
  };
  _se.add = function (name) {
    _se.node[name] = $input(['button', name], _se.div, { dataset: { action: 'load', key: name }, className: 'hvut-se-button' });
    $input(['button', 'x'], _se.div, { dataset: { action: 'remove', key: name }, className: 'hvut-se-remove' });
  };
  _se.save = function () {
    const name = prompt('Enter the name of the settings')?.trim();
    if (!name) {
      return;
    }
    if (!_se.json[name]) {
      _se.add(name);
    }
    const form = new FormData(_se.form);
    const json = Object.fromEntries(form.entries());
    _se.json[name] = json;
    $config.set('se_settings', _se.json);
  };
  _se.load = function (name) {
    const json = _se.json[name];
    _se.elements.forEach((e) => {
      if (e.type === 'button' || e.type === 'reset' || e.type === 'image' || e.type === 'submit') {
        return;
      }
      if (e.type === 'checkbox') {
        e.checked = json[e.name];
      } else if (e.type === 'radio') {
        e.checked = json[e.name] === e.value;
      } else {
        e.value = json[e.name];
      }
    });
  };
  _se.remove = function (name) {
    delete _se.json[name];
    $config.set('se_settings', _se.json);
    _se.node[name].nextElementSibling.remove();
    _se.node[name].remove();
  };

  GM_addStyle(/*css*/`
    .hvut-se-div { margin-top: 20px; padding: 20px 0; border-top: 3px double; text-align: left; }
    .hvut-se-div .hvut-se-button { min-width: 50px; margin: 0 30px 10px 10px; }
    .hvut-se-div .hvut-se-remove { visibility: hidden; width: 22px; margin-left: -30px; }
    .hvut-se-button:hover + .hvut-se-remove, .hvut-se-remove:hover { visibility: visible; }
  `);

  _se.div = $element('div', _se.form, ['.hvut-se-div'], (e) => { _se.click(e); });
  $input(['button', 'Save Current Settings'], _se.div, { dataset: { action: 'save' }, style: 'margin-bottom: 15px;' });
  $element('br', _se.div);

  Object.keys(_se.json).forEach((p) => { _se.add(p); });

  _se.elements.forEach((e) => {
    if (e.nodeName === 'SELECT') {
      const value = e.value;
      const options = Array.from(e.options);
      options.sort((a, b) => { let av = a.value; let bv = b.value; if (av && !isNaN(av) && bv && !isNaN(bv)) { av = Number(av); bv = Number(bv); } return (av > bv ? 1 : -1); });
      e.append(...options);
      e.value = value;
    }
  });

  _se.form.fontlocal.required = true;
  _se.form.fontface.required = true;
  _se.form.fontsize.required = true;
  _se.form.fontface.placeholder = 'Tahoma, Arial';
  _se.form.fontsize.placeholder = '10';
  _se.form.fontoff.placeholder = '0';
} else
// [END 6] Character - Settings */


//* [7] Bazaar - Item Shop
if (_query.s === 'Bazaar' && _query.ss === 'is') {
  $qsa('#item_pane .itemlist tr').forEach((tr) => {
    const div = tr.cells[0].firstElementChild;
    const type = $item.get_type(div.getAttribute('onmouseover'));
    tr.classList.add('hvut-it-' + type);
  });
  $qsa('#shop_pane .itemlist tr').forEach((tr) => {
    const div = tr.cells[0].firstElementChild;
    const type = $item.get_type(div.getAttribute('onmouseover'));
    tr.classList.add('hvut-it-' + type);
  });

  GM_addStyle(/*css*/`
    .itshop_pane .cspp { margin-top: 15px; overflow-y: scroll; }
    #itshop_outer .itemlist td:nth-child(1) { width: 285px !important; }
    #itshop_outer .itemlist td:nth-child(2) { width: 75px !important; }
  `);
} else
// [END 7] Bazaar - Item Shop */


//* [8] Bazaar - The Shrine
if (_query.s === 'Bazaar' && _query.ss === 'ss') {
  _ss.node = {};
  _ss.equip = { capacity: 0, usage: 0, requests: 0, received: 0, sold: 0, salvaged: 0, total: 0 };

  _ss.data = {
    trophy: {
      'ManBearPig Tail': { tier: 2, value: 1000 },
      'Holy Hand Grenade of Antioch': { tier: 2, value: 1000 },
      "Mithra's Flower": { tier: 2, value: 1000 },
      'Dalek Voicebox': { tier: 2, value: 1000 },
      'Lock of Blue Hair': { tier: 2, value: 1000 },
      'Bunny-Girl Costume': { tier: 3, value: 2000 },
      'Hinamatsuri Doll': { tier: 3, value: 2000 },
      'Broken Glasses': { tier: 3, value: 2000 },
      'Black T-Shirt': { tier: 4, value: 4000 },
      'Sapling': { tier: 4, value: 4000 },
      'Unicorn Horn': { tier: 5, value: 5000 },
      'Noodly Appendage': { value: 5000 },
    },
    items: [
      'Precursor Artifact',
      'Trophy Tier 2', 'Trophy Tier 3', 'Trophy Tier 4', 'Trophy Tier 5',
      'ManBearPig Tail', 'Holy Hand Grenade of Antioch', "Mithra's Flower", 'Dalek Voicebox', 'Lock of Blue Hair', 'Bunny-Girl Costume', 'Hinamatsuri Doll', 'Broken Glasses', 'Black T-Shirt', 'Sapling', 'Unicorn Horn', 'Noodly Appendage',
      "Tenbora's Box", 'Peerless Voucher',
      'Shrine Fortune', 'Festival Coupon', 'Stocking Stuffers',
      'Platinum Coupon', 'Golden Coupon', 'Silver Coupon', 'Bronze Coupon',
    ],
    rewards: [
      'Energy Drink', '2 Hath', '1 Hath', '3x Last Elixir', 'Last Elixir', 'Flower Vase', 'Bubble-Gum', 'Chaos Token',
      { name: '5000x Crystals', match: /5000x Crystal of/ }, { name: '3000x Crystals', match: /3000x Crystal of/ }, { name: '1000x Crystals', match: /1000x Crystal of/ },
      { name: 'Primary Attributes Bonuses', match: /was increased by 1|has increased by one/ },
      'Peerless', 'Legendary', 'Magnificent', 'Exquisite', 'Superior', 'Average', 'Fair', 'Crude',
      { name: 'Pouches', match: /Pouch/ }, { name: 'Greater Charms', match: /Greater .* Charm/ }, { name: 'Lesser Charms', match: /Lesser .* Charm/ },
      { name: '3x High-Grade Materials', match: /3x High-Grade/ }, { name: '2x High-Grade Materials', match: /2x High-Grade/ }, { name: '1x High-Grade Materials', match: /1x High-Grade/ },
      { name: 'Bindings', match: /Binding of/ },
    ],
    groups: [
      'Vigor', 'Finesse', 'Swiftness', 'Fortitude', 'Cunning', 'Knowledge', 'Flames', 'Frost', 'Lightning', 'Tempest', 'Devotion', 'Corruption',
      'Strength', 'Dexterity', 'Agility', 'Endurance', 'Intelligence', 'Wisdom',
      'Cloth', 'Leather', 'Metal', 'Wood',
      'Mithril', 'Kevlar', 'Silk',
    ],
  };

  _ss.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, iid, count, type, slot } = target.dataset;
    if (action === 'offer') {
      _ss.offer.click(iid, count);
    } else if (action === 'select') {
      e.preventDefault();
      _ss.select.click(type, slot);
    }
  };

  _ss.select = {
    reward_type: '',
    reward_slot: '',
    node: {},

    init: function () {
      $qsa('#accept_equip input[type="submit"]').forEach((s) => {
        s.dataset.action = 'select';
        const exec = /submit_shrine_reward\('(.*?)','(.*?)'\)/.exec(s.getAttribute('onclick'));
        const type = exec[1];
        const slot = exec[2];
        const select = slot ? `${type}_${slot}` : type;
        s.dataset.type = type;
        s.dataset.slot = slot;
        _ss.select.node[select] = s;
        s.removeAttribute('onclick');
      });
    },
    click: function (type, slot) {
      const select = slot ? `${type}_${slot}` : type;
      const button = _ss.select.node[select];
      const prev = _ss.select.node.selected;
      if (button.disabled) {
        return;
      }
      if (prev === button) {
        prev.classList.remove('hvut-ss-selected');
        _ss.select.node.selected = null;
        _ss.select.reward_type = '';
        _ss.select.reward_slot = '';
      } else {
        prev?.classList.remove('hvut-ss-selected');
        button.classList.add('hvut-ss-selected');
        _ss.select.node.selected = button;
        _ss.select.reward_type = button.dataset.type;
        _ss.select.reward_slot = button.dataset.slot;
      }
    },
  };

  _ss.list = {
    index: function (name) {
      const list = _ss.data.rewards;
      let index = list.findIndex((e) => (typeof e === 'string' ? e === name : e.name === name));
      if (index !== -1) {
        return { index };
      }
      index = list.findIndex((e) => (typeof e === 'object' && e.match.test(name)));
      if (index === -1) {
        index = 99;
        return { index };
      }
      const group = list[index].name;
      const glist = _ss.data.groups;
      let gindex = glist.findIndex((e) => name.includes(e)) + 1;
      if (gindex === 0) {
        gindex = 99;
      }
      index += gindex / 100;
      return { index, group };
    },
    sort: function (item) {
      const array = Object.values(item.rewards);
      array.sort((a, b) => (a.index - b.index) || (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));
      return array;
    },
    table: function (item, parent) {
      const table = $element('table', parent, ['.hvut-ss-table', `/<tbody><tr><th colspan="3">${item.name} <span>(${item.total})</span></th></tr></tbody>`]);
      item.node.table = table;
      item.node.total = table.rows[0].cells[0].lastElementChild;
    },
    update: function (item, name, count, all) {
      if (!item.rewards[name]) {
        _ss.list.reward(item, name);
      }
      const reward = item.rewards[name];
      reward.count += count;
      reward.node.count.textContent = reward.count;
      if (reward.group) {
        _ss.list.update(item, reward.group, count, all);
      } else if (all) {
        Object.values(item.rewards).forEach((reward) => {
          if (!reward.group) {
            reward.node.pct.textContent = (reward.count * 100 / item.total).toFixed(1) + '%';
          }
        });
      } else {
        reward.node.pct.textContent = (reward.count * 100 / item.total).toFixed(1) + '%';
      }
    },
    reward: function (item, name, type) {
      const { index, group } = _ss.list.index(name);
      const reward = { name, index, group, count: 0, node: {} };
      item.rewards[name] = reward;
      reward.node.tr = $element('tr', null, [`/<td></td><td></td><td>${name}</td>`]);
      reward.node.pct = reward.node.tr.cells[0];
      reward.node.count = reward.node.tr.cells[1];
      const list = _ss.list.sort(item);
      const next = list[list.indexOf(reward) + 1];
      item.node.table.tBodies[0].insertBefore(reward.node.tr, next?.node.tr);
      if (type === 'group') {
        reward.node.tr.classList.add('hvut-ss-group');
      } else if (reward.group) {
        reward.node.tr.classList.add('hvut-ss-groupitem');
        if (!item.rewards[reward.group]) {
          _ss.list.reward(item, reward.group, 'group');
        }
      }
    },
    equip: function (item, equip) {
      if ($equip.filter.equip($config.settings.shrineFilters, equip)) {
        const quality = equip.split(' ')[0];
        const reward = item.rewards[quality];
        $element('tr', [reward.node.tr, 'afterend'], [`/<td></td><td></td><td>${equip}</td>`, '.hvut-ss-equip']);
      }
    },
  };

  _ss.offer = {
    items: {},
    init: function () {
      $qsa('.itemlist tr').forEach((tr) => {
        const div = tr.cells[0].firstElementChild;
        const name = div.textContent;
        const type = $item.get_type(div.getAttribute('onmouseover'));
        const { iid, stock, bulk } = $item.get_data(div.getAttribute('onclick'));
        const max = Math.floor(stock / bulk);
        const item = { logname: name, name, type, iid, stock, bulk, max, requests: 0, total: 0, rewards: {}, node: {} };
        _ss.offer.items[iid] = item;

        div.classList.add('hvut-it-' + type);
        item.node.stock = tr.cells[1];
        item.node.bulk = $element('td', tr);
        item.node.max = $element('td', tr);
        const td = $element('td', tr);
        item.node.count = $input('text', td);
        item.node.button = $input(['button', 'Offer'], td, { dataset: { action: 'offer', iid: iid, count: 'input' } });

        if (item.type === 'Trophy') {
          if (_ss.data.trophy[name]) {
            item.tier = _ss.data.trophy[name].tier;
            item.value = _ss.data.trophy[name].value;
            if (item.tier) {
              let t = item.tier;
              let b = item.bulk;
              while (b > 1) {
                b /= (t === 2) ? 4 : (t === 3) ? 2 : (t === 4) ? 4 : 1;
                t++;
              }
              item.value *= (t === item.tier) ? 1 : (t === 3) ? 1.1 : (t === 4) ? 1.2 : (t === 5) ? 1.3 : 1;
              item.upgrade = t;
              item.logname = 'Trophy Tier ' + t;
            }
          }
          item.node.bulk.textContent = ' / ' + item.bulk;
          item.node.max.textContent = item.max;
          $input(['button', 'All'], td, { dataset: { action: 'offer', iid: iid, count: 'max' } });
        }
        if ($config.settings.shrineHideItems.some((h) => name.includes(h))) {
          tr.classList.add('hvut-none-item');
        }
      });
    },
    click: function (iid, count) {
      const item = _ss.offer.items[iid];
      if (count === 'input') {
        count = item.node.count.value;
      }
      _ss.offer.request(iid, count, _ss.select.reward_type, _ss.select.reward_slot);
    },
    request: function (iid, count, reward_type, reward_slot) {
      if (_ss.error) {
        popup(_ss.error);
        return;
      }

      const item = _ss.offer.items[iid];
      if (item.type === 'Trophy' && !reward_type) {
        alert('Select the major class of the equipment.');
        return;
      }
      if (count === 'max') {
        count = item.max;
      } else {
        count = parseInt(count);
      }
      if (count > item.max) {
        count = item.max;
      }
      if (!count || count < 0) {
        return;
      }
      item.requests += count;
      item.stock -= count * item.bulk;
      item.max -= count;
      item.node.stock.textContent = item.stock;
      item.node.max.textContent = item.max;
      if (item.type === 'Trophy') {
        _ss.equip.requests += count;
      }

      if (!_ss.log.json[item.logname]) {
        _ss.log.json[item.logname] = {};
      }
      if (!item.log) {
        item.log = _ss.log.json[item.logname];
      }
      if (!item.node.table) {
        _ss.list.table(item, _ss.node.results);
      }
      _ss.node.results.classList.remove('hvut-none');
      scrollIntoView(item.node.table);

      for (let i = 0; i < count; i++) {
        _ss.offer.load(iid, reward_type, reward_slot);
      }
    },
    load: async function (iid, reward_type, reward_slot) {
      const html = await $ajax.fetch('?s=Bazaar&ss=ss', `select_item=${iid}&select_reward_type=${reward_type}&select_reward_slot=${reward_slot}`);
      const doc = $doc(html);
      /*
      <div id="messagebox_inner" style="overflow-y:auto">
        <p class="messagebox_error">Your equipment inventory is full</p>
      </div>

      trophy
        Snowflake has blessed you with an item!
        Exquisite Axe of Slaughter
        (Salvaged it for 3x Low-Grade Metals)
        (Sold the remains for 8 credits)
        Received 1x Peerless Voucher!
        Received 1x Lesser Dark Strike Charm!
        Received 1x Silk Charm Pouch!
        Hit Space Bar to offer another item like this.

      collectable
        Received 2x High-Grade Metals
        Received 1x Binding of the Turtle

      artifact
        Snowflake has blessed you with some of her power!
        Received 2 Hath
        Received 3x Last Elixir
        Received Flower Vase
        Received Bubble-Gum
        Received Chaos Token
        Received 5000x Crystal of Lightning
        Agility was increased by 1
        Dexterity was increased by 1
        Hit Space Bar to offer another item like this.
      */
      const reg_text = /Snowflake has blessed you with an item|Snowflake has blessed you with some of her power|Hit Space Bar to offer another item like this/;
      const reg_voucher = /Peerless Voucher/;
      const reg_equip = /^(Crude|Fair|Average|Superior|Exquisite|Magnificent|Legendary|Peerless)/;
      const reg_received = /^Received (.*?)!?$/;
      const reg_pab = /was increased by 1|has increased by one/;
      const item = _ss.offer.items[iid];
      const list = [];
      const equips = [];

      get_message(doc, true).forEach((msg) => {
        if (!msg || reg_text.test(msg)) {
          return;
        } else if (reg_voucher.test(msg)) {
          popup(`<p style="color: #f00; font-weight: bold;">${msg}</p>`);
        } else if (reg_equip.test(msg)) {
          list.push(RegExp.$1);
          equips.push(msg);
          _ss.equip.received++;
        } else if (reg_received.test(msg)) {
          list.push(RegExp.$1);
        } else if (reg_pab.test(msg)) {
          list.push(msg);
        } else if (msg.includes('Sold it for')) {
          _ss.equip.sold++;
        } else if (msg.includes('Salvaged it for')) {
          _ss.equip.salvaged++;
        } else if (msg.includes('Sold the remains for')) {
        } else { //Your equipment inventory is full
          _ss.error = msg;
          popup(msg);
        }
      });

      item.total++;
      item.node.total.textContent = `(${item.total}/${item.requests})`;
      list.forEach((reward) => {
        if (!item.log[reward]) {
          item.log[reward] = 0;
        }
        item.log[reward]++;
        _ss.list.update(item, reward, 1, 'all');
      });

      if (item.type === 'Trophy') {
        _ss.equip.total = _ss.equip.usage + _ss.equip.received - _ss.equip.sold - _ss.equip.salvaged;
        _ss.node.results_equip.value = `仓库容量: ${_ss.equip.total} / ${_ss.equip.capacity}` + (_ss.equip.sold ? `, 自动出售: ${_ss.equip.sold}` : '') + (_ss.equip.salvaged ? `, 自动分解: ${_ss.equip.salvaged}` : '');
        if (_ss.equip.total >= _ss.equip.capacity) {
          if (!_ss.error) {
            _ss.error = 'Your equipment inventory is full';
            popup(_ss.error);
          }
        }
        equips.forEach((equip) => {
          _ss.list.equip(item, equip);
        });
      }

      if (item.total % 10 === 0 || item.total === item.requests || _ss.error) {
        _ss.log.save();
      }
    },
    toggle: function () {
      _ss.node.results.classList.toggle('hvut-none');
    },
  };

  _ss.log = {
    json: $config.get('ss_log', {}),
    items: {},
    sort: function () {
      const json = _ss.log.json;
      const list = _ss.data.items;
      const array = Object.entries(json);
      array.forEach((item) => {
        let index = list.indexOf(item[0]);
        if (index === -1) {
          index = 999;
        }
        item[2] = index;
        delete json[item[0]];
      });
      array.sort((a, b) => (a[2] - b[2]) || (a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0));
      const items = Object.fromEntries(array);
      Object.assign(json, items);
    },
    view: function () {
      _ss.node.log.innerHTML = '';
      _ss.log.sort();
      Object.keys(_ss.log.json).forEach((name) => {
        _ss.log.item(name);
      });
    },
    item: function (name) {
      const reg_trophy = /^(Crude|Fair|Average|Superior|Exquisite|Magnificent|Legendary|Peerless)/;
      const reg_artifact = /Energy Drink|Hath|Last Elixir|Flower Vase|Bubble-Gum|Chaos Token|Crystal of|was increased by 1|has increased by one/;
      const reg_collectable = /High-Grade|Binding of/;
      const log = _ss.log.json[name];
      const entries = Object.entries(log);
      let type;
      entries.some(([name]) => {
        type = reg_trophy.test(name) ? 'Trophy' : reg_artifact.test(name) ? 'Artifact' : reg_collectable.test(name) ? 'Collectable' : false;
        return type;
      });
      let total = entries;
      if (type === 'Trophy') { // charm, pouch
        total = total.filter(([name]) => reg_trophy.test(name));
      }
      total = total.reduce((s, [, c]) => (s + c), 0);
      if (type === 'Collectable') {
        total /= 2;
      }
      const item = { name, log, type, total, rewards: {}, node: {} };
      _ss.log.items[name] = item;
      _ss.list.table(item, _ss.node.log);

      entries.forEach(([reward, count]) => {
        _ss.list.update(item, reward, count);
      });
    },
    toggle: function () {
      if (_ss.node.log.classList.contains('hvut-none')) {
        _ss.log.view();
        _ss.node.log.classList.remove('hvut-none');
      } else {
        _ss.node.log.classList.add('hvut-none');
        _ss.node.log.innerHTML = '';
      }
    },
    save: function () {
      $config.set('ss_log', _ss.log.json);
    },
    reset: function () {
      if (confirm('The Shrine log in this browser will be deleted.\nAre you sure?')) {
        $config.del('ss_log');
        location.href = location.href;
      }
    },
  };

  _ss.calc_trophies = function () {
    _ss.trophies_value = 0;
    _ss.trophies_text = [];
    Object.values(_ss.offer.items).forEach((item) => {
      if (item.type === 'Trophy' && item.value) {
        const count = item.stock - item.stock % item.bulk;
        if (count) {
          _ss.trophies_value += count * item.value;
          _ss.trophies_text.push(`${count.toLocaleString()} x ${item.name} @ ${item.value.toLocaleString()} = ${(count * item.value).toLocaleString()}`);
        }
      }
    });
    _ss.node.trophies.value = `你库存中的奖杯总价值为 ${_ss.trophies_value.toLocaleString()} credits.`;
  };

  _ss.show_trophies = function () {
    popup_text(_ss.trophies_text, 600, 250);
  };

  _ss.load_inventory = function () {
    $ajax.fetch('?s=Bazaar&ss=am&screen=organize').then((html) => {
      const exec = /<td>Inventory Capacity:<\/td><td>(\d+)(?: \+ (\d+))?<\/td><td>\/<\/td><td>(\d+)<\/td>/.exec(html);
      const usage = parseInt(exec[1]) + parseInt(exec[2] || 0);
      const capacity = parseInt(exec[3]);
      _ss.equip.usage = usage;
      _ss.equip.capacity = capacity;
      _ss.node.results_equip.value = `Inventory Capacity: ${_ss.equip.usage} / ${_ss.equip.capacity}`;
    });
  };

  GM_addStyle(/*css*/`
    #shrine_outer { position: relative; width: 1066px; margin-left: 130px; }
    #shrine_left { width: 562px; }
    #shrine_left .cspp { overflow-y: scroll; }

    #shrine_left .itemlist td:nth-child(1) { width: 230px !important; }
    #shrine_left .itemlist td:nth-child(2) { width: 60px; }
    #shrine_left .itemlist td:nth-child(3) { width: 30px; padding-left: 5px; text-align: left; font-size: 8pt; color: #930; }
    #shrine_left .itemlist td:nth-child(4) { width: 50px; }
    #shrine_left .itemlist td:nth-child(5) { width: 148px; padding-left: 5px; text-align: left; }
    #shrine_left .itemlist input { margin: 0 1px; }
    #shrine_left .itemlist input:nth-child(1) { width: 40px; text-align: right; }
    #shrine_left .itemlist input:nth-child(2) { width: 50px; }
    #shrine_left .itemlist input:nth-child(3) { width: 40px; }

    .hvut-ss-side { top: 33px; left: -110px; }
    .hvut-ss-log { position: absolute; top: 33px; left: 0; width: 540px; height: 550px; margin: 0; padding: 10px; border: 1px solid; text-align: left; overflow-y: scroll; background-color: #EDEBDF; }
    .hvut-ss-results { position: absolute; top: 33px; left: 572px; width: 472px; height: 550px; margin: 0; padding: 10px; border: 1px solid; text-align: left; overflow-y: scroll; background-color: #EDEBDF; }

    .hvut-ss-table { width: stretch; margin: 20px 10px; font-size: 10pt; }
    .hvut-ss-table th { padding: 5px; font-weight: bold; background-color: #E3E0D1; }
    .hvut-ss-table td { padding: 2px 10px; }
    .hvut-ss-table td:nth-child(1) { width: 60px; text-align: right; color: #930; }
    .hvut-ss-table td:nth-child(2) { width: 50px; text-align: right; }
    .hvut-ss-table tr { border: 0 solid #5C0D11; }
    .hvut-ss-table tr:first-child, .hvut-ss-table tr:last-child { border-bottom-width: 1px; }
    .hvut-ss-table tr.hvut-ss-group { border-top-width: 1px; }
    .hvut-ss-groupitem { color: #666; }
    .hvut-ss-equip { color: #930; }

    .hvut-ss-selected:not([disabled]) { color: #c00 !important; border-color: #c00 !important; outline: 1px solid; }
  `);

  $id('inv_item').addEventListener('click', _ss.click);
  $id('accept_equip').addEventListener('click', _ss.click);

  _ss.node.side = $element('div', $id('shrine_outer'), ['.hvut-side hvut-ss-side']);
  toggle_button($input('button', _ss.node.side), '过滤: 开', '过滤: 关', $id('inv_item'), 'hvut-none-cont', 'on');
  $input(['button', '献祭结果'], _ss.node.side, null, () => { _ss.offer.toggle(); });
  $input(['button', '献祭记录'], _ss.node.side, null, () => { _ss.log.toggle(); });
  $input(['button', '重置记录'], _ss.node.side, null, () => { _ss.log.reset(); });
  $input(['button', '过滤规则'], _ss.node.side, null, () => { $config.open('shrineHideItems'); });

  _ss.node.log = $element('div', $id('shrine_outer'), ['.hvut-ss-log hvut-none']);
  _ss.node.results = $element('div', $id('shrine_outer'), ['.hvut-ss-results hvut-none']);
  _ss.node.results_buttons = $element('div', _ss.node.results, ['!margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid; text-align: center;']);
  _ss.node.results_equip = $input(['button', 'Inventory Capacity'], _ss.node.results_buttons, { style: 'width: 450px;' });

  _ss.node.trophies = $input('button', $id('shrine_trophy'), { style: 'margin: 5px;' }, () => { _ss.show_trophies(); });

  _ss.offer.init();
  _ss.select.init();
  _ss.calc_trophies();
  _ss.load_inventory();
} else
// [END 8] Bazaar - The Shrine */


//* [9] Bazaar - The Market
if (_query.s === 'Bazaar' && _query.ss === 'mk') {
  if (!_query.screen) {
    _query.screen = 'browseitems';
  }
  if (!_query.filter) {
    _query.filter = 'co';
  }

  _mk.init_list = function () {
    if (!$qs('#market_itemlist table')) {
      return;
    }
    $price.parse_market(_query.filter);
    _mk.items = Object.keys($price.market);
    Array.from($qs('#market_itemlist table').rows).forEach((tr, i) => {
      if (i === 0) {
        $element('th', tr, 'HVUT Price');
        return;
      }
      const name = tr.cells[0].textContent;
      const td = $element('td', tr);
      $price.market[name].td = td;
    });
    _mk.modify();

    if (!$id('market_itemfilter')) {
      $element('div', $id('market_right'), ['#market_itemfilter']);
    }
    const side = $element('div', $id('market_left').lastElementChild, ['.hvut-side hvut-mk-side']);
    $input(['button', 'Set as Bid'], side, null, () => { _mk.save('bid'); });
    $input(['button', 'Set as Ask'], side, null, () => { _mk.save('ask'); });
    $input(['button', 'Edit Prices'], side, null, () => { _mk.edit(); });
  };

  _mk.edit = function () {
    $price.edit(_mk.items, _query.filter, _mk.modify);
  };

  _mk.save = function (key) {
    $price.set_market(_mk.items, key);
    _mk.modify();
  };

  _mk.modify = function () {
    const prices = $price.get();
    _mk.items.forEach((name) => {
      $price.market[name].td.textContent = prices[name] || '';
    });
  };

  _mk.get_crystals = function () {
    if (!$qs('#market_itemlist table')) {
      return;
    }
    const [bid, ask] = ['Crystal of Vigor', 'Crystal of Finesse', 'Crystal of Swiftness', 'Crystal of Fortitude', 'Crystal of Cunning', 'Crystal of Knowledge', 'Crystal of Flames', 'Crystal of Frost', 'Crystal of Lightning', 'Crystal of Tempest', 'Crystal of Devotion', 'Crystal of Corruption'].reduce((s, e) => [s[0] + $price.market[e].bid * 1000, s[1] + $price.market[e].ask * 1000], [0, 0]);
    $element('tr', [$qs('#market_itemlist table').rows[0], 'afterend'], [`/<td>Crystal Pack</td><td></td><td>${bid} C</td><td>${ask} C</td><td></td>`]);
  };

  _mk.click2link = function () {
    if (!$qs('#market_itemlist table')) {
      return;
    }
    Array.from($qs('#market_itemlist table').rows).forEach((tr) => {
      const onclick = tr.getAttribute('onclick');
      if (!onclick) {
        return;
      }
      const href = /document\.location='([^']+)'/.exec(onclick)[1];
      $element('a', tr.cells[0], { href });
      tr.removeAttribute('onclick');
    });
  };

  GM_addStyle(/*css*/`
    #market_itemlist th { z-index: 1; }
    #market_itemlist tr { position: relative; }
    #market_itemlist td a { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

    .hvut-mk-side { bottom: 20px; left: 32px; }
  `);

  _mk.init_list();
  _mk.click2link();
  if (_query.screen === 'browseitems' && _query.filter === 'mo') {
    _mk.get_crystals();
  }
  $id('account_amount').autocomplete = 'off';
} else
// [END 9] Bazaar - The Market */


//* [11] Bazaar - Monster Lab
if (_query.s === 'Bazaar' && _query.ss === 'ml' && $config.settings.monsterLab) {
  if (_query.create) {
  } else if (_query.slot) {
    if (_query.pane === 'skills') {
      const prev_button = $qs('img[src$="/monster/prev.png"]');
      prev_button.setAttribute('onclick', prev_button.getAttribute('onclick').replace('ss=ml', 'ss=ml&pane=skills'));
      const next_button = $qs('img[src$="/monster/next.png"]');
      next_button.setAttribute('onclick', next_button.getAttribute('onclick').replace('ss=ml', 'ss=ml&pane=skills'));
    }
  } else {
    GM_addStyle(/*css*/`
      #monster_outer { margin-left: 130px; font-weight: normal; }
      #monster_list .cspp { margin-top: 15px; overflow-y: scroll; }

      .hvut-ml-side { top: 38px; left: -110px; }
      .hvut-ml-sort { position: absolute; display: flex; top: 10px; left: 22px; font-size: 10pt; line-height: 16px; }
      .hvut-ml-sort > span { display: inline-block; margin: 0 5px; padding: 2px 0; border: 1px solid; box-sizing: border-box; }
      .hvut-ml-sort > .hvut-ml-sort-current { font-weight: bold; outline: 1px solid; }

      #monster_list { width: auto; }
      #monster_actions { width: auto; }
      #slot_pane { height: 514px !important; white-space: nowrap; }
      #slot_pane > div { position: relative; display: flex; height: 26px; line-height: 26px; }
      #slot_pane > div > div { margin-left: 10px; padding: 0; }
      #slot_pane .fc4 { font-size: 10pt; }
      #slot_pane > div > div:nth-child(1) { order: 1; width: 20px; }
      #slot_pane > div > div:nth-child(2) { order: 2; width: 210px; overflow: hidden; }
      #slot_pane > div > div:nth-child(4) { order: 3; width: 70px; }
      #slot_pane > div > div:nth-child(3) { order: 4; width: 40px; text-align: right; }
      #slot_pane > div > div:nth-child(7) { order: 5; width: 90px; }
      #slot_pane > div > div:nth-child(8) { order: 6; width: 25px; }
      #slot_pane > div > div:nth-child(9) { order: 7; width: 50px; }
      #slot_pane > div > div:nth-child(6) { order: 8; width: 200px; }
      #slot_pane > div > div:nth-child(5) { order: 9; width: 200px; }

      .hvut-ml-new { background-color: #edb; }
      .hvut-ml-wins::after { content: 'Last Update: ' attr(data-update); position: absolute; top: 2px; right: 615px; border: 1px solid; padding: 2px 4px; line-height: 16px; background-color: #edb; visibility: hidden; }
      .hvut-ml-wins:hover::after { visibility: visible; }
      .hvut-ml-outdated { color: #c00; }
      .hvut-ml-gains > span { display: inline-block; width: 25px; line-height: 22px; border-radius: 2px; background-color: #5C0D11; color: #fff; }
      .hvut-ml-gains > ul { visibility: hidden; position: absolute; top: 2px; right: 515px; margin: 0; padding: 5px 10px; border: 1px solid; list-style: none; font-size: 9pt; line-height: 20px; white-space: nowrap; background-color: #EDEBDF; z-index: 3; }
      .hvut-ml-gains:hover > ul { visibility: visible; }
      #slot_pane > div:nth-of-type(n+15):nth-last-of-type(-n+5) > .hvut-ml-gains > ul { top: auto; bottom: 2px; }
      .msn { height: auto; }
      .hvut-ml-feed { position: absolute; top: 5px; left: 62px; width: 124px; height: 12px; font-size: 8pt; line-height: 12px; }
      div:hover > .hvut-ml-feed { background-color: #fff9; }

      .hvut-ml-summary { position: absolute; top: 38px; left: 10px; max-height: 500px; min-width: 400px; margin: 0; padding: 10px; overflow: auto; border: 1px solid; list-style: none; background-color: #EDEBDF; font-size: 9pt; line-height: 20px; text-align: left; white-space: nowrap; z-index: 1; }
      .hvut-ml-summary > li:first-child { margin-bottom: 5px; font-weight: bold; }
      .hvut-ml-summary > li { margin: 0 5px; }
      .hvut-ml-log { position: absolute; top: 38px; left: 610px; margin: 0; padding: 10px; width: 460px; height: 560px; column-count: 2; column-gap: 10px; border: 1px solid; list-style: none; background-color: #EDEBDF; font-size: 9pt; line-height: 16px; text-align: left; white-space: nowrap; z-index: 2; }
      .hvut-ml-log > li { overflow: hidden; text-overflow: ellipsis; }
      .hvut-ml-log > li:nth-child(-n+3) { column-span: all; font-weight: bold; }
      .hvut-ml-log > li:nth-child(3) { margin-bottom: 16px; }
      .hvut-ml-margin { margin-top: 16px !important; }
      .hvut-ml-break { break-after: column; }

      .hvut-ml-up { position: absolute; top: 27px; left: 0; width: 100%; height: 675px; z-index: 9; background-color: #EDEBDF; font-size: 10pt; text-align: left; }
      .hvut-ml-up-list { height: 493px; margin: 20px 10px 10px; overflow-y: scroll; }
      .hvut-ml-up-table { table-layout: fixed; border-collapse: separate; border-spacing: 0 3px; margin: -3px auto; width: 1180px; line-height: 24px; text-align: center; white-space: nowrap; user-select: none; }
      .hvut-ml-up-table tr:first-child td { position: sticky; top: 0; font-size: 8pt; background-color: #edb; }
      .hvut-ml-up-table tr:hover td { background-color: #edb; }
      .hvut-ml-up-table td { width: 24px; padding: 0; border-width: 1px 0; border-style: solid; border-color: #5C0D11; }
      .hvut-ml-up-table td:hover { background-color: #fff !important; }
      .hvut-ml-up-table td:nth-child(1) { width: 30px; }
      .hvut-ml-up-table td:nth-child(2) { width: auto; text-align: left; padding-left: 5px; }
      .hvut-ml-up-table td:nth-child(3) { width: 90px; text-align: left; padding-left: 5px; }
      .hvut-ml-up-table td:nth-child(4) { width: 40px; }
      .hvut-ml-up-table td:nth-child(5) { width: 40px; }
      .hvut-ml-up-table td:nth-child(1) { border-left-width: 1px; }
      .hvut-ml-up-table td:nth-child(5),
      .hvut-ml-up-table td:nth-child(6),
      .hvut-ml-up-table td:nth-child(14),
      .hvut-ml-up-table td:nth-child(22),
      .hvut-ml-up-table td:nth-child(35) { border-right-width: 1px; }
      .hvut-ml-up-change { color: #c00; }
      .hvut-ml-up-table td[data-desc]::after { content: attr(data-desc); visibility: hidden; position: absolute; top: 24px; left: -1px; white-space: nowrap; padding: 2px 10px; background-color: #fff; border: 1px solid; z-index: 1; }
      .hvut-ml-up-table td[data-desc]:nth-last-child(-n+13)::after { left: auto; right: -1px; }
      .hvut-ml-up-table td[data-desc]:hover::after { visibility: visible; }

      .hvut-ml-up-bottom { margin: 10px; }
      .hvut-ml-up-bottom > ul { float: left; margin: 0 5px; padding: 5px; list-style: none; border: 1px solid; }
      .hvut-ml-up-bottom li { margin: 5px; }
      .hvut-ml-up-bottom li::after { content: ''; display: block; clear: both; }
      .hvut-ml-up-bottom li.hvut-ml-up-nostock { color: #c00; }
      .hvut-ml-up-bottom li > span { float: left; text-align: right; }
      .hvut-ml-up-crystal span:nth-child(1) { width: 70px; }
      .hvut-ml-up-crystal span:nth-child(2) { width: 90px; }
      .hvut-ml-up-crystal span:nth-child(3) { width: 100px; }
      .hvut-ml-up-crystal span:nth-child(4) { width: 90px; }
      .hvut-ml-up-token span:nth-child(1) { width: 130px; }
      .hvut-ml-up-token span:nth-child(2) { width: 70px; }
      .hvut-ml-up-buttons { float: right; width: 100px; display: flex; flex-direction: column; }
      .hvut-ml-up-buttons input { margin: 3px 0; }

      .hvut-ml-plc { display: flex; position: absolute; top: 27px; left: 0; width: 100%; height: 675px; justify-content: center; align-items: center; z-index: 9; background-color: #EDEBDF; font-size: 10pt; text-align: left; white-space: nowrap; }
      .hvut-ml-plc-right { height: 635px; margin-left: 20px; }
      .hvut-ml-plc-buttons { display: flex; flex-wrap: wrap; justify-content: space-between; width: 250px; }
      .hvut-ml-plc-buttons input { margin: 0 0 4px; }
      .hvut-ml-plc-buttons input:nth-child(-n+3) { width: 32%; }
      .hvut-ml-plc-buttons input:nth-child(4) { width: 100%; margin-top: 16px; }
      .hvut-ml-plc-buttons input:nth-child(n+5) { width: 24%; }
      .hvut-ml-plc-table { table-layout: fixed; border-collapse: collapse; margin-top: 20px; width: 480px; }
      .hvut-ml-plc-table tr:first-child { font-weight: bold; }
      .hvut-ml-plc-table td { border: 1px solid; padding: 2px 5px; }
      .hvut-ml-plc-table td:first-child { width: 40px; text-align: right; }
      .hvut-ml-plc-left { width: 600px; height: 530px; margin-top: 105px; overflow: auto; line-height: 26px; }
      .hvut-ml-plc-left > div { display: flex; width: 572px; margin: 5px 0; padding: 5px 0; border: 1px solid; }
      .hvut-ml-plc-left > div:first-child { position: absolute; margin-top: -105px; outline: 1px solid; }
      .hvut-ml-plc-left > div > div { width: 240px; padding: 5px; border-left: 1px solid; }
      .hvut-ml-plc-left > div > div:first-child { width: 60px; border-left: 0; }
      .hvut-ml-plc-left input[type='number'] { width: 30px; text-align: right; }
      .hvut-ml-plc-del { width: 22px; margin: 0 10px 0 0 !important; }
      .hvut-ml-plc-btn { display: inline-block; width: 140px; text-align: center; }
      .hvut-ml-plc-btn > span { display: inline-block; width: 18px; line-height: 18px; border: 1px solid; margin: 0 1px; text-align: center; background-color: #fff; border-radius: 3px; cursor: default; }
      .hvut-ml-plc-btn > input { width: 25px; padding: 2px 0; border-width: 1px; border-radius: 0; }
      .hvut-ml-plc-btn > .hvut-ml-plc-up { background-color: #edb; }
      .hvut-ml-plc-crystal { display: inline-block; width: 95px; text-align: right; }
    `);

    _ml.materials = ['Low-Grade Cloth', 'Mid-Grade Cloth', 'High-Grade Cloth', 'Low-Grade Leather', 'Mid-Grade Leather', 'High-Grade Leather', 'Low-Grade Metals', 'Mid-Grade Metals', 'High-Grade Metals', 'Low-Grade Wood', 'Mid-Grade Wood', 'High-Grade Wood', 'Crystallized Phazon', 'Shade Fragment', 'Repurposed Actuator', 'Defense Matrix Modulator', 'Binding of Slaughter', 'Binding of Balance', 'Binding of Isaac', 'Binding of Destruction', 'Binding of Focus', 'Binding of Friendship', 'Binding of Protection', 'Binding of Warding', 'Binding of the Fleet', 'Binding of the Barrier', 'Binding of the Nimble', 'Binding of Negation', 'Binding of the Elementalist', 'Binding of the Heaven-sent', 'Binding of the Demon-fiend', 'Binding of the Curse-weaver', 'Binding of the Earth-walker', 'Binding of Surtr', 'Binding of Niflheim', 'Binding of Mjolnir', 'Binding of Freyr', 'Binding of Heimdall', 'Binding of Fenrir', 'Binding of Dampening', 'Binding of Stoneskin', 'Binding of Deflection', 'Binding of the Fire-eater', 'Binding of the Frost-born', 'Binding of the Thunder-child', 'Binding of the Wind-waker', 'Binding of the Thrice-blessed', 'Binding of the Spirit-ward', 'Binding of the Ox', 'Binding of the Raccoon', 'Binding of the Cheetah', 'Binding of the Turtle', 'Binding of the Fox', 'Binding of the Owl'];
    _ml.mobs = [];
    _ml.now = Date.now();
    _ml.log = $config.get('ml_log', [{ version: 1 }]);

    _ml.parse = function (mob, doc) {
      mob.pl = parseInt($qs('.msl > div:nth-child(3)', doc).textContent.slice(4));
      mob.hunger = parseInt($qs('.msl > div:nth-child(5) img', doc).style.width) * 200;
      mob.morale = parseInt($qs('.msl > div:nth-child(6) img', doc).style.width) * 200;
      mob.wins = parseInt($qs('#monsterstats_right > div:nth-child(2) > div:nth-child(2)', doc).textContent);
      mob.kills = parseInt($qs('#monsterstats_right > div:nth-child(3) > div:nth-child(2)', doc).textContent);
      mob.log.pl = mob.pl;
      mob.log.wins = mob.wins;
      mob.log.kills = mob.kills;
      mob.log.update = Date.now();

      const stats = $qsa('#monsterstats_top td:nth-child(2)', doc).map((td) => parseInt(td.textContent));
      const pa = stats.slice(0, 6);
      const er = stats.slice(6, 12);
      mob.pa.forEach((e, i) => {
        e.value = pa[i];
        mob.log.pa[i][0] = pa[i];
      });
      mob.er.forEach((e, i) => {
        e.value = er[i];
        mob.log.er[i][0] = er[i];
      });

      $qsa('#chaosupg td:nth-child(2)', doc).forEach((td, i) => {
        mob.ct[i].value = $qsa('.mcu2', td).length;
        mob.log.ct[i][0] = mob.ct[i].value;
        mob.ct[i].max = 20 - $qsa('.mcu0', td).length;
        mob.log.ct[i][2] = mob.ct[i].max;
      });

      $config.set('ml_log', _ml.log);
    };

    _ml.price2str = function (price) {
      let str;
      if (price > 1000000) {
        str = (Math.round(price / 10000) / 100) + 'm';
      } else if (price > 1000) {
        str = (Math.round(price / 10) / 100) + 'k';
      } else {
        str = Math.round(price) + '';
      }
      return str;
    };

    // Monster List
    _ml.main = {

      node: {},
      gains: {},

      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, index, key } = target.dataset;
        if (action === 'sort') {
          _ml.main.sort(key);
        } else if (action === 'morale') {
          e.stopPropagation();
          _ml.main.feed(index, 'drugs');
        } else if (action === 'hunger') {
          e.stopPropagation();
          _ml.main.feed(index, 'food');
        } else if (action === 'update') {
          e.stopPropagation();
          _ml.main.feed(index);
        }
      },
      mouseover: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, index } = target.dataset;
        if (action === 'log') {
          _ml.main.show_log(index);
        }
      },
      mouseout: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, index } = target.dataset;
        if (action === 'log') {
          _ml.main.hide_log(index);
        }
      },
      sort: function (key) {
        if (!['index', 'name', 'class', 'pl', 'wins', 'kills', 'gains', 'gifts', 'morale', 'hunger'].includes(key)) {
          return;
        }
        let order = ['pl', 'wins', 'kills', 'gains', 'gifts'].includes(key) ? -1 : 1;
        if (key === _ml.main.sort.key) {
          order = _ml.main.sort.order * -1;
        }
        if (_ml.main.sort.key) {
          _ml.main.node.sort[_ml.main.sort.key].classList.remove('hvut-ml-sort-current');
        }
        _ml.main.node.sort[key].classList.add('hvut-ml-sort-current');
        _ml.main.sort.key = key;
        _ml.main.sort.order = order;
        if (!_ml.main.sort.list) {
          const empty = $qsa('#slot_pane > div[onclick*="&create=new"]').map((div) => ({ node: { div }, index: parseInt(div.firstElementChild.textContent) }));
          _ml.main.sort.list = _ml.mobs.filter((mob) => mob).concat(empty);
        }
        _ml.main.sort.list.sort((a, b) => ((a[key] == b[key]) ? 0 : (a[key] == undefined) ? 1 : (b[key] == undefined) ? -1 : (a[key] > b[key] ? 1 : -1) * order));
        $id('slot_pane').prepend(..._ml.main.sort.list.map((mob) => mob.node.div));
      },
      feed: async function (index, food) {
        const mob = _ml.mobs[index];
        if (!mob.status) {
          return;
        }
        mob.status = 0;
        mob.node.wins.textContent = '...';
        const html = await $ajax.fetch(`?s=Bazaar&ss=ml&slot=${mob.index}`, food ? `food_action=${food}` : '');
        const doc = $doc(html);
        _ml.main.onsuccess(index, doc);
        //_ml.main.onerror(index);
      },
      feedall: function (stat, value, food) {
        _ml.mobs.forEach((mob) => { _ml.main.feed(mob.index, (!value || value >= mob[stat]) ? food : null); });
      },
      onsuccess: function (index, doc) {
        const mob = _ml.mobs[index];
        _ml.parse(mob, doc);
        mob.status = 1;
        mob.node.wins.dataset.update = new Date(mob.log.update).toLocaleDateString();
        mob.node.wins.classList.remove('hvut-ml-outdated');
        mob.node.wins.textContent = `${mob.wins} / ${mob.kills}`;
        mob.node.hunger.textContent = mob.hunger;
        mob.node.hungerbar.style.width = (mob.hunger / 200) + 'px';
        mob.node.morale.textContent = mob.morale;
        mob.node.moralebar.style.width = (mob.morale / 200) + 'px';
      },
      onerror: function (index) {
        const mob = _ml.mobs[index];
        mob.status = -1;
        mob.node.wins.classList.add('hvut-ml-outdated');
        mob.node.wins.textContent = 'failed';
      },
      edit_price: function () {
        _ml.main.make_summary();
        if (_ml.mobs[-1].node.log) {
          _ml.main.make_log(-1);
        }
        _ml.mobs.forEach((mob) => {
          if (mob.node.log) {
            _ml.main.make_log(mob.index);
          }
        });
      },
      toggle_summary: function () {
        _ml.main.node.summary?.classList.toggle('hvut-none');
      },
      make_summary: function () {
        const mobs = Object.values(_ml.main.gains);
        if (!mobs.length) {
          return;
        }
        const summary = {};
        const gains = mobs.flat();
        const prices = $price.get('Materials');
        let income = 0;
        gains.forEach((g) => {
          if (!summary[g]) {
            summary[g] = 0;
          }
          summary[g]++;
          income += (prices[g] || 0);
        });
        if (!_ml.main.node.summary) {
          _ml.main.node.summary = $element('ul', $id('monster_outer'), ['.hvut-ml-summary']);
        }
        _ml.main.node.summary.innerHTML = '';
        $element('li', _ml.main.node.summary, `${mobs.length} monster(s) brought you ${gains.length} gift(s), ${_ml.price2str(income)} credits`);
        _ml.materials.forEach((g) => {
          if (summary[g]) {
            $element('li', _ml.main.node.summary, `${summary[g]} x ${g}`);
          }
        });
      },
      toggle_log: function (index) {
        const mob = _ml.mobs[index];
        if (mob.node.log?.parentNode) {
          _ml.main.hide_log(index);
        } else {
          _ml.main.show_log(index);
        }
      },
      show_log: function (index) {
        const mob = _ml.mobs[index];
        if (!mob.node.log) {
          _ml.main.make_log(index);
        }
        $id('monster_outer').appendChild(mob.node.log);
      },
      hide_log: function (index) {
        const mob = _ml.mobs[index];
        mob.node.log?.remove();
      },
      make_log: function (index) {
        const mob = _ml.mobs[index];
        if (!mob.node.log) {
          mob.node.log = $element('ul', null, ['.hvut-ml-log']);
        }
        mob.node.log.innerHTML = '';
        const date = mob.log.date;
        const days = (_ml.now - date) / (1000 * 60 * 60 * 24);
        const prices = $price.get('Materials');
        let count = 0;
        let income = 0;
        _ml.materials.forEach((mat, i) => {
          const li = $element('li', mob.node.log, mob.log.gifts[i] + ' x ' + mat);
          if (i === 12 || i === 16 || i === 22 || i === 28 || i === 33 || i === 39 || i === 42 || i === 48) {
            li.classList.add('hvut-ml-margin');
          }
          if (i === 27) {
            li.classList.add('hvut-ml-break');
          }
          count += mob.log.gifts[i];
          income += mob.log.gifts[i] * (prices[mat] || 0);
        });

        mob.node.log.prepend(
          $element('li', null, `For ${Math.round(days * 10) / 10} days / Since ${(new Date(date)).toLocaleString()}`),
          $element('li', null, `- Total: ${count} gifts, ${_ml.price2str(income)} credits`),
          $element('li', null, `- Daily: ${Math.round(count / days * 10) / 10} gifts, ${_ml.price2str(income / days)} credits`)
        );
      },
      reset_log: function () {
        if (confirm('The Monster Lab log in this browser will be deleted.\nAre you sure?')) {
          $config.del('ml_log');
          location.href = location.href;
        }
      },
    };

    // Initializing List
    if ($id('messagebox_outer')) {
      let monster;
      let gift;
      get_message(null, true).forEach((msg) => {
        if (!msg) {
          return;
        } else if (/^(.+) brought you (?:a gift|some gifts)!$/.test(msg)) {
          monster = RegExp.$1.toLowerCase();
          _ml.main.gains[monster] = [];
        } else if (/^Received (?:a|some) (.+)$/.test(msg)) {
          gift = RegExp.$1;
          _ml.main.gains[monster].push(gift);
        } else {
          popup(msg);
        }
      });
      if ($config.settings.monsterLabCloseDefaultPopup) {
        $id('messagebox_outer').classList.add('hvut-none');
      }
    }

    _ml.mobs[-1] = { log: { date: _ml.now, gifts: (new Array(54)).fill(0) }, node: {} };

    $qsa('#slot_pane > div').forEach((div, i) => {
      const index = i + 1;
      if (div.getAttribute('onclick').includes('&create=new')) {
        _ml.log[index] = null;
        return;
      }

      let log = _ml.log[index];
      if (!log) {
        log = { date: _ml.now, update: 0, pl: null, wins: 0, kills: 0, pa: [], er: [], ct: [], gifts: [] };
        _ml.log[index] = log;
        for (let i = 0; i < 6; i++) {
          log.pa[i] = [0, 0];
          log.er[i] = [0, 0];
        }
        for (let i = 0; i < 12; i++) {
          log.ct[i] = [0, 0, 0];
        }
        for (let i = 0; i < 54; i++) {
          log.gifts[i] = 0;
        }
      }
      if (_ml.mobs[-1].log.date > log.date) {
        _ml.mobs[-1].log.date = log.date;
      }

      const mob = { index, log, status: -1, pa: [], er: [], ct: [], node: { div: div } };
      _ml.mobs[mob.index] = mob;

      mob.name = div.children[1].textContent;
      mob.class = div.children[3].textContent;
      mob.pl = parseInt(div.children[2].textContent.slice(4));
      div.children[2].textContent = mob.pl;
      if (mob.pl !== mob.log.pl) {
        mob.update_needed = true;
      }
      mob.wins = mob.log.wins;
      mob.kills = mob.log.kills;
      for (let i = 0; i < 6; i++) {
        mob.pa[i] = { value: log.pa[i][0], to: 0 };
        mob.er[i] = { value: log.er[i][0], to: 0 };
      }
      for (let i = 0; i < 12; i++) {
        mob.ct[i] = { value: log.ct[i][0], to: 0, max: log.ct[i][2] };
      }

      const hungerdiv = div.children[4];
      const moralediv = div.children[5];
      hungerdiv.dataset.action = 'hunger';
      hungerdiv.dataset.index = index;
      moralediv.dataset.action = 'morale';
      moralediv.dataset.index = index;

      mob.node.hungerbar = hungerdiv.firstElementChild.firstElementChild;
      mob.node.moralebar = moralediv.firstElementChild.firstElementChild;
      mob.hunger = parseInt(mob.node.hungerbar.style.width) * 200;
      mob.morale = parseInt(mob.node.moralebar.style.width) * 200;
      mob.node.hunger = $element('div', hungerdiv.firstElementChild, [mob.hunger, '.hvut-ml-feed']);
      mob.node.morale = $element('div', moralediv.firstElementChild, [mob.morale, '.hvut-ml-feed']);
      mob.node.wins = $element('div', div, ['.hvut-ml-wins', { dataset: { action: 'update', index } }]);
      mob.node.gains = $element('div', div, ['.hvut-ml-gains']);
      mob.node.gifts = $element('div', div, { dataset: { action: 'log', index } });

      if (mob.log.update) {
        mob.node.wins.textContent = `${mob.wins} / ${mob.kills}`;
        mob.node.wins.dataset.update = new Date(mob.log.update).toLocaleDateString();
        if (mob.log.update < Date.now() - 7 * 24 * 60 * 60 * 1000) {
          mob.node.wins.classList.add('hvut-ml-outdated');
        }
      } else {
        mob.node.wins.textContent = '-';
      }

      const gains = _ml.main.gains[mob.name.toLowerCase()];
      if (gains) {
        mob.gains = gains.length;
        div.classList.add('hvut-ml-new');
        $element('span', mob.node.gains, gains.length);
        const ul = $element('ul', mob.node.gains);
        gains.forEach((g) => {
          $element('li', ul, g);
          mob.log.gifts[_ml.materials.indexOf(g)]++;
        });
      }

      for (let i = 0; i < 54; i++) {
        _ml.mobs[-1].log.gifts[i] += mob.log.gifts[i];
      }
      mob.gifts = mob.log.gifts.reduce((s, e) => (s + e), 0);
      mob.node.gifts.textContent = mob.gifts;
    });

    $config.set('ml_log', _ml.log);

    $id('monster_list').addEventListener('click', _ml.main.click, true);
    $id('monster_list').addEventListener('mouseover', _ml.main.mouseover);
    $id('monster_list').addEventListener('mouseout', _ml.main.mouseout);

    const sort_div = $element('div', [$id('slot_pane'), 'beforebegin'], ['.hvut-ml-sort hvut-cphu-sub']);
    _ml.main.node.sort = {
      index: $element('span', sort_div, [{ textContent: '#' }, '!width: 30px;', { dataset: { action: 'sort', key: 'index' } }]),
      name: $element('span', sort_div, ['Name', '!width: 210px;', { dataset: { action: 'sort', key: 'name' } }]),
      class: $element('span', sort_div, ['Class', '!width: 70px;', { dataset: { action: 'sort', key: 'class' } }]),
      pl: $element('span', sort_div, ['PL', '!width: 40px;', { dataset: { action: 'sort', key: 'pl' } }]),
      wins: $element('span', sort_div, ['Wins', '!width: 40px;', { dataset: { action: 'sort', key: 'wins' } }]),
      kills: $element('span', sort_div, ['Kills', '!width: 40px;', { dataset: { action: 'sort', key: 'kills' } }]),
      gains: $element('span', sort_div, ['+', '!width: 25px;', { dataset: { action: 'sort', key: 'gains' } }]),
      gifts: $element('span', sort_div, ['Gifts', '!width: 50px;', { dataset: { action: 'sort', key: 'gifts' } }]),
      morale: $element('span', sort_div, ['Morale', '!width: 200px;', { dataset: { action: 'sort', key: 'morale' } }]),
      hunger: $element('span', sort_div, ['Hunger', '!width: 200px;', { dataset: { action: 'sort', key: 'hunger' } }]),
    };

    if ($config.settings.monsterLabDefaultSort === 'index') {
      _ml.main.sort.key = 'index';
      _ml.main.sort.order = 1;
      _ml.main.node.sort.index.classList.add('hvut-ml-sort-current');
    } else {
      _ml.main.sort($config.settings.monsterLabDefaultSort);
    }

    const side_div = $element('div', $id('monster_outer'), ['.hvut-side hvut-ml-side']);
    $input(['button', '礼物统计'], side_div, null, () => { _ml.main.toggle_summary(); });
    $input(['button', '怪物日志'], side_div, null, () => { _ml.main.toggle_log(-1); });
    $input(['button', '重置日志'], side_div, null, () => { _ml.main.reset_log(); });
    $input(['button', '材料价格'], side_div, { className: 'hvut-side-margin' }, () => { $price.edit('Materials', 'ma', _ml.main.edit_price); });
    $input(['button', '更新战绩'], side_div, null, () => { _ml.main.feedall(); });
    $input(['button', '批量升级'], side_div, { id: 'hvut-ml-up-button' }, () => { _ml.upgrade.toggle(); });
    $input(['button', '战力模拟'], side_div, null, () => { _ml.plc.toggle(); });

    _ml.main.make_summary();

    // Monster Upgrader
    _ml.upgrade = {

      pa: [
        { query: 'pa_str', text: 'STR', crystal: 'Crystal of Vigor' },
        { query: 'pa_dex', text: 'DEX', crystal: 'Crystal of Finesse' },
        { query: 'pa_agi', text: 'AGI', crystal: 'Crystal of Swiftness' },
        { query: 'pa_end', text: 'END', crystal: 'Crystal of Fortitude' },
        { query: 'pa_int', text: 'INT', crystal: 'Crystal of Cunning' },
        { query: 'pa_wis', text: 'WIS', crystal: 'Crystal of Knowledge' },
      ],
      er: [
        { query: 'er_fire', text: 'FIRE', crystal: 'Crystal of Flames' },
        { query: 'er_cold', text: 'COLD', crystal: 'Crystal of Frost' },
        { query: 'er_elec', text: 'ELEC', crystal: 'Crystal of Lightning' },
        { query: 'er_wind', text: 'WIND', crystal: 'Crystal of Tempest' },
        { query: 'er_holy', text: 'HOLY', crystal: 'Crystal of Devotion' },
        { query: 'er_dark', text: 'DARK', crystal: 'Crystal of Corruption' },
      ],
      ct: [
        { query: 'affect', text: 'Scavenging', desc: 'Increases the gift factor by 2.5%' },
        { query: 'health', text: 'Fortitude', desc: 'Increases monster health by 5%' },
        { query: 'damage', text: 'Brutality', desc: 'Increases monster damage by 2.5%' },
        { query: 'accur', text: 'Accuracy', desc: 'Increases monster accuracy by 5%' },
        { query: 'cevbl', text: 'Precision', desc: 'Decreases effective target evade/block by 1%' },
        { query: 'cpare', text: 'Overpower', desc: 'Decreases effective target parry/resist by 1%' },
        { query: 'parry', text: 'Interception', desc: 'Increases monster parry by 0.5%' },
        { query: 'resist', text: 'Dissipation', desc: 'Increases monster resist by 0.5%' },
        { query: 'evade', text: 'Evasion', desc: 'Increases monster evade by 0.5%' },
        { query: 'phymit', text: 'Defense', desc: 'Increases monster physical mitigation by 1%' },
        { query: 'magmit', text: 'Warding', desc: 'Increases monster magical mitigation by 1%' },
        { query: 'atkspd', text: 'Swiftness', desc: 'Increases monster attack speed by 2.5%' },
      ],

      pa_pl: [0],
      er_pl: [0],
      pa_crystal: [0],
      er_crystal: [0],
      pa_morale: [0],
      er_morale: [0],

      node: {
        button: $id('hvut-ml-up-button'),
      },

      mousedown: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, index, type, item, key } = target.dataset;
        if (action === 'sort') {
          _ml.upgrade.sort(key);
        } else if (action === 'reset') {
          _ml.upgrade.reset(index);
        } else if (action === 'upgrade') {
          const inc = (e.button === 0) ? 1 : (e.button === 2) ? -1 : 0;
          _ml.upgrade.exec(index, type, item, inc);
        }
      },
      contextmenu: function (e) {
        e.preventDefault();
      },

      init: async function () {
        if (_ml.upgrade.inited) {
          return;
        }
        _ml.upgrade.inited = true;

        _ml.upgrade.node.button.disabled = true;
        await $item.once();
        _ml.upgrade.pa.forEach((e) => {
          e.stock = $item.count(e.crystal);
        });
        _ml.upgrade.er.forEach((e) => {
          e.stock = $item.count(e.crystal);
        });
        _ml.upgrade.ct.stock = $item.count('Chaos Token');
        _ml.upgrade.node.button.disabled = false;
        await _ml.upgrade.update();

        _ml.upgrade.node.div = $element('div', $id('mainpane'), ['.hvut-ml-up']);
        const list = $element('div', _ml.upgrade.node.div, ['.hvut-ml-up-list'], { mousedown: (e) => { _ml.upgrade.mousedown(e); }, contextmenu: (e) => { _ml.upgrade.contextmenu(e); } });
        const bottom = $element('div', _ml.upgrade.node.div, ['.hvut-ml-up-bottom']);

        _ml.upgrade.sort.key = 'index';
        _ml.upgrade.sort.order = 1;

        _ml.upgrade.node.table = $element('table', list, ['.hvut-ml-up-table']);
        const thead = $element('tr', _ml.upgrade.node.table);
        $element('td', thead, { textContent: '#', dataset: { action: 'sort', key: 'index' } });
        $element('td', thead, ['name', { dataset: { action: 'sort', key: 'name' } }]);
        $element('td', thead, ['class', { dataset: { action: 'sort', key: 'class' } }]);
        $element('td', thead, ['pl', { dataset: { action: 'sort', key: 'pl' } }]);
        $element('td', thead, ['morale', { dataset: { action: 'sort', key: 'morale' } }]);
        $element('td', thead, ['*', { dataset: { action: 'reset', index: 'all', desc: 'Reset' } }]);

        $element('td', thead, ['+', { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: 'all', desc: 'Increase / Decrease Primary Attributes' } }]);
        $element('td', thead, ['=', { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: 'equal', desc: 'Equalize Primary Attributes' } }]);
        _ml.upgrade.pa.forEach((pa, i) => { $element('td', thead, [pa.text.toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: i, desc: pa.crystal } }]); });

        $element('td', thead, ['+', { dataset: { action: 'upgrade', index: 'all', type: 'er', item: 'all', desc: 'Increase / Decrease Elemental Mitigations' } }]);
        $element('td', thead, ['=', { dataset: { action: 'upgrade', index: 'all', type: 'er', item: 'equal', desc: 'Equalize Elemental Mitigations' } }]);
        _ml.upgrade.er.forEach((er, i) => { $element('td', thead, [er.text.toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'er', item: i, desc: er.crystal } }]); });

        $element('td', thead, ['+', { dataset: { action: 'upgrade', index: 'all', type: 'ct', item: 'all', desc: 'Increase / Decrease Token Stats' } }]);
        _ml.upgrade.ct.forEach((ct, i) => { $element('td', thead, [ct.text.slice(0, 3).toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'ct', item: i, desc: `${ct.text} : ${ct.desc}` } }]); });

        const pa_ul = $element('ul', bottom, ['.hvut-ml-up-crystal']);
        _ml.upgrade.pa.forEach((e) => {
          e.li = $element('li', pa_ul);
        });
        const er_ul = $element('ul', bottom, ['.hvut-ml-up-crystal']);
        _ml.upgrade.er.forEach((e) => {
          e.li = $element('li', er_ul);
        });
        _ml.upgrade.ct.ul = $element('ul', bottom, ['.hvut-ml-up-token']);

        const buttons = $element('div', bottom, ['.hvut-ml-up-buttons']);
        $input(['button', '保存'], buttons, null, () => { _ml.upgrade.save(); });
        $input(['button', '还原'], buttons, null, () => { _ml.upgrade.load(); });
        _ml.upgrade.node.update = $input(['button', '更新'], buttons, null, () => { _ml.upgrade.force_update(); });
        _ml.upgrade.node.run = $input(['button', 'Run'], buttons, null, () => { _ml.upgrade.run(); });
        $input(['button', '关闭'], buttons, null, () => { _ml.upgrade.toggle(); });

        for (let i = 0; i < 25; i++) {
          _ml.upgrade.pa_pl[i + 1] = _ml.upgrade.pa_pl[i] + (3 + i * 0.5);
          _ml.upgrade.pa_crystal[i + 1] = _ml.upgrade.pa_crystal[i] + Math.round(50 * Math.pow(1.555079154, i));
          _ml.upgrade.pa_morale[i + 1] = _ml.upgrade.pa_morale[i] + (3 + Math.ceil(i * 0.5)) * 1000;
        }
        for (let i = 0; i < 50; i++) {
          _ml.upgrade.er_pl[i + 1] = _ml.upgrade.er_pl[i] + Math.floor(1 + i * 0.1);
          _ml.upgrade.er_crystal[i + 1] = _ml.upgrade.er_crystal[i] + Math.round(10 * Math.pow(1.26485522, i));
          _ml.upgrade.er_morale[i + 1] = _ml.upgrade.er_morale[i] + (1 + Math.floor(i * 0.1)) * 2000;
        }
        _ml.upgrade.pa.forEach((e) => {
          e.used = 0;
          e.require = 0;
        });
        _ml.upgrade.er.forEach((e) => {
          e.used = 0;
          e.require = 0;
        });

        let ct_slot = $qsa('#slot_pane > div.msl').length;
        const ct_next = parseInt(/Cost: (\d+) Chaos Token/.exec($id('monster_actions').textContent)[1]);
        if (ct_next === Math.ceil(1 + Math.pow(ct_slot, 1.2))) {
        } else if (ct_next === Math.ceil(1 + Math.pow(ct_slot / 2, 1.2))) {
          ct_slot = ct_slot / 2;
        } else {
          ct_slot = 0;
        }
        _ml.upgrade.ct.unlock = 0;
        for (let i = 0; i < ct_slot; i++) {
          _ml.upgrade.ct.unlock += Math.ceil(1 + Math.pow(i, 1.2));
        }
        _ml.upgrade.ct.used = 0;
        _ml.upgrade.ct.require = 0;

        // create mob list table here
        _ml.mobs.forEach((mob) => {
          mob.node.tr = $element('tr', _ml.upgrade.node.table);
          const tr = mob.node.tr;

          $element('td', tr, mob.index);
          $element('td', tr, mob.name);
          $element('td', tr, mob.class);
          mob.node.pl = $element('td', tr, mob.pl);
          mob.node.morale = $element('td', tr, mob.morale / 100);
          $element('td', tr, ['*', { dataset: { action: 'reset', index: mob.index } }]);

          $element('td', tr, ['+', { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: 'all' } }]);
          $element('td', tr, ['=', { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: 'equal' } }]);
          mob.pa.forEach((e, i) => {
            e.node = $element('td', tr, [e.value, { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: i } }]);
            e.to = e.value;
            e.used = _ml.upgrade.pa_crystal[e.value];
            _ml.upgrade.pa[i].used += e.used;
            e.require = 0;
          });

          $element('td', tr, ['+', { dataset: { action: 'upgrade', index: mob.index, type: 'er', item: 'all' } }]);
          $element('td', tr, ['=', { dataset: { action: 'upgrade', index: mob.index, type: 'er', item: 'equal' } }]);
          mob.er.forEach((e, i) => {
            e.node = $element('td', tr, [e.value, { dataset: { action: 'upgrade', index: mob.index, type: 'er', item: i } }]);
            e.to = e.value;
            e.used = _ml.upgrade.er_crystal[e.value];
            _ml.upgrade.er[i].used += e.used;
            e.require = 0;
          });

          mob.ct.used = 0;
          mob.ct.require = 0;
          $element('td', tr, ['+', { dataset: { action: 'upgrade', index: mob.index, type: 'ct', item: 'all' } }]);
          mob.ct.forEach((e, i) => {
            e.node = $element('td', tr, [e.value, { dataset: { action: 'upgrade', index: mob.index, type: 'ct', item: i } }]);
            e.to = e.value;
            mob.ct.used += (1 + e.value) * e.value / 2;
          });
          _ml.upgrade.ct.used += mob.ct.used;
        });

        _ml.upgrade.sum();
        _ml.upgrade.load();
      },

      update: async function () {
        const mobs = _ml.mobs.filter((mob) => mob.update_needed);
        const total = mobs.length;
        if (!total) {
          return;
        }

        _ml.upgrade.node.button.disabled = true;
        _ml.upgrade.node.button.value = 'Updating... ...';
        if (_ml.upgrade.node.run) {
          _ml.upgrade.node.run.disabled = true;
          _ml.upgrade.node.run.value = 'Updating...';
        }

        async function update(mob) {
          const html = await $ajax.fetch(`?s=Bazaar&ss=ml&slot=${mob.index}`);
          const doc = $doc(html);
          done++;
          mob.update_needed = false;
          _ml.parse(mob, doc);
          _ml.upgrade.node.button.value = `Updating... (${done}/${total})`;
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.value = `${done}/${total}`;
          }
        }

        let done = 0;
        const requests = mobs.map((mob) => update(mob));
        await Promise.all(requests);

        $config.set('ml_log', _ml.log);
        _ml.upgrade.node.button.disabled = false;
        _ml.upgrade.node.button.value = 'Monster Upgrader';
        if (_ml.upgrade.node.run) {
          _ml.upgrade.node.run.value = 'Completed';
        }
      },

      force_update: function () {
        _ml.mobs.forEach((mob) => {
          mob.log.pl = -1;
        });
        $config.set('ml_log', _ml.log);
        location.href = location.href;
      },

      sort: function (key) {
        if (!['index', 'name', 'class', 'pl', 'wins', 'kills', 'gains', 'gifts', 'morale', 'hunger'].includes(key)) {
          return;
        }
        let order = ['wins', 'kills', 'gains', 'gifts'].includes(key) ? -1 : 1;
        if (key === _ml.upgrade.sort.key) {
          order = _ml.upgrade.sort.order * -1;
        }
        _ml.upgrade.sort.key = key;
        _ml.upgrade.sort.order = order;

        if (!_ml.upgrade.sort.list) {
          _ml.upgrade.sort.list = _ml.mobs.filter((mob) => mob);
        }
        _ml.upgrade.sort.list.sort((a, b) => ((a[key] == b[key]) ? 0 : (a[key] == undefined) ? 1 : (b[key] == undefined) ? -1 : (a[key] > b[key] ? 1 : -1) * order));
        _ml.upgrade.node.table.append(..._ml.upgrade.sort.list.map((mob) => mob.node.tr));
      },

      exec: function (index, type, item, inc) {
        let mobs;
        if (index === 'all') {
          mobs = _ml.mobs;
        } else {
          mobs = [_ml.mobs[index]];
        }
        mobs.forEach((mob) => {
          let items;
          if (item === 'equal') {
            const max = Math.max(...mob[type].map((e) => e.to));
            mob[type].forEach((e) => { e.to = max; });
            items = mob[type];
            inc = 0;
          } else if (item === 'all') {
            items = mob[type];
          } else {
            items = [mob[type][item]];
          }
          items.forEach((e) => {
            const value = e.value;
            let to = e.to + inc;
            const max = (type === 'pa') ? 25 : (type === 'er') ? 50 : (type === 'ct') ? e.max : 0;
            if (to < value) {
              to = value;
            } else if (to > max) {
              to = max;
            }
            e.to = to;
            e.node.textContent = to;
            if (to > value) {
              e.node.classList.add('hvut-ml-up-change');
            } else {
              e.node.classList.remove('hvut-ml-up-change');
            }
          });
          _ml.upgrade.calc(mob);

          mob.node.pl.textContent = mob.pl_to;
          if (mob.pl === mob.pl_to) {
            mob.node.pl.classList.remove('hvut-ml-up-change');
          } else {
            mob.node.pl.classList.add('hvut-ml-up-change');
          }
          mob.node.morale.textContent = mob.morale_to / 100;
          if (mob.morale === mob.morale_to) {
            mob.node.morale.classList.remove('hvut-ml-up-change');
          } else {
            mob.node.morale.classList.add('hvut-ml-up-change');
          }
        });

        _ml.upgrade.sum(true);
      },

      reset: function (index) {
        let mobs;
        if (index === 'all') {
          mobs = _ml.mobs;
        } else {
          mobs = [_ml.mobs[index]];
        }
        mobs.forEach((mob) => {
          mob.pa.forEach((e) => {
            e.to = e.value;
          });
          mob.er.forEach((e) => {
            e.to = e.value;
          });
          mob.ct.forEach((e) => {
            e.to = e.value;
          });
          _ml.upgrade.exec(mob.index, 'pa', 'all', 0);
          _ml.upgrade.exec(mob.index, 'er', 'all', 0);
          _ml.upgrade.exec(mob.index, 'ct', 'all', 0);
          //_ml.upgrade.calc(mob);
        });
        //_ml.upgrade.sum(true);
      },

      calc: function (mob) {
        mob.pa.forEach((e) => {
          e.require = _ml.upgrade.pa_crystal[e.to] - _ml.upgrade.pa_crystal[e.value];
        });
        mob.er.forEach((e) => {
          e.require = _ml.upgrade.er_crystal[e.to] - _ml.upgrade.er_crystal[e.value];
        });

        mob.ct.require = mob.ct.reduce((s, e) => (s + (e.value + 1 + e.to) * (e.to - e.value) / 2), 0);
        mob.pl_to = Math.round(
          mob.pa.reduce((s, e) => (s + _ml.upgrade.pa_pl[e.to]), 0)
          + mob.er.reduce((s, e) => (s + _ml.upgrade.er_pl[e.to]), 0)
        );
        mob.morale_to = Math.min(
          24000,
          mob.morale
          + mob.pa.reduce((s, e) => (s + (_ml.upgrade.pa_morale[e.to] - _ml.upgrade.pa_morale[e.value])), 0)
          + mob.er.reduce((s, e) => (s + (_ml.upgrade.er_morale[e.to] - _ml.upgrade.er_morale[e.value])), 0)
        );
      },

      sum: function (calc) {
        if (calc) {
          _ml.upgrade.pa.forEach((e) => {
            e.require = 0;
          });
          _ml.upgrade.er.forEach((e) => {
            e.require = 0;
          });
          _ml.upgrade.ct.require = 0;

          _ml.mobs.forEach((mob) => {
            mob.pa.forEach((e, i) => {
              _ml.upgrade.pa[i].require += e.require;
            });
            mob.er.forEach((e, i) => {
              _ml.upgrade.er[i].require += e.require;
            });
            _ml.upgrade.ct.require += mob.ct.require;
          });
        }

        _ml.upgrade.pa.forEach((e) => {
          e.li.innerHTML = `
            <span>${e.crystal.slice(11)}</span>
            <span>${e.used.toLocaleString()}</span>
            <span>+${e.require.toLocaleString()}</span>
            <span>(${e.stock.toLocaleString()})</span>`;

          if (e.require > e.stock) {
            e.li.classList.add('hvut-ml-up-nostock');
          } else {
            e.li.classList.remove('hvut-ml-up-nostock');
          }
        });

        _ml.upgrade.er.forEach((e) => {
          e.li.innerHTML = `
            <span>${e.crystal.slice(11)}</span>
            <span>${e.used.toLocaleString()}</span>
            <span>+${e.require.toLocaleString()}</span>
            <span>(${e.stock.toLocaleString()})</span>`;

          if (e.require > e.stock) {
            e.li.classList.add('hvut-ml-up-nostock');
          } else {
            e.li.classList.remove('hvut-ml-up-nostock');
          }
        });

        _ml.upgrade.ct.ul.innerHTML = `
          <li><span>Chaos Tokens</span></li>
          <li><span>(Unlock slots)</span><span>${_ml.upgrade.ct.unlock.toLocaleString()}</span></li>
          <li><span>(Upgrade monsters)</span><span>${_ml.upgrade.ct.used.toLocaleString()}</span></li>
          <li><span>Total Usage</span><span>${(_ml.upgrade.ct.unlock + _ml.upgrade.ct.used).toLocaleString()}</span></li>
          <li><span>Requires</span><span>${_ml.upgrade.ct.require.toLocaleString()}</span></li>
          <li><span>Stock</span><span>${_ml.upgrade.ct.stock.toLocaleString()}</span></li>`;

        if (_ml.upgrade.ct.require > _ml.upgrade.ct.stock) {
          _ml.upgrade.ct.ul.lastElementChild.classList.add('hvut-ml-up-nostock');
        }
        _ml.upgrade.stock = !$qs('.hvut-ml-up-nostock');
        _ml.upgrade.node.run.disabled = !_ml.upgrade.stock;
      },

      run: async function () {
        if (!_ml.upgrade.stock) {
          alert('Not enough Crystals or Chaos Tokens');
          return;
        }
        if (!confirm('您确定要升级所选的怪物吗?')) {
          return;
        }

        const urls = [];
        _ml.mobs.forEach((mob) => {
          let update_needed = false;
          mob.pa.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`, `crystal_upgrade=${_ml.upgrade.pa[i].query}&crystal_count=10`]);
              count -= 10;
            }
            urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`, `crystal_upgrade=${_ml.upgrade.pa[i].query}&crystal_count=${count}`]);
          });
          mob.er.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`, `crystal_upgrade=${_ml.upgrade.er[i].query}&crystal_count=10`]);
              count -= 10;
            }
            urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`, `crystal_upgrade=${_ml.upgrade.er[i].query}&crystal_count=${count}`]);
          });
          mob.ct.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`, `chaos_upgrade=${_ml.upgrade.ct[i].query}&chaos_count=10`]);
              count -= 10;
            }
            urls.push([`?s=Bazaar&ss=ml&slot=${mob.index}`, `chaos_upgrade=${_ml.upgrade.ct[i].query}&chaos_count=${count}`]);
          });
          if (update_needed) {
            mob.update_needed = true;
            mob.log.pl = -1;
          }
        });

        const total = urls.length;
        if (total === 0) {
          return;
        }
        $config.set('ml_log', _ml.log);
        _ml.upgrade.node.run.disabled = true;
        _ml.upgrade.node.update.disabled = true;

        async function upgrade(url, post) {
          await $ajax.fetch(url, post);
          done++;
          _ml.upgrade.node.run.value = `${done}/${total}`;
        }

        let done = 0;
        const requests = urls.map(([url, post]) => upgrade(url, post));
        await Promise.all(requests);
        _ml.upgrade.update();
      },

      save: function () {
        _ml.mobs.forEach((mob) => {
          mob.log.pa.forEach((e, i) => {
            e[1] = mob.pa[i].to;
          });
          mob.log.er.forEach((e, i) => {
            e[1] = mob.er[i].to;
          });
          mob.log.ct.forEach((e, i) => {
            e[1] = mob.ct[i].to;
          });
        });

        $config.set('ml_log', _ml.log);
      },
      load: function () {
        _ml.mobs.forEach((mob) => {
          mob.pa.forEach((e, j) => {
            e.to = mob.log.pa[j][1] || e.value;
          });
          mob.er.forEach((e, j) => {
            e.to = mob.log.er[j][1] || e.value;
          });
          mob.ct.forEach((e, j) => {
            e.to = mob.log.ct[j][1] || e.value;
          });
        });

        _ml.upgrade.exec('all', 'pa', 'all', 0);
        _ml.upgrade.exec('all', 'er', 'all', 0);
        _ml.upgrade.exec('all', 'ct', 'all', 0);
      },
      toggle: function () {
        $id('messagebox_outer')?.remove();
        _ml.upgrade.node.div?.classList.toggle('hvut-none');
        _ml.upgrade.init();
      },

    };

    // PL-Crystal Calculator
    _ml.plc = {

      preset: {
        '250': { count: 1, pa_lv: 5, pa_up: 4, er_lv: 14, er_up: 0 },
        '500': { count: 1, pa_lv: 9, pa_up: 3, er_lv: 21, er_up: 4 },
        '750': { count: 1, pa_lv: 12, pa_up: 3, er_lv: 27, er_up: 1 },
        '1000': { count: 1, pa_lv: 15, pa_up: 1, er_lv: 32, er_up: 0 },
        '1250': { count: 1, pa_lv: 17, pa_up: 2, er_lv: 36, er_up: 3 },
        '1500': { count: 1, pa_lv: 19, pa_up: 3, er_lv: 40, er_up: 2 },
        '1750': { count: 1, pa_lv: 21, pa_up: 2, er_lv: 43, er_up: 5 },
        '2250': { count: 1, pa_lv: 25, pa_up: 0, er_lv: 50, er_up: 0 },
      },
      data: {
        pa_crystal: [0],
        pa_pl: [0],
        er_crystal: [0],
        er_pl: [0],
      },
      list: [],
      node: {},

      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, index, type, value } = target.dataset;
        if (action === 'add') {
          _ml.plc.add(_ml.plc.preset[value]);
        } else if (action === 'remove') {
          _ml.plc.remove(index);
        } else if (action === 'change') {
          _ml.plc.change(index, type, value);
        }
      },
      input: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, index, type } = target.dataset;
        if (action === 'change') {
          _ml.plc.change(index, type);
        }
      },
      init: function () {
        if (_ml.plc.inited) {
          return;
        }
        _ml.plc.inited = true;

        const data = _ml.plc.data;
        for (let i = 0; i < 26; i++) {
          data.pa_pl[i + 1] = data.pa_pl[i] + (3 + i * 0.5);
          data.pa_crystal[i + 1] = data.pa_crystal[i] + Math.round(50 * Math.pow(1.555079154, i));
        }
        for (let i = 0; i < 51; i++) {
          data.er_pl[i + 1] = data.er_pl[i] + Math.floor(1 + i * 0.1);
          data.er_crystal[i + 1] = data.er_crystal[i] + Math.round(10 * Math.pow(1.26485522, i));
        }

        const node = _ml.plc.node;
        node.div = $element('div', $id('mainpane'), ['.hvut-ml-plc'], (e) => { _ml.plc.click(e); });
        node.left = $element('div', node.div, ['.hvut-ml-plc-left'], { input: (e) => { _ml.plc.input(e); } });

        const total = $element('div', node.left);
        $element('div', total).append(
          $element('span', null, 'Monsters'), $element('br'), $element('br'),
          node.count = $input('number', null, { min: 0, max: 200, readOnly: true })
        );
        $element('div', total).append(
          $element('span', null, 'Primary Attributes'), $element('br'),
          $element('span', null, ['Crystal', '.hvut-ml-plc-btn']),
          node.pa_total = $element('span', null, ['.hvut-ml-plc-crystal']), $element('br'),
          $element('span', null, ['Difference', '.hvut-ml-plc-btn']),
          node.pa_total_diff = $element('span', null, ['.hvut-ml-plc-crystal'])
        );
        $element('div', total).append(
          $element('span', null, 'Elemental Mitigations'), $element('br'),
          $element('span', null, ['Crystal', '.hvut-ml-plc-btn']),
          node.er_total = $element('span', null, ['.hvut-ml-plc-crystal']), $element('br'),
          $element('span', null, ['Difference', '.hvut-ml-plc-btn']),
          node.er_total_diff = $element('span', null, ['.hvut-ml-plc-crystal'])
        );

        node.right = $element('div', node.div, ['.hvut-ml-plc-right']);

        const buttons = $element('div', node.right, ['.hvut-ml-plc-buttons']);
        $input(['button', '保存'], buttons, null, () => { _ml.plc.save(); });
        $input(['button', '还原'], buttons, null, () => { _ml.plc.load(); });
        $input(['button', '关闭'], buttons, null, () => { _ml.plc.toggle(); });
        $input(['button', '制造怪物'], buttons, { dataset: { action: 'add' } });
        Object.keys(_ml.plc.preset).forEach((pl) => { $input(['button', pl], buttons, { dataset: { action: 'add', value: pl } }); });

        $element('table', node.right, ['.hvut-ml-plc-table',
          `/<tbody>
          <tr><td>Power<br> Level</td><td>Effects</td></tr>
          <tr><td>25</td><td>Unlocks naming and becomes active in battles once named</td></tr>
          <tr><td>200</td><td>Unlocks second Skill Attack</td></tr>
          <tr><td>250</td><td>Can no longer be deleted<br>Morale drain reduced by 2x</td></tr>
          <tr><td>251</td><td>Requires Monster Edibles instead of Monster Chow as Food</td></tr>
          <tr><td>400</td><td>Unlocks Spirit Attack</td></tr>
          <tr><td>499</td><td>Gifts may now include High-Grade materials</td></tr>
          <tr><td>750</td><td>Morale drain reduced by 3x<br>Low-Grade materials can no longer be gifts</td></tr>
          <tr><td>751</td><td>Requires Monster Cuisine instead of Monster Edibles as Food</td></tr>
          <tr><td>1000</td><td>Will never be deactivated</td></tr>
          <tr><td>1005</td><td>All Chaos Upgrades are available</td></tr>
          <tr><td>1250</td><td>Morale drain reduced by 4x</td></tr>
          <tr><td>1499</td><td>Mid-Grade materials can no longer be gifts (100% are High-Grade)</td></tr>
          <tr><td>1750</td><td>Morale drain reduced by 5x</td></tr>
          <tr><td>2250</td><td>Power Level cap reached<br>Morale drain reduced by 6x</td></tr>
          </tbody>`,
        ]);

        _ml.plc.load();
      },
      save: function () {
        $config.set('ml_plc', _ml.plc.list.filter((m) => m).map((m) => m.json));
        _ml.plc.load();
      },
      load: function () {
        _ml.plc.list.forEach((m) => { m?.node.div.remove(); });
        _ml.plc.list.length = 0;
        $config.get('ml_plc', [_ml.plc.preset['250']]).forEach((j) => { _ml.plc.add(j); });
      },
      toggle: function () {
        _ml.plc.node.div?.classList.toggle('hvut-none');
        _ml.plc.init();
      },

      add: function (j) {
        const m = { json: { count: 1, pa_lv: 0, pa_up: 0, er_lv: 0, er_up: 0 }, node: {} };
        const index = _ml.plc.list.length;
        if (j) {
          Object.assign(m.json, j);
        }
        m.node.div = $element('div', _ml.plc.node.left);
        let sub;
        let span;

        sub = $element('div', m.node.div);
        $input(['button', 'x'], sub, { className: 'hvut-ml-plc-del', dataset: { action: 'remove', index } });
        m.node.index = $element('span', sub, `#${index + 1}`);
        $element('br', sub);
        m.node.pl = $element('span', sub);
        $element('br', sub);
        m.node.count = $input('number', sub, { value: m.json.count, min: 0, max: 200, dataset: { action: 'change', index, type: 'count' } });

        sub = $element('div', m.node.div);
        $element('span', sub, 'Primary Attributes');
        $element('br', sub);

        span = $element('span', sub, ['.hvut-ml-plc-btn']);
        m.node.pa = [];
        for (let i = 0; i < 6; i++) {
          m.node.pa.push($element('span', span));
        }
        m.node.pa_avg = $element('span', sub, ['.hvut-ml-plc-crystal']);
        $element('br', sub);

        span = $element('span', sub, ['.hvut-ml-plc-btn']);
        $input(['button', '-6'], span, { dataset: { action: 'change', index, type: 'pa', value: '-' } });
        $input(['button', '-1'], span, { dataset: { action: 'change', index, type: 'pa', value: '-1' } });
        $input(['button', '+1'], span, { dataset: { action: 'change', index, type: 'pa', value: '+1' } });
        $input(['button', '+6'], span, { dataset: { action: 'change', index, type: 'pa', value: '+' } });
        m.node.pa_diff = $element('span', sub, ['.hvut-ml-plc-crystal']);

        sub = $element('div', m.node.div);
        $element('span', sub, 'Elemental Mitigations');
        $element('br', sub);

        span = $element('span', sub, ['.hvut-ml-plc-btn']);
        m.node.er = [];
        for (let i = 0; i < 6; i++) {
          m.node.er.push($element('span', span));
        }
        m.node.er_avg = $element('span', sub, ['.hvut-ml-plc-crystal']);
        $element('br', sub);

        span = $element('span', sub, ['.hvut-ml-plc-btn']);
        $input(['button', '-6'], span, { dataset: { action: 'change', index, type: 'er', value: '-' } });
        $input(['button', '-1'], span, { dataset: { action: 'change', index, type: 'er', value: '-1' } });
        $input(['button', '+1'], span, { dataset: { action: 'change', index, type: 'er', value: '+1' } });
        $input(['button', '+6'], span, { dataset: { action: 'change', index, type: 'er', value: '+' } });
        m.node.er_diff = $element('span', sub, ['.hvut-ml-plc-crystal']);

        _ml.plc.list.push(m);
        _ml.plc.change(index);
      },
      remove: function (index) {
        const m = _ml.plc.list[index];
        m.node.div.remove();
        _ml.plc.list[index] = null;
        _ml.plc.calc();
      },
      change: function (index, type, value) {
        const m = _ml.plc.list[index];
        if (!type) {
        } else if (type === 'count') {
          m.json[type] = (value === undefined ? parseInt(m.node[type].value) : parseInt(value)) || 0;
        } else {
          let lv = m.json[type + '_lv'];
          let up = m.json[type + '_up'];
          const max = (type === 'pa') ? 25 : (type === 'er') ? 50 : 0;
          if (value === '+') {
            lv++;
            up = 0;
          } else if (value === '-') {
            if (up === 0) {
              lv--;
            }
            up = 0;
          } else {
            up += Number(value);
            if (up >= 6) {
              lv++;
              up -= 6;
            } else if (up < 0) {
              lv--;
              up += 6;
            }
          }
          if (lv < 0) {
            lv = 0;
            up = 0;
          } else if (lv >= max) {
            lv = max;
            up = 0;
          }
          m.json[type + '_lv'] = lv;
          m.json[type + '_up'] = up;
        }

        if (m.node.count.validity.valid) {
          const data = _ml.plc.data;
          const { pa_lv, pa_up, er_lv, er_up } = m.json;
          m.count = m.json.count;
          m.pl = data.pa_pl[pa_lv] * (6 - pa_up) + data.pa_pl[pa_lv + 1] * (pa_up) + data.er_pl[er_lv] * (6 - er_up) + data.er_pl[er_lv + 1] * (er_up);
          m.pa_avg = (data.pa_crystal[pa_lv] * (6 - pa_up) + data.pa_crystal[pa_lv + 1] * (pa_up)) / 6;
          m.er_avg = (data.er_crystal[er_lv] * (6 - er_up) + data.er_crystal[er_lv + 1] * (er_up)) / 6;
          m.diff = m.pa_avg - m.er_avg;

          m.node.pl.textContent = 'PL ' + m.pl;
          m.node.pa.forEach((span, i) => {
            if (i + pa_up >= 6) {
              span.textContent = pa_lv + 1;
              span.classList.add('hvut-ml-plc-up');
            } else {
              span.textContent = pa_lv;
              span.classList.remove('hvut-ml-plc-up');
            }
          });
          m.node.er.forEach((span, i) => {
            if (i + er_up >= 6) {
              span.textContent = er_lv + 1;
              span.classList.add('hvut-ml-plc-up');
            } else {
              span.textContent = er_lv;
              span.classList.remove('hvut-ml-plc-up');
            }
          });
          m.node.pa_avg.textContent = Math.round(m.pa_avg).toLocaleString();
          m.node.pa_diff.textContent = (m.diff > 0) ? '(+' + Math.round(m.diff).toLocaleString() + ')' : '';
          m.node.er_avg.textContent = Math.round(m.er_avg).toLocaleString();
          m.node.er_diff.textContent = (m.diff < 0) ? '(+' + Math.round(-m.diff).toLocaleString() + ')' : '';

          m.valid = true;
        } else {
          m.valid = false;
        }

        _ml.plc.calc();
      },
      calc: function () {
        let count = 0;
        let pa = 0;
        let er = 0;
        _ml.plc.list.forEach((m) => {
          if (!m?.valid) {
            return;
          }
          count += m.count;
          pa += m.pa_avg * m.count;
          er += m.er_avg * m.count;
        });
        const diff = pa - er;
        _ml.plc.node.count.value = count;
        _ml.plc.node.pa_total.textContent = Math.round(pa).toLocaleString();
        _ml.plc.node.pa_total_diff.textContent = (diff > 0) ? `(+${Math.round(diff).toLocaleString()})` : '';
        _ml.plc.node.er_total.textContent = Math.round(er).toLocaleString();
        _ml.plc.node.er_total_diff.textContent = (diff < 0) ? `(+${Math.round(-diff).toLocaleString()})` : '';
      },

    };
  }
} else
// [END 11] Bazaar - Monster Lab */


//* [12] Bazaar - MoogleMail
if (_query.s === 'Bazaar' && _query.ss === 'mm' && $config.settings.moogleMail) {
  _mm.node = {};

  _mm.attach_text = function (item) {
    if (!item.data.count) {
      return '';
    } else if (item.data.pane === 'equip') {
      return `[${item.info.eid}] ${item.info.name}` + (item.data.cod ? ` @ ${item.data.cod.toLocaleString()}c` : '');
    } else {
      return `${item.data.count.toLocaleString()} x ${item.info.name}` + (item.data.cod ? ` @ ${item.data.price.toLocaleString()}c = ${item.data.cod.toLocaleString()}c` : '');
    }
  };

  _mm.parse_count = function (str) {
    if (!str) {
      return 0;
    }
    return parseInt(str.replace(/,/g, '')) || 0;
  };

  _mm.parse_price = function (str, float) {
    if (!str) {
      return 0;
    }
    if (/([0-9,]+(?:\.\d*)?)([ckm]?)/i.test(str)) {
      const u = RegExp.$2.toLowerCase();
      let n = parseFloat(RegExp.$1.replace(/,/g, ''));
      if (u === 'm') {
        n *= 1000000;
      } else if (u === 'k') {
        n *= 1000;
      }
      if (!float) {
        n = Math.round(n);
      }
      return n;
    } else {
      return 0;
    }
  };

  // MM WRITE
  if (_query.filter === 'new' && _query.hvut !== 'disabled') {
    if ($id('mmail_attachremove')) {
      alert('Remove attached items.');
      location.href = location.href + '&hvut=disabled';
      return;
    }

    _mm.mmtoken = $id('mailform').elements.mmtoken.value;

    _mm.write_calc = function () {
      const queue = [].concat(_mm.credits_list, _mm.equip_list, _mm.item_list).filter((e) => e.node.check.checked && e.data.count);
      let atext = '';
      let cod_total = 0;
      queue.forEach((e) => {
        atext += `${e.data.atext}\n`;
        cod_total += e.data.cod;
      });
      if (cod_total) {
        if (queue.length > 1) {
          atext += `\nTotal: ${cod_total.toLocaleString()} Credits`;
        }
        const cod_deduction = _mm.parse_price(_mm.node.write_cod_deduction.value);
        if (cod_deduction) {
          const cod = cod_total - cod_deduction;
          atext += `\nDeduction: -${cod_deduction.toLocaleString()} Credits`;
          atext += `\nCoD: ${cod.toLocaleString()} Credits`;
          if (cod < 10) {
            atext += '\n=> CoD: 0 Credits';
          }
        }
      }
      _mm.write_log(atext, true);
    };

    _mm.write_pack = function (e) {
      if (_mm.write_pack.current) {
        popup('Processing other requests...');
        return;
      }

      let selected;
      if (!e) {
        selected = [].concat(_mm.credits_list, _mm.equip_list, _mm.item_list).filter((e) => e.node.check.checked && e.data.count);
      } else if (Array.isArray(e)) {
        selected = e;
      } else if (e.data) {
        selected = [e];
        e.data.atext = _mm.attach_text(e);
      } else {
        return;
      }
      if (selected.some((e) => e.data.pane === 'equip' && e.info.protected)) {
        if (!confirm('您确定要添加受保护的装备吗?')) {
          return;
        }
      }
      if (selected.some((e) => e.data.count > e.data.stock)) {
        alert('Insufficient number of items');
        return;
      }
      if (!_mm.node.write_to_name.value) {
        alert('No recipient');
        return;
      }
      _mm.write_pack.current = true;
      _mm.node.write_field.disabled = true;
      _mm.userlist.add(_mm.node.write_to_name.value);

      const attach = selected.map((e) => e.data);
      const mail = {
        to_name: _mm.node.write_to_name.value,
        subject: _mm.node.write_subject.value,
        body: _mm.node.write_body.value,
        attach,
        cod_deduction: _mm.parse_price(_mm.node.write_cod_deduction.value),
        cod_persistent: _server.isekai && _mm.node.write_cod_persistent.checked,
      };
      $mail.request(mail);
    };

    _mm.write_log = function (text, clear) {
      if (clear) {
        _mm.node.write_log.value = '';
      }
      _mm.node.write_log.value += text + '\n';
      _mm.node.write_log.scrollTop = _mm.node.write_log.scrollHeight;
    };

    _mm.write_toggle = function (div) {
      if (div === _mm.write_toggle.current) {
        return;
      }
      if (_mm.write_toggle.current) {
        _mm.node[_mm.write_toggle.current].classList.add('hvut-none');
      }
      _mm.write_toggle.current = div;
      _mm.node[_mm.write_toggle.current].classList.remove('hvut-none');
    };

    _mm.userlist = {
      list: $config.get('mm_userlist', []),
      create: function () {
        _mm.node.write_userlist.innerHTML = '';
        _mm.userlist.list.forEach((u) => { $element('option', _mm.node.write_userlist, { value: u }); });
      },
      add: function (user) {
        if (!user) {
          return;
        }
        _mm.userlist.list.unshift(user);
        _mm.userlist.save();
      },
      save: function () {
        _mm.userlist.list = _mm.userlist.list.filter((e, i, a) => e && a.indexOf(e) === i);
        $config.set('mm_userlist', _mm.userlist.list);
        if (_mm.node.write_userlist) {
          _mm.userlist.create();
        }
      },
      popup: function () {
        popup_text(_mm.userlist.list.join('\n'), 300, 300, [
          { text: 'Save', click: (p) => {
            _mm.userlist.list = p.textarea.value.split('\n');
            _mm.userlist.save();
            p.close();
          } },
        ]);
      },
    };

    GM_addStyle(/*css*/`
      #mailform, #mmail_left, #mmail_right { display: none; }

      .hvut-mm-field { margin: 0; padding: 0; border: 0; }
      .hvut-mm-left { float: left; margin-left: 20px; padding-top: 10px; width: 600px; height: 600px; font-size: 10pt; text-align: left; line-height: 30px; }
      .hvut-mm-right { float: right; margin-right: 20px; width: 550px; height: 620px; font-size: 10pt; text-align: left; }
      #mmail_outer input[type='checkbox'] { vertical-align: middle; }

      .hvut-mm-left > span, .hvut-mm-left > label { display: inline-block; line-height: 22px; }
      .hvut-mm-left > span { text-align: right; }
      .hvut-mm-left > label { margin-right: 10px; }
      .hvut-mm-left > :first-child { float: right; }
      .hvut-mm-attachtext { float: right; width: 90px; margin: 2px 5px; display: flex; flex-direction: column; }
      .hvut-mm-attachtext input { margin: 3px 0; white-space: normal; }

      .hvut-mm-tabs { padding: 10px 0; border-bottom: 3px double; display: flex; line-height: 16px; font-weight: bold; }
      .hvut-mm-tabs span { display: inline-block; margin: 0 10px; padding: 2px 5px; border: 1px solid; }
      .hvut-mm-tabs span:first-child { order: 1; margin-left: auto; }
      .hvut-mm-attach-menu { margin-bottom: 10px; padding: 5px 0; border-bottom: 3px double; line-height: 30px; }
      .hvut-mm-disabled { padding: 10px; font-weight: bold; }

      .hvut-mm-attach { height: 475px; overflow-y: scroll; }
      .hvut-mm-attach .itemlist td:nth-child(1) { width: 175px !important; }
      .hvut-mm-attach .itemlist td:nth-child(2) { width: 75px; padding-right: 5px; }
      .hvut-mm-attach .itemlist td:nth-child(3) { width: auto; }
      .hvut-mm-attach .itemlist-credits td:nth-child(1) { width: 100px !important; }
      .hvut-mm-attach .itemlist-credits td:nth-child(2) { width: 145px }
      .hvut-mm-attach input { margin: 0 1px; }
      .hvut-mm-attach input:invalid, .hvut-mm-invalid { color: #e00 !important; }
      .hvut-mm-count { width: 50px; text-align: right; }
      .hvut-mm-price { width: 50px; text-align: right; }
      .hvut-mm-cod { width: 70px; text-align: right; }
      .hvut-mm-send { width: 40px; }
      .hvut-mm-sub { position: absolute; right: 0; z-index: 1; }
      .hvut-mm-eid { visibility: hidden; position: absolute; right: 125px; padding: 0 3px !important; border: 1px solid; line-height: 20px; background-color: #fff; }
      .eqp:hover .hvut-mm-eid { visibility: visible; }
    `);

    _mm.node.write_field = $element('fieldset', $id('mmail_outer'), ['.hvut-mm-field']);
    _mm.node.write_left = $element('div', _mm.node.write_field, ['.hvut-mm-left']);

    $input(['button', 'SEND'], _mm.node.write_left, { tabIndex: 4, style: 'width: 60px; height: 52px; margin-top: 4px;' }, () => { _mm.write_pack(); });
    $element('span', _mm.node.write_left, ['To:', '!width: 60px;']);
    _mm.node.write_to_name = $input('text', _mm.node.write_left, { value: $id('mailform').elements.message_to_name.value || '', tabIndex: 1, style: 'width: 360px; font-weight: bold;' });
    $input(['button', '编辑列表'], _mm.node.write_left, { style: 'width: 80px;' }, () => { _mm.userlist.popup(); });
    $element('span', _mm.node.write_left, ['Subject:', '!width: 60px;']);
    _mm.node.write_subject = $input('text', _mm.node.write_left, { value: $id('mailform').elements.message_subject.value || '', tabIndex: 2, style: 'width: 450px; font-weight: bold;' });

    _mm.node.write_to_name.setAttribute('list', 'hvut-mm-userlist');
    _mm.node.write_userlist = $element('datalist', _mm.node.write_left, ['#hvut-mm-userlist']);
    _mm.userlist.create();

    $element('span', _mm.node.write_left, ['选项:', '!width: 60px;']);
    _mm.node.write_cod_deduction = $input(['text', '货到付款金额'], _mm.node.write_left, { pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?', style: 'width: 60px; text-align: right;' }, { input: (e) => { _mm.write_calc(e); } });
    if (_server.isekai) {
      _mm.node.write_cod_persistent = $input(['checkbox', '主世界货到付款'], _mm.node.write_left, { checked: true });
    }

    _mm.node.write_body = $element('textarea', _mm.node.write_left, { value: $id('mailform').elements.message_body.value || '', tabIndex: 3, spellcheck: false, style: 'width: 580px; height: 250px; margin-top: 10px;' });
    _mm.node.write_log = $element('textarea', _mm.node.write_left, { readOnly: true, spellcheck: false, style: 'width: 480px; height: 200px; color: unset;' });
    $mail.log = _mm.write_log;

    const attach_div = $element('div', _mm.node.write_left, ['.hvut-mm-attachtext']);
    $input(['button', '通过文本添加'], attach_div);
    $input(['button', '可用的格式'], attach_div, null, () => { popup_text('100 x Health Potion @ 10\n(200) Mana Potion @ 90\nSpirit Potion @ 90 x 300\nLast Elixir @ 1.5k (100)', 300, 100); });
    $input(['button', '计算金额'], attach_div, null, () => { _mm.item_text(); });
    $input(['button', '添加附件'], attach_div, null, () => { _mm.item_text(true); });
    $input(['button', '重置'], attach_div, null, () => { _mm.item_search('', true); });

    _mm.node.write_right = $element('div', _mm.node.write_field, ['.hvut-mm-right']);
    _mm.node.write_tabs = $element('div', _mm.node.write_right, ['.hvut-mm-tabs hvut-cphu-sub']);
    $element('span', _mm.node.write_tabs, '使用原始邮件界面', () => { location.href = location.href + '&hvut=disabled'; });

    // MM item
    _mm.item_change = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, iid } = target.dataset;
      const it = iid && _mm.item_list.find((it) => it.info.iid == iid);
      if (action === 'calc') {
        it.data.count = _mm.parse_count(it.node.count.value);
        if (it.data.count > it.data.stock) {
          it.node.count.classList.add('hvut-mm-invalid');
        } else {
          it.node.count.classList.remove('hvut-mm-invalid');
        }
        it.data.price = _mm.parse_price(it.node.price.value, true);
        it.data.cod = Math.ceil(it.data.count * it.data.price);
        it.node.cod.value = it.data.cod ? it.data.cod.toLocaleString() : '';
        it.data.atext = _mm.attach_text(it);
        _mm.write_calc();
      }
    };
    _mm.item_click = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, iid } = target.dataset;
      const it = iid && _mm.item_list.find((it) => it.info.iid == iid);
      if (action === 'send') {
        _mm.write_pack(it);
      }
    };
    _mm.item_set = function (it, count, price) {
      count = parseInt(count);
      if (!isNaN(count)) {
        it.data.count = Math.min(it.data.stock, Math.max(0, count));
        it.node.count.value = it.data.count || '';
        if (it.data.count > it.data.stock) {
          it.node.count.classList.add('hvut-mm-invalid');
        } else {
          it.node.count.classList.remove('hvut-mm-invalid');
        }
      }
      price = parseFloat(price);
      if (!isNaN(price)) {
        it.data.price = Math.max(0, price);
        it.node.price.value = it.data.price || '';
      }
      it.data.cod = Math.ceil(it.data.count * it.data.price);
      it.node.cod.value = it.data.cod ? it.data.cod.toLocaleString() : '';
      it.data.atext = _mm.attach_text(it);
    };
    _mm.item_count = function (num) {
      if (num !== Infinity) {
        num = parseInt(num);
        if (!Number.isInteger(num)) {
          return;
        }
      }
      _mm.item_list.forEach((it) => {
        if (it.node.check.checked) {
          _mm.item_set(it, (num === Infinity) ? it.data.stock : num);
        }
      });
      _mm.write_calc();
    };
    _mm.item_all = function (checked) {
      _mm.item_list.forEach((it) => {
        if (it.visible) {
          it.node.check.checked = checked;
          it.data.atext = _mm.attach_text(it);
        }
      });
      _mm.write_calc();
    };
    _mm.item_search = function (value, set) {
      if (typeof value === 'string') {
        if (set) {
          _mm.node.item_search.value = value;
        } else {
          value = value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',');
          if (value === _mm.item_search.value) {
            return;
          }
        }
      }

      let results;
      if (!value) {
        results = _mm.item_list;
      } else if (typeof value === 'string') {
        value = value.split(',').map((v) => v.split(' '));
        results = _mm.item_list.filter((e) => {
          const lowercase = e.info.lowercase;
          return e.node.check.checked || value.some((v) => v.every((s) => s && lowercase.includes(s)));
        });
      } else { // array
        results = _mm.item_list.filter((e) => {
          if (value.includes(e.info.name)) {
            return true;
          } else if (e.node.check.checked) {
            return true;
          } else {
            return false;
          }
        });
      }
      _mm.item_list.forEach((e) => { e.visible = false; });
      results.forEach((e) => { e.visible = true; });
      _mm.item_list.forEach((e) => {
        if (e.visible) {
          e.node.tr.classList.remove('hvut-none');
        } else {
          e.node.tr.classList.add('hvut-none');
        }
      });
    };
    _mm.item_text = function (attach) {
      const text = _mm.node.write_body.value.split('\n');
      const textdata = {};
      text.forEach((t) => {
        if (t.includes('> Removed attachment:')) {
          return;
        }

        let exec;
        let name;
        let count;
        let price;
        if ((exec = /([A-Za-z][-A-Za-z0-9' ]*)(?:\s*@\s*([0-9,.]+[ckm]?))?(?:\s+[x*\uff0a]?\s*[[(]?([0-9,]+)[\])]?)/i.exec(t))) {
          name = exec[1];
          count = exec[3];
          price = exec[2];
        } else if ((exec = /(?:[[(]?([0-9,]+)[\])]?\s*[x*\uff0a]?\s*)([A-Za-z][-A-Za-z0-9' ]*)(?:\s*@\s*([0-9,.]+[ckm]?))?/i.exec(t))) {
          name = exec[2];
          count = exec[1];
          price = exec[3];
        } else {
          return;
        }
        name = name.trim();
        count = _mm.parse_count(count);
        price = _mm.parse_price(price, true);
        const lowercase = name.toLowerCase();
        textdata[lowercase] = { name, count, price };
      });

      if (attach) {
        _mm.item_list.forEach((it) => {
          const lowercase = it.info.lowercase;
          const textitem = textdata[lowercase];
          if (textitem) {
            _mm.item_set(it, textitem.count, textitem.price);
            it.visible = true;
            it.node.check.checked = true;
            it.node.tr.classList.remove('hvut-none');
          } else if (it.visible && !it.node.check.checked) {
            it.visible = false;
            it.node.tr.classList.add('hvut-none');
          }
        });
        _mm.write_calc();
      } else {
        let cod = 0;
        let atext = '';
        Object.values(textdata).forEach((textitem) => {
          textitem.cod = Math.ceil(textitem.count * textitem.price);
          cod += textitem.cod;
          atext += `${textitem.count.toLocaleString()} x ${textitem.name}`;
          if (textitem.cod) {
            atext += ` @ ${textitem.price.toLocaleString()}c = ${textitem.cod.toLocaleString()}c`;
          }
          atext += '\n';
        });
        if (cod) {
          atext += `\nTotal: ${cod.toLocaleString()} Credits`;
        }
        _mm.write_log(atext, true);
      }
    };

    _mm.node.item_div = $element('div', null, ['.hvut-none']);
    _mm.node.item_menu = $element('div', _mm.node.item_div, ['.hvut-mm-attach-menu']);
    $input(['button', '所有物品'], _mm.node.item_menu, null, () => { _mm.item_search(''); });
    $price.init();
    Object.keys($price.groups).forEach((g) => {
      $input(['button', g], _mm.node.item_menu, null, () => { _mm.item_search($price.groups[g]); });
    });
    $element('br', _mm.node.item_menu);
    _mm.node.item_search = $input('text', _mm.node.item_menu, { placeholder: '道具名，如Heal dra, Man pot', style: 'width: 170px;' }, { input: (e) => { _mm.item_search(e.target.value); }, keyup: (e) => { if (e.key === 'Escape') { _mm.item_search('', true); } } });
    $input(['button', '清除'], _mm.node.item_menu, null, () => { _mm.item_search('', true); });
    $input('checkbox', _mm.node.item_menu, { style: 'margin-left: 20px;' }, (e) => { _mm.item_all(e.target.checked); });
    $input('text', _mm.node.item_menu, { placeholder: '数量', style: 'width: 50px; text-align: right;' }, { input: (e) => { _mm.item_count(e.target.value); } });
    $input(['button', 'All'], _mm.node.item_menu, null, () => { _mm.item_count(Infinity); });
    $input(['button', '0'], _mm.node.item_menu, null, () => { _mm.item_count(0); });

    _mm.node.item_attach = $element('div', _mm.node.item_div, ['#item', '.hvut-mm-attach'], { input: (e) => { _mm.item_change(e); }, click: (e) => { _mm.item_click(e); } });
    _mm.node.item_list = $qs('.itemlist') || $element('table');
    _mm.node.item_attach.appendChild(_mm.node.item_list);

    _mm.item_list = Array.from(_mm.node.item_list.rows).map((tr) => {
      const div = tr.cells[0].firstElementChild;
      const name = div.textContent;
      const type = $item.get_type(div.getAttribute('onmouseover'));
      const { iid } = $item.get_data(div.getAttribute('onclick'));
      const lowercase = name.toLowerCase();
      const stock = parseInt(tr.cells[1].textContent);
      return { info: { name, lowercase, iid, type }, data: { pane: 'item', id: iid, name, stock, count: 0, price: 0, cod: 0 }, node: { tr } };
    });
    _mm.item_list.forEach((it) => {
      it.visible = true;
      it.node.tr.classList.add('hvut-it-' + it.info.type);
      it.node.td = $element('td', it.node.tr);
      it.node.check = $input('checkbox', it.node.td, { dataset: { action: 'calc', iid: it.info.iid } });
      it.node.count = $input('text', it.node.td, { dataset: { action: 'calc', iid: it.info.iid }, className: 'hvut-mm-count', placeholder: '数量', pattern: '\\d+|\\d{1,3}(,\\d{3})*', max: it.data.stock });
      it.node.price = $input('text', it.node.td, { dataset: { action: 'calc', iid: it.info.iid }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
      it.node.cod = $input('text', it.node.td, { className: 'hvut-mm-cod', placeholder: '总金额', readOnly: true });
      it.node.send = $input(['button', '发送'], it.node.td, { dataset: { action: 'send', iid: it.info.iid }, className: 'hvut-mm-send' });
    });

    if ($id('mmail_attachitem')) {
      $id('item').id += '_';
      $element('span', _mm.node.write_tabs, '添加道具', () => { _mm.write_toggle('item_div'); });
      _mm.node.write_right.appendChild(_mm.node.item_div);
    }

    // MM equip
    _mm.equip_change = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, eid } = target.dataset;
      const eq = eid && _mm.equip_list.find((eq) => eq.info.eid == eid);
      if (action === 'calc') {
        eq.data.cod = _mm.parse_price(eq.node.price.value);
        eq.data.atext = _mm.attach_text(eq);
        _mm.write_calc();
      }
    };
    _mm.equip_click = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, eid } = target.dataset;
      const eq = eid && _mm.equip_list.find((eq) => eq.info.eid == eid);
      if (action === 'send') {
        _mm.write_pack(eq);
      }
    };
    _mm.equip_all = function (checked) {
      _mm.equip_list.forEach((eq) => {
        if (eq.visible) {
          eq.node.check.checked = checked;
          eq.data.atext = _mm.attach_text(eq);
        }
      });
      _mm.write_calc();
    };
    _mm.equip_search = function (value, set) {
      if (set) {
        _mm.node.equip_search.value = value;
      }
      value = value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',');
      if (value === _mm.equip_search.value) {
        return;
      }
      _mm.equip_search.value = value;

      let results;
      if (!value) {
        results = _mm.equip_list;
      } else {
        value = value.split(',').map((v) => v.split(' '));
        results = _mm.equip_list.filter((e) => {
          const lowercase = e.info.lowercase;
          const eid = e.info.eid ? e.info.eid.toString() : '';
          return e.node.check.checked || value.some((v) => v.every((s) => s && (lowercase.includes(s) || eid.includes(s))));
        });
      }
      _mm.equip_list.forEach((e) => { e.visible = false; });
      results.forEach((e) => { e.visible = true; });
      $equip.list.sort(results, _mm.node.equip_list);
    };

    _mm.node.equip_div = $element('div', null, ['.hvut-none']);
    _mm.node.equip_menu = $element('div', _mm.node.equip_div, ['.hvut-mm-attach-menu']);
    _mm.node.equip_search = $input('text', _mm.node.equip_menu, { placeholder: 'Equipment name or eid', style: 'width: 310px;' }, { input: (e) => { _mm.equip_search(e.target.value); }, keyup: (e) => { if (e.key === 'Escape') { _mm.equip_search('', true); } } });
    $input(['button', 'Clear}'], _mm.node.equip_menu, null, () => { _mm.equip_search('', true); });
    $input('checkbox', _mm.node.equip_menu, { style: 'margin-left: 20px;' }, (e) => { _mm.equip_all(e.target.checked); });

    _mm.node.equip_attach = $element('div', _mm.node.equip_div, ['#mm_equip', '.hvut-mm-attach'], { input: (e) => { _mm.equip_change(e); }, click: (e) => { _mm.equip_click(e); } });
    _mm.node.equip_list = $qs('.equiplist') || $element('div', null, ['.equiplist nosel']);
    _mm.node.equip_attach.appendChild(_mm.node.equip_list);

    _mm.equip_data = $config.get('equipdata', {});
    _mm.equip_list = $equip.list.div(_mm.node.equip_list);
    _mm.equip_list.forEach((eq) => {
      eq.visible = true;
      eq.info.lowercase = eq.info.name.toLowerCase();
      eq.data.pane = 'equip';
      eq.data.id = eq.info.eid;
      eq.data.name = eq.info.name;
      eq.data.count = 1;
      eq.node.elem.removeAttribute('onclick');
      eq.node.sub = $element('div', [eq.node.elem, 'beforebegin'], ['.hvut-mm-sub']);
      eq.node.eid = $element('span', eq.node.sub, [eq.info.eid, '.hvut-mm-eid']);
      eq.node.check = $input('checkbox', eq.node.sub, { dataset: { action: 'calc', eid: eq.info.eid } });
      eq.node.price = $input('text', eq.node.sub, { dataset: { action: 'calc', eid: eq.info.eid }, className: 'hvut-mm-price', placeholder: 'price', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
      eq.node.send = $input(['button', '发送'], eq.node.sub, { dataset: { action: 'send', eid: eq.info.eid }, className: 'hvut-mm-send' });

      const json = _mm.equip_data[eq.info.eid];
      if (json?.price) {
        eq.node.price.value = json.price;
        eq.data.cod = _mm.parse_price(json.price);
      }
    });

    if ($id('mmail_attachequip')) {
      $id('mm_equip').id += '_';
      $element('span', _mm.node.write_tabs, '添加装备', () => { _mm.write_toggle('equip_div'); });
      _mm.node.write_right.appendChild(_mm.node.equip_div);
    }

    // MM credits
    _mm.credits_change = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, name } = target.dataset;
      const it = name && _mm.credits_list.find((it) => it.info.name === name);
      if (action === 'calc') {
        if (name === 'Credits') {
          it.data.count = _mm.parse_price(it.node.count.value);
        } else {
          it.data.count = _mm.parse_count(it.node.count.value);
        }
        if (it.data.count > it.data.stock) {
          it.node.count.classList.add('hvut-mm-invalid');
        } else {
          it.node.count.classList.remove('hvut-mm-invalid');
        }
        it.data.price = _mm.parse_price(it.node.price.value, true);
        it.data.cod = Math.ceil(it.data.count * it.data.price);
        it.node.cod.value = it.data.cod ? it.data.cod.toLocaleString() : '';
        it.data.atext = _mm.attach_text(it);
        _mm.write_calc();
      }
    };

    _mm.credits_list = [];
    const credits = { info: { name: 'Credits' }, data: { pane: 'credits', id: 0, name: 'Credits', stock: 0, count: 0, price: 0, cod: 0 }, node: {} };
    const hath = { info: { name: 'Hath' }, data: { pane: 'hath', id: 0, name: 'Hath', stock: 0, count: 0, price: 0, cod: 0 }, node: {} };
    if ($id('mmail_attachcredits')) {
      credits.data.stock = _mm.parse_count(/Current Funds: ([0-9,]+) Credits/.exec($id('mmail_attachcredits').textContent)[1]);
    }
    if ($id('mmail_attachhath')) {
      hath.data.stock = _mm.parse_count(/Current Funds: ([0-9,]+) Hath/.exec($id('mmail_attachhath').textContent)[1]);
    }

    _mm.node.credits_div = $element('div', null, ['.hvut-none']);
    _mm.node.credits_attach = $element('div', _mm.node.credits_div, ['.hvut-mm-attach'], { input: (e) => { _mm.credits_change(e); } });
    _mm.node.credits_list = $element('table', _mm.node.credits_attach, ['.itemlist itemlist-credits', '/<tbody></tbody>']);

    credits.node.tr = $element('tr', _mm.node.credits_list.tBodies[0]);
    $element('td', credits.node.tr, credits.info.name);
    $element('td', credits.node.tr, credits.data.stock.toLocaleString());
    credits.node.td = $element('td', credits.node.tr);
    credits.node.check = $input('checkbox', credits.node.td, { dataset: { action: 'calc', name: 'Credits' } });
    credits.node.count = $input('text', credits.node.td, { dataset: { action: 'calc', name: 'Credits' }, className: 'hvut-mm-count', placeholder: 'count', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
    credits.node.price = $input('text', credits.node.td, { dataset: { action: 'calc', name: 'Credits' }, className: 'hvut-mm-price', placeholder: 'price', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?', style: 'visibility: hidden;' });
    credits.node.cod = $input('text', credits.node.td, { className: 'hvut-mm-cod', placeholder: 'cod', readOnly: true, style: 'visibility: hidden;' });

    hath.node.tr = $element('tr', _mm.node.credits_list.tBodies[0]);
    $element('td', hath.node.tr, hath.info.name);
    $element('td', hath.node.tr, hath.data.stock.toLocaleString());
    hath.node.td = $element('td', hath.node.tr);
    hath.node.check = $input('checkbox', hath.node.td, { dataset: { action: 'calc', name: 'Hath' } });
    hath.node.count = $input('text', hath.node.td, { dataset: { action: 'calc', name: 'Hath' }, className: 'hvut-mm-count', placeholder: 'count', pattern: '\\d+|\\d{1,3}(,\\d{3})*' });
    hath.node.price = $input('text', hath.node.td, { dataset: { action: 'calc', name: 'Hath' }, className: 'hvut-mm-price', placeholder: 'price', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
    hath.node.cod = $input('text', hath.node.td, { className: 'hvut-mm-cod', placeholder: 'cod', readOnly: true });

    if ($id('mmail_attachcredits')) {
      _mm.credits_list.push(credits, hath);
      $element('span', _mm.node.write_tabs, 'Credits / Hath', () => { _mm.write_toggle('credits_div'); });
      _mm.node.write_right.appendChild(_mm.node.credits_div);
    }

    _mm.credits_multi = function () {
      if (_mm.credits_multi.current) {
        popup('Processing other requests...');
        return;
      }
      _mm.credits_multi.current = true;
      _mm.node.write_field.disabled = true;

      const queue = [];
      const errors = [];
      let credits_funds = credits.data.stock;
      let hath_funds = hath.data.stock;
      _mm.node.credits_multi.value.split('\n').forEach((t) => {
        if (!t) {
          return;
        }
        const [to_name, ctext, subject, ...body] = t.split(';');
        if (!to_name) {
          errors.push('No recipient: ' + t);
          return;
        }

        const attach = [];
        if (!ctext) {
        } else if (/^\s*([0-9,.]+[ckm]?)\s*$/i.test(ctext)) {
          const it = { pane: 'credits', name: 'Credits', id: 0, count: _mm.parse_price(RegExp.$1) };
          attach.push(it);
          credits_funds -= it.count;
        } else if (/^\s*([0-9,]+)h\s*$/i.test(ctext)) {
          const it = { pane: 'hath', name: 'Hath', id: 0, count: _mm.parse_count(RegExp.$1) };
          attach.push(it);
          hath_funds -= it.count;
        } else {
          errors.push('Invalid attachment: ' + t);
          return;
        }

        const mail = {
          to_name,
          subject: subject.trim() || _mm.node.write_subject.value,
          body: body.length ? body.join(';').replace(/\|/g, '\n') : _mm.node.write_body.value,
          attach,
        };
        queue.push(mail);
      });
      if (errors.length) {
        alert(errors.join('\n'));
        return;
      }
      if (credits_funds < 0) {
        alert('Insufficient Credits');
        return;
      }
      if (hath_funds < 0) {
        alert('Insufficient Hath');
        return;
      }

      queue.map((mail) => $mail.request(mail));
    };

    const multi_div = $element('div', _mm.node.credits_attach, ['!margin-top: 50px;']);
    $input(['button', 'Multi-Send'], multi_div, { style: 'width: 150px; margin: 10px;' }, () => { _mm.credits_multi(); });
    $element('br', multi_div);
    _mm.node.credits_multi = $element('textarea', multi_div, { placeholder: 'user; credits; subject; text (| = new line)\nex)\nsssss2; 10m\nsssss3; 500k; WTB; hi|I want to buy...\nTenboro; 500c\nMoogleMail; 1000h; Thanks', style: 'width: 500px; height: 300px;', spellcheck: false });

    if (!['item_div', 'equip_div', 'credits_div'].some((d) => { if (_mm.node[d].parentNode) { _mm.write_toggle(d); return true; } })) {
      $element('div', _mm.node.write_right, ['/' + $id('mmail_right').innerHTML, '.hvut-mm-disabled']);
      _mm.node.write_cod_deduction.disabled = true;
      if (_server.isekai) {
        _mm.node.write_cod_persistent.disabled = true;
        _mm.node.write_cod_persistent.checked = false;
      }
    }
    _mm.node.write_to_name.focus();

    // MM LIST
  } else if ($id('mmail_list')) {
    _mm.db = {

      version: 1,
      season: 'mm',

      open: function (callback) {
        if (_mm.db.database) {
          callback?.();
          return;
        }
        const request = indexedDB.open($config.ns, _mm.db.version);
        request.onsuccess = function (e) {
          _mm.db.database = e.target.result;
          callback?.();
        };
        request.onupgradeneeded = function (e) {
          const db = e.target.result;
          const stores = [_mm.db.season];
          stores.forEach((store) => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: 'mid' });
            }
          });
        };
      },
      conn: function (mode = 'readonly', store = _mm.db.season) {
        const db = _mm.db.database;
        const tx = db.transaction(store, mode);
        const os = tx.objectStore(store);
        return { db, tx, os };
      },
      search: function (query) {
        const { season, filter, name, subject, text, attach, eid, cod, cod_min, cod_max } = query;
        const results = [];
        return new Promise((resolve) => {
          const conn = _mm.db.conn('readonly', season);
          conn.os.openCursor().onsuccess = function (e) {
            const cursor = e.target.result;
            if (cursor) {
              const db = cursor.value;
              const mail = _mm.mail_get(db.mid, season);
              mail.db = db;

              const exclude = filter && filter !== db.filter
                  || name && !db.user.toLowerCase().includes(name)
                  || subject && !db.subject.toLowerCase().includes(subject)
                  || text && !db.text.toLowerCase().includes(text)
                  || cod && cod !== db.cod || cod_min && (!db.cod || cod_min > db.cod) || cod_max && cod_max < db.cod
                  || attach && !(db.attach?.some((e) => { if (eid) { return e.t === 'e' && e.e === eid; } else { const n = e.n.toLowerCase(); return attach.every((a) => n.includes(a)); } }));
              if (!exclude) {
                results.push(mail);
              }
              cursor.continue();
            } else {
              resolve(results);
            }
          };
        });
      },
      export: function () {
        _mm.node.db_export.disabled = true;
        const json = [];
        const database = _mm.db.database.name;
        const stores = Array.from(_mm.db.database.objectStoreNames);
        let completed = stores.length;
        stores.forEach((store) => {
          const values = [];
          const conn = _mm.db.conn('readonly', store);
          conn.os.openCursor().onsuccess = function (e) {
            const cursor = e.target.result;
            if (cursor) {
              values.push(cursor.value);
              cursor.continue();
            } else {
              json.push({ database, store, values });
              completed--;
              if (completed === 0) {
                const date = new Date();
                const download = $config.ns.toUpperCase() + '_MoogleMail_' + (date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)) + '.json';
                const link = $element('a', document.body, { download, style: 'display: none;' });
                window.URL.revokeObjectURL(link.href);
                link.href = window.URL.createObjectURL(new Blob([JSON.stringify(json)], { type: 'application/json' }));
                link.click();
                _mm.node.db_export.value = 'Completed';
                popup(`<p>The file has been saved.</p><p style="font-weight: bold;">${download}</p>`);
              }
            }
          };
        });
      },
      import: function () {
        _mm.node.db_import.disabled = true;
        const input = $input('file', null, { accept: '.json' }, { change: () => {
          const file = input.files[0];
          if (!file) {
            return;
          }
          const reader = new FileReader();
          reader.onload = function (e) {
            db_import(e.target.result);
          };
          reader.onerror = function () {
            alert('Failed to read the file');
          };
          reader.readAsText(file);
        } });
        input.click();

        function db_import(text) {
          try {
            const dbname = _mm.db.database.name;
            const stores = Array.from(_mm.db.database.objectStoreNames);
            const json = JSON.parse(text);
            let completed = json.length;

            function complete() {
              completed--;
              if (completed === 0) {
                _mm.node.db_import.value = 'Completed';
              }
            }

            json.forEach((obj) => {
              const { database, store, values } = obj;
              if (database !== dbname) {
                console.log('Invalid Database');
                complete();
                return;
              }
              if (!stores.includes(store)) {
                complete();
                console.log('Invalid objectStore');
                return;
              }
              const conn = _mm.db.conn('readwrite', store);
              conn.tx.oncomplete = function () {
                complete();
              };
              values.forEach((data) => {
                conn.os.put(data);
              });
            });
          } catch (e) {
            alert('Failed to parse the file\nSelect a valid MoogleMail Database json file');
            return;
          }
        }
      },
      clear: function () {
        if (confirm('此浏览器中的当前赛季的邮件记录将被删除.\nAre you sure?')) {
          const season = _mm.node.search_season?.value || _mm.db.season;
          const conn = _mm.db.conn('readwrite', season);
          conn.os.clear();
        }
      },
      toggle: function () {
        if (_mm.node.db_div) {
          _mm.node.db_div.classList.toggle('hvut-none');
          return;
        }
        _mm.node.db_div = $element('div', _mm.node.bottom);
        $input(['button', '关闭'], _mm.node.db_div, null, () => { _mm.db.toggle(); });
        $input(['button', '重置数据库'], _mm.node.db_div, null, () => { _mm.db.clear(); });
        _mm.node.db_export = $input(['button', 'Export to JSON'], _mm.node.db_div, null, () => { _mm.db.export(); });
        _mm.node.db_import = $input(['button', 'Import from JSON'], _mm.node.db_div, null, () => { _mm.db.import(); });
      },
      init: function () {
        if (_server.isekai) {
          _mm.db.season = _server.season;
          const exec = /(\d+) Season (\d+)/.exec(_server.season);
          if (exec) {
            const year = exec[1];
            const season = exec[2];
            const version = parseInt(year.slice(2)) * 100 + parseInt(season);
            _mm.db.version = version;
          } else {
            _mm.db.version = 1;
          }
        }
      },

    };

    _mm.page_filter = _query.filter || 'inbox';
    _mm.page_current = parseInt(_query.page) || 0;

    _mm.page_init = function () {
      _mm.node.page_table[_mm.page_current] = $element('table', $id('mmail_outerlist'), ['.hvut-mm-list']);
      _mm.page_create($id('mmail_list'), _mm.page_current);
      $id('mmail_list').remove();
      _mm.page_prev = _mm.page_current;
      _mm.page_next = _mm.page_current;
      _mm.page_pager($id('mmail_pager'), _mm.page_current);
    };

    _mm.page_click = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, mid, season } = target.dataset;
      if (action === 'read') {
        e.preventDefault();
        _mm.mail_read(mid, null, season);
      }
    };

    _mm.page_load = async function (p) {
      if (p === 'prev') {
        if (_mm.page_prev === null) {
          return;
        }
        p = _mm.page_prev;
      } else if (p === 'next') {
        if (_mm.page_next === null) {
          return;
        }
        p = _mm.page_next;
      }
      if (_mm.node.page_table[p]) {
        return;
      }
      _mm.node.page_table[p] = $element('table', [$id('mmail_outerlist'), _mm.node.page_table[p + 1]], ['.hvut-mm-list']);
      const table = _mm.node.page_table[p];
      $element('tr', table, [`/<td>${p} Page: Loading...</td>`]);
      scrollIntoView(table);
      _mm.node.page_prev.disabled = true;
      _mm.node.page_next.disabled = true;

      const html = await $ajax.fetch(`?s=Bazaar&ss=mm&filter=${_mm.page_filter}&page=${p}`);
      const doc = $doc(html);
      const list = $qs('#mmail_list', doc);
      _mm.kill_asshole(list);
      _mm.page_create(list, p);
      scrollIntoView(table);
      _mm.page_pager($id('mmail_pager', doc), p);
      return doc;
    };

    _mm.page_pager = function (pager, p) {
      const prev = parseInt(pager.children[0].firstElementChild.href?.match(/&page=(\d+)/)[1]) || null;
      const next = parseInt(pager.children[1].firstElementChild.href?.match(/&page=(\d+)/)[1]) || null;
      if (_mm.page_prev !== null && p <= _mm.page_prev) {
        _mm.page_prev = prev;
      }
      if (_mm.page_next !== null && p >= _mm.page_next) {
        _mm.page_next = next;
      }
      _mm.node.page_prev.disabled = _mm.page_prev === null;
      _mm.node.page_next.disabled = _mm.page_next === null;
    };

    _mm.page_create = function (list, p) {
      const table = _mm.node.page_table[p];
      const tbody = $element('tbody');
      const type = { 'inbox': 'Inbox', 'read': 'From', 'sent': 'To' }[_mm.page_filter];
      $element('tr', tbody, [`/<td>${type}</td><td>${p} Page</td><td>Attachment</td><td>CoD</td><td>Sent</td><td>Read</td>`]);

      const conn = _mm.db.conn();
      let count = list.rows.length - 1;
      Array.from(list.rows).slice(1).forEach((tr) => {
        if (tr.cells[0].id === 'mmail_nnm') {
          $element('tr', tbody, ['/<td colspan="6">No New Mail</td>']);
          return;
        }
        const mid = parseInt(/mid=(\d+)/.exec(tr.getAttribute('onclick'))[1]);
        const user = tr.cells[0].textContent;
        const returned = user === 'MoogleMail';
        const subject = tr.cells[1].textContent;
        let sent = tr.cells[2].textContent;
        sent = Date.parse(sent + ':00.000Z') / 1000;
        let read = tr.cells[3].textContent;
        read = (read === 'Never') ? null : Date.parse(read + ':00.000Z') / 1000;

        const mail = _mm.mail_get(mid);
        if (mail.page) {
          return;
        }
        mail.page = { filter: _mm.page_filter, user, returned, subject, sent, read };
        const page = mail.page;
        mail.node.page = $element('tr', tbody, ['/<td></td><td></td><td></td><td></td><td></td><td></td>']);
        $element('a', mail.node.page.cells[1], { dataset: { action: 'read', mid: mid }, href: `?s=Bazaar&ss=mm&filter=${page.filter}&mid=${mid}&page=${p}` });

        conn.os.get(mid).onsuccess = function (e) {
          mail.db = e.target.result || null;
          const db = mail.db;
          if (!db || db.filter !== page.filter || !page.returned && !db.user.startsWith(page.user) || db.sent !== page.sent || db.read !== page.read) {
            if (page.filter !== 'inbox') {
              _mm.mail_load(mid);
            }
          }
          _mm.page_modify(mail);
          if (!--count) {
            scrollIntoView(table);
          }
        };
      });
      table.innerHTML = '';
      table.appendChild(tbody);
    };

    _mm.page_modify = function (mail) {
      const page = mail.page;
      const db = mail.db;
      const tr = mail.node.page;
      tr.cells[0].textContent = (db || page).user;
      tr.cells[1].firstElementChild.textContent = (db || page).subject;
      tr.cells[2].innerHTML = '';
      tr.cells[3].innerHTML = '';

      db?.attach?.forEach((e) => {
        const span = $element('span', tr.cells[2], [`.hvut-mm-attach-${e.t}`]);
        if (e.t === 'e') {
          if (e.e && e.k) {
            $element('a', span, { textContent: e.n, href: `equip/${e.e}/${e.k}`, target: '_blank' });
          } else {
            span.textContent = e.n;
          }
        } else {
          span.textContent = `${e.c.toLocaleString()} x ${e.n}`;
        }
      });
      if (db?.cod) {
        tr.cells[3].innerHTML = `<span>${db.cod.toLocaleString()}</span>`;
      }
      tr.cells[4].textContent = _mm.dts(page.sent);
      tr.cells[5].textContent = page.read ? _mm.dts(page.read) : '';

      tr.classList[page.read ? 'remove' : 'add']('hvut-mm-unread');
      tr.classList[(db || page).returned ? 'add' : 'remove']('hvut-mm-returned');
      tr.classList[(db || page).filter !== page.filter ? 'add' : 'remove']('hvut-mm-removed');
      tr.classList[db ? 'remove' : 'add']('hvut-mm-nodb');
    };

    _mm.page_go = function (p) {
      p = parseInt(p);
      if (isNaN(p) || p < 0) {
        return;
      }
      location.href = location.href.replace(/&page=\d+/, '') + '&page=' + p;
    };

    _mm.mail_data = {};

    _mm.mail_get = function (mid, season = _mm.db.season) {
      if (!_mm.mail_data[season]) {
        _mm.mail_data[season] = {};
      }
      if (!_mm.mail_data[season][mid]) {
        _mm.mail_data[season][mid] = { mid, node: {} };
      }
      return _mm.mail_data[season][mid];
    };

    _mm.mail_read = async function (mid, post, season = _mm.db.season) {
      const mail = _mm.mail_get(mid, season);
      if (_mm.mail_current === mail && !post) {
        _mm.mail_close();
        return;
      }
      _mm.mail_close();
      _mm.mail_current = mail;
      _mm.node.mail_view.classList.remove('hvut-none');
      $element('p', _mm.node.mail_view, ['Loading...', '.hvut-mm-loading']);

      mail.node.page?.classList.add('hvut-mm-current');
      mail.node.search?.classList.add('hvut-mm-current');

      if (season === _mm.db.season) {
        await _mm.mail_load(mid, post);
      }
      _mm.mail_view(mail);
    };

    _mm.mail_load = async function (mid, post) {
      const mail = _mm.mail_get(mid);
      const html = await $ajax.fetch('?s=Bazaar&ss=mm&mid=' + mid, post);
      mail.view = _mm.mail_parse(html);
      _mm.mail_update(mail);
      return true;
    };

    _mm.mail_parse = function (arg) {
      let html;
      let doc;
      if (typeof arg === 'string') {
        html = arg;
        doc = $doc(html);
      } else {
        doc = arg;
        html = doc.documentElement.innerHTML;
      }

      const view = {};
      const form = $id('mailform', doc);
      if (form) {
        _mm.mmtoken = form.elements.mmtoken.value;
        view.to = form.elements[3].value;
        view.from = form.elements[4].value;
        view.subject = form.elements[5].value;
        view.text = form.elements[6].value;
        view.attach = [];
        view.return = $qs('#mmail_showbuttons > img[src*="returnmail.png"]', doc) ? true : false;
        view.recall = $qs('#mmail_showbuttons > img[src*="recallmail.png"]', doc) ? true : false;
        view.reply = $qs('#mmail_showbuttons > img[src*="reply.png"]', doc) ? true : false;
        view.take = $qs('#mmail_attachremove > img[src*="attach_takeall.png"]', doc) ? true : false;

        if (view.from === 'MoogleMail') {
          view.from = /This message was returned from (.+), kupo!|This mail was sent to (.+), but was returned, kupo!/.test(view.text.split('\n').reverse().join('\n')) && (RegExp.$1 || RegExp.$2);
          view.returned = true;
        }
        if (view.take) {
          view.filter = 'inbox';
          view.user = view.from;
        } else if (view.reply) {
          view.filter = 'read';
          view.user = view.from;
        } else if (view.returned) {
          view.filter = 'read';
          view.user = view.from;
        } else {
          view.filter = 'sent';
          view.user = view.to;
        }
        view.read = view.filter === 'read' || view.filter === 'sent' && !view.recall;

        if ($id('mmail_attachlist', doc)) {
          Object.assign($equip.dynjs_eqstore, JSON.parse(/dynjs_eqstore\s?=\s?(\{.*?\});/.exec(html)?.[1] || null));
          Array.from($id('mmail_attachlist', doc).children).forEach((div) => {
            let exec;
            const onmouseover = div.firstElementChild.firstElementChild?.getAttribute('onmouseover');
            if (onmouseover && (exec = /equips\.set\((\d+)/.exec(onmouseover))) {
              const eid = parseInt(exec[1]);
              const key = $equip.dynjs_eqstore[eid].k;
              const name = $equip.dynjs_eqstore[eid].t;
              const type = 'e';
              view.attach.push({ t: type, n: name, e: eid, k: key });
            } else if ((exec = /^([0-9,]+)x? (.+)$/.exec(div.textContent))) {
              const count = _mm.parse_count(exec[1]);
              const name = exec[2];
              const type = (name === 'Hath') ? 'h' : (name === 'Credits') ? 'c' : 'i';
              view.attach.push({ t: type, n: name, c: count });
            } else {
              console.log(div.textContent.trim());
            }
          });
          if ($id('mmail_currentcod', doc)) {
            view.cod = _mm.parse_count(/Requested Payment on Delivery: ([0-9,]+) credits/.exec($id('mmail_currentcod', doc).textContent)[1]);
          }
        } else {
          const split = view.text.split('\n\n').reverse();
          const attach = split[0].split('\n').every((e) => {
            const exec = /^Removed attachment: (?:([0-9,]+)x? (.+)|(.+))$/.exec(e);
            if (!exec) {
              return false;
            }
            if (exec[3]) {
              const name = exec[3];
              const type = 'e';
              view.attach.unshift({ t: type, n: name });
            } else {
              const name = exec[2];
              const type = (name === 'Hath') ? 'h' : (name === 'Credits') ? 'c' : 'i';
              const count = _mm.parse_count(exec[1]);
              view.attach.unshift({ t: type, n: name, c: count });
            }
            return true;
          });
          if (attach) {
            view.cod = _mm.parse_count(/^CoD Paid: ([0-9,]+) Credits$/.exec(split[1])?.[1]);
          }

          // pre 0.85
          const exec = /^Attached item removed: (?:([0-9,]+)x? (.+)|(.+)) \(type=([chie]) id=(\d+), CoD was ([0-9]+)C\)$/.exec(split[0]);
          if (exec) {
            const type = exec[4];
            if (type === 'e') {
              const name = exec[3];
              const eid = exec[5];
              view.attach.push({ t: type, n: name, e: eid });
            } else {
              const name = exec[2];
              const count = _mm.parse_count(exec[1]);
              view.attach.push({ t: type, n: name, c: count });
            }
            view.cod = _mm.parse_count(exec[6]);
          }
        }
      } else {
        view.error = get_message(doc) || 'UNKNOWN ERROR';
      }

      return view;
    };

    _mm.mail_update = function (mail) {
      const mid = mail.mid;
      const page = mail.page;
      const view = mail.view;

      if (view.error) {
      } else if (mail.db) {
        const db = mail.db;
        const sent = page?.sent || db.sent;
        let read = page?.read || db.read;
        if (read === null && view.read) {
          read = -1;
        }
        if (db.filter !== view.filter || db.user !== view.user || db.subject !== view.subject || db.text !== view.text || db.sent !== sent || db.read !== read) {
          db.filter = view.filter;
          db.user = view.user;
          db.subject = view.subject;
          db.text = view.text;
          db.sent = sent;
          db.read = read;
          if (view.returned) {
            db.returned = 1;
            delete db.cod;
          }
          const conn = _mm.db.conn('readwrite');
          conn.os.put(db);
        }
      } else if (page) {
        mail.db = { mid: mid, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: page.sent, read: page.read };
        const db = mail.db;
        if (view.returned) {
          db.returned = 1;
        }
        if (view.attach.length) {
          db.attach = view.attach;
        }
        if (view.cod) {
          db.cod = view.cod;
        }
        const conn = _mm.db.conn('readwrite');
        conn.os.add(db);
      }

      _mm.mail_modify(mail);
    };

    _mm.mail_modify = function (mail) {
      if (mail.node.page) {
        _mm.page_modify(mail);
      }
      if (mail.node.search) {
        _mm.search_modify(mail);
      }
    };

    _mm.mail_view = function (mail) {
      if (_mm.mail_current !== mail) {
        return;
      }
      const mid = mail.mid;
      const view = mail.view || {};
      const db = mail.db;
      const div = _mm.node.mail_view;
      div.innerHTML = '';
      if (!db) {
        $element('p', div, [`ERROR: ${view.error}`, '.hvut-mm-loading']);
        return;
      }
      div.classList[db.returned ? 'add' : 'remove']('hvut-mm-rts');

      const type = (db.filter === 'sent') ? 'To' : 'From';
      const read = (db.read === null) ? '-' : (db.read === -1) ? '????-??-??' : _mm.dts(db.read, 4);
      $element('dl', div, [`/<dt>${type}</dt><dd>${db.user}</dd><dt>Sent</dt><dd>${_mm.dts(db.sent, 4)}</dd><dt>Subject</dt><dd>${db.subject}</dd><dt>Read</dt><dd>${read}</dd>`]);

      _mm.node.mail_body = $element('textarea', div, { value: db.text, spellcheck: false, readOnly: true });
      const buttons = $element('div', div);
      $input(['button', '关闭'], buttons, { dataset: { action: 'close', mid } });
      if (view.reply) {
        $input(['button', '回复'], buttons, { dataset: { action: 'reply', mid } });
      }
      if (view.take) {
        $input(['button', '全部领取'], buttons, { dataset: { action: 'take', mid, value: view.cod || '' } });
      }
      if (view.return) {
        $input(['button', '退回邮件'], buttons, { dataset: { action: 'return', mid } });
      }
      if (view.recall) {
        $input(['button', '撤回邮件'], buttons, { dataset: { action: 'recall', mid } });
      }
      if (view.error) {
        $input(['button', view.error], buttons);
        div.classList.add('hvut-mm-failed');
      } else {
        div.classList.remove('hvut-mm-failed');
      }
      if (db.returned) {
        $input(['button', `此邮件被 ${db.user}退回`], buttons);
      }

      mail.attach = [];
      if (db.attach) {
        const ul = $element('ul', div, null, { input: (e) => { _mm.mail_cod(e); } });
        const li = $element('li', ul);
        const wtx = (db.filter === 'sent') ? 'WTS' : 'WTB';

        let cod_text;
        if (db.cod) {
          if (db.read) {
            cod_text = `已支付: ${db.cod.toLocaleString()}`;
          } else {
            cod_text = `需要支付: ${db.cod.toLocaleString()}`;
          }
        } else {
          cod_text = '无货到付款';
        }
        $element('span', li, cod_text);
        mail.node.price = $input('text', li, { className: 'hvut-mm-price', readOnly: true, value: wtx });
        mail.node.cod = $input('text', li, { className: 'hvut-mm-cod', readOnly: true });
        mail.attach = JSON.parse(JSON.stringify(db.attach));
        mail.attach.forEach((e) => {
          const li = $element('li', ul);
          const span = $element('span', li, [`.hvut-mm-attach-${e.t}`]);
          if (e.t === 'e') {
            if (e.e && e.k) {
              $element('a', span, { textContent: e.n, href: `equip/${e.e}/${e.k}`, target: '_blank' });
            } else {
              span.textContent = e.n;
            }
          } else {
            span.textContent = `${e.c.toLocaleString()} x ${e.n}`;
          }
          e.node = {};
          if (e.n === 'Credits') {
            return;
          }
          e.node.price = $input('text', li, { className: 'hvut-mm-price' });
          e.node.cod = $input('text', li, { className: 'hvut-mm-cod', readOnly: true });
        });
      }
    };

    _mm.mail_click = function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, mid, value } = target.dataset;
      if (action === 'close') {
        _mm.mail_close();
      } else if (action === 'reply') {
        location.href = `?s=Bazaar&ss=mm&filter=new&reply=${mid}`;
      } else if (action === 'take') {
        if (value && !confirm(`取出附件将收取你 ${parseInt(value).toLocaleString()} 的Credits.\nAre you sure?`)) {
          return;
        }
        _mm.mail_read(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`);
      } else if (action === 'return') {
        if (!confirm('这将把邮件退回给寄信人.\nAre you sure?')) {
          return;
        }
        _mm.mail_read(mid, `action=return_message&mmtoken=${_mm.mmtoken}`);
      } else if (action === 'recall') {
        if (!confirm('这将把邮件退回给寄信人.\nAre you sure?')) {
          return;
        }
        _mm.mail_read(mid, `action=return_message&mmtoken=${_mm.mmtoken}`);
      }
    };

    _mm.mail_close = function () {
      if (_mm.mail_current) {
        const mail = _mm.mail_current;
        mail.node.page?.classList.remove('hvut-mm-current');
        mail.node.search?.classList.remove('hvut-mm-current');
      }
      _mm.mail_current = null;
      _mm.node.mail_view.classList.add('hvut-none');
      _mm.node.mail_view.innerHTML = '';
      _mm.mail_log('', true);
      _mm.node.mail_log.parentNode.classList.add('hvut-none');
    };

    _mm.mail_cod = function () {
      const mail = _mm.mail_current;
      if (!mail) {
        return;
      }
      const db = mail.db;
      const wtx = (db.filter === 'sent') ? 'WTS' : 'WTB';
      const attach = mail.attach;
      let sum = 0;

      attach.forEach((e) => {
        if (e.n === 'Credits') {
          return;
        }
        const p = _mm.parse_price(e.node.price.value, true);
        const cod = p * (e.c || 1);
        e.node.cod.value = cod ? cod.toLocaleString() : '';
        sum += cod;
      });
      mail.node.cod.value = sum ? sum.toLocaleString() : '';
      if (db?.cod) {
        mail.node.price.value = !sum ? wtx : (db.cod === sum) ? 'CoD =' : (db.cod > sum) ? 'CoD >' : 'CoD <';
        mail.node.price.dataset.codMatch = (db.cod === sum) ? '1' : '0';
        mail.node.cod.dataset.codMatch = (db.cod === sum) ? '1' : '0';
      }
    };

    _mm.mail_log = function (text, clear) {
      _mm.node.mail_log.parentNode.classList.remove('hvut-none');
      if (clear) {
        _mm.node.mail_log.value = '';
      }
      _mm.node.mail_log.value += text + '\n';
      _mm.node.mail_log.scrollTop = _mm.node.mail_log.scrollHeight;
    };

    _mm.search_submit = function () {
      const season = _mm.node.search_season?.value || _mm.db.season;
      const filter = _mm.node.search_filter.value;
      const name = _mm.node.search_name.value.trim().toLowerCase();
      const subject = _mm.node.search_subject.value.trim().toLowerCase();
      const text = _mm.node.search_text.value.trim().toLowerCase();
      let attach = _mm.node.search_attach.value.trim();
      let eid = null;
      let cod = _mm.node.search_cod.value.replace(/\s/g, '').toLowerCase();
      let cod_min = 0;
      let cod_max = 0;
      if (attach) {
        if (isNaN(attach)) {
          attach = attach.toLowerCase().replace(/\s+/g, ' ').split(' ');
        } else {
          eid = parseInt(attach);
        }
      }
      if (/^([0-9.]+[ckm]?)$/i.test(cod)) {
        cod = _mm.parse_price(RegExp.$1);
      } else if (/^([0-9.]+[ckm]?)?[-~]([0-9.]+[ckm]?)?$/i.test(cod)) {
        cod = false;
        cod_min = _mm.parse_price(RegExp.$1);
        cod_max = _mm.parse_price(RegExp.$2);
      } else {
        cod = false;
      }
      const query = { season, filter, name, subject, text, attach, eid, cod, cod_min, cod_max };
      _mm.search(query);
    };

    _mm.search = function (query) {
      _mm.mail_close();
      _mm.node.search_div.innerHTML = '';
      _mm.node.search_div.classList.remove('hvut-none');
      $element('div', _mm.node.search_div, ['Searching...', '.hvut-mm-searching']);

      _mm.db.search(query).then((results) => {
        const table = $element('table', null, ['.hvut-mm-list']);
        const tbody = $element('tbody', table);
        $element('tr', tbody, [`/<td>Search</td><td>${results.length} mail(s)</td><td>Attachment</td><td>CoD</td><td>Sent</td><td>Read</td>`]);

        results.sort((a, b) => b.db.mid - a.db.mid);
        results.forEach((mail) => {
          const db = mail.db;
          if (!mail.node.search) {
            mail.node.search = $element('tr', tbody, ['/<td></td><td></td><td></td><td></td><td></td><td></td>']);
            if (query.season === _mm.db.season) {
              $element('a', mail.node.search.cells[1], { dataset: { action: 'read', mid: db.mid }, href: `?s=Bazaar&ss=mm&filter=${db.filter}&mid=${db.mid}` });
            } else {
              $element('a', mail.node.search.cells[1], { dataset: { action: 'read', mid: db.mid, season: query.season } });
            }
          }
          tbody.appendChild(mail.node.search);
          _mm.search_modify(mail);
        });

        _mm.node.search_div.innerHTML = '';
        _mm.node.search_div.appendChild(table);
      });
    };

    _mm.search_modify = function (mail) {
      const db = mail.db;
      const tr = mail.node.search;
      const type = { 'inbox': 'Inbox', 'read': 'From', 'sent': 'To' }[db.filter];
      tr.cells[0].innerHTML = `<span>${type}</span> ${db.user}`;
      tr.cells[1].firstElementChild.textContent = db.subject;
      tr.cells[2].innerHTML = '';
      tr.cells[3].innerHTML = '';

      db.attach?.forEach((e) => {
        const span = $element('span', tr.cells[2], [`.hvut-mm-attach-${e.t}`]);
        if (e.t === 'e') {
          if (e.e && e.k) {
            $element('a', span, { textContent: e.n, href: `equip/${e.e}/${e.k}`, target: '_blank' });
          } else {
            span.textContent = e.n;
          }
        } else {
          span.textContent = `${e.c.toLocaleString()} x ${e.n}`;
        }
      });
      if (db.cod) {
        tr.cells[3].innerHTML = `<span>${db.cod.toLocaleString()}</span>`;
      }
      tr.cells[4].textContent = _mm.dts(db.sent);
      tr.cells[5].textContent = db.read ? _mm.dts(db.read) : '';

      tr.classList[db.read ? 'remove' : 'add']('hvut-mm-unread');
      tr.classList[db.returned ? 'add' : 'remove']('hvut-mm-returned');
    };

    _mm.search_close = function () {
      _mm.node.search_div.classList.add('hvut-none');
      _mm.node.search_div.innerHTML = '';
    };

    _mm.search_keydown = function (e) {
      if (e.key === 'Enter') {
        _mm.search_submit();
      }
    };

    _mm.search_toggle = function () {
      if (_mm.node.search_form) {
        _mm.node.search_form.classList.toggle('hvut-none');
        return;
      }
      _mm.node.search_form = $element('div', _mm.node.bottom, null, { keydown: (e) => { _mm.search_keydown(e); } });
      $input(['button', '关闭'], _mm.node.search_form, null, () => { _mm.search_toggle(); });

      if (_server.isekai) {
        const seasons = Array.from(_mm.db.database.objectStoreNames);
        _mm.node.search_season = $input(['select', seasons], _mm.node.search_form);
        _mm.node.search_season.value = _server.season;
      }
      _mm.node.search_filter = $input(['select', [':all', 'inbox', 'read', 'sent']], _mm.node.search_form);
      _mm.node.search_name = $input('text', _mm.node.search_form, { placeholder: 'User', style: 'width: 120px;' });
      _mm.node.search_subject = $input('text', _mm.node.search_form, { placeholder: 'Subject', style: 'width: 120px;' });
      _mm.node.search_text = $input('text', _mm.node.search_form, { placeholder: 'Text', style: 'width: 120px;' });
      _mm.node.search_attach = $input('text', _mm.node.search_form, { placeholder: 'Attachment', style: 'width: 120px;' });
      _mm.node.search_cod = $input('text', _mm.node.search_form, { placeholder: 'CoD (min-max)', style: 'width: 100px;' });
      $input(['button', 'Search'], _mm.node.search_form, null, () => { _mm.search_submit(); });
      $input(['button', 'Close List'], _mm.node.search_form, null, () => { _mm.search_close(); });
    };

    _mm.dts = function (date, year = 2) { // date_to_string
      const d = new Date(date * 1000);
      const yy = d.getFullYear().toString().slice(-year);
      const MM = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      const HH = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${yy}-${MM}-${dd} ${HH}:${mm}`;
    };

    _mm.kill_asshole = function (obj) { // email-decode.min.js: usernames with '@' are encoded in html, then decoded
      function h(e, t, r, a) {
        for (r = '', a = '0x' + e.slice(t, t + 2) | 0, t += 2; t < e.length; t += 2) {
          r += String.fromCharCode('0x' + e.slice(t, t + 2) ^ a);
        }
        return r;
      }
      $qsa('.__cf_email__', obj).forEach((a) => {
        a.parentNode.replaceChild(document.createTextNode(h(a.dataset.cfemail, 0)), a);
      });
      return obj;
    };

    GM_addStyle(/*css*/`
      #mmail_outerlist { margin: 10px; overflow-y: scroll; }
      #mmail_list { display: none; }
      #mmail_pager { display: none; }

      .hvut-mm-list { table-layout: fixed; border-collapse: collapse; margin: 0 auto 10px 0; width: 1180px; font-size: 10pt; line-height: 22px; text-align: left; white-space: nowrap; }
      .hvut-mm-list tr:hover { background-color: #ddd; }
      .hvut-mm-list tr > td:hover { background-color: #fff; }
      .hvut-mm-list tr:first-child > td { border-top: 1px solid; background-color: #edb; font-weight: bold; text-align: center; }
      .hvut-mm-list td { padding: 1px 5px; border-bottom: 1px solid; overflow: hidden; text-overflow: ellipsis; }
      .hvut-mm-list td:nth-child(1) { width: 140px; }
      .hvut-mm-list td:nth-child(1) > span { padding: 1px 3px; border: 1px solid; font-weight: bold; }
      .hvut-mm-list td:nth-child(3) { width: 300px; }
      .hvut-mm-list td:nth-child(4) { width: 80px; text-align: right; }
      .hvut-mm-list td:nth-child(4) > span { color: #03c; }
      .hvut-mm-list td:nth-child(5) { width: 100px; text-align: center; }
      .hvut-mm-list td:nth-child(6) { width: 100px; text-align: center; }

      .hvut-mm-list td:nth-child(2) > a { display: block; text-decoration: none; cursor: pointer; }
      .hvut-mm-list tr:hover > td:nth-child(2) > a { text-decoration: underline; }
      .hvut-mm-list td:nth-child(3) > span { display: block; }
      .hvut-mm-attach-e { color: #c00; }
      .hvut-mm-attach-e > a { color: inherit; }
      .hvut-mm-attach-c { color: #03f; }
      .hvut-mm-attach-h { color: #c0c; }
      .hvut-mm-attach-i { color: #090; }

      .hvut-mm-current { background-color: #edb !important; }
      .hvut-mm-loading { margin: 20px; font-weight: bold; color: #c00; }
      .hvut-mm-returned { background-color: #eee; }
      .hvut-mm-returned * { color: #666 !important; }
      .hvut-mm-unread { background-color: #fcc; }
      .hvut-mm-nodb { background-color: #fcc; }
      .hvut-mm-removed { background-color: #eee; text-decoration: line-through; }

      .hvut-mm-bottom { position: absolute; left: 0; bottom: 8px; width: 100%; display: flex; text-align: left; }
      .hvut-mm-bottom div { position: absolute; left: 0; bottom: 0; width: 100%; background-color: #EDEBDF; }
      .hvut-mm-bottom div > *:first-child { margin-right: 80px; }

      .hvut-mm-search { position: absolute; top: 79px; left: 20px; width: 1200px; height: 580px; border: 2px solid; background-color: #EDEBDF; overflow-y: scroll; z-index: 1; }
      .hvut-mm-searching { position: absolute; top: 50%; transform: translateY(-50%); width: 100%; font-size: 10pt; font-weight: bold; color: #c00; }

      .hvut-mm-view { position: absolute; top: 81px; right: 14px; display: flex; flex-direction: column; width: 626px; height: 566px; padding: 5px; border: 2px solid; background-color: #EDEBDF; font-size: 10pt; line-height: 20px; text-align: left; z-index: 2; }
      .hvut-mm-failed { background-color: #eee; }
      .hvut-mm-view > dl { display: grid; grid-template-columns: 80px auto 80px 120px; gap: 5px; margin: 5px; text-align: center; align-items: center; }
      .hvut-mm-view dt { margin: 0; border: 1px solid; }
      .hvut-mm-view dd { margin: 0; border-bottom: 1px solid; }
      .hvut-mm-view dd:nth-of-type(2n+1) { padding: 0 5px; text-align: left; }
      .hvut-mm-rts dd:nth-of-type(1)::before { content: '[MoogleMail] '; color: #666; }
      .hvut-mm-view > textarea { flex-basis: 191px; }
      .hvut-mm-view > div { display: flex; margin: 5px 0; }
      .hvut-mm-view > ul { margin: 5px; padding: 5px; border: 1px solid; list-style: none; max-height: 242px; overflow: auto; flex-shrink: 0; }
      .hvut-mm-view li:first-child { margin-top: 0; padding: 0 0 0 5px; border: 1px solid; font-weight: bold; }
      .hvut-mm-view li:first-child > .hvut-mm-price { text-align: center; }
      .hvut-mm-view li { display: flex; margin-top: 2px; padding: 0 1px 0 6px; }
      .hvut-mm-view li span:first-child { margin-right: auto; }
      .hvut-mm-view li input { margin: 0; padding: 1px 4px; text-align: right; }
      .hvut-mm-price { width: 60px; }
      .hvut-mm-cod { width: 90px; }
      .hvut-mm-view input[data-cod-match='1'] { color: #03c; }
      .hvut-mm-view input[data-cod-match='0'] { color: #c00; }
      .hvut-mm-rts > ul input { display: none; }

      .hvut-mm-log { position: absolute; top: 81px; right: 652px; border: 2px solid; background-color: #EDEBDF; z-index: 2; }
    `);

    $id('mmail_outerlist').addEventListener('click', _mm.page_click);
    _mm.node.page_table = [];

    _mm.node.bottom = $element('div', $id('mmail_outer'), ['.hvut-mm-bottom']);
    $input(['button', '管理数据库'], _mm.node.bottom, null, () => { _mm.db.toggle(); });
    $input(['button', '搜索邮件'], _mm.node.bottom, null, () => { _mm.search_toggle(); });

    _mm.node.page_go = $input('text', _mm.node.bottom, { value: _mm.page_current, style: 'width: 30px; margin-left: auto; text-align: center;' });
    $input(['button', '前往'], _mm.node.bottom, null, () => { _mm.page_go(_mm.node.page_go.value); });
    _mm.node.page_prev = $input(['button', '上一页'], _mm.node.bottom, { disabled: true }, () => { _mm.page_load('prev'); });
    _mm.node.page_next = $input(['button', '下一页'], _mm.node.bottom, { disabled: true }, () => { _mm.page_load('next'); });

    _mm.node.search_div = $element('div', $id('mmail_outer'), ['.hvut-mm-search hvut-none'], (e) => { _mm.page_click(e); });
    _mm.node.mail_view = $element('div', $id('mmail_outer'), ['.hvut-mm-view hvut-none'], (e) => { _mm.mail_click(e); });
    _mm.node.mail_log = $element('div', $id('mmail_outer'), ['.hvut-mm-log hvut-none']).appendChild($element('textarea', null, { readOnly: true, spellcheck: false, style: 'width: 300px; height: 300px;' }));
    $mail.log = _mm.mail_log;

    _mm.db.init();
    _mm.db.open(_mm.page_init);
  }
} else
// [END 12] Bazaar - MoogleMail */


//* [13] Bazaar - Lottery
if (_query.s === 'Bazaar' && (_query.ss === 'lt' || _query.ss === 'la')) {
  if ($config.settings.lotteryNotification && $qs('img[src$="lottery_next_d.png"]')) {
    _lt.toggle = function (show) {
      _lt.json[_query.ss].hide = !show;
      $config.set('lt_notif', _lt.json, 'hvut_');
    };
    _lt.json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_');

    const div = $element('div', $id('rightpane'), ['!margin-top: 10px; color: #c00;']);
    $input(['checkbox', 'Show this lottery in the bottom bar'], div, { checked: !_lt.json[_query.ss].hide }, { change: (e) => { _lt.toggle(e.target.checked); } });
  }

  confirm_event($qs('img[src$="/lottery_golden_a.png"]'), 'click', '你确定要使用一张黄金奖券吗?');
} else
// [END 13] Bazaar - Lottery */


// Battle
if (_query.s === 'Battle') {
  GM_addStyle(/*css*/`
    #arena_list { white-space: nowrap; }
    .hvut-bt-outer #arena_list th:nth-child(2) { width: 120px; }
    .hvut-bt-outer #arena_list th:nth-child(1) { width: 474px; }
    .hvut-bt-outer #arena_list th:nth-child(3) { width: 90px; }
    .hvut-bt-outer #arena_list th:nth-child(4) { width: 90px; }
    .hvut-bt-outer #arena_list th:nth-child(5) { width: 90px; }
    .hvut-bt-outer #arena_list th:nth-child(6) { width: 90px; }
    .hvut-bt-outer #arena_list th:nth-child(7) { width: 120px; }
    .hvut-bt-outer #arena_list th:nth-child(8) { width: 90px; }
    #arena_list th:nth-child(8) > input { width: 80px; }
    #arena_list td > div { width: 100% !important; left: 0; }

    .hvut-bt-on #arena_list tr > th:nth-child(1) { width: 302px; }
    .hvut-bt-on#arena_outer #arena_list tr > *:nth-child(2),
    .hvut-bt-on#arena_outer #arena_list tr > *:nth-child(5),
    .hvut-bt-on#arena_outer #arena_list tr > *:nth-child(6),
    .hvut-bt-on#arena_outer #arena_list tr > *:nth-child(7) { display: none; }
    .hvut-bt-on#rob_outer #arena_list tr > *:nth-child(2),
    .hvut-bt-on#rob_outer #arena_list tr > *:nth-child(4),
    .hvut-bt-on#rob_outer #arena_list tr > *:nth-child(5),
    .hvut-bt-on#rob_outer #arena_list tr > *:nth-child(7) { display: none; }

    #equipselect_outer { width: 100% !important; margin: 0 !important; }
    #equipselect_right { width: 600px; }
    .hvut-bt-left #equipselect_right { order: -1; }

    #equipinfo { visibility: hidden; background-color: #EDEBDFCC; order: 1; z-index: 1; display: flex; flex-flow: column; justify-content: center; align-items: center; backdrop-filter: blur(1px); }
    #equipinfo > div { width: 420px; border: 1px solid; background-color: #E3E0D1; }
    #equipselect_left:hover + #equipselect_right #equipinfo { visibility: visible; }
    #itemlist { min-height: 40px; padding: 20px; overflow: auto; }
  `);

  _ar.split_colspan = function (table) {
    $qsa('td[colspan="2"]', table).forEach((td) => {
      td.removeAttribute('colspan');
      $element('td', [td, 'beforebegin'], '-');
    });
  };

  //* [14] Battle - Arena
  if (_query.ss === 'ar') {
    _ar.split_colspan($id('arena_list'));
    $element('div', [$id('mainpane'), 'afterbegin'], ['#arena_outer']).append($id('arena_list'));
    $battle.init($qs('#arena_outer'));
    toggle_button($input('button', $id('arena_list').rows[0].cells[7]), '详细信息', '折叠', $battle.node.outer, 'hvut-bt-on');
  } else
  // [END 14] Battle - Arena */


  //* [15] Battle - Ring of Blood
  if (_query.ss === 'rb') {
    _ar.split_colspan($id('arena_list'));
    $element('div', [$id('mainpane'), 'afterbegin'], ['#rob_outer']).append($id('arena_list'), $id('arena_tokens'));
    $battle.init($qs('#rob_outer'));
    toggle_button($input('button', $id('arena_list').rows[0].cells[7]), '详细信息', '折叠', $battle.node.outer, 'hvut-bt-on');
  } else
  // [END 15] Battle - Ring of Blood */


  //* [16] Battle - Tower
  if (_query.ss === 'tw') {
    $battle.init($qs('#towerstart'));
  } else
  // [END 16] Battle - Tower */


  //* [17] Battle - GrindFest
  if (_query.ss === 'gr') {
    $battle.init($qs('#grindfest'));
  } else
  // [END 17] Battle - GrindFest */


  //* [18] Battle - Item World
  if (_query.ss === 'iw') {
    $equip.list.table($qs('#equiplist > table'));
    $id('equipaction').prepend($id('equipblurb').lastElementChild);
    $id('equipselect_outer').appendChild($id('confirm_outer'));
    $battle.init($qs('#equipselect_outer'));
  } else
  // [END 18] Battle - Item World */

  // eslint-disable-next-line brace-style
  {} // END OF [else if]; DO NOT REMOVE THIS LINE!
} else
// Battle


//* [10] Armory
if (_query.s === 'Bazaar' && _query.ss === 'am' && $id('equiplist')) {
  const $armory = {

    filters: ['weapon_1handed', 'weapon_2handed', 'weapon_staff', 'shield', 'armor_cloth', 'armor_light', 'armor_heavy'],
    quality: { 'Crude': 1, 'Fair': 2, 'Average': 3, 'Superior': 4, 'Exquisite': 5, 'Magnificent': 6, 'Legendary': 7, 'Peerless': 8 },
    material_type: { 'One-handed Weapon': 'Metal', 'Two-handed Weapon': 'Metal', 'Staff': 'Wood', 'Shield': 'Wood', 'Force Shield': 'Metal', 'Cloth Armor': 'Cloth', 'Light Armor': 'Leather', 'Heavy Armor': 'Metal' },
    core_type: { 'One-handed Weapon': 'Weapon', 'Two-handed Weapon': 'Weapon', 'Staff': 'Staff', 'Shield': 'Armor', 'Cloth Armor': 'Armor', 'Light Armor': 'Armor', 'Heavy Armor': 'Armor' },
    rarity: ['Force Shield', 'Phase', 'Shade', 'Power', 'Reactive'],
    equiplist: [],
    equipdata: $config.get('equipdata', { version: 1 }),
    eqitems: {},
    itemdata: {},
    prices: $price.get('Materials'),
    node: {
      table: $qs('#equiplist > table'),
      submit: {},
    },

    click: function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action } = target.dataset;
      if (action === 'stop') {
        e.stopPropagation();
      }
    },

    page: {
      init: function (doc, screen, assign) {
        $armory.postoken = $id('equipform', doc).elements.postoken?.value;
        $armory.node.submit[screen] = $id('equipsubmit', doc);
        $armory.script.parse(doc, screen, assign);
      },
      load: async function (screen, filter, assign) {
        const html = await $ajax.fetch(`?s=Bazaar&ss=am&screen=${screen}&filter=${filter}`);
        const doc = $doc(html);
        $armory.page.init(doc, screen, assign);
        const table = $qs('#equiplist > table', doc);
        return table;
      },
    },

    script: {
      parse: function (doc, screen, assign) {
        let json;
        if (!doc) {
          json = {
            dynjs_eqstore: typeof dynjs_eqstore !== 'undefined' && dynjs_eqstore,
            eqitems: typeof eqitems !== 'undefined' && eqitems,
            itemdata: typeof itemdata !== 'undefined' && itemdata,
          };
        } else {
          const script = $qs('#equipform ~ script:last-child', doc);
          if (!script) {
            return;
          }
          const html = script.innerHTML;
          json = {
            dynjs_eqstore: JSON.parse(/dynjs_eqstore\s?=\s?(\{.*?\});/.exec(html)?.[1] || null),
            eqitems: JSON.parse(/eqitems\s?=\s?(\{.*?\});/.exec(html)?.[1] || null),
            itemdata: JSON.parse(/itemdata\s?=\s?(\{.*?\});/.exec(html)?.[1] || null),
          };
        }
        if (!$armory.eqitems[screen]) {
          $armory.eqitems[screen] = {};
        }
        Object.assign($equip.dynjs_eqstore, json.dynjs_eqstore); // purchase
        Object.assign($armory.eqitems[screen], json.eqitems); // c:purchase price, c:sell price, m:salvage materials, c:remains price
        Object.assign($armory.itemdata, json.itemdata); // salvage (item inventory)

        if (assign) {
          $armory.script.assign(json);
        }
      },
      assign: function (json) { // cannot access const/let using unsafeWindow[]
        if (json.dynjs_eqstore) {
          if (typeof dynjs_eqstore === 'undefined') { dynjs_eqstore = {}; }
          Object.assign(dynjs_eqstore, json.dynjs_eqstore);
        }
        if (json.eqitems) {
          if (typeof eqitems === 'undefined') { eqitems = {}; }
          Object.assign(eqitems, json.eqitems);
        }
        if (json.itemdata) {
          if (typeof itemdata === 'undefined') { itemdata = {}; }
          Object.assign(itemdata, json.itemdata);
        }
      },
    },

    calc: {
      materials: function (eq) {
        const materials = {};
        const q = $armory.quality[eq.info.quality];
        const t = $armory.material_type[eq.info.type] || $armory.material_type[eq.info.category];
        const c = $armory.core_type[eq.data.category];
        const r = $armory.rarity.includes(eq.info.type);
        const p = eq.data.sell_price || eq.data.purchase_price / 5;

        if (!q) { // obsolete or unknown
        } else if (q < 4) {
          const scrap = 'Scrap ' + t;
          materials[scrap] = Math.min(10, Math.ceil(p / 100));
        } else {
          const mat = ((q === 4) ? 'Low-Grade ' : (q === 5) ? 'Mid-Grade ' : 'High-Grade ') + (t === 'Metal' ? 'Metals' : t);
          materials[mat] = _server.persistent ? 1 : (q === 4) ? 3 : (q === 5) ? 2 : 1;
        }
        if (q >= 7) {
          const core = ((q === 7) ? 'Legendary ' : 'Peerless ') + c + ' Core';
          materials[core] = r ? 5 : 1;
        }
        if (r) {
          const cell = 'Energy Cell';
          materials[cell] = 1;
        }

        return materials;
      },
      value: function (materials) {
        let value = 0;
        Object.entries(materials).forEach(([id, count]) => {
          const name = $armory.itemdata[id]?.n || id;
          let price = $armory.prices[name] || 0;
          if ($config.settings.equipmentShopPriceDeductFee) {
            price = Math.floor(price * 0.99);
          }
          value += price * count;
        });
        return value;
      },
      update: function (equiplist = $armory.equiplist) {
        $armory.prices = $price.get('Materials');
        equiplist.forEach((eq) => {
          const eqitems_sell = $armory.eqitems.sell?.[eq.info.eid];
          if (eqitems_sell) {
            eq.data.sell_price = eqitems_sell.c;
          } else {
            eq.data.sell_price = undefined;
          }
          if (eq.node.sell_price && eq.data.sell_price !== undefined) {
            eq.node.sell_price.textContent = eq.data.sell_price.toLocaleString() + ' C';
          }

          const eqitems_salvage = $armory.eqitems.salvage?.[eq.info.eid];
          if (eqitems_salvage) {
            eq.data.salvage_value = $armory.calc.value(eqitems_salvage.m) + eqitems_salvage.c;
          } else {
            const materials = $armory.calc.materials(eq);
            eq.data.salvage_value = $armory.calc.value(materials);
          }
          if (eq.node.salvage_value) {
            eq.node.salvage_value.textContent = eq.data.salvage_value.toLocaleString() + ' V';
          }

          if (eq.node.salvage_value && eq.node.sell_price) {
            if (eq.data.salvage_value > eq.data.sell_price) {
              eq.node.salvage_value.classList.add('hvut-eqp-profit');
            } else {
              eq.node.salvage_value.classList.remove('hvut-eqp-profit');
            }
          }
          if (eq.node.salvage_value && eq.node.purchase_price) {
            if (eq.data.salvage_value > eq.data.purchase_price) {
              eq.node.salvage_value.classList.add('hvut-eqp-profit');
            } else {
              eq.node.salvage_value.classList.remove('hvut-eqp-profit');
            }
          }
        });
      },
      edit: function () {
        $armory.calc.update();
        if (_query.screen === 'purchase') {
          $armory.filter.bazaar($armory.equiplist, $armory.node.table);
        }
      },
    },

    integrate: {
      init: function (screen) {
        $armory.node.table.tBodies[0].remove();
        $armory.equiplist = [];
        $armory.filters.forEach((filter) => {
          $armory.integrate.load(screen, filter);
        });
      },
      load: async function (screen, filter) {
        const holder = $element('tbody', $armory.node.table, [`/<tr class="hvut-eqp-category"><td colspan="10">Loading... [${filter}]</td></tr>`]);
        const table = await $armory.page.load(screen, filter, true);
        const equiplist = $equip.list.table(table);
        if (equiplist.length) {
          $armory.equiplist = $armory.equiplist.concat(equiplist);
          $armory.modify[screen]?.(equiplist, table, filter);
          if (!$id('equipcount')) {
            $qs('.eqselall').replaceWith($qs('.eqselall', table));
          }
          holder.replaceWith(table.tBodies[0]);
        } else {
          holder.remove();
        }
        $armory.filter.update();
      },
      tab: function () {
        const a = $element('a', [$id('filterbar'), 1], { href: `?s=Bazaar&ss=am&screen=${_query.screen}&filter=all` });
        const div = $element('div', a, 'All');
        if (_query.filter === 'all') {
          const cfbs = $qs('#filterbar .cfbs');
          cfbs.classList.remove('cfbs');
          cfbs.classList.add('cfb');
          div.classList.add('cfbs');
        } else {
          div.classList.add('cfb');
        }
      },
    },

    modify: {
      organize: function (equiplist = $armory.equiplist) {
        $armory.modify.info(equiplist);
        equiplist.forEach((eq) => {
          const td = $element('td', eq.node.elem, { className: 'hvut-eqp-note', dataset: { action: 'stop' } });
          eq.node.note = $input('text', td, { placeholder: '@price, $note' });
          const data = $armory.equipdata[eq.info.eid];
          eq.node.note.value = $armory.equipcode.stringify(data);
        });
      },
      modify: function (equiplist = $armory.equiplist) {
        $armory.modify.info(equiplist);
      },
      info: function (equiplist = $armory.equiplist) {
        equiplist.forEach((eq) => {
          eq.node.upgrade = eq.node.elem.lastElementChild;
          eq.node.upgrade.classList.add('hvut-eqp-upgrade');
          if (eq.info.upgrade_max && eq.node.level) {
            eq.node.level.textContent = `${eq.info.upgrade} / ${eq.info.iw}`;
            eq.node.upgrade.textContent = '';
          }
        });
      },
      purchase: function (equiplist = $armory.equiplist, table = $armory.node.table, filter = _query.filter) {
        if (filter === 'salvaged') {
          return;
        }
        equiplist.forEach((eq) => {
          const eqitems_purchase = $armory.eqitems.purchase[eq.info.eid];
          eq.data.purchase_price = eqitems_purchase.c;
          const tr = eq.node.wrapper;
          eq.node.salvage_value = $element('td', [tr.lastElementChild, 'beforebegin']);
          eq.node.purchase_price = tr.lastElementChild;
        });
        $armory.calc.update(equiplist);
        $armory.filter.bazaar(equiplist, table);
      },
      sell: async function (equiplist = $armory.equiplist, table = $armory.node.table, filter = _query.filter) {
        if (filter === 'salvaged') {
          return;
        }
        equiplist.forEach((eq) => {
          const eqitems_sell = $armory.eqitems.sell[eq.info.eid];
          eq.data.sell_price = eqitems_sell.c;
          const tr = eq.node.wrapper;
          eq.node.salvage_value = $element('td', [tr.lastElementChild, 'beforebegin'], '...');
          eq.node.sell_price = tr.lastElementChild;
        });
        $armory.filter.protect(equiplist, table);
        await $armory.page.load('salvage', filter);
        $armory.calc.update(equiplist);
      },
      salvage: async function (equiplist = $armory.equiplist, table = $armory.node.table, filter = _query.filter) {
        $armory.modify.info(equiplist);
        equiplist.forEach((eq) => {
          const tr = eq.node.wrapper;
          eq.node.salvage_value = $element('td', tr, '...');
          eq.node.sell_price = $element('td', tr, '...');
        });
        $armory.calc.update(equiplist);
        $armory.filter.protect(equiplist, table);
        await $armory.page.load('sell', filter);
        $armory.calc.update(equiplist);
      },
    },

    filter: {
      status: true,
      on: function (equiplist = $armory.equiplist) {
        $armory.filter.status = true;
        $armory.node.table.classList.add('hvut-eqp-filter-on');
        equiplist.forEach((eq) => {
          eq.node.check.name = eq.data.filtered ? 'eqids[]' : '';
        });
        $armory.filter.update();
      },
      off: function (equiplist = $armory.equiplist) {
        $armory.filter.status = false;
        $armory.node.table.classList.remove('hvut-eqp-filter-on');
        equiplist.forEach((eq) => {
          eq.node.check.name = 'eqids[]';
        });
        $armory.filter.update();
      },
      toggle: function () {
        if ($armory.filter.status) {
          $armory.filter.off();
        } else {
          $armory.filter.on();
        }
      },
      update: function () {
        // _window.selectable_count
        selectable_count = $armory.equiplist.filter((eq) => eq.node.check.name === 'eqids[]' && !eq.node.wrapper.dataset.eqprotect).length;
        $armory.select.update();
      },
      protect: function (equiplist, table) {
        if (!$armory.node.protected) {
          $armory.node.protected = $element('tbody', [$armory.node.table, 1], ['/<tr class="hvut-eqp-category"><td colspan="10">Protected Equipment</td></tr>']);
        }
        equiplist.forEach((eq) => {
          eq.data.protected = eq.info.protected || eq.info.pinned || $equip.filter.equip($config.settings.equipmentShopProtectFilters, eq);
          if (eq.data.protected) {
            $armory.node.protected.appendChild(eq.node.wrapper);
          }
        });
        $armory.filter.category(table, 'remove');
        $armory.node.table.classList.add('hvut-eqp-filter-on');
        if ($config.settings.equipmentShopAutoProtect) {
          const equips = equiplist.filter((eq) => eq.data.protected && !eq.info.protected);
          $armory.submit.organize(equips, 'protected');
        }
      },
      bazaar: function (equiplist, table) {
        const all = $config.settings.equipmentShopBazaarFilters.length === 0;
        equiplist.forEach((eq) => {
          eq.data.filtered = all || $equip.filter.equip($config.settings.equipmentShopBazaarFilters, eq) || eq.data.salvage_value > eq.data.purchase_price;
          if (eq.data.filtered) {
            eq.node.wrapper.classList.remove('hvut-eqp-hidden');
          } else {
            eq.node.wrapper.classList.add('hvut-eqp-hidden');
          }
        });
        $armory.filter.category(table);
        if ($armory.filter.status) {
          $armory.filter.on(equiplist);
        }
      },
      category: function (table) {
        function find(selector) {
          $qsa(selector, table).forEach((tr) => {
            let next = tr;
            let visible = false;
            while ((next = next.nextElementSibling)) {
              if (next.matches(selector)) {
                break;
              }
              if (!next.dataset.eid) {
                continue;
              }
              if (next.classList.contains('hvut-eqp-hidden')) {
                continue;
              }
              visible = true;
              break;
            }
            if (visible) {
              tr.classList.remove('hvut-eqp-hidden');
            } else {
              tr.classList.add('hvut-eqp-hidden');
            }
          });
        }
        find('.hvut-eqp-category');
        find('.hvut-eqp-type');
      },
    },

    select: {
      all: function () {
        const eqselall = $qs('.eqselall input[type="checkbox"]');
        if (!eqselall) {
          return;
        }
        const checked = !eqselall.checked;
        //eqselall.checked = checked;
        $armory.equiplist.forEach((eq) => {
          if (!eq.node.check.name || eq.node.wrapper.dataset.eqprotect) {
            eq.node.check.checked = false;
          } else {
            eq.node.check.checked = checked;
          }
        });
        $armory.select.update();
      },
      call: function (type) {
        const func = $armory.select[type];
        $armory.equiplist.forEach((eq) => {
          eq.node.check.checked = func(eq);
        });
        $armory.select.update();
      },
      invert: function (eq) {
        return !eq.node.check.checked;
      },
      tradeables: function (eq) {
        return eq.info.tradeable;
      },
      purchase_salvage: function (eq) {
        return eq.data.salvage_value > eq.data.purchase_price && eq.node.check.name === 'eqids[]';
      },
      sell: function (eq) {
        return eq.data.sell_price >= (eq.data.salvage_value || 0) && !eq.data.protected && !eq.info.protected && !eq.info.locked && !eq.info.stored;
      },
      salvage: function (eq) {
        return eq.data.salvage_value > (eq.data.sell_price || 0) && !eq.data.protected && !eq.info.protected && !eq.info.locked && !eq.info.stored;
      },
      update: function () {
        const dummy = $id('equipcount') ? null : $element('label', $id('equipform'), ['#equipcount', '.hvut-none']);
        // _window.curr_hover_eqid
        curr_hover_eqid = 0; // prevent an error at update_iteminfo() / hveqc.js
        _window.update_selected_count();
        dummy?.remove();
      },
    },

    submit: {
      confirm: function (action, ...param) {
        if ($id('equipsubmit').disabled) {
          return;
        }
        const screen = (action === 'purchase_salvage') ? 'purchase' : action;
        const submit_button = $armory.node.submit[screen]?.cloneNode(true);
        if (!submit_button || $config.settings.equipmentShopConfirm === 2) {
          const equips = $armory.submit.selected();
          $armory.submit[action](equips, ...param);
          return;
        }
        submit_button.disabled = false;
        submit_button.style.display = 'none';
        $id('equipform').appendChild(submit_button);
        submit_button.click();
        submit_button.remove();
        const confirm_button = $id('confirm_button');
        if ($config.settings.equipmentShopConfirm === 1) {
          $qsa('#confirm_body input[type="checkbox"]').forEach((c) => { c.click(); });
        }
        confirm_button.addEventListener('click', (e) => {
          e.preventDefault();
          $id('confirm_close')?.click();
          const equips = $armory.submit.selected();
          $armory.submit[action](equips, ...param);
        });
        confirm_button.focus();
      },
      button: function () {
        const equipsubmit = $id('equipsubmit');
        if (!equipsubmit) {
          return;
        }
        equipsubmit.addEventListener('click', () => {
          const confirm_button = $id('confirm_button');
          if (!confirm_button) {
            return;
          }
          if ($config.settings.equipmentShopConfirm === 2) {
            confirm_button.disabled = false;
            confirm_button.click();
          } else if ($config.settings.equipmentShopConfirm === 1) {
            $qsa('#confirm_body input[type="checkbox"]').forEach((c) => { c.click(); });
          }
        });
      },
      organize: async function (equips, set) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return;
        }
        const set_pinned = (set === 'pinned') ? 1 : 0;
        const set_stored = (set === 'stored') ? 1 : 0;
        const set_locked = (set === 'locked') ? 2 : (set === 'protected') ? 1 : 0;
        const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=organize', data + `&set_pinned=${set_pinned}&set_stored=${set_stored}&set_locked=${set_locked}`);
        const doc = $doc(html);
        $armory.submit.message(doc);
        $armory.submit.status(equips, set);
      },
      purchase: async function (equips) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return;
        }
        const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=purchase', data);
        const doc = $doc(html);
        $armory.submit.message(doc);
        $armory.submit.remove(equips);
      },
      sell: async function (equips) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return;
        }
        const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=sell', data);
        const doc = $doc(html);
        $armory.submit.message(doc);
        $armory.submit.remove(equips);
      },
      salvage: async function (equips) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return;
        }
        const html = await $ajax.fetch('?s=Bazaar&ss=am&screen=salvage', data + '&sell_salvage=on');
        const doc = $doc(html);
        $armory.submit.message(doc);
        $armory.submit.remove(equips);
      },
      purchase_salvage: async function (equips) {
        await $armory.submit.purchase(equips);
        await $armory.submit.salvage(equips);
      },
      selected: function (equips) {
        if (!equips) {
          equips = $armory.equiplist;
        }
        equips = equips.filter((eq) => eq.node.check.checked && eq.node.check.name === 'eqids[]');
        return equips;
      },
      data: function (equips) {
        if (!equips.length) {
          return null;
        }
        const eqids = equips.map((eq) => `eqids[]=${eq.info.eid}`).join('&');
        const data = `postoken=${$armory.postoken}&${eqids}`;
        return data;
      },
      message: function (doc) {
        const outer = $id('messagebox_outer', doc);
        if (!outer) {
          return;
        }
        outer.addEventListener('click', () => { outer.remove(); });
        $id('mainpane').prepend(outer);
      },
      status: function (equips, set) {
        const list = ['equipped', 'stored', 'pinned', 'protected', 'locked', 'highlevel'];
        equips.forEach((eq) => {
          eq.info[set] = true;
          if (set === 'protected') {
            eq.info.locked = false;
          } else if (set === 'locked') {
            eq.info.protected = false;
          }
          const text = list.filter((s) => eq.info[s]).map((s) => $equip.icon[s]).join('');
          if (!eq.node.status) {
            const label = eq.node.check.parentNode;
            label.lastChild.remove();
            eq.node.status = $element('a', label);
            $element('', label, eq.info.name || eq.info.customname);
          }
          eq.node.status.textContent = ` ${text} `;
        });
      },
      remove: function (equips) {
        equips.forEach((eq) => {
          eq.node.check.name = '';
          eq.node.wrapper.remove();
        });
        $armory.filter.update();
      },
    },

    equipcode: {
      save: function () {
        if (_query.filter === 'all') {
          $armory.equipdata = { version: $armory.equipdata.version };
        }
        $armory.equiplist.forEach((eq) => {
          const data = $armory.equipcode.parse(eq.node.note.value);
          $armory.equipdata[eq.info.eid] = { checked: eq.node.check.checked, ...data };
        });
        $config.set('equipdata', $armory.equipdata);
      },
      load: function () {
        $armory.equiplist.forEach((eq) => {
          const data = $armory.equipdata[eq.info.eid] || {};
          eq.node.check.checked = data.checked;
          eq.node.note.value = $armory.equipcode.stringify(data);
        });
      },
      parse: function (text) {
        const exec = /^(?:@([^,;]+)(?:\s*[,;])?)?\s*(?:(\$featured)(?:\s*[,;])?)?(.*)/.exec(text);
        const data = {
          price: exec[1]?.trim() || '',
          featured: !!exec[2],
          note: exec[3]?.trim() || '',
        };
        return data;
      },
      stringify: function (data = {}) {
        const array = [];
        if (data.price) {
          array.push(`@${data.price}`);
        }
        if (data.featured) {
          array.push('$featured');
        }
        if (data.note) {
          array.push(data.note);
        }
        const text = array.join(', ');
        return text;
      },
      code: function () {
        const equiplist = $armory.equiplist.filter((e) => e.node.check.checked);
        const eid_maxlen = Math.max(...equiplist.map((e) => e.info.eid.toString().length));
        let code = '';
        let code_featured = '';

        $equip.sort(equiplist);
        equiplist.forEach((eq, i, a) => {
          const p = a[i - 1] || { info: {} };
          if (eq.info.category !== p.info.category) {
            const category = eq.info.category;
            code += `\n\n\n[size=3][b][${category}][/b][/size]\n`;
          }

          switch (eq.info.category) {
            case 'One-handed Weapon':
            case 'Two-handed Weapon':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code += `\n\n[size=2][b][${type}][/b][/size]\n\n`;
              } else if (eq.info.suffix !== p.info.suffix) {
                code += '\n';
              }
              break;
            case 'Staff':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code += `\n\n[size=2][b][${type}][/b][/size]\n\n`;
              } else if (eq.info.prefix !== p.info.prefix) {
                code += '\n';
              }
              break;
            case 'Shield':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code += `\n\n[size=2][b][${type}][/b][/size]\n\n`;
              }
              break;
            case 'Cloth Armor':
              if (eq.info.suffix !== p.info.suffix) {
                const type = eq.info.type ? (eq.info.suffix || 'suffixless') : 'Unknown';
                code += `\n\n[size=2][b][${type}][/b][/size]\n\n`;
              } else if (eq.info.slot !== p.info.slot) {
              //code += '\n';
              }
              break;
            case 'Light Armor':
            case 'Heavy Armor':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code += `\n\n[size=2][b][${type}][/b][/size]\n\n`;
              } else if (eq.info.slot !== p.info.slot) {
                code += '\n';
              }
              break;
          }

          eq.data._eid = eq.info.eid.toString();
          const eid_len = eq.data._eid.length;
          if (eid_maxlen > eid_len) {
            eq.data._eid = '[color=transparent]' + '_'.repeat(eid_maxlen - eid_len) + '[/color]' + eq.data._eid;
          }
          if (!eq.data.url) {
            eq.data.url = `${location.origin}${location.pathname}equip/${eq.info.eid}/${eq.info.key}`;
          }
          //if (!eq.data.namecode) {
          $equip.namecode(eq);
          //}
          const data = $armory.equipcode.parse(eq.node.note.value);
          Object.assign(eq.data, data);

          const equipcode = $config.settings.equipCode.replace(/\{\$(\w+)(\s*\?(.*?)(?::(.*?))?)?\}/g, (s, k, e, t, f) => {
            const v = (k in eq.data) ? eq.data[k] : (k in eq.info) ? eq.info[k] : '';
            if (!e) {
              return v ?? '';
            } else {
              const r = v ? t : f || '';
              return r.replace(/\$(\w+)/g, (s, k) => { const v = (k in eq.data) ? eq.data[k] : (k in eq.info) ? eq.info[k] : ''; return v ?? ''; });
            }
          }).trim();

          code += equipcode + '\n';
          if (eq.data['featured']) {
            code_featured += equipcode + '\n';
          }
        });

        if (code_featured) {
          code = '\n\n\n[size=3][b][Featured][/b][/size]\n\n' + code_featured + code;
        }
        popup_text(code.trim() || '未选中装备.', 900, 500);
      },
    },

  };

  GM_addStyle(/*css*/`
    .armory_tab { padding: 12px 5px; }
    .hvut-am-side { width: 85px; margin-top: -100px; margin-left: 1230px; }
    .hvut-eqp-level ~ .hvut-eqp-upgrade { display: none; }
    .hvut-eqp-note { width: 90px; }
    .hvut-eqp-note input { width: 80px; margin: 0; font-size: 9pt; }
  `);

  $armory.node.side = $element('div', $id('armory_left').lastElementChild, ['.hvut-side hvut-am-side']);
  $armory.page.init(null, _query.screen);
  $armory.equiplist = $equip.list.table($armory.node.table);
  $armory.node.table.addEventListener('click', $armory.click, true);
  $armory.submit.button();
  //search

  if (_query.screen === 'organize') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('organize');
    } else {
      $armory.modify.organize();
    }

    $input(['button', 'Select All'], $armory.node.side, null, () => { $armory.select.all(); });
    $input(['button', 'Tradeables'], $armory.node.side, null, () => { $armory.select.call('tradeables'); });
    $input(['button', 'Invert'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.select.call('invert'); });
    $input(['button', 'Equip Code'], $armory.node.side, null, () => { $armory.equipcode.code(); });
    $input(['button', 'Edit Format'], $armory.node.side, null, () => { $config.open('equipCode'); });
    $input(['button', 'Save'], $armory.node.side, null, () => { $armory.equipcode.save(); });
    $input(['button', 'Revert'], $armory.node.side, null, () => { $armory.equipcode.load(); });
  }

  if (_query.screen === 'modify') {
    $armory.modify.modify();
  }

  if (_query.screen === 'purchase') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('purchase');
    } else {
      $armory.modify.purchase();
    }

    $input(['button', '全选'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.select.all(); });
    $input(['button', '购买选中'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('purchase'); });
    $input(['button', '智能购买'], $armory.node.side, null, () => { $armory.select.call('purchase_salvage'); });
    $input(['button', '购买后分解'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('purchase_salvage'); });
    toggle_button($input('button', $armory.node.side), '过滤器: 开启', '过滤器: 关闭', $armory.node.table, 'hvut-eqp-filter-on', '', () => { $armory.filter.toggle(); });
    $input(['button', '过滤规则'], $armory.node.side, null, () => { $config.open('equipmentShopBazaarFilters'); });
    $input(['button', '材料价格'], $armory.node.side, null, () => { $price.edit('Materials', 'ma', $armory.calc.edit); });
  }

  if (_query.screen === 'sell') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('sell');
    } else {
      $armory.modify.sell();
    }

    $input(['button', '全选'], $armory.node.side, null, () => { $armory.select.all(); });
    $input(['button', '锁定'], $armory.node.side, null, () => { $armory.submit.confirm('organize', 'locked'); });
    $input(['button', '存仓'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('organize', 'stored'); });
    $input(['button', '智能出售'], $armory.node.side, null, () => { $armory.select.call('sell'); });
    $input(['button', '出售'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('sell'); });
    $input(['button', '智能分解'], $armory.node.side, null, () => { $armory.select.call('salvage'); });
    $input(['button', '分解'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('salvage'); });
    $input(['button', '编辑过滤器'], $armory.node.side, null, () => { $config.open('equipmentShopProtectFilters'); });
    $input(['button', '编辑材料价格'], $armory.node.side, null, () => { $price.edit('Materials', 'ma', $armory.calc.edit); });
  }

  if (_query.screen === 'salvage') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('salvage');
    } else {
      $armory.modify.salvage();
    }

    $input(['button', 'Select All'], $armory.node.side, null, () => { $armory.select.all(); });
    $input(['button', 'Lock'], $armory.node.side, null, () => { $armory.submit.confirm('organize', 'locked'); });
    $input(['button', 'Store'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('organize', 'stored'); });
    $input(['button', 'Select:'], $armory.node.side, null, () => { $armory.select.call('sell'); });
    $input(['button', 'Sell'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('sell'); });
    $input(['button', 'Select:'], $armory.node.side, null, () => { $armory.select.call('salvage'); });
    $input(['button', 'Salvage'], $armory.node.side, { className: 'hvut-side-margin' }, () => { $armory.submit.confirm('salvage'); });
    $input(['button', 'Edit Filters'], $armory.node.side, null, () => { $config.open('equipmentShopProtectFilters'); });
    $input(['button', 'Item Prices'], $armory.node.side, null, () => { $price.edit('Materials', 'ma', $armory.calc.edit); });
  }

  const onkeydown = document.onkeydown;
  if (onkeydown) {
    document.onkeydown = (e) => { if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') { return; } onkeydown(e); };
  }
  //document.addEventListener('keydown', (e) => { if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') { e.stopPropagation(); } }, true);
} else
// [END 10] Armory */

// eslint-disable-next-line brace-style
{} // END OF [else if]; DO NOT REMOVE THIS LINE!


/* END */