// file-size-gate: exempt
/* eslint-disable */
// ============================================================================
// HentaiVerse 界面汉化 (indefined & etc., #404118, v2025.12.02.1, 简体) [2026-06-03 移植]
//
// 来源:HentaiVerse/HentaiVerse汉化(界面).user.js(原作者 ggxxsol & NeedXuyao &
//   mbbdzz & indefined & etc.)。与 #404119(装备汉化)同作者同模式。
//
// 数据/逻辑分离:
//   - 词典数据(dictsMap + words)→ src/data/i18n/interface-dict.js
//     (INTERFACE_DICTS_MAP / INTERFACE_WORDS,逐字原样简体)
//   - 本文件:翻译应用逻辑 + 正则编译 + MutationObserver + 弹窗 hook + 原文切换。
//
// 改造要点:
// 1. 去 UserScript 头。原 IIFE 体搬进 export function initInterfaceTranslate()。
// 2. 原脚本 buildDict 直接读/改模块级 words;改读导入的 INTERFACE_WORDS
//    (ESM live binding,delete words[group][''] 这类原地变更跨模块照常生效)。
//    dictsMap → INTERFACE_DICTS_MAP。
// 3. 原脚本在模块顶层自执行的语句(弹窗 hook、战斗页判定、start()、
//    DOMContentLoaded 监听、window.translateBattle 初始化)统一移入
//    initInterfaceTranslate(),受守卫控制;函数声明/模块状态仍留模块作用域。
// 4. 守卫(同 #404119):host 含 hentaiverse.org 才跑;跳过 /equip(/|$) 与
//    showequip.php(避让 HVAA 装备百分位);try-catch 隔离,崩溃不阻断 HVAA 主逻辑。
// 5. 翻译应用机制保持原样:遍历 INTERFACE_DICTS_MAP,querySelector 命中元素后用
//    XPath 取文本节点 + input[submit].value + [title] 三路 .replace() 翻译;
//    字典数组首项为 true 的元素额外 observer.observe(childList + value/title 属性)
//    做动态翻译。覆盖 #eqch_stats(characterStatus 分区:Fighting Style / Counter-Attack
//    / Overwhelming Strikes 等)。
// ============================================================================

import { INTERFACE_DICTS_MAP, INTERFACE_WORDS } from "../data/i18n/interface-dict.js";

//原文切换功能所需变量
var translatedList = new Map(), translated = true, changer;
// translatedList格式：key:已翻译元素, value: 该元素已被翻译属性和原文键值对（目前没考虑无法直接用key赋值的属性）
//原文切换功能
function restoreTranslate() {
    translatedList.forEach((data, elem) => {
        for (var item in data) {
            [elem[item], data[item]] = [data[item], elem[item]];
        }
    });
    translated = !translated;
    changer.innerHTML = translated?'英':'中';
}
//初始化原文切换按钮
function initRestoreButton() {
    if (changer) {
        return document.body.appendChild(changer);
    }
    document.addEventListener('keydown',(ev)=>{
        if(ev.altKey&&(ev.key=='a'||ev.key=='A')) {
            restoreTranslate();
        }
    });
    if(changer=document.getElementById('change-translate')) {
        return changer.addEventListener('click',restoreTranslate);
    }
    changer = document.createElement('span');
    changer.innerHTML = "英";
    changer.title = '点击切换翻译';
    changer.id = 'change-translate';
    changer.addEventListener('click',restoreTranslate);
    changer.style.cssText = "cursor:pointer;z-index:1000;font-size: 16px;position:fixed; top:200px; left:0px; color: white;background : black";
    document.body.appendChild(changer);
}


//战斗中切换翻译，与上面功能类似，但是更改的状态会持久性存储
function changeBattleTranslate() {
    if (changer && document.body.contains(changer)) {
        if (translated) changer.click();
        window.translateBattle = translated;
        delete localStorage.translateBattle;
        document.body.removeChild(changer);
        if (window.battle && window.battle.set_infopane) window.battle.set_infopane('Battle Time');
    }
    else {
        if (changer && !translated) changer.click();
        localStorage.translateBattle = translated = window.translateBattle = true;
        start();
    }
}


