驗證並評分指定項目的任務，若達標自動標記完成，並保存摘要。

- 動作導向：Verify and complete a task in a project
- 功能說明：根據驗證標準對任務進行評分；當 score ≥ 80 自動完成任務並保存摘要
- 參數：
  - taskId: string 目標任務ID（UUID v4）
  - summary: string 驗證摘要（≥30字）
  - score: number 0–100
  - project?: string 指定要驗證的項目（可選），省略則使用目前會話項目
- 限制：僅對進行中任務有效；不會更改任務其它屬性
- 輸出：結構化文本，包含結果與建議
- 錯誤處理：標準 JSON-RPC 錯誤格式
