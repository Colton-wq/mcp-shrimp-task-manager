在指定或當前項目中搜尋任務，支援關鍵字或ID模式，返回結構化結果。

- 動作導向：Query tasks in a project
- 功能說明：呼叫系統搜尋在項目 memory/ 內的任務備份與當前任務；支援分頁
- 參數：
  - query: string 任務ID或關鍵字（空格分隔）
  - isId?: boolean 是否為ID模式（預設 false）
  - page?: number 頁碼（預設 1）
  - pageSize?: number 每頁數量（預設 5，最大 20）
  - project?: string 指定查詢的項目（可選）
- 限制：只讀；若項目不存在或權限不足，回傳標準錯誤
- 輸出：結構化文本與分頁資訊
- 錯誤處理：標準 JSON-RPC 錯誤
