import "https://testingcf.jsdelivr.net/npm/compare-versions/+esm";
import "https://testingcf.jsdelivr.net/npm/json5/+esm";
import "https://testingcf.jsdelivr.net/npm/jsonrepair/+esm";
import { toDotPath as t } from "https://testingcf.jsdelivr.net/npm/zod/v4/core/+esm";
import { klona as e } from "https://testingcf.jsdelivr.net/npm/klona/+esm";
var r = {};
((r.d = (t, e) => {
  for (var s in e)
    r.o(e, s) &&
      !r.o(t, s) &&
      Object.defineProperty(t, s, { enumerable: !0, get: e[s] });
}),
  (r.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)));
const s = z;
function n(r) {
  const n = () => {
    const t = "function" == typeof r ? r() : r,
      e = t instanceof s.z.ZodObject ? s.z.looseObject(t.shape) : t;
    return (
      "function" == typeof registerVariableSchema &&
        registerVariableSchema(s.z.object({ stat_data: e }), {
          type: "message",
        }),
      e
    );
  };
  (n(),
    eventOn("mag_variable_initialized", (t, e) => {
      const r = n();
      try {
        const n = r.safeParse(_.get(t, "stat_data", {}), { reportInput: !0 });
        if (n.success)
          return void (t.stat_data = { ...t.stat_data, ...n.data });
        a(
          "error",
          s.z.prettifyError(n.error),
          `开局 '${e + 1}' 变量初始化失败`,
        );
      } catch (t) {
        const r = t;
        a(
          "error",
          r.stack ? r.stack : r.name + ": " + r.message,
          `第 ${e + 1} 条开场白的变量初始化失败`,
        );
      }
    }),
    eventOn("mag_command_parsed_for_zod", (r, s) => {
      const o = n(),
        l = Boolean($("#mvu_notification_error").prop("checked")),
        u = (e, r, s) => {
          let n = "";
          try {
            const r = o.safeParse(e, { reportInput: !0 });
            if (r.success) return r.data;
            ((i = r.error),
              (n = _([...i.issues])
                .sortBy((t) => t.path?.length ?? 0)
                .flatMap((e) => {
                  const r = [`✖ ${e.message}`];
                  return (
                    e.path?.length && r.push(`  → 路径: ${t(e.path)}`),
                    void 0 !== e.input &&
                      r.push(`  → 输入: ${JSON.stringify(e.input)}`),
                    r
                  );
                })
                .join("\n")));
          } catch (t) {
            const e = t;
            n = e.stack ? e.stack : e.name + ": " + e.message;
          }
          var i;
          return (
            l &&
              s &&
              a("warn", n, `发生变量更新错误, 可能需要重Roll: ${r.full_match}`),
            null
          );
        },
        p = (t, r) => {
          switch (r.type) {
            case "set": {
              3 === r.args.length && r.args.splice(1, 1);
              const e = i(r.args[0]);
              return (
                e ? _.set(t, e, c(r.args[1])) : (t = c(r.args[1])),
                u(t, r, !0)
              );
            }
            case "add": {
              const e = i(r.args[0]);
              if (!e) return null;
              const s = _.get(t, e),
                n = c(r.args[1]);
              return "number" == typeof s || "string" == typeof s
                ? (_.update(t, e, (t) => t + n), u(t, r, !0))
                : null;
            }
            case "insert": {
              const s = i(r.args[0]),
                n = c(r.args[1]),
                a = c(r.args.at(-1)),
                o = (t, e) => {
                  const o = "" === s ? t : _.get(t, s),
                    i = _.isArray(o);
                  return (
                    2 === r.args.length
                      ? i
                        ? o.push(a)
                        : _.assign(o, a)
                      : i
                        ? o.splice("-" === n ? o.length : n, 0, a)
                        : (o[String(n)] = a),
                    u(t, r, e)
                  );
                },
                l = "" === s ? t : _.get(t, s),
                p = _.isNil(l);
              if (!p && !_.isArray(l) && !_.isPlainObject(l)) return null;
              if (!p) return o(t, !0);
              const f = _(e(t)),
                g = o(f.set(s, {}).value(), !1);
              return g || o(f.set(s, []).value(), !0);
            }
            case "delete": {
              const e = r.args.map(i).join("."),
                s = _(e).toPath().value(),
                n = _(s).dropRight().join(".");
              return (
                _.isArray(_.get(t, n))
                  ? _.pullAt(_.get(t, n), Number(_(s).last()))
                  : _.unset(t, e),
                u(t, r, !0)
              );
            }
          }
        },
        f = e(r.stat_data);
      for (const t of s) {
        let s = e(r.stat_data);
        if ("move" === t.type) {
          const e = i(t.args[0]);
          if (!_.has(s, e)) {
            l &&
              a(
                "warn",
                `移动源路径不存在: ${e}`,
                `发生变量更新错误，可能需要重Roll: ${t.full_match}`,
              );
            continue;
          }
          const r = _.get(s, e),
            n = i(t.args[1]);
          ((s = p(s, { ...t, type: "delete", args: [e] })),
            (s = p(s, { ...t, type: "set", args: [n, r] })));
        } else s = p(s, t);
        null !== s && (r.stat_data = { ...r.stat_data, ...s });
      }
      (!(function (t, e) {
        !(function r(s, n = []) {
          _.isObjectLike(s) &&
            _.forOwn(s, (s, a) => {
              const o = [...n, a];
              if (a.startsWith("_")) {
                const r = _.get(e, o);
                void 0 !== r && _.set(t, o, r);
              }
              _.isObjectLike(s) && r(s, o);
            });
        })(t);
      })(r.stat_data, f),
        (s.length = 0));
    }),
    eventOn("mag_variable_update_ended_for_zod", (t) => {
      (_.set(t, "schema", "没有用别管这个"),
        _.unset(t, "display_data"),
        _.unset(t, "delta_data"));
    }),
    console.info("变量结构注册成功"));
}
function a(t, e, r) {
  (toastr["warn" === t ? "warning" : "error"](
    e.replaceAll("\n", "<br>"),
    "[MVU zod]" + r,
    { escapeHtml: !1 },
  ),
    console[t](`${r}\n${e}`));
}
function o(t) {
  return t.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/, "$1");
}
function i(t) {
  return o(t).replace(/^(?:stat_data|status_current_variables)\./, "");
}
function c(t) {
  const e = (function (t) {
    const e = t.trim();
    if ("true" === e) return !0;
    if ("false" === e) return !1;
    if ("null" === e) return null;
    if ("undefined" === e) return;
    try {
      return JSON.parse(e);
    } catch (t) {
      if (
        (e.startsWith("{") && e.endsWith("}")) ||
        (e.startsWith("[") && e.endsWith("]"))
      )
        try {
          const t = new Function(`return ${e};`)();
          if (_.isObject(t) || Array.isArray(t)) return t;
        } catch (t) {}
    }
    try {
      return YAML.parse(e);
    } catch (t) {}
    return o(t);
  })(t);
  return e instanceof Date
    ? e.toISOString()
    : Array.isArray(e)
      ? e.map((t) => (t instanceof Date ? t.toISOString() : t))
      : e;
}
export { n as registerMvuSchema };
//# sourceMappingURL=mvu_zod.js.map

