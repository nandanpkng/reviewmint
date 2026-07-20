import test from 'node:test';
import assert from 'node:assert/strict';
import { demoPullRequest } from '../src/services/demo-data.js';
import { inspectPullRequest } from '../src/services/rule-engine.js';

test('flags duplicate invitation acceptance and creates a patch', () => {
  const review = inspectPullRequest(demoPullRequest);
  assert.equal(review.verdict, 'REQUEST_CHANGES');
  assert.equal(review.comments[0].id, 'duplicate-membership');
  assert.equal(review.patches[0].status, 'verified');
});
