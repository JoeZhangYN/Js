// ============ 统一状态管理 v3 ============
// 自包含脚本：Vue 3 + Pinia（CDN runtime compilation）
// 不侵入世界书，所有配置通过 Vue 设置面板管理

// ==================== [1] CDN Imports ====================

import { createApp, defineComponent, ref, reactive, computed, watch, toRaw, nextTick, onMounted, onUnmounted, h }
  from 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.js';
import { createPinia, defineStore }
  from 'https://cdn.jsdelivr.net/npm/pinia/+esm';
import JSON5 from 'https://cdn.jsdelivr.net/npm/json5/+esm';
import { jsonrepair } from 'https://cdn.jsdelivr.net/npm/jsonrepair/+esm';
import { klona } from 'https://cdn.jsdelivr.net/npm/klona/+esm';

// ==================== [2] 常量 + 默认模板 ====================

const CHAT_VAR = { type: 'chat' };
const GAME_STATE_KEY = 'joezhangynGameState';
const SETTINGS_KEY = 'joezhangyn_state_settings';
const REGEX_SCRIPT_NAME = 'joezhangyn_summary_compress';
const MAX_SUMMARIES = 20;
const MAX_DIRTY_LOG = 50;
const LOG_PREFIX = '[状态管理]';

const DEFAULT_RULE_TEMPLATE = `你必须在每次回复的末尾，使用以下格式之一来更新变量：

格式一（lodash风格）：
\`\`\`
_.set('路径', 新值); // 原因
_.add('路径', 增量); // 原因
_.insert('路径', 键或索引, 值); // 原因
_.delete('路径'); // 原因
\`\`\`

格式二（JSONPatch）：
<JSONPatch>
[{"op":"replace","path":"/路径","value":新值}]
</JSONPatch>

摘要格式：
<Summary period="时间段">摘要内容</Summary>

当前状态变量：
{{state}}`;

const DEFAULT_INITIAL_STATE = `{
  // 在此定义你的初始游戏状态
  // 支持 JSON5 格式（允许注释、尾逗号、无引号键名）
  core: {
    场景: "",
    时间: "",
    地点: "",
  },
  主角: {
    名字: "{{user}}",
  },
  characters: {},
  summaries: {},
  config: {
    注入关键词: [],
  },
}`;

const DEFAULT_EXTRA_SYSTEM_PROMPT = `<must>
你需要认真分析最近的对话变化，然后更新变量。

请严格按照以下格式输出变量更新：
<UpdateVariable>
_.set('路径', 新值); // 原因
_.add('路径', 增量); // 原因
</UpdateVariable>

注意：
1. 先列出所有需要检查的变量
2. 对每个变量判断是否需要更新（Y/N）
3. 只更新确实发生变化的变量
4. 不要编造不存在的路径
</must>`;

// ==================== [3] Zod Schemas ====================

const BaseGameStateSchema = z.object({
  lastDelta: z.array(z.any()).default([]),
  dirtyLog: z.array(z.object({
    op: z.any(),
    reason: z.string(),
    timestamp: z.number(),
  })).default([]),
}).passthrough();

const SettingsSchema = z.object({
  通知: z.object({
    框架加载成功: z.boolean().default(true),
    变量初始化成功: z.boolean().default(true),
    变量更新出错: z.boolean().default(true),
    额外模型解析中: z.boolean().default(true),
  }).default({}),

  初始变量模板: z.string().default(DEFAULT_INITIAL_STATE),
  规则提示词模板: z.string().default(DEFAULT_RULE_TEMPLATE),
  规则注入配置: z.object({
    启用: z.boolean().default(true),
    position: z.enum(['in_chat', 'none']).default('in_chat'),
    depth: z.coerce.number().default(1),
    role: z.enum(['system', 'user', 'assistant']).default('system'),
    order: z.coerce.number().default(100),
    should_scan: z.boolean().default(false),
  }).default({}),

  更新方式: z.enum(['随AI输出', '额外模型解析']).default('随AI输出'),
  额外模型解析配置: z.object({
    破限方案: z.enum(['使用当前预设', '使用内置破限']).default('使用内置破限'),
    使用函数调用: z.boolean().default(false),
    兼容假流式: z.boolean().default(false),
    启用自动请求: z.boolean().default(true),
    请求方式: z.enum(['依次请求，失败后重试', '同时请求多次', '先请求一次, 失败后再同时请求多次']).default('依次请求，失败后重试'),
    请求次数: z.coerce.number().default(3).transform(v => _.clamp(v, 1, 10)),
    模型来源: z.enum(['与插头相同', '自定义']).default('与插头相同'),
    api地址: z.string().default('http://localhost:1234/v1'),
    密钥: z.string().default(''),
    模型名称: z.string().default(''),
    温度: z.coerce.number().default(1).transform(v => _.clamp(v, 0, 2)),
    频率惩罚: z.coerce.number().default(0).transform(v => _.clamp(v, -2, 2)),
    存在惩罚: z.coerce.number().default(0).transform(v => _.clamp(v, -2, 2)),
    top_p: z.coerce.number().default(1).transform(v => _.clamp(v, 0, 1)),
    最大回复token数: z.coerce.number().default(4096).transform(v => Math.max(0, v)),
    额外系统提示词: z.string().default(DEFAULT_EXTRA_SYSTEM_PROMPT),
  }).default({}),

  自动清理变量: z.object({
    启用: z.boolean().default(false),
    快照保留间隔: z.coerce.number().default(50),
    要保留变量的最近楼层数: z.coerce.number().default(20),
    触发恢复变量的最近楼层数: z.coerce.number().default(10),
  }).default({}),

  兼容性: z.object({
    更新到聊天变量: z.boolean().default(false),
    显示老旧功能: z.boolean().default(false),
  }).default({}),
});

// ==================== [4] 状态读写层 ====================

function getState() {
  const vars = getVariables(CHAT_VAR);
  const raw = vars[GAME_STATE_KEY];
  if (!raw) return null;
  const result = BaseGameStateSchema.safeParse(raw);
  if (result.success) return result.data;
  console.warn(`${LOG_PREFIX} 状态校验失败:`, z.prettifyError(result.error));
  return raw;
}

function setState(state) {
  const result = BaseGameStateSchema.safeParse(state);
  if (!result.success) {
    const msg = z.prettifyError(result.error);
    console.error(`${LOG_PREFIX} 写入校验失败:`, msg);
    toastr.error(msg.replaceAll('\n', '<br>'), `${LOG_PREFIX} 写入失败`, { escapeHtml: false });
    return false;
  }
  insertOrAssignVariables({ [GAME_STATE_KEY]: result.data }, CHAT_VAR);
  return true;
}

function updateState(fn) {
  const state = getState();
  if (!state) {
    toastr.error('状态未初始化', LOG_PREFIX);
    return null;
  }
  const updated = fn(klona(state));
  if (setState(updated)) return updated;
  return null;
}

// ==================== [5] JSON Pointer 工具 ====================

function jsonPointerToPath(pointer) {
  if (!pointer || pointer === '/') return [];
  const raw = pointer.startsWith('/') ? pointer.slice(1) : pointer;
  return raw.split('/').map(seg =>
    seg.replace(/~1/g, '/').replace(/~0/g, '~'),
  );
}

function dotPathToPointer(dotPath) {
  return '/' + dotPath.split('.').map(seg =>
    seg.replace(/~/g, '~0').replace(/\//g, '~1'),
  ).join('/');
}

function normalizePath(rawPath) {
  if (rawPath.startsWith('/')) return rawPath;
  if (rawPath.includes('.') && !rawPath.includes('/')) {
    return dotPathToPointer(rawPath);
  }
  return '/' + rawPath;
}

function getByPointer(obj, pointer) {
  const path = jsonPointerToPath(pointer);
  return path.length === 0 ? obj : _.get(obj, path);
}

function setByPointer(obj, pointer, value) {
  const path = jsonPointerToPath(pointer);
  if (path.length === 0) return value;
  _.set(obj, path, value);
  return obj;
}

function removeByPointer(obj, pointer) {
  const path = jsonPointerToPath(pointer);
  if (path.length === 0) return obj;
  const parentPath = path.slice(0, -1);
  const lastKey = path[path.length - 1];
  const parent = parentPath.length === 0 ? obj : _.get(obj, parentPath);
  if (Array.isArray(parent)) {
    parent.splice(Number(lastKey), 1);
  } else {
    _.unset(obj, path);
  }
  return obj;
}

// ==================== [6] 双格式命令解析器 ====================

function stripQuotes(str) {
  return _.isString(str) ? str.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/, '$1') : str;
}

