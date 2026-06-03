// file-size-gate: exempt 第三方 indefined 装备汉化原样移植
/* eslint-disable */
// 原脚本 (HV 物品装备汉化, indefined v2025.11.13) 原样搬入:头部 UserScript 注释块删除、
// 顶层 main(); 立即执行删除、L25-26 顶层 return 守卫移入 initEquipTranslate。
// 原 @exclude (*equip/* / showequip.php) 改运行时守卫复现 (见文件末尾导出函数)。

// 切换原文使用的变量
import { EQUIP_ITEMS, EQUIP_EQUIPS, EQUIP_INFO, EQUIP_EXTRA } from "../data/i18n/equip-dict.js";
import { registerRestore, ensureRestoreButton, registerRetranslate } from "./core/restore-controller.js";
import { langPostProcess } from "./core/lang-post.js";

var translatedList = new Map(), translated = true;

// 物品字典、装备字典、装备属性字典、额外内容字典，提供给translate方法第二参数做翻译字典
// 可以调用对应translateItems/translateEquips/translateEquipsInfo/translateExtra方法直接翻译页面元素
// 否则需要先调用loadItems/loadEquips/loadEquipsInfo/loadExtra加载对应字典之后才能使用translate方法
var dictItems, dictEquips, dictEquipsInfo, dictExtra;

