// ==UserScript==
// @name         HV打击效果和伤害数字
// @namespace    hvdamagenumber
// @description  显示伤害数字
// @match        *://*.hentaiverse.org/*
// @include      *://*hentaiverse.org/?s=Battle
// @include      *://*hentaiverse.org/isekai/?s=Battle
// @grant          GM_addStyle
// @version      2025.03.20
// ==/UserScript==



document.addEventListener('DOMContentLoaded', Enhance);

let options = { digitSpacing: 0.2, popDuration: 0.5, critPopDuration: 0.75, popDistance: 50, critPopDistance: 55, popScale: 1.3, critPopScale: 1.4 };
let critOptions = { digitSpacing: 0.25, popDuration: 0.5, critPopDuration: 0.75, popDistance: 50, critPopDistance: 55, popScale: 1.3, critPopScale: 1.4 };

Enhance();


function Enhance() {
    let battleLog = document.getElementById("pane_log");

    if (battleLog) {
        const observer = new MutationObserver(() => showDamageNumber());
        observer.observe(battleLog, { subtree: true, childList: true });
    }

}

function showDamageNumber() {

    var btcp = document.getElementById("pane_log");
    var logText = btcp.innerText;

    let hitPos = logText.indexOf("\nYou hit");
    let critPos = logText.indexOf("\nYou crit");
    let usePos = logText.indexOf("\nYou use");
    let castPos = logText.indexOf("\nYou cast");


    let roundStartPos = Math.max(hitPos, critPos, usePos, castPos);
    if (hitPos >= 0) roundStartPos = Math.min(roundStartPos, hitPos);
    if (critPos >= 0) roundStartPos = Math.min(roundStartPos, critPos);
    if (usePos >= 0) roundStartPos = Math.min(roundStartPos, usePos);
    if (castPos >= 0) roundStartPos = Math.min(roundStartPos, castPos);

    let monsterNameDamages = {};

    if (roundStartPos > 0) {

        let damages = parseCombatLog(logText.substring(0, roundStartPos));
        if (damages.length > 0) {
            for (var i = 0; i < damages.length; ++i) {

                if (!damages[i].monsterName) {
                    continue;
                }
                if (damages[i].monsterName == "you") {
                    continue;
                }

                if (!monsterNameDamages[damages[i].monsterName]) {
                    monsterNameDamages[damages[i].monsterName] = [];
                }

                monsterNameDamages[damages[i].monsterName].push(damages[i]);
            }


            for (let monsterName in monsterNameDamages) {
                let DMG = monsterNameDamages[monsterName];

                const targetDivs = Array.from(document.querySelectorAll('#pane_monster > div')).filter(div2 => {
                    return div2.querySelector('.btm3 div div')?.textContent.includes(monsterName);
                });

                const foundDiv = targetDivs[0];

                playHitAnimation(foundDiv);
//                createExplosion(foundDiv, { x: 22, y: 38 });


                //  战士好多冲击...妈的

                /*if (DMG.length == 4) {

                    showDamage(foundDiv, getDamageText(DMG[0]), DMG[0].isCrit, DMG[0].resisted, -120, DMG[0].isCrit ? critOptions : options);
                    showDamage(foundDiv, getDamageText(DMG[1]), DMG[1].isCrit, DMG[1].resisted, -40, DMG[1].isCrit ? critOptions : options);
                    showDamage(foundDiv, getDamageText(DMG[2]), DMG[2].isCrit, DMG[2].resisted, 40, DMG[2].isCrit ? critOptions : options);
                    showDamage(foundDiv, getDamageText(DMG[3]), DMG[3].isCrit, DMG[3].resisted, 120, DMG[3].isCrit ? critOptions : options);

                }
                else if (DMG.length == 3) {

                    showDamage(foundDiv, getDamageText(DMG[0]), DMG[0].isCrit, DMG[0].resisted, -80, DMG[0].isCrit ? critOptions : options);
                    showDamage(foundDiv, getDamageText(DMG[1]), DMG[1].isCrit, DMG[1].resisted, 0, DMG[1].isCrit ? critOptions : options);
                    showDamage(foundDiv, getDamageText(DMG[2]), DMG[2].isCrit, DMG[2].resisted, 80, DMG[2].isCrit ? critOptions : options);

                }
                else if (DMG.length == 2) {
                    showDamage(foundDiv, getDamageText(DMG[0]), DMG[0].isCrit, DMG[0].resisted, -40, DMG[0].isCrit ? critOptions : options);
                    showDamage(foundDiv, getDamageText(DMG[1]), DMG[1].isCrit, DMG[1].resisted, 40, DMG[1].isCrit ? critOptions : options);
                }
                else if (DMG.length == 1) {*/
                    showDamage(foundDiv, getDamageText(DMG[0]), DMG[0].isCrit, DMG[0].resisted, 0, DMG[0].isCrit ? critOptions : options);
                //}

            }
        }

    }


}

