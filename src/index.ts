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
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
    path: path.resolve(__dirname, "../.env"),
});

// Define schemas for Kaito Yaps API requests
const GetYapsScoreArgumentsSchema = z.object({
    user_id: z.string().optional(),
    username: z.string().optional(),
}).refine(data => data.user_id || data.username, {
    message: "Either user_id or username must be provided",
});

// Define the response structure based on the API documentation
interface YapsResponse {
    user_id: string;
    username: string;
    yaps_all: number;
    yaps_l24h: number;
    yaps_l48h: number;
    yaps_l7d: number;
    yaps_l30d: number;
    yaps_l3m: number;
    yaps_l6m: number;
    yaps_l12m: number;
}

const server = new Server(
    {
        name: "kaito-yaps",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Set up the list tools handler to provide info about the Kaito Yaps tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get-yaps-score",
                description: "Get Yaps score for a Twitter/X user by user_id or username",
                inputSchema: {
                    type: "object",
                    properties: {
                        user_id: {
                            type: "string",
                            description: "The X (Twitter) account numeric ID (e.g., \"295218901\").",
                        },
                        username: {
                            type: "string",
                            description: "The X (Twitter) account username/handle without the @ symbol (e.g., \"VitalikButerin\").",
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
        if (name === "get-yaps-score") {
            // Parse and validate the request arguments
            const { user_id, username } = GetYapsScoreArgumentsSchema.parse(args);
            
            // Build query parameters
            const params: Record<string, string> = {};
            if (user_id) params.user_id = user_id;
            if (username) params.username = username;
            
            // Call the Kaito Yaps API
            const response = await axios.get<YapsResponse>('https://api.kaito.ai/api/v1/yaps', { params });
            
            // Return the response data in a formatted way
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(response.data, null, 2),
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
        
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || error.message;
            const errorCode = error.response?.data?.error_code || "unknown";
            throw new Error(`Kaito Yaps API error: [${errorCode}] ${message}`);
        }
        
        throw error;
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Kaito Yaps MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
