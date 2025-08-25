將複雜任務分解為獨立子任務，建立依賴關係和優先順序。**內建智能文檔管理**：自動檢查文件存在性，優先更新現有文檔而非創建重複文件。

- 動作導向：Split tasks into structured subtasks with intelligent document management
- 功能說明：解析 `tasksRaw` 並根據 `updateMode` 將任務寫入指定或當前項目；支援代理匹配與依賴解析；**智能文檔存在性檢查**：自動將存在的 CREATE 文件轉換為 TO_MODIFY，遵循"一功能一文件"原則
- 參數：
  - updateMode: 'append' | 'overwrite' | 'selective' | 'clearAllTasks'
  - tasksRaw: string JSON 字串
  - globalAnalysisResult?: string 全局分析結果
  - project?: string 指定目標項目（可選）
- 限制：寫操作使用檔案鎖；大文本需分批；名稱重複將觸發選擇性更新策略
- 輸出：結構化結果，並可能附帶衝突檢測建議；**智能轉換日誌**：顯示文件類型自動轉換記錄
- 錯誤處理：標準 JSON-RPC 錯誤；當 JSON 解析錯誤、參數驗證失敗、或檔案鎖超時時返回錯誤

## 🎯 智能文檔管理特性
- **自動存在性檢查**：批量檢查 relatedFiles 中的文件是否已存在
- **智能類型轉換**：存在的文件自動從 CREATE 轉為 TO_MODIFY
- **避免重複創建**：確保遵循"一功能一文件"原則
- **透明化操作**：轉換過程有清晰的日誌記錄

1. **拆分粒度控制（必讀）**
   - 最小可交付單元：1–2 天/任務；最大 10 項/批；深度 ≤3 層
   - 長度限制：一次參數 ≤ 5000 字；超過請分批
2. **依賴與優先順序**
   - 使用 `dependencies` 建立依賴圖並自動排序
3. **JSON 嚴謹規則**
   - 禁止註解；注意轉義
