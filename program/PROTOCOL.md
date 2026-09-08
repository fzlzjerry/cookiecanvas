# CookieCanvas paint instruction v1

The program is intentionally stateless. Every successful instruction is a validated,
signed paint event. CookieCanvas reconstructs the current mural from the program's
confirmed transaction history, so the visual state is independently replayable without
an indexer or proprietary API.

## Accounts

| Index | Writable | Signer | Meaning |
| --- | --- | --- | --- |
| 0 | No | Yes | Painter wallet |

## Instruction bytes

| Offset | Size | Field |
| --- | --- | --- |
| 0 | 4 | ASCII magic `CCV1` |
| 4 | 1 | X coordinate, 0-15 |
| 5 | 1 | Y coordinate, 0-15 |
| 6 | 3 | RGB bytes |
| 9 | 1 | Alias UTF-8 byte length, 1-16 |
| 10 | 1 | Note UTF-8 byte length, 0-64 |
| 11 | variable | Alias, then note |

Aliases are restricted to ASCII letters, numbers, spaces, dashes, and underscores.
Notes must be valid UTF-8 and may not contain control characters. Exact instruction
bytes are also emitted with `sol_log_data`, enabling explorer-side verification.

## Error codes

| Code | Meaning |
| --- | --- |
| 1 | Missing painter account |
| 2 | Painter did not sign |
| 3 | Truncated instruction |
| 4 | Unsupported protocol version |
| 5 | Coordinate outside 16 x 16 canvas |
| 6 | Alias missing/too long or note too long |
| 7 | Encoded lengths do not match payload |
| 8 | Invalid UTF-8 |
| 9 | Invalid alias character |
| 10 | Control character in note |