export const Schema_斗罗大陆 = z.object({
  日期: z.string().describe('格式: 斗罗历YYYY年MM月DD日'),
  时间: z.string().describe('格式: HH:MM'),
  当前场景: z.string(),
  主角: z.object({
    姓名: z.string().default('joeZYN'),
    年龄: z.coerce.number().default(6),
    当前位置: z.string(),
    魂力等级: z.coerce.number().transform(v => _.clamp(v, 1, 100)),
    魂环配置: z.string(),
    武魂: z.object({
      名称: z.string().default('圣人临世'),
      类型: z.string().default('本体武魂'),
      先天魂力: z.coerce.number().default(10),
      核心能力: z.object({
        因果操控: z.string(),
        印象削弱: z.string(),
        预感机制: z.string()
      })
    }),
    持有物品: z.object({
      金魂币: z.coerce.number(),
      魂导器戒指: z.string(),
      苏家玉佩: z.string(),
      武魂殿徽章: z.string()
    }),
    特殊能力: z.object({
      早熟特质: z.string()
    })
  }),
  追随者A: z.object({
    姓名: z.string(),
    年龄: z.coerce.number(),
    类型: z.string(),
    当前位置: z.string(),
    关系: z.string(),
    武魂: z.object({
      名称: z.string(),
      类型: z.string(),
      先天魂力: z.coerce.number(),
      核心能力: z.string()
    }),
    贞洁状态: z.object({
      初吻: z.boolean(),
      处女: z.boolean(),
      口交次数: z.coerce.number(),
      肛交次数: z.coerce.number(),
      阴道性交次数: z.coerce.number(),
      内射次数: z.coerce.number(),
      特殊经历: z.string()
    }),
    心理状态: z.object({
      核心创伤: z.string(),
      依赖机制: z.string(),
      扭曲认知: z.string()
    })
  }).optional(),
  关联人物B: z.object({
    姓名: z.string(),
    年龄: z.coerce.number(),
    类型: z.string(),
    当前位置: z.string(),
    关系: z.string(),
    武魂: z.object({
      名称: z.string(),
      类型: z.string(),
      魂力等级: z.coerce.number()
    }),
    贞洁状态: z.object({
      初吻: z.string().describe('状态未知时用文字描述'),
      处女: z.boolean(),
      阴道性交次数: z.coerce.number(),
      内射次数: z.coerce.number(),
      特殊经历: z.string()
    }),
    未来计划: z.string()
  }).optional(),
  目标地点: z.object({
    当前目标: z.string(),
    预计到达时间: z.string()
  })
});

$(() => {
  registerMvuSchema(Schema_斗罗大陆);
})