function main(){
    var lklist = [
        'Bazaar&ss=ib', //采购机器人0
        'Bazaar&ss=is', //道具店1
        'Character&ss=it', //道具仓库2
        'Bazaar&ss=ss', //祭坛3
        'Character&ss=in', //装备仓库4
        'Character&ss=eq', //更换装备5
        'Battle&ss=iw', //iw 6
        'Bazaar&ss=es', //装备店7
        'showtopic=', //论坛汉化8
        'Forge&ss=', //锻造9
        'Bazaar&ss=mm', //邮件10
        'Bazaar&ss=lt', //武器彩票11
        'Bazaar&ss=la', //防具彩票12
        'equip', //装备属性页13
        'hvmarket.xyz', //hvmarket14
        'reasoningtheory.net', //拍卖15
        'Bazaar&ss=mk', //交易市场16
        'Bazaar&ss=am', //武器17
    ];
    var location;
    for(location = 0; location < lklist.length; location++){
        // 匹配当前网址位置，lklist里面的网址顺序和下面case对应，更改顺序需要同时更改case
        if(document.location.href.match(lklist[location])){
            break;
        }
    }

    switch (location){
        case 0: //采购机器人
            translateItems('#bot_item');
            /* eslint-disable-next-line */// 右侧已提交采购列表跳入下方物品列表等同处理
        case 1: //道具店
        case 2: //道具仓库
        case 3: //祭坛
            /*//在这一行前面加//可以同时汉化部分物品悬浮窗说明，但是与HVToolbox冲突
            translateItems(".itemlist>tbody>tr>td");
            translateItems(".sa>div:last-child");
            /*///下面两行只会翻译物品名称
            translateItems(".itemlist>tbody>tr>td>div");
            translateItems(".sa>div:last-child>div");
            //*/
            break;

        case 4: //装备仓库
        case 5: //更换装备页
        case 6: //iw
            translateEquipsList();
            break;

        case 7: //装备店
            translateEquipsList();
            if (!document.getElementById('hvut-equhide')) { // 幂等：lang 切换重翻不重复建隐藏锁定按钮
            var equipdiv, i;
            var equhide = document.createElement('span');
            equhide.id = 'hvut-equhide';
            equhide.style.cssText = "cursor: pointer;z-index: 1000;font-size: 16px;position: fixed;top: 180px;left: 0px;color: red;background: black;user-select: none;";
            try{
                if(!localStorage.hideflag) localStorage.hideflag = "隐藏锁定装备";
                if(localStorage.hideflag=="隐藏锁定装备"){
                    equhide.title = "点击显示锁定装备";
                    equipdiv = document.querySelectorAll(".il");
                    for(i = 0 ;i <equipdiv.length;i++) {
                        equipdiv[i].parentNode.style.display = "none";
                    }
                    equhide.innerHTML = "显";
                }
                else {
                    equhide.title = "点击隐藏锁定装备";
                    equhide.innerHTML = "隐";
                }
            }
            catch(e){alert(e)}
            equhide.onclick = function(){
                equipdiv = document.querySelectorAll(".il");
                this.title = "点击"+localStorage.hideflag;
                if(localStorage.hideflag=="隐藏锁定装备"){
                    equhide.innerHTML = "隐";
                    localStorage.hideflag = "显示锁定装备";
                    for(i = 0 ;i <equipdiv.length;i++) {
                        equipdiv[i].parentNode.style.display = "";
                    }
                }
                else{
                    equhide.innerHTML = "显";
                    localStorage.hideflag = "隐藏锁定装备";
                    for(i = 0 ;i <equipdiv.length;i++) {
                        equipdiv[i].parentNode.style.display = "none";
                    }
                }
            }
            document.body.appendChild(equhide);
            }
            break;

        case 8: //论坛
            var changer = ensureRestoreButton(); //原文切换按钮（统一单例）
            registerRestore(restore);
            if (!+localStorage.comfimTranslateAlert) {
                //切换原文强提示
                changer.style.width = "1em";
                changer.style.cursor = "help";
                changer.textContent = "点击切换到原文再复制内容";
                changer.title = "论坛购物务必切换回原文再复制，因为别人不一定能看懂翻译过的东西\n如果不想每次看到整句提示可以按住Ctrl双击切换按钮";
            }
            changer.ondblclick = function(ev){ev.ctrlKey && (localStorage.comfimTranslateAlert = +!+localStorage.comfimTranslateAlert)}

            loadItems(); //加载道具字典
            loadEquipsInfo(); //加载装备信息字典
            loadEquips(); //加载装备字典
            loadExtra(); //加载额外的论坛翻译字典
            var links = []; //用于暂存避免翻译的链接
            Array.from(document.getElementsByClassName('postcolor')).forEach(post=>{
                let html = post.innerHTML;
                translatedList.set(post, html); //保存原内容
                //下面一行内容为去除论坛发帖格式，对当前脚本汉化逻辑没有用处，如果想要去除的话删除下一行前面的//
                //html = html.replace(/<span [^>]+>[^>]+>/g,"").replace(/<!--[/]?color[^>]+>/g,"").replace(/<[/]*b>/g,"")
                html = html.replace(/(href|src)=".+?"/g, src=>{
                    links.push(src);
                    return 'HTRANSLATE_PLACEHOLDER_' + (links.length - 1); // 去除掉网页中的链接并暂存起来防止错误翻译
                });
                html = translate(html, dictItems); //翻译物品
                html = translate(html, dictEquipsInfo); //翻译装备属性
                html = translate(html, dictEquips); //翻译装备名
                html = translate(html, dictExtra); //翻译论坛额外内容
                html = html.replace(/HTRANSLATE_PLACEHOLDER_(\d+)/g, (match, p1)=>{
                    return links[p1]; // 还原备份的原网页中链接
                });
                post.innerHTML = langPostProcess(html);
            });
            return; //此处直接结束翻译方法，其它case结束后会检查是否有原文需要切换，论坛原文切换已经默认执行
            break;

        case 9: //锻造
            if (document.querySelector('#equip_extended')) {
                //左侧装备名
                translateEquips("#leftpane>div:not([id])");
                //左侧的装备详细面板
                translateEquipsInfo('#equip_extended');
                //右侧可强化项目
                translateEquipsInfo('#rightpane>div tr[onmouseover]>td:first-child>.fc2');
                //强化项目的说明文字
                translateEquipsInfo('#rightpane>div[id^="costpane"]>div :first-child>.fc2');
                //强化所需材料
                translateItems('#rightpane>div[id^="costpane"]>table :first-child>.fc2');
            }
            else {
                translateEquipsList();
            }
            break;

        case 10: //邮件
            translateEquips('div[onmouseover*="equips"]');//装备附件
            translateItems('div[onmouseover*="show_item"]');//物品附件
            break;

        case 11: //武器彩卷
        case 12: //防具彩卷
            translateEquips("#lottery_eqname");
            translateEquipsInfo("#lottery_eqstat");
            break;

        case 13: //装备属性页
            translateEquips('#showequip>div:not([id])');//装备名
            translateEquipsInfo('#equip_extended');//装备详细信息
            break;

        case 14: //hvmarket
            translateItems('td:nth-child(2)>a'); //物品列表
            translateExtra('div.cs'); //物品分类
            translateItems('.main_content>h1'); //购买页面标头
            translateItems('h2.exch'); //购买页面的购买描述
            break;

        case 15: //拍卖
            var table = document.querySelector('table.bidlog>:nth-child(2)');
            if (table) {
                // 翻译拍卖记录
                translateItems('td:nth-child(6)');
                translateEquips('td:nth-child(6)');
                if (!table.dataset.hvutObserved) { // 幂等：lang 切换重翻不重复建 observer
                    table.dataset.hvutObserved = '1';
                    new MutationObserver(function(){
                        // 拍卖记录自动刷新
                        translatedList.clear(); // 清空旧翻译记录
                        if (!translated) translated = -1;
                        // 重新翻译
                        translateItems('td:nth-child(6)');
                        translateEquips('td:nth-child(6)');
                        if (translated == -1) restore();
                    }).observe(table, {childList:true});
                }
            }
            else if (table = document.getElementById('itemSections')) {
                // 拍卖列表
                translateItems('td:nth-child(2)');
                translateEquips('td:nth-child(2)');
                if (!table.dataset.hvutObserved) { // 幂等：lang 切换重翻不重复建 observer
                    table.dataset.hvutObserved = '1';
                    new MutationObserver(function(){
                        // 拍卖列表自动刷新
                        translatedList.clear(); // 清空旧翻译记录
                        if (!translated) translated = -1;
                        // 重新翻译
                        translateItems('td:nth-child(2)');
                        translateEquips('td:nth-child(2)');
                        if (translated == -1) restore();
                    }).observe(table, {childList:true});
                }
            }
            else if (document.getElementById('draw')) {
                // 拍卖时间
                translateItems('.itemHeader>span>span:nth-child(2)');
                translateEquips('.itemHeader>span>span:nth-child(2)');
            }
            break;

        case 16: //交易市场
            translateItems('#market_right');
            break;

        case 17: //武器
            translateEquipsList();
            break;

        default: //没有匹配命中需要翻译的网页
            break;
    }

    if (translatedList.size) {
        ensureRestoreButton();//原文切换按钮（统一单例）
        registerRestore(restore);
    }
}

