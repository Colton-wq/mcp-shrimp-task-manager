import fs from "fs/promises";
import path from "path";

/**
 * 安全文件写入：先写临时文件，再原子重命名，降低半写风险
 * Safe write: write to a temp file then atomic rename
 */
export async function safeWrite(filePath: string, content: string | Buffer): Promise<void> {
  const dir = path.dirname(filePath);
  const tmpPath = filePath + ".tmp";

  // 确保目录已存在（调用方一般已保证），这里做一次兜底
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}

  await fs.writeFile(tmpPath, content);
  await fs.rename(tmpPath, filePath);
}

/**
 * 写 JSON 文件（带缩进），内部使用 safeWrite
 */
export async function safeWriteJson(filePath: string, data: any): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await safeWrite(filePath, json);
}

