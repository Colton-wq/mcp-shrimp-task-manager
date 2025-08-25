import { mandatoryCodeReview } from './dist/tools/review/mandatoryCodeReview.js';

console.log('🔍 Debugging mandatoryCodeReview return structure...');

try {
  const result = await mandatoryCodeReview({
    taskId: 'e92abd0f-eea2-433c-9531-a6c6689b912d',
    project: 'shrimp-mandatory-review-optimization',
    submissionContext: 'Implemented TypeScript React component with proper hooks and state management.',
    claimedEvidence: 'Modified src/components/Test.tsx with TypeScript interfaces and React hooks.',
    reviewScope: 'comprehensive'
  });

  console.log('📊 Result structure:');
  console.log('Type:', typeof result);
  console.log('Keys:', Object.keys(result));
  console.log('Full result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Error:', error.message);
}