// 全局 CSS 注入 + i18n 标签 CSS（l${lang}{display:inline}）+ 调起浮动按钮。
// CSS 数组保持原顺序，含若干内联 PNG data-URL（按钮图标）。
// file-size-gate: exempt phase-3-monolith
import { gE, cE } from "../dom/query.js";
import { optionButton } from "../settings/button.js";

export function addStyle(lang) {
  // CSS
  const langStyle = gE("head").appendChild(cE("style"));
  langStyle.className = "hvAA-LangStyle";
  langStyle.textContent = `l${lang}{display:inline!important;}`;
  if (/^[01]$/.test(lang))
    langStyle.textContent = `${langStyle.textContent}l01{display:inline!important;}`;
  const globalStyle = gE("head").appendChild(cE("style"));
  const cssContent = [
    // hvAA
    "l0,l1,l01,l2{display:none;}", // l0: 简体 l1: 繁体 l01:简繁体共用 l2: 英文
    "#hvAABox2{position:absolute;left:1075px}",
    ".hvAALog{font-size:20px;}",
    ".hvAAButton{top:4px;left:1200px;position:absolute;z-index:9999;cursor:pointer;width:24px;height:24px;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAADi0lEQVRIiZVWPYgUZxj+dvGEk7vsNdPYCMul2J15n+d991PIMkWmOEyMyRW2FoJIUojYp5ADFbZJkyISY3EqKGpgz+Ma4bqrUojICaIsKGIXSSJcsZuD3RT3zWZucquXDwYG5n2f9/d5vnFuHwfAZySfAXgN4DXJzTiOj+3H90OnkmXZAe/9FMm3JJ8AuBGepyRfle2yLDvgnKt8EDVJkq8B3DGzjve+1m63p0n2AVzJbUh2SG455yre+5qZ/aCq983sxMfATwHYJvlCVYckHwFYVdURgO8LAS6RHJJcM7N1VR0CeE5yAGBxT3AR+QrA3wA20tQOq+pFkgOS90Tk85J51Xs9qaorqjoAcC6KohmSGyQHcRx/kbdv7AHgDskXaWqH0zSddc5Voyia2SOXapqmswsLvpam6ez8/Pwn+YcoimYAvARw04XZ5N8qZtZR1aGqXnTOVSd0cRd42U5EzqvqSFWX2u32tPd+yjnnXNiCGslHJAf7ybwM7r2vAdgWkYdZls157w+NK/DeT7Xb7WkAqyTvlZHjOD5oxgtmtqrKLsmze1VJsquqKwsLO9vnnKvkJHpLsq+qo/JAd8BtneTvqvqTiPwoIu9EZKUUpGpmi2Y2UtU+yTdJkhx1JJ8FEl0pruK/TrwA4F2r1WrkgI1G4wjJP0XkdLF9WaZzZnZZVa8GMj5xgf43JvXczFZbLb1ebgnJn0nenjQbEVkG0JsUYOykyi6Aa+XoQTJuTRr8OADJzVBOh+SlckYkz5L8Q0TquXOj0fhURN6r6pkSeAXAUsDaJPnYxXF8jOQrklskh97ryZJTVURWAPwF4DqAX0TkvRl/zTKdK2aeJMnxICFbAHrNZtOKVVdIrrVa2t1jz6sicprkbQC3VPVMGTzMpQvgQY63i8lBFddVdVCk/6TZlMFzopFci+P44H+YHCR3CODc/wUvDPY7ksMg9buZrKr3ATwvyoT3vrafzPP3er1eA9Azs7tjJhcqOBHkeSOKohkROR9K7prZYqnnlSRJjofhb4vIt/V6vUbyN1Xtt1qtb1zpZqs45xyAxXAnvCQ5FJGHqrpiZiMzu5xnHlZxCOABybXw3gvgp/Zq3/gA+BLATVVdyrJsbods2lfVq7lN4crMtapjZndD5pPBixWFLTgU7uQ3AJ6KyLKILAdy9sp25bZMBC//JSRJcjQIYg9Aj+TjZrNp+/mb+Ad711sdZZ1k/QAAAABJRU5ErkJggg==) center no-repeat transparent;}",
    "#hvut-top-config-icon{display:none;}", // UI 入口整合：隐藏 hv-utils 齿轮，统一经 HVAA 面板「HV Utils 设置」入口（config_sub 子菜单仍作 fallback）
    '#hvAABox{left:calc(50% - 350px);top:50px;font-size:16px!important;z-index:4;width:700px;height:566px;position:absolute;text-align:left;background-color:#E3E0D1;border:1px solid #000;border-radius:10px;font-family:"Microsoft Yahei";}',
    ".hvAATablist{position:relative;left:14px;}",
    ".hvAATabmenu{position:absolute;left:-9px;}",
    ".hvAATabmenu>span{display:block;padding:5px 10px;margin:0 10px 0 0;border:1px solid #91a7b4;border-radius:5px;background-color:#E3F1F8;color:#000;text-decoration:none;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;cursor:pointer;}",
    ".hvAATabmenu>span:hover{left:-5px;position:relative;color:#0000FF;z-index:2!important;}",
    ".hvAATabmenu>span>input{margin:0 0 0 -8px;}",
    ".hvAATab{position:absolute;width:605px;height:458px;left:36px;padding:15px;border:1px solid #91A7B4;border-radius:3px;box-shadow:0 2px 3px rgba(0,0,0,0.1);color:#666;background-color:#EDEBDF;overflow:auto;}",
    ".hvAATab>div:nth-child(2n){border:1px solid #EAEAEA;background-color:#FAFAFA;}",
    ".hvAATab>div:nth-child(2n+1){border:1px solid #808080;background-color:#DADADA;}",
    ".hvAATab a{margin:0 2px;}",
    ".hvAATab b{font-family:Georgia,Serif;font-size:larger;}",
    ".hvAATab input.hvAANumber{width:24px;text-align:right;}",
    ".hvAATab ul,.hvAATab ol{margin:0;}",
    ".hvAATab label{cursor:pointer;}",
    ".hvAATab table{border:2px solid #000;border-collapse:collapse;margin:0 auto;}",
    ".hvAATh>*{font-weight:bold;font-size:larger;}",
    ".hvAATab table>tbody>tr>*{border:1px solid #000;}",
    "#hvAATab-Drop tr>td:nth-child(1),#hvAATab-Usage tr>td:nth-child(1){text-align:left;}",
    "#hvAATab-Drop td,#hvAATab-Usage td{text-align:right;white-space:nowrap;}",
    // '#hvAATab-Drop td:empty:before,#hvAATab-Usage td:empty:before{content:"";}',
    ".selectTable{cursor:pointer;}",
    `.selectTable:before{content:"${String.fromCharCode(0x22a0)}";}`,
    ".hvAACenter{text-align:center;}",
    ".hvAATitle{font-weight:bolder;}",
    ".hvAAGoto{cursor:pointer;text-decoration:underline;color:#5C0D11;}",
    ".hvAANew{width:25px;height:25px;float:left;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAMCAYAAACX8hZLAAAAcElEQVQ4jbVRSQ4AIQjz/59mTiZIF3twmnCwFAq4FkeFXM+5vCzohYxjPMtfxS8CN6iqQ7TfE0wrODxVbzJNgoaTo4CmbBO1ZWICouQ0DHaL259MEzaU+w8pZOdSjcUgaPJDHCbO0A2kuAiuwPGQ+wBms12x8HExTwAAAABJRU5ErkJggg==) center no-repeat transparent;}",
    '#hvAATab-Alarm input[type="text"]{width:512px;}',
    ".testAlarms>div{border:2px solid #000;}",
    ".hvAAArenaLevels{display:none;}",
    ".hvAAConfig{width:100%;height:16px;}",
    ".hvAAButtonBox{position:relative;top:496px;}",
    ".lastEncounter{font-weight:bold;font-size:large;position:absolute;top:32px;left:1240px;text-decoration:none;}",
    ".quickSiteBar{position:absolute;top:55px;left:1240px;font-size:18px;text-align:left;width:calc(99% - 1236px);}",
    ".quickSiteBar>span{display:block;max-height:24px;overflow:hidden;text-overflow:ellipsis;}",
    ".quickSiteBar>span>a{text-decoration:none;}",
    ".customize{border: 2px dashed red!important;min-height:21px;}",
    ".customize>.customizeGroup{display:block;background-color:#FFF;}",
    ".customize>.customizeGroup:nth-child(2n){background-color:#C9DAF8;}",
    ".customizeBox{position:absolute;z-index:-1;border:1px solid #000;background-color:#EDEBDF;}",
    ".customizeBox>span{display:inline-block;font-size:16px;margin:0 1px;padding:0 5px;font-weight:bold;border:1px solid #5C0D11;border-radius:10px;}",
    ".customizeBox>span.hvAAInspect{padding:0 3px;cursor:pointer;}",
    '.customizeBox>span.hvAAInspect[title="on"]{background-color:red;}',
    ".customizeBox>span a{text-decoration:none;}",
    ".customizeBox>select{max-width:60px;}",
    ".favicon{width:16px;height:16px;margin:-3px 1px;border:1px solid #000;border-radius:3px;}",
    ".answerBar{z-index:1000;width:710px;height:40px;position:absolute;top:55px;left:282px;display:table;border-spacing:5px;}",
    ".answerBar>div{border:4px solid red;display:table-cell;cursor:pointer;}",
    ".answerBar>div:hover{background:rgba(63,207,208,0.20);}",
    "#hvAAInspectBox{background-color:#EDEBDF;position:absolute;z-index:9;border: 2px solid #5C0D11;font-size:16px;font-weight:bold;padding:3px;display:none;}",
    // 全局
    "button{border-radius:3px;border:2px solid #808080;cursor:pointer;margin:0 1px;}",
    // hv
    "#riddleform>div:nth-child(3)>img{width:700px;}",
    "#battle_right{overflow:visible;}",
    "#pane_log{height:403px;}",
    ".tlbQRA{text-align:left;font-weight:bold;}", // 标记已检测的日志行
    ".tlbWARN{text-align:left;font-weight:bold;color:red;font-size:20pt;}", // 标记检测出异常的日志行
  ].join("");
  globalStyle.textContent = cssContent;
  optionButton(lang);
}
