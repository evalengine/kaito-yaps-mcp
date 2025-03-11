# Kaito Yaps MCP

This tool enables Claude AI to interact with the Kaito Yaps API for retrieving tokenized attention scores for Twitter/X users.

Introduction on MCP: https://modelcontextprotocol.io/quickstart

## What is Kaito Yaps?

Yaps serve as a public good for recognizing, rewarding, and tracking attention. They allow any builder to access and build on top of tokenized attention permissionlessly. The Yaps API provides data about user attention scores on X (formerly Twitter).

## Setting up Claude

1. Clone this repo
2. Install dependencies and build

```sh
npm i
npm run build
```

3. Setup Claude's Desktop App (mac setup)

```sh
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

```json
{
    "mcpServers": {
        "kaito-yaps": {
            "command": "node",
            "args": [
                "/PATH_TO_FOLDER/kaito-yaps-mcp/build/index.js"
            ]
        }
    }
}
```

4. Restart Claude Desktop App

## Using the MCP Tool

Once set up, you can ask Claude to retrieve Yaps scores for X users:

- "Get the Yaps score for @VitalikButerin"
- "Check the tokenized attention score for user ID 295218901"

The API returns various time-based metrics:
- `yaps_all`: Total all-time Yaps score
- `yaps_l24h`: Yaps in the last 24 hours
- `yaps_l7d`: Yaps in the last 7 days
- `yaps_l30d`: Yaps in the last 30 days
- And more time periods (48h, 3m, 6m, 12m)

## API Rate Limits

The default rate limit is 100 calls every 5 minutes. For additional needs, contact Kaito AI.

## More Information

For more information about Yaps, including onchain data availability powered by EAS on Base, visit the Kaito AI website.

## Setting up Cursor

WIP 