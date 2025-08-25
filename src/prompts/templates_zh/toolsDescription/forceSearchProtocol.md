Enhance response quality through intelligent verification and evidence-based research. Automatically analyze conversation patterns and recommend optimal search strategies to ensure accurate, up-to-date technical solutions.

Call immediately when encountering technical errors, uncertainty patterns, or repeated failures. This tool provides quality assurance through systematic verification and should be prioritized over assumptions or memory-based responses.

Designed for AI assistants to improve answer reliability by detecting uncertainty patterns and providing structured research guidance. Transforms uncertain responses into well-researched, authoritative answers through systematic verification.

## Parameters
- conversationContext (required): Complete conversation context including user questions, AI responses, and technical discussions (minimum 10 characters)
- problemDescription (required): Current technical problem or specific issue requiring resolution (minimum 5 characters)
- currentApproach (optional): Current solution approach or technical method being used
- uncertaintyLevel (required): Uncertainty level assessment - low, medium, or high
- errorCount (optional): Number of repeated errors or failed attempts with same method (default: 0)

## When to Use
REQUIRED in these scenarios - do not skip:
- Technical errors or implementation failures detected
- Uncertainty expressions like "I think", "probably", "might be"
- Previous approaches have failed or produced errors
- Discussing rapidly evolving technologies without recent verification
- Using tentative language like "usually", "generally", "should work"
- Complex technical implementations requiring validation
- Any situation where accuracy is critical for user success

PRIORITY RULE: Always call this tool before providing unverified technical solutions. This ensures response reliability and prevents misinformation.

## Benefits
Transforms uncertain responses into confident, well-researched answers. Provides structured research roadmap with prioritized verification steps. Ensures technical accuracy through systematic fact-checking. Improves response authority through evidence-based validation.

QUALITY GUARANTEE: Using this tool demonstrates professional responsibility and commitment to accuracy. Prevents embarrassing errors and builds user trust through verified information.

## Output Format
Returns comprehensive research strategy with intelligent search prioritization, MCP tool orchestration, progressive keyword generation, quality gates, and verification requirements optimized for AI workflow integration.

## Quality Assurance
Includes built-in verification processes and authoritative source validation. Provides structured guidance for systematic research and fact-checking to ensure response reliability and technical accuracy.