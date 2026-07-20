import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isValidGitHubSignature } from '../src/webhook/validator.js';

test('accepts a valid GitHub sha256 signature', () => {
  const body = '{"action":"opened"}';
  const secret = 'demo-secret';
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  assert.equal(isValidGitHubSignature(body, signature, secret), true);
  assert.equal(isValidGitHubSignature(body, 'sha256=nope', secret), false);
});