function getDamageText(damage) {
    let damageText = "";
    // if (damage.damage > 1000) {
    //     damageText = damageText + Math.round(damage.damage / 1000) + 'K';
    // } else {
    damageText = damageText + damage.damage;
    // }
    return damageText;
}


function parseCombatLog(log) {
    const lines = log.split('\n');
    const results = [];

    const regex = /^(?:.+?\s(?:blasts|hits)\s)(.*?)\s(?:for)\s(\d+)\s.*?(?:\((\d+)%\sresisted\))?$/;
    // 正则表达式变化：
    //   (?:\((\d+)%\sresisted\))?  现在捕获括号内的数字，并期望 "% resisted"

    for (const line of lines) {
        const match = line.match(regex);

        if (match) {
            const monsterName = match[1];
            const damage = parseInt(match[2], 10);
            var isCrit = false;
            if (line.indexOf('blasts') >= 0 || line.indexOf('crit') >= 0) {
                isCrit = true;
            }
            let resisted = null;

            if (line.indexOf("shield hits") >= 0) { //盾反弹的一点伤害不显示了，太多数字会显得乱
                continue;
            }

            if (match[3]) {
                resisted = parseInt(match[3], 10); // 将抵抗百分比转换为数字
            }

            results.push({
                monsterName,
                damage,
                isCrit,
                resisted,
            });
        }
    }

    return results;
}






/**
 * 显示伤害数字（独立于敌人元素）
 * @param {HTMLElement} enemyElement - 敌人元素（用于获取位置）
 * @param {number} damage - 伤害值
 * @param {boolean} isCrit - 是否暴击
 * @param {object} options - 可选参数
 */
async function showDamage(enemyElement, damage, isCrit = false, isResist = false, startX, options = {}) {
    const {
        popDuration = 1.3,
        critPopDuration = 1.5,
        popDistance = 30,
        critPopDistance = 40,
        popScale = 1.2,
        critPopScale = 1.5
    } = options;

    const rect = enemyElement.getBoundingClientRect();
    const enemyX = rect.left + window.scrollX + rect.width / 2 + startX;
    const enemyY = rect.top + window.scrollY + 60;

    const damageText = document.createElement('div');
    damageText.classList.add('damage-text');
    if (isCrit) damageText.classList.add('crit');
    if (isResist) damageText.classList.add('resist');

    // 设置完整数字
    damageText.textContent = damage;
    damageText.style.left = `${enemyX}px`;
    damageText.style.top = `${enemyY}px`;
    damageText.style.transform = 'translateX(-50%)';

    document.body.appendChild(damageText);

    // 统一动画参数
    const animName = isCrit ? 'popDigitCrit' : 'popDigit';
    const animDuration = isCrit ? critPopDuration : popDuration;

    // 设置CSS变量
    damageText.style.setProperty('--pop-distance', `${isCrit ? critPopDistance : popDistance}px`);
    damageText.style.setProperty('--pop-scale', `${isCrit ? critPopScale : popScale}`);

    // 应用动画
    damageText.style.animation = `
        ${animName} ${animDuration}s
        cubic-bezier(0.175, 0.885, 0.32, 1.42)
        forwards
    `;
/*
    // 动画结束移除
    damageText.addEventListener('animationend', () => {
        damageText.remove();
    });*/
}



