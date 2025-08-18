import { z } from "zod";
import { ProjectSession } from "../../utils/projectSession.js";
import { clearPathCache, getDataDir } from "../../utils/paths.js";

export const switchProjectSchema = z.object({
  project: z.string().min(1).describe("要切換的項目名稱")
});

export async function switchProject({ project }: z.infer<typeof switchProjectSchema>) {
  ProjectSession.setCurrentProject(project);
  clearPathCache();

  // 驗證資料夾是否可用
  try {
    await getDataDir(true);
  } catch {}

  return {
    content: [
      { type: "text" as const, text: `已切換至項目：${project}` }
    ]
  };
}

