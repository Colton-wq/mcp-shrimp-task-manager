import { z } from "zod";
import { getDataDir } from "../../utils/paths.js";
import fs from "fs/promises";

export const listProjectsSchema = z.object({});

export async function listProjects() {
  // 使用临时项目名获取基础路径来列出所有项目
  // Use temporary project name to get base path for listing all projects
  const dataDir = await getDataDir(true, "temp");
  const path = await import("path");
  const parent = path.dirname(dataDir);
  let projects: string[] = [];
  try {
    const entries = await fs.readdir(parent, { withFileTypes: true });
    projects = entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {}

  return {
    content: [
      { type: "text" as const, text: `可用項目：\n${projects.join("\n")}` }
    ]
  };
}

