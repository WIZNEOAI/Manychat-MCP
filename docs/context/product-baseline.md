# Product Baseline

## Objective

Turn this repository into a modern CLI for operating ManyChat through the Account Public API.

The CLI is the primary product.
The MCP server is a compatibility adapter.

## Why API Key first

The official ManyChat Account Public API can be used with an API key generated from the ManyChat UI. For this repository, that is the shortest, clearest, and most automatable path.

Official sources:
- Token generation and parameter discovery: https://help.manychat.com/hc/en-us/articles/14959510331420-How-to-generate-a-token-for-the-Manychat-API-and-where-to-get-parameters
- App-based API access for distributed integrations: https://help.manychat.com/hc/en-us/articles/14281269835548-Dev-Program-Obtaining-API-Access-through-Apps

## Product boundaries

Supported in v1:
- API-key-based access to ManyChat account endpoints
- Structured JSON output
- Read and mutation workflows for subscribers, tags, fields, flows, and sending
- Optional MCP compatibility mode

Not primary in v1:
- OAuth-first multi-user product behavior
- Redis-backed token lifecycle as a core feature
- Native ManyChat app marketplace distribution

## Repository shape

Preferred architecture:
1. `src/core/` contains the typed ManyChat client and reusable runtime logic.
2. `src/cli/` owns argument parsing, command dispatch, and output contracts.
3. `src/mcp/` contains the compatibility entrypoint for legacy MCP serving.

## Success criteria

A new engineer or agent should be able to answer, from repo docs alone:
- What auth model the CLI uses
- Which commands exist
- What output format is stable
- What policy and rate-limit constraints matter
- When MCP is still relevant and when it is not
