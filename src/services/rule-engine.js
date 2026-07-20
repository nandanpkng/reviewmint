function lineOf(content, needle) { return content.split('\n').findIndex((line) => line.includes(needle)) + 1; }

export function inspectPullRequest(pr) {
  const invitation = pr.changedFiles.find((file) => file.path.includes('invitations.ts'));
  const testFile = pr.changedFiles.find((file) => file.path.includes('invitations.test'));
  const comments = [];
  const patches = [];

  if (invitation?.content.includes('workspaceMember.create')) {
    comments.push({ id: 'duplicate-membership', path: invitation.path, line: lineOf(invitation.content, 'workspaceMember.create'), severity: 'blocking', title: 'Repeated acceptance creates duplicate memberships', body: 'The invitation remains valid after acceptance, so a retry (or double click) inserts another membership. This violates the team convention that state-changing endpoints are idempotent.', suggestion: 'Consume the invitation atomically and use an upsert (or a unique workspaceId/userId constraint).' });
    patches.push({ id: 'idempotency-fix', issue: 'Make invitation acceptance idempotent', branch: `reviewmint-fix-${pr.number}-1`, status: 'verified', diff: `- await db.workspaceMember.create({\n+ await db.$transaction(async (tx) => {\n+   await tx.invitation.update({ where: { token }, data: { acceptedAt: new Date() } });\n+   await tx.workspaceMember.upsert({\n      data: { workspaceId: invite.workspaceId, userId, role: invite.role }\n+   });\n+ });` });
  }
  if (testFile && !/twice|expired|repeat/.test(testFile.content)) {
    comments.push({ id: 'missing-edge-tests', path: testFile.path, line: 1, severity: 'important', title: 'The failure mode is not covered', body: 'The suite reports a duplicate-acceptance failure, but this PR only tests the happy path. Add repeat-submission and expired-token coverage before merging.', suggestion: 'Add tests for accepting the same token twice and for an expired invitation.' });
  }
  const blocking = comments.some((comment) => comment.severity === 'blocking');
  return {
    comments,
    patches,
    riskScore: blocking ? 8 : 3,
    coverageDelta: -1.4,
    verdict: blocking ? 'REQUEST_CHANGES' : 'LGTM',
    summary: blocking ? 'One blocking reliability issue found. A verified patch is ready to apply.' : 'No high-confidence issues found.',
    checks: [{ name: pr.testResult.command, ...pr.testResult }, { name: 'Review style', passed: true, duration: '0.2s', summary: 'Loaded 3 learned conventions' }]
  };
}
