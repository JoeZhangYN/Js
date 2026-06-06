// 通用「store-only」ZIP 编码（无依赖、不压缩）。
// 动机：导出答题训练样本集为真 .jpg + .json 文件包，开箱即用（替代单个大 base64 JSON 需后期处理）。
// JPEG 本身已压缩，再 deflate 收益极低 → 用 store(method 0) 省一个压缩库依赖，零体积负担。
// 纯能力模块（非业务），由 state/riddle-dataset.js 消费。

/** CRC-32（IEEE 0xEDB88320），ZIP 本地/中央目录头必填。 */
function crc32(bytes) {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}

/** ASCII 文件名 → 字节（ZIP 名段；非 ASCII 不在本用例，截断到 Latin-1 安全）。 */
function nameBytes(name) {
  const out = new Uint8Array(name.length);
  for (let i = 0; i < name.length; i++) out[i] = name.charCodeAt(i) & 0xff;
  return out;
}

/**
 * 打包若干文件为单个 store-only ZIP Blob。
 * @param {{name:string, bytes:Uint8Array}[]} files
 * @returns {Blob} application/zip
 */
export function makeStoreZip(files) {
  const chunks = []; // 本地文件区(头+数据) 顺序写入
  const central = []; // 中央目录区
  let offset = 0; // 各文件本地头在流中的偏移（中央目录回填用）

  for (const f of files) {
    const data = f.bytes;
    const name = nameBytes(f.name);
    const crc = crc32(data);

    // —— 本地文件头(30B 定长 + name + data) ——
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); // 签名
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0, true); // flags
    local.setUint16(8, 0, true); // method 0 = store
    local.setUint16(10, 0, true); // mod time
    local.setUint16(12, 0x21, true); // mod date(1980-01-01, 固定避免不确定性)
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); // compressed size
    local.setUint32(22, data.length, true); // uncompressed size
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true); // extra len
    chunks.push(new Uint8Array(local.buffer), name, data);

    // —— 中央目录头(46B 定长 + name) ——
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true); // version made by
    cen.setUint16(6, 20, true); // version needed
    cen.setUint16(8, 0, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, 0, true);
    cen.setUint16(14, 0x21, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint16(30, 0, true); // extra len
    cen.setUint16(32, 0, true); // comment len
    cen.setUint16(34, 0, true); // disk number
    cen.setUint16(36, 0, true); // internal attrs
    cen.setUint32(38, 0, true); // external attrs
    cen.setUint32(42, offset, true); // 本地头偏移
    central.push(new Uint8Array(cen.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const centralSize = central.reduce((n, u) => n + u.length, 0);

  // —— 中央目录结束记录(EOCD, 22B) ——
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, files.length, true); // 本盘条目数
  eocd.setUint16(10, files.length, true); // 总条目数
  eocd.setUint32(12, centralSize, true); // 中央目录大小
  eocd.setUint32(16, offset, true); // 中央目录起始偏移
  eocd.setUint16(20, 0, true); // comment len

  return new Blob([...chunks, ...central, new Uint8Array(eocd.buffer)], {
    type: "application/zip",
  });
}