function cleanPath(str) {
  return stripQuotes(str).replace(/^(?:stat_data|status_current_variables)\./, '');
}

function findClosingParen(text, startIndex) {
  let depth = 1;
  let inQuote = false;
  let quoteChar = '';
  for (let i = startIndex; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if ((ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
      if (inQuote) {
        if (ch === quoteChar) inQuote = false;
      } else {
        inQuote = true;
        quoteChar = ch;
      }
    }
    if (!inQuote) {
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

function parseArgs(text) {
  const args = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let bracketDepth = 0;
  let braceDepth = 0;
  let parenDepth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if ((ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
      if (inQuote) {
        if (ch === quoteChar) inQuote = false;
      } else {
        inQuote = true;
        quoteChar = ch;
      }
    }
    if (ch === ',' && !inQuote && bracketDepth === 0 && braceDepth === 0 && parenDepth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
      if (!inQuote) {
        if (ch === '[') bracketDepth++;
        else if (ch === ']') bracketDepth--;
        else if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
        else if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
      }
    }
  }
  args.push(current.trim());
  return args;
}

function evaluateValue(text) {
  if (typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === 'undefined') return undefined;
  try {
    return JSON.parse(trimmed);
  } catch (_) { /* ignore */ }
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON5.parse(trimmed);
    } catch (_) { /* ignore */ }
    try {
      return JSON5.parse(jsonrepair(trimmed));
    } catch (_) { /* ignore */ }
  }
  try {
    return YAML.parse(trimmed);
  } catch (_) { /* ignore */ }
  const val = stripQuotes(text);
  if (val instanceof Date) return val.toISOString();
  return val;
}

function parseLodashCommands(text) {
  const commands = [];
  const regex = /_\.(set|insert|assign|remove|unset|delete|add|move)\s*\(/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const cmdType = match[1];
    const openParenIndex = match.index + match[0].length;
    const closeParenIndex = findClosingParen(text, openParenIndex);
    if (closeParenIndex === -1) continue;
    const argsStr = text.slice(openParenIndex, closeParenIndex);
    const args = parseArgs(argsStr);
    if (args.length === 0) continue;

    let type = cmdType;
    if (type === 'remove' || type === 'unset') type = 'delete';
    if (type === 'assign') type = 'insert';

    const fullMatch = text.slice(match.index, closeParenIndex + 1);
    let reason = '';
    const afterClose = text.slice(closeParenIndex + 1);
    const commentMatch = afterClose.match(/^\s*;?\s*\/\/\s*(.+)/);
    if (commentMatch) reason = commentMatch[1].trim();

    const valid =
      (type === 'set' && args.length >= 2) ||
      (type === 'insert' && args.length >= 2) ||
      (type === 'delete' && args.length >= 1) ||
      (type === 'add' && args.length === 2) ||
      (type === 'move' && args.length === 2);

    if (valid) {
      commands.push({ type, args, fullMatch, reason });
    }
  }
  return commands;
}

function parseJSONPatch(text) {
  const match = text.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/i);
  if (!match) return null;
  let raw = match[1].trim();
  try {
    raw = jsonrepair(raw);
    let parsed = JSON5.parse(raw);
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.map(op => ({
      ...op,
      path: op.path ? normalizePath(op.path) : op.path,
      from: op.from ? normalizePath(op.from) : op.from,
    }));
  } catch (e) {
    console.error(`${LOG_PREFIX} JSON Patch 解析失败:`, e, raw);
    toastr.error(`JSON Patch 解析失败: ${e.message}`, LOG_PREFIX, { escapeHtml: false });
    return null;
  }
}

function unifyToPatches(commands) {
  return commands.map(cmd => {
    const path = normalizePath(cleanPath(cmd.args[0]));
    switch (cmd.type) {
      case 'set': {
        const value = evaluateValue(cmd.args.length === 3 ? cmd.args[2] : cmd.args[1]);
        return { op: 'replace', path, value, _reason: cmd.reason, _fullMatch: cmd.fullMatch };
      }
      case 'add': {
        const value = evaluateValue(cmd.args[1]);
        return { op: 'delta', path, value, _reason: cmd.reason, _fullMatch: cmd.fullMatch };
      }
      case 'insert': {
        if (cmd.args.length === 2) {
          const value = evaluateValue(cmd.args[1]);
          return { op: 'add', path: path + '/-', value, _reason: cmd.reason, _fullMatch: cmd.fullMatch };
        }
        const key = evaluateValue(cmd.args[1]);
        const value = evaluateValue(cmd.args[2]);
        const insertPath = path + '/' + String(key).replace(/~/g, '~0').replace(/\//g, '~1');
        return { op: 'add', path: insertPath, value, _reason: cmd.reason, _fullMatch: cmd.fullMatch };
      }
      case 'delete': {
        return { op: 'remove', path, _reason: cmd.reason, _fullMatch: cmd.fullMatch };
      }
      case 'move': {
        const from = normalizePath(cleanPath(cmd.args[0]));
        const to = normalizePath(cleanPath(cmd.args[1]));
        return { op: 'move', from, path: to, _reason: cmd.reason, _fullMatch: cmd.fullMatch };
      }
      default:
        return null;
    }
  }).filter(Boolean);
}

// ==================== [7] Patch 引擎 ====================

function validatePatchOp(op, state) {
  const validOps = ['replace', 'add', 'remove', 'move', 'copy', 'test', 'delta'];
  if (!validOps.includes(op.op)) {
    return `未知操作类型: ${op.op}`;
  }
  if (!op.path) {
    return '缺少 path 字段';
  }
  if (['replace', 'add', 'test', 'delta'].includes(op.op) && op.value === undefined) {
    return `操作 ${op.op} 缺少 value 字段`;
  }
  if (['move', 'copy'].includes(op.op) && !op.from) {
    return `操作 ${op.op} 缺少 from 字段`;
  }
  if (op.op === 'replace' || op.op === 'remove' || op.op === 'test' || op.op === 'delta') {
    const existing = getByPointer(state, op.path);
    if (existing === undefined && op.op !== 'add') {
      if (op.op === 'replace') {
        // replace 自动降级为 add
      } else if (op.op === 'delta') {
        return `路径不存在: ${op.path}`;
      } else {
        return `路径不存在: ${op.path}`;
      }
    }
  }
  if ((op.op === 'move' || op.op === 'copy') && getByPointer(state, op.from) === undefined) {
    return `源路径不存在: ${op.from}`;
  }
  return null;
}

function applyOneOp(state, op) {
  switch (op.op) {
    case 'replace':
    case 'add':
      return setByPointer(state, op.path, op.value);
    case 'remove':
      return removeByPointer(state, op.path);
    case 'move': {
      const value = getByPointer(state, op.from);
      removeByPointer(state, op.from);
      return setByPointer(state, op.path, value);
    }
    case 'copy': {
      const value = klona(getByPointer(state, op.from));
      return setByPointer(state, op.path, value);
    }
    case 'delta': {
      const current = getByPointer(state, op.path);
      if (typeof current === 'number' && typeof op.value === 'number') {
        return setByPointer(state, op.path, parseFloat((current + op.value).toPrecision(12)));
      }
      if (typeof current === 'string' && typeof op.value === 'string') {
        return setByPointer(state, op.path, current + op.value);
      }
      throw new Error(`delta 操作不支持的类型: ${typeof current} + ${typeof op.value}`);
    }
    case 'test': {
      const actual = getByPointer(state, op.path);
      if (!_.isEqual(actual, op.value)) {
        throw new Error(`test 失败: 路径 ${op.path} 的值为 ${JSON.stringify(actual)}，期望 ${JSON.stringify(op.value)}`);
      }
      return state;
    }
    default:
      throw new Error(`未知操作: ${op.op}`);
  }
}

function applyPatches(patches, state) {
  const clone = klona(state);
  const applied = [];
  const rejected = [];

  for (const op of patches) {
    const error = validatePatchOp(op, clone);
    if (error) {
      rejected.push({ op, reason: error, timestamp: Date.now() });
      const settings = _getSettings();
      if (settings.通知.变量更新出错) {
        toastr.warning(
          `${error}<br><code>${JSON.stringify(op)}</code>`,
          `${LOG_PREFIX} Patch 被拒绝`,
          { escapeHtml: false },
        );
      }
      continue;
    }
    try {
      applyOneOp(clone, op);
      applied.push(op);
    } catch (e) {
      rejected.push({ op, reason: e.message, timestamp: Date.now() });
      const settings = _getSettings();
      if (settings.通知.变量更新出错) {
        toastr.warning(
          `${e.message}<br><code>${JSON.stringify(op)}</code>`,
          `${LOG_PREFIX} Patch 执行失败`,
          { escapeHtml: false },
        );
      }
    }
  }

  if (applied.length === 0) {
    return { success: false, rejected };
  }

  clone.lastDelta = applied;
  clone.dirtyLog = [...(state.dirtyLog || []), ...rejected].slice(-MAX_DIRTY_LOG);

  return { success: true, state: clone, applied, rejected };
}

// ==================== [8] 规则提示词注入 ====================

let _ruleInjection = null;

function injectRulePrompt(state) {
  const settings = _getSettings();
  if (!settings.规则注入配置.启用) return;

  const stateJson = JSON.stringify(state, (key, val) => {
    if (key === 'lastDelta' || key === 'dirtyLog') return undefined;
    return val;
  }, 2);
  const content = settings.规则提示词模板.replace(/\{\{state\}\}/g, stateJson);

  if (_ruleInjection) {
    _ruleInjection.uninject();
    _ruleInjection = null;
  }

  _ruleInjection = injectPrompts([{
    id: 'joezhangyn_state_rule',
    position: settings.规则注入配置.position,
    depth: settings.规则注入配置.depth,
    role: settings.规则注入配置.role,
    content,
    should_scan: settings.规则注入配置.should_scan,
  }]);
}

function uninjectRulePrompt() {
  if (_ruleInjection) {
    _ruleInjection.uninject();
    _ruleInjection = null;
  }
}

// ==================== [9] 关键词扫描 + 状态注入 ====================

function scanForActiveCharacters(state) {
  const activeSet = new Set();
  const lastId = getLastMessageId();
  if (lastId < 0) return activeSet;

  const config = state.config || {};
  const scanDepth = config.scanDepth || 10;
  const startId = Math.max(0, lastId - scanDepth + 1);
  const messages = getChatMessages(`${startId}-${lastId}`);
  const fullText = messages.map(m => m.message).join('\n');

  const characters = state.characters || {};
  for (const [name, entry] of Object.entries(characters)) {
    if (!entry || typeof entry !== 'object') continue;
    const triggers = entry.triggers || [name];
    if (triggers.some(t => fullText.includes(t))) {
      activeSet.add(name);
    }
  }

  const triggerKeywords = config.triggerKeywords || config.注入关键词 || [];
  for (const keyword of triggerKeywords) {
    if (fullText.includes(keyword)) {
      for (const [name, entry] of Object.entries(characters)) {
        if (!entry || typeof entry !== 'object') continue;
        const triggers = entry.triggers || [name];
        if (triggers.includes(keyword)) {
          activeSet.add(name);
        }
      }
    }
  }

  return activeSet;
}

let _stateInjection = null;

function injectStatePrompts(state, activeSet) {
  if (_stateInjection) {
    _stateInjection.uninject();
    _stateInjection = null;
  }

  if (!state) return;

  const prompts = [];
  const config = state.config || {};
  const depthMap = config.depthMap || { core: 1, highPriority: 2, lowPriority: 4, summary: 5 };

  const characters = state.characters || {};
  const registeredNames = Object.keys(characters);
  const { lastDelta, dirtyLog, characters: _c, summaries: _s, config: _cfg, ...coreState } = state;

  const coreContent = [
    `<status_current_variables>`,
    JSON.stringify(coreState, null, 2),
    registeredNames.length > 0
      ? `\n<registered_names>${registeredNames.join(', ')}</registered_names>`
      : '',
    `</status_current_variables>`,
  ].filter(Boolean).join('\n');

  prompts.push({
    id: 'joezhangyn_state_core',
    position: 'in_chat',
    depth: depthMap.core,
    role: 'system',
    content: coreContent,
  });

  for (const name of activeSet) {
    const entry = characters[name];
    if (!entry) continue;

    const depth = entry.depth ?? (entry.priority === 'high' ? depthMap.highPriority : depthMap.lowPriority);
    const data = entry.data || entry;
    const dataStr = JSON.stringify(data, null, 2);
    if (!dataStr || dataStr === '{}') continue;

    prompts.push({
      id: `joezhangyn_state_char_${name}`,
      position: 'in_chat',
      depth,
      role: 'system',
      content: `<person name="${name}">\n${dataStr}\n</person>`,
    });
  }

  const summaries = state.summaries || {};
  const relevantSummaries = findRelevantSummaries(state);
  for (const [period, summary] of Object.entries(relevantSummaries)) {
    if (!summary || !summary.content) continue;
    prompts.push({
      id: `joezhangyn_state_summary_${period}`,
      position: 'in_chat',
      depth: depthMap.summary,
      role: 'system',
      content: `<summary period="${period}">\n${summary.content}\n</summary>`,
    });
  }

  if (prompts.length > 0) {
    _stateInjection = injectPrompts(prompts);
  }
}

// ==================== [10] 摘要 + 正则压缩 ====================

function parseSummaries(text) {
  const summaries = {};
  const regex = /<Summary\s+period="([^"]+)">([\s\S]*?)<\/Summary>/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    summaries[match[1]] = match[2].trim();
  }
  return summaries;
}

