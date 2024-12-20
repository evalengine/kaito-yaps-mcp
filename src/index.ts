import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { setupGoatAI } from "./tools/goat.js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

const SendChrArgumentsSchema = z.object({
    instruction: z.string(),
});

const server = new Server(
    {
        name: "weather",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "send-chr",
                description: "Send $CHR to an address",
                inputSchema: {
                    type: "object",
                    properties: {
                        instruction: {
                            type: "string",
                            description: "The instruction to send to the CHR (e.g. 'send 100 $CHR to <address')",
                        },
                    },
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "send-chr") {
            const { instruction } = SendChrArgumentsSchema.parse(args);

            const tools = await setupGoatAI();
            const result = await generateText({
                model: openai("gpt-4o-mini"),
                tools,
                maxSteps: 3,
                prompt: instruction,
              });

            return {
                content: [
                    {
                        type: "text",
                        text: result.text,
                    },
                ],
            };
        } else {
            throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(
                `Invalid arguments: ${error.errors
                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                    .join(", ")}`
            );
        }
        throw error;
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
