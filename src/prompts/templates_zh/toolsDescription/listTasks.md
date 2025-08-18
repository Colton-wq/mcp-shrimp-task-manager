列出指定項目或當前會話項目的任務列表，支持按狀態過濾，返回結構化資訊並附帶項目元數據。

- 動作導向：List tasks of a project
- 功能說明：讀取並輸出任務清單，支援 `status` 過濾；當提供 `project` 參數時在該項目上下文讀取，否則使用目前會話項目。
- 參數：
  - status: "all" | "pending" | "in_progress" | "completed" 用於狀態過濾
  - project?: string 指定要讀取的項目（可選）
- 限制：只讀操作；當項目不存在或路徑不可訪問時返回標準錯誤
- 輸出：結構化文字，並附 `<!-- Project: name -->` 元數據，方便AI後續工具選擇正確項目
- 錯誤處理：採用 JSON-RPC 標準錯誤；建議呼叫方在錯誤時考慮改用 `list_projects` 或 `switch_project`。