function storeSummaries(state, summaries) {
  if (!state.summaries) state.summaries = {};
  for (const [period, content] of Object.entries(summaries)) {
    state.summaries[period] = {
      content,
      createdAt: Date.now(),
    };
  }
  const entries = Object.entries(state.summaries);
  if (entries.length > MAX_SUMMARIES) {
    const sorted = entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = sorted.slice(0, entries.length - MAX_SUMMARIES);
    for (const [key] of toRemove) {
      delete state.summaries[key];
    }
  }
  return state;
}

function findRelevantSummaries(state) {
  if (!state.summaries || Object.keys(state.summaries).length === 0) return {};
  return state.summaries;
}

async function initSummaryRegex() {
  const regexes = getTavernRegexes({ scope: 'character' });
  const existing = regexes.find(r => r.script_name === REGEX_SCRIPT_NAME);
  if (!existing) {
    await updateTavernRegexesWith(regexes => {
      regexes.push({
        id: SillyTavern.uuidv4(),
        script_name: REGEX_SCRIPT_NAME,
        enabled: true,
        run_on_edit: true,
        scope: 'character',
        find_regex: '[\\s\\S]*',
        replace_string: '',
        source: {
          user_input: true,
          ai_output: true,
          slash_command: false,
          world_info: false,
        },
        destination: {
          display: false,
          prompt: true,
        },
        min_depth: null,
        max_depth: null,
      });
      return regexes;
    }, { scope: 'character' });
  }
}

async function updateSummaryRegex(state) {
  if (!state.summaries || Object.keys(state.summaries).length === 0) {
    await updateTavernRegexesWith(regexes => {
      return regexes.map(r => {
        if (r.script_name === REGEX_SCRIPT_NAME) {
          return { ...r, min_depth: null, max_depth: null };
        }
        return r;
      });
    }, { scope: 'character' });
    return;
  }

  const config = state.config || {};
  const scanDepth = config.scanDepth || 10;
  const compressMinDepth = scanDepth + 1;

  await updateTavernRegexesWith(regexes => {
    return regexes.map(r => {
      if (r.script_name === REGEX_SCRIPT_NAME) {
        return { ...r, min_depth: compressMinDepth, max_depth: null };
      }
      return r;
    });
  }, { scope: 'character' });
}