////////////////////////////////////////////////////////////////////////////////
// 以下部分是正文的翻译
////////////////////////////////////////////////////////////////////////////////


var tagsWhitelist = ['TEXTAREA','SCRIPT','STYLE'],
    rIsRegexp = /^\/(.+)\/([gim]+)?$/;

// prepareRegex by JoeSimmons
// used to take a string and ready it for use in new RegExp()
function prepareRegex(string) {
    return string.replace(/([\[\]\^\&\$\.\(\)\?\/\\\+\{\}\|])/g, '\\$1');
}

// function to decide whether a parent tag will have its text replaced or not
function isTagOk(tag) {
    return !tagsWhitelist.includes(tag);
}

//翻译用到的字典变量
const regexps = new Map(); //存储转换过的字典，key值和word字典对应分组名相同，value格式见下方buildDict;

//转换字典，使用JoeSimmons的方法将字符串字典转换为带正则表达式的匹配数组
// http://userscripts-mirror.org/scripts/show/41369
function buildDict(group) {
    if (regexps.has(group)) return regexps.get(group);

    delete INTERFACE_WORDS[group][''];//删除空行
    var reg;

    const regexp = Object.entries(INTERFACE_WORDS[group]).map(([word,value])=>{
        if (reg = word.match(rIsRegexp)) {
            reg = new RegExp(reg[1], 'g')
        } else {
            reg = new RegExp(prepareRegex(word).replace(/\\?\*/g, function (fullMatch) {
                return fullMatch === '\\*' ? '*' : '[^ ]*';
            }), 'g');
        }
        return {reg, value};
    });

    regexps.set(group, regexp);

    return regexp;
}

//执行查找的xpath表达式，查找目标元素下的所有文本
var pathExpre = new XPathEvaluator().createExpression('.//text()[ normalize-space(.) != "" ]', null);
// 翻译文本，使用指定字典对指定元素下的所有文字进行翻译
// elem: 待翻译的页面元素, dict: 使用的翻译字典, dynamic: 是否动态元素
// 动态元素将不会检查内容直接翻译
function translateText(elem, dict, dynamic) {
    if (!elem || !dict) return;
    var texts = pathExpre.evaluate(elem, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0, text; text = texts.snapshotItem(i); i += 1) {
        //console.log(text.parentNode.tagName)
        if (dynamic || isTagOk(text.parentNode.tagName) ) {
            var temp = text.data;
            for(var item of dict){
                temp = temp.replace(item.reg, item.value);
            }
            if(temp!=text.data) {
                if (!translatedList.has(text)) {
                    translatedList.set(text, {data: text.data});
                }
                text.data = temp;
            }
        }
    }
}

//翻译指定元素下的所有按钮，包含自身
function translateButtons(target, dict, isDynamic) {
    if (target instanceof HTMLInputElement) translateButton(target, dict, isDynamic);
    else {
        Array.from(target.querySelectorAll('input[type="submit"]')).forEach(elem => {
            translateButton(elem, dict, isDynamic);
        });
    }
}

//翻译表单按钮
function translateButton(elem, dict, isDynamic) {
    var value = elem.value;
    for(var item of dict){
        value = value.replace(item.reg, item.value);
    }
    if(value!=elem.value) {
        if (!translatedList.has(elem)) translatedList.set(elem, {value: elem.value});
        elem.value = value;
    }
}

//翻译页面元素悬停的文字提示
function translateElemTitle(target, dict, isDynamic) {
    Array.from(target.querySelectorAll('[title]')).forEach(elem=>{
        var txt = elem.title;
        for (var item of dict) {
            txt = txt.replace(item.reg, item.value);
        }
        if (txt!=elem.title) {
            if (!translatedList.has(elem)) translatedList.set(elem, {title: elem.title});
            elem.title = txt;
        }
    });
}

