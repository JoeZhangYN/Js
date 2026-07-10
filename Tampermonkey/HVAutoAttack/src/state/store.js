// 单页运行时状态能力。每个应用实例拥有一个闭包 namespace，不再按 World 维护全局双对象。
export function createRuntimeStoreCapability(initialState = {}) {
  const state = { ...initialState };

  function g(key, value) {
    if (key === undefined && value === undefined) return state;
    if (value === undefined) return state[key];
    state[key] = value;
  }

  return Object.freeze({ g });
}

const currentRuntimeStore = createRuntimeStoreCapability();
export const g = currentRuntimeStore.g;
