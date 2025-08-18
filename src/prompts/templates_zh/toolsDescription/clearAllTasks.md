清除指定項目或當前會話項目的所有未完成任務，並在清除前自動備份已完成任務到該項目的 memory 目錄。

- 動作導向：Clear all tasks for a project
- 功能說明：危險操作；在當前或指定 `project` 的任務文件中清空列表，並將已完成任務備份至該項目 `memory/`。
- 參數：
  - confirm: true 必須為 true 才會執行
  - project?: string 指定要清空的項目（可選）
- 限制：不可逆；請先使用 `list_tasks` 確認；建議在大型專案使用前再次備份
- 輸出：動作結果與備份檔名
- 錯誤處理：採用 JSON-RPC 標準錯誤；當檔案鎖超時或路徑不可寫時返回錯誤
