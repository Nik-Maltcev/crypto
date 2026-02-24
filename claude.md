### Install Claude SDK - Go

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic Go SDK using go get command. Supports context-based cancellation and functional options pattern.

```bash
go get github.com/anthropics/anthropic-sdk-go
```

--------------------------------

### Quick Start: Create a Message with Anthropic Java SDK

Source: https://platform.claude.com/docs/en/api/sdks/java

This example demonstrates how to quickly set up the Anthropic Java client and send a message. It configures the client using an environment variable and constructs a message creation request using a builder pattern.

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

// Configures using the `ANTHROPIC_API_KEY` environment variable
AnthropicClient client = AnthropicOkHttpClient.fromEnv();

MessageCreateParams params = MessageCreateParams.builder()
  .maxTokens(1024L)
  .addUserMessage("Hello, Claude")
  .model(Model.CLAUDE_OPUS_4_6)
  .build();

Message message = client.messages().create(params);
```

--------------------------------

### Pin Anthropic Go SDK Version using go get

Source: https://platform.claude.com/docs/en/api/sdks/go

This command shows how to install a specific version of the Anthropic Go SDK using `go get`, ensuring consistent dependency management in a project. It's useful for maintaining stable builds and avoiding breaking changes from newer versions.

```bash
go get -u 'github.com/anthropics/anthropic-sdk-go@v1.19.0'
```

--------------------------------

### Install Claude SDK - Python

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic Python SDK using pip package manager. This is the recommended way to get started with Claude in Python projects.

```bash
pip install anthropic
```

--------------------------------

### Install Claude SDK - C#

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic C# SDK using dotnet CLI. Supports .NET Standard 2.0+ and IChatClient integration.

```bash
dotnet add package Anthropic
```

--------------------------------

### Install Claude SDK - Ruby

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic Ruby SDK using bundler. Includes Sorbet types and streaming helpers.

```bash
bundler add anthropic
```

--------------------------------

### Set a system prompt for Claude with Anthropic Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This Go example demonstrates how to include a system prompt when creating a new message with the Anthropic API. The system prompt, such as 'Be very serious at all times.', guides the model's behavior and persona for the entire conversation, influencing subsequent responses.

```go
message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
	Model:     anthropic.ModelClaudeOpus4_6,
	MaxTokens: 1024,
	System: []anthropic.TextBlockParam{
		{Text: "Be very serious at all times."},
	},
	Messages: messages,
})
```

--------------------------------

### Configure Anthropic Go Client for Amazon Bedrock with Default AWS Config

Source: https://platform.claude.com/docs/en/api/sdks/go

This example shows how to initialize the Anthropic Go client to work with Amazon Bedrock by loading the default AWS configuration. It uses `bedrock.WithLoadDefaultConfig` to integrate with existing AWS CLI configurations for authentication and region settings, simplifying setup for Bedrock access.

```go
package main

import (
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/bedrock"
)

func main() {
	client := anthropic.NewClient(
		bedrock.WithLoadDefaultConfig(context.Background()),
	)
}
```

--------------------------------

### Tool Use Workflow Example

Source: https://platform.claude.com/docs/en/api/typescript/beta/messages/create

Complete example demonstrating the full workflow of defining a tool, receiving a tool_use block from Claude, executing the tool, and returning results.

```APIDOC
## Complete Tool Use Workflow

### Description
End-to-end example showing how to define a tool, handle Claude's tool invocation, execute the tool, and return results.

### Step 1: Define the Tool
```json
[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
```

### Step 2: Claude Produces Tool Use Block
When asked "What's the S&P 500 at today?", Claude responds with:
```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": {
      "ticker": "^GSPC"
    }
  }
]
```

### Step 3: Execute Tool and Return Result
Execute the tool with input {"ticker": "^GSPC"} and send back:
```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```

### Key Points
- Tool definitions include name, description, and input_schema
- Claude produces tool_use blocks with unique IDs when invoking tools
- Return tool_result blocks with matching tool_use_id
- Tools can be used for client-side functions or to structure model output
```

--------------------------------

### Model Output Continuation Example

Source: https://platform.claude.com/docs/en/api/beta/messages/batches/results

Example demonstrating how the model continues from an assistant turn in the input messages. When input messages end with an assistant role, the response content continues directly from that turn, allowing constraint of model output.

```json
{
  "input_messages": [
    {
      "role": "user",
      "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
    },
    {
      "role": "assistant",
      "content": "The best answer is ("
    }
  ],
  "response_content": [
    {
      "type": "text",
      "text": "B)"
    }
  ]
}
```

--------------------------------

### Claude API Tool Use Workflow Example (JSON)

Source: https://platform.claude.com/docs/en/api/messages/batches/create

This example demonstrates a complete tool use workflow with the Claude API, including defining a client tool, the model's `tool_use` output, and returning the `tool_result` back to the model. It showcases how to integrate external functionality into the model's reasoning process.

```json
[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
```

```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
```

```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```

--------------------------------

### Example: Model Continuing Assistant Turn in Message Content (JSON)

Source: https://platform.claude.com/docs/en/api/messages

This example demonstrates how the model's `content` output directly continues from an `assistant` turn in the input `messages`. The first JSON block shows an input `messages` array ending with an incomplete assistant response, and the second JSON block shows the model's `content` output completing that response.

```json
[\n  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},\n  {"role": "assistant", "content": "The best answer is ("}\n]
```

```json
[{"type": "text", "text": "B)"}]
```

--------------------------------

### Configure Anthropic Java Client API Key

Source: https://platform.claude.com/docs/en/api/sdks/java

These examples show various ways to configure the Anthropic Java client, including automatic configuration from environment variables or system properties, manual API key setting, and combining both approaches for flexible setup. The client manages connection and thread pools efficiently.

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

// Configures using the `anthropic.apiKey`, `anthropic.authToken` and `anthropic.baseUrl` system properties
// Or configures using the `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_BASE_URL` environment variables
AnthropicClient client = AnthropicOkHttpClient.fromEnv();
```

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
  .apiKey("my-anthropic-api-key")
  .build();
```

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
  // Configures using system properties or environment variables
  .fromEnv()
  .apiKey("my-anthropic-api-key")
  .build();
```

--------------------------------

### Tool Use Examples (Request/Response)

Source: https://platform.claude.com/docs/en/api/java/messages

Illustrates how to define tools with an example JSON schema, and shows how the model might generate `tool_use` blocks and how to respond with `tool_result` blocks.

```APIDOC
## Tool Use Examples (Request/Response)

### Description
These examples demonstrate how to define a tool and the typical interaction flow where Claude generates a `tool_use` block, and how you would respond with a `tool_result` block after executing the tool.

### Tool Definition Example
```json
[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
```

### Model `tool_use` Output Example
```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
```

### User `tool_result` Input Example
```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```
```

--------------------------------

### Install Claude SDK - TypeScript

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic TypeScript SDK using npm. Supports Node.js, Deno, Bun, and browser environments.

```bash
npm install @anthropic-ai/sdk
```

--------------------------------

### Tool Use Request Example

Source: https://platform.claude.com/docs/en/api/typescript/messages/batches/create

Example of defining a stock price tool and the model's tool use response when asked about stock prices.

```APIDOC
## Tool Use Request and Response

### Description
Example workflow showing tool definition, model request, and tool use response.

### Tool Definition Example
```json
{
  "name": "get_stock_price",
  "description": "Get the current stock price for a given ticker symbol",
  "input_schema": {
    "type": "object",
    "properties": {
      "ticker": {
        "type": "string",
        "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
      }
    },
    "required": ["ticker"]
  }
}
```

### User Query
"What's the S&P 500 at today?"

### Model Tool Use Response
```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": {
      "ticker": "^GSPC"
    }
  }
]
```

### Tool Result Response
Return the tool result back to the model in a subsequent user message:
```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```
```

--------------------------------

### Install Claude SDK - Java

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic Java SDK using Gradle or Maven build tools. Provides builder pattern and CompletableFuture async support.

```groovy
implementation("com.anthropic:anthropic-java:2.11.1")
```

```xml
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java</artifactId>
    <version>2.11.1</version>
</dependency>
```

--------------------------------

### Install Claude SDK - PHP

Source: https://platform.claude.com/docs/en/api/client-sdks

Install the Anthropic PHP SDK using Composer package manager. Provides value objects and builder pattern interfaces.

```bash
composer require anthropic-ai/sdk
```

--------------------------------

### System Prompts

Source: https://platform.claude.com/docs/en/api/sdks/go

Configures system-level instructions that guide Claude's behavior throughout the conversation. System prompts provide context and behavioral guidelines that apply to all responses.

```APIDOC
## POST /messages - With System Prompt

### Description
Sends a message with system-level instructions that guide Claude's behavior and response style throughout the conversation.

### Method
POST

### Endpoint
/messages

### Parameters
#### Request Body
- **model** (string) - Required - The model identifier
- **messages** (array) - Required - Array of message objects
- **max_tokens** (integer) - Required - Maximum tokens to generate
- **system** (array) - Optional - System prompt instructions as text blocks

### Request Example
```go
message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
  Model:     anthropic.ModelClaudeOpus4_6,
  MaxTokens: 1024,
  System: []anthropic.TextBlockParam{
    {Text: "Be very serious at all times."},
  },
  Messages: messages,
})
```

### Response
#### Success Response (200)
- **content** (array) - Response content blocks
- **model** (string) - Model identifier

#### Response Example
Response follows the same format as standard message responses with system prompt instructions applied.
```

--------------------------------

### Create a Message with Anthropic Java Client

Source: https://platform.claude.com/docs/en/api/java/messages/create

This Java example demonstrates how to initialize the Anthropic client and begin constructing a `MessageCreateParams` object for sending messages to the Anthropic API. It shows the basic setup for setting `maxTokens` for a message.

```java
package com.anthropic.example;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        MessageCreateParams params = MessageCreateParams.builder()
            .maxTokens(1024L)
```

--------------------------------

### Configure Anthropic Go Client with Global and Per-Request Options

Source: https://platform.claude.com/docs/en/api/sdks/go

This example demonstrates how to initialize an Anthropic Go client with global request options, such as adding a custom header. It also shows how to override these options for individual requests and add undocumented JSON fields using `option.WithJSONSet` for fine-grained control over the request body.

```go
client := anthropic.NewClient(
	// Adds a header to every request made by the client
	option.WithHeader("X-Some-Header", "custom_header_info"),
)

client.Messages.New(context.TODO(), // ...,
	// Override the header
	option.WithHeader("X-Some-Header", "some_other_custom_header_info"),
	// Add an undocumented field to the request body, using sjson syntax
	option.WithJSONSet("some.json.path", map[string]string{"my": "object"}),
)
```

--------------------------------

### Example Constrained Model Output

Source: https://platform.claude.com/docs/en/api/java/beta/messages/create

Shows how to use assistant message turns to constrain model output by providing a partial assistant response that the model continues from, useful for guiding output format.

```json
{
  "messages": [
    {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
    {"role": "assistant", "content": "The best answer is ("}
  ]
}

// Response content:
[{"type": "text", "text": "B)"}]
```

--------------------------------

### Install Anthropic PHP SDK using Composer

Source: https://platform.claude.com/docs/en/api/sdks/php

This command installs the Anthropic PHP SDK into your project using Composer, the dependency manager for PHP. It adds the `anthropic-ai/sdk` package to your `composer.json` and downloads its dependencies.

```bash
composer require "anthropic-ai/sdk"
```

--------------------------------

### Raw Message Start Event

Source: https://platform.claude.com/docs/en/api/messages

Defines the structure of a Raw Message Start Event, which includes a message object with content blocks and various citation types.

```APIDOC
## Raw Message Start Event

### Description
This event object represents the start of a raw message, containing the message's unique identifier and its content, which is composed of various content blocks.

### Object Definition
`RawMessageStartEvent = object { message, type }`

### Properties
- **message** (Message) - The message object containing the content generated by the model.
- **type** (string) - The type of the event.

### Nested Objects

#### Message
`Message = object { id, content }`
- **id** (string) - Unique object identifier. The format and length of IDs may change over time.
- **content** (array of ContentBlock) - Content generated by the model. This is an array of content blocks, each of which has a `type` that determines its shape.

##### ContentBlock Types

###### TextBlock
`TextBlock = object { citations, text, type }`
- **citations** (array of TextCitation) - Citations supporting the text block.
- **text** (string)
- **type** (string) - `"text"`

###### ThinkingBlock
`ThinkingBlock = object { signature, thinking, type }`
- **signature** (string)
- **thinking** (string)
- **type** (string) - `"thinking"`

###### RedactedThinkingBlock
`RedactedThinkingBlock = object { data, type }`
- **data** (string)
- **type** (string) - `"redacted_thinking"`

###### ToolUseBlock
`ToolUseBlock = object { id, input, name, type }`
- **id** (string)
- **input** (map[unknown])
- **name** (string)
- **type** (string) - `"tool_use"`

###### ServerToolUseBlock
`ServerToolUseBlock = object { id, input, name, type }`
- **id** (string)
- **input** (map[unknown])
- **name** (string) - `"web_search"`
- **type** (string) - `"server_tool_use"`

###### WebSearchToolResultBlock
`WebSearchToolResultBlock = object { content, tool_use_id, type }`
- **content** (WebSearchToolResultBlockContent) - Can be `WebSearchToolResultError` or `array of WebSearchResultBlock`.
- **tool_use_id** (string)
- **type** (string)

####### WebSearchToolResultError
`WebSearchToolResultError = object { error_code, type }`
- **error_code** (string) - Possible values: `"invalid_tool_input"`, `"unavailable"`, `"max_uses_exceeded"`, `"too_many_requests"`, `"query_too_long"`, `"request_too_large"`.
- **type** (string) - `"web_search_tool_result_error"`

##### Citation Types (within TextBlock)

###### CitationCharLocation
`CitationCharLocation = object { cited_text, document_index, document_title, end_char_index, file_id, start_char_index, type }`
- **cited_text** (string)
- **document_index** (number)
- **document_title** (string)
- **end_char_index** (number)
- **file_id** (string)
- **start_char_index** (number)
- **type** (string) - `"char_location"`

###### CitationPageLocation
`CitationPageLocation = object { cited_text, document_index, document_title, end_page_number, file_id, start_page_number, type }`
- **cited_text** (string)
- **document_index** (number)
- **document_title** (string)
- **end_page_number** (number)
- **file_id** (string)
- **start_page_number** (number)
- **type** (string) - `"page_location"`

###### CitationContentBlockLocation
`CitationContentBlockLocation = object { cited_text, document_index, document_title, end_block_index, file_id, start_block_index, type }`
- **cited_text** (string)
- **document_index** (number)
- **document_title** (string)
- **end_block_index** (number)
- **file_id** (string)
- **start_block_index** (number)
- **type** (string) - `"content_block_location"`

###### CitationsWebSearchResultLocation
`CitationsWebSearchResultLocation = object { cited_text, encrypted_index, title, type, url }`
- **cited_text** (string)
- **encrypted_index** (string)
- **title** (string)
- **type** (string) - `"web_search_result_location"`
- **url** (string)

###### CitationsSearchResultLocation
`CitationsSearchResultLocation = object { cited_text, end_block_index, search_result_index, source, start_block_index, title, type }`
- **cited_text** (string)
- **end_block_index** (number)
- **search_result_index** (number)
- **source** (string)
- **start_block_index** (number)
- **title** (string)
- **type** (string) - `"search_result_location"`

### Example for `Message.content` field
```json
[{"type": "text", "text": "Hi, I'm Claude."}]
```

### Example for `Message.content` field (continuation)
```json
[{"type": "text", "text": "B)"}]
```
```

--------------------------------

### Computer Use Tool Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/count_tokens

Configure the computer use tool for controlling display and input interactions. Supports multiple versions with display dimensions and optional input examples.

```APIDOC
## Computer Use Tool (BetaToolComputerUse20241022 / BetaToolComputerUse20250124)

### Description
Configures a computer use tool that enables interaction with display systems. Supports display configuration, caller restrictions, and cache control settings.

### Tool Properties

#### Required Fields
- **display_height_px** (number) - Required - The height of the display in pixels
- **display_width_px** (number) - Required - The width of the display in pixels
- **name** (string) - Required - Must be set to `"computer"`
- **type** (string) - Required - Must be `"computer_20241022"` or `"computer_20250124"`

#### Optional Fields
- **allowed_callers** (array) - Optional - Specifies who can call this tool
  - Allowed values: `"direct"`, `"code_execution_20250825"`

- **cache_control** (BetaCacheControlEphemeral) - Optional - Creates a cache control breakpoint
  - **type** (string) - Must be `"ephemeral"`
  - **ttl** (string) - Time-to-live for cache breakpoint
    - Allowed values: `"5m"` (5 minutes), `"1h"` (1 hour)
    - Defaults to `"5m"`

- **defer_loading** (boolean) - Optional - If true, tool is not included in initial system prompt

- **display_number** (number) - Optional - The X11 display number (e.g., 0, 1)

- **input_examples** (array) - Optional - Array of example inputs for the tool

- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs

### Configuration Example
```json
{
  "display_height_px": 1080,
  "display_width_px": 1920,
  "name": "computer",
  "type": "computer_20241022",
  "allowed_callers": ["direct"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "5m"
  },
  "defer_loading": false,
  "display_number": 0,
  "strict": true
}
```
```

--------------------------------

### Example: Constraining Model Output with Assistant Turn

Source: https://platform.claude.com/docs/en/api/csharp/messages/batches/results

These JSON snippets demonstrate how to guide the model's response by ending the input `messages` with an `assistant` turn. The first snippet shows the input `messages` array, and the second shows the corresponding constrained `content` output from the model.

```json
[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]
```

```json
[{"type": "text", "text": "B)"}]
```

--------------------------------

### Create a new message with Anthropic Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This Go example demonstrates how to initialize the Anthropic client with an API key and send a single user message to the Claude API using `anthropic.ModelClaudeOpus4_6`. It covers setting the maximum tokens and printing the model's response to a simple query.

```go
package main

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

func main() {
	client := anthropic.NewClient(
		option.WithAPIKey("my-anthropic-api-key"), // defaults to os.LookupEnv("ANTHROPIC_API_KEY")
	)
	message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock("What is a quaternion?")),
		},
		Model: anthropic.ModelClaudeOpus4_6,
	})
	if err != nil {
		panic(err.Error())
	}
	fmt.Printf("%+v\n", message.Content)
}
```

--------------------------------

### Install Anthropic Python SDK

Source: https://platform.claude.com/docs/en/api/sdks/python

Install the base Anthropic Python SDK package using pip. Optional extras are available for AWS Bedrock, Google Vertex AI, and improved async performance with aiohttp.

```bash
pip install anthropic
```

```bash
# For AWS Bedrock support
pip install anthropic[bedrock]

# For Google Vertex AI support
pip install anthropic[vertex]

# For improved async performance with aiohttp
pip install anthropic[aiohttp]
```

--------------------------------

### Implement IChatClient with AnthropicClient and MCP Tools

Source: https://platform.claude.com/docs/en/api/sdks/csharp

Demonstrates how to configure AnthropicClient as an IChatClient from Microsoft.Extensions.AI.Abstractions and integrate it with ModelContextProtocol (MCP) tools. The example shows creating a chat client with function invocation capabilities and using MCP tools from a learning server endpoint. Requires ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, and ANTHROPIC_BASE_URL environment variables.

```csharp
using Anthropic;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;

// Configured using the ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL environment variables
IChatClient chatClient = client.AsIChatClient("claude-opus-4-6")
    .AsBuilder()
    .UseFunctionInvocation()
    .Build();

// Using McpClient from the MCP C# SDK
McpClient learningServer = await McpClient.CreateAsync(
    new HttpClientTransport(new() { Endpoint = new("https://learn.microsoft.com/api/mcp") }));

ChatOptions options = new() { Tools = [.. await learningServer.ListToolsAsync()] };

Console.WriteLine(await chatClient.GetResponseAsync("Tell me about IChatClient", options));
```

--------------------------------

### Define Beta Content Block Array with Text Example

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Defines the content array structure containing content blocks generated by the model. Each block has a type property determining its shape. Includes example of text content block and demonstrates how assistant turn continuations work in responses.

```json
{
  "content": [
    {
      "type": "text",
      "text": "Hi, I'm Claude."
    }
  ]
}
```

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
    },
    {
      "role": "assistant",
      "content": "The best answer is ("
    }
  ]
}
```

```json
{
  "content": [
    {
      "type": "text",
      "text": "B)"
    }
  ]
}
```

--------------------------------

### Count Tokens in a Message - Java

Source: https://platform.claude.com/docs/en/api/java/messages/count_tokens

Demonstrates how to count tokens for a message using the Anthropic Java client. This example creates a MessageCountTokensParams with a user message and model specification, then calls the countTokens method to get the total token count across messages, system prompt, and tools.

```java
package com.anthropic.example;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.MessageCountTokensParams;
import com.anthropic.models.messages.MessageTokensCount;
import com.anthropic.models.messages.Model;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        MessageCountTokensParams params = MessageCountTokensParams.builder()
            .addUserMessage("Hello, world")
            .model(Model.CLAUDE_OPUS_4_6)
            .build();
        MessageTokensCount messageTokensCount = client.messages().countTokens(params);
    }
}
```

--------------------------------

### Initialize Anthropic Client with API Key for Bedrock in Java

Source: https://platform.claude.com/docs/en/api/sdks/java

This Java example demonstrates how to configure the `AnthropicClient` to use an API key for authorization with the Bedrock backend, as an alternative to AWS credentials. The API key is passed directly to the `BedrockBackend` builder, along with the desired AWS region.

```java
AnthropicClient client = AnthropicOkHttpClient.builder()
  .backend(BedrockBackend.builder().apiKey(myApiKey).region(Region.US_EAST_1).build())
  .build();
```

--------------------------------

### Message Content Continuation Example

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/batches

Example demonstrating how the model continues from an assistant turn in the input messages, allowing constraint of model output through partial assistant content.

```APIDOC
## Message Content Continuation

### Description
If the request input `messages` ended with an `assistant` turn, the response `content` will continue directly from that last turn. This allows constraining the model's output.

### Request Example
```json
[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]
```

### Response Example
```json
[
  {"type": "text", "text": "B)"}
]
```

### Usage
This pattern is useful for:
- Constraining model output format
- Continuing from a specific point in reasoning
- Guiding the model toward specific response structures
- Implementing multi-turn conversations with controlled continuations
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/overview

Retrieve information about custom agent skills. This beta API allows for listing or getting details of previously created skills.

```APIDOC
## GET /v1/skills

### Description
Retrieve information about custom agent skills.

### Method
GET

### Endpoint
/v1/skills

### Parameters
#### Path Parameters
(None detailed in the provided text, but could include a skill ID for specific skill retrieval)

#### Query Parameters
(None detailed in the provided text)

#### Request Body
(Not applicable for GET requests)

### Request Example
(No request body for GET)

### Response
#### Success Response (200)
(Response structure not explicitly detailed in the provided text, but likely includes a list of skill objects or a single skill's details.)

#### Response Example
(Response example not explicitly detailed in the provided text)
```

--------------------------------

### Download File using Go Client Method

Source: https://platform.claude.com/docs/en/api/go/beta/files/download

This Go client method signature demonstrates how to initiate a file download. It requires a context, the file's unique ID, and an optional query object for additional parameters like beta feature flags. The method returns a response object and an error if the operation fails.

```Go
client.Beta.Files.Download(ctx, fileID, query) (*Response, error)
```

--------------------------------

### TOOL DEFIN

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches/create

No description

--------------------------------

### Create a message with Anthropic PHP SDK

Source: https://platform.claude.com/docs/en/api/sdks/php

This PHP example demonstrates how to initialize the Anthropic client and create a new message using the `messages->create` method. It sets the API key, maximum tokens, user message content, and the model to use, then dumps the content of the received message.

```php
<?php

use Anthropic\Client;

$client = new Client(
  apiKey: getenv("ANTHROPIC_API_KEY") ?: "my-anthropic-api-key"
);

$message = $client->messages->create(
  maxTokens: 1024,
  messages: [['role' => 'user', 'content' => 'Hello, Claude']],
  model: 'claude-opus-4-6',
);

var_dump($message->content);
```

--------------------------------

### BetaWebFetchTool20250910 Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/batches/create

Configures the `web_fetch` tool, enabling an AI model to fetch content from specified web pages with domain restrictions, caching, and citation options.

```APIDOC
## Tool: BetaWebFetchTool20250910

### Description
This tool allows an AI model to fetch content from web pages. It includes options for restricting fetches to certain domains, caching fetched content, configuring citations, and limiting the amount of content processed.

### Configuration Parameters
#### Tool Configuration Object
- **name** (string) - Required - The name of the tool, always "web_fetch".
- **type** (string) - Required - The type identifier for the tool, always "web_fetch_20250910".
- **allowed_callers** (array of string) - Optional - Specifies which entities can call this tool. Can be "direct" or "code_execution_20250825".
- **allowed_domains** (array of string) - Optional - List of domains from which fetching is allowed.
- **blocked_domains** (array of string) - Optional - List of domains from which fetching is blocked.
- **cache_control** (object) - Optional - Configuration for caching fetched content.
  - **type** (string) - Required - The type of cache control, always "ephemeral".
  - **ttl** (string) - Optional - The time-to-live for the cache breakpoint. Can be "5m" (5 minutes) or "1h" (1 hour). Defaults to "5m".
- **citations** (object) - Optional - Configuration for citations of fetched documents. Citations are disabled by default.
  - **enabled** (boolean) - Optional - If true, citations will be enabled.
- **defer_loading** (boolean) - Optional - If true, the tool is not included in the initial system prompt and is only loaded when referenced via tool search.
- **max_content_tokens** (number) - Optional - Maximum number of tokens used by including web page text content in the context. This limit is approximate.
- **max_uses** (number) - Optional - The maximum number of times the tool can be used in a single API request.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.

### Request Example
```json
{
  "name": "web_fetch",
  "type": "web_fetch_20250910",
  "allowed_callers": ["code_execution_20250825"],
  "blocked_domains": ["malicious.com"],
  "cache_control": {
    "type": "ephemeral"
  },
  "citations": {
    "enabled": true
  },
  "max_content_tokens": 10000
}
```
```

--------------------------------

### Configure Anthropic C# client manually

Source: https://platform.claude.com/docs/en/api/sdks/csharp

This example demonstrates how to manually configure the Anthropic C# client by directly setting the `ApiKey` property during initialization. This method allows for explicit control over client settings, overriding any environment variables for specific properties.

```csharp
using Anthropic;

AnthropicClient client = new() { ApiKey = "my-anthropic-api-key" };
```

--------------------------------

### Initialize Anthropic Client with Default Bedrock Backend in Java

Source: https://platform.claude.com/docs/en/api/sdks/java

This Java code illustrates how to create an `AnthropicClient` instance configured to use the `BedrockBackend`. The `BedrockBackend.fromEnv()` method automatically resolves AWS credentials and region using the default AWS provider chain, simplifying initial setup.

```java
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
  .backend(BedrockBackend.fromEnv())
  .build();
```

--------------------------------

### Message Start Event

Source: https://platform.claude.com/docs/en/api/go/messages

Defines the message start event type used in streaming responses to indicate the beginning of a message.

```APIDOC
## Message Start Event

### Description
Event type that marks the start of a message in streaming mode.

### Type Definition

- **Type** (string) - Event type identifier
  - `const MessageStartMessageStart MessageStart = "message_start"`

### Notes
- In streaming mode, the stop_reason field is null in this event
- Subsequent events will contain non-null stop_reason values
```

--------------------------------

### Manage conversational turns with Anthropic Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This Go example illustrates how to maintain conversation history by appending previous messages and the model's responses to the message list. It shows how to make multiple API calls to simulate a back-and-forth dialogue with the Claude model, building on the initial message.

```go
messages := []anthropic.MessageParam{
	anthropic.NewUserMessage(anthropic.NewTextBlock("What is my first name?")),
}

message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
	Model:     anthropic.ModelClaudeOpus4_6,
	Messages:  messages,
	MaxTokens: 1024,
})
if err != nil {
	panic(err)
}

fmt.Printf("%+v\n", message.Content)

messages = append(messages, message.ToParam())
messages = append(messages, anthropic.NewUserMessage(
	anthropic.NewTextBlock("My full name is John Doe"),
))

message, err = client.Messages.New(context.TODO(), anthropic.MessageNewParams{
	Model:     anthropic.ModelClaudeOpus4_6,
	Messages:  messages,
	MaxTokens: 1024,
})

fmt.Printf("%+v\n", message.Content)
```

--------------------------------

### Define and Execute Tools with Anthropic Ruby SDK

Source: https://platform.claude.com/docs/en/api/sdks/ruby

This example demonstrates how to define a custom tool with a structured input schema using `Anthropic::BaseModel` and `Anthropic::BaseTool`. It then shows how to use `client.beta.messages.tool_runner` to automatically handle the tool execution loop based on user messages and the defined tools, printing the final content.

```ruby
class CalculatorInput < Anthropic::BaseModel
  required :lhs, Float
  required :rhs, Float
  required :operator, Anthropic::InputSchema::EnumOf[:+, :-, :*, :/]
end

class Calculator < Anthropic::BaseTool
  input_schema CalculatorInput

  def call(expr)
    expr.lhs.public_send(expr.operator, expr.rhs)
  end
end

# Automatically handles tool execution loop
client.beta.messages.tool_runner(
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [{role: "user", content: "What's 15 * 7?"}],
  tools: [Calculator.new]
).each_message { puts _1.content }
```

--------------------------------

### Handle Claude Tool Use Response with Tool Result

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Example demonstrating Claude's tool use output and the subsequent tool result response. Shows the tool_use content block with generated input, followed by the tool_result block returning the execution result back to the model.

```json
{
  "tool_use_response": [
    {
      "type": "tool_use",
      "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
      "name": "get_stock_price",
      "input": { "ticker": "^GSPC" }
    }
  ],
  "tool_result_response": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
      "content": "259.75 USD"
    }
  ]
}
```

--------------------------------

### Computer Use Tool Configuration

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches

Configure the BetaToolComputerUse for computer interaction capabilities. Supports display configuration, input examples, cache control, and deferred loading options.

```APIDOC
## BetaToolComputerUse20241022

### Description
Defines a computer use tool that enables Claude models to interact with computer displays and input devices. Includes display configuration and optional cache control settings.

### Tool Properties

#### displayHeightPx
- **Type**: long (required)
- **Description**: The height of the display in pixels

#### displayWidthPx
- **Type**: long (required)
- **Description**: The width of the display in pixels

#### name
- **Type**: JsonValue (constant)
- **Value**: `"computer"`
- **Description**: Name of the tool as called by the model and in `tool_use` blocks

#### type
- **Type**: JsonValue (constant)
- **Value**: `"computer_20241022"`
- **Description**: Tool type identifier

#### allowedCallers
- **Type**: Optional<List<AllowedCaller>>
- **Description**: Specifies which callers can invoke this tool
- **Allowed Values**:
  - `"direct"` - Direct caller
  - `"code_execution_20250825"` - Code execution tool

#### cacheControl
- **Type**: Optional<BetaCacheControlEphemeral>
- **Description**: Creates a cache control breakpoint at this content block
- **Properties**:
  - **type**: `"ephemeral"` (constant)
  - **ttl**: Optional time-to-live value
    - `"5m"` - 5 minutes (default)
    - `"1h"` - 1 hour

#### deferLoading
- **Type**: Optional<Boolean>
- **Default**: false
- **Description**: If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search

#### displayNumber
- **Type**: Optional<Long>
- **Description**: The X11 display number (e.g., 0, 1) for the display

#### inputExamples
- **Type**: Optional<List<InputExample>>
- **Description**: Examples of valid inputs for the computer use tool

#### strict
- **Type**: Optional<Boolean>
- **Default**: false
- **Description**: When true, guarantees schema validation on tool names and inputs
```

--------------------------------

### Define Beta

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

No description

--------------------------------

### Content Block Continuation Example

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Demonstrates how content blocks continue from assistant turns in the message history. When the input messages end with an assistant turn, the response content continues directly from that turn.

```APIDOC
## Content Block Continuation

### Description
When the request input `messages` ends with an `assistant` turn, the response `content` continues directly from that last turn. This allows constraining the model's output by providing a partial assistant response.

### Request Example
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
    },
    {
      "role": "assistant",
      "content": "The best answer is ("
    }
  ]
}
```

### Response Example
```json
{
  "content": [
    {
      "type": "text",
      "text": "B)"
    }
  ]
}
```

### Behavior
The model continues from the incomplete assistant message, completing it with "B)" to form the full response "The best answer is (B)".
```

--------------------------------

### Tool Configuration Overview

Source: https://platform.claude.com/docs/en/api/messages

Documentation for configuring custom tools with cache control, descriptions, and input streaming options. Tools can be customized with TTL settings, detailed descriptions, and schema validation.

```APIDOC
## Tool Configuration

### Description
Defines the base configuration structure for custom tools in the Claude API.

### Parameters

#### Optional Parameters
- **ttl** (string) - Optional - Time-to-live for cache control breakpoint. Valid values: "5m" (5 minutes) or "1h" (1 hour). Defaults to "5m".
- **description** (string) - Optional - Detailed description of what the tool does. More detailed descriptions improve model performance.
- **eager_input_streaming** (boolean) - Optional - Enable eager input streaming for tool parameters. When true, parameters stream incrementally. When false, streaming is disabled. When null (default), uses default behavior based on beta headers.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.
- **type** (string) - Optional - Tool type. Valid value: "custom".

### Cache Control Configuration

#### Cache Control Ephemeral
- **type** (string) - Required - Must be "ephemeral".
- **ttl** (string) - Optional - Time-to-live value. Valid values: "5m" or "1h". Defaults to "5m".
```

--------------------------------

### Computer Use Tool (20241022)

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Enables models to interact with computer displays and input devices. Supports display configuration, cache control, and optional input examples.

```APIDOC
## BetaToolComputerUse20241022

### Description
A tool definition for computer use capabilities, allowing models to interact with display and input systems.

### Tool Properties

#### Required Fields
- **display_height_px** (number) - Required - The height of the display in pixels

- **display_width_px** (number) - Required - The width of the display in pixels

- **name** (string) - Required - Tool identifier
  - Value: `"computer"`
  - This is how the tool will be called by the model and in `tool_use` blocks

- **type** (string) - Required - Tool type identifier
  - Value: `"computer_20241022"`

#### Optional Fields
- **allowed_callers** (array of string) - Optional - Specifies which entities can call this tool
  - Allowed values: `"direct"`, `"code_execution_20250825"`

- **cache_control** (BetaCacheControlEphemeral) - Optional - Cache control configuration
  - **type** (string) - Value: `"ephemeral"`
  - **ttl** (string) - Time-to-live for cache breakpoint
    - Allowed values: `"5m"` (5 minutes), `"1h"` (1 hour)
    - Default: `"5m"`

- **defer_loading** (boolean) - Optional - If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search

- **display_number** (number) - Optional - The X11 display number (e.g. 0, 1) for the display

- **input_examples** (array of map) - Optional - Example inputs for the tool

- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs

### Example Configuration
```json
{
  "name": "computer",
  "type": "computer_20241022",
  "display_width_px": 1920,
  "display_height_px": 1080,
  "display_number": 0,
  "allowed_callers": ["direct"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "5m"
  },
  "defer_loading": false,
  "strict": true
}
```
```

--------------------------------

### Streaming Events - Content Block Start

Source: https://platform.claude.com/docs/en/api/java/messages

Streaming event that signals the beginning of a new content block. Includes the index of the block being started.

```APIDOC
## Content Block Start Event

### Description
Streaming event fired when a new content block begins in the response stream.

### Type
`content_block_start`

### Fields

- **index** (long) - Required - The index of the content block being started
- **type** (JsonValue) - Required - Constant value: `CONTENT_BLOCK_START("content_block_start")`

### Usage
This event is emitted at the beginning of each content block in a streaming response, allowing clients to prepare for incoming content of a specific type.
```

--------------------------------

### Tool: BetaWebFetchTool20250910 Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Defines the configuration parameters for the Beta Web Fetch Tool, used for fetching content from specified web domains with options for caching and citations.

```APIDOC
## Tool: BetaWebFetchTool20250910

### Description
Configuration for the Beta Web Fetch Tool, which allows the model to fetch content from web pages. It includes settings for allowed/blocked domains, caching, and citation generation.

### Parameters
#### Request Body
- **name** (string) - Required - Name of the tool. Must be "web_fetch". This is how the tool will be called by the model and in `tool_use` blocks.
- **type** (string) - Required - Type of the tool. Must be "web_fetch_20250910".
- **allowed_callers** (array of string) - Optional - Specifies which callers are allowed to invoke this tool. Can be "direct" or "code_execution_20250825".
- **allowed_domains** (array of string) - Optional - List of domains to allow fetching from.
- **blocked_domains** (array of string) - Optional - List of domains to block fetching from.
- **cache_control** (object) - Optional - Create a cache control breakpoint at this content block.
  - **type** (string) - Required - Must be "ephemeral".
  - **ttl** (string) - Optional - The time-to-live for the cache control breakpoint. Can be "5m" (5 minutes) or "1h" (1 hour). Defaults to "5m".
- **citations** (object) - Optional - Citations configuration for fetched documents. Citations are disabled by default.
  - **enabled** (boolean) - Optional - If true, citations will be enabled.
- **defer_loading** (boolean) - Optional - If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search.
- **max_content_tokens** (number) - Optional - Maximum number of tokens used by including web page text content in the context. The limit is approximate and does not apply to binary content such as PDFs.
- **max_uses** (number) - Optional - Maximum number of times the tool can be used in the API request.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.

### Request Example
```json
{
  "name": "web_fetch",
  "type": "web_fetch_20250910",
  "allowed_domains": ["news.example.com"],
  "citations": {
    "enabled": true
  },
  "max_content_tokens": 5000
}
```
```

--------------------------------

### Message Content Continuation Example

Source: https://platform.claude.com/docs/en/api/messages

Demonstrates how the model can continue from an assistant turn in the input messages. When the input messages end with an assistant role, the response content continues directly from that turn, allowing you to constrain the model's output.

```APIDOC
## Message Content Continuation

### Description
If the request input `messages` ended with an `assistant` turn, then the response `content` will continue directly from that last turn. This feature allows you to constrain the model's output by providing a partial response to complete.

### Request Example

#### Input Messages
```json
[
  {
    "role": "user",
    "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
  },
  {
    "role": "assistant",
    "content": "The best answer is ("
  }
]
```

### Response Example

#### Output Content
```json
[
  {
    "type": "text",
    "text": "B)"
  }
]
```

### Notes
- The model continues from the exact point where the assistant message ended
- This is useful for constraining output format or guiding the model's response
- The continuation respects the context of the conversation
- The response content directly appends to the partial assistant message
```

--------------------------------

### GET /v1/files/{file_id}

Source: https://platform.claude.com/docs/en/api/python/beta/files/retrieve_metadata

This endpoint retrieves the metadata associated with a specific file. You must provide the unique ID of the file to get its details.

```APIDOC
## GET /v1/files/{file_id}\n\n### Description\nThis endpoint retrieves the metadata associated with a specific file. You must provide the unique ID of the file to get its details.\n\n### Method\nGET\n\n### Endpoint\n/v1/files/{file_id}\n\n### Parameters\n#### Path Parameters\n- **file_id** (str) - Required - ID of the File.\n\n#### Header Parameters\n- **betas** (List[AnthropicBetaParam]) - Optional - Optional header to specify the beta version(s) you want to use. Valid values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".\n\n### Request Example\n{}\n\n### Response\n#### Success Response (200)\n- **id** (str) - Unique object identifier. The format and length of IDs may change over time.\n- **created_at** (datetime) - RFC 3339 datetime string representing when the file was created.\n- **filename** (str) - Original filename of the uploaded file.\n- **mime_type** (str) - MIME type of the file.\n- **size_bytes** (int) - Size of the file in bytes.\n- **type** (Literal["file"]) - Object type. For files, this is always "file".\n- **downloadable** (Optional[bool]) - Whether the file can be downloaded.\n\n#### Response Example\n{\n  "id": "file_abc123",\n  "created_at": "2024-01-01T12:00:00Z",\n  "filename": "example.txt",\n  "mime_type": "text/plain",\n  "size_bytes": 1024,\n  "type": "file",\n  "downloadable": true\n}
```

--------------------------------

### Install Anthropic Vertex SDK

Source: https://platform.claude.com/docs/en/api/sdks/typescript

Install the Anthropic Vertex SDK package for Google Cloud integration. This package provides support for the Anthropic Vertex AI API to use Claude models through Google Cloud Vertex AI.

```bash
npm install @anthropic-ai/vertex-sdk
```

--------------------------------

### Install Anthropic Bedrock SDK

Source: https://platform.claude.com/docs/en/api/sdks/typescript

Install the Anthropic Bedrock SDK package for AWS integration. This package provides support for the Anthropic Bedrock API to use Claude models through Amazon Bedrock.

```bash
npm install @anthropic-ai/bedrock-sdk
```

--------------------------------

### TOOL CONFIGURATION /web_fetch_tool

Source: https://platform.claude.com/docs/en/api/beta/messages/count_tokens

Configure the `web_fetch` tool, allowing models to retrieve content from specified web domains with options for caching, citations, and content limits.

```APIDOC
## TOOL CONFIGURATION /web_fetch_tool

### Description
Configure the `web_fetch` tool, allowing models to retrieve content from specified web domains with options for caching, citations, and content limits.

### Method
TOOL CONFIGURATION

### Endpoint
/web_fetch_tool

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
- **name** (string) - Required - Name of the tool. Must be "web_fetch".
- **type** (string) - Required - The type identifier for the web fetch tool. Must be "web_fetch_20250910".
- **allowed_callers** (array of string) - Optional - List of callers allowed to use this tool. Can be "direct" or "code_execution_20250825".
- **allowed_domains** (array of string) - Optional - List of domains from which fetching is allowed.
- **blocked_domains** (array of string) - Optional - List of domains from which fetching is blocked.
- **cache_control** (object) - Optional - Cache control settings for the tool.
  - **type** (string) - Required - Type of cache control. Must be "ephemeral".
  - **ttl** (string) - Optional - Time-to-live for the cache. Can be "5m" (5 minutes) or "1h" (1 hour). Defaults to "5m".
- **citations** (object) - Optional - Citations configuration.
  - **enabled** (boolean) - Optional - If true, citations are enabled for fetched documents.
- **defer_loading** (boolean) - Optional - If true, the tool is not included in the initial system prompt. Only loaded when returned via tool_reference from tool search.
- **max_content_tokens** (number) - Optional - Maximum number of tokens for web page text content. The limit is approximate and does not apply to binary content such as PDFs.
- **max_uses** (number) - Optional - Maximum number of times the tool can be used in the API request.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.

### Request Example
```json
{
  "name": "web_fetch",
  "type": "web_fetch_20250910",
  "allowed_domains": ["example.com", "anothersite.org"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  },
  "citations": {
    "enabled": true
  },
  "defer_loading": false,
  "max_content_tokens": 10000,
  "max_uses": 5,
  "strict": true
}
```

### Response
#### Success Response (200)
- **status** (string) - Indicates successful configuration.

#### Response Example
```json
{
  "status": "configuration applied"
}
```
```

--------------------------------

### Stream responses from Claude with Anthropic Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This Go example shows how to use the streaming API to receive and process responses from the Claude model incrementally. It iterates through stream events, accumulates the message content, and prints text deltas as they arrive, providing a real-time user experience.

```go
content := "What is a quaternion?"

stream := client.Messages.NewStreaming(context.TODO(), anthropic.MessageNewParams{
	Model:     anthropic.ModelClaudeOpus4_6,
	MaxTokens: 1024,
	Messages: []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(content)),
	},
})

message := anthropic.Message{}
for stream.Next() {
	event := stream.Current()
	err := message.Accumulate(event)
	if err != nil {
		panic(err)
	}

	switch eventVariant := event.AsAny().(type) {
	case anthropic.ContentBlockDeltaEvent:
		switch deltaVariant := eventVariant.Delta.AsAny().(type) {
		case anthropic.TextDelta:
			print(deltaVariant.Text)
		}

	}
}

if stream.Err() != nil {
	panic(stream.Err())
}
```

--------------------------------

### Message Start Event

Source: https://platform.claude.com/docs/en/api/csharp/messages

Represents the start of a message event in the Claude API streaming response. This event type is identified by the constant type value 'message_start'.

```APIDOC
## Message Start Event

### Description
Event fired when a message begins processing in the Claude API.

### Event Type
- **Type**: RawMessageStartEvent
- **Type Constant**: "message_start"

### Fields

#### Type
- **Type**: JsonElement
- **Value**: "message_start" (constant)
- **Description**: Identifies this as a message start event.
```

--------------------------------

### Claude API Prompt Format Example

Source: https://platform.claude.com/docs/en/api/go/completions/create

Demonstrates the required alternating Human and Assistant conversational format for Claude API prompts. Shows how to structure user questions and prepare the prompt for proper response generation by Claude.

```text
"

Human: {userQuestion}

Assistant:"
```

--------------------------------

### Configure proxy for Deno runtime

Source: https://platform.claude.com/docs/en/api/sdks/typescript

Set up a proxy for Deno by creating an HTTP client with proxy configuration using Deno.createHttpClient and passing it to fetchOptions. This enables proxy support for the Anthropic SDK in Deno environments.

```typescript
import Anthropic from "npm:@anthropic-ai/sdk";

const httpClient = Deno.createHttpClient({ proxy: { url: "http://localhost:8888" } });
const client = new Anthropic({
  fetchOptions: {
    client: httpClient
  }
});
```

--------------------------------

### GET /v1/files/{file_id}

Source: https://platform.claude.com/docs/en/api/python/beta/files

Retrieves metadata for a specific file by its ID. This endpoint allows you to get details such as filename, size, MIME type, and creation timestamp for an uploaded file.

```APIDOC
## GET /v1/files/{file_id}

### Description
Retrieves metadata for a specific file by its ID. This endpoint allows you to get details such as filename, size, MIME type, and creation timestamp for an uploaded file.

### Method
GET

### Endpoint
/v1/files/{file_id}

### Parameters
#### Path Parameters
- **file_id** (str) - Required - ID of the File.

#### Header Parameters
- **betas** (Optional[List[AnthropicBetaParam]]) - Optional - Optional header to specify the beta version(s) you want to use. Example values include "message-batches-2024-09-24", "prompt-caching-2024-07-31", etc.

### Request Example
{}

### Response
#### Success Response (200)
- **id** (str) - Unique object identifier.
- **created_at** (datetime) - RFC 3339 datetime string representing when the file was created.
- **filename** (str) - Original filename of the uploaded file.
- **mime_type** (str) - MIME type of the file.
- **size_bytes** (int) - Size of the file in bytes.
- **type** (Literal["file"]) - Object type. For files, this is always "file".
- **downloadable** (Optional[bool]) - Whether the file can be downloaded.

#### Response Example
{
  "id": "file_abc123",
  "created_at": "2024-01-01T12:00:00Z",
  "filename": "document.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 102400,
  "type": "file",
  "downloadable": true
}
```

--------------------------------

### Model Response Content Example

Source: https://platform.claude.com/docs/en/api/typescript/beta/messages/batches

Shows example JSON structures for model-generated content blocks, including simple text responses and continuation of assistant turns from input messages.

```json
[{"type": "text", "text": "Hi, I'm Claude."}]
```

```json
[{"type": "text", "text": "B)"}]
```

--------------------------------

### GET /v1/skills/{skill_id}

Source: https://platform.claude.com/docs/en/api/java/beta/skills

Retrieves the details of a specific skill using its unique identifier. This allows clients to get comprehensive information about a particular skill.

```APIDOC
## GET /v1/skills/{skill_id}

### Description
Retrieves the details of a specific skill using its unique identifier. This allows clients to get comprehensive information about a particular skill.

### Method
GET

### Endpoint
/v1/skills/{skill_id}

### Parameters
#### Path Parameters
- **skill_id** (String) - Required - Unique identifier for the skill. The format and length of IDs may change over time.

#### Query Parameters
- **betas** (List<String>) - Optional - Optional header to specify the beta version(s) you want to use. Example values: `MESSAGE_BATCHES_2024_09_24`, `PROMPT_CACHING_2024_07_31`, `SKILLS_2025_10_02`.

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **id** (String) - Unique identifier for the skill. The format and length of IDs may change over time.
- **createdAt** (String) - ISO 8601 timestamp of when the skill was created.
- **displayTitle** (String) - Optional - Display title for the skill. This is a human-readable label that is not included in the prompt sent to the model.
- **latestVersion** (String) - Optional - The latest version identifier for the skill. This represents the most recent version of the skill that has been created.
- **source** (String) - Source of the skill. May be `"custom"` or `"anthropic"`.
- **type** (String) - Object type. For Skills, this is always `"skill"`.
- **updatedAt** (String) - ISO 8601 timestamp of when the skill was last updated.

#### Response Example
```json
{
  "id": "skill_abc123",
  "createdAt": "2024-01-01T12:00:00Z",
  "displayTitle": "My Custom Skill",
  "latestVersion": "v1.0",
  "source": "custom",
  "type": "skill",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```
```

--------------------------------

### Install Anthropic Ruby SDK via Bundler

Source: https://platform.claude.com/docs/en/api/sdks/ruby

To integrate the Anthropic Ruby SDK into your project, add the specified gem to your application's `Gemfile`. This ensures that the SDK and its dependencies are properly managed and installed by Bundler.

```ruby
gem "anthropic", "~> 1.16.3"
```

--------------------------------

### Example JSON for a user message with string content shorthand

Source: https://platform.claude.com/docs/en/api/beta/messages/batches/create

This JSON object demonstrates the shorthand for defining message `content` as a simple string. This is a convenient way to specify text content and is functionally equivalent to using an array with a single text block.

```json
{"role": "user", "content": "Hello, Claude"}
```

--------------------------------

### System Prompt Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/count_tokens

Set the system prompt for providing context and instructions to Claude. Supports both string and array formats with optional cache control.

```APIDOC
## System Prompt Configuration

### Description
Provides context and instructions to Claude through system prompts. Supports string format or array of text blocks with cache control.

### Parameter
`system: optional string or array of BetaTextBlockParam`

### String Format
```json
{
  "system": "You are a helpful assistant specializing in technical documentation."
}
```

### Array Format with Cache Control
```json
{
  "system": [
    {
      "type": "text",
      "text": "You are a helpful assistant.",
      "cache_control": {
        "type": "ephemeral",
        "ttl": "5m"
      }
    }
  ]
}
```

### Text Block Properties
- **type** (string) - Required - Must be `"text"`
- **text** (string) - Required - The system prompt text
- **cache_control** (BetaCacheControlEphemeral) - Optional - Cache control settings
  - **type** (string) - Required - Must be `"ephemeral"`
  - **ttl** (string) - Optional - Time-to-live: `"5m"` (5 minutes) or `"1h"` (1 hour). Defaults to `"5m"`

### Notes
- See [system prompts guide](https://docs.claude.com/en/docs/system-prompts) for best practices
- Cache control helps optimize repeated requests with the same system prompt
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/python/beta/files

Retrieves a list of uploaded files.

```APIDOC
## GET /v1/files

### Description
Retrieves a list of uploaded files, with optional pagination.

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Path Parameters
- No Path Parameters.

#### Query Parameters
- **after_id** (Optional[str]) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (Optional[str]) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (Optional[int]) - Optional - Number of items to return per page. Defaults to 20. Ranges from 1 to 1000.

#### Header Parameters
- **betas** (Optional[List[str]]) - Optional - Optional header to specify the beta version(s) you want to use.
    - Accepted values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

#### Request Body
- No Request Body.

### Request Example
{
  "after_id": "file_xyz789",
  "limit": 50
}

### Response
#### Success Response (200)
- **data** (List[FileMetadata]) - A list of file metadata objects.
    - **id** (str) - Unique object identifier.
    - **created_at** (datetime) - RFC 3339 datetime string representing when the file was created.
    - **filename** (str) - Original filename of the uploaded file.
    - **mime_type** (str) - MIME type of the file.
    - **size_bytes** (int) - Size of the file in bytes.
    - **type** (Literal["file"]) - Object type. For files, this is always "file".
    - **downloadable** (Optional[bool]) - Whether the file can be downloaded.
- **next_cursor** (Optional[str]) - A cursor for retrieving the next page of results.

#### Response Example
{
  "data": [
    {
      "id": "file_abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 102400,
      "type": "file",
      "downloadable": true
    },
    {
      "id": "file_def456",
      "created_at": "2024-01-02T13:00:00Z",
      "filename": "image.png",
      "mime_type": "image/png",
      "size_bytes": 50000,
      "type": "file",
      "downloadable": false
    }
  ],
  "next_cursor": "file_ghi789"
}
```

--------------------------------

### Example Content Block Response

Source: https://platform.claude.com/docs/en/api/java/messages/batches

Example JSON response showing a text content block returned by the Claude API model. Demonstrates the structure of model-generated content with type field and text content.

```json
[
  {
    "type": "text",
    "text": "Hi, I'm Claude."
  }
]
```

--------------------------------

### Event: Raw Content Block Start

Source: https://platform.claude.com/docs/en/api/csharp/messages

This event signifies the start of a new content block within a stream. It includes the block's type and its specific content.

```APIDOC
## EVENT raw_content_block_start

### Description
This event signifies the start of a new content block within a stream. It includes the block's type and its specific content.

### Method
EVENT

### Endpoint
raw_content_block_start

### Parameters
#### Request Body
- **Index** (Long) - Required - The index of the content block.
- **Type** (string) - Required - Constant value "content_block_start".
- **ContentBlock** (object) - Required - The content block itself. This can be one of the following types:

##### ContentBlock Types
###### TextBlock
- **Type** (string) - Required - Constant value "text".
- **Text** (string) - Required - The text content of the block.
- **Citations** (array of objects, optional) - Optional - Citations supporting the text block. Each citation can be one of the following types:
  - **CitationCharLocation** (object)
    - **Type** (string) - Required - Constant value "char_location".
    - **CitedText** (string) - Required - The text cited.
    - **DocumentIndex** (Long) - Required - The index of the document.
    - **DocumentTitle** (string?) - Optional - The title of the document.
    - **EndCharIndex** (Long) - Required - The ending character index.
    - **FileID** (string?) - Optional - The ID of the file.
    - **StartCharIndex** (Long) - Required - The starting character index.
  - **CitationPageLocation** (object)
    - **Type** (string) - Required - Constant value "page_location".
    - **CitedText** (string) - Required - The text cited.
    - **DocumentIndex** (Long) - Required - The index of the document.
    - **DocumentTitle** (string?) - Optional - The title of the document.
    - **EndPageNumber** (Long) - Required - The ending page number.
    - **FileID** (string?) - Optional - The ID of the file.
    - **StartPageNumber** (Long) - Required - The starting page number.
  - **CitationContentBlockLocation** (object)
    - **Type** (string) - Required - Constant value "content_block_location".
    - **CitedText** (string) - Required - The text cited.
    - **DocumentIndex** (Long) - Required - The index of the document.
    - **DocumentTitle** (string?) - Optional - The title of the document.
    - **EndBlockIndex** (Long) - Required - The ending block index.
    - **FileID** (string?) - Optional - The ID of the file.
    - **StartBlockIndex** (Long) - Required - The starting block index.
  - **CitationsWebSearchResultLocation** (object)
    - **Type** (string) - Required - Constant value "web_search_result_location".
    - **CitedText** (string) - Required - The text cited.
    - **EncryptedIndex** (string) - Required - The encrypted index.
    - **Title** (string?) - Optional - The title of the web search result.
    - **Url** (string) - Required - The URL of the web search result.
  - **CitationsSearchResultLocation** (object)
    - **Type** (string) - Required - Constant value "search_result_location".
    - **CitedText** (string) - Required - The text cited.
    - **EndBlockIndex** (Long) - Required - The ending block index.
    - **SearchResultIndex** (Long) - Required - The index of the search result.
    - **Source** (string) - Required - The source of the search result.
    - **StartBlockIndex** (Long) - Required - The starting block index.
    - **Title** (string?) - Optional - The title of the search result.

###### ThinkingBlock
- **Type** (string) - Required - Constant value "thinking".
- **Signature** (string) - Required - The signature of the thinking block.
- **Thinking** (string) - Required - The content of the thinking block.

###### RedactedThinkingBlock
- **Type** (string) - Required - Constant value "redacted_thinking".
- **Data** (string) - Required - Redacted data.

###### ToolUseBlock
- **Type** (string) - Required - Constant value "tool_use".
- **ID** (string) - Required - The ID of the tool use.
- **Input** (object) - Required - A dictionary of input parameters for the tool (IReadOnlyDictionary<string, JsonElement>).
- **Name** (string) - Required - The name of the tool.

###### ServerToolUseBlock
- **Type** (string) - Required - Constant value "server_tool_use".
- **ID** (string) - Required - The ID of the server tool use.
- **Input** (object) - Required - A dictionary of input parameters for the tool (IReadOnlyDictionary<string, JsonElement>).
- **Name** (string) - Required - Constant value "web_search".

###### WebSearchToolResultBlock
- **Type** (string) - Required - Constant value "web_search_tool_result".
- **ToolUseID** (string) - Required - The ID of the tool use this result corresponds to.
- **Content** (object) - Required - The content of the web search tool result. This can be an error or a list of search results:
  - **WebSearchToolResultError** (object)
    - **Type** (string) - Required - Constant value "web_search_tool_result_error".
    - **ErrorCode** (string) - Required - The error code. Possible values: "invalid_tool_input", "unavailable", "max_uses_exceeded", "too_many_requests", "query_too_long", "request_too_large".
  - **WebSearchResultBlock[]** (array of objects)
    - **Type** (string) - Required - Constant value "web_search_result".
    - **EncryptedContent** (string) - Required - Encrypted content of the search result.
    - **PageAge** (string?) - Optional - Age of the page.
    - **Title** (string) - Required - Title of the search result.
    - **Url** (string) - Required - URL of the search result.

### Request Example
```json
{
  "Index": 0,
  "Type": "content_block_start",
  "ContentBlock": {
    "Type": "text",
    "Text": "Hello, this is a text block.",
    "Citations": [
      {
        "Type": "char_location",
        "CitedText": "text block",
        "DocumentIndex": 0,
        "DocumentTitle": "MyDoc.txt",
        "EndCharIndex": 20,
        "FileID": "file123",
        "StartCharIndex": 10
      }
    ]
  }
}
```

### Response
#### Success Response (200)
The event itself serves as the payload. See Request Body for structure.

#### Response Example
```json
{
  "Index": 0,
  "Type": "content_block_start",
  "ContentBlock": {
    "Type": "text",
    "Text": "Hello, this is a text block.",
    "Citations": [
      {
        "Type": "char_location",
        "CitedText": "text block",
        "DocumentIndex": 0,
        "DocumentTitle": "MyDoc.txt",
        "EndCharIndex": 20,
        "FileID": "file123",
        "StartCharIndex": 10
      }
    ]
  }
}
```
```

--------------------------------

### GET /v1/organizations/invites

Source: https://platform.claude.com/docs/en/api/admin

List all invites for the organization, with optional pagination.

```APIDOC
## GET /v1/organizations/invites

### Description
List Invites

### Method
GET

### Endpoint
/v1/organizations/invites

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **data** (array of Invite) - A list of Invite objects.
  - **id** (string) - ID of the Invite.
  - **email** (string) - Email of the User being invited.
  - **expires_at** (string) - RFC 3339 datetime string indicating when the Invite expires.
  - **invited_at** (string) - RFC 3339 datetime string indicating when the Invite was created.
  - **role** ("user" | "developer" | "billing" | "admin" | "claude_code_user" | "managed") - Organization role of the User.
  - **status** ("accepted" | "expired" | "deleted" | "pending") - Status of the Invite.
  - **type** ("invite") - Object type. For Invites, this is always "invite".
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
```json
{
  "data": [
    {
      "id": "inv_xyz789",
      "email": "user1@example.com",
      "expires_at": "2024-12-31T23:59:59Z",
      "invited_at": "2024-01-01T10:00:00Z",
      "role": "developer",
      "status": "pending",
      "type": "invite"
    },
    {
      "id": "inv_abc456",
      "email": "user2@example.com",
      "expires_at": "2024-11-30T23:59:59Z",
      "invited_at": "2024-01-05T11:00:00Z",
      "role": "user",
      "status": "accepted",
      "type": "invite"
    }
  ],
  "first_id": "inv_xyz789",
  "has_more": true,
  "last_id": "inv_abc456"
}
```
```

--------------------------------

### HTTP GET Endpoint for Retrieving a Skill

Source: https://platform.claude.com/docs/en/api/java/beta/skills

This HTTP GET endpoint defines the API path for retrieving a specific skill. The `skill_id` placeholder should be replaced with the actual unique identifier of the skill.

```http
get /v1/skills/{skill_id}
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/beta/skills/versions

List Skill Versions. This endpoint retrieves a paginated list of all versions associated with a specific skill.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
List Skill Versions. This endpoint retrieves a paginated list of all versions associated with a specific skill.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill.

#### Query Parameters
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **page** (string) - Optional - Optionally set to the `next_page` token from the previous response.

#### Header Parameters
- **"anthropic-beta"** (array of string) - Optional - Optional header to specify the beta version(s) you want to use.

### Response
#### Success Response (200)
- **data** (array of object) - List of skill versions.
  - **id** (string) - Unique identifier for the skill version.
  - **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
  - **description** (string) - Description of the skill version.
  - **directory** (string) - Directory name of the skill version.
  - **name** (string) - Human-readable name of the skill version.
  - **skill_id** (string) - Identifier for the skill that this version belongs to.
  - **type** (string) - Object type. For Skill Versions, this is always "skill_version".
  - **version** (string) - Version identifier for the skill.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **next_page** (string) - Token to provide in as `page` in the subsequent request to retrieve the next page of data.

#### Response Example
{
  "data": [
    {
      "id": "skv_1234567890abcdef",
      "created_at": "2024-01-01T12:00:00Z",
      "description": "Initial version of the skill.",
      "directory": "my-skill-v1",
      "name": "My Awesome Skill",
      "skill_id": "skl_abcdef1234567890",
      "type": "skill_version",
      "version": "1759178010641129"
    },
    {
      "id": "skv_fedcba0987654321",
      "created_at": "2024-02-15T10:30:00Z",
      "description": "Bug fixes and performance improvements.",
      "directory": "my-skill-v2",
      "name": "My Awesome Skill",
      "skill_id": "skl_abcdef1234567890",
      "type": "skill_version",
      "version": "1763210000000000"
    }
  ],
  "has_more": false,
  "next_page": null
}
```

--------------------------------

### GET /v1/models/{model_id}

Source: https://platform.claude.com/docs/en/api/beta/models/retrieve

Retrieves detailed information about a specific model. Use this endpoint to get model metadata, determine model capabilities, or resolve a model alias to its actual model ID.

```APIDOC
## GET /v1/models/{model_id}

### Description
Get a specific model. The Models API response can be used to determine information about a specific model or resolve a model alias to a model ID.

### Method
GET

### Endpoint
`/v1/models/{model_id}`

### Parameters

#### Path Parameters
- **model_id** (string) - Required - Model identifier or alias.

#### Header Parameters
- **anthropic-beta** (optional array of AnthropicBeta) - Optional header to specify the beta version(s) you want to use. Supported values include:
  - `message-batches-2024-09-24`
  - `prompt-caching-2024-07-31`
  - `computer-use-2024-10-22`
  - `computer-use-2025-01-24`
  - `pdfs-2024-09-25`
  - `token-counting-2024-11-01`
  - `token-efficient-tools-2025-02-19`
  - `output-128k-2025-02-19`
  - `files-api-2025-04-14`
  - `mcp-client-2025-04-04`
  - `mcp-client-2025-11-20`
  - `dev-full-thinking-2025-05-14`
  - `interleaved-thinking-2025-05-14`
  - `code-execution-2025-05-22`
  - `extended-cache-ttl-2025-04-11`
  - `context-1m-2025-08-07`
  - `context-management-2025-06-27`
  - `model-context-window-exceeded-2025-08-26`
  - `skills-2025-10-02`
  - `fast-mode-2026-02-01`

### Response

#### Success Response (200)
Returns a `BetaModelInfo` object containing:
- **id** (string) - Unique model identifier.
- **created_at** (string) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
- **display_name** (string) - A human-readable name for the model.
- **type** (string) - Object type. For Models, this is always `"model"`.

#### Response Example
```json
{
  "id": "claude-3-5-sonnet-20241022",
  "created_at": "2024-10-22T00:00:00Z",
  "display_name": "Claude 3.5 Sonnet",
  "type": "model"
}
```
```

--------------------------------

### Streaming Events - Message Start

Source: https://platform.claude.com/docs/en/api/python/messages

Documentation for the message_start streaming event that initiates a streaming message response from the Claude API.

```APIDOC
## Streaming Event: message_start

### Description
The message_start event is the first event in a streaming message response. It contains the initial message object with metadata about the response.

### Event Type
- **type** (Literal["message_start"]) - Required - Event type identifier, always `"message_start"`

### Event Structure
This event includes the complete message object with:
- **role** (Literal["assistant"]) - Always `"assistant"`
- **model** (string) - The Claude model being used
- **type** (Literal["message"]) - Always `"message"`
- **stop_reason** (StopReason) - Optional - Null in streaming mode for message_start
- **usage** (Usage) - Billing and rate-limit usage at stream start

### Event Example
{
  "type": "message_start",
  "message": {
    "type": "message",
    "role": "assistant",
    "model": "claude-opus-4-1-20250805",
    "stop_reason": null,
    "usage": {
      "input_tokens": 1024,
      "output_tokens": 0,
      "cache_creation_input_tokens": 0,
      "cache_read_input_tokens": 0
    }
  }
}
```

--------------------------------

### Implement tool calling with Anthropic Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This comprehensive Go example demonstrates how to enable and handle tool calls with the Anthropic API. It defines a `get_coordinates` tool with a JSON schema, passes it to the model, processes `tool_use` blocks from the model's response, executes the tool (simulated here), and returns the results to the model for further processing in a multi-turn interaction.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/invopop/jsonschema"
)

func main() {
	client := anthropic.NewClient()

	content := "Where is San Francisco?"

	println("[user]: " + content)

	messages := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock(content)),
	}

	toolParams := []anthropic.ToolParam{
		{
			Name:        "get_coordinates",
			Description: anthropic.String("Accepts a place as an address, then returns the latitude and longitude coordinates."),
			InputSchema: GetCoordinatesInputSchema,
		},
	}
	tools := make([]anthropic.ToolUnionParam, len(toolParams))
	for i, toolParam := range toolParams {
		tools[i] = anthropic.ToolUnionParam{OfTool: &toolParam}
	}

	for {
		message, err := client.Messages.New(context.TODO(), anthropic.MessageNewParams{
			Model:     anthropic.ModelClaudeOpus4_6,
			MaxTokens: 1024,
			Messages:  messages,
			Tools:     tools,
		})

		if err != nil {
			panic(err)
		}

		print(color("[assistant]: "))
		for _, block := range message.Content {
			switch block := block.AsAny().(type) {
			case anthropic.TextBlock:
				println(block.Text)
				println()
			case anthropic.ToolUseBlock:
				inputJSON, _ := json.Marshal(block.Input)
				println(block.Name + ": " + string(inputJSON))
				println()
			}
		}

		messages = append(messages, message.ToParam())
		toolResults := []anthropic.ContentBlockParamUnion{}

		for _, block := range message.Content {
			switch variant := block.AsAny().(type) {
			case anthropic.ToolUseBlock:
				print(color("[user (" + block.Name + ")]: "))

				var response interface{}
				switch block.Name {
				case "get_coordinates":
					var input struct {
						Location string `json:"location"`
					}

					err := json.Unmarshal([]byte(variant.JSON.Input.Raw()), &input)
					if err != nil {
						panic(err)
					}

					response = GetCoordinates(input.Location)
				}

				b, err := json.Marshal(response)
				if err != nil {
					panic(err)
				}

				println(string(b))

				toolResults = append(toolResults, anthropic.NewToolResultBlock(block.ID, string(b), false))
			}

		}
		if len(toolResults) == 0 {
			break
		}
		messages = append(messages, anthropic.NewUserMessage(toolResults...))
	}
}

type GetCoordinatesInput {
	Location string `json:"location" jsonschema_description:"The location to look up."`
}

var GetCoordinatesInputSchema = GenerateSchema[GetCoordinatesInput]()
```

--------------------------------

### GET /v1/organizations/api_keys

Source: https://platform.claude.com/docs/en/api/admin/api_keys

List all API keys for your organization with support for pagination and filtering by status, workspace, or creator. Returns a paginated list of API keys with cursor-based navigation.

```APIDOC
## GET /v1/organizations/api_keys

### Description
List all API keys for your organization with advanced filtering and pagination.

### Method
GET

### Endpoint
`/v1/organizations/api_keys`

### Parameters
#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **created_by_user_id** (string) - Optional - Filter by the ID of the User who created the object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **status** (string) - Optional - Filter by API key status. Possible values: `active`, `inactive`, `archived`.
- **workspace_id** (string) - Optional - Filter by Workspace ID.

### Response
#### Success Response (200)
- **data** (array) - Array of API key objects.
  - **id** (string) - ID of the API key.
  - **created_at** (string) - RFC 3339 datetime string indicating when the API Key was created.
  - **created_by** (object) - The ID and type of the actor that created the API key.
    - **id** (string) - ID of the actor that created the object.
    - **type** (string) - Type of the actor that created the object.
  - **name** (string) - Name of the API key.
  - **partial_key_hint** (string) - Partially redacted hint for the API key.
  - **status** (string) - Status of the API key. Possible values: `active`, `inactive`, `archived`.
  - **type** (string) - Object type. For API Keys, this is always `api_key`.
  - **workspace_id** (string) - ID of the Workspace associated with the API key, or `null` if the API key belongs to the default Workspace.
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
```json
{
  "data": [
    {
      "id": "key_123abc",
      "created_at": "2024-01-15T10:30:00Z",
      "created_by": {
        "id": "user_456def",
        "type": "user"
      },
      "name": "Production API Key",
      "partial_key_hint": "sk_live_...abc123",
      "status": "active",
      "type": "api_key",
      "workspace_id": "ws_789ghi"
    }
  ],
  "first_id": "key_123abc",
  "has_more": false,
  "last_id": "key_123abc"
}
```
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version} - Get Skill Version

Source: https://platform.claude.com/docs/en/api/go/beta/skills/versions

Retrieves detailed information about a specific skill version. Returns comprehensive metadata including creation timestamp, description, and version identifiers.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
Retrieve detailed information about a specific skill version. This endpoint returns comprehensive metadata for a single skill version identified by both skill ID and version number.

### Method
GET

### Endpoint
`/v1/skills/{skill_id}/versions/{version}`

### Parameters

#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill.
- **version** (string) - Required - Version identifier for the skill (Unix epoch timestamp format, e.g., "1759178010641129").

### Response

#### Success Response (200)
- **BetaSkillVersionGetResponse** (object)
  - **ID** (string) - Unique identifier for the skill version.
  - **CreatedAt** (string) - ISO 8601 timestamp of when the skill version was created.
  - **Description** (string) - Description of the skill version extracted from the SKILL.md file.
  - **Directory** (string) - Top-level directory name extracted from the uploaded files.
  - **Name** (string) - Human-readable name of the skill version.
  - **SkillID** (string) - Identifier for the skill that this version belongs to.
  - **Type** (string) - Object type, always `"skill_version"` for skill versions.
  - **Version** (string) - Version identifier (Unix epoch timestamp).

#### Response Example
```json
{
  "ID": "skill_version_789",
  "CreatedAt": "2024-10-02T14:22:15Z",
  "Description": "Advanced document processing with AI capabilities",
  "Directory": "ai_document_processor",
  "Name": "AI Document Processor v2",
  "SkillID": "skill_456",
  "Type": "skill_version",
  "Version": "1759178010641129"
}
```
```

--------------------------------

### Message Content Array Example

Source: https://platform.claude.com/docs/en/api/csharp/messages

Example of a content array returned in a Message response. Demonstrates how the model continues from an assistant turn when the input messages end with an assistant role, allowing constraint of model output.

```json
[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]
```

```json
[
  {"type": "text", "text": "B)"}
]
```

--------------------------------

### Format Conversational Prompt for Claude API

Source: https://platform.claude.com/docs/en/api/completions/create

This example demonstrates the required alternating 'Human:' and 'Assistant:' conversational turn format for prompts sent to the Claude API. Adhering to this structure is crucial for the model to generate appropriate and coherent responses.

```json
"\n\nHuman: {userQuestion}\n\nAssistant:"
```

--------------------------------

### Available Claude Models

Source: https://platform.claude.com/docs/en/api/messages

Reference guide for all available Claude models with their capabilities and use cases. Models range from the most capable Opus variants to the fastest Haiku models, each optimized for different performance and cost requirements.

```APIDOC
## Available Models

### Model Selection
When making API requests, specify the desired model using the `model` parameter. Choose based on your performance and cost requirements.

### Opus Models (Most Capable)
- **claude-opus-4-6** - Most intelligent model for building agents and coding
- **claude-opus-4-5-20251101** - Premium model combining maximum intelligence with practical performance
- **claude-opus-4-5** - Premium model combining maximum intelligence with practical performance
- **claude-opus-4-0** - Our most capable model
- **claude-opus-4-20250514** - Our most capable model
- **claude-4-opus-20250514** - Our most capable model
- **claude-opus-4-1-20250805** - Our most capable model
- **claude-3-opus-latest** - Excels at writing and complex tasks
- **claude-3-opus-20240229** - Excels at writing and complex tasks

### Sonnet Models (High-Performance)
- **claude-sonnet-4-20250514** - High-performance model with extended thinking
- **claude-sonnet-4-0** - High-performance model with extended thinking
- **claude-4-sonnet-20250514** - High-performance model with extended thinking
- **claude-sonnet-4-5** - Our best model for real-world agents and coding
- **claude-sonnet-4-5-20250929** - Our best model for real-world agents and coding
- **claude-3-7-sonnet-latest** - High-performance model with early extended thinking
- **claude-3-7-sonnet-20250219** - High-performance model with early extended thinking

### Haiku Models (Fastest & Most Compact)
- **claude-3-5-haiku-latest** - Fastest and most compact model for near-instant responsiveness
- **claude-3-5-haiku-20241022** - Our fastest model
- **claude-haiku-4-5** - Hybrid model, capable of near-instant responses and extended thinking
- **claude-haiku-4-5-20251001** - Hybrid model, capable of near-instant responses and extended thinking
- **claude-3-haiku-20240307** - Our previous most fast and cost-effective

### Selection Guide
For maximum intelligence and complex reasoning tasks, use Opus models. For balanced performance and cost, use Sonnet models. For speed and cost-efficiency, use Haiku models.
```

--------------------------------

### Send a message using Anthropic C# SDK

Source: https://platform.claude.com/docs/en/api/sdks/csharp

This example demonstrates how to initialize the Anthropic C# client, define message parameters including the model and user content, and send a message to the Anthropic API. It then prints the received message to the console.

```csharp
using System;
using Anthropic;
using Anthropic.Models.Messages;

AnthropicClient client = new();

MessageCreateParams parameters = new()
{
    MaxTokens = 1024,
    Messages =
    [
        new()
        {
            Role = Role.User,
            Content = "Hello, Claude",
        },
    ],
    Model = "claude-opus-4-6",
};

var message = await client.Messages.Create(parameters);

Console.WriteLine(message);
```

--------------------------------

### Configure BetaWebFetchTool for Web Content Retrieval

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/count_tokens

Web fetch tool configuration for retrieving web content. Supports direct caller access with configurable cache control and schema validation. Provides basic tool setup for fetching and processing web pages.

```csharp
class BetaWebFetchTool20250910 {
  JsonElement Name = "web_fetch"; // constant
  JsonElement Type = "web_fetch_20250910"; // constant
  IReadOnlyList<AllowedCaller> AllowedCallers; // "direct"
}
```

--------------------------------

### Streaming Event - Content Block Start

Source: https://platform.claude.com/docs/en/api/java/messages/create

Streaming event indicating the start of a new content block within the message. Contains information about the type of content block being generated.

```APIDOC
## Streaming Event: content_block_start

### Description
Streaming event indicating the beginning of a new content block (text, tool use, etc.) within the message.

### Event Type
- **type** (constant) - Always "content_block_start"

### Event Fields

#### contentBlock (object)
The content block being started. Accepts one of the following types:

##### TextBlock
- **type** (string) - Always "text" for text blocks
- **text** (string) - The text content
- **citations** (array) - Optional - Citations supporting the text block

###### Citation Types
The type of citation depends on the source document:
- **CitationCharLocation** - For plain text documents
  - **citedText** (string) - The text being cited
  - **documentIndex** (long) - Index of the source document
  - **documentTitle** (string) - Optional - Title of the source document
- **page_location** - For PDF documents
- **content_block_location** - For content documents

### Event Example
```json
{
  "type": "content_block_start",
  "contentBlock": {
    "type": "text",
    "text": "",
    "citations": [
      {
        "type": "char_location",
        "citedText": "example text",
        "documentIndex": 0,
        "documentTitle": "Source Document"
      }
    ]
  }
}
```

### Notes
- Marks the beginning of a new content block in the streaming response
- Citations provide attribution for text content
- Different citation types are returned based on source document type
```

--------------------------------

### Configure proxy for Bun runtime

Source: https://platform.claude.com/docs/en/api/sdks/typescript

Set up a proxy for Bun by passing a proxy URL string to the fetchOptions. Bun's fetch implementation natively supports the proxy option in RequestInit.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  fetchOptions: {
    proxy: "http://localhost:8888"
  }
});
```

--------------------------------

### Create Skill Version API

Source: https://platform.claude.com/docs/en/api/java/beta/skills/versions/create

This snippet provides examples for creating a new skill version. It includes the Java client method signature and the corresponding HTTP POST endpoint, detailing the parameters and expected response structure for this operation.

```java
VersionCreateResponse beta().skills().versions().create(VersionCreateParamsparams = VersionCreateParams.none(), RequestOptionsrequestOptions = RequestOptions.none())
```

```http
post /v1/skills/{skill_id}/versions
```

--------------------------------

### System Prompt Parameter

Source: https://platform.claude.com/docs/en/api/ruby/messages/batches

Allows you to provide context and instructions to Claude via a system prompt.

```APIDOC
## System Prompt

### Description
A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role.

### Method
N/A

### Endpoint
N/A

### Parameters
#### Parameters
- **system_** (String | Array[TextBlockParam]) - Required - The system prompt.
  - String
  - Array[TextBlockParam]
    - **text** (String) - Required - The text content.
    - **type** (:text) - Required - The type of the text block.
      - `:text`
    - **cache_control** (CacheControlEphemeral) - Optional - Create a cache control breakpoint at this content block.
      - **type** (:ephemeral) - Required - The type of cache control.
        - `:ephemeral`
      - **ttl** (String) - Optional - The time-to-live for the cache control breakpoint.
        - `"5m"`
        - `"1h"`
    - **citations** (Array[TextCitationParam]) - Optional - Citations for the text block.
      - **class CitationCharLocationParam**
        - **cited_text** (String) - Required - The cited text.
        - **document_index** (Integer) - Required - The document index.
        - **document_title** (String) - Required - The document title.
        - **end_char_index** (Integer) - Required - The end character index.
        - **start_char_index** (Integer) - Required - The start character index.
        - **type** (:char_location) - Required - The type of citation.
          - `:char_location`
      - **class CitationPageLocationParam**
        - **cited_text** (String) - Required - The cited text.
        - **document_index** (Integer) - Required - The document index.
        - **document_title** (String) - Required - The document title.
        - **end_page_number** (Integer) - Required - The end page number.
        - **start_page_number** (Integer) - Required - The start page number.
        - **type** (:page_location) - Required - The type of citation.
          - `:page_location`
      - **class CitationContentBlockLocationParam**
        - **cited_text** (String) - Required - The cited text.
        - **document_index** (Integer) - Required - The document index.
        - **document_title** (String) - Required - The document title.
        - **end_block_index** (Integer) - Required - The end block index.
        - **start_block_index** (Integer) - Required - The start block index.
        - **type** (:content_block_location) - Required - The type of citation.
          - `:content_block_location`
      - **class CitationWebSearchResultLocationParam**
        - **cited_text** (String) - Required - The cited text.
        - **encrypted_index** (String) - Required - The encrypted index.
        - **title** (String) - Required - The title.
        - **type** (:web_search_result_location) - Required - The type of citation.
          - `:web_search_result_location`
        - **url** (String) - Required - The URL.
      - **class CitationSearchResultLocationParam**
        - **cited_text** (String) - Required - The cited text.
        - **end_block_index** (Integer) - Required - The end block index.
        - **search_result_index** (Integer) - Required - The search result index.
        - **source** (String) - Required - The source.
        - **start_block_index** (Integer) - Required - The start block index.
        - **title** (String) - Required - The title.
        - **type** (:search_result_location) - Required - The type of citation.
          - `:search_result_location`

### Request Example
N/A

### Response
N/A
```

--------------------------------

### Streaming Event - Message Start

Source: https://platform.claude.com/docs/en/api/java/messages/create

The initial streaming event sent when a message starts processing. Contains the message_start event type and is the first event in a streaming response sequence.

```APIDOC
## Streaming Event: message_start

### Description
The first event in a streaming message response sequence, indicating message processing has begun.

### Event Type
- **type** (constant) - Always "message_start"

### Event Fields
- **stopReason** (enum) - Always null in message_start events

### Stop Reason Values (for reference)
- END_TURN("end_turn")
- MAX_TOKENS("max_tokens")
- STOP_SEQUENCE("stop_sequence")
- TOOL_USE("tool_use")
- PAUSE_TURN("pause_turn")
- REFUSAL("refusal")

### Event Example
```json
{
  "type": "message_start",
  "stopReason": null
}
```

### Notes
- This is always the first event in a streaming response
- stopReason is null for message_start; becomes non-null in subsequent events
```

--------------------------------

### Memory Tool Configuration

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches

Configure the BetaMemoryTool for memory management capabilities. Supports cache control, deferred loading, input examples, and strict validation modes.

```APIDOC
## BetaMemoryTool20250818

### Description
Defines a memory tool that enables Claude models to store and retrieve information across interactions. Includes cache control and optional input examples.

### Tool Properties

#### name
- **Type**: JsonValue (constant)
- **Value**: `"memory"`
- **Description**: Name of the tool as called by the model and in `tool_use` blocks

#### type
- **Type**: JsonValue (constant)
- **Value**: `"memory_20250818"`
- **Description**: Tool type identifier

#### allowedCallers
- **Type**: Optional<List<AllowedCaller>>
- **Description**: Specifies which callers can invoke this tool
- **Allowed Values**:
  - `"direct"` - Direct caller
  - `"code_execution_20250825"` - Code execution tool

#### cacheControl
- **Type**: Optional<BetaCacheControlEphemeral>
- **Description**: Creates a cache control breakpoint at this content block
- **Properties**:
  - **type**: `"ephemeral"` (constant)
  - **ttl**: Optional time-to-live value
    - `"5m"` - 5 minutes (default)
    - `"1h"` - 1 hour

#### deferLoading
- **Type**: Optional<Boolean>
- **Default**: false
- **Description**: If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search

#### inputExamples
- **Type**: Optional<List<InputExample>>
- **Description**: Examples of valid inputs for the memory tool

#### strict
- **Type**: Optional<Boolean>
- **Default**: false
- **Description**: When true, guarantees schema validation on tool names and inputs
```

--------------------------------

### Content Block Text Response Example

Source: https://platform.claude.com/docs/en/api/csharp/messages/batches

Example of model-generated text content in a Message Batch response. Demonstrates how the model continues from an assistant turn when the input messages end with an assistant role.

```json
{
  "role": "user",
  "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
}
{
  "role": "assistant",
  "content": "The best answer is ("
}
```

```json
[{"type": "text", "text": "B)"}]
```

--------------------------------

### GET /v1/models/{model_id}

Source: https://platform.claude.com/docs/en/api/go/models/retrieve

Get a specific model. The Models API response can be used to determine information about a specific model or resolve a model alias to a model ID.

```APIDOC
## GET /v1/models/{model_id}

### Description
Get a specific model. The Models API response can be used to determine information about a specific model or resolve a model alias to a model ID.

### Method
GET

### Endpoint
/v1/models/{model_id}

### Parameters
#### Path Parameters
- **modelID** (string) - Required - Model identifier or alias.

#### Query Parameters
- **Betas** (array of AnthropicBeta) - Optional - Optional header to specify the beta version(s) you want to use.
  Possible values: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01"

### Response
#### Success Response (200)
- **ID** (string) - Unique model identifier.
- **CreatedAt** (Time) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
- **DisplayName** (string) - A human-readable name for the model.
- **Type** (Model) - Object type. For Models, this is always "model".
  Possible values: "model"

#### Response Example
{
  "ID": "claude-3-opus-20240229",
  "CreatedAt": "2024-02-29T00:00:00Z",
  "DisplayName": "Claude 3 Opus",
  "Type": "model"
}
```

--------------------------------

### Define BetaSkillListParams - Query and Header Parameters

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Defines parameters for listing skills including pagination (Limit, Page), filtering by source (custom/anthropic), and beta version specification. The Limit parameter accepts up to 100 results per page (default 20), Page uses pagination tokens, Source filters by skill origin, and Betas specifies which API beta features to use.

```go
type BetaSkillListParams struct {
  Limit   param.Field[int64]
  Page    param.Field[string]
  Source  param.Field[string]
  Betas   param.Field[[]AnthropicBeta]
}

// Limit: Query param - Number of results to return per page (max 100, default 20)
// Page: Query param - Pagination token for fetching specific page
// Source: Query param - Filter by "custom" or "anthropic"
// Betas: Header param - Optional beta version(s) to use
```

--------------------------------

### Retrieve Skill - Get Skill by ID Endpoint

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Retrieves a specific skill by its ID using the GET /v1/skills/{skill_id} endpoint. Returns a BetaSkillGetResponse containing the skill details. Requires context, skill ID, and optional query parameters.

```go
client.Beta.Skills.Get(ctx, skillID, query) (*BetaSkillGetResponse, error)

// GET /v1/skills/{skill_id}
// Get Skill
//
// Parameters:
//   ctx: Context for the request
//   skillID: Unique identifier of the skill to retrieve
//   query: Optional query parameters
//
// Returns:
//   *BetaSkillGetResponse: Skill details
//   error: Error if request fails
```

--------------------------------

### Download File HTTP GET Endpoint

Source: https://platform.claude.com/docs/en/api/python/beta/files/download

HTTP GET endpoint for downloading file content from the Anthropic API. Requires the file_id path parameter and returns the binary content of the requested file.

```http
GET /v1/files/{file_id}/content
```

--------------------------------

### List Files using Go SDK

Source: https://platform.claude.com/docs/en/api/go/beta/files/list

This Go function signature demonstrates how to list files using the Anthropic Beta Files API client. It takes a context and parameters, returning a paginated list of file metadata or an error.

```go
client.Beta.Files.List(ctx, params) (*Page[FileMetadata], error)
```

--------------------------------

### Initialize Anthropic client with explicit Vertex credentials

Source: https://platform.claude.com/docs/en/api/sdks/java

Create an AnthropicClient with explicit Google credentials, region, and project configuration. Requires GOOGLE_APPLICATION_CREDENTIALS and ANTHROPIC_VERTEX_PROJECT_ID environment variables to be set.

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;

String accessToken = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");

String project = System.getenv("ANTHROPIC_VERTEX_PROJECT_ID");

GoogleCredentials googleCredentials = GoogleCredentials.create(
  AccessToken.newBuilder().setTokenValue(accessToken).build()
);

AnthropicClient client = AnthropicOkHttpClient.builder()
  .backend(
    VertexBackend.builder()
      .googleCredentials(googleCredentials)
      .region("us-central1")
      .project(project)
      .build()
  )
  .build();
```

--------------------------------

### Configure Output Settings in Go

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

Sets output configuration options for the model including effort levels that control the quality and computational resources used for generating responses.

```go
type BetaOutputConfig struct {
  Effort BetaOutputConfigEffort
}

type BetaOutputConfigEffort string

const BetaOutputConfigEffortLow BetaOutputConfigEffort = "low"
const BetaOutputConfigEffortMedium BetaOutputConfigEffort = "medium"
const BetaOutputConfigEffortHigh BetaOutputConfigEffort = "high"
```

--------------------------------

### Send a Message using Anthropic Python SDK

Source: https://platform.claude.com/docs/en/api/overview

This Python example demonstrates how to use the official Anthropic Client SDK to send a conversational message to a Claude model. It initializes the client, which automatically handles API key authentication from environment variables, and then calls the `messages.create` method, specifying the model, maximum tokens, and the user's message content.

```python
from anthropic import Anthropic

client = Anthropic()  # Reads ANTHROPIC_API_KEY from environment
message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude"}],
)
```

--------------------------------

### Memory Tool Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/count_tokens

Configure the memory tool for maintaining state and context across interactions. Supports cache control and optional input examples for enhanced functionality.

```APIDOC
## Memory Tool (BetaMemoryTool20250818)

### Description
Configures a memory tool that enables state management and context retention. The tool supports cache control breakpoints and optional strict validation.

### Tool Properties

#### Required Fields
- **name** (string) - Required - Must be set to `"memory"`
- **type** (string) - Required - Must be set to `"memory_20250818"`

#### Optional Fields
- **allowed_callers** (array) - Optional - Specifies who can call this tool
  - Allowed values: `"direct"`, `"code_execution_20250825"`

- **cache_control** (BetaCacheControlEphemeral) - Optional - Creates a cache control breakpoint
  - **type** (string) - Must be `"ephemeral"`
  - **ttl** (string) - Time-to-live for cache breakpoint
    - Allowed values: `"5m"` (5 minutes), `"1h"` (1 hour)
    - Defaults to `"5m"`

- **defer_loading** (boolean) - Optional - If true, tool is not included in initial system prompt and only loaded when returned via tool_reference

- **input_examples** (array) - Optional - Array of example inputs demonstrating tool usage

- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs

### Configuration Example
```json
{
  "name": "memory",
  "type": "memory_20250818",
  "allowed_callers": ["direct"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  },
  "defer_loading": false,
  "strict": true
}
```
```

--------------------------------

### Content Block Text Response Example

Source: https://platform.claude.com/docs/en/api/typescript/messages/batches/results

Example of a text content block returned in the message content array. Demonstrates how the model generates text responses and can continue from a previous assistant turn if the input messages ended with an assistant role.

```json
[
  {"type": "text", "text": "Hi, I'm Claude."}
]
```

--------------------------------

### Configure Anthropic C# client using environment variables

Source: https://platform.claude.com/docs/en/api/sdks/csharp

This snippet shows how to initialize the Anthropic C# client, which automatically picks up configuration settings like `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, and `ANTHROPIC_BASE_URL` from environment variables. No explicit parameters are needed during client instantiation.

```csharp
using Anthropic;

// Configured using the ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL environment variables
AnthropicClient client = new();
```

--------------------------------

### Configure Web Fetch Tool with Content Limits

Source: https://platform.claude.com/docs/en/api/java/beta/messages/count_tokens

Set up the BetaWebFetchTool20250910 to fetch web content with optional citations, domain restrictions, and token limits. The tool allows configuration of maximum content tokens for context inclusion and supports deferred loading for conditional tool availability.

```Java
BetaWebFetchTool20250910 webFetchTool = new BetaWebFetchTool20250910()
  .name("web_fetch")
  .type("web_fetch_20250910")
  .allowedDomains(Arrays.asList("api.example.com", "docs.example.com"))
  .citations(new BetaCitationsConfigParam()
    .enabled(true))
  .maxContentTokens(4000L)
  .cacheControl(new BetaCacheControlEphemeral()
    .type("ephemeral")
    .ttl("1h"))
  .deferLoading(false)
  .maxUses(5L);
```

--------------------------------

### GET /v1/organizations/invites

Source: https://platform.claude.com/docs/en/api/admin/invites

List all invites for an organization with cursor-based pagination support. Returns a paginated list of invite objects with navigation cursors.

```APIDOC
## GET /v1/organizations/invites

### Description
List all invites for an organization with pagination support.

### Method
GET

### Endpoint
`/v1/organizations/invites`

### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. Returns results immediately after this object
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. Returns results immediately before this object
- **limit** (number) - Optional - Number of items to return per page. Defaults to 20, ranges from 1 to 1000

### Response
#### Success Response (200)
- **data** (array of Invite) - Array of invite objects
  - **id** (string) - ID of the Invite
  - **email** (string) - Email of the user being invited
  - **expires_at** (string) - RFC 3339 datetime string indicating when the invite expires
  - **invited_at** (string) - RFC 3339 datetime string indicating when the invite was created
  - **role** (string) - Organization role of the user. Values: "user", "developer", "billing", "admin", "claude_code_user", "managed"
  - **status** (string) - Status of the invite. Values: "pending", "accepted", "expired", "deleted"
  - **type** (string) - Object type, always "invite"
- **first_id** (string) - First ID in the data list. Can be used as before_id for the previous page
- **last_id** (string) - Last ID in the data list. Can be used as after_id for the next page
- **has_more** (boolean) - Indicates if there are more results in the requested page direction

#### Response Example
```json
{
  "data": [
    {
      "id": "invite_123abc",
      "email": "user1@example.com",
      "expires_at": "2024-02-15T10:30:00Z",
      "invited_at": "2024-01-15T10:30:00Z",
      "role": "developer",
      "status": "pending",
      "type": "invite"
    },
    {
      "id": "invite_456def",
      "email": "user2@example.com",
      "expires_at": "2024-02-16T10:30:00Z",
      "invited_at": "2024-01-16T10:30:00Z",
      "role": "user",
      "status": "accepted",
      "type": "invite"
    }
  ],
  "first_id": "invite_123abc",
  "last_id": "invite_456def",
  "has_more": true
}
```
```

--------------------------------

### Manually Fetch Paginated Results with Anthropic Client

Source: https://platform.claude.com/docs/en/api/sdks/python

This example illustrates how to fetch a single page of results from a paginated API endpoint and then manually check for and retrieve the next page using `has_next_page()` and `get_next_page()` methods.

```python
first_page = await client.messages.batches.list(limit=20)

if first_page.has_next_page():
    print(f"will fetch next page using these details: {first_page.next_page_info()}")
    next_page = await first_page.get_next_page()
    print(f"number of items we just fetched: {len(next_page.data)}")
```

--------------------------------

### Configure Computer Use Tool with Display Settings

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches/create

Set up BetaToolComputerUse20241022 with display dimensions in pixels and optional X11 display number. Includes cache control configuration with ephemeral TTL options and allowed callers for tool invocation. Supports deferred loading and strict schema validation.

```java
BetaToolComputerUse20241022 computerTool = new BetaToolComputerUse20241022();
computerTool.setDisplayHeightPx(1080);
computerTool.setDisplayWidthPx(1920);
computerTool.setDisplayNumber(0);
computerTool.setName("computer");
computerTool.setType("computer_20241022");
computerTool.setAllowedCallers(Arrays.asList("direct", "code_execution_20250825"));
computerTool.setCacheControl(new BetaCacheControlEphemeral("ephemeral", "1h"));
computerTool.setDeferLoading(false);
computerTool.setStrict(true);
```

--------------------------------

### Upload files using multiple input formats in Python

Source: https://platform.claude.com/docs/en/api/sdks/python

Shows various methods to upload files using the Anthropic SDK including file paths via pathlib.Path objects and byte tuples with filename and content type. The example demonstrates both approaches for the files API with appropriate beta headers.

```python
from pathlib import Path
from anthropic import Anthropic

client = Anthropic()

# Upload using a file path
client.beta.files.upload(
    file=Path("/path/to/file"),
    betas=["files-api-2025-04-14"],
)

# Upload using bytes
client.beta.files.upload(
    file=("file.txt", b"my bytes", "text/plain"),
    betas=["files-api-2025-04-14"],
)
```

--------------------------------

### Content Block Response Structure with JSON Example

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches

Defines the array of content blocks generated by the model. Each block has a type property that determines its structure. Supports continuation from assistant turns in input messages, allowing constrained model output. Includes JSON examples showing text content blocks and assistant turn continuation.

```json
{
  "content": [
    {"type": "text", "text": "Hi, I'm Claude."}
  ]
}

// Example with assistant turn continuation
{
  "messages": [
    {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
    {"role": "assistant", "content": "The best answer is ("}
  ],
  "content": [
    {"type": "text", "text": "B)"}
  ]
}
```

--------------------------------

### Initialize Anthropic Client with Explicit AWS Credentials in Java

Source: https://platform.claude.com/docs/en/api/sdks/java

This Java example demonstrates how to configure the `AnthropicClient` with explicit AWS access key ID and secret access key. This approach provides direct control over the credentials used for authentication with the Bedrock API, along with a specified AWS region.

```java
import com.anthropic.bedrock.backends.BedrockBackend;
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.regions.Region;

AwsCredentials awsCredentials = AwsBasicCredentials.create(
  System.getenv("AWS_ACCESS_KEY_ID"),
  System.getenv("AWS_SECRET_ACCESS_KEY")
);

AnthropicClient client = AnthropicOkHttpClient.builder()
  .backend(
    BedrockBackend.builder().awsCredentials(awsCredentials).region(Region.US_EAST_1).build()
  )
  .build();
```

--------------------------------

### Tool Use Cases and Workflows

Source: https://platform.claude.com/docs/en/api/messages

Explore common use cases for tools including running client-side functions, generating structured output, and building agent workflows.

```APIDOC
## Tool Use Cases and Workflows

### Description
Tools enable various workflows and use cases with the Claude API.

### Primary Use Cases

#### 1. Client-Side Tool Execution
Run client-side functions and tools by having Claude generate structured tool_use blocks that your application processes and executes.

#### 2. Structured Output Generation
Use tools to guarantee that Claude produces output in a specific JSON structure defined by your tool's input_schema.

#### 3. Agent Workflows
Build multi-step agent workflows where Claude decides which tools to invoke based on user requests and iteratively processes results.

### Workflow Pattern

1. **Define Tools**: Create tool definitions with name, description, and input_schema
2. **Send Request**: Include tools in API request along with user message
3. **Receive Tool Use**: Claude generates tool_use content blocks in response
4. **Execute Tool**: Your application executes the tool with the provided input
5. **Return Results**: Send tool_result content block back to Claude
6. **Continue Conversation**: Claude processes results and may invoke more tools or provide final response

### Tool Types

#### Client Tools
Tools defined by you with custom input schemas. Behavior is determined by your implementation.

#### Server Tools
Built-in tools provided by Anthropic (e.g., bash_20250124, str_replace_editor, web search tool). Each has its own specific behavior and documentation.

### Best Practices

- Provide detailed descriptions for tools to improve model performance
- Use clear, descriptive property names in input_schema
- Include examples in tool descriptions when helpful
- Validate tool inputs against the defined schema
- Return meaningful results in tool_result content blocks
```

--------------------------------

### Download File via HTTP GET Endpoint

Source: https://platform.claude.com/docs/en/api/go/beta/files/download

This snippet provides the direct HTTP GET endpoint for downloading file content. The `{file_id}` placeholder in the URL path must be replaced with the actual ID of the file to be downloaded.

```HTTP
get /v1/files/{file_id}/content
```

--------------------------------

### GET /v1/models/{model_id}

Source: https://platform.claude.com/docs/en/api/csharp/beta/models/retrieve

Get a specific model by its identifier or alias. This endpoint provides details about the model, including its ID, creation date, and display name, and can be used to resolve a model alias to a model ID.

```APIDOC
## GET /v1/models/{model_id}

### Description
Get a specific model. The Models API response can be used to determine information about a specific model or resolve a model alias to a model ID.

### Method
GET

### Endpoint
/v1/models/{model_id}

### Parameters
#### Path Parameters
- **model_id** (string) - Required - Model identifier or alias.

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **ID** (string) - Unique model identifier.
- **CreatedAt** (DateTimeOffset) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
- **DisplayName** (string) - A human-readable name for the model.
- **Type** (string) - Object type. For Models, this is always "model".

#### Response Example
```json
{
  "ID": "claude-3-opus-20240229",
  "CreatedAt": "2024-02-29T12:00:00Z",
  "DisplayName": "Claude 3 Opus",
  "Type": "model"
}
```
```

--------------------------------

### Request Parameters - System Prompt

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Provide system context and instructions to Claude through a system prompt. The system parameter accepts either a simple string or an array of text blocks with optional cache control and citation support for advanced use cases.

```APIDOC
## Request Parameters - System Prompt

### System Parameter

**Parameter Name:** `system`

**Type:** string or array of BetaTextBlockParam (optional)

**Description:** System prompt providing context and instructions to Claude, such as specifying a particular goal or role.

**Related Documentation:** See guide to system prompts for best practices.

### Simple String Format

**Type:** string

**Example:**
```json
{
  "system": "You are a helpful assistant specialized in technical documentation."
}
```

### Advanced Format - Text Block Array

**Type:** array of BetaTextBlockParam

#### Text Block Structure

- **text** (string, required) - The text content of the block
- **type** (string, required) - Must be `"text"`
- **cache_control** (BetaCacheControlEphemeral, optional) - Cache control breakpoint configuration
- **citations** (array of BetaTextCitationParam, optional) - Citation information for the text block

#### Cache Control Configuration

- **type** (string, required) - Must be `"ephemeral"`
- **ttl** (string, optional) - Time-to-live for the cache breakpoint
  - `"5m"` - 5 minutes (default)
  - `"1h"` - 1 hour

### Example Request - Advanced Format
```json
{
  "system": [
    {
      "type": "text",
      "text": "You are a helpful assistant.",
      "cache_control": {
        "type": "ephemeral",
        "ttl": "5m"
      }
    }
  ]
}
```
```

--------------------------------

### Message Start Event with Usage Metrics

Source: https://platform.claude.com/docs/en/api/ruby/messages

The message start event contains comprehensive usage information including token counts, geographic region, server tool requests, and service tier. This event is returned when a message begins processing and provides detailed metrics about the request.

```APIDOC
## Message Start Event

### Description
Returned when a message starts processing. Contains usage metrics including token counts, geographic region, and service tier information.

### Event Type
`message_start`

### Event Structure

#### Usage Metrics
- **region** (string) - The geographic region where inference was performed for this request
- **input_tokens** (integer) - The number of input tokens which were used
- **output_tokens** (integer) - The number of output tokens which were used
- **service_tier** (enum) - The service tier used for this request
  - `:standard` - Standard tier
  - `:priority` - Priority tier
  - `:batch` - Batch tier

#### Server Tool Usage
- **server_tool_use** (ServerToolUsage) - The number of server tool requests
  - **web_search_requests** (integer) - The number of web search tool requests

### Response Example
```json
{
  "type": "message_start",
  "message": {
    "id": "msg_123",
    "type": "message",
    "role": "assistant",
    "content": [],
    "model": "claude-3-5-sonnet-20241022",
    "stop_reason": null,
    "stop_sequence": null,
    "usage": {
      "input_tokens": 100,
      "output_tokens": 0,
      "region": "us-west-2",
      "service_tier": "standard",
      "server_tool_use": {
        "web_search_requests": 0
      }
    }
  }
}
```
```

--------------------------------

### System Prompt Configuration

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

Provide system prompts to Claude that specify context, instructions, goals, or roles. System prompts guide the model's behavior and responses throughout the conversation.

```APIDOC
## System Prompt Configuration

### Description
Define system prompts that provide context and instructions to Claude for consistent behavior.

### Parameters

#### system ([]BetaTextBlockParam)
- **Type** - Optional - Array of text blocks containing system instructions

### Text Block Structure

#### BetaTextBlockParam
- **text** (string) - Required - The system prompt text content
- **type** (string) - Required - Must be `"text"`
- **cache_control** (BetaCacheControlEphemeral) - Optional - Cache control settings

### Cache Control (Optional)

#### BetaCacheControlEphemeral
- **type** (string) - Required - Must be `"ephemeral"`
- **ttl** (string) - Optional - Time-to-live for cache breakpoint
  - `"5m"` - 5 minutes (default)
  - `"1h"` - 1 hour

### Request Example
```json
{
  "system": [
    {
      "type": "text",
      "text": "You are a helpful assistant specializing in technical documentation.",
      "cache_control": {
        "type": "ephemeral",
        "ttl": "5m"
      }
    }
  ]
}
```

### Notes
- See [system prompts guide](https://docs.claude.com/en/docs/system-prompts) for best practices
- System prompts are applied to all messages in the conversation
- Cache control enables prompt caching for improved performance
```

--------------------------------

### Example assistant turn continuation with constrained output

Source: https://platform.claude.com/docs/en/api/go/messages/batches

Demonstrates how the API continues from an assistant turn when the input messages end with an assistant role. Shows input messages with an incomplete assistant response and the corresponding model continuation.

```json
{
  "input_messages": [
    {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
    {"role": "assistant", "content": "The best answer is ("}
  ],
  "response_content": [{"type": "text", "text": "B)"}]
}
```

--------------------------------

### System Prompt Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/create

Provide system prompts to Claude as context and instructions. System prompts can be specified as strings or as arrays of text blocks with optional cache control.

```APIDOC
## POST /messages - System Prompt

### Description
Provide system prompts to Claude for context and instruction. System prompts define Claude's behavior, goals, and role in the conversation.

### Parameters

- **system** (string or array of BetaTextBlockParam) - Optional - System prompt content

#### String Format
Simple string-based system prompt:
```json
{
  "system": "You are a helpful assistant specializing in Python programming."
}
```

#### Array Format (BetaTextBlockParam)
Advanced format with cache control support:

- **text** (string) - Required - The text content of the system prompt
- **type** (string) - Required - Must be `"text"`
- **cache_control** (BetaCacheControlEphemeral) - Optional - Cache control breakpoint configuration
  - Creates a cache control breakpoint at this content block

### Request Example (String)
```json
{
  "system": "You are an expert data analyst. Provide insights with supporting data."
}
```

### Request Example (Array with Cache Control)
```json
{
  "system": [
    {
      "type": "text",
      "text": "You are an expert data analyst.",
      "cache_control": {
        "type": "ephemeral"
      }
    },
    {
      "type": "text",
      "text": "Provide insights with supporting data."
    }
  ]
}
```

### Additional Information
See [system prompts guide](https://docs.claude.com/en/docs/system-prompts) for best practices and examples.
```

--------------------------------

### Get Skill HTTP Request

Source: https://platform.claude.com/docs/en/api/python/beta/skills/retrieve

HTTP GET request to retrieve a skill from the Claude API. The endpoint path includes the skill_id as a path parameter. Supports optional beta version headers to specify which API beta features to use.

```http
GET /v1/skills/{skill_id}
```

--------------------------------

### Tool Configuration: BetaToolSearchToolRegex

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Describes the configuration parameters for the `tool_search_tool_regex` tool, including name, type, allowed callers, cache control, and loading behavior.

```APIDOC
## BetaToolSearchToolRegex20251119 / BetaToolSearchToolRegex Configuration

### Description
This section describes the configuration object for the `tool_search_tool_regex` tool, which can be used to define its behavior, including name, type, allowed callers, cache control settings, and loading preferences.

### Object Structure
`BetaToolSearchToolRegex20251119 = object { name, type, allowed_callers, cache_control, defer_loading, strict }`

### Properties
- **name** (string) - Required - Name of the tool. This is how the tool will be called by the model and in `tool_use` blocks.
  - Allowed values: `"tool_search_tool_regex"`
- **type** (string) - Required - Type of the tool.
  - Allowed values: `"tool_search_tool_regex_20251119"`, `"tool_search_tool_regex"`
- **allowed_callers** (array of string) - Optional - Specifies which callers are permitted to use this tool.
  - Allowed values: `"direct"`, `"code_execution_20250825"`
- **cache_control** (BetaCacheControlEphemeral object) - Optional - Configuration for a cache control breakpoint.
  - **type** (string) - Required - Type of cache control.
    - Allowed values: `"ephemeral"`
  - **ttl** (string) - Optional - The time-to-live for the cache control breakpoint. Defaults to `5m`.
    - Allowed values: `"5m"` (5 minutes), `"1h"` (1 hour)
- **defer_loading** (boolean) - Optional - If true, the tool will not be included in the initial system prompt. Only loaded when returned via `tool_reference` from tool search.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.

### Example Configuration
```json
{
  "name": "tool_search_tool_regex",
  "type": "tool_search_tool_regex_20251119",
  "allowed_callers": ["direct"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "5m"
  },
  "defer_loading": false,
  "strict": true
}
```
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/java/beta/skills

List Skills. This endpoint retrieves a list of all available skills.

```APIDOC
## GET /v1/skills

### Description
List Skills. This endpoint retrieves a list of all available skills.

### Method
GET

### Endpoint
/v1/skills

### Parameters
#### Path Parameters
(None)

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **data** (List<Skill>) - A list of skill objects.
- **limit** (Integer) - The maximum number of items to return.
- **order** (String) - The sort order of the items.
- **after** (String) - A cursor for pagination, indicating the item after which to start fetching results.

#### Response Example
{
  "data": [
    {
      "id": "skill_abc123",
      "createdAt": "2024-01-01T12:00:00Z",
      "displayTitle": "My Custom Skill",
      "latestVersion": "v1",
      "source": "custom",
      "type": "skill",
      "updatedAt": "2024-01-01T12:00:00Z"
    },
    {
      "id": "skill_def456",
      "createdAt": "2024-01-02T10:00:00Z",
      "displayTitle": "Another Skill",
      "latestVersion": "v2",
      "source": "anthropic",
      "type": "skill",
      "updatedAt": "2024-01-02T10:00:00Z"
    }
  ],
  "limit": 20,
  "order": "desc",
  "after": "skill_def456"
}
```

--------------------------------

### Citation Location Types - Character and Page

Source: https://platform.claude.com/docs/en/api/messages

Citation objects that reference specific locations in documents. Character location citations include start and end character indices for plain text documents. Page location citations include start and end page numbers for PDF documents.

```json
{
  "char_location": {
    "type": "char_location",
    "cited_text": "string",
    "document_index": 0,
    "document_title": "string",
    "file_id": "string",
    "start_char_index": 0,
    "end_char_index": 100
  },
  "page_location": {
    "type": "page_location",
    "cited_text": "string",
    "document_index": 0,
    "document_title": "string",
    "file_id": "string",
    "start_page_number": 1,
    "end_page_number": 5
  }
}
```

--------------------------------

### Stream Real-Time API Responses in Go

Source: https://platform.claude.com/docs/en/api/sdks/go

Demonstrates how to use the streaming API for real-time responses from Claude. Shows creating a streaming request, iterating through events, accumulating message data, and handling different event types like ContentBlockDeltaEvent with TextDelta variants.

```go
stream := client.Messages.NewStreaming(context.TODO(), anthropic.MessageNewParams{
	Model:     anthropic.ModelClaudeOpus4_6,
	MaxTokens: 1024,
	Messages: []anthropic.MessageParam{
		anthropicNewUserMessage(anthropic.NewTextBlock("What is a quaternion?")),
	},
})

message := anthropic.Message{}
for stream.Next() {
	event := stream.Current()
	err := message.Accumulate(event)
	if err != nil {
		panic(err)
	}

	switch eventVariant := event.AsAny().(type) {
	case anthropic.ContentBlockDeltaEvent:
		switch deltaVariant := eventVariant.Delta.AsAny().(type) {
		case anthropic.TextDelta:
			print(deltaVariant.Text)
		}
	}
}

if stream.Err() != nil {
	panic(stream.Err())
}
```

--------------------------------

### Use Structured Outputs with Anthropic Java SDK

Source: https://platform.claude.com/docs/en/api/sdks/java

This example demonstrates how to leverage the Anthropic Java SDK's beta features to generate structured outputs. It shows how to construct a `StructuredMessageCreateParams` object, specifying the desired model, maximum tokens, and an output configuration class (e.g., `BookList.class`) to receive structured data from the API.

```java
import com.anthropic.models.beta.messages.MessageCreateParams;
import com.anthropic.models.beta.messages.StructuredMessageCreateParams;
import com.anthropic.models.messages.Model;

StructuredMessageCreateParams<BookList> createParams = MessageCreateParams.builder()
        .model(Model.CLAUDE_OPUS_4_6)
        .maxTokens(2048)
        .outputConfig(BookList.class)
        .addUserMessage("List some famous late twentieth century novels.")
        .build();

client.beta().messages().create(createParams);
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/beta/files

Retrieves a paginated list of uploaded file metadata, allowing filtering by cursor and limit.

```APIDOC
## GET /v1/files

### Description
List Files

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **"anthropic-beta"** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Possible values include "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", etc.

### Request Example
[No request body for GET]

### Response
#### Success Response (200)
- **data** (array of object) - List of file metadata objects.
  - **id** (string) - Unique object identifier.
  - **created_at** (string) - RFC 3339 datetime string representing when the file was created.
  - **filename** (string) - Original filename of the uploaded file.
  - **mime_type** (string) - MIME type of the file.
  - **size_bytes** (number) - Size of the file in bytes.
  - **type** (string) - Object type. For files, this is always "file".
  - **downloadable** (boolean) - Optional - Whether the file can be downloaded.
- **first_id** (string) - Optional - ID of the first file in this page of results.
- **has_more** (boolean) - Optional - Whether there are more results available.
- **last_id** (string) - Optional - ID of the last file in this page of results.

#### Response Example
{
  "data": [
    {
      "id": "file_abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 102400,
      "type": "file",
      "downloadable": true
    },
    {
      "id": "file_def456",
      "created_at": "2024-01-02T13:00:00Z",
      "filename": "image.jpg",
      "mime_type": "image/jpeg",
      "size_bytes": 50000,
      "type": "file",
      "downloadable": false
    }
  ],
  "first_id": "file_abc123",
  "has_more": true,
  "last_id": "file_def456"
}
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version}

Source: https://platform.claude.com/docs/en/api/beta/skills

This endpoint retrieves a specific skill version by its skill ID and version identifier.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
This endpoint retrieves a specific skill version by its skill ID and version identifier.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions/{version}

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill.
- **version** (string) - Required - Version identifier for the skill (Unix epoch timestamp).

### Request Example
(No request body for GET)

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the skill version.
- **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
- **description** (string) - Description of the skill version, extracted from SKILL.md.
- **directory** (string) - Top-level directory name from uploaded files.
- **name** (string) - Human-readable name of the skill version, extracted from SKILL.md.
- **skill_id** (string) - Identifier for the skill this version belongs to.
- **type** (string) - Object type, always `"skill_version"`.
- **version** (string) - Version identifier (Unix epoch timestamp).

#### Response Example
```json
{
  "id": "sv_abc123",
  "created_at": "2024-01-01T12:00:00Z",
  "description": "Initial version of the skill.",
  "directory": "my-skill-v1",
  "name": "My Skill",
  "skill_id": "sk_xyz789",
  "type": "skill_version",
  "version": "1759178010641129"
}
```
```

--------------------------------

### Retrieve Skill Version - Go Client Method

Source: https://platform.claude.com/docs/en/api/go/beta/skills/versions

Calls the Get method on the Anthropic API client to retrieve a specific skill version. Accepts context, version identifier, and parameters, returning a BetaSkillVersionGetResponse or an error. This method makes a GET request to the /v1/skills/{skill_id}/versions/{version} endpoint.

```go
client.Beta.Skills.Versions.Get(ctx, version, params) (*BetaSkillVersionGetResponse, error)
```

--------------------------------

### Retrieve Skill Version - HTTP GET Request

Source: https://platform.claude.com/docs/en/api/python/beta/skills/versions/retrieve

HTTP GET endpoint for retrieving a skill version. The endpoint path includes the skill_id and version as path parameters. Supports optional beta header to specify which beta API versions to use.

```http
GET /v1/skills/{skill_id}/versions/{version}
```

--------------------------------

### Configure Eager Input Streaming for Tool Parameters

Source: https://platform.claude.com/docs/en/api/ruby/messages/batches

Controls the `eager_input_streaming` behavior for a tool. When `true`, input parameters are streamed incrementally and types are inferred on-the-fly. When `false`, streaming is disabled for the tool, even if fine-grained streaming is active.

```Configuration
eager_input_streaming: bool
```

--------------------------------

### GET /v1/organizations/workspaces/{workspace_id}

Source: https://platform.claude.com/docs/en/api/admin/workspaces/retrieve

Retrieve details for a specific workspace using its unique identifier.

```APIDOC
## GET /v1/organizations/workspaces/{workspace_id}

### Description
Get Workspace details by its ID.

### Method
GET

### Endpoint
/v1/organizations/workspaces/{workspace_id}

### Parameters
#### Path Parameters
- **workspace_id** (string) - Required - ID of the Workspace.

### Response
#### Success Response (200)
- **id** (string) - ID of the Workspace.
- **archived_at** (string) - RFC 3339 datetime string indicating when the Workspace was archived, or null if the Workspace is not archived.
- **created_at** (string) - RFC 3339 datetime string indicating when the Workspace was created.
- **data_residency** (object) - Data residency configuration.
- **data_residency.allowed_inference_geos** (array of string or "unrestricted") - Permitted inference geo values. 'unrestricted' means all geos are allowed.
- **data_residency.default_inference_geo** (string) - Default inference geo applied when requests omit the parameter.
- **data_residency.workspace_geo** (string) - Geographic region for workspace data storage. Immutable after creation.
- **display_color** (string) - Hex color code representing the Workspace in the Anthropic Console.
- **name** (string) - Name of the Workspace.
- **type** ("workspace") - Object type. For Workspaces, this is always "workspace".
```

--------------------------------

### Configure AsyncAnthropic with aiohttp HTTP client

Source: https://platform.claude.com/docs/en/api/sdks/python

Use the DefaultAioHttpClient for improved async performance and concurrency compared to the default httpx backend. Requires the anthropic[aiohttp] extra to be installed.

```python
import os
import asyncio
from anthropic import AsyncAnthropic, DefaultAioHttpClient


async def main() -> None:
    async with AsyncAnthropic(
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
        http_client=DefaultAioHttpClient(),
    ) as client:
        message = await client.messages.create(
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": "Hello, Claude",
                }
            ],
            model="claude-opus-4-6",
        )
        print(message.content)


asyncio.run(main())
```

--------------------------------

### Get Message Batch Results - HTTP Request

Source: https://platform.claude.com/docs/en/api/go/messages/batches/results

HTTP GET endpoint for retrieving Message Batch results. Streams results as a JSONL file where each line is a JSON object containing the result of a single request. Requires the message_batch_id path parameter.

```http
GET /v1/messages/batches/{message_batch_id}/results
```

--------------------------------

### List Skills - HTTP GET Request

Source: https://platform.claude.com/docs/en/api/go/beta/skills/list

HTTP GET request to retrieve skills from the API. The endpoint supports query parameters for pagination (limit, page) and filtering (source), plus optional beta version headers for accessing experimental features.

```http
GET /v1/skills
```

--------------------------------

### Configure Clear Tool Uses Context Management

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches/create

Set up context management to clear tool uses when input tokens exceed a threshold. Allows selective clearing of specific tools while preserving others, with minimum token requirements.

```python
class BetaClearToolUses20250919Edit:
    type: Literal["clear_tool_uses_20250919"]
    clear_at_least: Optional[BetaInputTokensClearAtLeast]  # Minimum tokens to clear
    clear_tool_inputs: Optional[Union[bool, List[str], None]]  # Clear all or specific inputs
    exclude_tools: Optional[List[str]]  # Tools to preserve from clearing
    keep: Optional[BetaToolUsesKeep]  # Number of tool uses to retain
    trigger: Optional[Trigger]  # Condition triggering the strategy
```

--------------------------------

### Create Message Batch

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

This snippet demonstrates how to initiate the creation of a batch of messages, allowing multiple message creation requests to be processed concurrently. It includes examples for both the Go client library and a direct HTTP POST request to the API endpoint. Batches can take up to 24 hours to complete.

```Go
client.Beta.Messages.Batches.New(ctx, params) (*BetaMessageBatch, error)
```

```HTTP
POST /v1/messages/batches
```

--------------------------------

### GET /v1/organizations/workspaces/{workspace_id}/members

Source: https://platform.claude.com/docs/en/api/admin/workspaces

Lists all members associated with a specific workspace, with optional pagination.

```APIDOC
## GET /v1/organizations/workspaces/{workspace_id}/members

### Description
Lists all members associated with a specific workspace, with optional pagination.

### Method
GET

### Endpoint
/v1/organizations/workspaces/{workspace_id}/members

### Parameters
#### Path Parameters
- **workspace_id** (string) - Required - ID of the Workspace.

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

### Response
#### Success Response (200)
- **data** (array of WorkspaceMember) - List of WorkspaceMember objects.
  - **type** ("workspace_member") - Object type. For Workspace Members, this is always "workspace_member".
  - **user_id** (string) - ID of the User.
  - **workspace_id** (string) - ID of the Workspace.
  - **workspace_role** ("workspace_user" | "workspace_developer" | "workspace_admin" | "workspace_billing") - Role of the Workspace Member.
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
```json
{
  "data": [
    {
      "type": "workspace_member",
      "user_id": "user_abc123",
      "workspace_id": "workspace_def456",
      "workspace_role": "workspace_user"
    },
    {
      "type": "workspace_member",
      "user_id": "user_xyz789",
      "workspace_id": "workspace_def456",
      "workspace_role": "workspace_admin"
    }
  ],
  "first_id": "user_abc123",
  "has_more": false,
  "last_id": "user_xyz789"
}
```
```

--------------------------------

### Integrate Anthropic Ruby SDK with Google Vertex AI

Source: https://platform.claude.com/docs/en/api/sdks/ruby

This example illustrates how to set up and use the `Anthropic::VertexClient` to interact with the Anthropic Vertex API. It requires the `googleauth` gem and utilizes Google's Application Default Credentials for authentication, providing a seamless way to deploy and manage Anthropic models on Vertex AI.

```ruby
require "anthropic"

anthropic = Anthropic::VertexClient.new(region: "us-east5", project_id: "my-project-id")

message = anthropic.messages.create(
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: "Hello, Claude"
    }
  ],
  model: "claude-opus-4-6"
)

puts(message)
```

--------------------------------

### List Skill Versions via Java SDK and HTTP GET

Source: https://platform.claude.com/docs/en/api/java/beta/skills/versions/list

This snippet demonstrates how to retrieve a list of skill versions using both the Java SDK method and a direct HTTP GET request. It allows specifying a `skillId`, pagination `limit` and `page` tokens, and optional `betas` headers to access experimental features. The response provides detailed metadata for each skill version, including its ID, creation timestamp, description, and associated skill ID.

```java
VersionListPage beta().skills().versions().list(VersionListParams params = VersionListParams.none(), RequestOptions requestOptions = RequestOptions.none())
```

```http
GET /v1/skills/{skill_id}/versions
```

--------------------------------

### List Message Batches - HTTP GET Request

Source: https://platform.claude.com/docs/en/api/csharp/messages/batches/list

HTTP GET endpoint for retrieving paginated list of Message Batches. Query parameters support cursor-based pagination and result limiting. Returns BatchListPageResponse with batch objects, pagination cursors, and metadata.

```http
GET /v1/messages/batches
```

--------------------------------

### Create Skill with File Upload - Go

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Creates a new skill by uploading files and specifying a display title. The function accepts a context, parameters including display title and files (which must include a SKILL.md file), and optional beta version headers. Returns a BetaSkillNewResponse containing the skill ID, creation timestamp, display title, version info, source, and type.

```go
client.Beta.Skills.New(ctx, params) (*BetaSkillNewResponse, error)

// Parameters:
// params BetaSkillNewParams
//   - DisplayTitle param.Field[string]: Human-readable label for the skill
//   - Files param.Field[[]Reader]: Files to upload (must include SKILL.md)
//   - Betas param.Field[[]AnthropicBeta]: Optional beta version headers

// Returns:
// type BetaSkillNewResponse struct {
//   ID string: Unique identifier for the skill
//   CreatedAt string: ISO 8601 timestamp of creation
//   DisplayTitle string: Human-readable label
//   LatestVersion string: Most recent version identifier
//   Source string: "custom" or "anthropic"
//   Type string: Always "skill"
//   UpdatedAt string: ISO 8601 timestamp of last update
// }
```

--------------------------------

### GET /v1/organizations/workspaces

Source: https://platform.claude.com/docs/en/api/admin/workspaces/list

List all workspaces in your organization with support for cursor-based pagination and filtering options. Returns workspace details including configuration, creation timestamps, and data residency settings.

```APIDOC
## GET /v1/organizations/workspaces

### Description
List Workspaces - Retrieve a paginated list of all workspaces in your organization with optional filtering and cursor-based pagination.

### Method
GET

### Endpoint
`/v1/organizations/workspaces`

### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **include_archived** (boolean) - Optional - Whether to include Workspaces that have been archived in the response.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

### Response
#### Success Response (200)
- **data** (array of Workspace) - Array of workspace objects
  - **id** (string) - ID of the Workspace
  - **archived_at** (string) - RFC 3339 datetime string indicating when the Workspace was archived, or `null` if not archived
  - **created_at** (string) - RFC 3339 datetime string indicating when the Workspace was created
  - **data_residency** (object) - Data residency configuration
    - **allowed_inference_geos** (array of string or "unrestricted") - Permitted inference geo values. 'unrestricted' means all geos are allowed
    - **default_inference_geo** (string) - Default inference geo applied when requests omit the parameter
    - **workspace_geo** (string) - Geographic region for workspace data storage. Immutable after creation
  - **display_color** (string) - Hex color code representing the Workspace in the Anthropic Console
  - **name** (string) - Name of the Workspace
  - **type** (string) - Object type. For Workspaces, this is always `"workspace"`
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page
- **has_more** (boolean) - Indicates if there are more results in the requested page direction
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page

### Response Example
```json
{
  "data": [
    {
      "id": "workspace_123",
      "archived_at": null,
      "created_at": "2024-01-15T10:30:00Z",
      "data_residency": {
        "allowed_inference_geos": ["us-east-1", "eu-west-1"],
        "default_inference_geo": "us-east-1",
        "workspace_geo": "us-east-1"
      },
      "display_color": "#FF5733",
      "name": "Production Workspace",
      "type": "workspace"
    }
  ],
  "first_id": "workspace_123",
  "has_more": false,
  "last_id": "workspace_123"
}
```
```

--------------------------------

### Retrieve Message Batch - HTTP GET Request

Source: https://platform.claude.com/docs/en/api/python/messages/batches/retrieve

Retrieve a Message Batch using a direct HTTP GET request to the Claude API. Replace {message_batch_id} with the actual batch ID. The endpoint is idempotent and can be called repeatedly to poll for batch completion status.

```http
GET /v1/messages/batches/{message_batch_id}
```

--------------------------------

### GET /v1/organizations/users

Source: https://platform.claude.com/docs/en/api/admin

Lists all users within the organization, with options for pagination and filtering by email.

```APIDOC
## GET /v1/organizations/users

### Description
List Users

### Method
GET

### Endpoint
/v1/organizations/users

### Parameters
#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **email** (string) - Optional - Filter by user email.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

### Request Example
{}

### Response
#### Success Response (200)
- **data** (array of User) - List of User objects.
  - **id** (string) - ID of the User.
  - **added_at** (string) - RFC 3339 datetime string indicating when the User joined the Organization.
  - **email** (string) - Email of the User.
  - **name** (string) - Name of the User.
  - **role** (string) - Organization role of the User. Possible values: "user", "developer", "billing", "admin", "claude_code_user", "managed".
  - **type** (string) - Object type. For Users, this is always "user".
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
{
  "data": [
    {
      "id": "user_abc123",
      "added_at": "2023-01-01T12:00:00Z",
      "email": "user1@example.com",
      "name": "User One",
      "role": "user",
      "type": "user"
    },
    {
      "id": "user_def456",
      "added_at": "2023-01-02T13:00:00Z",
      "email": "user2@example.com",
      "name": "User Two",
      "role": "developer",
      "type": "user"
    }
  ],
  "first_id": "user_abc123",
  "has_more": true,
  "last_id": "user_def456"
}
```

--------------------------------

### List Message Batches API (Go Client and HTTP)

Source: https://platform.claude.com/docs/en/api/go/messages/batches/list

This snippet presents the Go client method signature and the HTTP GET endpoint for retrieving a list of message batches. The Go method `client.Messages.Batches.List` takes a context and query parameters, returning a paginated result and an error. The HTTP endpoint `GET /v1/messages/batches` is the underlying RESTful interface.

```go
client.Messages.Batches.List(ctx, query) (*Page[MessageBatch], error)
```

```http
GET /v1/messages/batches
```

--------------------------------

### Structure Claude API Messages with JSON Examples

Source: https://platform.claude.com/docs/en/api/csharp/messages/create

These JSON examples demonstrate various ways to construct the `messages` parameter for the Claude API. They cover single user prompts, multi-turn conversations between user and assistant, partially completed assistant responses, and equivalent representations of message content using either a simple string or an array of text content blocks. These structures are crucial for defining the conversational context for the model.

```json
[
  {"role": "user", "content": "Hello, Claude"}
]
```

```json
[
  {"role": "user", "content": "Hello there."},
  {"role": "assistant", "content": "Hi, I'm Claude. How can I help you?"},
  {"role": "user", "content": "Can you explain LLMs in plain English?"}
]
```

```json
[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]
```

```json
{"role": "user", "content": "Hello, Claude"}
```

```json
{"role": "user", "content": [{"type": "text", "text": "Hello, Claude"}]}
```

--------------------------------

### POST /messages - Tool Choice Configuration

Source: https://platform.claude.com/docs/en/api/messages/create

Configure how Claude should use provided tools. Supports automatic selection, any available tool, specific tool selection, or disabling tool use entirely. Includes options to control parallel tool execution.

```APIDOC
## Tool Choice Configuration

### Description
Configure how the model should use provided tools. The model can automatically decide, use any available tool, use a specific tool, or not use tools at all.

### Parameters

#### Request Body
- **tool_choice** (object) - Optional - Tool usage strategy
  - **ToolChoiceAuto** (object) - Model automatically decides whether to use tools
    - **type** (string) - Required - Value: "auto"
    - **disable_parallel_tool_use** (boolean) - Optional - Disable parallel tool execution. Defaults to false. If true, model outputs at most one tool use.
  - **ToolChoiceAny** (object) - Model will use any available tools
    - **type** (string) - Required - Value: "any"
    - **disable_parallel_tool_use** (boolean) - Optional - Disable parallel tool execution. Defaults to false. If true, model outputs exactly one tool use.
  - **ToolChoiceTool** (object) - Model will use a specific tool
    - **type** (string) - Required - Value: "tool"
    - **name** (string) - Required - The name of the tool to use
    - **disable_parallel_tool_use** (boolean) - Optional - Disable parallel tool execution. Defaults to false. If true, model outputs exactly one tool use.
  - **ToolChoiceNone** (object) - Model will not use tools
    - **type** (string) - Required - Value: "none"

### Request Examples

#### Auto Tool Choice
```json
{
  "tool_choice": {
    "type": "auto",
    "disable_parallel_tool_use": false
  }
}
```

#### Specific Tool Choice
```json
{
  "tool_choice": {
    "type": "tool",
    "name": "get_stock_price",
    "disable_parallel_tool_use": true
  }
}
```

#### No Tool Use
```json
{
  "tool_choice": {
    "type": "none"
  }
}
```
```

--------------------------------

### Retrieve Model Information via HTTP GET Request

Source: https://platform.claude.com/docs/en/api/ruby/models/retrieve

This snippet illustrates the HTTP GET endpoint for retrieving details of a specific model. The `model_id` is passed as a path parameter in the URL. This API call returns comprehensive information about the requested model, including its ID, creation timestamp, and display name.

```http
get /v1/models/{model_id}
```

--------------------------------

### Create Message with Claude API - C#

Source: https://platform.claude.com/docs/en/api/client-sdks

Initialize the Anthropic client and create a message using async/await pattern. Demonstrates C# collection initializer syntax and message parameter configuration.

```csharp
using Anthropic;

var client = new AnthropicClient();

var message = await client.Messages.Create(new MessageCreateParams
{
    Model = "claude-opus-4-6",
    MaxTokens = 1024,
    Messages = [new() { Role = Role.User, Content = "Hello, Claude" }]
});
Console.WriteLine(message.Content);
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/models/list

This endpoint retrieves a paginated list of available models. The response includes model details and pagination cursors to navigate through the results.

```APIDOC
## GET /v1/models

### Description
List available models. The Models API response can be used to determine which models are available for use in the API. More recently released models are listed first.

### Method
GET

### Endpoint
/v1/models

### Parameters

#### Path Parameters
No path parameters.

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **anthropic-beta** (array of AnthropicBeta) - Optional - Optional header to specify the beta version(s) you want to use.
  - **UnionMember0** (string)
  - **UnionMember1** (string) - Enum values: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01"

#### Request Body
No request body.

### Request Example
{}

### Response

#### Success Response (200)
- **data** (array of ModelInfo) - List of model objects.
  - **id** (string) - Unique model identifier.
  - **created_at** (string) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
  - **display_name** (string) - A human-readable name for the model.
  - **type** (string) - Object type. For Models, this is always `"model"`.
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
{
  "data": [
    {
      "id": "claude-3-opus-20240229",
      "created_at": "2024-02-29T18:30:00Z",
      "display_name": "Claude 3 Opus",
      "type": "model"
    },
    {
      "id": "claude-3-sonnet-20240229",
      "created_at": "2024-02-29T18:30:00Z",
      "display_name": "Claude 3 Sonnet",
      "type": "model"
    }
  ],
  "first_id": "claude-3-opus-20240229",
  "has_more": true,
  "last_id": "claude-3-sonnet-20240229"
}
```

--------------------------------

### System Prompt Configuration

Source: https://platform.claude.com/docs/en/api/csharp/messages/batches/create

Provides context and instructions to Claude through a system prompt. Allows specification of goals, roles, and behavioral guidelines for the model.

```APIDOC
## System Parameter

### Description
System prompt providing context and instructions to Claude. A system prompt is a way of specifying a particular goal or role for the model.

### Parameter Name
`System`

### Type
String | IReadOnlyList<TextBlockParam>

### Supported Formats

#### Simple String Format
```
"You are a helpful assistant that specializes in Python programming."
```

#### TextBlockParam Format
Array of text blocks with optional cache control and citations.

### TextBlockParam Properties
- **Text** (string) - Required - The text content of the system prompt
- **Type** (string) - Required - Constant value: `"text"`
- **CacheControl** (CacheControlEphemeral) - Optional - Cache control breakpoint configuration
- **Citations** (IReadOnlyList<TextCitationParam>) - Optional - Citation information

### Related Documentation
See [guide to system prompts](https://docs.claude.com/en/docs/system-prompts) for best practices and examples.
```

--------------------------------

### Define and run tools as Python functions with tool_runner

Source: https://platform.claude.com/docs/en/api/sdks/python

Demonstrates how to create a Python function that acts as a tool and use the SDK's tool_runner to automatically handle tool calls. The example defines a get_weather function that returns weather data and passes it to the tool_runner with user messages. The runner automatically manages tool invocation and returns processed messages.

```python
import json
from anthropic import Anthropic

client = Anthropic()


def get_weather(location: str) -> str:
    """Get the weather for a given location.

    Args:
        location: The city and state, e.g. San Francisco, CA
    """
    return json.dumps(
        {
            "location": location,
            "temperature": "68°F",
            "condition": "Sunny",
        }
    )


# Use the tool_runner to automatically handle tool calls
runner = client.beta.messages.tool_runner(
    max_tokens=1024,
    model="claude-opus-4-6",
    tools=[get_weather],
    messages=[
        {"role": "user", "content": "What is the weather in SF?"},
    ],
)
for message in runner:
    print(message)
```

--------------------------------

### Message Start Event

Source: https://platform.claude.com/docs/en/api/python/messages

The message_start event type used in streaming responses to indicate the beginning of a message stream from the Claude API.

```APIDOC
## Message Start Event

### Description
Event type that marks the beginning of a message stream in Claude API streaming responses.

### Event Type
- **type**: `Literal["message_start"]`
- **Value**: `"message_start"`

### Usage
This event is emitted at the start of a streaming message response, before any content or delta events are sent.
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/python/beta/skills/list

Lists available skills, with options to filter by source, limit results, and paginate through them.

```APIDOC
## GET /v1/skills

### Description
Lists available skills, with options to filter by source, limit results, and paginate through them.

### Method
GET

### Endpoint
/v1/skills

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **limit** (Optional[int]) - Optional - Number of results to return per page. Maximum value is 100. Defaults to 20.
- **page** (Optional[str]) - Optional - Pagination token for fetching a specific page of results. Pass the value from a previous response's `next_page` field to get the next page of results.
- **source** (Optional[str]) - Optional - Filter skills by source. If provided, only skills from the specified source will be returned: "custom": only return user-created skills, "anthropic": only return Anthropic-created skills
- **betas** (Optional[List[AnthropicBetaParam]]) - Optional - Optional header to specify the beta version(s) you want to use. Possible values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", etc.

#### Request Body
(None)

### Response
#### Success Response (200)
- **id** (str) - Unique identifier for the skill. The format and length of IDs may change over time.
- **created_at** (str) - ISO 8601 timestamp of when the skill was created.
- **display_title** (Optional[str]) - Display title for the skill. This is a human-readable label that is not included in the prompt sent to the model.
- **latest_version** (Optional[str]) - The latest version identifier for the skill. This represents the most recent version of the skill that has been created.
- **source** (str) - Source of the skill. This may be one of the following values: "custom": the skill was created by a user, "anthropic": the skill was created by Anthropic
- **type** (str) - Object type. For Skills, this is always "skill".
- **updated_at** (str) - ISO 8601 timestamp of when the skill was last updated.

#### Response Example
```json
{
  "data": [
    {
      "id": "skill_abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "display_title": "My Custom Skill",
      "latest_version": "v1.0",
      "source": "custom",
      "type": "skill",
      "updated_at": "2024-01-01T12:00:00Z"
    },
    {
      "id": "skill_def456",
      "created_at": "2024-02-15T10:30:00Z",
      "display_title": "Anthropic Provided Skill",
      "latest_version": "v2.1",
      "source": "anthropic",
      "type": "skill",
      "updated_at": "2024-02-15T10:30:00Z"
    }
  ],
  "next_page": "eyJsaW1pdCI6MjAsIm9mZnNldCI6MjB9"
}
```
```

--------------------------------

### Create Message with Claude API - Go

Source: https://platform.claude.com/docs/en/api/client-sdks

Initialize the Anthropic client and create a message with context-based cancellation support. Demonstrates functional options pattern for parameter configuration.

```go
client := anthropic.NewClient()

message, _ := client.Messages.New(context.Background(), anthropic.MessageNewParams{
	Model:     anthropic.ModelClaudeOpus4_6,
	MaxTokens: 1024,
	Messages: []anthropic.MessageParam{
		anthropicNewUserMessage(anthropic.NewTextBlock("Hello, Claude")),
	},
})
fmt.Println(message.Content)
```

--------------------------------

### Configure Text Editor Tool with Deferred Loading

Source: https://platform.claude.com/docs/en/api/java/beta/messages/count_tokens

Sets up a text editor tool that can defer loading until needed via tool_reference from tool search. Includes optional input examples and strict schema validation for tool names and inputs.

```java
Optional<Boolean> deferLoading = true;
Optional<List<InputExample>> inputExamples = new ArrayList<>();
Optional<Boolean> strict = true;
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/overview

Retrieve information about uploaded files or the files themselves. This allows for managing and accessing files previously uploaded to the API.

```APIDOC
## GET /v1/files

### Description
Retrieve information about uploaded files or the files themselves.

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Path Parameters
(None detailed in the provided text, but could include a file ID for specific file retrieval)

#### Query Parameters
(None detailed in the provided text)

#### Request Body
(Not applicable for GET requests)

### Request Example
(No request body for GET)

### Response
#### Success Response (200)
(Response structure not explicitly detailed in the provided text, but likely includes file metadata or the file content.)

#### Response Example
(Response example not explicitly detailed in the provided text)
```

--------------------------------

### TOOL_DEFINITION /client_tools

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches/create

Explains the core components of a tool definition (`name`, `description`, `input_schema`) and demonstrates how the Claude model uses tools via `tool_use` and `tool_result` content blocks.

```APIDOC
## TOOL_DEFINITION /client_tools

### Description
Overview of defining and interacting with client tools for Claude AI models. This section covers the basic structure of a tool definition and illustrates the model's interaction using `tool_use` and `tool_result` content blocks.

### Method
DEFINITION

### Endpoint
/client_tools

### Parameters
#### Request Body
- **name** (string) - Required - Name of the tool. This is how the tool will be called by the model.
- **description** (string) - Optional - Strongly-recommended description of the tool's purpose and usage.
- **input_schema** (object) - Required - JSON schema for the tool's input shape that the model will produce in `tool_use` output content blocks.

### Request Example
```json
[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
```

### Response
#### Success Response (Model Tool Use)
- **type** (string) - Description: Indicates the content block type, typically "tool_use".
- **id** (string) - Description: A unique identifier for this specific tool use.
- **name** (string) - Description: The name of the tool being invoked by the model.
- **input** (object) - Description: The input parameters generated by the model for the tool, conforming to the tool's `input_schema`.

#### Response Example
```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
```

#### Success Response (User Tool Result)
- **type** (string) - Description: Indicates the content block type, typically "tool_result".
- **tool_use_id** (string) - Description: The ID of the `tool_use` block this result corresponds to.
- **content** (string) - Description: The result or output from the execution of the tool.

#### Response Example
```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```
```

--------------------------------

### Tool Definition

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches/create

Explains how to define client-side tools for the model, including their name, description, and the JSON schema for their input, along with examples of tool definition and usage.

```APIDOC
## Tool Definition

### Description
This section describes how to define custom client-side tools that the model can use. Tool definitions include their name, an optional description, and a JSON schema for the expected input.

### Parameters
#### Request Body (Conceptual, as part of a larger API request)
- **tools** (array of objects) - Optional - Definitions of tools that the model may use.

#### BetaTool Object
- **name** (string) - Required - Name of the tool. This is how the tool will be called by the model and in `tool_use` blocks.
- **description** (string) - Optional - Strongly-recommended description of the tool.
- **input_schema** (object) - Required - [JSON schema](https://json-schema.org/draft/2020-12) for this tool's input. This defines the shape of the `input` that your tool accepts and that the model will produce.
  - **type** (string) - Constant - `object`
  - **properties** (object) - Optional - Defines the properties of the input object.
  - **required** (array of strings) - Optional - A list of required property names.
- **allowedCallers** (array of strings) - Optional - Specifies callers allowed to invoke the tool.
  - `DIRECT`
  - `CODE_EXECUTION_20250825`
- **cacheControl** (object) - Optional - Create a cache control breakpoint at this content block.
  - **type** (string) - Constant - `ephemeral`
  - **ttl** (string) - Optional - The time-to-live for the cache control breakpoint. Defaults to `5m`.
    - `5m` (5 minutes)
    - `1h` (1 hour)
- **deferLoading** (boolean) - Optional - If `true`, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search.

### Request Example (Tool Definition)
```json
[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
```

### Response Example (Tool Use by Model)
```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
```

### Subsequent Request Example (Tool Result to Model)
```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```
```

--------------------------------

### Tool Use Configuration and Definition

Source: https://platform.claude.com/docs/en/api/messages

This section describes the data structures for `tool_choice` and `tools` parameters, which allow users to specify how the model should use tools and to define the tools themselves, including their schema and behavior.

```APIDOC
## Tool Use Configuration and Definition

### Description
This document outlines the `tool_choice` and `tools` parameters used in the Anthropic Claude API. These parameters enable fine-grained control over how the model interacts with external tools, allowing users to specify tool usage preferences and define the structure and behavior of available tools.

### Method
N/A (These are parameters within a larger API request, typically for message generation or chat completion.)

### Endpoint
N/A (These are parameters within a larger API request, not an endpoint themselves.)

### Parameters
#### Request Body (Conceptual - part of a larger API request, e.g., messages API)

- **tool_choice** (object) - Optional - Specifies how the model should use tools.
  - **type** (string) - Required - Can be `"any"`, `"tool"`, or `"none"`.
  - **name** (string) - Required if `type` is `"tool"` - The name of the tool to use.
  - **disable_parallel_tool_use** (boolean) - Optional - Defaults to `false`. If `true`, the model outputs exactly one tool use. Applicable when `type` is `"any"` or `"tool"`.

- **tools** (array of Tool) - Optional - Definitions of tools that the model may use.
  - **Tool** (object) - Definition of a single tool.
    - **name** (string) - Required - Name of the tool.
    - **description** (string) - Optional - Description of what this tool does.
    - **input_schema** (object) - Required - JSON schema for the tool's input.
      - **type** (string) - Required - Must be `"object"`.
      - **properties** (map[unknown]) - Optional - Defines the properties of the tool's input.
      - **required** (array of string) - Optional - List of required input properties.
    - **cache_control** (object) - Optional - Create a cache control breakpoint.
      - **type** (string) - Required - Must be `"ephemeral"`.
      - **ttl** (string) - Optional - Time-to-live for the cache. Can be `"5m"` or `"1h"`. Defaults to `"5m"`.

### Request Example (Defining tools in a message API call)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the S&P 500 at today?"
    }
  ],
  "tools": [
    {
      "name": "get_stock_price",
      "description": "Get the current stock price for a given ticker symbol.",
      "input_schema": {
        "type": "object",
        "properties": {
          "ticker": {
            "type": "string",
            "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
          }
        },
        "required": ["ticker"]
      }
    }
  ],
  "tool_choice": {
    "type": "any"
  }
}
```

### Response
#### Success Response (200) - Model requests tool use
- **content** (array) - Array of content blocks, including `tool_use`.
  - **tool_use** (object) - Represents the model's request to use a tool.
    - **type** (string) - Value is `"tool_use"`.
    - **id** (string) - Unique identifier for this tool use.
    - **name** (string) - The name of the tool requested.
    - **input** (object) - The input parameters for the tool.

#### Response Example (Model outputting tool_use)
```json
{
  "id": "msg_01D7FLrfh4GYq7yT1ULFeyMV",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
      "name": "get_stock_price",
      "input": { "ticker": "^GSPC" }
    }
  ],
  "model": "claude-3-opus-20240229",
  "stop_reason": "tool_use",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50
  }
}
```

#### Subsequent Request Example (Returning tool_result)
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the S&P 500 at today?"
    },
    {
      "role": "assistant",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
          "name": "get_stock_price",
          "input": { "ticker": "^GSPC" }
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
          "content": "259.75 USD"
        }
      ]
    }
  ],
  "model": "claude-3-opus-20240229",
  "max_tokens": 1024
}
```
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches

List all Message Batches within a Workspace. Most recently created batches are returned first.

```APIDOC
## GET /v1/messages/batches

### Description
List all Message Batches within a Workspace. Most recently created batches are returned first.

### Method
GET

### Endpoint
/v1/messages/batches

### Parameters
#### Path Parameters

#### Query Parameters

#### Request Body

### Request Example
{}

### Response
#### Success Response (200)
- **[array of BetaMessageBatch objects]** - A list of Message Batch objects.
  - **id** (str) - Unique object identifier. The format and length of IDs may change over time.
  - **archived_at** (Optional[datetime]) - RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.
  - **cancel_initiated_at** (Optional[datetime]) - RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.
  - **created_at** (datetime) - RFC 3339 datetime string representing the time at which the Message Batch was created.
  - **ended_at** (Optional[datetime]) - RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends. Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.
  - **expires_at** (datetime) - RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.
  - **processing_status** (Literal["in_progress", "canceling", "ended"]) - Processing status of the Message Batch.
    - `"in_progress"`
    - `"canceling"`
    - `"ended"`
  - **request_counts** (BetaMessageBatchRequestCounts) - Tallies requests within the Message Batch, categorized by their status. Requests start as `processing` and move to one of the other statuses only once processing of the entire batch ends. The sum of all values always matches the total number of requests in the batch.
    - **request_counts.canceled** (int) - Number of requests in the Message Batch that have been canceled. This is zero until processing of the entire Message Batch has ended.
    - **request_counts.errored** (int) - Number of requests in the Message Batch that encountered an error. This is zero until processing of the entire Message Batch has ended.
    - **request_counts.expired** (int) - Number of requests in the Message Batch that have expired. This is zero until processing of the entire Message Batch has ended.
    - **request_counts.processing** (int) - Number of requests in the Message Batch that are processing.
    - **request_counts.succeeded** (int) - Number of requests in the Message Batch that have completed successfully. This is zero until processing of the entire Message Batch has ended.
  - **results_url** (Optional[str]) - URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends. Results in the file are not guaranteed to be in the same order as requests. Use the `custom_id` field to match results to requests.
  - **type** (Literal["message_batch"]) - Object type. For Message Batches, this is always `"message_batch"`.
    - `"message_batch"`

#### Response Example
[
  {
    "id": "mb_456",
    "archived_at": null,
    "cancel_initiated_at": null,
    "created_at": "2024-01-02T10:00:00Z",
    "ended_at": "2024-01-02T10:02:00Z",
    "expires_at": "2024-01-03T10:00:00Z",
    "processing_status": "ended",
    "request_counts": {
      "canceled": 0,
      "errored": 0,
      "expired": 0,
      "processing": 0,
      "succeeded": 5
    },
    "results_url": "https://example.com/results/mb_456.jsonl",
    "type": "message_batch"
  },
  {
    "id": "mb_789",
    "archived_at": null,
    "cancel_initiated_at": null,
    "created_at": "2024-01-01T09:00:00Z",
    "ended_at": null,
    "expires_at": "2024-01-02T09:00:00Z",
    "processing_status": "in_progress",
    "request_counts": {
      "canceled": 0,
      "errored": 0,
      "expired": 0,
      "processing": 10,
      "succeeded": 0
    },
    "results_url": null,
    "type": "message_batch"
  }
]
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/go/beta/models

Lists all available models, providing details such as ID, creation date, and display name. Supports pagination and beta version filtering.

```APIDOC
## GET /v1/models

### Description
List available models. The Models API response can be used to determine which models are available for use in the API. More recently released models are listed first.

### Method
GET

### Endpoint
/v1/models

### Parameters
#### Query Parameters
- **AfterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **BeforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **Limit** (int64) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **Betas** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Possible values include: `message-batches-2024-09-24`, `prompt-caching-2024-07-31`, `computer-use-2024-10-22`, `computer-use-2025-01-24`, `pdfs-2024-09-25`, `token-counting-2024-11-01`, `token-efficient-tools-2025-02-19`, `output-128k-2025-02-19`, `files-api-2025-04-14`, `mcp-client-2025-04-04`, `mcp-client-2025_11_20`, `dev-full-thinking-2025-05-14`, `interleaved-thinking-2025-05-14`, `code-execution-2025-05-22`, `extended-cache-ttl-2025-04-11`, `context-1m-2025-08-07`, `context-management-2025-06-27`, `model-context-window-exceeded-2025-08-26`, `skills-2025-10-02`, `fast-mode-2026-02-01`.

### Request Example
{}

### Response
#### Success Response (200)
- **data** (array of object) - A list of model information objects.
  - **ID** (string) - Unique model identifier.
  - **CreatedAt** (Time) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
  - **DisplayName** (string) - A human-readable name for the model.
  - **Type** (string) - Object type. For Models, this is always `"model"`.
- **limit** (int) - The maximum number of items returned per page.
- **has_more** (boolean) - Indicates if there are more results available.

#### Response Example
```json
{
  "data": [
    {
      "ID": "claude-3-opus-20240229",
      "CreatedAt": "2024-02-29T12:00:00Z",
      "DisplayName": "Claude 3 Opus",
      "Type": "model"
    },
    {
      "ID": "claude-3-sonnet-20240229",
      "CreatedAt": "2024-02-29T12:00:00Z",
      "DisplayName": "Claude 3 Sonnet",
      "Type": "model"
    }
  ],
  "limit": 20,
  "has_more": true
}
```
```

--------------------------------

### Retrieve File Metadata - HTTP GET Request

Source: https://platform.claude.com/docs/en/api/ruby/beta/files/retrieve_metadata

HTTP GET endpoint for retrieving file metadata. Requires file_id path parameter and supports optional anthropic_beta header to specify beta feature versions. Returns FileMetadata JSON object with file details including id, created_at, filename, mime_type, size_bytes, type, and downloadable status.

```http
GET /v1/files/{file_id}
```

--------------------------------

### Tool Configuration: BetaMCPToolset

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Defines the configuration for a group of tools from an MCP server, allowing global and per-tool overrides for settings like defer_loading and enabled status.

```APIDOC
## BetaMCPToolset Configuration

### Description
This object defines the configuration for a group of tools managed by an MCP server. It allows for global settings and specific overrides for individual tools regarding their enabled status and loading behavior.

### Object Structure
`BetaMCPToolset = object { mcp_server_name, type, cache_control, configs, default_config }`

### Properties
- **mcp_server_name** (string) - Required - Name of the MCP server to configure tools for.
- **type** (string) - Required - Type identifier for the MCP toolset.
  - Allowed values: `"mcp_toolset"`
- **cache_control** (BetaCacheControlEphemeral object) - Optional - Configuration for a cache control breakpoint.
  - **type** (string) - Required - Type of cache control.
    - Allowed values: `"ephemeral"`
  - **ttl** (string) - Optional - The time-to-live for the cache control breakpoint. Defaults to `5m`.
    - Allowed values: `"5m"` (5 minutes), `"1h"` (1 hour)
- **configs** (map[BetaMCPToolConfig]) - Optional - Configuration overrides for specific tools, keyed by tool name.
  - **defer_loading** (boolean) - Optional - If true, the specific tool will not be included in the initial system prompt.
  - **enabled** (boolean) - Optional - If true, the specific tool is enabled.
- **default_config** (BetaMCPToolDefaultConfig object) - Optional - Default configuration applied to all tools from this server.
  - **defer_loading** (boolean) - Optional - Default `defer_loading` setting for all tools in the set.
  - **enabled** (boolean) - Optional - Default `enabled` setting for all tools in the set.

### Example Configuration
```json
{
  "mcp_server_name": "my_mcp_server",
  "type": "mcp_toolset",
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  },
  "configs": {
    "tool_A": {
      "defer_loading": true
    },
    "tool_B": {
      "enabled": false
    }
  },
  "default_config": {
    "defer_loading": false,
    "enabled": true
  }
}
```
```

--------------------------------

### GET /v1/organizations/workspaces

Source: https://platform.claude.com/docs/en/api/admin/workspaces

List all workspaces within an organization with pagination support. Optionally filter to include archived workspaces and control the number of results returned.

```APIDOC
## GET /v1/organizations/workspaces

### Description
List all Workspaces within an organization with pagination support.

### Method
GET

### Endpoint
/v1/organizations/workspaces

### Parameters
#### Query Parameters
- **limit** (number) - Optional - Number of items to return per page. Defaults to 20. Ranges from 1 to 1000.
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **include_archived** (boolean) - Optional - Whether to include Workspaces that have been archived in the response.

### Response
#### Success Response (200)
Returns an array of Workspace objects, each containing:
- **id** (string) - ID of the Workspace.
- **name** (string) - Name of the Workspace.
- **created_at** (string) - RFC 3339 datetime string indicating when the Workspace was created.
- **archived_at** (string) - RFC 3339 datetime string indicating when the Workspace was archived, or null if not archived.
- **display_color** (string) - Hex color code representing the Workspace in the Anthropic Console.
- **data_residency** (object) - Data residency configuration.
  - **workspace_geo** (string) - Geographic region for workspace data storage.
  - **allowed_inference_geos** (array of string or "unrestricted") - Permitted inference geo values.
  - **default_inference_geo** (string) - Default inference geo applied when requests omit the parameter.
- **type** (string) - Object type. For Workspaces, this is always "workspace".

#### Response Example
{
  "data": [
    {
      "id": "ws_123abc",
      "name": "My Workspace",
      "created_at": "2024-01-15T10:30:00Z",
      "archived_at": null,
      "display_color": "#FF5733",
      "data_residency": {
        "workspace_geo": "us",
        "allowed_inference_geos": "unrestricted",
        "default_inference_geo": "global"
      },
      "type": "workspace"
    },
    {
      "id": "ws_456def",
      "name": "Another Workspace",
      "created_at": "2024-01-10T14:20:00Z",
      "archived_at": null,
      "display_color": "#3366FF",
      "data_residency": {
        "workspace_geo": "eu",
        "allowed_inference_geos": ["eu", "us"],
        "default_inference_geo": "eu"
      },
      "type": "workspace"
    }
  ]
}
```

--------------------------------

### Handle paginated list responses with Anthropic PHP SDK

Source: https://platform.claude.com/docs/en/api/sdks/php

This PHP example illustrates how to work with paginated list responses from the Anthropic API. It demonstrates fetching a page of items, iterating through items on the current page, and using `pagingEachItem()` to automatically fetch and iterate through all items across all pages.

```php
<?php

use Anthropic\Client;

$client = new Client(
  apiKey: getenv("ANTHROPIC_API_KEY") ?: "my-anthropic-api-key"
);

$page = $client->beta->messages->batches->list();

var_dump($page);

// fetch items from the current page
foreach ($page->getItems() as $item) {
  var_dump($item->id);
}
// make additional network requests to fetch items from all pages, including and after the current page
foreach ($page->pagingEachItem() as $item) {
  var_dump($item->id);
}
```

--------------------------------

### GET /batches

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/batches/list

Retrieves a paginated list of message batches. Each batch contains details about its processing status, request counts, and results URL.

```APIDOC
## GET /batches\n\n### Description\nRetrieves a paginated list of message batches. Each batch contains details about its processing status, request counts, and results URL.\n\n### Method\nGET\n\n### Endpoint\n/batches\n\n### Parameters\n#### Path Parameters\nNone\n\n#### Query Parameters\n- **limit** (integer) - Optional - Maximum number of items to return. Default is 20, maximum is 100.\n- **after_id** (string) - Optional - Return results after this ID.\n- **before_id** (string) - Optional - Return results before this ID.\n\n#### Request Body\nNone\n\n### Request Example\n```json\n{}\n```\n\n### Response\n#### Success Response (200)\n- **Data** (array of BetaMessageBatch) - Required - A list of message batch objects.\n  - **ID** (string) - Required - Unique object identifier. The format and length of IDs may change over time.\n  - **ArchivedAt** (DateTimeOffset?) - Optional - RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.\n  - **CancelInitiatedAt** (DateTimeOffset?) - Optional - RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.\n  - **CreatedAt** (DateTimeOffset) - Required - RFC 3339 datetime string representing the time at which the Message Batch was created.\n  - **EndedAt** (DateTimeOffset?) - Optional - RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends. Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.\n  - **ExpiresAt** (DateTimeOffset) - Required - RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.\n  - **ProcessingStatus** (ProcessingStatus) - Required - Processing status of the Message Batch.\n    - `"in_progress"` - InProgress\n    - `"canceling"` - Canceling\n    - `"ended"` - Ended\n  - **RequestCounts** (BetaMessageBatchRequestCounts) - Required - Tallies requests within the Message Batch, categorized by their status.\n    - **Canceled** (Long) - Required - Number of requests in the Message Batch that have been canceled. This is zero until processing of the entire Message Batch has ended.\n    - **Errored** (Long) - Required - Number of requests in the Message Batch that encountered an error. This is zero until processing of the entire Message Batch has ended.\n    - **Expired** (Long) - Required - Number of requests in the Message Batch that have expired. This is zero until processing of the entire Message Batch has ended.\n    - **Processing** (Long) - Required - Number of requests in the Message Batch that are processing.\n    - **Succeeded** (Long) - Required - Number of requests in the Message Batch that have completed successfully. This is zero until processing of the entire Message Batch has ended.\n  - **ResultsUrl** (string?) - Optional - URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends. Results in the file are not guaranteed to be in the same order as requests. Use the `custom_id` field to match results to requests.\n  - **Type** (string) - Constant - Object type. For Message Batches, this is always `"message_batch"`.\n- **FirstID** (string?) - Optional - First ID in the `data` list. Can be used as the `before_id` for the previous page.\n- **HasMore** (Boolean) - Required - Indicates if there are more results in the requested page direction.\n- **LastID** (string?) - Optional - Last ID in the `data` list. Can be used as the `after_id` for the next page.\n\n#### Response Example\n```json\n{\n  "Data": [\n    {\n      "ID": "mb_example_id",\n      "ArchivedAt": null,\n      "CancelInitiatedAt": null,\n      "CreatedAt": "2023-10-27T10:00:00Z",\n      "EndedAt": "2023-10-27T10:30:00Z",\n      "ExpiresAt": "2023-10-28T10:00:00Z",\n      "ProcessingStatus": "ended",\n      "RequestCounts": {\n        "Canceled": 0,\n        "Errored": 5,\n        "Expired": 0,\n        "Processing": 0,\n        "Succeeded": 95\n      },\n      "ResultsUrl": "https://example.com/results/mb_example_id.jsonl",\n      "Type": "message_batch"\n    }\n  ],\n  "FirstID": "mb_example_id",\n  "HasMore": false,\n  "LastID": "mb_example_id"\n}\n```
```

--------------------------------

### Configure MCP Server in Go

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

Defines an MCP (Model Context Protocol) server configuration for use in API requests. Includes server URL, optional authorization token, and tool configuration settings to enable or restrict specific tools.

```go
type BetaRequestMCPServerURLDefinition struct {
  Name string
  Type URL
  URL string
  AuthorizationToken string
  ToolConfiguration BetaRequestMCPServerToolConfiguration
}

type BetaRequestMCPServerToolConfiguration struct {
  AllowedTools []string
  Enabled bool
}

const URLURL URL = "url"
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version}

Source: https://platform.claude.com/docs/en/api/java/beta/skills

Retrieves a specific skill version by its skill ID and version identifier.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
Retrieves a specific skill version by its skill ID and version identifier.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions/{version}

### Parameters
#### Path Parameters
- **skill_id** (String) - Required - Unique identifier for the skill.
- **version** (String) - Required - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., `"1759178010641129"`).

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **id** (String) - Unique identifier for the skill version.
- **createdAt** (String) - ISO 8601 timestamp of when the skill version was created.
- **description** (String) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **directory** (String) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
- **name** (String) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **skillId** (String) - Identifier for the skill that this version belongs to.
- **type** (String) - Object type. For Skill Versions, this is always `"skill_version"`.
- **version** (String) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., `"1759178010641129"`).

#### Response Example
```json
{
  "id": "skv_12345",
  "createdAt": "2024-01-01T12:00:00Z",
  "description": "Initial version of the weather skill.",
  "directory": "weather_skill",
  "name": "Weather Skill v1",
  "skillId": "skl_abcde",
  "type": "skill_version",
  "version": "1759178010641129"
}
```
```

--------------------------------

### GET /v1/models/{model_id}

Source: https://platform.claude.com/docs/en/api/go/beta/models

Retrieves detailed information for a specific model identified by its ID or alias.

```APIDOC
## GET /v1/models/{model_id}

### Description
Get a specific model. The Models API response can be used to determine information about a specific model or resolve a model alias to a model ID.

### Method
GET

### Endpoint
/v1/models/{model_id}

### Parameters
#### Path Parameters
- **model_id** (string) - Required - The unique identifier of the model to retrieve.

### Request Example
{}

### Response
#### Success Response (200)
- **ID** (string) - Unique model identifier.
- **CreatedAt** (Time) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
- **DisplayName** (string) - A human-readable name for the model.
- **Type** (string) - Object type. For Models, this is always `"model"`.

#### Response Example
```json
{
  "ID": "claude-3-opus-20240229",
  "CreatedAt": "2024-02-29T12:00:00Z",
  "DisplayName": "Claude 3 Opus",
  "Type": "model"
}
```
```

--------------------------------

### BetaWebSearchTool20250910 Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/batches/create

Configures the `web_search` tool, allowing an AI model to perform web searches with specified domain restrictions, caching, and user location parameters.

```APIDOC
## Tool: BetaWebSearchTool20250910

### Description
This tool enables an AI model to perform web searches. It provides extensive configuration options for controlling search behavior, including domain restrictions, caching mechanisms, and user location for more relevant results.

### Configuration Parameters
#### Tool Configuration Object
- **name** (string) - Required - The name of the tool, always "web_search".
- **type** (string) - Required - The type identifier for the tool, always "web_search_20250910".
- **allowed_callers** (array of string) - Optional - Specifies which entities can call this tool. Can be "direct" or "code_execution_20250825".
- **allowed_domains** (array of string) - Optional - If provided, only these domains will be included in search results. Cannot be used with `blocked_domains`.
- **blocked_domains** (array of string) - Optional - If provided, these domains will never appear in search results. Cannot be used with `allowed_domains`.
- **cache_control** (object) - Optional - Configuration for caching search results.
  - **type** (string) - Required - The type of cache control, always "ephemeral".
  - **ttl** (string) - Optional - The time-to-live for the cache breakpoint. Can be "5m" (5 minutes) or "1h" (1 hour). Defaults to "5m".
- **defer_loading** (boolean) - Optional - If true, the tool is not included in the initial system prompt and is only loaded when referenced via tool search.
- **max_uses** (number) - Optional - The maximum number of times the tool can be used in a single API request.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.
- **user_location** (object) - Optional - Parameters for the user's location to provide more relevant search results.
  - **type** (string) - Required - The type of location, always "approximate".
  - **city** (string) - Optional - The city of the user.
  - **country** (string) - Optional - The two-letter ISO country code of the user.
  - **region** (string) - Optional - The region of the user.
  - **timezone** (string) - Optional - The IANA timezone of the user.

### Request Example
```json
{
  "name": "web_search",
  "type": "web_search_20250910",
  "allowed_callers": ["direct"],
  "allowed_domains": ["example.com", "anothersite.org"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  },
  "user_location": {
    "type": "approximate",
    "city": "San Francisco",
    "country": "US",
    "timezone": "America/Los_Angeles"
  },
  "max_uses": 5
}
```
```

--------------------------------

### GET /v1/organizations/workspaces/{workspace_id}/members/{user_id}

Source: https://platform.claude.com/docs/en/api/admin

Retrieves the details of a specific member within a workspace using their user ID.

```APIDOC
## GET /v1/organizations/workspaces/{workspace_id}/members/{user_id}

### Description
Retrieves the details of a specific member within a workspace using their user ID.

### Method
GET

### Endpoint
/v1/organizations/workspaces/{workspace_id}/members/{user_id}

### Parameters
#### Path Parameters
- **workspace_id** (string) - Required - ID of the Workspace.
- **user_id** (string) - Required - ID of the User.

### Response
#### Success Response (200)
- **type** ("workspace_member") - Object type. For Workspace Members, this is always "workspace_member".
- **user_id** (string) - ID of the User.
- **workspace_id** (string) - ID of the Workspace.
- **workspace_role** ("workspace_user" | "workspace_developer" | "workspace_admin" | "workspace_billing") - Role of the Workspace Member.

#### Response Example
{
  "type": "workspace_member",
  "user_id": "user_abc123",
  "workspace_id": "workspace_xyz789",
  "workspace_role": "workspace_user"
}
```

--------------------------------

### GET /v1/organizations/invites/{invite_id}

Source: https://platform.claude.com/docs/en/api/admin/invites

Retrieve detailed information about a specific invite by its ID. Returns the invite object with all current details including status and expiration.

```APIDOC
## GET /v1/organizations/invites/{invite_id}

### Description
Retrieve details of a specific invite by its ID.

### Method
GET

### Endpoint
`/v1/organizations/invites/{invite_id}`

### Path Parameters
- **invite_id** (string) - Required - ID of the invite to retrieve

### Response
#### Success Response (200)
- **id** (string) - ID of the Invite
- **email** (string) - Email of the user being invited
- **expires_at** (string) - RFC 3339 datetime string indicating when the invite expires
- **invited_at** (string) - RFC 3339 datetime string indicating when the invite was created
- **role** (string) - Organization role of the user. Values: "user", "developer", "billing", "admin", "claude_code_user", "managed"
- **status** (string) - Status of the invite. Values: "pending", "accepted", "expired", "deleted"
- **type** (string) - Object type, always "invite"

#### Response Example
```json
{
  "id": "invite_123abc",
  "email": "user@example.com",
  "expires_at": "2024-02-15T10:30:00Z",
  "invited_at": "2024-01-15T10:30:00Z",
  "role": "developer",
  "status": "pending",
  "type": "invite"
}
```
```

--------------------------------

### GET /cost_reports

Source: https://platform.claude.com/docs/en/api/admin/cost_report

Retrieves a paginated list of cost reports, allowing for grouping of cost data over specified time buckets.

```APIDOC
## GET /cost_reports

### Description
Retrieves a paginated list of cost reports, allowing for grouping of cost data over specified time buckets.

### Method
GET

### Endpoint
/cost_reports

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **page** (string) - Optional - Token to provide in as `page` in the subsequent request to retrieve the next page of data.
- **group_by[]** (array of string) - Optional - List of fields to group the cost data by. Possible values include: `context_window`, `cost_type`, `inference_geo`, `model`, `service_tier`, `speed`, `token_type`, `workspace_id`.

#### Request Body
(None)

### Request Example
```
GET /cost_reports?group_by[]=model&group_by[]=cost_type&page=next_page_token
```

### Response
#### Success Response (200)
- **data** (array of object) - List of cost report entries.
  - **ending_at** (string) - End of the time bucket (exclusive) in RFC 3339 format.
  - **results** (array of object) - List of cost items for this time bucket. There may be multiple items if one or more `group_by[]` parameters are specified.
    - **amount** (string) - Cost amount in lowest currency units (e.g. cents) as a decimal string. For example, `"123.45"` in `"USD"` represents `$1.23`.
    - **context_window** (string) - Input context window used. `"0-200k"` or `"200k-1M"`. `null` if not grouping by description or for non-token costs.
    - **cost_type** (string) - Type of cost. `"tokens"`, `"web_search"`, or `"code_execution"`. `null` if not grouping by description.
    - **currency** (string) - Currency code for the cost amount. Currently always `"USD"`.
    - **description** (string) - Description of the cost item. `null` if not grouping by description.
    - **inference_geo** (string) - Inference geo used matching requests' `inference_geo` parameter if set, otherwise the workspace's `default_inference_geo`. For models that do not support specifying `inference_geo` the value is `"not_available"`. Always `null` if not grouping by inference geo.
    - **model** (string) - Model name used. `null` if not grouping by description or for non-token costs.
    - **service_tier** (string) - Service tier used. `"standard"` or `"batch"`. `null` if not grouping by description or for non-token costs.
    - **speed** (string) - Speed used (research preview). `"standard"` or `"fast"`. `null` if not grouping by speed, or for non-token costs. Only returned when the `fast-mode-2026-02-01` beta header is provided.
    - **token_type** (string) - Type of token. `"uncached_input_tokens"`, `"output_tokens"`, `"cache_read_input_tokens"`, `"cache_creation.ephemeral_1h_input_tokens"`, or `"cache_creation.ephemeral_5m_input_tokens"`. `null` if not grouping by description or for non-token costs.
    - **workspace_id** (string) - ID of the Workspace this cost is associated with. `null` if not grouping by workspace or for the default workspace.
  - **starting_at** (string) - Start of the time bucket (inclusive) in RFC 3339 format.
- **has_more** (boolean) - Indicates if there are more results.
- **next_page** (string) - Token to provide in as `page` in the subsequent request to retrieve the next page of data.

#### Response Example
```json
{
  "data": [
    {
      "ending_at": "2023-10-27T00:00:00Z",
      "results": [
        {
          "amount": "123.45",
          "context_window": "0-200k",
          "cost_type": "tokens",
          "currency": "USD",
          "description": "Input tokens for Claude 2.1",
          "inference_geo": "us-west-2",
          "model": "claude-2.1",
          "service_tier": "standard",
          "speed": "standard",
          "token_type": "uncached_input_tokens",
          "workspace_id": "ws_abc123"
        },
        {
          "amount": "50.00",
          "context_window": null,
          "cost_type": "web_search",
          "currency": "USD",
          "description": "Web search usage",
          "inference_geo": null,
          "model": null,
          "service_tier": null,
          "speed": null,
          "token_type": null,
          "workspace_id": "ws_abc123"
        }
      ],
      "starting_at": "2023-10-26T00:00:00Z"
    }
  ],
  "has_more": true,
  "next_page": "next_page_token_xyz"
}
```
```

--------------------------------

### Tool Choice - Overview

Source: https://platform.claude.com/docs/en/api/python/messages

Configure how the model should use provided tools. Supports automatic selection, any available tool, specific tool selection, or complete tool disabling with optional parallel tool use control.

```APIDOC
## Tool Choice Configuration

### Description
Defines how Claude models should use the provided tools. The model can automatically decide, use any available tool, use a specific tool, or not use tools at all.

### Tool Choice Types

#### ToolChoiceAuto
The model will automatically decide whether to use tools.

**Properties:**
- **type** (Literal["auto"]) - Required - Must be set to "auto"
- **disable_parallel_tool_use** (Optional[bool]) - Optional - Whether to disable parallel tool use. Defaults to false. If true, the model will output at most one tool use.

#### ToolChoiceAny
The model will use any available tools.

**Properties:**
- **type** (Literal["any"]) - Required - Must be set to "any"
- **disable_parallel_tool_use** (Optional[bool]) - Optional - Whether to disable parallel tool use. Defaults to false. If true, the model will output exactly one tool use.

#### ToolChoiceTool
The model will use the specified tool.

**Properties:**
- **name** (str) - Required - The name of the tool to use
- **type** (Literal["tool"]) - Required - Must be set to "tool"
- **disable_parallel_tool_use** (Optional[bool]) - Optional - Whether to disable parallel tool use. Defaults to false. If true, the model will output exactly one tool use.

#### ToolChoiceNone
The model will not be allowed to use tools.

**Properties:**
- **type** (Literal["none"]) - Required - Must be set to "none"

### Request Examples

**Auto Tool Choice:**
```json
{
  "type": "auto",
  "disable_parallel_tool_use": false
}
```

**Any Tool Choice:**
```json
{
  "type": "any",
  "disable_parallel_tool_use": true
}
```

**Specific Tool Choice:**
```json
{
  "type": "tool",
  "name": "calculator",
  "disable_parallel_tool_use": false
}
```

**No Tool Choice:**
```json
{
  "type": "none"
}
```
```

--------------------------------

### System Prompt Configuration

Source: https://platform.claude.com/docs/en/api/ruby/beta/messages/count_tokens

Set the system prompt for Claude to guide its behavior and responses. Supports both string and rich text block formats.

```APIDOC
## System Prompt Configuration

### Description
Provide a system prompt to guide Claude's behavior and responses. The system prompt can be specified as a simple string or as an array of rich text blocks.

### Parameter
- **system_** (String | Array[BetaTextBlockParam]) - Optional - System prompt

### Formats

#### String Format
Simple text-based system prompt:
```
"You are a helpful assistant that specializes in technical documentation."
```

#### Rich Text Block Format
Array of text blocks for more complex system prompts:
```json
[
  {
    "type": "text",
    "text": "You are a helpful assistant."
  }
]
```

### Usage Notes
- The system prompt sets the context and behavior guidelines for Claude
- Use clear, specific instructions for best results
- Rich text blocks allow for more structured and complex system prompts
```

--------------------------------

### Import Anthropic Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This snippet demonstrates how to import the Anthropic Go SDK into a Go application, making its functionalities available for use. It shows the standard import path for the SDK.

```go
import (
	"github.com/anthropics/anthropic-sdk-go" // imported as anthropic
)
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/java/messages/batches

List all message batches. Returns a paginated list of batches with their current status and metadata.

```APIDOC
## GET /v1/messages/batches

### Description
Retrieve a paginated list of all message batches associated with your account.

### Method
GET

### Endpoint
/v1/messages/batches

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of batches to return (default: 20, max: 100)
- **after** (string) - Optional - Pagination cursor for retrieving the next page of results

### Response
#### Success Response (200)
- **data** (array) - Array of message batch objects
- **has_more** (boolean) - Whether there are more results available

#### Response Example
{
  "data": [
    {
      "id": "msgbatch_1234567890",
      "type": "message_batch",
      "processing_status": "succeeded",
      "request_counts": {
        "processing": 0,
        "succeeded": 100,
        "errored": 0,
        "canceled": 0,
        "total": 100
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "has_more": false
}
```

--------------------------------

### Rate Limits Overview

Source: https://platform.claude.com/docs/en/api/rate-limits

Understanding the Claude API rate limiting system, including how limits are enforced, the token bucket algorithm used for rate limiting, and how rate limits may be applied over shorter time intervals.

```APIDOC
## Rate Limits Overview

### Description
The Claude API implements rate limits to prevent abuse and manage capacity. Rate limits are enforced at the organization level and measured in requests per minute (RPM), input tokens per minute (ITPM), and output tokens per minute (OTPM) for each model class.

### Rate Limit Types
- **Requests Per Minute (RPM)** - Maximum number of API requests per minute
- **Input Tokens Per Minute (ITPM)** - Maximum input tokens processed per minute
- **Output Tokens Per Minute (OTPM)** - Maximum output tokens generated per minute

### Enforcement Mechanism
- Uses token bucket algorithm for continuous capacity replenishment
- Capacity is continuously replenished up to maximum limit, not reset at fixed intervals
- Rate limits may be enforced over shorter intervals (e.g., 60 RPM enforced as 1 request per second)
- Short bursts of high-volume requests can exceed rate limits

### Error Response
- **HTTP Status Code**: 429 (Too Many Requests)
- **Response Header**: `retry-after` - Indicates how long to wait before retrying
- **Response Body**: Describes which rate limit was exceeded

### Important Notes
- Limits apply to both Standard and Priority Tier usage
- Limits are defined by usage tier with different rate limits per tier
- Organization automatically advances tiers upon reaching thresholds
- Acceleration limits may trigger 429 errors if usage increases sharply
- Gradual traffic ramp-up and consistent usage patterns help avoid acceleration limits
```

--------------------------------

### Create Message Batch with Java Anthropic Client

Source: https://platform.claude.com/docs/en/api/java/messages/batches/create

Creates a message batch using the Anthropic Java client library. This example demonstrates initializing an AnthropicClient, building batch parameters with custom request IDs, and submitting the batch for processing. The batch contains a single request with max tokens and a user message.

```java
package com.anthropic.example;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.models.messages.Model;
import com.anthropic.models.messages.batches.BatchCreateParams;
import com.anthropic.models.messages.batches.MessageBatch;

public final class Main {
    private Main() {}

    public static void main(String[] args) {
        AnthropicClient client = AnthropicOkHttpClient.fromEnv();

        BatchCreateParams params = BatchCreateParams.builder()
            .addRequest(BatchCreateParams.Request.builder()
                .customId("my-custom-id-1")
                .params(BatchCreateParams.Request.Params.builder()
                    .maxTokens(1024L)
                    .addUserMessage("Hello, world")
                    .model(Model.CLAUDE_OPUS_4_6)
                    .build())
                .build())
            .build();
        MessageBatch messageBatch = client.messages().batches().create(params);
    }
}
```

--------------------------------

### Configure Context Compaction Strategy

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches/create

Automatically compact older context when reaching token thresholds. Supports custom summarization instructions and optional pause after compaction to return compaction details to user.

```python
class BetaCompact20260112Edit:
    type: Literal["compact_20260112"]
    instructions: Optional[str]  # Additional summarization instructions
    pause_after_compaction: Optional[bool]  # Pause and return compaction block
    trigger: Optional[BetaInputTokensTrigger]  # Trigger condition (default: 150000 tokens)

class BetaInputTokensTrigger:
    type: Literal["input_tokens"]
    value: int  # Token threshold value
```

--------------------------------

### Computer Use Tool Configuration (Updated)

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches

Updated version of BetaToolComputerUse with enhanced display configuration. Specifies display height in pixels as a required parameter.

```APIDOC
## BetaToolComputerUse20250124

### Description
Updated version of the computer use tool with enhanced display configuration capabilities.

### Tool Properties

#### displayHeightPx
- **Type**: long (required)
- **Description**: The height of the display in pixels

### Notes
This is an updated version of BetaToolComputerUse with version identifier 20250124. Refer to BetaToolComputerUse20241022 documentation for complete tool configuration options.
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/beta/models/list

This endpoint retrieves a paginated list of all available AI models. It allows users to discover which models can be used with the API, with newer models appearing first.

```APIDOC
## GET /v1/models

### Description
This endpoint retrieves a paginated list of all available AI models. It allows users to discover which models can be used with the API, with newer models appearing first.

### Method
GET

### Endpoint
/v1/models

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **"anthropic-beta"** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Accepted values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **data** (array of object) - List of available models.
  - **id** (string) - Unique model identifier.
  - **created_at** (string) - RFC 3339 datetime string representing the time at which the model was released.
  - **display_name** (string) - A human-readable name for the model.
  - **type** (string) - Object type. For Models, this is always "model".
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
```json
{
  "data": [
    {
      "id": "claude-3-opus-20240229",
      "created_at": "2024-02-29T12:00:00Z",
      "display_name": "Claude 3 Opus",
      "type": "model"
    },
    {
      "id": "claude-3-sonnet-20240229",
      "created_at": "2024-02-29T12:00:00Z",
      "display_name": "Claude 3 Sonnet",
      "type": "model"
    }
  ],
  "first_id": "claude-3-opus-20240229",
  "has_more": true,
  "last_id": "claude-3-sonnet-20240229"
}
```
```

--------------------------------

### GET /models - List Available Models

Source: https://platform.claude.com/docs/en/api/java/messages/batches

Retrieves a list of all available Claude AI models, including their unique identifiers and a brief description of their capabilities.

```APIDOC
## GET /models\n\n### Description\nThis endpoint provides a comprehensive list of all currently supported Claude AI models, along with their respective capabilities and recommended use cases.\n\n### Method\nGET\n\n### Endpoint\n/models\n\n### Parameters\n(None)\n\n### Request Example\n(No request body for GET)\n\n### Response\n#### Success Response (200)\n- **models** (array of objects) - A list of available Claude models.\n    - **id** (string) - The unique identifier for the model (e.g., "claude-opus-4-5").\n    - **description** (string) - A brief description of the model's capabilities.\n\n#### Response Example\n```json\n{\n  "models": [\n    {\n      "id": "claude-opus-4-5",\n      "description": "Premium model combining maximum intelligence with practical performance"\n    },\n    {\n      "id": "claude-3-7-sonnet-latest",\n      "description": "High-performance model with early extended thinking"\n    },\n    {\n      "id": "claude-3-7-sonnet-20250219",\n      "description": "High-performance model with early extended thinking"\n    },\n    {\n      "id": "claude-3_5_haiku_latest",\n      "description": "Fastest and most compact model for near-instant responsiveness"\n    },\n    {\n      "id": "claude-3_5_haiku_20241022",\n      "description": "Our fastest model"\n    },\n    {\n      "id": "claude-haiku-4-5",\n      "description": "Hybrid model, capable of near-instant responses and extended thinking"\n    },\n    {\n      "id": "claude-haiku-4-5-20251001",\n      "description": "Hybrid model, capable of near-instant responses and extended thinking"\n    },\n    {\n      "id": "claude-sonnet-4-20250514",\n      "description": "High-performance model with extended thinking"\n    },\n    {\n      "id": "claude-sonnet-4-0",\n      "description": "High-performance model with extended thinking"\n    },\n    {\n      "id": "claude-4-sonnet-20250514",\n      "description": "High-performance model with extended thinking"\n    },\n    {\n      "id": "claude-sonnet-4-5",\n      "description": "Our best model for real-world agents and coding"\n    },\n    {\n      "id": "claude-sonnet-4-5-20250929",\n      "description": "Our best model for real-world agents and coding"\n    },\n    {\n      "id": "claude-opus-4-0",\n      "description": "Our most capable model"\n    },\n    {\n      "id": "claude-opus-4-20250514",\n      "description": "Our most capable model"\n    },\n    {\n      "id": "claude-4-opus-20250514",\n      "description": "Our most capable model"\n    },\n    {\n      "id": "claude-opus-4-1-20250805",\n      "description": "Our most capable model"\n    },\n    {\n      "id": "claude-3-opus-latest",\n      "description": "Excels at writing and complex tasks"\n    },\n    {\n      "id": "claude-3-opus-20240229",\n      "description": "Excels at writing and complex tasks"\n    },\n    {\n      "id": "claude-3-haiku-20240307",\n      "description": "Our previous most fast and cost-effective"\n    }\n  ]\n}\n```
```

--------------------------------

### Configure Anthropic Client Timeouts in Python

Source: https://platform.claude.com/docs/en/api/sdks/python

This example shows how to set a default timeout for all requests using a float value or a more granular `httpx.Timeout` object. It also illustrates how to override the default timeout for a specific request.

```python
import httpx
from anthropic import Anthropic

# Configure the default for all requests:
client = Anthropic(
    timeout=20.0,  # 20 seconds (default is 10 minutes)
)
```

```python
client = Anthropic(
    timeout=httpx.Timeout(60.0, read=5.0, write=10.0, connect=2.0),
)
```

```python
client.with_options(timeout=5.0).messages.create(
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude"}],
    model="claude-opus-4-6",
)
```

--------------------------------

### GET /usage - Query Parameters Reference

Source: https://platform.claude.com/docs/en/api/admin

Complete reference for query parameters available when retrieving usage data. Supports filtering by multiple dimensions including API keys, models, service tiers, and inference locations, with configurable time bucketing and grouping capabilities.

```APIDOC
## GET /usage

### Description
Retrieve usage data with advanced filtering, grouping, and time-based bucketing options.

### Method
GET

### Endpoint
/usage

### Query Parameters

#### Time Parameters
- **starting_at** (string) - Required - Time buckets that start on or after this RFC 3339 timestamp will be returned. Each time bucket will be snapped to the start of the minute/hour/day in UTC.
- **ending_at** (string) - Optional - Time buckets that end before this RFC 3339 timestamp will be returned.
- **bucket_width** (string) - Optional - Time granularity of the response data. Allowed values: `"1d"`, `"1m"`, `"1h"`

#### Filtering Parameters
- **api_key_ids** (array of string) - Optional - Restrict usage returned to the specified API key ID(s).
- **models** (array of string) - Optional - Restrict usage returned to the specified model(s).
- **service_tiers** (array of string) - Optional - Restrict usage returned to the specified service tier(s). Allowed values: `"standard"`, `"batch"`, `"priority"`, `"priority_on_demand"`, `"flex"`, `"flex_discount"`
- **context_window** (array of string) - Optional - Restrict usage returned to the specified context window(s). Allowed values: `"0-200k"`, `"200k-1M"`
- **inference_geos** (array of string) - Optional - Restrict usage returned to the specified inference geo(s). Allowed values: `"global"`, `"us"`, `"not_available"`
- **workspace_ids** (array of string) - Optional - Restrict usage returned to the specified workspace ID(s).
- **speeds** (array of string) - Optional - Restrict usage returned to the specified speed(s) (research preview). Requires `fast-mode-2026-02-01` beta header. Allowed values: `"standard"`, `"fast"`

#### Grouping and Pagination Parameters
- **group_by** (array of string) - Optional - Group by any subset of available options. Grouping by `speed` requires the `fast-mode-2026-02-01` beta header. Allowed values: `"api_key_id"`, `"workspace_id"`, `"model"`, `"service_tier"`, `"context_window"`, `"inference_geo"`, `"speed"`
- **limit** (number) - Optional - Maximum number of time buckets to return in the response. Default and max limits depend on `bucket_width`: `"1d"` (default 7 days, max 31 days), `"1h"` (default 24 hours, max 168 hours), `"1m"` (default 60 minutes, max 1440 minutes)
- **page** (string) - Optional - Optionally set to the `next_page` token from the previous response.

### Header Parameters
- **anthropic-beta** (array of string) - Optional - Specify the beta version(s) you want to use. Use comma-separated values like `beta1,beta2` or specify the header multiple times for each beta.

### Request Example
```
GET /usage?starting_at=2024-01-01T00:00:00Z&bucket_width=1d&models=claude-3-opus&group_by=model,service_tier&limit=7
```

### Response
#### Success Response (200)
- **usage_data** (array of objects) - Array of usage records grouped and bucketed according to query parameters
- **next_page** (string) - Token for pagination to retrieve the next set of results

#### Response Example
```json
{
  "usage_data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "model": "claude-3-opus",
      "service_tier": "standard",
      "requests": 1500,
      "tokens_input": 250000,
      "tokens_output": 125000
    }
  ],
  "next_page": "eyJvZmZzZXQiOiAxMDB9"
}
```
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/beta/skills/list

Retrieves a paginated list of skills with optional filtering by source. Supports pagination through limit and page parameters, and allows specification of beta API versions through headers.

```APIDOC
## GET /v1/skills

### Description
List Skills - Retrieves a paginated list of skills with optional filtering by source (custom or Anthropic-created).

### Method
GET

### Endpoint
`/v1/skills`

### Parameters

#### Query Parameters
- **limit** (number) - Optional - Number of results to return per page. Maximum value is 100. Defaults to 20.
- **page** (string) - Optional - Pagination token for fetching a specific page of results. Pass the value from a previous response's `next_page` field to get the next page of results.
- **source** (string) - Optional - Filter skills by source. If provided, only skills from the specified source will be returned: `"custom"` (user-created skills) or `"anthropic"` (Anthropic-created skills).

#### Header Parameters
- **anthropic-beta** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Supported values include: `"message-batches-2024-09-24"`, `"prompt-caching-2024-07-31"`, `"computer-use-2024-10-22"`, `"computer-use-2025-01-24"`, `"pdfs-2024-09-25"`, `"token-counting-2024-11-01"`, `"token-efficient-tools-2025-02-19"`, `"output-128k-2025-02-19"`, `"files-api-2025-04-14"`, `"mcp-client-2025-04-04"`, `"mcp-client-2025-11-20"`, `"dev-full-thinking-2025-05-14"`, `"interleaved-thinking-2025-05-14"`, `"code-execution-2025-05-22"`, `"extended-cache-ttl-2025-04-11"`, `"context-1m-2025-08-07"`, `"context-management-2025-06-27"`, `"model-context-window-exceeded-2025-08-26"`, `"skills-2025-10-02"`, `"fast-mode-2026-02-01"`.

### Request Example
```
GET /v1/skills?limit=20&source=custom HTTP/1.1
Host: api.anthropic.com
anthropicbeta: skills-2025-10-02
```

### Response

#### Success Response (200)
- **data** (array of object) - List of skills.
  - **id** (string) - Unique identifier for the skill. The format and length of IDs may change over time.
  - **created_at** (string) - ISO 8601 timestamp of when the skill was created.
  - **display_title** (string) - Display title for the skill. This is a human-readable label that is not included in the prompt sent to the model.
  - **latest_version** (string) - The latest version identifier for the skill. This represents the most recent version of the skill that has been created.
  - **source** (string) - Source of the skill: `"custom"` (user-created) or `"anthropic"` (Anthropic-created).
  - **type** (string) - Object type. For Skills, this is always `"skill"`.
  - **updated_at** (string) - ISO 8601 timestamp of when the skill was last updated.
- **has_more** (boolean) - Whether there are more results available. If `true`, there are additional results that can be fetched using the `next_page` token.
- **next_page** (string) - Token for fetching the next page of results. If `null`, there are no more results available. Pass this value to the `page` parameter in the next request to get the next page.

#### Response Example
```json
{
  "data": [
    {
      "id": "skill_123abc",
      "created_at": "2025-01-15T10:30:00Z",
      "display_title": "My Custom Skill",
      "latest_version": "v1.0.0",
      "source": "custom",
      "type": "skill",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "has_more": true,
  "next_page": "page_token_xyz789"
}
```
```

--------------------------------

### Configure Completion Parameters - Java

Source: https://platform.claude.com/docs/en/api/java/completions

Demonstrates setting optional parameters for text completion including stop sequences, metadata, beta versions, and sampling parameters (topK, topP, temperature). These parameters control response generation behavior and enable experimental features.

```java
CompletionCreateParams params = CompletionCreateParams.builder()
  .model(Model.CLAUDE_3_5_SONNET)
  .prompt("\nHuman: Complete this text\n\nAssistant:")
  .maxTokensToSample(2048)
  .temperature(0.5)
  .topK(40L)
  .topP(0.95)
  .stopSequences(Arrays.asList("\nHuman:", "END"))
  .metadata(Metadata.builder().userId("user123").build())
  .betas(Arrays.asList(AnthropicBeta.PROMPT_CACHING_2024_07_31))
  .build();
```

--------------------------------

### Add anthropic-java-vertex dependency with Maven

Source: https://platform.claude.com/docs/en/api/sdks/java

Install the anthropic-java-vertex library using Maven dependency management. This provides the necessary libraries for Anthropic models on Google Cloud Vertex AI.

```xml
<dependency>
    <groupId>com.anthropic</groupId>
    <artifactId>anthropic-java-vertex</artifactId>
    <version>2.11.1</version>
</dependency>
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Retrieve a paginated list of all skills. This endpoint returns skills with cursor-based pagination for efficient retrieval of large skill collections.

```APIDOC
## GET /v1/skills

### Description
Retrieve a paginated list of all skills available to the authenticated user. Results are returned with cursor-based pagination.

### Method
GET

### Endpoint
`/v1/skills`

### Parameters
None required.

### Response

#### Success Response (200)
Returns a paginated cursor object containing:
- **data** ([]BetaSkillListResponse) - Array of skill objects
- **has_more** (boolean) - Whether there are more results available
- **next_cursor** (string) - Cursor for retrieving the next page of results

#### Response Example
```json
{
  "data": [
    {
      "ID": "skill_abc123",
      "CreatedAt": "2025-10-02T12:00:00Z",
      "DisplayTitle": "My Custom Skill",
      "LatestVersion": "v1",
      "Source": "custom",
      "Type": "skill",
      "UpdatedAt": "2025-10-02T12:00:00Z"
    }
  ],
  "has_more": false,
  "next_cursor": null
}
```

### Client Method
`client.Beta.Skills.List(ctx, params) (*PageCursor[BetaSkillListResponse], error)`
```

--------------------------------

### Example of Returning `tool_result` to Claude API

Source: https://platform.claude.com/docs/en/api/creating-message-batches

This JSON array demonstrates how to return the result of a tool execution back to the Claude API. It specifies the `type` as `tool_result`, references the `tool_use_id` from the original `tool_use` block, and provides the `content` which is the output of the tool's execution (e.g., the stock price).

```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```

--------------------------------

### Content Block Types Overview

Source: https://platform.claude.com/docs/en/api/csharp/messages/batches/create

Comprehensive guide to all content block types supported by the Claude API, including their structure, required fields, and optional parameters for citations and cache control.

```APIDOC
## Content Block Types

### Description
The Claude API supports multiple content block types for structuring messages and responses. Each block type has specific required and optional fields.

### Text Block

#### Structure
```
class TextBlockParam:
  - required string Text
  - JsonElement Type "text" (constant)
  - CacheControlEphemeral? CacheControl (optional)
  - IReadOnlyList<TextCitationParam>? Citations (optional)
```

#### Fields
- **Text** (string) - Required - The text content of the block
- **Type** (string) - Required - Constant value: "text"
- **CacheControl** (CacheControlEphemeral) - Optional - Cache control configuration
- **Citations** (IReadOnlyList<TextCitationParam>) - Optional - Citation references

### Tool Use Block

#### Structure
```
class ToolUseBlockParam:
  - required string ID
  - required string Name
  - required IReadOnlyDictionary<string, JsonElement> Input
  - JsonElement Type "tool_use" (constant)
  - CacheControlEphemeral? CacheControl (optional)
```

#### Fields
- **ID** (string) - Required - Unique identifier for the tool use
- **Name** (string) - Required - Name of the tool being used
- **Input** (IReadOnlyDictionary<string, JsonElement>) - Required - Tool input parameters
- **Type** (string) - Required - Constant value: "tool_use"
- **CacheControl** (CacheControlEphemeral) - Optional - Cache control configuration

### Tool Result Block

#### Structure
```
class ToolResultBlockParam:
  - required string ToolUseID
  - JsonElement Type "tool_result" (constant)
  - CacheControlEphemeral? CacheControl (optional)
  - Content Content (optional)
```

#### Fields
- **ToolUseID** (string) - Required - ID of the tool use this result corresponds to
- **Type** (string) - Required - Constant value: "tool_result"
- **CacheControl** (CacheControlEphemeral) - Optional - Cache control configuration
- **Content** (Content) - Optional - Result content (string or IReadOnlyList<Block>)

### Thinking Block

#### Structure
```
class ThinkingBlockParam:
  - required string Signature
  - required string Thinking
  - JsonElement Type "thinking" (constant)
```

#### Fields
- **Signature** (string) - Required - Signature of the thinking block
- **Thinking** (string) - Required - The thinking content
- **Type** (string) - Required - Constant value: "thinking"

### Redacted Thinking Block

#### Structure
```
class RedactedThinkingBlockParam:
  - required string Data
  - JsonElement Type "redacted_thinking" (constant)
```

#### Fields
- **Data** (string) - Required - Redacted thinking data
- **Type** (string) - Required - Constant value: "redacted_thinking"
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/typescript/beta/skills

This endpoint retrieves a paginated list of available skills. You can filter skills by source and control pagination.

```APIDOC
## GET /v1/skills

### Description
This endpoint retrieves a paginated list of available skills. You can filter skills by source and control pagination.

### Method
GET

### Endpoint
/v1/skills

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **limit** (number) - Optional - Number of results to return per page. Maximum value is 100. Defaults to 20.
- **page** (string | null) - Optional - Pagination token for fetching a specific page of results. Pass the value from a previous response's `next_page` field to get the next page of results.
- **source** (string | null) - Optional - Filter skills by source. Can be "custom" (user-created) or "anthropic" (Anthropic-created).

#### Request Body
(None)

#### Header Parameters
- **betas** (Array<AnthropicBeta>) - Optional - Optional header to specify the beta version(s) you want to use. Example values: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "skills-2025-10-02", etc.

### Request Example
{}

### Response
#### Success Response (200)
- **data** (Array<Skill>) - An array of skill objects.
  - **id** (string) - Unique identifier for the skill.
  - **created_at** (string) - ISO 8601 timestamp of when the skill was created.
  - **display_title** (string | null) - Display title for the skill.
  - **latest_version** (string | null) - The latest version identifier for the skill.
  - **source** (string) - Source of the skill.
  - **type** (string) - Object type. Always "skill".
  - **updated_at** (string) - ISO 8601 timestamp of when the skill was last updated.
- **next_page** (string | null) - Pagination token for the next page of results.
- **limit** (number) - The maximum number of results returned per page.

#### Response Example
{
  "data": [
    {
      "id": "skill_abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "display_title": "My Custom Skill",
      "latest_version": "v1",
      "source": "custom",
      "type": "skill",
      "updated_at": "2024-01-01T12:00:00Z"
    },
    {
      "id": "skill_def456",
      "created_at": "2024-01-02T13:00:00Z",
      "display_title": "Anthropic Skill",
      "latest_version": "v2",
      "source": "anthropic",
      "type": "skill",
      "updated_at": "2024-01-02T13:00:00Z"
    }
  ],
  "next_page": "page_token_xyz",
  "limit": 20
}
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version}

Source: https://platform.claude.com/docs/en/api/python/beta/skills/versions

Retrieves a specific version of a skill using its skill ID and version identifier.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
Retrieves a specific version of a skill using its skill ID and version identifier.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions/{version}

### Parameters
#### Path Parameters
- **skill_id** (str) - Required - Unique identifier for the skill.
- **version** (str) - Required - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

#### Header Parameters
- **betas** (List[AnthropicBetaParam]) - Optional - Optional header to specify the beta version(s) you want to use. Example values include "message-batches-2024-09-24", "prompt-caching-2024-07-31", etc.

### Request Example
{}

### Response
#### Success Response (200)
- **id** (str) - Unique identifier for the skill version.
- **created_at** (str) - ISO 8601 timestamp of when the skill version was created.
- **description** (str) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **directory** (str) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
- **name** (str) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **skill_id** (str) - Identifier for the skill that this version belongs to.
- **type** (str) - Object type. For Skill Versions, this is always "skill_version".
- **version** (str) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

#### Response Example
{
  "id": "skv_abc123",
  "created_at": "2024-01-01T12:00:00Z",
  "description": "A skill for generating creative content.",
  "directory": "creative_skill_v1",
  "name": "Creative Content Generator",
  "skill_id": "skl_xyz789",
  "type": "skill_version",
  "version": "1759178010641129"
}
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/beta/models

List all available models with pagination support. Returns a paginated list of models ordered by release date, with the most recently released models appearing first. Supports cursor-based pagination using after_id and before_id parameters.

```APIDOC
## GET /v1/models

### Description
List available models in the Anthropic API. The response can be used to determine which models are available for use. More recently released models are listed first.

### Method
GET

### Endpoint
`/v1/models`

### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

### Header Parameters
- **anthropic-beta** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Supported values include: `message-batches-2024-09-24`, `prompt-caching-2024-07-31`, `computer-use-2024-10-22`, `computer-use-2025-01-24`, `pdfs-2024-09-25`, `token-counting-2024-11-01`, `token-efficient-tools-2025-02-19`, `output-128k-2025-02-19`, `files-api-2025-04-14`, `mcp-client-2025-04-04`, `mcp-client-2025-11-20`, `dev-full-thinking-2025-05-14`, `interleaved-thinking-2025-05-14`, `code-execution-2025-05-22`, `extended-cache-ttl-2025-04-11`, `context-1m-2025-08-07`, `context-management-2025-06-27`, `model-context-window-exceeded-2025-08-26`, `skills-2025-10-02`, `fast-mode-2026-02-01`.

### Response
#### Success Response (200)
- **data** (array of BetaModelInfo) - Array of available models
  - **id** (string) - Unique model identifier
  - **created_at** (string) - RFC 3339 datetime string representing the time at which the model was released
  - **display_name** (string) - A human-readable name for the model
  - **type** (string) - Object type. For Models, this is always `"model"`
- **first_id** (string) - First ID in the data list. Can be used as the `before_id` for the previous page
- **last_id** (string) - Last ID in the data list. Can be used as the `after_id` for the next page
- **has_more** (boolean) - Indicates if there are more results in the requested page direction

#### Response Example
```json
{
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "created_at": "2024-10-22T00:00:00Z",
      "display_name": "Claude 3.5 Sonnet",
      "type": "model"
    }
  ],
  "first_id": "claude-3-5-sonnet-20241022",
  "last_id": "claude-3-5-sonnet-20241022",
  "has_more": false
}
```
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/beta/files/list

Retrieves a paginated list of files with their metadata. Supports cursor-based pagination using after_id and before_id parameters, and allows customization of the number of results returned per page.

```APIDOC
## GET /v1/files

### Description
List all files with pagination support. Returns file metadata objects including ID, creation timestamp, filename, MIME type, and file size.

### Method
GET

### Endpoint
`/v1/files`

### Parameters

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **anthropic-beta** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Supported values include: `message-batches-2024-09-24`, `prompt-caching-2024-07-31`, `computer-use-2024-10-22`, `computer-use-2025-01-24`, `pdfs-2024-09-25`, `token-counting-2024-11-01`, `token-efficient-tools-2025-02-19`, `output-128k-2025-02-19`, `files-api-2025-04-14`, `mcp-client-2025-04-04`, `mcp-client-2025-11-20`, `dev-full-thinking-2025-05-14`, `interleaved-thinking-2025-05-14`, `code-execution-2025-05-22`, `extended-cache-ttl-2025-04-11`, `context-1m-2025-08-07`, `context-management-2025-06-27`, `model-context-window-exceeded-2025-08-26`, `skills-2025-10-02`, `fast-mode-2026-02-01`.

### Response

#### Success Response (200)
- **data** (array of FileMetadata) - List of file metadata objects.
  - **id** (string) - Unique object identifier. The format and length of IDs may change over time.
  - **created_at** (string) - RFC 3339 datetime string representing when the file was created.
  - **filename** (string) - Original filename of the uploaded file.
  - **mime_type** (string) - MIME type of the file.
  - **size_bytes** (number) - Size of the file in bytes.
  - **type** (string) - Object type. For files, this is always `"file"`.
  - **downloadable** (boolean) - Optional - Whether the file can be downloaded.
- **first_id** (string) - Optional - ID of the first file in this page of results.
- **has_more** (boolean) - Optional - Whether there are more results available.
- **last_id** (string) - Optional - ID of the last file in this page of results.

### Response Example
```json
{
  "data": [
    {
      "id": "file-abc123",
      "created_at": "2025-01-15T10:30:00Z",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 1024000,
      "type": "file",
      "downloadable": true
    }
  ],
  "first_id": "file-abc123",
  "has_more": false,
  "last_id": "file-abc123"
}
```
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version}

Source: https://platform.claude.com/docs/en/api/csharp/beta/skills

Retrieves a specific version of a skill by its unique identifier and version number.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
Retrieves a specific version of a skill by its unique identifier and version number.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions/{version}

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill.
- **version** (string) - Required - Version identifier for the skill (e.g., a Unix epoch timestamp).

#### Header Parameters
- **betas** (IReadOnlyList<AnthropicBeta>) - Optional - Optional header to specify the beta version(s) you want to use. Example values: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22".

### Request Example
{}

### Response
#### Success Response (200)
- **ID** (string) - Unique identifier for the skill version.
- **CreatedAt** (string) - ISO 8601 timestamp of when the skill version was created.
- **Description** (string) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **Directory** (string) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
- **Name** (string) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **SkillID** (string) - Identifier for the skill that this version belongs to.
- **Type** (string) - Object type. For Skill Versions, this is always "skill_version".
- **Version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp.

#### Response Example
{
  "ID": "sv_abc123def456",
  "CreatedAt": "2024-01-01T12:00:00Z",
  "Description": "Initial release of the skill, focusing on basic conversational abilities.",
  "Directory": "my-first-skill-v1",
  "Name": "My First Skill",
  "SkillID": "sk_xyz789uvw012",
  "Type": "skill_version",
  "Version": "1759178010641129"
}
```

--------------------------------

### Define BetaSkillVersionGetResponse Structure - Go

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Defines the response structure returned when retrieving a skill version, containing metadata about the skill version including its ID, creation timestamp, description, directory name, human-readable name, parent skill ID, object type, and version identifier. All fields are strings representing different aspects of the skill version.

```go
type BetaSkillVersionGetResponse struct {
  ID string
  CreatedAt string
  Description string
  Directory string
  Name string
  SkillID string
  Type string
  Version string
}
```

--------------------------------

### GET /v1/skills

Source: https://platform.claude.com/docs/en/api/csharp/beta/skills

Retrieves a paginated list of skills. Results can be filtered by source and controlled by limit and pagination tokens.

```APIDOC
## GET /v1/skills

### Description
Retrieves a paginated list of skills. Results can be filtered by source and controlled by limit and pagination tokens.

### Method
GET

### Endpoint
/v1/skills

### Parameters
#### Query Parameters
- **limit** (Long) - Optional - Number of results to return per page. Maximum value is 100. Defaults to 20.
- **page** (string) - Optional - Pagination token for fetching a specific page of results. Pass the value from a previous response's `next_page` field to get the next page of results.
- **source** (string) - Optional - Filter skills by source. If provided, only skills from the specified source will be returned. Possible values: "custom" (user-created skills), "anthropic" (Anthropic-created skills).

#### Header Parameters
- **betas** (IReadOnlyList<AnthropicBeta>) - Optional - Optional header to specify the beta version(s) you want to use. Possible values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

### Request Example
```
GET /v1/skills?limit=10&source=custom
```

### Response
#### Success Response (200)
- **data** (array of objects) - A list of skill objects.
  - **ID** (string) - Unique identifier for the skill.
  - **CreatedAt** (string) - ISO 8601 timestamp of when the skill was created.
  - **DisplayTitle** (string) - Optional - Display title for the skill.
  - **LatestVersion** (string) - Optional - The latest version identifier for the skill.
  - **Source** (string) - Source of the skill. Can be "custom" or "anthropic".
  - **Type** (string) - Object type. For Skills, this is always "skill".
  - **UpdatedAt** (string) - ISO 8601 timestamp of when the skill was last updated.
- **next_page** (string) - Optional - A token to retrieve the next page of results.

#### Response Example
```json
{
  "data": [
    {
      "ID": "skill_abc123",
      "CreatedAt": "2024-01-01T12:00:00Z",
      "DisplayTitle": "My Custom Skill",
      "LatestVersion": "v1",
      "Source": "custom",
      "Type": "skill",
      "UpdatedAt": "2024-01-01T12:00:00Z"
    },
    {
      "ID": "skill_def456",
      "CreatedAt": "2024-01-02T13:00:00Z",
      "DisplayTitle": "Another Skill",
      "LatestVersion": "v2",
      "Source": "anthropic",
      "Type": "skill",
      "UpdatedAt": "2024-01-02T13:00:00Z"
    }
  ],
  "next_page": "next_page_token_xyz"
}
```
```

--------------------------------

### GET /v1/files/{file_id}/content

Source: https://platform.claude.com/docs/en/api/beta/files/download

This endpoint allows users to download the content of a specific file by providing its unique identifier. It retrieves the file's data directly.

```APIDOC
## GET /v1/files/{file_id}/content

### Description
This endpoint allows users to download the content of a specific file by providing its unique identifier. It retrieves the file's data directly.

### Method
GET

### Endpoint
/v1/files/{file_id}/content

### Parameters
#### Path Parameters
- **file_id** (string) - Required - ID of the File.

#### Query Parameters
(None)

#### Request Body
(None)

### Request Example
(No specific request body for this GET endpoint. The request is made via the URL.)

### Response
#### Success Response (200)
- The response will be the raw content of the requested file.

#### Response Example
(The response is the raw file content, not a JSON object.)
```

--------------------------------

### Configure BetaWebSearchTool with Domain Filtering and Location

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/count_tokens

Web search tool configuration supporting domain filtering (allowed or blocked domains), user location parameters for relevant results, cache control, and maximum usage limits. Supports direct and code execution callers with optional schema validation and deferred loading.

```csharp
class BetaWebSearchTool20250305 {
  JsonElement Name = "web_search"; // constant
  JsonElement Type = "web_search_20250305"; // constant
  IReadOnlyList<AllowedCaller> AllowedCallers; // "direct" or "code_execution_20250825"
  IReadOnlyList<string>? AllowedDomains; // Cannot be used with BlockedDomains
  IReadOnlyList<string>? BlockedDomains; // Cannot be used with AllowedDomains
  BetaCacheControlEphemeral? CacheControl;
  Ttl CacheControlTtl; // "5m" or "1h" (defaults to "5m")
  Boolean DeferLoading;
  Long? MaxUses; // Maximum times tool can be used in API request
  Boolean Strict; // guarantees schema validation when true
  UserLocation? UserLocation; // City, Country (ISO), Region, Timezone (IANA)
}
```

--------------------------------

### GET /v1/files/{file_id}/content

Source: https://platform.claude.com/docs/en/api/csharp/beta/files

Download the content of a specific file by its ID. This endpoint returns the raw file content.

```APIDOC
## GET /v1/files/{file_id}/content

### Description
Download the content of a specific file by its ID. This endpoint returns the raw file content.

### Method
GET

### Endpoint
/v1/files/{file_id}/content

### Parameters
#### Path Parameters
- **file_id** (string) - Required - ID of the File.

#### Query Parameters
- **betas** (IReadOnlyList<AnthropicBeta>) - Optional - (Header parameter) Optional header to specify the beta version(s) you want to use. Example values: "files-api-2025-04-14", "message-batches-2024-09-24".

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- Returns the raw content of the file.

#### Response Example
```
[Binary file content]
```
```

--------------------------------

### Configure Bash Tool Updated Version - C#

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/count_tokens

Defines BetaToolBash20250124 class, an updated version of the bash tool with identical structure to 20241022. Supports cache control, allowed callers, deferred loading, input examples, and strict schema validation for tool names and inputs.

```csharp
class BetaToolBash20250124
{
  JsonElement Name = "bash"; // constant
  JsonElement Type = "bash_20250124"; // constant
  IReadOnlyList<AllowedCaller> AllowedCallers; // "direct" or "code_execution_20250825"
  BetaCacheControlEphemeral? CacheControl;
  JsonElement CacheControlType = "ephemeral"; // constant
  Ttl Ttl; // "5m" or "1h", defaults to "5m"
  Boolean DeferLoading;
  IReadOnlyList<IReadOnlyDictionary<string, JsonElement>> InputExamples;
  Boolean Strict; // When true, guarantees schema validation
}
```

--------------------------------

### Initialize Anthropic client with VertexBackend using environment variables

Source: https://platform.claude.com/docs/en/api/sdks/java

Create an AnthropicClient configured with VertexBackend that automatically resolves Google OAuth2 credentials from Application Default Credentials (ADC), region from CLOUD_ML_REGION environment variable, and project ID from ANTHROPIC_VERTEX_PROJECT_ID environment variable.

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;

AnthropicClient client = AnthropicOkHttpClient.builder()
  .backend(VertexBackend.fromEnv())
  .build();
```

--------------------------------

### Access Raw HTTP Response Data in Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This Go code demonstrates how to capture the raw HTTP response object using `option.WithResponseInto()` when making a request with the Anthropic Go SDK. It allows inspection of HTTP headers, status codes, and other low-level details of the API response. The example shows how to print the status code and headers after a successful message creation.

```go
// Create a variable to store the HTTP response
var response *http.Response
message, err := client.Messages.New(
	context.TODO(),
	anthropic.MessageNewParams{
		MaxTokens: 1024,
		Messages: []anthropic.MessageParam{{
			Content: []anthropic.ContentBlockParamUnion{{
				OfText: &anthropic.TextBlockParam{Text: "What is a quaternion?", CacheControl: anthropic.CacheControlEphemeralParam{TTL: anthropic.CacheControlEphemeralTTLTTL5m}, Citations: []anthropic.TextCitationParamUnion{{
					OfCharLocation: &anthropic.CitationCharLocationParam{CitedText: "cited_text", DocumentIndex: 0, DocumentTitle: anthropic.String("x"), EndCharIndex: 0, StartCharIndex: 0},
				}}},
			}},
			Role: anthropic.MessageParamRoleUser,
		}},
		Model: anthropic.ModelClaudeOpus4_6,
	},
	option.WithResponseInto(&response),
)
if err != nil {
	// handle error
}
fmt.Printf("%+v\n", message)

fmt.Printf("Status Code: %d\n", response.StatusCode)
fmt.Printf("Headers: %+#v\n", response.Header)
```

--------------------------------

### GET /v1/organizations/invites/{invite_id}

Source: https://platform.claude.com/docs/en/api/admin/invites/retrieve

Retrieves detailed information about a specific organization invite. Returns the invite object containing recipient email, role, status, and timestamp information.

```APIDOC
## GET /v1/organizations/invites/{invite_id}

### Description
Retrieve a specific organization invite by its ID. Returns complete invite details including recipient email, assigned role, creation and expiration times, and current status.

### Method
GET

### Endpoint
`/v1/organizations/invites/{invite_id}`

### Parameters
#### Path Parameters
- **invite_id** (string) - Required - ID of the Invite to retrieve

### Response
#### Success Response (200)
- **id** (string) - ID of the Invite
- **email** (string) - Email of the User being invited
- **expires_at** (string) - RFC 3339 datetime string indicating when the Invite expires
- **invited_at** (string) - RFC 3339 datetime string indicating when the Invite was created
- **role** (enum) - Organization role of the User. Possible values: "user", "developer", "billing", "admin", "claude_code_user", "managed"
- **status** (enum) - Status of the Invite. Possible values: "accepted", "expired", "deleted", "pending"
- **type** (string) - Object type. For Invites, this is always "invite"

### Response Example
```json
{
  "id": "invite_123abc",
  "email": "user@example.com",
  "expires_at": "2024-12-31T23:59:59Z",
  "invited_at": "2024-01-15T10:30:00Z",
  "role": "developer",
  "status": "pending",
  "type": "invite"
}
```
```

--------------------------------

### Configuring HTTPS/SSL for Anthropic Java HTTP Client

Source: https://platform.claude.com/docs/en/api/sdks/java

This example shows how to customize HTTPS/SSL settings for the Anthropic Java SDK client by providing custom `SSLSocketFactory`, `TrustManager`, and `HostnameVerifier` instances. While generally not recommended due to potential performance impacts, this allows advanced control over secure communication channels for specific security requirements.

```java
import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;

AnthropicClient client = AnthropicOkHttpClient.builder()
  .fromEnv()
  .sslSocketFactory(yourSSLSocketFactory)
  .trustManager(yourTrustManager)
  .hostnameVerifier(yourHostnameVerifier)
  .build();
```

--------------------------------

### Web

Source: https://platform.claude.com/docs/en/api/messages/create

No description

--------------------------------

### GET /v1/organizations/api_keys/{api_key_id}

Source: https://platform.claude.com/docs/en/api/admin/api_keys/retrieve

Retrieves a specific API key from an organization by its ID. Returns complete API key details including creation metadata, current status, and workspace information.

```APIDOC
## GET /v1/organizations/api_keys/{api_key_id}

### Description
Retrieve a specific API key by its ID from an organization.

### Method
GET

### Endpoint
`/v1/organizations/api_keys/{api_key_id}`

### Parameters
#### Path Parameters
- **api_key_id** (string) - Required - ID of the API key to retrieve

### Response
#### Success Response (200)
- **id** (string) - ID of the API key
- **created_at** (string) - RFC 3339 datetime string indicating when the API Key was created
- **created_by** (object) - The ID and type of the actor that created the API key
  - **id** (string) - ID of the actor that created the object
  - **type** (string) - Type of the actor that created the object
- **name** (string) - Name of the API key
- **partial_key_hint** (string) - Partially redacted hint for the API key
- **status** (string) - Status of the API key. Possible values: "active", "inactive", "archived"
- **type** (string) - Object type. For API Keys, this is always "api_key"
- **workspace_id** (string) - ID of the Workspace associated with the API key, or null if the API key belongs to the default Workspace

#### Response Example
```json
{
  "id": "key_123abc",
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": {
    "id": "user_456def",
    "type": "user"
  },
  "name": "Production API Key",
  "partial_key_hint": "sk_live_...abc123",
  "status": "active",
  "type": "api_key",
  "workspace_id": "ws_789ghi"
}
```
```

--------------------------------

### Handle Response Unions with Variant Conversion in Go

Source: https://platform.claude.com/docs/en/api/sdks/go

Illustrates how response unions are represented as flattened structs containing all possible fields from variants. Shows how to use .AsFooVariant() or .AsAny() methods to convert to specific variants and switch on variant types.

```go
type AnimalUnion struct {
	// From variants [Dog], [Cat]
	Owner Person `json:"owner"`
	// From variant [Dog]
	DogBreed string `json:"dog_breed"`
	// From variant [Cat]
	CatBreed string `json:"cat_breed"`
	// ...

	JSON struct {
		Owner respjson.Field
		// ...
	} `json:"-"`
}

// If animal variant
if animal.Owner.Address.ZipCode == "" {
	panic("missing zip code")
}

// Switch on the variant
switch variant := animal.AsAny().(type) {
case Dog:
case Cat:
default:
	panic("unexpected type")
}
```

--------------------------------

### Content Block Events

Source: https://platform.claude.com/docs/en/api/csharp/messages

Documentation for streaming events related to content blocks, including content block start events and delta events.

```APIDOC
## ContentBlockStartEvent

Represents the start of a new content block in a streaming response.

### Fields
- **Index** (Long) - Required - The index of the content block
- **ContentBlock** (ContentBlock) - Required - The content block being started
- **Type** (constant) - "content_block_start" - JSON element type identifier

## RawContentBlockDeltaEvent

Represents a delta (incremental update) for a content block in a streaming response.

### Fields
- **Delta** (RawContentBlockDelta) - Required - The delta update
- **Type** (constant) - "content_block_delta" - JSON element type identifier

### Delta Types

#### TextDelta
Represents an incremental text update.

##### Fields
- **Text** (string) - Required - The text content to append
- **Type** (constant) - "text_delta" - JSON element type identifier

#### InputJsonDelta
Represents an incremental JSON input update.

##### Fields
- **PartialJson** (string) - Required - Partial JSON string to append
- **Type** (constant) - "input_json_delta" - JSON element type identifier

#### CitationsDelta
Represents a citation update.

##### Fields
- **Citation** (Citation) - Required - The citation information
- **Type** (constant) - "citations_delta" - JSON element type identifier

#### ThinkingDelta
Represents an incremental thinking update.

##### Fields
- **Thinking** (string) - Required - The thinking content to append
- **Type** (constant) - "thinking_delta" - JSON element type identifier
```

--------------------------------

### Define Beta Computer Use Tool 20241022 Constants (Go)

Source: https://platform.claude.com/docs/en/api/go/beta/messages/create

This snippet defines Go constants for the `BetaToolComputerUse20241022`. It specifies the tool's name as "computer", its specific type version, and the "direct" caller allowed to invoke this tool. These constants are used for integrating and managing the computer interaction tool within the Claude API system.

```Go
const ComputerComputer Computer = "computer"
const Computer20241022Computer20241022 Computer20241022 = "computer_20241022"
const BetaToolComputerUse20241022AllowedCallerDirect BetaToolComputerUse20241022AllowedCaller = "direct"
```

--------------------------------

### GET /message_batches/{messageBatchID}/results

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches

Retrieves the results for a specific message batch, allowing the inclusion of beta features via query parameters.

```APIDOC
## GET /message_batches/{messageBatchID}/results

### Description
Retrieves the results for a specific message batch, allowing the inclusion of beta features via query parameters.

### Method
GET

### Endpoint
/message_batches/{messageBatchID}/results

### Parameters
#### Path Parameters
- **messageBatchID** (string) - Required - ID of the Message Batch.

#### Query Parameters
- **Betas** (array of AnthropicBeta) - Optional - Optional header to specify the beta version(s) you want to use. Possible values include: `message-batches-2024-09-24`, `prompt-caching-2024-07-31`, `computer-use-2024-10-22`, `computer-use-2025-01-24`, `pdfs-2024-09-25`, `token-counting-2024-11-01`, `token-efficient-tools-2025-02-19`, `output-128k-2025_02_19`, `files-api-2025-04-14`, `mcp-client-2025-04-04`, `mcp-client-2025-11-20`, `dev-full-thinking-2025-05-14`, `interleaved-thinking-2025-05-14`, `code-execution-2025-05-22`, `extended-cache-ttl-2025-04-11`, `context-1m-2025-08-07`, `context-management-2025-06-27`, `model-context-window-exceeded-2025-08-26`, `skills-2025-10-02`, `fast-mode-2026-02-01`.

#### Request Body
(Not applicable)

### Request Example
{}

### Response
#### Success Response (200)
- **messageBatchID** (string) - The ID of the message batch.
- **status** (string) - The current status of the message batch processing (e.g., "completed", "processing").
- **results** (array) - An array of results from the message batch. The structure of each item depends on the batch type.

#### Response Example
```json
{
  "messageBatchID": "batch_abc123",
  "status": "completed",
  "results": [
    {
      "message_id": "msg_xyz789",
      "content": "Hello, world!",
      "beta_features_applied": ["message-batches-2024-09-24"]
    }
  ]
}
```
```

--------------------------------

### Content Block Continuation Example

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/create

Demonstrates how the model can continue from an assistant turn in the input messages, allowing constraint of model output through partial assistant responses.

```APIDOC
## Content Block Continuation

### Description
When the input messages end with an assistant turn, the response content continues directly from that last turn. This allows constraining the model's output by providing a partial assistant response.

### Input Example
```json
[
  {
    "role": "user",
    "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
  },
  {
    "role": "assistant",
    "content": "The best answer is ("
  }
]
```

### Response Example
The model continues from the partial assistant response:
```json
[
  {
    "type": "text",
    "text": "B)"
  }
]
```

### Notes
- The response content directly continues the assistant's message
- This technique constrains the model to complete the partial response
- Useful for guiding model output format and content
```

--------------------------------

### Create Message with Claude API - PHP

Source: https://platform.claude.com/docs/en/api/client-sdks

Initialize the Anthropic client with API key and create a message. Demonstrates PHP named arguments and content array access patterns.

```php
use Anthropic\Client;

$client = new Client(apiKey: getenv('ANTHROPIC_API_KEY'));

$message = $client->messages->create(
    model: 'claude-opus-4-6',
    maxTokens: 1024,
    messages: [
        ['role' => 'user', 'content' => 'Hello, Claude']
    ],
);
echo $message->content[0]->text;
```

--------------------------------

### GET /v1/messages/batches/{message_batch_id}/results

Source: https://platform.claude.com/docs/en/api/java/messages/batches

Retrieve results from a message batch. Returns individual responses for each message in the batch with streaming support.

```APIDOC
## GET /v1/messages/batches/{message_batch_id}/results

### Description
Retrieve the results of a completed message batch. Results are returned as a stream of individual message responses.

### Method
GET

### Endpoint
/v1/messages/batches/{message_batch_id}/results

### Parameters
#### Path Parameters
- **message_batch_id** (string) - Required - The unique identifier of the batch to retrieve results from

### Response
#### Success Response (200)
- **type** (string) - Type of response object
- **result** (object) - Individual message result containing the response from Claude
- **custom_id** (string) - Custom identifier for the request

#### Response Example
{
  "type": "message_delta",
  "result": {
    "type": "message",
    "id": "msg_1234567890",
    "content": [
      {
        "type": "text",
        "text": "This is the response from Claude"
      }
    ],
    "model": "claude-3-5-sonnet-20241022",
    "stop_reason": "end_turn",
    "usage": {
      "input_tokens": 10,
      "output_tokens": 20
    }
  },
  "custom_id": "request_1"
}
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/beta/skills/versions/list

This endpoint retrieves a paginated list of skill versions for a given skill ID. It allows filtering by the number of items per page and supports navigating through results using a `next_page` token. Beta features can be enabled via the `anthropic-beta` header.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
This endpoint retrieves a paginated list of skill versions for a given skill ID. It allows filtering by the number of items per page and supports navigating through results using a `next_page` token. Beta features can be enabled via the `anthropic-beta` header.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill. The format and length of IDs may change over time.

#### Query Parameters
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **page** (string) - Optional - Optionally set to the `next_page` token from the previous response.

#### Header Parameters
- **anthropic-beta** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. Example values include: `"message-batches-2024-09-24"`, `"prompt-caching-2024-07-31"`, `"computer-use-2024-10-22"`, `"skills-2025-10-02"`, etc.

### Request Example
{}

### Response
#### Success Response (200)
- **data** (array of object) - List of skill versions.
  - **id** (string) - Unique identifier for the skill version. The format and length of IDs may change over time.
  - **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
  - **description** (string) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
  - **directory** (string) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
  - **name** (string) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
  - **skill_id** (string) - Identifier for the skill that this version belongs to.
  - **type** (string) - Object type. For Skill Versions, this is always `"skill_version"`.
  - **version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., `"1759178010641129"`).
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **next_page** (string) - Token to provide as `page` in the subsequent request to retrieve the next page of data.

#### Response Example
```json
{
  "data": [
    {
      "id": "sv_abc123",
      "created_at": "2023-10-27T10:00:00Z",
      "description": "Initial version of the skill.",
      "directory": "my_skill_v1",
      "name": "My Skill v1.0",
      "skill_id": "skill_xyz789",
      "type": "skill_version",
      "version": "1759178010641129"
    }
  ],
  "has_more": true,
  "next_page": "next_page_token_123"
}
```
```

--------------------------------

### Example of Claude API `tool_use` Output

Source: https://platform.claude.com/docs/en/api/creating-message-batches

This JSON array represents a `tool_use` content block returned by the Claude API when the model decides to invoke a defined tool. It includes the `type` as `tool_use`, a unique `id`, the `name` of the tool to be called (`get_stock_price`), and the `input` parameters generated by the model for that tool, in this case, `{"ticker": "^GSPC"}`.

```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
```

--------------------------------

### GET /v1/messages/batches/{message_batch_id}

Source: https://platform.claude.com/docs/en/api/java/messages/batches

Retrieve details about a specific message batch. Returns the current status, request counts, and metadata for the batch.

```APIDOC
## GET /v1/messages/batches/{message_batch_id}

### Description
Retrieve information about a specific message batch including its current processing status and request counts.

### Method
GET

### Endpoint
/v1/messages/batches/{message_batch_id}

### Parameters
#### Path Parameters
- **message_batch_id** (string) - Required - The unique identifier of the batch to retrieve

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the batch
- **type** (string) - Type of object (always "message_batch")
- **processing_status** (string) - Current status: queued, in_progress, succeeded, or failed
- **request_counts** (object) - Breakdown of request statuses
- **created_at** (string) - ISO 8601 timestamp of batch creation
- **expires_at** (string) - ISO 8601 timestamp when batch results expire

#### Response Example
{
  "id": "msgbatch_1234567890",
  "type": "message_batch",
  "processing_status": "in_progress",
  "request_counts": {
    "processing": 5,
    "succeeded": 10,
    "errored": 0,
    "canceled": 0,
    "total": 15
  },
  "created_at": "2024-01-15T10:30:00Z",
  "expires_at": "2024-01-22T10:30:00Z"
}
```

--------------------------------

### BetaToolBash Configuration

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches

Configuration for the bash tool, a specialized server tool that enables command execution in a bash environment.

```APIDOC
## BetaToolBash20241022 Configuration

### Description
Server tool configuration for bash command execution. This is a specialized tool that allows Claude to execute bash commands in a controlled environment.

### Properties

#### name (string) - Required
Tool name. Must be "bash" for this tool type.

**Value:** "bash"

#### type (string) - Required
Tool type identifier. Must be "bash_20241022" for this version.

**Value:** "bash_20241022"

### Usage Notes
Bash tools are server tools with their own specific behavior and documentation. Each server tool has individual documentation and behavior specifications. Refer to the bash tool documentation for specific usage patterns and capabilities.
```

--------------------------------

### Example Constrained Model Output with Assistant Turn in JSON

Source: https://platform.claude.com/docs/en/api/go/messages

Demonstrates how to constrain model output by ending the input messages with an assistant turn. Shows input messages with a partial assistant response and the corresponding model completion.

```json
[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]

Response content:
[{"type": "text", "text": "B)"}]
```

--------------------------------

### Untitled

Source: https://platform.claude.com/docs/en/api/beta/messages/count_tokens

No description

--------------------------------

### GET /v1/organizations/usage_report/claude_code

Source: https://platform.claude.com/docs/en/api/admin/usage_report/retrieve_claude_code

Retrieves daily aggregated usage metrics for Claude Code users, providing insights into developer productivity and enabling custom dashboard creation.

```APIDOC
## GET /v1/organizations/usage_report/claude_code

### Description
Retrieve daily aggregated usage metrics for Claude Code users. Enables organizations to analyze developer productivity and build custom dashboards.

### Method
GET

### Endpoint
/v1/organizations/usage_report/claude_code

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **starting_at** (string) - Required - UTC date in YYYY-MM-DD format. Returns metrics for this single day only.
- **limit** (number) - Optional - Number of records per page (default: 20, max: 1000).
- **page** (string) - Optional - Opaque cursor token from previous response's `next_page` field.

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **data** (array of object) - List of Claude Code usage records for the requested date.
  - **actor** (object) - The user or API key that performed the Claude Code actions.
    - **email_address** (string) - Email address of the user who performed Claude Code actions. (Present if `type` is "user_actor")
    - **type** (string) - Type of actor. Can be "user_actor" or "api_actor".
    - **api_key_name** (string) - Name of the API key used to perform Claude Code actions. (Present if `type` is "api_actor")
  - **core_metrics** (object) - Core productivity metrics measuring Claude Code usage and impact.
    - **commits_by_claude_code** (number) - Number of git commits created through Claude Code's commit functionality.
    - **lines_of_code** (object) - Statistics on code changes made through Claude Code.
      - **added** (number) - Total number of lines of code added across all files by Claude Code.
      - **removed** (number) - Total number of lines of code removed across all files by Claude Code.
    - **num_sessions** (number) - Number of distinct Claude Code sessions initiated by this actor.
    - **pull_requests_by_claude_code** (number) - Number of pull requests created through Claude Code's PR functionality.
  - **customer_type** (string) - Type of customer account ("api" or "subscription").
  - **date** (string) - UTC date for the usage metrics in YYYY-MM-DD format.
  - **model_breakdown** (array of object) - Token usage and cost breakdown by AI model used.
    - **estimated_cost** (object) - Estimated cost for using this model.
      - **amount** (number) - Estimated cost amount in minor currency units (e.g., cents for USD).
      - **currency** (string) - Currency code for the estimated cost (e.g., 'USD').
    - **model** (string) - Name of the AI model used for Claude Code interactions.
    - **tokens** (object) - Token usage breakdown for this model.
      - **cache_creation** (number) - Number of cache creation tokens consumed by this model.
      - **cache_read** (number) - Number of cache read tokens consumed by this model.
      - **input** (number) - Number of input tokens consumed by this model.
      - **output** (number) - Number of output tokens generated by this model.
  - **organization_id** (string) - ID of the organization that owns the Claude Code usage.
  - **terminal_type** (string) - Type of terminal or environment where Claude Code was used.
  - **tool_actions** (object) - Breakdown of tool action acceptance and rejection rates by tool type. (Keys are tool types)
    - **[tool_type_key]** (object) -
      - **accepted** (number) - Number of tool action proposals that the user accepted.
      - **rejected** (number) - Number of tool action proposals that the user rejected.
  - **subscription_type** (string) - Optional - Subscription tier for subscription customers ("enterprise" or "team"). `null` for API customers.
- **has_more** (boolean) - True if there are more records available beyond the current page.
- **next_page** (string) - Opaque cursor token for fetching the next page of results, or null if no more pages are available.

#### Response Example
```json
{
  "data": [
    {
      "actor": {
        "email_address": "user@example.com",
        "type": "user_actor"
      },
      "core_metrics": {
        "commits_by_claude_code": 15,
        "lines_of_code": {
          "added": 500,
          "removed": 120
        },
        "num_sessions": 5,
        "pull_requests_by_claude_code": 3
      },
      "customer_type": "subscription",
      "date": "2023-10-26",
      "model_breakdown": [
        {
          "estimated_cost": {
            "amount": 123,
            "currency": "USD"
          },
          "model": "claude-3-opus-20240229",
          "tokens": {
            "cache_creation": 100,
            "cache_read": 500,
            "input": 2000,
            "output": 800
          }
        }
      ],
      "organization_id": "org_abc123",
      "terminal_type": "VSCode",
      "tool_actions": {
        "code_generation": {
          "accepted": 10,
          "rejected": 2
        },
        "refactoring": {
          "accepted": 5,
          "rejected": 1
        }
      },
      "subscription_type": "team"
    }
  ],
  "has_more": true,
  "next_page": "eyJzdGFydGluZ19hdCI6IjIwMjMtMTAtMjYiLCJsaW1pdCI6MjAsIm9mZnNldCI6MX0="
}
```
```

--------------------------------

### Use beta features with code execution tool

Source: https://platform.claude.com/docs/en/api/sdks/python

Access beta API features through the `client.beta` property by adding appropriate beta headers to the `betas` field. Example demonstrates enabling code execution beta feature for mathematical computations.

```python
from anthropic import Anthropic

client = Anthropic()

response = client.beta.messages.create(
    max_tokens=1024,
    model="claude-opus-4-6",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What's 4242424242 * 4242424242?",
                },
            ],
        },
    ],
    tools=[
        {
            "name": "code_execution",
            "type": "code_execution_20250522",
        },
    ],
    betas=["code-execution-2025-05-22"],
)
```

--------------------------------

### CitationContentBlockLocationParam

Source: https://platform.claude.com/docs/en/api/java/messages/batches/create

Defines a citation's location within a specific content block, identifying the start and end indices, along with document details.

```APIDOC
## CitationContentBlockLocationParam

### Description
This data model specifies the precise location of a citation within a content block. It includes the cited text, the document index, and the start and end block indices.

### Method
Data Model

### Endpoint
N/A

### Parameters
#### Request Body
- **citedText** (String) - Required - The exact text cited.
- **documentIndex** (long) - Required - The index of the document where the citation is located.
- **documentTitle** (Optional<String>) - Optional - The title of
```

--------------------------------

### Create synchronous Anthropic client and send message

Source: https://platform.claude.com/docs/en/api/sdks/python

Initialize the Anthropic client with API key from environment variables and create a message using the synchronous API. The client handles authentication and provides convenient access to the messages endpoint.

```python
import os
from anthropic import Anthropic

client = Anthropic(
    # This is the default and can be omitted
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

message = client.messages.create(
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello, Claude",
        }
    ],
    model="claude-opus-4-6",
)
print(message.content)
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/typescript/beta/skills

Retrieves a paginated list of all versions associated with a specific skill ID. Results can be limited and paginated.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
Retrieves a paginated list of all versions associated with a specific skill ID. Results can be limited and paginated.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill. The format and length of IDs may change over time.

#### Query Parameters
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **page** (string) - Optional - Optionally set to the `next_page` token from the previous response.

#### Headers
- **betas** (Array<string>) - Optional - Optional header to specify the beta version(s) you want to use. Allowed values:
  - "message-batches-2024-09-24"
  - "prompt-caching-2024-07-31"
  - "computer-use-2024-10-22"
  - "computer-use-2025-01-24"
  - "pdfs-2024-09-25"
  - "token-counting-2024-11-01"
  - "token-efficient-tools-2025-02-19"
  - "output-128k-2025-02-19"
  - "files-api-2025-04-14"
  - "mcp-client-2025-04-04"
  - "mcp-client-2025-11-20"
  - "dev-full-thinking-2025-05-14"
  - "interleaved-thinking-2025-05-14"
  - "code-execution-2025-05-22"
  - "extended-cache-ttl-2025-04-11"
  - "context-1m-2025-08-07"
  - "context-management-2025-06-27"
  - "model-context-window-exceeded-2025-08-26"
  - "skills-2025-10-02"
  - "fast-mode-2026-02-01"

### Request Example
```
GET /v1/skills/skl_abcde/versions?limit=5&page=next_page_token
```

### Response
#### Success Response (200)
- **data** (Array<object>) - An array of skill version objects.
  - **id** (string) - Unique identifier for the skill version.
  - **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
  - **description** (string) - Description of the skill version.
  - **directory** (string) - Directory name of the skill version.
  - **name** (string) - Human-readable name of the skill version.
  - **skill_id** (string) - Identifier for the skill that this version belongs to.
  - **type** (string) - Object type. For Skill Versions, this is always "skill_version".
  - **version** (string) - Version identifier for the skill.
- **next_page** (string) - A token to retrieve the next page of results, if available.

#### Response Example
```json
{
  "data": [
    {
      "id": "skv_12345",
      "created_at": "2024-01-01T12:00:00Z",
      "description": "My first skill version",
      "directory": "my-skill",
      "name": "My Skill",
      "skill_id": "skl_abcde",
      "type": "skill_version",
      "version": "1759178010641129"
    },
    {
      "id": "skv_67890",
      "created_at": "2024-01-02T13:00:00Z",
      "description": "My second skill version",
      "directory": "my-skill-v2",
      "name": "My Skill V2",
      "skill_id": "skl_abcde",
      "type": "skill_version",
      "version": "1759264410641129"
    }
  ],
  "next_page": "some_next_page_token"
}
```
```

--------------------------------

### Define BetaSkillVersionListParams Structure - Go

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Defines the BetaSkillVersionListParams structure used as query and header parameters for listing skill versions. Includes pagination controls (Limit, Page) and optional beta version specification. The Limit parameter defaults to 20 and ranges from 1 to 1000 items per page.

```go
type BetaSkillVersionListParams struct {
  Limit  param.Field[int64]           // Query param: Number of items to return per page. Defaults to 20. Ranges from 1 to 1000.
  Page   param.Field[string]          // Query param: Optionally set to the next_page token from the previous response.
  Betas  param.Field[[]AnthropicBeta] // Header param: Optional header to specify the beta version(s) you want to use.
}
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/csharp/messages

List all Message Batches within a Workspace. Returns the most recently created batches first. Supports pagination using cursor-based navigation.

```APIDOC
## GET /v1/messages/batches

### Description
List all Message Batches within a Workspace. Most recently created batches are returned first.

### Method
GET

### Endpoint
`/v1/messages/batches`

### Parameters

#### Query Parameters
- **afterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.

- **beforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.

- **limit** (Long) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

### Response

#### Success Response (200)
- **BatchListPageResponse** - Paginated list of Message Batch objects
  - Returns array of MessageBatch objects with pagination metadata

### Request Example
```
GET /v1/messages/batches?limit=20
```

### Response Example
```json
{
  "data": [
    {
      "id": "msgbatch_123abc",
      "type": "message_batch",
      "processing_status": "ended",
      "request_counts": {
        "processing": 0,
        "succeeded": 100,
        "errored": 0,
        "canceled": 0,
        "expired": 0
      },
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-01-16T10:30:00Z",
      "ended_at": "2024-01-15T11:45:00Z",
      "archived_at": null,
      "cancel_initiated_at": null,
      "results_url": "https://api.anthropic.com/results/msgbatch_123abc.jsonl"
    }
  ]
}
```

### Related Resources
Learn more about the Message Batches API in the [user guide](https://docs.claude.com/en/docs/build-with-claude/batch-processing)
```

--------------------------------

### GET /v1/organizations/api_keys

Source: https://platform.claude.com/docs/en/api/admin/api_keys/list

Retrieves a paginated list of API keys associated with an organization. This endpoint allows filtering by various criteria such as creation user, status, and workspace, and supports cursor-based pagination.

```APIDOC
## GET /v1/organizations/api_keys

### Description
Retrieves a paginated list of API keys associated with an organization. This endpoint allows filtering by various criteria such as creation user, status, and workspace, and supports cursor-based pagination.

### Method
GET

### Endpoint
/v1/organizations/api_keys

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **created_by_user_id** (string) - Optional - Filter by the ID of the User who created the object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **status** ("active" | "inactive" | "archived") - Optional - Filter by API key status.
- **workspace_id** (string) - Optional - Filter by Workspace ID.

#### Request Body
(None)

### Request Example
(None)

### Response
#### Success Response (200)
- **data** (array of APIKey) - A list of API key objects.
  - **id** (string) - ID of the API key.
  - **created_at** (string) - RFC 3339 datetime string indicating when the API Key was created.
  - **created_by** (object) - The ID and type of the actor that created the API key.
    - **id** (string) - ID of the actor that created the object.
    - **type** (string) - Type of the actor that created the object.
  - **name** (string) - Name of the API key.
  - **partial_key_hint** (string) - Partially redacted hint for the API key.
  - **status** ("active" | "inactive" | "archived") - Status of the API key.
  - **type** ("api_key") - Object type. For API Keys, this is always `"api_key"`.
  - **workspace_id** (string) - ID of the Workspace associated with the API key, or `null` if the API key belongs to the default Workspace.
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
```json
{
  "data": [
    {
      "id": "ak-example-1",
      "created_at": "2023-10-27T10:00:00Z",
      "created_by": {
        "id": "user-abc",
        "type": "user"
      },
      "name": "My First API Key",
      "partial_key_hint": "sk-...",
      "status": "active",
      "type": "api_key",
      "workspace_id": "ws-xyz"
    },
    {
      "id": "ak-example-2",
      "created_at": "2023-10-27T10:05:00Z",
      "created_by": {
        "id": "user-abc",
        "type": "user"
      },
      "name": "Another API Key",
      "partial_key_hint": "sk-...",
      "status": "inactive",
      "type": "api_key",
      "workspace_id": "ws-xyz"
    }
  ],
  "first_id": "ak-example-1",
  "has_more": true,
  "last_id": "ak-example-2"
}
```
```

--------------------------------

### Configure MCP Toolset Structure in Go

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

Defines the BetaMCPToolset struct for configuring a group of tools from an MCP server. Allows enabling/disabling tools and setting defer_loading behavior at both server and individual tool levels, with optional cache control settings.

```go
type BetaMCPToolset struct{
  MCPServerName string
  Type MCPToolset
  CacheControl BetaCacheControlEphemeral
  Configs map[string]BetaMCPToolConfig
  DefaultConfig BetaMCPToolDefaultConfig
}
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version}

Source: https://platform.claude.com/docs/en/api/beta/skills/versions/retrieve

Retrieves a specific version of a skill using its unique identifier and version timestamp. This endpoint returns detailed metadata about the skill version including its name, description, creation date, and directory information.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
Get Skill Version - Retrieve a specific version of a skill with complete metadata and version information.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions/{version}

### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill. The format and length of IDs may change over time.
- **version** (string) - Required - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

### Header Parameters
- **anthropic-beta** (optional array of AnthropicBeta) - Optional header to specify the beta version(s) you want to use. Supported values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the skill version. The format and length of IDs may change over time.
- **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
- **description** (string) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **directory** (string) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
- **name** (string) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **skill_id** (string) - Identifier for the skill that this version belongs to.
- **type** (string) - Object type. For Skill Versions, this is always "skill_version".
- **version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

### Response Example
{
  "id": "skill_version_123",
  "created_at": "2025-01-30T10:00:00Z",
  "description": "A skill for processing data",
  "directory": "data_processor",
  "name": "Data Processor Skill",
  "skill_id": "skill_456",
  "type": "skill_version",
  "version": "1759178010641129"
}
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/csharp/beta/files

Retrieve a paginated list of file metadata objects. This endpoint allows filtering and pagination to efficiently browse uploaded files.

```APIDOC
## GET /v1/files

### Description
Retrieve a paginated list of file metadata objects. This endpoint allows filtering and pagination to efficiently browse uploaded files.

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Query Parameters
- **afterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **beforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (Long) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **betas** (IReadOnlyList<AnthropicBeta>) - Optional - (Header parameter) Optional header to specify the beta version(s) you want to use. Example values: "files-api-2025-04-14", "message-batches-2024-09-24".

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **Data** (IReadOnlyList<FileMetadata>) - List of file metadata objects.
  - **ID** (string) - Unique object identifier. The format and length of IDs may change over time.
  - **CreatedAt** (DateTimeOffset) - RFC 3339 datetime string representing when the file was created.
  - **Filename** (string) - Original filename of the uploaded file.
  - **MimeType** (string) - MIME type of the file.
  - **SizeBytes** (Long) - Size of the file in bytes.
  - **Type** (string) - Object type. For files, this is always `"file"`.
  - **Downloadable** (Boolean) - Whether the file can be downloaded.
- **FirstID** (string) - Optional - ID of the first file in this page of results.
- **HasMore** (Boolean) - Whether there are more results available.
- **LastID** (string) - Optional - ID of the last file in this page of results.

#### Response Example
```json
{
  "Data": [
    {
      "ID": "file_abc123",
      "CreatedAt": "2024-01-01T12:00:00Z",
      "Filename": "document.pdf",
      "MimeType": "application/pdf",
      "SizeBytes": 102400,
      "Type": "file",
      "Downloadable": true
    },
    {
      "ID": "file_def456",
      "CreatedAt": "2024-01-02T13:00:00Z",
      "Filename": "image.png",
      "MimeType": "image/png",
      "SizeBytes": 51200,
      "Type": "file",
      "Downloadable": true
    }
  ],
  "FirstID": "file_abc123",
  "HasMore": true,
  "LastID": "file_def456"
}
```
```

--------------------------------

### GET /beta/files/{file_id}/download - Download File

Source: https://platform.claude.com/docs/en/api/sdks/java

Download a file from the API using its file ID. Returns binary content that can be saved to disk or streamed to an output stream.

```APIDOC
## GET /beta/files/{file_id}/download

### Description
Download a file from the Anthropic API using its file ID. The endpoint returns binary content that can be saved to disk or transferred to an output stream.

### Method
GET

### Endpoint
/beta/files/{file_id}/download

### Parameters
#### Path Parameters
- **file_id** (string) - Required - The unique identifier of the file to download

### Request Example
```java
import com.anthropic.core.http.HttpResponse;
import com.anthropic.models.beta.files.FileDownloadParams;

HttpResponse response = client.beta().files().download("file_id");
```

### Response
#### Success Response (200)
- **body** (InputStream) - Binary content of the file
- **headers** (Map<String, String>) - Response headers including content-type and content-length

### Save to File Example
```java
import com.anthropic.core.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

try (HttpResponse response = client.beta().files().download("file_id")) {
    Files.copy(
        response.body(),
        Paths.get("path/to/save/file"),
        StandardCopyOption.REPLACE_EXISTING
    );
} catch (Exception e) {
    System.out.println("Something went wrong!");
    throw new RuntimeException(e);
}
```

### Transfer to OutputStream Example
```java
import com.anthropic.core.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Paths;

try (HttpResponse response = client.beta().files().download("file_id")) {
    response.body().transferTo(Files.newOutputStream(Paths.get("path/to/save/file")));
} catch (Exception e) {
    System.out.println("Something went wrong!");
    throw new RuntimeException(e);
}
```
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/python/beta/skills/versions

Retrieve a paginated list of all versions associated with a specific skill. Results can be limited and paginated using `limit` and `page` parameters.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
Retrieve a paginated list of all versions associated with a specific skill. Results can be limited and paginated using `limit` and `page` parameters.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (str) - Required - Unique identifier for the skill.

#### Query Parameters
- **limit** (Optional[int]) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **page** (Optional[str]) - Optional - Optionally set to the `next_page` token from the previous response.
- **betas** (Optional[List[AnthropicBetaParam]]) - Optional - Optional header to specify the beta version(s) you want to use. Example values: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "skills-2025-10-02".

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **id** (str) - Unique identifier for the skill version.
- **created_at** (str) - ISO 8601 timestamp of when the skill version was created.
- **description** (str) - Description of the skill version, extracted from the SKILL.md file.
- **directory** (str) - Directory name of the skill version.
- **name** (str) - Human-readable name of the skill version, extracted from the SKILL.md file.
- **skill_id** (str) - Identifier for the skill that this version belongs to.
- **type** (str) - Object type. For Skill Versions, this is always "skill_version".
- **version** (str) - Version identifier for the skill (e.g., "1759178010641129").

#### Response Example
```json
{
  "data": [
    {
      "id": "skv_example_id_1",
      "created_at": "2024-01-01T12:00:00Z",
      "description": "Initial version of my awesome skill.",
      "directory": "my_awesome_skill_v1",
      "name": "My Awesome Skill Version 1",
      "skill_id": "skl_example_id_abcde",
      "type": "skill_version",
      "version": "1759178010641129"
    },
    {
      "id": "skv_example_id_2",
      "created_at": "2024-01-15T10:30:00Z",
      "description": "Updated skill logic and features.",
      "directory": "my_awesome_skill_v2",
      "name": "My Awesome Skill Version 2",
      "skill_id": "skl_example_id_abcde",
      "type": "skill_version",
      "version": "1759178010641130"
    }
  ],
  "next_page": null
}
```
```

--------------------------------

### Tool Choice Configuration

Source: https://platform.claude.com/docs/en/api/go/messages/batches/create

Specifies how the model should use provided tools. Options include automatic selection, any available tool, specific tool, or no tools. Supports parallel tool use control.

```APIDOC
## Tool Choice Configuration

### Description
How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

### Type
`ToolChoiceUnion`

### Tool Choice Auto

#### Type
`ToolChoiceAuto`

#### Description
The model will automatically decide whether to use tools.

#### Fields
- **Type** (Auto) - Required - Constant value: `"auto"`
- **DisableParallelToolUse** (bool) - Optional - Whether to disable parallel tool use. Defaults to `false`. If `true`, model outputs at most one tool use.

### Tool Choice Any

#### Type
`ToolChoiceAny`

#### Description
The model will use any available tools.

#### Fields
- **Type** (Any) - Required - Constant value: `"any"`
- **DisableParallelToolUse** (bool) - Optional - Whether to disable parallel tool use. Defaults to `false`. If `true`, model outputs exactly one tool use.

### Tool Choice Specific Tool

#### Type
`ToolChoiceTool`

#### Description
The model will use the specified tool with `tool_choice.name`.

#### Fields
- **Name** (string) - Required - The name of the tool to use
- **Type** (Tool) - Required - Constant value: `"tool"`
- **DisableParallelToolUse** (bool) - Optional - Whether to disable parallel tool use. Defaults to `false`. If `true`, model outputs exactly one tool use.

### Tool Choice None

#### Type
`ToolChoiceNone`

#### Description
The model will not be allowed to use tools.

#### Fields
- **Type** (None) - Required - Constant value: `"none"`

### Usage Examples

#### Auto Tool Choice
```json
{
  "tool_choice": {
    "type": "auto",
    "disable_parallel_tool_use": false
  }
}
```

#### Specific Tool Choice
```json
{
  "tool_choice": {
    "type": "tool",
    "name": "get_stock_price",
    "disable_parallel_tool_use": true
  }
}
```

#### No Tools
```json
{
  "tool_choice": {
    "type": "none"
  }
}
```
```

--------------------------------

### Tool: BetaWebSearchTool20250910 Configuration

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Defines the configuration parameters for the Beta Web Search Tool, including domain restrictions, caching, and user location settings. This tool is used to enable web search capabilities within the model's context.

```APIDOC
## Tool: BetaWebSearchTool20250910

### Description
Configuration for the Beta Web Search Tool, specifying its behavior and constraints when used within an API context. This tool allows the model to perform web searches.

### Parameters
#### Request Body
- **allowed_callers** (array of string) - Optional - Specifies which callers are allowed to invoke this tool. Can be "direct" or "code_execution_20250825".
- **allowed_domains** (array of string) - Optional - If provided, only these domains will be included in results. Cannot be used alongside `blocked_domains`.
- **blocked_domains** (array of string) - Optional - If provided, these domains will never appear in results. Cannot be used alongside `allowed_domains`.
- **cache_control** (object) - Optional - Create a cache control breakpoint at this content block.
  - **type** (string) - Required - Must be "ephemeral".
  - **ttl** (string) - Optional - The time-to-live for the cache control breakpoint. Can be "5m" (5 minutes) or "1h" (1 hour). Defaults to "5m".
- **defer_loading** (boolean) - Optional - If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search.
- **max_uses** (number) - Optional - Maximum number of times the tool can be used in the API request.
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.
- **user_location** (object) - Optional - Parameters for the user's location. Used to provide more relevant search results.
  - **type** (string) - Required - Must be "approximate".
  - **city** (string) - Optional - The city of the user.
  - **country** (string) - Optional - The two letter [ISO country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) of the user.
  - **region** (string) - Optional - The region of the user.
  - **timezone** (string) - Optional - The [IANA timezone](https://nodatime.org/TimeZones) of the user.

### Request Example
```json
{
  "tool_name": "web_search",
  "allowed_domains": ["example.com"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  },
  "user_location": {
    "type": "approximate",
    "city": "New York",
    "country": "US"
  }
}
```
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/batches/list

List all Message Batches within a Workspace. Most recently created batches are returned first. This endpoint supports pagination and allows specifying beta features via headers.

```APIDOC
## GET /v1/messages/batches

### Description
List all Message Batches within a Workspace. Most recently created batches are returned first. This endpoint supports pagination and allows specifying beta features via headers.

### Method
GET

### Endpoint
/v1/messages/batches

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **afterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **beforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (long) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **betas** (string or array of strings) - Optional - Optional header to specify the beta version(s) you want to use. Possible values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

#### Request Body
(None)

### Request Example
{}

### Response
#### Success Response (200)
- **data** (array of objects) - A list of Message Batch objects.
- **next_cursor** (string) - Optional - A cursor for the next page of results.
- **prev_cursor** (string) - Optional - A cursor for the previous page of results.

#### Response Example
{
  "data": [
    {
      "id": "batch_abc123",
      "status": "completed",
      "created_at": "2024-01-01T12:00:00Z",
      "metadata": {}
    }
  ],
  "next_cursor": "batch_xyz456"
}
```

--------------------------------

### Temporarily Modify Anthropic Java Client Configuration

Source: https://platform.claude.com/docs/en/api/sdks/java

This snippet demonstrates how to create a new client instance with temporary configuration changes using `withOptions()`. This method allows modifying settings like `baseUrl` or `maxRetries` for specific requests without affecting the original client's configuration, while still sharing underlying resources.

```java
import com.anthropic.client.AnthropicClient;

AnthropicClient clientWithOptions = client.withOptions(optionsBuilder -> {
  optionsBuilder.baseUrl("https://example.com");
  optionsBuilder.maxRetries(42);
});
```

--------------------------------

### System Prompt Parameter with TextBlockParam

Source: https://platform.claude.com/docs/en/api/python/messages

Defines system prompt as either a string or iterable of TextBlockParam objects. TextBlockParam includes text content, optional cache control for ephemeral caching (5m or 1h TTL), and citation parameters for tracking document sources.

```python
system: Optional[Union[str, Iterable[TextBlockParam]]]

class TextBlockParam:
    text: str
    type: Literal["text"]
    cache_control: Optional[CacheControlEphemeral]
    citations: Optional[List[TextCitationParam]]

class CacheControlEphemeral:
    type: Literal["ephemeral"]
    ttl: Optional[Literal["5m", "1h"]]
```

--------------------------------

### Model Output Continuation Example

Source: https://platform.claude.com/docs/en/api/ruby/beta/messages/batches

Demonstrates how the model continues from an assistant turn in the input messages. When the input ends with an assistant message, the response content continues directly from that turn, allowing constraint of model output through partial assistant responses.

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"
    },
    {
      "role": "assistant",
      "content": "The best answer is ("
    }
  ],
  "content": [
    {
      "type": "text",
      "text": "B)"
    }
  ]
}
```

--------------------------------

### Message Content Continuation Example

Source: https://platform.claude.com/docs/en/api/csharp/messages

Demonstrates how the model continues from an assistant turn in the input messages. If the input ends with an assistant message, the response content continues directly from that turn.

```APIDOC
## Message Content Continuation

### Description
When the input `messages` end with an `assistant` turn, the response `content` continues directly from that last turn. This allows constraining the model's output format.

### Input Example
```json
[
  {"role": "user", "content": "What's the Greek name for Sun? (A) Sol (B) Helios (C) Sun"},
  {"role": "assistant", "content": "The best answer is ("}
]
```

### Response Content Example
```json
[
  {"type": "text", "text": "B)"}
]
```

### Use Cases
- Force specific output format by providing partial assistant message
- Constrain model responses to multiple choice options
- Guide model to use specific terminology or structure
- Continue conversations with predetermined prefixes
```

--------------------------------

### BetaCitationCharLocation for Plain Text References

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches

Citation class for plain text documents, providing character-level location information including start and end character indices and document index.

```java
class BetaCitationCharLocation implements BetaTextCitation {
  String citedText;  // Cited text
  long documentIndex;  // Document index
  Optional<String> documentTitle;  // Document title
  long startCharIndex;  // Start character position
  long endCharIndex;  // End character position
  Optional<String> fileId;  // File identifier
  JsonValue type = "char_location";  // Type constant
}
```

--------------------------------

### Configure BetaToolComputerUse20250124

Source: https://platform.claude.com/docs/en/api/ruby/beta/messages/batches/create

Set up computer use tool with display dimensions, X11 display number, and caller restrictions. Includes cache control configuration and optional deferred loading for conditional tool inclusion in system prompts.

```ruby
BetaToolComputerUse20250124.new(
  name: :computer,
  type: :computer_20250124,
  display_width_px: 1920,
  display_height_px: 1080,
  display_number: 0,
  allowed_callers: [:direct, :code_execution_20250825],
  cache_control: { type: :ephemeral, ttl: :"5m" },
  defer_loading: false,
  strict: true
)
```

--------------------------------

### BetaCitationContentBlockLocation for Content Documents

Source: https://platform.claude.com/docs/en/api/java/beta/messages/batches

Citation class for content documents, providing block-level location information using start and end block indices to reference specific content sections.

```java
class BetaCitationContentBlockLocation implements BetaTextCitation {
  String citedText;  // Cited text
  long documentIndex;  // Document index
  Optional<String> documentTitle;  // Document title
  long startBlockIndex;  // Start block index
  long endBlockIndex;  // End block index
  Optional<String> fileId;  // File identifier
  JsonValue type = "content_block_location";  // Type constant
}
```

--------------------------------

### Sampling Parameters - Top P (Nucleus Sampling)

Source: https://platform.claude.com/docs/en/api/python/messages

Configure top_p for nucleus sampling to control output diversity by setting a cumulative probability threshold. The model samples from the smallest set of tokens whose cumulative probability exceeds the specified threshold. Use either top_p or temperature, but not both.

```APIDOC
## Top P (Nucleus Sampling) Configuration

### Description
Control output diversity using nucleus sampling with a cumulative probability threshold.

### Parameters

#### top_p
- **Type**: `Optional[float]`
- **Required**: No
- **Description**: Use nucleus sampling with specified probability threshold
- **Constraint**: Must be a float between 0 and 1
- **Constraint**: Should not be used together with `temperature` (use one or the other)
- **Use Case**: Advanced use cases only. Usually only `temperature` is needed

### Technical Details
In nucleus sampling, the cumulative distribution over all options for each subsequent token is computed in decreasing probability order. The distribution is cut off once it reaches the probability specified by `top_p`. This ensures the model only considers the most likely tokens that collectively account for the specified probability mass.

### How It Works
1. Sort all possible next tokens by probability (highest to lowest)
2. Calculate cumulative probability starting from the highest
3. Include tokens until cumulative probability reaches `top_p`
4. Sample only from this subset

### Request Example
```json
{
  "top_p": 0.9
}
```

### Request Example (Conservative)
```json
{
  "top_p": 0.5
}
```

### Important Notes
- **Mutually Exclusive**: Do not use `top_p` and `temperature` together
- **Recommended**: For most use cases, adjust `temperature` instead
- **Advanced Usage**: `top_p` is recommended for advanced use cases only
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/typescript/models

List all available models. Returns a paginated list of models with the most recently released models listed first. Use pagination parameters to navigate through results.

```APIDOC
## GET /v1/models

### Description
List available models that can be used with the API. The response includes model identifiers, display names, creation dates, and other metadata. More recently released models are listed first.

### Method
GET

### Endpoint
`/v1/models`

### Parameters
#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to 20. Ranges from 1 to 1000.

#### Header Parameters
- **betas** (Array<AnthropicBeta>) - Optional - Header to specify the beta version(s) you want to use. Supported values include: message-batches-2024-09-24, prompt-caching-2024-07-31, computer-use-2024-10-22, computer-use-2025-01-24, pdfs-2024-09-25, token-counting-2024-11-01, token-efficient-tools-2025-02-19, output-128k-2025-02-19, files-api-2025-04-14, mcp-client-2025-04-04, mcp-client-2025-11-20, dev-full-thinking-2025-05-14, interleaved-thinking-2025-05-14, code-execution-2025-05-22, extended-cache-ttl-2025-04-11, context-1m-2025-08-07, context-management-2025-06-27, model-context-window-exceeded-2025-08-26, skills-2025-10-02, fast-mode-2026-02-01.

### Response
#### Success Response (200)
Returns a paginated list of ModelInfo objects.

- **id** (string) - Unique model identifier.
- **created_at** (string) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
- **display_name** (string) - A human-readable name for the model.
- **type** (string) - Object type. For Models, this is always "model".

### Response Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "type": "model",
      "created_at": "2024-10-22T00:00:00Z",
      "display_name": "Claude 3.5 Sonnet"
    },
    {
      "id": "claude-3-opus-20250219",
      "type": "model",
      "created_at": "2025-02-19T00:00:00Z",
      "display_name": "Claude 3 Opus"
    }
  ]
}
```
```

--------------------------------

### System Prompt Configuration

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches/create

Provide system prompts to Claude for context and instructions. System prompts can be specified as plain text or as structured text blocks with optional cache control and citations.

```APIDOC
## System Prompt Configuration

### Parameters

#### system
- **Type**: `Optional[Union[str, Iterable[BetaTextBlockParam]]]`
- **Required**: No
- **Description**: System prompt. A system prompt is a way of providing context and instructions to Claude, such as specifying a particular goal or role. See our [guide to system prompts](https://docs.claude.com/en/docs/system-prompts).

##### System Prompt Formats

**Option 1: Plain String**
- **Type**: `str`
- Simple text-based system prompt

**Option 2: Text Block Parameters**
- **Type**: `Iterable[BetaTextBlockParam]`

##### Text Block Properties
- **text** (`str`) - Required - The text content of the system prompt
- **type** (`Literal["text"]`) - Required - Must be `"text"`
- **cache_control** (`Optional[BetaCacheControlEphemeral]`) - Optional - Create a cache control breakpoint at this content block
  - **type** (`Literal["ephemeral"]`) - Required - Must be `"ephemeral"`
  - **ttl** (`Optional[Literal["5m", "1h"]]`) - Optional - The time-to-live for the cache control breakpoint
    - `"5m"` - 5 minutes (default)
    - `"1h"` - 1 hour

- **citations** (`Optional[List[BetaTextCitationParam]]`) - Optional - Citation information for the text block
  - **BetaCitationCharLocationParam**
    - **cited_text** (`str`) - The text being cited
    - **document_index** (`int`) - Index of the document
    - **document_title** (`Optional[str]`) - Title of the document
    - **start_char_index** (`int`) - Starting character index
    - **end_char_index** (`int`) - Ending character index
    - **type** (`Literal["char_location"]`) - Must be `"char_location"`

  - **BetaCitationPageLocationParam**
    - **cited_text** (`str`) - The text being cited

### Request Example
```json
{
  "system": "You are a helpful assistant."
}
```

### Advanced Request Example with Text Blocks
```json
{
  "system": [
    {
      "type": "text",
      "text": "You are an expert in machine learning.",
      "cache_control": {
        "type": "ephemeral",
        "ttl": "5m"
      }
    }
  ]
}
```
```

--------------------------------

### Add anthropic-java-vertex dependency with Gradle

Source: https://platform.claude.com/docs/en/api/sdks/java

Install the anthropic-java-vertex library using Gradle build configuration. This dependency includes Google Cloud classes as transitive dependencies required for Vertex AI integration.

```kotlin
implementation("com.anthropic:anthropic-java-vertex:2.11.1")
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/typescript/beta/files/list

This endpoint allows you to retrieve a paginated list of files that have been uploaded to the Anthropic API. You can use cursor-based pagination to navigate through the results.

```APIDOC
## GET /v1/files

### Description
This endpoint allows you to retrieve a paginated list of files that have been uploaded to the Anthropic API. You can use cursor-based pagination to navigate through the results.

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **betas** (Array<string>) - Optional - Optional header to specify the beta version(s) you want to use. Example values: `"message-batches-2024-09-24"`, `"prompt-caching-2024-07-31"`.

#### Request Body
(None)

### Request Example
{}

### Response
#### Success Response (200)
- **id** (string) - Unique object identifier. The format and length of IDs may change over time.
- **created_at** (string) - RFC 3339 datetime string representing when the file was created.
- **filename** (string) - Original filename of the uploaded file.
- **mime_type** (string) - MIME type of the file.
- **size_bytes** (number) - Size of the file in bytes.
- **type** (string) - Object type. For files, this is always `"file"`.
- **downloadable** (boolean) - Optional - Whether the file can be downloaded.

#### Response Example
{
  "data": [
    {
      "id": "file_abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 102400,
      "type": "file",
      "downloadable": true
    },
    {
      "id": "file_def456",
      "created_at": "2024-01-02T10:30:00Z",
      "filename": "image.png",
      "mime_type": "image/png",
      "size_bytes": 51200,
      "type": "file",
      "downloadable": false
    }
  ],
  "limit": 20,
  "has_next_page": true
}
```

--------------------------------

### Define Computer Use Tool with Display Configuration

Source: https://platform.claude.com/docs/en/api/python/beta/messages/batches/create

Configures a computer use tool with display dimensions, cache control, and caller restrictions. The tool enables model interaction with computer displays via X11 display numbers and supports deferred loading for optimized prompt management.

```python
class BetaToolComputerUse20250124:
    display_height_px: int
    display_width_px: int
    name: Literal["computer"]
    type: Literal["computer_20250124"]
    allowed_callers: Optional[List[Literal["direct", "code_execution_20250825"]]]
    cache_control: Optional[BetaCacheControlEphemeral]
    defer_loading: Optional[bool]
    display_number: Optional[int]
    input_examples: Optional[List[Dict[str, object]]]
    strict: Optional[bool]
```

--------------------------------

### Computer Use Tool Configuration

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

Configure the Computer Use tool (version 20241022) for screen interaction and display control. Supports display dimensions, X11 display numbers, and cache control with caller permissions.

```APIDOC
## Computer Use Tool (20241022)

### Description
Configures the Computer Use tool for screen interaction and display control with specified dimensions and caller permissions.

### Tool Type
`computer_20241022`

### Configuration Parameters

#### Display Configuration
- **DisplayWidthPx** (integer) - Required - The width of the display in pixels
- **DisplayHeightPx** (integer) - Required - The height of the display in pixels
- **DisplayNumber** (integer) - Optional - The X11 display number (e.g., 0, 1) for the display

#### AllowedCallers
- **direct** (string) - Allows direct callers to use this tool
- **code_execution_20250825** (string) - Allows code execution tool to call this tool

#### CacheControl
- **Type** (string) - `ephemeral` - Creates a cache control breakpoint at this content block
- **TTL** (string) - Time-to-live for cache control
  - `5m` - 5 minutes (default)
  - `1h` - 1 hour

#### Optional Parameters
- **InputExamples** (array) - Array of example inputs for the tool
- **DeferLoading** (boolean) - If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search
- **Strict** (boolean) - When true, guarantees schema validation on tool names and inputs

### Configuration Example
```json
{
  "type": "computer_20241022",
  "name": "computer",
  "display_width_px": 1920,
  "display_height_px": 1080,
  "display_number": 0,
  "allowed_callers": ["direct", "code_execution_20250825"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "5m"
  },
  "defer_loading": false,
  "strict": true
}
```
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/csharp/messages/batches

Retrieves a paginated list of all Message Batches within a Workspace. Batches are returned in reverse chronological order of creation.

```APIDOC
## GET /v1/messages/batches

### Description
List all Message Batches within a Workspace. Most recently created batches are returned first.

### Method
GET

### Endpoint
/v1/messages/batches

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **afterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **beforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (Long) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Request Body
(None)

### Request Example
{}

### Response
#### Success Response (200)
- **ID** (string) - Required - Unique object identifier.
- **ArchivedAt** (DateTimeOffset?) - Required - RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.
- **CancelInitiatedAt** (DateTimeOffset?) - Required - RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.
- **CreatedAt** (DateTimeOffset) - Required - RFC 3339 datetime string representing the time at which the Message Batch was created.
- **EndedAt** (DateTimeOffset?) - Required - RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends. Processing ends when every request in a Message Batch has either succeeded, errored, canceled, or expired.
- **ExpiresAt** (DateTimeOffset) - Required - RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.
- **ProcessingStatus** (enum) - Required - Processing status of the Message Batch. Possible values: `"in_progress"`, `"canceling"`, `"ended"`.
- **RequestCounts** (object) - Required - Tallies requests within the Message Batch, categorized by their status.
  - **Canceled** (Long) - Required - Number of requests in the Message Batch that have been canceled.
  - **Errored** (Long) - Required - Number of requests in the Message Batch that encountered an error.
  - **Expired** (Long) - Required - Number of requests in the Message Batch that have expired.
  - **Processing** (Long) - Required - Number of requests in the Message Batch that are processing.
  - **Succeeded** (Long) - Required - Number of requests in the Message Batch that have completed successfully.
- **ResultsUrl** (string?) - Required - URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends.
- **Type** (string) - Required - Object type. For Message Batches, this is always `"message_batch"`.

#### Response Example
```json
{
  "data": [
    {
      "ID": "mb_01J0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0",
      "ArchivedAt": null,
      "CancelInitiatedAt": null,
      "CreatedAt": "2024-07-30T10:00:00Z",
      "EndedAt": null,
      "ExpiresAt": "2024-07-31T10:00:00Z",
      "ProcessingStatus": "in_progress",
      "RequestCounts": {
        "Canceled": 0,
        "Errored": 0,
        "Expired": 0,
        "Processing": 100,
        "Succeeded": 0
      },
      "ResultsUrl": null,
      "Type": "message_batch"
    },
    {
      "ID": "mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0",
      "ArchivedAt": null,
      "CancelInitiatedAt": null,
      "CreatedAt": "2024-07-29T15:30:00Z",
      "EndedAt": "2024-07-29T16:00:00Z",
      "ExpiresAt": "2024-07-30T15:30:00Z",
      "ProcessingStatus": "ended",
      "RequestCounts": {
        "Canceled": 0,
        "Errored": 5,
        "Expired": 0,
        "Processing": 0,
        "Succeeded": 95
      },
      "ResultsUrl": "https://api.claude.com/v1/messages/batches/mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0/results",
      "Type": "message_batch"
    }
  ],
  "pagination": {
    "next_cursor": "mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0"
  }
}
```
```

--------------------------------

### POST /v1/complete - Create a Text Completion

Source: https://platform.claude.com/docs/en/api/completions/create

This endpoint allows you to send a prompt to the Claude model and receive a text completion. Configure the model, prompt, and generation parameters using the request body.

```APIDOC
## POST /v1/complete

### Description
This endpoint allows you to send a prompt to the Claude model and receive a text completion. Configure the model, prompt, and generation parameters using the request body.

### Method
POST

### Endpoint
/v1/complete

### Parameters
#### Path Parameters
(None)

#### Query Parameters
(None)

#### Request Body
- **max_tokens_to_sample** (number) - Required - The maximum number of tokens to generate before stopping. Note that our models may stop _before_ reaching this maximum. This parameter only specifies the absolute maximum number of tokens to generate.
- **model** (string) - Required - The model that will complete your prompt. See [models](https://docs.anthropic.com/en/docs/models-overview) for additional details and options. Example values include: `"claude-opus-4-6"`, `"claude-3-7-sonnet-latest"`, `"claude-3-5-haiku-latest"`.
- **prompt** (string) - Required - The prompt that you want Claude to complete. For proper response generation you will need to format your prompt using alternating `\n\nHuman:` and `\n\nAssistant:` conversational turns. For example: `"\n\nHuman: {userQuestion}\n\nAssistant:"`. See [prompt validation](https://docs.claude.com/en/api/prompt-validation) and our guide to [prompt design](https://docs.claude.com/en/docs/intro-to-prompting) for more details.
- **metadata** (object) - Optional - An object describing metadata about the request.
  - **user_id** (string) - Optional - An external identifier for the user who is associated with the request. This should be a uuid, hash value, or other opaque identifier. Anthropic may use this id to help detect abuse. Do not include any identifying information such as name, email address, or phone number.
- **stop_sequences** (array of string) - Optional - Sequences that will cause the model to stop generating. Our models stop on `"\n\nHuman:"`, and may include additional built-in stop sequences in the future. By providing the stop_sequences parameter, you may include additional strings that will cause the model to stop generating.
- **stream** (boolean) - Optional - Whether to incrementally stream the response using server-sent events. See [streaming](https://docs.claude.com/en/api/streaming) for details.
- **temperature** (number) - Optional - Amount of randomness injected into the response. Defaults to `1.0`. Ranges from `0.0` to `1.0`. Use `temperature` closer to `0.0` for analytical / multiple choice, and closer to `1.0` for creative and generative tasks. Note that even with `temperature` of `0.0`, the results will not be fully deterministic.
- **top_k** (number) - Optional - Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. [Learn more technical details here](https://towardsdatascience.com/how-to-sample-from-language-models-682bceb97277). Recommended for advanced use cases only. You usually only need to use `temperature`.
- **top_p** (number) - Optional - Use nucleus sampling. In nucleus sampling, we compute the cumulative distribution over all the options for each subsequent token in decreasing probability order and cut it off once it reaches a particular probability specified by `top_p`. You should either alter `temperature` or `top_p`, but not both.

### Request Example
```json
{
  "model": "claude-3-5-haiku-latest",
  "prompt": "\n\nHuman: What is the capital of France?\n\nAssistant:",
  "max_tokens_to_sample": 100,
  "temperature": 0.7,
  "stop_sequences": ["\n\nHuman:"],
  "metadata": {
    "user_id": "user-1234"
  }
}
```

### Response
#### Success Response (200)
- **completion** (string) - The generated text completion from the model.
- **stop_reason** (string) - The reason the model stopped generating tokens (e.g., `stop_sequence`, `max_tokens`).
- **model** (string) - The model used for the completion.

#### Response Example
```json
{
  "completion": "Paris is the capital of France.",
  "stop_reason": "stop_sequence",
  "model": "claude-3-5-haiku-latest"
}
```
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/go/messages/batches/list

This endpoint lists all Message Batches within a Workspace. The most recently created batches are returned first, and results can be paginated.

```APIDOC
## GET /v1/messages/batches

### Description
This endpoint lists all Message Batches within a Workspace. The most recently created batches are returned first, and results can be paginated.

### Method
GET

### Endpoint
/v1/messages/batches

### Parameters
#### Path Parameters
_None_

#### Query Parameters
- **AfterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **BeforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **Limit** (int64) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Request Body
_None_

### Request Example
```json
{}
```

### Response
#### Success Response (200)
- **ID** (string) - Unique object identifier.
- **ArchivedAt** (Time) - RFC 3339 datetime string representing the time at which the Message Batch was archived and its results became unavailable.
- **CancelInitiatedAt** (Time) - RFC 3339 datetime string representing the time at which cancellation was initiated for the Message Batch. Specified only if cancellation was initiated.
- **CreatedAt** (Time) - RFC 3339 datetime string representing the time at which the Message Batch was created.
- **EndedAt** (Time) - RFC 3339 datetime string representing the time at which processing for the Message Batch ended. Specified only once processing ends.
- **ExpiresAt** (Time) - RFC 3339 datetime string representing the time at which the Message Batch will expire and end processing, which is 24 hours after creation.
- **ProcessingStatus** (string) - Processing status of the Message Batch. Possible values: `in_progress`, `canceling`, `ended`.
- **RequestCounts** (object) - Tallies requests within the Message Batch, categorized by their status.
    - **Canceled** (int64) - Number of requests in the Message Batch that have been canceled.
    - **Errored** (int64) - Number of requests in the Message Batch that encountered an error.
    - **Expired** (int64) - Number of requests in the Message Batch that have expired.
    - **Processing** (int64) - Number of requests in the Message Batch that are processing.
    - **Succeeded** (int64) - Number of requests in the Message Batch that have completed successfully.
- **ResultsURL** (string) - URL to a `.jsonl` file containing the results of the Message Batch requests. Specified only once processing ends.
- **Type** (string) - Object type. For Message Batches, this is always `"message_batch"`.

#### Response Example
```json
{
  "data": [
    {
      "ID": "msgbatch_12345",
      "ArchivedAt": null,
      "CancelInitiatedAt": null,
      "CreatedAt": "2023-10-27T10:00:00Z",
      "EndedAt": null,
      "ExpiresAt": "2023-10-28T10:00:00Z",
      "ProcessingStatus": "in_progress",
      "RequestCounts": {
        "Canceled": 0,
        "Errored": 0,
        "Expired": 0,
        "Processing": 5,
        "Succeeded": 0
      },
      "ResultsURL": null,
      "Type": "message_batch"
    },
    {
      "ID": "msgbatch_67890",
      "ArchivedAt": null,
      "CancelInitiatedAt": null,
      "CreatedAt": "2023-10-26T15:30:00Z",
      "EndedAt": "2023-10-26T16:00:00Z",
      "ExpiresAt": "2023-10-27T15:30:00Z",
      "ProcessingStatus": "ended",
      "RequestCounts": {
        "Canceled": 0,
        "Errored": 1,
        "Expired": 0,
        "Processing": 0,
        "Succeeded": 9
      },
      "ResultsURL": "https://example.com/results/msgbatch_67890.jsonl",
      "Type": "message_batch"
    }
  ],
  "next_cursor": "msgbatch_67890"
}
```
```

--------------------------------

### Tool Use Request and Response

Source: https://platform.claude.com/docs/en/api/messages-count-tokens

Demonstrates how Claude models produce tool_use content blocks in responses when they need to call a tool, and how to return tool results back to the model.

```APIDOC
## Tool Use Workflow

### Description
When a model needs to use a tool, it produces a `tool_use` content block in its response. The client then executes the tool and returns the result via a `tool_result` content block.

### Model Tool Use Request

When asked a question that requires a tool, the model produces:

```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": {
      "ticker": "^GSPC"
    }
  }
]
```

#### Tool Use Block Fields
- **type** (string) - Always "tool_use" for tool invocation blocks.
- **id** (string) - Unique identifier for this tool use request.
- **name** (string) - Name of the tool being called.
- **input** (object) - The input parameters for the tool, matching the tool's input_schema.

### Client Tool Execution

The client executes the tool with the provided input:

```
Execute: get_stock_price({"ticker": "^GSPC"})
Result: "259.75 USD"
```

### Tool Result Response

Return the tool result to the model in a subsequent user message:

```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```

#### Tool Result Block Fields
- **type** (string) - Always "tool_result" for tool result blocks.
- **tool_use_id** (string) - The id from the corresponding tool_use block.
- **content** (string) - The result/output from executing the tool.
```

--------------------------------

### List Files HTTP Endpoint

Source: https://platform.claude.com/docs/en/api/go/beta/files/list

This is the HTTP GET endpoint for listing files in the Anthropic Beta Files API. It allows retrieval of file metadata.

```http
GET /v1/files
```

--------------------------------

### Define Go Type and Constants for Regex Tool Search Configuration

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/create

This Go snippet defines the `BetaToolSearchToolRegex20251119` type and associated constants for configuring a regex-based tool search. It includes constants for the tool's name (`ToolSearchToolRegexToolSearchToolRegex`), its specific type, and allowed callers (`BetaToolSearchToolRegex20251119AllowedCallerDirect`, `BetaToolSearchToolRegex20251119AllowedCallerCodeExecution20250825`). This configuration is used to integrate and manage regex search functionality within the platform, specifying how the tool is identified and who can invoke it.

```Go
type BetaToolSearchToolRegex20251119 struct{}
const ToolSearchToolRegexToolSearchToolRegex ToolSearchToolRegex = "tool_search_tool_regex"
const BetaToolSearchToolRegex20251119TypeToolSearchToolRegex20251119 BetaToolSearchToolRegex20251119Type = "tool_search_tool_regex_20251119"
const BetaToolSearchToolRegex20251119TypeToolSearchToolRegex BetaToolSearchToolRegex20251119Type = "tool_search_tool_regex"
const BetaToolSearchToolRegex20251119AllowedCallerDirect BetaToolSearchToolRegex20251119AllowedCaller = "direct"
const BetaToolSearchToolRegex20251119AllowedCallerCodeExecution20250825 BetaToolSearchToolRegex20251119AllowedCaller = "code_execution_20250825"
```

--------------------------------

### Add Undocumented Request Parameters in Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

This Go example shows how to include undocumented parameters in API requests using `option.WithJSONSet()` or `option.WithQuerySet()`. This is useful when the SDK's typed parameter structs do not expose all available API options, allowing for custom data injection into the request payload.

```go
params := FooNewParams{
	ID: "id_xxxx",
	Data: FooNewParamsData{
		FirstName: anthropic.String("John"),
	},
}
client.Foo.New(context.Background(), params, option.WithJSONSet("data.last_name", "Doe"))
```

--------------------------------

### GET /v1/skills/{skill_id}/versions/{version}

Source: https://platform.claude.com/docs/en/api/csharp/beta/skills

Retrieves the details of a specific skill version using its unique skill ID and version identifier.

```APIDOC
## GET /v1/skills/{skill_id}/versions/{version}

### Description
Retrieves the details of a specific skill version using its unique skill ID and version identifier.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions/{version}

### Parameters
#### Path Parameters
- **skillID** (string) - Required - Unique identifier for the skill.
- **version** (string) - Required - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

#### Header Parameters
- **betas** (array of string) - Optional - Optional header to specify the beta version(s) you want to use.

### Response
#### Success Response (200)
- **ID** (string) - Unique identifier for the skill version. The format and length of IDs may change over time.
- **CreatedAt** (string) - ISO 8601 timestamp of when the skill version was created.
- **Description** (string) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **Directory** (string) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
- **Name** (string) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **SkillID** (string) - Identifier for the skill that this version belongs to.
- **Type** (string) - Object type. For Skill Versions, this is always "skill_version".
- **Version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").
```

--------------------------------

### POST /v1/files

Source: https://platform.claude.com/docs/en/api/python/beta/files

Uploads a new file to the system.

```APIDOC
## POST /v1/files

### Description
Uploads a new file to the system.

### Method
POST

### Endpoint
/v1/files

### Parameters
#### Path Parameters
- No Path Parameters.

#### Query Parameters
- No Query Parameters.

#### Header Parameters
- **betas** (Optional[List[str]]) - Optional - Optional header to specify the beta version(s) you want to use.
    - Accepted values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

#### Request Body
- **file** (FileTypes) - Required - The file to upload (sent as multipart/form-data).

### Request Example
{
  "file": "[binary file data]",
  "betas": ["files-api-2025-04-14"]
}

### Response
#### Success Response (200)
- **id** (str) - Unique object identifier.
- **created_at** (datetime) - RFC 3339 datetime string representing when the file was created.
- **filename** (str) - Original filename of the uploaded file.
- **mime_type** (str) - MIME type of the file.
- **size_bytes** (int) - Size of the file in bytes.
- **type** (Literal["file"]) - Object type. For files, this is always "file".
- **downloadable** (Optional[bool]) - Whether the file can be downloaded.

#### Response Example
{
  "id": "file_abc123",
  "created_at": "2024-01-01T12:00:00Z",
  "filename": "document.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 102400,
  "type": "file",
  "downloadable": true
}
```

--------------------------------

### GET /v1/organizations/usage_report/messages - Retrieve Messages Usage Report

Source: https://platform.claude.com/docs/en/api/admin

Retrieves the usage report for messages processed by the organization. This endpoint provides metrics and statistics about message usage across the organization.

```APIDOC
## GET /v1/organizations/usage_report/messages

### Description
Retrieve the messages usage report for an organization.

### Method
GET

### Endpoint
/v1/organizations/usage_report/messages

### Response
#### Success Response (200)
Returns usage metrics and statistics for messages processed by the organization.
```

--------------------------------

### Create Message with Claude API - Ruby

Source: https://platform.claude.com/docs/en/api/client-sdks

Initialize the Anthropic client and create a message using Ruby syntax. Demonstrates hash-based parameter passing and content access.

```ruby
client = Anthropic::Client.new

message = client.messages.create(
  model: "claude-opus-4-6",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Hello, Claude" }
  ]
)
puts message.content
```

--------------------------------

### BetaWebFetchTool20250910

Source: https://platform.claude.com/docs/en/api/beta/messages/count_tokens

A web fetching tool that retrieves and processes content from web URLs. This tool enables the model to fetch and analyze web page content with configurable access controls.

```APIDOC
## Web Fetch Tool (20250910)

### Description
A web fetching tool that enables retrieval and processing of content from specified URLs with access control and configuration options.

### Tool Configuration

#### Required Fields
- **name** (string) - Tool identifier: `"web_fetch"`
- **type** (string) - Tool type: `"web_fetch_20250910"`

#### Optional Fields
- **allowed_callers** (array) - Who can call this tool
  - Possible values: `"direct"`, `"code_execution_20250825"`
  - Default: All callers allowed

- **cache_control** (BetaCacheControlEphemeral) - Cache control settings
  - **type** (string) - Must be: `"ephemeral"`
  - **ttl** (string) - Time-to-live for cache
    - Possible values: `"5m"` (5 minutes), `"1h"` (1 hour)
    - Default: `"5m"`

- **defer_loading** (boolean) - If true, tool loads only when referenced via tool_reference
  - Default: false

- **strict** (boolean) - When true, enforces schema validation on tool names and inputs
  - Default: false

### Example Configuration
```json
{
  "name": "web_fetch",
  "type": "web_fetch_20250910",
  "allowed_callers": ["direct"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "5m"
  },
  "defer_loading": false,
  "strict": true
}
```
```

--------------------------------

### Define BetaCacheCreation struct for TTL-based cache token breakdown

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches/results

Defines the cache creation token structure with ephemeral cache entries at different TTL intervals (1 hour and 5 minutes). Provides granular tracking of input tokens used to create cache entries at different time-to-live durations.

```Go
type BetaCacheCreation struct{
  Ephemeral1hInputTokens int64
  Ephemeral5mInputTokens int64
}
```

--------------------------------

### GET /v1/messages/batches

Source: https://platform.claude.com/docs/en/api/beta/messages/batches/list

Retrieves a paginated list of all Message Batches within a Workspace, ordered by most recently created. This endpoint supports pagination using `after_id`, `before_id`, and `limit` parameters.

```APIDOC
## GET /v1/messages/batches

### Description
List all Message Batches within a Workspace. Most recently created batches are returned first. This endpoint supports pagination for efficient data retrieval.

### Method
GET

### Endpoint
/v1/messages/batches

### Parameters
#### Path Parameters
_None_

#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **"anthropic-beta"** (array of AnthropicBeta) - Optional - Optional header to specify the beta version(s) you want to use.
  - `UnionMember0` (string)
  - `UnionMember1` (string) - Valid values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

#### Request Body
_None_

### Request Example
```
GET /v1/messages/batches?limit=2&after_id=mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0
```

### Response
#### Success Response (200)
- **data** (array of BetaMessageBatch) - A list of Message Batch objects.
  - **id** (string) - Unique object identifier. The format and length of IDs may change over time.
  - **archived_at** (string) - RFC 3339 datetime string representing the time at which the Message Batch was archived.
  - **cancel_initiated_at** (string) - RFC 3339 datetime string representing the time at which cancellation was initiated.
  - **created_at** (string) - RFC 3339 datetime string representing the time at which the Message Batch was created.
  - **ended_at** (string) - RFC 3339 datetime string representing the time at which processing for the Message Batch ended.
  - **expires_at** (string) - RFC 3339 datetime string representing the time at which the Message Batch will expire (24 hours after creation).
  - **processing_status** (string) - Processing status of the Message Batch. Enum: `"in_progress"`, `"canceling"`, `"ended"`.
  - **request_counts** (BetaMessageBatchRequestCounts) - Tallies requests within the Message Batch, categorized by their status.
    - **canceled** (number) - Number of requests in the Message Batch that have been canceled.
    - **errored** (number) - Number of requests in the Message Batch that encountered an error.
    - **expired** (number) - Number of requests in the Message Batch that have expired.
    - **processing** (number) - Number of requests in the Message Batch that are processing.
    - **succeeded** (number) - Number of requests in the Message Batch that have completed successfully.
  - **results_url** (string) - URL to a `.jsonl` file containing the results. Specified only once processing ends.
  - **type** (string) - Object type. For Message Batches, this is always `"message_batch"`.
- **first_id** (string) - First ID in the `data` list. Can be used as the `before_id` for the previous page.
- **has_more** (boolean) - Indicates if there are more results in the requested page direction.
- **last_id** (string) - Last ID in the `data` list. Can be used as the `after_id` for the next page.

#### Response Example
```json
{
  "data": [
    {
      "id": "mb_01J0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0",
      "archived_at": null,
      "cancel_initiated_at": null,
      "created_at": "2024-07-30T12:00:00Z",
      "ended_at": null,
      "expires_at": "2024-07-31T12:00:00Z",
      "processing_status": "in_progress",
      "request_counts": {
        "canceled": 0,
        "errored": 0,
        "expired": 0,
        "processing": 50,
        "succeeded": 0
      },
      "results_url": null,
      "type": "message_batch"
    },
    {
      "id": "mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0",
      "archived_at": "2024-07-29T10:00:00Z",
      "cancel_initiated_at": null,
      "created_at": "2024-07-28T10:00:00Z",
      "ended_at": "2024-07-29T10:00:00Z",
      "expires_at": "2024-07-29T10:00:00Z",
      "processing_status": "ended",
      "request_counts": {
        "canceled": 0,
        "errored": 2,
        "expired": 0,
        "processing": 0,
        "succeeded": 98
      },
      "results_url": "https://example.com/results/mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0.jsonl",
      "type": "message_batch"
    }
  ],
  "first_id": "mb_01J0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0Z0",
  "has_more": true,
  "last_id": "mb_01J0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0Y0"
}
```
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Retrieves a paginated list of all versions associated with a specific skill ID. Each skill version includes details such as its unique identifier, creation timestamp, description, and name.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
Retrieves a paginated list of all versions associated with a specific skill ID. Each skill version includes details such as its unique identifier, creation timestamp, description, and name.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill. The format and length of IDs may change over time.

#### Query Parameters
(No specific query parameters detailed for listing skill versions)

#### Request Body
(Not applicable for GET requests)

### Request Example
(Not applicable for GET requests)

### Response
#### Success Response (200)
- **data** (array of objects) - A list of skill version objects.
  - **ID** (string) - Unique identifier for the skill version. The format and length of IDs may change over time.
  - **CreatedAt** (string) - ISO 8601 timestamp of when the skill version was created.
  - **Description** (string) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
  - **Directory** (string) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
  - **Name** (string) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
  - **SkillID** (string) - Identifier for the skill that this version belongs to.
  - **Type** (string) - Object type. For Skill Versions, this is always "skill_version".
  - **Version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").
- **next_cursor** (string, optional) - A cursor for fetching the next page of results.

#### Response Example
```json
{
  "data": [
    {
      "ID": "skv_abc123def456",
      "CreatedAt": "2023-10-27T10:00:00Z",
      "Description": "Initial version of the weather skill, providing basic forecasts.",
      "Directory": "weather_skill_v1",
      "Name": "Weather Skill v1",
      "SkillID": "skl_xyz789uvw012",
      "Type": "skill_version",
      "Version": "1759178010641129"
    },
    {
      "ID": "skv_ghi789jkl012",
      "CreatedAt": "2023-11-15T14:30:00Z",
      "Description": "Updated weather skill with extended forecast and location-based services.",
      "Directory": "weather_skill_v2",
      "Name": "Weather Skill v2",
      "SkillID": "skl_xyz789uvw012",
      "Type": "skill_version",
      "Version": "1760582400000000"
    }
  ],
  "next_cursor": "skv_ghi789jkl012"
}
```
```

--------------------------------

### POST /v1/files

Source: https://platform.claude.com/docs/en/api/beta/files/upload

This endpoint allows users to upload files to the platform. It accepts an optional `anthropic-beta` header to specify beta features.

```APIDOC
## POST /v1/files

### Description
This endpoint allows users to upload files to the platform. It accepts an optional `anthropic-beta` header to specify beta features.

### Method
POST

### Endpoint
/v1/files

### Parameters
#### Header Parameters
- **anthropic-beta** (array of string, optional) - Optional header to specify the beta version(s) you want to use.
  - Accepted values include: "message-batches-2024-09-24", "prompt-caching-2024-07-31", "computer-use-2024-10-22", "computer-use-2025-01-24", "pdfs-2024-09-25", "token-counting-2024-11-01", "token-efficient-tools-2025-02-19", "output-128k-2025-02-19", "files-api-2025-04-14", "mcp-client-2025-04-04", "mcp-client-2025-11-20", "dev-full-thinking-2025-05-14", "interleaved-thinking-2025-05-14", "code-execution-2025-05-22", "extended-cache-ttl-2025-04-11", "context-1m-2025-08-07", "context-management-2025-06-27", "model-context-window-exceeded-2025-08-26", "skills-2025-10-02", "fast-mode-2026-02-01".

#### Path Parameters
(None)

#### Query Parameters
(None)

#### Request Body
(Not explicitly detailed in the provided text. This endpoint typically expects a file upload, often via `multipart/form-data`.)

### Request Example
```json
// A file upload request typically involves multipart/form-data, not a JSON body.
// Example for cURL:
// curl -X POST https://api.example.com/v1/files \
//   -H "anthropic-beta: message-batches-2024-09-24" \
//   -H "Content-Type: multipart/form-data" \
//   -F "file=@/path/to/your/file.pdf;type=application/pdf"
```

### Response
#### Success Response (200)
- **id** (string) - Unique object identifier. The format and length of IDs may change over time.
- **created_at** (string) - RFC 3339 datetime string representing when the file was created.
- **filename** (string) - Original filename of the uploaded file.
- **mime_type** (string) - MIME type of the file.
- **size_bytes** (number) - Size of the file in bytes.
- **type** (string) - Object type. For files, this is always "file".
- **downloadable** (boolean, optional) - Whether the file can be downloaded.

#### Response Example
```json
{
  "id": "file_abc123",
  "created_at": "2024-01-01T12:00:00Z",
  "filename": "my_document.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 102400,
  "type": "file",
  "downloadable": true
}
```
```

--------------------------------

### Citation Page Location Response

Source: https://platform.claude.com/docs/en/api/go/messages/create

Response structure for citations with page-level location information. Includes start and end page numbers for document citations.

```APIDOC
## CitationPageLocationParamResp

### Description
Citation location information with page-level precision.

### Type
`type CitationPageLocationParamResp struct`

### Fields
- **CitedText** (string) - The actual text that was cited
- **DocumentIndex** (int64) - Index of the document in the source list
- **DocumentTitle** (string) - Title of the cited document
- **StartPageNumber** (int64) - Starting page number of the citation
- **EndPageNumber** (int64) - Ending page number of the citation
- **Type** (PageLocation) - Location type constant
  - Constant: `PageLocationPageLocation = "page_location"`

### Response Example
{
  "CitedText": "Example citation text",
  "DocumentIndex": 0,
  "DocumentTitle": "Research Paper",
  "StartPageNumber": 5,
  "EndPageNumber": 7,
  "Type": "page_location"
}
```

--------------------------------

### Define OutputConfigEffort Constants (Go)

Source: https://platform.claude.com/docs/en/api/go/messages/batches/create

These constants define the possible effort levels for output configuration in the Claude API, ranging from low to maximum. They are used to control the resource intensity of the output generation process.

```Go
const OutputConfigEffortLow OutputConfigEffort = "low"
```

```Go
const OutputConfigEffortMedium OutputConfigEffort = "medium"
```

```Go
const OutputConfigEffortHigh OutputConfigEffort = "high"
```

```Go
const OutputConfigEffortMax OutputConfigEffort = "max"
```

--------------------------------

### Configure Computer Use Tool with Display Settings - C#

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/count_tokens

Defines BetaToolComputerUse20241022 class for computer interaction capabilities. Requires display dimensions in pixels (DisplayHeightPx, DisplayWidthPx). Includes cache control with TTL configuration, allowed callers specification, and deferred loading options for system prompt management.

```csharp
class BetaToolComputerUse20241022
{
  required Long DisplayHeightPx; // Height of display in pixels
  required Long DisplayWidthPx; // Width of display in pixels
  JsonElement Name = "computer"; // constant
  JsonElement Type = "computer_20241022"; // constant
  IReadOnlyList<AllowedCaller> AllowedCallers; // "direct" or "code_execution_20250825"
  BetaCacheControlEphemeral? CacheControl;
  JsonElement CacheControlType = "ephemeral"; // constant
  Ttl Ttl; // "5m" or "1h", defaults to "5m"
  Boolean DeferLoading;
}
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/csharp/beta/skills

Retrieves a list of all versions associated with a specific skill. This endpoint allows you to view the history of a skill's development.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
Retrieves a list of all versions associated with a specific skill. This endpoint allows you to view the history of a skill's development.

### Method
GET

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill.

### Request Example
(No request body for this GET endpoint)

### Response
#### Success Response (200)
- **versions** (array of objects) - A list of skill version objects. Each object contains details similar to the `VersionCreateResponse`.
  - **ID** (string) - Unique identifier for the skill version.
  - **CreatedAt** (string) - ISO 8601 timestamp of when the skill version was created.
  - **Description** (string) - Description of the skill version.
  - **Directory** (string) - Directory name of the skill version.
  - **Name** (string) - Human-readable name of the skill version.
  - **SkillID** (string) - Identifier for the skill that this version belongs to.
  - **Type** (string) - Object type. For Skill Versions, this is always `"skill_version"`.
  - **Version** (string) - Version identifier for the skill.

#### Response Example
```json
{
  "versions": [
    {
      "ID": "sv_abc123",
      "CreatedAt": "2024-01-01T12:00:00Z",
      "Description": "Initial version of the skill.",
      "Directory": "my_skill_v1",
      "Name": "My Skill",
      "SkillID": "sk_xyz789",
      "Type": "skill_version",
      "Version": "1759178010641129"
    },
    {
      "ID": "sv_def456",
      "CreatedAt": "2024-02-15T10:30:00Z",
      "Description": "Added new feature X.",
      "Directory": "my_skill_v2",
      "Name": "My Skill",
      "SkillID": "sk_xyz789",
      "Type": "skill_version",
      "Version": "1763123456789012"
    }
  ]
}
```
```

--------------------------------

### Content Block Start Event - Stream Event with Block Index

Source: https://platform.claude.com/docs/en/api/python/messages

Defines RawContentBlockStartEvent that signals the beginning of a content block in the message stream. Contains the content block object, block index, and event type identifier.

```python
class RawContentBlockStartEvent:
    content_block: ContentBlock  # The content block being started
    index: int  # Index of the content block
    type: Literal["content_block_start"]  # Value: "content_block_start"
```

--------------------------------

### Paginate Through List Results with Manual Paging in Go SDK

Source: https://platform.claude.com/docs/en/api/sdks/go

Use List() method to fetch a single page and manually iterate through pages using GetNextPage() helper. Provides more control over pagination compared to auto-paging approach.

```go
page, err := client.Messages.Batches.List(context.TODO(), anthropic.MessageBatchListParams{
	Limit: anthropic.Int(20),
})
for page != nil {
	for _, batch := range page.Data {
		fmt.Printf("%+v\n", batch)
	}
	page, err = page.GetNextPage()
}
if err != nil {
	panic(err.Error())
}
```

--------------------------------

### GET /v1/files

Source: https://platform.claude.com/docs/en/api/csharp/beta/files/list

Retrieves a paginated list of files uploaded to the Claude Platform. This endpoint allows filtering and pagination using cursor-based IDs and a limit.

```APIDOC
## GET /v1/files

### Description
Retrieves a paginated list of files uploaded to the Claude Platform. This endpoint allows filtering and pagination using cursor-based IDs and a limit.

### Method
GET

### Endpoint
/v1/files

### Parameters
#### Path Parameters
(None)

#### Query Parameters
- **afterID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **beforeID** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (Long) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **betas** (IReadOnlyList<AnthropicBeta>) - Optional - Optional header to specify the beta version(s) you want to use.
  - `"message-batches-2024-09-24"`
  - `"prompt-caching-2024-07-31"`
  - `"computer-use-2024-10-22"`
  - `"computer-use-2025-01-24"`
  - `"pdfs-2024-09-25"`
  - `"token-counting-2024-11-01"`
  - `"token-efficient-tools-2025-02-19"`
  - `"output-128k-2025-02-19"`
  - `"files-api-2025-04-14"`
  - `"mcp-client-2025-04-04"`
  - `"mcp-client-2025-11-20"`
  - `"dev-full-thinking-2025-05-14"`
  - `"interleaved-thinking-2025-05-14"`
  - `"code-execution-2025-05-22"`
  - `"extended-cache-ttl-2025-04-11"`
  - `"context-1m-2025-08-07"`
  - `"context-management-2025-06-27"`
  - `"model-context-window-exceeded-2025-08-26"`
  - `"skills-2025-10-02"`
  - `"fast-mode-2026-02-01"`

#### Request Body
(None)

### Request Example
{}

### Response
#### Success Response (200)
- **Data** (IReadOnlyList<FileMetadata>) - List of file metadata objects.
  - **ID** (string) - Unique object identifier. The format and length of IDs may change over time.
  - **CreatedAt** (DateTimeOffset) - RFC 3339 datetime string representing when the file was created.
  - **Filename** (string) - Original filename of the uploaded file.
  - **MimeType** (string) - MIME type of the file.
  - **SizeBytes** (Long) - Size of the file in bytes.
  - **Type** (string) - Object type. For files, this is always `"file"`.
  - **Downloadable** (Boolean) - Whether the file can be downloaded.
- **FirstID** (string) - ID of the first file in this page of results.
- **HasMore** (Boolean) - Whether there are more results available.
- **LastID** (string) - ID of the last file in this page of results.

#### Response Example
```json
{
  "data": [
    {
      "id": "file_abc123",
      "created_at": "2024-01-01T12:00:00Z",
      "filename": "document.pdf",
      "mime_type": "application/pdf",
      "size_bytes": 102400,
      "type": "file",
      "downloadable": true
    }
  ],
  "first_id": "file_abc123",
  "has_more": true,
  "last_id": "file_xyz789"
}
```
```

--------------------------------

### Create Asynchronous Client from Initialization

Source: https://platform.claude.com/docs/en/api/sdks/java

Initialize an asynchronous Anthropic client directly using AnthropicOkHttpClientAsync instead of converting from synchronous. All methods return CompletableFuture for async operations. Supports same configuration options as synchronous client.

```java
import com.anthropic.client.AnthropicClientAsync;
import com.anthropic.client.okhttp.AnthropicOkHttpClientAsync;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.Model;
import java.util.concurrent.CompletableFuture;

AnthropicClientAsync client = AnthropicOkHttpClientAsync.fromEnv();

MessageCreateParams params = MessageCreateParams.builder()
  .maxTokens(1024L)
  .addUserMessage("Hello, Claude")
  .model(Model.CLAUDE_OPUS_4_6)
  .build();

CompletableFuture<Message> message = client.messages().create(params);
```

--------------------------------

### Configure Bash Tool with Cache Control - C#

Source: https://platform.claude.com/docs/en/api/csharp/beta/messages/count_tokens

Defines BetaToolBash20241022 class with bash command execution capabilities. Includes cache control configuration with TTL options (5m or 1h), allowed callers specification, and optional deferred loading. Supports schema validation and input streaming configuration.

```csharp
class BetaToolBash20241022
{
  JsonElement Name = "bash"; // constant
  JsonElement Type = "bash_20241022"; // constant
  IReadOnlyList<AllowedCaller> AllowedCallers; // "direct" or "code_execution_20250825"
  BetaCacheControlEphemeral? CacheControl;
  JsonElement CacheControlType = "ephemeral"; // constant
  Ttl Ttl; // "5m" or "1h", defaults to "5m"
  Boolean DeferLoading;
  IReadOnlyList<IReadOnlyDictionary<string, JsonElement>> InputExamples;
  Boolean Strict; // When true, guarantees schema validation
}
```

--------------------------------

### GET /v1/organizations/cost_report

Source: https://platform.claude.com/docs/en/api/admin/cost_report/retrieve

Retrieves cost report data for your organization with support for time-based bucketing, grouping, and pagination. Returns cost breakdowns by time period with optional grouping by workspace or description.

```APIDOC
## GET /v1/organizations/cost_report

### Description
Get Cost Report - Retrieve detailed cost data for your organization with configurable time buckets, grouping options, and pagination.

### Method
GET

### Endpoint
`/v1/organizations/cost_report`

### Query Parameters
- **starting_at** (string) - Required - Time buckets that start on or after this RFC 3339 timestamp will be returned. Each time bucket will be snapped to the start of the minute/hour/day in UTC.
- **bucket_width** (string) - Optional - Time granularity of the response data. Default: `"1d"`. Allowed values: `"1d"`
- **ending_at** (string) - Optional - Time buckets that end before this RFC 3339 timestamp will be returned.
- **group_by** (array of string) - Optional - Group by any subset of the available options. Allowed values: `"workspace_id"`, `"description"`
- **limit** (number) - Optional - Maximum number of time buckets to return in the response.
- **page** (string) - Optional - Optionally set to the `next_page` token from the previous response.

### Header Parameters
- **anthropic-beta** (array of string) - Optional - Optional header to specify the beta version(s) you want to use. To use multiple betas, use a comma separated list like `beta1,beta2` or specify the header multiple times for each beta.

### Response
#### Success Response (200)
- **data** (array of object) - Array of cost data grouped by time buckets
  - **ending_at** (string) - End of the time bucket (exclusive) in RFC 3339 format
  - **starting_at** (string) - Start of the time bucket (inclusive) in RFC 3339 format
  - **results** (array of object) - List of cost items for this time bucket
    - **amount** (string) - Cost amount in lowest currency units (e.g. cents) as a decimal string
    - **context_window** (string) - Input context window used. Allowed values: `"0-200k"`, `"200k-1M"`
    - **cost_type** (string) - Type of cost. Allowed values: `"tokens"`, `"web_search"`, `"code_execution"`
    - **currency** (string) - Currency code for the cost amount. Currently always `"USD"`
    - **description** (string) - Description of the cost item
    - **inference_geo** (string) - Inference geo used matching requests' `inference_geo` parameter
    - **model** (string) - Model name used
    - **service_tier** (string) - Service tier used. Allowed values: `"standard"`, `"batch"`
    - **speed** (string) - Speed used (research preview). Allowed values: `"standard"`, `"fast"`
    - **token_type** (string) - Type of token. Allowed values: `"uncached_input_tokens"`, `"output_tokens"`, `"cache_read_input_tokens"`, `"cache_creation.ephemeral_1h_input_tokens"`, `"cache_creation.ephemeral_5m_input_tokens"`
    - **workspace_id** (string) - ID of the Workspace this cost is associated with
- **has_more** (boolean) - Indicates if there are more results
- **next_page** (string) - Token to provide in as `page` in the subsequent request to retrieve the next page of data

### Request Example
```
GET /v1/organizations/cost_report?starting_at=2024-01-01T00:00:00Z&bucket_width=1d&group_by=workspace_id&limit=10
```

### Response Example
```json
{
  "data": [
    {
      "starting_at": "2024-01-01T00:00:00Z",
      "ending_at": "2024-01-02T00:00:00Z",
      "results": [
        {
          "amount": "123.45",
          "context_window": "0-200k",
          "cost_type": "tokens",
          "currency": "USD",
          "description": "Claude 3 Opus",
          "inference_geo": "us-east-1",
          "model": "claude-3-opus",
          "service_tier": "standard",
          "speed": "standard",
          "token_type": "uncached_input_tokens",
          "workspace_id": "workspace-123"
        }
      ]
    }
  ],
  "has_more": false,
  "next_page": null
}
```
```

--------------------------------

### Create Message Batch using Go Client

Source: https://platform.claude.com/docs/en/api/go/beta/messages/batches

This Go client method initiates the creation of a new message batch. It takes a context (`ctx`) and parameters (`params`), returning a `BetaMessageBatch` object upon success or an error. This allows processing multiple Message API requests concurrently, with batches potentially taking up to 24 hours to complete.

```Go
client.Beta.Messages.Batches.New(ctx, params) (*BetaMessageBatch, error)
```

--------------------------------

### List Skill Versions API Call (Java)

Source: https://platform.claude.com/docs/en/api/java/beta/skills

This snippet demonstrates how to list skill versions using the Java client library and the corresponding HTTP GET endpoint. It allows filtering by skill ID, limiting results, pagination, and specifying beta features. The response includes details like version ID, creation timestamp, description, and associated skill ID.

```java
VersionListPage beta().skills().versions().list(VersionListParamsparams = VersionListParams.none(), RequestOptionsrequestOptions = RequestOptions.none())
```

```http
GET /v1/skills/{skill_id}/versions
```

--------------------------------

### Tool Definition Schema

Source: https://platform.claude.com/docs/en/api/typescript/messages/create

Details the structure for defining custom tools, including their name, description, and input schema, along with examples of tool definition and usage.

```APIDOC
## Tool Definition Schema

### Description
This section defines the structure for `tools` that can be provided to the model. These tools allow the model to produce `tool_use` content blocks, which can then be executed by the client and their results returned to the model via `tool_result` content blocks.

### Parameters
#### Request Body
- **tools** (Array<ToolUnion>) - Optional - Definitions of tools that the model may use.

##### Tool
- **input_schema** (object) - Required - [JSON schema](https://json-schema.org/draft/2020-12) for this tool's input. This defines the shape of the `input` that your tool accepts and that the model will produce.
  - **type** (string) - Required - Must be `"object"`.
  - **properties?** (Record<string, unknown> | null) - Optional - Defines the properties of the input object.
  - **required?** (Array<string> | null) - Optional - An array of required property names.
- **name** (string) - Required - Name of the tool. This is how the tool will be called by the model and in `tool_use` blocks.
- **cache_control?** (CacheControlEphemeral | null) - Optional - Create a cache control breakpoint at this content block.
  - **type** (string) - Required - Must be `"ephemeral"`.
  - **ttl?** (string) - Optional - The time-to-live for the cache control breakpoint. Can be `"5m"` (5 minutes) or `"1h"` (1 hour). Defaults to `"5m"`.
- **description?** (string) - Optional - Description of what this tool does.

### Request Example (Tool Definition)
```json
[
  {
    "name": "get_stock_price",
    "description": "Get the current stock price for a given ticker symbol.",
    "input_schema": {
      "type": "object",
      "properties": {
        "ticker": {
          "type": "string",
          "description": "The stock ticker symbol, e.g. AAPL for Apple Inc."
        }
      },
      "required": ["ticker"]
    }
  }
]
```

### Response Example (Tool Use by Model)
```json
[
  {
    "type": "tool_use",
    "id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "name": "get_stock_price",
    "input": { "ticker": "^GSPC" }
  }
]
```

### Request Example (Returning Tool Result)
```json
[
  {
    "type": "tool_result",
    "tool_use_id": "toolu_01D7FLrfh4GYq7yT1ULFeyMV",
    "content": "259.75 USD"
  }
]
```
```

--------------------------------

### POST /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/beta/skills/versions/create

This endpoint allows you to create a new version for an existing skill. It requires a unique skill identifier and returns details about the newly created skill version.

```APIDOC
## POST /v1/skills/{skill_id}/versions

### Description
This endpoint allows you to create a new version for an existing skill. It requires a unique skill identifier and returns details about the newly created skill version.

### Method
POST

### Endpoint
/v1/skills/{skill_id}/versions

### Parameters
#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill. The format and length of IDs may change over time.

#### Header Parameters
- **anthropic-beta** (array of AnthropicBeta) - Optional - Optional header to specify the beta version(s) you want to use.

### Response
#### Success Response (200)
- **id** (string) - Unique identifier for the skill version.
- **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
- **description** (string) - Description of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **directory** (string) - Directory name of the skill version. This is the top-level directory name that was extracted from the uploaded files.
- **name** (string) - Human-readable name of the skill version. This is extracted from the SKILL.md file in the skill upload.
- **skill_id** (string) - Identifier for the skill that this version belongs to.
- **type** (string) - Object type. For Skill Versions, this is always "skill_version".
- **version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

#### Response Example
{
  "id": "sv_0123456789abcdef0123456789abcdef",
  "created_at": "2024-07-30T12:00:00Z",
  "description": "A skill version for processing natural language queries.",
  "directory": "my_nlp_skill_v1",
  "name": "My NLP Skill",
  "skill_id": "skl_01abcdef0123456789abcdef012345",
  "type": "skill_version",
  "version": "1759178010641129"
}
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/typescript/beta/models

List all available models with pagination support. Returns a paginated list of models ordered by release date, with most recent models listed first. Supports cursor-based pagination and optional beta feature headers.

```APIDOC
## GET /v1/models

### Description
List available models. The Models API response can be used to determine which models are available for use in the API. More recently released models are listed first.

### Method
GET

### Endpoint
`/v1/models`

### Parameters
#### Query Parameters
- **after_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **before_id** (string) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (number) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.

#### Header Parameters
- **betas** (Array<AnthropicBeta>) - Optional - Header to specify the beta version(s) you want to use. Supported values include: `message-batches-2024-09-24`, `prompt-caching-2024-07-31`, `computer-use-2024-10-22`, `computer-use-2025-01-24`, `pdfs-2024-09-25`, `token-counting-2024-11-01`, `token-efficient-tools-2025-02-19`, `output-128k-2025-02-19`, `files-api-2025-04-14`, `mcp-client-2025-04-04`, `mcp-client-2025-11-20`, `dev-full-thinking-2025-05-14`, `interleaved-thinking-2025-05-14`, `code-execution-2025-05-22`, `extended-cache-ttl-2025-04-11`, `context-1m-2025-08-07`, `context-management-2025-06-27`, `model-context-window-exceeded-2025-08-26`, `skills-2025-10-02`, `fast-mode-2026-02-01`.

### Response
#### Success Response (200)
Returns a paginated list of `BetaModelInfo` objects.

- **id** (string) - Unique model identifier.
- **created_at** (string) - RFC 3339 datetime string representing the time at which the model was released. May be set to an epoch value if the release date is unknown.
- **display_name** (string) - A human-readable name for the model.
- **type** (string) - Object type. For Models, this is always `"model"`.

#### Response Example
```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-3-5-sonnet-20241022",
      "type": "model",
      "created_at": "2024-10-22T00:00:00Z",
      "display_name": "Claude 3.5 Sonnet"
    }
  ]
}
```
```

--------------------------------

### Multiple Conversational Turns for Claude Messages API

Source: https://platform.claude.com/docs/en/api/creating-message-batches

Illustrates how to provide a conversation history with alternating user and assistant messages to guide the model's response. This allows for context-rich interactions and continued dialogues.

```json
[
  {"role": "user", "content": "Hello there."},
  {"role": "assistant", "content": "Hi, I'm Claude. How can I help you?"},
  {"role": "user", "content": "Can you explain LLMs in plain English?"}
]
```

--------------------------------

### GET /v1/organizations/me

Source: https://platform.claude.com/docs/en/api/admin/organizations/me

Retrieve information about the organization associated with the authenticated API key. This endpoint returns the organization object containing the ID, name, and type for the organization linked to your API credentials.

```APIDOC
## GET /v1/organizations/me

### Description
Retrieve information about the organization associated with the authenticated API key.

### Method
GET

### Endpoint
`/v1/organizations/me`

### Parameters
No parameters required.

### Response
#### Success Response (200)
- **id** (string) - ID of the Organization.
- **name** (string) - Name of the Organization.
- **type** (string) - Object type. For Organizations, this is always `"organization"`.

#### Response Example
{
  "id": "org_123456789",
  "name": "My Organization",
  "type": "organization"
}
```

--------------------------------

### List Skills - Go

Source: https://platform.claude.com/docs/en/api/go/beta/skills

Retrieves a paginated list of all skills. This function accepts a context and parameters, returning a cursor-based paginated response of BetaSkillListResponse objects. Useful for enumerating available skills in the system.

```go
client.Beta.Skills.List(ctx, params) (*PageCursor[BetaSkillListResponse], error)

// Endpoint: GET /v1/skills
// Returns paginated list of skills with cursor-based pagination
```

--------------------------------

### GET /v1/skills/{skill_id}/versions

Source: https://platform.claude.com/docs/en/api/python/beta/skills/versions/list

Retrieves a paginated list of all versions for a specified skill. Supports optional pagination parameters and beta feature headers. Returns version metadata including identifiers, timestamps, descriptions, and version information.

```APIDOC
## GET /v1/skills/{skill_id}/versions

### Description
List all versions of a specific skill with pagination support. Returns detailed metadata for each skill version including creation timestamps, descriptions, and version identifiers.

### Method
GET

### Endpoint
`/v1/skills/{skill_id}/versions`

### Parameters

#### Path Parameters
- **skill_id** (string) - Required - Unique identifier for the skill. The format and length of IDs may change over time.

#### Query Parameters
- **limit** (integer) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **page** (string) - Optional - Optionally set to the `next_page` token from the previous response for pagination.

#### Header Parameters
- **betas** (array of strings) - Optional - Beta version(s) to use. Accepted values include:
  - `"message-batches-2024-09-24"`
  - `"prompt-caching-2024-07-31"`
  - `"computer-use-2024-10-22"`
  - `"computer-use-2025-01-24"`
  - `"pdfs-2024-09-25"`
  - `"token-counting-2024-11-01"`
  - `"token-efficient-tools-2025-02-19"`
  - `"output-128k-2025-02-19"`
  - `"files-api-2025-04-14"`
  - `"mcp-client-2025-04-04"`
  - `"mcp-client-2025-11-20"`
  - `"dev-full-thinking-2025-05-14"`
  - `"interleaved-thinking-2025-05-14"`
  - `"code-execution-2025-05-22"`
  - `"extended-cache-ttl-2025-04-11"`
  - `"context-1m-2025-08-07"`
  - `"context-management-2025-06-27"`
  - `"model-context-window-exceeded-2025-08-26"`
  - `"skills-2025-10-02"`
  - `"fast-mode-2026-02-01"`

### Response

#### Success Response (200)
Returns a paginated cursor of `VersionListResponse` objects.

**VersionListResponse Schema:**
- **id** (string) - Unique identifier for the skill version. The format and length of IDs may change over time.
- **created_at** (string) - ISO 8601 timestamp of when the skill version was created.
- **description** (string) - Description of the skill version. Extracted from the SKILL.md file in the skill upload.
- **directory** (string) - Directory name of the skill version. This is the top-level directory name extracted from the uploaded files.
- **name** (string) - Human-readable name of the skill version. Extracted from the SKILL.md file in the skill upload.
- **skill_id** (string) - Identifier for the skill that this version belongs to.
- **type** (string) - Object type. For Skill Versions, this is always `"skill_version"`.
- **version** (string) - Version identifier for the skill. Each version is identified by a Unix epoch timestamp (e.g., "1759178010641129").

#### Response Example
```json
{
  "data": [
    {
      "id": "version_123",
      "created_at": "2024-10-02T15:30:00Z",
      "description": "Initial skill version",
      "directory": "my_skill",
      "name": "My Skill",
      "skill_id": "skill_456",
      "type": "skill_version",
      "version": "1759178010641129"
    }
  ],
  "next_page": "page_token_xyz"
}
```

### Python SDK Usage
```python
beta.skills.versions.list(skill_id="skill_456", limit=20, page=None)
```
```

--------------------------------

### Citation with Search Result Location

Source: https://platform.claude.com/docs/en/api/ruby/messages/count_tokens

Example of a text citation from a search result. Uses search result index and source information to identify the location of cited content.

```json
{
  "cited_text": "example text",
  "type": "search_result_location",
  "search_result_index": 0,
  "source": "source_name",
  "title": "Result Title",
  "start_block_index": 0,
  "end_block_index": 1
}
```

--------------------------------

### Tool Choice Configuration

Source: https://platform.claude.com/docs/en/api/messages/batches

Configure how Claude should use provided tools. Control whether the model uses specific tools, any available tool, decides automatically, or avoids tools entirely.

```APIDOC
## Tool Choice Configuration

### Description
How the model should use the provided tools. The model can use a specific tool, any available tool, decide by itself, or not use tools at all.

### Parameter
- **tool_choice** (ToolChoice) - Optional - Tool usage behavior configuration

### Tool Choice Type: Auto

#### Description
The model will automatically decide whether to use tools based on the request.

#### Parameters
- **type** (string) - Required - Must be "auto"
- **disable_parallel_tool_use** (boolean) - Optional - Whether to disable parallel tool use
  - Default: false
  - When true: Model outputs at most one tool use per response
  - When false: Model can use multiple tools in parallel

### Request Example

#### Auto Tool Choice with Parallel Enabled
```json
{
  "tool_choice": {
    "type": "auto",
    "disable_parallel_tool_use": false
  }
}
```

#### Auto Tool Choice with Parallel Disabled
```json
{
  "tool_choice": {
    "type": "auto",
    "disable_parallel_tool_use": true
  }
}
```

### Behavior
- **auto**: Model decides when and which tools to use
- **disable_parallel_tool_use: true**: Restricts model to one tool use at a time
- **disable_parallel_tool_use: false**: Allows multiple simultaneous tool uses
```

--------------------------------

### Citation with Character Location

Source: https://platform.claude.com/docs/en/api/ruby/messages/count_tokens

Example of a text citation using character-based location information. Specifies the exact character range within a document where the cited text is located.

```json
{
  "cited_text": "example text",
  "type": "char_location",
  "document_index": 0,
  "document_title": "Document Title",
  "start_char_index": 0,
  "end_char_index": 12
}
```

--------------------------------

### Create Message with Claude API - Python

Source: https://platform.claude.com/docs/en/api/client-sdks

Initialize the Anthropic client and create a message using the Claude Opus 4.6 model. Demonstrates basic synchronous message creation with user input.

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello, Claude"}],
)
print(message.content)
```

--------------------------------

### GET /v1/models

Source: https://platform.claude.com/docs/en/api/java/beta/models/list

This endpoint allows you to retrieve a list of available models. The response can be used to determine which models are available for use in the API, with more recently released models listed first.

```APIDOC
## GET /v1/models

### Description
This endpoint allows you to retrieve a list of available models. The response can be used to determine which models are available for use in the API, with more recently released models listed first.

### Method
GET

### Endpoint
/v1/models

### Parameters
#### Query Parameters
- **afterId** (String) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately after this object.
- **beforeId** (String) - Optional - ID of the object to use as a cursor for pagination. When provided, returns the page of results immediately before this object.
- **limit** (Long) - Optional - Number of items to return per page. Defaults to `20`. Ranges from `1` to `1000`.
- **betas** (List<String>) - Optional - List of beta version identifiers to enable for the request. Possible values include: `message-batches-2024-09-24`, `prompt-caching-2024-07-31`, `computer-use-2024-10-22`, `computer-use-2025-01-24`, `pdfs-2024-09-25`, `token-counting-2024-11-01`, `token-efficient-tools-2025-02-19`, `output-128k-2025-02-19`, `files-api-2025-04-14`, `mcp-client-2025-04-04`, `mcp-client-2025-11-20`, `dev-full-thinking-2025-05-14`, `interleaved-thinking-2025-05-14`, `code-execution-2025-05-22`, `extended-cache-ttl-2025-04-11`, `context-1m-2025-08-07`, `context-management-2025-06-27`, `model-context-window-exceeded-2025-08-26`, `skills-2025-10-02`, `fast-mode-2026-02-01`.

### Request Example
[No request body for GET]

### Response
#### Success Response (200)
- **id** (String) - Unique model identifier.
- **createdAt** (String) - RFC 3339 datetime string representing the time at which the model was released.
- **displayName** (String) - A human-readable name for the model.
- **type** (String) - Object type, always `"model"`.

#### Response Example
```json
{
  "data": [
    {
      "id": "claude-3-opus-20240229",
      "createdAt": "2024-02-29T10:00:00Z",
      "displayName": "Claude 3 Opus",
      "type": "model"
    },
    {
      "id": "claude-3-sonnet-20240229",
      "createdAt": "2024-02-29T10:00:00Z",
      "displayName": "Claude 3 Sonnet",
      "type": "model"
    }
  ],
  "limit": 20,
  "next_cursor": "some_cursor_id"
}
```
```

--------------------------------

### BetaToolTextEditor20241022 Definition

Source: https://platform.claude.com/docs/en/api/beta/messages/batches

Defines the structure for the BetaToolTextEditor20241022, a text editor tool with configurable name, type, allowed callers, cache control, loading behavior, input examples, and strict validation.

```APIDOC
## BetaToolTextEditor20241022 Definition

### Description
This object defines the configuration for a text editor tool, specifying its name, type, allowed callers, cache control, loading behavior, input examples, and strict validation.

### Method
N/A (Object Definition)

### Endpoint
N/A (Object Definition)

### Parameters
#### Request Body
- **name** (string) - Required - Name of the tool. This is how the tool will be called by the model and in `tool_use` blocks. (Value: "str_replace_editor")
- **type** (string) - Required - (Value: "text_editor_20241022")
- **allowed_callers** (array of string) - Optional - Allowed callers for the tool. (Values: "direct", "code_execution_20250825")
- **cache_control** (object) - Optional - Create a cache control breakpoint at this content block.
  - **type** (string) - Required - (Value: "ephemeral")
  - **ttl** (string) - Optional - The time-to-live for the cache control breakpoint. This may be one the following values: `5m` (5 minutes), `1h` (1 hour). Defaults to `5m`.
- **defer_loading** (boolean) - Optional - If true, tool will not be included in initial system prompt. Only loaded when returned via tool_reference from tool search.
- **input_examples** (array of map[unknown]) - Optional
- **strict** (boolean) - Optional - When true, guarantees schema validation on tool names and inputs.

### Request Example
```json
{
  "name": "str_replace_editor",
  "type": "text_editor_20241022",
  "allowed_callers": ["direct"],
  "cache_control": {
    "type": "ephemeral",
    "ttl": "1h"
  },
  "defer_loading": true,
  "input_examples": [],
  "strict": false
}
```

### Response
#### Success Response (200)
N/A (This is an object definition, not an endpoint response)

#### Response Example
{}
```

--------------------------------

### List Skills with Java SDK

Source: https://platform.claude.com/docs/en/api/java/beta/skills

Retrieves a paginated list of skills using the Claude Java SDK by making a GET request to /v1/skills endpoint. Returns a SkillListPage object containing skill metadata and pagination information.

```java
SkillListPage skillsPage = beta().skills().list(
  SkillListParams.none(),
  RequestOptions.none()
);
```