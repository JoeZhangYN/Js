export function buildApiResponseScript(worldContext) {
  return `api_response = ${function (b) {
    const worldContext = __HVAA_BATTLE_API_WORLD_CONTEXT__;
    function actionDetail() {
      const action = window.info || {};
      return {
        mode: action.mode,
        skill: action.skill,
        target: action.target,
        item: action.item,
      };
    }
    function reloadFromApiResponse(detail) {
      const recovery = window.HVAA_battleApiRecovery;
      if (recovery && recovery.handleRejectedResponse) {
        recovery.handleRejectedResponse({ ...detail, world: worldContext, action: actionDetail() });
        return true;
      }
      console.warn("[HVAA] navigation bridge missing; battle API reload blocked", detail);
      return false;
    }
    if (b.readyState === 4) {
      if (b.status === 200) {
        const a = JSON.parse(b.responseText);
        if (a.login !== undefined) return false;
        if (a.error || a.reload) {
          reloadFromApiResponse({
            responseKind: a.reload ? "jsonReload" : "jsonError",
            status: b.status,
            error: a.error,
            reload: a.reload,
          });
          return false;
        }
        return a;
      }
      reloadFromApiResponse({ responseKind: "httpStatus", status: b.status });
    }
    return false;
  }.toString()}`.replace("__HVAA_BATTLE_API_WORLD_CONTEXT__", JSON.stringify(worldContext));
}
