Using thinking models
Both the kimi-k2-thinking and kimi-k2.5 models have powerful thinking capabilities, supporting deep reasoning and multi-step tool use to solve complex problems.

kimi-k2-thinking: A dedicated thinking model with thinking forcibly enabled
[Recommended] kimi-k2.5: A model that can enable or disable thinking capability, enabled by default. You can disable thinking by using {"type": "disabled"}
If you are doing benchmark testing with kimi api, please refer to this benchmark best practice.

Basic use case
Using the kimi-k2-thinking model
You can simply use it by switching the model parameter:

$ curl https://api.moonshot.ai/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MOONSHOT_API_KEY" \
    -d '{
        "model": "kimi-k2-thinking",
        "messages": [
            {
                "role": "system",
                "content": "You are Kimi."
            },
            {
                "role": "user",
                "content": "Please explain why 1+1=2."
            }
        ],
        "temperature": 1.0
   }'
 

Using the kimi-k2.5 model with thinking enabled
For the kimi-k2.5 model, thinking is enabled by default, no need to manually specify it:

$ curl https://api.moonshot.ai/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MOONSHOT_API_KEY" \
    -d '{
        "model": "kimi-k2.5",
        "messages": [
            {
                "role": "system",
                "content": "You are Kimi."
            },
            {
                "role": "user",
                "content": "Please explain why 1+1=2."
            }
        ]
   }'
 

Using the kimi-k2.5 model with thinking disabled
Please refer to Disable Thinking Capability Example

Accessing the reasoning content
In the API response for kimi-k2-thinking or kimi-k2.5 (with thinking enabled) models, we use the reasoning_content field as the carrier for the model's reasoning. About the reasoning_content field:

In the OpenAI SDK, ChoiceDelta and ChatCompletionMessage types do not provide a reasoning_content field directly, so you cannot access it via .reasoning_content. You must use hasattr(obj, "reasoning_content") to check if the field exists, and if so, use getattr(obj, "reasoning_content") to retrieve its value.
If you use other frameworks or directly interface with the HTTP API, you can directly obtain the reasoning_content field at the same level as the content field.
In streaming output (stream=True), the reasoning_content field will always appear before the content field. In your business logic, you can detect if the content field has been output to determine if the reasoning (inference process) is finished.
Tokens in reasoning_content are also controlled by the max_tokens parameter: the sum of tokens in reasoning_content and content must be less than or equal to max_tokens.
Multi-Step Tool Call
Both kimi-k2-thinking and kimi-k2.5 (with thinking enabled) are designed to perform deep reasoning across multiple tool calls, enabling them to tackle highly complex tasks.

Usage Notes
To get reliable results, whether using kimi-k2-thinking or kimi-k2.5 (with thinking enabled by default), always follow these configuration rules:

Include the entire reasoning content from the context (the reasoning_content field) in your input. The model will decide which parts are necessary and forward them for further reasoning.
Set max_tokens ≥ 16,000 to ensure the full reasoning_content and final content can be returned without truncation.
Set temperature = 1.0 to get the best performance. Note that kimi-k2.5 model uses a fixed temperature of 1.0.
Enable streaming (stream = true). Because thinking models return both reasoning_content and regular content, the response is larger than usual. Streaming delivers a better user experience and helps avoid network-timeout issues.
Complete example
We walk through a complete example that shows how to properly use thinking models together with official tools for multi-step tool call and extended reasoning.

