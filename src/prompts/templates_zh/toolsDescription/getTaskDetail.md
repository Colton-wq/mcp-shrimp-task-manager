取得指定或當前項目中任務的完整詳細資訊，支援從 memory 內的備份檔查找。

- 動作導向：Get full task details in a project
- 功能說明：依任務 ID 於當前或指定項目內搜尋並回傳完整內容（包含實現指南、驗證標準等）
- 參數：
  - taskId: string 任務ID
  - project?: string 指定檢視的項目（可選）
- 限制：只讀；若未找到則回傳錯誤摘要與建議
- 輸出：結構化文本
- 錯誤處理：標準 JSON-RPC 錯誤
