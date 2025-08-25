**請嚴格遵守以下指導**

## 驗證失敗

任務 "{name}" (ID: `{id}`) 驗證失敗

### 修正建議事項

{summary}

{learningFeedback}

## 🔧 強制問題解決工作流程

**關鍵：您必須遵循此解決工作流程：**

### 步驟1：立即問題分析（強制性）
**您必須調用 `mandatory_code_review` 來識別具體問題：**

**必需的工具調用：**
```
mandatory_code_review({
  taskId: "{id}",
  project: "current_project_name",
  reviewScope: "diagnostic",
  cleanupMode: "analysis_only"
})
```

### 步驟2：系統性問題解決
1. **系統性地解決每個已識別的問題**
2. **使用Desktop Commander MCP工具進行所有文件操作**
3. **基於質量工具建議實施修復**
4. **在進行下一個問題之前驗證每個修復**

### 步驟3：重新驗證過程
**修復所有問題後：**
- 使用更新的實現再次調用 `verify_task`
- 確保分數達到 ≥ 80 才能繼續
- 如果仍然失敗，重複診斷和修復循環

**禁止的操作：**
- ❌ 不要忽略質量工具建議
- ❌ 不要在不修復已識別問題的情況下繼續
- ❌ 不要跳過診斷步驟

**強制性操作：**
- ✅ 必須調用 `mandatory_code_review` 進行診斷
- ✅ 必須系統性地修復所有已識別的問題
- ✅ 必須在修復後重新驗證
- ✅ 必須使用Desktop Commander MCP工具進行文件操作

{learningFeedback}

**質量執行：** 此工作流程確保沒有不合標準的實現進入下一階段。
