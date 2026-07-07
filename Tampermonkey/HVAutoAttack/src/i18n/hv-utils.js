// file-size-gate: exempt 整体嵌入 HV Utils 统一汉化(sssss2)-原样第三方代码
/* eslint-disable */
// 嵌入守卫:原脚本靠 @exclude isekai/equip 避让 HVAA 装备百分位;嵌入后无法用 @exclude
// (会排除 HVAA 自身),改运行时守卫复现;try-catch 隔离,汉化崩溃不阻断 HVAA 主逻辑。
try {
  var record_hvut_i18n_bridge_failure = function (stage, detail) {
    var evidence = { capability: 'hvutI18nBridge', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutI18nBridgeFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT i18n bridge fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT i18n bridge failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT i18n bridge fallback.
    }
    return evidence;
  };
  var run_hvut_i18n_bridge = function (method, args, stage, detail, fallback) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_i18n : undefined;
    if (!bridge || typeof bridge[method] !== 'function') {
      record_hvut_i18n_bridge_failure(stage, detail || {});
      return fallback;
    }
    try {
      return bridge[method](...(args || []));
    } catch (error) {
      record_hvut_i18n_bridge_failure(stage + 'Failed', { ...(detail || {}), error: error?.message || String(error) });
      return fallback;
    }
  };
  // Stage C: 协调器读出口 resolveEn(读 DOM 文本反查英文逻辑 key, 消 i18n 中文污染)。hv-utils 是非 ESM
  // sloppy-mode 第三方脚本(加 import 会触发 strict mode 撞 `protected` 等保留字标识符), 故经 window.HVAA_i18n
  // 全局桥获取(restore-controller.js 挂载); 桥未就绪退化返 undefined(调用方 ?? 原值)。两 IIFE 闭包共用此 var。
  var resolveEn = function (node, group) {
    return run_hvut_i18n_bridge('resolveEn', [node, group], 'resolveEnBridgeMissing', { group: group }, undefined);
  };
  // Stage G: 协调器正向出口 hvaaT(英文值, group)→当前 lang 显示中文（单一 canonical SSOT）。
  // 替代私有 HVAA_ITEM_CN/HVUT_CN 漂移表；桥未就绪/未命中退化返英文原值（不崩）。两 IIFE 闭包共用。
  var hvaaT = function (value, group) {
    return run_hvut_i18n_bridge('t', [value, group], 'translateBridgeMissing', { value: value, group: group }, value);
  };
  // Stage G: 整名装备翻译桥读（equip-translate 注册，复用外部同 dictEquips → 内部装备名 == 外部）。
  // 仅用于显示；逻辑值（dataset.eqname/eid-key URL/forum code/parse 键）一律保留英文 eq.info.name。
  var hvaaTEquip = function (name) {
    return run_hvut_i18n_bridge('translateEquipName', [name], 'translateEquipNameBridgeMissing', { name: name }, name);
  };
  // 声明式 i18n 绑定桥读(Stage G·复杂度下沉): 经桥登记 node + render，lang 切换框架自动重渲染→即时切换。
  // 桥未就绪退化: 只渲染一次不绑定(不崩，刷新后按新 lang)。render 闭包按当前 lang 调 hvaaT/拼接设 node 内容。
  var hvaaBind = function (node, render) {
    var bound = function () { render(node); }; // render 收 node 参数(闭包无需外部变量, 避免赋值前引用)
    var registered = run_hvut_i18n_bridge('registerI18nRender', [node, bound], 'registerI18nRenderBridgeMissing', {}, false);
    if (registered === false) { bound(); }
    return node;
  };
  var is_hvut_isekai_equip_page = function (pathname) {
    return /\/isekai\/equip(\/|$)/.test(pathname || '');
  };
  var record_hvut_navigation_bridge_failure = function (stage, detail) {
    var evidence = { capability: 'hvutNavigationBridge', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutNavigationBridgeFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT navigation fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] navigation bridge missing', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT navigation fallback.
    }
    return evidence;
  };
  var record_hvut_hvaa_config_bridge_failure = function (stage, detail) {
    var evidence = { capability: 'hvutHvaaConfigBridge', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutHvaaConfigBridgeFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT config bridge fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT HVAA config bridge failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT config bridge fallback.
    }
    return evidence;
  };
  var open_hvaa_config_from_hvut = function (stage) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_openConfig : undefined;
    if (typeof bridge !== 'function') {
      record_hvut_hvaa_config_bridge_failure(stage, { reason: 'missingHvaaConfigBridge' });
      return false;
    }
    try {
      bridge();
      return true;
    } catch (error) {
      record_hvut_hvaa_config_bridge_failure(stage, { reason: 'hvaaConfigBridgeFailed', error: error && error.message ? error.message : String(error) });
      return false;
    }
  };
  var record_hvut_config_storage_failure = function (stage, detail) {
    var evidence = { capability: 'hvutConfigStorage', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutConfigStorageFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT config storage fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT config storage failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT config storage fallback.
    }
    return evidence;
  };
  var create_hvut_config_parse_evidence = function (stage, detail) {
    var evidence = { capability: 'hvutConfigParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutConfigParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT config parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT config parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT config parse fallback.
    }
    return evidence;
  };
  var record_hvut_config_parse_failure = function (stage, detail) {
    create_hvut_config_parse_evidence(stage, detail);
    return null;
  };
  var parse_hvut_world_season = function (isIsekai, stage) {
    if (!isIsekai) return false;
    var text = $id('world_text')?.textContent || '';
    var match = /(\d+ Season \d+)/.exec(text);
    return match ? match[1] : (record_hvut_config_parse_failure(stage, { text: text }), '1');
  };
  var create_hvut_world_identity = function (context) {
    var isIsekai = !!context?.isIsekai;
    var serverName = context?.serverName || (isIsekai ? 'isekai' : 'persistent');
    return {
      isIsekai: isIsekai,
      serverName: serverName,
      season: context?.season || parse_hvut_world_season(isIsekai, context?.seasonStage || 'worldSeason'),
    };
  };
  var create_hvut_config_segment_context = function (context) {
    var world = create_hvut_world_identity(context);
    return {
      isIsekai: world.isIsekai,
      serverName: world.serverName,
      season: world.season,
      assignSeason: !!context?.assignSeason,
      checkboxWithNullLabel: !!context?.checkboxWithNullLabel,
      showTextareaDefaultButton: !!context?.showTextareaDefaultButton,
    };
  };
  var run_hvut_config_migration_bridge = function (method, args, stage, detail, fallback) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_hvutConfigMigration : undefined;
    if (!bridge || typeof bridge[method] !== 'function') {
      record_hvut_config_parse_failure(stage, detail || {});
      return fallback;
    }
    try {
      return bridge[method](...(args || []));
    } catch (error) {
      record_hvut_config_parse_failure(stage + 'Failed', { ...(detail || {}), error: error?.message || String(error) });
      return fallback;
    }
  };
  var get_hvut_config_carry_keys = function (segment) {
    return run_hvut_config_migration_bridge('carryKeys', [segment], 'configCarryKeysBridgeMissing', segment || {}, null);
  };
  var get_hvut_config_namespace = function (segment) {
    return run_hvut_config_migration_bridge('namespace', [segment], 'configNamespaceBridgeMissing', segment || {}, null);
  };
  var build_hvut_legacy_equipdata = function (inEquipdata, inJson) {
    return run_hvut_config_migration_bridge('buildEquipData', [inEquipdata, inJson], 'configEquipDataBridgeMissing', {}, null);
  };
  var normalize_hvut_legacy_equip_code = function (equipCode) {
    return run_hvut_config_migration_bridge('normalizeEquipCode', [equipCode], 'configEquipCodeBridgeMissing', {}, null);
  };
  var normalize_hvut_config_settings = function (settings, defaults) {
    return run_hvut_config_migration_bridge('normalizeSettings', [settings, defaults], 'configSettingsBridgeMissing', {}, null);
  };
  var migrate_hvut_monster_lab_log = function (mlLog) {
    return run_hvut_config_migration_bridge('migrateMonsterLabLog', [mlLog], 'configMonsterLabLogBridgeMissing', {}, null);
  };
  var normalize_hvut_legacy_prices = function (prices) {
    return run_hvut_config_migration_bridge('normalizePrices', [prices], 'configPricesBridgeMissing', {}, null);
  };
  var run_hvut_config_field_bridge = function (method, args, stage, detail, fallback) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_hvutConfigField : undefined;
    if (!bridge || typeof bridge[method] !== 'function') {
      record_hvut_config_parse_failure(stage, detail || {});
      return fallback;
    }
    try {
      return bridge[method](...(args || []));
    } catch (error) {
      record_hvut_config_parse_failure(stage + 'Failed', { ...(detail || {}), error: error?.message || String(error) });
      return fallback;
    }
  };
  var is_hvut_config_field_disabled = function (field, context) {
    return run_hvut_config_field_bridge('isDisabled', [field, context], 'configFieldBridgeMissing', { key: field?.key || '', context: context || {} }, true);
  };
  var get_hvut_config_field_input_kind = function (field) {
    return run_hvut_config_field_bridge('inputKind', [field], 'configFieldInputKindBridgeMissing', { key: field?.key || '' }, 'text');
  };
  var format_hvut_config_field_help_text = function (text) {
    return run_hvut_config_field_bridge('formatHelpText', [text], 'configFieldHelpTextBridgeMissing', {}, text ? String(text) : null);
  };
  var format_hvut_config_field_description = function (desc) {
    return run_hvut_config_field_bridge('formatDescription', [desc], 'configFieldDescriptionBridgeMissing', {}, desc ? { button: String(desc).split('\n')[0], html: String(desc).split('\n').slice(1).join('<br>') } : null);
  };
  var run_hvut_config_init = function (config, defaultSettings, context) {
    var segment = create_hvut_config_segment_context(context);
    var isIsekai = segment.isIsekai;
    if (segment.assignSeason) {
      config.season = segment.season;
    }
    const namespace = get_hvut_config_namespace(segment);
    if (!namespace) {
      alert(isIsekai ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    config.ns = namespace;
    config.prefix = config.ns + '_';
    config.default = defaultSettings;
    config.settings = config.get('settings', {});
    if (config.settings.version !== config.version) {
      if (config.migration() === false) {
        alert(isIsekai ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
    }
    return true;
  };
  var create_hvut_config_init_entry = function (defaultSettings, context) {
    return function () {
      return run_hvut_config_init(this, defaultSettings, context);
    };
  };
  var reject_hvut_config_legacy_migration = function (reason, detail) {
    var evidence = create_hvut_config_parse_evidence(reason, detail);
    return { kind: 'rejected', reason: reason, evidence: evidence };
  };
  var run_hvut_config_legacy_migration = function (config, price, context) {
    var segment = create_hvut_config_segment_context(context);
    var isIsekai = segment.isIsekai;
    if (config.settings.version) return { kind: 'accepted' };
    config.reset();
    const in_equipdata = config.ls_get('in_equipdata');
    const in_json = config.ls_get('in_json');
    const equipdata = build_hvut_legacy_equipdata(in_equipdata, in_json);
    if (equipdata) {
      if (!config.set('equipdata', equipdata)) return reject_hvut_config_legacy_migration('legacyEquipdataWriteFailed', { isIsekai: isIsekai });
    }
    const in_equipcode = config.ls_get('in_equipcode');
    if (in_equipcode) {
      const equipCode = normalize_hvut_legacy_equip_code(in_equipcode);
      if (!equipCode) return reject_hvut_config_legacy_migration('legacyEquipCodeInvalid', { isIsekai: isIsekai });
      config.settings.equipCode = equipCode;
    }
    const in_namecode = config.ls_get('in_namecode');
    if (in_namecode) {
      config.settings.equipNameCode = in_namecode;
    }

    const prices = config.ls_get('prices');
    if (prices) {
      const normalizedPrices = normalize_hvut_legacy_prices(prices);
      if (!normalizedPrices) return reject_hvut_config_legacy_migration('legacyPricesInvalid', { isIsekai: isIsekai });
      setTimeout(() => { // $price is not defined yet
        price.json = null;
        price.init();
        price.reset();
        price.set(normalizedPrices);
      }, 1000);
    }

    const es_protect = config.ls_get('es_protect');
    if (es_protect) {
      config.settings.equipmentShopProtectFilters = es_protect;
    }
    const es_bazaar = config.ls_get('es_bazaar');
    if (es_bazaar) {
      config.settings.equipmentShopBazaarFilters = es_bazaar;
    }

    const ml_log = config.ls_get('ml_log');
    const migrated_ml_log = migrate_hvut_monster_lab_log(ml_log);
    if (migrated_ml_log) {
      if (!config.set('ml_log', migrated_ml_log)) return reject_hvut_config_legacy_migration('legacyMonsterLabLogWriteFailed', { isIsekai: isIsekai });
      if (!config.ls_del('ml_log')) return reject_hvut_config_legacy_migration('legacyMonsterLabLogDeleteFailed', { isIsekai: isIsekai });
    }

    const ls_list = get_hvut_config_carry_keys(segment);
    if (!ls_list) return reject_hvut_config_legacy_migration('legacyCarryKeysMissing', { isIsekai: isIsekai });
    for (const key of ls_list) {
      const value = config.ls_get(key);
      if (value) {
        if (!config.set(key, value)) return reject_hvut_config_legacy_migration('legacyCarryKeyWriteFailed', { isIsekai: isIsekai, key: key });
      }
    }

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key.startsWith(config.prefix)) {
        if (!config.ls_del(key.slice(config.prefix.length))) return reject_hvut_config_legacy_migration('legacyStorageKeyDeleteFailed', { isIsekai: isIsekai, key: key });
      }
    }
    return { kind: 'accepted' };
  };
  var run_hvut_config_settings_migration = function (config, price, context, options) {
    var legacyMigration = run_hvut_config_legacy_migration(config, price, context);
    if (legacyMigration.kind === 'rejected') return legacyMigration;
    if (options?.dropEquipmentShopAutoProtect && config.settings.version < 4.2) {
      delete config.settings.equipmentShopAutoProtect;
    }
    if (options?.cleanShrineLog) {
      const ss_log = config.get('ss_log', {});
      Object.values(ss_log).forEach((list) => {
        delete list['1x'];
      });
      if (!config.set('ss_log', ss_log)) return reject_hvut_config_legacy_migration('settingsMigrationShrineLogWriteFailed', { isIsekai: !!context?.isIsekai });
    }
    const normalizedSettings = normalize_hvut_config_settings(config.settings, config.default);
    if (!normalizedSettings) return reject_hvut_config_legacy_migration('settingsMigrationNormalizeFailed', { isIsekai: !!context?.isIsekai });
    config.settings = normalizedSettings;
    if (config.save() === false) return reject_hvut_config_legacy_migration('settingsMigrationSaveFailed', { isIsekai: !!context?.isIsekai });
    return { kind: 'accepted' };
  };
  var render_hvut_config_field_row = function (config, field, context) {
    var segment = create_hvut_config_segment_context(context);
    field.node = {};
    field.node.div = $element('div', config.node.div);
    $element('h2', field.node.div, field.key);
    const inputKind = get_hvut_config_field_input_kind(field);

    if (inputKind === 'textarea') {
      // field.node.input is appended after help and description to preserve layout.
    } else if (inputKind === 'select') {
      field.node.input = $input(['select', field.options], field.node.div);
      if (field.label) {
        $element('span', field.node.div, field.label);
      }
    } else if (inputKind === 'checkbox') {
      field.node.input = segment.checkboxWithNullLabel
        ? $input(['checkbox', null, field.label], field.node.div)
        : $input(['checkbox', field.label], field.node.div);
    } else if (inputKind === 'number') {
      field.node.input = $input(['number'], field.node.div);
      if (field.label) {
        $element('span', field.node.div, field.label);
      }
    } else {
      field.node.input = $input(['text'], field.node.div);
    }

    let text = config.text[field.text || field.key] || field.text;
    if (text) {
      text = format_hvut_config_field_help_text(text);
      field.node.text = $element('p', field.node.div, ['/' + text]);
    }
    if (inputKind === 'textarea' && segment.showTextareaDefaultButton) {
      $input(['button', '恢复默认'], field.node.div, null, () => { config.set_input(field); });
    }
    let desc = config.desc[field.desc || field.key];
    if (desc) {
      desc = format_hvut_config_field_description(desc);
      $input(['button', desc.button], field.node.div, null, () => { field.node.desc.classList.toggle('hvut-none'); });
      //$element('br', field.node.div);
      field.node.desc = $element('p', field.node.div, ['/' + desc.html, '.hvut-none']);
    }

    if (inputKind === 'textarea') { // append here
      field.node.input = $element('textarea', field.node.div, { spellcheck: false });
    }
    field.node.input.dataset.key = field.key;
    if (field.style) {
      field.node.input.style.cssText = field.style;
    }
    if (is_hvut_config_field_disabled(field, segment)) {
      field.node.div.classList.add('hvut-cfg-disabled');
      field.node.input.disabled = true;
    }
    if (field.oncreate) {
      field.oncreate(field);
    }
  };
  var inject_hvut_config_panel_style = function (context) {
    if (context?.isIsekai) {
      GM_addStyle(/*css*/`
        .hvut-cfg-div { position: absolute; top: 0; left: 0; width: 60%; height: 100%; padding: 0 20%; overflow: auto; font-size: 10pt; text-align: left; background-color: var(--color-bg-default); z-index: 10; }
        .hvut-cfg-div header { margin-bottom: 20px; padding: 10px; font-size: 15pt; font-weight: bold; border-bottom: 2px solid var(--color-border-default); }
        .hvut-cfg-div h1 { margin: 20px 0 10px; padding: 10px; font-size: 11pt; font-weight: bold; background-color: var(--color-bg-alpha); }
        .hvut-cfg-div h2 { margin: 0; font-size: 10pt; font-weight: bold; }
        .hvut-cfg-div h3 { margin: 0; font-size: 10pt; font-weight: bold; text-decoration: underline; }
        .hvut-cfg-div div { margin-left: 10px; padding: 10px; line-height: 24px; }
        .hvut-cfg-div div:hover { background-color: var(--color-bg-alpha); }
        .hvut-cfg-div p { margin: 0; }
        .hvut-cfg-disabled { color: var(--color-font-invalid); }
        .hvut-cfg-error { box-shadow: 0 0 0 2px var(--color-font-warn) inset; }
        .hvut-cfg-error p:last-child { padding: 10px; background-color: var(--color-bg-alpha); color: var(--color-font-warn); }
        .hvut-cfg-div footer { position: sticky; bottom: 0; margin-top: 20px; padding: 10px; border-top: 2px solid var(--color-border-default); text-align: center; background-color: inherit; }
        .hvut-cfg-div input[type='text'] { width: 95%; }
        .hvut-cfg-div input[type='number'] { width: 50px; text-align: right; }
        .hvut-cfg-div textarea { width: 95%; min-height: 200px; white-space: nowrap; }
      `);
      return;
    }
    GM_addStyle(/*css*/`
      .hvut-cfg-div { position: absolute; top: 27px; left: 0; width: 60%; height: calc(100% - 27px); padding: 0 20%; overflow: auto; font-size: 10pt; text-align: left; background-color:#EDEBDF; z-index: 9; }
      .hvut-cfg-div header { margin-bottom: 20px; padding: 10px; font-size: 15pt; font-weight: bold; border-bottom: 2px solid; }
      .hvut-cfg-div h1 { margin: 20px 0 10px; padding: 10px; font-size: 12pt; font-weight: bold; background-color: #fff9; }
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
      .hvut-cfg-div textarea { width: 95%; height: 200px; white-space: nowrap; }
    `);
  };
  var render_hvut_config_panel = function (config, context) {
    var segment = create_hvut_config_segment_context(context);
    config.node = {};
    config.node.div = $element('div', null, ['.hvut-cfg-div'], { change: config.validate_panel });
    //$config.node.ul = $element('ul', config.node.div);
    $element('header', config.node.div, 'HV Utils 设置');

    config.data.forEach((field) => {
      if (field.tag) {
        $element(field.tag, config.node.div, field.text);
        //$element('li', $config.node.ul, field.text, () => { scrollIntoView(h); });
        return;
      }
      render_hvut_config_field_row(config, field, segment);
    });

    const bottom = $element('footer', config.node.div);
    $input(['button', '保存'], bottom, null, () => { config.save(true); });
    $input(['button', '关闭'], bottom, null, () => { config.close(); });
    $input(['button', '恢复'], bottom, null, () => { config.load(config.settings); });
    $input(['button', '恢复默认'], bottom, null, () => { config.load(config.default); });
  };
  var create_hvut_item_shop_parse_evidence = function (stage, detail) {
    var evidence = { capability: 'hvutItemShopParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutItemShopParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT item shop parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT item shop parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT item shop parse fallback.
    }
    return evidence;
  };
  var record_hvut_item_shop_parse_failure = function (stage, detail) {
    create_hvut_item_shop_parse_evidence(stage, detail);
    return null;
  };
  var parse_hvut_item_shop_row = function (row, pattern, stage) {
    var cell = row?.cells?.[0];
    var name = cell?.textContent?.trim() || '';
    var onclick = cell?.firstElementChild?.getAttribute('onclick') || '';
    var match = pattern.exec(onclick);
    if (!match) {
      return record_hvut_item_shop_parse_failure(stage, { name: name, onclick: onclick, text: row?.textContent || '' });
    }
    return { name: name, id: parseInt(match[1]), stock: parseInt(match[2]), price: parseInt(match[3]) };
  };
  var parse_hvut_inventory_item_row = function (row, stage) {
    var name = row?.cells?.[0]?.textContent?.trim() || '';
    var idText = row?.cells?.[0]?.firstElementChild?.id || '';
    var stockText = row?.cells?.[1]?.textContent || '';
    var idMatch = /^item_(\d+)$/.exec(idText);
    var stock = parseInt(stockText);
    if (!name || !idMatch || !Number.isFinite(stock)) {
      return record_hvut_item_shop_parse_failure(stage, { name: name, id: idText, stock: stockText, text: row?.textContent || '' });
    }
    return { name: name, id: parseInt(idMatch[1]), stock: stock };
  };
  var classify_hvut_item_shop_buy_response = function (doc, stage, detail) {
    var message = get_message(doc);
    if (message) {
      var evidence = record_hvut_item_shop_parse_failure(stage, { ...detail, reason: 'rejectedResponse', message: message });
      return { kind: 'rejected', reason: 'rejectedResponse', message: message, evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var reject_hvut_item_shop_buy = function (reason, detail, message) {
    var evidence = create_hvut_item_shop_parse_evidence(reason, detail);
    return { kind: 'rejected', reason: reason, message: message || (IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.'), evidence: evidence };
  };
  var run_hvut_item_shop_buy = async function (items, itemShop) {
    if (!items.length) {
      return reject_hvut_item_shop_buy('emptyRequest', {}, IS_ISEKAI ? 'The purchase request list is empty.' : '购买请求列表为空.');
    }
    try {
      if ((await itemShop.load_shop()) === false) {
        return reject_hvut_item_shop_buy('shopLoadRejected', {});
      }
    } catch (error) {
      return reject_hvut_item_shop_buy('shopLoadRequest', { error: error?.message || String(error) });
    }
    const cost = itemShop.cost(items);
    if (cost > itemShop.networth) {
      return reject_hvut_item_shop_buy('insufficientCredits', { cost: cost, networth: itemShop.networth }, '你没有足够的credits.');
    }
    const nostock = items.find((item) => item.count > (itemShop.shop[item.name]?.shop_stock || 0));
    if (nostock) {
      return reject_hvut_item_shop_buy('insufficientStock', { name: nostock.name, count: nostock.count, stock: itemShop.shop[nostock.name]?.shop_stock || 0 }, IS_ISEKAI ? 'Insufficient number of items in the Item Shop.' : '系统商店中的物品数量不足.');
    }
    items.forEach((item) => {
      item.id = itemShop.shop[item.name].id;
    });

    async function buy(item) {
      const id = item.id;
      const count = item.count;
      const html = await $ajax.fetch(create_hvut_item_shop_url(), `storetoken=${itemShop.storetoken}&select_mode=shop_pane&select_item=${id}&select_count=${count}`);
      const doc = $doc(html);
      return classify_hvut_item_shop_buy_response(doc, 'shopBuyResponse', { name: item.name, id: id, count: count });
    }

    const requests = items.map((item) => buy(item));
    let results;
    try {
      results = await Promise.all(requests);
    } catch (error) {
      return reject_hvut_item_shop_buy('shopBuyRequest', { items: items.map((item) => ({ name: item.name, id: item.id, count: item.count })), error: error?.message || String(error) });
    }
    if (!results.every((r) => r?.kind === 'accepted')) {
      return reject_hvut_item_shop_buy('shopBuyRejected', { items: items.map((item) => ({ name: item.name, id: item.id, count: item.count })), results: results });
    }
    return { kind: 'accepted' };
  };
  var record_hvut_repair_load_failure = function (stage, detail) {
    var evidence = { capability: 'hvutRepairLoad', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutRepairLoadFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT repair load fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT repair load failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT repair load fallback.
    }
    return evidence;
  };
  var classify_hvut_repair_load_response = function (doc, stage, detail) {
    var message = get_message(doc);
    if (message) {
      var evidence = record_hvut_repair_load_failure(stage, { ...detail, reason: 'rejectedResponse', message: message });
      return { kind: 'rejected', reason: 'rejectedResponse', message: message, evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var record_hvut_top_level_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutTopLevelParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutTopLevelParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT top level parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT top level parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT top level parse fallback.
    }
    return null;
  };
  var parse_hvut_top_level_progress = function (text, stage) {
    var match = /([0-9,]+) \/ ([0-9,]+)\s*Next: ([0-9,]+)/.exec(text || '');
    if (!match) {
      return record_hvut_top_level_parse_failure(stage, { text: text || '' });
    }
    return {
      exp: parseInt(match[1].replace(/,/g, '')),
      up: parseInt(match[2].replace(/,/g, '')),
      next: parseInt(match[3].replace(/,/g, '')),
    };
  };
  var record_hvut_ability_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutAbilityParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutAbilityParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Ability parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] ability parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT ability parse fallback.
    }
    return null;
  };
  var record_hvut_ability_unlock_failure = function (stage, detail) {
    var evidence = { capability: 'hvutAbilityUnlock', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutAbilityUnlockFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Ability unlock fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] ability unlock failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT ability unlock fallback.
    }
    return evidence;
  };
  var parse_hvut_ability_points = function (text) {
    var match = /Ability Points: (\d+)/.exec(text || '');
    return match ? parseInt(match[1]) : record_hvut_ability_parse_failure('abilityPoints', { text: text || '' });
  };
  var parse_hvut_ability_button_type = function (backgroundImage) {
    var match = /(.)\.png/.exec(backgroundImage || '');
    return match ? match[1] : record_hvut_ability_parse_failure('abilityButtonType', { backgroundImage: backgroundImage || '' });
  };
  var parse_hvut_ability_points_from_top = function (top, stage) {
    var text = top?.children?.[3]?.textContent;
    return text === undefined ? record_hvut_ability_parse_failure(stage, { reason: 'abilityPointNodeMissing' }) : parse_hvut_ability_points(text);
  };
  var parse_hvut_ability_button_panel = function (div, stage) {
    var panel = div?.children?.[2];
    return panel || record_hvut_ability_parse_failure(stage, { reason: 'abilityButtonPanelMissing', text: div?.textContent || '' });
  };
  var parse_hvut_ability_unlock_button = function (ability, stage) {
    var panel = parse_hvut_ability_button_panel(ability?.div, stage);
    if (panel === null) {
      record_hvut_ability_unlock_failure(stage, { reason: 'abilityButtonPanelMissing', id: ability?.id || '' });
      return null;
    }
    var button = $qs('div[style*="u.png"]', panel);
    return button || record_hvut_ability_unlock_failure(stage, { reason: 'abilityUnlockButtonMissing', id: ability?.id || '' });
  };
  var classify_hvut_ability_unlock_response = function (doc, stage, detail) {
    var error = get_message(doc);
    if (error) {
      var evidence = record_hvut_ability_unlock_failure(stage, { ...detail, reason: 'rejectedResponse', error: error });
      return { kind: 'rejected', reason: 'rejectedResponse', message: error, evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var run_hvut_ability_unlock_request = async function (ability, context) {
    var html = await $ajax.fetch(location.href, `unlock_ability=${ability.id}`);
    var doc = $doc(html);
    var response = classify_hvut_ability_unlock_response(doc, context?.responseStage || 'abilityUnlockResponse', { id: ability?.id || '' });
    if (response.kind === 'rejected') {
      popup(response.message);
      return false;
    }
    var button = parse_hvut_ability_unlock_button(ability, context?.buttonStage || 'abilityUnlockButton');
    if (button) {
      button.style.opacity = 0.5;
      button.style.backgroundImage = button.style.backgroundImage.replace('u.png', 'f.png');
    }
    return true;
  };
  var parse_hvut_ability_unlock_id = function (panel, stage) {
    var onclick = panel?.getAttribute('onclick') || '';
    var match = /do_unlock_ability\((\d+)\)/.exec(onclick);
    return match ? match[1] : record_hvut_ability_parse_failure(stage, { onclick: onclick });
  };
  var mark_hvut_ability_warning = function (div, warn, stage) {
    var node = div?.firstElementChild?.firstElementChild;
    if (!node) return record_hvut_ability_parse_failure(stage, { reason: 'abilityWarningNodeMissing', warn: warn });
    node.classList.add('hvut-ab-warn');
    node.dataset.warn = warn;
    return true;
  };
  var record_hvut_training_notification_failure = function (stage, detail) {
    var evidence = { capability: 'hvutTrainingNotification', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutTrainingNotificationFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Training notification fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] training notification failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT training notification fallback.
    }
    return null;
  };
  var parse_hvut_training_end_time = function (source, stage) {
    var seconds = typeof source === 'number' ? source : undefined;
    if (seconds === undefined) {
      var match = /var end_time = (\d+);/.exec(source || '');
      seconds = match ? parseInt(match[1]) : NaN;
    }
    return Number.isFinite(seconds) && seconds > 0
      ? seconds * 1000
      : record_hvut_training_notification_failure(stage, { sourceType: typeof source });
  };
  var parse_hvut_training_row = function (row, stage) {
    var nameCell = row?.cells?.[0];
    var name = nameCell?.textContent?.trim() || '';
    var enName = nameCell ? (resolveEn(nameCell, 'trains') ?? name) : '';
    var time = parseFloat(row?.cells?.[3]?.textContent);
    var level = parseInt(row?.cells?.[4]?.textContent);
    var max = parseInt(row?.cells?.[6]?.textContent);
    if (!enName || !Number.isFinite(time) || !Number.isFinite(level) || !Number.isFinite(max)) {
      return record_hvut_training_notification_failure(stage, { name: name, text: row?.textContent || '' });
    }
    return { name: name, enName: enName, time: time, level: level, max: max };
  };
  var classify_hvut_training_notification_response = function (doc, stage, detail) {
    var error = get_message(doc);
    if (error) {
      var evidence = record_hvut_training_notification_failure(stage, { ...detail, reason: 'rejectedResponse', error: error });
      return { kind: 'rejected', reason: 'rejectedResponse', message: error, evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var create_hvut_mooglemail_parse_evidence = function (stage, detail) {
    var evidence = { capability: 'hvutMoogleMailParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutMoogleMailParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // MoogleMail parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] MoogleMail parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT MoogleMail parse fallback.
    }
    return evidence;
  };
  var record_hvut_mooglemail_parse_failure = function (stage, detail) {
    create_hvut_mooglemail_parse_evidence(stage, detail);
    return null;
  };
  var record_hvut_mooglemail_send_failure = function (stage, detail) {
    var evidence = { capability: 'hvutMoogleMailSend', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutMoogleMailSendFailure', JSON.stringify(evidence));
    } catch (_error) {
      // MoogleMail send fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] MoogleMail send failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT MoogleMail send fallback.
    }
    return evidence;
  };
  var record_hvut_mooglemail_action_failure = function (stage, detail) {
    var evidence = { capability: 'hvutMoogleMailAction', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutMoogleMailActionFailure', JSON.stringify(evidence));
    } catch (_error) {
      // MoogleMail action fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] MoogleMail action failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT MoogleMail action fallback.
    }
    return evidence;
  };
  var wait_hvut_mooglemail_db_write = function (stage, detail, conn) {
    return new Promise((resolve) => {
      try {
        conn.tx.oncomplete = function () {
          resolve(true);
        };
        conn.tx.onerror = function (event) {
          record_hvut_mooglemail_action_failure(stage, { ...detail, error: event?.target?.error?.message || 'transaction error' });
          resolve(false);
        };
        conn.tx.onabort = function (event) {
          record_hvut_mooglemail_action_failure(stage, { ...detail, error: event?.target?.error?.message || 'transaction aborted' });
          resolve(false);
        };
      } catch (error) {
        record_hvut_mooglemail_action_failure(stage, { ...detail, error: error?.message || String(error) });
        resolve(false);
      }
    });
  };
  var create_hvut_mooglemail_db_search_failure = function (stage, season, state, resolve) {
    return function (event) {
      if (state.settled) {
        return;
      }
      state.settled = true;
      record_hvut_mooglemail_action_failure(stage, { season: season, error: event?.target?.error?.message || 'search transaction error' });
      resolve([]);
    };
  };
  var run_hvut_mooglemail_db_search = function (query, context) {
    const { season, filter, name, subject, text, attach, eid, cod, cod_min, cod_max } = query;
    const results = [];
    return new Promise((resolve) => {
      const conn = context.conn('readonly', season);
      const searchState = { settled: false };
      const fail = create_hvut_mooglemail_db_search_failure(context.failureStage, season, searchState, resolve);
      conn.tx.onerror = fail;
      conn.tx.onabort = fail;
      const request = conn.os.openCursor();
      request.onsuccess = function (e) {
        if (searchState.settled) {
          return;
        }
        const cursor = e.target.result;
        if (cursor) {
          const db = cursor.value;
          const mail = context.getMail(db.mid, season);
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
          searchState.settled = true;
          resolve(results);
        }
      };
      request.onerror = fail;
    });
  };
  var stop_hvut_mooglemail_send_failure = async function (stage, detail, message, discardStage) {
    record_hvut_mooglemail_send_failure(stage, detail);
    if (message) {
      $mail.log(message);
    }
    if (discardStage) {
      try {
        await $mail.discard();
      } catch (discardError) {
        record_hvut_mooglemail_send_failure(discardStage, { stage: stage, error: discardError?.message || String(discardError) });
        $mail.log('!!! Error: Unable to discard attachments');
      }
    }
    $mail.ready = true;
    return false;
  };
  var classify_hvut_mooglemail_send_response = function (html, stage, detail) {
    if (typeof html !== 'string' || !html.trim()) {
      var evidence = record_hvut_mooglemail_send_failure(stage, { ...detail, reason: 'emptyResponse' });
      return { kind: 'rejected', reason: 'emptyResponse', evidence: evidence };
    }
    var error = get_message($doc(html));
    if (error) {
      var evidence = record_hvut_mooglemail_send_failure(stage, { ...detail, reason: 'mailError', error: error });
      $mail.error = error;
      $mail.log('!!! Error: ' + error);
      return { kind: 'rejected', reason: 'mailError', error: error, evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var classify_hvut_mooglemail_attach_response = function (html, stage, detail) {
    return classify_hvut_mooglemail_send_response(html, stage, detail);
  };
  var parse_hvut_mooglemail_count = function (text, pattern, stage) {
    var match = pattern.exec(text || '');
    return match ? parseInt(match[1].replace(/,/g, '')) || 0 : record_hvut_mooglemail_parse_failure(stage, { text: text || '' });
  };
  var parse_hvut_mooglemail_page_href = function (link, stage) {
    if (!link) return null;
    var href = link.href || '';
    if (!href) return null;
    var match = /&page=(\d+)/.exec(href);
    return match ? parseInt(match[1]) : record_hvut_mooglemail_parse_failure(stage, { href: href });
  };
  var update_hvut_mooglemail_page_window = function (state, pager, page, context) {
    const prev = parse_hvut_mooglemail_page_href(pager?.children?.[0]?.firstElementChild, context.prevStage);
    const next = parse_hvut_mooglemail_page_href(pager?.children?.[1]?.firstElementChild, context.nextStage);
    if (state[context.prevKey] !== null && page <= state[context.prevKey]) {
      state[context.prevKey] = prev;
    }
    if (state[context.nextKey] !== null && page >= state[context.nextKey]) {
      state[context.nextKey] = next;
    }
    context.prevButton.disabled = state[context.prevKey] === null;
    context.nextButton.disabled = state[context.nextKey] === null;
  };
  var parse_hvut_mooglemail_mid = function (onclick, stage) {
    var match = /mid=(\d+)/.exec(onclick || '');
    return match ? parseInt(match[1]) : record_hvut_mooglemail_parse_failure(stage, { onclick: onclick || '' });
  };
  var parse_hvut_mooglemail_page_row = function (row, filter, stage) {
    if (row.cells[0].id === 'mmail_nnm') {
      return { kind: 'empty' };
    }
    const mid = parse_hvut_mooglemail_mid(row.getAttribute('onclick'), stage);
    if (mid === null) {
      return { kind: 'rejected' };
    }
    const user = row.cells[0].textContent;
    let sent = row.cells[2].textContent;
    sent = Date.parse(sent + ':00.000Z') / 1000;
    let read = row.cells[3].textContent;
    read = read === 'Never' ? null : Date.parse(read + ':00.000Z') / 1000;
    return {
      kind: 'mail',
      mid: mid,
      page: {
        filter: filter,
        user: user,
        returned: user === 'MoogleMail',
        subject: row.cells[1].textContent,
        sent: sent,
        read: read,
      },
    };
  };
  var render_hvut_mooglemail_page_row = function (mail, formatDate) {
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
          $element('a', span, { textContent: e.n, href: create_hvut_equip_page_url({ eid: e.e, key: e.k }), target: '_blank' });
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
    tr.cells[4].textContent = formatDate(page.sent);
    tr.cells[5].textContent = page.read ? formatDate(page.read) : '';

    tr.classList[page.read ? 'remove' : 'add']('hvut-mm-unread');
    tr.classList[(db || page).returned ? 'add' : 'remove']('hvut-mm-returned');
    tr.classList[(db || page).filter !== page.filter ? 'add' : 'remove']('hvut-mm-removed');
    tr.classList[db ? 'remove' : 'add']('hvut-mm-nodb');
  };
  var render_hvut_mooglemail_view_attach_list = function (mail, div, db, context) {
    mail.attach = [];
    if (!db.attach) return;
    const ul = $element('ul', div, null, { input: context.onInput });
    const li = $element('li', ul);
    const wtx = db.filter === 'sent' ? 'WTS' : 'WTB';

    let codText;
    if (db.cod) {
      codText = db.read ? `CoD Paid: ${db.cod.toLocaleString()}` : `CoD: ${db.cod.toLocaleString()}`;
    } else {
      codText = context.noCodText;
    }
    $element('span', li, codText);
    mail.node.price = $input('text', li, { className: 'hvut-mm-price', readOnly: true, value: wtx });
    mail.node.cod = $input('text', li, { className: 'hvut-mm-cod', readOnly: true });
    mail.attach = JSON.parse(JSON.stringify(db.attach));
    mail.attach.forEach((e) => {
      const li = $element('li', ul);
      const span = $element('span', li, [`.hvut-mm-attach-${e.t}`]);
      if (e.t === 'e') {
        if (e.e && e.k) {
          $element('a', span, { textContent: e.n, href: create_hvut_equip_page_url({ eid: e.e, key: e.k }), target: '_blank' });
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
  };
  var render_hvut_mooglemail_view_shell = function (mail, div, db, view, context) {
    const mid = mail.mid;
    div.innerHTML = '';
    if (!db) {
      $element('p', div, [`${context.missingDbPrefix}${view.error}`, '.hvut-mm-loading']);
      return false;
    }
    div.classList[db.returned ? 'add' : 'remove']('hvut-mm-rts');

    const type = db.filter === 'sent' ? 'To' : '来自';
    const read = db.read === null ? '-' : db.read === -1 ? '????-??-??' : context.formatDate(db.read, 4);
    $element('dl', div, [`/<dt>${type}</dt><dd>${db.user}</dd><dt>${context.sentLabel}</dt><dd>${context.formatDate(db.sent, 4)}</dd><dt>${context.subjectLabel}</dt><dd>${db.subject}</dd><dt>${context.readLabel}</dt><dd>${read}</dd>`]);

    context.assignBody($element('textarea', div, { value: db.text, spellcheck: false, readOnly: true }));
    const buttons = $element('div', div);
    $input(['button', '关闭'], buttons, { dataset: { action: 'close', mid } });
    if (view.reply) {
      $input(['button', '回复'], buttons, { dataset: { action: 'reply', mid } });
    }
    if (view.take) {
      $input(['button', '全部获取'], buttons, { dataset: { action: 'take', mid, value: view.cod || '' } });
    }
    if (view.return) {
      $input(['button', '退回'], buttons, { dataset: { action: 'return', mid } });
    }
    if (view.recall) {
      $input(['button', '撤回'], buttons, { dataset: { action: 'recall', mid } });
    }
    if (view.error) {
      $input(['button', view.error], buttons);
      div.classList.add('hvut-mm-failed');
    } else {
      div.classList.remove('hvut-mm-failed');
    }
    if (db.returned) {
      $input(['button', context.returnedMessage(db)], buttons);
    }
    context.renderExtraButtons?.(buttons, mail, db, view);
    return true;
  };
  var apply_hvut_mooglemail_view_identity = function (view) {
    if (view.from === 'MoogleMail') {
      const returnedMatch = /This message was returned from (.+), kupo!|This mail was sent to (.+), but was returned, kupo!/.exec(view.text.split('\n').reverse().join('\n'));
      view.from = returnedMatch ? (returnedMatch[1] || returnedMatch[2]) : false;
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
    return view;
  };
  var parse_hvut_mooglemail_view_form = function (form, doc) {
    const view = {
      to: form.elements[3].value,
      from: form.elements[4].value,
      subject: form.elements[5].value,
      text: form.elements[6].value,
      attach: [],
      return: $qs('#mmail_showbuttons > img[src*="returnmail.png"]', doc) ? true : false,
      recall: $qs('#mmail_showbuttons > img[src*="recallmail.png"]', doc) ? true : false,
      reply: $qs('#mmail_showbuttons > img[src*="reply.png"]', doc) ? true : false,
      take: $qs('#mmail_attachremove > img[src*="attach_takeall.png"]', doc) ? true : false,
    };
    apply_hvut_mooglemail_view_identity(view);
    return { view: view, mmtoken: form.elements.mmtoken.value };
  };
  var create_hvut_mooglemail_cache_write_plan = function (mail, post, context) {
    const mid = mail.mid;
    const page = mail.page;
    const view = mail.view;
    if (view.error) return null;
    if (mail.db) {
      const db = mail.db;
      const sent = page?.sent || db.sent;
      let read = page?.read || db.read;
      if (read === null && view.read) {
        read = -1;
      }
      if (db.filter === view.filter && db.user === view.user && db.subject === view.subject && db.text === view.text && db.sent === sent && db.read === read) {
        return null;
      }
      const nextDb = { ...db, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: sent, read: read };
      if (view.returned) {
        nextDb.returned = 1;
        delete nextDb.cod;
      }
      return {
        operation: 'put',
        stage: post ? context.actionUpdateStage : context.loadUpdateStage,
        detail: { mid: mid, post: post || '', operation: 'put' },
        value: nextDb,
        apply: function () {
          Object.assign(db, nextDb);
        },
      };
    }
    if (!page) return null;
    const db = { mid: mid, filter: view.filter, user: view.user, subject: view.subject, text: view.text, sent: page.sent, read: page.read };
    if (view.returned) {
      db.returned = 1;
    }
    if (view.attach.length) {
      db.attach = view.attach;
    }
    if (view.cod) {
      db.cod = view.cod;
    }
    return {
      operation: 'add',
      stage: post ? context.actionInsertStage : context.loadInsertStage,
      detail: { mid: mid, post: post || '', operation: 'add' },
      value: db,
      apply: function () {
        mail.db = db;
      },
    };
  };
  var run_hvut_mooglemail_cache_write_plan = async function (writePlan, db) {
    if (!writePlan) return true;
    const conn = db.conn('readwrite');
    try {
      if (writePlan.operation === 'put') {
        conn.os.put(writePlan.value);
      } else {
        conn.os.add(writePlan.value);
      }
    } catch (error) {
      record_hvut_mooglemail_action_failure(writePlan.stage, { ...writePlan.detail, error: error?.message || String(error) });
      return false;
    }
    if (!await wait_hvut_mooglemail_db_write(writePlan.stage, writePlan.detail, conn)) {
      return false;
    }
    writePlan.apply();
    return true;
  };
  var run_hvut_mooglemail_view_load = async function (mid, post, context) {
    const mail = context.get(mid);
    let html;
    try {
      html = await $ajax.fetch(create_hvut_mail_view_url(mid), post);
    } catch (error) {
      const stage = post ? context.actionRequestStage : context.loadRequestStage;
      const evidence = record_hvut_mooglemail_action_failure(stage, { mid: mid, post: post || '', error: error?.message || String(error) });
      mail.view = { error: post ? '邮件动作请求失败' : '读取邮件失败' };
      return { kind: 'rejected', reason: 'requestFailed', error: mail.view.error, evidence: evidence };
    }
    mail.view = context.parse(html);
    if (mail.view?.error) {
      const evidence = record_hvut_mooglemail_action_failure(post ? context.actionRejectedStage : context.loadRejectedStage, { mid: mid, post: post || '', error: mail.view.error });
      return { kind: 'rejected', reason: 'responseRejected', error: mail.view.error, evidence: evidence };
    }
    if (!await context.update(mail, post)) {
      mail.view = { ...mail.view, error: post ? '邮件动作保存失败' : '邮件缓存保存失败' };
      const evidence = record_hvut_mooglemail_action_failure(post ? context.actionCacheWriteRejectedStage : context.loadCacheWriteRejectedStage, { mid: mid, post: post || '', error: mail.view.error });
      return { kind: 'rejected', reason: 'cacheWriteFailed', error: mail.view.error, evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var parse_hvut_mooglemail_equip_attach = function (onmouseover, store, stage) {
    var match = /equips\.set\((\d+)/.exec(onmouseover || '');
    if (!match) return false;
    var eid = parseInt(match[1]);
    var equip = store?.[eid];
    if (!equip) return record_hvut_mooglemail_parse_failure(stage, { eid: eid, onmouseover: onmouseover || '' });
    return { t: 'e', n: equip.t, e: eid, k: equip.k };
  };
  var parse_hvut_mooglemail_visible_attach_list = function (view, doc, html, context) {
    Object.assign($equip.dynjs_eqstore, parse_script_json(html, 'dynjs_eqstore'));
    Array.from($id('mmail_attachlist', doc).children).forEach((div) => {
      let exec;
      const onmouseover = div.firstElementChild?.firstElementChild?.getAttribute('onmouseover');
      const equipAttach = parse_hvut_mooglemail_equip_attach(onmouseover, $equip.dynjs_eqstore, context.equipStage);
      if (equipAttach) {
        view.attach.push(equipAttach);
      } else if (equipAttach === null) {
        view.error = '解析装备附件失败';
      } else if ((exec = /^([0-9,]+)x? (.+)$/.exec(div.textContent))) {
        const count = context.parseCount(exec[1]);
        const name = exec[2];
        const type = name === 'Hath' ? 'h' : name === 'Credits' ? 'c' : 'i';
        view.attach.push({ t: type, n: name, c: count });
      } else {
        console.log(div.textContent.trim());
      }
    });
    if ($id('mmail_currentcod', doc)) {
      view.cod = parse_hvut_mooglemail_count($id('mmail_currentcod', doc).textContent, /Requested Payment on Delivery: ([0-9,]+) credits/, context.codStage);
      if (view.cod === null) {
        view.error = '解析货到付款失败';
        view.cod = 0;
      }
    }
  };
  var parse_hvut_mooglemail_historical_attach_text = function (view, parseCount) {
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
        const type = name === 'Hath' ? 'h' : name === 'Credits' ? 'c' : 'i';
        const count = parseCount(exec[1]);
        view.attach.unshift({ t: type, n: name, c: count });
      }
      return true;
    });
    if (attach) {
      view.cod = parseCount(/^CoD Paid: ([0-9,]+) Credits$/.exec(split[1])?.[1]);
    }

    const exec = /^Attached item removed: (?:([0-9,]+)x? (.+)|(.+)) \(type=([chie]) id=(\d+), CoD was ([0-9]+)C\)$/.exec(split[0]);
    if (exec) {
      const type = exec[4];
      if (type === 'e') {
        const name = exec[3];
        const eid = exec[5];
        view.attach.push({ t: type, n: name, e: eid });
      } else {
        const name = exec[2];
        const count = parseCount(exec[1]);
        view.attach.push({ t: type, n: name, c: count });
      }
      view.cod = parseCount(exec[6]);
    }
  };
  var parse_hvut_mooglemail_view = function (doc, html, context) {
    const form = $id('mailform', doc);
    if (!form) {
      const view = {};
      const response = classify_hvut_mooglemail_view_response(doc, context.rejectedStage);
      if (response.kind === 'rejected') {
        view.error = response.error;
      }
      return { view: view };
    }

    const parsed = parse_hvut_mooglemail_view_form(form, doc);
    const view = parsed.view;
    if ($id('mmail_attachlist', doc)) {
      parse_hvut_mooglemail_visible_attach_list(view, doc, html, {
        equipStage: context.equipStage,
        codStage: context.codStage,
        parseCount: context.parseCount,
      });
    } else {
      parse_hvut_mooglemail_historical_attach_text(view, context.parseCount);
    }
    return { view: view, mmtoken: parsed.mmtoken };
  };
  var classify_hvut_mooglemail_view_response = function (doc, stage) {
    var message = get_message(doc);
    if (!message) {
      var evidence = create_hvut_mooglemail_parse_evidence(stage, { reason: 'viewResponseMessageMissing' });
      return { kind: 'rejected', reason: 'viewResponseMessageMissing', error: '未知错误', evidence: evidence };
    }
    var evidence = create_hvut_mooglemail_parse_evidence(stage, { reason: 'mailError', error: message });
    return { kind: 'rejected', reason: 'mailError', error: message, evidence: evidence };
  };
  var record_hvut_monster_lab_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutMonsterLabParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutMonsterLabParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Monster Lab parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Monster Lab parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Monster Lab parse fallback.
    }
    return null;
  };
  var record_hvut_monster_lab_upgrade_failure = function (stage, detail) {
    var evidence = { capability: 'hvutMonsterLabUpgrade', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutMonsterLabUpgradeFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Monster Lab upgrade fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Monster Lab upgrade failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Monster Lab upgrade fallback.
    }
    return evidence;
  };
  var classify_hvut_monster_lab_upgrade_response = function (html, stage, detail) {
    if (typeof html !== 'string' || !html.trim()) {
      var evidence = record_hvut_monster_lab_upgrade_failure(stage, { ...detail, reason: 'emptyResponse' });
      return { kind: 'rejected', reason: 'emptyResponse', evidence: evidence };
    }
    return { kind: 'accepted' };
  };
  var parse_hvut_monster_lab_chaos_token_cost = function (text, stage) {
    var match = /Cost: (\d+) Chaos Token/.exec(text || '');
    return match ? parseInt(match[1]) : record_hvut_monster_lab_parse_failure(stage, { text: text || '' });
  };
  var parse_hvut_monster_lab_main_surface = function (div, stage) {
    var nameNode = div?.children?.[1];
    var plNode = div?.children?.[2];
    var classNode = div?.children?.[3];
    var hungerdiv = div?.children?.[4];
    var moralediv = div?.children?.[5];
    var hungerbar = hungerdiv?.firstElementChild?.firstElementChild;
    var moralebar = moralediv?.firstElementChild?.firstElementChild;
    var pl = parseInt((plNode?.textContent || '').slice(4));
    var hunger = parseInt(hungerbar?.style?.width) * 200;
    var morale = parseInt(moralebar?.style?.width) * 200;
    if (!nameNode || !plNode || !classNode || !hungerdiv || !moralediv || !hungerbar || !moralebar || !Number.isFinite(pl) || !Number.isFinite(hunger) || !Number.isFinite(morale)) {
      return record_hvut_monster_lab_parse_failure(stage, { reason: 'monsterMainSurfaceMissing', text: div?.textContent || '' });
    }
    return { name: nameNode.textContent, className: classNode.textContent, pl: pl, plNode: plNode, hungerdiv: hungerdiv, moralediv: moralediv, hungerbar: hungerbar, moralebar: moralebar, hunger: hunger, morale: morale };
  };
  var parse_hvut_monster_lab_empty_slot = function (div, stage) {
    var index = parseInt(div?.firstElementChild?.textContent);
    return Number.isFinite(index)
      ? { node: { div: div }, index: index }
      : record_hvut_monster_lab_parse_failure(stage, { reason: 'emptyMonsterSlotMissing', text: div?.textContent || '' });
  };
  var record_hvut_player_state_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutPlayerStateParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutPlayerStateParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Player state parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] player state parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT player state parse fallback.
    }
    return null;
  };
  var parse_hvut_player_state = function (levelExec, staminaReadout, stage) {
    if (!levelExec) {
      return record_hvut_player_state_parse_failure(stage, { reason: 'levelReadoutMissing' });
    }
    if (!staminaReadout) {
      return record_hvut_player_state_parse_failure(stage, { reason: 'staminaReadoutMissing' });
    }
    var staminaMatch = /Stamina: (\d+)/.exec(staminaReadout.textContent || '');
    if (!staminaMatch) {
      return record_hvut_player_state_parse_failure(stage, { reason: 'staminaValueMissing', text: staminaReadout.textContent || '' });
    }
    var accuracyNode = staminaReadout.querySelector('div:nth-child(2)');
    var conditionNode = staminaReadout.querySelector('img[title^="Stamina"]');
    if (!accuracyNode || !conditionNode) {
      return record_hvut_player_state_parse_failure(stage, {
        reason: 'staminaTooltipMissing',
        hasAccuracy: !!accuracyNode,
        hasCondition: !!conditionNode,
      });
    }
    return {
      difficulty: levelExec[1],
      level: parseInt(levelExec[2]),
      stamina: parseInt(staminaMatch[1]),
      accuracy: accuracyNode.title,
      condition: conditionNode.title,
      warn: [],
    };
  };
  var record_hvut_shrine_capacity_failure = function (stage, detail) {
    var evidence = { capability: 'hvutShrineCapacity', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutShrineCapacityFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Shrine capacity fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Shrine capacity unavailable', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Shrine capacity fallback.
    }
    return null;
  };
  var record_hvut_shrine_reward_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutShrineRewardParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutShrineRewardParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Shrine reward parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Shrine reward selection unavailable', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Shrine reward fallback.
    }
    return null;
  };
  var record_hvut_shrine_item_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutShrineItemParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutShrineItemParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Shrine item parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Shrine item identity unavailable', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Shrine item fallback.
    }
    return null;
  };
  var record_hvut_shrine_offer_failure = function (stage, detail) {
    var evidence = { capability: 'hvutShrineOffer', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutShrineOfferFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Shrine offer fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Shrine offer failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Shrine offer fallback.
    }
    return evidence;
  };
  var record_hvut_random_encounter_failure = function (stage, detail) {
    var evidence = { capability: 'hvutRandomEncounter', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutRandomEncounterFailure', JSON.stringify(evidence));
    } catch (_error) {
      // HVUT random encounter fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVAA] HVUT random encounter failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT random encounter fallback.
    }
    return evidence;
  };
  var record_hvut_price_market_parse_failure = function (stage, detail) {
    var evidence = { capability: 'hvutPriceMarketParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutPriceMarketParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Price market parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] price market parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT price market parse fallback.
    }
    return false;
  };
  var parse_hvut_price_market_click_href = function (onclick, stage) {
    var match = /document\.location='([^']+)'/.exec(onclick || '');
    return match ? match[1] : record_hvut_price_market_parse_failure(stage, { onclick: onclick || '' });
  };
  var parse_hvut_price_market_row = function (row, filter, stage) {
    var cells = row?.cells || [];
    var name = cells[0]?.textContent || '';
    var itemidMatch = /itemid=(\d+)/.exec(row?.getAttribute('onclick') || '');
    if (!name || !itemidMatch || cells.length < 5) {
      return record_hvut_price_market_parse_failure(stage, { filter: filter || '', name: name, text: row?.textContent || '' });
    }
    var stock = parseInt(cells[1].textContent);
    if (!Number.isFinite(stock)) {
      return record_hvut_price_market_parse_failure(stage, { filter: filter || '', name: name, stock: cells[1].textContent || '' });
    }
    return {
      name: name,
      itemid: itemidMatch[1],
      stock: stock,
      bid: parseFloat(cells[2].textContent.slice(0, -2)) || 0,
      ask: parseFloat(cells[3].textContent.slice(0, -2)) || 0,
      market_stock: parseInt(cells[4].textContent.slice(0, -2)) || 0,
    };
  };
  var create_hvut_character_parse_evidence = function (stage, detail) {
    var evidence = { capability: 'hvutCharacterParse', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutCharacterParseFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Character parse fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] character parse failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT character parse fallback.
    }
    return evidence;
  };
  var record_hvut_character_parse_failure = function (stage, detail) {
    create_hvut_character_parse_evidence(stage, detail);
    return null;
  };
  var reject_hvut_persona_sync = function (reason, detail) {
    var evidence = create_hvut_character_parse_evidence(reason, detail);
    return { kind: 'rejected', reason: reason, evidence: evidence };
  };
  var reject_hvut_difficulty_refresh = function (reason, detail) {
    var evidence = create_hvut_character_parse_evidence(reason, detail);
    return { kind: 'rejected', reason: reason, evidence: evidence };
  };
  var render_hvut_equipment_persona_context = function (persona, stage) {
    var equipState = persona.check_e_outcome();
    if (equipState.kind === 'rejected') return equipState;
    persona.set_button();
    var equipsetOutcome = persona.save_equipset_outcome();
    if (equipsetOutcome.kind === 'rejected') return reject_hvut_persona_sync(stage, { reason: equipsetOutcome.reason });
    return { kind: 'accepted' };
  };
  var record_hvut_armory_submit_failure = function (stage, detail) {
    var evidence = { capability: 'hvutArmorySubmit', stage: stage, detail: detail || {} };
    try {
      sessionStorage.setItem('HVAA:lastHvutArmorySubmitFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Armory submit fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] Armory submit failed', evidence);
    } catch (_error) {
      // Console hooks must not block HVUT Armory submit fallback.
    }
    return evidence;
  };
  var classify_hvut_armory_submit_response = function (doc, stage, detail) {
    var message = $id('messagebox_outer', doc);
    if (!message) {
      var evidence = record_hvut_armory_submit_failure(stage, { ...detail, reason: 'messageMissing' });
      return { kind: 'rejected', reason: 'messageMissing', evidence: evidence };
    }
    return { kind: 'accepted', message: message };
  };
  var parse_hvut_difficulty_from_level_readout = function (doc, stage) {
    var text = $id('level_readout', doc)?.textContent?.trim() || '';
    var match = /^(.+) Lv\.(\d+)/.exec(text);
    return match ? match[1] : record_hvut_character_parse_failure(stage, { text: text });
  };
  var parse_hvut_persona_form_state = function (doc, stage) {
    var form = $id('persona_form', doc);
    var selector = form?.elements?.persona_set;
    if (!selector) {
      return record_hvut_character_parse_failure(stage, { reason: 'personaFormMissing' });
    }
    return {
      pset: parseInt(selector.value),
      plen: selector.options.length,
      options: Array.from(selector.options),
    };
  };
  var parse_hvut_equip_set_state = function (doc, stage) {
    var active = $qs('img[src$="_on.png"]', doc);
    var eqsl = $id('eqsl', doc);
    var match = /set(\d+)_on/.exec(active?.src || '');
    if (!match || !eqsl) {
      return record_hvut_character_parse_failure(stage, {
        reason: 'equipSetStateMissing',
        hasActive: !!active,
        hasEqsl: !!eqsl,
      });
    }
    return { eset: parseInt(match[1]), elen: eqsl.childElementCount };
  };
  var clear_hvut_equip_popup_drop_info = function (doc, stage) {
    var div = doc?.querySelector('.showequip')?.children?.[2];
    if (!div) {
      return record_hvut_character_parse_failure(stage, { reason: 'equipPopupDropInfoMissing' });
    }
    div.innerHTML = '';
    return true;
  };
  var append_hvut_equip_popup_charms = function (doc, div, stage) {
    var parent = doc?.querySelector('.eq');
    if (!parent) {
      return record_hvut_character_parse_failure(stage, { reason: 'equipPopupBodyMissing' });
    }
    parent.appendChild(div);
    return true;
  };
  var parse_hvut_character_base_stat_row = function (row, stage) {
    var name = row?.children?.[0]?.textContent;
    var value = row?.children?.[1]?.textContent;
    if (name === undefined || value === undefined) {
      return record_hvut_character_parse_failure(stage, { reason: 'baseStatRowIncomplete', text: row?.textContent || '' });
    }
    return { name: name, value: value };
  };
  var decorate_hvut_equipment_base_stat_row = function (row, base, stage) {
    var nameCell = row?.cells?.[1];
    if (!nameCell) {
      return record_hvut_character_parse_failure(stage, { reason: 'equipmentBaseStatNameMissing', text: row?.textContent || '' });
    }
    var name = nameCell.textContent;
    var enName = resolveEn(nameCell, 'characterStatus') ?? name;
    var baseVal = base[enName];
    nameCell.textContent = baseVal === undefined ? name : `[${baseVal}] ${name}`;
    return true;
  };
  var parse_hvut_inventory_capacity = function (html, stage) {
    var exec = /<td>Inventory Capacity:<\/td><td>(\d+)(?: \+ (\d+))?<\/td><td>\/<\/td><td>(\d+)<\/td>/.exec(html || '');
    if (!exec) {
      return record_hvut_shrine_capacity_failure(stage, { reason: 'inventoryCapacityMissing' });
    }
    return {
      usage: parseInt(exec[1]) + parseInt(exec[2] || 0),
      capacity: parseInt(exec[3]),
    };
  };
  var normalize_hvut_bottom_warn_capacity = function (settings, capacity) {
    var threshold = Number(settings?.warnEquipCapacity);
    var configured = Number.isFinite(threshold) && threshold >= 0 ? threshold : 50;
    var capacityLimit = Number.isFinite(capacity) && capacity > 0 ? capacity / 2 : configured;
    return Math.min(configured, capacityLimit);
  };
  var parse_hvut_shrine_reward_selection = function (button, stage) {
    var onclick = button?.getAttribute('onclick') || '';
    var exec = /submit_shrine_reward\('(.*?)','(.*?)'\)/.exec(onclick);
    if (!exec) {
      return record_hvut_shrine_reward_parse_failure(stage, { onclick: onclick });
    }
    return { type: exec[1], slot: exec[2] };
  };
  var parse_hvut_shrine_offer_item = function (div, stage) {
    var onclick = div?.getAttribute('onclick') || '';
    var item = $item.get_data(onclick);
    if (!item.iid || !Number.isFinite(item.stock) || !Number.isFinite(item.bulk) || item.bulk <= 0) {
      return record_hvut_shrine_item_parse_failure(stage, { onclick: onclick, text: div?.textContent || '' });
    }
    return item;
  };
  var update_hvut_shrine_equip_total = function (equip, baseKey) {
    if (!Number.isFinite(equip[baseKey]) || !Number.isFinite(equip.capacity) || equip.capacity <= 0) {
      equip.total = null;
      return null;
    }
    equip.total = equip[baseKey] + equip.received - equip.sold - equip.salvaged;
    return equip.total;
  };
  var is_hvut_shrine_equip_capacity_full = function (equip) {
    return Number.isFinite(equip.total) && Number.isFinite(equip.capacity) && equip.capacity > 0 && equip.total >= equip.capacity;
  };
  var set_hvut_shrine_stop_error = function (state, message, evidence) {
    if (!state.error) {
      state.error = message;
      state.errorEvidence = evidence || null;
      popup(message);
    }
    return state.error;
  };
  var run_hvut_shrine_offer_reservation_bridge = function (action, state, item) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_shrineOfferReservation : undefined;
    var itemIdentity = item?.name || item?.log || item?.iid;
    if (!bridge || typeof bridge[action] !== 'function') {
      return { ok: false, evidence: record_hvut_shrine_offer_failure('offerReservationBridgeMissing', { action: action, item: itemIdentity }) };
    }
    try {
      return { ok: bridge[action](state, item) !== false };
    } catch (error) {
      var stage = action === 'rollback' ? 'offerReservationBridgeRollback' : 'offerReservationBridgeReserve';
      return { ok: false, evidence: record_hvut_shrine_offer_failure(stage, { action: action, item: itemIdentity, error: error?.message || String(error) }) };
    }
  };
  var reserve_hvut_shrine_offer = function (state, item) {
    var result = run_hvut_shrine_offer_reservation_bridge('reserve', state, item);
    if (result.ok) return true;
    set_hvut_shrine_stop_error(state, 'Shrine offer reservation failed.', result.evidence);
    return false;
  };
  var rollback_hvut_shrine_offer_reservation = function (state, item) {
    var result = run_hvut_shrine_offer_reservation_bridge('rollback', state, item);
    if (result.ok) return true;
    set_hvut_shrine_stop_error(state, 'Shrine offer reservation rollback failed.', result.evidence);
    return false;
  };
  var run_hvut_shrine_offer_message_classifier_bridge = function (msg) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_shrineOfferMessage : undefined;
    if (!bridge || typeof bridge.classify !== 'function') {
      return { ok: false, evidence: record_hvut_shrine_offer_failure('offerMessageClassifierBridgeMissing', { message: msg }) };
    }
    try {
      return { ok: true, decision: bridge.classify(msg) };
    } catch (error) {
      return { ok: false, evidence: record_hvut_shrine_offer_failure('offerMessageClassifierBridgeFailed', { message: msg, error: error?.message || String(error) }) };
    }
  };
  var classify_hvut_shrine_offer_message = function (msg) {
    var result = run_hvut_shrine_offer_message_classifier_bridge(msg);
    if (result.ok) return result.decision;
    return { kind: 'stop', reason: 'classifierUnavailable', message: 'Shrine offer classifier bridge unavailable.', evidence: result.evidence };
  };
  var classify_hvut_shrine_offer_response = function (doc, stage) {
    var messages = get_message(doc, true);
    if (!messages.length) {
      var evidence = record_hvut_shrine_offer_failure(stage, { reason: 'emptyMessagebox' });
      return { kind: 'stop', reason: 'emptyMessagebox', message: 'Shrine offer response unavailable.', messages: [], evidence: evidence };
    }
    return { kind: 'messages', messages: messages };
  };
  var summarize_hvut_shrine_offer_messages = function (messages) {
    var summary = { kind: 'accepted', vouchers: [], rewards: [], equips: [], qualities: [], sold: 0, salvaged: 0 };
    for (var msg of messages) {
      var offerMessage = classify_hvut_shrine_offer_message(msg);
      if (offerMessage.kind === 'ignore') {
        continue;
      } else if (offerMessage.kind === 'voucher') {
        summary.vouchers.push(offerMessage.message || msg);
      } else if (offerMessage.kind === 'equip') {
        summary.equips.push(offerMessage.reward);
        summary.qualities.push(offerMessage.quality);
      } else if (offerMessage.kind === 'reward') {
        summary.rewards.push(offerMessage.reward);
      } else if (offerMessage.kind === 'sold') {
        summary.sold++;
      } else if (offerMessage.kind === 'salvaged') {
        summary.salvaged++;
      } else {
        var reason = offerMessage.reason || 'unknownShrineResponse';
        var message = offerMessage.message || msg;
        var evidence = offerMessage.evidence || record_hvut_shrine_offer_failure('unknownOfferMessage', { reason: reason, message: message });
        return { kind: 'stop', reason: reason, message: message, evidence: evidence };
      }
    }
    return summary;
  };
  var run_hvut_navigation_bridge = function (method, args, stage, detail) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_navigation : undefined;
    if (!bridge || typeof bridge[method] !== 'function') {
      record_hvut_navigation_bridge_failure(stage, detail || {});
      return false;
    }
    try {
      return bridge[method](...(args || []));
    } catch (error) {
      record_hvut_navigation_bridge_failure(stage + 'Failed', { ...(detail || {}), error: error?.message || String(error) });
      return false;
    }
  };
  var run_hvut_navigation_reason_bridge = function (vocabulary, key, stage) {
    var bridge = typeof window !== 'undefined' ? window.HVAA_navigation : undefined;
    if (!bridge || !bridge[vocabulary]) {
      record_hvut_navigation_bridge_failure(stage, { vocabulary: vocabulary, key: key });
      return undefined;
    }
    try {
      var reason = bridge[vocabulary][key];
      if (!reason) record_hvut_navigation_bridge_failure(stage + 'Unknown', { vocabulary: vocabulary, key: key });
      return reason;
    } catch (error) {
      record_hvut_navigation_bridge_failure(stage + 'Failed', { vocabulary: vocabulary, key: key, error: error?.message || String(error) });
      return undefined;
    }
  };
  var hvutReloadReason = function (key) {
    return run_hvut_navigation_reason_bridge('ReloadReason', key, 'reloadReasonBridgeMissing');
  };
  var hvutRedirectReason = function (key) {
    return run_hvut_navigation_reason_bridge('RedirectReason', key, 'redirectReasonBridgeMissing');
  };
  var reloadCurrentPage = function (reason) {
    return run_hvut_navigation_bridge('reloadCurrentPage', [reason], 'reloadBlocked', { reason: reason });
  };
  var openUrl = function (url, reason, newTab) {
    return run_hvut_navigation_bridge('openUrl', [url, reason, !!newTab], 'navigationBlocked', { reason: reason, url: url, newTab: !!newTab });
  };
  var create_hvut_equip_page_url = function (equip, context) {
    var eid = equip?.eid ?? equip?.info?.eid ?? equip?.dataset?.eid;
    var key = equip?.key ?? equip?.info?.key ?? equip?.dataset?.key;
    var relative = `equip/${eid}/${key}`;
    return context?.absolute ? `${location.origin}${location.pathname}${relative}` : relative;
  };
  var create_hvut_current_page_disable_url = function () {
    return location.href + '&hvut=disabled';
  };
  var create_hvut_mail_filter_page_url = function (filter, page) {
    return `?s=Bazaar&ss=mm&filter=${filter}&page=${page}`;
  };
  var create_hvut_mail_page_url = function (page) {
    return create_hvut_mail_filter_page_url(_query.filter || 'inbox', page);
  };
  var create_hvut_mail_reply_url = function (mid) {
    return `?s=Bazaar&ss=mm&filter=new&reply=${mid}`;
  };
  var create_hvut_mail_sent_url = function () {
    return '?s=Bazaar&ss=mm&filter=sent';
  };
  var create_hvut_mail_read_url = function (context) {
    var pageParam = context?.page === undefined ? '' : `&page=${context.page}`;
    return `?s=Bazaar&ss=mm&filter=${context?.filter}&mid=${context?.mid}${pageParam}`;
  };
  var create_hvut_mail_compose_url = function (context) {
    return context?.persistent ? '/?s=Bazaar&ss=mm&filter=new' : '?s=Bazaar&ss=mm&filter=new';
  };
  var create_hvut_mail_view_url = function (mid) {
    return `?s=Bazaar&ss=mm&mid=${mid}`;
  };
  var create_hvut_character_section_url = function (ss) {
    return `?s=Character&ss=${ss}`;
  };

  var create_hvut_character_page_url = function () {
    return create_hvut_character_section_url('ch');
  };

  var create_hvut_equipment_page_url = function () {
    return create_hvut_character_section_url('eq');
  };

  var create_hvut_item_inventory_url = function () {
    return create_hvut_character_section_url('it');
  };

  var create_hvut_character_settings_url = function () {
    return create_hvut_character_section_url('se');
  };
  var create_hvut_training_url = function () {
    return '/?s=Character&ss=tr';
  };
  var create_hvut_bazaar_section_url = function (ss) {
    return `/?s=Bazaar&ss=${ss}`;
  };
  var create_hvut_item_shop_url = function () {
    return '?s=Bazaar&ss=is';
  };
  var create_hvut_market_browse_items_url = function (filter) {
    return `?s=Bazaar&ss=mk&screen=browseitems&filter=${filter}`;
  };
  var create_hvut_shrine_url = function () {
    return '?s=Bazaar&ss=ss';
  };
  var create_hvut_monster_lab_slot_url = function (mob) {
    return `?s=Bazaar&ss=ml&slot=${mob?.index ?? mob}`;
  };
  var create_hvut_armory_screen_url = function (screen, context) {
    var filter = Object.prototype.hasOwnProperty.call(context || {}, 'filter') ? `&filter=${context?.filter || ''}` : '';
    var eqids = context?.eqid ? `&eqids=${context.eqid}` : '';
    return `?s=Bazaar&ss=am&screen=${screen}${filter}${eqids}`;
  };
  var create_hvut_armory_organize_url = function () {
    return create_hvut_armory_screen_url('organize');
  };
  // >>> equip-name-render 装备译名渲染族(两 IIFE 共用; 唯一可直接调 hvaaTEquip(eq) 之处)。
  // 译名(hvaaTEquip)value 内含 quality/type 颜色 span(EQUIP_EQUIPS 字典, 形如
  // 'Rapier'→'<span style="background:#ffa500">西洋剑</span>（单）'), 是 HTML 片段。consumers 永不直接碰
  // hvaaTEquip —— 按落点形态选下列其一, 把"去标签/解实体/customname 转义"复杂度下沉到此处(铁律1d 复杂度下沉):
  //   set_equip_name(el, eq): 落到 DOM 元素 → innerHTML 渲染色 span。
  //   equip_name_html(eq):    要 HTML 串(innerHTML 模板插值) → customname 转义防注入 / 译名原样。
  //   equip_name_text(eq):    要纯文本(confirm/alert/拼串) → 去标签+解 HTML 实体 / customname 原样。
  // 曾 bug(2026-06-05 修): 用 textContent 设译名→<span> 转义成字面文字、背景色丢失; confirm 里直插译名→显示字面 <span>。
  // 反退化: 任何 hvaaTEquip(eq 出现在本块外 → scripts/verify-equip-name-sink.mjs 拆桥失败(铁律1b 造抽象就要拆桥 / 铁律4)。
  var equip_name_html = function (eq) {
    if (eq.info.customname) {
      var d = document.createElement('div');
      d.textContent = eq.info.customname; // 玩家纯文本→HTML 转义防注入
      return d.innerHTML;
    }
    return hvaaTEquip(eq.info.name); // 译名 HTML(色 span)
  };
  var equip_name_text_str = function (name) {        // 裸英文装备名 → 纯文本中文(去色 span); 彩票等无 eq 对象的落点复用
    var d = document.createElement('div');
    d.innerHTML = hvaaTEquip(name);                  // 块内合法(探针豁免区); 译名是含色 span 的 HTML
    return d.textContent;                            // 去标签 + 解 HTML 实体 → 纯文本
  };
  var equip_name_text = function (eq) {
    return eq.info.customname ? eq.info.customname : equip_name_text_str(eq.info.name); // customname 原样; 否则复用裸串入口
  };
  var set_equip_name = function (el, eq) {
    el.innerHTML = equip_name_html(eq);
    return el;
  };
  // <<< equip-name-render
  if (!is_hvut_isekai_equip_page(window.location.pathname)) {
// G1 拆桥：HVAA_ITEM_CN 表 + hvaaItemCn() 已删 —— 物品/材料名归一到 canonical SSOT
// (src/data/i18n/equip-dict EQUIP_ITEMS)，调用点改 hvaaT(name,'item'|'material') 经全局桥查。
// 漂移修复样本：Health Potion 原私表"生命药水" → canonical"体力药水"(与外部游戏 DOM 一致)。
// ===== 以下为 HV Utils 统一汉化(sssss2 原料, JoeZhangYN 合并/迁移), 显示层汉化 =====
// ============================================================================
// HV Utils 主世界版 (v4.0.0) + Isekai 版 (v4.2.0) 统一脚本  [2026-06-02 迁移]
//
// 设计要点:
// 1. IS_ISEKAI = location.pathname.includes("/isekai/")  ——  运行时分发
// 2. 两版整体各自包在 IIFE 中  ——  顶层 const/var/let 同名声明互不冲突
// 3. GM_setValue 命名空间: 两版动态切换 (hvut_ / hvuti_), 老用户配置 100% 保留, 未改
// 4. 两版 utility 去重策略 [2026-06 dedup epic 证伪"整体可机械去重" → 2026-06-10 修正为分轨]:
//    a) 机制分叉留各 IIFE: pxp系数 2x/12x、品质 8/10 级、Forge/附魔 主世界独有、$config GM 命名空间
//       hvut_/hvuti_、$equip dynjs 模型(迁移中) —— 强合破坏两游戏正确性 + 老用户持久化。
//    b) 真重复(byte-identical / 表层漂移)收口共享区, ctx 注入版本差异: bindTr / bindRe / bindPrice /
//       bindDfct / bindPersona(真分叉经 ctx 倒置: warnSelector/parseEquipElem/applyDynjs; parse_stats_pane
//       留各版) / bindBattlePanel(渲染内核, 数据层留各版) / bindConfig(配置体系 18 小方法; ctx.skipField 注入字段门控谓词;
//       init/migration/create 共享业务与面板骨架, CSS·set_panel·set_input 段差异留各版) / render_supply_li / equip-name-render /
//       .hvut-warn·.hvut-bonus 归一。反退化: scripts/verify-no-iife-dup.mjs 锁回潮; 召回: scripts/dup-probe.mjs(手动)。
//       留置候选(2026-07-03 refuter 复核): $config.create 剩余 CSS 段皮肤(规则名相似、值不同; 骨架/字段行已收口) /
//       $config.init 薄入口段参数 / $equip.namecode(已收口一处 caller 留各版; 实测两版同 8 级, 原"8/10 级"描述过时)。
// 5. 迁移基线: 主世界 sleazyfork #533796 英文 4.0.0; Isekai 论坛 211883 英文 4.2.0
// 6. 汉化策略: 显示层翻译走 canonical SSOT(src/data/i18n) 经 window.HVAA_i18n 桥
//    (hvaaT/hvaaTEquip/resolveEn); 逻辑值/比较/键/POST 参数一律英文。i18n SSOT epic G0-G3
//    已收口 物品/材料/装备名/术语, 删 HVAA_ITEM_CN + HVUT_CN 漂移表(仅 stamina tooltip 暂留)。
// ============================================================================

var IS_ISEKAI = (typeof location !== 'undefined') && (location.pathname || '').indexOf('/isekai/') !== -1;

/* eslint-disable arrow-spacing, block-spacing, comma-spacing, key-spacing, keyword-spacing, object-curly-spacing, space-before-blocks, space-before-function-paren, space-infix-ops, semi-spacing */
// ===== L1 公共底层工具：两 IIFE 经作用域链共享。去重自双版 byte-identical（机械 diff 证 distinct=1）；scrollIntoView 取带空值守卫版；popup_text width 按 IS_ISEKAI 配置保两版观感。=====
function $id(id,d) {return (d||document).getElementById(id);}
function $qs(q,d) {return (d||document).querySelector(q);}
function $qsa(q,d) {return Array.from((d||document).querySelectorAll(q));}
function $doc(h) {const d=document.implementation.createHTMLDocument('');d.documentElement.innerHTML=h;return d;}
function $element(t,p,a,f) {let e;if(t){e=document.createElement(t);}else if(t===''){e=document.createTextNode(a);a=null;}else{return document.createDocumentFragment();}if(a!==null&&a!==undefined){function ao(e,a){Object.entries(a).forEach(([an,av])=>{if(typeof av==='object'){let a;if(an in e){a=e[an];}else{e[an]={};a=e[an];}Object.entries(av).forEach(([an,av])=>{a[an]=av;});}else{if(an==='style'){e.style.cssText=av;}else if(an in e){e[an]=av;}else{e.setAttribute(an,av);}}});}function as(e,a){const an={'#':'id','.':'className','!':'style','/':'innerHTML'}[a[0]];if(an){e[an]=a.slice(1);}else if(a!==''){e.textContent=a;}}if(typeof a==='string'||typeof a==='number'){e.textContent=a;}else if(Array.isArray(a)){a.forEach((a)=>{if(typeof a==='string'||typeof a==='number'){as(e,a);}else if(typeof a==='object'){ao(e,a);}});}else if(typeof a==='object'){ao(e,a);}}if(f){if(typeof f==='function'){e.addEventListener('click',f);}else if(typeof f==='object'){Object.entries(f).forEach(([ft,fl])=>{e.addEventListener(ft,fl);});}}if(p){if(p.nodeType===1||p.nodeType===11){p.appendChild(e);}else if(Array.isArray(p)){if(['beforebegin','afterbegin','beforeend','afterend'].includes(p[1])){p[0].insertAdjacentElement(p[1],e);}else if(!isNaN(p[1])){p[0].insertBefore(e,p[0].childNodes[p[1]]);}else{p[0].insertBefore(e,p[1]);}}}return e;}
function time_format(t,o) {t=Math.floor(t/1000);const h=Math.floor(t/3600).toString().padStart(2,'0');const m=Math.floor(t%3600/60).toString().padStart(2,'0');const s=(t%60).toString().padStart(2,'0');return !o?`${h}:${m}:${s}`:o===1?`${h}:${m}`:o===2?`${m}:${s}`:'';}
// 内联 script/dynjs 变量提取单一判定点(业务概念:「页面脚本变量 → JSON」)。能量模型后两版 dynjs 文件同构
// `dynjs_equip = {...};`(主世界旧 `dynjs_loaded` slice(16) 整体替换形态已死, 2026-06-10 拆桥, probe R3 锁);
// `(?:var )?` 兼容 eqstore 带 var 前缀形态。失配返 null(JSON.parse(null)=null, Object.assign(x,null) 无害)。
function parse_script_json(h,n) {return JSON.parse(new RegExp(`(?:var )?${n}\\s?=\\s?(\\{.*?\\});`).exec(h)?.[1]||null);}
// 能量模型耐久读数字段(单一判定点, 两版 reg.html 捕获组 identical: 8=耐久% 9=能量% 10=N/A):
// reg.html exec → { condition, energy, cdt }。消费方: bindBattlePanel 数据层 load_dynjs(主世界旧 parse.div 已随旧 $equip 退化, 2026-06-10)。
function parse_condition_of(exec) {const condition=parseFloat(exec[8]);return {condition:condition,cdt:(condition||0)/100,energy:exec[9]?parseFloat(exec[9]):null};}
function split2(s,d,t=true) {let a;const p=s.indexOf(d);if(p===-1){a=[s];}else{const k=s.slice(0,p);const v=s.slice(p+1);a=[k,v];}if(t){a=a.map((e)=>e.trim());}return a;}
function scrollIntoView(e,p=e.parentNode) {if(!e){return;}p.scrollTop+=e.getBoundingClientRect().top-p.getBoundingClientRect().top;}
function confirm_event(n,e,m,c,f) {if(!n){return;}const a=n.getAttribute('on'+e);n.removeAttribute('on'+e);n.addEventListener(e,(e)=>{if(!c||c()){if(confirm(m)){if(f){f();}}else{e.preventDefault();e.stopImmediatePropagation();}}},true);n.setAttribute('on'+e,a);}
function play_beep(volume=0.2,frequency=500,duration=0.5) {const delay=1;if(!volume){return;}const c=new window.AudioContext();const o=c.createOscillator();const g=c.createGain();o.type='sine';o.frequency.value=frequency;g.gain.value=volume;o.connect(g);g.connect(c.destination);o.start(delay);o.stop(delay+duration);}
function popup(t) {function r(e){e.preventDefault();e.stopImmediatePropagation();if(e.button===0||e.key==='Enter'||e.key===' '||e.key==='Escape'){w.remove();document.removeEventListener('keydown',r);}}const w=$element('div',document.body,['!position:fixed;top:0;left:0;width:1236px;height:702px;padding:3px 100% 100% 3px;background-color:#0006;z-index:1001;cursor:pointer;display:flex;justify-content:center;align-items:center;'],r);const d=$element('div',w,['/'+t,'!min-width:400px;min-height:100px;max-width:100%;max-height:100%;padding:10px;background-color:#fff;border:1px solid;display:flex;flex-direction:column;justify-content:center;font-size:10pt;color:#333;']);document.addEventListener('keydown',r);return d;}
function popup_text(m,wd,ht,b=[]) {let v;if(typeof m==='string'){v=m;}else{v=m.join('\n');}const w=$element('div',document.body,['!position:fixed;top:0;left:0;width:1236px;height:702px;padding:3px 100% 100% 3px;background-color:#0006;z-index:1001;display:flex;justify-content:center;align-items:center;']);const d=$element('div',w,['!border:1px solid;padding:5px;background-color:#fff;']);const _w=IS_ISEKAI?`width:stretch;min-width:${wd}px;`:`width:${wd}px;`;const t=$element('textarea',d,{value:v,spellcheck:false,style:`display:block;margin:0 0 5px;font-size:9pt;line-height:1.5em;${_w}height:${ht}px;white-space:pre;`});function c(){w.remove();}b.forEach((o)=>{$element('input',d,{type:'button',value:o.text},()=>{if(o.click==='default'){t.value=o.value;}else if(o.click==='revert'){t.value=v;}else if(typeof o.click==='function'){o.click(p);}});});$element('input',d,{type:'button',value:'关闭'},c);const p={wrapper:w,textarea:t,close:c};return p;}
function get_message(d,s) {if(typeof d==='string'){d=$doc(d);}const m=$qsa('#messagebox_inner>p',d).map((p)=>p.textContent);if(s){return m;}else{return m.join('\n');}}
/* eslint-enable */

// ===== L2 公共依赖闭包基础设施（$ajax 请求队列 + _query URL 参数，两 IIFE 共享）=====
const _query = Object.fromEntries(location.search.slice(1).split('&').map((q) => { const [k, v = ''] = q.split('=', 2); return [decodeURIComponent(k.replace(/\+/g, ' ')), decodeURIComponent(v.replace(/\+/g, ' '))]; }));

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
        popup(IS_ISEKAI ? `<p style="color: #e00; font-weight: bold;">${text}</p><p>You have reached the maximum connection limit.<br>Try again later.</p>` : `<p style="color: #f00; font-weight: bold;">${text}</p><p>已达到连接数上限.<br>请稍后再试.</p>`);
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
    const html = await $ajax.fetch(create_hvut_item_inventory_url());
    const doc = $doc(html);
    const list = {};
    let parseFailed = false;
    $qsa('.itemlist tr', doc).forEach((tr) => {
      const item = parse_hvut_inventory_item_row(tr, 'inventoryItemRow');
      if (item === null) {
        parseFailed = true;
        return;
      }
      list[item.name] = { id: item.id, stock: item.stock };
    });
    if (parseFailed) return false;
    $item.list = list;
    return true;
  },
  once: async function () {
    if ($item.list) {
      return true;
    } else {
      return await $item.load();
    }
  },
  load_shop: async function () {
    const html = await $ajax.fetch(create_hvut_item_shop_url());
    const doc = $doc(html);
    $item.storetoken = $id('shopform', doc)?.elements?.storetoken?.value;
    if (!$item.storetoken) {
      return record_hvut_item_shop_parse_failure('shopToken', {});
    }
    $item.networth = parseInt($id('networth', doc).textContent.replace(/\D/g, ''));
    $item.shop = {};
    let parseFailed = false;

    const reg_item = /itemshop\.set_item\('item_pane',(\d+),(\d+),(\d+)/;
    $qsa('#item_pane .itemlist tr', doc).forEach((tr) => {
      const item = parse_hvut_item_shop_row(tr, reg_item, 'inventoryShopRow');
      if (item === null) {
        parseFailed = true;
        return;
      }
      $item.shop[item.name] = { id: item.id, stock: item.stock, sell_price: item.price };
    });

    const reg_shop = /itemshop\.set_item\('shop_pane',(\d+),(\d+),(\d+)/;
    $qsa('#shop_pane .itemlist tr', doc).forEach((tr) => {
      const item = parse_hvut_item_shop_row(tr, reg_shop, 'systemShopRow');
      if (item === null) {
        parseFailed = true;
        return;
      }
      if (!$item.shop[item.name]) {
        $item.shop[item.name] = {};
      }
      Object.assign($item.shop[item.name], { id: item.id, shop_stock: item.stock, shop_price: item.price });
    });
    if (parseFailed) return false;
    return true;
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
    const outcome = await run_hvut_item_shop_buy(items, $item);
    if (outcome.kind === 'rejected') {
      alert(outcome.message);
      return false;
    }
    return true;
  },
};

// 补给品库存单条 li 渲染(两 IIFE 共用): 名走 canonical 桥(hvaaT item)译中 + 库存数 + buy dataset + 库存 <
// 阈值标警告。抽此 same-algo 内核消除"两版各写一份致翻译漂移"(主世界版曾漏 hvaaT 显英文)。外层(数据源 settings
// 键 equipPanel/equipEnchant…ItemInventory / load-display 分层)是两版 bounded-context 真实差异, 留各
// IIFE 分支不硬合。原 warnClass 参数已消亡: warn class 已归一 .hvut-warn(2026-06-10, .hvut-bt-warn 删)。
// ⚠ 必须在 if(!isekai/equip) 守卫块内, 与 $item/$element 同词法作用域 —— 块外定义会 ReferenceError(2026-06-05 修)。
const render_supply_li = function (parent, name, count) {
  const stock = $item.count(name);
  const li = $element('li', parent, {
    textContent: `${hvaaT(name, 'item')} (${stock})`,
    dataset: { action: 'buy', item: name, count },
  });
  if (stock < count) {
    li.classList.add('hvut-warn');
  }
  return li;
};

// $config 配置体系内核(两 IIFE 18 方法 byte-identical/表层漂移收口一处; 铁律1e 应抽尽抽 / 铁律4 抽象即反退化)。
// 留各 IIFE 字面量(机制分叉, 见设计要点4 + dup-probe 留置裁定): 数据属性 version/ls_savelist/data/text/desc/validator
//   + init(ns hvut/hvuti·season wiring) + migration legacy carry flow + create panel skeleton/field row
//     (版本史 4.2≠2 的 Isekai 清理与 CSS/set_panel/set_input 段差异留各 IIFE)
//   + create(面板 CSS var↔硬编 / checkbox $input 3槽↔2槽 / textarea 恢复默认按钮) + set_panel·set_input(设值流分叉; 主世界无独立 set_input 内联于 set_panel)。
// ctx.skipField(o): 面板字段适用谓词分叉 —— isekai 按 HV server(o.server!==_server.name) / 主世界按 持久区·isekai(o.disabled)。
// validate 错误头归一中文 '校验错误'(isekai 原 'Validation Error' 漏翻; 汉化脚本统一中文)。
// 反退化: scripts/verify-no-iife-dup.mjs PARTIAL_OBJECTS['$config'] 锁这 18 方法名不在 IIFE 字面量回潮。
const bindConfig = function (config, ctx) {
  config.reset = function () {
    config.settings = JSON.parse(JSON.stringify(config.default));
  };
  config.get = function (key, dvalue, prefix = config.prefix) {
    try {
      return GM_getValue(prefix + key, dvalue);
    } catch (error) {
      record_hvut_config_storage_failure('get', { key: prefix + key, error: error?.message || String(error) });
      return dvalue;
    }
  };
  config.set = function (key, value, prefix = config.prefix) {
    try {
      GM_setValue(prefix + key, value);
      if (config.ls_savelist.includes(key) && !config.ls_set(key, value, prefix)) {
        return false;
      }
      return true;
    } catch (error) {
      record_hvut_config_storage_failure('set', { key: prefix + key, error: error?.message || String(error) });
      return false;
    }
  };
  config.del = function (key, prefix = config.prefix) {
    try {
      GM_deleteValue(prefix + key);
      return true;
    } catch (error) {
      record_hvut_config_storage_failure('delete', { key: prefix + key, error: error?.message || String(error) });
      return false;
    }
  };
  config.ls_get = function (key, dvalue, prefix = config.prefix) {
    try {
      const value = localStorage.getItem(prefix + key);
      return value === null ? dvalue : JSON.parse(value);
    } catch (error) {
      record_hvut_config_storage_failure('localStorageGet', { key: prefix + key, error: error?.message || String(error) });
      return dvalue;
    }
  };
  config.ls_set = function (key, value, prefix = config.prefix) {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      record_hvut_config_storage_failure('localStorageSet', { key: prefix + key, error: error?.message || String(error) });
      return false;
    }
  };
  config.ls_del = function (key, prefix = config.prefix) {
    try {
      localStorage.removeItem(prefix + key);
      return true;
    } catch (error) {
      record_hvut_config_storage_failure('localStorageDelete', { key: prefix + key, error: error?.message || String(error) });
      return false;
    }
  };
  config.open = function (key) {
    if (!config.node) {
      config.create();
    }
    $id('csp').appendChild(config.node.div);
    config.load();
    if (key) {
      const o = config.data.find((o) => o.key === key);
      scrollIntoView(o.node.div);
    }
  };
  config.close = function () {
    config.node.div.remove();
  };
  config.get_panel = function () {
    const obj = {};
    const errors = [];
    config.data.forEach((o) => {
      if (!o.key) {
        return;
      }
      if (ctx.skipField(o)) {
        return;
      }
      const validation = config.validate(o);
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
  };
  config.validate_panel = function (e) {
    const key = e.target.dataset.key;
    const o = config.data.find((o) => o.key === key);
    const validation = config.validate(o);
    return validation;
  };
  config.validate = function (o) {
    let value;
    let error;
    if (o.type === 'boolean') {
      value = o.node.input.checked;
    } else if (o.type === 'number') {
      value = Number(o.node.input.value);
    } else if (o.type === 'string') {
      value = o.node.input.value;
    } else if (o.type === 'array') {
      ({ value, error } = config.text2array(o.node.input.value, o.value_sep, o.value_type));
    } else if (o.type === 'object') {
      ({ value, error } = config.text2obj(o.node.input.value, o.value_sep, o.value_type));
    }
    const validator = config.validator[o.validator || o.key];
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
      o.node.error.innerHTML = '<h3>校验错误</h3>' + html;
      o.node.div.appendChild(o.node.error);
      o.node.div.classList.add('hvut-cfg-error');
    } else {
      o.node.error?.remove();
      o.node.div.classList.remove('hvut-cfg-error');
    }
    const result = { value, error };
    return result;
  };
  config.load = function (obj = config.settings) {
    config.set_panel(obj);
    config.get_panel();
  };
  config.save = function (panel) {
    if (panel) {
      const obj = config.get_panel();
      if (!obj) { // error
        return;
      }
      config.settings = obj;
    }
    config.settings.version = config.version;
    if (!config.set('settings', config.settings)) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    if (panel) {
      reloadCurrentPage(hvutReloadReason('HV_UTILS_CONFIG_SAVE'));
    }
    return true;
  };
  config.text2obj = function (text, sep = ['\n', ':'], type) {
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
  };
  config.obj2text = function (obj, sep = ['\n', ':']) {
    const text = Object.entries(obj).map(([key, value]) => `${key} ${sep[1]} ${value}`).join(sep[0]);
    return text;
  };
  config.text2array = function (text, sep = '\n', type) {
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
  };
  config.array2text = function (array, sep = '\n') {
    if (!sep.includes('\n')) {
      sep += ' ';
    }
    const text = array.join(sep);
    return text;
  };
  return config;
};

// _tr Training 逻辑(两 IIFE byte-identical 5 方法收口一处, 消"两版各写一份致漂移" 铁律1e 应抽尽抽 / 铁律4 抽象即反退化)。
// $config(version-diff: GM 命名空间 hvut/hvuti、version、migration —— 留各 IIFE)经 ctx 依赖注入: 公共区不能直引用
// IIFE-private 符号(词法作用域链单向, 直引用会 ReferenceError)。版本特定(parse_table 文案 / _tr.data 训练表 /
// node 按钮文案 / GM_addStyle selector / ISEKAI 独有的 _tr.init·parse_progress)留各 IIFE。基准 = ISEKAI 4.2.0
// 逐字搬入(机械替换 _tr.→tr. / $config→ctx.config, 已两版规范化空白逐字 diff 确认 5 方法等价; 无 _tr.notif)。
const bindTr = function (tr, ctx) {
  tr.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, name } = target.dataset;
    if (action === 'change') {
      tr.change(name);
    }
  };

  tr.change = function (name, level) {
    const training = tr.data[name];
    if (!training?.time) {
      tr.node.select.value = '';
      tr.node.level.value = '';
      tr.node.level.disabled = true;
      tr.node.cost.value = '';
      return;
    }
    if (!level) {
      level = training.level;
    }
    tr.node.select.value = name;
    tr.node.level.value = level;
    tr.node.level.min = training.level;
    tr.node.level.max = training.max;
    tr.node.level.disabled = false;
    tr.calc();
  };

  tr.calc = function () {
    const name = tr.node.select.value;
    const to = parseInt(tr.node.level.value);
    if (!name || !to) {
      return;
    }

    const training = tr.data[name];
    let from = training.level;
    let cost = 0;
    if (name === tr.current) {
      from++;
    }
    while (from < to) {
      cost += Math.round(Math.pow(training.b + training.l * from, 1 + training.e * from));
      from++;
    }
    tr.node.cost.value = cost.toLocaleString();
  };

  tr.set = function (reload) {
    if (tr.node.select.value) {
      tr.json.next_name = tr.node.select.value;
      tr.json.next_level = parseInt(tr.node.level.value);
      tr.json.next_id = tr.data[tr.node.select.value].id;
    } else {
      tr.json.next_name = '';
      tr.json.next_level = 0;
      tr.json.next_id = 0;
    }
    if (!ctx.config.set('tr_notif', tr.json, 'hvut_')) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }

    if (reload) {
      reloadCurrentPage(hvutReloadReason('HV_UTILS_TRAINING_NOTIFICATION'));
    }
    return true;
  };

  tr.cancel = function (reload) {
    tr.node.select.value = '';
    return tr.set(reload);
  };
};

// $re 随机遭遇引擎(两 IIFE byte-identical 11/15 方法收口一处, 基准 = ISEKAI 4.2.0; 铁律1e 应抽尽抽)。
// RE 状态本就跨服共享(显式 'hvut_' 前缀), 两份实现纯属物理散落。收口时统一的 4 处表层漂移:
//   ba(): 保留 reBattle 守卫(4.2.0 新增开关; 主世界 settings 已补 reBattle 默认值+UI)
//   refresh(): 'Expired'→'已错失'(取主世界汉化, isekai 版漏翻)
//   load(): else 提示取 4.2.0 语义(装备仓库满是 RE 不生成的真实原因, 主世界 4.0.0 泛化文案弃)
//   start(): 过期警示统一 .hvut-warn class(主世界原 inline style color 弃; .hvut-warn 已两版归一)
// ctx 注入: config = IIFE-private $config(GM 命名空间载体); top 用 getter(规避 _top 声明在 $re 之后的 TDZ)。
const bindRe = function (re, ctx) {
  const run_hvut_encounter_bridge = function (eventName, event) {
    const bridge = typeof window !== 'undefined' ? window.HVAA_encounter : undefined;
    const type = bridge?.Event?.[eventName];
    if (!bridge || typeof bridge.run !== 'function' || !type) {
      record_hvut_random_encounter_failure('widgetEncounterBridgeMissing', { eventName });
      return undefined;
    }
    try {
      return bridge.run({ ...event, type });
    } catch (error) {
      record_hvut_random_encounter_failure('widgetEncounterBridgeFailed', { eventName, error: error?.message || String(error) });
      return undefined;
    }
  };
  const applyEncounterState = function (outcome) {
    if (!outcome?.state) {
      return true;
    }
    if (!ctx.config.set('re', outcome.state, 'hvut_')) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    re.json = outcome.state;
    return true;
  };
  re.init = function () {
    if (re.inited) {
      return true;
    }
    re.inited = true;
    re.type = (!location.hostname.includes('hentaiverse.org') || IS_ISEKAI) ? 'eh' : $id('navbar') ? 'hv' : $id('battle_top') ? 'ba' : false;
    return re.get();
  };
  re.clock = function (button) {
    if (re.init() === false) return false;
    re.button = button;
    re.button.addEventListener('click', (e) => { re.run(e.ctrlKey || e.shiftKey); });
    const dayState = run_hvut_encounter_bridge('WIDGET_TICK', { state: re.json });
    if (applyEncounterState(dayState) === false) return false;
    if (re.json.date === 0) re.load();
    re.start();
    return true;
  };
  re.hv = function () {
    if (re.init() === false) return false;
    if (re.check() === false) return false;
    const button = $element('div', ctx.top.node.div, ['!width: 80px; cursor: pointer;']);
    return re.clock(button);
  };
  re.ba = function () {
    if (!ctx.config.settings.reBattle) {
      return;
    }
    if (re.init() === false) return false;
    if ($id('textlog').tBodies[0].lastElementChild.textContent === 'Initializing random encounter ...') {
      if (re.check() === false) return false;
    }
    const button = $element('div', $id('csp'), ['RE', '!position: absolute; top: 10px; left: 600px; cursor: pointer; font-size: 10pt; font-weight: bold;']);
    if (re.clock(button) === false) return false;

    // support monsterbation that clears all timer id when a round starts
    const target = document.body;
    const options = { childList: true };
    const callback = function () {
      if (!button.isConnected && $id('csp')) {
        $id('csp').appendChild(button);
      }
      re.start();
    };
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
  };
  re.eh = function () {
    if (re.init() === false) return false;
    const link = $qs('#eventpane a');
    const onclick = link?.getAttribute('onclick');
    if (onclick) {
      const linkState = run_hvut_encounter_bridge('WIDGET_LINK_FOUND', { state: re.json, search: onclick });
      if (linkState?.state?.key) {
        if (applyEncounterState(linkState) === false) return false;
        if (ctx.config.settings.reGalleryAlt) {
          link.setAttribute('onclick', onclick.replace('https://hentaiverse.org/', 'http://alt.hentaiverse.org/'));
        }
      }
    }
    if (ctx.config.settings.reGallery && $id('nb')) {
      $id('nb').style.maxWidth = '1080px';
      const button = $element('a', $element('div', $id('nb')), ['!display: inline-block; width: 70px; text-align: left; cursor: pointer;']);
      return re.clock(button);
    }
    return true;
  };
  re.get = function () {
    re.json = ctx.config.get('re', { date: 0, key: '', count: 0, clear: true }, 'hvut_');
    return applyEncounterState(run_hvut_encounter_bridge('WIDGET_TICK', { state: re.json }));
  };
  re.set = function (key) {
    return applyEncounterState(run_hvut_encounter_bridge('WIDGET_LINK_FOUND', { state: re.json, key }));
  };
  re.reset = function () {
    if (applyEncounterState(run_hvut_encounter_bridge('WIDGET_RESET_DAY')) === false) return false;
    re.start();
    return true;
  };
  re.check = function () {
    return applyEncounterState(run_hvut_encounter_bridge('WIDGET_STARTED_ENCOUNTER', { state: re.json, search: location.search }));
  };
  re.refresh = function () {
    const readiness = run_hvut_encounter_bridge('WIDGET_TICK', { state: re.json }) ?? { state: re.json, remainingMs: 0 };
    if (applyEncounterState(readiness) === false) return false;
    if (readiness.status === 'countdown') {
      re.button.textContent = time_format(readiness.remainingMs, 2) + ` [${readiness.count}]`;
      re.beep = true;
      re.readyAttemptKey = '';
    } else {
      re.button.textContent = (readiness.status === 'missed' ? '已错失' : '遭遇战') + ` [${readiness.count}]`;
      if (re.beep) {
        re.beep = false;
        play_beep(...ctx.config.settings.reBeep);
      }
      re.stop();
      const outcome = run_hvut_encounter_bridge('WIDGET_TIMER_ELAPSED', { state: re.json, pageType: re.type, lastAttemptKey: re.readyAttemptKey, galleryAlt: ctx.config.settings.reGalleryAlt });
      if (applyEncounterState(outcome) === false) return false;
      if (outcome?.attemptKey) re.readyAttemptKey = outcome.attemptKey;
      if (outcome?.handled) return;
      if (outcome?.action === 'load') return re.load(outcome.engage, outcome.href);
      if (outcome?.action === 'checkHv') return re.run(outcome.engage);
    }
  };
  re.run = async function (engage) {
    if (re.type === 'ba') {
      const outcome = run_hvut_encounter_bridge('WIDGET_CLICKED', { state: re.json, pageType: re.type, force: engage });
      if (applyEncounterState(outcome) === false) return false;
      if (outcome?.handled) return;
      return re.load();
    } else if (re.type === 'hv') {
      const outcome = run_hvut_encounter_bridge('WIDGET_CLICKED', { state: re.json, pageType: re.type, force: engage });
      if (applyEncounterState(outcome) === false) return false;
      if (outcome?.handled) return;
      return re.load(true, outcome.href);
    } else if (re.type === 'eh') {
      re.stop();
      re.button.textContent = '检查中...';
      let html;
      try {
        html = await $ajax.fetch('https://hentaiverse.org/');
      } catch (error) {
        record_hvut_random_encounter_failure('widgetHvAvailabilityFetch', { reason: 'requestFailed', error: error?.message || String(error) });
        re.start();
        return false;
      }
      if (html.includes('<div id="navbar">')) {
        const outcome = run_hvut_encounter_bridge('WIDGET_CLICKED', { state: re.json, pageType: re.type, force: engage, hvAvailable: true });
        if (applyEncounterState(outcome) === false) return false;
        if (outcome?.handled) return;
        return re.load(true, outcome.href);
      } else {
        return re.load();
      }
    }
  };
  re.load = async function (engage, href) {
    re.stop();
    if (re.get() === false) return false;
    re.button.textContent = '加载中...';
    let html;
    try {
      html = await $ajax.fetch(href || 'https://e-hentai.org/news.php');
    } catch (error) {
      record_hvut_random_encounter_failure('widgetNewsLoadFetch', { reason: 'requestFailed', error: error?.message || String(error) });
      re.start();
      return false;
    }
    const doc = $doc(html);
    const eventpane = $id('eventpane', doc)?.innerHTML;
    const outcome = run_hvut_encounter_bridge('WIDGET_NEWS_LOADED', { state: re.json, eventpane, engage, pageType: re.type, galleryAlt: ctx.config.settings.reGalleryAlt });
    if (applyEncounterState(outcome) === false) return false;
    if (outcome?.handled) {
      return;
    }
    if (outcome?.action === 'reset') {
      popup(eventpane);
    } else if (outcome?.action === 'unavailable' && outcome.unavailableReason === 'equipmentInventoryFull') {
      popup('<p style="color: #f00; font-weight: bold;">你的装备仓库快要满了.<br>\n该去整理一下了.</p>');
    }
    re.start();
    return true;
  };
  re.start = function () {
    re.stop();
    if (!re.json.clear) {
      re.button.classList.add('hvut-warn');
    } else {
      re.button.classList.remove('hvut-warn');
    }
    re.tid = setInterval(re.refresh, 1000);
    re.refresh();
  };
  re.stop = function () {
    if (re.tid) {
      clearInterval(re.tid);
      re.tid = 0;
    }
  };
};

// $price 物价管理(两 IIFE 收口一处, 基准 = ISEKAI 4.2.0; 铁律1e 应抽尽抽)。上游 4.2.0 本就按
// 「单一实现 + IS_ISEKAI 运行时分发」设计(init 内过滤 groups/filters), 主世界副本是旧 4.0.0 残留。
// 收口时统一的漂移: ① get_items(4.0.0)→items(4.2.0 命名); ② 双向汉化漂移取并集(isekai 已翻按钮
// 要价/卖价/编辑所有材料 + 主世界已翻 alert 错误提示); ③ parse_market 取 slice(1) 写法;
// ④ get_market 取 4.2.0 alt 回退(bid 缺则取 ask); ⑤ 主世界获得 value()(原 isekai 独有, 无消费冲突)。
// 物价数据走 ctx.config.get('prices') 默认命名空间(hvut_/hvuti_ 各服一份) —— 两服市场独立, 数据分服、逻辑统一。
const bindPrice = function (price, ctx) {
  price.json = null;
  price.market = null;
  price.filters = { co: null, ma: null, tr: null, ar: null, fi: null, mo: null };
  price.groups = {
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
  };
  price.default = {
    'Peerless Weapon Core': 500000,
    'Peerless Staff Core': 500000,
    'Peerless Armor Core': 500000,
  };

  price.init = function () {
    if (price.json) {
      return;
    }
    if (IS_ISEKAI) {
      price.groups['Consumables'] = price.groups['Consumables'].filter((n) => !'Last Elixir|Energy Drink|Caffeinated Candy'.includes(n));
      price.groups['Materials'] = price.groups['Materials'].filter((n) => !n.startsWith('Binding of'));
      delete price.groups['Crystals'];
      delete price.groups['Figures'];
      delete price.filters['ar'];
      delete price.filters['fi'];
      delete price.filters['mo'];
    }
    price.json = ctx.config.get('prices');
    if (!price.json) {
      price.reset();
    }
  };
  price.reset = function () {
    const json = {};
    Object.values(price.groups).forEach((g) => {
      g.forEach((n) => {
        json[n] = 0;
      });
    });
    Object.assign(json, price.default);
    price.json = json;
    return ctx.config.set('prices', price.json);
  };
  price.items = function (i) {
    let items;
    if (!i) {
      items = Object.keys(price.json);
    } else if (typeof i === 'string') {
      if (i in price.groups) {
        items = price.groups[i];
      } else if (i in price.filters) {
        items = price.filters[i];
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
  };
  price.get = function (i) {
    price.init();
    const prices = {};
    const items = price.items(i);
    items.forEach((n) => { prices[n] = price.json[n] || 0; });
    return prices;
  };
  price.set = function (json, replace) {
    price.init();
    if (replace) {
      price.json = json;
    } else {
      Object.assign(price.json, json);
    }
    return ctx.config.set('prices', price.json);
  };
  price.edit = function (i, filter, callback) {
    price.init();
    const items = price.items(i);
    const prices = price.get(items);
    const all = !filter;

    popup_text(ctx.config.obj2text(prices, ['\n', '@']), 300, 500, [
      { text: '保存', click: save },
      { text: '要价', click: (p) => { market(p, 'bid'); } },
      { text: '卖价', click: (p) => { market(p, 'ask'); } },
      { text: '编辑所有材料', click: edit_all },
    ]);

    function save(p) {
      const { value: new_prices, error } = ctx.config.text2obj(p.textarea.value, ['\n', '@'], 'number');
      if (error) { // error: invalid input
        alert(`错误: 价格必须是数字\n\n${error}`);
        return;
      }
      let saved;
      if (all && p.textarea.value.trim() === '') {
        saved = price.reset();
      } else {
        const replace = all;
        saved = price.set(new_prices, replace);
      }
      if (!saved) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      p.close();
      if (JSON.stringify(prices) !== JSON.stringify(new_prices)) {
        callback?.();
      }
    }
    async function market(p, key) {
      p.textarea.disabled = true;
      const new_prices = await price.update_market(filter, key);
      if (!new_prices) {
        p.textarea.disabled = false;
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return;
      }
      p.textarea.value = ctx.config.obj2text(new_prices, ['\n', '@']);
      p.textarea.disabled = false;
      save(p);
    }
    function edit_all(p) {
      if (all) {
        return;
      }
      p.close();
      price.edit('', '', callback);
    }
  };
  price.value = function (items) {
    const prices = price.get();
    let value = 0;
    Object.entries(items).forEach(([name, count]) => {
      const p = prices[name];
      if (p) {
        value += p * count;
      }
    });
    return value;
  };
  price.parse_market = function (filter, doc = document) {
    if (!price.market) {
      price.market = {};
    }
    price.filters[filter] = [];
    const table = $qs('#market_itemlist table', doc);
    if (!table) {
      return record_hvut_price_market_parse_failure('marketTable', { filter: filter || '' });
    }
    for (const tr of Array.from(table.rows).slice(1)) {
      const item = parse_hvut_price_market_row(tr, filter, 'marketItemRow');
      if (item === false) return false;
      const { name, itemid, stock, bid, ask, market_stock } = item;
      if (!price.market[name]) {
        price.market[name] = {};
      }
      Object.assign(price.market[name], { itemid, stock, bid, ask, market_stock });
      price.filters[filter].push(name);
    }
    return true;
  };
  price.update_market = async function (filter, key, save) {
    const all = !filter;
    if (all && !price.market_all) {
      const filters = Object.keys(price.filters);
      const requests = filters.map((filter) => update(filter));
      try {
        await Promise.all(requests);
      } catch (error) {
        record_hvut_price_market_parse_failure('marketBulkUpdateRequest', { filters: filters, error: error?.message || String(error) });
        return null;
      }
      price.market_all = true;
    } else if (!all && !price.market) {
      try {
        await update(filter);
      } catch (error) {
        record_hvut_price_market_parse_failure('marketUpdateRequest', { filter: filter || '', error: error?.message || String(error) });
        return null;
      }
    }
    const items = price.items(filter);
    const prices = price.get(items);
    const market_prices = price.get_market(items, key);
    const new_prices = { ...prices, ...market_prices };
    if (save) {
      if (!price.set(new_prices)) {
        record_hvut_price_market_parse_failure('marketPriceSet', { filter: filter || '', key: key || '' });
        return null;
      }
    }
    return new_prices;

    async function update(filter) {
      const html = await $ajax.fetch(create_hvut_market_browse_items_url(filter));
      const doc = $doc(html);
      if (price.parse_market(filter, doc) === false) throw new Error('price market parse failed');
    }
  };
  price.get_market = function (items, key, alt = true) {
    const prices = {};
    items.forEach((name) => {
      if (!(name in price.market)) {
        return;
      }
      let p = price.market[name][key];
      if (!p && alt) {
        const alt_key = (key === 'bid') ? 'ask' : (key === 'ask') ? 'bid' : '';
        p = price.market[name][alt_key];
      }
      if (p) {
        prices[name] = p;
      }
    });
    return prices;
  };
  price.set_market = function (items, key) {
    const prices = price.get_market(items, key);
    price.set(prices);
  };
};

// $battle 战斗装备面板·渲染/交互内核 + 数据层(两 IIFE 收口一处; 铁律1e 应抽尽抽)。
// 初版边界(2026-06-10 早) = 用户原话「仅数据分发处理和数据使用不同, 外观完全一致」—— 当时数据层被认定
// 机制分叉(isekai Bazaar repair 流 vs 主世界 Forge 流)留各 IIFE; 同日实站报错证实能量模型后主世界
// Forge 流(?s=Forge&ss=re / 详情页 #ee 附魔)已随旧页面整体消失、修理机制与 isekai 同构 → 数据层续收
// 本内核(create/load_dynjs/update_condition/repair/calc_repair/load_repair/update_link/load_items)。
//   留各 IIFE: 仅外层接线 init(outer 宽度规则/位置类/popup 偏移/token 主题值)。
// ctx: config(IIFE-private $config) / dict(材料译名词典域 'item'|'material', 两版历史用域不同, 暂不强行归一防翻译回归)
//      / divSel(面板根选择器 '#hvut-bt-div'|'.hvut-bt-div', 兼作 $element 简写标记) / inventory(库存 settings 取值)
//      / threshold(耐久警示阈值 settings key 两版不同) / equip·persona(容器归属各 IIFE 闭包的 getter)。
// 布局 SSOT: 此模板是「主异世界外观完全一致」约束的唯一载体 —— 改布局只改这里, 两版同时生效(反退化锁, 铁律4)。
const bindBattlePanel = function (battle, ctx) {
  battle.node = {};
  battle.equips = [];

  battle.init_panel = function (parent) {
    const sel = ctx.divSel;
    GM_addStyle(/*css*/`
      .hvut-bt-on ${sel} { visibility: visible; }
      .hvut-bt-left ${sel} { left: 8px; }
      .hvut-bt-right ${sel} { right: 8px; }

      ${sel} { visibility: hidden; position: absolute !important; bottom: 8px; width: 598px !important; margin: 0 !important; font-size: 9pt; line-height: 20px; font-weight: normal; white-space: nowrap; }
      ${sel} > ul { position: absolute; margin: 0; padding: 21px 0 0; border: 1px solid var(--color-border-default); list-style: none; display: flex; }
      ${sel} > ul::before { content: attr(data-header); position: absolute; top: 0; width: 100%; border-bottom: 1px solid var(--color-border-default); background-color: var(--color-bg-h1); font-size: 10pt; font-weight: bold; }

      .hvut-bt-equip { bottom: 0; left: 0; width: 392px; height: 293px; flex-flow: column; }
      .hvut-bt-equip li { display: flex; flex-wrap: wrap; align-items: flex-start; height: 41px; border-bottom: 1px solid var(--color-border-default); }
      .hvut-bt-equip li:last-child { border-bottom: 0; }
      .hvut-bt-equip li > a { width: 100%; overflow: hidden; text-overflow: ellipsis; border-bottom: 1px dotted var(--color-border-default); font-size: 10pt; font-weight: bold; text-decoration: none; }
      .hvut-bt-equip li:hover > a { background-color: var(--color-bg-alpha); }
      .hvut-bt-equip li > span:nth-child(2) { width: 100px; order: 1; border-left: 1px dotted var(--color-border-default); cursor: pointer; }
      .hvut-bt-equip li > span:nth-child(2):hover { color: var(--color-font-light); background-color: var(--color-bg-alpha); }
      .hvut-bt-equip li > span:nth-child(3) { flex: 1 100px; overflow: hidden; text-overflow: ellipsis; }

      .hvut-bt-items { bottom: 320px; left: 0; width: 596px; min-height: 62px; flex-flow: row wrap; justify-content: start; }
      .hvut-bt-items li { flex: 1 30%; border-width: 0 1px 1px 0; border-style: dotted; border-color: var(--color-border-default); overflow: hidden; text-overflow: ellipsis; }
      .hvut-bt-items li:nth-child(3n) { border-right: 0; }
      .hvut-bt-items li:nth-last-child(-n+3) { border-bottom: 0; }
      .hvut-bt-items li[data-action] { cursor: pointer; }
      .hvut-bt-items li:hover { color: var(--color-font-light); background-color: var(--color-bg-alpha); }

      .hvut-bt-repair { bottom: 0; left: 398px; width: 198px; height: 293px; flex-flow: column; justify-content: center; gap: 1px; cursor: pointer; }
      .hvut-bt-repair li { overflow: hidden; text-overflow: ellipsis; }
      .hvut-bt-repair:hover { background-color: var(--color-bg-alpha); }
    `);

    battle.node.div = $element('div', parent, [sel], (e) => { battle.click(e); });
    battle.node.equip = $element('ul', battle.node.div, ['.hvut-bt-equip', { dataset: { header: '装备' } }], { mouseover: (e) => { battle.hover(e); }, mouseleave: () => { battle.hover_repair(); } });
    battle.node.items = $element('ul', battle.node.div, ['.hvut-bt-items', { dataset: { header: '补给品库存' } }]);
    battle.node.repairall = $element('ul', battle.node.div, ['.hvut-bt-repair', { dataset: { header: '修理全部', action: 'repairall' } }]);
  };
  battle.get = function (eid) {
    return battle.equips.find((eq) => eq.info.eid == eid);
  };
  battle.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, eid, item, count } = target.dataset;
    if (action === 'repair') {
      battle.repair(eid);
    } else if (action === 'repairall') {
      battle.repair('all');
    } else if (action === 'buy') {
      battle.buy_items(item, count);
    }
  };
  battle.hover = function (e) {
    const target = e.target.closest('[data-action="hover"]');
    if (!target) {
      battle.hover_repair();
      return;
    }
    const { eid } = target.dataset;
    battle.hover_repair(eid);
  };
  battle.hover_repair = function (eid) {
    const prev = battle.current;
    const current = eid && battle.get(eid);
    if (prev === current) {
      return;
    }
    if (prev) {
      battle.current = null;
      prev.node.repair.remove();
    }
    if (current) {
      battle.current = current;
      battle.node.div.appendChild(current.node.repair);
      battle.node.repairall.classList.add('hvut-none');
    } else {
      battle.node.repairall.classList.remove('hvut-none');
    }
  };
  battle.buy_items = async function (name, count) {
    if (!confirm(`确定要购买 ${count} x ${hvaaT(name, 'item')} 吗?`)) {
      return;
    }
    const items = [{ name, count }];
    if ((await $item.buy(items)) === false) return;
    battle.load_items(); // 数据层已收口本 bind, 原 ctx.reloadItems 注入点撤销
  };
  // 库存网格: 行高自适应 + 三列 dummy 补位(不足 9 格补满, 超出补齐行尾) + render_supply_li 循环
  battle.render_supply_grid = function () {
    battle.node.items.innerHTML = '';
    if (!$item.list) {
      return;
    }
    const inventory = ctx.inventory();
    const items_rows = Math.max(Math.ceil(Object.keys(inventory).length / 3), 3);
    battle.node.items.style.height = (items_rows * 21 - 1) + 'px';
    const items = Object.entries(inventory);
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
        $element('li', battle.node.items);
        return;
      }
      render_supply_li(battle.node.items, name, count);
    });
  };
  // 修理材料需求行: 「数量 x 材料名 (库存)」+ 缺料 .hvut-warn(两版数据形态不同, 调用方先解包到统一参数)
  battle.render_requirement_li = function (parent, name, count, stock) {
    const li = $element('li', parent, `${count} x ${hvaaT(name, ctx.dict)} (${stock})`);
    if (stock < count) {
      li.classList.add('hvut-warn');
    }
    return li;
  };
  // 装备行: 名字 a(hvaaBind 即时重渲染译名) + 耐久列(点击修理) + 提示槽 + hover 才挂载的游离材料面板。
  battle.create_equip_li = function (info) {
    if (!info.eid) {
      $element('li', battle.node.equip, [`/<a>${info.slot} - 空</a><span></span><span></span>`]);
      return null;
    }
    const eq = { info, data: {}, node: {} };
    eq.node.li = $element('li', battle.node.equip, { dataset: { action: 'hover', eid: eq.info.eid } });
    eq.node.name = hvaaBind($element('a', eq.node.li, { href: create_hvut_equip_page_url(eq), target: '_blank', 'data-i18n-skip': '' }), function (n) { set_equip_name(n, eq); }); // hvaaBind: lang 切换即时重渲染装备译名(自渲染组件复用声明式绑定, 与菜单同机制)
    eq.node.condition = $element('span', eq.node.li, { dataset: { action: 'repair', eid: eq.info.eid } });
    eq.node.link = $element('span', eq.node.li);
    eq.node.repair = $element('ul', null, ['.hvut-bt-repair', { dataset: { header: '修理装备' } }]); // 此材料面板 hover 才挂载，不加 action（加了反与 repairall 同位置→误触修全部）
    battle.equips.push(eq);
    return eq;
  };

  // ===== 数据层（2026-06-10 续收）：能量模型后两版机制同构 —— Bazaar `?s=Bazaar&ss=am&screen=repair`
  // 修理流（postoken + eqitems/itemdata 内联变量）+ dynjs_equip 耐久读数。原「Forge 修理流(?s=Forge&ss=re)
  // = 主世界机制分叉」随旧 Bazaar Forge 页消失而不复存在（该页已无 dynjs script/#repairall，fetch 即崩，
  // 2026-06-10 实站报错证实；详情页 #equip_extended/#ee 附魔区同没 → 旧附魔只读展示一并下线）。
  // 真分叉仅剩 ctx 三注入: equip/persona(容器归属各 IIFE 闭包) + threshold(警示阈值 settings key)。
  battle.create = function () {
    battle.load_items();
    battle.equips.length = 0;
    battle.node.equip.innerHTML = '';
    const equipset = ctx.config.get('equipset');
    if (!equipset) {
      ctx.persona().change_p();
      return;
    }
    equipset.forEach((info) => {
      battle.create_equip_li(info);
    });

    battle.load_repair();
  };
  battle.load_dynjs = async function (doc) {
    const src = $qs('script[src*="/dynjs/"]', doc)?.src;
    if (!src) {
      return; // 防御: 页面无 dynjs script 时不崩整条 async 链（旧 Forge 页报错样本的教训）
    }
    const html = await $ajax.fetch(`${src}?t=${Date.now()}`);
    const equip = ctx.equip();
    Object.assign(equip.dynjs_equip, parse_script_json(html, 'dynjs_equip'));
    battle.equips.some((eq) => {
      const dynjs = equip.dynjs_equip[eq.info.eid];
      if (!dynjs) {
        ctx.persona().change_p();
        return true;
      }
      const exec = equip.reg.html.exec(dynjs.d);
      if (exec) {
        Object.assign(eq.info, parse_condition_of(exec)); // 能量模型耐久读数单一判定点(L1)
      }
      return false;
    });
    battle.update_condition();
  };
  battle.update_condition = function () {
    const raw = ctx.threshold();
    const thld = raw < 1 ? raw * 100 : raw; // <1 = 耐久比例(0.6=>60%), >=1 = 百分点(isekai 默认 20 / 主世界默认 55)
    battle.equips.forEach((eq) => {
      if (eq.info.condition === undefined) {
        return; // dynjs 缺失/失配的装备保持占位
      }
      eq.node.condition.innerHTML = '';
      $element('span', eq.node.condition, [`${eq.info.condition}%`, (eq.info.condition <= thld ? '.hvut-warn' : '')]);
      if (eq.info.energy !== null && eq.info.energy !== undefined) {
        $element('', eq.node.condition, ' / ');
        $element('span', eq.node.condition, [`${eq.info.energy}%`, (eq.info.energy <= thld ? '.hvut-warn' : '')]);
      }
      battle.update_link(eq);
    });
  };
  battle.repair = async function (eid) {
    let equips;
    if (eid === 'all') {
      equips = battle.equips;
    } else if (eid) {
      equips = [battle.get(eid)];
    } else {
      return;
    }
    equips = equips.filter((eq) => battle.eqitems[eq.info.eid]?.m);
    if (!equips.length) {
      return;
    }

    const cost = battle.calc_repair(equips);
    const buy_items = [];
    Object.entries(cost).forEach(([id, count]) => {
      const data = battle.itemdata[id];
      if (count > data.c) {
        buy_items.push({ name: data.n, count: count - data.c });
      }
    });
    if (buy_items.length) {
      if (!confirm('修理材料不足.\n是否从系统商店购买材料来修理你的装备?')) { // 原 isekai 误植邮件退回文案, 收口取主世界正确文案
        return;
      }
      battle.node.repairall.innerHTML = '<li>...</li>';
      equips.forEach((eq) => {
        eq.node.repair.innerHTML = '<li>...</li>';
        eq.node.condition.innerHTML = '<span>...</span>';
        eq.node.link.innerHTML = '';
      });
      if ((await $item.buy(buy_items)) === false) {
        battle.load_repair(equips);
        return;
      }
    }

    battle.load_repair(equips);
  };
  battle.calc_repair = function (equips = battle.equips) {
    const cost = {};
    equips.forEach((eq) => {
      const requires = battle.eqitems[eq.info.eid]?.m;
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
    return Object.keys(cost).length ? cost : null;
  };
  battle.load_repair = async function (equips) {
    battle.node.repairall.innerHTML = '<li>...</li>';
    (equips || battle.equips).forEach((eq) => {
      eq.node.repair.innerHTML = '<li>...</li>';
      eq.node.condition.innerHTML = '<span>...</span>';
      eq.node.link.innerHTML = '';
    });

    let data;
    if (equips) {
      const eqids = equips.map((eq) => `eqids[]=${eq.info.eid}`).join('&');
      data = `postoken=${battle.postoken}&${eqids}`; //&replace_charms=on
    }
    const html = await $ajax.fetch(create_hvut_armory_screen_url('repair'), data);
    const doc = $doc(html);
    const response = classify_hvut_repair_load_response(doc, 'battlePanelRepairLoadResponse', { hasEquipSelection: !!equips });
    if (response.kind === 'rejected') {
      popup(response.message);
      battle.load_items();
      return false;
    }

    battle.postoken = $id('equipform', doc).elements.postoken.value;
    battle.eqitems = parse_script_json(html, 'eqitems') || {};
    battle.itemdata = parse_script_json(html, 'itemdata') || {};
    battle.load_dynjs(doc);

    battle.equips.forEach((eq) => {
      eq.node.repair.innerHTML = '';
      eq.data.charms_damaged = false;
      const requires = battle.eqitems[eq.info.eid]?.m;
      if (requires) {
        Object.entries(requires).forEach(([id, count]) => {
          if (id > 61900 && id < 64999) {
            eq.data.charms_damaged = true;
            return;
          }
          const data = battle.itemdata[id];
          battle.render_requirement_li(eq.node.repair, data.n, count, data.c);
        });
      }
      battle.update_link(eq);
    });

    battle.node.repairall.innerHTML = '';
    const cost = battle.calc_repair();
    if (cost) {
      Object.entries(cost).forEach(([id, count]) => {
        if (id > 61900 && id < 64999) {
          return;
        }
        const data = battle.itemdata[id];
        battle.render_requirement_li(battle.node.repairall, data.n, count, data.c);
      });
    } else {
      $element('li', battle.node.repairall, '你的装备无需修理');
    }

    ctx.persona().check_warning(doc);
  };
  battle.update_link = function (eq) {
    eq.node.name.classList.remove('hvut-warn');
    eq.node.link.innerHTML = '';
    if (eq.info.condition === 0 || eq.info.energy === 0) {
      eq.node.name.classList.add('hvut-warn');
      $element('span', eq.node.link, '修理后方可使用');
    } else if (eq.data.charms_damaged) {
      eq.node.name.classList.add('hvut-warn');
      $element('a', eq.node.link, { textContent: '更换护符与护符袋', href: create_hvut_armory_screen_url('modify', { eqid: eq.info.eid }) });
    }
  };
  battle.load_items = async function () {
    battle.node.items.innerHTML = '';
    if ((await $item.load()) === false) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    battle.render_supply_grid();
    if (!ctx.config.set('items', $item.count())) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    return true;
  };
};

// 服务器标识(L1 收口 2026-06-10): 定义只依赖 location/world_text, 与 IIFE 闭包无关。
const HVUT_WORLD = create_hvut_world_identity({ isIsekai: IS_ISEKAI, seasonStage: 'serverSeason' });
const _servername = HVUT_WORLD.serverName;
const _server = {
  name: HVUT_WORLD.serverName,
  season: HVUT_WORLD.season || '1',
  [_servername]: true, // 当前服务器标记 key; isekai 判定统一走顶层 IS_ISEKAI（L0 归一）
};

// --color-* 主题 token 单一定义(L1 收口 2026-06-10): HV 两服 UI 配色本就一致, 原 isekai :root 全量 +
// 主世界 .hvut-bt-div 局部三值(border #333 等)是同概念散落 → 归一为本块(主世界面板边框随之贴 HV 原生 #5C0D11)。
GM_addStyle(/*css*/`
  :root {
    --color-font-default: #5C0D11;
    --color-font-light: #9B4E03;
    --color-font-invalid: #666;
    --color-font-invert: #fff;
    --color-font-highlight: #c00;
    --color-font-warn: #e00;
    --color-font-bonus: #03c;
    --color-border-default: #5C0D11;
    --color-border-light: #9B4E03;
    --color-border-alpha: #5C0D1136;
    --color-bg-default: #EDEBDF;
    --color-bg-back: #E3E0D1;
    --color-bg-light: #fff;
    --color-bg-alpha: #fff9;
    --color-bg-invalid: #ccc6;
    --color-bg-invert: #5C0D11;
    --color-bg-h1: #edb;
    --color-bg-h2: #E3E0D1;

    --color-equip-Peerless: #fbb;
    --color-equip-Legendary: #fd8;
    --color-equip-Magnificent: #bdf;
    --color-equip-Exquisite: #ce9;
    --color-equip-Superior: #ccc;

    --color-item-Consumable: #00B000;
    --color-item-Artifact: #0000FF;
    --color-item-Trophy: #461B7E;
    --color-item-Token: #254117;
    --color-item-Crystal: #BA05B4;
    --color-item-MonsterFood: #489EFF;
    --color-item-Material: #FF0000;
    --color-item-Collectable: #0000FF;

    --color-warn-bg: #fd9;
    --color-warn-alpha: #fd9c;
    --color-warn-unread: #fcc;
    --color-exp-bar: #9cf;
    --color-ab-max: #333;
    --color-ab-cap: #03c;
    --color-ab-up: #c00;
    --color-ab-font: #fff;
    --color-ab-slot: #333;
    --color-mm-equip: #c00;
    --color-mm-item: #090;
    --color-mm-credits: #03c;
    --color-mm-hath: #c0c;
  }
`);

// 顶部快速链接默认清单(单一来源: bindTop 旧存值归一化 + 两 IIFE settings 默认共用)。全项精选含两彩票
// (2026-06-10 用户验收: 主世界除塔楼外全有+实验室+武器/防具彩票); server 字段运行时自动分服过滤。
const TOP_MENU_DEFAULT_LINKS = ['Character', 'Equipment', 'Item Inventory', 'Item Shop', 'The Shrine', 'The Market', 'Monster Lab', 'MoogleMail', 'Weapon Lottery', 'Armor Lottery', 'Organize', 'Modify', 'Purchase', 'Sell', 'The Arena', 'The Tower', 'Ring of Blood', 'GrindFest', 'Item World'];

// _top 顶部导航·全量收口(L1 bindTop, 2026-06-10): 能量模型后两服菜单体系同构(Bazaar am 体系:
// Organize/Modify/Repair/Soulbind/Purchase/Sell/Salvage; 旧 Forge 组/Equip Inventory ss=in/
// Equipment Shop ss=es 端点全死)——原主世界 4.0.0 旧菜单表随之下线, 「菜单下拉/首行导航两服一致」
// 由本内核结构性保证(铁律4)。menu 表 server 字段过滤本服不存在项(Training/Monster Lab/彩票 =
// persistent-only, The Tower = isekai-only)。文案取两版中文较全者。
// ctx: config(IIFE-private $config) / player·re(容器归属各 IIFE 闭包的 getter)。
const bindTop = function (top, ctx) {
  top.node = {};
  top.menu = {
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
  Object.values(top.menu).forEach((m) => {
    if (!m.href) {
      m.href = `?s=${m.s}&ss=${m.ss}` + (m.screen ? `&screen=${m.screen}` : '');
    }
  });
  // 反向桥：暴露 hv-utils config 打开口给 HVAA 设置面板（UI 入口整合·只合入口）。同 window.HVAA_i18n
  // 机制反方向(hv-utils→HVAA)；两 IIFE 互斥执行，故 window 上始终只有一个活动 $config.open。
  if (typeof window !== 'undefined') { window.HVUT_openConfig = (key) => ctx.config.open(key); }

  top.init = function () {
    top.node.div = $element('div', null, ['#hvut-top'], { mouseenter: () => { top.create(); } });

    const menu_div = $element('div', top.node.div, ['.hvut-top-menu']);
    top.node.menu = {};
    if (ctx.config.settings.topMenuIntegration) {
      top.node.menu['MENU'] = hvaaBind($element('div', menu_div), (n) => { n.innerHTML = `<span>${hvaaT('MENU', 'topMenu')}</span>`; });
    } else {
      Object.values(top.menu).forEach((m) => {
        const g = m.g || m.s;
        if (!top.node.menu[g]) {
          top.node.menu[g] = hvaaBind($element('div', menu_div), (n) => { n.innerHTML = `<span>${hvaaT(g, 'topMenu')}</span>`; });
        }
      });
    }

    const links_div = $element('div', top.node.div, ['.hvut-top-links']);
    // [2026-06-10 用户裁定] 快速链接清单不再是用户设置(topMenuLinks 存值/自定义格式整个退化掉,
    // 含旧存值归一化兜底)——单一来源 TOP_MENU_DEFAULT_LINKS, 仅 server 字段运行时分服, 两服结构性一致。
    const new_mail = $id('nav_mail')?.textContent.trim();
    TOP_MENU_DEFAULT_LINKS.forEach((b) => {
      const m = top.menu[b];
      if (m.server && m.server !== _server.name) {
        return;
      }
      const a = $element('a', links_div, { href: m.href });
      if (b === 'MoogleMail' && new_mail) {
        a.classList.add('hvut-top-ygm');
      }
      hvaaBind(a, (n) => { // 链接声明式绑定(lang 切换即时重渲染)；重渲染保留英文 span 悬停提示
        let label = (b === 'MoogleMail' && new_mail) ? `[${new_mail}]` : hvaaT(b, 'topMenu');
        if (label.startsWith('{#')) { label = m.default; }
        n.textContent = label;
        $element('span', n, m.title);
      });
    });

    top.node.stamina = hvaaBind($element('div', top.node.div, ['!width: 90px;']), (n) => { n.innerHTML = `<span>${hvaaT('Stamina', 'topMenu')}: ${ctx.player().stamina}</span>`; });
    top.node.level = $element('div', top.node.div, ['!width: 60px;', `/<span>Lv.${ctx.player().level}</span>`]);
    top.node.difficulty = $element('div', top.node.div, ['!width: 80px;', `/<span>${ctx.player().difficulty}</span>`]);
    top.node.persona = hvaaBind($element('div', top.node.div, ['!width: 110px;']), (n) => { n.innerHTML = `<span>${hvaaT('Persona', 'topMenu')}</span>`; });
    if (ctx.config.settings.reNotification) {
      ctx.re().hv();
    }
    $element('div', top.node.div, ['.hvut-top-placeholder']);
    top.node.server = $element('div', top.node.div, ['!width: 80px;', `/<span>${IS_ISEKAI ? '异世界' : '永久区'}</span>`]);

    top.node.config = $element('div', top.node.div, ['!width: 30px;']);
    $element('span', top.node.config, ['#hvut-top-config-icon', '/<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="22" viewBox="0 0 50 50" fill="#5C0D11"><path d="M47.16,21.221l-5.91-0.966c-0.346-1.186-0.819-2.326-1.411-3.405l3.45-4.917c0.279-0.397,0.231-0.938-0.112-1.282 l-3.889-3.887c-0.347-0.346-0.893-0.391-1.291-0.104l-4.843,3.481c-1.089-0.602-2.239-1.08-3.432-1.427l-1.031-5.886 C28.607,2.35,28.192,2,27.706,2h-5.5c-0.49,0-0.908,0.355-0.987,0.839l-0.956,5.854c-1.2,0.345-2.352,0.818-3.437,1.412l-4.83-3.45 c-0.399-0.285-0.942-0.239-1.289,0.106L6.82,10.648c-0.343,0.343-0.391,0.883-0.112,1.28l3.399,4.863 c-0.605,1.095-1.087,2.254-1.438,3.46l-5.831,0.971c-0.482,0.08-0.836,0.498-0.836,0.986v5.5c0,0.485,0.348,0.9,0.825,0.985 l5.831,1.034c0.349,1.203,0.831,2.362,1.438,3.46l-3.441,4.813c-0.284,0.397-0.239,0.942,0.106,1.289l3.888,3.891 c0.343,0.343,0.884,0.391,1.281,0.112l4.87-3.411c1.093,0.601,2.248,1.078,3.445,1.424l0.976,5.861C21.3,47.647,21.717,48,22.206,48 h5.5c0.485,0,0.9-0.348,0.984-0.825l1.045-5.89c1.199-0.353,2.348-0.833,3.43-1.435l4.905,3.441 c0.398,0.281,0.938,0.232,1.282-0.111l3.888-3.891c0.346-0.347,0.391-0.894,0.104-1.292l-3.498-4.857 c0.593-1.08,1.064-2.222,1.407-3.408l5.918-1.039c0.479-0.084,0.827-0.5,0.827-0.985v-5.5C47.999,21.718,47.644,21.3,47.16,21.221z M25,32c-3.866,0-7-3.134-7-7c0-3.866,3.134-7,7-7s7,3.134,7,7C32,28.866,28.866,32,25,32z"></path></svg>'], () => { open_hvaa_config_from_hvut('topConfigIcon'); });

    $id('navbar').after(top.node.div);
  };

  top.create = function () {
    if (top.inited) {
      return;
    }
    top.inited = true;

    const ul = {};
    Object.values(top.menu).forEach((m) => {
      if (m.server && m.server !== _server.name) {
        return;
      }
      const g = m.g || m.s;
      if (!ul[g]) {
        if (ctx.config.settings.topMenuIntegration) {
          if (!top.node.menu['SUB']) {
            top.node.menu['SUB'] = $element('div', top.node.menu['MENU'], ['.hvut-top-sub']);
          }
          ul[g] = $element('ul', top.node.menu['SUB']);
          hvaaBind($element('li', ul[g], ['.hvut-top-menu-s']), (n) => { n.textContent = hvaaT(g, 'topMenu'); });
        } else {
          const menu_sub = $element('div', top.node.menu[g], ['.hvut-top-sub']);
          ul[g] = $element('ul', menu_sub);
        }
      }
      const li = $element('li', ul[g]);
      hvaaBind($element('a', li, { href: m.href }), (n) => { n.textContent = hvaaT(m.title, 'topMenu'); }); // 下拉声明式绑定(即时切换)
    });

    const stamina_sub = $element('div', top.node.stamina, ['.hvut-top-sub hvut-top-stamina']);
    if (!IS_ISEKAI) {
      top.node.stamina_form = $element('form', stamina_sub, { method: 'POST' }, { submit: (e) => { top.stamina_submit(e); } });
      $element('input', top.node.stamina_form, { type: 'hidden', name: 'recover', value: 'stamina' });
      $element('input', top.node.stamina_form, { type: 'submit', value: '使用精力恢复剂', disabled: ctx.player().stamina >= ctx.config.settings.disableStaminaRestorative, style: 'width: 200px;' });
      top.node.stamina.addEventListener('mouseenter', top.stamina_create);
    }
    $element('p', stamina_sub, ctx.player().condition);
    if (ctx.player().accuracy) {
      $element('p', stamina_sub, [ctx.player().accuracy, '.hvut-warn']);
    }

    if (ctx.player().level !== 500) {
      const progress = parse_hvut_top_level_progress($id('level_details')?.textContent, 'topLevelDetails');
      if (progress !== null) {
        const { exp, up, next } = progress;
        const level_start = Math.round(Math.pow(ctx.player().level + 3, Math.pow(2.850263212287058, 1 + ctx.player().level / 1000)));
        const level_exp = exp - level_start;
        const level_up = up - level_start;
        const pct = ((level_exp / level_up) * 100).toFixed(2);
        const level_sub = $element('div', top.node.level, ['.hvut-top-sub']);
        $element('p', level_sub, `累计经验: ${exp.toLocaleString()} / ${up.toLocaleString()}`);
        $element('p', level_sub, `升级还需: ${next.toLocaleString()}`);
        $element('p', level_sub, `当前等级: ${level_exp.toLocaleString()} / ${level_up.toLocaleString()} (${pct}%)`);
        $element('div', level_sub, ['.hvut-top-exp', `/<div style="width: ${pct}%;"></div>`]);
      }
    }

    const server_sub = $element('div', top.node.server, ['.hvut-top-sub hvut-top-server']);
    if (IS_ISEKAI) {
      $element('a', server_sub, { href: '/', innerHTML: `<p>你现在在异世界</p><p>${_server.season}</p><p>点击切换到永久区</p>` });
    } else {
      $element('a', server_sub, { href: '/isekai/', innerHTML: '<p>你现在在永久区</p><p>点击切换到异世界</p>' });
    }

    const config_sub = $element('div', top.node.config, ['.hvut-top-sub hvut-top-config']);
    $element('div', config_sub, 'HVAA 设置', () => { open_hvaa_config_from_hvut('topConfigMenu'); }); // chunk1: 齿轮槽位整槽对应 HVAA 面板；hv-utils 配置由 HVAA 面板内「HV Utils 设置」入口开
    if ($id('mbsettings')) { // monsterbation
      config_sub.appendChild($id('mbsettings'));
      $id('mbsettings').firstElementChild.className = '';
      GM_addStyle(/*css*/`
        #mbsettings { position: relative; }
        #mbprofile { top: 100%; left: 0; min-width: 100%; box-sizing: border-box; font-weight: normal; }
      `);
    }
  };

  top.stamina_create = async function () {
    if (top.stamina_create.inited) {
      return;
    }
    top.stamina_create.inited = true;
    const p = $element('p', top.node.stamina_form, '加载中...');
    if ((await $item.once()) === false) {
      p.textContent = IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.';
      return false;
    }
    const items = ['Caffeinated Candy', 'Energy Drink'].filter((e) => $item.count(e));
    if (items.length) {
      items.forEach((e) => { $element('p', top.node.stamina_form, `${e} (${$item.count(e)})`); });
      p.remove();
    } else {
      p.textContent = '没有能量恢复剂';
    }
  };

  top.stamina_submit = function (e) {
    if (ctx.config.settings.confirmStaminaRestorative && !confirm('确定要使用能量恢复剂吗?')) {
      e.preventDefault();
    }
  };

  GM_addStyle(/*css*/`
    #navbar { display: none; }

    #hvut-top { display: flex; position: relative; height: 22px; padding: 2px 0; border-bottom: 1px solid var(--color-border-default); font-size: 9pt; line-height: 22px; font-weight: bold; z-index: 10; white-space: nowrap; cursor: default; }
    #hvut-top > div { position: relative; height: 22px; margin: 0 5px; }
    #hvut-top a { display: block; text-decoration: none; }

    .hvut-top-warn { background-color: var(--color-warn-bg); }
    .hvut-top-message { position: absolute !important; top: 100%; left: -1px; width: 100%; margin: 0 !important; padding: 2px 0; border: 1px solid var(--color-border-default); background-color: var(--color-warn-alpha); color: var(--color-font-warn); z-index: -1; pointer-events: none; }

    .hvut-top-sub { visibility: hidden; position: absolute; top: 22px; left: -6px; padding: 5px; border-width: 0 1px 1px; border-style: solid; border-color: var(--color-border-default); background-color: var(--color-bg-default); }
    div:hover > .hvut-top-sub { visibility: visible; }
    .hvut-top-sub select { display: block; margin: 0; }
    .hvut-top-stamina > p { width: 220px; border-top: 1px solid var(--color-border-default); white-space: normal; }
    .hvut-top-stamina > p:first-child { border-top: 0; }
    .hvut-top-exp { position: relative; width: 299px; height: 8px; margin: 0 auto; border: 1px solid var(--color-border-default); background-color: var(--color-bg-alpha); }
    .hvut-top-exp::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, var(--color-border-default) 1px, transparent 1px) repeat -1px 0 / 30px; }
    .hvut-top-exp > div { position: absolute; top: 0; left: 0; height: 100%; background-color: var(--color-exp-bar); }
    .hvut-top-placeholder { flex-grow: 1; }
    .hvut-top-server { left: auto; right: -6px; }
    .hvut-top-config { left: auto; right: -6px; }
    .hvut-top-config > div { margin: 5px; text-align: left; cursor: pointer; }
    #hvut-top-config-icon > svg { fill: var(--color-font-default); cursor: pointer; }

    .hvut-top-menu { display: flex; }
    .hvut-top-menu > div { position: relative; margin: 0 5px; }
    .hvut-top-menu span { font-size: 11pt; color: var(--color-font-light); }
    .hvut-top-menu .hvut-top-sub { width: max-content; }
    .hvut-top-menu ul { float: left; margin: 0 0 0 5px; padding: 0; list-style: none; text-align: left; line-height: 20px; }
    .hvut-top-menu ul:first-child { margin-left: 0; }
    .hvut-top-menu a { margin: 3px 0; padding: 0 5px; }
    .hvut-top-menu a:hover { background-color: var(--color-bg-light); }
    .hvut-top-menu-s { padding: 0 5px; background-color: var(--color-bg-invert); color: var(--color-font-invert); }

    .hvut-top-links { display: flex; }
    .hvut-top-links > a { position: relative; margin: 0 1px; padding: 0 1px; min-width: 28px; font-size: 11pt; border-radius: 2px; }
    .hvut-top-links > a:hover { background-color: var(--color-bg-light); }
    .hvut-top-links > a > span { display: none; position: absolute; top: 100%; left: 0; margin-top: 2px; margin-left: 0; padding: 1px 4px; background-color: var(--color-bg-light); color: var(--color-font-light); border: 1px solid var(--color-border-light); font-size: 10pt; line-height: 20px; font-weight: normal; pointer-events: none; }
    .hvut-top-links > a:hover > span { display: block; }
    .hvut-top-ygm { color: transparent !important; background: url('/y/mmail/ygm.png') no-repeat center center; animation: ygm 0.5s ease-in-out 10 alternate; filter: brightness(200%); }
    .hvut-top-ygm:hover { color: var(--color-font-highlight) !important; background-image: none; animation: none; filter: none; }
    @keyframes ygm { from { opacity: 1; } to { opacity: 0.3; } }
  `);
};

// $dfct 难度切换(两 IIFE 收口一处, 基准 = ISEKAI 4.2.0; 铁律1e 应抽尽抽)。原"被 topmenu node 形态阻塞"
// 判断已证伪 —— node.div/button vs 平铺 div/button 只是对象自身字面量组织, 两版同取自 _top.node.difficulty。
// 收口统一: ① node 包一层(isekai 形态); ② change() POST 取 4.2.0 FormData+'FORM'(两服同 HV 引擎, $ajax 共享支持);
// ③ 文案取主世界汉化 '(属性日: 错误)'; ④ mouseenter 懒加载统一进 init。
// ctx: config / top·player 用 getter(规避声明顺序 TDZ)。
const write_hvut_character_config_value = function (ctx, key, value, stage) {
  if (ctx.config.set(key, value)) {
    return { kind: 'accepted' };
  }
  const evidence = record_hvut_config_storage_failure(stage, { key: key });
  return { kind: 'rejected', reason: 'configWriteFailed', key: key, evidence: evidence };
};
const bindDfct = function (dfct, ctx) {
  dfct.node = {
    div: ctx.top.node.difficulty,
    button: ctx.top.node.difficulty.firstElementChild,
  };
  dfct.list = ['普通✖1', '困难✖2', '噩梦✖4', '地狱✖7', '任天堂✖10', 'IWBTH', '彩虹小马✖20'];

  dfct.init = function () {
    const ch_style = ctx.config.get('ch_style', {});
    if (ch_style.difficulty !== ctx.player.difficulty) {
      ch_style.difficulty = ctx.player.difficulty;
      const write = write_hvut_character_config_value(ctx, 'ch_style', ch_style, 'difficultyCharacterStyleWrite');
      if (write.kind === 'rejected') {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
    }
    dfct.node.div.addEventListener('mouseenter', dfct.create);
    return true;
  };
  dfct.create = function () {
    if (dfct.sub) {
      return;
    }
    dfct.sub = $element('div', dfct.node.div, ['.hvut-top-sub']);
    const options = dfct.list.map((d, i) => `${i + 1}:${d}`).reverse();
    dfct.selector = $input(['select', options], dfct.sub, { size: dfct.list.length, className: 'hvut-scrollbar-none', style: 'width: 80px;' }, { change: () => {
      dfct.selector.disabled = true;
      dfct.change(dfct.selector.value);
    } });
    dfct.selector.value = dfct.list.indexOf(ctx.player.difficulty) + 1;
  };
  dfct.change_outcome = async function (value) {
    dfct.node.button.textContent = '(D1...)';
    let html;
    try {
      html = await $ajax.fetch(create_hvut_character_settings_url());
    } catch (error) {
      return reject_hvut_difficulty_refresh('difficultySettingsPageFetchFailed', { message: String(error?.message || error) });
    }
    let doc = $doc(html);
    dfct.node.button.textContent = '(D2...)';
    const form = $qs('#settings_outer form', doc);
    if (!form) {
      return reject_hvut_difficulty_refresh('difficultySettingsFormMissing', {});
    }
    const data = new FormData(form);
    data.set('difflevel', value);
    data.set('submit', 'Apply Changes');
    try {
      html = await $ajax.fetch(create_hvut_character_settings_url(), data, 'FORM');
    } catch (error) {
      return reject_hvut_difficulty_refresh('difficultyApplyFetchFailed', { message: String(error?.message || error) });
    }
    doc = $doc(html);
    return dfct.set_button_outcome(doc);
  };
  dfct.change = async function (value) {
    const outcome = await dfct.change_outcome(value);
    return outcome.kind === 'accepted';
  };
  dfct.set_button_outcome = function (doc) {
    const value = parse_hvut_difficulty_from_level_readout(doc, 'difficultyLevelReadout');
    if (value === null) {
      dfct.node.button.textContent = '(属性日: 错误)';
      if (dfct.selector) {
        dfct.selector.disabled = false;
      }
      return reject_hvut_difficulty_refresh('difficultyLevelReadoutRejected', {});
    }
    ctx.player.difficulty = value;
    dfct.node.button.textContent = value;
    if (dfct.selector) {
      dfct.selector.value = dfct.list.indexOf(value) + 1;
      dfct.selector.disabled = false;
    }
    const ch_style = ctx.config.get('ch_style', {});
    ch_style.difficulty = value;
    const write = write_hvut_character_config_value(ctx, 'ch_style', ch_style, 'difficultyCharacterStyleWrite');
    if (write.kind === 'rejected') {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return { kind: 'rejected', reason: 'difficultyCharacterStyleWriteRejected', evidence: write.evidence };
    }
    return { kind: 'accepted', value: value };
  };
  dfct.set_button = function (doc) {
    const outcome = dfct.set_button_outcome(doc);
    return outcome.kind === 'accepted';
  };
};

// $persona 角色/装备套装切换(两 IIFE 12/13 方法收口一处, 基准 = ISEKAI 4.2.0; 铁律1e 应抽尽抽)。
// 收口统一: ① node 包一层; ② 4.2.0 ename 装备套装命名功能(set_value('name')→json.ename→按钮优先显示)
//   并入主世界(老 json 无 ename 字段走 || 回退, 兼容); ③ set_button 保险回退取两版并集
//   (pname 空时 'Persona '+pset, 主世界 4.0.0 写法); ④ 'Set i'→'套装 i'(取主世界汉化, create/change_e 两处);
//   ⑤ check_e 取 match 解析(语义同 slice(-8,-7) 简写, 更稳); ⑥ 警示统一 .hvut-warn/.hvut-bonus class
//   (主世界 BASIC CSS 已补 .hvut-bonus; inline style 形态弃)。
// 真分叉经 ctx 倒置(各 IIFE 闭包注入): warnSelector(#stamina_restore 两版解析 selector 不同, 未实证同 DOM
//   不盲合) / parseEquipElem($equip.parse.elem vs .div, dynjs 模型 Chunk 迁移中) / applyDynjs(2026-06-10
//   已同构: 能量模型后两版 dynjs 文件统一 dynjs_equip, 实现 identical, 留 ctx 仅因 $equip 容器归属各闭包)。
//   parse_stats_pane 解析模型大分叉, 整方法留各 IIFE 字面量。
const bindPersona = function (persona, ctx) {
  persona.node = {
    div: ctx.top.node.persona,
    button: ctx.top.node.persona.firstElementChild,
  };
  persona.json = ctx.config.get('persona', {});
  persona.write_config_value = function (key, value, stage) {
    return write_hvut_character_config_value(ctx, key, value, stage);
  };

  persona.init_outcome = async function () {
    if ($id('persona_form')) {
      const personaCheck = persona.check_p_outcome();
      if (personaCheck.kind === 'rejected') return personaCheck;
      if (!personaCheck.checked) {
        const equipOutcome = await persona.change_e_outcome();
        if (equipOutcome.kind === 'rejected') return equipOutcome;
      } else {
        persona.set_button();
      }
    } else if (!persona.json.pset || !persona.json.eset) {
      const personaOutcome = await persona.change_p_outcome();
      if (personaOutcome.kind === 'rejected') return personaOutcome;
    } else {
      persona.set_button();
    }
    persona.check_warning();
    persona.node.div.addEventListener('mouseenter', persona.create);
    return { kind: 'accepted' };
  };
  persona.init = async function () {
    const outcome = await persona.init_outcome();
    return outcome.kind === 'accepted';
  };
  persona.create = function () {
    const json = persona.json;
    if (!json.pset || !json.eset) {
      return;
    }
    if (persona.sub) {
      return;
    }
    persona.sub = $element('div', persona.node.div, ['.hvut-top-sub']);

    persona.selector_p = $input('select', persona.sub, { size: json.plen, className: 'hvut-scrollbar-none', style: 'width: 110px;' }, { change: () => {
      persona.selector_p.disabled = true;
      persona.change_p(persona.selector_p.value);
    } });
    for (let i = 1; i <= json.plen; i++) {
      $element('option', persona.selector_p, { value: i, text: json[i].name });
    }
    persona.selector_p.value = json.pset;

    persona.selector_e = $input('select', persona.sub, { size: json.elen, className: 'hvut-scrollbar-none', style: 'width: 110px;' }, { change: () => {
      persona.selector_e.disabled = true;
      persona.change_e(persona.selector_e.value);
    } });
    for (let i = 1; i <= json.elen; i++) {
      $element('option', persona.selector_e, { value: i, text: json[json.pset][i].name || `套装 ${i}` });
    }
    persona.selector_e.value = json.eset;
  };
  persona.check_p_outcome = function (doc) {
    const json = persona.json;
    const state = parse_hvut_persona_form_state(doc, 'personaFormState');
    if (state === null) {
      return reject_hvut_persona_sync('personaFormStateRejected', {});
    }
    const pset = state.pset;
    const plen = state.plen;
    const checked = pset === json.pset;

    state.options.forEach((o) => {
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
    if (persona.set_value() === false) {
      return reject_hvut_persona_sync('personaStateWriteRejected', {});
    }
    return { kind: 'accepted', checked: checked };
  };
  persona.check_e_outcome = function (doc) {
    const json = persona.json;
    const pset = json.pset;
    const state = parse_hvut_equip_set_state(doc, 'personaEquipSetState');
    if (state === null) {
      return reject_hvut_persona_sync('personaEquipSetStateRejected', {});
    }
    const eset = state.eset;
    const elen = state.elen;

    for (let i = 1; i <= elen; i++) {
      if (!json[pset][i]) {
        json[pset][i] = { name: '' };
      }
    }

    json.eset = eset;
    json.elen = elen;
    json.ename = json[pset][eset].name;
    if (persona.set_value() === false) {
      return reject_hvut_persona_sync('personaStateWriteRejected', {});
    }
    return { kind: 'accepted' };
  };
  persona.change_p_outcome = async function (pset) {
    persona.node.button.textContent = '(P...)';
    ctx.dfct.node.button.textContent = '(D...)';
    let html;
    try {
      html = await $ajax.fetch(create_hvut_character_page_url(), pset ? `persona_set=${pset}` : null);
    } catch (error) {
      return reject_hvut_persona_sync('personaPageFetchFailed', { message: String(error?.message || error) });
    }
    const doc = $doc(html);
    const personaState = persona.check_p_outcome(doc);
    if (personaState.kind === 'rejected') {
      if (persona.selector_p) persona.selector_p.disabled = false;
      return personaState;
    }
    if (persona.selector_p) {
      persona.selector_p.value = persona.json.pset;
      persona.selector_p.disabled = false;
    }
    const equipOutcome = await persona.change_e_outcome();
    if (equipOutcome.kind === 'rejected') return equipOutcome;
    const difficultyOutcome = ctx.dfct.set_button_outcome(doc);
    if (difficultyOutcome.kind === 'rejected') return difficultyOutcome;
    return { kind: 'accepted' };
  };
  persona.change_p = async function (pset) {
    const outcome = await persona.change_p_outcome(pset);
    return outcome.kind === 'accepted';
  };
  persona.change_e_outcome = async function (eset) {
    persona.node.button.textContent = '(E...)';
    let html;
    try {
      html = await $ajax.fetch(create_hvut_equipment_page_url(), eset ? `equip_set=${eset}` : null);
    } catch (error) {
      return reject_hvut_persona_sync('equipPageFetchFailed', { message: String(error?.message || error) });
    }
    const doc = $doc(html);
    const equipState = persona.check_e_outcome(doc);
    if (equipState.kind === 'rejected') {
      if (persona.selector_e) persona.selector_e.disabled = false;
      persona.set_button();
      return equipState;
    }
    const json = persona.json;
    if (persona.selector_e) {
      for (let i = 1; i <= json.elen; i++) {
        const ename = json[json.pset][i].name;
        persona.selector_e.options[i - 1].text = ename || `套装 ${i}`;
      }
      persona.selector_e.value = json.eset;
      persona.selector_e.disabled = false;
    }
    persona.set_button();
    const loadOutcome = await persona.load_dynjs_outcome(doc);
    if (loadOutcome.kind === 'rejected') return loadOutcome;
    persona.check_warning(doc);
    return { kind: 'accepted' };
  };
  persona.change_e = async function (eset) {
    const outcome = await persona.change_e_outcome(eset);
    return outcome.kind === 'accepted';
  };
  persona.set_button = function () {
    const pname = persona.json.pname || `Persona ${persona.json.pset}`;
    persona.node.button.textContent = persona.json.ename || `${pname.slice(0, 10)} [${persona.json.eset}]`;
  };
  persona.load_dynjs_outcome = async function (doc) {
    const script = $qs('script[src*="/dynjs/"]', doc);
    if (!script?.src) {
      return reject_hvut_persona_sync('personaDynjsScriptMissing', {});
    }
    let html;
    try {
      html = await $ajax.fetch(`${script.src}?t=${Date.now()}`);
    } catch (error) {
      return reject_hvut_persona_sync('personaDynjsFetchFailed', { message: String(error?.message || error) });
    }
    try {
      ctx.applyDynjs(html);
    } catch (error) {
      return reject_hvut_persona_sync('personaDynjsApplyFailed', { message: String(error?.message || error) });
    }
    const equipsetOutcome = persona.save_equipset_outcome(doc);
    if (equipsetOutcome.kind === 'rejected') return equipsetOutcome;
    const statsOutcome = persona.parse_stats_pane_outcome(doc);
    if (statsOutcome.kind === 'rejected') return statsOutcome;
    if (_query.s === 'Battle') {
      ctx.battle?.create();
    } else if (['eq', 'ab', 'it', 'se'].includes(_query.ss)) {
      reloadCurrentPage(hvutReloadReason('HV_UTILS_PERSONA_DYNJS'));
    }
    return { kind: 'accepted' };
  };
  persona.load_dynjs = async function (doc) {
    const outcome = await persona.load_dynjs_outcome(doc);
    return outcome.kind === 'accepted';
  };
  // [2026-06-10 续收] 原「parse_stats_pane 解析模型大分叉留各 IIFE」: 主世界旧版解析 .spn + #stats_pane
  // .st1/.st2(旧页面), 能量模型后主世界属性页已同构 isekai 的 #stats_scrollable > table(实站报错证实:
  // 装备页无 .spn → bail 返回 undefined → _eq.stats_pane['Spell Type'] 崩断整条 IIFE) → 分叉消失, 收
  // isekai 实现。bail 返回 {}(而非 undefined): 「无属性面板不解析不写配置」不变量保留, 消费方索引安全。
  persona.parse_stats_pane_outcome = function (doc) {
    if (!$qs('#stats_scrollable', doc)) return { kind: 'accepted', stats_pane: {} };
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
        fighting_style = 'Niten Ichiryu'; // 逻辑值一律英文(原 isekai 版误植中文'二天轻甲战士'; 显示走 interface-dict '二天一流')
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
    const spell_type = ['Fire', 'Cold', 'Elec', 'Wind', 'Holy', 'Dark'].sort((a, b) => stats_pane[`${b} EDB`] - stats_pane[`${a} EDB`])[0];
    const spell_damage = stats_pane[`${spell_type} EDB`];
    const prof_factor = Math.max(0, Math.min(1, stats_pane[{ 'Holy': 'Divine', 'Dark': 'Forbidden' }[spell_type] || 'Elemental'] / ctx.player.level - 1));
    const ch_style = { level: ctx.player.level, difficulty: ctx.player.difficulty };
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
    const write = persona.write_config_value('ch_style', ch_style, 'personaCharacterStyleWrite');
    if (write.kind === 'rejected') {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return { kind: 'rejected', reason: 'personaCharacterStyleWriteRejected', evidence: write.evidence };
    }
    return { kind: 'accepted', stats_pane: stats_pane };
  };
  persona.set_value = function (name, value) {
    const json = persona.json;
    if (name) {
      json[json.pset][json.eset][name] = value;
    }
    if (name === 'name') {
      json.ename = value;
      persona.set_button();
    }
    const write = persona.write_config_value('persona', json, 'personaStateWrite');
    if (write.kind === 'rejected') {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    return true;
  };
  persona.get_value = function (name) {
    const json = persona.json;
    return json[json.pset][json.eset][name];
  };
  persona.read_equipset_row = function (row) {
    const slot = row.children?.[0]?.textContent || '';
    const equipNode = row.children?.[1];
    if (!equipNode) return { slot };
    const eq = ctx.parseEquipElem(equipNode);
    if (!eq.info) return { slot };
    const { category, name, customname, eid, key } = eq.info;
    return { slot, category, name, customname, eid, key };
  };
  persona.save_equipset_outcome = function (doc) {
    const equipset = $qsa('.eqb', doc).map((d) => persona.read_equipset_row(d));
    const write = persona.write_config_value('equipset', equipset, 'personaEquipsetWrite');
    if (write.kind === 'rejected') {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return { kind: 'rejected', reason: 'personaEquipsetWriteRejected', evidence: write.evidence };
    }
    return { kind: 'accepted' };
  };
  persona.save_equipset = function (doc) {
    const outcome = persona.save_equipset_outcome(doc);
    return outcome.kind === 'accepted';
  };
  persona.check_warning = function (doc) {
    const top = ctx.top;
    top.node.message?.remove();
    top.node.div.classList.remove('hvut-top-warn');
    top.node.persona.firstElementChild.classList.remove('hvut-warn');
    top.node.stamina.firstElementChild.classList.remove('hvut-warn', 'hvut-bonus');
    ctx.player.warn = $qsa(ctx.warnSelector, doc).map((d) => d.textContent.trim()); // Repair weapon, Repair armor, Check equipment, Check attributes
    if (ctx.player.warn.length) {
      if (_query.s === 'Battle') {
        top.node.message = top.node.message || $element('div', null, ['.hvut-top-message']);
        top.node.message.textContent = '[警告] ' + ctx.player.warn.join(', ');
        top.node.div.appendChild(top.node.message);
      }
      top.node.div.classList.add('hvut-top-warn');
      top.node.persona.firstElementChild.classList.add('hvut-warn');
    }
    if (ctx.player.condition.includes('Stamina: Exhausted') || ctx.player.accuracy || ctx.player.stamina <= ctx.config.settings.warnLowStamina) {
      top.node.div.classList.add('hvut-top-warn');
      top.node.stamina.firstElementChild.classList.add('hvut-warn');
    } else if (ctx.player.condition.includes('Stamina: Great')) {
      top.node.stamina.firstElementChild.classList.add('hvut-bonus');
    }
  };
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
        try {
          html = await $ajax.fetch(create_hvut_mail_compose_url());
        } catch (error) {
          return stop_hvut_mooglemail_send_failure('mailboxLoadRequest', { index: index, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to load mailbox`);
        }
        doc = $doc(html);
      }
      const mailform = $id('mailform', doc);
      const tokenInput = mailform?.elements?.mmtoken;
      if (!tokenInput?.value) {
        return stop_hvut_mooglemail_send_failure('mailboxToken', { index: index }, `#${index}: !!! Error: Unable to read mailbox token`);
      }
      $mail.token = tokenInput.value;
      if ($id('mmail_attachremove', doc)) {
        $mail.log(`#${index}: Removing attachments`);
        try {
          await $mail.discard();
        } catch (error) {
          return stop_hvut_mooglemail_send_failure('mailboxInitialDiscard', { index: index, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to discard existing attachments`);
        }
      }
    }
    const token = $mail.token;

    if (attach?.length) {
      $mail.log(`#${index}: Attaching`);
      async function attach_add(e) {
        const html = await $ajax.fetch(create_hvut_mail_compose_url(), `mmtoken=${token}&action=attach_add&select_item=${e.id}&select_count=${e.count}&select_pane=${e.pane}`);
        const response = classify_hvut_mooglemail_attach_response(html, 'attachEmptyResponse', { index: index, item: e.id, count: e.count, pane: e.pane });
        if (response.kind === 'rejected') {
          return response;
        }
        done++;
        $mail.log(`#${index}: Attached (${done}/${total})`);
        return response;
      }

      const total = attach.length;
      let done = 0;
      const requests = attach.map((e) => attach_add(e));
      let results;
      try {
        results = await Promise.all(requests);
      } catch (error) {
        return stop_hvut_mooglemail_send_failure('attachRequest', { index: index, total: total, done: done, error: error?.message || String(error) }, `#${index}: !!! Error: Attachment request failed`, 'attachRequestDiscard');
      }
      if (!results.every((r) => r.kind === 'accepted')) {
        return stop_hvut_mooglemail_send_failure('attachRejected', { index: index, total: total, done: done, results: results }, null, 'attachRejectedDiscard');
      }
    }

    if (cod && !cod_persistent) {
      $mail.log(`#${index}: Setting CoD`);
      try {
        html = await $ajax.fetch(create_hvut_mail_compose_url(), `mmtoken=${token}&action=attach_cod&action_value=${cod}`);
      } catch (error) {
        return stop_hvut_mooglemail_send_failure('codRequest', { index: index, cod: cod, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to set CoD`, 'codRequestDiscard');
      }
      const response = classify_hvut_mooglemail_send_response(html, 'codResponse', { index: index, cod: cod });
      if (response.kind === 'rejected') {
        return stop_hvut_mooglemail_send_failure('codRejected', { index: index, cod: cod, response: response }, null, 'codRejectedDiscard');
      }
    }

    if (cod && cod_persistent) {
      $mail.log(`#${index}: Preparing in Persistent`);
      try {
        html = await $ajax.fetch(create_hvut_mail_compose_url({ persistent: true }));
      } catch (error) {
        return stop_hvut_mooglemail_send_failure('persistentMailboxLoadRequest', { index: index, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to access to Persistent MoogleMail`);
      }
      doc = $doc(html);
      const mailboxResponse = classify_hvut_mooglemail_send_response(html, 'persistentMailboxResponse', { index: index });
      if (mailboxResponse.kind === 'rejected') {
        return stop_hvut_mooglemail_send_failure('persistentMailboxRejected', { index: index, response: mailboxResponse }, null, 'persistentMailboxRejectedDiscard');
      }
      if (!$id('navbar', doc)) {
        return stop_hvut_mooglemail_send_failure('persistentMailboxUnavailable', { index: index }, '!!! Error: Unable to access to Persistent MoogleMail');
      }
      if ($id('mmail_attachremove', doc)) {
        return stop_hvut_mooglemail_send_failure('persistentMailboxDirty', { index: index }, '!!! Error: Something is attached to Persistent MoogleMail');
      }

      $mail.log(`#${index}: Attaching in Persistent`);
      try {
        html = await $ajax.fetch(create_hvut_mail_compose_url({ persistent: true }), `mmtoken=${token}&action=attach_add&select_item=0&select_count=1&select_pane=credits`);
      } catch (error) {
        return stop_hvut_mooglemail_send_failure('persistentAttachRequest', { index: index, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to attach Persistent CoD credit`, 'persistentAttachRequestDiscard');
      }
      const persistentAttachResponse = classify_hvut_mooglemail_send_response(html, 'persistentAttachResponse', { index: index });
      if (persistentAttachResponse.kind === 'rejected') {
        return stop_hvut_mooglemail_send_failure('persistentAttachRejected', { index: index, response: persistentAttachResponse }, null, 'persistentAttachRejectedDiscard');
      }

      $mail.log(`#${index}: Setting CoD in Persistent`);
      try {
        html = await $ajax.fetch(create_hvut_mail_compose_url({ persistent: true }), `mmtoken=${token}&action=attach_cod&action_value=${cod}`);
      } catch (error) {
        return stop_hvut_mooglemail_send_failure('persistentCodRequest', { index: index, cod: cod, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to set Persistent CoD`, 'persistentCodRequestDiscard');
      }
      const persistentCodResponse = classify_hvut_mooglemail_send_response(html, 'persistentCodResponse', { index: index, cod: cod });
      if (persistentCodResponse.kind === 'rejected') {
        return stop_hvut_mooglemail_send_failure('persistentCodRejected', { index: index, cod: cod, response: persistentCodResponse }, null, 'persistentCodRejectedDiscard');
      }

      $mail.log(`#${index}: Sending in Persistent`);
      try {
        html = await $ajax.fetch(create_hvut_mail_compose_url({ persistent: true }), { mmtoken: token, action: 'send', message_to_name: to_name, message_subject: subject, message_body: body });
      } catch (error) {
        return stop_hvut_mooglemail_send_failure('persistentSendRequest', { index: index, to_name: to_name, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to send Persistent MoogleMail`, 'persistentSendRequestDiscard');
      }
      const persistentSendResponse = classify_hvut_mooglemail_send_response(html, 'persistentSendResponse', { index: index, to_name: to_name });
      if (persistentSendResponse.kind === 'rejected') {
        return stop_hvut_mooglemail_send_failure('persistentSendRejected', { index: index, to_name: to_name, response: persistentSendResponse }, null, 'persistentSendRejectedDiscard');
      }
    }

    $mail.log(`#${index}: Sending`);
    try {
      html = await $ajax.fetch(create_hvut_mail_compose_url(), { mmtoken: token, action: 'send', message_to_name: to_name, message_subject: subject, message_body: body });
    } catch (error) {
      return stop_hvut_mooglemail_send_failure('sendRequest', { index: index, to_name: to_name, error: error?.message || String(error) }, `#${index}: !!! Error: Unable to send MoogleMail`, 'sendRequestDiscard');
    }
    const sendResponse = classify_hvut_mooglemail_send_response(html, 'sendResponse', { index: index, to_name: to_name });
    if (sendResponse.kind === 'rejected') {
      return stop_hvut_mooglemail_send_failure('sendRejected', { index: index, to_name: to_name, response: sendResponse }, null, 'sendRejectedDiscard');
    }

    $mail.log(`#${index}: Completed`);
    $mail.ready = true;
    $mail.current++;
    if ($mail.queue[$mail.current]) {
      return $mail.send();
    } else {
      openUrl(create_hvut_mail_sent_url(), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));
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
              body += '\n=> 货到付款：0 Credits';
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
  discard: function () {
    return $ajax.fetch(create_hvut_mail_compose_url(), `mmtoken=${$mail.token}&action=discard`);
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

// ===== L3.A1 Character.it (物品仓库) 路由块去重：公共骨架（loop + 布局 CSS 两版 byte-identical）。两 IIFE 经作用域链调 _it.init()。=====
const _it = {
  init() {
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
    $qsa('.itemlist tr').forEach((tr) => {
      const div = tr.cells[0].firstElementChild;
      const type = $item.get_type(div.getAttribute('onmouseover'));
      tr.classList.add(`hvut-item-${type}`);
    });
  },
};

// ===== L3.A2 Character 属性面板双列展开（两 IIFE 收口一处; 铁律1e 应抽尽抽）。能量模型后主世界属性页已同构
// isekai 的 #stats_scrollable, 主世界旧 #stats_pane/.st1-.st3 折叠按钮段随旧页面死亡(2026-06-10 实站反馈
// "主世界需下拉、异世界刚好"证实——旧判断落空致主世界无人展开, 保留原站固定高度滚动条)。两 IIFE 顶层经作用域链调 _eqch.init()。
// 命名取页面骨架 #eqch_outer; 不可用 _ch——两 IIFE 各有 var _ch={}(经验模拟器容器), var 提升会遮蔽公共区符号。=====
const _eqch = {
  init() {
    if (!$id('stats_scrollable')) return;
    GM_addStyle(/*css*/`
      #stats_scrollable .spc { width: auto; font-weight: bold; }
      #stats_scrollable table { font-size: 9pt; }
      #stats_scrollable td:first-child { min-width: 45px; padding-left: 3px; color: var(--color-font-highlight); }
      #stats_scrollable td:last-child { white-space: nowrap; }
      .hvut-ch-expand #eqch_left { width: 660px; }
      .hvut-ch-expand #eqch_stats { width: 560px; }
      .hvut-ch-expand #stats_scrollable { column-count: 2; column-rule: 1px dotted; column-gap: 10px; height: 631px; padding: 5px 50px 5px 10px; line-height: 18px; overflow: visible; }
      .hvut-ch-expand #stats_scrollable .spc:nth-last-of-type(5) { break-before: column; }
      .hvut-ch-expand #stats_scrollable table:nth-last-of-type(-n+5) { width: 300px; text-align: left; }
      .hvut-ch-expand #stats_scrollable table:nth-last-of-type(-n+5) tr { display: inline-block; width: 50%; }
    `);
    $id('eqch_outer').classList.add('hvut-ch-expand');
  },
};

// ===== L3.A3 Armory Modify 升级材料成本统计（两 IIFE 收口一处; 铁律1e 应抽尽抽）。原 isekai [11] 段字面量;
// 主世界旧 Forge Upgrade/Salvage/sort 段随旧页面死亡(bindTop 注释实证: 旧 Forge 组端点全死), 升级/分解业务
// 继任形态 = Bazaar am 体系, 本函数为其改装详情页(#upgrmats)追加材料总价统计。列表页无 #upgrmats 自然 no-op。=====
const _amModify = function () {
  if (!$id('upgrmats')) {
    return;
  }
  const table = $id('upgrmats');
  const materials = {};
  Array.from(table.rows).forEach((tr) => {
    if (tr.cells[0].colSpan !== 1) {
      const credits = parseInt(tr.cells[0].textContent.match(/([0-9,]+) Credits/)?.[1].replace(/,/g, '') || 0);
      materials['Credits'] = credits;
      return;
    }
    const count = parseInt(tr.cells[0].textContent);
    const name = tr.cells[1].textContent;
    materials[name] = count;
  });
  const cost = $price.value(materials) + materials['Credits'];
  $element('p', [table, 'afterend'], `Total Cost: ${cost.toLocaleString()}`);
};

const _window = (typeof unsafeWindow === 'undefined') ? window : unsafeWindow; // 两 IIFE byte-identical 提公共(2026-06-10, $equip/$armory 收口前置)

// $input/toggle_button isekai 5/7 参版提公共区(基准 isekai 4.2.0; bindEquip/bindArmory 等公共收口对象 + isekai IIFE 共用)。
// 主世界 IIFE 留本地 4/6 参简版遮蔽——其旧段调用按简版语义写, 待旧段全退化后删除简版。
/* eslint-disable arrow-spacing, block-spacing, comma-spacing, key-spacing, keyword-spacing, object-curly-spacing, space-before-blocks, space-before-function-paren, space-infix-ops, semi-spacing */
function $input(o,p,a,f) {if(typeof o==='string'){o=[o];}const [t,v,l,n,s]=o;let ao;if(!a){a={};ao=a;}else if(Array.isArray(a)){ao={};a.push(ao);}else if(typeof a==='object'){ao=a;}if(t==='select'){const i=$element('select',p,a,f);if(v){v.forEach((v)=>{v=split2(v,':');if(!v[1]){v[1]=v[0];}$element('option',i,{value:v[0],text:v[1]});});}return i;}ao.type=t;if(v||typeof v==='number'){ao.value=v;}if(l){const b=$element('label',p);const i=$element('input',b,a,f);if(n==='before'){b.prepend(l,' ');}else{b.append(' ',l);}if(s){$element('span',b);b.classList.add('hvut-label');}return i;}else{const i=$element('input',p,a,f);return i;}}
function toggle_button(b,s,h,e,n,d,f) {const c=(l)=>{l.forEach((m)=>{if(m.type==='attributes'&&m.attributeName==='class'){t();}});};const t=()=>{b.value=e.classList.contains(n)?s:h;};(new MutationObserver(c)).observe(e,{attributes:true,attributeFilter:['class']});if(d==='on'){e.classList.add(n);}else if(d==='off'){e.classList.remove(n);}t();if(!f){f=()=>{e.classList.toggle(n);};}b.addEventListener('click',f);}
/* eslint-enable */

// ===== bindEquip 装备解析/列表/过滤/排序/namecode 内核(两 IIFE 收口一处, 基准 = ISEKAI 4.2.0; 铁律1e 应抽尽抽)。
// 能量模型后两服装备数据同构(reg.html 含 Energy 字段即新格式)——主世界旧 $equip(10级品质表/forge/unforge/stats
// 旧公式体系)随旧页面死亡, 由本内核全量替换(2026-06-10; 旧 list 内 [HVAA 嵌入修复] 降级补丁为其半死活样本)。
// ctx: config(IIFE-private $config: settings.equipSort/equipShowLevel/equipShowPAB/equipNameCode + GM 存取)。=====
const bindEquip = function (equip, ctx) {
  const $config = ctx.config;
  const $equip = equip;
  Object.assign($equip, {
  dynjs_equip: _window.dynjs_equip || {},
  dynjs_eqstore: _window.dynjs_eqstore || {},

  icon: {
    damaged: '\u{26A0}\u{FE0F}',
    unusable: '\u{274C}',
    equipped: '\u{1F5E1}\u{FE0F}',
    stored: '\u{1F4E6}',
    pinned: '\u{1F4CC}',
    protected: '\u{1F6E1}\u{FE0F}',
    locked: '\u{1F512}',
    highlevel: '\u{1F53A}',
  },

  index: {
    category: { 'One-handed Weapon': 1, 'Two-handed Weapon': 2, 'Staff': 3, 'Shield': 4, 'Cloth Armor': 5, 'Light Armor': 6, 'Heavy Armor': 7, 'Unknown': 99 },
    type: {
      'Rapier': 1, 'Club': 2, 'Axe': 3, 'Shortsword': 4, 'Wakizashi': 5, 'Dagger': 6,
      'Estoc': 1, 'Great Mace': 2, 'Scythe': 3, 'Longsword': 4, 'Katana': 5, 'Swordchucks': 6,
      'Oak Staff': 1, 'Willow Staff': 2, 'Katalox Staff': 3, 'Redwood Staff': 4, 'Ebony Staff': 5,
      'Force Shield': 1, 'Tower Shield': 2, 'Kite Shield': 3, 'Buckler': 4,
      'Phase': 1, 'Gossamer': 2, 'Ironsilk': 3, 'Cotton': 4,
      'Shade': 1, 'Drakehide': 2, 'Kevlar': 3, 'Leather': 4,
      'Power': 1, 'Reactive': 2, 'Chain': 3, 'Plate': 4,
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
      const onehanded = 'Axe|Club|Dagger|Rapier|Shortsword|Wakizashi';
      const twohanded = 'Estoc|Great Mace|Katana|Longsword|Scythe|Swordchucks';
      const staff = 'Ebony Staff|Katalox Staff|Oak Staff|Redwood Staff|Willow Staff';
      const shield = 'Buckler|Force Shield|Kite Shield|Tower Shield';
      const acloth = 'Cotton|Gossamer|Ironsilk|Phase';
      const alight = 'Drakehide|Kevlar|Leather|Shade';
      const aheavy = 'Chain|Plate|Power|Reactive';
      const pattern = `^(${quality})(?: (?:(${prefix})|(.+?)))? (?:(${onehanded})|(${twohanded})|(${staff})|(${shield})|(?:(?:(${acloth})|(${alight})|(${aheavy})) (${slot})))(?: of (.+))?$`;
      return new RegExp(pattern, 'i');
    })(),
    html: />([\w -]+(?<! ))(?: |&nbsp;)*(?:Level (?:(\d+)|(Unassigned))|Tier (\d+) \/ (\d+) \/ (\d+)).*(Tradeable|Untradeable|Soulbound).*(?:Condition: (\d+(?:\.\d+)?)%.*Energy: (?:(\d+(?:\.\d+)?)%|(N\/A))|(Salvaged) - Repair Required)/,
    magic: /Fire|Cold|Elec|Wind|Holy|Dark/i,
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
        return {};
      }
      const info = {
        category: exec[1],
        level: parseInt(exec[2]) || 0,
        unassigned: exec[3] === 'Unassigned',
        upgrade: parseInt(exec[4]),
        iw: parseInt(exec[5]),
        upgrade_cap: parseInt(exec[6]),
        tradeable: exec[7] === 'Tradeable',
        soulbound: exec[7] === 'Soulbound',
        condition: parseFloat(exec[8]),
        energy: exec[9] ? parseFloat(exec[9]) : null,
        salvaged: exec[10] === 'Salvaged',
        pab: html.match($equip.reg.pab)?.map((p) => p[0]).join('') || '',
      };
      return info;
    },
    dynjs: function (eid, elem) {
      const dynjs = $equip.dynjs_equip[eid] || $equip.dynjs_eqstore[eid] || {};
      const info = $equip.parse.html(dynjs.d);
      let error;
      if (!dynjs.d) {
        error = 'no dynjs data';
      } else if (!info.category) {
        error = 'parse error';
      }
      let name = '';
      let customname = '';
      if (dynjs.n) {
        name = dynjs.n;
        customname = dynjs.t;
      } else if (dynjs.t) {
        name = dynjs.t;
      } else if (elem) {
        name = $qs(':scope > td:first-child, :scope > div:last-child ', elem)?.textContent.replace(/^\W+/, '');
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
          error,
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
      const eq = $equip.parse.dynjs(eid, elem);
      if (eq.data.error) {
        //return eq;
      }
      const text = elem.textContent;
      eq.info.damaged = text.includes($equip.icon.damaged);
      eq.info.unusable = text.includes($equip.icon.unusable);
      eq.info.equipped = text.includes($equip.icon.equipped);
      eq.info.stored = text.includes($equip.icon.stored);
      eq.info.pinned = text.includes($equip.icon.pinned);
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
        tr.classList.add(`hvut-equip-${eq.info.quality}`);
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
        div.classList.add(`hvut-equip-${eq.info.quality}`);
        return eq;
      });
      if ($config.settings.equipSort && sort) {
        $equip.list.sort(equiplist, parent);
      }
      return equiplist;
    },
    sort: function (equiplist, parent) {
      function create_label(type, text, scroll = text) {
        const textContent = text;
        const className = `hvut-eqp-${type}`;
        if (is_table) {
          const tr = $element('tr', frag, { className, dataset: { scroll } });
          $element('td', tr, { textContent, colSpan: 10 });
        } else {
          $element('p', frag, { textContent, className, dataset: { scroll } });
        }
      }
      const is_table = parent.nodeName === 'TABLE';

      $equip.sort(equiplist);
      const frag = $element();
      equiplist.forEach((eq, i, a) => {
        const p = a[i - 1] || { info: {} };
        if (eq.info.category !== p.info.category) {
          create_label('category', eq.info.category);
        }
        switch (eq.info.category) {
          case 'One-handed Weapon':
          case 'Two-handed Weapon':
          case 'Shield':
            if (eq.info.type !== p.info.type) {
              create_label('type', eq.info.type || 'Unknown');
            } else if (eq.info.suffix !== p.info.suffix) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Staff':
            if (eq.info.type !== p.info.type) {
              create_label('type', eq.info.type || 'Unknown');
            } else if (eq.info.prefix !== p.info.prefix) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Cloth Armor':
            if (eq.info.suffix !== p.info.suffix) {
              create_label('type', (eq.info.type ? (eq.info.suffix || 'suffixless') : 'Unknown'));
            } else if (eq.info.slot !== p.info.slot) {
              eq.node.wrapper.classList.add('hvut-eqp-border');
            }
            break;
          case 'Light Armor':
          case 'Heavy Armor':
            if (eq.info.type !== p.info.type || eq.info.slot !== p.info.slot) {
              create_label('type', (eq.info.type ? `${eq.info.type} ${eq.info.slot}` : 'Unknown'), eq.info.type);
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
    recordFailure: function (stage, detail) {
      const evidence = { capability: 'equipmentFilter', stage, ...(detail || {}) };
      try {
        sessionStorage.setItem('HVAA:lastEquipmentFilterFailure', JSON.stringify(evidence));
      } catch (_error) {
        // Equipment filtering must fail closed even when diagnostic storage is blocked.
      }
      try {
        console.warn('[HVUT] equipment filter failed', evidence);
      } catch (_error) {
        // Console hooks must not block equipment filtering fallback.
      }
      return evidence;
    },
    equip: function (filters, equip) {
      try {
        const result = $equip.filter.match(filters, equip);
        if (result.errors.length) {
          $equip.filter.recordFailure('match', { equip: result.name, errors: result.errors });
        }
        return result.matched;
      } catch (error) {
        $equip.filter.recordFailure('runtime', { equip, error: error?.message || String(error) });
        return false;
      }
    },
    match: function (filters, equip) {
      filters = $equip.filter.normalize(filters);
      let name;
      if (typeof equip === 'string') {
        name = equip;
        equip = null;
      } else {
        name = equip?.info?.name ?? '';
      }
      const errors = [];
      const matched = filters.some((filter) => {
        try {
          return $equip.filter.test(filter, equip, name);
        } catch (error) {
          errors.push({ filter, error: error?.message || String(error) });
          return false;
        }
      });
      return { matched, errors, name };
    },
    normalize: function (filters) {
      const rawFilters = Array.isArray(filters) ? filters : [filters];
      return rawFilters
        .flatMap((filter) => String(filter ?? '').split(/\r?\n/))
        .map((filter) => filter.trim())
        .filter(Boolean);
    },
    evaluateExpression: function (expression) {
      const bridge = typeof window !== 'undefined' ? window.HVAA_equipFilterExpression : undefined;
      if (!bridge || typeof bridge.evaluate !== 'function') {
        $equip.filter.recordFailure('expressionBridgeMissing', { expression });
        throw new Error('Invalid Filter');
      }
      try {
        return bridge.evaluate(expression);
      } catch (error) {
        $equip.filter.recordFailure('expressionBridgeFailed', { expression, error: error?.message || String(error) });
        throw error;
      }
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
      return $equip.filter.evaluateExpression(r);
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
      filters = $equip.filter.normalize(filters);
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
        if (!$equip.filter.equip(r.match, eq)) {
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
    color('姓名');
    bold('姓名');
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
  });
};

// ===== bindArmory 装备工坊七屏内核(Organize/Modify/Repair/Soulbind/Purchase/Sell/Salvage; 两 IIFE 收口一处,
// 基准 = ISEKAI 4.2.0; 铁律1e 应抽尽抽)。能量模型后两服同构 Bazaar am 体系(bindTop 注释实证), 主世界旧
// Equipment Shop ss=es 段已死删——本内核为其业务继任形态, 含批量出售/分解对比/保护过滤/整合列表。
// 依赖: $ajax/$input(isekai 5参版)/toggle_button(7参版) 走公共区(L1/L2 词法可见);
// $equip/$price 是各 IIFE-private 闭包符号 → 经 ctx 依赖倒置注入(公共区函数不可直引用闭包内符号,
// 否则 ReferenceError——2026-06-10 实站 am sell 报 "$price is not defined" 即此漏)。ctx: config/equip/price。=====
const bindArmory = function (armory, ctx) {
  const $config = ctx.config;
  const $equip = ctx.equip;
  const $price = ctx.price;
  const $armory = armory;
  Object.assign($armory, {
    filters: ['weapon_1handed', 'weapon_2handed', 'weapon_staff', 'shield', 'armor_cloth', 'armor_light', 'armor_heavy'],
    category_shorthand: { 'One-handed Weapon': 'One-Handed', 'Two-handed Weapon': 'Two-Handed', 'Staff': 'Staffs', 'Shield': 'Shield', 'Cloth Armor': 'Cloth', 'Light Armor': 'Light', 'Heavy Armor': 'Heavy' },
    type_labels: {
      'armor_cloth': ['Surtr', 'Niflheim', 'Mjolnir', 'Freyr', 'Heimdall', 'Fenrir', 'the Elementalist', 'the Heaven-sent', 'the Demon-fiend'],
    },
    quality_grade: { 'Crude': 1, 'Fair': 2, 'Average': 3, 'Superior': 4, 'Exquisite': 5, 'Magnificent': 6, 'Legendary': 7, 'Peerless': 8 },
    material_type: { 'One-handed Weapon': 'Metal', 'Two-handed Weapon': 'Metal', 'Staff': 'Wood', 'Shield': 'Wood', 'Force Shield': 'Metal', 'Cloth Armor': 'Cloth', 'Light Armor': 'Leather', 'Heavy Armor': 'Metal' },
    core_type: { 'One-handed Weapon': 'Weapon', 'Two-handed Weapon': 'Weapon', 'Staff': 'Staff', 'Shield': 'Armor', 'Cloth Armor': 'Armor', 'Light Armor': 'Armor', 'Heavy Armor': 'Armor' },
    rares: ['Force Shield', 'Phase', 'Shade', 'Power', 'Reactive'],
    equiplist: [],
    equipdata: $config.get('equipdata', { version: 1 }),
    eqitems: {},
    itemdata: {},
    prices: $price.get('Materials'),
    node: { submit: {} },

    init: function () {
      $armory.node.table = $qs('#equiplist > table');
      $armory.node.table.addEventListener('click', $armory.click, true);
      $armory.page.init(null, _query.screen);
      $armory.side.init();
      $armory.equiplist = $equip.list.table($armory.node.table);
      $armory.submit.button();
      $armory.scroll.init();
      $armory.hover.init();
      //search
    },
    get_token: async function () {
      const html = await $ajax.fetch(create_hvut_armory_organize_url());
      const doc = $doc(html);
      $armory.postoken = $id('equipform', doc).elements.postoken?.value;
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
    hover: {
      init: function () {
        $armory.node.table.addEventListener('mouseover', $armory.hover.mouseover);
        $armory.node.table.addEventListener('mouseout', $armory.hover.mouseout);
      },
      mouseover: function (e) {
        const table = $armory.node.table;
        const target = e.target;
        let to = target.closest('tr[data-eid]'); // #equiplist > table tr[data-eid]
        if (!table.contains(to)) {
          to = null;
        }
        const relatedTarget = e.relatedTarget;
        let from = relatedTarget?.closest('tr[data-eid]');
        if (!table.contains(from)) {
          from = null;
        }
        if (from === to || to === null) {
          return;
        }
        const options = {
          detail: { target, relatedTarget, from, to },
        };
        const event = new CustomEvent('hoverover', options);
        $armory.node.table.dispatchEvent(event);
      },
      mouseout: function (e) {
        const table = $armory.node.table;
        const target = e.target;
        let from = target.closest('tr[data-eid]'); // #equiplist > table tr[data-eid]
        if (!table.contains(from)) {
          from = null;
        }
        const relatedTarget = e.relatedTarget;
        let to = relatedTarget?.closest('tr[data-eid]');
        if (!table.contains(to)) {
          to = null;
        }
        if (from === to || from === null) {
          return;
        }
        const options = {
          detail: { target, relatedTarget, from, to },
        };
        const event = new CustomEvent('hoverout', options);
        $armory.node.table.dispatchEvent(event);
      },
    },
    scroll: {
      init: function () {
        let labels = $armory.type_labels[_query.filter];
        if (labels) {
          labels = labels.filter((type) => !!$qs(`.hvut-eqp-type[data-scroll="${type}"]`, $armory.node.table));
        } else if ($armory.filters.includes(_query.filter)) {
          labels = $qsa('.hvut-eqp-type', $armory.node.table).map((e) => e.dataset.scroll);
          labels = [...new Set(labels)];
        } else if (_query.filter === 'all') {
          labels = Object.keys($armory.category_shorthand);
        } else {
          return;
        }
        const div = $element('div', [$id('equiplist'), 'beforebegin'], ['.hvut-eqp-scroll'], $armory.scroll.click);
        labels.forEach((value) => {
          const text = $armory.category_shorthand[value] || value;
          $input(['button', text], div, { dataset: { action: 'scroll', scroll: value } });
        });
      },
      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, scroll } = target.dataset;
        if (action === 'scroll') {
          $armory.scroll.move(scroll);
        }
      },
      move: function (value) {
        const parent = $id('equiplist');
        const to = $qs(`[data-scroll="${value}"]`, $armory.node.table);
        scrollIntoView(to, parent);
      },
    },

    page: {
      init: function (doc, screen, assign) {
        $armory.postoken = $id('equipform', doc).elements.postoken?.value;
        $armory.node.submit[screen] = $id('equipsubmit', doc);
        $armory.script.parse(doc, screen, assign);
      },
      load: async function (screen, filter, assign) {
        const html = await $ajax.fetch(create_hvut_armory_screen_url(screen, { filter: filter || '' }));
        const doc = $doc(html);
        $armory.page.init(doc, screen, assign);
        const table = $qs('#equiplist > table', doc);
        return table;
      },
    },

    side: {
      data: {
        'select_all': { text: '全选', click: () => { $armory.select.all(); } },
        'select_tradeables': { text: '可交易', click: () => { $armory.select.call('tradeables'); } },
        'select_invert': { text: '反选', click: () => { $armory.select.call('invert'); } },
        'code_popup': { text: '生成装备代码', click: () => { $armory.equipcode.list(); } },
        'code_edit': { text: '编辑格式', click: () => { $config.open('equipCode'); } },
        'code_save': { text: '保存', click: () => { $armory.equipcode.save(); } },
        'code_revert': { text: '恢复', click: () => { $armory.equipcode.load(); } },

        'select_purchase': {},
        'submit_purchase': { text: '购买', click: () => { $armory.submit.confirm('purchase'); } },
        'select_purchase_salvage': { text: '全选', click: () => { $armory.select.call('purchase_salvage'); } },
        'submit_purchase_salvage': { text: '购买并分解', click: () => { $armory.submit.confirm('purchase_salvage'); } },
        'select_sell': { text: '全选', click: () => { $armory.select.call('sell'); } },
        'submit_sell': { text: '出售选定装备', click: () => { $armory.submit.confirm('sell'); } },
        'select_salvage': { text: '全选', click: () => { $armory.select.call('salvage'); } },
        'submit_salvage': { text: '分解', click: () => { $armory.submit.confirm('salvage'); } },

        'filter_toggle': {},
        'filter_bazaar': { text: '编辑集市过滤器', click: () => { $config.open('equipmentShopBazaarFilters'); } },
        'filter_protect': { text: '编辑保护过滤器', click: () => { $config.open('equipmentShopProtectFilters'); } },
        'price_edit': { text: '物品价格', click: () => { $price.edit('Materials', 'ma', $armory.calc.edit); } },

      },
      init: function () {
        $armory.node.side = $element('div', $id('armory_left').lastElementChild, ['.hvut-side hvut-am-side']);
      },
      list: function (...items) {
        items.forEach((item) => {
          if (typeof item === 'string') {
            $armory.side.add(item);
          } else if (Array.isArray(item)) {
            if (item.length === 1) {
              $armory.side.add(item[0], ['.hvut-side-margin']);
            } else {
              $armory.side.add(item[0], ['.hvut-side-top']);
              item.slice(1, -1).forEach((item) => $armory.side.add(item, ['.hvut-side-mid']));
              $armory.side.add(item.at(-1), ['.hvut-side-bottom']);
            }
          }
        });
      },
      add: function (item, attr) {
        const data = $armory.side.data[item];
        const button = $input(['button', data.text], $armory.node.side, attr, data.click);
        if (item === 'filter_toggle') {
          toggle_button(button, '过滤: 开', '过滤: 关', $armory.node.table, 'hvut-eqp-filter-on', '', () => { $armory.filter.toggle(); });
        }
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
            dynjs_eqstore: parse_script_json(html, 'dynjs_eqstore'),
            eqitems: parse_script_json(html, 'eqitems'),
            itemdata: parse_script_json(html, 'itemdata'),
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
        const q = $armory.quality_grade[eq.info.quality];
        const t = $armory.material_type[eq.info.type] || $armory.material_type[eq.info.category];
        const c = $armory.core_type[eq.info.category];
        const r = $armory.rares.includes(eq.info.type);
        const p = eq.data.sell_price || eq.data.purchase_price / 5;

        if (!q) { // obsolete or unknown
        } else if (q < 4) {
          const scrap = 'Scrap ' + t;
          materials[scrap] = Math.min(10, Math.ceil(p / 100));
        } else {
          const item = ((q === 4) ? 'Low-Grade ' : (q === 5) ? 'Mid-Grade ' : 'High-Grade ') + (t === 'Metal' ? 'Metals' : t);
          materials[item] = !IS_ISEKAI ? 1 : (q === 4) ? 3 : (q === 5) ? 2 : 1;
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
      init: async function (screen) {
        $armory.node.table.tBodies[0].remove();
        $armory.equiplist = [];
        // Promise.all 收集并发 load（行为同原 forEach 并发，仅多一个"全部注入完成"汇合点）。
        const results = await Promise.all($armory.filters.map((filter) => $armory.integrate.load(screen, filter)));
        // filter=all 聚合: 各分类装备由 fetch 异步 replaceWith 注入 #equiplist, 晚于界面汉化 start(),
        // #equiplist 是静态字典(observer 不监听 childList) → 装备名/分类标签漏翻成英文。注入全部完成后
        // 经 i18n bridge 回调界面汉化重翻 #equiplist, 修"切到所有翻译失效"(异世界独有路径)。
        run_hvut_i18n_bridge('retranslateEquiplist', [], 'retranslateEquiplistBridgeMissing', { surface: 'armoryIntegrate' }, false);
        if (!results.every((r) => r)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        return true;
      },
      load: async function (screen, filter) {
        const holder = $element('tbody', $armory.node.table, [`/<tr class="hvut-eqp-category"><td colspan="10">Loading... [${filter}]</td></tr>`]);
        let table;
        try {
          table = await $armory.page.load(screen, filter, true);
        } catch (_error) {
          holder.remove();
          return false;
        }
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
        return true;
      },
      tab: function () {
        const a = $element('a', [$id('filterbar'), 1], { href: create_hvut_armory_screen_url(_query.screen, { filter: 'all' }) });
        const div = $element('div', a, '所有');
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
          eq.node.note = $input('text', td, { placeholder: '@价格, $备注' });
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
          if (eq.info.upgrade_cap && eq.node.level) {
            eq.node.upgrade.textContent = '';
            eq.node.level.textContent = `${eq.info.upgrade} / ${eq.info.iw}`;
            eq.node.level.classList.add('hvut-eqp-upgrade');
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
          $armory.organize.submit(equips, 'protected');
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
        selectable_count = $armory.equiplist.filter((eq) => eq.node.check.name === 'eqids[]' && !eq.node.wrapper.dataset.eqprotect).length;
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
      purchase: async function (equips) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return false;
        }
        let html;
        try {
          html = await $ajax.fetch(create_hvut_armory_screen_url('purchase'), data);
        } catch (error) {
          record_hvut_armory_submit_failure('purchaseRequest', { count: equips.length, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        const doc = $doc(html);
        const response = classify_hvut_armory_submit_response(doc, 'purchaseRejected', { count: equips.length });
        if (response.kind !== 'accepted') {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        $armory.submit.message(response);
        $armory.submit.remove(equips);
        return true;
      },
      sell: async function (equips) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return false;
        }
        let html;
        try {
          html = await $ajax.fetch(create_hvut_armory_screen_url('sell'), data);
        } catch (error) {
          record_hvut_armory_submit_failure('sellRequest', { count: equips.length, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        const doc = $doc(html);
        const response = classify_hvut_armory_submit_response(doc, 'sellRejected', { count: equips.length });
        if (response.kind !== 'accepted') {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        $armory.submit.message(response);
        $armory.submit.remove(equips);
        return true;
      },
      salvage: async function (equips) {
        const data = $armory.submit.data(equips);
        if (!data) {
          return false;
        }
        let html;
        try {
          html = await $ajax.fetch(create_hvut_armory_screen_url('salvage'), data + '&sell_salvage=on');
        } catch (error) {
          record_hvut_armory_submit_failure('salvageRequest', { count: equips.length, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        const doc = $doc(html);
        const response = classify_hvut_armory_submit_response(doc, 'salvageRejected', { count: equips.length });
        if (response.kind !== 'accepted') {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        $armory.submit.message(response);
        $armory.submit.remove(equips);
        return true;
      },
      purchase_salvage: async function (equips) {
        if (!await $armory.submit.purchase(equips)) {
          return false;
        }
        return $armory.submit.salvage(equips);
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
        if (!$armory.postoken) {
          return;
        }
        const eqids = equips.map((eq) => `eqids[]=${eq.info.eid}`).join('&');
        const data = `postoken=${$armory.postoken}&${eqids}`;
        return data;
      },
      message: function (response) {
        const outer = response.message;
        if (!outer) {
          return;
        }
        outer.addEventListener('click', () => { outer.remove(); });
        $id('mainpane').prepend(outer);
      },
      remove: function (equips) {
        equips.forEach((eq) => {
          eq.node.check.name = '';
          eq.node.wrapper.remove();
        });
        $armory.filter.update();
        $armory.organize.hide();
      },
    },

    organize: {
      init: function () {
        if (!$armory.postoken) {
          $armory.get_token();
        }
        $armory.organize.side();
        $armory.organize.float();
      },
      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, value } = target.dataset;
        const { eid } = target.closest('[data-eid]').dataset;
        $armory.organize.submit(eid, action, value);
      },
      side: function () {
        const div = $element('div', $armory.node.side, ['.hvut-am-organize', { dataset: { eid: 'selected' } }], $armory.organize.click);
        $input(['button', $equip.icon.stored], div, { dataset: { action: 'stored', value: '1' } });
        $input(['button', $equip.icon.protected], div, { dataset: { action: 'protected', value: '1' } });
        $input(['button', $equip.icon.locked], div, { dataset: { action: 'locked', value: '1' } });
        $input(['button', $equip.icon.stored], div, { dataset: { action: 'stored', value: '' } });
        $input(['button', $equip.icon.protected + $equip.icon.locked], div, ['.hvut-am-unlock', { dataset: { action: 'locked', value: '' } }]);
      },
      float: function () {
        const table = $armory.node.table;
        table.addEventListener('hoverover', $armory.organize.hoverover);
        table.addEventListener('hoverout', $armory.organize.hoverout);
        const div = $element('div', $id('equiplist'), ['.hvut-am-organize hvut-none', { dataset: { eid: '' } }], $armory.organize.click);
        const stored = $input(['button', $equip.icon.stored], div, { dataset: { action: 'stored', value: '' } });
        const protected = $input(['button', $equip.icon.protected], div, { dataset: { action: 'protected', value: '' } });
        const locked = $input(['button', $equip.icon.locked], div, { dataset: { action: 'locked', value: '' } });
        $armory.node.organize = { div, stored, protected, locked };
      },
      hoverover: function (e) {
        const tr = e.detail.to;
        const div = $armory.node.organize.div;
        if (div.contains(e.detail.relatedTarget) && div.dataset.eid === tr.dataset.eid) {
          return;
        }
        $armory.organize.show(tr);
      },
      hoverout: function (e) {
        if (e.detail.to) {
          return;
        }
        const tr = e.detail.from;
        const div = $armory.node.organize.div;
        if (div.contains(e.detail.relatedTarget) && div.dataset.eid === tr.dataset.eid) {
          return;
        }
        $armory.organize.hide();
      },
      show: function (tr) {
        const div = $armory.node.organize.div;
        const parent = $id('equiplist');
        const table = $armory.node.table;
        const td = tr.cells[0];
        const eid = tr.dataset.eid;
        div.style.top = (table.offsetTop + table.clientTop + td.offsetTop + td.clientTop + 1) + 'px';
        div.style.right = (parent.clientWidth - (table.offsetLeft + table.clientLeft + td.offsetLeft + td.clientLeft + td.offsetWidth) + 2) + 'px';
        div.dataset.eid = eid;
        div.classList.remove('hvut-none');

        const eq = $armory.equiplist.find((eq) => eq.info.eid == eid);
        $armory.organize.update(eq);
      },
      hide: function () {
        const div = $armory.node.organize.div;
        div.dataset.eid = '';
        div.classList.add('hvut-none');
      },
      submit: async function (eid, name, value = true) {
        value = !!value;
        let equips;
        if (eid === 'selected') {
          equips = $armory.submit.selected();
        } else if (Array.isArray(eid)) {
          equips = eid;
        } else if (eid) {
          equips = [$armory.equiplist.find((eq) => eq.info.eid == eid)];
        } else {
          return;
        }
        const data = $armory.submit.data(equips);
        if (!data) {
          return;
        }
        let param_name = name;
        if (name === 'protected') {
          param_name = 'locked';
        }
        let param_value = value ? 1 : -1;
        if (name === 'locked' && value) {
          param_value = 2;
        }
        let html;
        try {
          html = await $ajax.fetch(create_hvut_armory_organize_url(), data + `&set_${param_name}=${param_value}`);
        } catch (error) {
          record_hvut_armory_submit_failure('organizeRequest', { count: equips.length, name: name, value: value, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        const doc = $doc(html);
        const response = classify_hvut_armory_submit_response(doc, 'organizeRejected', { count: equips.length, name: name, value: value });
        if (response.kind !== 'accepted') {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        $armory.submit.message(response);
        equips.forEach((eq) => {
          $armory.organize.status(eq, name, value);
        });
        return true;
      },
      status: function (eq, name, value) {
        const status = ['damaged', 'unusable', 'equipped', 'stored', 'pinned', 'protected', 'locked', 'highlevel'];
        eq.info[name] = value;
        if (name === 'stored') {
          eq.info.stored = !eq.info.equipped && value;
        }
        if (name === 'protected') {
          eq.info.locked = false;
        }
        if (name === 'locked') {
          eq.info.protected = false;
        }
        const text = status.filter((s) => eq.info[s]).map((s) => $equip.icon[s]).join('');
        if (!eq.node.status) {
          const label = eq.node.check.parentNode;
          label.lastChild.remove();
          eq.node.status = $element('a', label);
          hvaaBind($element('span', label, { 'data-i18n-skip': '' }), function (n) { set_equip_name(n, eq); }); // hvaaBind: lang 切换即时重渲染装备译名
        }
        eq.node.status.textContent = ` ${text} `;
        $armory.organize.update(eq);
      },
      update: function (eq) {
        if ($armory.node.organize) {
          const { stored, protected, locked } = $armory.node.organize;
          if (eq.info.equipped) {
            stored.disabled = true;
            stored.value = $equip.icon.equipped;
            stored.dataset.value = '';
          } else {
            stored.disabled = false;
            stored.value = $equip.icon.stored;
            stored.dataset.value = eq.info.stored ? '' : '1';
          }
          protected.dataset.value = eq.info.protected ? '' : '1';
          locked.dataset.value = eq.info.locked ? '' : '1';
        }
      },
    },

    equipcode: {
      save: function () {
        let nextEquipdata = JSON.parse(JSON.stringify($armory.equipdata || { version: 1 }));
        if (_query.filter === 'all') {
          nextEquipdata = { version: $armory.equipdata.version };
        }
        $armory.equiplist.forEach((eq) => {
          const data = $armory.equipcode.parse(eq.node.note.value);
          nextEquipdata[eq.info.eid] = { checked: eq.node.check.checked, ...data };
        });
        if (!$config.set('equipdata', nextEquipdata)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        $armory.equipdata = nextEquipdata;
        return true;
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
      equip: function (eq, eid_max) {
        eq.data._eid = eq.info.eid.toString();
        const eid_len = eq.data._eid.length;
        if (eid_max > eid_len) {
          const _ = '_'.repeat(eid_max - eid_len);
          eq.data._eid = `[color=transparent]${_}[/color]${eq.data._eid}`;
        }
        if (!eq.data.url) {
          eq.data.url = create_hvut_equip_page_url(eq, { absolute: true });
        }
        //if (!eq.data.namecode) {
        $equip.namecode(eq);
        //}
        const data = $armory.equipcode.parse(eq.node.note.value);
        Object.assign(eq.data, data);

        const template = $config.settings.equipCode.EQUIP;
        const code = template.replace(/\{\$(\w+)(\s*\?(.*?)(?::(.*?))?)?\}/g, (s, k, e, t, f) => {
          const v = (k in eq.data) ? eq.data[k] : (k in eq.info) ? eq.info[k] : '';
          if (!e) {
            return v ?? '';
          } else {
            const r = v ? t : f || '';
            return r.replace(/\$(\w+)/g, (s, k) => { const v = (k in eq.data) ? eq.data[k] : (k in eq.info) ? eq.info[k] : ''; return v ?? ''; });
          }
        }).trim();
        return code;
      },
      category: function (category) {
        const template = '\n\n\n' + $config.settings.equipCode.CATEGORY + '\n';
        const code = template.replace('{$category}', category);
        return code;
      },
      type: function (type) {
        const template = '\n\n' + $config.settings.equipCode.TYPE + '\n\n';
        const code = template.replace('{$type}', type);
        return code;
      },
      list: function () {
        const equiplist = $armory.equiplist.filter((e) => e.node.check.checked);
        const eid_max = Math.max(...equiplist.map((e) => e.info.eid.toString().length));
        let code_list = '';
        let code_featured = '';

        $equip.sort(equiplist);
        equiplist.forEach((eq, i, a) => {
          const p = a[i - 1] || { info: {} };
          if (eq.info.category !== p.info.category) {
            const category = eq.info.category;
            code_list += $armory.equipcode.category(category);
          }

          switch (eq.info.category) {
            case 'One-handed Weapon':
            case 'Two-handed Weapon':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code_list += $armory.equipcode.type(type);
              } else if (eq.info.suffix !== p.info.suffix) {
                code_list += '\n';
              }
              break;
            case 'Staff':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code_list += $armory.equipcode.type(type);
              } else if (eq.info.prefix !== p.info.prefix) {
                code_list += '\n';
              }
              break;
            case 'Shield':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code_list += $armory.equipcode.type(type);
              }
              break;
            case 'Cloth Armor':
              if (eq.info.suffix !== p.info.suffix) {
                const type = eq.info.type ? (eq.info.suffix || 'suffixless') : 'Unknown';
                code_list += $armory.equipcode.type(type);
              } else if (eq.info.slot !== p.info.slot) {
                //code_list += '\n';
              }
              break;
            case 'Light Armor':
            case 'Heavy Armor':
              if (eq.info.type !== p.info.type) {
                const type = eq.info.type || 'Unknown';
                code_list += $armory.equipcode.type(type);
              } else if (eq.info.slot !== p.info.slot) {
                code_list += '\n';
              }
              break;
          }

          const equipcode = $armory.equipcode.equip(eq, eid_max);
          code_list += equipcode + '\n';
          if (eq.data['featured']) {
            code_featured += equipcode + '\n';
          }
        });

        if (code_featured) {
          code_list = $armory.equipcode.category('Featured') + '\n' + code_featured + code_list;
        }
        popup_text(code_list.trim() || '没有选中装备.', 900, 500);
      },
    },
  });


  GM_addStyle(/*css*/`
    .armory_tab { padding: 12px 5px; }
    .hvut-am-side { width: 85px; margin-top: 20px; margin-left: -5px; padding-top: 10px; border-top: 1px solid var(--color-border-default); }
    #equiplist > .hvut-am-organize { position: absolute; }
    .hvut-am-side .hvut-am-organize { margin-bottom: 10px; }
    .hvut-am-organize input { width: 26px; margin: 1px; border: 1px solid var(--color-border-light); border-radius: 3px; background-color: var(--color-bg-h1); color: var(--color-font-default); font-size: 10pt; line-height: 20px; }
    #equiplist > .hvut-am-organize input[data-value='1'] { filter: grayscale(100%); }
    .hvut-am-side > .hvut-am-organize input[data-value=''] { filter: grayscale(100%); }
    .hvut-am-organize .hvut-am-unlock { width: 54px; }
  `);

  $armory.init();

  if (_query.screen !== 'purchase' && _query.filter !== 'salvaged') {
    $armory.organize.init();
  }

  if (_query.screen === 'organize') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('organize');
    } else {
      $armory.modify.organize();
    }
    $armory.side.list(['select_all'], 'code_popup', 'code_edit', 'code_save', 'code_revert');
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
    $armory.side.list(['select_all'], ['submit_purchase'], ['select_purchase_salvage', 'submit_purchase_salvage'], 'filter_toggle', 'filter_bazaar', 'price_edit');
  }

  if (_query.screen === 'sell') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('sell');
    } else {
      $armory.modify.sell();
    }
    $armory.side.list(['select_all'], ['select_sell', 'submit_sell'], ['select_salvage', 'submit_salvage'], 'filter_protect', 'price_edit');
  }

  if (_query.screen === 'salvage') {
    $armory.integrate.tab();
    if (_query.filter === 'all' && $config.settings.equipmentIntegration) {
      $armory.integrate.init('salvage');
    } else {
      $armory.modify.salvage();
    }
    $armory.side.list(['select_all'], ['select_sell', 'submit_sell'], ['select_salvage', 'submit_salvage'], 'filter_protect', 'price_edit');
  }

  const onkeydown = document.onkeydown;
  if (onkeydown) {
    document.onkeydown = (e) => { if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') { return; } onkeydown(e); };
  }
  //document.addEventListener('keydown', (e) => { if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') { e.stopPropagation(); } }, true);
};

if (IS_ISEKAI) {
  // [ISEKAI 分支] 原 "HV Utils Isekai 汉化" → 迁移至英文 4.2.0
  (function () {

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
  // 逻辑键必须英文(索引 _top.menu, 显示走 m.label/m.text 中文); 勿翻译键, 见 verify-topmenu-keys probe
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
    '(Wakizashi || Dagger) && (Battlecaster || Focus)',
    'Ethereal && (Axe || Club || Shortsword || Estoc || Katana || Longsword || Mace) && Slaughter',
    'Force Shield || (Tower Shield || Kite Shield || Buckler) && (Barrier || Battlecaster)',
    'Fiery && (Oak || Redwood || Willow) && (Destruction || Elementalist || Surtr)',
    'Arctic && (Oak || Redwood || Willow) && (Destruction || Elementalist || Niflheim)',
    'Shocking && (Willow || Redwood) && (Destruction || Elementalist || Mjolnir)',
    'Tempestuous && (Willow || Redwood) && (Destruction || Elementalist || Freyr)',
    'Hallowed && (Oak || Katalox) && (Destruction || Heaven-sent || Heimdall)',
    'Demonic && (Willow || Katalox) && (Destruction || Demon-fiend || Fenrir)',
    '(Radiant || Charged) && (Surtr || Nilfheim || Mjolnir || Freyr || Heimdall || Fenrir)',
    '(Radiant || Charged) && (Elementalist || Heaven-sent || Demon-fiend)',
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
  equipShowCharms: true,
  equipHideDropInfo: true,
  equipHoverFunctions: true,
  equipTouchFunctions: false,
  equipCode: {
    CATEGORY: '[size=3][b][{$category}][/b][/size]',
    TYPE: '[size=2][b][{$type}][/b][/size]',
    EQUIP: '[{$_eid}] [url={$url}]{$namecode}[/url] ({$level?Lv.$level}{$soulbound?Soulbound}{$unassigned?Unassigned}, {$pab}{$note?, $note}){$price? @ $price}',
  },
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
  equipmentShopAutoProtect: false,
  equipmentShopPriceDeductFee: false,

  equipmentShopProtectFilters: [
    'Peerless',
    'Legendary',
    'Magnificent && (Rapier || Shortsword) && Slaughter',
    'Magnificent && (Tower || Kite Shield || Buckler) && Barrier',
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
  equipPanelPosition: '左侧',
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

// $input/toggle_button isekai 版已提公共区($equip/$armory 收口前置, 2026-06-10); 主世界 IIFE 留本地简版遮蔽。

// $ajax/_query/_server 已提公共区（L1/L2）

// CONFIGURATION
const $config = {
  version: 4.2,
  ls_savelist: ['ch_style', 'persona', 'prices', 'equipset'],
  data: [
    /*
    { tag: 'h1', text: '战斗设置' },
    { key: 'reNotification', type: 'boolean', label: '启用随机遭遇战通知。' },
    { key: 'reBattle', type: 'boolean', label: '在战斗中启用随机遭遇战通知。' },
    { key: 'reGallery', type: 'boolean', label: '浏览画廊时也启用随机遭遇战通知。' },
    { key: 'reGalleryAlt', type: 'boolean', label: '从画廊打开随机遭遇战时，跳转到 alt.hentaiverse.org。' },
    { key: 'reBeep', type: 'array', input: 'text', value_type: 'number', value_sep: ',', text: 'Play a beep sound when Random Encounter is ready.\nThe order of values is [volume], [frequency], [duration].\nSet it to 0 to disable.', style: 'width: 150px;', oncreate: (o) => { $input(['button', '提示音测试'], [o.node.input, 'afterend'], null, () => { const validation = $config.validate(o); if (!validation.error) { play_beep(...validation.value); } }); } },
    */

    { tag: 'h1', text: '顶部导航栏' },
    { key: 'topMenuIntegration', type: 'boolean', label: '将顶部菜单整合为一个按钮。' },
    { key: 'confirmStaminaRestorative', type: 'boolean', label: '使用精力恢复道具前进行确认。', server: 'persistent' },
    { key: 'disableStaminaRestorative', type: 'number', label: '当精力高于指定值时，禁用精力恢复按钮。', server: 'persistent' },
    { key: 'warnLowStamina', type: 'number', label: '当体力低于指定值时发出警告.' },

    { tag: 'h1', text: '底部状态栏' },
    { key: 'showCredits', type: 'number', input: 'select', options: ['0:disable', '2:always'], label: '显示Credit余额' },
    { key: 'showEquipCapacity', type: 'number', input: 'select', options: ['0:disable', '1:on battle pages only', '2:always'], label: '显示装备仓库剩余空间' },
    { key: 'warnEquipCapacity', type: 'number', label: '当装备仓库的剩余容量不足指定数量时发出警告' },
    { key: 'trainingNotification', type: 'boolean', label: '显示进行中的训练，并自动开始下一项训练直到设定的等级。' },
    { key: 'lotteryNotification', type: 'boolean', label: '显示当前彩票中的武器和防具。' },
    { key: 'lotteryFilters', type: 'array', input: 'textarea', text: '高亮显示词条正确的彩票抽奖装备\n* $装备主属性(PAB)筛选暂不可用', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '装备' },
    { key: 'equipmentIntegration', type: 'boolean', label: '将所有类型的装备整合到装备列表' },
    { key: 'equipSort', type: 'boolean', label: '对装备列表进行排序和分类。' },
    { key: 'equipColor', type: 'boolean', label: '按品质为装备设置颜色。' },
    { key: 'equipShowLevel', type: 'boolean', label: '显示装备的等级。' },
    { key: 'equipShowPAB', type: 'boolean', label: '显示装备的潜能加成(PAB)。' },
    { key: 'equipShowCharms', type: 'boolean', label: '在弹窗中显示装备的护符' },
    { key: 'equipHideDropInfo', type: 'boolean', label: '在弹窗中隐藏装备的掉落信息' },
    { key: 'equipHoverFunctions', type: 'boolean', label: '当鼠标悬停在装备上时，支持键盘和鼠标操作。' },
    { key: 'equipTouchFunctions', type: 'boolean', label: '在移动端支持触摸操作' },
    { key: 'equipCode', type: 'object', input: 'textarea', text: '设置论坛代码的格式', style: 'height: 80px; white-space: normal;' },
    { key: 'equipNameCode', type: 'array', input: 'textarea', text: '设置美化装备名称的代码规则' },

    { tag: 'h1', text: '装备商店' },
    { key: 'equipmentShopConfirm', type: 'number', input: 'select', options: ['0:默认', '1:自动点击确认', '2:无需确认'], label: '出售或分解装备时进行确认。' },
    { key: 'equipmentShopAutoProtect', type: 'boolean', label: '自动保护符合规则的装备' },
    { key: 'equipmentShopPriceDeductFee', type: 'boolean', label: '显示实际价格——由于市场会收取1%的手续费，因此材料的实际价值为价格的99%' },
    { key: 'equipmentShopProtectFilters', type: 'array', input: 'textarea', text: '在列表顶部集中显示高价值的装备，并阻止它们被“全选”按钮选中', desc: 'equipFilters', validator: 'equipFilters' },
    { key: 'equipmentShopBazaarFilters', type: 'array', input: 'textarea', text: '在商店中仅显示优质词条的装备，隐藏所有其他低效词条的装备', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '怪物实验室' },
    { key: 'monsterLab', type: 'boolean', label: '高级怪物实验室功能', server: 'persistent' },
    { key: 'monsterLabDefaultSort', type: 'string', input: 'select', options: ['index:编号', 'name:名称', 'class:类型', 'pl:战力', 'wins:胜场', 'kills:击杀', 'gains:新增礼物', 'gifts:合计礼物', 'morale:士气', 'hunger:饥饿度'], label: '设置列表排序的默认值。', server: 'persistent' },
    { key: 'monsterLabCloseDefaultPopup', type: 'boolean', label: '关闭默认弹窗.', server: 'persistent' },

    { tag: 'h1', text: '雪花祭坛' },
    { key: 'shrineHideItems', type: 'array', input: 'textarea', text: '隐藏特定奖杯，避免误操作献祭' },
    { key: 'shrineFilters', type: 'array', input: 'textarea', text: '只显示高价值的奖励装备\n* $装备主属性(PAB)筛选暂不可用', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '莫古利邮局' },
    { key: 'moogleMail', type: 'boolean', label: '高级莫古利邮局功能' },

    { tag: 'h1', text: '战斗' },
    { key: 'equipPanelPosition', type: 'string', input: 'select', options: ['left:左侧', 'right:右侧'], label: '设置面板的位置。' },
    { key: 'equipPanelRepairThreshold', type: 'number', label: '当某件装备耐久度过低时发出警告。' },
    { key: 'equipPanelItemInventory', type: 'object', input: 'textarea', value_type: 'number', text: '显示道具的剩余数量，如果数量不足，则发出警告\n你可以通过单击列表中的道具名称，快捷地从物品商店购买指定数量' },
  ],
  text: {
    equipHoverFunctions: `
      [C] Open equipment link in a pop-up
      [V] Open equipment link in a new tab
      [L] Show link code
      [K] Show link code in bbcode format
      [DOUBLE CLICK] Open equipment link
    `,
    equipTouchFunctions: `
      [DOUBLE TAP] Open equipment link
      [LONG PRESS] Open equipment link
    `,
  },
  desc: {
    equipCode: `Syntax
      {$name}       equipment name
      {$namecode}   equipment name in colors/bold
      {$url}        equipment url
      {$eid}        equipment id
      {$_eid}       $eid with a transparent underline for layout
      {$level}      equipment level
      {$pab}        equipment pab
      {$tier}       potency tier (IW level)
      {$price}      the value of the '价格' input field
      {$note}       the value of the 'note' input field
                  - if it contains '$featured', the equip code will be added to 'Featured' section
      {$condition ? text_if_true}
                  - if $condition is a valid value, it prints 'text_if_true', otherwise nothing
                  e.g., {$price? @ $price}
                  - if the equipment has a '价格' value in the Equipment Inventory, it prints like ' @ 10m'.
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
      ()   : GROUPING
      &&   : AND
      ||   : OR
      !    : NOT
      $QUALITY+   : Whether the quality of the equipment is equal to or higher than the given QUALITY
      $pab=xyz    : Whether the equipment has pab x, y and z
      $prefix     : Whether the equipment has a prefix
      $level      : Number, the level of the equipment
      e.g., Magnificent && Power && !Warding
      e.g., $Exquisite+ && (Rapier || Shortsword) && Slaughter && $prefix && $pab=sd && $level<250
    `,
  },
  validator: {
    equipNameCode: function (value) {
      const result = $equip.namecode_parse(value);
      return result;
    },
    equipFilters: function (value) {
      const result = $equip.filter.validate(value);
      return result;
    },
  },
  init: create_hvut_config_init_entry(settings, HVUT_WORLD),
  migration: function () {
    const migration = run_hvut_config_settings_migration($config, $price, HVUT_WORLD, { dropEquipmentShopAutoProtect: true, cleanShrineLog: true });
    return migration.kind === 'accepted';
  },
  // reset/get/set/del/ls_get/ls_set/ls_del: 收口 bindConfig(L1)
  create: function () {
    inject_hvut_config_panel_style(HVUT_WORLD);

    render_hvut_config_panel($config, {
      ...HVUT_WORLD,
      checkboxWithNullLabel: true,
      showTextareaDefaultButton: true,
    });
  },
  // open/close: 收口 bindConfig(L1)
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
  // get_panel/validate_panel/validate/load/save/text2obj/obj2text/text2array/array2text: 收口 bindConfig(L1)
};
bindConfig($config, { skipField: (o) => is_hvut_config_field_disabled(o, HVUT_WORLD) }); // 18 方法收口共享内核(L1); ctx 注入面板字段门控谓词(isekai 按 HV server)
$config.init();
//$config.settings = settings;

// $ajax/_query 已提公共区（L2）

window.addEventListener('unhandledrejection', (e) => { console.log($ajax.error || e); });

// RANDOM ENCOUNTER
const $re = {};
bindRe($re, { config: $config, get top() { return _top; } }); // 收口共享内核(L1 bindRe), GM 命名空间经 ctx.config 注入

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
    alert('你没有足够的Credits！');
    scrollIntoView($id('settings_cfont').parentNode, $id('settings_outer'));
    const form = $qs('#settings_outer form');
    form.elements.fontlocal.checked = true;
    form.elements.fontlocal.required = true;
    form.elements.fontface.required = true;
    form.elements.fontsize.required = true;
    form.elements.fontface.placeholder = 'Tahoma, Arial';
    form.elements.fontsize.placeholder = '10';
    form.elements.fontoff.placeholder = '0';
  } else {
    openUrl(create_hvut_character_settings_url(), hvutRedirectReason('HV_UTILS_CHARACTER_SETTINGS'));
  }
  return;
}

// PLAYER DATA
const _player = parse_hvut_player_state(level_exec, $id('stamina_readout'), 'mainPlayerState');
if (_player === null) return;

/* START */

/* eslint-disable one-var */
var _ch = {},
    _eq = {},
    _ab = {},
    _tr = {},
    _se = {},

    _is = {},
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
const $equip = {}; // 2026-06-10 全量收口公共区 bindEquip(主世界旧体系同日退化)
bindEquip($equip, { config: $config });

// ITEM INVENTORY
// $item 已提公共区（L2）

// ITEM PRICE
const $price = {};
bindPrice($price, { config: $config }); // 收口共享内核(L1 bindPrice), 物价数据分服(默认命名空间)、逻辑统一

// MoogleMail
// $mail 已提公共区（L2）

// Battle Panel
const $battle = {
  eqitems: {},
  itemdata: {},

  init: function (outer) {
    // 渲染/交互内核已收口 bindBattlePanel(L1); 此处只留 isekai 外层接线(outer 自身持 on 类的宽度规则)。
    GM_addStyle(/*css*/`
      #mainpane { padding-right: 8px; }
      .hvut-bt-outer { width: 1220px !important; }
      .hvut-bt-outer > p { width: 520px; margin-left: auto; margin-right: auto; }
      .hvut-bt-on.hvut-bt-outer { width: 620px !important; }
      .hvut-bt-on.hvut-bt-left { margin-left: 600px !important; }
      .hvut-bt-on.hvut-bt-right { margin-right: 600px !important; }
    `);

    $battle.node.outer = outer || $id('mainpane');
    $battle.init_panel($battle.node.outer);

    $battle.node.outer.classList.add('hvut-bt-outer', 'hvut-bt-on');
    if ($config.settings.equipPanelPosition === 'right') {
      $battle.node.outer.classList.add('hvut-bt-right');
    } else {
      $battle.node.outer.classList.add('hvut-bt-left');
    }

    $battle.create();
  },
};
bindBattlePanel($battle, { // 渲染/交互内核 + 数据层(2026-06-10 续收, 能量模型后两版机制同构)全量收口(L1)
  config: $config,
  dict: 'item',
  divSel: '#hvut-bt-div',
  inventory: () => $config.settings.equipPanelItemInventory,
  threshold: () => $config.settings.equipPanelRepairThreshold,
  equip: () => $equip,
  persona: () => $persona,
});

// BASIC CSS
$id('csp').dataset.ss = _query.ss || 'ch';

GM_addStyle(/*css*/`
  input[type='text'], input[type='number'] { margin: 0 5px; padding: 2px 4px; border-width: 1px; line-height: 16px; }
  input[type='text'][readonly], input[type='number'][readonly] { color: var(--color-font-invalid); }
  input[type='number'] { -moz-appearance: textfield; }
  input[type='number']::-webkit-outer-spin-button, input[type='number']::-webkit-inner-spin-button { -webkit-appearance: none; }
  input[type='button'] { font-weight: bold; margin: 0 5px; padding: 1px 3px; border-width: 2px; border-radius: 5px; line-height: 16px; }
  input[type='checkbox'] { width: 16px; height: 16px; margin: 0 2px; position: relative; top: 0; vertical-align: middle; }
  textarea { margin: 5px; padding: 4px; border-width: 1px; line-height: 20px; }
  select { margin: 0 5px; padding: 2px; border-width: 1px; height: calc(4em/3 + 6px); }
  select[size] { height: auto; }
  select[size] option:checked { background-color: revert; color: revert; }

  .hvut-label input { display: none; }
  .hvut-label input + span { position: relative; display: inline-block; width: 14px; height: 14px; border: 1px solid var(--color-border-light); background-color: unset; vertical-align: middle; }
  .hvut-label:hover input + span { border-color: var(--color-border-default); background-color: var(--color-bg-alpha); }
  .hvut-label input[type='checkbox'] + span { border-radius: 3px; }
  .hvut-label input[type='radio'] + span { border-radius: 50%; }
  .hvut-label input[type='checkbox']:checked + span::before { content: ''; position: absolute; top: 1px; left: 4px; width: 3px; height: 7px; border-width: 0 3px 3px 0; border-style: solid; border-color: var(--color-border-default); transform: rotate(45deg); }
  .hvut-label input[type='radio']:checked + span::before { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; background-color: var(--color-bg-invert); border-radius: 50%; }
  .hvut-scrollbar-none { padding: 0; scrollbar-width: none; }
  .hvut-scrollbar-none::-webkit-scrollbar { display: none; }
  .hvut-scrollbar-none option { margin: 0; border: 0; padding: 3px; }

  #mainpane { width: auto; }
  .csps { visibility: hidden; }
  .csps > img { display: none; }
  .cspp { overflow-y: auto; }
  .fc2, .fc4 { display: inline; }

  .hvut-warn { color: var(--color-font-warn) !important; }
  .hvut-warn2 { background-color: var(--color-bg-invert) !important; color: var(--color-font-invert) !important; }
  .hvut-bonus { color: var(--color-font-bonus) !important; }
  .hvut-none { display: none !important; }
  .hvut-none-cont .hvut-none-item { display: none; }
  .hvut-cphu, .hvut-cphu-sub > * { cursor: pointer; }
  .hvut-cphu:hover, .hvut-cphu-sub > *:hover { text-decoration: underline; }
  .hvut-spaceholder { flex-grow: 1; }
  .hvut-side { position: absolute; width: 100px; display: flex; flex-direction: column; }
  .hvut-side input { margin: 3px 0; padding: 1px; white-space: normal; }
  .hvut-side input:hover { z-index: 1; }
  .hvut-side .hvut-side-margin { margin-bottom: 10px; }
  .hvut-side .hvut-side-top { border-bottom-right-radius: 0; border-bottom-left-radius: 0; margin-bottom: 0; }
  .hvut-side .hvut-side-mid { border-radius: 0; margin-top: -2px; margin-bottom: 0; }
  .hvut-side .hvut-side-bottom { border-top-left-radius: 0; border-top-right-radius: 0; margin-top: -2px; }

  /* old style equiplist */
  .equiplist { font-weight: normal; }
  .eqp { margin: 5px; width: auto; }
  .eqp:hover { background-color: var(--color-bg-alpha); }
  .eqp > div:last-child { position: relative; padding: 1px 5px; line-height: 20px; white-space: nowrap; }
  .eqp > div:last-child:not([onclick]) { color: var(--color-font-light); }
  .eqp > div:last-child[style*='color'] { box-shadow: 0 0 0 2px inset; }
  div.hvut-eqp-customname::after { visibility: hidden; content: attr(data-eqname); position: absolute; bottom: 0; left: 0; min-width: 100%; padding: inherit; background-color: inherit; }
  div.hvut-eqp-customname:hover::after { visibility: visible; }
  p.hvut-eqp-category { margin: 10px 0 5px; padding: 2px 5px; border: 1px solid var(--color-border-default); font-size: 10pt; font-weight: bold; background-color: var(--color-bg-h1); }
  p.hvut-eqp-type { margin: 10px 5px 5px; padding: 2px 5px; border: 1px solid var(--color-border-default); font-size: 10pt; font-weight: bold; }
  div + div.hvut-eqp-border { margin-top: 11px; }
  div + div.hvut-eqp-border::before { content: ''; position: absolute; margin-top: -6px; width: 100%; border-top: 1px solid var(--color-border-default); }
  .hvut-none-cont div.hvut-eqp-border { margin-top: 0; }
  .hvut-none-cont div.hvut-eqp-border::before { content: none; }
  /* */

  #equiplist { position: relative; }
  #equiplist td { padding: 3px; font-weight: normal; border-color: var(--color-border-alpha); }
  #equiplist td:nth-child(n+2) { text-align: right; white-space: nowrap; padding-right: 8px; } /* 等级/pab/V/C 列右对齐 → 行间右边缘对齐(修异世界聚合列表参差) */
  #equiplist .hvut-eqp-category > td { padding: 10px; border-top-width: 3px; font-size: 10pt; font-weight: bold; background-color: var(--color-bg-h1); }
  #equiplist .hvut-eqp-type > td { padding: 10px; border-top-width: 2px; font-size: 10pt; font-weight: bold; background-color: var(--color-bg-h2); }
  #equiplist .hvut-eqp-border > td { border-top-width: 3px; border-top-style: double; }
  #equiplist .lc { height: auto; min-height: 24px; }
  .hvut-eqp-filter-on .hvut-eqp-hidden { display: none; }
  .hvut-eqp-profit { background-color: var(--color-bg-alpha); color: var(--color-font-highlight); }
  #equiplist .hvut-eqp-level { width: 40px; } /* 等级列定宽: 各行列宽一致, 不被装备名列挤压 */
  #equiplist .hvut-eqp-pab { width: 64px; } /* pab 列定宽(最长 SDEA 4 字母) */
  .hvut-eqp-level ~ .hvut-eqp-upgrade { display: none; }
  .hvut-eqp-level.hvut-eqp-upgrade { background-color: var(--color-bg-alpha); }
  .hvut-eqp-note { width: 90px; }
  .hvut-eqp-note input { width: 80px; margin: 0; font-size: 9pt; }
  .hvut-eqp-scroll { margin-bottom: 5px; }
  .hvut-eqp-scroll input { margin: 5px; padding: 2px 5px; border-width: 1px; border-radius: 0; }

  .itemlist { user-select: auto !important; }
  .it, .it ~ td { padding-top: 7px; }
  .hvut-item-Consumable { color: var(--color-item-Consumable); }
  .hvut-item-Artifact { color: var(--color-item-Artifact); }
  .hvut-item-Trophy { color: var(--color-item-Trophy); }
  .hvut-item-Token { color: var(--color-item-Token); }
  .hvut-item-Crystal { color: var(--color-item-Crystal); }
  .hvut-item-MonsterFood { color: var(--color-item-MonsterFood); }
  .hvut-item-Material { color: var(--color-item-Material); }
  .hvut-item-Collectable { color: var(--color-item-Collectable); }
`);

if (false /* [v10.0.1] sssss2 品质整件染色已禁用，改用 indefined 词缀分色 (src/i18n/equip-translate.js) */) {
  GM_addStyle(/*css*/`
    .hvut-equip-Peerless { background-color: var(--color-equip-Peerless) !important; }
    .hvut-equip-Legendary { background-color: var(--color-equip-Legendary) !important; }
    .hvut-equip-Magnificent { background-color: var(--color-equip-Magnificent) !important; }
    .hvut-equip-Exquisite { background-color: var(--color-equip-Exquisite) !important; }
    .hvut-equip-Superior { background-color: var(--color-equip-Superior) !important; }
  `);
}

_eqch.init(); // 属性面板双列展开收口 L3.A2（两 IIFE 共用）

// DISABLE FONT ENGINE
_window.common.get_dynamic_digit_string = function (n) { return `<div class="fc4 far fcb"><div>${n.toLocaleString()}</div></div>`; };

if ($config.settings.equipHoverFunctions) {
  // EQUIPMENT KEY FUNCTIONS
  document.addEventListener('keydown', (e) => {
    if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') {
      return;
    }
    const div = $qs('[data-eid]:hover');
    if (div) {
      const eq = $equip.parse.elem(div);
      if (e.key === 'C') {
        div.dispatchEvent(new MouseEvent('mouseover'));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', which: 99, keyCode: 99 }));
      }
      const key = e.key.toUpperCase();
      if (key === 'V') {
        openUrl(create_hvut_equip_page_url(eq), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);
      } else if (key === 'L') {
        prompt('Forum Link:', `[url=${create_hvut_equip_page_url(eq, { absolute: true })}]${eq.info.name}[/url]`);
      } else if (key === 'K') {
        $equip.namecode(eq);
        prompt('Forum Link:', `[url=${create_hvut_equip_page_url(eq, { absolute: true })}]${eq.data.namecode}[/url]`);
      }
    }
  });

  // EQUIPMENT MOUSE FUNCTIONS
  document.addEventListener('dblclick', () => {
    const div = $qs('[data-eid]:hover');
    if (div) {
      openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);
    }
  });
}

if ($config.settings.equipTouchFunctions) {
  // EQUIPMENT TOUCH FUNCTIONS
  function handleAction(target) {
    const div = target?.closest('[data-eid]');
    if (!div) {
      return;
    }
    openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);
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
bindTop(_top, { config: $config, player: () => _player, re: () => $re }); // 全量收口(L1 bindTop, 能量模型 am 体系菜单; menu 表 server 字段过滤本服项)
_top.init();

// DIFFICULTY CHANGER
const $dfct = {};
bindDfct($dfct, { config: $config, get top() { return _top; }, get player() { return _player; } }); // 收口共享内核(L1 bindDfct)

$dfct.init();

// PERSONA & EQUIPMENT SET CHANGER
// 全方法已收口 bindPersona(L1; parse_stats_pane 2026-06-10 续收——主世界属性页已同构 #stats_scrollable, 大分叉消失);
// 真分叉经 ctx 倒置(warnSelector/>div>div 解析 + parse.elem)。
const $persona = {};
bindPersona($persona, { // 收口共享内核(L1 bindPersona)
  config: $config,
  get top() { return _top; },
  get dfct() { return $dfct; },
  get battle() { return $battle; },
  get player() { return _player; },
  warnSelector: '#stamina_restore > div > div',
  parseEquipElem: (d) => $equip.parse.elem(d),
  applyDynjs: (html) => { Object.assign($equip.dynjs_equip, parse_script_json(html, 'dynjs_equip')); },
});

$persona.init();


// BOTTOM
_bottom.node = {};

_bottom.init = function () {
  _bottom.node.div = $element('div', $id('csp'), ['#hvut-bottom']);

  if ($config.settings.showCredits === 2) {
    _bottom.show_credits();
  }
  if ($config.settings.showEquipCapacity === 2 || $config.settings.showEquipCapacity === 1 && _query.s === 'Battle') {
    _bottom.show_equip();
  }
  // 彩票/训练 = persistent realm 专属能力，isekai 版底部栏不渲染（用户决策 2026-06-08）。
};

_bottom.show_credits = async function () {
  _bottom.node.credits = $element('div', _bottom.node.div, '加载中...');
  if ($id('networth')) {
    _bottom.node.credits.textContent = $id('networth').textContent;
    $id('networth').remove();
  } else {
    const html = await $ajax.fetch(create_hvut_item_shop_url());
    const doc = $doc(html);
    _bottom.node.credits.textContent = $id('networth', doc).textContent;
  }
};

_bottom.show_equip = async function () {
  _bottom.node.equip = $element('div', _bottom.node.div, '加载中...');
  let capacity;
  try {
    const html = await $ajax.fetch(create_hvut_armory_organize_url());
    capacity = parse_hvut_inventory_capacity(html, 'bottomInventoryCapacity');
  } catch (_error) {
    capacity = record_hvut_shrine_capacity_failure('bottomInventoryCapacityFetch', { reason: 'requestFailed' });
  }
  if (capacity === null) {
    _bottom.node.equip.textContent = 'Inventory Capacity: unavailable';
    _bottom.node.equip.classList.add('hvut-warn');
    return;
  }
  const { usage } = capacity;
  const free = capacity.capacity - usage;
  const warnCapacity = normalize_hvut_bottom_warn_capacity($config.settings, capacity.capacity);
  _bottom.node.equip.textContent = `Inventory Capacity: ${usage} / ${capacity.capacity}`;
  if (free < warnCapacity) {
    popup('<p style="color: #e00; font-weight: bold;">Your inventory is almost full.<br>\nPlease manage your equipment to increase available capacity.</p>');
    _bottom.node.equip.classList.add('hvut-warn2');
  } else if (free < capacity.capacity / 2) {
    _bottom.node.equip.classList.add('hvut-warn');
  }
};

GM_addStyle(/*css*/`
  #hvut-bottom { position: absolute; display: flex; top: 100%; left: -1px; width: 100%; border: 1px solid var(--color-border-default); font-size: 10pt; line-height: 20px; }
  #hvut-bottom:empty { display: none; }
  #hvut-bottom > div { margin: -1px 0 -1px -1px; border: 1px solid var(--color-border-default); padding: 0 10px; }
  #hvut-bottom > .hvut-spaceholder ~ div { margin: -1px -1px -1px 0; }
  #hvut-bottom > .hvut-spaceholder { margin: 0; border: 0; padding: 0; }
  #hvut-bottom a { color: inherit; }

  .hvut-lt-div > a { margin-right: 5px; }
  .hvut-lt-div > span { display: inline-block; width: 40px; }
  .hvut-lt-check { background-color: var(--color-warn-bg); }
`);

_bottom.init();


//* [1] Character - Character
if (_query.s === 'Character' && _query.ss === 'ch' || $id('persona_outer')) {
  _ch.persona = $id('persona_form').elements.persona_set.value;

  // _ch 经验模拟器: refuter(2026-06-10) 判 true-dup —— 核心公式(2.850263212287058 等级表 / prof_gain ×4·(1+assim·0.1))
  // 两版 byte-identical。但 *落地留各版*(对应轴成立·形态受阻): ① $input 签名两 IIFE 分叉(isekai 4 槽含 null /
  // 主世界 3 槽, = create 同款助手契约差异) ② 结构分叉(isekai 全嵌套 _ch.exp.{table,node} / 主世界平铺
  // _ch.{exp_table,node}) ③ init/open 流语义对调。全收口需结构归一重构 + UI 实站验证(无单测), 不宜叠加当前未验证
  // 退化改动 → 待实站基线后专做(同 create mixed 留置逻辑)。
  _ch.exp = {
    node: {},
    total: _window.total_exp,
    table: [null, { total: 0 }],
    prof: {},

    init: function () {
      _ch.exp.node.div = $element('div', $id('attr_outer'), ['.hvut-ch-div'], { input: () => { _ch.exp.calc(); } });
      $input(['button', '经验模拟器'], _ch.exp.node.div, null, () => { _ch.exp.open(); });
    },
    open: function () {
      _ch.exp.node.div.innerHTML = '';
      $qs('img[onclick*="do_attr_post"]').style.visibility = 'hidden';
      $id('prof_outer').classList.add('hvut-ch-prof');

      $qsa('#prof_outer tr').forEach((tr) => {
        const p = { tr: tr };
        const name = tr.cells[0].textContent;
        _ch.exp.prof[name] = p;
        p.current = parseFloat(tr.cells[1].textContent);
        p.exp = _ch.exp.get_exp(p.current);
        tr.cells[1].textContent = p.current;
        $element('td', tr);
        $element('td', tr);
      });
      _ch.exp.node.level = $input(['number', null, 'Level', 'before'], _ch.exp.node.div, { value: _player.level, min: 1, max: 600, style: 'width: 50px;' });
      const ass = $config.get('tr_level', {})['Assimilator'] || 0;
      _ch.exp.node.ass = $input(['number', null, 'Training: Assimilator', 'before'], _ch.exp.node.div, { value: ass, min: 0, max: 25, style: 'width: 30px;' });
      _ch.exp.calc();
    },
    get_exp: function (level) {
      const num = parseInt(level);
      const dec = level % 1;
      if (!_ch.exp.table[num]) {
        _ch.exp.table[num] = { total: Math.round(Math.pow(num + 3, Math.pow(2.850263212287058, 1 + num / 1000))) };
      }
      let exp = _ch.exp.table[num].total;
      if (dec) {
        if (!_ch.exp.table[num].next) {
          _ch.exp.table[num].next = _ch.exp.get_exp(num + 1) - exp;
        }
        exp += Math.round(_ch.exp.table[num].next * dec);
      }
      return exp;
    },
    get_level: function (exp, level) {
      level = parseInt(level) || 1;
      while (exp >= _ch.exp.table[level].total) {
        level++;
        if (!_ch.exp.table[level]) {
          _ch.exp.table[level] = { total: _ch.exp.get_exp(level) };
        }
      }
      level--;
      if (!_ch.exp.table[level].next) {
        _ch.exp.table[level].next = _ch.exp.table[level + 1].total - _ch.exp.table[level].total;
      }
      return level + (exp - _ch.exp.table[level].total) / _ch.exp.table[level].next;
    },
    calc: function () {
      const level = parseFloat(_ch.exp.node.level.value);
      const ass = parseInt(_ch.exp.node.ass.value);
      if (isNaN(level) || level < 1 || level > 600 || isNaN(ass) || ass < 0 || ass > 25) {
        return;
      }

      _window.total_exp = _ch.exp.get_exp(level);
      _window.update_usable_exp();
      _window.update_display('str');

      const exp_gain = _window.total_exp - _ch.exp.total;
      const prof_gain = Math.max(0, exp_gain * 4 * (1 + ass * 0.1));
      Object.values(_ch.exp.prof).forEach((p) => {
        p.level = _ch.exp.get_level(p.exp + prof_gain, p.current);
        p.tr.cells[2].textContent = '礼物' + (p.level - p.current).toFixed(3);
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
    .hvut-ch-prof td:nth-child(3) { width: 65px; color: var(--color-font-highlight); }
    .hvut-ch-prof td:nth-child(4) { width: 60px; font-weight: bold; }
  `);

  _ch.exp.init();
  const statsOutcome = $persona.parse_stats_pane_outcome();
  if (statsOutcome.kind === 'rejected') return;
} else
// [END 1] Character - Character */


//* [2] Character - Equipment
if (_query.s === 'Character' && _query.ss === 'eq') {
  _eq.node = {};

  _eq.init = function () {
    _eq.equiplist = $equip.list.div($id('eqsb'), false);
    _eq.equiplist.forEach((eq) => {
      const div = $element('div', eq.node.wrapper.firstElementChild, ['.hvut-eq-info']);
      if (eq.info.upgrade_cap) {
        $element('span', div, [`${eq.info.upgrade} / ${eq.info.iw}`]);
      } else {
        $element('span', div, [`Lv. ${eq.info.level}`, (!eq.info.tradeable ? '.hvut-eq-untradeable' : '')]);
      }
      $element('span', div, eq.info.pab);
    });

    _eq.node.buttons = $element('div', [$id('eqch_left'), 'afterbegin'], ['.hvut-eq-buttons']);
    $input(['button', '生成装备代码'], _eq.node.buttons, null, () => { _eq.equip_code(); });
    $input(['button', '装备弹窗'], _eq.node.buttons, null, () => { _eq.popup_init(); });
    _eq.node.equipset_name = $input('text', _eq.node.buttons, { value: $persona.json.ename || `Set ${$persona.json.eset}`, style: 'width: 100px; margin-left: auto; text-align: center;' });
    $input(['button', '保存'], _eq.node.buttons, null, () => { $persona.set_value('姓名', _eq.node.equipset_name.value); });

    _eq.show_base();
  };

  _eq.show_base = async function () {
    const html = await $ajax.fetch(create_hvut_character_page_url());
    const doc = $doc(html);
    const base = {};
    $qsa('#attr_table tr:nth-last-child(n+2)', doc).forEach((tr) => {
      const stat = parse_hvut_character_base_stat_row(tr, 'equipmentBaseStatSourceRow');
      if (stat) base[stat.name] = stat.value;
    });
    $qsa('#stats_scrollable > table:nth-last-of-type(2) tr').forEach((tr) => {
      decorate_hvut_equipment_base_stat_row(tr, base, 'equipmentBaseStatTargetRow');
    });
  };

  _eq.equip_code = function () {
    const code = _eq.equiplist.map((eq) => `[url=${create_hvut_equip_page_url(eq, { absolute: true })}]${eq.info.name}[/url]`);
    popup_text(code, 900, 150);
  };

  _eq.popup_init = function () {
    if (_eq.node.popups) {
      _eq.node.popups.classList.toggle('hvut-none');
      return;
    }
    _eq.node.popups = $element('div', document.body, ['.hvut-eq-popups', (_eq.equiplist.length > 6 ? '!width: 1690px;' : '')]);
    _eq.equiplist.forEach((eq) => {
      const div = $element('div', _eq.node.popups);
      eq.node.popup = $element('iframe', div, { src: create_hvut_equip_page_url(eq), scrolling: 'no' }, { load: () => { _eq.popup_load(eq); } });
      if ($config.settings.equipShowCharms && eq.info.upgrade_cap) {
        _eq.charm_load(eq);
      }
    });
  };

  _eq.popup_load = function (eq) {
    eq.node.popup.dataset.loaded = '1';
    if ($config.settings.equipHideDropInfo) {
      const doc = eq.node.popup.contentDocument;
      clear_hvut_equip_popup_drop_info(doc, 'equipPopupDropInfo');
    }
    if ($config.settings.equipShowCharms && eq.info.upgrade_cap) {
      _eq.charm_append(eq);
    }
  };

  _eq.charm_load = async function (eq) {
    const html = await $ajax.fetch(create_hvut_armory_screen_url('modify', { eqid: eq.info.eid }));
    const doc = $doc(html);
    eq.data.charms = $qsa('.eqcharm th', doc).map((th) => th.textContent);
    _eq.charm_append(eq);
  };

  _eq.charm_append = function (eq) {
    if (eq.node.charms) {
      return;
    }
    if (!eq.data.charms || eq.node.popup.dataset.loaded !== '1') {
      return;
    }
    const doc = eq.node.popup.contentDocument;
    const style = doc.createElement('style');
    style.innerHTML = /*css*/`
      .chm > div:nth-child(n+2) { line-height: 18px; color: #03c; }
    `;
    doc.head.appendChild(style);
    const div = doc.createElement('div');
    div.classList.add('ep', 'chm');
    switch (eq.data.charms.length) {
      case 0:
        eq.node.charms = div;
        return;
      case 1:
        div.classList.add('ep1');
      case 2:
      case 4:
        div.classList.add('ep2');
        break;
      default:
        div.classList.add('ep3');
        break;
    }
    div.insertAdjacentHTML('beforeend', '<div>Charms</div>');
    const reg_charm = /(.+) \((Greater|Lesser)\)/;
    for (const charm of eq.data.charms) {
      const match = reg_charm.exec(charm);
      if (!match) {
        record_hvut_character_parse_failure('equipPopupCharmText', { charm: charm });
        return;
      }
      const [, type, tier] = match;
      div.insertAdjacentHTML('beforeend', `<div>${type} (${tier[0]})</div>`);
    }
    if (append_hvut_equip_popup_charms(doc, div, 'equipPopupCharmAppend') === false) {
      return;
    }
    eq.node.charms = div;
  };

  if (_query.equip_slot) {
    $equip.list.table($qs('#equiplist > table'));
  } else {
    GM_addStyle(/*css*/`
      #csp[data-ss='eq'] #popup_box { margin-top: 12px; margin-left: -96px; }
      #csp[data-ss='eq'] #stats_scrollable > table:nth-last-of-type(2) td:first-child { min-width: 35px; }

      #eqsh { display: none; }
      #eqsl { margin-top: 15px; }
      #eqsb .eqb { padding: 0; height: auto; font-size: 10pt; line-height: 20px; text-align: center; overflow: hidden; }
      #eqsb .eqb > div:last-child { padding: 1px 0; }

      .hvut-eq-buttons { display: flex; width: 650px; margin: 5px auto; text-align: left; }
      .hvut-eq-info { position: absolute; top: 0; right: 0; font-size: 9pt; font-weight: normal; }
      .hvut-eq-info > span { display: inline-block; width: 60px; line-height: 16px; border-left: 1px solid var(--color-border-default); }
      .hvut-eq-untradeable { color: var(--color-font-highlight); }

      .hvut-eq-popups { display: flex; flex-wrap: wrap; position: relative; width: 1270px; padding: 5px 0; background-color: inherit; }
      .hvut-eq-popups div { width: 420px; height: 445px; border: 1px solid var(--color-border-default); margin: 5px -1px 0 0; }
      .hvut-eq-popups iframe { width: 100%; height: 100%; border: 0; }
    `);

    const personaContext = render_hvut_equipment_persona_context($persona, 'equipmentPersonaContextRejected');
    if (personaContext.kind === 'rejected') return;

    _eq.init();

    /*
    const statsOutcome = $persona.parse_stats_pane_outcome();
    if (statsOutcome.kind === 'accepted' && statsOutcome.stats_pane?.['Spell Type']) {
      _eq.stats_pane = statsOutcome.stats_pane;
      _eq.mage_stats();
    }
    //*/
  }
} else
// [END 2] Character - Equipment */


//* [3] Character - Abilities
if (_query.s === 'Character' && _query.ss === 'ab') {
  _ab.abilities = {
    'HP Tank': { category: 'General', img: '3.png', pos: 0, unlock: [0, 25, 50, 75, 100, 120, 150, 200, 250, 300], point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5] },
    'MP Tank': { category: 'General', img: '3.png', pos: -34, unlock: [0, 30, 60, 90, 120, 160, 210, 260, 310, 350], point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5] },
    'SP Tank': { category: 'General', img: '3.png', pos: -68, unlock: [0, 40, 80, 120, 170, 220, 270, 330, 390, 450], point: [1, 2, 3, 3, 4, 4, 4, 5, 5, 5] },
    'Better Health Pots': { category: 'General', img: '1.png', pos: 0, unlock: [0, 100, 200, 300, 400], point: [1, 2, 3, 4, 5] },
    'Better Mana Pots': { category: 'General', img: '1.png', pos: -34, unlock: [0, 80, 140, 220, 380], point: [2, 3, 5, 7, 9] },
    'Better Spirit Pots': { category: 'General', img: '1.png', pos: -68, unlock: [0, 90, 160, 240, 400], point: [2, 3, 5, 7, 9] },
    '1H Damage': { category: '单手重甲盾战', img: 'e.png', pos: -68, unlock: [0, 100, 200], point: [2, 3, 5] },
    '1H Accuracy': { category: '单手重甲盾战', img: 'e.png', pos: -34, unlock: [50, 150], point: [1, 2] },
    '1H Block': { category: '单手重甲盾战', img: 'e.png', pos: 0, unlock: [250], point: [3] },
    '2H Damage': { category: '双手轻甲战士', img: 'k.png', pos: -34, unlock: [0, 100, 200], point: [2, 3, 5] },
    '2H Accuracy': { category: '双手轻甲战士', img: 'k.png', pos: 0, unlock: [50, 150], point: [1, 2] },
    '2H Parry': { category: '双手轻甲战士', img: 'e.png', pos: -102, unlock: [50, 200], point: [2, 3] },
    'DW Damage': { category: '双持轻甲战士', img: 'j.png', pos: 0, unlock: [0, 100, 200], point: [2, 3, 5] },
    'DW Accuracy': { category: '双持轻甲战士', img: 'k.png', pos: -68, unlock: [50, 150], point: [1, 2] },
    'DW Crit': { category: '双持轻甲战士', img: 'k.png', pos: -102, unlock: [250], point: [3] },
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

  _ab.point = parse_hvut_ability_points_from_top($id('ability_top'), 'abilityPointsNode');
  _ab.level = {};

  _ab.init = function () {
    if (_ab.point === null) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    if (_ab.parse_slotbar() === false) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    if (!$config.set('ab_level', _ab.level)) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }

    if (_ab.parse_treepane() === false) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    $id('ability_treepane').addEventListener('click', _ab.click, true);

    $input(['button', '技能模拟器'], $id('ability_outer'), ['!position: absolute; top: 20px; left: -80px; width: 90px; white-space: normal;'], () => { _ab.calc.toggle(); });
    return true;
  };

  _ab.parse_slotbar = function () {
    for (const div of $qsa('#ability_top div[onmouseover*="overability"]')) {
      const exec = /overability\(\d+, '([^']+)'.+?(?:(Not Acquired)|Requires <strong>Level (\d+))/.exec(div.getAttribute('onmouseover'));
      if (!exec) {
        record_hvut_ability_parse_failure('abilitySlotbar', { onmouseover: div.getAttribute('onmouseover') || '' });
        return false;
      }
      const name = exec[1];
      const ab = _ab.abilities[name];
      // 同 parse_treepane: HV 新增/改名技能时跳过该槽位, 不让一项未知技能崩掉整段汉化。
      if (!ab) {
        console.warn('[HVAA][i18n] 技能表缺少此项(槽位), 已跳过:', JSON.stringify(name));
        continue;
      }

      ab.slotted = true;
      ab.level = exec[2] ? 0 : 1 + ab.unlock.indexOf(parseInt(exec[3]));
      ab.max = ab.unlock.length;
      ab.cap = ab.unlock.findIndex((e) => e > _player.level);
      if (ab.cap === -1) {
        ab.cap = ab.max;
      }

      _ab.preset['Current Set'].push(name);
      if (ab.level) {
        _ab.level[name] = ab.level;
      }

      const span = $element('span', div, ['.hvut-ab-slot']);
      if (ab.level === ab.max) {
        span.textContent = '已满';
        span.classList.add('hvut-ab-max');
      } else if (ab.level === ab.cap) {
        span.textContent = `${ab.level}/${ab.max}`;
        span.classList.add('hvut-ab-cap');
      } else {
        span.textContent = `${ab.level}/${ab.max}`;
        span.classList.add('hvut-ab-up');
        const categories = ['General', '单手重甲盾战', '双手轻甲战士', '双持轻甲战士', '', 'Staff', 'Cloth Armor', 'Light Armor', 'Heavy Armor', 'Deprecating 1', 'Deprecating 2', 'Supportive 1', 'Supportive 2', 'Elemental', 'Forbidden', 'Divine'];
        const index = categories.indexOf(ab.category);
        $qsa('#ability_treelist > div')[index].classList.add('hvut-ab-tree');
      }
    }
    return true;
  };

  _ab.parse_treepane = function () {
    for (const div of $qsa('#ability_treepane > div')) {
      const name = div.firstElementChild.textContent;
      const ab = _ab.abilities[name];
      // HV 新增/改名技能时 _ab.abilities 无此键 → 跳过该项, 避免整段汉化崩溃。
      if (!ab) {
        console.warn('[HVAA][i18n] 技能表缺少此项, 已跳过:', JSON.stringify(name));
        continue;
      }
      let point = _ab.point;

      ab.div = div;
      const buttonPanel = parse_hvut_ability_button_panel(div, 'abilityButtonPanel');
      if (buttonPanel === null) return false;
      ab.id = parse_hvut_ability_unlock_id(buttonPanel, 'abilityUnlockId');
      if (ab.id === null) return false;
      ab.level = 0;

      for (const [i, button] of Array.from(buttonPanel.children).entries()) {
        const type = parse_hvut_ability_button_type(button.style.backgroundImage);
        if (type === null) return false;
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
      }

      if (ab.level) {
        if (!ab.slotted) {
          if (mark_hvut_ability_warning(div, '未激活', 'abilityWarningNode') === null) return false;
        } else if (ab.level !== ab.cap) {
          if (mark_hvut_ability_warning(div, '可升级', 'abilityWarningNode') === null) return false;
        }
      }
    }
    return true;
  };

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
    const ab = _ab.abilities[name];
    const count = to - ab.level;

    async function unlock(ab) {
      return run_hvut_ability_unlock_request(ab, { buttonStage: 'abilityUnlockButton', responseStage: 'abilityUnlockResponse' });
    }

    const requests = $ajax.repeat(count, unlock, ab);
    let results;
    try {
      results = await Promise.all(requests);
    } catch (error) {
      record_hvut_ability_unlock_failure('abilityUnlockRequest', { name: name, to: to, count: count, error: error?.message || String(error) });
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return;
    }
    if (!results.every((r) => r)) return;
    reloadCurrentPage(hvutReloadReason('HV_UTILS_ABILITY_UNLOCK'));
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

      Object.entries(_ab.abilities).forEach(([n, ab]) => {
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

      $input(['button', '关闭'], node.side, { dataset: { action: 'toggle' }, className: 'hvut-side-margin' });
      Object.keys(_ab.preset).forEach((n) => { $input(['button', n], node.side, { dataset: { action: 'preset', name: n } }); });

      let category;
      let li;
      Object.entries(_ab.abilities).forEach(([n, ab]) => {
        if (category !== ab.category) {
          category = ab.category;
          li = $element('li', node.ul);
          $element('span', li, [category, '.hvut-ab-category']);
        }
        const icon = $element('div', li, [{ dataset: { action: 'ability', name: n } }, '.hvut-ab-icon hvut-ab-off', `!background-image: url("/y/t/${ab.img}"); background-position-x: ${ab.pos - 2}px;`]);
        $element('span', icon, [n, '.hvut-ab-tooltip']);
        node.ability[n] = icon;
      });

      _ab.calc.preset('目前流派');
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
          const ab = _ab.abilities[name];
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
    .hvut-ab-slot { position: absolute; bottom: -5px; left: 2px; width: 30px; font-size: 9pt; color: var(--color-ab-font); }
    .hvut-ab-max { background-color: var(--color-ab-max); }
    .hvut-ab-cap { background-color: var(--color-ab-cap); }
    .hvut-ab-up { background-color: var(--color-ab-up); }
    .hvut-ab-tree > img[src*='/td'] { filter: brightness(250%); }
    .hvut-ab-bar { font-size: 9pt; line-height: 30px; white-space: nowrap; }
    .hvut-ab-bu { color: var(--color-ab-slot); display: block; }
    .hvut-ab-bux { color: var(--color-font-invalid); display: block; cursor: not-allowed; }
    .hvut-ab-bx { color: var(--color-font-invalid); }

    #ability_treepane > div > div:first-child { padding-top: 13px; }
    .hvut-ab-warn { display: block; margin-top: -6px; }
    .hvut-ab-warn::before { content: attr(data-warn); display: inline-block; margin-bottom: 2px; padding: 1px 3px; border-radius: 2px; background-color: var(--color-font-highlight); color: var(--color-font-invert); font-size: 9pt; }

    .hvut-ab-calc { display: flex; position: absolute; top: 27px; left: 0; width: 100%; height: 675px; justify-content: center; align-items: center; background-color: var(--color-bg-default); z-index: 9; font-size: 10pt; text-align: left; }
    .hvut-ab-calc > div { margin: 0 10px; height: 616px; }
    .hvut-ab-calc > div:nth-child(3) { overflow: hidden scroll; }
    .hvut-ab-icon { display: inline-block; position: relative; width: 30px; margin: 2px; height: 32px; vertical-align: middle; background-position-y: -2px; cursor: default; }
    .hvut-ab-off { filter: grayscale(100%); box-shadow: 0 0 0 20px var(--color-bg-alpha) inset; }
    .hvut-ab-off:hover { filter: none; }
    .hvut-ab-point { position: absolute; top: 0; right: 0; width: 14px; padding: 1px; text-align: center; background-color: var(--color-ab-max); color: var(--color-ab-font); font-size: 9pt; }
    .hvut-ab-tooltip { visibility: hidden; position: absolute; bottom: 32px; left: 0; padding: 0 3px; border: 1px solid var(--color-border-default); background-color: var(--color-bg-light); font-size: 9pt; line-height: 16px; white-space: nowrap; z-index: 1; pointer-events: none; }
    .hvut-ab-icon:hover > .hvut-ab-tooltip { visibility: visible; }

    .hvut-ab-side { position: static; }
    .hvut-ab-ul { width: 450px; margin: 0; padding: 0; border: 1px solid var(--color-border-default); list-style: none; }
    .hvut-ab-ul > li { padding: 2px; border-bottom: 1px solid var(--color-border-default); }
    .hvut-ab-ul > li:last-child { border-bottom: 0; }
    .hvut-ab-category { display: inline-block; width: 130px; margin-left: 10px; font-weight: bold; vertical-align: middle; }
    .hvut-ab-ul .hvut-ab-icon { cursor: pointer; }
    .hvut-ab-table { table-layout: fixed; border-collapse: separate; border-spacing: 0; position: relative; width: 400px; text-align: right; }
    .hvut-ab-table thead td { position: sticky; top: 0; height: 36px; border-top-width: 1px; font-weight: bold; text-align: center; background-color: var(--color-bg-h1); z-index: 1; }
    .hvut-ab-table td { border-width: 0 1px 1px 0; border-style: solid; border-color: var(--color-border-default); padding: 2px 5px; }
    .hvut-ab-table td:nth-child(1) { border-left-width: 1px; }
    .hvut-ab-table td:nth-child(2) { width: 50px; }
    .hvut-ab-table td:nth-child(3) { width: 50px; }
    .hvut-ab-table td:nth-child(4) { width: 204px; text-align: left; }
    .hvut-ab-table .hvut-ab-icon:nth-child(n+7) { margin-top: 7px; }
    .hvut-ab-nolevel { background-color: var(--color-bg-h1); }
    .hvut-ab-noab > span { color: var(--color-font-invalid); }
  `);

  _ab.init();
} else
// [END 3] Character - Abilities */


//* [4] Character - Training
if (_query.s === 'Character' && _query.ss === 'tr') {
  _tr.node = {};
  _tr.json = $config.get('tr_notif', {}, 'hvut_');
  _tr.level = {};
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

  _tr.init = function () {
    _tr.node.div = $element('div', [$id('train_outer'), 'afterbegin'], ['!margin: 5px;' + ($config.settings.trainingNotification ? '' : ' display: none;')]);
    _tr.node.select = $input(['select', [':Plan Training...']], _tr.node.div, null, { change: () => { _tr.change(_tr.node.select.value); } });
    _tr.node.level = $input('number', _tr.node.div, { disabled: true, style: 'width: 30px; text-align: right;' }, { input: () => { _tr.calc(); } });
    $input(['button', '设定'], _tr.node.div, null, () => { _tr.set(true); });
    _tr.node.cost = $input('text', _tr.node.div, { readOnly: true, style: 'width: 90px; text-align: right;' });
    $input(['button', '取消规划'], _tr.node.div, null, () => { _tr.cancel(true); });

    if ($id('train_progress')) {
      confirm_event($qs('img[src$="/canceltrain.png"]'), 'click', '你确定要取消当前的训练计划吗?', null, _tr.cancel);
    }

    $id('train_table').addEventListener('click', _tr.click);

    if (_tr.parse_table() === false) return false;
    if (_tr.parse_progress() === false) return false;
    return true;
  };

  _tr.parse_table = function () {
    let total_spent = 0;
    let parseFailed = false;
    Array.from($id('train_table').rows).forEach((tr, i) => {
      if (i === 0) {
        $element('th', tr);
        $element('th', tr, ['/<div class="fc2 fac fcb"><div>Spent Credits</div></div>']);
        return;
      }
      const row = parse_hvut_training_row(tr, 'trainingTableRow');
      if (row === null) {
        parseFailed = true;
        return;
      }
      const { name, enName, time, level, max } = row;
      _tr.level[enName] = level; // tr_level 键英文(消费侧 $config.get('tr_level')['Assimilator'] 用英文读)

      const training = _tr.data[enName];
      if (!training) {
        return;
      }
      training.time = time;
      training.level = level;
      training.max = max;
      if (training.time) {
        tr.classList.add('hvut-cphu');
        tr.dataset.action = 'change';
        tr.dataset.name = enName; // 英文(click→change→_tr.data[name] 链全英文)
        $element('option', _tr.node.select, { text: name, value: enName }); // 显示中文 name, value 英文逻辑键
      }

      let spent = 0;
      for (let i = 0; i < level; i++) {
        spent += Math.round(Math.pow(training.b + training.l * i, 1 + training.e * i));
      }
      total_spent += spent;
      $element('td', tr, [`/<div class="fc4 far fcb"><div>${spent.toLocaleString()}</div></div>`]);
    });
    if (parseFailed) return false;
    $element('tr', $id('train_table').tBodies[0], [`/<td colspan="9"><div class="fc4 far fcb"><div>Total ${total_spent.toLocaleString()}</div></div></td>`]);
    if (!$config.set('tr_level', _tr.level)) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    return true;
  };

  _tr.parse_progress = function () {
    const _curEl = $qs('#train_progress > div:nth-child(2) > :first-child');
    _tr.current = _curEl ? (resolveEn(_curEl, 'trains') ?? _curEl.textContent) : undefined; // 英文逻辑 key(与 _tr.data 一致)
    if (_tr.current && _tr.data[_tr.current]) {
      const current_end = parse_hvut_training_end_time(_window.end_time, 'trainingPageWindowEndTime');
      if (current_end === null) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      _tr.json.current_name = _tr.current;
      _tr.json.current_level = _tr.data[_tr.current].level;
      _tr.json.current_end = current_end;
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
    if (!$config.set('tr_notif', _tr.json, 'hvut_')) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    return true;
  };

  GM_addStyle(/*css*/`
    #train_table td:last-child { width: 100px; padding-right: 10px; }
    #train_table tr:last-child > td { font-weight: bold; }
  `);

  bindTr(_tr, { config: $config }); // _tr 5 方法收口公共区 bindTr($config 依赖注入); version-diff 留本 IIFE
  _tr.init();
} else
// [END 4] Character - Training */


//* [5] Character - Item Inventory
if (_query.s === 'Character' && _query.ss === 'it') {
  _it.init();
} else
// [END 5] Character - Item Inventory */


//* [6] Character - Settings
if (_query.s === 'Character' && _query.ss === 'se') {
  _se.node = { buttons: {} };
  _se.form = $qs('#settings_outer form');
  _se.json = $config.get('se_settings', {});

  _se.init = function () {
    _se.node.div = $element('div', _se.form, ['.hvut-se-div'], (e) => { _se.click(e); });
    $input(['button', '保存当前配置'], _se.node.div, { dataset: { action: 'save' }, style: 'margin-bottom: 15px;' });
    $element('br', _se.node.div);
    Object.keys(_se.json).forEach((p) => { _se.add(p); });

    _se.form.elements.fontlocal.required = true;
    _se.form.elements.fontface.required = true;
    _se.form.elements.fontsize.required = true;
    _se.form.elements.fontface.placeholder = 'Tahoma, Arial';
    _se.form.elements.fontsize.placeholder = '10';
    _se.form.elements.fontoff.placeholder = '0';

    _se.sort();
  };

  _se.sort = function () {
    Array.from(_se.form.elements).forEach((e) => {
      if (e.nodeName === 'SELECT') {
        const value = e.value;
        const options = Array.from(e.options);
        options.sort((a, b) => { let av = a.value; let bv = b.value; if (av && !isNaN(av) && bv && !isNaN(bv)) { av = Number(av); bv = Number(bv); } return (av > bv ? 1 : -1); });
        e.append(...options);
        e.value = value;
      }
    });
  };

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
    _se.node.buttons[name] = $input(['button', name], _se.node.div, { dataset: { action: 'load', key: name }, className: 'hvut-se-button' });
    $input(['button', 'x'], _se.node.div, { dataset: { action: 'remove', key: name }, className: 'hvut-se-remove' });
  };

  _se.remove = function (name) {
    const removed = _se.json[name];
    delete _se.json[name];
    if (!$config.set('se_settings', _se.json)) {
      _se.json[name] = removed;
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    _se.node.buttons[name].nextElementSibling.remove();
    _se.node.buttons[name].remove();
    return true;
  };

  _se.save = function () {
    const name = prompt('Enter the name of the settings')?.trim();
    if (!name) {
      return;
    }
    const form = new FormData(_se.form);
    const json = Object.fromEntries(form.entries());
    const exists = Object.prototype.hasOwnProperty.call(_se.json, name);
    const previous = _se.json[name];
    _se.json[name] = json;
    if (!$config.set('se_settings', _se.json)) {
      if (exists) {
        _se.json[name] = previous;
      } else {
        delete _se.json[name];
      }
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    if (!exists) {
      _se.add(name);
    }
    return true;
  };

  _se.load = function (name) {
    const json = _se.json[name];
    Array.from(_se.form.elements).forEach((e) => {
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

  GM_addStyle(/*css*/`
    .hvut-se-div { margin-top: 20px; padding: 20px 0; border-top: 3px double var(--color-border-default); text-align: left; }
    .hvut-se-div .hvut-se-button { min-width: 50px; margin: 0 30px 10px 10px; }
    .hvut-se-div .hvut-se-remove { visibility: hidden; width: 22px; margin-left: -30px; }
    .hvut-se-button:hover + .hvut-se-remove, .hvut-se-remove:hover { visibility: visible; }
  `);

  _se.init();
} else
// [END 6] Character - Settings */


//* [7] Bazaar - Item Shop
if (_query.s === 'Bazaar' && _query.ss === 'is') {
  _is.init = function () {
    $qsa('#item_pane .itemlist tr').forEach((tr) => {
      const div = tr.cells[0].firstElementChild;
      const type = $item.get_type(div.getAttribute('onmouseover'));
      tr.classList.add(`hvut-item-${type}`);
    });
    $qsa('#shop_pane .itemlist tr').forEach((tr) => {
      const div = tr.cells[0].firstElementChild;
      const type = $item.get_type(div.getAttribute('onmouseover'));
      tr.classList.add(`hvut-item-${type}`);
    });
  };

  GM_addStyle(/*css*/`
    .itshop_pane .cspp { margin-top: 15px; overflow-y: scroll; }
    #itshop_outer .itemlist td:nth-child(1) { width: 285px !important; }
    #itshop_outer .itemlist td:nth-child(2) { width: 75px !important; }
  `);

  _is.init();
} else
// [END 7] Bazaar - Item Shop */


//* [8] Bazaar - The Shrine
if (_query.s === 'Bazaar' && _query.ss === 'ss') {
  _ss.node = {};
  _ss.equip = { capacity: null, usage: null, requests: 0, received: 0, sold: 0, salvaged: 0, total: null };

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
      'Peerless', 'Legendary', 'Magnificent', 'Exquisite', 'Superior', '平均', 'Fair', 'Crude',
      { name: 'Pouches', match: /Charm Pouch$/ }, { name: 'Charms', match: /Charm$/ },
      { name: '3x High-Grade Materials', match: /3x High-Grade/ }, { name: '2x High-Grade Materials', match: /2x High-Grade/ }, { name: '1x High-Grade Materials', match: /1x High-Grade/ },
      { name: 'Bindings', match: /Binding of/ },
    ],
    groups: [
      /Mithril Charm Pouch/, /Kevlar Charm Pouch/, /Silk Charm Pouch/,
      /Greater .* Charm/, /Lesser .* Charm/,
      /High-Grade Cloth/, /High-Grade Leather/, /High-Grade Metal/, /High-Grade Wood/,
      /Strength/, /Dexterity/, /Agility/, /Endurance/, /Intelligence/, /Wisdom/,
      /Vigor/, /Finesse/, /Swiftness/, /Fortitude/, /Cunning/, /Knowledge/, /Flames/, /Frost/, /Lightning/, /Tempest/, /Devotion/, /Corruption/,
    ],
  };

  _ss.init = function () {
    $id('inv_item').addEventListener('click', _ss.click);
    $id('accept_equip').addEventListener('click', _ss.click);

    _ss.node.side = $element('div', $id('shrine_outer'), ['.hvut-side hvut-ss-side']);
    toggle_button($input('button', _ss.node.side), '过滤: 开', '过滤: 关', $id('inv_item'), 'hvut-none-cont', 'on');
    $input(['button', '祭坛收获'], _ss.node.side, null, () => { _ss.offer.toggle(); });
    $input(['button', '祭坛日志'], _ss.node.side, null, () => { _ss.log.toggle(); });
    $input(['button', '重置日志'], _ss.node.side, null, () => { _ss.log.reset(); });
    $input(['button', '过滤规则'], _ss.node.side, null, () => { $config.open('shrineHideItems'); });

    _ss.node.log = $element('div', $id('shrine_outer'), ['.hvut-ss-log hvut-none']);
    _ss.node.results = $element('div', $id('shrine_outer'), ['.hvut-ss-results hvut-none']);
    _ss.node.results_buttons = $element('div', _ss.node.results, ['!margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--color-border-default); text-align: center;']);
    _ss.node.results_equip = $input(['button', '仓库容量'], _ss.node.results_buttons, ['!width: 450px;']);

    _ss.node.trophies = $input('button', $id('shrine_trophy'), ['!margin: 5px;'], () => { _ss.show_trophies(); });
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
    node: {},
    reward_type: '',
    reward_slot: '',

    init: function () {
      $qsa('#accept_equip input[type="submit"]').forEach((s) => {
        const reward = parse_hvut_shrine_reward_selection(s, 'rewardSelectButton');
        if (reward === null) {
          s.disabled = true;
          return;
        }
        const { type, slot } = reward;
        s.dataset.action = 'select';
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
      let gindex = glist.findIndex((e) => e.test(name)) + 1;
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
        const itemData = parse_hvut_shrine_offer_item(div, 'offerItemRow');
        if (itemData === null) {
          tr.classList.add('hvut-warn');
          return;
        }
        const { iid, stock, bulk } = itemData;
        const max = Math.floor(stock / bulk);
        const item = { logname: name, name, type, iid, stock, bulk, max, requests: 0, total: 0, rewards: {}, node: {} };
        _ss.offer.items[iid] = item;

        div.classList.add(`hvut-item-${type}`);
        item.node.stock = tr.cells[1];
        item.node.bulk = $element('td', tr);
        item.node.max = $element('td', tr);
        const td = $element('td', tr);
        item.node.count = $input('text', td);
        item.node.button = $input(['button', '献祭'], td, { dataset: { action: 'offer', iid: iid, count: 'input' } });

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
              item.logname = `Trophy Tier ${t}`;
            }
          }
          item.node.bulk.textContent = ` / ${item.bulk}`;
          item.node.max.textContent = item.max;
          $input(['button', '所有'], td, { dataset: { action: 'offer', iid: iid, count: 'max' } });
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
    request: async function (iid, count, reward_type, reward_slot) {
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
        if (_ss.error) break;
        if (reserve_hvut_shrine_offer(_ss, item) === false) break;
        const offered = await _ss.offer.load(iid, reward_type, reward_slot);
        if (offered === false) {
          rollback_hvut_shrine_offer_reservation(_ss, item);
          break;
        }
        if (_ss.error) break;
      }
    },
    load: async function (iid, reward_type, reward_slot) {
      if (_ss.error) return false;
      let html;
      try {
        html = await $ajax.fetch(create_hvut_shrine_url(), `select_item=${iid}&select_reward_type=${reward_type}&select_reward_slot=${reward_slot}`);
      } catch (error) {
        const evidence = record_hvut_shrine_offer_failure('offerLoadFetch', { iid: iid, reward_type: reward_type, reward_slot: reward_slot, error: error?.message || String(error) });
        set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.', evidence);
        return false;
      }
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
      const item = _ss.offer.items[iid];
      const list = [];
      const equips = [];
      const offerResponse = classify_hvut_shrine_offer_response(doc, 'offerEmptyResponse');
      if (offerResponse.kind === 'stop') {
        set_hvut_shrine_stop_error(_ss, offerResponse.message, offerResponse.evidence);
        return false;
      }

      const offerSummary = summarize_hvut_shrine_offer_messages(offerResponse.messages);
      if (offerSummary.kind === 'stop') {
        set_hvut_shrine_stop_error(_ss, offerSummary.message, offerSummary.evidence);
        return false;
      }
      offerSummary.vouchers.forEach((msg) => {
        popup(`<p style="color: #e00; font-weight: bold;">${msg}</p>`);
      });
      list.push(...offerSummary.qualities, ...offerSummary.rewards);
      equips.push(...offerSummary.equips);
      _ss.equip.received += offerSummary.equips.length;
      _ss.equip.sold += offerSummary.sold;
      _ss.equip.salvaged += offerSummary.salvaged;
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
        const total = update_hvut_shrine_equip_total(_ss.equip, 'usage');
        _ss.node.results_equip.value = total === null
          ? 'Inventory Capacity: unavailable'
          : `Inventory Capacity: ${_ss.equip.total} / ${_ss.equip.capacity}` + (_ss.equip.sold ? `, Sold: ${_ss.equip.sold}` : '') + (_ss.equip.salvaged ? `, Salvaged: ${_ss.equip.salvaged}` : '');
        if (is_hvut_shrine_equip_capacity_full(_ss.equip)) {
          const evidence = record_hvut_shrine_offer_failure('offerEquipmentCapacityFull', { total: _ss.equip.total, capacity: _ss.equip.capacity });
          set_hvut_shrine_stop_error(_ss, '你的装备库存已满', evidence);
        }
        equips.forEach((equip) => {
          _ss.list.equip(item, equip);
        });
      }

      if (item.total % 10 === 0 || item.total === item.requests || _ss.error) {
        if (_ss.log.save() === false) return false;
      }
      return true;
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
      if (!$config.set('ss_log', _ss.log.json)) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      return true;
    },
    reset: function () {
      if (confirm('此浏览器中的当前赛季的邮件记录将被删除.\nAre you sure?')) {
        if (!$config.del('ss_log')) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        reloadCurrentPage(hvutReloadReason('HV_UTILS_MAIL_LOG_RESET'));
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
    _ss.node.trophies.value = `You have ${_ss.trophies_value.toLocaleString()} credits worth of trophies in the inventory.`;
  };

  _ss.show_trophies = function () {
    popup_text(_ss.trophies_text, 600, 250);
  };

  _ss.load_inventory = function () {
    $ajax.fetch(create_hvut_armory_organize_url()).then((html) => {
      const capacity = parse_hvut_inventory_capacity(html, 'shrineInventoryCapacity');
      if (capacity === null) {
        _ss.node.results_equip.value = 'Inventory Capacity: unavailable';
        return;
      }
      _ss.equip.usage = capacity.usage;
      _ss.equip.capacity = capacity.capacity;
      _ss.node.results_equip.value = `Inventory Capacity: ${_ss.equip.usage} / ${_ss.equip.capacity}`;
    }).catch(() => {
      record_hvut_shrine_capacity_failure('shrineInventoryCapacityFetch', { reason: 'requestFailed' });
      _ss.node.results_equip.value = 'Inventory Capacity: unavailable';
    });
  };

  GM_addStyle(/*css*/`
    #shrine_outer { position: relative; width: 1066px; margin-left: 130px; }
    #shrine_left { width: 562px; }
    #shrine_left .cspp { overflow-y: scroll; }

    #shrine_left .itemlist td:nth-child(1) { width: 230px !important; }
    #shrine_left .itemlist td:nth-child(2) { width: 60px; }
    #shrine_left .itemlist td:nth-child(3) { width: 30px; padding-left: 5px; text-align: left; font-size: 8pt; color: var(--color-font-light); }
    #shrine_left .itemlist td:nth-child(4) { width: 50px; }
    #shrine_left .itemlist td:nth-child(5) { width: 148px; padding-left: 5px; text-align: left; }
    #shrine_left .itemlist input { margin: 0 1px; }
    #shrine_left .itemlist input:nth-child(1) { width: 40px; text-align: right; }
    #shrine_left .itemlist input:nth-child(2) { width: 50px; }
    #shrine_left .itemlist input:nth-child(3) { width: 40px; }

    .hvut-ss-side { top: 33px; left: -110px; }
    .hvut-ss-log { position: absolute; top: 33px; left: 0; width: 540px; height: 550px; margin: 0; padding: 10px; border: 1px solid var(--color-border-default); text-align: left; overflow-y: scroll; background-color: var(--color-bg-default); }
    .hvut-ss-results { position: absolute; top: 33px; left: 572px; width: 472px; height: 550px; margin: 0; padding: 10px; border: 1px solid var(--color-border-default); text-align: left; overflow-y: scroll; background-color: var(--color-bg-default); }

    .hvut-ss-table { width: stretch; margin: 20px 10px; border: 1px solid var(--color-border-default); font-size: 10pt; }
    .hvut-ss-table th { padding: 5px 10px; font-weight: bold; background-color: var(--color-bg-h2); }
    .hvut-ss-table td { padding: 2px 10px; }
    .hvut-ss-table td:nth-child(1) { width: 60px; text-align: right; color: var(--color-font-light); }
    .hvut-ss-table td:nth-child(2) { width: 50px; text-align: right; }
    .hvut-ss-table tr:first-child { border-bottom: 1px solid var(--color-border-default); }
    .hvut-ss-table tr.hvut-ss-group { border-top: 1px solid var(--color-border-default); }
    .hvut-ss-groupitem { color: var(--color-font-invalid); }
    .hvut-ss-equip { color: var(--color-font-light); }

    .hvut-ss-selected:not([disabled]) { color: var(--color-font-highlight) !important; border-color: var(--color-font-highlight) !important; outline: 1px solid; }
  `);

  _ss.init();
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

  _mk.items = $qsa('#market_itemlist td:first-child').map((td) => td.textContent);

  _mk.init = function () {
    _mk.table_init();

    const side = $element('div', $id('market_left').lastElementChild, ['.hvut-side hvut-mk-side']);
    $input(['button', '设为买价'], side, null, () => { _mk.price_save('bid'); });
    $input(['button', '设为卖价'], side, null, () => { _mk.price_save('ask'); });
    $input(['button', '编辑价格'], side, null, () => { _mk.price_edit(); });

    $id('account_amount').autocomplete = 'off';
  };

  _mk.table_init = function () {
    if (!$qs('#market_itemlist table')) {
      return;
    }
    if ($price.parse_market(_query.filter) === false) return;
    Array.from($qs('#market_itemlist table').rows).forEach((tr, i) => {
      if (i === 0) {
        $element('th', tr, '插件参考价');
        return;
      }
      const name = tr.cells[0].textContent;
      const td = $element('td', tr);
      $price.market[name].td = td;
    });
    _mk.price_update();
    _mk.order_check();
    _mk.click_linkify();
    _mk.add_crystalpack();
  };

  _mk.price_update = function () {
    const prices = $price.get();
    _mk.items.forEach((name) => {
      $price.market[name].td.textContent = prices[name] || '';
    });
  };

  _mk.order_check = function () {
    let td_index;
    if (_query.screen === 'buyorders') {
      td_index = 4;
    } else if (_query.screen === 'sellorders') {
      td_index = 5;
    } else {
      return;
    }
    Array.from($qs('#market_itemlist table').rows).slice(1).forEach((tr) => {
      const mybid = tr.cells[3].textContent;
      const marketbid = tr.cells[td_index].textContent;
      if (mybid !== marketbid) {
        tr.cells[3].classList.add('hvut-warn');
        tr.cells[td_index].classList.add('hvut-warn');
      }
    });
  };

  _mk.click_linkify = function () {
    Array.from($qs('#market_itemlist table').rows).forEach((tr) => {
      const onclick = tr.getAttribute('onclick');
      if (!onclick) {
        return;
      }
      const href = parse_hvut_price_market_click_href(onclick, 'marketClickHref');
      if (href === false) {
        return;
      }
      $element('a', tr.cells[0], { href });
      tr.removeAttribute('onclick');
    });
  };

  _mk.add_crystalpack = function () {
    if (_query.screen !== 'browseitems' || _query.filter !== 'mo') {
      return;
    }
    const crystals = ['Crystal of Vigor', 'Crystal of Finesse', 'Crystal of Swiftness', 'Crystal of Fortitude', 'Crystal of Cunning', 'Crystal of Knowledge', 'Crystal of Flames', 'Crystal of Frost', 'Crystal of Lightning', 'Crystal of Tempest', 'Crystal of Devotion', 'Crystal of Corruption'];
    const bid = crystals.reduce((s, e) => s + $price.market[e].bid * 1000, 0);
    const ask = crystals.reduce((s, e) => s + $price.market[e].ask * 1000, 0);
    $element('tr', [$qs('#market_itemlist table').rows[0], 'afterend'], [`/<td>Crystal Pack</td><td></td><td>${bid} C</td><td>${ask} C</td><td></td><td></td>`]);
  };

  _mk.price_edit = function () {
    $price.edit(_mk.items, _query.filter, _mk.price_update);
  };

  _mk.price_save = function (key) {
    $price.set_market(_mk.items, key);
    _mk.price_update();
  };

  GM_addStyle(/*css*/`
    #market_itemlist th { z-index: 1; }
    #market_itemlist tr { position: relative; }
    #market_itemlist td a { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

    .hvut-mk-side { bottom: 20px; left: 32px; }
  `);

  _mk.init();
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
      .hvut-ml-sort > span { display: inline-block; margin: 0 5px; padding: 2px 0; border: 1px solid var(--color-border-default); box-sizing: border-box; }
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

      .hvut-ml-new { background-color: var(--color-bg-h1); }
      .hvut-ml-wins::after { content: '最后更新日期: ' attr(data-update); position: absolute; top: 2px; right: 615px; border: 1px solid var(--color-border-default); padding: 2px 4px; line-height: 16px; background-color: var(--color-bg-h1); visibility: hidden; }
      .hvut-ml-wins:hover::after { visibility: visible; }
      .hvut-ml-outdated { color: var(--color-font-highlight); }
      .hvut-ml-gains > span { display: inline-block; width: 25px; line-height: 22px; border-radius: 2px; background-color: var(--color-bg-invert); color: var(--color-font-invert); }
      .hvut-ml-gains > ul { visibility: hidden; position: absolute; top: 2px; right: 515px; margin: 0; padding: 5px 10px; border: 1px solid var(--color-border-default); list-style: none; font-size: 9pt; line-height: 20px; white-space: nowrap; background-color: var(--color-bg-default); z-index: 3; }
      .hvut-ml-gains:hover > ul { visibility: visible; }
      #slot_pane > div:nth-of-type(n+15):nth-last-of-type(-n+5) > .hvut-ml-gains > ul { top: auto; bottom: 2px; }
      .msn { height: auto; }
      .hvut-ml-feed { position: absolute; top: 5px; left: 62px; width: 124px; height: 12px; font-size: 8pt; line-height: 12px; }
      div:hover > .hvut-ml-feed { background-color: var(--color-bg-alpha); }

      .hvut-ml-summary { position: absolute; top: 38px; left: 10px; max-height: 500px; min-width: 400px; margin: 0; padding: 10px; overflow: auto; border: 1px solid var(--color-border-default); list-style: none; background-color: var(--color-bg-default); font-size: 9pt; line-height: 20px; text-align: left; white-space: nowrap; z-index: 1; }
      .hvut-ml-summary > li:first-child { margin-bottom: 5px; font-weight: bold; }
      .hvut-ml-summary > li { margin: 0 5px; }
      .hvut-ml-log { position: absolute; top: 38px; left: 610px; margin: 0; padding: 10px; width: 460px; height: 560px; column-count: 2; column-gap: 10px; border: 1px solid var(--color-border-default); list-style: none; background-color: var(--color-bg-default); font-size: 9pt; line-height: 16px; text-align: left; white-space: nowrap; z-index: 2; }
      .hvut-ml-log > li { overflow: hidden; text-overflow: ellipsis; }
      .hvut-ml-log > li:nth-child(-n+3) { column-span: all; font-weight: bold; }
      .hvut-ml-log > li:nth-child(3) { margin-bottom: 16px; }
      .hvut-ml-margin { margin-top: 16px !important; }
      .hvut-ml-break { break-after: column; }

      .hvut-ml-up { position: absolute; top: 27px; left: 0; width: 100%; height: 675px; z-index: 9; background-color: var(--color-bg-default); font-size: 10pt; text-align: left; }
      .hvut-ml-up-list { height: 493px; margin: 20px 10px 10px; overflow-y: scroll; }
      .hvut-ml-up-table { table-layout: fixed; border-collapse: separate; border-spacing: 0 3px; margin: -3px auto; width: 1180px; line-height: 24px; text-align: center; white-space: nowrap; user-select: none; }
      .hvut-ml-up-table td { width: 24px; padding: 0; border-width: 1px 0; border-style: solid; border-color: var(--color-border-default); }
      .hvut-ml-up-table tr:first-child td { position: sticky; top: 0; font-size: 8pt; background-color: var(--color-bg-h1); }
      .hvut-ml-up-table tr:hover td { background-color: var(--color-bg-h1); }
      .hvut-ml-up-table tr td:hover { background-color: var(--color-bg-light); }
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
      .hvut-ml-up-change { color: var(--color-font-highlight); }
      .hvut-ml-up-table td[data-desc]::after { content: attr(data-desc); visibility: hidden; position: absolute; top: 24px; left: -1px; white-space: nowrap; padding: 2px 10px; background-color: var(--color-bg-light); border: 1px solid var(--color-border-default); z-index: 1; }
      .hvut-ml-up-table td[data-desc]:nth-last-child(-n+13)::after { left: auto; right: -1px; }
      .hvut-ml-up-table td[data-desc]:hover::after { visibility: visible; }

      .hvut-ml-up-bottom { margin: 10px; }
      .hvut-ml-up-bottom > ul { float: left; margin: 0 5px; padding: 5px; list-style: none; border: 1px solid var(--color-border-default); }
      .hvut-ml-up-bottom li { margin: 5px; }
      .hvut-ml-up-bottom li::after { content: ''; display: block; clear: both; }
      .hvut-ml-up-bottom li.hvut-ml-up-nostock { color: var(--color-font-highlight); }
      .hvut-ml-up-bottom li > span { float: left; text-align: right; }
      .hvut-ml-up-crystal span:nth-child(1) { width: 70px; }
      .hvut-ml-up-crystal span:nth-child(2) { width: 90px; }
      .hvut-ml-up-crystal span:nth-child(3) { width: 100px; }
      .hvut-ml-up-crystal span:nth-child(4) { width: 90px; }
      .hvut-ml-up-token span:nth-child(1) { width: 130px; }
      .hvut-ml-up-token span:nth-child(2) { width: 70px; }
      .hvut-ml-up-buttons { float: right; width: 100px; display: flex; flex-direction: column; }
      .hvut-ml-up-buttons input { margin: 3px 0; }

      .hvut-ml-plc { display: flex; position: absolute; top: 27px; left: 0; width: 100%; height: 675px; justify-content: center; align-items: center; z-index: 9; background-color: var(--color-bg-default); font-size: 10pt; text-align: left; white-space: nowrap; }
      .hvut-ml-plc-right { height: 635px; margin-left: 20px; }
      .hvut-ml-plc-buttons { display: flex; flex-wrap: wrap; justify-content: space-between; width: 250px; }
      .hvut-ml-plc-buttons input { margin: 0 0 4px; }
      .hvut-ml-plc-buttons input:nth-child(-n+3) { width: 32%; }
      .hvut-ml-plc-buttons input:nth-child(4) { width: 100%; margin-top: 16px; }
      .hvut-ml-plc-buttons input:nth-child(n+5) { width: 24%; }
      .hvut-ml-plc-table { table-layout: fixed; border-collapse: collapse; margin-top: 20px; width: 480px; }
      .hvut-ml-plc-table tr:first-child { font-weight: bold; }
      .hvut-ml-plc-table td { border: 1px solid var(--color-border-default); padding: 2px 5px; }
      .hvut-ml-plc-table td:first-child { width: 40px; text-align: right; }
      .hvut-ml-plc-left { width: 600px; height: 530px; margin-top: 105px; overflow: auto; line-height: 26px; }
      .hvut-ml-plc-left > div { display: flex; width: 572px; margin: 5px 0; padding: 5px 0; border: 1px solid var(--color-border-default); }
      .hvut-ml-plc-left > div:first-child { position: absolute; margin-top: -105px; outline: 1px solid; }
      .hvut-ml-plc-left > div > div { width: 240px; padding: 5px; border-left: 1px solid var(--color-border-default); }
      .hvut-ml-plc-left > div > div:first-child { width: 60px; border-left: 0; }
      .hvut-ml-plc-left input[type='number'] { width: 30px; text-align: right; }
      .hvut-ml-plc-del { width: 22px; margin: 0 10px 0 0 !important; }
      .hvut-ml-plc-btn { display: inline-block; width: 140px; text-align: center; }
      .hvut-ml-plc-btn > span { display: inline-block; width: 18px; line-height: 18px; border: 1px solid var(--color-border-default); margin: 0 1px; text-align: center; background-color: var(--color-bg-light); border-radius: 3px; cursor: default; }
      .hvut-ml-plc-btn > input { width: 25px; padding: 2px 0; border-width: 1px; border-radius: 0; }
      .hvut-ml-plc-btn > .hvut-ml-plc-up { background-color: var(--color-bg-h1); }
      .hvut-ml-plc-crystal { display: inline-block; width: 95px; text-align: right; }
    `);

    _ml.materials = ['Low-Grade Cloth', 'Mid-Grade Cloth', 'High-Grade Cloth', 'Low-Grade Leather', 'Mid-Grade Leather', 'High-Grade Leather', 'Low-Grade Metals', 'Mid-Grade Metals', 'High-Grade Metals', 'Low-Grade Wood', 'Mid-Grade Wood', 'High-Grade Wood', 'Crystallized Phazon', 'Shade Fragment', 'Repurposed Actuator', 'Defense Matrix Modulator', 'Binding of Slaughter', 'Binding of Balance', 'Binding of Isaac', 'Binding of Destruction', 'Binding of Focus', 'Binding of Friendship', 'Binding of Protection', 'Binding of Warding', 'Binding of the Fleet', 'Binding of the Barrier', 'Binding of the Nimble', 'Binding of Negation', 'Binding of the Elementalist', 'Binding of the Heaven-sent', 'Binding of the Demon-fiend', 'Binding of the Curse-weaver', 'Binding of the Earth-walker', 'Binding of Surtr', 'Binding of Niflheim', 'Binding of Mjolnir', 'Binding of Freyr', 'Binding of Heimdall', 'Binding of Fenrir', 'Binding of Dampening', 'Binding of Stoneskin', 'Binding of Deflection', 'Binding of the Fire-eater', 'Binding of the Frost-born', 'Binding of the Thunder-child', 'Binding of the Wind-waker', 'Binding of the Thrice-blessed', 'Binding of the Spirit-ward', 'Binding of the Ox', 'Binding of the Raccoon', 'Binding of the Cheetah', 'Binding of the Turtle', 'Binding of the Fox', 'Binding of the Owl'];
    _ml.mobs = [];
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

      if (!$config.set('ml_log', _ml.log)) {
        return false;
      }
      return true;
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

      init: function () {
        $id('monster_list').addEventListener('click', _ml.main.click, true);
        $id('monster_list').addEventListener('mouseover', _ml.main.mouseover);
        $id('monster_list').addEventListener('mouseout', _ml.main.mouseout);

        const sort_div = $element('div', [$id('slot_pane'), 'beforebegin'], ['.hvut-ml-sort hvut-cphu-sub']);
        _ml.main.node.sort = {
          index: $element('span', sort_div, [{ textContent: '编号' }, '!width: 30px;', { dataset: { action: 'sort', key: 'index' } }]),
          name: $element('span', sort_div, ['名称', '!width: 210px;', { dataset: { action: 'sort', key: 'name' } }]),
          class: $element('span', sort_div, ['类型', '!width: 70px;', { dataset: { action: 'sort', key: 'class' } }]),
          pl: $element('span', sort_div, ['战力', '!width: 40px;', { dataset: { action: 'sort', key: 'pl' } }]),
          wins: $element('span', sort_div, ['胜场', '!width: 40px;', { dataset: { action: 'sort', key: 'wins' } }]),
          kills: $element('span', sort_div, ['击杀', '!width: 40px;', { dataset: { action: 'sort', key: 'kills' } }]),
          gains: $element('span', sort_div, ['礼物', '!width: 25px;', { dataset: { action: 'sort', key: 'gains' } }]),
          gifts: $element('span', sort_div, ['合计礼物', '!width: 50px;', { dataset: { action: 'sort', key: 'gifts' } }]),
          morale: $element('span', sort_div, ['士气', '!width: 200px;', { dataset: { action: 'sort', key: 'morale' } }]),
          hunger: $element('span', sort_div, ['饥饿度', '!width: 200px;', { dataset: { action: 'sort', key: 'hunger' } }]),
        };

        if ($config.settings.monsterLabDefaultSort === 'index') {
          _ml.main.sort.key = 'index';
          _ml.main.sort.order = 1;
          _ml.main.node.sort.index.classList.add('hvut-ml-sort-current');
        } else {
          _ml.main.sort($config.settings.monsterLabDefaultSort);
        }

        const side_div = $element('div', $id('monster_outer'), ['.hvut-side hvut-ml-side']);
        $input(['button', '礼物清单'], side_div, null, () => { _ml.main.toggle_summary(); });
        $input(['button', '日志'], side_div, null, () => { _ml.main.toggle_log(-1); });
        $input(['button', '重置日志'], side_div, null, () => { _ml.main.reset_log(); });
        $input(['button', '物品价格'], side_div, ['.hvut-side-margin'], () => { $price.edit('Materials', 'ma', _ml.main.edit_price); });
        $input(['button', '更新击杀与胜场'], side_div, null, () => { _ml.main.feedall(); });
        $input(['button', '怪物升级器'], side_div, { id: 'hvut-ml-up-button' }, () => { _ml.upgrade.toggle(); });
        $input(['button', '战力计算器'], side_div, null, () => { _ml.plc.toggle(); });

        if ($config.settings.monsterLabCloseDefaultPopup) {
          $id('messagebox_outer')?.classList.add('hvut-none');
        }
      },
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
      parse: function () {
        const now = Date.now();
        let parseFailed = false;
        _ml.mobs[-1] = { log: { date: now, gifts: (new Array(54)).fill(0) }, node: {} };

        $qsa('#slot_pane > div').forEach((div, i) => {
          if (parseFailed) return;
          const index = i + 1;
          if (div.getAttribute('onclick').includes('&create=new')) {
            _ml.log[index] = null;
            return;
          }

          let log = _ml.log[index];
          if (!log) {
            log = { date: now, update: 0, pl: null, wins: 0, kills: 0, pa: [], er: [], ct: [], gifts: [] };
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

          const surface = parse_hvut_monster_lab_main_surface(div, 'mainMonsterSurface');
          if (surface === null) {
            parseFailed = true;
            return;
          }
          mob.name = surface.name;
          mob.class = surface.className;
          mob.pl = surface.pl;
          surface.plNode.textContent = mob.pl;
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

          const hungerdiv = surface.hungerdiv;
          const moralediv = surface.moralediv;
          hungerdiv.dataset.action = 'hunger';
          hungerdiv.dataset.index = index;
          moralediv.dataset.action = 'morale';
          moralediv.dataset.index = index;

          mob.node.hungerbar = surface.hungerbar;
          mob.node.moralebar = surface.moralebar;
          mob.hunger = surface.hunger;
          mob.morale = surface.morale;
          mob.node.hunger = $element('div', hungerdiv.firstElementChild, [mob.hunger, '.hvut-ml-feed']);
          mob.node.morale = $element('div', moralediv.firstElementChild, [mob.morale, '.hvut-ml-feed']);
          mob.node.wins = $element('div', div, ['.hvut-ml-wins', { dataset: { action: 'update', index } }]);
          mob.node.gains = $element('div', div, ['.hvut-ml-gains']);
          mob.node.gifts = $element('div', div, { dataset: { action: 'log', index } });

          if (mob.log.update) {
            mob.node.wins.textContent = `${mob.wins} / ${mob.kills}`;
            mob.node.wins.dataset.update = new Date(mob.log.update).toLocaleDateString();
            if (mob.log.update < now - (1000 * 60 * 60 * 24 * 7)) {
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
            gains.forEach((item) => {
              $element('li', ul, item);
              mob.log.gifts[_ml.materials.indexOf(item)]++;
            });
          }

          for (let i = 0; i < 54; i++) {
            _ml.mobs[-1].log.gifts[i] += mob.log.gifts[i];
          }
          mob.gifts = mob.log.gifts.reduce((s, e) => (s + e), 0);
          mob.node.gifts.textContent = mob.gifts;
        });
        if (parseFailed) return false;

        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        return true;
      },
      sort: function (key) {
        if (!['index', '姓名', '类型', '战力', 'wins', 'kills', 'gains', 'gifts', '士气', 'hunger'].includes(key)) {
          return;
        }
        let order = ['战力', 'wins', 'kills', 'gains', 'gifts'].includes(key) ? -1 : 1;
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
          const empty = $qsa('#slot_pane > div[onclick*="&create=new"]')
            .map((div) => parse_hvut_monster_lab_empty_slot(div, 'emptyMonsterSlot'))
            .filter((slot) => slot !== null);
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
        const html = await $ajax.fetch(create_hvut_monster_lab_slot_url(mob), food ? `food_action=${food}` : '');
        const doc = $doc(html);
        _ml.main.onsuccess(index, doc);
        //_ml.main.onerror(index);
      },
      feedall: function (stat, value, food) {
        _ml.mobs.forEach((mob) => { _ml.main.feed(mob.index, (!value || value >= mob[stat]) ? food : null); });
      },
      onsuccess: function (index, doc) {
        const mob = _ml.mobs[index];
        if (_ml.parse(mob, doc) === false) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.main.onerror(index);
          return false;
        }
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
        mob.node.wins.textContent = '失败';
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
      parse_summary: function () {
        if (!$id('messagebox_outer')) {
          return;
        }
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
        gains.forEach((item) => {
          if (!summary[item]) {
            summary[item] = 0;
          }
          summary[item]++;
        });
        const income = $price.value(summary);
        if (!_ml.main.node.summary) {
          _ml.main.node.summary = $element('ul', $id('monster_outer'), ['.hvut-ml-summary']);
        }
        _ml.main.node.summary.innerHTML = '';
        $element('li', _ml.main.node.summary, `${mobs.length} monster(s) brought you ${gains.length} gift(s), ${_ml.price2str(income)} credits`);
        _ml.materials.forEach((item) => {
          if (summary[item]) {
            $element('li', _ml.main.node.summary, `${summary[item]} x ${item}`);
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
        const days = (Date.now() - date) / (1000 * 60 * 60 * 24);
        const count = mob.log.gifts.reduce((s, e) => (s + e), 0);
        const summary = {};
        _ml.materials.forEach((item, i) => {
          const li = $element('li', mob.node.log, `${mob.log.gifts[i]} x ${item}`);
          if (i === 12 || i === 16 || i === 22 || i === 28 || i === 33 || i === 39 || i === 42 || i === 48) {
            li.classList.add('hvut-ml-margin');
          }
          if (i === 27) {
            li.classList.add('hvut-ml-break');
          }
          summary[item] = mob.log.gifts[i];
        });
        const income = $price.value(summary);

        mob.node.log.prepend(
          $element('li', null, `For ${Math.round(days * 10) / 10} days / Since ${(new Date(date)).toLocaleString()}`),
          $element('li', null, `- Total: ${count} gift(s), ${_ml.price2str(income)} credits`),
          $element('li', null, `- Daily: ${Math.round(count / days * 10) / 10} gift(s), ${_ml.price2str(income / days)} credits`)
        );
      },
      reset_log: function () {
        if (confirm('本浏览器中的怪物实验室日志将被删除。\n确定吗？')) {
          if (!$config.del('ml_log')) {
            alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
            return false;
          }
          reloadCurrentPage(hvutReloadReason('HV_UTILS_MONSTER_LAB_LOG_RESET'));
        }
      },
    };

    _ml.main.init();
    if (_ml.main.parse() === false) {
      return false;
    }
    _ml.main.make_summary();

    // Monster Upgrader
    _ml.upgrade = {
      node: {},
      pa: [
        { query: 'pa_str', text: '力量', crystal: 'Crystal of Vigor' },
        { query: 'pa_dex', text: '灵巧', crystal: 'Crystal of Finesse' },
        { query: 'pa_agi', text: '敏捷', crystal: 'Crystal of Swiftness' },
        { query: 'pa_end', text: '体质', crystal: 'Crystal of Fortitude' },
        { query: 'pa_int', text: '智力', crystal: 'Crystal of Cunning' },
        { query: 'pa_wis', text: '智慧', crystal: 'Crystal of Knowledge' },
      ],
      er: [
        { query: 'er_fire', text: '火焰', crystal: 'Crystal of Flames' },
        { query: 'er_cold', text: '冰冷', crystal: 'Crystal of Frost' },
        { query: 'er_elec', text: '闪电', crystal: 'Crystal of Lightning' },
        { query: 'er_wind', text: '疾风', crystal: 'Crystal of Tempest' },
        { query: 'er_holy', text: '神圣', crystal: 'Crystal of Devotion' },
        { query: 'er_dark', text: '黑暗', crystal: 'Crystal of Corruption' },
      ],
      ct: [
        { query: 'affect', text: '寻宝', desc: '增加送礼概率倍率 2.5%' },
        { query: 'health', text: '刚毅', desc: '增加怪物生命值 5%' },
        { query: 'damage', text: '蛮横', desc: '增加怪物伤害力 2.5%' },
        { query: 'accur', text: '命中', desc: '增加怪物命中率 5%' },
        { query: 'cevbl', text: '精密', desc: '减少目标有效闪避/格挡率 1%' },
        { query: 'cpare', text: '压制', desc: '减少目标有效招架/抵抗率 1%' },
        { query: 'parry', text: '拦截', desc: '增加怪物拦截率 0.5%' },
        { query: 'resist', text: '弥散', desc: '增加怪物抵抗率 0.5%' },
        { query: 'evade', text: '闪避', desc: '增加怪物闪避率 0.5%' },
        { query: 'phymit', text: '防御', desc: '增加怪物物理减伤 1%' },
        { query: 'magmit', text: '魔防', desc: '增加怪物魔法减伤 1%' },
        { query: 'atkspd', text: '迅捷', desc: '增加怪物攻击速度 2.5%' },
      ],
      pa_pl: [0],
      er_pl: [0],
      pa_crystal: [0],
      er_crystal: [0],
      pa_morale: [0],
      er_morale: [0],

      init: async function () {
        if (_ml.upgrade.inited) {
          return;
        }
        _ml.upgrade.inited = true;

        _ml.upgrade.node.button = $id('hvut-ml-up-button');
        _ml.upgrade.node.button.disabled = true;
        if ((await $item.once()) === false) {
          return false;
        }
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
        $element('td', thead, { textContent: '编号', dataset: { action: 'sort', key: 'index' } });
        $element('td', thead, ['姓名', { dataset: { action: 'sort', key: 'name' } }]);
        $element('td', thead, ['类型', { dataset: { action: 'sort', key: 'class' } }]);
        $element('td', thead, ['战力', { dataset: { action: 'sort', key: 'pl' } }]);
        $element('td', thead, ['士气', { dataset: { action: 'sort', key: 'morale' } }]);
        $element('td', thead, ['*', { dataset: { action: 'reset', index: 'all', desc: '全部重置' } }]);

        $element('td', thead, ['礼物', { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: 'all', desc: '所有主属性强化提升1级，右键降低' } }]);
        $element('td', thead, ['=', { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: 'equal', desc: '均衡提升强化等级' } }]);
        _ml.upgrade.pa.forEach((pa, i) => { $element('td', thead, [pa.text.toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: i, desc: pa.crystal } }]); });

        $element('td', thead, ['礼物', { dataset: { action: 'upgrade', index: 'all', type: 'er', item: 'all', desc: '所有元素减伤强化提升1级，右键降低' } }]);
        $element('td', thead, ['=', { dataset: { action: 'upgrade', index: 'all', type: 'er', item: 'equal', desc: '均衡提升强化等级' } }]);
        _ml.upgrade.er.forEach((er, i) => { $element('td', thead, [er.text.toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'er', item: i, desc: er.crystal } }]); });

        $element('td', thead, ['礼物', { dataset: { action: 'upgrade', index: 'all', type: 'ct', item: 'all', desc: '所有混沌强化提升1级，右键降低' } }]);
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
        $input(['button', '恢复'], buttons, null, () => { _ml.upgrade.load(); });
        _ml.upgrade.node.update = $input(['button', '更新数据'], buttons, null, () => { _ml.upgrade.force_update(); });
        _ml.upgrade.node.run = $input(['button', '执行升级'], buttons, null, () => { _ml.upgrade.run(); });
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
        const ct_next = parse_hvut_monster_lab_chaos_token_cost($id('monster_actions').textContent, 'upgradeChaosTokenCost');
        if (ct_next === null) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.button.disabled = false;
          _ml.upgrade.inited = false;
          return false;
        }
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

          $element('td', tr, ['礼物', { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: 'all' } }]);
          $element('td', tr, ['=', { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: 'equal' } }]);
          mob.pa.forEach((e, i) => {
            e.node = $element('td', tr, [e.value, { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: i } }]);
            e.to = e.value;
            e.used = _ml.upgrade.pa_crystal[e.value];
            _ml.upgrade.pa[i].used += e.used;
            e.require = 0;
          });

          $element('td', tr, ['礼物', { dataset: { action: 'upgrade', index: mob.index, type: 'er', item: 'all' } }]);
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
          $element('td', tr, ['礼物', { dataset: { action: 'upgrade', index: mob.index, type: 'ct', item: 'all' } }]);
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
      update: async function () {
        const mobs = _ml.mobs.filter((mob) => mob.update_needed);
        const total = mobs.length;
        if (!total) {
          return;
        }

        _ml.upgrade.node.button.disabled = true;
        _ml.upgrade.node.button.value = '更新数据中...';
        if (_ml.upgrade.node.run) {
          _ml.upgrade.node.run.disabled = true;
          _ml.upgrade.node.run.value = '更新数据中...';
        }

        async function update(mob) {
          const html = await $ajax.fetch(create_hvut_monster_lab_slot_url(mob));
          const doc = $doc(html);
          done++;
          mob.update_needed = false;
          if (_ml.parse(mob, doc) === false) {
            throw new Error('ml_log persistence failed');
          }
          _ml.upgrade.node.button.value = `Updating... (${done}/${total})`;
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.value = `${done}/${total}`;
          }
        }

        let done = 0;
        const requests = mobs.map((mob) => update(mob));
        try {
          await Promise.all(requests);
        } catch (error) {
          record_hvut_monster_lab_upgrade_failure('upgradeUpdateRequest', { total: total, done: done, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.button.disabled = false;
          _ml.upgrade.node.button.value = '怪物升级器';
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.disabled = false;
            _ml.upgrade.node.run.value = '失败';
          }
          return false;
        }

        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.button.disabled = false;
          _ml.upgrade.node.button.value = '怪物升级器';
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.disabled = false;
            _ml.upgrade.node.run.value = '失败';
          }
          return false;
        }
        _ml.upgrade.node.button.disabled = false;
        _ml.upgrade.node.button.value = '怪物升级器';
        if (_ml.upgrade.node.run) {
          _ml.upgrade.node.run.value = '完成';
        }
        return true;
      },
      force_update: function () {
        _ml.mobs.forEach((mob) => {
          mob.log.pl = -1;
        });
        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        reloadCurrentPage(hvutReloadReason('HV_UTILS_MONSTER_LAB_FORCE_UPDATE'));
      },
      sort: function (key) {
        if (!['index', '姓名', '类型', '战力', 'wins', 'kills', 'gains', 'gifts', '士气', 'hunger'].includes(key)) {
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
          alert('水晶或混沌令牌不足');
          return;
        }
        if (!confirm('确定要升级所选的怪物吗？')) {
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
              urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.pa[i].query}&crystal_count=10`]);
              count -= 10;
            }
            urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.pa[i].query}&crystal_count=${count}`]);
          });
          mob.er.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.er[i].query}&crystal_count=10`]);
              count -= 10;
            }
            urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.er[i].query}&crystal_count=${count}`]);
          });
          mob.ct.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([create_hvut_monster_lab_slot_url(mob), `chaos_upgrade=${_ml.upgrade.ct[i].query}&chaos_count=10`]);
              count -= 10;
            }
            urls.push([create_hvut_monster_lab_slot_url(mob), `chaos_upgrade=${_ml.upgrade.ct[i].query}&chaos_count=${count}`]);
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
        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        _ml.upgrade.node.run.disabled = true;
        _ml.upgrade.node.update.disabled = true;

        async function upgrade(url, post) {
          const html = await $ajax.fetch(url, post);
          const response = classify_hvut_monster_lab_upgrade_response(html, 'upgradeRunEmptyResponse', { url: url, post: post });
          if (response.kind === 'rejected') {
            throw new Error('monster lab upgrade response unavailable');
          }
          done++;
          _ml.upgrade.node.run.value = `${done}/${total}`;
        }

        let done = 0;
        const requests = urls.map(([url, post]) => upgrade(url, post));
        try {
          await Promise.all(requests);
        } catch (error) {
          record_hvut_monster_lab_upgrade_failure('upgradeRunRequest', { total: total, done: done, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.run.disabled = false;
          _ml.upgrade.node.update.disabled = false;
          _ml.upgrade.node.run.value = '失败';
          return false;
        }
        return _ml.upgrade.update();
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

        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        return true;
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
      node: {},
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
          $element('span', null, '怪物数量'), $element('br'), $element('br'),
          node.count = $input('number', null, { min: 0, max: 200, readOnly: true })
        );
        $element('div', total).append(
          $element('span', null, '主属性'), $element('br'),
          $element('span', null, ['所需水晶', '.hvut-ml-plc-btn']),
          node.pa_total = $element('span', null, ['.hvut-ml-plc-crystal']), $element('br'),
          $element('span', null, ['差额', '.hvut-ml-plc-btn']),
          node.pa_total_diff = $element('span', null, ['.hvut-ml-plc-crystal'])
        );
        $element('div', total).append(
          $element('span', null, '属性减伤'), $element('br'),
          $element('span', null, ['所需水晶', '.hvut-ml-plc-btn']),
          node.er_total = $element('span', null, ['.hvut-ml-plc-crystal']), $element('br'),
          $element('span', null, ['差额', '.hvut-ml-plc-btn']),
          node.er_total_diff = $element('span', null, ['.hvut-ml-plc-crystal'])
        );

        node.right = $element('div', node.div, ['.hvut-ml-plc-right']);

        const buttons = $element('div', node.right, ['.hvut-ml-plc-buttons']);
        $input(['button', '保存'], buttons, null, () => { _ml.plc.save(); });
        $input(['button', '恢复'], buttons, null, () => { _ml.plc.load(); });
        $input(['button', '关闭'], buttons, null, () => { _ml.plc.toggle(); });
        $input(['button', '添加怪物'], buttons, { dataset: { action: 'add' } });
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
      save: function () {
        if (!$config.set('ml_plc', _ml.plc.list.filter((m) => m).map((m) => m.json))) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        _ml.plc.load();
        return true;
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
        $element('span', sub, '主属性');
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
        $element('span', sub, '属性减伤');
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
          let lv = m.json[`${type}_lv`];
          let up = m.json[`${type}_up`];
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
          m.json[`${type}_lv`] = lv;
          m.json[`${type}_up`] = up;
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

  _mm.dts = function (date, year = 2) { // date_to_string
    const d = new Date(date * 1000);
    const yy = d.getFullYear().toString().slice(-year);
    const MM = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const HH = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${yy}-${MM}-${dd} ${HH}:${mm}`;
  };

  // MM WRITE
  if (_query.filter === 'new' && _query.hvut !== 'disabled') {
    if ($id('mmail_attachremove')) {
      alert('请移除附加的物品。');
      openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE'));
      return;
    }

    _mm.write = {
      node: {},

      init: function () {
        _mm.mmtoken = $id('mailform').elements.mmtoken.value;

        _mm.write.node.field = $element('fieldset', $id('mmail_outer'), ['.hvut-mm-field']);
        _mm.write.node.left = $element('div', _mm.write.node.field, ['.hvut-mm-left']);

        $input(['button', '发送'], _mm.write.node.left, { tabIndex: 4, style: 'width: 60px; height: 52px; margin-top: 4px;' }, () => { _mm.write.pack(); });
        $element('span', _mm.write.node.left, ['收件人:', '!width: 60px;']);
        _mm.write.node.to_name = $input('text', _mm.write.node.left, { value: $id('mailform').elements.message_to_name.value || '', tabIndex: 1, style: 'width: 360px; font-weight: bold;' });
        $input(['button', '编辑列表'], _mm.write.node.left, { style: 'width: 80px;' }, () => { _mm.userlist.popup(); });
        $element('span', _mm.write.node.left, ['主题:', '!width: 60px;']);
        _mm.write.node.subject = $input('text', _mm.write.node.left, { value: $id('mailform').elements.message_subject.value || '', tabIndex: 2, style: 'width: 450px; font-weight: bold;' });

        _mm.write.node.to_name.setAttribute('list', 'hvut-mm-userlist');
        _mm.write.node.to_name.focus();
        _mm.write.node.userlist = $element('datalist', _mm.write.node.left, ['#hvut-mm-userlist']);
        _mm.userlist.create();

        $element('span', _mm.write.node.left, ['可选项:', '!width: 60px;']);
        _mm.write.node.cod_deduction = $input(['text', null, 'CoD抵扣额'], _mm.write.node.left, { pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?', style: 'width: 60px; text-align: right;' }, { input: (e) => { _mm.write.calc(e); } });
        if (IS_ISEKAI) {
          _mm.write.node.cod_persistent = $input(['checkbox', null, '永久区货到付款'], _mm.write.node.left, { checked: true });
        }

        _mm.write.node.body = $element('textarea', _mm.write.node.left, { value: $id('mailform').elements.message_body.value || '', tabIndex: 3, spellcheck: false, style: 'width: 580px; height: 250px; margin-top: 10px;' });
        _mm.write.node.log = $element('textarea', _mm.write.node.left, { readOnly: true, spellcheck: false, style: 'width: 480px; height: 200px; color: unset;' });
        $mail.log = _mm.write.log;

        const attach_div = $element('div', _mm.write.node.left, ['.hvut-mm-attachtext']);
        $input(['button', '从文本添加'], attach_div);
        $input(['button', '可用格式范例'], attach_div, null, () => { popup_text('100 x Health Potion @ 10\n(200) Mana Potion @ 90\nSpirit Potion @ 90 x 300\nLast Elixir @ 1.5k (100)', 300, 100); });
        $input(['button', '清除文本'], attach_div, null, () => { _mm.item.text(); });
        $input(['button', '添加附件'], attach_div, null, () => { _mm.item.text(true); });
        $input(['button', '重置搜索框'], attach_div, null, () => { _mm.item.search('', true); });

        _mm.write.node.right = $element('div', _mm.write.node.field, ['.hvut-mm-right']);
        _mm.write.node.tabs = $element('div', _mm.write.node.right, ['.hvut-mm-tabs']);
        $input(['button', '使用原版邮箱'], _mm.write.node.tabs, null, () => { openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE')); });
      },
      calc: function () {
        const queue = [].concat(_mm.credits.list, _mm.equip.list, _mm.item.list).filter((e) => e.node.check.checked && e.data.count);
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
          const cod_deduction = _mm.parse_price(_mm.write.node.cod_deduction.value);
          if (cod_deduction) {
            const cod = cod_total - cod_deduction;
            atext += `\nDeduction: -${cod_deduction.toLocaleString()} Credits`;
            atext += `\nCoD: ${cod.toLocaleString()} Credits`;
            if (cod < 10) {
              atext += '\n=> 货到付款：0 Credits';
            }
          }
        }
        _mm.write.log(atext, true);
      },
      pack: function (e) {
        if (_mm.write.pack.current) {
          popup('正在处理其他请求...');
          return;
        }

        let selected;
        if (!e) {
          selected = [].concat(_mm.credits.list, _mm.equip.list, _mm.item.list).filter((e) => e.node.check.checked && e.data.count);
        } else if (Array.isArray(e)) {
          selected = e;
        } else if (e.data) {
          selected = [e];
          e.data.atext = _mm.attach_text(e);
        } else {
          return;
        }
        if (selected.some((e) => e.data.pane === 'equip' && e.info.protected)) {
          if (!confirm('确定要附上受保护的装备吗？')) {
            return;
          }
        }
        if (selected.some((e) => e.data.count > e.data.stock)) {
          alert('Insufficient number of items');
          return;
        }
        if (!_mm.write.node.to_name.value) {
          alert('没有收件人');
          return;
        }
        _mm.write.pack.current = true;
        _mm.write.node.field.disabled = true;
        const stop = function () {
          _mm.write.pack.current = false;
          _mm.write.node.field.disabled = false;
          return false;
        };
        _mm.userlist.add(_mm.write.node.to_name.value);

        const attach = selected.map((e) => e.data);
        const mail = {
          to_name: _mm.write.node.to_name.value,
          subject: _mm.write.node.subject.value,
          body: _mm.write.node.body.value,
          attach,
          cod_deduction: _mm.parse_price(_mm.write.node.cod_deduction.value),
          cod_persistent: IS_ISEKAI && _mm.write.node.cod_persistent.checked,
        };
        $mail.request(mail).finally(stop);
      },
      log: function (text, clear) {
        if (clear) {
          _mm.write.node.log.value = '';
        }
        _mm.write.node.log.value += text + '\n';
        _mm.write.node.log.scrollTop = _mm.write.node.log.scrollHeight;
      },
      toggle: function (panel) {
        const prev = _mm.write.toggle.current;
        if (panel === prev) {
          return;
        }
        if (prev) {
          _mm[prev].node.div.classList.add('hvut-none');
        }
        _mm.write.toggle.current = panel;
        _mm[panel].node.div.classList.remove('hvut-none');
      },
    };

    _mm.userlist = {
      list: $config.get('mm_userlist', []),

      create: function () {
        _mm.write.node.userlist.innerHTML = '';
        _mm.userlist.list.forEach((u) => { $element('option', _mm.write.node.userlist, { value: u }); });
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
        if (!$config.set('mm_userlist', _mm.userlist.list)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        if (_mm.write.node.userlist) {
          _mm.userlist.create();
        }
        return true;
      },
      popup: function () {
        popup_text(_mm.userlist.list.join('\n'), 300, 300, [
          { text: '保存', click: (p) => {
            _mm.userlist.list = p.textarea.value.split('\n');
            if (_mm.userlist.save() === false) return;
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

      .hvut-mm-left > span, .hvut-mm-left > label { display: inline-block; line-height: 22px; }
      .hvut-mm-left > span { text-align: right; }
      .hvut-mm-left > label { margin-right: 10px; }
      .hvut-mm-left > :first-child { float: right; }
      .hvut-mm-attachtext { float: right; width: 90px; margin: 2px 5px; display: flex; flex-direction: column; }
      .hvut-mm-attachtext input { margin: 3px 0; white-space: normal; }

      .hvut-mm-tabs { padding: 10px; border-bottom: 3px double var(--color-border-default); display: flex; line-height: 16px; font-weight: bold; }
      .hvut-mm-tabs input { padding: 2px 5px; border-width: 1px; border-radius: 0; }
      .hvut-mm-tabs input:first-child { order: 1; margin-left: auto; }
      .hvut-mm-attach-menu { margin-bottom: 10px; padding: 5px 0; border-bottom: 3px double var(--color-border-default); line-height: 30px; }
      .hvut-mm-disabled { padding: 10px; font-weight: bold; }

      .hvut-mm-attach { height: 475px; overflow-y: scroll; }
      .hvut-mm-attach .itemlist td:nth-child(1) { width: 175px !important; }
      .hvut-mm-attach .itemlist td:nth-child(2) { width: 75px; padding-right: 5px; }
      .hvut-mm-attach .itemlist td:nth-child(3) { width: auto; }
      .hvut-mm-attach .itemlist-credits td:nth-child(1) { width: 100px !important; }
      .hvut-mm-attach .itemlist-credits td:nth-child(2) { width: 145px }
      .hvut-mm-attach input { margin: 0 1px; }
      .hvut-mm-attach input:invalid, .hvut-mm-invalid { color: var(--color-font-warn) !important; }
      .hvut-mm-count { width: 50px; text-align: right; }
      .hvut-mm-price { width: 50px; text-align: right; }
      .hvut-mm-cod { width: 70px; text-align: right; }
      .hvut-mm-send { width: 40px; }
      .hvut-mm-sub { position: absolute; right: 0; z-index: 1; }
      .hvut-mm-eid { visibility: hidden; position: absolute; right: 125px; padding: 0 3px !important; border: 1px solid var(--color-border-default); line-height: 20px; background-color: var(--color-bg-light); }
      .eqp:hover .hvut-mm-eid { visibility: visible; }
    `);

    _mm.write.init();

    // MM item
    _mm.item = {
      node: {},
      list: [],

      init: function () {
        _mm.item.node.div = $element('div', null, ['.hvut-none']);
        _mm.item.node.menu = $element('div', _mm.item.node.div, ['.hvut-mm-attach-menu']);
        $input(['button', '所有'], _mm.item.node.menu, null, () => { _mm.item.search(''); });
        $price.init();
        Object.keys($price.groups).forEach((g) => {
          $input(['button', g], _mm.item.node.menu, null, () => { _mm.item.search($price.groups[g]); });
        });
        $element('br', _mm.item.node.menu);
        _mm.item.node.search = $input('text', _mm.item.node.menu, { placeholder: '搜索框', style: 'width: 170px;' }, { input: (e) => { _mm.item.search(e.target.value); }, keyup: (e) => { if (e.key === 'Escape') { _mm.item.search('', true); } } });
        $input(['button', '清除'], _mm.item.node.menu, null, () => { _mm.item.search('', true); });
        $input('checkbox', _mm.item.node.menu, { style: 'margin-left: 20px;' }, (e) => { _mm.item.all(e.target.checked); });
        $input('text', _mm.item.node.menu, { placeholder: '数量', style: 'width: 50px; text-align: right;' }, { input: (e) => { _mm.item.count(e.target.value); } });
        $input(['button', '所有'], _mm.item.node.menu, null, () => { _mm.item.count(Infinity); });
        $input(['button', '0'], _mm.item.node.menu, null, () => { _mm.item.count(0); });

        _mm.item.node.attach = $element('div', _mm.item.node.div, ['#item', '.hvut-mm-attach'], { input: (e) => { _mm.item.change(e); }, click: (e) => { _mm.item.click(e); } });
        _mm.item.node.list = $qs('.itemlist') || $element('table');
        _mm.item.node.attach.appendChild(_mm.item.node.list);

        _mm.item.list = Array.from(_mm.item.node.list.rows).map((tr) => {
          const div = tr.cells[0].firstElementChild;
          const name = div.textContent;
          const type = $item.get_type(div.getAttribute('onmouseover'));
          const { iid } = $item.get_data(div.getAttribute('onclick'));
          const lowercase = name.toLowerCase();
          const stock = parseInt(tr.cells[1].textContent);
          return { info: { name, lowercase, iid, type }, data: { pane: 'item', id: iid, name, stock, count: 0, price: 0, cod: 0 }, node: { tr } };
        });
        _mm.item.list.forEach((it) => {
          it.visible = true;
          it.node.tr.classList.add(`hvut-item-${it.info.type}`);
          it.node.td = $element('td', it.node.tr);
          it.node.check = $input('checkbox', it.node.td, { dataset: { action: 'calc', iid: it.info.iid } });
          it.node.count = $input('text', it.node.td, { dataset: { action: 'calc', iid: it.info.iid }, className: 'hvut-mm-count', placeholder: '数量', pattern: '\\d+|\\d{1,3}(,\\d{3})*', max: it.data.stock });
          it.node.price = $input('text', it.node.td, { dataset: { action: 'calc', iid: it.info.iid }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
          it.node.cod = $input('text', it.node.td, { className: 'hvut-mm-cod', placeholder: '货到付款额', readOnly: true });
          it.node.send = $input(['button', '发送'], it.node.td, { dataset: { action: 'send', iid: it.info.iid }, className: 'hvut-mm-send' });
        });

        if ($id('mmail_attachitem')) {
          $id('item').id += '_';
          $input(['button', '物品'], _mm.write.node.tabs, null, () => { _mm.write.toggle('item'); });
          _mm.write.node.right.appendChild(_mm.item.node.div);
        }
      },
      change: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, iid } = target.dataset;
        const it = iid && _mm.item.list.find((it) => it.info.iid == iid);
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
          _mm.write.calc();
        }
      },
      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, iid } = target.dataset;
        const it = iid && _mm.item.list.find((it) => it.info.iid == iid);
        if (action === 'send') {
          _mm.write.pack(it);
        }
      },
      set: function (it, count, price) {
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
      },
      count: function (num) {
        if (num !== Infinity) {
          num = parseInt(num);
          if (!Number.isInteger(num)) {
            return;
          }
        }
        _mm.item.list.forEach((it) => {
          if (it.node.check.checked) {
            _mm.item.set(it, (num === Infinity) ? it.data.stock : num);
          }
        });
        _mm.write.calc();
      },
      all: function (checked) {
        _mm.item.list.forEach((it) => {
          if (it.visible) {
            it.node.check.checked = checked;
            it.data.atext = _mm.attach_text(it);
          }
        });
        _mm.write.calc();
      },
      search: function (value, set) {
        if (typeof value === 'string') {
          if (set) {
            _mm.item.node.search.value = value;
          } else {
            value = value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',');
            if (value === _mm.item.search.value) {
              return;
            }
          }
        }

        let results;
        if (!value) {
          results = _mm.item.list;
        } else if (typeof value === 'string') {
          value = value.split(',').map((v) => v.split(' '));
          results = _mm.item.list.filter((e) => {
            const lowercase = e.info.lowercase;
            return e.node.check.checked || value.some((v) => v.every((s) => s && lowercase.includes(s)));
          });
        } else { // array
          results = _mm.item.list.filter((e) => {
            if (value.includes(e.info.name)) {
              return true;
            } else if (e.node.check.checked) {
              return true;
            } else {
              return false;
            }
          });
        }
        _mm.item.list.forEach((e) => { e.visible = false; });
        results.forEach((e) => { e.visible = true; });
        _mm.item.list.forEach((e) => {
          if (e.visible) {
            e.node.tr.classList.remove('hvut-none');
          } else {
            e.node.tr.classList.add('hvut-none');
          }
        });
      },
      text: function (attach) {
        const text = _mm.write.node.body.value.split('\n');
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
          _mm.item.list.forEach((it) => {
            const lowercase = it.info.lowercase;
            const textitem = textdata[lowercase];
            if (textitem) {
              _mm.item.set(it, textitem.count, textitem.price);
              it.visible = true;
              it.node.check.checked = true;
              it.node.tr.classList.remove('hvut-none');
            } else if (it.visible && !it.node.check.checked) {
              it.visible = false;
              it.node.tr.classList.add('hvut-none');
            }
          });
          _mm.write.calc();
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
          _mm.write.log(atext, true);
        }
      },
    };

    _mm.item.init();

    // MM equip
    _mm.equip = {
      node: {},
      list: [],

      init: function () {
        _mm.equip.node.div = $element('div', null, ['.hvut-none']);
        _mm.equip.node.menu = $element('div', _mm.equip.node.div, ['.hvut-mm-attach-menu']);
        _mm.equip.node.search = $input('text', _mm.equip.node.menu, { placeholder: '装备名称或eid', style: 'width: 310px;' }, { input: (e) => { _mm.equip.search(e.target.value); }, keyup: (e) => { if (e.key === 'Escape') { _mm.equip.search('', true); } } });
        $input(['button', 'Clear}'], _mm.equip.node.menu, null, () => { _mm.equip.search('', true); });
        $input('checkbox', _mm.equip.node.menu, { style: 'margin-left: 20px;' }, (e) => { _mm.equip.all(e.target.checked); });

        _mm.equip.node.attach = $element('div', _mm.equip.node.div, ['#mm_equip', '.hvut-mm-attach'], { input: (e) => { _mm.equip.change(e); }, click: (e) => { _mm.equip.click(e); } });
        _mm.equip.node.list = $qs('.equiplist') || $element('div', null, ['.equiplist nosel']);
        _mm.equip.node.attach.appendChild(_mm.equip.node.list);

        _mm.equip.data = $config.get('equipdata', {});
        _mm.equip.list = $equip.list.div(_mm.equip.node.list);
        _mm.equip.list.forEach((eq) => {
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
          eq.node.price = $input('text', eq.node.sub, { dataset: { action: 'calc', eid: eq.info.eid }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
          eq.node.send = $input(['button', '发送'], eq.node.sub, { dataset: { action: 'send', eid: eq.info.eid }, className: 'hvut-mm-send' });

          const json = _mm.equip.data[eq.info.eid];
          if (json?.price) {
            eq.node.price.value = json.price;
            eq.data.cod = _mm.parse_price(json.price);
          }
        });

        if ($id('mmail_attachequip')) {
          $id('mm_equip').id += '_';
          $input(['button', '装备'], _mm.write.node.tabs, null, () => { _mm.write.toggle('equip'); });
          _mm.write.node.right.appendChild(_mm.equip.node.div);
        }
      },
      change: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, eid } = target.dataset;
        const eq = eid && _mm.equip.list.find((eq) => eq.info.eid == eid);
        if (action === 'calc') {
          eq.data.cod = _mm.parse_price(eq.node.price.value);
          eq.data.atext = _mm.attach_text(eq);
          _mm.write.calc();
        }
      },
      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, eid } = target.dataset;
        const eq = eid && _mm.equip.list.find((eq) => eq.info.eid == eid);
        if (action === 'send') {
          _mm.write.pack(eq);
        }
      },
      all: function (checked) {
        _mm.equip.list.forEach((eq) => {
          if (eq.visible) {
            eq.node.check.checked = checked;
            eq.data.atext = _mm.attach_text(eq);
          }
        });
        _mm.write.calc();
      },
      search: function (value, set) {
        if (set) {
          _mm.equip.node.search.value = value;
        }
        value = value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',');
        if (value === _mm.equip.search.value) {
          return;
        }
        _mm.equip.search.value = value;

        let results;
        if (!value) {
          results = _mm.equip.list;
        } else {
          value = value.split(',').map((v) => v.split(' '));
          results = _mm.equip.list.filter((e) => {
            const lowercase = e.info.lowercase;
            const eid = e.info.eid ? e.info.eid.toString() : '';
            return e.node.check.checked || value.some((v) => v.every((s) => s && (lowercase.includes(s) || eid.includes(s))));
          });
        }
        _mm.equip.list.forEach((e) => { e.visible = false; });
        results.forEach((e) => { e.visible = true; });
        $equip.list.sort(results, _mm.equip.node.list);
      },
    };

    _mm.equip.init();

    // MM credits
    _mm.credits = {
      node: {},
      list: [],

      init: function () {
        const credits = { info: { name: 'Credits' }, data: { pane: 'credits', id: 0, name: 'Credits', stock: 0, count: 0, price: 0, cod: 0 }, node: {} };
        const hath = { info: { name: 'Hath' }, data: { pane: 'hath', id: 0, name: 'Hath', stock: 0, count: 0, price: 0, cod: 0 }, node: {} };
        if ($id('mmail_attachcredits')) {
          credits.data.stock = parse_hvut_mooglemail_count($id('mmail_attachcredits').textContent, /Current Funds: ([0-9,]+) Credits/, 'writeCreditsStock');
          if (credits.data.stock === null) return false;
        }
        if ($id('mmail_attachhath')) {
          hath.data.stock = parse_hvut_mooglemail_count($id('mmail_attachhath').textContent, /Current Funds: ([0-9,]+) Hath/, 'writeHathStock');
          if (hath.data.stock === null) return false;
        }

        _mm.credits.node.div = $element('div', null, ['.hvut-none']);
        _mm.credits.node.attach = $element('div', _mm.credits.node.div, ['.hvut-mm-attach'], { input: (e) => { _mm.credits.change(e); } });
        _mm.credits.node.list = $element('table', _mm.credits.node.attach, ['.itemlist itemlist-credits', '/<tbody></tbody>']);

        credits.node.tr = $element('tr', _mm.credits.node.list.tBodies[0]);
        $element('td', credits.node.tr, credits.info.name);
        $element('td', credits.node.tr, credits.data.stock.toLocaleString());
        credits.node.td = $element('td', credits.node.tr);
        credits.node.check = $input('checkbox', credits.node.td, { dataset: { action: 'calc', name: 'Credits' } });
        credits.node.count = $input('text', credits.node.td, { dataset: { action: 'calc', name: 'Credits' }, className: 'hvut-mm-count', placeholder: '数量', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
        credits.node.price = $input('text', credits.node.td, { dataset: { action: 'calc', name: 'Credits' }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?', style: 'visibility: hidden;' });
        credits.node.cod = $input('text', credits.node.td, { className: 'hvut-mm-cod', placeholder: '货到付款额', readOnly: true, style: 'visibility: hidden;' });

        hath.node.tr = $element('tr', _mm.credits.node.list.tBodies[0]);
        $element('td', hath.node.tr, hath.info.name);
        $element('td', hath.node.tr, hath.data.stock.toLocaleString());
        hath.node.td = $element('td', hath.node.tr);
        hath.node.check = $input('checkbox', hath.node.td, { dataset: { action: 'calc', name: 'Hath' } });
        hath.node.count = $input('text', hath.node.td, { dataset: { action: 'calc', name: 'Hath' }, className: 'hvut-mm-count', placeholder: '数量', pattern: '\\d+|\\d{1,3}(,\\d{3})*' });
        hath.node.price = $input('text', hath.node.td, { dataset: { action: 'calc', name: 'Hath' }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
        hath.node.cod = $input('text', hath.node.td, { className: 'hvut-mm-cod', placeholder: '货到付款额', readOnly: true });

        if ($id('mmail_attachcredits')) {
          _mm.credits.list.push(credits, hath);
          $input(['button', '信用点 / Hath'], _mm.write.node.tabs, null, () => { _mm.write.toggle('credits'); });
          _mm.write.node.right.appendChild(_mm.credits.node.div);
        }

        const multi_div = $element('div', _mm.credits.node.attach, ['!margin-top: 50px;']);
        $input(['button', '群发'], multi_div, { style: 'width: 150px; margin: 10px;' }, () => { _mm.credits.multi(); });
        $element('br', multi_div);
        _mm.credits.node.multi = $element('textarea', multi_div, { placeholder: '用户名; 信用点; 主题; 正文 (| = 换行)\n示例)\nsssss2; 10m\nsssss3; 500k; WTB; hi|I want to buy...\nTenboro; 500c\nMoogleMail; 1000h; Thanks', style: 'width: 500px; height: 300px;', spellcheck: false });
      },
      change: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, name } = target.dataset;
        const it = name && _mm.credits.list.find((it) => it.info.name === name);
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
          _mm.write.calc();
        }
      },
      multi: function () {
        if (_mm.credits.multi.current) {
          popup('正在处理其他请求...');
          return;
        }
        _mm.credits.multi.current = true;
        _mm.write.node.field.disabled = true;
        const stop = function () {
          _mm.credits.multi.current = false;
          _mm.write.node.field.disabled = false;
          return false;
        };

        const queue = [];
        const errors = [];
        let credits_funds = credits.data.stock;
        let hath_funds = hath.data.stock;
        _mm.credits.node.multi.value.split('\n').forEach((t) => {
          if (!t) {
            return;
          }
          const [to_name, ctext, subject, ...body] = t.split(';');
          if (!to_name) {
            errors.push('无收件人: ' + t);
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
            errors.push('无效的附件: ' + t);
            return;
          }

          const mail = {
            to_name,
            subject: subject.trim() || _mm.write.node.subject.value,
            body: body.length ? body.join(';').replace(/\|/g, '\n') : _mm.write.node.body.value,
            attach,
          };
          queue.push(mail);
        });
        if (errors.length) {
          alert(errors.join('\n'));
          return stop();
        }
        if (credits_funds < 0) {
          alert('Credits不足');
          return stop();
        }
        if (hath_funds < 0) {
          alert('Hath不足');
          return stop();
        }

        queue.forEach((mail) => $mail.request(mail));
        return stop();
      },
    };

    if (_mm.credits.init() === false) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }

    if (!['item', 'equip', 'credits'].some((panel) => { if (_mm[panel].node.div.parentNode) { _mm.write.toggle(panel); return true; } })) {
      $element('div', _mm.write.node.right, ['/' + $id('mmail_right').innerHTML, '.hvut-mm-disabled']);
      _mm.write.node.cod_deduction.disabled = true;
      if (IS_ISEKAI) {
        _mm.write.node.cod_persistent.disabled = true;
        _mm.write.node.cod_persistent.checked = false;
      }
    }

    // MM LIST
  } else if ($id('mmail_list')) {
    _mm.db = {
      version: 1,
      season: 'mm',
      node: {},

      init: function () {
        if (IS_ISEKAI) {
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
      search: function (param) {
        return run_hvut_mooglemail_db_search(param, {
          conn: _mm.db.conn,
          getMail: _mm.mail.get,
          failureStage: 'dbSearchReadFailed',
        });
      },
      export: function () {
        const stop = function () {
          if (_mm.db.node.export) {
            _mm.db.node.export.disabled = false;
          }
        };
        if (_mm.db.node.export) {
          _mm.db.node.export.disabled = true;
        }
        const json = [];
        const database = _mm.db.database.name;
        const stores = Array.from(_mm.db.database.objectStoreNames);
        let completed = stores.length;
        if (completed === 0) {
          stop();
          return;
        }
        stores.forEach((store) => {
          const values = [];
          const conn = _mm.db.conn('readonly', store);
          conn.tx.onerror = stop;
          conn.tx.onabort = stop;
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
                if (_mm.db.node.export) {
                  _mm.db.node.export.value = '完成';
                }
                popup(`<p>The file has been saved.</p><p style="font-weight: bold;">${download}</p>`);
                stop();
              }
            }
          };
        });
      },
      import: function () {
        const stop = function () {
          if (_mm.db.node.import) {
            _mm.db.node.import.disabled = false;
          }
        };
        const input = $input('file', null, { accept: '.json' }, { change: () => {
          const file = input.files[0];
          if (!file) {
            return;
          }
          if (_mm.db.node.import) {
            _mm.db.node.import.disabled = true;
          }
          const reader = new FileReader();
          reader.onload = function (e) {
            db_import(e.target.result);
          };
          reader.onerror = function () {
            alert('读取文件失败');
            stop();
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
            if (completed === 0) {
              stop();
              return;
            }

            function complete() {
              completed--;
              if (completed === 0) {
                if (_mm.db.node.import) {
                  _mm.db.node.import.value = '完成';
                }
                stop();
              }
            }

            json.forEach((obj) => {
              const { database, store, values } = obj;
              if (database !== dbname) {
                console.log('无效的数据库');
                complete();
                return;
              }
              if (!stores.includes(store)) {
                complete();
                console.log('无效的对象存储');
                return;
              }
              const conn = _mm.db.conn('readwrite', store);
              conn.tx.onerror = stop;
              conn.tx.onabort = stop;
              conn.tx.oncomplete = function () {
                complete();
              };
              values.forEach((data) => {
                conn.os.put(data);
              });
            });
          } catch (e) {
            alert('解析文件失败\n请选择一个有效的MoogleMail数据库json文件');
            stop();
            return;
          }
        }
      },
      clear: async function () {
        if (confirm('在此浏览器中选定赛季的MoogleMail记录将被删除。\n你确定吗？')) {
          const season = _mm.search.node.season?.value || _mm.db.season;
          const conn = _mm.db.conn('readwrite', season);
          const stage = 'dbClear';
          const detail = { season: season };
          try {
            conn.os.clear();
          } catch (error) {
            record_hvut_mooglemail_action_failure(stage, { ...detail, error: error?.message || String(error) });
            alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
            return false;
          }
          if (!await wait_hvut_mooglemail_db_write(stage, detail, conn)) {
            alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
            return false;
          }
          return true;
        }
        return false;
      },
      toggle: function () {
        if (_mm.db.node.div) {
          _mm.db.node.div.classList.toggle('hvut-none');
          return;
        }
        _mm.db.node.div = $element('div', _mm.page.node.bottom);
        $input(['button', '关闭'], _mm.db.node.div, null, () => { _mm.db.toggle(); });
        $input(['button', '重置数据库'], _mm.db.node.div, null, () => { _mm.db.clear(); });
        _mm.db.node.export = $input(['button', '导出为JSON'], _mm.db.node.div, null, () => { _mm.db.export(); });
        _mm.db.node.import = $input(['button', '从JSON导入'], _mm.db.node.div, null, () => { _mm.db.import(); });
      },
    };

    _mm.page = {
      node: { table: [] },
      filter: _query.filter || 'inbox',
      current: parseInt(_query.page) || 0,

      init: function () {
        _mm.page.node.table[_mm.page.current] = $element('table', $id('mmail_outerlist'), ['.hvut-mm-list']);

        _mm.page.node.bottom = $element('div', $id('mmail_outer'), ['.hvut-mm-bottom']);
        $input(['button', '管理数据库'], _mm.page.node.bottom, null, () => { _mm.db.toggle(); });
        $input(['button', '搜索邮件'], _mm.page.node.bottom, null, () => { _mm.search.toggle(); });

        _mm.page.node.go = $input('text', _mm.page.node.bottom, { value: _mm.page.current, style: 'width: 30px; margin-left: auto; text-align: center;' });
        $input(['button', '前往'], _mm.page.node.bottom, null, () => { _mm.page.go(_mm.page.node.go.value); });
        _mm.page.node.prev = $input(['button', '上一页'], _mm.page.node.bottom, { disabled: true }, () => { _mm.page.load('prev'); });
        _mm.page.node.next = $input(['button', '下一页'], _mm.page.node.bottom, { disabled: true }, () => { _mm.page.load('next'); });

        _mm.search.node.div = $element('div', $id('mmail_outer'), ['.hvut-mm-search hvut-none'], (e) => { _mm.page.click(e); });
        _mm.mail.node.view = $element('div', $id('mmail_outer'), ['.hvut-mm-view hvut-none'], (e) => { _mm.mail.click(e); });
        _mm.mail.node.log = $element('div', $id('mmail_outer'), ['.hvut-mm-log hvut-none']).appendChild($element('textarea', null, { readOnly: true, spellcheck: false, style: 'width: 300px; height: 300px;' }));
        $mail.log = _mm.mail.log;

        $id('mmail_outerlist').addEventListener('click', _mm.page.click);
      },
      conn: function () {
        _mm.page.create($id('mmail_list'), _mm.page.current);
        $id('mmail_list').remove();
        _mm.page.prev = _mm.page.current;
        _mm.page.next = _mm.page.current;
        _mm.page.pager($id('mmail_pager'), _mm.page.current);
      },
      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, mid, season } = target.dataset;
        if (action === 'read') {
          e.preventDefault();
          _mm.mail.read(mid, null, season);
        }
      },
      load: async function (p) {
        if (p === 'prev') {
          if (_mm.page.prev === null) {
            return;
          }
          p = _mm.page.prev;
        } else if (p === 'next') {
          if (_mm.page.next === null) {
            return;
          }
          p = _mm.page.next;
        }
        if (_mm.page.node.table[p]) {
          return;
        }
        _mm.page.node.table[p] = $element('table', [$id('mmail_outerlist'), _mm.page.node.table[p + 1]], ['.hvut-mm-list']);
        const table = _mm.page.node.table[p];
        $element('tr', table, [`/<td>${p} Page: Loading...</td>`]);
        scrollIntoView(table);
        _mm.page.node.prev.disabled = true;
        _mm.page.node.next.disabled = true;

        const html = await $ajax.fetch(create_hvut_mail_filter_page_url(_mm.page.filter, p));
        const doc = $doc(html);
        const list = $qs('#mmail_list', doc);
        _mm.page.create(list, p);
        scrollIntoView(table);
        _mm.page.pager($id('mmail_pager', doc), p);
        return doc;
      },
      pager: function (pager, p) {
        update_hvut_mooglemail_page_window(_mm.page, pager, p, {
          prevKey: 'prev',
          nextKey: 'next',
          prevButton: _mm.page.node.prev,
          nextButton: _mm.page.node.next,
          prevStage: 'pagePrevHref',
          nextStage: 'pageNextHref',
        });
      },
      create: function (list, p) {
        const table = _mm.page.node.table[p];
        const tbody = $element('tbody');
        const type = { 'inbox': '收件箱', 'read': '来自', 'sent': '发给' }[_mm.page.filter];
        $element('tr', tbody, [`/<td>${type}</td><td>${p} Page</td><td>Attachment</td><td>CoD</td><td>Sent</td><td>Read</td>`]);

        const conn = _mm.db.conn();
        let count = list.rows.length - 1;
        Array.from(list.rows).slice(1).forEach((tr) => {
          const rowRecord = parse_hvut_mooglemail_page_row(tr, _mm.page.filter, 'pageRowMid');
          if (rowRecord.kind === 'empty') {
            $element('tr', tbody, ['/<td colspan="6">No New Mail</td>']);
            return;
          }
          if (rowRecord.kind === 'rejected') {
            if (!--count) scrollIntoView(table);
            return;
          }

          const { mid, page } = rowRecord;
          const mail = _mm.mail.get(mid);
          if (mail.page) {
            return;
          }
          mail.page = page;
          mail.node.page = $element('tr', tbody, ['/<td></td><td></td><td></td><td></td><td></td><td></td>']);
          $element('a', mail.node.page.cells[1], { dataset: { action: 'read', mid: mid }, href: create_hvut_mail_read_url({ filter: page.filter, mid: mid, page: p }) });

          conn.os.get(mid).onsuccess = function (e) {
            mail.db = e.target.result || null;
            const db = mail.db;
            if (!db || db.filter !== page.filter || !page.returned && !db.user.startsWith(page.user) || db.sent !== page.sent || db.read !== page.read) {
              if (page.filter !== 'inbox') {
                _mm.mail.load(mid);
              }
            }
            _mm.page.modify(mail);
            if (!--count) {
              scrollIntoView(table);
            }
          };
        });
        table.innerHTML = '';
        table.appendChild(tbody);
      },
      modify: function (mail) {
        render_hvut_mooglemail_page_row(mail, _mm.dts);
      },
      go: function (p) {
        p = parseInt(p);
        if (isNaN(p) || p < 0) {
          return;
        }
        openUrl(create_hvut_mail_page_url(p), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));
      },
    };

    _mm.mail = {
      node: {},
      data: {},

      click: function (e) {
        const target = e.target.closest('[data-action]');
        if (!target) {
          return;
        }
        const { action, mid, value } = target.dataset;
        if (action === 'close') {
          _mm.mail.close();
        } else if (action === 'reply') {
          openUrl(create_hvut_mail_reply_url(mid), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));
        } else if (action === 'take') {
          if (value && !confirm(`Accepting the attachments will deduct ${parseInt(value).toLocaleString()} Credits from your account.\nAre you sure?`)) {
            return;
          }
          _mm.mail.read(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`);
        } else if (action === 'return') {
          if (!confirm('这会将邮件退回给发件人。\n确定吗？')) {
            return;
          }
          _mm.mail.read(mid, `action=return_message&mmtoken=${_mm.mmtoken}`);
        } else if (action === 'recall') {
          if (!confirm('这会将邮件退回给发件人。\n确定吗？')) {
            return;
          }
          _mm.mail.read(mid, `action=return_message&mmtoken=${_mm.mmtoken}`);
        }
      },
      get: function (mid, season = _mm.db.season) {
        if (!_mm.mail.data[season]) {
          _mm.mail.data[season] = {};
        }
        if (!_mm.mail.data[season][mid]) {
          _mm.mail.data[season][mid] = { mid, node: {} };
        }
        return _mm.mail.data[season][mid];
      },
      read: async function (mid, post, season = _mm.db.season) {
        const mail = _mm.mail.get(mid, season);
        if (_mm.mail.current === mail && !post) {
          _mm.mail.close();
          return;
        }
        _mm.mail.close();
        _mm.mail.current = mail;
        _mm.mail.node.view.classList.remove('hvut-none');
        $element('p', _mm.mail.node.view, ['加载中...', '.hvut-mm-loading']);

        mail.node.page?.classList.add('hvut-mm-current');
        mail.node.search?.classList.add('hvut-mm-current');

        if (season === _mm.db.season) {
          const loadResponse = await _mm.mail.load(mid, post);
          if (loadResponse.kind === 'rejected') {
            _mm.mail.view(mail);
            return false;
          }
        }
        _mm.mail.view(mail);
      },
      load: async function (mid, post) {
        return run_hvut_mooglemail_view_load(mid, post, {
          get: _mm.mail.get,
          parse: _mm.mail.parse,
          update: _mm.mail.update,
          actionRequestStage: 'viewActionRequest',
          loadRequestStage: 'viewLoadRequest',
          actionRejectedStage: 'viewActionRejected',
          loadRejectedStage: 'viewLoadRejected',
          actionCacheWriteRejectedStage: 'viewActionCacheWriteRejected',
          loadCacheWriteRejectedStage: 'viewLoadCacheWriteRejected',
        });
      },
      parse: function (html) {
        const doc = $doc(html);
        const parsed = parse_hvut_mooglemail_view(doc, html, {
          rejectedStage: 'viewRejectedResponse',
          equipStage: 'viewEquipAttach',
          codStage: 'viewCurrentCod',
          parseCount: _mm.parse_count,
        });
        if (parsed.mmtoken) {
          _mm.mmtoken = parsed.mmtoken;
        }
        return parsed.view;
      },
      update: async function (mail, post) {
        const writePlan = create_hvut_mooglemail_cache_write_plan(mail, post, {
          actionUpdateStage: 'viewActionDbUpdate',
          loadUpdateStage: 'viewLoadDbUpdate',
          actionInsertStage: 'viewActionDbInsert',
          loadInsertStage: 'viewLoadDbInsert',
        });
        if (!await run_hvut_mooglemail_cache_write_plan(writePlan, _mm.db)) return false;
        _mm.mail.modify(mail);
        return true;
      },
      modify: function (mail) {
        if (mail.node.page) {
          _mm.page.modify(mail);
        }
        if (mail.node.search) {
          _mm.search.modify(mail);
        }
      },
      view: function (mail) {
        if (_mm.mail.current !== mail) {
          return;
        }
        const mid = mail.mid;
        const view = mail.view || {};
        const db = mail.db;
        const div = _mm.mail.node.view;
        if (!render_hvut_mooglemail_view_shell(mail, div, db, view, {
          missingDbPrefix: 'ERROR: ',
          sentLabel: 'Sent',
          subjectLabel: 'Subject',
          readLabel: 'Read',
          formatDate: _mm.dts,
          assignBody: (body) => { _mm.mail.node.body = body; },
          returnedMessage: (db) => `This message was returned from ${db.user}`,
        })) return;

        render_hvut_mooglemail_view_attach_list(mail, div, db, {
          noCodText: '无货到付款',
          onInput: (e) => { _mm.mail.cod(e); },
        });
      },
      close: function () {
        if (_mm.mail.current) {
          const mail = _mm.mail.current;
          mail.node.page?.classList.remove('hvut-mm-current');
          mail.node.search?.classList.remove('hvut-mm-current');
        }
        _mm.mail.current = null;
        _mm.mail.node.view.classList.add('hvut-none');
        _mm.mail.node.view.innerHTML = '';
        _mm.mail.log('', true);
        _mm.mail.node.log.parentNode.classList.add('hvut-none');
      },
      cod: function () {
        const mail = _mm.mail.current;
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
      },
      log: function (text, clear) {
        _mm.mail.node.log.parentNode.classList.remove('hvut-none');
        if (clear) {
          _mm.mail.node.log.value = '';
        }
        _mm.mail.node.log.value += text + '\n';
        _mm.mail.node.log.scrollTop = _mm.mail.node.log.scrollHeight;
      },
    };

    _mm.search = {
      node: {},

      keydown: function (e) {
        if (e.key === 'Enter') {
          _mm.search.submit();
        }
      },
      submit: function () {
        const season = _mm.search.node.season?.value || _mm.db.season;
        const filter = _mm.search.node.filter.value;
        const name = _mm.search.node.name.value.trim().toLowerCase();
        const subject = _mm.search.node.subject.value.trim().toLowerCase();
        const text = _mm.search.node.text.value.trim().toLowerCase();
        let attach = _mm.search.node.attach.value.trim();
        let eid = null;
        let cod = _mm.search.node.cod.value.replace(/\s/g, '').toLowerCase();
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
        const param = { season, filter, name, subject, text, attach, eid, cod, cod_min, cod_max };
        _mm.search.query(param);
      },
      query: function (param) {
        _mm.mail.close();
        _mm.search.node.div.innerHTML = '';
        _mm.search.node.div.classList.remove('hvut-none');
        $element('div', _mm.search.node.div, ['正在搜索...', '.hvut-mm-searching']);

        _mm.db.search(param).then((results) => {
          const table = $element('table', null, ['.hvut-mm-list']);
          const tbody = $element('tbody', table);
          $element('tr', tbody, [`/<td>Search</td><td>${results.length} mail(s)</td><td>Attachment</td><td>CoD</td><td>Sent</td><td>Read</td>`]);

          results.sort((a, b) => b.db.mid - a.db.mid);
          results.forEach((mail) => {
            const db = mail.db;
            if (!mail.node.search) {
              mail.node.search = $element('tr', tbody, ['/<td></td><td></td><td></td><td></td><td></td><td></td>']);
              if (param.season === _mm.db.season) {
                $element('a', mail.node.search.cells[1], { dataset: { action: 'read', mid: db.mid }, href: create_hvut_mail_read_url({ filter: db.filter, mid: db.mid }) });
              } else {
                $element('a', mail.node.search.cells[1], { dataset: { action: 'read', mid: db.mid, season: param.season } });
              }
            }
            tbody.appendChild(mail.node.search);
            _mm.search.modify(mail);
          });

          _mm.search.node.div.innerHTML = '';
          _mm.search.node.div.appendChild(table);
        });
      },
      modify: function (mail) {
        const db = mail.db;
        const tr = mail.node.search;
        const type = { 'inbox': '收件箱', 'read': '来自', 'sent': '发给' }[db.filter];
        tr.cells[0].innerHTML = `<span>${type}</span> ${db.user}`;
        tr.cells[1].firstElementChild.textContent = db.subject;
        tr.cells[2].innerHTML = '';
        tr.cells[3].innerHTML = '';

        db.attach?.forEach((e) => {
          const span = $element('span', tr.cells[2], [`.hvut-mm-attach-${e.t}`]);
          if (e.t === 'e') {
            if (e.e && e.k) {
              $element('a', span, { textContent: e.n, href: create_hvut_equip_page_url({ eid: e.e, key: e.k }), target: '_blank' });
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
      },
      close: function () {
        _mm.search.node.div.classList.add('hvut-none');
        _mm.search.node.div.innerHTML = '';
      },
      toggle: function () {
        if (_mm.search.node.form) {
          _mm.search.node.form.classList.toggle('hvut-none');
          return;
        }
        _mm.search.node.form = $element('div', _mm.page.node.bottom, null, { keydown: (e) => { _mm.search.keydown(e); } });
        $input(['button', '关闭'], _mm.search.node.form, null, () => { _mm.search.toggle(); });

        if (IS_ISEKAI) {
          const seasons = Array.from(_mm.db.database.objectStoreNames);
          _mm.search.node.season = $input(['select', seasons], _mm.search.node.form);
          _mm.search.node.season.value = _server.season;
        }
        _mm.search.node.filter = $input(['select', [':all', 'inbox', 'read', 'sent']], _mm.search.node.form);
        _mm.search.node.name = $input('text', _mm.search.node.form, { placeholder: '用户', style: 'width: 120px;' });
        _mm.search.node.subject = $input('text', _mm.search.node.form, { placeholder: '主题', style: 'width: 120px;' });
        _mm.search.node.text = $input('text', _mm.search.node.form, { placeholder: '文本', style: 'width: 120px;' });
        _mm.search.node.attach = $input('text', _mm.search.node.form, { placeholder: '附件', style: 'width: 120px;' });
        _mm.search.node.cod = $input('text', _mm.search.node.form, { placeholder: 'COD金额(小-大)', style: 'width: 100px;' });
        $input(['button', '搜索'], _mm.search.node.form, null, () => { _mm.search.submit(); });
        $input(['button', '关闭列表'], _mm.search.node.form, null, () => { _mm.search.close(); });
      },
    };

    GM_addStyle(/*css*/`
      #mmail_outerlist { margin: 10px; overflow-y: scroll; }
      #mmail_list { display: none; }
      #mmail_pager { display: none; }

      .hvut-mm-list { table-layout: fixed; border-collapse: collapse; margin: 0 auto 10px 0; width: 1180px; font-size: 10pt; line-height: 22px; text-align: left; white-space: nowrap; }
      .hvut-mm-list tr:hover { background-color: var(--color-bg-alpha); }
      .hvut-mm-list tr > td:hover { background-color: var(--color-bg-alpha); }
      .hvut-mm-list tr:first-child > td { border-top: 1px solid var(--color-border-default); background-color: var(--color-bg-h1); font-weight: bold; text-align: center; }
      .hvut-mm-list td { padding: 1px 3px; border-bottom: 1px solid var(--color-border-default); overflow: hidden; text-overflow: ellipsis; }
      .hvut-mm-list td:nth-child(1) { width: 140px; }
      .hvut-mm-list td:nth-child(1) > span { padding: 1px 3px; border: 1px solid var(--color-border-default); font-weight: bold; }
      .hvut-mm-list td:nth-child(3) { width: 300px; }
      .hvut-mm-list td:nth-child(4) { width: 100px; text-align: right; }
      .hvut-mm-list td:nth-child(4) > span { color: var(--color-mm-credits); }
      .hvut-mm-list td:nth-child(5) { width: 120px; text-align: center; }
      .hvut-mm-list td:nth-child(6) { width: 120px; text-align: center; }

      .hvut-mm-list td:nth-child(2) > a { display: block; text-decoration: none; cursor: pointer; }
      .hvut-mm-list tr:hover > td:nth-child(2) > a { text-decoration: underline; }
      .hvut-mm-list td:nth-child(3) > span { display: block; }
      .hvut-mm-attach-e { color: var(--color-mm-equip); }
      .hvut-mm-attach-e > a { color: inherit; }
      .hvut-mm-attach-i { color: var(--color-mm-item); }
      .hvut-mm-attach-c { color: var(--color-mm-credits); }
      .hvut-mm-attach-h { color: var(--color-mm-hath); }

      .hvut-mm-current { background-color: var(--color-bg-h1) !important; }
      .hvut-mm-loading { margin: 20px; font-weight: bold; color: var(--color-font-highlight); }
      .hvut-mm-returned { background-color: var(--color-bg-invalid); }
      .hvut-mm-returned * { color: var(--color-font-invalid) !important; }
      .hvut-mm-unread { background-color: var(--color-warn-unread); }
      .hvut-mm-nodb { background-color: var(--color-warn-unread); }
      .hvut-mm-removed { background-color: var(--color-bg-invalid); text-decoration: line-through; }

      .hvut-mm-bottom { position: absolute; left: 0; bottom: 8px; width: 100%; display: flex; text-align: left; }
      .hvut-mm-bottom div { position: absolute; left: 0; bottom: 0; width: 100%; background-color: var(--color-bg-default); }
      .hvut-mm-bottom div > *:first-child { margin-right: 80px; }

      .hvut-mm-search { position: absolute; top: 79px; left: 20px; width: 1200px; height: 580px; border: 2px solid var(--color-border-default); background-color: var(--color-bg-default); overflow-y: scroll; z-index: 1; }
      .hvut-mm-searching { position: absolute; top: 50%; transform: translateY(-50%); width: 100%; font-size: 10pt; font-weight: bold; color: var(--color-font-highlight); }

      .hvut-mm-view { position: absolute; top: 81px; right: 14px; display: flex; flex-direction: column; width: 626px; height: 566px; padding: 5px; border: 2px solid var(--color-border-default); background-color: var(--color-bg-default); font-size: 10pt; line-height: 20px; text-align: left; z-index: 2; }
      .hvut-mm-failed { background-color: var(--color-bg-invalid); }
      .hvut-mm-view > dl { display: grid; grid-template-columns: 80px auto 80px 120px; gap: 5px; margin: 5px; text-align: center; align-items: center; }
      .hvut-mm-view dt { margin: 0; border: 1px solid var(--color-border-default); }
      .hvut-mm-view dd { margin: 0; border-bottom: 1px solid var(--color-border-default); }
      .hvut-mm-view dd:nth-of-type(2n+1) { padding: 0 5px; text-align: left; }
      .hvut-mm-rts dd:nth-of-type(1)::before { content: '[MoogleMail] '; color: var(--color-font-invalid); }
      .hvut-mm-view > textarea { flex-basis: 191px; }
      .hvut-mm-view > div { display: flex; margin: 5px 0; }
      .hvut-mm-view > ul { margin: 5px; padding: 5px; border: 1px solid var(--color-border-default); list-style: none; max-height: 242px; overflow: auto; flex-shrink: 0; }
      .hvut-mm-view li:first-child { margin-top: 0; padding: 0 0 0 5px; border: 1px solid var(--color-border-default); font-weight: bold; }
      .hvut-mm-view li:first-child > .hvut-mm-price { text-align: center; }
      .hvut-mm-view li { display: flex; margin-top: 2px; padding: 0 1px 0 6px; }
      .hvut-mm-view li span:first-child { margin-right: auto; }
      .hvut-mm-view li input { margin: 0; padding: 1px 4px; text-align: right; }
      .hvut-mm-price { width: 60px; }
      .hvut-mm-cod { width: 90px; }
      .hvut-mm-view input[data-cod-match='1'] { color: var(--color-font-bonus); }
      .hvut-mm-view input[data-cod-match='0'] { color: var(--color-font-warn); }
      .hvut-mm-rts > ul input { display: none; }

      .hvut-mm-log { position: absolute; top: 81px; right: 652px; border: 2px solid var(--color-border-default); background-color: var(--color-bg-default); z-index: 2; }
    `);

    _mm.page.init();
    _mm.db.init();
    _mm.db.open(_mm.page.conn);
  }
} else
// [END 12] Bazaar - MoogleMail */


//* [13] Bazaar - Lottery
if (_query.s === 'Bazaar' && (_query.ss === 'lt' || _query.ss === 'la')) {
  if ($config.settings.lotteryNotification && $qs('img[src$="lottery_next_d.png"]')) {
    _lt.toggle = function (show) {
      const previous = _lt.json[_query.ss].hide;
      _lt.json[_query.ss].hide = !show;
      if (!$config.set('lt_notif', _lt.json, 'hvut_')) {
        _lt.json[_query.ss].hide = previous;
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      return true;
    };
    _lt.json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_');

    const div = $element('div', $id('rightpane'), ['.hvut-warn', '!margin-top: 10px;']);
    $input(['checkbox', null, 'Show this lottery in the bottom bar'], div, { checked: !_lt.json[_query.ss].hide }, { change: (e) => { _lt.toggle(e.target.checked); } });
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

    #equipinfo { visibility: hidden; background-color: var(--color-bg-default); order: 1; display: flex; flex-flow: column; justify-content: center; align-items: center; }
    #equipinfo > div { width: 420px; border: 1px solid var(--color-border-default); background-color: var(--color-bg-back); }
    #equipselect_left:hover ~ #equipselect_right #equipinfo { visibility: visible; }
    #equipselect_left:hover ~ #hvut-bt-div { visibility: hidden; }
    #csp[data-ss='iw'] #itemlist { min-height: 40px; padding: 20px; overflow: auto; }
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
    toggle_button($input('button', $id('arena_list').rows[0].cells[7]), '展开细节', '折叠', $battle.node.outer, 'hvut-bt-on');
  } else
  // [END 14] Battle - Arena */


  //* [15] Battle - Ring of Blood
  if (_query.ss === 'rb') {
    _ar.split_colspan($id('arena_list'));
    $element('div', [$id('mainpane'), 'afterbegin'], ['#rob_outer']).append($id('arena_list'), $id('arena_tokens'));
    $battle.init($qs('#rob_outer'));
    toggle_button($input('button', $id('arena_list').rows[0].cells[7]), '展开细节', '折叠', $battle.node.outer, 'hvut-bt-on');
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
    $equip.list.table($qs('#equiplist > table') || $qs('#itemlist > table'));
    const equipaction = $id('equipaction');
    const equipblurbLast = $id('equipblurb')?.lastElementChild;
    if (equipaction && equipblurbLast) {
      equipaction.prepend(equipblurbLast);
    }
    const equipselectOuter = $id('equipselect_outer');
    const confirmOuter = $id('confirm_outer');
    if (equipselectOuter && confirmOuter) {
      equipselectOuter.appendChild(confirmOuter);
    }
    $battle.init($qs('#equipselect_outer'));
  } else
  // [END 18] Battle - Item World */

  // eslint-disable-next-line brace-style
  {} // END OF [else if]; DO NOT REMOVE THIS LINE!
} else
// Battle


//* [10] Armory - Equiplist
if (_query.s === 'Bazaar' && _query.ss === 'am' && $id('equiplist')) {
  const $armory = {};
  bindArmory($armory, { config: $config, equip: $equip, price: $price }); // 七屏内核收口公共区(2026-06-10; $equip/$price 闭包私有, ctx 注入)
} else
// [END 10] Armory - Equiplist */


//* [11] Armory
if (_query.s === 'Bazaar' && _query.ss === 'am' && _query.screen === 'modify') {
  _amModify(); // 升级材料成本统计收口 L3.A3（两 IIFE 共用）
} else
// [END 11] Armory */

// eslint-disable-next-line brace-style
{} // END OF [else if]; DO NOT REMOVE THIS LINE!


/* END */

  })();
} else {
  // [主世界分支] 原 "HV Utils 汉化" → 迁移至英文 4.0.0
  // GM_setValue 前缀: 外层 IS_ISEKAI 已挡 isekai 分支, 此处恒 hvut_
  (function () {

const settings = {

  // [GENERAL]
  reNotification: true,
  reBattle: true, // 战斗页 RE 通知细分开关(随 bindRe 收口从 isekai 4.2.0 引入; 缺省则 ba() 守卫恒 false 关停通知)
  reGallery: true,
  reGalleryAlt: false,
  reBeep: [0.2, 500, 0.5], // [volume, frequency, duration]

  topMenuIntegration: true,
  // 逻辑键必须英文(索引 _top.menu, 显示走 m.text/m.button); 勿翻译键, 见 verify-topmenu-keys probe
  // [2026-06-10 bindTop 收口] 默认值对齐 isekai am 体系(旧 Equip Inventory/Equipment Shop 死端点删);
  // 老用户存值里的死项由 bindTop init 的 !m.href 守卫安全跳过。
  confirmStaminaRestorative: true,
  disableStaminaRestorative: 79,
  warnLowStamina: 10,

  showCredits: 0, // 0:disable, 2:always
  showEquipSlots: 1, // 0:disable, 1:on battle pages only, 2:always
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
  equipSort: true,
  equipShowLevel: true,
  equipShowPAB: true,
  equipmentIntegration: true,
  equipColor: true,
  equipHoverFunctions: true,
  equipTouchFunctions: false,
  equipCode: { // 旧 string 单模板 → isekai object 形态(bindArmory equipcode 按 EQUIP/CATEGORY/TYPE 键读); 旧存值经 migration v2 升级
    CATEGORY: '[size=3][b][{$category}][/b][/size]',
    TYPE: '[size=2][b][{$type}][/b][/size]',
    EQUIP: '[{$_eid}] [url={$url}]{$namecode}[/url] ({$level?Lv.$level}{$soulbound?Soulbound}{$unassigned?Unassigned}, {$pab}{$note?, $note}){$price? @ $price}',
  },
  equipNameCode: [
    'Peerless : quality=rainbow, name=bold',
    'Legendary : quality=#f90, quality=bold',
    'Magnificent : quality=#69f',
    'Exquisite : quality=#3c3',
    '(Rapier || Shortsword) && Slaughter : type=bold, suffix=bold ; Ethereal : prefix=#f00 ; (Hallowed || Demonic) : prefix=#f90',
    '(Club || Axe) && Slaughter && Ethereal : prefix=#f00, type=bold, suffix=bold',
    '(Rapier || Wakizashi) && (Balance || Nimble) && Ethereal : prefix=#f00, type=bold, suffix=bold',
    'Wakizashi && (Nimble || Battlecaster) && (Fiery || Arctic || Shocking || Tempestuous) : prefix=#f00, type=bold, suffix=bold',
    '(Estoc || Katana || Longsword || Mace) && Slaughter && Ethereal : prefix=#f00, type=bold, suffix=bold',
    'Oak && Hallowed && Heimdall : prefix=#f00, type=bold, suffix=bold',
    'Willow && (Shocking || Tempestuous || Demonic) && Destruction : prefix=#f00, type=bold, suffix=bold',
    'Katalox && Hallowed && (Destruction || Heimdall || Heaven-sent) : prefix=#f90, type=bold',
    'Katalox && Demonic && (Destruction || Fenrir || Demon-fiend) : prefix=#f90, type=bold',
    'Redwood && (Fiery || Arctic || Shocking || Tempestuous) && Destruction : prefix=#f00, type=bold, suffix=bold',
    'Redwood && (Fiery || Arctic || Shocking || Tempestuous) && Elementalist : prefix=#f90, type=bold',
    'Redwood && (Fiery && Surtr || Arctic && Niflheim || Shocking && Mjolnir || Tempestuous && Freyr) : prefix=#f90, type=bold',
    'Force Shield : type=bold ; Protection || Dampening || Deflection : suffix=bold',
    'Buckler && (Barrier || Battlecaster) : type=bold, suffix=bold ; Reinforced : prefix=#f90',
    'Phase : type=bold ; Radiant || Charged : prefix=#f00 ; Mystic || Frugal : prefix=#f90',
    'Cotton && (Elementalist || Heaven-sent || Demon-fiend) : suffix=bold ; Charged : prefix=#f00 ; Elementalist && Shoes || (Heaven-sent || Demon-fiend) && Robe : slot=bold',
    'Shade && Shadowdancer : type=bold, suffix=bold ; Savage : prefix=#f00 ; Agile : prefix=#f90',
    'Power : type=bold ; Savage : prefix=#f90 ; Slaughter : suffix=bold ; Savage && Slaughter : prefix=#f00',
    'Plate && Shielding : prefix=#f90',
  ],

  // [Equipment Shop → Bazaar Armory(能量模型)]
  equipmentShopConfirm: 1, // 0:disable, 1:confirm less-profitable actions, 2:always
  equipmentShopAutoProtect: false,
  equipmentShopPriceDeductFee: false,

  equipmentShopProtectFilters: [
    'Peerless',
    'Legendary',
    'Magnificent && (Rapier || Shortsword) && Slaughter',
    'Magnificent && (Force Shield || Buckler && Barrier)',
    'Magnificent && Fiery && Redwood && (Destruction || Elementalist || Surtr)',
    'Magnificent && Arctic && Redwood && (Destruction || Elementalist || Niflheim)',
    'Magnificent && Shocking && (Willow || Redwood) && (Destruction || Elementalist || Mjolnir)',
    'Magnificent && Tempestuous && (Willow || Redwood) && (Destruction || Elementalist || Freyr)',
    'Magnificent && Hallowed && (Oak || Katalox) && (Destruction || Heaven-sent || Heimdall)',
    'Magnificent && Demonic && (Willow || Katalox) && (Destruction || Demon-fiend || Fenrir)',
    'Magnificent && (Radiant || Charged) && Phase',
    'Magnificent && Charged && (Elementalist || Heaven-sent || Demon-fiend)',
    'Magnificent && (Savage || Agile) && Shadowdancer',
    'Magnificent && Power && Slaughter',
  ],

  equipmentShopBazaarFilters: [
    'Peerless',
    'Legendary',
    'Magnificent && Rapier && Slaughter',
    'Magnificent && (Force Shield || Buckler && Barrier)',
    'Magnificent && Fiery && Redwood && (Destruction || Elementalist || Surtr)',
    'Magnificent && Arctic && Redwood && (Destruction || Elementalist || Niflheim)',
    'Magnificent && Shocking && (Willow || Redwood) && (Destruction || Elementalist || Mjolnir)',
    'Magnificent && Tempestuous && (Willow || Redwood) && (Destruction || Elementalist || Freyr)',
    'Magnificent && Hallowed && (Oak || Katalox) && (Destruction || Heaven-sent || Heimdall)',
    'Magnificent && Demonic && (Willow || Katalox) && (Destruction || Demon-fiend || Fenrir)',
    'Magnificent && (Radiant || Charged) && Phase',
    'Magnificent && Charged && (Elementalist || Heaven-sent || Demon-fiend)',
    'Magnificent && (Savage || Agile) && Shadowdancer',
    'Magnificent && Power && Slaughter',
    '$Exquisite+ && (Rapier || Shortsword) && Slaughter && $prefix && $pab=sd && $level<250',
    '$Exquisite+ && Power && !Warding',
    '$Superior+ && (Force Shield || Buckler && Barrier || Kite Shield)',
    '$iw',
  ],

  monsterLab: true,
  monsterLabDefaultSort: 'index',

  shrineHideItems: ['Figurine', 'Peerless Voucher'],
  shrineFilters: ['Peerless', 'Legendary'],

  moogleMail: true,
  moogleMailCouponClipper: false,

  // [BATTLE]
  equipEnchantPosition: 'left',
  equipEnchantRepairThreshold: 55,
  equipEnchantItemInventory: {
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
// $input/toggle_button 两版 version-diff（参数序 [t,v,n,s] / 简版无 MutationObserver）+ object_sort 主世界独有，留本 IIFE；identical 工具已提公共区。
function $input(o,p,a,f) {if(typeof o==='string'){o=[o];}const [t,v,n,s]=o;if(!a){a={};}if(t==='select'){const i=$element('select',p,a,f);if(v){v.forEach((v)=>{v=split2(v,':');if(!v[1]){v[1]=v[0];}$element('option',i,{value:v[0],text:v[1]});});}return i;}a.type=t;if(v===undefined||v===null){const i=$element('input',p,a,f);return i;}else if(t==='button'||t==='submit'){a.value=v;const i=$element('input',p,a,f);return i;}else{const l=$element('label',p);const i=$element('input',l,a,f);if(s&&(t==='checkbox'||t==='radio')){$element('span',l);l.classList.add('hvut-label');}if(v){if(n==='before'){l.prepend(v,' ');}else{l.append(' ',v);}}return i;}}
function object_sort(o,x=[]) {const index={};const _x=x.length+1;x.forEach((e,i)=>{index[e]=i+1;});Object.keys(o).sort((a,b)=>{const _a=index[a]||_x;const _b=index[b]||_x;return _a-_b||(a<b?-1:1);}).forEach((e)=>{const v=o[e];delete o[e];o[e]=v;});}
function toggle_button(e,s,h,t,c,d) {function f(){if(t.classList.contains(c)){t.classList.remove(c);e.value=h;}else{t.classList.add(c);e.value=s;}}e.value=h;e.addEventListener('click',f);if(d){f();}}
/* eslint-enable */

// G3: hv-utils 内嵌术语翻译表（spell/eqCategory/abCategory）已归位 canonical SSOT
// (src/data/i18n/hvut-terms.js: SPELL_TYPE/EQ_CATEGORY/AB_CATEGORY)，调用点改
// hvaaT(v,'spell'|'eqCategory'|'abCategory') 经全局桥查；material 已 G1 归位 EQUIP_ITEMS。
// 仅 stamina_readout tooltip 整句替换保留本地（游戏原生整句, 非术语 exact-SSOT 范畴）。
// i18n-probe-allow: 整句 tooltip 替换非术语表。Stage G follow-up: 移交外部 interface-translate
// (其已部分覆盖 interface-dict:448), 届时删本表。
const HVUT_CN = {
  stamina: {
    'Exhausted. You do not receive EXP or drops from monsters, and you cannot gain proficiencies.': '你已经筋疲力尽，你将无法从怪物处获取任何经验、潜经验、掉落、以及熟练度，直到你的精力恢复到2以上',
    'You have increased stamina drain due to low riddle accuracy': '由于你的小马图回答正确率太低，你的精力消耗速率被提高了',
    'Great. You receive a 100% EXP Bonus but stamina drains 50% faster.': '你现在精力充沛，额外获得100%经验加成，但精力消耗量增加50%（每场战斗消耗0.03的精力,异世界加倍）',
    'Normal. You are not receiving any bonuses or penalties.': '正常，你既不会受到额外的奖励也不会受到惩罚（每场战斗消耗0.02的精力,异世界加倍）',
  },
};

// $ajax/_query 已提公共区（L2）

// CONFIGURATION
const $config = {

  version: 2, // v2 = 能量模型旧装备体系退化接新(2026-06-10): equipCode object 化 + 死键清理 + armory 新键, 经 migration 幂等迁移
  ls_savelist: ['ch_style'],
  data: [
    { tag: 'h1', text: 'Random Encounter' },
    { key: 'reNotification', type: 'boolean', label: '启用随机遭遇战通知。' },
    { key: 'reBattle', type: 'boolean', label: '在战斗中启用随机遭遇战通知。' },
    { key: 'reGallery', type: 'boolean', label: '浏览画廊时也启用随机遭遇战通知。' },
    { key: 'reGalleryAlt', type: 'boolean', label: '从画廊打开随机遭遇战时，跳转到 alt.hentaiverse.org。' },
    { key: 'reBeep', type: 'array', input: 'text', value_type: 'number', value_sep: ',', text: '随机遭遇战就绪时播放蜂鸣声.\n参数顺序为 [音量], [频率], [时长].\n设为 0 可禁用.', style: 'width: 150px;', oncreate: (o) => { $input(['button', '蜂鸣测试'], [o.node.input, 'afterend'], null, () => { const validation = $config.validate(o); if (!validation.error) { play_beep(...validation.value); } }); } },

    { tag: 'h1', text: 'Top Navigation Bar' },
    { key: 'topMenuIntegration', type: 'boolean', label: '将顶部菜单整合为一个按钮。' },
    { key: 'confirmStaminaRestorative', type: 'boolean', label: '使用精力恢复道具前进行确认。', disabled: 'isekai' },
    { key: 'disableStaminaRestorative', type: 'number', label: '当精力高于指定值时，禁用精力恢复按钮。', disabled: 'isekai' },
    { key: 'warnLowStamina', type: 'number', label: '当精力低于指定值时发出警告。' },

    { tag: 'h1', text: 'Bottom Bar' },
    { key: 'showCredits', type: 'number', input: 'select', options: ['0:disable', '2:always'], label: '显示信用点余额。' },
    { key: 'showEquipSlots', type: 'number', input: 'select', options: ['0:disable', '1:on battle pages only', '2:always'], label: '显示装备仓库的剩余空间。' },
    { key: 'trainingNotification', type: 'boolean', label: '显示进行中的训练，并自动开始下一项训练直到设定的等级。' },
    { key: 'lotteryNotification', type: 'boolean', label: '显示当前彩票中的武器和防具。' },
    { key: 'lotteryFilters', type: 'array', input: 'textarea', text: 'Notify if the new equipment in the lottery qualifies.\n* $pab is not available.', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '装备' },
    { key: 'equipmentIntegration', type: 'boolean', label: '将所有类型的装备整合到装备列表' },
    { key: 'equipSort', type: 'boolean', label: '对装备列表进行排序和分类。' },
    { key: 'equipColor', type: 'boolean', label: '按品质为装备设置颜色。' },
    { key: 'equipShowLevel', type: 'boolean', label: '显示装备的等级。' },
    { key: 'equipShowPAB', type: 'boolean', label: '显示装备的潜能加成(PAB)。' },
    { key: 'equipHoverFunctions', type: 'boolean', label: '当鼠标悬停在装备上时，支持键盘和鼠标操作。' },
    { key: 'equipTouchFunctions', type: 'boolean', label: '在移动端支持触摸操作' },
    { key: 'equipCode', type: 'object', input: 'textarea', text: '设置论坛代码的格式', style: 'height: 80px; white-space: normal;' },
    { key: 'equipNameCode', type: 'array', input: 'textarea', text: 'Set the rules for codes that decorate the names of equipment.' },

    { tag: 'h1', text: '装备商店' },
    { key: 'equipmentShopConfirm', type: 'number', input: 'select', options: ['0:默认', '1:自动点击确认', '2:无需确认'], label: '出售或分解装备时进行确认。' },
    { key: 'equipmentShopProtectFilters', type: 'array', input: 'textarea', text: 'Show valuable equipment together at the top of the list, and prevent them from being selected by the "Select All" button.', desc: 'equipFilters', validator: 'equipFilters' },
    { key: 'equipmentShopAutoProtect', type: 'boolean', label: '自动保护符合规则的装备' },
    { key: 'equipmentShopPriceDeductFee', type: 'boolean', label: '显示实际价格——由于市场会收取1%的手续费，因此材料的实际价值为价格的99%' },
    { key: 'equipmentShopBazaarFilters', type: 'array', input: 'textarea', text: 'Keep valuable equipment in BAZAAR, then hide all other trash.', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '怪物实验室' },
    { key: 'monsterLab', type: 'boolean', label: '高级怪物实验室功能', disabled: 'isekai' },
    { key: 'monsterLabDefaultSort', type: 'string', input: 'select', options: ['index', '姓名', '类型', 'pl:power level', 'wins', 'kills', 'gains:new gifts', 'gifts:total gifts', '士气', 'hunger'], label: '设置列表排序的默认值。', disabled: 'isekai' },

    { tag: 'h1', text: '雪花祭坛' },
    { key: 'shrineHideItems', type: 'array', input: 'textarea', text: 'Hide items to prevent them from being accidentally offered to the Shrine.' },
    { key: 'shrineFilters', type: 'array', input: 'textarea', text: 'Show the names of rewarded equipment of higher quality only.\n* $pab is not available.', desc: 'equipFilters', validator: 'equipFilters' },

    { tag: 'h1', text: '莫古利邮局' },
    { key: 'moogleMail', type: 'boolean', label: '高级莫古利邮局功能' },
    { key: 'moogleMailCouponClipper', type: 'boolean', label: '适用于拥有「Coupon Clipper」Hath 特权的玩家。\n当莫古利邮件主题包含「Coupon Clipper」或「Item Shop」时，收下信用点，购买所需物品，然后寄回。', disabled: 'isekai' },

    { tag: 'h1', text: 'Battle' },
    { key: 'equipEnchantPosition', type: 'string', input: 'select', options: ['left', 'right'], label: '设置面板的位置。' },
    { key: 'equipEnchantRepairThreshold', type: 'number', label: '当某件装备耐久度过低时发出警告。' },
    { key: 'equipEnchantItemInventory', type: 'object', input: 'textarea', value_type: 'number', text: 'Show the amount of items in the inventory, and warn if each number is less than the specified value.\nYou can purchase that quantity from the Item Shop by clicking on the item name in the list.' },
  ],
  text: {
    equipHoverFunctions: `
      [C] Open equipment link in a pop-up
      [V] Open equipment link in a new tab
      [L] Show link code
      [K] Show link code in bbcode format
      [DOUBLE CLICK] Open equipment link
    `,
    equipTouchFunctions: `
      [DOUBLE TAP] Open equipment link
      [LONG PRESS] Open equipment link
    `,
    equipEnchantRepairThreshold: `
      If the value is between 0 and 1, it means the condition % of the equipment (e.g., 0.6 => 60%).
      If the value is 1 or larger, it means condition percentage points (e.g., 55 => 55%).
      (The old "margin to 50%" semantics is gone with durability in the energy-model update.)
      The recommended value for GrindFest is 55.
    `,
  },
  desc: {
    equipCode: `Syntax
      {$name}       equipment name
      {$namecode}   equipment name in colors/bold
      {$url}        equipment url
      {$eid}        equipment id
      {$_eid}       $eid with a transparent underline for layout
      {$level}      equipment level
      {$pab}        equipment pab
      {$tier}       potency tier (IW level)
      {$price}      the value of the '价格' input field
      {$note}       the value of the 'note' input field
                  - if it contains '$featured;', the equip code will be added to 'Featured' section
                  - if it contains '$new;', the equip code will be added to 'Newly Added' section
      {$condition ? text_if_true}
                  - if $condition is a valid value, it prints 'text_if_true', otherwise nothing
                  e.g., {$price? @ $price}
                  - if the equipment has a '价格' value in the Equipment Inventory, it prints like ' @ 10m'.
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
      ()   : GROUPING
      &&   : AND
      ||   : OR
      !    : NOT
      $QUALITY+   : Whether the quality of the equipment is equal to or higher than the given QUALITY
      $pab=xyz    : Whether the equipment has pab x, y and z
      $prefix     : Whether the equipment has a prefix
      $iw         : Whether the equipment has any potency levels
      $level      : Number, the level of the equipment
      e.g., Magnificent && Power && !Warding
      e.g., $Exquisite+ && (Rapier || Shortsword) && Slaughter && $prefix && $pab=sd && $level<250
    `,
  },
  validator: {
    equipNameCode: function (value) {
      const result = $equip.namecode_parse(value);
      return result;
    },
    equipFilters: function (value) {
      const result = $equip.filter.validate(value);
      return result;
    },
  },
  init: create_hvut_config_init_entry(settings, { ...HVUT_WORLD, assignSeason: true }),
  migration: function () {
    const migration = run_hvut_config_settings_migration($config, $price, HVUT_WORLD, {});
    return migration.kind === 'accepted';
  },
  // reset/get/set/del/ls_get/ls_set/ls_del: 收口 bindConfig(L1)
  create: function () {
    inject_hvut_config_panel_style(HVUT_WORLD);

    render_hvut_config_panel($config, HVUT_WORLD);
  },
  // open/close: 收口 bindConfig(L1)
  set_panel: function (obj = $config.settings) {
    $config.data.forEach((o) => {
      if (!o.key) {
        return;
      }
      const input = o.node.input;
      if (input.disabled) {
        return;
      }
      const value = obj[o.key];
      if (value === undefined) {
        return;
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
    });
  },
  // get_panel/validate_panel/validate/load/save/text2obj/obj2text/text2array/array2text: 收口 bindConfig(L1)
};
bindConfig($config, { skipField: (o) => is_hvut_config_field_disabled(o, HVUT_WORLD) }); // 18 方法收口共享内核(L1); ctx 注入面板字段门控谓词(主世界按 持久区·isekai)
$config.init();
//$config.settings = settings;

// $ajax/_query 已提公共区（L2）

window.addEventListener('unhandledrejection', (e) => { console.log($ajax.error || e); });

// RANDOM ENCOUNTER
const $re = {};
bindRe($re, { config: $config, get top() { return _top; } }); // 收口共享内核(L1 bindRe), GM 命名空间经 ctx.config 注入

/* NO-NAVBAR */
if (!$id('navbar')) {
  // BATTLE
  if ($id('battle_top')) {
    if ($config.settings.reNotification) {
      $re.ba();
    }

  // RIDDLE MASTER
  } else if ($id('riddleform')) {

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
    alert('使用脚本前，请先设置自定义字体[Custom Font].');
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
    openUrl(create_hvut_character_settings_url(), hvutRedirectReason('HV_UTILS_CHARACTER_SETTINGS'));
  }
  return;
}

// 精力读数 tooltip 汉化（游戏原生 stamina_readout，旧汉化私加功能，移植自 3.0.0）
{
  const staminaElement = $id('stamina_readout');
  const staminaImg = staminaElement && staminaElement.querySelector('img');
  if (staminaImg) {
    let staminaText = staminaImg.getAttribute('title') || '';
    for (const key in HVUT_CN.stamina) {
      if (staminaText.includes(key)) {
        staminaText = staminaText.replace(key, HVUT_CN.stamina[key]);
        break;
      }
    }
    staminaImg.setAttribute('title', staminaText);
    staminaElement.querySelectorAll('div[title]').forEach((child) => {
      const title = child.getAttribute('title');
      if (title && HVUT_CN.stamina[title]) {
        child.setAttribute('title', HVUT_CN.stamina[title]);
      }
    });
  }
}

// PLAYER DATA
const _player = parse_hvut_player_state(level_exec, $id('stamina_readout'), 'isekaiPlayerState');
if (_player === null) return;

/* START */

/* eslint-disable one-var */
var _ch = {},
    _eq = {},
    _ab = {},
    _tr = {},
    //_it = {},
    //_in = {},
    _se = {},

    //_es = {},
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

    //_re = {},
    //_up = {},
    //_en = {},
    //_sa = {},
    //_fo = {},
    //_fu = {},

    _top = {},
    _bottom = {};
/* eslint-enable */

// EQUIP PARSER
const $equip = {}; // 旧 10 级品质/forge 体系字面量(837行)随旧页面死亡, 2026-06-10 全量收口公共区 bindEquip(isekai 4.2.0 基准)
bindEquip($equip, { config: $config });

// ITEM INVENTORY
// $item 已提公共区（L2）

// ITEM PRICE
const $price = {};
bindPrice($price, { config: $config }); // 收口共享内核(L1 bindPrice), 物价数据分服(默认命名空间)、逻辑统一

// MoogleMail
// $mail 已提公共区（L2）

// Battle Panel: Equipment Enchant and Repair
const $battle = {
  // [HVAA 2026-06-10] 渲染/交互内核 + 数据层均已收口 bindBattlePanel(L1, 与 isekai 同一实现)。
  // 能量模型后主世界修理机制与 isekai 同构(Bazaar ss=am screen=repair + dynjs_equip), 原 Forge 修理流
  // (?s=Forge&ss=re)与详情页附魔只读展示(#equip_extended/#ee)随旧页面消失而下线(2026-06-10 实站报错证实)。
  // 本字面量只剩主世界外层接线 init。
  eqitems: {},
  itemdata: {},

  init: function () {
    // 渲染/交互内核已收口 bindBattlePanel(L1, 与 isekai 同一实现) —— 布局改内核模板, 两版同时生效。
    // 此处只留主世界外层接线: mainpane 持 on 类的宽度规则 / popup 偏移 / --color-* token 主题值(主世界米黄;
    // isekai 在 :root 定义暗红, 两 IIFE 互斥执行故各自定义)。
    GM_addStyle(/*css*/`
      .hvut-bt-outer { width: 1220px !important; }
      .hvut-bt-outer > p { width: 520px; margin-left: auto; margin-right: auto; }
      .hvut-bt-on .hvut-bt-outer { width: 620px !important; }
      .hvut-bt-on.hvut-bt-left .hvut-bt-outer { margin-left: 600px !important; }
      .hvut-bt-on.hvut-bt-right .hvut-bt-outer { margin-right: 600px !important; }
      #popup_box.hvut-bt-right-popup { left: 624px !important; }
      #popup_box.hvut-bt-left-popup { left: 244px !important; }

      .hvut-bt-div { color: #333; } /* token 已归一公共 :root(L1), 面板边框等随之贴 HV 原生色 */
    `);

    $battle.init_panel($id('mainpane'));

    $id('mainpane').classList.add('hvut-bt-on');
    $id('mainpane').style.paddingRight = '8px';

    if ($config.settings.equipEnchantPosition === 'right') {
      $id('mainpane').classList.add('hvut-bt-right');
      $id('popup_box').classList.add('hvut-bt-right-popup');
    } else {
      $id('mainpane').classList.add('hvut-bt-left');
      $id('popup_box').classList.add('hvut-bt-left-popup');
    }

    $qs('#arena_outer, #rob_outer, #towerstart, #grindfest, #itemworld_outer')?.classList.add('hvut-bt-outer');

    $battle.create();
  },

};
bindBattlePanel($battle, { // 渲染/交互内核 + 数据层(2026-06-10 续收, 能量模型后两版机制同构)全量收口(L1)
  config: $config,
  dict: 'material',
  divSel: '.hvut-bt-div',
  inventory: () => $config.settings.equipEnchantItemInventory,
  threshold: () => $config.settings.equipEnchantRepairThreshold,
  equip: () => $equip,
  persona: () => $persona,
});

// BASIC CSS
GM_addStyle(/*css*/`
  input, textarea, select, option { font-size: 9pt; }
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

  .hvut-warn { color: #e00 !important; }
  .hvut-bonus { color: #03c !important; }
  .hvut-none { display: none !important; }
  .hvut-none-cont .hvut-none-item { display: none; }
  .hvut-cphu, .hvut-cphu-sub > * { cursor: pointer; }
  .hvut-cphu:hover, .hvut-cphu-sub > *:hover { text-decoration: underline; }
  .hvut-spaceholder { flex-grow: 1; }
  .hvut-side { position: absolute; width: 100px; display: flex; flex-direction: column; }
  .hvut-side > input { margin: 3px 0; white-space: normal; }
  .hvut-side-margin { margin-bottom: 10px !important; }

  .equiplist { font-weight: normal; }
  .eqp { margin: 5px; width: auto; }
  .eqp:hover { background-color: #ddd; }
  .eqp > div:last-child { position: relative; padding: 1px 5px; line-height: 20px; white-space: nowrap; }
  .hvut-eq-customname::after { visibility: hidden; content: attr(data-eqname); position: absolute; top: -1px; left: -1px; min-width: 100%; border: 1px solid; padding: inherit; background-color: inherit; }
  .hvut-eq-customname:hover::after { visibility: visible; }
  .hvut-eq-category { margin: 10px 0 5px; padding: 2px 5px; border: 1px solid; font-size: 10pt; font-weight: bold; background-color: #edb; }
  .hvut-eq-loading .hvut-eq-category { background-color: #eee; color: #333; }
  .hvut-eq-type { margin: 10px 5px 5px; padding: 2px 5px; border: 1px solid; font-size: 10pt; font-weight: bold; }
  div + .hvut-eq-border { margin-top: 11px; }
  div + .hvut-eq-border::before { content: ''; position: absolute; margin-top: -6px; width: 100%; border-top: 1px solid #5C0D11; }
  .hvut-none-cont .hvut-eq-border { margin-top: 0; }
  .hvut-none-cont .hvut-eq-border::before { content: none; }

  .itemlist { user-select: auto !important; }
  .itemlist > tbody > tr > td > div { padding: 3px 5px 3px 18px; line-height: 16px; }
  .itemlist > tbody > tr > td > div[style*='color'] { box-shadow: 0 0 0 2px inset; }
  .it, .it ~ td { padding-top: 7px; }
  .hvut-item-Consumable { color: #00B000; }
  .hvut-item-Artifact { color: #0000FF; }
  .hvut-item-Trophy { color: #461B7E; }
  .hvut-item-Token { color: #254117; }
  .hvut-item-Crystal { color: #BA05B4; }
  .hvut-item-MonsterFood { color: #489EFF; }
  .hvut-item-Material { color: #f00; }
  .hvut-item-Collectable { color: #0000FF; }
`);

if (false /* [v10.0.1] sssss2 品质整件染色已禁用，改用 indefined 词缀分色 (src/i18n/equip-translate.js) */) {
  GM_addStyle(/*css*/`
    .eqp > div:last-child:not([onclick]) { color: #966; }
    .eqp > div:last-child[style*='color'] { box-shadow: 0 0 0 2px inset; }
    .hvut-eq-Peerless { background-color: #fbb; }
    .hvut-eq-Legendary { background-color: #fd8; }
    .hvut-eq-Magnificent { background-color: #bdf; }
    .hvut-eq-Exquisite { background-color: #ce9; }
    .hvut-eq-Superior { background-color: #ccc; }
  `);
}

_eqch.init(); // 属性面板双列展开收口 L3.A2（两 IIFE 共用; 旧 #stats_pane/.st1-.st3 折叠按钮段随旧页面死亡, 主世界已同构 isekai #stats_scrollable）

// DISABLE FONT ENGINE
_window.common.get_dynamic_digit_string = function (n) { return `<div class="fc4 far fcb"><div>${n.toLocaleString()}</div></div>`; };

if ($config.settings.equipHoverFunctions) {
  // EQUIPMENT KEY FUNCTIONS
  document.addEventListener('keydown', (e) => {
    if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') {
      return;
    }
    const div = $qs('div[data-eid]:hover');
    if (div) {
      const eq = $equip.parse.elem(div); // 旧 parse.div 随旧 $equip 体系退化(2026-06-10) → isekai parse.elem
      if (!eq || eq.data?.error || !eq.info) {
        return;
      }
      if (e.key === 'C') {
        div.dispatchEvent(new MouseEvent('mouseover'));
        document.dispatchEvent(new KeyboardEvent('keypress', { which: 99, keyCode: 99 }));
      }
      const key = e.key.toUpperCase();
      if (key === 'V') {
        openUrl(create_hvut_equip_page_url(eq), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);
      } else if (key === 'L') {
        prompt('论坛链接:', `[url=${create_hvut_equip_page_url(eq, { absolute: true })}]${eq.info.name}[/url]`);
      } else if (key === 'K') {
        $equip.namecode(eq);
        prompt('论坛链接:', `[url=${create_hvut_equip_page_url(eq, { absolute: true })}]${eq.data.namecode}[/url]`);
      }
    }
  });

  // EQUIPMENT MOUSE FUNCTIONS
  document.addEventListener('dblclick', () => {
    const div = $qs('div[data-eid]:hover');
    if (div) {
      openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);
    }
  });
}

if ($config.settings.equipTouchFunctions) {
  // EQUIPMENT TOUCH FUNCTIONS
  function handleAction(target) {
    const div = target?.closest('div[data-eid]');
    if (!div) {
      return;
    }
    openUrl(create_hvut_equip_page_url(div), hvutRedirectReason('HV_UTILS_EQUIP_POPUP'), true);
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
bindTop(_top, { config: $config, player: () => _player, re: () => $re }); // 全量收口(L1 bindTop): 旧 4.0.0 菜单表(Forge 组/Equip Inventory ss=in/Equipment Shop ss=es 死端点)随能量模型下线, 菜单/首行导航两服一致由内核结构性保证
_top.init();

// DIFFICULTY CHANGER
const $dfct = {};
bindDfct($dfct, { config: $config, get top() { return _top; }, get player() { return _player; } }); // 收口共享内核(L1 bindDfct)

$dfct.init();

// PERSONA & EQUIPMENT SET CHANGER
// 全方法已收口 bindPersona(L1; parse_stats_pane 2026-06-10 续收——旧 .spn/#stats_pane 解析随旧页面死亡);
// 真分叉经 ctx 倒置(warnSelector/.fcr 解析 + parse.div)。
const $persona = {};
bindPersona($persona, { // 收口共享内核(L1 bindPersona)
  config: $config,
  get top() { return _top; },
  get dfct() { return $dfct; },
  get battle() { return $battle; },
  get player() { return _player; },
  warnSelector: '#stamina_restore .fcr',
  parseEquipElem: (d) => $equip.parse.elem(d), // 旧 parse.div 随旧 $equip 体系退化(2026-06-10), 两版接线归一 .elem
  applyDynjs: (html) => { Object.assign($equip.dynjs_equip, parse_script_json(html, 'dynjs_equip')); }, // 能量模型后与 isekai 同构(增量合并 dynjs_equip); 仍经 ctx 仅因 $equip 容器归属本 IIFE 闭包
});

$persona.init();

// BOTTOM MENU
GM_addStyle(/*css*/`
  #hvut-bottom { position: absolute; display: flex; top: 100%; left: -1px; width: 100%; border: 1px solid; font-size: 10pt; line-height: 20px; }
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
    _bottom.node.credits = $element('div', _bottom.node.div, '加载中...');
    if ($id('networth')) {
      _bottom.node.credits.textContent = $id('networth').textContent;
      $id('networth').remove();
    } else {
      const html = await $ajax.fetch(create_hvut_item_shop_url());
      const doc = $doc(html);
      _bottom.node.credits.textContent = $id('networth', doc).textContent;
    }
  };

  _bottom.show_credits();
}

// EQUIPMENT COUNTER
if ($config.settings.showEquipSlots === 2 || $config.settings.showEquipSlots === 1 && _query.s === 'Battle') {
  _bottom.show_equip = async function () {
    // [2026-06-10 能量模型] 旧 ?s=Character&ss=in 'Equip Slots' 行已消失(exec null 崩, 实站报错证实);
    // 对齐 isekai: Bazaar ss=am screen=organize 的 Inventory Capacity 表(样本 modify 端点已证主世界为 am 体系)。
    _bottom.node.equip = $element('div', _bottom.node.div, '加载中...');
    let capacity;
    try {
      const html = await $ajax.fetch(create_hvut_armory_organize_url());
      capacity = parse_hvut_inventory_capacity(html, 'legacyBottomInventoryCapacity');
    } catch (_error) {
      capacity = record_hvut_shrine_capacity_failure('legacyBottomInventoryCapacityFetch', { reason: 'requestFailed' });
    }
    if (capacity === null) {
      _bottom.node.equip.textContent = '装备库存量: unavailable';
      _bottom.node.equip.classList.add('hvut-bottom-warn');
      return;
    }
    const { usage } = capacity;
    const free = capacity.capacity - usage;
    const warnCapacity = normalize_hvut_bottom_warn_capacity($config.settings, capacity.capacity);
    _bottom.node.equip.textContent = `装备库存量: ${usage} / ${capacity.capacity}`;
    if (free < warnCapacity) {
      _bottom.node.equip.classList.add('hvut-bottom-warn');
    } else if (free < capacity.capacity / 2) {
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
      _bottom.tr.node.link = $element('a', _bottom.tr.node.div, { href: create_hvut_training_url(), textContent: '初始化...', style: 'margin-right: 5px;' });
      _bottom.tr.node.clock = $element('span', _bottom.tr.node.div, ['!display: inline-block; width: 60px;']);
      if (json.error) {
        _bottom.tr.node.link.textContent = json.error;
      } else if (json.current_name) {
        _bottom.tr.node.link.textContent = `${hvaaT(json.current_name, 'trains')} [${json.current_level + 1}]`;
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
        _bottom.tr.node.link.textContent = '加载中...';
        _bottom.tr.node.clock.textContent = '';
        _bottom.tr.load();
      }
    },
    load: async function (post) {
      const html = await $ajax.fetch(create_hvut_training_url(), post);
      const doc = $doc(html);
      if (!$id('train_outer', doc)) {
        _bottom.tr.node.link.textContent = '请稍等...';
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
        const current_end = parse_hvut_training_end_time(html, 'bottomTrainingHtmlEndTime');
        if (current_end === null) {
          json.error = '解析训练倒计时失败';
          _bottom.tr.node.link.textContent = json.error;
          if (!$config.set('tr_notif', json, 'hvut_')) {
            json.error = '保存训练通知失败';
            _bottom.tr.node.link.textContent = json.error;
          }
          return false;
        }
        json.current_name = $id('train_progcnt', doc).previousElementSibling.textContent;
        json.current_level = level[json.current_name];
        json.current_end = current_end;
        _bottom.tr.node.link.textContent = `${hvaaT(json.current_name, 'trains')} [${json.current_level + 1}]`;
        _bottom.tr.clock();
      } else if (json.next_name) {
        const response = classify_hvut_training_notification_response(doc, 'bottomTrainingStartResponse', { next_name: json.next_name, next_level: json.next_level, next_id: json.next_id });
        if (response.kind === 'rejected') {
          json.error = response.message;
          _bottom.tr.node.link.textContent = json.error;
          setTimeout(_bottom.tr.clock, 60000);
        } else if (level[json.next_name] < json.next_level) {
          if ($qs(`img[onclick*="training.start_training(${json.next_id})"]`, doc)) {
            _bottom.tr.load('start_train=' + json.next_id);
          } else {
            json.error = "现在无法开始训练";
            _bottom.tr.node.link.textContent = json.error;
            setTimeout(_bottom.tr.clock, 60000);
          }
        } else {
          _bottom.tr.node.link.textContent = '训练完成!';
        }
      } else {
        _bottom.tr.node.link.textContent = '训练完成!';
      }
      if (!$config.set('tr_notif', json, 'hvut_')) {
        json.error = '保存训练通知失败';
        _bottom.tr.node.link.textContent = json.error;
        return false;
      }
      return true;
    },
  };

  _bottom.tr.init();
}

// LOTTERY
if ($config.settings.lotteryNotification) {
  _bottom.record_lottery_notification_failure = function (stage, ss, detail) {
    const evidence = { capability: 'lotteryNotification', stage, ss, ...(detail || {}) };
    try {
      sessionStorage.setItem('HVAA:lastLotteryNotificationFailure', JSON.stringify(evidence));
    } catch (_error) {
      // Lottery notification fallback must not depend on diagnostic storage.
    }
    try {
      console.warn('[HVUT] lottery notification failed', evidence);
    } catch (_error) {
      // Console hooks must not block lottery notification fallback.
    }
    return evidence;
  };

  _bottom.read_lottery_state = function (ss) {
    const json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_') || {};
    if (!json.lt || typeof json.lt !== 'object') json.lt = {};
    if (!json.la || typeof json.la !== 'object') json.la = {};
    if (!json[ss] || typeof json[ss] !== 'object') json[ss] = {};
    return { json, lottery: json[ss] };
  };

  _bottom.evaluate_lottery_filter = function (ss, equip) {
    const reportErrors = (filterErrors, matched = false) => {
      _bottom.record_lottery_notification_failure('filter', ss, { equip, errors: filterErrors });
      return {
        matched,
        error: (Array.isArray(filterErrors) ? filterErrors : [])
          .map((e) => `${e.filter}: ${e.error}`)
          .join('\n') || null,
      };
    };
    const filterErrors = [];
    try {
      const result = $equip.filter.match($config.settings.lotteryFilters, equip);
      const matched = result.matched;
      filterErrors.push(...result.errors);
      if (filterErrors.length) return reportErrors(filterErrors, matched);
      return {
        matched,
        error: null,
      };
    } catch (error) {
      filterErrors.push({ filter: '<lotteryFilters>', error: error?.message || String(error) });
      return reportErrors(filterErrors, false);
    }
  };

  _bottom.read_lottery_draw_time = function (text, now) {
    const drawMatch = /(?:Today's\s+)?drawing is in\s*(?:(\d+)\s*hours?)?(?:\s*(?:,|and)\s*)?(?:(\d+)\s*minutes?)?/i.exec(text || '');
    if (drawMatch) {
      return {
        date: now + (60 * parseInt(drawMatch[1] || 0) + parseInt(drawMatch[2] || 0)) * 60000,
        margin: 2,
        known: true,
      };
    }
    if ((text || '').includes("Today's ticket sale is closed")) {
      return { date: now, margin: 10, known: true };
    }
    return { date: now, margin: 0, known: false, error: 'drawTimeNotFound' };
  };

  _bottom.render_lottery_equip_text = function (ss, equip, lottery) {
    try {
      return equip_name_text_str(equip);
    } catch (error) {
      const renderError = error?.message || String(error);
      if (lottery && typeof lottery === 'object') lottery.renderError = renderError;
      _bottom.record_lottery_notification_failure('equipRender', ss, { equip, error: renderError });
      return String(equip ?? '');
    }
  };

  _bottom.show_lottery = function (ss) {
    const { lottery } = _bottom.read_lottery_state(ss);
    const now = Date.now();
    if (lottery.date > now && lottery.hide) {
      return;
    }
    _bottom.node[ss] = {};
    _bottom.node[ss].div = $element('div', _bottom.node.div, ['.hvut-lt-div']);
    _bottom.node[ss].equip = $element('a', _bottom.node[ss].div, { textContent: '加载中...', href: create_hvut_bazaar_section_url(ss), target: !IS_ISEKAI ? '_self' : '_blank' });
    _bottom.node[ss].time = $element('span', _bottom.node[ss].div, '--:--');

    if (lottery.date > now) {
      if (lottery.date - now < 3600000) {
        _bottom.node[ss].div.classList.add('hvut-bottom-warn');
      } else if (lottery.check) {
        _bottom.node[ss].div.classList.add('hvut-lt-check');
      }
      _bottom.node[ss].equip.textContent = _bottom.render_lottery_equip_text(ss, lottery.equip, lottery);
      _bottom.node[ss].time.textContent = time_format(lottery.date - now, 1);
      return;
    }
    _bottom.node[ss].div.classList.add('hvut-bottom-warn');
    _bottom.load_lottery(ss);
  };

  _bottom.load_lottery = async function (ss) {
    try {
      const html = await $ajax.fetch(create_hvut_bazaar_section_url(ss));
      const doc = $doc(html);
      const eqname = $id('lottery_eqname', doc);
      if (!eqname) {
        _bottom.node[ss].equip.textContent = '加载失败';
        _bottom.record_lottery_notification_failure('load', ss, { error: 'missingEquipName' });
        return;
      }
      const rightpaneText = $id('rightpane', doc)?.textContent || '';
      const { json, lottery } = _bottom.read_lottery_state(ss);
      const now = Date.now();
      const drawTime = _bottom.read_lottery_draw_time(rightpaneText, now);
      let date = drawTime.date;
      const margin = drawTime.margin;
      const mm = (new Date(date)).getUTCMinutes();
      if (drawTime.known && date && (mm < 1 || 60 - mm <= margin)) {
        date = Math.round(date / 3600000) * 3600000;
      }
      const prevOnclick = $qs('img[src*="lottery_prev_a.png"]', doc)?.getAttribute('onclick') || '';
      const prevMatch = /lottery=(\d+)/.exec(prevOnclick);
      lottery.id = parseInt(prevMatch?.[1] || 0) + 1;
      lottery.equip = eqname.textContent;
      lottery.date = date;
      lottery.dateError = drawTime.error || null;
      let filterResult = { matched: false, error: null };
      try {
        filterResult = _bottom.evaluate_lottery_filter(ss, lottery.equip) || filterResult;
      } catch (error) {
        const filterError = error?.message || String(error);
        filterResult = { matched: false, error: filterError };
        _bottom.record_lottery_notification_failure('filterDecision', ss, { equip: lottery.equip, error: filterError });
      }
      lottery.check = filterResult.matched;
      lottery.filterError = filterResult.error;
      lottery.hide = !$config.settings.lotteryNotification;
      // 彩票按「开奖日」去重弹窗：同一抽奖周期(featured 装备持续到当天开奖)只弹一次，
      // 避免「Today's ticket sale is closed」窗口 lottery.date≈now → 每次刷新都重跑 load_lottery 反复弹。
      // 键取开奖时间(lottery.date)的 UTC 日：周期内恒定、跨周期(下次开奖+1天)必变 → 开奖换装备即重弹一次。
      const drawDay = new Date(date).toISOString().slice(0, 10);
      const shouldPopup = lottery.check && lottery.popDay !== drawDay;
      if (shouldPopup) lottery.popDay = drawDay;
      const lotteryEquipText = _bottom.render_lottery_equip_text(ss, lottery.equip, lottery);
      _bottom.node[ss].equip.textContent = lotteryEquipText;
      _bottom.node[ss].time.textContent = drawTime.known ? time_format(lottery.date - now, 1) : '--:--';
      try {
        if (!$config.set('lt_notif', json, 'hvut_')) {
          lottery.persistenceError = 'configWriteFailed';
          _bottom.record_lottery_notification_failure('persistence', ss, { error: lottery.persistenceError });
          return false;
        }
      } catch (error) {
        lottery.persistenceError = error?.message || String(error);
        _bottom.record_lottery_notification_failure('persistence', ss, { error: lottery.persistenceError });
        return false;
      }
      if (shouldPopup) {
        try {
          const date_text = eqname.previousElementSibling?.textContent || '';
          popup(`<p>${date_text}</p><p style="color: #f00; font-weight: bold;">${lotteryEquipText}</p>`);
        } catch (error) {
          lottery.popupError = error?.message || String(error);
          _bottom.record_lottery_notification_failure('popup', ss, { error: lottery.popupError });
        }
      }
    } catch (error) {
      _bottom.node[ss].equip.textContent = '加载失败';
      _bottom.node[ss].time.textContent = '--:--';
      _bottom.record_lottery_notification_failure('load', ss, { error: error?.message || String(error) });
    }
  };

  $element('div', _bottom.node.div, ['.hvut-spaceholder']);

  _bottom.show_lottery('lt');
  _bottom.show_lottery('la');
}


//* [1] Character - Character
if (_query.s === 'Character' && _query.ss === 'ch' || $id('persona_outer')) {
  _ch.persona = $id('persona_form').elements.persona_set.value;
  // _ch 经验模拟器: refuter(2026-06-10) 判 true-dup(公式两版 byte-identical), 但 $input 签名/结构/init流 分叉,
  // 全收口需结构归一重构 + UI 实站验证 → 留各版待实站基线后专做(详 isekai 版注释)。
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
      _ch.node.level = $input(['number', 'Level', 'before'], _ch.node.div, { value: _player.level, min: 1, max: 600, style: 'width: 50px;' });
      const ass = $config.get('tr_level', {})['Assimilator'] || 0;
      _ch.node.ass = $input(['number', 'Training: Assimilator', 'before'], _ch.node.div, { value: ass, min: 0, max: 25, style: 'width: 30px;' });
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
        p.tr.cells[2].textContent = '礼物' + (p.level - p.current).toFixed(3);
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
  $input(['button', '经验模拟器'], _ch.node.div, null, () => { _ch.exp.init(); });

  const statsOutcome = $persona.parse_stats_pane_outcome();
  if (statsOutcome.kind === 'rejected') return;
} else
// [END 1] Character - Character */


//* [2] Character - Equipment
if (_query.s === 'Character' && _query.ss === 'eq') {
  _eq.show_base = async function () { // 旧 .st1-.st3 selector 随旧页面死亡 → isekai 版(#stats_scrollable, 2026-06-10)
    const html = await $ajax.fetch(create_hvut_character_page_url());
    const doc = $doc(html);
    const base = {};
    $qsa('#attr_table tr:nth-last-child(n+2)', doc).forEach((tr) => {
      const stat = parse_hvut_character_base_stat_row(tr, 'legacyEquipmentBaseStatSourceRow');
      if (stat) base[stat.name] = stat.value;
    });
    $qsa('#stats_scrollable > table:nth-last-of-type(2) tr').forEach((tr) => {
      decorate_hvut_equipment_base_stat_row(tr, base, 'legacyEquipmentBaseStatTargetRow');
    });
  };

  _eq.equip_code = function () {
    const code = _eq.equiplist.map((eq) => `[url=${create_hvut_equip_page_url(eq, { absolute: true })}]${eq.info.name}[/url]`);
    popup_text(code, 900, 150);
  };

  _eq.equip_popups = function () {
    if (_eq.node.popups) {
      _eq.node.popups.classList.toggle('hvut-none');
      return;
    }
    _eq.node.popups = $element('div', document.body, ['.hvut-eq-popups', (_eq.equiplist.length > 6 ? '!width: 1500px;' : '')]);
    _eq.equiplist.forEach((eq) => { $element('iframe', _eq.node.popups, { src: create_hvut_equip_page_url(eq), scrolling: 'no' }); });
  };

  _eq.prof = {
    node: {},
    // 原旧 $equip.forge('Elemental') 内联: 旧公式表随旧 $equip 体系全删后, 熟练度模拟器仅存活此一条
    // (scale 250/7, fluc 0.0306, factor 0.2)。纯计算不解析页面; 公式若随能量模型过时仅数字偏差不崩。
    prof_scale: function (base, upgrade, pxp, level) {
      const bonus = (pxp - 100) / 25 * 0.0306;
      const coeff = 1 + 0.2 * Math.log(1 + 0.1 * upgrade);
      return ((base - bonus) * coeff + bonus) * (1 + level / (250 / 7));
    },
    list: [],
    equips: {
      'Oak Staff': { base: 6.45, pxp: 371 },
      'Willow Staff': { base: 6.14, pxp: 371 },
      'Redwood Staff': { base: 8.29, pxp: 371 },
      'Redwood Staff of the Elementalist': { base: 16.24, pxp: 371 },
      'Katalox Staff': { base: 8.28, pxp: 368 },
      'Katalox Staff of the Heaven-sent/Demon-fiend': { base: 16.24, pxp: 368 },
      'Cotton Cap': { base: 8.29, pxp: 377 },
      'Cotton Robe': { base: 9.89, pxp: 377 },
      'Cotton Gloves': { base: 7.5, pxp: 377 },
      'Cotton Pants': { base: 9.09, pxp: 377 },
      'Cotton Shoes': { base: 6.7, pxp: 377 },
    },
    click: function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, key } = target.dataset;
      if (action === 'close') {
        _eq.prof.toggle();
      } else if (action === 'add') {
        _eq.prof.add();
      } else if (action === 'load') {
        _eq.prof.load(key);
      } else if (action === 'name') {
        _eq.prof.name(key);
      } else if (action === 'save') {
        _eq.prof.save(key);
      } else if (action === 'delete') {
        _eq.prof.delete(key);
      }
      const { equip, value } = target.dataset;
      if (action === 'max') {
        _eq.prof.set_max(equip, value);
      } else if (action === 'factor') {
        _eq.prof.set_factor(value);
      }
    },
    init: function () {
      if (_eq.prof.inited) {
        return;
      }
      _eq.prof.inited = true;
      _eq.prof.current = null;
      _eq.prof.list = $config.get('eq_prof', []).map((json, i) => {
        const data = {
          key: i + 1,
          json,
          values: JSON.parse(JSON.stringify(json)),
          node: {},
        };
        return data;
      });

      const node = _eq.prof.node;
      node.div = $element('div', $id('eqch_left'), ['.hvut-eq-prof'], { click: (e) => { _eq.prof.click(e); }, input: (e) => { _eq.prof.change(e); } });
      node.side = $element('div', node.div, ['.hvut-side hvut-eq-side']);
      $input(['button', '关闭'], node.side, { dataset: { action: 'close' } });
      $input(['button', '新建'], node.side, { dataset: { action: 'add' }, className: 'hvut-side-margin' });

      const p = $element('p', node.div);
      node.name = $element('span', p);
      $input(['button', '修改名称'], p, { dataset: { action: 'name' } });
      $input(['button', '保存'], p, { dataset: { action: 'save' } });
      $input(['button', '删除'], p, { dataset: { action: 'delete' } });

      const summary = $element('ul', node.div, ['.hvut-eq-summary']);
      node.proficiency = $element('li', summary, ['/<span>总熟练度</span><span></span>']).lastChild;
      node.prof_factor = $element('li', summary, ['/<span>熟练度系数</span><span></span>']).lastChild;
      node.mit_reduction = $element('li', summary, ['/<span>属性减伤降低</span><span></span>']).lastChild;
      node.counter_resist = $element('li', summary, ['/<span>反抵抗率</span><span></span>']).lastChild;

      $element('p', node.div, '玩家数据');
      const char = $element('ul', node.div, ['.hvut-eq-char', { dataset: { action: 'char' } }]);
      let li;
      li = $element('li', char, ['/<span>等级</span>']);
      node.level = $input('number', li, { min: 0, max: 500, step: 1, required: true });
      li = $element('li', char, ['/<span>基础熟练度</span>']);
      node.base = $input('number', li, { min: 0, step: 0.1 });
      node.base_factor = $element('span', li);
      $input(['button', 'x1.0'], li, { dataset: { action: 'factor', value: '1.0 ' } });
      $input(['button', 'x1.1'], li, { dataset: { action: 'factor', value: '1.1 ' } });
      $input(['button', 'x1.2'], li, { dataset: { action: 'factor', value: '1.2 ' } });
      li = $element('li', char);
      node.hathperk = $input(['checkbox', '有Hath Perk？'], $element('span', li));
      node.hath_bonus = $input('number', li, { step: 0.001, readOnly: true });

      $element('p', node.div, '装备');
      const equip = $element('table', node.div, ['.hvut-eq-equip']);
      $element('tr', equip, ['/<td></td><td>装备部位</td><td>魂绑</td><td>装备等级</td><td>pxp</td><td>最大pxp</td><td>基础熟练度</td><td>最大熟练</td><td>强化等级</td><td>最终熟练度</td>']);

      node.equips = ['柳木法杖', '法师-帽子', '法师-身体', '法师-手套', '法师-裤子', '法师-鞋子'].map((e, i) => {
        const eqnode = {};
        const eq = _eq.prof.equips[e];
        const tr = $element('tr', equip, [{ dataset: { action: 'equip', equip: i } }, '/<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>']);
        const [checkCell, typeCell, soulboundCell, levelCell, pxpCell, pxpMaxCell, baseCell, baseMaxCell, upgradeCell, scaledCell] = tr.children;

        if (i === 0) {
          eqnode.type = $input(['select', ['橡木法杖', '柳木法杖', '红木法杖', '元素使前缀的红木仗', '铁木法杖', '圣/暗前缀的铁木杖']], typeCell, { dataset: { action: 'staff' } });
        } else {
          typeCell.textContent = e;
        }

        eqnode.check = $input('checkbox', checkCell);
        eqnode.soulbound = $input('checkbox', soulboundCell);
        eqnode.level = $input('number', levelCell, { min: 1, max: 500, step: 1, required: true });
        eqnode.pxp = $input('number', pxpCell, { min: 200, max: eq.pxp, step: 1, required: true });
        eqnode.pxpmax = $element('span', pxpMaxCell, [eq.pxp, { dataset: { action: 'max', equip: i, value: 'pxp' } }]);
        eqnode.base = $input('number', baseCell, { min: 1, max: eq.base, step: 0.01, required: true });
        eqnode.pmax = $element('span', baseMaxCell, [eq.base, { dataset: { action: 'max', equip: i, value: 'base' } }]);
        eqnode.upgrade = $input('number', upgradeCell, { min: 0, max: 50, step: 1 });
        eqnode.scaled = scaledCell;
        return eqnode;
      });

      _eq.prof.list.forEach((data) => {
        _eq.prof.add_button(data);
      });
      _eq.prof.load();
    },
    load: function (key) {
      if (!_eq.prof.list.length) {
        _eq.prof.add();
        return;
      }
      if (!key) {
        key = _eq.prof.list[0].key;
      }
      if (!Number.isInteger(key)) {
        key = parseInt(key);
      }
      if (key === _eq.prof.current) {
        return;
      }
      const prev = _eq.prof.get();
      if (prev) {
        prev.node.button.classList.remove('hvut-eq-current');
      }
      _eq.prof.current = key;

      const data = _eq.prof.get(key);
      data.node.button.classList.add('hvut-eq-current');
      const node = _eq.prof.node;
      node.name.textContent = data.values.name;

      node.level.value = data.values.level || '';
      node.base.value = data.values.base || '';
      node.hathperk.checked = data.values.hathperk;
      _eq.prof.change_char();

      node.equips[0].type.value = data.values.equips[0].type;
      _eq.prof.change_staff();

      node.equips.forEach((eqnode, i) => {
        const eq = data.values.equips[i];
        eqnode.check.checked = eq.check;
        eqnode.soulbound.checked = eq.soulbound;
        eqnode.level.value = eq.level || '';
        eqnode.pxp.value = eq.pxp || '';
        eqnode.base.value = eq.base || '';
        eqnode.upgrade.value = eq.upgrade || '';
        _eq.prof.change_equip(i);
      });
      //_eq.prof.calc();
    },
    get: function (key = _eq.prof.current) {
      return _eq.prof.list.find((data) => data.key == key);
    },
    add: function () {
      let key = 1;
      while (_eq.prof.get(key)) {
        key++;
      }
      const json = {
        name: `Noname${key}`,
        level: _player.level,
        base: _player.level,
        hathperk: true,
        equips: ['柳木法杖', '法师-帽子', '法师-身体', '法师-手套', '法师-裤子', '法师-鞋子'].map((e) => {
          const eq = { ..._eq.prof.equips[e] };
          eq.type = e;
          eq.check = false;
          eq.soulbound = false;
          eq.level = _player.level;
          eq.pxp = Math.round(eq.pxp * 0.95);
          eq.base = Math.round(eq.base * 0.95 * 100) / 100;
          eq.upgrade = 0;
          return eq;
        }),
      };
      const data = {
        new: true,
        key,
        json,
        values: JSON.parse(JSON.stringify(json)),
        node: {},
      };
      _eq.prof.list.push(data);
      _eq.prof.add_button(data);
      _eq.prof.load(data.key);
    },
    add_button: function (data) {
      data.node.button = $input(['button', data.values.name], _eq.prof.node.side, { dataset: { action: 'load', key: data.key } });
      if (data.new) {
        data.node.button.classList.add('hvut-eq-new');
      }
    },
    change: function (e) {
      const target = e.target.closest('[data-action]');
      if (!target) {
        return;
      }
      const { action, equip } = target.dataset;
      if (action === 'char') {
        _eq.prof.change_char();
      } else if (action === 'equip') {
        _eq.prof.change_equip(equip);
      } else if (action === 'staff') {
        _eq.prof.change_staff();
      }
    },
    change_char: function () {
      const data = _eq.prof.get();
      const values = data.values;
      const node = _eq.prof.node;
      const prev_level = values.level;
      ['level', 'base', 'hathperk'].forEach((e) => {
        if (node[e].type === 'number') {
          values[e] = parseFloat(node[e].value) || 0;
        } else if (node[e].type === 'checkbox') {
          values[e] = node[e].checked;
        } else {
          values[e] = node[e].value;
        }
      });

      if (values.level !== prev_level) {
        node.base.max = values.level * 10 * 1.2 / 10;
        node.equips.forEach((eqnode, i) => {
          const eq = values.equips[i];
          eqnode.level.max = values.level;
          if (eq.soulbound) {
            _eq.prof.change_equip(i);
          }
        });
      }
      node.base_factor.textContent = ' = Level * ' + (values.base / values.level).toFixed(3);
      node.hath_bonus.value = values.hathperk ? (values.base * 0.1).toFixed(2) : 0;

      _eq.prof.calc();
    },
    change_equip: function (n) {
      const data = _eq.prof.get();
      const values = data.values;
      const eq = values.equips[n];
      const eqnode = _eq.prof.node.equips[n];
      ['check', 'soulbound', 'level', 'pxp', 'base', 'upgrade'].forEach((e) => {
        if (eqnode[e].type === 'number') {
          eq[e] = parseFloat(eqnode[e].value) || 0;
        } else if (eqnode[e].type === 'checkbox') {
          eq[e] = eqnode[e].checked;
        } else {
          eq[e] = eqnode[e].value;
        }
      });

      eqnode.level.disabled = eq.soulbound;
      if (eq.soulbound) {
        eq.level = values.level;
        eqnode.level.value = eq.level;
      }
      eq.scaled = _eq.prof.prof_scale(eq.base, eq.upgrade, eq.pxp, eq.level);
      eqnode.scaled.textContent = eq.scaled.toFixed(2);

      _eq.prof.calc();
    },
    change_staff: function () {
      const eqnode = _eq.prof.node.equips[0];
      const equips = _eq.prof.equips[eqnode.type.value];
      eqnode.pxp.max = equips.pxp;
      eqnode.pxpmax.textContent = equips.pxp;
      eqnode.base.max = equips.base;
      eqnode.pmax.textContent = equips.base;
    },
    set_max: function (n, stat) {
      const eqnode = _eq.prof.node.equips[n];
      eqnode[stat].value = eqnode[stat].max;
      _eq.prof.change_equip(n);
    },
    set_factor: function (value) {
      const data = _eq.prof.get();
      const values = data.values;
      _eq.prof.node.base.value = (values.level * value).toFixed(1);
      _eq.prof.change_char();
    },
    calc: function () {
      const data = _eq.prof.get();
      const values = data.values;
      const node = _eq.prof.node;

      values.proficiency = values.base;
      if (values.hathperk) {
        values.proficiency += values.base * 0.1;
      }
      values.equips.forEach((eq) => {
        if (eq.check) {
          values.proficiency += eq.scaled;
        }
      });
      values.prof_factor = Math.max(0, Math.min(1, values.proficiency / values.level - 1));
      values.mit_reduction = Math.pow(values.prof_factor, 1.5) / 2;
      values.counter_resist = values.prof_factor / 2;

      node.proficiency.textContent = values.proficiency.toFixed(3);
      node.prof_factor.textContent = values.prof_factor.toFixed(3);
      node.mit_reduction.textContent = (values.mit_reduction * 100).toFixed(2) + '%';
      node.counter_resist.textContent = (values.counter_resist * 100).toFixed(2) + '%';
    },
    save: function (key = _eq.prof.current) {
      const data = _eq.prof.get(key);
      const json = JSON.parse(JSON.stringify(data.values));
      const persisted = _eq.prof.list.filter((entry) => entry === data || !entry.new).map((entry) => (entry === data ? json : entry.json));
      if (!$config.set('eq_prof', persisted)) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      data.json = json;
      if (data.new) {
        data.node.button.classList.remove('hvut-eq-new');
        data.new = false;
      }
      return true;
    },
    name: function (key = _eq.prof.current) {
      const data = _eq.prof.get(key);
      const name = prompt('输入方案名称', data.values.name)?.trim();
      if (!name) {
        return;
      }
      data.values.name = name;
      data.node.button.value = name;
      _eq.prof.node.name.textContent = name;
    },
    delete: function (key = _eq.prof.current) {
      const data = _eq.prof.get(key);
      const index = _eq.prof.list.findIndex((data) => data.key === key);
      const json = _eq.prof.list.filter((entry) => entry !== data && !entry.new).map((data) => data.json);
      if (!$config.set('eq_prof', json)) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      data.node.button.remove();
      _eq.prof.list.splice(index, 1);
      if (key == _eq.prof.current) {
        _eq.prof.current = null;
      }
      _eq.prof.load();
      return true;
    },
    toggle: function () {
      _eq.prof.node.div?.classList.toggle('hvut-none');
      _eq.prof.init();
    },
  };

  _eq.node = {};

  if (_query.equip_slot) {
    GM_addStyle(/*css*/`
      #eqch_left .eqb { padding: 0; height: auto; font-size: 10pt; line-height: 20px; text-align: center; overflow: hidden; }
      #eqch_left .eqb > div:last-child { padding: 1px 0; position: relative; }
    `);

    $equip.list.table($qs('#equiplist > table'));
  } else {
    GM_addStyle(/*css*/`
      #popup_box.hvut-eq-popupbox { margin-top: 15px; }
      #eqch_left { height: 654px; padding-top: 3px; }
      #eqsh { display: none; }
      #eqsl { margin-top: 15px; }
      #eqsb .eqb { padding: 0; height: auto; font-size: 10pt; line-height: 20px; text-align: center; overflow: hidden; }
      #eqsb .eqb > div:last-child { padding: 1px 0; position: relative; }

      .hvut-eq-buttons { display: flex; width: 650px; margin: 5px auto; text-align: left; }
      .hvut-eq-info { position: absolute; top: 0; right: 0; font-size: 9pt; }
      .hvut-eq-info > span { display: inline-block; margin: 0 3px; }
      .hvut-eq-info > span:nth-child(2) { width: 35px; }
      .hvut-eq-info > span:nth-child(3) { width: 35px; }
      .hvut-eq-untradeable { color: #c00; }
      .hvut-eq-cdt1 { color: #c00; }
      .hvut-eq-cdt2 { color: #fff; background-color: #c00; }


      .hvut-eq-prof { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: auto; padding-left: 120px; box-sizing: border-box; font-size: 10pt; text-align: left; background-color: #EDEBDF; }
      .hvut-eq-prof input[type='number'] { text-align: right; }
      .hvut-eq-prof input[type='checkbox'] { top: 3px; }
      .hvut-eq-prof input:invalid { color: #e00; }
      .hvut-eq-prof span { display: inline-block; }
      .hvut-eq-prof p { margin: 5px 0; font-weight: bold; white-space: nowrap; }
      .hvut-eq-prof p > span { min-width: 150px; }
      .hvut-eq-prof ul { margin: 5px 0 15px; padding: 0; max-width: 530px; list-style: none; }
      .hvut-eq-prof li { margin: 1px 0; height: 22px; line-height: 22px; }
      .hvut-eq-side { top: 0; left: 0; }
      .hvut-eq-current { color: #03c !important; border-color: #03c !important; }
      .hvut-eq-new { font-style: italic; }
      .hvut-eq-summary span:first-child { width: 150px; }
      .hvut-eq-summary span:last-child { width: 50px; font-weight: bold; text-align: right; }
      .hvut-eq-char li > *:nth-child(1) { width: 130px; }
      .hvut-eq-char li > *:nth-child(2) { width: 60px; }
      .hvut-eq-char li > *:nth-child(3) { margin: 0 10px; }
      .hvut-eq-equip { table-layout: fixed; width: 530px; line-height: 22px; }
      .hvut-eq-equip td { padding: 1px 5px; }
      .hvut-eq-equip input { width: 100%; margin: 0; box-sizing: border-box; }
      .hvut-eq-equip select { width: 100%; margin: 0; }
      .hvut-eq-equip tr:first-child { border: 1px solid; }
      .hvut-eq-equip td:nth-child(1) { width: 20px; }
      .hvut-eq-equip td:nth-child(3) { width: 20px; direction: rtl; }
      .hvut-eq-equip td:nth-child(4) { width: 40px; }
      .hvut-eq-equip td:nth-child(5) { width: 40px; }
      .hvut-eq-equip td:nth-child(6) { width: 25px; text-align: right; padding-right: 10px; }
      .hvut-eq-equip td:nth-child(7) { width: 50px; }
      .hvut-eq-equip td:nth-child(8) { width: 35px; text-align: right; padding-right: 10px; }
      .hvut-eq-equip td:nth-child(9) { width: 30px; }
      .hvut-eq-equip td:nth-child(10) { width: 50px; text-align: right; padding-right: 10px; }
      .hvut-eq-equip td > span { cursor: pointer; }

      .hvut-eq-popups { position: relative; width: 1238px; padding: 10px 0; line-height: 0; text-align: left; background-color: inherit; }
      .hvut-eq-popups iframe { width: 372px; height: 445px; border: 1px solid; margin: 0 -1px -1px 0; overflow: hidden; }
    `);

    $id('popup_box').classList.add('hvut-eq-popupbox');

    const personaContext = render_hvut_equipment_persona_context($persona, 'legacyEquipmentPersonaContextRejected');
    if (personaContext.kind === 'rejected') return;

    _eq.show_base();
    _eq.equiplist = $equip.list.div($id('eqsb'), false);
    _eq.equiplist.forEach((eq) => {
      eq.node.elem.textContent = eq.node.elem.textContent; // 旧 $equip.parse.div→eq.node.div 已随退化改名 eq.node.elem(parse.elem); 主世界 mm 同址早改对(8357), isekai 漏改致 Character eq 页崩
      $element('div', eq.node.wrapper.firstElementChild, ['.hvut-eq-info']).append(
        $element('span', null, [(eq.info.soulbound ? 'Soulbound' : 'Lv.' + eq.info.level), (eq.info.soulbound || !eq.info.tradeable ? '.hvut-eq-untradeable' : '')]), ' : ',
        // [HVAA 移植 chunk1] 新能量模型无潜能等级(tier) → 改显能量(Energy)，避免 "潜能等级 undefined"。
        $element('span', null, (eq.info.energy == null ? '能量 N/A' : '能量 ' + eq.info.energy + '%')), ' : ',
        $element('span', null, [Math.ceil(eq.info.condition) + '%', (eq.info.condition <= 50 ? '.hvut-eq-cdt2' : eq.info.condition <= 60 ? '.hvut-eq-cdt1' : '')]) // cdt(旧 parse 比值字段)随旧 $equip 退化 → isekai parse.html 的 condition(百分比)
      );
    });

    _eq.node.buttons = $element('div', [$id('eqch_left'), 'afterbegin'], ['.hvut-eq-buttons']);
    $input(['button', '生成装备代码'], _eq.node.buttons, null, () => { _eq.equip_code(); });
    $input(['button', '生成装备一览'], _eq.node.buttons, null, () => { _eq.equip_popups(); });
    $input(['button', '熟练度计算器'], _eq.node.buttons, null, () => { _eq.prof.toggle(); });
    _eq.node.equipset_name = $input('text', _eq.node.buttons, { value: $persona.json.ename || '套装 ' + $persona.json.eset, style: 'width: 100px; margin-left: auto; text-align: center;' });
    $input(['button', '保存'], _eq.node.buttons, null, () => { $persona.set_value('姓名', _eq.node.equipset_name.value); });

    /*
    const statsOutcome = $persona.parse_stats_pane_outcome();
    if (statsOutcome.kind === 'accepted' && statsOutcome.stats_pane?.['Spell Type']) {
      _eq.stats_pane = statsOutcome.stats_pane;
      _eq.mage_stats();
    }
    //*/ // mage_stats 旧 stats 公式链随旧 $equip 退化; isekai 基准同为注释占位(待新能量模型重写, handoff 开放项)
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
    '1H Damage': { category: '单手重甲盾战', img: 'e.png', pos: -68, unlock: [0, 100, 200], point: [2, 3, 5] },
    '1H Accuracy': { category: '单手重甲盾战', img: 'e.png', pos: -34, unlock: [50, 150], point: [1, 2] },
    '1H Block': { category: '单手重甲盾战', img: 'e.png', pos: 0, unlock: [250], point: [3] },
    '2H Damage': { category: '双手轻甲战士', img: 'k.png', pos: -34, unlock: [0, 100, 200], point: [2, 3, 5] },
    '2H Accuracy': { category: '双手轻甲战士', img: 'k.png', pos: 0, unlock: [50, 150], point: [1, 2] },
    '2H Parry': { category: '双手轻甲战士', img: 'e.png', pos: -102, unlock: [250], point: [3] },
    'DW Damage': { category: '双持轻甲战士', img: 'j.png', pos: 0, unlock: [0, 100, 200], point: [2, 3, 5] },
    'DW Accuracy': { category: '双持轻甲战士', img: 'k.png', pos: -68, unlock: [50, 150], point: [1, 2] },
    'DW Crit': { category: '双持轻甲战士', img: 'k.png', pos: -102, unlock: [250], point: [3] },
    'Staff Spell Damage': { category: 'Staff', img: '9.png', pos: -68, unlock: [0, 100, 200], point: [2, 3, 5] },
    'Staff Accuracy': { category: 'Staff', img: 'v.png', pos: 0, unlock: [50, 150], point: [1, 2] },
    'Staff Damage': { category: 'Staff', img: 'k.png', pos: -136, unlock: [0], point: [3] },
    'Cloth Spellacc': { category: 'Cloth Armor', img: '5.png', pos: 0, unlock: [120], point: [5] },
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
    'Better MagNet': { category: 'Deprecating 2', img: 'u.png', pos: 0, unlock: [250, 295, 340, 370, 400], point: [1, 2, 3, 4, 5] },
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

  _ab.point = parse_hvut_ability_points_from_top($id('ability_top'), 'legacyAbilityPointsNode');
  _ab.level = {};
  if (_ab.point === null) {
    alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
    return false;
  }

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
      return run_hvut_ability_unlock_request(ab, { buttonStage: 'legacyAbilityUnlockButton', responseStage: 'legacyAbilityUnlockResponse' });
    }

    const requests = $ajax.repeat(count, unlock, ab);
    let results;
    try {
      results = await Promise.all(requests);
    } catch (error) {
      record_hvut_ability_unlock_failure('legacyAbilityUnlockRequest', { name: name, to: to, count: count, error: error?.message || String(error) });
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return;
    }
    if (!results.every((r) => r)) return;
    reloadCurrentPage(hvutReloadReason('HV_UTILS_ABILITY_UNLOCK'));
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

      $input(['button', '关闭'], node.side, { dataset: { action: 'toggle' }, className: 'hvut-side-margin' });
      Object.keys(_ab.preset).forEach((n) => { $input(['button', n], node.side, { dataset: { action: 'preset', name: n } }); });

      let category;
      let li;
      Object.entries(_ab.ability).forEach(([n, ab]) => {
        if (category !== ab.category) {
          category = ab.category;
          li = $element('li', node.ul);
          $element('span', li, [hvaaT(category, 'abCategory'), '.hvut-ab-category']);
        }
        const icon = $element('div', li, [{ dataset: { action: 'ability', name: n } }, '.hvut-ab-icon hvut-ab-off', `!background-image: url("/y/t/${ab.img}"); background-position-x: ${ab.pos - 2}px;`]);
        $element('span', icon, [n, '.hvut-ab-tooltip']);
        node.ability[n] = icon;
      });

      _ab.calc.preset('目前流派');
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
        const tr = $element('tr', null, [_player.level < unlock ? '.hvut-ab-nolevel' : '']);
        $element('td', tr, unlock);
        $element('td', tr, sum);
        $element('td', tr, [`/<span>${aboost}</span>`, aboost < 0 ? '.hvut-ab-noab' : '']);
        const td = $element('td', tr);
        selected.forEach(({ name, level, point }) => {
          const ab = _ab.ability[name];
          const icon = $element('div', td, ['.hvut-ab-icon', `!background-image: url("/y/t/${ab.img}"); background-position-x: ${ab.pos - 2}px;`]);
          $element('span', icon, [point, '.hvut-ab-point']);
          $element('span', icon, [`${name} 等级${level}`, '.hvut-ab-tooltip']);
        });
        tbody.push(tr);
      });

      _ab.calc.node.table.innerHTML = '<thead><tr><td>等级</td><td>所需技能点</td><td>"能力升级"需求级数</td><td>获得能力</td></tr></thead><tbody></tbody>';
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
    .hvut-ab-bar { font-size: 10pt; line-height: 30px; }
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
    .hvut-ab-ul > li:last-child { border-bottom: none; }
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

  for (const div of $qsa('#ability_top div[onmouseover*="overability"]')) {
    const exec = /overability\(\d+, '([^']+)'.+?(?:(Not Acquired)|Requires <strong>Level (\d+))/.exec(div.getAttribute('onmouseover'));
    if (!exec) {
      record_hvut_ability_parse_failure('abilitySlotbar', { onmouseover: div.getAttribute('onmouseover') || '' });
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    const name = exec[1];
    const ab = _ab.ability[name];
    // HV 新增/改名技能时 _ab.ability 无此键 → 跳过该槽位, 不让一项未知技能崩掉整段汉化。
    if (!ab) {
      console.warn('[HVAA][i18n] 技能表缺少此项(槽位), 已跳过:', JSON.stringify(name));
      continue;
    }

    ab.slotted = true;
    ab.level = exec[2] ? 0 : ab.unlock.indexOf(parseInt(exec[3])) + 1;
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
      span.textContent = '已满';
      span.classList.add('hvut-ab-max');
    } else if (ab.level === ab.limit) {
      span.textContent = `${ab.level}/${ab.max}`;
      span.classList.add('hvut-ab-limit');
    } else {
      span.textContent = `${ab.level}/${ab.max}`;
      span.classList.add('hvut-ab-up');
      const categories = ['General', '单手重甲盾战', '双手轻甲战士', '双持轻甲战士', '', 'Staff', 'Cloth Armor', 'Light Armor', 'Heavy Armor', 'Deprecating 1', 'Deprecating 2', 'Supportive 1', 'Supportive 2', 'Elemental', 'Forbidden', 'Divine'];
      const index = categories.indexOf(ab.category);
      $qsa('#ability_treelist > div')[index].classList.add('hvut-ab-tree');
    }
  }
  if (!$config.set('ab_level', _ab.level)) {
    alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
    return false;
  }

  $id('ability_treepane').addEventListener('click', _ab.click, true);
  for (const div of $qsa('#ability_treepane > div')) {
    const name = div.firstElementChild.textContent;
    const ab = _ab.ability[name];
    // HV 新增/改名技能时 _ab.ability 无此键 → 跳过该项, 避免整段汉化崩溃。
    if (!ab) {
      console.warn('[HVAA][i18n] 技能表缺少此项, 已跳过:', JSON.stringify(name));
      continue;
    }
    let point = _ab.point;

    ab.div = div;
    const buttonPanel = parse_hvut_ability_button_panel(div, 'legacyAbilityButtonPanel');
    if (buttonPanel === null) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    ab.id = parse_hvut_ability_unlock_id(buttonPanel, 'legacyAbilityUnlockId');
    if (ab.id === null) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    ab.level = 0;

    for (const [i, button] of Array.from(buttonPanel.children).entries()) {
      const type = parse_hvut_ability_button_type(button.style.backgroundImage);
      if (type === null) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
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
    }

    if (ab.level) {
      if (!ab.slotted) {
        if (mark_hvut_ability_warning(div, '未激活', 'legacyAbilityWarningNode') === null) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
      } else if (ab.level !== ab.limit) {
        if (mark_hvut_ability_warning(div, '可升级', 'legacyAbilityWarningNode') === null) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
      }
    }
  }

  $input(['button', '能力点计算器'], $id('ability_outer'), { style: 'position: absolute; top: 20px; left: -80px; width: 90px; white-space: normal;' }, () => { _ab.calc.toggle(); });
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

  bindTr(_tr, { config: $config }); // _tr 5 方法收口公共区 bindTr($config 依赖注入); version-diff 留本 IIFE

  GM_addStyle(/*css*/`
    #train_table > tbody > tr > td:last-child { width: 100px; padding-right: 10px; }
    #train_table > tbody > tr:last-child > td { font-weight: bold; }
  `);

  _tr.node = {};
  _tr.node.div = $element('div', [$id('train_outer'), 'afterbegin'], ['!margin: 5px;' + ($config.settings.trainingNotification ? '' : ' display: none;')]);
  _tr.node.select = $input(['select', [':Plan Training...']], _tr.node.div, null, { change: () => { _tr.change(_tr.node.select.value); } });
  _tr.node.level = $input('number', _tr.node.div, { disabled: true, style: 'width: 30px; text-align: right;' }, { input: () => { _tr.calc(); } });
  $input(['button', 'Set'], _tr.node.div, null, () => { _tr.set(true); });
  _tr.node.cost = $input('text', _tr.node.div, { readOnly: true, style: 'width: 90px; text-align: right;' });
  $input(['button', '取消训练计划'], _tr.node.div, null, () => { _tr.cancel(true); });

  _tr.json = $config.get('tr_notif', {}, 'hvut_');
  const _curEl = $qs('#train_progress > div:nth-child(2) > :first-child');
  _tr.current = _curEl ? (resolveEn(_curEl, 'trains') ?? _curEl.textContent) : undefined; // 英文逻辑 key(与 _tr.data 一致)
  _tr.level = {};
  _tr.spent = 0;

  if ($id('train_progress')) {
    confirm_event($qs('img[src$="/canceltrain.png"]'), 'click', 'Are you sure that you wish to cancel the current training?', null, _tr.cancel);
  }

  $id('train_table').addEventListener('click', _tr.click);
  let parseFailed = false;
  Array.from($id('train_table').rows).forEach((tr, i) => {
    if (!i) {
      $element('th', tr);
      $element('th', tr, ['/<div class="fc2 fac fcb"><div>单项累计花费</div></div>']);
      return;
    }
    const row = parse_hvut_training_row(tr, 'legacyTrainingTableRow');
    if (row === null) {
      parseFailed = true;
      return;
    }
    const { name, enName, time, level, max } = row;

    _tr.level[enName] = level; // tr_level 键英文(消费侧 $config.get('tr_level')['Assimilator'] 用英文读)

    const training = _tr.data[enName];
    if (!training) {
      return;
    }
    training.time = time;
    training.level = level;
    training.max = max;
    if (training.time) {
      tr.classList.add('hvut-cphu');
      tr.dataset.action = 'change';
      tr.dataset.name = enName; // 英文(click→change→_tr.data[name] 链全英文)
      $element('option', _tr.node.select, { text: name, value: enName }); // 显示中文 name, value 英文逻辑键
    }

    let spent = 0;
    for (let i = 0; i < level; i++) {
      spent += Math.round(Math.pow(training.b + training.l * i, 1 + training.e * i));
    }
    _tr.spent += spent;
    $element('td', tr, [`/<div class="fc4 far fcb"><div>${spent.toLocaleString()}</div></div>`]);
  });
  if (parseFailed) return false;
  $element('tr', $id('train_table').tBodies[0], [`/<td colspan="9"><div class="fc4 far fcb"><div>累计花费 ${_tr.spent.toLocaleString()}</div></div></td>`]);

  if (!$config.set('tr_level', _tr.level)) {
    alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
    return false;
  }

  if (_tr.current && _tr.data[_tr.current]) {
    const current_end = parse_hvut_training_end_time(_window.end_time, 'legacyTrainingPageWindowEndTime');
    if (current_end === null) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    _tr.json.current_name = _tr.current;
    _tr.json.current_level = _tr.data[_tr.current].level;
    _tr.json.current_end = current_end;
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
  if (!$config.set('tr_notif', _tr.json, 'hvut_')) {
    alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
    return false;
  }
} else
// [END 4] Character - Training */


//* [5] Character - Item Inventory
if (_query.s === 'Character' && _query.ss === 'it') {
  _it.init();
} else
// [END 5] Character - Item Inventory */


//* [7] Character - Settings
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
    const name = prompt('输入方案名称')?.trim();
    if (!name) {
      return;
    }
    const form = new FormData(_se.form);
    const json = Object.fromEntries(form.entries());
    const exists = Object.prototype.hasOwnProperty.call(_se.json, name);
    const previous = _se.json[name];
    _se.json[name] = json;
    if (!$config.set('se_settings', _se.json)) {
      if (exists) {
        _se.json[name] = previous;
      } else {
        delete _se.json[name];
      }
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    if (!exists) {
      _se.add(name);
    }
    return true;
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
    const removed = _se.json[name];
    delete _se.json[name];
    if (!$config.set('se_settings', _se.json)) {
      _se.json[name] = removed;
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }
    _se.node[name].nextElementSibling.remove();
    _se.node[name].remove();
    return true;
  };

  GM_addStyle(/*css*/`
    .hvut-se-div { margin-top: 20px; padding: 20px 0; border-top: 3px double; text-align: left; }
    .hvut-se-div .hvut-se-button { min-width: 50px; margin: 0 30px 10px 10px; }
    .hvut-se-div .hvut-se-remove { visibility: hidden; width: 22px; margin-left: -30px; }
    .hvut-se-button:hover + .hvut-se-remove, .hvut-se-remove:hover { visibility: visible; }
  `);

  _se.div = $element('div', _se.form, ['.hvut-se-div'], (e) => { _se.click(e); });
  $input(['button', '存储当前设置'], _se.div, { dataset: { action: 'save' }, style: 'margin-bottom: 15px;' });
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
// [END 7] Character - Settings */


//* [9] Bazaar - Item Shop
if (_query.s === 'Bazaar' && _query.ss === 'is') {
  $qsa('#item_pane .itemlist tr').forEach((tr) => {
    const div = tr.cells[0].firstElementChild;
    const type = $item.get_type(div.getAttribute('onmouseover'));
    tr.classList.add('hvut-item-' + type);
  });
  $qsa('#shop_pane .itemlist tr').forEach((tr) => {
    const div = tr.cells[0].firstElementChild;
    const type = $item.get_type(div.getAttribute('onmouseover'));
    tr.classList.add('hvut-item-' + type);
  });

  GM_addStyle(/*css*/`
    .itshop_pane .cspp { margin-top: 15px; overflow-y: scroll; }
    #itshop_outer .itemlist td:nth-child(1) { width: 285px !important; }
    #itshop_outer .itemlist td:nth-child(2) { width: 75px !important; }
  `);
} else
// [END 9] Bazaar - Item Shop */


//* [10] Bazaar - The Shrine
if (_query.s === 'Bazaar' && _query.ss === 'ss') {
  _ss.log = $config.get('ss_log', {});
  _ss.node = {};
  _ss.equip = { capacity: null, current: null, requests: 0, received: 0, sold: 0, salvaged: 0, total: null };
  _ss.items = {};
  _ss.trophy = {
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
  };
  _ss.item_index = [
    'Precursor Artifact',
    'Trophy Tier 2', 'Trophy Tier 3', 'Trophy Tier 4', 'Trophy Tier 5',
    'ManBearPig Tail', 'Holy Hand Grenade of Antioch', "Mithra's Flower", 'Dalek Voicebox', 'Lock of Blue Hair', 'Bunny-Girl Costume', 'Hinamatsuri Doll', 'Broken Glasses', 'Black T-Shirt', 'Sapling', 'Unicorn Horn', 'Noodly Appendage', 'Stocking Stuffers', "Tenbora's Box", 'Peerless Voucher',
    'Mysterious Box', 'Solstice Gift', 'Shimmering Present', 'Potato Battery', 'RealPervert Badge', 'Raptor Jesus', 'Rainbow Egg', 'Colored Egg', 'Gift Pony', 'Faux Rainbow Mane Cap', 'Pegasopolis Emblem', 'Fire Keeper Soul', 'Crystalline Galanthus', 'Sense of Self-Satisfaction', 'Six-Lock Box', 'Golden One-Bit Coin', 'USB ASIC Miner', 'Reindeer Antlers', 'Ancient Porn Stash', 'VPS Hosting Coupon', 'Heart Locket', 'Holographic Rainbow Projector', 'Pot of Gold', 'Dinosaur Egg', 'Precursor Smoothie Blender', 'Rainbow Smoothie', 'Mysterious Tooth', 'Grammar Nazi Armband', 'Abstract Wire Sculpture', 'Delicate Flower', 'Assorted Coins', "Coin Collector's Guide", 'Iron Heart', 'Shrine Fortune', 'Plague Mask', 'Festival Coupon', 'Annoying Gun',
    'Platinum Coupon', 'Golden Coupon', 'Silver Coupon', 'Bronze Coupon',
  ];
  _ss.item_group = {
    'Artifact': ['Energy Drink', '2 Hath', '1 Hath', 'Flower Vase', 'Bubble-Gum', 'Chaos Token', 'Last Elixir', '3x Last Elixir', { group: '1000x 水晶', items: ['1000x Crystal of Vigor', '1000x Crystal of Finesse', '1000x Crystal of Swiftness', '1000x Crystal of Fortitude', '1000x Crystal of Cunning', '1000x Crystal of Knowledge', '1000x Crystal of Flames', '1000x Crystal of Frost', '1000x Crystal of Lightning', '1000x Crystal of Tempest', '1000x Crystal of Devotion', '1000x Crystal of Corruption'] }, { group: '3000x 水晶', items: ['3000x Crystal of Vigor', '3000x Crystal of Finesse', '3000x Crystal of Swiftness', '3000x Crystal of Fortitude', '3000x Crystal of Cunning', '3000x Crystal of Knowledge', '3000x Crystal of Flames', '3000x Crystal of Frost', '3000x Crystal of Lightning', '3000x Crystal of Tempest', '3000x Crystal of Devotion', '3000x Crystal of Corruption'] }, { group: '5000x 水晶', items: ['5000x Crystal of Vigor', '5000x Crystal of Finesse', '5000x Crystal of Swiftness', '5000x Crystal of Fortitude', '5000x Crystal of Cunning', '5000x Crystal of Knowledge', '5000x Crystal of Flames', '5000x Crystal of Frost', '5000x Crystal of Lightning', '5000x Crystal of Tempest', '5000x Crystal of Devotion', '5000x Crystal of Corruption'] }, { group: '主属性加成', items: ['Your strength has increased by one', 'Your dexterity has increased by one', 'Your agility has increased by one', 'Your endurance has increased by one', 'Your intelligence has increased by one', 'Your wisdom has increased by one', 'Strength was increased by 1', 'Dexterity was increased by 1', 'Agility was increased by 1', 'Endurance was increased by 1', 'Intelligence was increased by 1', 'Wisdom was increased by 1'] }],
    'Trophy': ['Peerless', 'Legendary', 'Magnificent', 'Exquisite', 'Superior', '平均'],
    'Collectable': [{ group: '3x High-Grade Material', items: ['3x High-Grade Cloth', '3x High-Grade Leather', '3x High-Grade Metals', '3x High-Grade Wood'] }, { group: '2x High-Grade Material', items: ['2x High-Grade Cloth', '2x High-Grade Leather', '2x High-Grade Metals', '2x High-Grade Wood'] }, { group: '1x High-Grade Material', items: ['1x High-Grade Cloth', '1x High-Grade Leather', '1x High-Grade Metals', '1x High-Grade Wood'] }, { group: 'Binding', items: ['Binding of Slaughter', 'Binding of Balance', 'Binding of Isaac', 'Binding of Destruction', 'Binding of Focus', 'Binding of Friendship', 'Binding of Protection', 'Binding of Warding', 'Binding of the Fleet', 'Binding of the Barrier', 'Binding of the Nimble', 'Binding of Negation', 'Binding of the Elementalist', 'Binding of the Heaven-sent', 'Binding of the Demon-fiend', 'Binding of the Curse-weaver', 'Binding of the Earth-walker', 'Binding of Surtr', 'Binding of Niflheim', 'Binding of Mjolnir', 'Binding of Freyr', 'Binding of Heimdall', 'Binding of Fenrir', 'Binding of Dampening', 'Binding of Stoneskin', 'Binding of Deflection', 'Binding of the Fire-eater', 'Binding of the Frost-born', 'Binding of the Thunder-child', 'Binding of the Wind-waker', 'Binding of the Thrice-blessed', 'Binding of the Spirit-ward', 'Binding of the Ox', 'Binding of the Raccoon', 'Binding of the Cheetah', 'Binding of the Turtle', 'Binding of the Fox', 'Binding of the Owl'] }],
  };

  _ss.click = function (e) {
    const target = e.target.closest('[data-action]');
    if (!target) {
      return;
    }
    const { action, iid, count, type, slot } = target.dataset;
    if (action === 'offer') {
      _ss.offer(iid, count);
    } else if (action === 'select') {
      e.preventDefault();
      _ss.select(type, slot);
    }
  };

  _ss.select = function (type, slot) {
    const target = _ss.node.select[type + (slot ? ' ' + slot : '')];
    if (_ss.node.selected === target) {
      target.classList.remove('hvut-ss-selected');
      _ss.node.selected = null;
    } else {
      _ss.node.selected?.classList.remove('hvut-ss-selected');
      target.classList.add('hvut-ss-selected');
      _ss.node.selected = target;
    }
  };

  _ss.offer = async function (iid, count) {
    if (_ss.error) {
      popup(_ss.error);
      return;
    }
    const item = _ss.items[iid];
    if (count === 'max') {
      count = item.max;
    } else if (count === 'input') {
      count = parseInt(item.node.count.value);
    } else {
      count = parseInt(count);
    }
    if (count > item.max) {
      count = item.max;
    }
    if (!count || count < 0) {
      return;
    }

    let select_reward_type;
    let select_reward_slot;
    if (item.type === 'Trophy') {
      if (_ss.node.selected && !_ss.node.selected.disabled) {
        select_reward_type = _ss.node.selected.dataset.type;
        select_reward_slot = _ss.node.selected.dataset.slot;
      } else {
        alert('选择要获得的装备类型.');
        return;
      }
    } else { // Artifact, Collectable
      select_reward_type = '';
      select_reward_slot = '';
    }

    if (!_ss.log[item.log]) {
      _ss.log[item.log] = {};
    }
    if (!item.results) {
      item.results = _ss.create_list(item.type);
      item.node.span = $element('p', _ss.node.results, [item.name + (item.upgrade ? ' => Tier ' + item.upgrade : '') + ' ', '.hvut-ss-p']).appendChild($element('span'));
      item.node.ul = $element('ul', _ss.node.results, ['.hvut-ss-ul']);
      Object.values(item.results).forEach((r) => { item.node.ul.appendChild(r.li).classList.add('hvut-none'); });
      scrollIntoView(item.node.ul);
    }
    _ss.node.results.classList.remove('hvut-none');

    for (let i = 0; i < count; i++) {
      if (_ss.error) break;
      if (reserve_hvut_shrine_offer(_ss, item) === false) break;
      const offered = await _ss.request(iid, select_reward_type, select_reward_slot);
      if (offered === false) {
        rollback_hvut_shrine_offer_reservation(_ss, item);
        break;
      }
      if (_ss.error) break;
    }
  };

  _ss.request = async function (iid, select_reward_type, select_reward_slot) {
    if (_ss.error) return false;
    const item = _ss.items[iid];
    let html;
    try {
      html = await $ajax.fetch(create_hvut_shrine_url(), `select_item=${iid}&select_reward_type=${select_reward_type}&select_reward_slot=${select_reward_slot}`);
    } catch (error) {
      const evidence = record_hvut_shrine_offer_failure('legacyOfferFetch', { iid: iid, select_reward_type: select_reward_type, select_reward_slot: select_reward_slot, error: error?.message || String(error) });
      set_hvut_shrine_stop_error(_ss, 'Shrine offer request failed.', evidence);
      return false;
    }
    const doc = $doc(html);
    const results = item.results;
    const rewards = [];
    const offerResponse = classify_hvut_shrine_offer_response(doc, 'legacyOfferEmptyResponse');
    if (offerResponse.kind === 'stop') {
      set_hvut_shrine_stop_error(_ss, offerResponse.message, offerResponse.evidence);
      return false;
    }

    const offerSummary = summarize_hvut_shrine_offer_messages(offerResponse.messages);
    if (offerSummary.kind === 'stop') {
      set_hvut_shrine_stop_error(_ss, offerSummary.message, offerSummary.evidence);
      return false;
    }
    offerSummary.vouchers.forEach((msg) => {
      popup(`<p style="color: #f00; font-weight: bold;">${msg}</p>`);
    });
    rewards.push(...offerSummary.equips, ...offerSummary.rewards);
    _ss.equip.sold += offerSummary.sold;
    _ss.equip.salvaged += offerSummary.salvaged;
    item.recieved++;
    item.node.span.textContent = `(${item.recieved}/${item.requests})`;

    rewards.forEach((n) => {
      const r = item.type === 'Trophy' ? n.split(' ')[0] : n;
      if (!_ss.log[item.log][r]) {
        _ss.log[item.log][r] = 0;
      }
      _ss.log[item.log][r]++;

      if (!results[r]) {
        results[r] = _ss.create_listitem(r);
        item.node.ul.appendChild(results[r].li);
      }
      if (!results[r].count) {
        results[r].li.classList.remove('hvut-none');
        if (results[r].group) {
          results[results[r].group].li.classList.remove('hvut-none');
        }
      }

      results[r].count++;
      if (results[r].group) {
        results[results[r].group].count++;
      }
      Object.keys(results).forEach((k) => {
        results[k].sp.textContent = (results[k].count * 100 / item.recieved).toFixed(1) + ' %';
        results[k].sc.textContent = ` [${results[k].count}] `;
      });

      if (item.type === 'Trophy') {
        if ($equip.filter.equip($config.settings.shrineFilters, n)) {
          $element('li', [results[r].li, 'afterend'], [n, '.hvut-ss-equip']);
        }
        _ss.equip.received++;
        const total = update_hvut_shrine_equip_total(_ss.equip, 'current');
        _ss.node.results_equip.value = total === null
          ? '装备库存量: unavailable'
          : `装备库存量: ${_ss.equip.total} / ${_ss.equip.capacity}` + (_ss.equip.sold ? `, 已出售: ${_ss.equip.sold}` : '') + (_ss.equip.salvaged ? `, 已分解: ${_ss.equip.salvaged}` : '');
        if (is_hvut_shrine_equip_capacity_full(_ss.equip)) {
          const evidence = record_hvut_shrine_offer_failure('legacyOfferEquipmentCapacityFull', { total: _ss.equip.total, capacity: _ss.equip.capacity });
          set_hvut_shrine_stop_error(_ss, '你的装备库存已满', evidence);
        }
      }
    });

    if (item.recieved % 10 === 0 || item.recieved === item.requests || _ss.error) {
      if (!$config.set('ss_log', _ss.log)) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
    }
    return true;
  };

  _ss.toggle_results = function () {
    _ss.node.results.classList.toggle('hvut-none');
  };

  _ss.view_log = function () {
    const div = _ss.node.log;
    div.innerHTML = '';

    const reg_artifact = /Energy Drink|Flower Vase|Bubble-Gum|Chaos Token|Hath|Last Elixir|\d+x Crystal of|has increased by one|was increased by 1/;
    const reg_trophy = /Peerless|Legendary|Magnificent|Exquisite|Superior|Average/;
    const reg_collectable = /High-Grade|Binding of/;

    object_sort(_ss.log, _ss.item_index);
    Object.entries(_ss.log).forEach(([n, log]) => {
      const keys = Object.keys(log);
      const type = keys.some((k) => reg_artifact.test(k)) ? 'Artifact' : keys.some((k) => reg_trophy.test(k)) ? 'Trophy' : keys.some((k) => reg_collectable.test(k)) ? 'Collectable' : null;
      const list = _ss.create_list(type);
      let total = Object.values(log).reduce((s, e) => (s + e), 0);
      if (type === 'Collectable') {
        total /= 2;
      }

      $element('p', div, [`${n} (${total})`, '.hvut-ss-p']);
      const ul = $element('ul', div, ['.hvut-ss-ul']);

      Object.entries(log).forEach(([r, c]) => {
        if (!list[r]) {
          list[r] = _ss.create_listitem(r);
        }
        list[r].count = c;
        if (list[r].group) {
          list[list[r].group].count += c;
        }
      });

      Object.keys(list).forEach((r) => {
        if (!list[r].count) {
          return;
        }
        list[r].sp.textContent = (list[r].count * 100 / total).toFixed(1) + ' %';
        list[r].sc.textContent = ` [${list[r].count}] `;
        ul.appendChild(list[r].li);
      });
    });
  };

  _ss.toggle_log = function () {
    if (_ss.node.log.classList.contains('hvut-none')) {
      _ss.view_log();
      _ss.node.log.classList.remove('hvut-none');
    } else {
      _ss.node.log.classList.add('hvut-none');
      _ss.node.log.innerHTML = '';
    }
  };

  _ss.create_list = function (type) {
    const list = {};
    const array = _ss.item_group[type] || [];
    array.forEach((r) => {
      if (typeof r === 'string') {
        list[r] = _ss.create_listitem(r);
      } else {
        const g = r.group;
        list[g] = _ss.create_listitem(g);
        r.items.forEach((m) => {
          list[m] = _ss.create_listitem(m, g);
        });
      }
    });
    return list;
  };

  _ss.create_listitem = function (r, g) {
    const item = { count: 0 };
    item.li = $element('li');
    item.sp = $element('span', item.li);
    item.sc = $element('span', item.li);
    $element('span', item.li, r);
    if (g) {
      item.group = g;
      item.li.classList.add('hvut-ss-group');
    }
    return item;
  };

  _ss.show_trophies = function () {
    popup_text(_ss.trophies_text, 600, 250);
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
    .hvut-ss-p { margin: 5px; font-size: 10pt; font-weight: bold; }
    .hvut-ss-ul { margin: 5px 5px 10px; padding: 0; list-style: none; font-size: 10pt; line-height: 20px; }
    .hvut-ss-ul span:first-child { display: inline-block; width: 60px; text-align: right; color: #930; }
    .hvut-ss-ul span:last-child { font-weight: bold; }
    .hvut-ss-group { color: #666; }
    .hvut-ss-group > span:first-child { visibility: hidden; }
    .hvut-ss-equip { margin-left: 65px; color: #930; }

    .hvut-ss-selected:not([disabled]) { color: #c00 !important; border-color: #c00 !important; outline: 1px solid; }
  `);

  $id('inv_item').addEventListener('click', _ss.click);
  $id('accept_equip').addEventListener('click', _ss.click);

  _ss.node.side = $element('div', $id('shrine_outer'), ['.hvut-side hvut-ss-side']);
  toggle_button($input('button', _ss.node.side), '显示所有奖杯', '使用过滤器', $id('inv_item'), 'hvut-none-cont', true);
  $input(['button', '祭坛收获'], _ss.node.side, null, () => { _ss.toggle_results(); });
  $input(['button', '祭坛日志'], _ss.node.side, null, () => { _ss.toggle_log(); });
  $input(['button', '编辑过滤器'], _ss.node.side, null, () => { $config.open('shrineHideItems'); });

  _ss.node.log = $element('div', $id('shrine_outer'), ['.hvut-ss-log hvut-none']);
  _ss.node.results = $element('div', $id('shrine_outer'), ['.hvut-ss-results hvut-none']);
  _ss.node.results_buttons = $element('div', _ss.node.results, ['!margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid; text-align: center;']);
  _ss.node.results_equip = $input(['button', '装备库存量'], _ss.node.results_buttons, { style: 'width: 450px;' });

  // 旧 ?s=Character&ss=in 'Equip Slots' 行随能量模型死亡(exec null, 实站报错证实) → isekai 形态: am organize 屏 Inventory Capacity
  $ajax.fetch(create_hvut_armory_organize_url()).then((html) => {
    const capacity = parse_hvut_inventory_capacity(html, 'legacyShrineInventoryCapacity');
    if (capacity === null) {
      _ss.node.results_equip.value = '装备库存量: unavailable';
      return;
    }
    _ss.equip.current = capacity.usage;
    _ss.equip.capacity = capacity.capacity;
    _ss.node.results_equip.value = `装备库存量: ${_ss.equip.current} / ${_ss.equip.capacity}`;
  }).catch(() => {
    record_hvut_shrine_capacity_failure('legacyShrineInventoryCapacityFetch', { reason: 'requestFailed' });
    _ss.node.results_equip.value = '装备库存量: unavailable';
  });

  _ss.trophies_value = 0;
  _ss.trophies_text = [];

  $qsa('.itemlist tr').forEach((tr) => {
    const div = tr.cells[0].firstElementChild;
    const name = div.textContent;
    const type = $item.get_type(div.getAttribute('onmouseover'));
    const itemData = parse_hvut_shrine_offer_item(div, 'legacyOfferItemRow');
    if (itemData === null) {
      tr.classList.add('hvut-warn');
      return;
    }
    const { iid, stock, bulk } = itemData;
    const max = Math.floor(stock / bulk);
    const item = { log: name, name, type, iid, stock, bulk, max, requests: 0, recieved: 0, node: {} };
    _ss.items[iid] = item;

    div.classList.add('hvut-item-' + type);
    item.node.stock = tr.cells[1];
    item.node.bulk = $element('td', tr);
    item.node.max = $element('td', tr);
    const td = $element('td', tr);
    item.node.count = $input('text', td);
    item.node.button = $input(['button', '献祭'], td, { dataset: { action: 'offer', iid: iid, count: 'input' } });

    if (item.type === 'Trophy') {
      if (_ss.trophy[name]) {
        item.tier = _ss.trophy[name].tier;
        item.value = _ss.trophy[name].value;
        if (item.tier) {
          let t = item.tier;
          let b = item.bulk;
          while (b > 1) {
            b /= t === 2 ? 4 : t === 3 ? 2 : t === 4 ? 4 : 1;
            t++;
          }
          item.value *= t === item.tier ? 1 : t === 3 ? 1.1 : t === 4 ? 1.2 : t === 5 ? 1.3 : 1;
          item.upgrade = t;
          item.log = 'Trophy Tier ' + t;
        }
        if (item.value) {
          const a = item.stock - item.stock % item.bulk;
          if (a) {
            _ss.trophies_value += a * item.value;
            _ss.trophies_text.push(`${a.toLocaleString()} x ${name} @ ${item.value.toLocaleString()} = ${(a * item.value).toLocaleString()}`);
          }
        }
      }
      item.node.bulk.textContent = '/ ' + item.bulk;
      item.node.max.textContent = item.max;
      $input(['button', '所有'], td, { dataset: { action: 'offer', iid: iid, count: '已满' } });
    }
    if ($config.settings.shrineHideItems.some((h) => name.includes(h))) {
      tr.classList.add('hvut-none-item');
    }
  });

  $input(['button', `你库存中的奖杯总价值为 ${_ss.trophies_value.toLocaleString()} credits.`], $id('shrine_trophy'), { style: 'margin: 5px;' }, () => { _ss.show_trophies(); });

  _ss.node.select = {};
  $qsa('#accept_equip input[type="submit"]').forEach((s) => {
    const reward = parse_hvut_shrine_reward_selection(s, 'legacyRewardSelectButton');
    if (reward === null) {
      s.disabled = true;
      return;
    }
    const { type, slot } = reward;
    s.dataset.action = 'select';
    const select = slot ? `${type} ${slot}` : type;
    s.dataset.type = type;
    s.dataset.slot = slot;
    _ss.node.select[select] = s;
    s.removeAttribute('onclick');
  });
} else
// [END 10] Bazaar - The Shrine */


//* [11] Bazaar - The Market
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
    if ($price.parse_market(_query.filter) === false) return;
    _mk.items = Object.keys($price.market);
    Array.from($qs('#market_itemlist table').rows).forEach((tr, i) => {
      if (i === 0) {
        $element('th', tr, '插件参考价');
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
    $input(['button', '设为市场出价'], side, null, () => { _mk.save('bid'); });
    $input(['button', '设为市场要价'], side, null, () => { _mk.save('ask'); });
    $input(['button', '编辑价格'], side, null, () => { _mk.edit(); });
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
    $element('tr', [$qs('#market_itemlist table').rows[0], 'afterend'], [`/<td>水晶包参考价(各类水晶1000个)</td><td></td><td>${bid} C</td><td>${ask} C</td><td></td>`]);
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
      const href = parse_hvut_price_market_click_href(onclick, 'legacyMarketClickHref');
      if (href === false) {
        return;
      }
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
// [END 11] Bazaar - The Market */


//* [12] Bazaar - Monster Lab
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
      .hvut-ml-wins::after { content: '最后更新日期: ' attr(data-update); position: absolute; top: 2px; right: 615px; border: 1px solid; padding: 2px 4px; line-height: 16px; background-color: #edb; visibility: hidden; }
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
      .hvut-ml-up-table td:nth-child(15),
      .hvut-ml-up-table td:nth-child(22),
      .hvut-ml-up-table td:nth-child(35) { border-right-width: 1px; }
      .hvut-ml-up-change { color: #c00; }
      .hvut-ml-up-table td[data-desc]::after { content: attr(data-desc); visibility: hidden; position: absolute; top: 24px; right: -1px; white-space: nowrap; padding: 2px 10px; background-color: #fff; border: 1px solid; z-index: 1; }
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
      .hvut-ml-plc-left > div > div:first-child { width: 60px; border-left: none; }
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

      if (!$config.set('ml_log', _ml.log)) {
        return false;
      }
      return true;
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
        if (!['index', '姓名', '类型', '战力', 'wins', 'kills', 'gains', 'gifts', '士气', 'hunger'].includes(key)) {
          return;
        }
        let order = ['战力', 'wins', 'kills', 'gains', 'gifts'].includes(key) ? -1 : 1;
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
          const empty = $qsa('#slot_pane > div[onclick*="&create=new"]')
            .map((div) => parse_hvut_monster_lab_empty_slot(div, 'legacyEmptyMonsterSlot'))
            .filter((slot) => slot !== null);
          _ml.main.sort.list = _ml.mobs.filter((mob) => mob).concat(empty);
        }
        _ml.main.sort.list.sort((a, b) => (a[key] == b[key] ? 0 : a[key] == undefined ? 1 : b[key] == undefined ? -1 : (a[key] > b[key] ? 1 : -1) * order));
        $id('slot_pane').prepend(..._ml.main.sort.list.map((mob) => mob.node.div));
      },
      feed: async function (index, food) {
        const mob = _ml.mobs[index];
        if (!mob.status) {
          return;
        }
        mob.status = 0;
        mob.node.wins.textContent = '...';
        const html = await $ajax.fetch(create_hvut_monster_lab_slot_url(mob), food ? 'food_action=' + food : '');
        const doc = $doc(html);
        _ml.main.onsuccess(index, doc);
        //_ml.main.onerror(index);
      },
      feedall: function (stat, value, food) {
        _ml.mobs.forEach((mob) => { _ml.main.feed(mob.index, !value || value >= mob[stat] ? food : null); });
      },
      onsuccess: function (index, doc) {
        const mob = _ml.mobs[index];
        if (_ml.parse(mob, doc) === false) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.main.onerror(index);
          return false;
        }
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
        mob.node.wins.textContent = '失败';
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
        $element('li', _ml.main.node.summary, `${mobs.length} 个怪物给予了你 ${gains.length} 件礼物,价值 ${_ml.price2str(income)} credits`);
        _ml.materials.forEach((g) => {
          if (summary[g]) {
            $element('li', _ml.main.node.summary, `${summary[g]} x ${hvaaT(g, 'material')}`);
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
          const li = $element('li', mob.node.log, mob.log.gifts[i] + ' x ' + hvaaT(mat, 'material'));
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
          $element('li', null, `已经过 ${Math.round(days * 10) / 10} 天 / 自 ${(new Date(date)).toLocaleString()}`),
          $element('li', null, `- 总计: ${count} 份礼物,估价 ${_ml.price2str(income)} credits`),
          $element('li', null, `- 日平均: ${Math.round(count / days * 10) / 10} 份礼物,估价 ${_ml.price2str(income / days)} credits`)
        );
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
      $id('messagebox_outer').classList.add('hvut-none');
    }

    _ml.mobs[-1] = { log: { date: _ml.now, gifts: (new Array(54)).fill(0) }, node: {} };

  let parseFailed = false;
  $qsa('#slot_pane > div').forEach((div, i) => {
    if (parseFailed) return;
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

    const surface = parse_hvut_monster_lab_main_surface(div, 'legacyMainMonsterSurface');
    if (surface === null) {
      parseFailed = true;
      return;
    }
    mob.name = surface.name;
    mob.class = surface.className;
    mob.pl = surface.pl;
    surface.plNode.textContent = mob.pl;
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

    const hungerdiv = surface.hungerdiv;
    const moralediv = surface.moralediv;
    hungerdiv.dataset.action = 'hunger';
    hungerdiv.dataset.index = index;
    moralediv.dataset.action = '士气';
    moralediv.dataset.index = index;

    mob.node.hungerbar = surface.hungerbar;
    mob.node.moralebar = surface.moralebar;
    mob.hunger = surface.hunger;
    mob.morale = surface.morale;
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
  if (parseFailed) {
    alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
    return false;
  }

  if (!$config.set('ml_log', _ml.log)) {
      alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
      return false;
    }

    $id('monster_list').addEventListener('click', _ml.main.click, true);
    $id('monster_list').addEventListener('mouseover', _ml.main.mouseover);
    $id('monster_list').addEventListener('mouseout', _ml.main.mouseout);

    const sort_div = $element('div', [$id('slot_pane'), 'beforebegin'], ['.hvut-ml-sort hvut-cphu-sub']);
    _ml.main.node.sort = {
      index: $element('span', sort_div, [{ textContent: '编号' }, '!width: 30px;', { dataset: { action: 'sort', key: 'index' } }]),
      name: $element('span', sort_div, ['名称', '!width: 210px;', { dataset: { action: 'sort', key: 'name' } }]),
      class: $element('span', sort_div, ['类型', '!width: 70px;', { dataset: { action: 'sort', key: 'class' } }]),
      pl: $element('span', sort_div, ['战力', '!width: 40px;', { dataset: { action: 'sort', key: 'pl' } }]),
      wins: $element('span', sort_div, ['胜场', '!width: 40px;', { dataset: { action: 'sort', key: 'wins' } }]),
      kills: $element('span', sort_div, ['击杀', '!width: 40px;', { dataset: { action: 'sort', key: 'kills' } }]),
      gains: $element('span', sort_div, ['礼物', '!width: 25px;', { dataset: { action: 'sort', key: 'gains' } }]),
      gifts: $element('span', sort_div, ['合计礼物', '!width: 50px;', { dataset: { action: 'sort', key: 'gifts' } }]),
      morale: $element('span', sort_div, ['士气', '!width: 200px;', { dataset: { action: 'sort', key: 'morale' } }]),
      hunger: $element('span', sort_div, ['饥饿度', '!width: 200px;', { dataset: { action: 'sort', key: 'hunger' } }]),
    };

    if ($config.settings.monsterLabDefaultSort === 'index') {
      _ml.main.sort.key = 'index';
      _ml.main.sort.order = 1;
      _ml.main.node.sort.index.classList.add('hvut-ml-sort-current');
    } else {
      _ml.main.sort($config.settings.monsterLabDefaultSort);
    }

    const side_div = $element('div', $id('monster_outer'), ['.hvut-side hvut-ml-side']);
    $input(['button', '礼物清单'], side_div, null, () => { _ml.main.toggle_summary(); });
    $input(['button', '日志'], side_div, null, () => { _ml.main.toggle_log(-1); });
    $input(['button', '物品价格'], side_div, { className: 'hvut-side-margin' }, () => { $price.edit('Materials', 'ma', _ml.main.edit_price); });
    $input(['button', '更新击杀与胜场'], side_div, null, () => { _ml.main.feedall(); });
    $input(['button', '怪物升级器'], side_div, { id: 'hvut-ml-up-button' }, () => { _ml.upgrade.toggle(); });
    $input(['button', '战力计算器'], side_div, null, () => { _ml.plc.toggle(); });

    _ml.main.make_summary();

    // Monster Upgrader
    _ml.upgrade = {

      pa: [
        { query: 'pa_str', text: '力量', crystal: 'Crystal of Vigor' },
        { query: 'pa_dex', text: '灵巧', crystal: 'Crystal of Finesse' },
        { query: 'pa_agi', text: '敏捷', crystal: 'Crystal of Swiftness' },
        { query: 'pa_end', text: '体质', crystal: 'Crystal of Fortitude' },
        { query: 'pa_int', text: '智力', crystal: 'Crystal of Cunning' },
        { query: 'pa_wis', text: '智慧', crystal: 'Crystal of Knowledge' },
      ],
      er: [
        { query: 'er_fire', text: '火焰', crystal: 'Crystal of Flames' },
        { query: 'er_cold', text: '冰冷', crystal: 'Crystal of Frost' },
        { query: 'er_elec', text: '闪电', crystal: 'Crystal of Lightning' },
        { query: 'er_wind', text: '疾风', crystal: 'Crystal of Tempest' },
        { query: 'er_holy', text: '神圣', crystal: 'Crystal of Devotion' },
        { query: 'er_dark', text: '黑暗', crystal: 'Crystal of Corruption' },
      ],
      ct: [
        { query: 'affect', text: '寻宝', desc: '增加送礼概率倍率 2.5%' },
        { query: 'health', text: '刚毅', desc: '增加怪物生命值 5%' },
        { query: 'damage', text: '蛮横', desc: '增加怪物伤害力 2.5%' },
        { query: 'accur', text: '命中', desc: '增加怪物命中率 5%' },
        { query: 'cevbl', text: '精密', desc: '减少目标有效闪避/格挡率 1%' },
        { query: 'cpare', text: '压制', desc: '减少目标有效招架/抵抗率 1%' },
        { query: 'parry', text: '拦截', desc: '增加怪物拦截率 0.5%' },
        { query: 'resist', text: '弥散', desc: '增加怪物抵抗率 0.5%' },
        { query: 'evade', text: '闪避', desc: '增加怪物闪避率 0.5%' },
        { query: 'phymit', text: '防御', desc: '增加怪物物理减伤 1%' },
        { query: 'magmit', text: '魔防', desc: '增加怪物魔法减伤 1%' },
        { query: 'atkspd', text: '迅捷', desc: '增加怪物攻击速度 2.5%' },
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
          const inc = e.button === 0 ? 1 : e.button === 2 ? -1 : 0;
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
        if ((await $item.once()) === false) {
          return false;
        }
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
        $element('td', thead, { textContent: '编号', dataset: { action: 'sort', key: 'index' } });
        $element('td', thead, ['姓名', { dataset: { action: 'sort', key: 'name' } }]);
        $element('td', thead, ['类型', { dataset: { action: 'sort', key: 'class' } }]);
        $element('td', thead, ['战力', { dataset: { action: 'sort', key: 'pl' } }]);
        $element('td', thead, ['士气', { dataset: { action: 'sort', key: 'morale' } }]);
        $element('td', thead, ['*', { dataset: { action: 'reset', index: 'all', desc: '全部重置' } }]);

        $element('td', thead, ['礼物', { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: 'all', desc: '所有主属性强化提升1级，右键降低' } }]);
        $element('td', thead, ['=', { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: 'equal', desc: '均衡提升强化等级' } }]);
        _ml.upgrade.pa.forEach((pa, i) => { $element('td', thead, [pa.text.toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'pa', item: i, desc: pa.crystal } }]); });

        $element('td', thead, ['礼物', { dataset: { action: 'upgrade', index: 'all', type: 'er', item: 'all', desc: '所有元素减伤强化提升1级，右键降低' } }]);
        $element('td', thead, ['=', { dataset: { action: 'upgrade', index: 'all', type: 'er', item: 'equal', desc: '均衡提升强化等级' } }]);
        _ml.upgrade.er.forEach((er, i) => { $element('td', thead, [er.text.toLowerCase(), { dataset: { action: 'upgrade', index: 'all', type: 'er', item: i, desc: er.crystal } }]); });

        $element('td', thead, ['礼物', { dataset: { action: 'upgrade', index: 'all', type: 'ct', item: 'all', desc: '所有混沌强化提升1级，右键降低' } }]);
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
        $input(['button', '恢复'], buttons, null, () => { _ml.upgrade.load(); });
        _ml.upgrade.node.update = $input(['button', '更新数据'], buttons, null, () => { _ml.upgrade.force_update(); });
        _ml.upgrade.node.run = $input(['button', '执行升级'], buttons, null, () => { _ml.upgrade.run(); });
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
        const ct_next = parse_hvut_monster_lab_chaos_token_cost($id('monster_actions').textContent, 'legacyUpgradeChaosTokenCost');
        if (ct_next === null) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.button.disabled = false;
          _ml.upgrade.inited = false;
          return false;
        }
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

          $element('td', tr, ['礼物', { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: 'all' } }]);
          $element('td', tr, ['=', { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: 'equal' } }]);
          mob.pa.forEach((e, i) => {
            e.node = $element('td', tr, [e.value, { dataset: { action: 'upgrade', index: mob.index, type: 'pa', item: i } }]);
            e.to = e.value;
            e.used = _ml.upgrade.pa_crystal[e.value];
            _ml.upgrade.pa[i].used += e.used;
            e.require = 0;
          });

          $element('td', tr, ['礼物', { dataset: { action: 'upgrade', index: mob.index, type: 'er', item: 'all' } }]);
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
          $element('td', tr, ['礼物', { dataset: { action: 'upgrade', index: mob.index, type: 'ct', item: 'all' } }]);
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
        _ml.upgrade.node.button.value = '更新数据中...';
        if (_ml.upgrade.node.run) {
          _ml.upgrade.node.run.disabled = true;
          _ml.upgrade.node.run.value = '更新数据中...';
        }

        async function update(mob) {
          const html = await $ajax.fetch(create_hvut_monster_lab_slot_url(mob));
          const doc = $doc(html);
          done++;
          mob.update_needed = false;
          if (_ml.parse(mob, doc) === false) {
            throw new Error('ml_log persistence failed');
          }
          _ml.upgrade.node.button.value = `更新中... (${done}/${total})`;
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.value = `${done}/${total}`;
          }
        }

        let done = 0;
        const requests = mobs.map((mob) => update(mob));
        try {
          await Promise.all(requests);
        } catch (error) {
          record_hvut_monster_lab_upgrade_failure('legacyUpgradeUpdateRequest', { total: total, done: done, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.button.disabled = false;
          _ml.upgrade.node.button.value = '怪物升级器';
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.disabled = false;
            _ml.upgrade.node.run.value = '失败';
          }
          return false;
        }

        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.button.disabled = false;
          _ml.upgrade.node.button.value = '怪物升级器';
          if (_ml.upgrade.node.run) {
            _ml.upgrade.node.run.disabled = false;
            _ml.upgrade.node.run.value = '失败';
          }
          return false;
        }
        _ml.upgrade.node.button.disabled = false;
        _ml.upgrade.node.button.value = '怪物升级器';
        if (_ml.upgrade.node.run) {
          _ml.upgrade.node.run.value = '完成';
        }
        return true;
      },

      force_update: function () {
        _ml.mobs.forEach((mob) => {
          mob.log.pl = -1;
        });
        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        reloadCurrentPage(hvutReloadReason('HV_UTILS_MONSTER_LAB_FORCE_UPDATE'));
      },

      sort: function (key) {
        if (!['index', '姓名', '类型', '战力', 'wins', 'kills', 'gains', 'gifts', '士气', 'hunger'].includes(key)) {
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
        _ml.upgrade.sort.list.sort((a, b) => (a[key] == b[key] ? 0 : a[key] == undefined ? 1 : b[key] == undefined ? -1 : (a[key] > b[key] ? 1 : -1) * order));
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
            const max = type === 'pa' ? 25 : type === 'er' ? 50 : type === 'ct' ? e.max : 0;
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
          alert('水晶或混沌令牌不足');
          return;
        }
        if (!confirm('确定要升级选中的怪物吗?')) {
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
              urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.pa[i].query}&crystal_count=10`]);
              count -= 10;
            }
            urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.pa[i].query}&crystal_count=${count}`]);
          });
          mob.er.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.er[i].query}&crystal_count=10`]);
              count -= 10;
            }
            urls.push([create_hvut_monster_lab_slot_url(mob), `crystal_upgrade=${_ml.upgrade.er[i].query}&crystal_count=${count}`]);
          });
          mob.ct.forEach((e, i) => {
            let count = e.to - e.value;
            if (count < 1) {
              return;
            }
            update_needed = true;
            while (count > 10) {
              urls.push([create_hvut_monster_lab_slot_url(mob), `chaos_upgrade=${_ml.upgrade.ct[i].query}&chaos_count=10`]);
              count -= 10;
            }
            urls.push([create_hvut_monster_lab_slot_url(mob), `chaos_upgrade=${_ml.upgrade.ct[i].query}&chaos_count=${count}`]);
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
        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        _ml.upgrade.node.run.disabled = true;
        _ml.upgrade.node.update.disabled = true;

        async function upgrade(url, post) {
          const html = await $ajax.fetch(url, post);
          const response = classify_hvut_monster_lab_upgrade_response(html, 'legacyUpgradeRunEmptyResponse', { url: url, post: post });
          if (response.kind === 'rejected') {
            throw new Error('monster lab upgrade response unavailable');
          }
          done++;
          _ml.upgrade.node.run.value = `${done}/${total}`;
        }

        let done = 0;
        const requests = urls.map(([url, post]) => upgrade(url, post));
        try {
          await Promise.all(requests);
        } catch (error) {
          record_hvut_monster_lab_upgrade_failure('legacyUpgradeRunRequest', { total: total, done: done, error: error?.message || String(error) });
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          _ml.upgrade.node.run.disabled = false;
          _ml.upgrade.node.update.disabled = false;
          _ml.upgrade.node.run.value = '失败';
          return false;
        }
        return _ml.upgrade.update();
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

        if (!$config.set('ml_log', _ml.log)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        return true;
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
          $element('span', null, '怪物数量'), $element('br'), $element('br'),
          node.count = $input('number', null, { min: 0, max: 200, readOnly: true })
        );
        $element('div', total).append(
          $element('span', null, '主属性'), $element('br'),
          $element('span', null, ['所需水晶', '.hvut-ml-plc-btn']),
          node.pa_total = $element('span', null, ['.hvut-ml-plc-crystal']), $element('br'),
          $element('span', null, ['差额', '.hvut-ml-plc-btn']),
          node.pa_total_diff = $element('span', null, ['.hvut-ml-plc-crystal'])
        );
        $element('div', total).append(
          $element('span', null, '属性减伤'), $element('br'),
          $element('span', null, ['所需水晶', '.hvut-ml-plc-btn']),
          node.er_total = $element('span', null, ['.hvut-ml-plc-crystal']), $element('br'),
          $element('span', null, ['差额', '.hvut-ml-plc-btn']),
          node.er_total_diff = $element('span', null, ['.hvut-ml-plc-crystal'])
        );

        node.right = $element('div', node.div, ['.hvut-ml-plc-right']);

        const buttons = $element('div', node.right, ['.hvut-ml-plc-buttons']);
        $input(['button', '保存'], buttons, null, () => { _ml.plc.save(); });
        $input(['button', '恢复'], buttons, null, () => { _ml.plc.load(); });
        $input(['button', '关闭'], buttons, null, () => { _ml.plc.toggle(); });
        $input(['button', '添加怪物'], buttons, { dataset: { action: 'add' } });
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
        if (!$config.set('ml_plc', _ml.plc.list.filter((m) => m).map((m) => m.json))) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        _ml.plc.load();
        return true;
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
        $element('span', sub, '主属性');
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
        $element('span', sub, '属性减伤');
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
          const max = type === 'pa' ? 25 : type === 'er' ? 50 : 0;
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
          m.node.pa_diff.textContent = m.diff > 0 ? '(+' + Math.round(m.diff).toLocaleString() + ')' : '';
          m.node.er_avg.textContent = Math.round(m.er_avg).toLocaleString();
          m.node.er_diff.textContent = m.diff < 0 ? '(+' + Math.round(-m.diff).toLocaleString() + ')' : '';

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
        _ml.plc.node.pa_total_diff.textContent = diff > 0 ? '(+' + Math.round(diff).toLocaleString() + ')' : '';
        _ml.plc.node.er_total.textContent = Math.round(er).toLocaleString();
        _ml.plc.node.er_total_diff.textContent = diff < 0 ? '(+' + Math.round(-diff).toLocaleString() + ')' : '';
      },

    };
  }
} else
// [END 12] Bazaar - Monster Lab */


//* [13] Bazaar - MoogleMail
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
      alert('请移除附加的物品。');
      openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE'));
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
            atext += '\n=> 货到付款：0 Credits';
          }
        }
      }
      _mm.write_log(atext, true);
    };

    _mm.write_pack = function (e) {
      if (_mm.write_pack.current) {
        popup('正在处理其他请求...');
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
      if (selected.some((e) => e.data.pane === 'equip' && e.node.div?.dataset.locked == '1')) {
        alert('已上锁装备'); // Equipment cannot be attached, kupo!
        return;
      }
      if (selected.some((e) => e.data.count > e.data.stock)) {
        alert('物品数量不足'); // Insufficient items, kupo!
        return;
      }
      if (!_mm.node.write_to_name.value) {
        alert('没有收件人');
        return;
      }
      _mm.write_pack.current = true;
      _mm.node.write_field.disabled = true;
      const stop = function () {
        _mm.write_pack.current = false;
        _mm.node.write_field.disabled = false;
        return false;
      };
      _mm.userlist.add(_mm.node.write_to_name.value);

      const attach = selected.map((e) => e.data);
      const mail = {
        to_name: _mm.node.write_to_name.value,
        subject: _mm.node.write_subject.value,
        body: _mm.node.write_body.value,
        attach,
        cod_deduction: _mm.parse_price(_mm.node.write_cod_deduction.value),
        cod_persistent: IS_ISEKAI && _mm.node.write_cod_persistent.checked,
      };
      $mail.request(mail).finally(stop);
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
        if (!$config.set('mm_userlist', _mm.userlist.list)) {
          alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
          return false;
        }
        if (_mm.node.write_userlist) {
          _mm.userlist.create();
        }
        return true;
      },
      popup: function () {
        popup_text(_mm.userlist.list.join('\n'), 300, 300, [
          { text: '保存', click: (p) => {
            _mm.userlist.list = p.textarea.value.split('\n');
            if (_mm.userlist.save() === false) return;
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

    $input(['button', '发送'], _mm.node.write_left, { tabIndex: 4, style: 'width: 60px; height: 52px; margin-top: 4px;' }, () => { _mm.write_pack(); });
    $element('span', _mm.node.write_left, ['收件人:', '!width: 60px;']);
    _mm.node.write_to_name = $input('text', _mm.node.write_left, { value: $id('mailform').elements.message_to_name.value || '', tabIndex: 1, style: 'width: 360px; font-weight: bold;' });
    $input(['button', '编辑列表'], _mm.node.write_left, { style: 'width: 80px;' }, () => { _mm.userlist.popup(); });
    $element('span', _mm.node.write_left, ['主题:', '!width: 60px;']);
    _mm.node.write_subject = $input('text', _mm.node.write_left, { value: $id('mailform').elements.message_subject.value || '', tabIndex: 2, style: 'width: 450px; font-weight: bold;' });

    _mm.node.write_to_name.setAttribute('list', 'hvut-mm-userlist');
    _mm.node.write_userlist = $element('datalist', _mm.node.write_left, ['#hvut-mm-userlist']);
    _mm.userlist.create();

    $element('span', _mm.node.write_left, ['可选项:', '!width: 60px;']);
    _mm.node.write_cod_deduction = $input(['text', 'CoD抵扣额'], _mm.node.write_left, { pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?', style: 'width: 60px; text-align: right;' }, { input: (e) => { _mm.write_calc(e); } });
    if (IS_ISEKAI) {
      _mm.node.write_cod_persistent = $input(['checkbox', '永久区货到付款'], _mm.node.write_left, { checked: true });
    }

    _mm.node.write_body = $element('textarea', _mm.node.write_left, { value: $id('mailform').elements.message_body.value || '', tabIndex: 3, spellcheck: false, style: 'width: 580px; height: 250px; margin-top: 10px;' });
    _mm.node.write_log = $element('textarea', _mm.node.write_left, { readOnly: true, spellcheck: false, style: 'width: 480px; height: 200px; color: unset;' });
    $mail.log = _mm.write_log;

    const attach_div = $element('div', _mm.node.write_left, ['.hvut-mm-attachtext']);
    $input(['button', '从文本添加'], attach_div);
    $input(['button', '可用格式范例'], attach_div, null, () => { popup_text('100 x Health Potion @ 10\n(200) Mana Potion @ 90\nSpirit Potion @ 90 x 300\nLast Elixir @ 1.5k (100)', 300, 100); });
    $input(['button', '清除文本'], attach_div, null, () => { _mm.item_text(); });
    $input(['button', '添加附件'], attach_div, null, () => { _mm.item_text(true); });
    $input(['button', '重置搜索框'], attach_div, null, () => { _mm.item_search('', true); });

    _mm.node.write_right = $element('div', _mm.node.write_field, ['.hvut-mm-right']);
    _mm.node.write_tabs = $element('div', _mm.node.write_right, ['.hvut-mm-tabs hvut-cphu-sub']);
    $element('span', _mm.node.write_tabs, '使用原版邮箱', () => { openUrl(create_hvut_current_page_disable_url(), hvutRedirectReason('HV_UTILS_DISABLE')); });

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
          _mm.item_set(it, num === Infinity ? it.data.stock : num);
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
    $input(['button', '所有'], _mm.node.item_menu, null, () => { _mm.item_search(''); });
    $price.init();
    Object.keys($price.groups).forEach((g) => {
      $input(['button', g], _mm.node.item_menu, null, () => { _mm.item_search($price.groups[g]); });
    });
    $element('br', _mm.node.item_menu);
    _mm.node.item_search = $input('text', _mm.node.item_menu, { placeholder: '搜索框', style: 'width: 170px;' }, { input: (e) => { _mm.item_search(e.target.value); }, keyup: (e) => { if (e.key === 'Escape') { _mm.item_search('', true); } } });
    $input(['button', '清除'], _mm.node.item_menu, null, () => { _mm.item_search('', true); });
    $input('checkbox', _mm.node.item_menu, { style: 'margin-left: 20px;' }, (e) => { _mm.item_all(e.target.checked); });
    $input('text', _mm.node.item_menu, { placeholder: '数量', style: 'width: 50px; text-align: right;' }, { input: (e) => { _mm.item_count(e.target.value); } });
    $input(['button', '所有'], _mm.node.item_menu, null, () => { _mm.item_count(Infinity); });
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
      it.node.tr.classList.add('hvut-item-' + it.info.type);
      it.node.td = $element('td', it.node.tr);
      it.node.check = $input('checkbox', it.node.td, { dataset: { action: 'calc', iid: it.info.iid } });
      it.node.count = $input('text', it.node.td, { dataset: { action: 'calc', iid: it.info.iid }, className: 'hvut-mm-count', placeholder: '数量', pattern: '\\d+|\\d{1,3}(,\\d{3})*', max: it.data.stock });
      it.node.price = $input('text', it.node.td, { dataset: { action: 'calc', iid: it.info.iid }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
      it.node.cod = $input('text', it.node.td, { className: 'hvut-mm-cod', placeholder: '货到付款额', readOnly: true });
      it.node.send = $input(['button', '发送'], it.node.td, { dataset: { action: 'send', iid: it.info.iid }, className: 'hvut-mm-send' });
    });

    if ($id('mmail_attachitem')) {
      $id('item').id += '_';
      $element('span', _mm.node.write_tabs, '物品', () => { _mm.write_toggle('item_div'); });
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
      $equip.list.sort(results, _mm.node.equip_list); // 旧 sort(双参带DOM重排) → isekai list.sort 同语义
    };

    _mm.node.equip_div = $element('div', null, ['.hvut-none']);
    _mm.node.equip_menu = $element('div', _mm.node.equip_div, ['.hvut-mm-attach-menu']);
    _mm.node.equip_search = $input('text', _mm.node.equip_menu, { placeholder: '装备名称或eid', style: 'width: 310px;' }, { input: (e) => { _mm.equip_search(e.target.value); }, keyup: (e) => { if (e.key === 'Escape') { _mm.equip_search('', true); } } });
    $input(['button', '清除'], _mm.node.equip_menu, null, () => { _mm.equip_search('', true); });
    $input('checkbox', _mm.node.equip_menu, { style: 'margin-left: 20px;' }, (e) => { _mm.equip_all(e.target.checked); });

    _mm.node.equip_attach = $element('div', _mm.node.equip_div, ['#equip', '.hvut-mm-attach'], { input: (e) => { _mm.equip_change(e); }, click: (e) => { _mm.equip_click(e); } });
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
      eq.node.elem.removeAttribute('onclick'); // 旧 eq.node.div → eq.node.elem(parse.elem 改名); 主世界 mm 同址 8357 早改对, isekai 漏改
      eq.node.lock = eq.node.wrapper.firstElementChild;
      eq.node.sub = $element('div', [eq.node.elem, 'beforebegin'], ['.hvut-mm-sub']);
      eq.node.eid = $element('span', eq.node.sub, [eq.info.eid, '.hvut-mm-eid']);
      eq.node.check = $input('checkbox', eq.node.sub, { dataset: { action: 'calc', eid: eq.info.eid } });
      eq.node.price = $input('text', eq.node.sub, { dataset: { action: 'calc', eid: eq.info.eid }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
      eq.node.send = $input(['button', '发送'], eq.node.sub, { dataset: { action: 'send', eid: eq.info.eid }, className: 'hvut-mm-send' });

      const json = _mm.equip_data[eq.info.eid];
      if (json?.price) {
        eq.node.price.value = json.price;
        eq.data.cod = _mm.parse_price(json.price);
      }
    });

    if ($id('mmail_attachequip')) {
      $id('equip').id += '_';
      $element('span', _mm.node.write_tabs, '装备', () => { _mm.write_toggle('equip_div'); });
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
      credits.data.stock = parse_hvut_mooglemail_count($id('mmail_attachcredits').textContent, /Current Funds: ([0-9,]+) Credits/, 'legacyWriteCreditsStock');
      if (credits.data.stock === null) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
    }
    if ($id('mmail_attachhath')) {
      hath.data.stock = parse_hvut_mooglemail_count($id('mmail_attachhath').textContent, /Current Funds: ([0-9,]+) Hath/, 'legacyWriteHathStock');
      if (hath.data.stock === null) {
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
    }

    _mm.node.credits_div = $element('div', null, ['.hvut-none']);
    _mm.node.credits_attach = $element('div', _mm.node.credits_div, ['.hvut-mm-attach'], { input: (e) => { _mm.credits_change(e); } });
    _mm.node.credits_list = $element('table', _mm.node.credits_attach, ['.itemlist itemlist-credits', '/<tbody></tbody>']);

    credits.node.tr = $element('tr', _mm.node.credits_list.tBodies[0]);
    $element('td', credits.node.tr, credits.info.name);
    $element('td', credits.node.tr, credits.data.stock.toLocaleString());
    credits.node.td = $element('td', credits.node.tr);
    credits.node.check = $input('checkbox', credits.node.td, { dataset: { action: 'calc', name: 'Credits' } });
    credits.node.count = $input('text', credits.node.td, { dataset: { action: 'calc', name: 'Credits' }, className: 'hvut-mm-count', placeholder: '数量', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
    credits.node.price = $input('text', credits.node.td, { dataset: { action: 'calc', name: 'Credits' }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?', style: 'visibility: hidden;' });
    credits.node.cod = $input('text', credits.node.td, { className: 'hvut-mm-cod', placeholder: '货到付款额', readOnly: true, style: 'visibility: hidden;' });

    hath.node.tr = $element('tr', _mm.node.credits_list.tBodies[0]);
    $element('td', hath.node.tr, hath.info.name);
    $element('td', hath.node.tr, hath.data.stock.toLocaleString());
    hath.node.td = $element('td', hath.node.tr);
    hath.node.check = $input('checkbox', hath.node.td, { dataset: { action: 'calc', name: 'Hath' } });
    hath.node.count = $input('text', hath.node.td, { dataset: { action: 'calc', name: 'Hath' }, className: 'hvut-mm-count', placeholder: '数量', pattern: '\\d+|\\d{1,3}(,\\d{3})*' });
    hath.node.price = $input('text', hath.node.td, { dataset: { action: 'calc', name: 'Hath' }, className: 'hvut-mm-price', placeholder: '价格', pattern: '(\\d+|\\d{1,3}(,\\d{3})*)(\\.\\d+)?[KMkm]?' });
    hath.node.cod = $input('text', hath.node.td, { className: 'hvut-mm-cod', placeholder: '货到付款额', readOnly: true });

    if ($id('mmail_attachcredits')) {
      _mm.credits_list.push(credits, hath);
      $element('span', _mm.node.write_tabs, 'Credits / Hath', () => { _mm.write_toggle('credits_div'); });
      _mm.node.write_right.appendChild(_mm.node.credits_div);
    }

    _mm.credits_multi = function () {
      if (_mm.credits_multi.current) {
        popup('正在处理其他请求...');
        return;
      }
      _mm.credits_multi.current = true;
      _mm.node.write_field.disabled = true;
      const stop = function () {
        _mm.credits_multi.current = false;
        _mm.node.write_field.disabled = false;
        return false;
      };

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
          errors.push('无收件人: ' + t);
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
          errors.push('无效的附件: ' + t);
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
        return stop();
      }
      if (credits_funds < 0) {
        alert('Credits不足');
        return stop();
      }
      if (hath_funds < 0) {
        alert('Hath不足');
        return stop();
      }

      queue.forEach((mail) => $mail.request(mail));
      return stop();
    };

    const multi_div = $element('div', _mm.node.credits_attach, ['!margin-top: 50px;']);
    $input(['button', '群发'], multi_div, { style: 'width: 150px; margin: 10px;' }, () => { _mm.credits_multi(); });
    $element('br', multi_div);
    _mm.node.credits_multi = $element('textarea', multi_div, { placeholder: 'user; credits; subject; text (| = new line)\nex)\nsssss2; 10m\nsssss3; 500k; WTB; hi|I want to buy...\nTenboro; 500c\nMoogleMail; 1000h; Thanks', style: 'width: 500px; height: 300px;', spellcheck: false });

    if (!['item_div', 'equip_div', 'credits_div'].some((d) => { if (_mm.node[d].parentNode) { _mm.write_toggle(d); return true; } })) {
      $element('div', _mm.node.write_right, ['/' + $id('mmail_right').innerHTML, '.hvut-mm-disabled']);
      _mm.node.write_cod_deduction.disabled = true;
      if (IS_ISEKAI) {
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
        return run_hvut_mooglemail_db_search(query, {
          conn: _mm.db.conn,
          getMail: _mm.mail_get,
          failureStage: 'legacyDbSearchReadFailed',
        });
      },
      export: function () {
        const stop = function () {
          _mm.node.db_export.disabled = false;
        };
        _mm.node.db_export.disabled = true;
        const json = [];
        const database = _mm.db.database.name;
        const stores = Array.from(_mm.db.database.objectStoreNames);
        let completed = stores.length;
        if (completed === 0) {
          stop();
          return;
        }
        stores.forEach((store) => {
          const values = [];
          const conn = _mm.db.conn('readonly', store);
          conn.tx.onerror = stop;
          conn.tx.onabort = stop;
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
                _mm.node.db_export.value = '完成';
                popup(`<p>文件已保存.</p><p style="font-weight: bold;">${download}</p>`);
                stop();
              }
            }
          };
        });
      },
      import: function () {
        const stop = function () {
          _mm.node.db_import.disabled = false;
        };
        const input = $input('file', null, { accept: '.json' }, { change: () => {
          const file = input.files[0];
          if (!file) {
            return;
          }
          _mm.node.db_import.disabled = true;
          const reader = new FileReader();
          reader.onload = function (e) {
            db_import(e.target.result);
          };
          reader.onerror = function () {
            alert('读取文件失败');
            stop();
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
            if (completed === 0) {
              stop();
              return;
            }

            function complete() {
              completed--;
              if (completed === 0) {
                _mm.node.db_import.value = '完成';
                stop();
              }
            }

            json.forEach((obj) => {
              const { database, store, values } = obj;
              if (database !== dbname) {
                console.log('无效的数据库');
                complete();
                return;
              }
              if (!stores.includes(store)) {
                complete();
                console.log('无效的对象存储');
                return;
              }
              const conn = _mm.db.conn('readwrite', store);
              conn.tx.onerror = stop;
              conn.tx.onabort = stop;
              conn.tx.oncomplete = function () {
                complete();
              };
              values.forEach((data) => {
                conn.os.put(data);
              });
            });
          } catch (e) {
            alert('解析文件失败\n请选择一个有效的MoogleMail数据库json文件');
            stop();
            return;
          }
        }
      },
      clear: async function () {
        if (confirm('在此浏览器中选定赛季的MoogleMail记录将被删除。\n你确定吗？')) {
          const season = _mm.node.search_season?.value || _mm.db.season;
          const conn = _mm.db.conn('readwrite', season);
          const stage = 'legacyDbClear';
          const detail = { season: season };
          try {
            conn.os.clear();
          } catch (error) {
            record_hvut_mooglemail_action_failure(stage, { ...detail, error: error?.message || String(error) });
            alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
            return false;
          }
          if (!await wait_hvut_mooglemail_db_write(stage, detail, conn)) {
            alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
            return false;
          }
          return true;
        }
        return false;
      },
      toggle: function () {
        if (_mm.node.db_div) {
          _mm.node.db_div.classList.toggle('hvut-none');
          return;
        }
        _mm.node.db_div = $element('div', _mm.node.bottom);
        $input(['button', '关闭'], _mm.node.db_div, null, () => { _mm.db.toggle(); });
        $input(['button', '重置数据库'], _mm.node.db_div, null, () => { _mm.db.clear(); });
        _mm.node.db_export = $input(['button', '导出为JSON'], _mm.node.db_div, null, () => { _mm.db.export(); });
        _mm.node.db_import = $input(['button', '从JSON导入'], _mm.node.db_div, null, () => { _mm.db.import(); });
      },
      init: function () {
        if (IS_ISEKAI) {
          _mm.db.season = $config.season;
          const exec = /(\d+) Season (\d+)/.exec($config.season);
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
      $element('tr', table, [`/<td>${p} 页面：加载中...</td>`]);
      scrollIntoView(table);
      _mm.node.page_prev.disabled = true;
      _mm.node.page_next.disabled = true;

      const html = await $ajax.fetch(create_hvut_mail_filter_page_url(_mm.page_filter, p));
      const doc = $doc(html);
      const list = $qs('#mmail_list', doc);
      _mm.kill_asshole(list);
      _mm.page_create(list, p);
      scrollIntoView(table);
      _mm.page_pager($id('mmail_pager', doc), p);
      return doc;
    };

    _mm.page_pager = function (pager, p) {
      update_hvut_mooglemail_page_window(_mm, pager, p, {
        prevKey: 'page_prev',
        nextKey: 'page_next',
        prevButton: _mm.node.page_prev,
        nextButton: _mm.node.page_next,
        prevStage: 'legacyPagePrevHref',
        nextStage: 'legacyPageNextHref',
      });
    };

    _mm.page_create = function (list, p) {
      const table = _mm.node.page_table[p];
      const tbody = $element('tbody');
      const type = { 'inbox': '收件箱', 'read': '来自', 'sent': '发给' }[_mm.page_filter];
      $element('tr', tbody, [`/<td>${type}</td><td>第 ${p} 页</td><td>附件</td><td>货到付款额</td><td>发送时间</td><td>阅读时间</td>`]);

      const conn = _mm.db.conn();
      let count = list.rows.length - 1;
      Array.from(list.rows).slice(1).forEach((row) => {
        const rowRecord = parse_hvut_mooglemail_page_row(row, _mm.page_filter, 'legacyPageRowMid');
        if (rowRecord.kind === 'empty') {
          $element('tr', tbody, ['/<td colspan="6">没有新邮件</td>']);
          return;
        }
        if (rowRecord.kind === 'rejected') {
          if (!--count) scrollIntoView(table);
          return;
        }

        const { mid, page } = rowRecord;
        const mail = _mm.mail_get(mid);
        if (mail.page) {
          return;
        }
        mail.page = page;
        mail.node.page = $element('tr', tbody, ['/<td></td><td></td><td></td><td></td><td></td><td></td>']);
        $element('a', mail.node.page.cells[1], { dataset: { action: 'read', mid: mid }, href: create_hvut_mail_read_url({ filter: page.filter, mid: mid, page: p }) });

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
      render_hvut_mooglemail_page_row(mail, _mm.dts);
    };

    _mm.page_go = function (p) {
      p = parseInt(p);
      if (isNaN(p) || p < 0) {
        return;
      }
      openUrl(create_hvut_mail_page_url(p), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));
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
      $element('p', _mm.node.mail_view, ['加载中...', '.hvut-mm-loading']);

      mail.node.page?.classList.add('hvut-mm-current');
      mail.node.search?.classList.add('hvut-mm-current');

      if (season === _mm.db.season) {
        const loadResponse = await _mm.mail_load(mid, post);
        if (loadResponse.kind === 'rejected') {
          _mm.mail_view(mail);
          return false;
        }
      }
      _mm.mail_view(mail);
    };

    _mm.mail_load = async function (mid, post) {
      return run_hvut_mooglemail_view_load(mid, post, {
        get: _mm.mail_get,
        parse: _mm.mail_parse,
        update: _mm.mail_update,
        actionRequestStage: 'legacyViewActionRequest',
        loadRequestStage: 'legacyViewLoadRequest',
        actionRejectedStage: 'legacyViewActionRejected',
        loadRejectedStage: 'legacyViewLoadRejected',
        actionCacheWriteRejectedStage: 'legacyViewActionCacheWriteRejected',
        loadCacheWriteRejectedStage: 'legacyViewLoadCacheWriteRejected',
      });
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

      const parsed = parse_hvut_mooglemail_view(doc, html, {
        rejectedStage: 'legacyViewRejectedResponse',
        equipStage: 'legacyViewEquipAttach',
        codStage: 'legacyViewCurrentCod',
        parseCount: _mm.parse_count,
      });
      if (parsed.mmtoken) {
        _mm.mmtoken = parsed.mmtoken;
      }
      return parsed.view;
    };

    _mm.mail_update = async function (mail, post) {
      const writePlan = create_hvut_mooglemail_cache_write_plan(mail, post, {
        actionUpdateStage: 'legacyViewActionDbUpdate',
        loadUpdateStage: 'legacyViewLoadDbUpdate',
        actionInsertStage: 'legacyViewActionDbInsert',
        loadInsertStage: 'legacyViewLoadDbInsert',
      });
      if (!await run_hvut_mooglemail_cache_write_plan(writePlan, _mm.db)) return false;
      _mm.mail_modify(mail);
      return true;
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
      if (!render_hvut_mooglemail_view_shell(mail, div, db, view, {
        missingDbPrefix: '错误：',
        sentLabel: '发送',
        subjectLabel: '主题',
        readLabel: '已读',
        formatDate: _mm.dts,
        assignBody: (body) => { _mm.node.mail_body = body; },
        returnedMessage: (db) => `这条消息已从${db.user}处退回`,
        renderExtraButtons: (buttons, mail, db, view) => {
          if (view.take && !view.returned && $config.settings.moogleMailCouponClipper && /Coupon Clipper|Item Shop/i.test(db.subject + '\n' + db.text)) {
            $input(['button', '系统店代购'], buttons, { dataset: { action: 'itemshop', mid: mail.mid } });
          }
        },
      })) return;

      render_hvut_mooglemail_view_attach_list(mail, div, db, {
        noCodText: 'No CoD',
        onInput: (e) => { _mm.mail_cod(e); },
      });
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
        openUrl(create_hvut_mail_reply_url(mid), hvutRedirectReason('HV_UTILS_MAIL_PAGE'));
      } else if (action === 'take') {
        if (value && !confirm(`拿取附件将从你的账户中扣除 ${parseInt(value).toLocaleString()} Credits.\n确定吗?`)) {
          return;
        }
        _mm.mail_read(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`);
      } else if (action === 'return') {
        if (!confirm('这将把消息退回给发送者.\n确定吗?')) {
          return;
        }
        _mm.mail_read(mid, `action=return_message&mmtoken=${_mm.mmtoken}`);
      } else if (action === 'recall') {
        if (!confirm('这将把消息退回给发送者.\n确定吗?')) {
          return;
        }
        _mm.mail_read(mid, `action=return_message&mmtoken=${_mm.mmtoken}`);
      } else if (action === 'itemshop') {
        _mm.itemshop_confirm(mid);
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
      const wtx = db.filter === 'sent' ? 'WTS' : 'WTB';
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
        mail.node.price.value = !sum ? wtx : db.cod === sum ? 'CoD =' : db.cod > sum ? 'CoD >' : 'CoD <';
        mail.node.price.dataset.codMatch = db.cod === sum ? '1' : '0';
        mail.node.cod.dataset.codMatch = db.cod === sum ? '1' : '0';
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
      $element('div', _mm.node.search_div, ['正在搜索...', '.hvut-mm-searching']);

      _mm.db.search(query).then((results) => {
        const table = $element('table', null, ['.hvut-mm-list']);
        const tbody = $element('tbody', table);
        $element('tr', tbody, [`/<td>搜索</td><td>${results.length} 封邮件</td><td>附件</td><td>货到付款额</td><td>发送时间</td><td>阅读时间</td>`]);

        results.sort((a, b) => b.db.mid - a.db.mid);
        results.forEach((mail) => {
          const db = mail.db;
          if (!mail.node.search) {
            mail.node.search = $element('tr', tbody, ['/<td></td><td></td><td></td><td></td><td></td><td></td>']);
            if (query.season === _mm.db.season) {
              $element('a', mail.node.search.cells[1], { dataset: { action: 'read', mid: db.mid }, href: create_hvut_mail_read_url({ filter: db.filter, mid: db.mid }) });
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
      const type = { 'inbox': '收件箱', 'read': '来自', 'sent': '发给' }[db.filter];
      tr.cells[0].innerHTML = `<span>${type}</span> ${db.user}`;
      tr.cells[1].firstElementChild.textContent = db.subject;
      tr.cells[2].innerHTML = '';
      tr.cells[3].innerHTML = '';

      db.attach?.forEach((e) => {
        const span = $element('span', tr.cells[2], [`.hvut-mm-attach-${e.t}`]);
        if (e.t === 'e') {
          if (e.e && e.k) {
            $element('a', span, { textContent: e.n, href: create_hvut_equip_page_url({ eid: e.e, key: e.k }), target: '_blank' });
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

    _mm.search_keypress = function (e) {
      if (e.key === 'Enter') {
        _mm.search_submit();
      }
    };

    _mm.search_toggle = function () {
      if (_mm.node.search_form) {
        _mm.node.search_form.classList.toggle('hvut-none');
        return;
      }
      _mm.node.search_form = $element('div', _mm.node.bottom, null, { keypress: (e) => { _mm.search_keypress(e); } });
      $input(['button', '关闭'], _mm.node.search_form, null, () => { _mm.search_toggle(); });

      if (IS_ISEKAI) {
        const seasons = Array.from(_mm.db.database.objectStoreNames);
        _mm.node.search_season = $input(['select', seasons], _mm.node.search_form);
        _mm.node.search_season.value = $config.season;
      }
      _mm.node.search_filter = $input(['select', [':all', 'inbox', 'read', 'sent']], _mm.node.search_form);
      _mm.node.search_name = $input('text', _mm.node.search_form, { placeholder: '用户', style: 'width: 120px;' });
      _mm.node.search_subject = $input('text', _mm.node.search_form, { placeholder: '主题', style: 'width: 120px;' });
      _mm.node.search_text = $input('text', _mm.node.search_form, { placeholder: '文本', style: 'width: 120px;' });
      _mm.node.search_attach = $input('text', _mm.node.search_form, { placeholder: '附件', style: 'width: 120px;' });
      _mm.node.search_cod = $input('text', _mm.node.search_form, { placeholder: 'COD金额(小-大)', style: 'width: 100px;' });
      $input(['button', '搜索'], _mm.node.search_form, null, () => { _mm.search_submit(); });
      $input(['button', '关闭列表'], _mm.node.search_form, null, () => { _mm.search_close(); });
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

    _mm.itemshop_confirm = async function (mid) {
      const mail = _mm.mail_get(mid);
      const items = _mm.itemshop_parse();
      if (!items.length) {
        alert('无效的请求');
        return;
      }
      try {
        if ((await $item.load_shop()) === false) {
          alert('发生了一个错误.');
          return;
        }
      } catch (_error) {
        alert('发生了一个错误.');
        return;
      }
      const cost = $item.cost(items);
      const credits = mail.db.attach.filter((e) => e.n === 'Credits').reduce((s, e) => (s + e.c), 0);
      if (cost !== credits) {
        if (!confirm(`请求的材料总价为 ${cost.toLocaleString()} credits，但附加的 credits 数量为 ${credits.toLocaleString()}.\n确定吗?`)) {
          return;
        }
      }
      _mm.itemshop(mid, items);
    };

    _mm.itemshop_parse = function (text = _mm.node.mail_body.value) {
      const itemshop_list = [
        'Health Draught',
        'Health Potion',
        'Health Elixir',
        'Mana Draught',
        'Mana Potion',
        'Mana Elixir',
        'Spirit Draught',
        'Spirit Potion',
        'Spirit Elixir',
        'Crystal of Vigor',
        'Crystal of Finesse',
        'Crystal of Swiftness',
        'Crystal of Fortitude',
        'Crystal of Cunning',
        'Crystal of Knowledge',
        'Crystal of Flames',
        'Crystal of Frost',
        'Crystal of Lightning',
        'Crystal of Tempest',
        'Crystal of Devotion',
        'Crystal of Corruption',
        'Monster Chow',
        'Monster Edibles',
        'Monster Cuisine',
        'Happy Pills',
        'Scrap Cloth',
        'Scrap Leather',
        'Scrap Metal',
        'Scrap Wood',
        'Energy Cell',
      ];
      const items = [];
      text.split('\n').forEach((t) => {
        let exec;
        let name;
        let count;
        if (t.startsWith('> ')) {
          return;
        } else if ((exec = /([A-Za-z][-A-Za-z0-9' ]*)(?:\s*@\s*([0-9,.]+[ckm]?))?(?:\s+[x*\uff0a]?\s*[[(]?([0-9,]+)[\])]?)/i.exec(t))) {
          name = exec[1];
          count = exec[3];
        } else if ((exec = /(?:[[(]?([0-9,]+)[\])]?\s*[x*\uff0a]?\s*)([A-Za-z][-A-Za-z0-9' ]*)(?:\s*@\s*([0-9,.]+[ckm]?))?/i.exec(t))) {
          name = exec[2];
          count = exec[1];
        } else {
          return;
        }
        name = name.trim();
        count = _mm.parse_count(count);
        if (itemshop_list.includes(name) && count) {
          const item = { name, count };
          items.push(item);
        }
      });
      return items;
    };

    _mm.itemshop = async function (mid, items) {
      if (_mm.itemshop.current) {
        popup('正在处理其他请求...');
        return;
      }
      _mm.itemshop.current = mid;
      const stop = function () {
        _mm.itemshop.current = null;
        return false;
      };

      _mm.mail_log('[系统店代购]', true);
      _mm.mail_log('接收');
      const attachRemoveResponse = await _mm.mail_load(mid, `action=attach_remove&mmtoken=${_mm.mmtoken}`);
      if (attachRemoveResponse.kind === 'rejected') {
        _mm.mail_log('!!! Error: 接收失败');
        return stop();
      }
      _mm.mail_log('购买');

      const result = await $item.buy(items);
      if (!result) {
        return stop();
      }
      _mm.mail_log('...');

      const attach = items.map((item) => {
        const name = item.name;
        const id = $item.shop[name].id;
        const count = item.count;
        return { pane: 'item', id, name, count };
      });
      const mail = {
        to_name: _mm.mail_get(mid).view.from,
        subject: '[系统店代购]',
        body: '[系统店代购]',
        attach,
      };
      await $mail.request(mail);
      return stop();
    };

    // 代重铸服务(Dark Descent)整链 2026-06-10 退化删除: 依赖死端点 ?s=Forge&ss=fo + ?s=Character&ss=in(取token)
    // + 旧 reg.html 捕获组(tier), 三重死于能量模型(bindTop 注释实证旧 Forge 组/ss=in 端点全死)。

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
// [END 13] Bazaar - MoogleMail */


//* [14] Bazaar - Lottery
if (_query.s === 'Bazaar' && (_query.ss === 'lt' || _query.ss === 'la')) {
  if ($config.settings.lotteryNotification && $qs('img[src$="lottery_next_d.png"]')) {
    _lt.toggle = function (show) {
      const previous = _lt.json[_query.ss].hide;
      _lt.json[_query.ss].hide = !show;
      if (!$config.set('lt_notif', _lt.json, 'hvut_')) {
        _lt.json[_query.ss].hide = previous;
        alert(IS_ISEKAI ? 'An error has occurred.' : '发生了一个错误.');
        return false;
      }
      return true;
    };
    _lt.json = $config.get('lt_notif', { lt: {}, la: {} }, 'hvut_');

    const div = $element('div', $id('rightpane'), ['!margin-top: 10px; color: #c00;']);
    $input(['checkbox', 'Show this lottery in the bottom bar'], div, { checked: !_lt.json[_query.ss].hide }, { change: (e) => { _lt.toggle(e.target.checked); } });
  }

  confirm_event($qs('img[src$="/lottery_golden_a.png"]'), 'click', 'Are you sure that you wish to spend a Golden Lottery Ticket?');
} else
// [END 14] Bazaar - Lottery */


// Battle
if (_query.s === 'Battle' && $id('initform')) {
  GM_addStyle(/*css*/`
    #arena_list { white-space: nowrap; }
    #arena_list tbody > tr > th:nth-child(1) { width: 474px; }
    #arena_list tbody > tr > th:nth-child(2) { width: 120px; }
    #arena_list tbody > tr > th:nth-child(3) { width: 90px; }
    #arena_list tbody > tr > th:nth-child(4) { width: 90px; }
    #arena_list tbody > tr > th:nth-child(5) { width: 90px; }
    #arena_list tbody > tr > th:nth-child(6) { width: 90px; }
    #arena_list tbody > tr > th:nth-child(7) { width: 120px; }
    #arena_list tbody > tr > th:nth-child(8) { width: 90px; }
    #arena_list tbody > tr > th:nth-child(8) > input { width: 80px; }
    #arena_list tbody > tr > td > div { width: 100% !important; left: 0; }

    .hvut-bt-on #arena_list tr > th:nth-child(1) { width: 302px; }
    .hvut-bt-on #arena_outer #arena_list tr > *:nth-child(2),
    .hvut-bt-on #arena_outer #arena_list tr > *:nth-child(5),
    .hvut-bt-on #arena_outer #arena_list tr > *:nth-child(6),
    .hvut-bt-on #arena_outer #arena_list tr > *:nth-child(7) { display: none; }
    .hvut-bt-on #rob_outer #arena_list tr > *:nth-child(2),
    .hvut-bt-on #rob_outer #arena_list tr > *:nth-child(4),
    .hvut-bt-on #rob_outer #arena_list tr > *:nth-child(5),
    .hvut-bt-on #rob_outer #arena_list tr > *:nth-child(7) { display: none; }
  `);

  _ar.split_colspan = function (table) {
    $qsa('td[colspan="2"]', table).forEach((td) => {
      td.removeAttribute('colspan');
      $element('td', [td, 'beforebegin'], '-');
    });
  };


  //* [16] Battle - Arena
  if (_query.ss === 'ar') {
    _ar.split_colspan($id('arena_list'));
    toggle_button($input('button', $id('arena_list').rows[0].cells[7]), '展开细节', '折叠', $id('mainpane'), 'hvut-bt-on', true);
    $element('div', [$id('mainpane'), 'afterbegin'], ['#arena_outer']).append($id('arena_list'));
  } else
  // [END 16] Battle - Arena */


  //* [17] Battle - Ring of Blood
  if (_query.ss === 'rb') {
    _ar.split_colspan($id('arena_list'));
    toggle_button($input('button', $id('arena_list').rows[0].cells[7]), '展开细节', '折叠', $id('mainpane'), 'hvut-bt-on', true);
    $element('div', [$id('mainpane'), 'afterbegin'], ['#rob_outer']).append($id('arena_list'), $id('arena_tokens'));
  } else
  // [END 17] Battle - Ring of Blood */


  //* [18] Battle - GrindFest
  if (_query.ss === 'gr') {

  } else
  // [END 18] Battle - GrindFest */


  //* [19] Battle - Item World
  if (_query.ss === 'iw') {
    // 旧潜能体系 UI(tier/pxp/potency/重铸/latest 置顶)随能量模型死亡(新模型无潜能等级; 依赖已死 parse.extended
    // + ?s=Forge&ss=fo 端点), 2026-06-10 整体退化 → isekai [18] 形态(列表排序 + 布局重排)。
    $equip.list.table($qs('#equiplist > table') || $qs('#itemlist > table'));
    const equipaction = $id('equipaction');
    const equipblurbLast = $id('equipblurb')?.lastElementChild;
    if (equipaction && equipblurbLast) {
      equipaction.prepend(equipblurbLast);
    }
    const equipselectOuter = $id('equipselect_outer');
    const confirmOuter = $id('confirm_outer');
    if (equipselectOuter && confirmOuter) {
      equipselectOuter.appendChild(confirmOuter);
    }
  } else
  // [END 19] Battle - Item World */

  // eslint-disable-next-line brace-style
  {} // END OF [else if]; DO NOT REMOVE THIS LINE!

  $battle.init();
} else
// Battle


//* [20] Armory - Equiplist (能量模型 am 体系七屏; 收口内核 bindArmory)
if (_query.s === 'Bazaar' && _query.ss === 'am' && $id('equiplist')) {
  const $armory = {};
  bindArmory($armory, { config: $config, equip: $equip, price: $price });
} else
// [END 20] Armory - Equiplist */


//* [21] Bazaar - Armory Modify
if (_query.s === 'Bazaar' && _query.ss === 'am' && _query.screen === 'modify') {
  _amModify(); // 升级材料成本统计收口 L3.A3（两 IIFE 共用; 旧 Forge Upgrade/Salvage 死段的业务继任——能量模型后升级/分解走 Bazaar am 体系）
} else
// [END 21] Bazaar - Armory Modify */

// eslint-disable-next-line brace-style
{} // END OF [else if]; DO NOT REMOVE THIS LINE!


/* END */

  })();
}

// ===== 原文结束 =====
  }
} catch (e) {
  try {
    var initFailure = typeof run_hvut_i18n_bridge === 'function'
      ? run_hvut_i18n_bridge('recordI18nInitFailure', ['hv-utils', e], 'recordI18nInitFailureBridgeMissing', { entry: 'hv-utils' }, false)
      : false;
    if (initFailure === false) {
      console.error("[HVAA][i18n] HV Utils 汉化执行出错:", e);
    }
  } catch (_) {
    console.error("[HVAA][i18n] HV Utils 汉化执行出错:", e);
  }
  // [临时诊断 v10.0.1] 用户要求:汉化崩溃时直接在页面弹 textarea 显示日志,便于复制反馈。
  // 定位修复后移除本块。诊断自身再包 try,绝不二次抛错打断页面。
  try {
    var __hvaaErrLog =
      "[HVAA][i18n] 汉化执行出错，请整段复制此日志反馈：\n\n" +
      "page : " + location.href + "\n" +
      "name : " + (e && e.name) + "\n" +
      "msg  : " + (e && e.message) + "\n\n" +
      "stack:\n" + (e && e.stack ? e.stack : String(e));
    var __hvaaShowErr = function () {
      if (!document.body) return;
      var ta = document.createElement("textarea");
      ta.value = __hvaaErrLog;
      ta.readOnly = true;
      ta.style.cssText =
        "position:fixed;top:8%;left:8%;width:84%;height:64%;z-index:2147483647;" +
        "background:#fff;color:#000;border:2px solid #c00;font:12px/1.5 monospace;padding:8px;white-space:pre;";
      var btn = document.createElement("button");
      btn.textContent = "× 关闭汉化诊断";
      btn.style.cssText =
        "position:fixed;top:3%;left:8%;z-index:2147483647;background:#c00;color:#fff;" +
        "border:0;padding:4px 12px;cursor:pointer;font:13px sans-serif;";
      btn.onclick = function () { ta.remove(); btn.remove(); };
      document.body.appendChild(ta);
      document.body.appendChild(btn);
      ta.focus();
      ta.select();
    };
    if (document.body) __hvaaShowErr();
    else document.addEventListener("DOMContentLoaded", __hvaaShowErr);
  } catch (_) { /* 诊断不得二次抛错 */ }
}