// 被攻击动画
function playHitAnimation(enemy) {
    enemy.classList.remove('hit-animation');
    void enemy.offsetWidth; // 触发重绘
    enemy.classList.add('hit-animation');
}

/*
function createExplosion(enemyElement, offset = { x: 0, y: 0 }) {
    // 获取敌人当前视口位置
    const rect = enemyElement.getBoundingClientRect();

    // 计算绝对坐标（考虑滚动偏移）
    const x = rect.left + offset.x + window.scrollX;
    const y = rect.top + offset.y + window.scrollY;
    // 创建独立定位的爆炸元素
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    // 添加到 body 并自动移除
    document.body.appendChild(explosion);
    explosion.addEventListener('animationend', () => {
        explosion.remove();
    });
}*/




GM_addStyle(`
#animation-container {
position: fixed;
top: 0;
left: 0;
pointer-events: none;
z-index: 9999;
}

#enemy {
width: 100px;
height: 100px;
background-color: red;
cursor: pointer;
transition: opacity 0.3s;
}

.damage-text {
    position: absolute;
    /* top 和 left 将在 JavaScript 中动态设置 */
    font-size: 20px;
    font-weight: bold;
    white-space: nowrap;
    color: rgba(255,255,255,1);
    /* 普通伤害：白色 */
    text-shadow: -1px -1px 0 #444, 1px -1px 0 #444, -1px 1px 0 #444, 1px 1px 0 #444;
    pointer-events: none;
    z-index: 9999;
    font-family: '汉仪旗黑','HYWenHei 85W';
}


.damage-text.fire {
    font-size: 24px;
    color: rgba(238,0,0,1);
    text-shadow: -1px -1px 0 #8B0000, 1px -1px 0 #8B0000, -1px 1px 0 #8B0000, 1px 1px 0 #8B0000;
}


.damage-text.crit {
    font-size: 24px;
    color: rgba(255,204,102,1);
    text-shadow: -1px -1px 0 #8B0000, 1px -1px 0 #8B0000, -1px 1px 0 #8B0000, 1px 1px 0 #8B0000;
}

.damage-text.resist {
    font-size: 18px;
    color: #ccc;
    text-shadow: -1px -1px 0 #00008B, 1px -1px 0 #00008B, -1px 1px 0 #00008B, 1px 1px 0 #00008B;
}

.damage-text.crit.resist {
    font-size: 24px;
    color: rgba(213,170,84,1);
    text-shadow: -1px -1px 0 #8B4513, 1px -1px 0 #8B4513, -1px 1px 0 #8B4513, 1px 1px 0 #8B4513;
}

/* 普通伤害动画 */
@keyframes popDigit {
    0% {
        transform: translateY(0) scale(3);
        opacity: 0;
    }
    30% {
        transform: translateY(calc(-1 * var(--pop-distance, 30px))) scale(var(--pop-scale, 1.2));
        opacity: 1;
    }
    80% {
        transform: translateY(calc(-1 * var(--pop-distance, 30px))) scale(var(--pop-scale, 1.2));
        opacity: 1;
    }
    100% {
        transform: translateY(calc(-1 * var(--pop-distance, 30px))) scale(var(--pop-scale, 1.2));
        opacity: 0;
    }
}

/* 暴击伤害动画 */
@keyframes popDigitCrit {
    0% {
        transform: translateY(0) scale(4);
        opacity: 0;
    }
    30% {
        transform: translateY(calc(-1 * var(--pop-distance, 40px))) scale(var(--pop-scale, 1.5));
        opacity: 1;
    }
    80% {
        transform: translateY(calc(-1 * var(--pop-distance, 40px))) scale(var(--pop-scale, 1.5));
        opacity: 1;
    }
    100% {
        transform: translateY(calc(-1 * var(--pop-distance, 40px))) scale(var(--pop-scale, 1.5));
        opacity: 0;
    }
}


.crit-digit-container {
    display: inline-block;
    position: relative;
    pointer-events: none;
}

/* 被攻击动画 */
.hit-animation {
    animation: hitShake 0.2s ease-out;
}

@keyframes hitShake {
    0% { transform: translateX(0); }
    50% { transform: translateX(10px); }
    100% { transform: translateX(0); }
}

`);