//挟持浏览器弹窗方法并在弹窗之前先翻译文本，该方法独立运行
function hookAlertTranslate() {
    var alertBk = window.alert, promptBk = window.prompt, confirmBk = window.confirm;
    var dict = buildDict('alerts');
    function translateAlert(txt) {
        if (txt==undefined) return '';
        else if (translated && typeof(txt)=='string') {
            for (var item of dict) {
                txt = txt.replace(item.reg, item.value);
            }
        }
        return txt;
    }
    window.alert = function(txt) {alertBk(translateAlert(txt))}
    window.prompt = function(txt,value) {return promptBk(translateAlert(txt),value)}
    window.confirm = function(txt) {return confirmBk(translateAlert(txt))}
}

//动态元素字典、监听器，用来翻译动态变化的内容
var dynamicDict = new Map();
var observer = new MutationObserver((mutations,observer) => {
    //console.log(mutations);
    if(!translated) return;
    mutations.forEach(mutation => {
        var elem = mutation.target;
        if(elem.style.visibility!='hidden') {
            translateText(elem, dynamicDict.get(elem), true);
            translateButtons(elem, dynamicDict.get(elem), true);
            translateElemTitle(elem, dynamicDict.get(elem), true);
        }
    });
    //由于动态翻译对象在变化后不再存在于页面中，为防止性能问题翻译后清理已翻译列表
    //console.time('cleardict');
    for (const k of translatedList.keys()) {
        if (!document.contains(k)) {
            translatedList.delete(k);
        }
    }
    //console.timeEnd('cleardict');
});

function start() {
    //console.time('hvtranslate');
    //DOMContentLoaded可能触发此函数多次调用，为避免重复监听，每次启动断开旧页面监听并清除旧动态翻译字典
    observer.disconnect();
    dynamicDict.clear();
    if (!window.inBattle || window.translateBattle || window.end_time) { // end_time → riddlemaster
        //遍历分组字典
        for (const [selector, value] of Object.entries(INTERFACE_DICTS_MAP)) {
            const elem = document.body.querySelector(selector);
            if (!elem) continue;

            const isDynamic = value[0] === true;
            const dict = value.map(buildDict).flat();

            translateText(elem, dict, isDynamic); //翻译文本
            translateButtons(elem, dict, isDynamic); //翻译表单按钮
            translateElemTitle(elem, dict, isDynamic); //翻译鼠标悬停文本
            if (isDynamic) {
                dynamicDict.set(elem, dict); //存储字典以备动态翻译使用
                observer.observe(elem, {childList:true, attribute: true, attributeFilter: ['value', 'title']}); //监听翻译动态内容
            }
        }
        initRestoreButton();
    }
    //console.timeEnd('hvtranslate');
}

export function initInterfaceTranslate() {
    try {
        var p = location.pathname || "";
        if (location.host.indexOf("hentaiverse.org") === -1) return;
        // 避让 HVAA 装备百分位:跳过装备页 / 独立装备信息页
        if (/\/equip(\/|$)/.test(p)) return;
        if (/showequip\.php/.test(p)) return;

        //战斗中切换翻译，与上面功能类似，但是更改的状态会持久性存储
        window.translateBattle = !!localStorage.translateBattle;

        //挟持浏览器弹窗方法并在弹窗之前先翻译文本，该方法独立运行
        hookAlertTranslate();

        //其它脚本派发DOMContentLoaded事件可触发start调用整页重新翻译，但不保证兼容性
        document.addEventListener('DOMContentLoaded', start); // Hentaiverse Monsterbation ajax next round

        if (document.getElementById('textlog')) {
            if (document.querySelector('#expholder[title]')) return; //检测到已经有战斗汉化在运行则退出
            window.inBattle = true;
            if (!window.translateBattle) translated = false;
            // 双击信息面板提示切换战斗翻译开关
            document.addEventListener('dblclick', function(ev){
                if (ev.target && ev.target.id == 'infopane') {
                    changeBattleTranslate();
                }
            });
            document.head.appendChild(document.createElement('style')).innerHTML =
                '#change-translate{display:none;}#infopane{position:relative}' +
                '#infopane:hover::after{content:"双击此处切换战斗翻译开关";position:absolute;left:0; bottom: 5px;font-weight:bold}';
        }

        start();
    } catch (e) {
        console.error("[HVAA][ui-i18n] 出错:", e);
    }
}
