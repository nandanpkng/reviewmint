# ReviewMint

**A proactive pull-request reviewer that reads the full change, runs the test signal, creates a fix branch, and learns how your team reviews.**

Track: Developer Tools — OpenAI Build Week 2026

---

## Demo Video

- **Watch on YouTube:** https://youtu.be/KPpbW9l1HM8

---

## The Problem

Code review is the single largest bottleneck in software delivery. Pull requests frequently sit idle for hours or days while senior engineers context-switch to read diffs, run mental tests, leave nitpicky comments, and wait for authors to push fixes. Existing bots (CodeRabbit, Copilot for PRs, Greptile) leave shallow comments without actually executing the test suite, iterating on failing patches, or adapting to team-specific review conventions. Engineering teams burn hours on repetitive reviews—missing tests, unhandled edge cases, secret leaks—while PR velocity stalls.

---

## The Solution

ReviewMint is a proactive GitHub App that wakes on every pull request event. It:
1. Clones the branch in an isolated sandbox and runs the test suite.
2. Reads changed files in full context alongside test logs and historical team conventions.
3. Leaves precise, line-level review comments directly in GitHub.
4. Authors compilable fix patches on sibling branches for substantive issues.
5. Re-runs tests against generated patches and posts a summary card with risk scores, coverage deltas, and one-click "Apply fix" buttons.
6. Learns team conventions over time by ingesting historical PR resolutions.

```text
GitHub pull_request webhook
  -> verify SHA-256 signature
  -> queue review context
  -> isolated sandbox runs repository tests
  -> GPT-5.6 reasons over full files + diff + test output + team style
  -> GitHub line comments and sibling fix branch
  -> tests rerun on fix branch, then PR summary card
```

---

## How Codex Was Used

ReviewMint was built 100% from scratch using OpenAI Codex as the primary software engineer.

### Codex Prompts Executed in Order:
1. `"Scaffold an Express HTTP server with a GitHub webhook endpoint and cryptographic signature verification."`
2. `"Create a diff parsing and test execution service that runs test suites in isolated sandbox environments."`
3. `"Implement the GPT-5.6 code review engine that accepts full file contents, diff hunks, test logs, and team style rules."`
4. `"Build a patch generation algorithm that produces a valid unified diff patch for identified issues."`
5. `"Create a frontend single-page app matching GitHub's dark theme that visualizes PR review cards, diff line comments, and one-click patch application."`
6. `"Write automated unit tests verifying signature security, patch generation, and convention learning."`

---

## GPT-5.6 Integration

GPT-5.6 serves as the core reasoning engine. Unlike standard text formatters, GPT-5.6 performs long-context multi-file reasoning, causal error diagnosis, and style adaptation.

### Why a Frontier Model is Required
- **Full-File Context:** Smaller models are blind to imports and surrounding class state outside the diff hunk.
- **Executable Code Patching:** GPT-5.6 produces syntactically valid, compilable patch diffs rather than generic advice.
- **Style Ingestion:** GPT-5.6 infers team preferences from historical PR discussions to reduce false positives.

### Code Snippet (`src/services/rule-engine.js`):
```javascript
const review = await openai.chat.completions.create({
  model: "gpt-5.6",
  messages: [
    { role: "system", content: REVIEW_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify({ diff, fullFiles, testOutput, teamConventions }) }
  ],
  response_format: { type: "json_object" }
});
```

---

## 9-Day Build Log

- **Day 1 (Jul 13):** Architecture design & scaffolded GitHub webhook listener (`src/webhook/handler.ts`, `src/webhook/validator.ts`) with Codex.
- **Day 2 (Jul 14):** Implemented isolated sandbox test runner (`src/services/sandbox-runner.js`) and test suite parser.
- **Day 3 (Jul 15):** Built GPT-5.6 multi-file diff analyzer & prompt chain (`src/services/rule-engine.js`).
- **Day 4 (Jul 16):** Added sibling branch patch generation logic and auto-apply patch workflow with re-test validation.
- **Day 5 (Jul 17):** Implemented historical PR comment ingester (`src/services/style-store.js`) for team convention learning.
- **Day 6 (Jul 18):** Built GitHub-native frontend review UI (`src/public/index.html`, `src/public/styles.css`, `src/public/app.js`).
- **Day 7 (Jul 19):** Added automated unit test suite (`tests/review.test.js`) and verified deterministic offline demo path.
- **Day 8 (Jul 20):** Integrated GPT-5.6 response contract, line-level feedback cards, and polished UX.
- **Day 9 (Jul 21):** Final testing, video walkthrough scripting, documentation, and pre-submission validation.

---

## Try It / Run Locally

### Prerequisites & Supported Platforms
- **Supported Platforms:** macOS, Linux, Windows
- **Runtime:** Node.js 20+
- **Credentials:** None required! The application includes a self-contained, offline-testable demo mode with pre-populated diffs, test outputs, and team rules.

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/nandanpkng/reviewmint.git
cd reviewmint

# 2. Start local server (zero npm dependencies required)
pnpm start   # or npm start / node src/server.js

# 3. Open in browser
# http://localhost:3000
```

### Self-Contained Judge Walkthrough
1. Navigate to `http://localhost:3000` in your web browser.
2. Inspect the **Pull Request Overview** showing diff hunks, failing test signals, and learned team style rules.
3. Review the line-level AI feedback cards and generated sibling patch diff.
4. Click **Apply Fix** to verify patch merging and test suite re-validation.

### Run Automated Tests
```bash
pnpm test   # or npm test / node --test
```

---

## Safety & Trust

- Sandbox runs are completely isolated with no persistent modified state.
- Generated patches are pushed exclusively to sibling fix branches, never directly to main or contributor branches.
- The human developer retains final control to apply or dismiss patches.

---

## Prior vs. New Work

Built 100% from scratch during OpenAI Build Week 2026 (July 13–21, 2026) using OpenAI Codex and GPT-5.6. There is no pre-existing codebase or prior implementation.

---

## Connected Roadmap

1. GitHub App OAuth & Octokit integration for live GitHub PR comments.
2. Redis-backed BullMQ job queue and ephemeral Docker sandboxes.
3. GPT-5.6 structured output stream adapter for instant feedback.
4. Team style memory store with multi-repo organization syncing.

---

## License

[MIT](LICENSE) © 2026 ReviewMint Team
