# PromptLab

**Open-source prompt engineering toolkit.** Test, version, and compare prompts across AI models with full cost tracking and run history.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**Live Demo →**](https://promptlab.spencerstiles.dev) | [**Hosted ($19/mo) →**](https://cal.com/spencerstiles)

---

## Quick Start

```bash
git clone https://github.com/SpencerStiles/promptlab
cd promptlab
pnpm install
cp .env.example .env.local
# Add OPENAI_API_KEY and optionally ANTHROPIC_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Why PromptLab vs. PromptFlow / LangSmith?

| | PromptLab | PromptFlow | LangSmith |
|-|-----------|-----------|----------|
| Self-hostable | ✅ | ✅ | ❌ |
| Multi-model | ✅ | ⚠️ | ✅ |
| Cost tracking | ✅ | ❌ | ✅ |
| Version history | ✅ | ✅ | ✅ |
| Open source | ✅ MIT | ✅ | ❌ |
| Setup time | < 5 min | Complex | SaaS signup |

## Features

- **Prompt Templates** — `{{variable}}` interpolation with reusable templates
- **Multi-Model Playground** — GPT-4o, Claude Sonnet, and more side-by-side
- **Cost Estimation** — Real-time cost tracking per model per run
- **Version History** — Every edit auto-versioned; restore any previous version
- **Run Analytics** — Full history with tokens, latency, and ratings
- **Free-Form Playground** — Quick ad-hoc testing without templates

## Tech Stack

Next.js 14 · TypeScript · Prisma · SQLite (self-hosted) / PostgreSQL (hosted) · Tailwind CSS

## Hosted Version

Don't want to self-host? The hosted version adds team collaboration, shared workspaces, and managed PostgreSQL. **$19/mo.** [Sign up →](https://cal.com/spencerstiles)

## License

MIT — use it however you want.
