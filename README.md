# ReviewMint

**A proactive pull-request reviewer that reads the full change, runs the test signal, creates a fix branch, and learns how your team reviews.**

Developer Tools track - OpenAI Build Week 2026

## What it does

ReviewMint is designed for a 3-50 person engineering team where senior engineers are the code-review bottleneck. On a pull request event it gathers the changed files, test output, and learned team conventions, then returns only high-confidence findings. For substantive problems, it creates a sibling fix branch, reruns checks, and supplies a one-click apply action.

The local experience is intentionally complete and judge-testable: it contains a representative PR, a failing test signal, full-file review context, personalized conventions, line-level feedback, and a verified patch. It runs without accounts or API keys.

## Run locally

```bash
cd mergeclaw
pnpm start
# open http://localhost:3000
```

No install is required for the demo because it uses Node's built-in HTTP server. Use Node 20+.

```bash
pnpm test
```

## Production flow

```text
GitHub pull_request webhook
  -> verify SHA-256 signature
  -> queue review context
  -> isolated sandbox runs repository tests
  -> GPT-5.6 reasons over full files + diff + test output + team style
  -> GitHub line comments and sibling fix branch
  -> tests rerun on fix branch, then PR summary card
```

`src/webhook/` contains a tested, framework-neutral signature validator and event parser. The demo's local reviewer (`src/services/rule-engine.js`) is deterministic so judges can reliably exercise the complete product surface. In deployment, replace that adapter with the GitHub API, a queue, and a sandbox runner while preserving the `reviewPullRequest` contract.

## GPT-5.6 integration

GPT-5.6 is the review reasoning layer, not a text formatter. Its production prompt receives:

- full changed-file contents alongside the diff, so it can reason beyond a single hunk;
- sandbox test and coverage results, so comments are grounded in evidence;
- historical team conventions, so it avoids generic nitpicks and catches what a team actually blocks;
- a structured response contract for line comments, risk score, verdict, and executable patches.

The UI exposes this context to make the model's decision-making legible. Configure `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-5.6` in `.env` when wiring the production adapter.

## Safety and trust

- Every sandbox run is isolated and has no shared repository state.
- Generated patches go to sibling branches; ReviewMint never pushes to a contributor's branch.
- The default action is a review, not a merge. A human still applies the verified patch.
- The review engine reports only evidence-backed findings and retains the test output that informed them.

## Installation & Supported Platforms

- **Supported Platforms:** macOS, Linux, Windows (Node.js 20+).
- **Installation:** Clone repo, run `pnpm install` (or zero-install via Node built-in server), `pnpm start`.
- **Judge-Testable Path:** Run `pnpm start` and navigate to `http://localhost:3000`. The local demo path uses pre-populated representative pull request data, failing test signals, and verified patch output without requiring external API keys.

## Codex Workflow Narrative

This project was built from scratch in the primary Codex Build Week session. Codex was directed to turn the architecture plan into a judge-testable developer tool, implementing the deterministic review engine, signature-verification boundary, unit tests, and responsive GitHub-native review workspace.

**Codex Session ID:** [Insert Session ID from primary build thread]

## Prior vs. New Work

Built from scratch during OpenAI Build Week 2026 using OpenAI Codex and GPT-5.6. There is no pre-existing codebase or prior implementation.

## Roadmap

1. GitHub App installation and Octokit client for live PR comments.
2. Redis-backed work queue and disposable Docker sandbox per review.
3. GPT-5.6 structured-output adapter plus patch validation loop.
4. Historical PR ingester to persist style profiles per installation.

## License

MIT - see [LICENSE](LICENSE).
