export const demoPullRequest = {
  number: 482,
  title: 'Add invite-only workspace onboarding',
  repository: 'orbit-labs/console',
  author: 'mia-chen',
  branch: 'feature/invite-onboarding',
  baseBranch: 'main',
  changedFiles: [
    { path: 'src/routes/invitations.ts', additions: 24, deletions: 3, language: 'TypeScript', content: `export async function acceptInvitation(token: string, userId: string) {\n  const invite = await db.invitation.findUnique({ where: { token } });\n  if (!invite || invite.expiresAt < new Date()) {\n    throw new Error('Invitation is invalid');\n  }\n\n  await db.workspaceMember.create({\n    data: { workspaceId: invite.workspaceId, userId, role: invite.role }\n  });\n\n  return { workspaceId: invite.workspaceId };\n}` },
    { path: 'src/routes/invitations.test.ts', additions: 12, deletions: 0, language: 'TypeScript', content: `it('accepts a valid invitation', async () => {\n  const result = await acceptInvitation(validToken, user.id);\n  expect(result.workspaceId).toBe(workspace.id);\n});` },
    { path: 'src/components/InviteBanner.tsx', additions: 18, deletions: 1, language: 'TSX', content: `export function InviteBanner({ email }: { email: string }) {\n  return <p>You've been invited as {email}</p>;\n}` }
  ],
  testResult: { command: 'pnpm test', passed: false, duration: '18.4s', summary: '1 failed, 184 passed', failure: 'accepts invitation twice: expected member count 1, received 2' },
  learnedStyle: { summary: 'This team treats authorization and idempotency as blocking. Prefer focused tests for edge cases; do not flag formatting nits.', conventions: ['Require idempotency for state-changing endpoints', 'Test expiry and repeat submission paths', 'Keep review comments direct and actionable'] }
};