// ==================== [11] 额外模型解析 ====================

let _isDuringExtraAnalysis = false;
let _extraGenerationId = null;

function normalizeBaseURL(url) {
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

async function buildExtraModelRequest(settings) {
  const config = settings.额外模型解析配置;
  const generationId = SillyTavern.uuidv4();
  _extraGenerationId = generationId;

  const requestConfig = {
    user_input: '遵循<must>指令',
    max_chat_history: 2,
    should_stream: config.兼容假流式 || config.使用函数调用,
    should_silence: true,
    generation_id: generationId,
  };

  if (config.模型来源 === '自定义') {
    const customApi = {
      apiurl: normalizeBaseURL(config.api地址),
      model: config.模型名称,
      source: 'openai',
    };
    if (config.密钥) customApi.key = config.密钥;
    if (config.最大回复token数 !== 4096) customApi.max_tokens = config.最大回复token数;
    if (config.温度 !== 1) customApi.temperature = config.温度;
    if (config.频率惩罚 !== 0) customApi.frequency_penalty = config.频率惩罚;
    if (config.存在惩罚 !== 0) customApi.presence_penalty = config.存在惩罚;
    if (config.top_p !== 1) customApi.top_p = config.top_p;
    requestConfig.custom_api = customApi;
  }

  const systemPrompt = config.额外系统提示词 || DEFAULT_EXTRA_SYSTEM_PROMPT;

  if (config.破限方案 === '使用当前预设') {
    requestConfig.injects = [{
      role: 'system',
      content: systemPrompt,
      position: 'in_chat',
      depth: 0,
      should_scan: false,
    }];
    return { type: 'generate', config: requestConfig };
  }

  requestConfig.ordered_prompts = [
    { role: 'system', content: systemPrompt },
    'world_info_before',
    'world_info_after',
    'chat_history',
    'user_input',
  ];
  return { type: 'generateRaw', config: requestConfig };
}

function parseExtraModelResponse(responseText) {
  const tagMatch = responseText.match(/<(update(?:variable)?|variableupdate)>([\s\S]*?)<\/\1>/i);
  if (!tagMatch) return null;
  return tagMatch[2].trim();
}

async function executeOneExtraRequest(settings) {
  const request = await buildExtraModelRequest(settings);
  let response;
  if (request.type === 'generate') {
    response = await generate(request.config);
  } else {
    response = await generateRaw(request.config);
  }

  const content = parseExtraModelResponse(response);
  if (!content) {
    throw new Error('未能从回复中找到 <UpdateVariable> 标签');
  }

  const hasLodash = /_\.(?:set|insert|assign|remove|unset|delete|add|move)\s*\(/.test(content);
  const hasJsonPatch = /json_?patch/i.test(content);
  if (!hasLodash && !hasJsonPatch) {
    throw new Error('从回复找到了 <UpdateVariable> 标签，但其内的更新命令无效');
  }

  return content;
}

async function executeExtraModelParsing() {
  const settings = _getSettings();
  const config = settings.额外模型解析配置;
  const maxAttempts = config.请求次数;

  if (settings.通知.额外模型解析中) {
    toastr.info('正在进行额外模型解析...', LOG_PREFIX, { timeOut: 3000 });
  }

  _isDuringExtraAnalysis = true;
  try {
    let content;
    switch (config.请求方式) {
      case '依次请求，失败后重试': {
        for (let i = 0; i < maxAttempts; i++) {
          try {
            content = await executeOneExtraRequest(settings);
            break;
          } catch (e) {
            console.warn(`${LOG_PREFIX} 额外模型解析第 ${i + 1} 次请求失败:`, e.message);
            if (i === maxAttempts - 1) throw e;
          }
        }
        break;
      }
      case '同时请求多次': {
        const promises = Array.from({ length: maxAttempts }, () =>
          executeOneExtraRequest(settings),
        );
        content = await Promise.any(promises);
        break;
      }
      case '先请求一次, 失败后再同时请求多次': {
        try {
          content = await executeOneExtraRequest(settings);
        } catch (_) {
          const promises = Array.from({ length: maxAttempts }, () =>
            executeOneExtraRequest(settings),
          );
          content = await Promise.any(promises);
        }
        break;
      }
    }
    return content;
  } finally {
    _isDuringExtraAnalysis = false;
    _extraGenerationId = null;
  }
}

function registerExtraModelFunctionTool() {
  try {
    SillyTavern.registerFunctionTool({
      name: 'joezhangyn_variable_update',
      displayName: '变量更新',
      description: '更新游戏状态变量',
      parameters: {
        type: 'object',
        properties: {
          analysis: {
            type: 'string',
            description: 'A compact reasoning summary for variable updates.',
          },
          delta: {
            type: 'string',
            description: 'Variable update block using lodash syntax or JSONPatch.',
          },
        },
        required: ['delta'],
      },
      action: (args) => {
        try {
          const content = args.delta || '';
          processVariableUpdate(content);
          return 'Variables updated.';
        } catch (e) {
          return `Error: ${e.message}`;
        }
      },
      shouldRegister: () => {
        const settings = _getSettings();
        return _isDuringExtraAnalysis && settings.额外模型解析配置.使用函数调用;
      },
      stealth: true,
    });
  } catch (e) {
    console.warn(`${LOG_PREFIX} 注册函数调用工具失败:`, e.message);
  }
}

// ==================== [12] 自动清理 ====================

function cleanupOldVariables(fromId, toId, snapshotInterval) {
  let cleaned = 0;
  for (let i = fromId; i <= toId; i++) {
    try {
      const msgVars = getVariables({ type: 'message', message_id: i });
      if (!msgVars) continue;
      if (msgVars.snapshot === true) continue;
      if (i % snapshotInterval === 0) {
        insertOrAssignVariables({ snapshot: true }, { type: 'message', message_id: i });
        continue;
      }
      const hasData = msgVars.stat_data || msgVars.display_data || msgVars.delta_data || msgVars.schema;
      if (hasData) {
        updateVariablesWith(vars => {
          _.unset(vars, 'stat_data');
          _.unset(vars, 'display_data');
          _.unset(vars, 'delta_data');
          _.unset(vars, 'schema');
          return vars;
        }, { type: 'message', message_id: i });
        cleaned++;
      }
    } catch (_) { /* skip invalid message ids */ }
  }
  return cleaned;
}

function restoreFromSnapshot(state) {
  const settings = _getSettings();
  if (!settings.自动清理变量.启用) return;

  const lastId = getLastMessageId();
  if (lastId < 1) return;

  const retainCount = settings.自动清理变量.触发恢复变量的最近楼层数;
  const checkStart = Math.max(1, lastId - retainCount);

  let needsRestore = false;
  for (let i = checkStart; i <= lastId; i++) {
    try {
      const msgVars = getVariables({ type: 'message', message_id: i });
      if (!msgVars || !msgVars.stat_data) {
        needsRestore = true;
        break;
      }
    } catch (_) { continue; }
  }

  if (!needsRestore) return;

  let snapshotId = -1;
  for (let i = checkStart - 1; i >= 0; i--) {
    try {
      const msgVars = getVariables({ type: 'message', message_id: i });
      if (msgVars && msgVars.snapshot === true && msgVars.stat_data) {
        snapshotId = i;
        break;
      }
    } catch (_) { continue; }
  }

  if (snapshotId === -1) {
    console.warn(`${LOG_PREFIX} 未找到可用快照，无法恢复`);
    return;
  }

  console.info(`${LOG_PREFIX} 从快照 #${snapshotId} 恢复变量`);
  const snapshotVars = getVariables({ type: 'message', message_id: snapshotId });
  let currentData = klona(snapshotVars.stat_data);

  for (let i = snapshotId + 1; i <= lastId; i++) {
    try {
      const msg = getChatMessages(i);
      if (msg.length === 0) continue;
      const text = msg[0].message;

      const lodashCmds = parseLodashCommands(text);
      const jsonPatches = parseJSONPatch(text);

      let patches = [];
      if (lodashCmds.length > 0) {
        patches = unifyToPatches(lodashCmds);
      }
      if (jsonPatches && jsonPatches.length > 0) {
        patches = [...patches, ...jsonPatches];
      }

      if (patches.length > 0) {
        const result = applyPatches(patches, currentData);
        if (result.success) {
          currentData = result.state;
        }
      }

      const retainStart = Math.max(1, lastId - settings.自动清理变量.要保留变量的最近楼层数);
      if (i >= retainStart) {
        try {
          const existing = getVariables({ type: 'message', message_id: i });
          if (!existing || !existing.stat_data) {
            insertOrAssignVariables({ stat_data: klona(currentData) }, { type: 'message', message_id: i });
          }
        } catch (_) { /* skip */ }
      }
    } catch (e) {
      console.warn(`${LOG_PREFIX} 恢复第 ${i} 楼变量时出错:`, e.message);
    }
  }
}

// ==================== [13] Pinia Store ====================

let _piniaInstance = null;
let _settingsStore = null;

function _getSettings() {
  if (_settingsStore) return toRaw(_settingsStore.settings);
  const raw = _.get(SillyTavern.extensionSettings, SETTINGS_KEY, {});
  return SettingsSchema.parse(raw);
}

const useSettingsStore = defineStore('joezhangyn_state_settings', () => {
  const raw = _.get(SillyTavern.extensionSettings, SETTINGS_KEY, {});
  const settings = ref(SettingsSchema.parse(raw));

  watch(settings, (val) => {
    _.set(SillyTavern.extensionSettings, SETTINGS_KEY, toRaw(val));
    SillyTavern.saveSettingsDebounced();
  }, { deep: true });

  function resetToDefault(key) {
    const defaults = SettingsSchema.parse({});
    if (key) {
      _.set(settings.value, key, _.get(defaults, key));
    } else {
      settings.value = defaults;
    }
  }

  return { settings, resetToDefault };
});

// ==================== [14] Vue 组件 ====================

const SectionNotification = defineComponent({
  name: 'SectionNotification',
  template: `
    <details class="jsm-details">
      <summary class="jsm-details__summary">通知设置</summary>
      <div class="jsm-details__content">
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.通知.框架加载成功"><span>框架加载成功</span></label>
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.通知.变量初始化成功"><span>变量初始化成功</span></label>
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.通知.变量更新出错"><span>变量更新出错</span></label>
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.通知.额外模型解析中"><span>额外模型解析中</span></label>
      </div>
    </details>
  `,
  setup() {
    const store = useSettingsStore();
    return { store };
  },
});

const SectionInitialState = defineComponent({
  name: 'SectionInitialState',
  template: `
    <details class="jsm-details" open>
      <summary class="jsm-details__summary">初始变量模板</summary>
      <div class="jsm-details__content">
        <p class="jsm-hint">支持 JSON5 格式（允许注释、尾逗号、无引号键名）。可用宏: {{"{{user}}"}}</p>
        <textarea class="jsm-textarea" v-model="store.settings.初始变量模板" rows="12" spellcheck="false"></textarea>
        <div class="jsm-btn-row">
          <button class="menu_button menu_button_icon interactable" @click="validate">验证</button>
          <button class="menu_button menu_button_icon interactable" @click="resetDefault">恢复默认</button>
        </div>
        <div v-if="validationMsg" :class="['jsm-validation', validationOk ? 'jsm-validation--ok' : 'jsm-validation--err']">{{ validationMsg }}</div>
      </div>
    </details>
  `,
  setup() {
    const store = useSettingsStore();
    const validationMsg = ref('');
    const validationOk = ref(false);

    function validate() {
      try {
        const text = substitudeMacros(store.settings.初始变量模板);
        JSON5.parse(text);
        validationMsg.value = '语法正确';
        validationOk.value = true;
      } catch (e) {
        validationMsg.value = `语法错误: ${e.message}`;
        validationOk.value = false;
      }
    }

    function resetDefault() {
      store.resetToDefault('初始变量模板');
      validationMsg.value = '';
    }

    return { store, validationMsg, validationOk, validate, resetDefault };
  },
});

const SectionRulePrompt = defineComponent({
  name: 'SectionRulePrompt',
  template: `
    <details class="jsm-details" open>
      <summary class="jsm-details__summary">规则提示词</summary>
      <div class="jsm-details__content">
        <p class="jsm-hint">{{"{{state}}"}} 占位符会被替换为当前状态 JSON</p>
        <textarea class="jsm-textarea" v-model="store.settings.规则提示词模板" rows="10" spellcheck="false"></textarea>
        <div class="jsm-btn-row">
          <button class="menu_button menu_button_icon interactable" @click="resetDefault">恢复默认</button>
        </div>
        <div class="jsm-field-grid">
          <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.规则注入配置.启用"><span>启用注入</span></label>
          <div class="jsm-field">
            <label>深度</label>
            <input type="number" class="text_pole jsm-input-sm" v-model.number="store.settings.规则注入配置.depth" min="0" max="99">
          </div>
          <div class="jsm-field">
            <label>角色</label>
            <select class="text_pole" v-model="store.settings.规则注入配置.role">
              <option value="system">system</option>
              <option value="user">user</option>
              <option value="assistant">assistant</option>
            </select>
          </div>
          <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.规则注入配置.should_scan"><span>世界书扫描</span></label>
        </div>
      </div>
    </details>
  `,
  setup() {
    const store = useSettingsStore();
    function resetDefault() {
      store.resetToDefault('规则提示词模板');
    }
    return { store, resetDefault };
  },
});

const SectionUpdateMethod = defineComponent({
  name: 'SectionUpdateMethod',
  template: `
    <details class="jsm-details">
      <summary class="jsm-details__summary">更新方式</summary>
      <div class="jsm-details__content">
        <div class="jsm-field-grid">
          <label class="jsm-radio"><input type="radio" value="随AI输出" v-model="store.settings.更新方式"><span>随AI输出</span></label>
          <label class="jsm-radio"><input type="radio" value="额外模型解析" v-model="store.settings.更新方式"><span>额外模型解析</span></label>
        </div>

        <template v-if="store.settings.更新方式 === '额外模型解析'">
          <div class="jsm-divider"></div>
          <div class="jsm-field-grid">
            <div class="jsm-field">
              <label>破限方案</label>
              <select class="text_pole" v-model="store.settings.额外模型解析配置.破限方案">
                <option value="使用当前预设">使用当前预设</option>
                <option value="使用内置破限">使用内置破限</option>
              </select>
            </div>
            <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.额外模型解析配置.使用函数调用"><span>使用函数调用</span></label>
            <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.额外模型解析配置.兼容假流式"><span>兼容假流式</span></label>
            <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.额外模型解析配置.启用自动请求"><span>启用自动请求</span></label>
            <div class="jsm-field">
              <label>请求方式</label>
              <select class="text_pole" v-model="store.settings.额外模型解析配置.请求方式">
                <option>依次请求，失败后重试</option>
                <option>同时请求多次</option>
                <option>先请求一次, 失败后再同时请求多次</option>
              </select>
            </div>
            <div class="jsm-field">
              <label>请求次数</label>
              <input type="number" class="text_pole jsm-input-sm" v-model.number="store.settings.额外模型解析配置.请求次数" min="1" max="10">
            </div>
          </div>

          <details class="jsm-details">
            <summary class="jsm-details__summary">模型来源</summary>
            <div class="jsm-details__content">
              <div class="jsm-field-grid">
                <label class="jsm-radio"><input type="radio" value="与插头相同" v-model="store.settings.额外模型解析配置.模型来源"><span>与插头相同</span></label>
                <label class="jsm-radio"><input type="radio" value="自定义" v-model="store.settings.额外模型解析配置.模型来源"><span>自定义</span></label>
              </div>
              <template v-if="store.settings.额外模型解析配置.模型来源 === '自定义'">
                <div class="jsm-field-grid">
                  <div class="jsm-field">
                    <label>API 地址</label>
                    <input type="text" class="text_pole" v-model="store.settings.额外模型解析配置.api地址" placeholder="http://localhost:1234/v1">
                  </div>
                  <div class="jsm-field">
                    <label>API 密钥</label>
                    <input type="password" class="text_pole" v-model="store.settings.额外模型解析配置.密钥" placeholder="留空表示无需密钥">
                  </div>
                  <div class="jsm-field">
                    <label>模型名称</label>
                    <div style="display:flex;gap:0.5rem">
                      <input type="text" class="text_pole" v-model="store.settings.额外模型解析配置.模型名称" style="flex:1">
                      <button class="menu_button menu_button_icon interactable" @click="fetchModels" :disabled="fetchingModels">{{ fetchingModels ? '获取中...' : '获取模型' }}</button>
                    </div>
                    <select v-if="modelList.length > 0" class="text_pole" v-model="selectedModel" style="margin-top:0.3rem">
                      <option value="">（从列表选择）</option>
                      <option v-for="m in modelList" :key="m" :value="m">{{ m }}</option>
                    </select>
                  </div>
                </div>
                <details class="jsm-details">
                  <summary class="jsm-details__summary">高级参数</summary>
                  <div class="jsm-details__content jsm-field-grid">
                    <div class="jsm-field">
                      <label>最大回复 token</label>
                      <input type="number" class="text_pole" v-model.number="store.settings.额外模型解析配置.最大回复token数" min="0" step="128">
                    </div>
                    <div class="jsm-field">
                      <label>温度 ({{ store.settings.额外模型解析配置.温度 }})</label>
                      <input type="range" min="0" max="2" step="0.01" v-model.number="store.settings.额外模型解析配置.温度">
                    </div>
                    <div class="jsm-field">
                      <label>Top P ({{ store.settings.额外模型解析配置.top_p }})</label>
                      <input type="range" min="0" max="1" step="0.01" v-model.number="store.settings.额外模型解析配置.top_p">
                    </div>
                    <div class="jsm-field">
                      <label>频率惩罚 ({{ store.settings.额外模型解析配置.频率惩罚 }})</label>
                      <input type="range" min="-2" max="2" step="0.01" v-model.number="store.settings.额外模型解析配置.频率惩罚">
                    </div>
                    <div class="jsm-field">
                      <label>存在惩罚 ({{ store.settings.额外模型解析配置.存在惩罚 }})</label>
                      <input type="range" min="-2" max="2" step="0.01" v-model.number="store.settings.额外模型解析配置.存在惩罚">
                    </div>
                  </div>
                </details>
              </template>
            </div>
          </details>

          <details class="jsm-details">
            <summary class="jsm-details__summary">额外系统提示词</summary>
            <div class="jsm-details__content">
              <textarea class="jsm-textarea" v-model="store.settings.额外模型解析配置.额外系统提示词" rows="8" spellcheck="false"></textarea>
              <div class="jsm-btn-row">
                <button class="menu_button menu_button_icon interactable" @click="resetExtraPrompt">恢复默认</button>
              </div>
            </div>
          </details>
        </template>
      </div>
    </details>
  `,
  setup() {
    const store = useSettingsStore();
    const modelList = ref([]);
    const fetchingModels = ref(false);
    const selectedModel = ref('');

    watch(selectedModel, (val) => {
      if (val) store.settings.额外模型解析配置.模型名称 = val;
    });

    async function fetchModels() {
      if (fetchingModels.value) return;
      const url = normalizeBaseURL(store.settings.额外模型解析配置.api地址);
      if (!url) return;
      fetchingModels.value = true;
      try {
        const list = await getModelList({
          apiurl: url,
          key: store.settings.额外模型解析配置.密钥 || undefined,
        });
        modelList.value = list.sort();
        if (modelList.value.length === 0) {
          toastr.warning('模型列表为空', LOG_PREFIX);
        }
      } catch (e) {
        toastr.error(e.message, `${LOG_PREFIX} 获取模型失败`);
      } finally {
        fetchingModels.value = false;
      }
    }

    function resetExtraPrompt() {
      store.settings.额外模型解析配置.额外系统提示词 = DEFAULT_EXTRA_SYSTEM_PROMPT;
    }

    return { store, modelList, fetchingModels, selectedModel, fetchModels, resetExtraPrompt };
  },
});

const SectionCleanup = defineComponent({
  name: 'SectionCleanup',
  template: `
    <details class="jsm-details">
      <summary class="jsm-details__summary">自动清理变量</summary>
      <div class="jsm-details__content jsm-field-grid">
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.自动清理变量.启用"><span>启用</span></label>
        <div class="jsm-field">
          <label>快照保留间隔</label>
          <input type="number" class="text_pole jsm-input-sm" v-model.number="store.settings.自动清理变量.快照保留间隔" min="5" max="500">
        </div>
        <div class="jsm-field">
          <label>要保留变量的最近楼层数</label>
          <input type="number" class="text_pole jsm-input-sm" v-model.number="store.settings.自动清理变量.要保留变量的最近楼层数" min="5" max="500">
        </div>
        <div class="jsm-field">
          <label>触发恢复变量的最近楼层数</label>
          <input type="number" class="text_pole jsm-input-sm" v-model.number="store.settings.自动清理变量.触发恢复变量的最近楼层数" min="1" max="100">
        </div>
      </div>
    </details>
  `,
  setup() {
    const store = useSettingsStore();
    return { store };
  },
});

const SectionCompatibility = defineComponent({
  name: 'SectionCompatibility',
  template: `
    <details class="jsm-details">
      <summary class="jsm-details__summary">兼容性</summary>
      <div class="jsm-details__content jsm-field-grid">
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.兼容性.更新到聊天变量"><span>更新到聊天变量</span></label>
        <label class="jsm-checkbox"><input type="checkbox" v-model="store.settings.兼容性.显示老旧功能"><span>显示老旧功能</span></label>
      </div>
    </details>
  `,
  setup() {
    const store = useSettingsStore();
    return { store };
  },
});

const PANEL_STYLES = `
.jsm-panel { font-size: 13px; display: flex; flex-direction: column; gap: 0.75rem; }
.jsm-details { border: 1px dashed var(--SmartThemeBorderColor, rgba(45,45,45,1)); border-radius: 10px; padding: 0.5rem 0.7rem; background-color: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(31,31,31,1)) 70%, transparent); }
.jsm-details__summary { cursor: pointer; user-select: none; font-weight: 600; opacity: 0.95; }
.jsm-details__content { margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
.jsm-textarea { width: 100%; box-sizing: border-box; font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; resize: vertical; padding: 0.4rem; border-radius: 6px; background: color-mix(in srgb, var(--SmartThemeBlurTintColor, rgba(31,31,31,1)) 33%, transparent); border: 1px solid var(--SmartThemeBorderColor, rgba(45,45,45,1)); color: inherit; }
.jsm-hint { opacity: 0.7; font-size: 11px; margin: 0; }
.jsm-btn-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.jsm-btn-row .menu_button { padding: 0.3rem 0.6rem; min-height: unset; height: auto; line-height: 1.2; font-size: 12px; }
.jsm-field-grid { display: flex; flex-direction: column; gap: 0.5rem; }
.jsm-field { display: flex; flex-direction: column; gap: 0.2rem; }
.jsm-field label { font-weight: 600; opacity: 0.95; font-size: 12px; }
.jsm-checkbox, .jsm-radio { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; }
.jsm-checkbox input, .jsm-radio input { margin: 0; }
.jsm-input-sm { max-width: 8rem; }
.jsm-divider { border-top: 1px solid var(--SmartThemeBorderColor, rgba(45,45,45,0.5)); margin: 0.3rem 0; }
.jsm-validation { padding: 0.3rem 0.5rem; border-radius: 4px; font-size: 12px; }
.jsm-validation--ok { background: rgba(40,167,69,0.15); color: #28a745; }
.jsm-validation--err { background: rgba(220,53,69,0.15); color: #dc3545; }
`;

const SettingsPanel = defineComponent({
  name: 'SettingsPanel',
  components: {
    SectionNotification,
    SectionInitialState,
    SectionRulePrompt,
    SectionUpdateMethod,
    SectionCleanup,
    SectionCompatibility,
  },
  template: `
    <div class="jsm-panel">
      <SectionNotification />
      <SectionInitialState />
      <SectionRulePrompt />
      <SectionUpdateMethod />
      <SectionCleanup />
      <SectionCompatibility />
    </div>
  `,
});

// ==================== [15] 事件处理器 ====================

function processVariableUpdate(text) {
  const state = getState();
  if (!state) return false;

  const previous = klona(state);
  let allPatches = [];

  const lodashCmds = parseLodashCommands(text);
  if (lodashCmds.length > 0) {
    const unified = unifyToPatches(lodashCmds);
    allPatches = [...allPatches, ...unified];
  }

  const jsonPatches = parseJSONPatch(text);
  if (jsonPatches && jsonPatches.length > 0) {
    allPatches = [...allPatches, ...jsonPatches];
  }

  if (allPatches.length === 0) return false;

  const result = applyPatches(allPatches, state);
  if (result.success) {
    setState(result.state);
    toastr.success(
      `成功应用 ${result.applied.length} 条操作`,
      LOG_PREFIX,
    );

    const current = getState();
    eventEmit('joezhangyn_state_changed', { previous, current, delta: allPatches });

    const activeSet = scanForActiveCharacters(current);
    injectStatePrompts(current, activeSet);
    injectRulePrompt(current);

    return true;
  } else if (result.rejected.length > 0) {
    updateState(s => {
      s.dirtyLog = [...(s.dirtyLog || []), ...result.rejected].slice(-MAX_DIRTY_LOG);
      return s;
    });
  }
  return false;
}

async function onGenerationAfterCommands(type, option, dryRun) {
  if (dryRun) return;
  const state = getState();
  if (!state) return;
  const activeSet = scanForActiveCharacters(state);
  injectStatePrompts(state, activeSet);
  injectRulePrompt(state);
}

async function onGenerationEnded(messageId) {
  const settings = _getSettings();
  const state = getState();
  if (!state) return;

  const messages = getChatMessages(messageId);
  if (messages.length === 0) return;
  const text = messages[0].message;

  let stateChanged = false;

  if (settings.更新方式 === '随AI输出') {
    stateChanged = processVariableUpdate(text);
  } else if (settings.更新方式 === '额外模型解析' && settings.额外模型解析配置.启用自动请求) {
    try {
      const content = await executeExtraModelParsing();
      if (content) {
        stateChanged = processVariableUpdate(content);
      }
    } catch (e) {
      console.error(`${LOG_PREFIX} 额外模型解析失败:`, e);
      toastr.error(`额外模型解析失败: ${e.message}`, LOG_PREFIX, { escapeHtml: false });
    }
  }

  const summaries = parseSummaries(text);
  if (Object.keys(summaries).length > 0) {
    const updated = updateState(s => storeSummaries(s, summaries));
    if (updated) {
      stateChanged = true;
      await updateSummaryRegex(updated);
      toastr.success(
        `已更新 ${Object.keys(summaries).length} 条摘要`,
        LOG_PREFIX,
      );
    }
  }

  if (stateChanged) {
    const current = getState();
    if (current) {
      const activeSet = scanForActiveCharacters(current);
      injectStatePrompts(current, activeSet);
      injectRulePrompt(current);

      if (settings.兼容性.更新到聊天变量) {
        insertOrAssignVariables({ [GAME_STATE_KEY]: klona(current) }, CHAT_VAR);
      }
    }
  }
}

async function onChatChanged() {
  uninjectRulePrompt();
  if (_stateInjection) {
    _stateInjection.uninject();
    _stateInjection = null;
  }

  const state = getState();
  if (!state) return;

  await initSummaryRegex();
  await updateSummaryRegex(state);

  const activeSet = scanForActiveCharacters(state);
  injectStatePrompts(state, activeSet);
  injectRulePrompt(state);
}

function onMessageSwiped(messageId) {
  const state = getState();
  if (!state) return;
  const activeSet = scanForActiveCharacters(state);
  injectStatePrompts(state, activeSet);
}

async function onMessageDeleted(messageId) {
  const state = getState();
  if (!state) return;
  await updateSummaryRegex(state);

  const settings = _getSettings();
  if (settings.自动清理变量.启用) {
    restoreFromSnapshot(state);
  }
}

function onMessageReceived(messageId) {
  const settings = _getSettings();
  if (!settings.自动清理变量.启用) return;

  const lastId = getLastMessageId();
  if (lastId < 1 || lastId % 5 !== 0) return;

  const retainCount = settings.自动清理变量.要保留变量的最近楼层数;
  const cleanTo = lastId - retainCount;
  if (cleanTo > 0) {
    const cleanFrom = Math.max(1, cleanTo - 2 * retainCount);
    const cleaned = cleanupOldVariables(cleanFrom, cleanTo, settings.自动清理变量.快照保留间隔);
    if (cleaned > 0) {
      console.info(`${LOG_PREFIX} 已清理 ${cleaned} 层的消息变量`);
    }
  }
}

// ==================== [16] 按钮处理器 ====================

async function handleSettings() {
  const container = document.createElement('div');
  const styleEl = document.createElement('style');
  styleEl.textContent = PANEL_STYLES;
  container.appendChild(styleEl);

  const mountPoint = document.createElement('div');
  container.appendChild(mountPoint);

  const pinia = _piniaInstance || createPinia();
  _piniaInstance = pinia;

  const app = createApp(SettingsPanel);
  app.use(pinia);
  app.mount(mountPoint);

  _settingsStore = useSettingsStore(pinia);

  await SillyTavern.callGenericPopup(container, SillyTavern.POPUP_TYPE.TEXT, undefined, {
    wide: true,
    large: true,
    okButton: '关闭',
    onClose: () => {
      app.unmount();
    },
  });
}

async function handleInitState() {
  const existing = getState();
  if (existing) {
    const confirm = await SillyTavern.callGenericPopup(
      '当前聊天已存在状态数据，是否覆盖？',
      SillyTavern.POPUP_TYPE.CONFIRM,
    );
    if (confirm !== SillyTavern.POPUP_RESULT.AFFIRMATIVE) return;
  }

  const settings = _getSettings();
  try {
    const templateText = substitudeMacros(settings.初始变量模板);
    const parsed = JSON5.parse(templateText);
    const defaultState = {
      ...parsed,
      lastDelta: [],
      dirtyLog: [],
    };
    if (!defaultState.summaries) defaultState.summaries = {};
    if (!defaultState.config) defaultState.config = {};

    if (setState(defaultState)) {
      await initSummaryRegex();
      if (settings.通知.变量初始化成功) {
        toastr.success('状态初始化成功', LOG_PREFIX);
      }
      const activeSet = scanForActiveCharacters(defaultState);
      injectStatePrompts(defaultState, activeSet);
      injectRulePrompt(defaultState);
    }
  } catch (e) {
    toastr.error(`初始变量模板解析失败: ${e.message}`, LOG_PREFIX, { escapeHtml: false });
  }
}

async function handleViewState() {
  const state = getState();
  if (!state) {
    toastr.error('状态未初始化', LOG_PREFIX);
    return;
  }
  await SillyTavern.callGenericPopup(
    `<pre style="white-space:pre-wrap;word-break:break-all;max-height:70vh;overflow:auto;font-size:12px;">${
      _.escape(JSON.stringify(state, null, 2))
    }</pre>`,
    SillyTavern.POPUP_TYPE.TEXT,
    undefined,
    { wide: true, large: true },
  );
}

async function handleReprocessVariables() {
  const lastId = getLastMessageId();
  if (lastId < 0) {
    toastr.error('当前无消息', LOG_PREFIX);
    return;
  }
  const messages = getChatMessages(lastId);
  if (messages.length === 0) return;
  const text = messages[0].message;
  processVariableUpdate(text);
}

async function handleRetryExtraModel() {
  const state = getState();
  if (!state) {
    toastr.error('状态未初始化', LOG_PREFIX);
    return;
  }
  try {
    const content = await executeExtraModelParsing();
    if (content) {
      processVariableUpdate(content);
    }
  } catch (e) {
    toastr.error(`额外模型解析失败: ${e.message}`, LOG_PREFIX, { escapeHtml: false });
  }
}

async function handleCleanOldVariables() {
  const lastId = getLastMessageId();
  if (lastId < 1) {
    toastr.error('当前无足够消息', LOG_PREFIX);
    return;
  }
  const settings = _getSettings();
  const retainCount = settings.自动清理变量.要保留变量的最近楼层数;
  const cleanTo = lastId - retainCount;
  if (cleanTo <= 0) {
    toastr.info('当前消息量不足，无需清理', LOG_PREFIX);
    return;
  }
  const cleaned = cleanupOldVariables(1, cleanTo, settings.自动清理变量.快照保留间隔);
  toastr.success(`已清理 ${cleaned} 层的消息变量`, LOG_PREFIX);
}

async function handleCleanDirtyLog() {
  const updated = updateState(s => {
    s.dirtyLog = [];
    return s;
  });
  if (updated) {
    toastr.success('脏数据日志已清空', LOG_PREFIX);
  }
}

async function handleMigrateFromMVU() {
  const lastId = getLastMessageId();
  if (lastId < 0) {
    toastr.error('当前聊天无消息', LOG_PREFIX);
    return;
  }

  let statData = null;
  for (let i = lastId; i >= 0; i--) {
    try {
      const msgVars = getVariables({ type: 'message', message_id: i });
      if (msgVars && msgVars.stat_data) {
        statData = msgVars.stat_data;
        toastr.info(`从第 ${i} 楼读取到 MVU 数据`, LOG_PREFIX);
        break;
      }
    } catch (_) { continue; }
  }

  if (!statData) {
    toastr.error('未找到 MVU stat_data 数据', LOG_PREFIX);
    return;
  }

  try {
    const settings = _getSettings();
    let templateState;
    try {
      const templateText = substitudeMacros(settings.初始变量模板);
      templateState = JSON5.parse(templateText);
    } catch (_) {
      templateState = {};
    }

    const newState = {
      ...templateState,
      lastDelta: [],
      dirtyLog: [],
      summaries: {},
      config: templateState.config || {},
    };

    if (statData.core || statData.日期 || statData.时间 || statData.当前场景) {
      if (!newState.core) newState.core = {};
      if (statData.日期) newState.core.日期 = statData.日期;
      if (statData.时间) newState.core.时间 = statData.时间;
      if (statData.当前场景) newState.core.当前场景 = statData.当前场景;
      if (statData.当前场景) newState.core.场景 = statData.当前场景;
      if (statData.目标地点) newState.core.目标地点 = statData.目标地点;
    }

    if (statData.主角) {
      newState.主角 = { ...(newState.主角 || {}), ...statData.主角 };
    }

    if (!newState.characters) newState.characters = {};
    const skipKeys = new Set(['主角', '日期', '时间', '当前场景', '目标地点', 'core', 'config', 'summaries', 'lastDelta', 'dirtyLog']);
    for (const [key, value] of Object.entries(statData)) {
      if (skipKeys.has(key)) continue;
      if (_.isPlainObject(value) && (value.姓名 || value.名字)) {
        const name = value.姓名 || value.名字;
        newState.characters[name] = {
          data: value,
          triggers: [name],
          depth: 2,
          priority: 'high',
        };
      }
    }

    if (setState(newState)) {
      await initSummaryRegex();
      toastr.success(
        `迁移成功！已导入 ${Object.keys(newState.characters).length} 个角色`,
        LOG_PREFIX,
      );
      const activeSet = scanForActiveCharacters(newState);
      injectStatePrompts(newState, activeSet);
      injectRulePrompt(newState);
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} 迁移失败:`, e);
    toastr.error(`迁移失败: ${e.message}`, LOG_PREFIX, { escapeHtml: false });
  }
}

// ==================== [17] 公共 API ====================

const publicAPI = {
  events: {
    VARIABLE_INITIALIZED: 'joezhangyn_variable_initialized',
    COMMAND_PARSED: 'joezhangyn_command_parsed',
    VARIABLE_UPDATE_ENDED: 'joezhangyn_variable_update_ended',
    STATE_CHANGED: 'joezhangyn_state_changed',
  },

  getMvuData: (opts) => {
    if (opts && opts.type === 'message') {
      try {
        const vars = getVariables(opts);
        return vars.stat_data ? { stat_data: vars.stat_data } : null;
      } catch (_) { return null; }
    }
    const state = getState();
    return state ? { stat_data: state } : null;
  },

  parseMessage: async (msgText, oldState) => {
    const state = oldState || getState();
    if (!state) return null;

    let allPatches = [];
    const lodashCmds = parseLodashCommands(msgText);
    if (lodashCmds.length > 0) allPatches = unifyToPatches(lodashCmds);
    const jsonPatches = parseJSONPatch(msgText);
    if (jsonPatches) allPatches = [...allPatches, ...jsonPatches];

    if (allPatches.length === 0) return state;
    const result = applyPatches(allPatches, state);
    return result.success ? result.state : state;
  },

  isDuringExtraAnalysis: () => _isDuringExtraAnalysis,

  getState,
  setState,
  updateState,
  applyPatches: (patches, state) => applyPatches(patches, state || getState()),

  parseLodashCommands,
  parseJSONPatch,
  unifyToPatches,

  openSettings: handleSettings,
};

// ==================== [18] 初始化 ====================

const BUTTONS = [
  { name: '设置', handler: handleSettings },
  { name: '初始化状态', handler: handleInitState },
  { name: '查看状态', handler: handleViewState },
  { name: '重新处理变量', handler: handleReprocessVariables },
  { name: '重试额外模型解析', handler: handleRetryExtraModel },
  { name: '清除旧楼层变量', handler: handleCleanOldVariables },
  { name: '清理脏数据日志', handler: handleCleanDirtyLog },
  { name: '从MVU迁移', handler: handleMigrateFromMVU, legacy: true },
];

function bindEvents() {
  eventOn(tavern_events.GENERATION_AFTER_COMMANDS, onGenerationAfterCommands);
  eventOn(tavern_events.GENERATION_ENDED, onGenerationEnded);
  eventOn(tavern_events.CHAT_CHANGED, onChatChanged);
  eventOn(tavern_events.MESSAGE_SWIPED, onMessageSwiped);
  eventOn(tavern_events.MESSAGE_DELETED, _.debounce(onMessageDeleted, 2000));
  eventOn(tavern_events.MESSAGE_RECEIVED, onMessageReceived);
}

function bindButtons() {
  const settings = _getSettings();
  for (const btn of BUTTONS) {
    if (btn.legacy && !settings.兼容性.显示老旧功能) continue;
    eventOn(getButtonEvent(btn.name), btn.handler);
  }
}

function init() {
  _piniaInstance = createPinia();

  bindEvents();
  bindButtons();

  registerExtraModelFunctionTool();

  registerVariableSchema(
    z.object({ [GAME_STATE_KEY]: BaseGameStateSchema }),
    { type: 'chat' },
  );

  initializeGlobal('JoezhangynState', publicAPI);

  const state = getState();
  if (state) {
    initSummaryRegex().then(() => {
      updateSummaryRegex(state);
      const activeSet = scanForActiveCharacters(state);
      injectStatePrompts(state, activeSet);
      injectRulePrompt(state);
    });
  }

  const settings = _getSettings();
  if (settings.通知.框架加载成功) {
    toastr.success('统一状态管理脚本 v3 已加载', LOG_PREFIX);
  }
  console.info(`${LOG_PREFIX} 统一状态管理脚本 v3 已加载`);
}

$(() => init());

// ==================== [19] 用户自定义区域 ====================
// createDefaultState 已移至设置面板中的"初始变量模板"
// 用户可在设置面板中以 JSON5 格式编辑初始状态
