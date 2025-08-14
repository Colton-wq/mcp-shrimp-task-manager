Retrieve the instructional guidance for a specific task. You will complete the programming task based on this guidance. You must strictly follow the feedback and instructions provided by the tool — it is designed to **guide you toward perfect task completion, not to execute the task for you**. Severe Warning: Calling the executeTask tool does not mean you have completed the task. You must follow the step-by-step guidance returned by the tool to complete the task properly.


### Quality Automation (Frontend priority with Playwright MCP)
- When executing frontend tasks, you MUST directly call existing Playwright MCP tools for E2E validation. Do not generate manual Playwright test scripts. Use tools such as:
  - browser_navigate_playwright-enhanced, browser_wait_for_playwright-enhanced, browser_click_playwright-enhanced, browser_type_playwright-enhanced, browser_snapshot_playwright-enhanced, browser_take_screenshot_playwright-enhanced
- For unit/component tests, invoke the existing test runner via Desktop Commander (e.g., Vitest/Jest) and parse results (pass/fail, coverage). Do not install dependencies or create new scripts.
- For code review, invoke an external code review MCP server and return structured issues with severity for gating.