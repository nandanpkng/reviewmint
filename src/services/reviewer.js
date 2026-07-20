import { inspectPullRequest } from './rule-engine.js';

const systemPrompt = `You are ReviewMint, a senior code reviewer. Review only concrete, high-confidence issues. Return JSON: { comments, patches, riskScore, coverageDelta, verdict, summary }. A comment must name a file, line, severity, concise explanation, and a practical fix. Respect the team's learned conventions. Never invent test results.`;

export async function reviewPullRequest(pullRequest) {
  const review = inspectPullRequest(pullRequest);
  return {
    ...review,
    engine: process.env.OPENAI_API_KEY ? 'GPT-5.6 ready - use the production adapter' : 'Local demo engine',
    modelContract: { model: process.env.OPENAI_MODEL || 'gpt-5.6', systemPrompt, contextIncluded: ['full changed files', 'test output', 'learned team style'] },
    completedAt: new Date().toISOString()
  };
}
