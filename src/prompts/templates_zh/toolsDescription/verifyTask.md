Verify and score task completion according to verification criteria. Provides quality assurance and automatically completes tasks that meet standards.

## When to Use
- Task implementation completed and ready for verification
- Need quality assessment against verification criteria
- Want to complete task with proper validation

## Parameters
- taskId (required): Unique identifier of task to verify (UUID format)
- summary (required): Task completion summary or issue description
- score (required): Overall quality score from 0-100
- project (optional): Target project context (defaults to current session project)

## Expected Output
Verification results with quality assessment, score breakdown, and task completion status update.

## Error Handling
Standard JSON-RPC error format with specific guidance for resolution and retry procedures.

## 🔄 **強制性工作流繼續指導**

**重要：任務驗證完成後，您必須立即執行以下操作：**

### 📋 **必須執行的後續步驟**

1. **立即調用質量檢查工具**：
   ```
   mandatory_code_review({
     taskId: "剛驗證的任務ID",
     project: "當前項目名稱",
     submissionContext: "任務驗證完成，進行強制性代碼審查",
     claimedEvidence: "任務實施證據和驗證結果",
     reviewScope: "comprehensive"
   })
   ```

2. **禁止的操作**：
   - ❌ 不要直接調用 execute_task
   - ❌ 不要跳過質量檢查步驟
   - ❌ 不要停止在任務驗證階段

3. **工作流順序**：
   ```
   verify_task → mandatory_code_review → execute_task
   ```

### 🎯 **自動化工作流說明**

**當您完成任務驗證後：**
- 如果評分 ≥ 80：任務自動標記為完成，然後**必須**調用 mandatory_code_review
- 如果評分 < 80：任務保持進行中狀態，仍然**必須**調用 mandatory_code_review 進行診斷

**質量檢查工具將會：**
- 執行代碼標準檢查
- 進行安全漏洞掃描
- 清理臨時文件和優化項目結構
- 基於質量評分決定是否繼續到下一個任務

### ⚠️ **關鍵提醒**

**這是一個自動化工作流系統。verify_task 只是第一步，不是終點。**
**您必須確保工作流的完整執行：verify_task → mandatory_code_review → execute_task**

**不要在任務驗證後停止。立即調用 mandatory_code_review 以維持工作流的連續性。**