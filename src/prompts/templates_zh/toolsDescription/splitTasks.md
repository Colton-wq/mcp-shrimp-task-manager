將複雜任務分解為獨立子任務，建立依賴關係和優先順序。

- 動作導向：Split tasks into structured subtasks
- 功能說明：解析 `tasksRaw` 並根據 `updateMode` 將任務寫入指定或當前項目；支援代理匹配與依賴解析
- 參數：
  - updateMode: 'append' | 'overwrite' | 'selective' | 'clearAllTasks'
  - tasksRaw: string JSON 字串
  - globalAnalysisResult?: string 全局分析結果
  - project?: string 指定目標項目（可選）
- 限制：寫操作使用檔案鎖；大文本需分批；名稱重複將觸發選擇性更新策略
- 輸出：結構化結果，並可能附帶衝突檢測建議
- 錯誤處理：標準 JSON-RPC 錯誤；當 JSON 解析錯誤、參數驗證失敗、或檔案鎖超時時返回錯誤

1. **拆分粒度控制（必讀）**
   - 最小可交付單元：1–2 天/任務；最大 10 項/批；深度 ≤3 層
   - 長度限制：一次參數 ≤ 5000 字；超過請分批
2. **依賴與優先順序**
   - 使用 `dependencies` 建立依賴圖並自動排序
3. **JSON 嚴謹規則**
   - 禁止註解；注意轉義
