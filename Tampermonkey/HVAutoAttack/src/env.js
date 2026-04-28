// 全局环境常量与持久状态对象（单例 ES module）
// 阶段 5 会把 hvAAOriginal/hvAAIsekai 改为显式 Store；当前保留闭包等价行为。

/** 主世界对应网址 */
export const MAIN_URL = "https://hentaiverse.org/";

/** 异世界对应网址 */
export const ISEKAI_URL = "https://hentaiverse.org/isekai/";

/** 当前会话是否在异世界 */
export const isIsekai = window.location.href.startsWith(ISEKAI_URL);

/** GM 存储前缀。改这个值会让用户配置全部丢失。红线：Phase 1-5 不动。 */
export const storagePrefix = isIsekai ? "hvAA_isekai_" : "hvAA_";

/** 主世界运行时数据（g() 闭包对象） */
export const hvAAOriginal = {};

/** 异世界运行时数据（g() 闭包对象） */
export const hvAAIsekai = {};