//原文切换：交换 translatedList 原文↔译文 + 翻转本模块 translated（按钮/Alt+A 归 RestoreController 单例）
//供 RestoreController 注册（按钮点击调度）与拍卖 observer 自动重翻（直接调，仅切本引擎）共用。
function restore() {
    for(var elem of translatedList) {
        translatedList.set(elem[0], elem[0].innerHTML);
        elem[0].innerHTML = elem[1];
    }
    translated = !translated;
}

/**
 * 核心翻译方法
 * 参数 target: 待翻译的页面元素或者字符串，如果是页面元素会保存原文并翻译整个元素内部，否则直接翻译字符串
 * 参数 dicts: 翻译字典，一个Map，key值为匹配表达式，value为翻译结果。
 */
function translate(target, dicts) {
    if (!target || !dicts) return;
    let html, isElem = target instanceof Element;
    if (isElem) {
        html = target.innerHTML;
        if (!translatedList.has(target)) translatedList.set(target, html); //保存原文
    }
    else html = target;
    for (var dict of dicts){ //遍历字典并翻译
        html = html.replace(dict[0], dict[1]);
    }
    if (isElem) {
        target.innerHTML = langPostProcess(html); // 译文按当前 lang 出简/繁（lang=2 由 RestoreController 还原英文）
        return target;
    }
    else return html;
}

//翻译Hentaiverse内装备列表
function translateEquipsList(){
    if (document.querySelector('.eqtplabel')){
        translateEquips('tr[onmouseover]>td:first-child');
        if (!document.getElementById('hvut-eqtp-style')) // 幂等：lang 切换重翻不重复注入
            document.head.insertAdjacentHTML('beforeend', `<style id="hvut-eqtp-style">.lc>span{left:unset;position:unset;background:unset;border:unset}.lc>span:nth-child(2){position:absolute;top:0;left:0;height:20px;width:20px;background-color:#EDEADA;border:2px solid #B5A4A4;border-radius:3px}`);
    }
    else {
        translateEquips(".equiplist div[id^='e'][onmouseover]");
    }
    translateEquips(".hvut-eq-h5");
    translateEquips(".eqb>div");
}

