import { TimeEvent, runTimeAutomation } from "../core/time.js";
import { recordRiddleDatasetFailure } from "./riddle-dataset-failure.js";

function downloadTsStr() {
  return runTimeAutomation({ type: TimeEvent.LOCAL_FILE_TIMESTAMP });
}

function cleanupRiddleDatasetDownload(anchor, url) {
  try {
    if (anchor?.parentNode) anchor.parentNode.removeChild(anchor);
  } catch (error) {
    recordRiddleDatasetFailure("export-download-cleanup", { error: error.message });
  }
  try {
    if (url) URL.revokeObjectURL(url);
  } catch (error) {
    recordRiddleDatasetFailure("export-revoke", { error: error.message });
  }
}

export function triggerRiddleDatasetDownload(blob) {
  let url = "";
  let anchor = null;
  try {
    url = URL.createObjectURL(blob);
    anchor = document.createElement("a");
    anchor.style.display = "none";
    anchor.href = url;
    anchor.download = `pony_dataset_${downloadTsStr()}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
  } catch (error) {
    recordRiddleDatasetFailure("export-download", { error: error.message });
    cleanupRiddleDatasetDownload(anchor, url);
    return false;
  }
  setTimeout(() => cleanupRiddleDatasetDownload(anchor, url), 200);
  return true;
}
