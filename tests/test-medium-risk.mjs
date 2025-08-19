/**
 * 测试中等风险情况
 */

import { forceSearchProtocol } from './dist/tools/search/forceSearchProtocol.js';

const result = await forceSearchProtocol({
  conversationContext: '用户询问关于TypeScript配置的问题，AI给出了一个解决方案但不确定是否是最新的最佳实践。',
  problemDescription: 'TypeScript编译配置优化',
  currentApproach: '修改tsconfig.json',
  uncertaintyLevel: 'medium',
  errorCount: 1
});

const text = result.content[0].text;
console.log('搜索优先级:', text.includes('HIGH') ? 'HIGH' : text.includes('MEDIUM') ? 'MEDIUM' : text.includes('LOW') ? 'LOW' : 'OTHER');
console.log('风险级别:', text.includes('Risk Level**: HIGH') ? 'HIGH' : text.includes('Risk Level**: MEDIUM') ? 'MEDIUM' : 'OTHER');

// 输出关键部分
const lines = text.split('\n');
for (let i = 0; i < Math.min(15, lines.length); i++) {
  console.log(lines[i]);
}