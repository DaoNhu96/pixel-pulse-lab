import readline from "node:readline";

const SERVER_NAME = "Google Analytics GA4 MCP";
const SERVER_VERSION = "0.1.0";
const TOOL_TRACK = "track_ga4_event";
const TOOL_VALIDATE = "validate_ga4_config";
const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const JsonRpcError = {
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function getConfig() {
  return {
    measurementId: process.env.GA4_MEASUREMENT_ID?.trim() ?? "",
    apiSecret: process.env.GA4_API_SECRET?.trim() ?? "",
    defaultClientId: process.env.GA4_CLIENT_ID?.trim() ?? "",
  };
}

function requireConfig() {
  const config = getConfig();
  if (!config.measurementId) {
    throw new Error("Missing GA4_MEASUREMENT_ID environment variable.");
  }
  if (!config.apiSecret) {
    throw new Error("Missing GA4_API_SECRET environment variable.");
  }
  return config;
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function coerceParams(value) {
  if (value === undefined) {
    return {};
  }
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error("params must be a JSON object when provided.");
  }
  return value;
}

function buildPayload(argumentsObject) {
  const config = requireConfig();
  const eventName = requireNonEmptyString(argumentsObject.eventName, "eventName");
  const params = coerceParams(argumentsObject.params);
  const clientId =
    typeof argumentsObject.clientId === "string" && argumentsObject.clientId.trim().length > 0
      ? argumentsObject.clientId.trim()
      : config.defaultClientId || "codex-local.1";

  const payload = {
    client_id: clientId,
    events: [
      {
        name: eventName,
        params,
      },
    ],
  };

  if (
    typeof argumentsObject.userId === "string" &&
    argumentsObject.userId.trim().length > 0
  ) {
    payload.user_id = argumentsObject.userId.trim();
  }

  return { config, payload, eventName, clientId };
}

async function validateOnly() {
  const config = requireConfig();
  return {
    measurementIdConfigured: true,
    apiSecretConfigured: true,
    defaultClientId: config.defaultClientId || null,
  };
}

async function sendEvent(argumentsObject) {
  const { config, payload, eventName, clientId } = buildPayload(argumentsObject);
  const url = new URL(GA4_ENDPOINT);
  url.searchParams.set("measurement_id", config.measurementId);
  url.searchParams.set("api_secret", config.apiSecret);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GA4 request failed with ${response.status}: ${errorBody}`);
  }

  return {
    ok: true,
    eventName,
    clientId,
    measurementId: config.measurementId,
    params: payload.events[0].params,
  };
}

async function handleToolCall(id, params) {
  const name = params?.name;
  const argumentsObject = params?.arguments ?? {};

  if (name === TOOL_VALIDATE) {
    const result = await validateOnly();
    sendResult(id, {
      content: [
        {
          type: "text",
          text: `GA4 config looks usable. Measurement ID is configured and API secret is present. Default client ID: ${result.defaultClientId ?? "not set"}.`,
        },
      ],
      structuredContent: result,
    });
    return;
  }

  if (name === TOOL_TRACK) {
    const result = await sendEvent(argumentsObject);
    sendResult(id, {
      content: [
        {
          type: "text",
          text: `Sent GA4 event ${result.eventName} with client ID ${result.clientId}. Check Realtime in Google Analytics.`,
        },
      ],
      structuredContent: result,
    });
    return;
  }

  sendError(id, JsonRpcError.INVALID_PARAMS, `Unknown tool: ${name ?? ""}`);
}

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    sendResult(id, {
      protocolVersion: params?.protocolVersion ?? "2025-11-25",
      capabilities: { tools: {} },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      instructions:
        "Use validate_ga4_config first to confirm environment variables are set. Use track_ga4_event to send a GA4 Measurement Protocol event into Realtime reports.",
    });
    return;
  }

  if (method === "ping") {
    sendResult(id, {});
    return;
  }

  if (method === "tools/list") {
    sendResult(id, {
      tools: [
        {
          name: TOOL_VALIDATE,
          title: "Validate GA4 Config",
          description:
            "Confirm the MCP server has the environment variables required to send GA4 Measurement Protocol events.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
          },
        },
        {
          name: TOOL_TRACK,
          title: "Track GA4 Event",
          description:
            "Send a single Google Analytics 4 event using Measurement Protocol. Use this for testing Realtime events or lightweight server-side event tracking.",
          inputSchema: {
            type: "object",
            properties: {
              eventName: {
                type: "string",
                description: "GA4 event name, such as cta_click or signup_submit.",
              },
              clientId: {
                type: "string",
                description:
                  "Optional GA4 client_id. Falls back to GA4_CLIENT_ID or codex-local.1.",
              },
              userId: {
                type: "string",
                description: "Optional GA4 user_id.",
              },
              params: {
                type: "object",
                description: "Optional GA4 event parameters as a JSON object.",
                additionalProperties: true,
              },
            },
            required: ["eventName"],
            additionalProperties: false,
          },
          annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: true,
          },
        },
      ],
    });
    return;
  }

  if (method === "tools/call") {
    try {
      await handleToolCall(id, params);
    } catch (error) {
      sendError(
        id,
        JsonRpcError.INVALID_PARAMS,
        error instanceof Error ? error.message : String(error),
      );
    }
    return;
  }

  if (id !== undefined) {
    sendError(id, JsonRpcError.METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

const lines = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

lines.on("line", (line) => {
  if (!line.trim()) {
    return;
  }

  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  void handleRequest(message);
});
