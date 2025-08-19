/**
 * 测试低风险情况的工具数量
 */

import { forceSearchProtocol } from './dist/tools/search/forceSearchProtocol.js';

const result = await forceSearchProtocol({
  conversationContext: '用户询问一个简单的编程概念，AI给出了标准的解释。',
  problemDescription: 'JavaScript数组方法使用',
  currentApproach: '使用map和filter方法',
  uncertaintyLevel: 'low',
  errorCount: 0
});

const text = result.content[0].text;
const toolMatches = text.match(/#### \d+\./g) || [];
console.log('工具数量:', toolMatches.length);
console.log('搜索优先级:', text.includes('LOW') ? 'LOW' : text.includes('MEDIUM') ? 'MEDIUM' : 'OTHER');

// 输出部分内容以便调试
console.log('\n--- 部分输出内容 ---');
const lines = text.split('\n');
for (let i = 0; i < Math.min(20, lines.length); i++) {
  console.log(lines[i]);
}