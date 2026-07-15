export function storageMaintenancePreviewCopy(preview) {
  const mib = (preview.bytes / 1024 / 1024).toFixed(2);
  return {
    l0: `存储维护预览\n世界: ${preview.world}\n旧聚合源: ${preview.aggregate.count}\n旧答题样本: ${preview.riddle.count}\n总量约: ${mib} MiB\n\n将分批写入 IndexedDB、回读哈希校验、写回执，然后才删除对应旧源。每批最多 8 项或 8 MiB。现在开始？`,
    l1: `儲存維護預覽\n世界: ${preview.world}\n舊聚合源: ${preview.aggregate.count}\n舊答題樣本: ${preview.riddle.count}\n總量約: ${mib} MiB\n\n將分批寫入 IndexedDB、回讀雜湊校驗、寫回執，然後才刪除對應舊來源。每批最多 8 項或 8 MiB。現在開始？`,
    l2: `Storage maintenance preview\nWorld: ${preview.world}\nLegacy aggregate sources: ${preview.aggregate.count}\nLegacy riddle samples: ${preview.riddle.count}\nApproximate total: ${mib} MiB\n\nEach idle batch writes to IndexedDB, reads back and verifies the hash, records a receipt, then deletes its legacy source. Maximum 8 items or 8 MiB per batch. Start now?`,
  };
}
