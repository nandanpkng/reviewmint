import { isValidGitHubSignature } from './validator.js';

/**
 * Framework-agnostic webhook entry point. Plug this into Express/Fastify in production.
 * It intentionally queues only opened, synchronized and ready-for-review PR events.
 */
export function parsePullRequestWebhook({ rawBody, headers, payload, secret }) {
  if (!isValidGitHubSignature(rawBody, headers['x-hub-signature-256'], secret)) throw new Error('Invalid GitHub webhook signature');
  if (headers['x-github-event'] !== 'pull_request') return null;
  if (!['opened', 'synchronize', 'ready_for_review'].includes(payload.action)) return null;
  return {
    installationId: payload.installation.id,
    prNumber: payload.pull_request.number,
    commitSha: payload.pull_request.head.sha,
    repoOwner: payload.repository.owner.login,
    repoName: payload.repository.name
  };
}