The example below demonstrates a "Daily News Report Generation" scenario. The model will sequentially call official tools like date (to get the date) and web_search (to search today's news), and will present deep reasoning throughout this process.

import os
import json
import httpx
import openai
 
 
class FormulaChatClient:
    def __init__(self, base_url: str, api_key: str):
        """Initialize Formula client"""
        self.base_url = base_url
        self.api_key = api_key
        self.openai = openai.Client(
            base_url=base_url,
            api_key=api_key,
        )
        self.httpx = httpx.Client(
            base_url=base_url,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
        # Using kimi-k2-thinking model
        # If using kimi-k2.5 model, change to "kimi-k2.5". Thinking is enabled by default
        self.model = "kimi-k2-thinking"
 
    def get_tools(self, formula_uri: str):
        """Get tool definitions from Formula API"""
        response = self.httpx.get(f"/formulas/{formula_uri}/tools")
        response.raise_for_status()
        
        try:
            return response.json().get("tools", [])
        except json.JSONDecodeError as e:
            print(f"Error: Unable to parse JSON (status code: {response.status_code})")
            print(f"Response content: {response.text[:500]}")
            raise
 
    def call_tool(self, formula_uri: str, function: str, args: dict):
        """Call an official tool"""
        response = self.httpx.post(
            f"/formulas/{formula_uri}/fibers",
            json={"name": function, "arguments": json.dumps(args)},
        )
        response.raise_for_status()
        fiber = response.json()
        
        if fiber.get("status", "") == "succeeded":
            return fiber["context"].get("output") or fiber["context"].get("encrypted_output")
        
        if "error" in fiber:
            return f"Error: {fiber['error']}"
        if "error" in fiber.get("context", {}):
            return f"Error: {fiber['context']['error']}"
        return "Error: Unknown error"
 
    def close(self):
        """Close the client connection"""
        self.httpx.close()
 
 
# Initialize client
base_url = os.getenv("MOONSHOT_BASE_URL", "https://api.moonshot.ai/v1")
api_key = os.getenv("MOONSHOT_API_KEY")
 
if not api_key:
    raise ValueError("MOONSHOT_API_KEY environment variable not set. Please set your API key.")
 
print(f"Base URL: {base_url}")
print(f"API Key: {api_key[:10]}...{api_key[-10:] if len(api_key) > 20 else api_key}\n")
 
client = FormulaChatClient(base_url, api_key)
 
# Define the official tool Formula URIs to use
formula_uris = [
    "moonshot/date:latest",
    "moonshot/web-search:latest"
]
 
# Load all tool definitions and build mapping
print("Loading official tools...")
all_tools = []
tool_to_uri = {}  # function.name -> formula_uri
 
for uri in formula_uris:
    try:
        tools = client.get_tools(uri)
        for tool in tools:
            func = tool.get("function")
            if func:
                func_name = func.get("name")
                if func_name:
                    tool_to_uri[func_name] = uri
                    all_tools.append(tool)
                    print(f"  Loaded tool: {func_name} from {uri}")
    except Exception as e:
        print(f"  Warning: Failed to load tool {uri}: {e}")
        continue
 
print(f"Loaded {len(all_tools)} tools in total\n")
 
if not all_tools:
    raise ValueError("No tools loaded. Please check API key and network connection.")
 
# Initialize message list
messages = [
    {
        "role": "system",
        "content": "You are Kimi, a professional news analyst. You excel at collecting, analyzing, and organizing information to generate high-quality news reports.",
    },
]
 
# User request to generate today's news report
user_request = "Please help me generate a daily news report including important technology, economy, and society news."
messages.append({
    "role": "user",
    "content": user_request
})
 
print(f"User request: {user_request}\n")
 
# Begin multi-step conversation loop
max_iterations = 10  # Prevent infinite loops
for iteration in range(max_iterations):
    try:
        completion = client.openai.chat.completions.create(
            model=client.model,
            messages=messages,
            max_tokens=1024 * 32,
            tools=all_tools,
            temperature=1.0,
        )
    except openai.AuthenticationError as e:
        print(f"Authentication error: {e}")
        print("Please check if the API key is correct and has the required permissions")
        raise
    except Exception as e:
        print(f"Error while calling the model: {e}")
        raise
    
    # Get response
    message = completion.choices[0].message
    
    # Print reasoning process
    if hasattr(message, "reasoning_content"):
        print(f"=============Reasoning round {iteration + 1} starts=============")
        reasoning = getattr(message, "reasoning_content")
        if reasoning:
            print(reasoning[:500] + "..." if len(reasoning) > 500 else reasoning)
        print(f"=============Reasoning round {iteration + 1} ends=============\n")
    
    # Add assistant message to context (preserve reasoning_content)
    messages.append(message)
    
    # If the model did not call any tools, conversation is done
    if not message.tool_calls:
        print("=============Final Answer=============")
        print(message.content)
        break
    
    # Handle tool calls
    print(f"The model decided to call {len(message.tool_calls)} tool(s):\n")
    
    for tool_call in message.tool_calls:
        func_name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)
        
        print(f"Calling tool: {func_name}")
        print(f"Arguments: {json.dumps(args, ensure_ascii=False, indent=2)}")
        
        # Get corresponding formula_uri
        formula_uri = tool_to_uri.get(func_name)
        if not formula_uri:
            print(f"Error: Could not find Formula URI for tool {func_name}")
            continue
        
        # Call the tool
        result = client.call_tool(formula_uri, func_name, args)
        
        # Print result (truncate if too long)
        if len(str(result)) > 200:
            print(f"Tool result: {str(result)[:200]}...\n")
        else:
            print(f"Tool result: {result}\n")
        
        # Add tool result to message list
        tool_message = {
            "role": "tool",
            "tool_call_id": tool_call.id,
            "name": func_name,
            "content": result
        }
        messages.append(tool_message)
 
print("\nConversation completed!")
 
# Cleanup
client.close()

This process demonstrates how the kimi-k2-thinking or kimi-k2.5 (with thinking enabled) model uses deep reasoning to plan and execute complex multi-step tasks, with detailed reasoning steps (reasoning_content) preserved in the context to ensure accurate tool use at every stage.