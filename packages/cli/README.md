# create-sentinel

Set up Sentinel x402 audit trails in 10 seconds.

## Quick Start

```bash
npx create-sentinel init
```

That's it. Detects your framework, installs the right package, creates config, done.

## Commands

### `npx create-sentinel init`

Interactive setup wizard:

- Detects your framework (Next.js, Express, LangChain, Vercel AI)
- Installs the right Sentinel package
- Creates `sentinel.config.ts`
- Adds environment variables
- Generates framework-specific example code

### `npx create-sentinel doctor`

Checks your Sentinel setup:

- ✓ SDK installed
- ✓ Config file exists
- ✓ API key configured
- ✓ Sentinel API reachable
- ✓ API key valid
- ✓ Framework package detected

### `npx create-sentinel inspect <receipt_id_or_tx_hash>`

Verify any Sentinel receipt or transaction. Works without auth.

```bash
npx create-sentinel inspect sr_8f3k2jx9m4np
npx create-sentinel inspect 0xabc123...def456
```

### `npx create-sentinel status`

View your team's payment stats from the terminal.

```bash
npx create-sentinel status
```

## Supported Frameworks

| Framework | Package Installed |
|-----------|-------------------|
| Next.js   | @x402sentinel/next |
| Express   | @x402sentinel/express |
| LangChain | @x402sentinel/langchain |
| Vercel AI | @x402sentinel/vercel-ai |
| Other     | @x402sentinel/x402 |

## Links

- [Sentinel Dashboard](https://sentinel.valeocash.com)
- [SDK on npm](https://npmjs.com/package/@x402sentinel/x402)
- [Docs](https://sentinel.valeocash.com/docs)
- [GitHub](https://github.com/valeo-cash/Sentinel)

## License

MIT — [Valeo](https://valeocash.com)
