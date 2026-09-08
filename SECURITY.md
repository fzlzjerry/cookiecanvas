# Security model

CookieCanvas is deliberately non-custodial and stateless:

- It never asks for a seed phrase, private key, password, or wallet export.
- Nightly signs one visible CookieCanvas instruction in the browser. The transaction
  contains no token transfer instruction.
- The program only accepts one read-only signer account. It cannot debit tokens or
  mutate another program-owned account.
- Alias and note text are public on-chain data. The interface states this before the
  wallet action; users should not put personal or confidential information in either.
- The app verifies the Cookie Chain genesis hash
  `9wDaBRDgArEUpvhHxGguNkwozsZh4UpGZB9o2EoEcBB2` before treating the RPC as healthy.
- Instruction lengths, coordinates, UTF-8, alias characters, and note control
  characters are independently checked by both the browser and the program.
- Mural state is derived from confirmed transactions addressed to the fixed program
  ID. Unknown instruction versions and failed transactions are ignored.

## Dependency note

`@solana/web3.js` 1.98.4 is the API documented by the Cookie Chain and Nightly examples.
As of 2026-09-08, `npm audit` reports moderate advisories in its Node-only `jayson`
transport dependency (`stream-json` and `uuid`). The Vite browser bundle does not expose
or use a JSON-RPC server, does not call the affected UUID APIs, and accepts no arbitrary
JSON for server-side filtering. The automated downgrade suggested by npm is an invalid
`@solana/web3.js` 0.0.3 change, so this repository retains the current compatible SDK
and records the limitation instead of applying a breaking or misleading fix.

## Reporting

Open a private GitHub security advisory for vulnerabilities. Do not put wallet secrets,
unresolved fund-impacting details, or personal information in a public issue.