//翻译装备名。参数: 待翻译的页面元素css选择器
function translateEquips(selector){
    if(!selector) return;
    if (!dictEquips) loadEquips();//加载字典
    //查找页面元素并调用翻译
    Array.from(document.querySelectorAll(selector)).forEach(elem=>translate(elem, dictEquips));
}

//翻译装备属性信息
function translateEquipsInfo(selector){
    if(!selector) return;
    if (!dictEquipsInfo) loadEquipsInfo();
    Array.from(document.querySelectorAll(selector)).forEach(elem=>translate(elem, dictEquipsInfo));
}

//翻译物品
function translateItems(selector){
    if(!selector) return;
    if (!dictItems) loadItems();
    Array.from(document.querySelectorAll(selector)).forEach(elem=>translate(elem, dictItems));
}

//翻译额外内容
function translateExtra(selector){
    if(!selector) return;
    if (!dictExtra) loadExtra();
    Array.from(document.querySelectorAll(selector)).forEach(elem=>translate(elem, dictExtra));
}

function loadItems(){
    if (dictItems) return dictItems;
    //道具字典
    var items = EQUIP_ITEMS;

    dictItems = new Map();
    for(var i in items) {
        dictItems.set(new RegExp(i,'g'), items[i]);
    }
    return dictItems;
};

function loadEquipsInfo(){
    if (dictEquipsInfo) return dictEquipsInfo;
    //装备信息字典
    var equipsInfo = EQUIP_INFO;

    dictEquipsInfo = new Map();
    for(var k in equipsInfo) {
        dictEquipsInfo.set(RegExp(k,'g'), equipsInfo[k]);
    }
    return dictEquipsInfo;
}

function loadEquips(){
    if (dictEquips) return dictEquips;
    //装备名
    var equips = EQUIP_EQUIPS;

    dictEquips = new Map();
    for(var j in equips) {
        //此处弱化忽略词典里的of/the/-连词大小写匹配，同时将装备名中所有空格替换为为混沌的通配，忽略单词之间的所有纯HTML代码
        //这将忽略论坛里给装备名增加的颜色格式代码从而使翻译可以正确进行，同时装备信息页中被换行截断的装备名也会被正确拼接
        var vj = j.replace(/of (the )?/,'([oO]f )?([tT]he )?').replace(/-./,function(k){return '-['+k[1]+k[1].toUpperCase()+']'}).replace(/\s(.)/g,'\\s*(<[^<]+>\\s*)*$1');
        dictEquips.set(new RegExp(vj,'g'), equips[j]);
    }
    return dictEquips;
}

//论坛用的额外内容字典
function loadExtra() {
    var dict = EQUIP_EXTRA;
    dictExtra = new Map();
    for (var i in dict) {
        dictExtra.set(new RegExp(i,'g'), dict[i]);
    }
}

// 按当前 lang 重新翻译（lang 切换用）。RestoreController.setLang 调用前已把 DOM 还原回英文原文。
function retranslateEquip() {
  translatedList.clear();
  main(); // 重跑翻译；UI 副作用（拍卖 observer / 隐藏锁定按钮 / style）已加幂等守卫
  translated = true; // 重翻后回到"已翻译"显示态，与 RestoreController 全局态同步（防拍卖 -1 逻辑错乱）
}

export function initEquipTranslate() {
  try {
    var p = location.pathname || "";
    // 仅 hentaiverse 主站;跳过装备详情页(equip/showequip)避让 HVAA 装备百分位
    if (!/hentaiverse\.org$/.test(location.host) && location.host.indexOf("hentaiverse.org") === -1) return;
    if (/\/equip(\/|$)/.test(p) || /showequip\.php/.test(p)) return;
    // 原脚本顶层早返回守卫 (L25-26):iw 页无 item_pane / 谜题页 / 战斗日志页不汉化
    if (document.location.href.match(/ss=iw/) && !document.getElementById('item_pane')) return;
    if (document.getElementById('riddlemaster') || document.getElementById('textlog')) return;
    registerRetranslate(retranslateEquip); // 注册 lang 切换重翻回调（去重）
    main();
  } catch (e) { console.error("[HVAA][equip-i18n] 执行出错:", e); }
}
