# CLI Specification

## Primary binary

- `manychat`

Compatibility alias:
- `manychat-mcp`

## Output contract

Defaults:
- JSON to `stdout`
- diagnostics to `stderr`
- exit code `0` on success

Exit codes:
- `0`: success
- `2`: invalid CLI input
- `3`: auth or config error
- `4`: ManyChat API error
- `5`: rate limit or retry exhaustion

Formatting flags:
- `--json`: explicit machine-readable mode
- `--pretty`: pretty-print JSON
- `--verbose`: more diagnostics
- `--quiet`: suppress non-essential diagnostics

## Global flags

- `--api-key`
- `--profile`
- `--base-url`
- `--json`
- `--pretty`
- `--verbose`
- `--quiet`

Config precedence:
1. explicit flag
2. environment variable
3. local profile file at `~/.manychat/config.json`
4. default API base URL

## Command tree

Core commands:
- `manychat doctor`
- `manychat page info`
- `manychat tags list`
- `manychat tags create --name <name>`
- `manychat fields list`
- `manychat fields create --caption <name> --type <type> [--description <text>]`
- `manychat fields set --subscriber-id <id> (--field-id <id> | --field-name <name>) (--value <text> | --value-json <json>)`
- `manychat fields set-bulk --subscriber-id <id> --fields-json <json>`
- `manychat flows list`
- `manychat flows send --subscriber-id <id> --flow-ns <ns>`
- `manychat subscribers get --subscriber-id <id>`
- `manychat subscribers find (--email <email> | --phone <phone> | --name <name>)`
- `manychat subscribers create ...`
- `manychat subscribers update --subscriber-id <id> ...`
- `manychat subscribers tags add --subscriber-id <id> (--tag-id <id> | --tag-name <name>)`
- `manychat subscribers tags remove --subscriber-id <id> (--tag-id <id> | --tag-name <name>)`
- `manychat send text --subscriber-id <id> --text <text> [--message-tag <tag>]`
- `manychat send content --subscriber-id <id> --data-json <json> [--message-tag <tag>]`
- `manychat raw get --path <path> [--params-json <json>]`
- `manychat raw post --path <path> [--body-json <json>]`

Compatibility command:
- `manychat mcp serve [--transport stdio|http] [--port <port>]`

## Stability expectations

Stable in v1:
- command names
- flag names
- JSON envelope shape: `{ ok, command, data }` or `{ ok, command, error }`
- exit code meanings

Not stable in v1:
- human-readable help text
- local profile schema beyond `apiKey` and `baseUrl`
