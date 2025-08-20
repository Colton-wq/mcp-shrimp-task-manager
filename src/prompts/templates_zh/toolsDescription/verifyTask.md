驗證並評分指定項目的任務，若達標自動標記完成，並保存摘要。**完成後必須自動調用code_review_and_cleanup_tool進行質量檢查。**

- 動作導向：Verify and complete a task in a project, then trigger automated quality review
- 功能說明：根據驗證標準對任務進行評分；當 score ≥ 80 自動完成任務並保存摘要
- 參數：
  - taskId: string 目標任務ID（UUID v4）
  - summary: string 驗證摘要（≥30字）
  - score: number 0–100
  - project?: string 指定要驗證的項目（可選），省略則使用目前會話項目
- 限制：僅對進行中任務有效；不會更改任務其它屬性
- 輸出：結構化文本，包含結果與建議
- 錯誤處理：標準 JSON-RPC 錯誤格式

## 🔄 **強制性工作流繼續指導**

**重要：任務驗證完成後，您必須立即執行以下操作：**

### 📋 **必須執行的後續步驟**

1. **立即調用質量檢查工具**：
   ```
   code_review_and_cleanup_tool({
     taskId: "剛驗證的任務ID",
     project: "當前項目名稱",
     reviewScope: "comprehensive",
     cleanupMode: "safe"
   })
   ```

2. **禁止的操作**：
   - ❌ 不要直接調用 execute_task
   - ❌ 不要跳過質量檢查步驟
   - ❌ 不要停止在任務驗證階段

3. **工作流順序**：
   ```
   verify_task → code_review_and_cleanup_tool → execute_task
   ```

### 🎯 **自動化工作流說明**

**當您完成任務驗證後：**
- 如果評分 ≥ 80：任務自動標記為完成，然後**必須**調用 code_review_and_cleanup_tool
- 如果評分 < 80：任務保持進行中狀態，仍然**必須**調用 code_review_and_cleanup_tool 進行診斷

**質量檢查工具將會：**
- 執行代碼標準檢查
- 進行安全漏洞掃描
- 清理臨時文件和優化項目結構
- 基於質量評分決定是否繼續到下一個任務

### ⚠️ **關鍵提醒**

**這是一個自動化工作流系統。verify_task 只是第一步，不是終點。**
**您必須確保工作流的完整執行：verify_task → code_review_and_cleanup_tool → execute_task**

**不要在任務驗證後停止。立即調用 code_review_and_cleanup_tool 以維持工作流的連續性。**