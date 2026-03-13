### Install Polymarket CLOB Client SDK

Source: https://docs.polymarket.com/quickstart

Installs the Polymarket CLOB client library and its dependencies. For TypeScript, it installs `@polymarket/clob-client` and `ethers@5`. For Python, it installs `py-clob-client`.

```bash
npm install @polymarket/clob-client ethers@5
```

```bash
pip install py-clob-client
```

--------------------------------

### Place an Order

Source: https://docs.polymarket.com/quickstart

Place a limit order on a market using the Polymarket CLOB client. Requires client setup and a valid token ID.

```APIDOC
## POST /orders

### Description
Creates and posts a limit order to the Polymarket CLOB. Requires market details like tick size and negative risk.

### Method
POST

### Endpoint
https://clob.polymarket.com

### Parameters
#### Request Body
- **tokenID** (string) - Required - The ID of the token for the desired outcome (Yes/No).
- **price** (float) - Required - The price at which to place the order.
- **size** (integer) - Required - The quantity of tokens to trade.
- **side** (enum: BUY, SELL) - Required - The side of the order (BUY or SELL).
- **orderType** (enum: GTC, IOC, FOK) - Required - The type of order (Good 'Til Canceled, Immediate Or Cancel, Fill Or Kill).

#### Request Body (Order Options)
- **tickSize** (string) - Required - The minimum price increment for the market.
- **negRisk** (boolean) - Required - Indicates if the market has negative risk.

### Request Example
```json
{
  "tokenID": "YOUR_TOKEN_ID",
  "price": 0.50,
  "size": 10,
  "side": "BUY",
  "orderType": "GTC"
}
```

### Request Example (Order Options)
```json
{
  "tickSize": "0.01",
  "negRisk": false
}
```

### Response
#### Success Response (200)
- **orderId** (string) - The unique identifier for the placed order.
- **status** (string) - The status of the placed order.

#### Response Example
```json
{
  "orderId": "some_order_id",
  "status": "open"
}
```
```

--------------------------------

### Create and Post Order (JavaScript)

Source: https://docs.polymarket.com/quickstart

This snippet demonstrates how to create and post an order using the Polymarket API in JavaScript. It logs the order ID and status upon successful submission. Ensure you have the necessary client setup and market details.

```javascript
console.log("Order ID:", response.orderID);
console.log("Status:", response.status);
```

--------------------------------

### Fetch Market Data using cURL

Source: https://docs.polymarket.com/quickstart

Fetches active market data from the Polymarket API. This endpoint is public and does not require authentication. It returns a list of markets, and this example limits the result to one.

```bash
curl "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=1"
```

--------------------------------

### Initialize Polymarket CLOB Client (Python)

Source: https://docs.polymarket.com/trading/quickstart

Sets up the Polymarket CLOB client in Python. It involves deriving API credentials and initializing the client with private key, API credentials, signature type, and funder address. This example uses an EOA wallet (signature type 0).

```python
from py_clob_client.client import ClobClient
import os

host = "https://clob.polymarket.com"
chain_id = 137  # Polygon mainnet
private_key = os.getenv("PRIVATE_KEY")

# Derive API credentials
temp_client = ClobClient(host, key=private_key, chain_id=chain_id)
api_creds = temp_client.create_or_derive_api_creds()

# Initialize trading client
client = ClobClient(
    host,
    key=private_key,
    chain_id=chain_id,
    creds=api_creds,
    signature_type=0,  # EOA
    funder="YOUR_WALLET_ADDRESS"
)
```

--------------------------------

### Place and Submit Order (Python)

Source: https://docs.polymarket.com/trading/quickstart

Creates and posts an order to the Polymarket CLOB using the Python client. Requires token ID, price, size, side, and order options like tick size and risk settings. The OrderType GTC (Good 'Til Canceled) is used.

```python
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

response = client.create_and_post_order(
    OrderArgs(
        token_id="YOUR_TOKEN_ID",
        price=0.50,
        size=10,
        side=BUY,
    ),
    options={
        "tick_size": "0.01",
        "neg_risk": False,  # Set to True for multi-outcome markets
    },
    order_type=OrderType.GTC
)

print("Order ID:", response["orderID"])
print("Status:", response["status"])
```

--------------------------------

### Initialize Authenticated ClobClient

Source: https://docs.polymarket.com/market-makers/getting-started

Shows how to initialize the ClobClient for authenticated operations after obtaining API credentials. This involves passing the API key, secret, and passphrase to the client constructor. This setup is required for trading and accessing protected market data.

```typescript
const tradingClient = new ClobClient(
  "https://clob.polymarket.com",
  137,
  wallet,
  credentials,
);
```

```python
client = ClobClient(
    "https://clob.polymarket.com",
    key=private_key,
    chain_id=137,
    creds=credentials,
)
```

--------------------------------

### Manage Orders and Trades (Python)

Source: https://docs.polymarket.com/trading/quickstart

Provides functions to view open orders, retrieve trade history, and cancel an existing order using the Python client. It demonstrates common order management operations.

```python
# View all open orders
open_orders = client.get_orders()
print(f"You have {len(open_orders)} open orders")

# View your trade history
trades = client.get_trades()
print(f"You've made {len(trades)} trades")

# Cancel an order
client.cancel(order_id=response["orderID"])
```

--------------------------------

### Initialize Polymarket CLOB Client (TypeScript)

Source: https://docs.polymarket.com/trading/quickstart

Sets up the Polymarket CLOB client in TypeScript. It involves deriving API credentials and initializing the client with signer, API credentials, signature type, and funder address. This example uses an EOA wallet (signature type 0).

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers"; // v5.8.0

const HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet
const signer = new Wallet(process.env.PRIVATE_KEY);

// Derive API credentials
const tempClient = new ClobClient(HOST, CHAIN_ID, signer);
const apiCreds = await tempClient.createOrDeriveApiKey();

// Initialize trading client
const client = new ClobClient(
  HOST,
  CHAIN_ID,
  signer,
  apiCreds,
  0, // EOA
  signer.address,
);
```

--------------------------------

### Place and Submit Order (TypeScript)

Source: https://docs.polymarket.com/trading/quickstart

Creates and posts an order to the Polymarket CLOB using the TypeScript client. Requires token ID, price, size, side, and order options like tick size and risk settings. The OrderType GTC (Good 'Til Canceled) is used.

```typescript
import { Side, OrderType } from "@polymarket/clob-client";

const response = await client.createAndPostOrder(
  {
    tokenID: "YOUR_TOKEN_ID",
    price: 0.5,
    size: 10,
    side: Side.BUY,
  },
  {
    tickSize: "0.01",
    negRisk: false, // Set to true for multi-outcome markets
  },
  OrderType.GTC,
);

console.log("Order ID:", response.orderID);
console.log("Status:", response.status);
```

--------------------------------

### Manage Orders and Trades (TypeScript)

Source: https://docs.polymarket.com/trading/quickstart

Provides functions to view open orders, retrieve trade history, and cancel an existing order using the TypeScript client. It demonstrates common order management operations.

```typescript
// View all open orders
const openOrders = await client.getOpenOrders();
console.log(`You have ${openOrders.length} open orders`);

// View your trade history
const trades = await client.getTrades();
console.log(`You've made ${trades.length} trades`);

// Cancel an order
await client.cancelOrder(response.orderID);
```

--------------------------------

### Client Setup

Source: https://docs.polymarket.com/trading/gasless

Instructions on how to set up the RelayClient with your credentials and configuration.

```APIDOC
## Client Setup

To initialize the `RelayClient`, you need to provide your relayer endpoint, chain ID, private key, and builder configuration.

### Parameters

- **relayer_url** (string) - The URL of the Polymarket relayer service.
- **chain_id** (number) - The chain ID of the network (e.g., 137 for Polygon).
- **private_key** (string) - Your private key for signing transactions.
- **builder_config** (object) - Configuration for the builder, including API key, timestamp, passphrase, and signature.

### Request Example (TypeScript)

```typescript
import { RelayClient, BuilderConfig } from "@polymarket/builder-relayer-client";

const privateKey = "YOUR_PRIVATE_KEY";
const builderConfig: BuilderConfig = {
  apiKey: "YOUR_BUILDER_API_KEY",
  timestamp: Math.floor(Date.now() / 1000),
  passphrase: "YOUR_BUILDER_PASSPHRASE",
  signature: "YOUR_HMAC_SHA256_SIGNATURE",
};

const client = new RelayClient(
  "https://relayer-v2.polymarket.com",
  137,
  privateKey,
  builderConfig
);
```

### Request Example (Python)

```python
from py_builder_relayer_client.client import RelayClient
from py_builder_relayer_client.config import BuilderConfig

private_key = "YOUR_PRIVATE_KEY"
builder_config = BuilderConfig(
    api_key="YOUR_BUILDER_API_KEY",
    timestamp=1678886400, # Example timestamp
    passphrase="YOUR_BUILDER_PASSPHRASE",
    signature="YOUR_HMAC_SHA256_SIGNATURE",
)

client = RelayClient(
    "https://relayer-v2.polymarket.com",
    137,
    private_key,
    builder_config
)
```

### Warning

Never expose Builder API credentials in client-side code. Use environment variables or a secrets manager.
```

--------------------------------

### Generate API Credentials for ClobClient

Source: https://docs.polymarket.com/market-makers/getting-started

Demonstrates how to create or derive API credentials for the ClobClient. This is essential for accessing authenticated endpoints. It shows initialization with a private key and then deriving credentials, logging them to the console. Dependencies include the '@polymarket/clob-client' library for TypeScript and 'py_clob_client' for Python.

```typescript
import { ClobClient } from "@polymarket/clob-client";

const client = new ClobClient("https://clob.polymarket.com", 137, signer);

// Derive API credentials from your wallet
const credentials = await client.createOrDeriveApiKey();
console.log("API Key:", credentials.key);
console.log("Secret:", credentials.secret);
console.log("Passphrase:", credentials.passphrase);
```

```python
from py_clob_client.client import ClobClient
import os

private_key = os.getenv("PRIVATE_KEY")

temp_client = ClobClient("https://clob.polymarket.com", key=private_key, chain_id=137)
credentials = temp_client.create_or_derive_api_creds()
```

--------------------------------

### Section Contents

Source: https://docs.polymarket.com/trading/overview

An overview of the topics covered in this documentation section, including quickstart guides, orderbook details, order management, fees, gasless transactions, CTF tokens, and bridge functionality.

```APIDOC
## What Is in This Section

<CardGroup cols={2}>
  <Card title="Quickstart" icon="bolt" href="/trading/quickstart">
    Place your first order end-to-end
  </Card>

  <Card title="Orderbook" icon="chart-bar" href="/trading/orderbook">
    Reading the orderbook, prices, spreads, and midpoints
  </Card>

  <Card title="Orders" icon="list-check" href="/trading/orders/create">
    Order types, tick sizes, creating, cancelling, and querying orders
  </Card>

  <Card title="Fees" icon="receipt" href="/trading/fees">
    Fee structure, fee-enabled markets, and maker rebates
  </Card>

  <Card title="Gasless Transactions" icon="gas-pump" href="/trading/gasless">
    Execute onchain operations without paying gas
  </Card>

  <Card title="CTF Tokens" icon="coins" href="/trading/ctf/overview">
    Split, merge, and redeem outcome tokens
  </Card>

  <Card title="Bridge" icon="bridge" href="/trading/bridge/deposit">
    Deposit and withdraw funds across chains
  </Card>
</CardGroup>
```

--------------------------------

### Install Polymarket CLOB Client SDKs

Source: https://docs.polymarket.com/api-reference/clients-sdks

Installs the Polymarket CLOB client libraries for TypeScript, Python, and Rust. These libraries enable interaction with the Polymarket CLOB API for market data and order management.

```bash
npm install @polymarket/clob-client ethers@5
```

```bash
pip install py-clob-client
```

```bash
cargo add polymarket-client-sdk
```

--------------------------------

### Install Relayer Client and Signing SDK (npm)

Source: https://docs.polymarket.com/trading/gasless

Installs the necessary npm packages for the Polymarket Builder Relayer Client and Builder Signing SDK. These are required to enable gasless transactions.

```bash
npm install @polymarket/builder-relayer-client @polymarket/builder-signing-sdk
```

--------------------------------

### Deploy Safe Wallet using Relayer Client (Python)

Source: https://docs.polymarket.com/market-makers/getting-started

Deploys a Gnosis Safe-based wallet using Polymarket's relayer client in Python. This method offers gasless transactions and contract wallet functionalities. Ensure the client is initialized with the builder configuration.

```python
from py_builder_relayer_client.client import RelayClient

# client initialized with builder_config

# Deploy the Safe wallet
response = client.deploy()
result = response.wait()
print("Safe Address:", result.get("proxyAddress"))
```

--------------------------------

### Install Relayer Client and Signing SDK (pip)

Source: https://docs.polymarket.com/trading/gasless

Installs the necessary pip packages for the Polymarket Builder Relayer Client and Builder Signing SDK. These are required to enable gasless transactions.

```bash
pip install py-builder-relayer-client py-builder-signing-sdk
```

--------------------------------

### Quickstart Polymarket CLOB Client Usage

Source: https://docs.polymarket.com/api-reference/clients-sdks

Demonstrates basic usage of the Polymarket CLOB client in TypeScript and Python. It shows how to initialize the client and fetch available markets.

```typescript
import { ClobClient } from "@polymarket/clob-client";

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds,
);

const markets = await client.getMarkets();
```

```python
from py_clob_client.client import ClobClient

client = ClobClient(
    "https://clob.polymarket.com",
    key=private_key,
    chain_id=137,
    creds=api_creds,
)

markets = client.get_markets()
```

--------------------------------

### Create and Post Order (Python)

Source: https://docs.polymarket.com/quickstart

This Python snippet shows how to create and post an order via the Polymarket API. It first fetches market details to obtain the tick size and negative risk, then constructs and submits the order. The response containing the order ID and status is then printed.

```python
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# Fetch market details to get tick size and neg risk
market = client.get_market("YOUR_CONDITION_ID")
tick_size = str(market["minimum_tick_size"])   # e.g., "0.01"
neg_risk = market["neg_risk"]             # e.g., False

response = client.create_and_post_order(
    OrderArgs(
        token_id="YOUR_TOKEN_ID",  # From Step 1
        price=0.50,
        size=10,
        side=BUY,
        order_type=OrderType.GTC,
    ),
    options={
        "tick_size": tick_size,
        "neg_risk": neg_risk,
    },
)

print("Order ID:", response["orderID"])
print("Status:", response["status"])
```

--------------------------------

### Deploy Safe Wallet using Relayer Client (TypeScript)

Source: https://docs.polymarket.com/market-makers/getting-started

Deploys a Gnosis Safe-based wallet using Polymarket's relayer client. This provides gasless transactions for on-chain operations and enables contract wallet features. Requires the Relayer Client library and a signer.

```typescript
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";

const client = new RelayClient(
  "https://relayer-v2.polymarket.com/",
  137, // Polygon mainnet
  signer,
  builderConfig,
  RelayerTxType.SAFE,
);

// Deploy the Safe wallet
const response = await client.deploy();
const result = await response.wait();
console.log("Safe Address:", result?.proxyAddress);
```

--------------------------------

### Fetch Market Data

Source: https://docs.polymarket.com/quickstart

Retrieve active market data from the Polymarket API. No authentication is required for this public endpoint.

```APIDOC
## GET /markets

### Description
Fetches a list of markets based on specified filters. Useful for finding markets and their associated token IDs.

### Method
GET

### Endpoint
https://gamma-api.polymarket.com/markets

### Query Parameters
- **active** (boolean) - Optional - Filter for active markets.
- **closed** (boolean) - Optional - Filter for closed markets.
- **limit** (integer) - Optional - The maximum number of markets to return.

### Response
#### Success Response (200)
- **question** (string) - The question posed by the market.
- **clobTokenIds** (array of strings) - An array containing the token IDs for 'Yes' and 'No' outcomes.

### Response Example
```json
[
  {
    "question": "Will it rain tomorrow?",
    "clobTokenIds": [
      "123456...",
      "789012..."
    ]
  }
]
```
```

--------------------------------

### Initialize Polymarket CLOB Client in Python

Source: https://docs.polymarket.com/quickstart

Initializes the Polymarket CLOB client in Python. It requires the host, chain ID, and private key (from environment variables). The process includes deriving API credentials for authenticated trading and setting up the client with signature type and funder address.

```python
from py_clob_client.client import ClobClient
import os

host = "https://clob.polymarket.com"
chain_id = 137  # Polygon mainnet
private_key = os.getenv("PRIVATE_KEY")

# Derive API credentials (L1 → L2 auth)
temp_client = ClobClient(host, key=private_key, chain_id=chain_id)
api_creds = temp_client.create_or_derive_api_creds()

# Initialize trading client
client = ClobClient(
    host,
    key=private_key,
    chain_id=chain_id,
    creds=api_creds,
    signature_type=0,  # Signature type: 0 = EOA
    funder="YOUR_WALLET_ADDRESS",  # Funder address
)
```

--------------------------------

### GET /supported-assets

Source: https://docs.polymarket.com/trading/bridge/withdraw

Retrieve a list of all supported assets and chains for bridging.

```APIDOC
## GET /supported-assets

### Description
Fetch a list of all assets and chains that are supported by the Polymarket bridge for withdrawals and deposits.

### Method
GET

### Endpoint
https://bridge.polymarket.com/supported-assets

### Response
#### Success Response (200)
- **supportedAssets** (array) - An array of objects, where each object represents a supported asset on a specific chain.
  - **chainId** (string) - The ID of the chain.
  - **chainName** (string) - The name of the chain.
  - **assets** (array) - An array of supported assets on this chain.
    - **address** (string) - The token address on the chain.
    - **symbol** (string) - The token symbol.
    - **decimals** (integer) - The number of decimals for the token.

#### Response Example
```json
{
  "supportedAssets": [
    {
      "chainId": "1",
      "chainName": "Ethereum",
      "assets": [
        {
          "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "symbol": "USDC",
          "decimals": 6
        }
      ]
    },
    {
      "chainId": "137",
      "chainName": "Polygon",
      "assets": [
        {
          "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e55",
          "symbol": "USDC",
          "decimals": 6
        }
      ]
    }
  ]
}
```
```

--------------------------------

### Fetch Market Data using Python

Source: https://docs.polymarket.com/quickstart

Fetches active market data using the `requests` library in Python. It retrieves market details such as the question and token IDs from the Polymarket API. This public endpoint does not require authentication.

```python
import requests

response = requests.get(
    "https://gamma-api.polymarket.com/markets",
    params={"active": "true", "closed": "false", "limit": 1}
)
markets = response.json()

market = markets[0]
print(market["question"])
print(market["clobTokenIds"])
# ["123456...", "789012..."]  — [Yes token ID, No token ID]
```

--------------------------------

### Place a Limit Order using TypeScript

Source: https://docs.polymarket.com/quickstart

Places a limit order on the Polymarket CLOB using TypeScript. It requires fetching market details to determine the tick size and negative risk, then uses the `createAndPostOrder` method with token ID, price, size, side, and order type.

```typescript
import { Side, OrderType } from "@polymarket/clob-client";

// Fetch market details to get tick size and neg risk
const market = await client.getMarket("YOUR_CONDITION_ID");
const tickSize = String(market.minimum_tick_size);   // e.g., "0.01"
const negRisk = market.neg_risk;             // e.g., false

const response = await client.createAndPostOrder(
  {
    tokenID: "YOUR_TOKEN_ID", // From Step 1
    price: 0.50,
    size: 10,
    side: Side.BUY,
    orderType: OrderType.GTC,
  },
  {
    tickSize,
    negRisk,
  },

```

--------------------------------

### Deposit USDC.e using Bridge API (TypeScript)

Source: https://docs.polymarket.com/market-makers/getting-started

This snippet demonstrates how to obtain deposit addresses for your Polymarket wallet using the Bridge API. It's useful for automated deposits from other chains. The API returns addresses for EVM, SVM, and BTC networks.

```typescript
const deposit = await fetch("https://bridge.polymarket.com/deposit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    address: "YOUR_POLYMARKET_WALLET_ADDRESS",
  }),
});

// Returns deposit addresses for EVM, SVM, and BTC networks
const addresses = await deposit.json();
// Send USDC to the appropriate address for your source chain
```

--------------------------------

### Initialize Polymarket CLOB Client in TypeScript

Source: https://docs.polymarket.com/quickstart

Initializes the Polymarket CLOB client in TypeScript. This involves setting up the host, chain ID, and signer, then creating and deriving API credentials for authenticated trading operations. It requires environment variables for private keys.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers"; // v5.8.0

const HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet
const signer = new Wallet(process.env.PRIVATE_KEY);

// Derive API credentials (L1 → L2 auth)
const tempClient = new ClobClient(HOST, CHAIN_ID, signer);
const apiCreds = await tempClient.createOrDeriveApiKey();

// Initialize trading client
const client = new ClobClient(
  HOST,
  CHAIN_ID,
  signer,
  apiCreds,
  0, // Signature type: 0 = EOA
  signer.address, // Funder address
);
```

--------------------------------

### Fetch Market Data using TypeScript

Source: https://docs.polymarket.com/quickstart

Fetches active market data using the `fetch` API in TypeScript. It retrieves market information, including the question and token IDs, from the Polymarket API. No API key is needed for this public endpoint.

```typescript
const response = await fetch(
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=1"
);
const markets = await response.json();

const market = markets[0];
console.log(market.question);
console.log(market.clobTokenIds);
// ["123456...", "789012..."]  — [Yes token ID, No token ID]
```

--------------------------------

### GET /supported-assets

Source: https://docs.polymarket.com/trading/bridge/deposit

Retrieve a list of all supported assets, their minimum deposit amounts, and the chains they are supported on.

```APIDOC
## GET /supported-assets

### Description
Verify your token is supported and meets the minimum deposit amount.

### Method
GET

### Endpoint
https://bridge.polymarket.com/supported-assets

### Parameters
None

### Request Example
None

### Response
#### Success Response (200)
- **asset** (string) - The name of the supported asset.
- **chain** (string) - The chain the asset is supported on.
- **minimum_deposit** (string) - The minimum deposit amount for the asset.

#### Response Example
```json
[
  {
    "asset": "USDC",
    "chain": "Ethereum",
    "minimum_deposit": "10.0"
  },
  {
    "asset": "USDC.e",
    "chain": "Polygon",
    "minimum_deposit": "5.0"
  }
]
```
```

--------------------------------

### GET /markets

Source: https://docs.polymarket.com/trading/clients/public

Fetch a list of all available markets.

```APIDOC
## GET /markets

### Description
Fetches a list of all available markets. This is a public method and does not require authentication.

### Method
GET

### Endpoint
/markets

### Parameters
#### Query Parameters
None

#### Request Body
None

### Response
#### Success Response (200)
An array of market objects, each containing details about a specific market.

#### Response Example
```json
[
  {
    "accepting_order_timestamp": "2023-01-01T12:00:00Z",
    "accepting_orders": true,
    "active": true,
    "archived": false,
    "closed": false,
    "condition_id": "0xabc123...",
    "description": "Will ETH price be above $3000 on Jan 1st, 2024?",
    "enable_order_book": true,
    "end_date_iso": "2024-01-01T00:00:00Z",
    "fpmm": "0xfedcba...",
    "game_start_time": null,
    "icon": "https://example.com/icon.png",
    "image": "https://example.com/image.png",
    "is_50_50_outcome": false,
    "maker_base_fee": 10,
    "market_slug": "eth-price-above-3000-jan-1-2024",
    "minimum_order_size": 0.01,
    "minimum_tick_size": 0.001,
    "neg_risk": false,
    "neg_risk_market_id": null,
    "neg_risk_request_id": null,
    "notifications_enabled": true,
    "question": "Will ETH price be above $3000 on Jan 1st, 2024?",
    "question_id": "q12345",
    "rewards": {
      "max_spread": 0.005,
      "min_size": 0.1,
      "rates": {}
    },
    "seconds_delay": 0,
    "tags": ["crypto", "eth"],
    "taker_base_fee": 20,
    "tokens": [
      {
        "outcome": "Yes",
        "price": 0.6,
        "token_id": "0xabc123...Yes",
        "winner": null
      },
      {
        "outcome": "No",
        "price": 0.4,
        "token_id": "0xabc123...No",
        "winner": null
      }
    ]
  }
]
```
```

--------------------------------

### Approve USDC Transaction

Source: https://docs.polymarket.com/market-makers/getting-started

Constructs and executes a transaction to approve the transfer of USDC tokens. This involves encoding the 'approve' function with the spender address and the maximum amount. The transaction is then sent using a client and waited upon for confirmation.

```python
approve_tx = {
    "to": USDC,
    "data": Web3().eth.contract(
        address=USDC,
        abi=[{
            "name": "approve",
            "type": "function",
            "inputs": [
                {"name": "spender", "type": "address"},
                {"name": "amount", "type": "uint256"}
            ],
            "outputs": [{"type": "bool"}]
        }]
    ).encode_abi(abi_element_identifier="approve", args=[CTF, MAX_UINT256]),
    "value": "0"
}

response = client.execute([approve_tx], "Approve USDC for CTF")
response.wait()
```

--------------------------------

### Client Initialization

Source: https://docs.polymarket.com/trading/clients/l2

L2 methods require the client to be initialized with a signer, signature type, API credentials, and funder address. This section provides examples for TypeScript and Python.

```APIDOC
## Client Initialization

L2 methods require the client to initialize with a signer, signature type, API credentials, and funder address.

### TypeScript Example

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers";

const signer = new Wallet(process.env.PRIVATE_KEY);

const apiCreds = {
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
  passphrase: process.env.PASSPHRASE,
};

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds,
  2, // GNOSIS_SAFE
  process.env.FUNDER_ADDRESS
);

// Ready to send authenticated requests
const order = await client.postOrder(signedOrder);
```

### Python Example

```python
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds
import os

api_creds = ApiCreds(
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("SECRET"),
    api_passphrase=os.getenv("PASSPHRASE")
)

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=os.getenv("PRIVATE_KEY"),
    creds=api_creds,
    signature_type=2,  // GNOSIS_SAFE
    funder=os.getenv("FUNDER_ADDRESS")
)

# Ready to send authenticated requests
order = client.post_order(signed_order)
```
```

--------------------------------

### GET /markets/{conditionId}

Source: https://docs.polymarket.com/trading/clients/public

Get details for a single market by its condition ID.

```APIDOC
## GET /markets/{conditionId}

### Description
Get details for a single market by its condition ID. This is a public method and does not require authentication.

### Method
GET

### Endpoint
/markets/{conditionId}

### Parameters
#### Path Parameters
- **conditionId** (string) - Required - The unique condition ID for the market.

#### Query Parameters
None

#### Request Body
None

### Response
#### Success Response (200)
Returns a single market object with detailed information.

#### Response Example
```json
{
  "accepting_order_timestamp": "2023-01-01T12:00:00Z",
  "accepting_orders": true,
  "active": true,
  "archived": false,
  "closed": false,
  "condition_id": "0xabc123...",
  "description": "Will ETH price be above $3000 on Jan 1st, 2024?",
  "enable_order_book": true,
  "end_date_iso": "2024-01-01T00:00:00Z",
  "fpmm": "0xfedcba...",
  "game_start_time": null,
  "icon": "https://example.com/icon.png",
  "image": "https://example.com/image.png",
  "is_50_50_outcome": false,
  "maker_base_fee": 10,
  "market_slug": "eth-price-above-3000-jan-1-2024",
  "minimum_order_size": 0.01,
  "minimum_tick_size": 0.001,
  "neg_risk": false,
  "neg_risk_market_id": null,
  "neg_risk_request_id": null,
  "notifications_enabled": true,
  "question": "Will ETH price be above $3000 on Jan 1st, 2024?",
  "question_id": "q12345",
  "rewards": {
    "max_spread": 0.005,
    "min_size": 0.1,
    "rates": {}
  },
  "seconds_delay": 0,
  "tags": ["crypto", "eth"],
  "taker_base_fee": 20,
  "tokens": [
    {
      "outcome": "Yes",
      "price": 0.6,
      "token_id": "0xabc123...Yes",
      "winner": null
    },
    {
      "outcome": "No",
      "price": 0.4,
      "token_id": "0xabc123...No",
      "winner": null
    }
  ]
}
```
```

--------------------------------

### Approve USDCe for CTF Contract using Relayer Client (TypeScript)

Source: https://docs.polymarket.com/market-makers/getting-started

This TypeScript snippet shows how to approve the CTF contract to spend USDC.e tokens using the Relayer Client. It utilizes the ethers.js library to encode the `approve` function call with the maximum possible amount.

```typescript
import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

const erc20Interface = new Interface([
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// Approve USDCe for CTF contract
const approveTx = {
  to: ADDRESSES.USDCe,
  data: erc20Interface.encodeFunctionData("approve", [
    ADDRESSES.CTF,
    ethers.constants.MaxUint256,
  ]),
  value: "0",
};

const response = await client.execute([approveTx], "Approve USDCe for CTF");
await response.wait();
```

--------------------------------

### Initialize ClobClient with Signer (TypeScript, Python)

Source: https://docs.polymarket.com/trading/clients/l1

Initializes the ClobClient for L1 methods, requiring a wallet signer. This setup is necessary before creating user API credentials. Ensure private keys are handled securely using environment variables or key management systems.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers";

const signer = new Wallet(process.env.PRIVATE_KEY);

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer // Signer required for L1 methods
);

// Ready to create user API credentials
const apiKey = await client.createApiKey();
```

```python
from py_clob_client.client import ClobClient
import os

private_key = os.getenv("PRIVATE_KEY")

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=private_key  # Signer required for L1 methods
)

# Ready to create user API credentials
api_key = client.create_api_key()
```

--------------------------------

### GET /markets

Source: https://docs.polymarket.com/api-reference/markets/list-markets

Retrieves a list of markets with options for filtering, sorting, and pagination.

```APIDOC
## GET /markets

### Description
Retrieves a list of markets. This endpoint supports filtering by various criteria such as market IDs, slugs, creator addresses, liquidity, volume, dates, tags, and more. It also allows for sorting and pagination.

### Method
GET

### Endpoint
/markets

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of markets to return. Minimum value is 0.
- **offset** (integer) - Optional - Number of markets to skip. Minimum value is 0.
- **order** (string) - Optional - Comma-separated list of fields to order by.
- **ascending** (boolean) - Optional - Specifies the sort order (true for ascending, false for descending).
- **id** (array of integers) - Optional - Filter markets by their IDs.
- **slug** (array of strings) - Optional - Filter markets by their slugs.
- **clob_token_ids** (array of strings) - Optional - Filter markets by CLOB token IDs.
- **condition_ids** (array of strings) - Optional - Filter markets by condition IDs.
- **market_maker_address** (array of strings) - Optional - Filter markets by the address of the market maker.
- **liquidity_num_min** (number) - Optional - Filter markets with minimum liquidity.
- **liquidity_num_max** (number) - Optional - Filter markets with maximum liquidity.
- **volume_num_min** (number) - Optional - Filter markets with minimum volume.
- **volume_num_max** (number) - Optional - Filter markets with maximum volume.
- **start_date_min** (string) - Optional - Filter markets by minimum start date (ISO 8601 format).
- **start_date_max** (string) - Optional - Filter markets by maximum start date (ISO 8601 format).
- **end_date_min** (string) - Optional - Filter markets by minimum end date (ISO 8601 format).
- **end_date_max** (string) - Optional - Filter markets by maximum end date (ISO 8601 format).
- **tag_id** (integer) - Optional - Filter markets by a specific tag ID.
- **related_tags** (boolean) - Optional - Include markets related to the specified tag.
- **cyom** (boolean) - Optional - Filter for "Create Your Own Market" type markets.
- **uma_resolution_status** (string) - Optional - Filter markets by UMA resolution status.
- **game_id** (string) - Optional - Filter sports markets by game ID.
- **sports_market_types** (array of strings) - Optional - Filter sports markets by type.
- **rewards_min_size** (number) - Optional - Filter markets with a minimum reward size.
- **question_ids** (array of strings) - Optional - Filter markets by question IDs.
- **include_tag** (boolean) - Optional - Include tag information in the response.
- **closed** (boolean) - Optional - Filter for closed markets.

### Request Example
```json
{
  "example": "GET /markets?limit=10&order=creation_date&ascending=false&tag_id=123"
}
```

### Response
#### Success Response (200)
- **Market** (object) - An array of market objects, each containing details like id, question, conditionId, slug, etc.

#### Response Example
```json
{
  "example": [
    {
      "id": "123e4567-e898-12d3-a456-426614174000",
      "question": "Will Bitcoin reach $100,000 by the end of 2024?",
      "conditionId": "0x123...",
      "slug": "bitcoin-100k-2024",
      "twitterCardImage": "https://example.com/image.jpg",
      "resolutionSource": "https://example.com/resolution"
    }
  ]
}
```
```

--------------------------------

### Initialize Polymarket API Credentials in Python

Source: https://docs.polymarket.com/builders/api-keys

Load Polymarket Builder API keys from environment variables into a Python object. This example uses the `py_builder_signing_sdk` to instantiate `BuilderApiKeyCreds`, facilitating secure access to Polymarket's services by reading credentials from the environment.

```python
import os
from py_builder_signing_sdk import BuilderApiKeyCreds

builder_creds = BuilderApiKeyCreds(
    key=os.environ["POLY_BUILDER_API_KEY"],
    secret=os.environ["POLY_BUILDER_SECRET"],
    passphrase=os.environ["POLY_BUILDER_PASSPHRASE"],
)
```

--------------------------------

### Contract Addresses for Polymarket Trading

Source: https://docs.polymarket.com/market-makers/getting-started

Defines the contract addresses required for various trading operations on Polymarket, including USDC.e, CTF, CTF Exchange, Neg Risk CTF Exchange, and Neg Risk Adapter. These are essential for approving tokens and interacting with trading contracts.

```typescript
const ADDRESSES = {
  USDCe: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
  CTF: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
  CTF_EXCHANGE: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  NEG_RISK_CTF_EXCHANGE: "0xC5d563A36AE78145C45a50134d48A1215220f80a",
  NEG_RISK_ADAPTER: "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296",
};
```

--------------------------------

### Get Simplified Markets

Source: https://docs.polymarket.com/api-reference/markets/get-simplified-markets

Retrieves a paginated list of simplified market data. This endpoint is useful for getting a high-level overview of active markets.

```APIDOC
## GET /simplified-markets

### Description
Fetches a paginated list of simplified market data. This endpoint allows clients to retrieve a high-level overview of markets, including their conditions, rewards, and token information.

### Method
GET

### Endpoint
/simplified-markets

### Parameters
#### Query Parameters
- **next_cursor** (string) - Optional - Used for pagination to fetch the next set of results.

### Request Example
(No request body for GET requests)

### Response
#### Success Response (200)
- **limit** (integer) - The number of items per page.
- **next_cursor** (string) - A cursor for fetching the next page of results.
- **count** (integer) - The total number of items returned in this response.
- **data** (array) - An array of SimplifiedMarket objects.
  - **SimplifiedMarket** (object)
    - **condition_id** (string) - The unique identifier for the market condition.
    - **rewards** (object) - Information about rewards associated with the market.
      - **rates** (array) - An array of reward rate objects.
        - **asset_address** (string) - The address of the asset.
        - **rewards_daily_rate** (number) - The daily reward rate.
      - **min_size** (number) - The minimum size for rewards.
      - **max_spread** (number) - The maximum spread for rewards.
    - **tokens** (array) - An array of Token objects representing market outcomes.
      - **Token** (object)
        - **token_id** (string) - The unique identifier for the token.
        - **outcome** (string) - The outcome represented by the token.
        - **price** (number) - The current price of the token.
        - **winner** (boolean) - Indicates if this token represents the winning outcome.
    - **active** (boolean) - Indicates if the market is currently active.
    - **closed** (boolean) - Indicates if the market has been closed.
    - **archived** (boolean) - Indicates if the market has been archived.
    - **accepting_orders** (boolean) - Indicates if the market is currently accepting orders.

#### Response Example
```json
{
  "limit": 10,
  "next_cursor": "some_cursor_string",
  "count": 5,
  "data": [
    {
      "condition_id": "cond_123",
      "rewards": {
        "rates": [
          {
            "asset_address": "0xabc",
            "rewards_daily_rate": 0.05
          }
        ],
        "min_size": 100,
        "max_spread": 0.02
      },
      "tokens": [
        {
          "token_id": "tok_abc",
          "outcome": "Yes",
          "price": 0.75,
          "winner": false
        },
        {
          "token_id": "tok_def",
          "outcome": "No",
          "price": 0.25,
          "winner": false
        }
      ],
      "active": true,
      "closed": false,
      "archived": false,
      "accepting_orders": true
    }
  ]
}
```

#### Error Response (400)
- Description: Invalid request parameters.

#### Error Response (500)
- Description: Internal server error.
```

--------------------------------

### GET /v1/builders/leaderboard

Source: https://docs.polymarket.com/api-reference/builders/get-aggregated-builder-leaderboard

Fetches an aggregated leaderboard of builders, allowing filtering by time period and pagination.

```APIDOC
## GET /v1/builders/leaderboard

### Description
Retrieves an aggregated leaderboard of builders based on trading volume and user activity. Supports filtering by time period and pagination.

### Method
GET

### Endpoint
/v1/builders/leaderboard

### Parameters
#### Query Parameters
- **timePeriod** (string) - Optional - The time period to aggregate results over. Allowed values: DAY, WEEK, MONTH, ALL. Defaults to DAY.
- **limit** (integer) - Optional - Maximum number of builders to return. Defaults to 25. Minimum 0, Maximum 50.
- **offset** (integer) - Optional - Starting index for pagination. Defaults to 0. Minimum 0, Maximum 1000.

### Response
#### Success Response (200)
- **rank** (string) - The rank position of the builder.
- **builder** (string) - The builder name or identifier.
- **volume** (number) - Total trading volume attributed to this builder.
- **activeUsers** (integer) - Number of active users for this builder.
- **verified** (boolean) - Whether the builder is verified.
- **builderLogo** (string) - URL to the builder's logo image.

#### Response Example
```json
[
  {
    "rank": "1",
    "builder": "ExampleBuilder",
    "volume": 1000000.50,
    "activeUsers": 5000,
    "verified": true,
    "builderLogo": "https://example.com/logos/examplebuilder.png"
  }
]
```

#### Error Response (400, 500)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "error": "Invalid timePeriod parameter"
}
```
```

--------------------------------

### Get Midpoint Prices (OpenAPI Specification)

Source: https://docs.polymarket.com/api-reference/market-data/get-midpoint-prices-request-body

This OpenAPI specification defines the POST /midpoints endpoint for retrieving midpoint prices for multiple token IDs. The midpoint is calculated as the average of the best bid and ask prices. It specifies request body schema, example payloads, and possible responses including success (200) and error (400, 500) cases.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /midpoints:
    post:
      tags:
        - Market Data
      summary: Get midpoint prices (request body)
      description: >
        Retrieves midpoint prices for multiple token IDs using a request body.

        The midpoint is calculated as the average of the best bid and ask
        prices.
      operationId: getMidpointsPost
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/BookRequest'
            example:
              - token_id: 0xabc123def456...
              - token_id: 0xdef456abc123...
      responses:
        '200':
          description: Successfully retrieved midpoint prices
          content:
            application/json:
              schema:
                type: object
                additionalProperties:
                  type: string
                description: Map of token ID to midpoint price
              example:
                0xabc123def456...: '0.45'
                0xdef456abc123...: '0.52'
        '400':
          description: Bad request - Invalid payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid payload
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: error getting the mid price
      security: []
components:
  schemas:
    BookRequest:
      type: object
      required:
        - token_id
      properties:
        token_id:
          type: string
          description: Token ID (asset ID)
          example: 0xabc123def456...
        side:
          type: string
          description: Order side (optional, not used for midpoint calculation)
          enum:
            - BUY
            - SELL
          example: BUY
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message

```

--------------------------------

### GET /sampling-simplified-markets

Source: https://docs.polymarket.com/api-reference/markets/get-sampling-simplified-markets

Fetches a paginated list of simplified market data. This endpoint is useful for quickly retrieving a sample of active markets without the full complexity.

```APIDOC
## GET /sampling-simplified-markets

### Description
Fetches a paginated list of simplified market data. This endpoint is useful for quickly retrieving a sample of active markets without the full complexity.

### Method
GET

### Endpoint
/sampling-simplified-markets

### Parameters
#### Query Parameters
- **next_cursor** (string) - Optional - Used for pagination to fetch the next set of results.

### Request Example
```json
{
  "example": "No request body for GET request"
}
```

### Response
#### Success Response (200)
- **limit** (integer) - The number of items returned in this request.
- **next_cursor** (string) - A token for fetching the next page of results.
- **count** (integer) - The total number of items available.
- **data** (array) - An array of SimplifiedMarket objects.
  - **condition_id** (string) - The unique identifier for the market condition.
  - **rewards** (object) - Information about rewards associated with the market.
    - **rates** (array) - An array of reward rate objects.
      - **asset_address** (string) - The address of the asset for the reward rate.
      - **rewards_daily_rate** (number) - The daily reward rate.
    - **min_size** (number) - The minimum size for reward eligibility.
    - **max_spread** (number) - The maximum spread for reward eligibility.
  - **tokens** (array) - An array of Token objects representing market outcomes.
    - **token_id** (string) - The unique identifier for the token.
    - **outcome** (string) - The outcome represented by the token.
    - **price** (number) - The current price of the token.
    - **winner** (boolean) - Indicates if this outcome is the winning one.
  - **active** (boolean) - Whether the market is currently active.
  - **closed** (boolean) - Whether the market has been closed.
  - **archived** (boolean) - Whether the market has been archived.
  - **accepting_orders** (boolean) - Whether the market is currently accepting orders.

#### Response Example
```json
{
  "limit": 10,
  "next_cursor": "some_cursor_string",
  "count": 100,
  "data": [
    {
      "condition_id": "cond_123",
      "rewards": {
        "rates": [
          {
            "asset_address": "0xabc",
            "rewards_daily_rate": 0.05
          }
        ],
        "min_size": 100,
        "max_spread": 0.01
      },
      "tokens": [
        {
          "token_id": "tok_abc",
          "outcome": "Yes",
          "price": 0.75,
          "winner": false
        },
        {
          "token_id": "tok_def",
          "outcome": "No",
          "price": 0.25,
          "winner": false
        }
      ],
      "active": true,
      "closed": false,
      "archived": false,
      "accepting_orders": true
    }
  ]
}
```
```

--------------------------------

### Geoblock API Response Example (JSON)

Source: https://docs.polymarket.com/api-reference/geoblock

Example of the JSON response from the `/api/geoblock` endpoint. It includes a boolean indicating if the user is blocked, the detected IP address, and the country and region codes.

```json
{
  "blocked": true,
  "ip": "203.0.113.42",
  "country": "US",
  "region": "NY"
}
```

--------------------------------

### Example Binance Solana Price Update (JSON)

Source: https://docs.polymarket.com/market-data/websocket/rtds

An example of a real-time price update message for Solana (SOLUSDT) received from the Binance source via the Polymarket RTDS. It includes the symbol, timestamp, and current price value.

```json
{
  "topic": "crypto_prices",
  "type": "update",
  "timestamp": 1753314064237,
  "payload": {
    "symbol": "solusdt",
    "timestamp": 1753314064213,
    "value": 189.55
  }
}
```

--------------------------------

### Get Spread Endpoint Definition (OpenAPI)

Source: https://docs.polymarket.com/api-reference/market-data/get-spread

Defines the OpenAPI specification for the GET /spread endpoint. This endpoint retrieves the difference between the best ask and best bid prices for a specified token ID. It requires a 'token_id' as a query parameter and returns the spread as a string in the response body, or an error if the token ID is invalid or not found.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /spread:
    get:
      tags:
        - Market Data
      summary: Get spread
      description: |
        Retrieves the spread for a specific token ID.
        The spread is the difference between the best ask and best bid prices.
      operationId: getSpread
      parameters:
        - name: token_id
          in: query
          description: Token ID (asset ID)
          required: true
          schema:
            type: string
          example: 0xabc123def456...
      responses:
        '200':
          description: Successfully retrieved spread
          content:
            application/json:
              schema:
                type: object
                required:
                  - spread
                properties:
                  spread:
                    type: string
                    description: Spread as a string
                    example: '0.02'
        '400':
          description: Bad request - Invalid token id
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid token id
        '404':
          description: Not found - No orderbook exists for the requested token id
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: No orderbook exists for the requested token id
      security: []
components:
  schemas:
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message

```

--------------------------------

### GET /spread

Source: https://docs.polymarket.com/api-reference/market-data/get-spread

Retrieves the spread for a specific token ID. The spread is the difference between the best ask and best bid prices.

```APIDOC
## GET /spread

### Description
Retrieves the spread for a specific token ID. The spread is the difference between the best ask and best bid prices.

### Method
GET

### Endpoint
/spread

### Parameters
#### Query Parameters
- **token_id** (string) - Required - Token ID (asset ID)

### Request Example
```json
{
  "token_id": "0xabc123def456..."
}
```

### Response
#### Success Response (200)
- **spread** (string) - Spread as a string

#### Response Example
```json
{
  "spread": "0.02"
}
```

#### Error Response (400)
- **error** (string) - Error message

#### Error Response Example
```json
{
  "error": "Invalid token id"
}
```

#### Error Response (404)
- **error** (string) - Error message

#### Error Response Example
```json
{
  "error": "No orderbook exists for the requested token id"
}
```
```

--------------------------------

### Initialize ClobClient with Remote Builder Signing (Python)

Source: https://docs.polymarket.com/trading/clients/builder

Initializes the ClobClient with a remote builder signing configuration, pointing to a local signing server. This is an alternative to providing local credentials directly.

```python
from py_clob_client.client import ClobClient
from py_builder_signing_sdk.config import BuilderConfig, RemoteBuilderConfig
import os

builder_config = BuilderConfig(
    remote_builder_config=RemoteBuilderConfig(
        url="http://localhost:3000/sign"
    )
)

clob_client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=os.getenv("PRIVATE_KEY"),
    creds=creds, # User's API credentials from L1 authentication
    signature_type=signature_type,
    funder=funder,
    builder_config=builder_config
)
```

--------------------------------

### Get Sampling Simplified Markets OpenAPI Spec

Source: https://docs.polymarket.com/api-reference/markets/get-sampling-simplified-markets

This OpenAPI 3.1.0 specification defines the '/sampling-simplified-markets' GET endpoint for the Polymarket CLOB API. It outlines request parameters, response schemas for successful and error cases, and server URLs for production and staging environments. The endpoint returns paginated simplified market data, including details about conditions, rewards, tokens, and market status.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /sampling-simplified-markets:
    get:
      tags:
        - Markets
      summary: Get sampling simplified markets
      operationId: getSamplingSimplifiedMarkets
      parameters:
        - name: next_cursor
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedSimplifiedMarkets'
        '400':
          description: Invalid request
        '500':
          description: Internal server error
      security: []
components:
  schemas:
    PaginatedSimplifiedMarkets:
      type: object
      properties:
        limit:
          type: integer
        next_cursor:
          type: string
        count:
          type: integer
        data:
          type: array
          items:
            $ref: '#/components/schemas/SimplifiedMarket'
    SimplifiedMarket:
      type: object
      properties:
        condition_id:
          type: string
        rewards:
          $ref: '#/components/schemas/Rewards'
        tokens:
          type: array
          items:
            $ref: '#/components/schemas/Token'
        active:
          type: boolean
        closed:
          type: boolean
        archived:
          type: boolean
        accepting_orders:
          type: boolean
    Rewards:
      type: object
      properties:
        rates:
          type: array
          items:
            type: object
            properties:
              asset_address:
                type: string
              rewards_daily_rate:
                type: number
                format: double
        min_size:
          type: number
          format: double
        max_spread:
          type: number
          format: double
    Token:
      type: object
      properties:
        token_id:
          type: string
        outcome:
          type: string
        price:
          type: number
          format: double
        winner:
          type: boolean

```

--------------------------------

### Example Binance Bitcoin Price Update (JSON)

Source: https://docs.polymarket.com/market-data/websocket/rtds

An example of a real-time price update message for Bitcoin (BTCUSDT) received from the Binance source via the Polymarket RTDS. It includes the symbol, timestamp, and current price value.

```json
{
  "topic": "crypto_prices",
  "type": "update",
  "timestamp": 1753314088421,
  "payload": {
    "symbol": "btcusdt",
    "timestamp": 1753314088395,
    "value": 67234.50
  }
}
```

--------------------------------

### Create and Post Order with ClobClient (TypeScript, Python)

Source: https://docs.polymarket.com/index

Demonstrates how to create and post an order using the ClobClient in both TypeScript and Python. This involves initializing the client with necessary credentials and parameters, then calling the createAndPostOrder method with order details and options like tick size.

```typescript
import { ClobClient, Side } from "@polymarket/clob-client";

const client = new ClobClient(host, chainId, signer, creds);

const order = await client.createAndPostOrder(
  { tokenID, price: 0.50, size: 10, side: Side.BUY },
  { tickSize: "0.01", negRisk: false }
);
```

```python
from py_clob_client.client import ClobClient
from py_clob_client.order_builder.constants import BUY

client = ClobClient(host, key=key, chain_id=chain_id, creds=creds)
order = client.create_and_post_order(
    OrderArgs(token_id=token_id, price=0.50, size=10, side=BUY),
    options={"tick_size": "0.01", "neg_risk": False}
)
```

--------------------------------

### Example Chainlink Ethereum Price Update (JSON)

Source: https://docs.polymarket.com/market-data/websocket/rtds

An example of a real-time price update message for Ethereum (ETH/USD) received from the Chainlink source via the Polymarket RTDS. It includes the symbol, timestamp, and current price value.

```json
{
  "topic": "crypto_prices_chainlink",
  "type": "update",
  "timestamp": 1753314064237,
  "payload": {
    "symbol": "eth/usd",
    "timestamp": 1753314064213,
    "value": 3456.78
  }
}
```

--------------------------------

### GET /traded - Get total markets a user has traded

Source: https://docs.polymarket.com/api-reference/misc/get-total-markets-a-user-has-traded

Retrieves the total number of markets a specific user has traded on Polymarket. Requires a user's address as a query parameter.

```APIDOC
## GET /traded

### Description
Fetches the total number of markets a user has traded. This endpoint is useful for understanding user activity on the platform.

### Method
GET

### Endpoint
/traded

### Parameters
#### Query Parameters
- **user** (string) - Required - The 0x-prefixed Ethereum address of the user.

### Request Example
```json
{
  "request": "GET /traded?user=0x56687bf447db6ffa42ffe2204a05edaa20f55839"
}
```

### Response
#### Success Response (200)
- **user** (string) - The user's address.
- **traded** (integer) - The total count of markets traded by the user.

#### Response Example
```json
{
  "user": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
  "traded": 150
}
```

#### Error Response (400, 401, 500)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "error": "Invalid user address format"
}
```
```

--------------------------------

### GET /oi - Get open interest

Source: https://docs.polymarket.com/api-reference/misc/get-open-interest

Fetches the open interest for specified markets. This endpoint allows you to retrieve the current open interest values for one or more markets identified by their unique hashes.

```APIDOC
## GET /oi

### Description
Fetches the open interest for specified markets.

### Method
GET

### Endpoint
/oi

### Parameters
#### Query Parameters
- **market** (array[string]) - Required - A list of market hashes (0x-prefixed 64-hex strings) for which to retrieve open interest.

### Request Example
```bash
curl -X GET "https://data-api.polymarket.com/oi?market=0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917"
```

### Response
#### Success Response (200)
- **market** (string) - The market hash.
- **value** (number) - The open interest value for the market.

#### Response Example
```json
[
  {
    "market": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
    "value": 12345.67
  }
]
```

#### Error Response (400, 500)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "error": "Invalid market hash provided."
}
```
```

--------------------------------

### Esports CS2 'sport_result' Message Example (JSON)

Source: https://docs.polymarket.com/market-data/websocket/sports

An example of the 'sport_result' message format for an Esports CS2 match that has finished. It shows the structure including game ID, league, teams, status, score, period, and a 'finished_timestamp'.

```json
{
  "gameId": 1317359,
  "leagueAbbreviation": "cs2",
  "slug": "cs2-arcred-the-glecs-2025-07-20",
  "homeTeam": "ARCRED",
  "awayTeam": "The glecs",
  "status": "finished",
  "score": "000-000|2-0|Bo3",
  "period": "2/3",
  "live": false,
  "ended": true,
  "finished_timestamp": "2025-07-20T18:30:00.000Z"
}
```

--------------------------------

### Example Chainlink Bitcoin Price Update (JSON)

Source: https://docs.polymarket.com/market-data/websocket/rtds

An example of a real-time price update message for Bitcoin (BTC/USD) received from the Chainlink source via the Polymarket RTDS. It includes the symbol, timestamp, and current price value.

```json
{
  "topic": "crypto_prices_chainlink",
  "type": "update",
  "timestamp": 1753314088421,
  "payload": {
    "symbol": "btc/usd",
    "timestamp": 1753314088395,
    "value": 67234.50
  }
}
```

--------------------------------

### Get Open Orders

Source: https://docs.polymarket.com/api-reference/trade/get-user-orders

Retrieves a list of open orders for a given market. Supports pagination and filtering.

```APIDOC
## GET /websites/polymarket/orders

### Description
Retrieves a list of open orders. This endpoint supports pagination using `limit` and `next_cursor` query parameters.

### Method
GET

### Endpoint
/websites/polymarket/orders

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of results per page. Defaults to 100.
- **next_cursor** (string) - Optional - Cursor for pagination (base64 encoded offset). Use the `next_cursor` from a previous response to fetch the next page of results.

### Request Example
```json
{
  "example": "GET /websites/polymarket/orders?limit=50&next_cursor=MTAw"
}
```

### Response
#### Success Response (200)
- **limit** (integer) - Maximum number of results per page.
- **next_cursor** (string) - Cursor for pagination. Empty if no more results.
- **count** (integer) - Number of orders in this response.
- **data** (array) - Array of open orders. Each object conforms to the `OpenOrder` schema.

#### Response Example
```json
{
  "example": {
    "limit": 100,
    "next_cursor": "MTAw",
    "count": 2,
    "data": [
      {
        "id": "0xabcdef1234567890abcdef1234567890abcdef12",
        "status": "ORDER_STATUS_LIVE",
        "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
        "maker_address": "0x1234567890123456789012345678901234567890",
        "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "asset_id": "0xabc123def456...",
        "side": "BUY",
        "original_size": "100000000",
        "size_matched": "0",
        "price": "0.5",
        "outcome": "YES",
        "expiration": "1735689600",
        "order_type": "GTC",
        "associate_trades": [
          "trade-123"
        ],
        "created_at": 1700000000
      }
    ]
  }
}
```

#### Error Response (4xx/5xx)
- **error** (string) - Error message describing the issue.

#### Error Response Example
```json
{
  "example": {
    "error": "Internal server error"
  }
}
```
```

--------------------------------

### Get Simplified Markets OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/markets/get-simplified-markets

This OpenAPI specification defines the endpoint for retrieving simplified market data. It includes details on the GET request for '/simplified-markets', including query parameters like 'next_cursor' and the structure of the 'PaginatedSimplifiedMarkets' response.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /simplified-markets:
    get:
      tags:
        - Markets
      summary: Get simplified markets
      operationId: getSimplifiedMarkets
      parameters:
        - name: next_cursor
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedSimplifiedMarkets'
        '400':
          description: Invalid request
        '500':
          description: Internal server error
      security: []
components:
  schemas:
    PaginatedSimplifiedMarkets:
      type: object
      properties:
        limit:
          type: integer
        next_cursor:
          type: string
        count:
          type: integer
        data:
          type: array
          items:
            $ref: '#/components/schemas/SimplifiedMarket'
    SimplifiedMarket:
      type: object
      properties:
        condition_id:
          type: string
        rewards:
          $ref: '#/components/schemas/Rewards'
        tokens:
          type: array
          items:
            $ref: '#/components/schemas/Token'
        active:
          type: boolean
        closed:
          type: boolean
        archived:
          type: boolean
        accepting_orders:
          type: boolean
    Rewards:
      type: object
      properties:
        rates:
          type: array
          items:
            type: object
            properties:
              asset_address:
                type: string
              rewards_daily_rate:
                type: number
                format: double
        min_size:
          type: number
          format: double
        max_spread:
          type: number
          format: double
    Token:
      type: object
      properties:
        token_id:
          type: string
        outcome:
          type: string
        price:
          type: number
          format: double
        winner:
          type: boolean

```

--------------------------------

### NFL 'sport_result' Message Example (JSON)

Source: https://docs.polymarket.com/market-data/websocket/sports

An example of the 'sport_result' message format for an NFL game that is currently in progress. It includes details like game ID, league, teams, status, score, period, elapsed time, and possession.

```json
{
  "gameId": 19439,
  "leagueAbbreviation": "nfl",
  "slug": "nfl-lac-buf-2025-01-26",
  "homeTeam": "LAC",
  "awayTeam": "BUF",
  "status": "InProgress",
  "score": "3-16",
  "period": "Q4",
  "elapsed": "5:18",
  "live": true,
  "ended": false,
  "turn": "lac"
}
```

--------------------------------

### Initialize ClobClient with Local Builder Credentials (Python)

Source: https://docs.polymarket.com/trading/clients/builder

Initializes the ClobClient with local builder credentials using the py_builder_signing_sdk package. Requires API key, secret, and passphrase from Polymarket.com settings.

```python
from py_clob_client.client import ClobClient
from py_builder_signing_sdk.config import BuilderConfig, BuilderApiKeyCreds
import os

builder_config = BuilderConfig(
    local_builder_creds=BuilderApiKeyCreds(
        key=os.getenv("BUILDER_API_KEY"),
        secret=os.getenv("BUILDER_SECRET"),
        passphrase=os.getenv("BUILDER_PASS_PHRASE"),
    )
)

clob_client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=os.getenv("PRIVATE_KEY"),
    creds=creds, # User's API credentials from L1 authentication
    signature_type=signature_type,
    funder=funder,
    builder_config=builder_config
)
```

--------------------------------

### Paginate Event Results using cURL

Source: https://docs.polymarket.com/market-data/fetching-markets

Demonstrates how to paginate through event results from the Polymarket API. It shows examples for fetching the first, second, and third pages of results, each containing 50 events.

```bash
# Page 1: First 50 results
curl "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=50&offset=0"

# Page 2: Next 50 results
curl "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=50&offset=50"

# Page 3: Next 50 results
curl "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=50&offset=100"
```

--------------------------------

### GET /status/{address}

Source: https://docs.polymarket.com/trading/bridge/withdraw

Monitor the progress of a withdrawal by providing the deposit address.

```APIDOC
## GET /status/{address}

### Description
Monitor the progress of your withdrawal by providing the deposit address that was generated during the withdrawal creation process.

### Method
GET

### Endpoint
https://bridge.polymarket.com/status/{address}

### Parameters
#### Path Parameters
- **address** (string) - Required - The deposit address generated during the withdrawal process.

### Response
#### Success Response (200)
- **status** (string) - The current status of the withdrawal (e.g., "pending", "completed", "failed").
- **details** (object) - Additional details about the withdrawal status.

#### Response Example
```json
{
  "status": "completed",
  "details": {
    "transactionHash": "0xabc...123",
    "destinationTxHash": "solana_tx_hash"
  }
}
```
```

--------------------------------

### Get Supported Assets

Source: https://docs.polymarket.com/api-reference/bridge/get-supported-assets

Fetches a list of all assets supported by the Polymarket bridge and swap operations, including details like chain information, token specifics, and minimum transaction amounts.

```APIDOC
## GET /supported-assets

### Description
Retrieves a list of supported assets for bridge and swap operations on Polymarket.

### Method
GET

### Endpoint
/supported-assets

### Query Parameters
None

### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **supportedAssets** (array) - A list of supported assets.
  - **chainId** (string) - The ID of the blockchain network.
  - **chainName** (string) - The human-readable name of the blockchain network.
  - **token** (object) - Details about the token.
    - **name** (string) - The full name of the token.
    - **symbol** (string) - The symbol of the token.
    - **address** (string) - The contract address of the token.
    - **decimals** (integer) - The number of decimal places for the token.
  - **minCheckoutUsd** (number) - The minimum amount in USD for deposits and withdrawals.

#### Error Response (500)
- **error** (string) - A message describing the server error.

#### Response Example
```json
{
  "supportedAssets": [
    {
      "chainId": "1",
      "chainName": "Ethereum",
      "token": {
        "name": "USD Coin",
        "symbol": "USDC",
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "decimals": 6
      },
      "minCheckoutUsd": 45
    }
  ]
}
```
```

--------------------------------

### Initialize ClobClient for L2 Methods (Python)

Source: https://docs.polymarket.com/trading/clients/l2

Initializes the ClobClient for L2 methods using API credentials, a private key, and funder address. This client is used for placing authenticated trades and managing positions.

```python
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds
import os

api_creds = ApiCreds(
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("SECRET"),
    api_passphrase=os.getenv("PASSPHRASE")
)

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=os.getenv("PRIVATE_KEY"),
    creds=api_creds,
    signature_type=2,  # GNOSIS_SAFE
    funder=os.getenv("FUNDER_ADDRESS")
)

# Ready to send authenticated requests
order = client.post_order(signed_order)
```

--------------------------------

### GET /book

Source: https://docs.polymarket.com/api-reference/market-data/get-order-book

Retrieves the order book summary for a specific token ID. Includes bids, asks, market details, and last trade price.

```APIDOC
## GET /book

### Description
Retrieves the order book summary for a specific token ID. Includes bids, asks, market details, and last trade price.

### Method
GET

### Endpoint
/book

### Parameters
#### Query Parameters
- **token_id** (string) - Required - Token ID (asset ID)

### Request Example
```json
{
  "token_id": "0xabc123def456..."
}
```

### Response
#### Success Response (200)
- **market** (string) - Market condition ID
- **asset_id** (string) - Token ID (asset ID)
- **timestamp** (string) - Timestamp of the order book snapshot
- **hash** (string) - Hash of the order book summary
- **bids** (array) - List of bid orders (sorted by price descending)
- **asks** (array) - List of ask orders (sorted by price ascending)
- **min_order_size** (string) - Minimum order size
- **tick_size** (string) - Minimum price increment (tick size)
- **neg_risk** (boolean) - Whether negative risk is enabled for this market
- **last_trade_price** (string) - Last trade price

#### Response Example
```json
{
  "market": "0x1234567890123456789012345678901234567890",
  "asset_id": "0xabc123def456...",
  "timestamp": "1234567890",
  "hash": "a1b2c3d4e5f6...",
  "bids": [
    {
      "price": "0.45",
      "size": "100"
    },
    {
      "price": "0.44",
      "size": "200"
    }
  ],
  "asks": [
    {
      "price": "0.46",
      "size": "150"
    },
    {
      "price": "0.47",
      "size": "250"
    }
  ],
  "min_order_size": "1",
  "tick_size": "0.01",
  "neg_risk": false,
  "last_trade_price": "0.45"
}
```

#### Error Response (400)
- **error** (string) - Error message

#### Error Response Example (400)
```json
{
  "error": "Invalid token id"
}
```

#### Error Response (404)
- **error** (string) - Error message

#### Error Response Example (404)
```json
{
  "error": "No orderbook exists for the requested token id"
}
```

#### Error Response (500)
- **error** (string) - Error message

#### Error Response Example (500)
```json
{
  "error": "error getting the orderbook"
}
```
```

--------------------------------

### GET /sampling-markets

Source: https://docs.polymarket.com/api-reference/markets/get-sampling-markets

Retrieves a paginated list of sampling markets. This endpoint is useful for discovering available markets on the platform.

```APIDOC
## GET /sampling-markets

### Description
Retrieves a paginated list of sampling markets. This endpoint is useful for discovering available markets on the platform.

### Method
GET

### Endpoint
/sampling-markets

### Parameters
#### Query Parameters
- **next_cursor** (string) - Optional - Used for pagination to fetch the next set of results.

### Request Example
```json
{
  "example": "No request body for GET request"
}
```

### Response
#### Success Response (200)
- **limit** (integer) - The number of markets returned in this response.
- **next_cursor** (string) - A cursor for fetching the next page of results.
- **count** (integer) - The total number of markets available.
- **data** (array) - An array of market objects.
  - **enable_order_book** (boolean) - Indicates if order book is enabled for the market.
  - **active** (boolean) - Indicates if the market is currently active.
  - **closed** (boolean) - Indicates if the market has been closed.
  - **archived** (boolean) - Indicates if the market has been archived.
  - **accepting_orders** (boolean) - Indicates if the market is currently accepting orders.
  - **accepting_order_timestamp** (string, date-time) - Timestamp when the market started accepting orders.
  - **minimum_order_size** (number, double) - The minimum size for an order.
  - **minimum_tick_size** (number, double) - The minimum tick size for price changes.
  - **condition_id** (string) - The ID of the market's condition.
  - **question_id** (string) - The ID of the market's question.
  - **question** (string) - The question posed by the market.
  - **description** (string) - A detailed description of the market.
  - **market_slug** (string) - A unique slug for the market.
  - **end_date_iso** (string, date-time) - The ISO date and time when the market ends.
  - **game_start_time** (string, date-time) - The start time of the market's game.
  - **seconds_delay** (integer) - The delay in seconds for market updates.
  - **fpmm** (string) - The FPMM (Fictitious Price Market Maker) identifier.
  - **maker_base_fee** (integer, int64) - The base fee for market makers.
  - **taker_base_fee** (integer, int64) - The base fee for market takers.
  - **notifications_enabled** (boolean) - Indicates if notifications are enabled for this market.
  - **neg_risk** (boolean) - Indicates if the market involves negative risk.
  - **neg_risk_market_id** (string) - The market ID associated with negative risk.
  - **neg_risk_request_id** (string) - The request ID for negative risk.
  - **icon** (string) - URL to the market's icon.
  - **image** (string) - URL to the market's image.
  - **rewards** (object) - Information about rewards for the market.
    - **rates** (array) - Array of reward rate objects.
      - **asset_address** (string) - The address of the asset for rewards.
      - **rewards_daily_rate** (number, double) - The daily reward rate.
    - **min_size** (number, double) - The minimum size for reward eligibility.
    - **max_spread** (number, double) - The maximum spread for reward eligibility.
  - **is_50_50_outcome** (boolean) - Indicates if the market has a 50/50 outcome.
  - **tokens** (array) - An array of token objects associated with the market.
    - **token_id** (string) - The ID of the token.
    - **outcome** (string) - The outcome represented by the token.
    - **price** (number, double) - The current price of the token.
    - **winner** (boolean) - Indicates if this token represents the winning outcome.
  - **tags** (array) - An array of tags associated with the market.

#### Response Example
```json
{
  "limit": 10,
  "next_cursor": "some_cursor_string",
  "count": 100,
  "data": [
    {
      "enable_order_book": true,
      "active": true,
      "closed": false,
      "archived": false,
      "accepting_orders": true,
      "accepting_order_timestamp": "2023-10-27T10:00:00Z",
      "minimum_order_size": 0.1,
      "minimum_tick_size": 0.001,
      "condition_id": "cond_123",
      "question_id": "q_456",
      "question": "Will Bitcoin reach $50,000 by year-end?",
      "description": "A market to bet on Bitcoin's price movement.",
      "market_slug": "btc-price-yearend",
      "end_date_iso": "2023-12-31T23:59:59Z",
      "game_start_time": "2023-01-01T00:00:00Z",
      "seconds_delay": 60,
      "fpmm": "fpmm_789",
      "maker_base_fee": 100,
      "taker_base_fee": 200,
      "notifications_enabled": true,
      "neg_risk": false,
      "neg_risk_market_id": null,
      "neg_risk_request_id": null,
      "icon": "https://example.com/icons/btc.png",
      "image": "https://example.com/images/btc.png",
      "rewards": {
        "rates": [
          {
            "asset_address": "0xabc",
            "rewards_daily_rate": 0.05
          }
        ],
        "min_size": 1.0,
        "max_spread": 0.01
      },
      "is_50_50_outcome": false,
      "tokens": [
        {
          "token_id": "token_yes",
          "outcome": "Yes",
          "price": 0.6,
          "winner": false
        },
        {
          "token_id": "token_no",
          "outcome": "No",
          "price": 0.4,
          "winner": false
        }
      ],
      "tags": ["crypto", "bitcoin", "price"]
    }
  ]
}
```
```

--------------------------------

### GET /trades

Source: https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets

Fetches trades for a specific user or market. Supports filtering by various criteria such as taker status, asset type, amount, market/event IDs, user address, and trade side.

```APIDOC
## GET /trades

### Description
Fetches trades for a user or markets. Supports filtering by various criteria.

### Method
GET

### Endpoint
/trades

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of trades to return (default: 100, max: 10000).
- **offset** (integer) - Optional - Number of trades to skip (default: 0, max: 10000).
- **takerOnly** (boolean) - Optional - If true, only returns trades where the requestor is the taker (default: true).
- **filterType** (string) - Optional - Type of asset to filter by (CASH or TOKENS). Must be provided with filterAmount.
- **filterAmount** (number) - Optional - Minimum amount to filter by. Must be provided with filterType.
- **market** (array of Hash64) - Optional - Comma-separated list of condition IDs. Mutually exclusive with eventId.
- **eventId** (array of integer) - Optional - Comma-separated list of event IDs. Mutually exclusive with market.
- **user** (Address) - Optional - The address of the user whose trades to fetch.
- **side** (string) - Optional - The side of the trade to filter by (BUY or SELL).

### Request Example
```json
{
  "example": "GET /trades?limit=10&user=0x56687bf447db6ffa42ffe2204a05edaa20f55839&side=BUY"
}
```

### Response
#### Success Response (200)
- **Array of Trade objects** - Each object contains details about a trade, including proxyWallet, side, asset, conditionId, size, price, timestamp, and associated market/event information.

#### Response Example
```json
{
  "example": [
    {
      "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
      "side": "BUY",
      "asset": "0x123...",
      "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
      "size": 10,
      "price": 0.5,
      "timestamp": 1678886400,
      "title": "Will it rain tomorrow?",
      "slug": "rain-tomorrow",
      "icon": "rain.png",
      "eventSlug": "weather-events",
      "outcome": "Yes",
      "outcomeIndex": 0,
      "name": "Polymarket",
      "pseudonym": "Polymarket",
      "bio": "Decentralized prediction market",
      "profileImage": "polymarket.png",
      "profileImageOptimized": "polymarket_optimized.png",
      "transactionHash": "0xabc..."
    }
  ]
}
```

#### Error Response (400, 401, 500)
- **ErrorResponse object** - Contains an 'error' field describing the issue.
```json
{
  "error": "Invalid parameter provided."
}
```
```

--------------------------------

### GET /status/{address}

Source: https://docs.polymarket.com/trading/bridge/deposit

Monitor the progress of your deposit through completion using the deposit address provided by the /deposit endpoint.

```APIDOC
## GET /status/{address}

### Description
Monitor your deposit progress through completion.

### Method
GET

### Endpoint
https://bridge.polymarket.com/status/{address}

### Parameters
#### Path Parameters
- **address** (string) - Required - The deposit address you are tracking.

### Request Example
None

### Response
#### Success Response (200)
- **status** (string) - The current status of the deposit (e.g., 'pending', 'processing', 'completed', 'failed').
- **details** (string) - Additional details about the deposit status.

#### Response Example
```json
{
  "status": "processing",
  "details": "Bridging assets to Polygon network."
}
```
```

--------------------------------

### Initialize ClobClient with Remote Builder Signing (TypeScript)

Source: https://docs.polymarket.com/trading/clients/builder

Initializes the ClobClient with a remote builder signing configuration, pointing to a local signing server. This is an alternative to providing local credentials directly.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

const builderConfig = new BuilderConfig({
  remoteBuilderConfig: { url: "http://localhost:3000/sign" }
});

const clobClient = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds, // User's API credentials from L1 authentication
  signatureType,
  funder,
  undefined,
  false,
  builderConfig
);
```

--------------------------------

### Initialize and Use CLOB Client (Python)

Source: https://docs.polymarket.com/api-reference/authentication

Shows how to initialize the ClobClient in Python and create/post a buy order. Requires the py-clob-client library. Inputs include API credentials and funder address. Outputs an order object.

```python
from py_clob_client.client import ClobClient
import os

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=os.getenv("PRIVATE_KEY"),
    creds=api_creds,  # Generated from L1 auth, API credentials enable L2 methods
    signature_type=1,  # signatureType explained below
    funder=os.getenv("FUNDER_ADDRESS") # funder explained below
)

# Now you can trade!
order = client.create_and_post_order(
    {"token_id": "123456", "price": 0.65, "size": 100, "side": "BUY"},
    {"tick_size": "0.01", "neg_risk": False}
)

```

--------------------------------

### Get Fee Rate by Token ID (OpenAPI)

Source: https://docs.polymarket.com/api-reference/market-data/get-fee-rate-by-path-parameter

Retrieves the base fee rate for a specific token ID using the token ID as a path parameter. This OpenAPI specification defines the GET /fee-rate/{token_id} endpoint, its parameters, and responses, including success and error scenarios.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /fee-rate/{token_id}:
    get:
      tags:
        - Market Data
      summary: Get fee rate by path parameter
      description: >
        Retrieves the base fee rate for a specific token ID using the token ID
        as a path parameter.
      operationId: getFeeRateByPath
      parameters:
        - name: token_id
          in: path
          description: Token ID (asset ID)
          required: true
          schema:
            type: string
          example: 0xabc123def456...
      responses:
        '200':
          description: Successfully retrieved fee rate
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FeeRate'
              example:
                base_fee: 30
        '400':
          description: Bad request - Invalid token id
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid token id
        '404':
          description: Not found - Fee rate not found for market
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: fee rate not found for market
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Internal server error
      security: []
components:
  schemas:
    FeeRate:
      type: object
      required:
        - base_fee
      properties:
        base_fee:
          type: integer
          format: int64
          description: Base fee in basis points
          example: 30
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message

```

--------------------------------

### GET /builder/trades

Source: https://docs.polymarket.com/api-reference/trade/get-builder-trades

Retrieves originated trades for a given builder. Builders can only see their own originated trades.

```APIDOC
## GET /builder/trades

### Description
Retrieves originated trades for a given builder. Builders can only see their own originated trades.

### Method
GET

### Endpoint
/builder/trades

### Parameters
#### Query Parameters
- **id** (string) - Optional - Trade ID to filter by specific trade
- **builder** (string) - Optional - Builder identifier (automatically set from authenticated builder, or can be specified with admin token)
- **market** (string) - Optional - Market (condition ID) to filter trades. Must be a 64-character hexadecimal string.
- **asset_id** (string) - Optional - Asset ID (token ID) to filter trades.
- **before** (string) - Optional - Filter trades before this Unix timestamp. Must be a string of digits.
- **after** (string) - Optional - Filter trades after this Unix timestamp. Must be a string of digits.
- **next_cursor** (string) - Optional - Cursor for pagination (base64 encoded offset)

### Request Example
```json
{
  "example": "No request body for GET request"
}
```

### Response
#### Success Response (200)
- **limit** (integer) - The maximum number of trades to return.
- **next_cursor** (string) - Cursor for the next page of results.
- **count** (integer) - The number of trades returned in this response.
- **data** (array) - An array of trade objects.
  - **id** (string) - Unique identifier for the trade.
  - **tradeType** (string) - Type of the trade (e.g., TAKER).
  - **takerOrderHash** (string) - Hash of the taker order.
  - **builder** (string) - Identifier of the builder who originated the trade.
  - **market** (string) - The market (condition ID) for the trade.
  - **assetId** (string) - The asset ID (token ID) for the trade.
  - **side** (string) - The side of the trade (BUY or SELL).
  - **size** (string) - The size of the trade.
  - **sizeUsdc** (string) - The size of the trade in USDC.
  - **price** (string) - The price of the trade.
  - **status** (string) - The status of the trade (e.g., TRADE_STATUS_CONFIRMED).
  - **outcome** (string) - The outcome of the market for this trade (e.g., YES).
  - **outcomeIndex** (integer) - The index of the outcome.
  - **owner** (string) - The owner of the trade.
  - **maker** (string) - The maker's address.
  - **transactionHash** (string) - The hash of the transaction associated with the trade.
  - **matchTime** (string) - The Unix timestamp when the trade was matched.
  - **bucketIndex** (integer) - The index of the bucket.
  - **fee** (string) - The fee for the trade.
  - **feeUsdc** (string) - The fee for the trade in USDC.
  - **createdAt** (string) - The timestamp when the trade was created.
  - **updatedAt** (string) - The timestamp when the trade was last updated.

#### Response Example
```json
{
  "limit": 300,
  "next_cursor": "MzAw",
  "count": 2,
  "data": [
    {
      "id": "trade-123",
      "tradeType": "TAKER",
      "takerOrderHash": "0xabcdef1234567890abcdef1234567890abcdef12",
      "builder": "0199bfa0-f4c1-7a98-9c2b-b29cc6d39e10",
      "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "assetId": "15871154585880608648532107628464183779895785213830018178010423617714102767076",
      "side": "BUY",
      "size": "100000000",
      "sizeUsdc": "50000000",
      "price": "0.5",
      "status": "TRADE_STATUS_CONFIRMED",
      "outcome": "YES",
      "outcomeIndex": 0,
      "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
      "maker": "0x1234567890123456789012345678901234567890",
      "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "matchTime": "1700000000",
      "bucketIndex": 0,
      "fee": "300000",
      "feeUsdc": "150000",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Error Response (400)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "error": "invalid builder trade params"
}
```

#### Error Response (401)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "error": "Unauthorized"
}
```
```

--------------------------------

### GET /websites/polymarket

Source: https://docs.polymarket.com/api-reference/events/list-events

Retrieves market data for Polymarket websites. Supports sorting and filtering by various criteria.

```APIDOC
## GET /websites/polymarket

### Description
Retrieves market data for Polymarket websites. Supports sorting and filtering by various criteria.

### Method
GET

### Endpoint
/websites/polymarket

### Parameters
#### Query Parameters
- **query** (string) - Optional - A search query string to filter results.
- **negRisk** (boolean) - Optional - Filters markets based on negative risk status.
- **sortBy** (string) - Optional - Specifies the field to sort the results by (e.g., 'creationDate', 'liquidity').
- **showMarketImages** (boolean) - Optional - Determines whether to include market images in the response.
- **seriesSlug** (string) - Optional - Filters markets belonging to a specific series.
- **outcomes** (string) - Optional - Filters markets based on specific outcomes.

### Request Example
```
GET /websites/polymarket?query=election&sortBy=creationDate&showMarketImages=true
```

### Response
#### Success Response (200)
- **markets** (array) - An array of market objects, each containing details like title, description, creation date, liquidity, outcomes, and image URLs.
- **pagination** (object) - Contains pagination information such as total count, limit, and offset.

#### Response Example
```json
{
  "markets": [
    {
      "title": "US Presidential Election 2024",
      "description": "Will Joe Biden win the 2024 US Presidential Election?",
      "creationDate": "2023-10-27T10:00:00Z",
      "liquidity": 150000,
      "outcomes": [
        "Yes",
        "No"
      ],
      "imageUrl": "https://example.com/images/election.jpg"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```
```

--------------------------------

### Get Series by ID (OpenAPI)

Source: https://docs.polymarket.com/api-reference/series/get-series-by-id

Defines the GET /series/{id} endpoint for retrieving series data. It includes path parameters, query parameters like 'include_chat', and response schemas for successful retrieval (200) and not found (404) scenarios. The schema for 'Series' is also detailed.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /series/{id}:
    get:
      tags:
        - Series
      summary: Get series by id
      operationId: getSeries
      parameters:
        - $ref: '#/components/parameters/pathId'
        - name: include_chat
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: Series
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Series'
        '404':
          description: Not found
components:
  parameters:
    pathId:
      name: id
      in: path
      required: true
      schema:
        type: integer
  schemas:
    Series:
      type: object
      properties:
        id:
          type: string
        ticker:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
        subtitle:
          type: string
          nullable: true
        seriesType:
          type: string
          nullable: true
        recurrence:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        image:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        layout:
          type: string
          nullable: true
        active:
          type: boolean
          nullable: true
        closed:
          type: boolean
          nullable: true
        archived:
          type: boolean
          nullable: true
        new:
          type: boolean
          nullable: true
        featured:
          type: boolean
          nullable: true
        restricted:
          type: boolean
          nullable: true
        isTemplate:
          type: boolean
          nullable: true
        templateVariables:
          type: boolean
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: string
          nullable: true
        updatedBy:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        commentsEnabled:
          type: boolean
          nullable: true
        competitive:
          type: string
          nullable: true
        volume24hr:
          type: number
          nullable: true
        volume:
          type: number
          nullable: true
        liquidity:
          type: number
          nullable: true
        startDate:
          type: string
          format: date-time
          nullable: true
        pythTokenID:
          type: string
          nullable: true
        cgAssetName:
          type: string
          nullable: true
        score:
          type: integer
          nullable: true
        events:
          type: array
          items:
            $ref: '#/components/schemas/Event'
        collections:
          type: array
          items:
            $ref: '#/components/schemas/Collection'
        categories:
          type: array
          items:
            $ref: '#/components/schemas/Category'
        tags:
          type: array
          items:
            $ref: '#/components/schemas/Tag'
        commentCount:
          type: integer
          nullable: true
        chats:
          type: array
          items:
            $ref: '#/components/schemas/Chat'
    Event:
      type: object
      properties:
        id:
          type: string
        ticker:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        title:
          type: string
          nullable: true
        subtitle:
          type: string
          nullable: true
        description:
          type: string
          nullable: true

```

--------------------------------

### GET /getOpenOrders

Source: https://docs.polymarket.com/trading/clients/l2

Retrieves a list of all open orders for the authenticated user, with optional filtering.

```APIDOC
## GET /getOpenOrders

### Description
Get all your open orders.

### Method
GET

### Endpoint
`/websites/polymarket/getOpenOrders`

### Parameters
#### Query Parameters
- **id** (string) - Optional - Filter by order ID.
- **market** (string) - Optional - Filter by market condition ID.
- **asset_id** (string) - Optional - Filter by token ID.
- **only_first_page** (boolean) - Optional - If true, only returns the first page of results.

### Response
#### Success Response (200)
- An array of `OpenOrder` objects, each containing details of an open order.

#### Response Example
```json
[
  {
    "id": "order123",
    "status": "OPEN",
    "owner": "api_key_abc",
    "maker_address": "0x123...",
    "market": "market_xyz",
    "asset_id": "asset_456",
    "side": "BUY",
    "original_size": "100",
    "size_matched": "0",
    "price": "0.5",
    "associate_trades": [],
    "outcome": "Yes",
    "created_at": 1678886400,
    "expiration": "2023-03-15T12:00:00Z",
    "order_type": "GTC"
  }
]
```
```

--------------------------------

### GET /v1/market-positions

Source: https://docs.polymarket.com/api-reference/core/get-positions-for-a-market

Retrieves positions for a specified market. You can filter by user, status, sort the results, and paginate the response.

```APIDOC
## GET /v1/market-positions

### Description
Retrieves positions for a specified market. You can filter by user, status, sort the results, and paginate the response.

### Method
GET

### Endpoint
/v1/market-positions

### Parameters
#### Query Parameters
- **market** (Hash64) - Required - The condition ID of the market to query positions for
- **user** (Address) - Optional - Filter to a single user by proxy wallet address
- **status** (string) - Optional - Filter positions by status. Enum: OPEN, CLOSED, ALL. Default: ALL
- **sortBy** (string) - Optional - Sort positions by. Enum: TOKENS, CASH_PNL, REALIZED_PNL, TOTAL_PNL. Default: TOTAL_PNL
- **sortDirection** (string) - Optional - Sort direction. Enum: ASC, DESC. Default: DESC
- **limit** (integer) - Optional - Max number of positions to return per outcome token. Min: 0, Max: 500, Default: 50
- **offset** (integer) - Optional - Pagination offset per outcome token. Min: 0, Max: 10000, Default: 0

### Request Example
```json
{
  "example": "GET /v1/market-positions?market=0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917&user=0x56687bf447db6ffa42ffe2204a05edaa20f55839&status=OPEN&sortBy=TOTAL_PNL&sortDirection=DESC&limit=100&offset=0"
}
```

### Response
#### Success Response (200)
- **token** (string) - The outcome token asset ID
- **positions** (array) - An array of market positions
  - **proxyWallet** (Address) - User's proxy wallet address
  - **name** (string) - Market name
  - **profileImage** (string) - User's profile image URL
  - **verified** (boolean) - Whether the user is verified
  - **asset** (string) - The outcome token asset ID
  - **conditionId** (Hash64) - The condition ID of the market
  - **avgPrice** (number) - Average purchase price
  - **size** (number) - Position size
  - **currPrice** (number) - Current market price
  - **currentValue** (number) - Current value of the position
  - **cashPnl** (number) - Unrealized cash PnL
  - **totalBought** (number) - Total amount bought
  - **realizedPnl** (number) - Realized PnL
  - **totalPnl** (number) - Total PnL
  - **outcome** (string) - The outcome description
  - **outcomeIndex** (integer) - The index of the outcome

#### Response Example
```json
{
  "example": [
    {
      "token": "0xabc123...",
      "positions": [
        {
          "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
          "name": "Will the price of ETH go above $5000 by Dec 31st?",
          "profileImage": "https://example.com/image.png",
          "verified": true,
          "asset": "0xabc123...",
          "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
          "avgPrice": 0.75,
          "size": 10,
          "currPrice": 0.80,
          "currentValue": 8.0,
          "cashPnl": 0.5,
          "totalBought": 7.5,
          "realizedPnl": 0.0,
          "totalPnl": 0.5,
          "outcome": "Yes",
          "outcomeIndex": 0
        }
      ]
    }
  ]
}
```

#### Error Response (400, 401, 500)
- **error** (string) - Description of the error

#### Error Response Example
```json
{
  "example": {
    "error": "Invalid market ID provided."
  }
}
```
```

--------------------------------

### Get Spreads via OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/market-data/get-spreads

This OpenAPI specification defines the endpoint for retrieving spreads for multiple token IDs. It outlines the request format (an array of token IDs) and the response structure (a map of token ID to spread value).

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /spreads:
    post:
      tags:
        - Market Data
      summary: Get spreads
      description: |
        Retrieves spreads for multiple token IDs.
        The spread is the difference between the best ask and best bid prices.
      operationId: getSpreads
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/BookRequest'
            example:
              - token_id: 0xabc123def456...
              - token_id: 0xdef456abc123...
      responses:
        '200':
          description: Successfully retrieved spreads
          content:
            application/json:
              schema:
                type: object
                additionalProperties:
                  type: string
                description: Map of token ID to spread
              example:
                0xabc123def456...: '0.02'
                0xdef456abc123...: '0.015'
        '400':
          description: Bad request - Invalid payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid payload
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: error getting the spread
      security: []
components:
  schemas:
    BookRequest:
      type: object
      required:
        - token_id
      properties:
        token_id:
          type: string
          description: Token ID (asset ID)
          example: 0xabc123def456...
        side:
          type: string
          description: Order side (optional, not used for midpoint calculation)
          enum:
            - BUY
            - SELL
          example: BUY
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message

```

--------------------------------

### Initialize ClobClient with Local Builder Credentials (TypeScript)

Source: https://docs.polymarket.com/trading/clients/builder

Initializes the ClobClient with local builder credentials using the @polymarket/builder-signing-sdk package. Requires API key, secret, and passphrase from Polymarket.com settings.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { BuilderConfig, BuilderApiKeyCreds } from "@polymarket/builder-signing-sdk";

const builderConfig = new BuilderConfig({
  localBuilderCreds: new BuilderApiKeyCreds({
    key: process.env.BUILDER_API_KEY,
    secret: process.env.BUILDER_SECRET,
    passphrase: process.env.BUILDER_PASS_PHRASE,
  }),
});

const clobClient = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds, // User's API credentials from L1 authentication
  signatureType,
  funderAddress,
  undefined,
  false,
  builderConfig
);
```

--------------------------------

### GET /websites/polymarket/builder/trades

Source: https://docs.polymarket.com/api-reference/trade/get-builder-trades

Fetches a paginated list of builder trades. Supports filtering by market, asset ID, and owner. Requires API key authentication.

```APIDOC
## GET /websites/polymarket/builder/trades

### Description
Fetches a paginated list of builder trades. Supports filtering by market, asset ID, and owner. Requires API key authentication.

### Method
GET

### Endpoint
/websites/polymarket/builder/trades

### Parameters
#### Query Parameters
- **market** (string) - Optional - Filter trades by market ID.
- **assetId** (string) - Optional - Filter trades by asset ID.
- **owner** (string) - Optional - Filter trades by owner UUID.
- **limit** (integer) - Optional - Maximum number of items per page. Defaults to 300.
- **cursor** (string) - Optional - Cursor for next page (base64 encoded offset).

### Request Example
```
GET /websites/polymarket/builder/trades?market=0x0000000000000000000000000000000000000000000000000000000000000001&limit=50
```

### Response
#### Success Response (200)
- **limit** (integer) - Maximum number of items per page.
- **next_cursor** (string) - Cursor for next page (base64 encoded offset). "LTE=" indicates no more pages.
- **count** (integer) - Number of items in current response.
- **data** (array) - Array of builder trades.
  - **id** (string) - Trade ID.
  - **tradeType** (string) - Trade type.
  - **takerOrderHash** (string) - Taker order hash.
  - **builder** (string) - Builder identifier.
  - **market** (string) - Market (condition ID).
  - **assetId** (string) - Asset ID (token ID).
  - **side** (string) - Trade side (BUY or SELL).
  - **size** (string) - Trade size.
  - **sizeUsdc** (string) - Trade size in USDC.
  - **price** (string) - Trade price.
  - **status** (string) - Trade status.
  - **outcome** (string) - Market outcome.
  - **outcomeIndex** (integer) - Outcome index.
  - **owner** (string) - Owner UUID.
  - **maker** (string) - Maker address.
  - **transactionHash** (string) - Transaction hash.
  - **matchTime** (string) - Match time (Unix timestamp).
  - **bucketIndex** (integer) - Bucket index.
  - **fee** (string) - Fee amount.
  - **feeUsdc** (string) - Fee amount in USDC.
  - **err_msg** (string | null) - Error message (if any).
  - **createdAt** (string) - Creation timestamp.

#### Response Example
```json
{
  "limit": 300,
  "next_cursor": "MzAw",
  "count": 2,
  "data": [
    {
      "id": "trade-123",
      "tradeType": "TAKER",
      "takerOrderHash": "0xabcdef1234567890abcdef1234567890abcdef12",
      "builder": "0199bfa0-f4c1-7a98-9c2b-b29cc6d39e10",
      "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "assetId": "15871154585880608648532107628464183779895785213830018178010423617714102767076",
      "side": "BUY",
      "size": "100000000",
      "sizeUsdc": "50000000",
      "price": "0.5",
      "status": "TRADE_STATUS_CONFIRMED",
      "outcome": "YES",
      "outcomeIndex": 0,
      "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
      "maker": "0x1234567890123456789012345678901234567890",
      "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "matchTime": "1700000000",
      "bucketIndex": 0,
      "fee": "300000",
      "feeUsdc": "150000",
      "err_msg": null,
      "createdAt": "2023-11-14T10:00:00Z"
    }
  ]
}
```

#### Error Response (401)
- **error** (string) - Error message indicating invalid API key or authentication failure.

#### Error Response Example (401)
```json
{
  "error": "Invalid API key"
}
```

#### Error Response (500)
- **error** (string) - Error message indicating an internal server error.

#### Error Response Example (500)
```json
{
  "error": "could not fetch builder trades"
}
```
```

--------------------------------

### GET /auth/api-keys

Source: https://docs.polymarket.com/resources/error-codes

Retrieves a list of your existing API keys.

```APIDOC
## GET /auth/api-keys

### Description
Retrieves a list of your existing API keys.

### Method
GET

### Endpoint
/auth/api-keys

### Response
#### Success Response (200)
- **apiKeys** (array[object]) - A list of your API keys and their associated information.

#### Error Response (500)
- **error** (string) - Description of the error (e.g., `Could not retrieve API keys`).
```

--------------------------------

### Get Sports Market Types OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/sports/get-valid-sports-market-types

This OpenAPI specification defines the GET /sports/market-types endpoint for the Polymarket Gamma API. It allows clients to retrieve a list of valid sports market types. The response includes a JSON array of strings representing these market types.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /sports/market-types:
    get:
      tags:
        - Sports
      summary: Get valid sports market types
      operationId: getSportsMarketTypes
      responses:
        '200':
          description: List of valid sports market types
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SportsMarketTypesResponse'
components:
  schemas:
    SportsMarketTypesResponse:
      type: object
      properties:
        marketTypes:
          type: array
          description: List of all valid sports market types
          items:
            type: string

```

--------------------------------

### GET /book

Source: https://docs.polymarket.com/trading/orderbook

Fetch the full orderbook for a specific token, including all resting bid and ask levels.

```APIDOC
## GET /book

### Description
Fetches the complete orderbook for a given token, detailing all resting bid and ask price levels.

### Method
GET

### Endpoint
`/book`

### Query Parameters
- **token_id** (string) - Required - The unique identifier for the token.

### Request Example
```bash
curl "https://clob.polymarket.com/book?token_id=TOKEN_ID"
```

### Response
#### Success Response (200)
- **market** (string) - Condition ID of the market.
- **asset_id** (string) - Token ID.
- **timestamp** (string) - Timestamp of the orderbook state.
- **bids** (array) - Buy orders sorted by price (highest first).
  - **price** (string) - The price of the bid.
  - **size** (string) - The quantity available at this bid price.
- **asks** (array) - Sell orders sorted by price (lowest first).
  - **price** (string) - The price of the ask.
  - **size** (string) - The quantity available at this ask price.
- **min_order_size** (string) - Minimum order size for this market.
- **tick_size** (string) - Minimum price increment for this market.
- **neg_risk** (boolean) - Indicates if this is a multi-outcome (neg risk) market.
- **hash** (string) - Hash of the orderbook state, useful for detecting changes.

#### Response Example
```json
{
  "market": "0xbd31dc8a...",
  "asset_id": "52114319501245...",
  "timestamp": "2023-10-21T08:00:00Z",
  "bids": [
    { "price": "0.48", "size": "1000" },
    { "price": "0.47", "size": "2500" }
  ],
  "asks": [
    { "price": "0.52", "size": "800" },
    { "price": "0.53", "size": "1500" }
  ],
  "min_order_size": "5",
  "tick_size": "0.01",
  "neg_risk": false,
  "hash": "0xabc123..."
}
```
```

--------------------------------

### POST /quote

Source: https://docs.polymarket.com/trading/bridge/withdraw

Get a quote for a withdrawal, including estimated fees and output amounts.

```APIDOC
## POST /quote

### Description
Preview fees and estimated output amounts for a withdrawal before initiating it. This helps in planning your transaction.

### Method
POST

### Endpoint
https://bridge.polymarket.com/quote

### Parameters
#### Request Body
- **fromChainId** (string) - Required - The chain ID from which you are withdrawing.
- **toChainId** (string) - Required - The chain ID to which you are withdrawing.
- **fromTokenAddress** (string) - Required - The address of the token you are withdrawing.
- **toTokenAddress** (string) - Required - The address of the token you want to receive.
- **amount** (string) - Required - The amount of tokens to withdraw.

### Request Example
```json
{
  "fromChainId": "1",
  "toChainId": "137",
  "fromTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "toTokenAddress": "0xc2132D05D31c914a87C6611C10748AEb04B58e55",
  "amount": "1000000000000000000"
}
```

### Response
#### Success Response (200)
- **estimatedOutput** (string) - The estimated amount of tokens you will receive.
- **fees** (string) - The estimated fees for the withdrawal.

#### Response Example
```json
{
  "estimatedOutput": "999000000000000000",
  "fees": "1000000000000000"
}
```
```

--------------------------------

### GET /activity

Source: https://docs.polymarket.com/api-reference/core/get-user-activity

Retrieves user activity data. This endpoint allows filtering by user, market, event, activity type, time range, and sorting options.

```APIDOC
## GET /activity

### Description
Retrieves user activity data. This endpoint allows filtering by user, market, event, activity type, time range, and sorting options.

### Method
GET

### Endpoint
/activity

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of activities to return. Defaults to 100. Minimum 0, maximum 500.
- **offset** (integer) - Optional - Number of activities to skip. Defaults to 0. Minimum 0, maximum 10000.
- **user** (Address) - Required - The user's address (0x-prefixed, 40 hex chars).
- **market** (array of Hash64) - Optional - Comma-separated list of condition IDs. Mutually exclusive with eventId.
- **eventId** (array of integer) - Optional - Comma-separated list of event IDs. Mutually exclusive with market. Minimum 1.
- **type** (array of string) - Optional - Filter by activity type. Allowed values: TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION, MAKER_REBATE.
- **start** (integer) - Optional - Start timestamp for filtering activities. Minimum 0.
- **end** (integer) - Optional - End timestamp for filtering activities. Minimum 0.
- **sortBy** (string) - Optional - Field to sort activities by. Allowed values: TIMESTAMP, TOKENS, CASH. Defaults to TIMESTAMP.
- **sortDirection** (string) - Optional - Direction of sorting. Allowed values: ASC, DESC. Defaults to DESC.
- **side** (string) - Optional - Filter by trade side. Allowed values: BUY, SELL.

### Request Example
```json
{
  "example": "GET /activity?user=0x56687bf447db6ffa42ffe2204a05edaa20f55839&limit=10&type=TRADE"
}
```

### Response
#### Success Response (200)
- **Array of Activity objects** - Each object contains details about a specific user activity.

#### Response Example
```json
{
  "example": [
    {
      "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
      "timestamp": 1678886400,
      "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
      "type": "TRADE",
      "size": 10.5,
      "usdcSize": 21.0,
      "transactionHash": "0xabc123...",
      "price": 2.0,
      "asset": "some_asset",
      "side": "BUY",
      "outcomeIndex": 0,
      "title": "Market Title",
      "slug": "market-slug",
      "icon": "market-icon.png",
      "eventSlug": "event-slug",
      "outcome": "Yes",
      "name": "Event Name"
    }
  ]
}
```

#### Error Response (400, 401, 500)
- **ErrorResponse object** - Contains details about the error.

#### Error Response Example
```json
{
  "example": {
    "message": "Invalid parameter provided."
  }
}
```
```

--------------------------------

### Initialize Polymarket Client with Remote Signing (Python)

Source: https://docs.polymarket.com/trading/gasless

Initializes the Polymarket relayer client for remote signing in Python. This setup requires the URL of your custom signing server to handle authentication requests.

```python
from py_builder_relayer_client.client import RelayClient
from py_builder_signing_sdk import BuilderConfig, RemoteBuilderConfig

builder_config = BuilderConfig(
    remote_builder_config=RemoteBuilderConfig(
        url="https://your-server.com/sign"
    )
)

client = RelayClient(
    "https://relayer-v2.polymarket.com",
    137,
    os.getenv("PRIVATE_KEY"),
    builder_config
)
```

--------------------------------

### Get Order Books

Source: https://docs.polymarket.com/api-reference/market-data/get-order-books-request-body

Retrieves order book summaries for multiple token IDs using a request body.

```APIDOC
## POST /websites/polymarket/orderbooks

### Description
Retrieves order book summaries for multiple token IDs using a request body.

### Method
POST

### Endpoint
/websites/polymarket/orderbooks

### Parameters
#### Request Body
- **tokenIds** (array[string]) - Required - An array of token IDs for which to retrieve order books.

### Request Example
```json
{
  "tokenIds": ["token1", "token2"]
}
```

### Response
#### Success Response (200)
- **orderBooks** (object) - An object where keys are token IDs and values are order book summaries.
  - **token_id** (string) - The ID of the token.
  - **bids** (array[object]) - An array of bid orders.
    - **price** (string) - The price of the bid.
    - **amount** (string) - The amount of the bid.
  - **asks** (array[object]) - An array of ask orders.
    - **price** (string) - The price of the ask.
    - **amount** (string) - The amount of the ask.

#### Response Example
```json
{
  "orderBooks": {
    "token1": {
      "token_id": "token1",
      "bids": [
        {
          "price": "1.0",
          "amount": "100"
        }
      ],
      "asks": [
        {
          "price": "1.1",
          "amount": "50"
        }
      ]
    }
  }
}
```
```

--------------------------------

### Get Market Tags by ID (OpenAPI)

Source: https://docs.polymarket.com/api-reference/markets/get-market-tags-by-id

This OpenAPI specification defines the GET /markets/{id}/tags endpoint. It allows retrieval of tags associated with a specific market ID. The endpoint returns a JSON array of Tag objects or a 404 if the market is not found. It is part of the Markets and Tags API.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /markets/{id}/tags:
    get:
      tags:
        - Markets
        - Tags
      summary: Get market tags by id
      operationId: getMarketTags
      parameters:
        - $ref: '#/components/parameters/pathId'
      responses:
        '200':
          description: Tags attached to the market
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Tag'
        '404':
          description: Not found
components:
  parameters:
    pathId:
      name: id
      in: path
      required: true
      schema:
        type: integer
  schemas:
    Tag:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        forceShow:
          type: boolean
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: integer
          nullable: true
        updatedBy:
          type: integer
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        forceHide:
          type: boolean
          nullable: true
        isCarousel:
          type: boolean
          nullable: true

```

--------------------------------

### GET /health/ok

Source: https://docs.polymarket.com/trading/clients/public

Health check endpoint to verify the CLOB service is operational.

```APIDOC
## GET /health/ok

### Description
Health check endpoint to verify the CLOB service is operational.

### Method
GET

### Endpoint
/health/ok

### Parameters
#### Query Parameters
None

#### Request Body
None

### Response
#### Success Response (200)
Returns an empty response or a simple status indicator if the service is operational.

#### Response Example
```json
{
  "status": "ok"
}
```
```

--------------------------------

### Get Market by Slug - OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/markets/get-market-by-slug

Defines the GET /markets/slug/{slug} endpoint for the Markets API. This endpoint retrieves market data using a unique slug. It includes parameters for filtering by tag and specifies the structure of the successful (200) and not found (404) responses, referencing a 'Market' schema.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /markets/slug/{slug}:
    get:
      tags:
        - Markets
      summary: Get market by slug
      operationId: getMarketBySlug
      parameters:
        - $ref: '#/components/parameters/pathSlug'
        - name: include_tag
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: Market
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Market'
        '404':
          description: Not found
components:
  parameters:
    pathSlug:
      name: slug
      in: path
      required: true
      schema:
        type: string
  schemas:
    Market:
      type: object
      properties:
        id:
          type: string
        question:
          type: string
          nullable: true
        conditionId:
          type: string
        slug:
          type: string
          nullable: true
        twitterCardImage:
          type: string
          nullable: true
        resolutionSource:
          type: string
          nullable: true
        endDate:
          type: string
          format: date-time
          nullable: true
        category:
          type: string
          nullable: true
        ammType:
          type: string
          nullable: true
        liquidity:
          type: string
          nullable: true
        sponsorName:
          type: string
          nullable: true
        sponsorImage:
          type: string
          nullable: true
        startDate:
          type: string
          format: date-time
          nullable: true
        xAxisValue:
          type: string
          nullable: true
        yAxisValue:
          type: string
          nullable: true
        denominationToken:
          type: string
          nullable: true
        fee:
          type: string
          nullable: true
        image:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        lowerBound:
          type: string
          nullable: true
        upperBound:
          type: string
          nullable: true
        description:
          type: string
          nullable: true
        outcomes:
          type: string
          nullable: true
        outcomePrices:
          type: string
          nullable: true
        volume:
          type: string
          nullable: true
        active:
          type: boolean
          nullable: true
        marketType:
          type: string
          nullable: true
        formatType:
          type: string
          nullable: true
        lowerBoundDate:
          type: string
          nullable: true
        upperBoundDate:
          type: string
          nullable: true
        closed:
          type: boolean
          nullable: true
        marketMakerAddress:
          type: string
        createdBy:
          type: integer
          nullable: true
        updatedBy:
          type: integer
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        closedTime:
          type: string
          nullable: true
        wideFormat:
          type: boolean
          nullable: true
        new:
          type: boolean
          nullable: true
        mailchimpTag:
          type: string
          nullable: true
        featured:
          type: boolean
          nullable: true
        archived:
          type: boolean
          nullable: true
        resolvedBy:
          type: string
          nullable: true
        restricted:
          type: boolean
          nullable: true
        marketGroup:
          type: integer
          nullable: true
        groupItemTitle:
          type: string
          nullable: true
        groupItemThreshold:
          type: string
          nullable: true

```

--------------------------------

### GET /price

Source: https://docs.polymarket.com/trading/orderbook

Retrieve the best available price for buying (lowest ask) or selling (highest bid) a token.

```APIDOC
## GET /price

### Description
Retrieves the best available price for either buying (lowest ask) or selling (highest bid) a specific token.

### Method
GET

### Endpoint
`/price`

### Query Parameters
- **token_id** (string) - Required - The unique identifier for the token.
- **side** (string) - Required - The side of the market to query. Accepts `BUY` (for lowest ask) or `SELL` (for highest bid).

### Request Example
```bash
# Best price for buying (lowest ask)
curl "https://clob.polymarket.com/price?token_id=TOKEN_ID&side=BUY"

# Best price for selling (highest bid)
curl "https://clob.polymarket.com/price?token_id=TOKEN_ID&side=SELL"
```

### Response
#### Success Response (200)
- **price** (string) - The best available price for the specified side.

#### Response Example
```json
{
  "price": "0.50"
}
```
```

--------------------------------

### GET /markets/{id}

Source: https://docs.polymarket.com/api-reference/markets/get-market-by-id

Retrieves detailed information about a specific market by its ID. Supports an optional query parameter to include tag information.

```APIDOC
## GET /markets/{id}

### Description
Retrieves detailed information about a specific market by its ID. Supports an optional query parameter to include tag information.

### Method
GET

### Endpoint
/markets/{id}

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the market.

#### Query Parameters
- **include_tag** (boolean) - Optional - Whether to include tag information in the response.

### Request Example
```json
{
  "example": "GET /markets/123?include_tag=true"
}
```

### Response
#### Success Response (200)
- **id** (string) - The market's unique identifier.
- **question** (string) - The question posed by the market.
- **conditionId** (string) - The ID of the market's condition.
- **slug** (string) - A URL-friendly identifier for the market.
- **twitterCardImage** (string) - URL for the Twitter card image.
- **resolutionSource** (string) - The source for market resolution.
- **endDate** (string) - The date and time the market ends (ISO 8601 format).
- **category** (string) - The category the market belongs to.
- **ammType** (string) - The Automated Market Maker type used.
- **liquidity** (string) - The total liquidity in the market.
- **sponsorName** (string) - The name of the market sponsor.
- **sponsorImage** (string) - URL for the sponsor's image.
- **startDate** (string) - The date and time the market starts (ISO 8601 format).
- **xAxisValue** (string) - Value for the x-axis in charts.
- **yAxisValue** (string) - Value for the y-axis in charts.
- **denominationToken** (string) - The token used for denomination.
- **fee** (string) - The fee associated with the market.
- **image** (string) - URL for a general market image.
- **icon** (string) - URL for a market icon.
- **lowerBound** (string) - The lower bound of the market's range.
- **upperBound** (string) - The upper bound of the market's range.
- **description** (string) - A detailed description of the market.
- **outcomes** (string) - Information about the possible outcomes.
- **outcomePrices** (string) - The prices for each outcome.
- **volume** (string) - The total trading volume.
- **active** (boolean) - Indicates if the market is currently active.
- **marketType** (string) - The type of market (e.g., prediction, binary).
- **formatType** (string) - The format of the market (e.g., categorical, scalar).
- **lowerBoundDate** (string) - The date for the lower bound.
- **upperBoundDate** (string) - The date for the upper bound.
- **closed** (boolean) - Indicates if the market has been closed.
- **marketMakerAddress** (string) - The address of the market maker.
- **createdBy** (integer) - The ID of the user who created the market.
- **updatedBy** (integer) - The ID of the user who last updated the market.
- **createdAt** (string) - The date and time the market was created (ISO 8601 format).
- **updatedAt** (string) - The date and time the market was last updated (ISO 8601 format).
- **closedTime** (string) - The time the market was closed.
- **wideFormat** (boolean) - Indicates if the market uses a wide format.
- **new** (boolean) - Indicates if the market is new.
- **mailchimpTag** (string) - A tag for Mailchimp integration.
- **featured** (boolean) - Indicates if the market is featured.
- **archived** (boolean) - Indicates if the market is archived.
- **resolvedBy** (string) - The entity that resolved the market.
- **restricted** (boolean) - Indicates if the market is restricted.
- **marketGroup** (integer) - The ID of the market group.
- **groupItemTitle** (string) - The title of the group item.
- **groupItemThreshold** (string) - The threshold for the group item.
- **questionID** (string) - The ID of the question associated with the market.

#### Response Example
```json
{
  "id": "123",
  "question": "Will Bitcoin reach $100,000 by December 31, 2024?",
  "conditionId": "cond-abc",
  "slug": "bitcoin-100k-dec-2024",
  "twitterCardImage": "https://example.com/images/btc-card.png",
  "resolutionSource": "https://example.com/resolution/btc",
  "endDate": "2024-12-31T23:59:59Z",
  "category": "Crypto",
  "ammType": "Bancor",
  "liquidity": "1000000",
  "sponsorName": "Crypto Enthusiasts",
  "sponsorImage": "https://example.com/images/crypto-logo.png",
  "startDate": "2024-01-01T00:00:00Z",
  "xAxisValue": "Date",
  "yAxisValue": "Price",
  "denominationToken": "USDC",
  "fee": "0.02",
  "image": "https://example.com/images/btc.png",
  "icon": "https://example.com/icons/btc.svg",
  "lowerBound": "0",
  "upperBound": "100000",
  "description": "A market to bet on Bitcoin's price reaching $100,000.",
  "outcomes": "Yes,No",
  "outcomePrices": "0.5,0.5",
  "volume": "500000",
  "active": true,
  "marketType": "Binary",
  "formatType": "Categorical",
  "lowerBoundDate": null,
  "upperBoundDate": null,
  "closed": false,
  "marketMakerAddress": "0x123abc...",
  "createdBy": 1,
  "updatedBy": 1,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "closedTime": null,
  "wideFormat": false,
  "new": true,
  "mailchimpTag": "btc-2024",
  "featured": false,
  "archived": false,
  "resolvedBy": null,
  "restricted": false,
  "marketGroup": null,
  "groupItemTitle": null,
  "groupItemThreshold": null,
  "questionID": "q-xyz"
}
```

#### Error Response (404)
- **description**: Not found
```

--------------------------------

### Client Initialization

Source: https://docs.polymarket.com/trading/clients/public

Initialize the ClobClient with the host URL and Polygon chain ID to interact with public methods for reading market data, prices, and order books.

```APIDOC
## Client Initialization

Public methods require the client to initialize with the host URL and Polygon chain ID.

### TypeScript Example
```typescript
import { ClobClient } from "@polymarket/clob-client";

const client = new ClobClient(
  "https://clob.polymarket.com",
  137
);

// Ready to call public methods
const markets = await client.getMarkets();
```

### Python Example
```python
from py_clob_client.client import ClobClient

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137
)

# Ready to call public methods
markets = client.get_markets()
```
```

--------------------------------

### GET /positions

Source: https://docs.polymarket.com/api-reference/core/get-current-positions-for-a-user

Retrieves current positions for a specified user. Supports filtering by market or event, and various sorting and pagination options.

```APIDOC
## GET /positions

### Description
Retrieves current positions for a specified user. Supports filtering by market or event, and various sorting and pagination options.

### Method
GET

### Endpoint
/positions

### Parameters
#### Query Parameters
- **user** (string) - Required - User address (0x-prefixed, 40 hex chars)
- **market** (array[string]) - Optional - Comma-separated list of condition IDs. Mutually exclusive with eventId.
- **eventId** (array[integer]) - Optional - Comma-separated list of event IDs. Mutually exclusive with market.
- **sizeThreshold** (number) - Optional - Minimum size threshold for positions. Defaults to 1.
- **redeemable** (boolean) - Optional - Filter for redeemable positions. Defaults to false.
- **mergeable** (boolean) - Optional - Filter for mergeable positions. Defaults to false.
- **limit** (integer) - Optional - Maximum number of positions to return. Defaults to 100. Max 500.
- **offset** (integer) - Optional - Number of positions to skip. Defaults to 0. Max 10000.
- **sortBy** (string) - Optional - Field to sort positions by. Enum: CURRENT, INITIAL, TOKENS, CASHPNL, PERCENTPNL, TITLE, RESOLVING, PRICE, AVGPRICE. Defaults to TOKENS.
- **sortDirection** (string) - Optional - Direction of sorting. Enum: ASC, DESC. Defaults to DESC.
- **title** (string) - Optional - Filter positions by title. Max length 100.

### Response
#### Success Response (200)
- **proxyWallet** (string) - User's proxy wallet address.
- **asset** (string) - The asset associated with the position.
- **conditionId** (string) - The condition ID of the market.
- **size** (number) - The size of the position.
- **avgPrice** (number) - The average price paid for the position.
- **initialValue** (number) - The initial value of the position.
- **currentValue** (number) - The current value of the position.
- **cashPnl** (number) - The cash profit or loss of the position.
- **percentPnl** (number) - The percentage profit or loss of the position.
- **totalBought** (number) - The total amount bought for this position.
- **realizedPnl** (number) - The realized profit or loss.
- **percentRealizedPnl** (number) - The percentage of realized profit or loss.
- **curPrice** (number) - The current price of the asset.
- **redeemable** (boolean) - Indicates if the position is redeemable.
- **mergeable** (boolean) - Indicates if the position is mergeable.
- **title** (string) - The title of the market.
- **slug** (string) - The slug of the market.
- **icon** (string) - The icon associated with the market.
- **eventSlug** (string) - The slug of the event.
- **outcome** (string) - The outcome of the market.
- **outcomeIndex** (integer) - The index of the outcome.
- **oppositeOutcome** (string) - The opposite outcome of the market.
- **oppositeAsset** (string) - The asset of the opposite outcome.

#### Error Response (400, 401, 500)
- **code** (string) - Error code.
- **message** (string) - Error message.

### Request Example
```json
{
  "example": "GET /positions?user=0x56687bf447db6ffa42ffe2204a05edaa20f55839&limit=10"
}
```

### Response Example
```json
{
  "example": [
    {
      "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
      "asset": "YES",
      "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
      "size": 10.5,
      "avgPrice": 0.5,
      "initialValue": 5.25,
      "currentValue": 8.4,
      "cashPnl": 3.15,
      "percentPnl": 60.0,
      "totalBought": 10.5,
      "realizedPnl": 0.0,
      "percentRealizedPnl": 0.0,
      "curPrice": 0.8,
      "redeemable": false,
      "mergeable": true,
      "title": "Will the next US president be a woman?",
      "slug": "will-the-next-us-president-be-a-woman",
      "icon": "presidential-election",
      "eventSlug": "us-presidential-election-2024",
      "outcome": "YES",
      "outcomeIndex": 0,
      "oppositeOutcome": "NO",
      "oppositeAsset": "NO"
    }
  ]
}
```
```

--------------------------------

### Initialize ClobClient for L2 Methods (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l2

Initializes the ClobClient for L2 methods using API credentials, a signer, and funder address. This client is used for placing authenticated trades and managing positions.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers";

const signer = new Wallet(process.env.PRIVATE_KEY);

const apiCreds = {
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
  passphrase: process.env.PASSPHRASE,
};

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds,
  2, // GNOSIS_SAFE
  process.env.FUNDER_ADDRESS
);

// Ready to send authenticated requests
const order = await client.postOrder(signedOrder);
```

--------------------------------

### GET /prices-history

Source: https://docs.polymarket.com/resources/error-codes

Retrieves historical price data for a market.

```APIDOC
## GET /prices-history

### Description
Retrieves historical price data for a market.

### Method
GET

### Endpoint
/prices-history

### Parameters
#### Query Parameters
- **market** (string) - Required - The market condition ID.
- **startTs** (integer) - Required - The start timestamp (Unix epoch seconds).
- **endTs** (integer) - Required - The end timestamp (Unix epoch seconds).
- **fidelity** (string) - Optional - The time fidelity of the data (e.g., '1m', '5m', '1h').

### Response
#### Success Response (200)
- **prices** (array[object]) - An array of historical price data points.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Filter validation errors`).
```

--------------------------------

### Get a Single Order

Source: https://docs.polymarket.com/trading/orders/cancel

Retrieve details for a specific order by its ID.

```APIDOC
## GET /order/{orderID}

### Description
Retrieve details for a specific order by its ID.

### Method
GET

### Endpoint
`https://clob.polymarket.com/order/{orderID}`

### Parameters
#### Path Parameters
- **orderID** (string) - Required - The ID of the order to retrieve.

### Response
#### Success Response (200)
- **status** (string) - The current status of the order.
- **size_matched** (string) - The amount of the order that has been matched.

#### Response Example
```json
{
  "status": "open",
  "size_matched": "0"
}
```
```

--------------------------------

### Post Two-Sided Orders with CLOB Client

Source: https://docs.polymarket.com/market-makers/trading

This snippet demonstrates how to post a bid and an ask order using the ClobClient. It requires initializing the client with connection details and wallet information. The function `createAndPostOrder` is used to place individual buy and sell orders with specified price, size, and order type.

```typescript
import { ClobClient, Side, OrderType } from "@polymarket/clob-client";

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  wallet,
  credentials,
  signatureType,
  funder,
);

// Bid at 0.48
const bid = await client.createAndPostOrder({
  tokenID: "3409705850427531082723332342151729...",
  side: Side.BUY,
  price: 0.48,
  size: 1000,
  orderType: OrderType.GTC,
});

// Ask at 0.52
const ask = await client.createAndPostOrder({
  tokenID: "3409705850427531082723332342151729...",
  side: Side.SELL,
  price: 0.52,
  size: 1000,
  orderType: OrderType.GTC,
});
```

```python
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY, SELL

token_id = "3409705850427531082723332342151729..."

# Bid at 0.48
bid = client.create_and_post_order(
    OrderArgs(token_id=token_id, side=BUY, price=0.48, size=1000),
    order_type=OrderType.GTC,
)

# Ask at 0.52
ask = client.create_and_post_order(
    OrderArgs(token_id=token_id, side=SELL, price=0.52, size=1000),
    order_type=OrderType.GTC,
)
```

--------------------------------

### GET /orders

Source: https://docs.polymarket.com/api-reference/trade/get-user-orders

Retrieves open orders for the authenticated user. This endpoint supports filtering by order ID, market, asset ID, and provides paginated results using a cursor.

```APIDOC
## GET /orders

### Description
Retrieves open orders for the authenticated user. Returns paginated results.
Builder-authenticated clients can also use this endpoint to retrieve orders attributed to their builder account.

### Method
GET

### Endpoint
/orders

### Parameters
#### Query Parameters
- **id** (string) - Optional - Order ID (hash) to filter by specific order
- **market** (string) - Optional - Market (condition ID) to filter orders
- **asset_id** (string) - Optional - Asset ID (token ID) to filter orders
- **next_cursor** (string) - Optional - Cursor for pagination (base64 encoded offset)

### Request Example
```json
{
  "example": "No request body for GET /orders"
}
```

### Response
#### Success Response (200)
- **limit** (integer) - The maximum number of orders to return.
- **next_cursor** (string) - A cursor for fetching the next page of results.
- **count** (integer) - The total number of orders returned in this response.
- **data** (array) - An array of order objects.
  - **id** (string) - The unique identifier for the order.
  - **status** (string) - The current status of the order (e.g., ORDER_STATUS_LIVE).
  - **owner** (string) - The owner of the order.
  - **maker_address** (string) - The maker's address associated with the order.
  - **market** (string) - The market (condition ID) the order is placed on.
  - **asset_id** (string) - The asset ID (token ID) of the order.
  - **side** (string) - The side of the order (e.g., BUY, SELL).
  - **original_size** (string) - The original size of the order.
  - **size_matched** (string) - The amount of the order that has been matched.
  - **price** (string) - The price at which the order was placed.
  - **outcome** (string) - The outcome associated with the order (e.g., YES, NO).
  - **expiration** (string) - The expiration timestamp of the order.
  - **order_type** (string) - The type of the order (e.g., GTC - Good 'Til Canceled).
  - **associate_trades** (array) - A list of trades associated with this order.
  - **created_at** (integer) - The timestamp when the order was created.

#### Response Example
```json
{
  "limit": 100,
  "next_cursor": "MTAw",
  "count": 2,
  "data": [
    {
      "id": "0xabcdef1234567890abcdef1234567890abcdef12",
      "status": "ORDER_STATUS_LIVE",
      "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
      "maker_address": "0x1234567890123456789012345678901234567890",
      "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "asset_id": "0xabc123def456...",
      "side": "BUY",
      "original_size": "100000000",
      "size_matched": "0",
      "price": "0.5",
      "outcome": "YES",
      "expiration": "1735689600",
      "order_type": "GTC",
      "associate_trades": [],
      "created_at": 1700000000
    },
    {
      "id": "0xfedcba0987654321fedcba0987654321fedcba09",
      "status": "ORDER_STATUS_LIVE",
      "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
      "maker_address": "0x1234567890123456789012345678901234567890",
      "market": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "asset_id": "0xdef456abc789...",
      "side": "SELL",
      "original_size": "200000000",
      "size_matched": "50000000",
      "price": "0.75",
      "outcome": "NO",
      "expiration": "1735689600",
      "order_type": "GTC",
      "associate_trades": [
        "trade-123"
      ],
      "created_at": 1700000001
    }
  ]
}
```

#### Error Response (400)
- **error** (string) - Description of the error (e.g., invalid order params payload).

#### Error Response (401)
- **error** (string) - Description of the error (e.g., Invalid API key).

#### Error Response (500)
- **error** (string) - Description of the error (Internal server error).

```

--------------------------------

### GET /builderTrades

Source: https://docs.polymarket.com/trading/clients/builder

Retrieves all trades attributed to your builder account. Use this to track which trades were routed through your platform.

```APIDOC
## GET /builderTrades

### Description
Retrieves all trades attributed to your builder account. Use this to track which trades were routed through your platform.

### Method
GET

### Endpoint
/websites/polymarket/builderTrades

### Parameters
#### Query Parameters
- **id** (string) - Optional - Filter trades by trade ID.
- **maker_address** (string) - Optional - Filter trades by maker address.
- **market** (string) - Optional - Filter trades by market condition ID.
- **asset_id** (string) - Optional - Filter trades by asset (token) ID.
- **before** (string) - Optional - Return trades created before this cursor value.
- **after** (string) - Optional - Return trades created after this cursor value.

### Response
#### Success Response (200)
- **trades** (BuilderTrade[]) - Array of trades attributed to the builder account.
- **next_cursor** (string) - Cursor string for fetching the next page of results.
- **limit** (number) - Maximum number of trades returned per page.
- **count** (number) - Total number of trades returned in this response.

#### Response Example
```json
{
  "trades": [
    {
      "id": "string",
      "tradeType": "string",
      "takerOrderHash": "string",
      "builder": "string",
      "market": "string",
      "assetId": "string",
      "side": "string",
      "size": "string",
      "sizeUsdc": "string",
      "price": "string",
      "status": "string",
      "outcome": "string",
      "outcomeIndex": 0,
      "owner": "string",
      "maker": "string",
      "transactionHash": "string",
      "matchTime": "string",
      "bucketIndex": 0,
      "fee": "string",
      "feeUsdc": "string",
      "err_msg": null,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "next_cursor": "string",
  "limit": 10,
  "count": 100
}
```
```

--------------------------------

### Initialize Relay Client (Python)

Source: https://docs.polymarket.com/trading/gasless

Initializes the RelayClient with the relayer URL, chain ID, private key, and builder configuration. The builder configuration includes details for remote signing.

```python
from py_builder_relayer_client.client import RelayClient
from py_builder_relayer_client.config import BuilderConfig, RemoteBuilderConfig

builder_config = BuilderConfig(
    remote_builder_config=RemoteBuilderConfig(
        url="https://your-server.com/sign"
    )
)

client = RelayClient(
    "https://relayer-v2.polymarket.com",
    137,
    private_key,
    builder_config
)
```

--------------------------------

### Get Open Orders

Source: https://docs.polymarket.com/trading/orders/cancel

Retrieve all open orders, optionally filtered by market or token.

```APIDOC
## GET /orders

### Description
Retrieve all open orders, optionally filtered by market or token.

### Method
GET

### Endpoint
`https://clob.polymarket.com/orders`

### Parameters
#### Query Parameters
- **market** (string) - Optional - The market ID to filter orders by.
- **asset_id** (string) - Optional - The specific token ID to filter orders by.

### Response
#### Success Response (200)
- **Array of order objects** - A list of open orders matching the specified filters.

#### Response Example
```json
[
  {
    "orderID": "0xb816482a...",
    "market": "0xbd31dc8a...",
    "asset_id": "52114319501245...",
    "status": "open",
    "size_matched": "0"
  }
]
```
```

--------------------------------

### Initialize and Use CLOB Client (TypeScript)

Source: https://docs.polymarket.com/api-reference/authentication

Demonstrates how to initialize the ClobClient in TypeScript and create/post a buy order. Requires ethers.js and the CLOB client library. Inputs include API credentials and funder address. Outputs an order object.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers"; // v5.8.0

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  new Wallet(process.env.PRIVATE_KEY),
  apiCreds, // Generated from L1 auth, API credentials enable L2 methods
  1, // signatureType explained below
  funderAddress // funder explained below
);

// Now you can trade!
const order = await client.createAndPostOrder(
  { tokenID: "123456", price: 0.65, size: 100, side: "BUY" },
  { tickSize: "0.01", negRisk: false }
);

```

--------------------------------

### GET /getOrder

Source: https://docs.polymarket.com/trading/clients/l2

Retrieves details for a specific order using its unique ID.

```APIDOC
## GET /getOrder

### Description
Get details for a specific order by ID.

### Method
GET

### Endpoint
`/websites/polymarket/getOrder/{orderID}`

### Parameters
#### Path Parameters
- **orderID** (string) - Required - The unique identifier of the order.

### Response
#### Success Response (200)
- **id** (string) - The unique order ID.
- **status** (string) - The current status of the order.
- **owner** (string) - The API key of the order owner.
- **maker_address** (string) - The on-chain address of the order maker.
- **market** (string) - The market condition ID the order belongs to.
- **asset_id** (string) - The token ID the order is for.
- **side** (string) - The side of the order (BUY or SELL).
- **original_size** (string) - The original size of the order when it was placed.
- **size_matched** (string) - The amount of the order that has been matched so far.
- **price** (string) - The limit price of the order.
- **associate_trades** (string[]) - Array of trade IDs associated with this order.
- **outcome** (string) - The outcome label for the order's token.
- **created_at** (number) - Unix timestamp of when the order was created.
- **expiration** (string) - The expiration time of the order.
- **order_type** (string) - The order type (e.g. GTC, FOK, FAK, GTD).

#### Response Example
```json
{
  "id": "order123",
  "status": "OPEN",
  "owner": "api_key_abc",
  "maker_address": "0x123...",
  "market": "market_xyz",
  "asset_id": "asset_456",
  "side": "BUY",
  "original_size": "100",
  "size_matched": "0",
  "price": "0.5",
  "associate_trades": [],
  "outcome": "Yes",
  "created_at": 1678886400,
  "expiration": "2023-03-15T12:00:00Z",
  "order_type": "GTC"
}
```
```

--------------------------------

### Next Steps: Create and Cancel Orders

Source: https://docs.polymarket.com/trading/orders/overview

Guidance on the next steps for interacting with the Polymarket API, specifically for creating and canceling orders.

```APIDOC
## Next Steps

<CardGroup cols={2}>
  <Card title="Create Order" icon="plus" href="/trading/orders/create">
    Build, sign, and submit orders
  </Card>

  <Card title="Cancel Order" icon="xmark" href="/trading/orders/cancel">
    Cancel single, multiple, or all orders
  </Card>
</CardGroup>
```

--------------------------------

### Get Tag by Slug

Source: https://docs.polymarket.com/api-reference/tags/get-tag-by-slug

Retrieves a specific tag by its unique slug. This endpoint is part of the Tags API.

```APIDOC
## GET /tags/slug/{slug}

### Description
Retrieves a specific tag by its unique slug. This endpoint is part of the Tags API.

### Method
GET

### Endpoint
https://gamma-api.polymarket.com/tags/slug/{slug}

### Parameters
#### Path Parameters
- **slug** (string) - Required - The unique slug of the tag to retrieve.

#### Query Parameters
- **include_template** (boolean) - Optional - Whether to include template information in the response.

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the tag.
- **label** (string) - The display label for the tag.
- **slug** (string) - The unique slug of the tag.
- **forceShow** (boolean) - Indicates if the tag should always be shown.
- **publishedAt** (string) - The timestamp when the tag was published.
- **createdBy** (integer) - The ID of the user who created the tag.
- **updatedBy** (integer) - The ID of the user who last updated the tag.
- **createdAt** (string) - The timestamp when the tag was created.
- **updatedAt** (string) - The timestamp when the tag was last updated.
- **forceHide** (boolean) - Indicates if the tag should always be hidden.
- **isCarousel** (boolean) - Indicates if the tag is displayed as a carousel.

#### Response Example
```json
{
  "id": "tag_123",
  "label": "Technology",
  "slug": "technology",
  "forceShow": false,
  "publishedAt": "2023-10-27T10:00:00Z",
  "createdBy": 1,
  "updatedBy": 1,
  "createdAt": "2023-10-27T09:00:00Z",
  "updatedAt": "2023-10-27T09:30:00Z",
  "forceHide": false,
  "isCarousel": true
}
```
```

--------------------------------

### GET /getLastTradePrice

Source: https://docs.polymarket.com/trading/orderbook

Retrieve the price and side of the most recent trade for a given token.

```APIDOC
## GET /getLastTradePrice

### Description
Get the price and side of the most recent trade for a token.

### Method
GET

### Endpoint
`/getLastTradePrice`

### Query Parameters
- **token_id** (string) - Required - The ID of the token for which to fetch the last trade price.

### Response
#### Success Response (200)
- **price** (string) - The price of the last trade.
- **side** (string) - The side of the last trade (`BUY` or `SELL`).

#### Response Example
```json
{
  "price": "0.52",
  "side": "BUY"
}
```
```

--------------------------------

### Create Market Orders (FOK/FAK) in TypeScript and Python

Source: https://docs.polymarket.com/trading/orders/create

Illustrates the creation of Market orders using Fill-Or-Kill (FOK) and Fill-And-Kill (FAK) types. These orders execute immediately against resting liquidity. The `price` field acts as a worst-price limit for slippage protection.

```typescript
import { Side, OrderType } from "@polymarket/clob-client";

// FOK BUY: spend exactly $100 or cancel entirely
const buyOrder = await client.createMarketOrder(
  {
    tokenID: "TOKEN_ID",
    side: Side.BUY,
    amount: 100, // dollar amount
    price: 0.5, // worst-price limit (slippage protection)
  },
  { tickSize: "0.01", negRisk: false },
);
await client.postOrder(buyOrder, OrderType.FOK);

// FOK SELL: sell exactly 200 shares or cancel entirely
const sellOrder = await client.createMarketOrder(
  {
    tokenID: "TOKEN_ID",
    side: Side.SELL,
    amount: 200, // number of shares
    price: 0.45, // worst-price limit (slippage protection)
  },
  { tickSize: "0.01", negRisk: false },
);
await client.postOrder(sellOrder, OrderType.FOK);
```

```python
from py_clob_client.order_builder.constants import BUY, SELL
from py_clob_client.clob_types import OrderType

# FOK BUY: spend exactly $100 or cancel entirely
buy_order = client.create_market_order(
    token_id="TOKEN_ID",
    side=BUY,
    amount=100,  // dollar amount
    price=0.50,  // worst-price limit (slippage protection)
    options={"tick_size": "0.01", "neg_risk": False},
)
client.post_order(buy_order, OrderType.FOK)

# FOK SELL: sell exactly 200 shares or cancel entirely
sell_order = client.create_market_order(
    token_id="TOKEN_ID",
    side=SELL,
    amount=200,  // number of shares
    price=0.45,  // worst-price limit (slippage protection)
    options={"tick_size": "0.01", "neg_risk": False},
)
client.post_order(sell_order, OrderType.FOK)
```

--------------------------------

### Get Trades - OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets

This OpenAPI 3.0.3 specification defines the '/trades' endpoint for the Polymarket Data API. It details request parameters for filtering trades by user, markets, and trade specifics, along with response schemas for success and error cases. No external dependencies are required to interpret this specification.

```yaml
openapi: 3.0.3
info:
  title: Polymarket Data API
  version: 1.0.0
  description: >
    HTTP API for Polymarket data. This specification documents all public
    routes.
servers:
  - url: https://data-api.polymarket.com
    description: Relative server (same host)
security: []
tags:
  - name: Data API Status
    description: Data API health check
  - name: Core
  - name: Builders
  - name: Misc
paths:
  /trades:
    get:
      tags:
        - Core
      summary: Get trades for a user or markets
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
            default: 100
            minimum: 0
            maximum: 10000
        - in: query
          name: offset
          schema:
            type: integer
            default: 0
            minimum: 0
            maximum: 10000
        - in: query
          name: takerOnly
          schema:
            type: boolean
            default: true
        - in: query
          name: filterType
          schema:
            type: string
            enum:
              - CASH
              - TOKENS
          description: Must be provided together with filterAmount.
        - in: query
          name: filterAmount
          schema:
            type: number
            minimum: 0
          description: Must be provided together with filterType.
        - in: query
          name: market
          style: form
          explode: false
          schema:
            type: array
            items:
              $ref: '#/components/schemas/Hash64'
          description: >-
            Comma-separated list of condition IDs. Mutually exclusive with
            eventId.
        - in: query
          name: eventId
          style: form
          explode: false
          schema:
            type: array
            items:
              type: integer
              minimum: 1
          description: Comma-separated list of event IDs. Mutually exclusive with market.
        - in: query
          name: user
          schema:
            $ref: '#/components/schemas/Address'
        - in: query
          name: side
          schema:
            type: string
            enum:
              - BUY
              - SELL
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Trade'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    Hash64:
      type: string
      description: 0x-prefixed 64-hex string
      pattern: '^0x[a-fA-F0-9]{64}$'
      example: '0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917'
    Address:
      type: string
      description: User Profile Address (0x-prefixed, 40 hex chars)
      pattern: '^0x[a-fA-F0-9]{40}$'
      example: '0x56687bf447db6ffa42ffe2204a05edaa20f55839'
    Trade:
      type: object
      properties:
        proxyWallet:
          $ref: '#/components/schemas/Address'
        side:
          type: string
          enum:
            - BUY
            - SELL
        asset:
          type: string
        conditionId:
          $ref: '#/components/schemas/Hash64'
        size:
          type: number
        price:
          type: number
        timestamp:
          type: integer
          format: int64
        title:
          type: string
        slug:
          type: string
        icon:
          type: string
        eventSlug:
          type: string
        outcome:
          type: string
        outcomeIndex:
          type: integer
        name:
          type: string
        pseudonym:
          type: string
        bio:
          type: string
        profileImage:
          type: string
        profileImageOptimized:
          type: string
        transactionHash:
          type: string
    ErrorResponse:
      type: object
      properties:
        error:
          type: string
      required:
        - error

```

--------------------------------

### Get API Keys (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l2

Fetches all API keys associated with the authenticated account. The response includes an array of API key credential objects.

```typescript
async getApiKeys(): Promise<ApiKeysResponse>
```

--------------------------------

### Token Approval

Source: https://docs.polymarket.com/trading/gasless

Example code for approving contracts to spend tokens using the relayer client.

```APIDOC
### Token Approval

Approve contracts to spend tokens:

#### TypeScript Example

```typescript
import { encodeFunctionData, maxUint256 } from "viem";

const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const CTF = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";

const approveTx = {
  to: USDC,
  data: encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "approve",
    args: [CTF, maxUint256],
  }),
  value: "0",
};

const response = await client.execute([approveTx], "Approve USDC.e for CTF");
await response.wait();
```

#### Python Example

```python
from web3 import Web3

USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
CTF = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"
MAX_UINT256 = 2**256 - 1

approve_tx = {
    "to": USDC,
    "data": Web3().eth.contract(
        address=USDC,
        abi=[{
            "name": "approve",
            "type": "function",
            "inputs": [
                {"name": "spender", "type": "address"},
                {"name": "amount", "type": "uint256"}
            ],
            "outputs": [{"type": "bool"}]
        }]
    ).encode_abi(abi_element_identifier="approve", args=[CTF, MAX_UINT256]),
    "value": "0"
}

response = client.execute([approve_tx], "Approve USDC.e for CTF")
response.wait()
```
```

--------------------------------

### Get a Single Order

Source: https://docs.polymarket.com/trading/orders/overview

Retrieve details for a specific order by its ID. Requires L2 authentication.

```APIDOC
## GET /api/orders/{orderID}

### Description
Retrieves the details of a specific order using its unique ID.

### Method
GET

### Endpoint
/api/orders/{orderID}

### Parameters
#### Path Parameters
- **orderID** (string) - Required - The ID of the order to retrieve.

### Response
#### Success Response (200)
- **order** (object) - An object containing the details of the order.

#### Response Example
```json
{
  "order": {
    "id": "0xb816482a...",
    "market": "0xMarketAddress...",
    "price": 0.5,
    "size": 10,
    "side": "BUY",
    "status": "OPEN"
  }
}
```
```

--------------------------------

### Get Related Tags by ID - OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/tags/get-related-tags-relationships-by-tag-id

This OpenAPI 3.0.3 specification defines the GET /tags/{id}/related-tags endpoint. It allows retrieval of related tags based on a given tag ID, with optional query parameters for filtering by empty relationships or status. The response includes a list of related tag objects.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /tags/{id}/related-tags:
    get:
      tags:
        - Tags
      summary: Get related tags (relationships) by tag id
      operationId: getRelatedTagsById
      parameters:
        - $ref: '#/components/parameters/pathId'
        - name: omit_empty
          in: query
          schema:
            type: boolean
        - name: status
          in: query
          schema:
            type: string
            enum:
              - active
              - closed
              - all
      responses:
        '200':
          description: Related tag relationships
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RelatedTag'
components:
  parameters:
    pathId:
      name: id
      in: path
      required: true
      schema:
        type: integer
  schemas:
    RelatedTag:
      type: object
      properties:
        id:
          type: string
        tagID:
          type: integer
          nullable: true
        relatedTagID:
          type: integer
          nullable: true
        rank:
          type: integer
          nullable: true

```

--------------------------------

### Create or Derive API Key (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l1

A convenience method that first attempts to derive an API key using the default nonce. If no key exists for that nonce, it creates a new one. This method is recommended for initial setup as it handles both scenarios.

```typescript
async createOrDeriveApiKey(nonce?: number): Promise<ApiKeyCreds>
```

--------------------------------

### Query Fee Rate API Endpoint

Source: https://docs.polymarket.com/trading/fees

This bash command demonstrates how to query the fee-rate endpoint to check the fee rate for a specific market using its token ID. This is useful for identifying fee-enabled markets.

```bash
GET https://clob.polymarket.com/fee-rate?token_id={token_id}
```

--------------------------------

### Get Builder Trades

Source: https://docs.polymarket.com/api-reference/trade/get-builder-trades

Retrieves originated trades for a specific builder. Note that builders can only access trades they have originated.

```APIDOC
## GET /websites/polymarket/builder/trades

### Description
Retrieves originated trades for a given builder. Builders can only see their own originated trades.

### Method
GET

### Endpoint
/websites/polymarket/builder/trades

### Parameters
#### Query Parameters
- **builderId** (string) - Required - The unique identifier of the builder whose trades are to be retrieved.

### Request Example
(No request body for GET requests)

### Response
#### Success Response (200)
- **trades** (array) - A list of trade objects originated by the specified builder.
  - **tradeId** (string) - The unique identifier of the trade.
  - **creationTime** (string) - The timestamp when the trade was created.
  - **status** (string) - The current status of the trade (e.g., 'completed', 'pending').
  - **amount** (number) - The amount associated with the trade.

#### Response Example
```json
{
  "trades": [
    {
      "tradeId": "trade_123",
      "creationTime": "2023-10-27T10:00:00Z",
      "status": "completed",
      "amount": 100.50
    },
    {
      "tradeId": "trade_456",
      "creationTime": "2023-10-27T11:30:00Z",
      "status": "pending",
      "amount": 50.00
    }
  ]
}
```
```

--------------------------------

### GET /orders

Source: https://docs.polymarket.com/resources/error-codes

Retrieves a list of orders, with options to filter and paginate.

```APIDOC
## GET /orders

### Description
Retrieves a list of orders, with options to filter and paginate.

### Method
GET

### Endpoint
/orders

### Parameters
#### Query Parameters
- **marketId** (string) - Optional - Filter orders by market ID.
- **status** (string) - Optional - Filter orders by status (e.g., 'open', 'filled', 'cancelled').
- **limit** (integer) - Optional - The maximum number of orders to return.
- **offset** (integer) - Optional - The number of orders to skip.

### Response
#### Success Response (200)
- **orders** (array[object]) - A list of order objects.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `invalid order params payload`).
#### Error Response (500)
- **error** (string) - Description of the error (e.g., `Internal server error`).
```

--------------------------------

### GET /orderbook-history

Source: https://docs.polymarket.com/resources/error-codes

Retrieves historical order book data for a market.

```APIDOC
## GET /orderbook-history

### Description
Retrieves historical order book data for a market.

### Method
GET

### Endpoint
/orderbook-history

### Parameters
#### Query Parameters
- **startTs** (integer) - Required - The start timestamp (Unix epoch seconds).
- **market** (string) - Optional - The market condition ID.
- **asset_id** (string) - Optional - The asset ID (token ID). Either `market` or `asset_id` must be provided.
- **limit** (integer) - Optional - The maximum number of data points to return (max 1000).

### Response
#### Success Response (200)
- **orderbook** (array[object]) - An array of historical order book snapshots.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `startTs is required`, `either market or asset_id must be provided`, `limit cannot exceed 1000`).
```

--------------------------------

### Get User Orders

Source: https://docs.polymarket.com/api-reference/trade/get-user-orders

Retrieves open orders for the authenticated user. This endpoint supports pagination and can also be used by builder-authenticated clients to fetch orders attributed to their builder account.

```APIDOC
## GET /websites/polymarket/orders

### Description
Retrieves open orders for the authenticated user. Returns paginated results. Builder-authenticated clients can also use this endpoint to retrieve orders attributed to their builder account.

### Method
GET

### Endpoint
/websites/polymarket/orders

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - The maximum number of orders to return per page.
- **offset** (integer) - Optional - The number of orders to skip before returning results.

### Response
#### Success Response (200)
- **orders** (array) - A list of order objects.
  - **order_id** (string) - The unique identifier for the order.
  - **market_id** (string) - The identifier for the market the order is associated with.
  - **outcome** (string) - The outcome the order is placed on.
  - **type** (string) - The type of order (e.g., 'buy', 'sell').
  - **amount** (string) - The amount of the order.
  - **price** (string) - The price of the order.
  - **created_at** (string) - The timestamp when the order was created.
- **has_more** (boolean) - Indicates if there are more orders available beyond the current page.

#### Response Example
```json
{
  "orders": [
    {
      "order_id": "ord_12345",
      "market_id": "mkt_abcde",
      "outcome": "yes",
      "type": "buy",
      "amount": "10.5",
      "price": "0.75",
      "created_at": "2023-10-27T10:00:00Z"
    }
  ],
  "has_more": true
}
```
```

--------------------------------

### POST /books - Get Order Books

Source: https://docs.polymarket.com/api-reference/market-data/get-order-books-request-body

Retrieves order book summaries for multiple token IDs by sending a request body containing a list of token IDs.

```APIDOC
## POST /books

### Description
Retrieves order book summaries for multiple token IDs using a request body.

### Method
POST

### Endpoint
/books

### Parameters
#### Request Body
- **token_id** (string) - Required - Token ID (asset ID)
- **side** (string) - Optional - Order side (not used for midpoint calculation)

### Request Example
```json
[
  {
    "token_id": "0xabc123def456..."
  },
  {
    "token_id": "0xdef456abc123..."
  }
]
```

### Response
#### Success Response (200)
- **market** (string) - Market condition ID
- **asset_id** (string) - Token ID (asset ID)
- **timestamp** (string) - Timestamp of the order book snapshot
- **hash** (string) - Hash of the order book summary
- **bids** (array) - List of bid orders (sorted by price descending)
- **asks** (array) - List of ask orders (sorted by price ascending)
- **min_order_size** (string) - Minimum order size
- **tick_size** (string) - Minimum price increment (tick size)
- **neg_risk** (boolean) - Whether negative risk is enabled for this market
- **last_trade_price** (string) - Last trade price

#### Response Example
```json
[
  {
    "market": "0x1234567890123456789012345678901234567890",
    "asset_id": "0xabc123def456...",
    "timestamp": "1234567890",
    "hash": "a1b2c3d4e5f6...",
    "bids": [
      {
        "price": "0.45",
        "size": "100"
      }
    ],
    "asks": [
      {
        "price": "0.46",
        "size": "150"
      }
    ],
    "min_order_size": "1",
    "tick_size": "0.01",
    "neg_risk": false,
    "last_trade_price": "0.45"
  }
]
```

#### Error Response (400)
- **error** (string) - Error message

#### Error Response Example
```json
{
  "error": "Invalid payload"
}
```
```

--------------------------------

### Get Open Orders

Source: https://docs.polymarket.com/trading/orders/overview

Retrieve a list of your open orders. This can be filtered by market or asset ID. Requires L2 authentication.

```APIDOC
## GET /api/orders/open

### Description
Retrieves a list of the authenticated user's open orders. Can be filtered by market or asset.

### Method
GET

### Endpoint
/api/orders/open

### Parameters
#### Query Parameters
- **market** (string) - Optional - Filter orders by a specific market address.
- **asset_id** (string) - Optional - Filter orders by a specific asset ID.

### Response
#### Success Response (200)
- **orders** (array) - An array of order objects representing the user's open orders.

#### Response Example
```json
{
  "orders": [
    {
      "id": "0xOrder1...",
      "market": "0xMarketAddress1...",
      "price": 0.5,
      "size": 10,
      "side": "BUY",
      "status": "OPEN"
    },
    {
      "id": "0xOrder2...",
      "market": "0xMarketAddress2...",
      "price": 0.7,
      "size": 5,
      "side": "SELL",
      "status": "OPEN"
    }
  ]
}
```
```

--------------------------------

### GET /comments/user_address/{user_address}

Source: https://docs.polymarket.com/api-reference/comments/get-comments-by-user-address

Retrieves comments associated with a specific user's address. Supports pagination and sorting.

```APIDOC
## GET /comments/user_address/{user_address}

### Description
Retrieves comments made by a specific user address. This endpoint allows filtering and sorting of comments.

### Method
GET

### Endpoint
/comments/user_address/{user_address}

### Parameters
#### Path Parameters
- **user_address** (string) - Required - The wallet address of the user whose comments are to be retrieved.

#### Query Parameters
- **limit** (integer) - Optional - The maximum number of comments to return. Minimum value is 0.
- **offset** (integer) - Optional - The number of comments to skip before starting to collect the result set. Minimum value is 0.
- **order** (string) - Optional - Comma-separated list of fields to order the results by.
- **ascending** (boolean) - Optional - Specifies whether to sort in ascending order. Defaults to false.

### Request Example
```json
{
  "example": "GET /comments/user_address/0x123abc?limit=10&order=createdAt&ascending=true"
}
```

### Response
#### Success Response (200)
- **Comment** (array) - An array of comment objects associated with the user.

#### Response Example
```json
{
  "example": [
    {
      "id": "string",
      "body": "string | null",
      "parentEntityType": "string | null",
      "parentEntityID": "integer | null",
      "parentCommentID": "string | null",
      "userAddress": "string | null",
      "replyAddress": "string | null",
      "createdAt": "string (date-time) | null",
      "updatedAt": "string (date-time) | null",
      "profile": {
        "name": "string | null",
        "pseudonym": "string | null",
        "displayUsernamePublic": "boolean | null",
        "bio": "string | null",
        "isMod": "boolean | null",
        "isCreator": "boolean | null",
        "proxyWallet": "string | null",
        "baseAddress": "string | null",
        "profileImage": "string | null",
        "profileImageOptimized": {
          "id": "string",
          "imageUrlSource": "string | null",
          "imageUrlOptimized": "string | null",
          "imageSizeKbSource": "number"
        },
        "positions": []
      },
      "reactions": [],
      "reportCount": "integer | null",
      "reactionCount": "integer | null"
    }
  ]
}
```
```

--------------------------------

### GET /trades

Source: https://docs.polymarket.com/resources/error-codes

Retrieves a list of trades, with options to filter and paginate.

```APIDOC
## GET /trades

### Description
Retrieves a list of trades, with options to filter and paginate.

### Method
GET

### Endpoint
/trades

### Parameters
#### Query Parameters
- **marketId** (string) - Optional - Filter trades by market ID.
- **limit** (integer) - Optional - The maximum number of trades to return.
- **offset** (integer) - Optional - The number of trades to skip.

### Response
#### Success Response (200)
- **trades** (array[object]) - A list of trade objects.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Invalid trade params payload`).
#### Error Response (500)
- **error** (string) - Description of the error (e.g., `Internal server error`).
```

--------------------------------

### Fetch Event by Slug using cURL

Source: https://docs.polymarket.com/concepts/markets-events

This snippet demonstrates how to fetch a specific event from the Polymarket API using its unique slug. It utilizes the `curl` command-line tool to send a GET request to the Polymarket API endpoint. The slug is passed as a query parameter.

```bash
# Fetch event by slug
curl "https://gamma-api.polymarket.com/events?slug=fed-decision-in-october"
```

--------------------------------

### GET /last-trade-price

Source: https://docs.polymarket.com/resources/error-codes

Retrieves the price of the last trade for a given token.

```APIDOC
## GET /last-trade-price

### Description
Retrieves the price of the last trade for a given token.

### Method
GET

### Endpoint
/last-trade-price

### Parameters
#### Query Parameters
- **token_id** (string) - Required - The ID of the token.

### Response
#### Success Response (200)
- **price** (number) - The price of the last trade.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Invalid token id`).
#### Error Response (500)
- **error** (string) - Description of the error (e.g., `Internal server error`).
```

--------------------------------

### Order Creation Parameters

Source: https://docs.polymarket.com/api-reference/trade/post-a-new-order

This section details the parameters required for creating an order on Polymarket, including order type, expiration, fees, and signature details.

```APIDOC
## POST /orders

### Description
Creates a new order on the Polymarket platform.

### Method
POST

### Endpoint
/orders

### Parameters
#### Request Body
- **orderType** (string) - Required - The type of order, either BUY or SELL.
  - enum: [BUY, SELL]
  - example: BUY
- **expiration** (string) - Required - Unix timestamp when the order expires.
  - example: '1735689600'
- **nonce** (string) - Required - Order nonce.
  - example: '0'
- **feeRateBps** (string) - Optional - Fee rate in basis points.
  - example: '30'
- **signature** (string) - Required - Cryptographic signature of the order.
  - example: 0x1234abcd...
- **salt** (integer) - Required - Random salt for order uniqueness.
  - example: 1234567890
- **signatureType** (integer) - Required - Type of signature (0 = EOA, 1 = POLY_PROXY, 2 = POLY_GNOSIS_SAFE).
  - enum: [0, 1, 2]

### Request Example
```json
{
  "orderType": "BUY",
  "expiration": "1735689600",
  "nonce": "0",
  "feeRateBps": "30",
  "signature": "0x1234abcd...",
  "salt": 1234567890,
  "signatureType": 0
}
```

### Response
#### Success Response (200)
- **orderHash** (string) - The unique hash of the created order.
- **status** (string) - The status of the order creation.

#### Response Example
```json
{
  "orderHash": "0xabcdef123456...",
  "status": "success"
}
```
```

--------------------------------

### GET /market/{conditionId}

Source: https://docs.polymarket.com/resources/error-codes

Retrieves market details using its condition ID.

```APIDOC
## GET /market/{conditionId}

### Description
Retrieves market details using its condition ID.

### Method
GET

### Endpoint
/market/{conditionId}

### Parameters
#### Path Parameters
- **conditionId** (string) - Required - The condition ID of the market.

### Response
#### Success Response (200)
- **market** (object) - Contains the details of the market.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Invalid market`).
#### Error Response (404)
- **error** (string) - Description of the error (e.g., `market not found`).
```

--------------------------------

### Get Sports Metadata Information (OpenAPI)

Source: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information

This OpenAPI specification defines the '/sports' GET endpoint for retrieving sports metadata. It returns a list of sports objects, each containing details like sport identifier, image URL, resolution source URL, ordering preference, tags, and series identifier. The response is in JSON format.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /sports:
    get:
      tags:
        - Sports
      summary: Get sports metadata information
      operationId: getSportsMetadata
      responses:
        '200':
          description: >-
            List of sports metadata objects containing sport configuration
            details, visual assets, and related identifiers
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/SportsMetadata'
components:
  schemas:
    SportsMetadata:
      type: object
      properties:
        sport:
          type: string
          description: The sport identifier or abbreviation
        image:
          type: string
          format: uri
          description: URL to the sport's logo or image asset
        resolution:
          type: string
          format: uri
          description: >-
            URL to the official resolution source for the sport (e.g., league
            website)
        ordering:
          type: string
          description: Preferred ordering for sport display, typically "home" or "away"
        tags:
          type: string
          description: >-
            Comma-separated list of tag IDs associated with the sport for
            categorization and filtering
        series:
          type: string
          description: >-
            Series identifier linking the sport to a specific tournament or
            season series

```

--------------------------------

### Documentation Index

Source: https://docs.polymarket.com/api-reference/market-data/get-order-book

Fetch the complete documentation index to discover all available API pages.

```APIDOC
## GET /websites/polymarket/documentation-index

### Description
Fetches the complete documentation index, which can be used to discover all available API pages.

### Method
GET

### Endpoint
/websites/polymarket/documentation-index

### Parameters
None

### Request Example
```
GET /websites/polymarket/documentation-index
```

### Response
#### Success Response (200)
- **documentationUrl** (string) - The URL to the documentation index file (e.g., https://docs.polymarket.com/llms.txt).
```

--------------------------------

### GET /order/{orderId}

Source: https://docs.polymarket.com/resources/error-codes

Retrieves details of a specific order by its ID.

```APIDOC
## GET /order/{orderId}

### Description
Retrieves details of a specific order by its ID.

### Method
GET

### Endpoint
/order/{orderId}

### Parameters
#### Path Parameters
- **orderId** (string) - Required - The unique identifier of the order.

### Response
#### Success Response (200)
- **order** (object) - Contains the details of the order.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Invalid orderID`).
#### Error Response (500)
- **error** (string) - Description of the error (e.g., `Internal server error`).
```

--------------------------------

### GET /fee-rate

Source: https://docs.polymarket.com/trading/fees

Fetches the fee rate for a given token ID. This is a required step before creating an order to ensure the correct fee rate is included in the signed payload.

```APIDOC
## GET /fee-rate

### Description
Fetches the fee rate for a specific token ID. This fee rate must be included in the order payload before signing.

### Method
GET

### Endpoint
`https://clob.polymarket.com/fee-rate?token_id={token_id}`

### Parameters
#### Query Parameters
- **token_id** (string) - Required - The unique identifier for the token.

### Response
#### Success Response (200)
- **feeRateBps** (string) - The fee rate in basis points. Returns '0' for fee-free markets.
```

--------------------------------

### Initialize Trading Client (TypeScript)

Source: https://docs.polymarket.com/trading/overview

Initializes the ClobClient for trading on Polymarket. This requires the API credentials, signature type, and funder address. The signature type indicates the wallet's origin (e.g., EOA, POLY_PROXY, GNOSIS_SAFE).

```typescript
const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds,
  2, // GNOSIS_SAFE
  "0x...", // Your proxy wallet address
);
```

--------------------------------

### Get Order Book

Source: https://docs.polymarket.com/api-reference/market-data/get-order-book

Retrieves the order book summary for a specific token ID, including bids, asks, market details, and the last trade price.

```APIDOC
## GET /websites/polymarket/orderbook

### Description
Retrieves the order book summary for a specific token ID. Includes bids, asks, market details, and last trade price.

### Method
GET

### Endpoint
/websites/polymarket/orderbook

### Parameters
#### Query Parameters
- **tokenId** (string) - Required - The unique identifier for the token.

### Request Example
```
GET /websites/polymarket/orderbook?tokenId=exampleTokenId
```

### Response
#### Success Response (200)
- **bids** (array) - An array of bid orders.
- **asks** (array) - An array of ask orders.
- **marketDetails** (object) - Details about the market.
- **lastTradePrice** (number) - The price of the last trade.
```

--------------------------------

### Create and Post Market Orders in One Step (TypeScript/Python)

Source: https://docs.polymarket.com/trading/orders/create

Provides a convenience function `createAndPostMarketOrder` that combines order creation, signing, and submission into a single call for Market orders. Supports FOK and FAK order types.

```typescript
const response = await client.createAndPostMarketOrder(
  {
    tokenID: "TOKEN_ID",
    side: Side.BUY,
    amount: 100,
    price: 0.5,
  },
  { tickSize: "0.01", negRisk: false },
  OrderType.FOK,
);
```

```python
response = client.create_and_post_market_order(
    token_id="TOKEN_ID",
    side=BUY,
    amount=100,
    price=0.50,
    options={"tick_size": "0.01", "neg_risk": False},
    order_type=OrderType.FOK,
)
```

--------------------------------

### Get Daily Builder Volume Time-Series OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/builders/get-daily-builder-volume-time-series

This OpenAPI 3.0.3 specification defines the '/v1/builders/volume' GET endpoint for the Polymarket Data API. It allows fetching daily trading volume data for builders, with options to filter by time period (DAY, WEEK, MONTH, ALL). The response includes builder details, volume, active users, and rank.

```yaml
openapi: 3.0.3
info:
  title: Polymarket Data API
  version: 1.0.0
  description: >
    HTTP API for Polymarket data. This specification documents all public
    routes.
servers:
  - url: https://data-api.polymarket.com
    description: Relative server (same host)
security: []
tags:
  - name: Data API Status
    description: Data API health check
  - name: Core
  - name: Builders
  - name: Misc
paths:
  /v1/builders/volume:
    get:
      tags:
        - Builders
      summary: Get daily builder volume time-series
      parameters:
        - in: query
          name: timePeriod
          schema:
            type: string
            enum:
              - DAY
              - WEEK
              - MONTH
              - ALL
            default: DAY
          description: |
            The time period to fetch daily records for.
      responses:
        '200':
          description: Success - Returns array of daily volume records
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BuilderVolumeEntry'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    BuilderVolumeEntry:
      type: object
      properties:
        dt:
          type: string
          format: date-time
          description: The timestamp for this volume entry in ISO 8601 format
          example: '2025-11-15T00:00:00Z'
        builder:
          type: string
          description: The builder name or identifier
        builderLogo:
          type: string
          description: URL to the builder's logo image
        verified:
          type: boolean
          description: Whether the builder is verified
        volume:
          type: number
          description: Trading volume for this builder on this date
        activeUsers:
          type: integer
          description: Number of active users for this builder on this date
        rank:
          type: string
          description: The rank position of the builder on this date
    ErrorResponse:
      type: object
      properties:
        error:
          type: string
      required:
        - error

```

--------------------------------

### Create and Post Order (Python)

Source: https://docs.polymarket.com/trading/orders/create

Creates, signs, and submits a limit order in a single call using the Polymarket SDK.

```APIDOC
## POST /api/orders

### Description
Creates, signs, and submits a limit order in a single call using the Polymarket SDK.

### Method
POST

### Endpoint
/api/orders

### Parameters
#### Request Body
- **token_id** (string) - Required - The ID of the token for the order.
- **price** (float) - Required - The price of the order.
- **size** (int) - Required - The size of the order.
- **side** (string) - Required - The side of the order (BUY or SELL).
- **order_type** (string) - Required - The type of order (GTC, GTD, FOK, FAK).

#### Request Body Options
- **tick_size** (string) - Optional - The tick size for the order.
- **neg_risk** (bool) - Optional - Whether the order is negatively risked.

### Request Example
```python
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

# Assuming 'client' is an initialized CLOB client instance
response = client.create_and_post_order(
    OrderArgs(
        token_id="TOKEN_ID",
        price=0.50,
        size=10,
        side=BUY,
    ),
    options={
        "tick_size": "0.01",
        "neg_risk": False,
    },
    order_type=OrderType.GTC
)

print("Order ID:", response["orderID"])
print("Status:", response["status"])
```

### Response
#### Success Response (200)
- **orderID** (string) - The ID of the created order.
- **status** (string) - The status of the order.

#### Response Example
```json
{
  "orderID": "some_order_id",
  "status": "success"
}
```
```

--------------------------------

### Store Private Key Securely (Bash)

Source: https://docs.polymarket.com/api-reference/authentication

Illustrates the recommended practice of storing private keys in environment variables using a .env file, which should not be committed to version control. This prevents accidental exposure of sensitive credentials.

```bash
# .env (never commit this file)
PRIVATE_KEY=0x...

```

--------------------------------

### Get Balance and Allowance (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l2

Retrieves the current balance and allowance for specified assets. Requires parameters defining the asset type and optionally a token ID. Returns the balance and allowance as strings.

```typescript
async getBalanceAllowance(
  params?: BalanceAllowanceParams
): Promise<BalanceAllowanceResponse>
```

--------------------------------

### GET /tick-size

Source: https://docs.polymarket.com/resources/error-codes

Retrieves the tick size for a market associated with a token ID.

```APIDOC
## GET /tick-size

### Description
Retrieves the tick size for a market associated with a token ID.

### Method
GET

### Endpoint
/tick-size

### Parameters
#### Query Parameters
- **token_id** (string) - Required - The ID of the token.

### Response
#### Success Response (200)
- **tickSize** (number) - The tick size of the market.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Invalid token id`).
#### Error Response (404)
- **error** (string) - Description of the error (e.g., `market not found`).
```

--------------------------------

### GET /prices-history

Source: https://docs.polymarket.com/trading/orderbook

Fetch historical price data for a token over various time intervals or a specific timestamp range.

```APIDOC
## GET /prices-history

### Description
Fetch historical price data for a token over various time intervals or a specific timestamp range.

### Method
GET

### Endpoint
`/prices-history`

### Query Parameters
- **market** (string) - Required - The token ID for which to fetch price history.
- **interval** (string) - Optional - The time interval for the price history. Accepts `1h`, `6h`, `1d`, `1w`, `1m`, `max`.
- **fidelity** (integer) - Optional - The data points frequency in minutes when using `interval`.
- **startTs** (integer) - Optional - The start timestamp for the price history range.
- **endTs** (integer) - Optional - The end timestamp for the price history range.

*Note: `interval` and `startTs`/`endTs` are mutually exclusive. Do not use them together.*

### Response
#### Success Response (200)
- **t** (integer) - Timestamp of the data point.
- **p** (string) - Price at the given timestamp.

#### Response Example
```json
[
  { "t": 1678886400, "p": "0.50" },
  { "t": 1678890000, "p": "0.51" }
]
```
```

--------------------------------

### Initialize Trading Client (Python)

Source: https://docs.polymarket.com/trading/overview

Initializes the ClobClient for trading on Polymarket. This requires the API credentials, signature type, and funder address. The signature type indicates the wallet's origin (e.g., EOA, POLY_PROXY, GNOSIS_SAFE).

```python
client = ClobClient(
    "https://clob.polymarket.com",
    key=private_key,
    chain_id=137,
    creds=api_creds,
    signature_type=2,  # GNOSIS_SAFE
    funder="0x..."  # Your proxy wallet address
)
```

--------------------------------

### Get Event Tags OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/events/get-event-tags

This OpenAPI 3.0.3 specification defines the GET /events/{id}/tags endpoint for the Polymarket Markets API. It allows retrieval of tags associated with a specific event, returning a JSON array of Tag objects or a 404 if the event is not found. The specification includes details on parameters, responses, and schemas for the Tag object.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /events/{id}/tags:
    get:
      tags:
        - Events
        - Tags
      summary: Get event tags
      operationId: getEventTags
      parameters:
        - $ref: '#/components/parameters/pathId'
      responses:
        '200':
          description: Tags attached to the event
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Tag'
        '404':
          description: Not found
components:
  parameters:
    pathId:
      name: id
      in: path
      required: true
      schema:
        type: integer
  schemas:
    Tag:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        forceShow:
          type: boolean
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: integer
          nullable: true
        updatedBy:
          type: integer
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        forceHide:
          type: boolean
          nullable: true
        isCarousel:
          type: boolean
          nullable: true

```

--------------------------------

### GET /teams

Source: https://docs.polymarket.com/api-reference/sports/list-teams

Retrieves a list of teams. This endpoint supports filtering by league, name, and abbreviation, as well as pagination and sorting.

```APIDOC
## GET /teams

### Description
Retrieves a list of teams. This endpoint supports filtering by league, name, and abbreviation, as well as pagination and sorting.

### Method
GET

### Endpoint
https://gamma-api.polymarket.com/teams

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of teams to return.
- **offset** (integer) - Optional - Number of teams to skip before starting to collect the result set.
- **order** (string) - Optional - Comma-separated list of fields to order by.
- **ascending** (boolean) - Optional - Whether to sort in ascending order.
- **league** (array[string]) - Optional - Filter teams by league.
- **name** (array[string]) - Optional - Filter teams by name.
- **abbreviation** (array[string]) - Optional - Filter teams by abbreviation.

### Response
#### Success Response (200)
- **Team** (object) - An array of team objects.
  - **id** (integer) - The unique identifier for the team.
  - **name** (string) - The name of the team.
  - **league** (string) - The league the team belongs to.
  - **record** (string) - The team's record (e.g., wins-losses).
  - **logo** (string) - URL to the team's logo.
  - **abbreviation** (string) - The team's abbreviation.
  - **alias** (string) - An alias for the team.
  - **createdAt** (string) - The timestamp when the team was created.
  - **updatedAt** (string) - The timestamp when the team was last updated.

#### Response Example
```json
[
  {
    "id": 1,
    "name": "Golden State Warriors",
    "league": "NBA",
    "record": "53-29",
    "logo": "https://example.com/logos/gsw.png",
    "abbreviation": "GSW",
    "alias": "Warriors",
    "createdAt": "2023-01-01T12:00:00Z",
    "updatedAt": "2023-01-01T12:00:00Z"
  }
]
```
```

--------------------------------

### Create and Post Market Order (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l2

Convenience method to create, sign, and post a market order in a single call. Use this when you want to buy or sell at the current market price. It takes user market order details and optional parameters for order type and creation options. Returns an OrderResponse indicating success or failure.

```typescript
async createAndPostMarketOrder(
  userMarketOrder: UserMarketOrder,
  options?: Partial<CreateOrderOptions>,
  orderType?: OrderType.FOK | OrderType.FAK, // Defaults to FOK
): Promise<OrderResponse>
```

--------------------------------

### Get Full Orderbook Data (TypeScript, Python, REST)

Source: https://docs.polymarket.com/trading/orderbook

Fetches the complete orderbook for a specified token, including all bid and ask levels. This allows detailed analysis of market liquidity. The response includes bids, asks, and tick size.

```typescript
const book = await client.getOrderBook("TOKEN_ID");

console.log("Best bid:", book.bids[0]);
console.log("Best ask:", book.asks[0]);
console.log("Tick size:", book.tick_size);
```

```python
book = client.get_order_book("TOKEN_ID")

print("Best bid:", book["bids"][0])
print("Best ask:", book["asks"][0])
print("Tick size:", book["tick_size"])
```

```bash
curl "https://clob.polymarket.com/book?token_id=TOKEN_ID"
```

--------------------------------

### Create and Post Limit Order (Python)

Source: https://docs.polymarket.com/trading/orders/create

Creates, signs, and submits a Good-Til-Cancelled (GTC) limit order using the py_clob_client. Requires token ID, price, size, side, tick size, and negative risk preference. Returns the order ID and status.

```python
from py_clob_client.clob_types import OrderArgs, OrderType
from py_clob_client.order_builder.constants import BUY

response = client.create_and_post_order(
    OrderArgs(
        token_id="TOKEN_ID",
        price=0.50,
        size=10,
        side=BUY,
    ),
    options={
        "tick_size": "0.01",
        "neg_risk": False,
    },
    order_type=OrderType.GTC
)

print("Order ID:", response["orderID"])
print("Status:", response["status"])
```

--------------------------------

### GET /tags

Source: https://docs.polymarket.com/api-reference/tags/list-tags

Retrieves a list of tags. This endpoint allows for filtering and sorting of tags based on various criteria.

```APIDOC
## GET /tags

### Description
Retrieves a list of tags. This endpoint allows for filtering and sorting of tags based on various criteria.

### Method
GET

### Endpoint
https://gamma-api.polymarket.com/tags

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of tags to return.
- **offset** (integer) - Optional - Number of tags to skip before returning results.
- **order** (string) - Optional - Comma-separated list of fields to order by.
- **ascending** (boolean) - Optional - Whether to sort in ascending order.
- **include_template** (boolean) - Optional - Whether to include template information.
- **is_carousel** (boolean) - Optional - Filter tags that are marked as carousel.

### Request Example
```json
{
  "example": "GET /tags?limit=10&order=createdAt&ascending=false"
}
```

### Response
#### Success Response (200)
- **Array of Tag objects** - Contains a list of tag objects.

#### Response Example
```json
{
  "example": [
    {
      "id": "tag123",
      "label": "Technology",
      "slug": "technology",
      "forceShow": false,
      "publishedAt": "2023-01-01T12:00:00Z",
      "createdBy": 1,
      "updatedBy": 1,
      "createdAt": "2023-01-01T12:00:00Z",
      "updatedAt": "2023-01-01T12:00:00Z",
      "forceHide": false,
      "isCarousel": true
    }
  ]
}
```
```

--------------------------------

### GET /public-search

Source: https://docs.polymarket.com/api-reference/search/search-markets-events-and-profiles

Searches for markets, events, and profiles based on the provided query parameters. This endpoint allows for flexible searching with various filtering and sorting options.

```APIDOC
## GET /public-search

### Description
Searches markets, events, and profiles across the Polymarket platform. This endpoint supports various query parameters for filtering, sorting, and pagination.

### Method
GET

### Endpoint
/public-search

### Parameters
#### Query Parameters
- **q** (string) - Required - The search query string.
- **cache** (boolean) - Optional - Whether to use cached results.
- **events_status** (string) - Optional - Filter events by status (e.g., 'open', 'resolved').
- **limit_per_type** (integer) - Optional - The maximum number of results per entity type.
- **page** (integer) - Optional - The page number for pagination.
- **events_tag** (array of strings) - Optional - Filter events by tags.
- **keep_closed_markets** (integer) - Optional - Whether to include closed markets (1 for true, 0 for false).
- **sort** (string) - Optional - The field to sort results by.
- **ascending** (boolean) - Optional - Whether to sort in ascending order.
- **search_tags** (boolean) - Optional - Whether to search within tags.
- **search_profiles** (boolean) - Optional - Whether to search within profiles.
- **recurrence** (string) - Optional - Filter by recurrence type.
- **exclude_tag_id** (array of integers) - Optional - Exclude results associated with specific tag IDs.
- **optimized** (boolean) - Optional - Whether to use an optimized search.

### Response
#### Success Response (200)
- **events** (array of Event objects) - A list of matching events.
- **tags** (array of SearchTag objects) - A list of matching tags.
- **profiles** (array of Profile objects) - A list of matching profiles.
- **pagination** (Pagination object) - Information about the pagination of the results.

#### Response Example
```json
{
  "events": [
    {
      "id": "event_id_1",
      "ticker": "ETH/USD",
      "slug": "ethereum-price-prediction",
      "title": "Will ETH price be above $3000 by July 1st?",
      "subtitle": "A short subtitle for the event.",
      "description": "Detailed description of the event.",
      "resolutionSource": "oracle.com",
      "startDate": "2024-06-15T10:00:00Z",
      "creationDate": "2024-05-01T12:00:00Z",
      "endDate": "2024-07-01T17:00:00Z",
      "image": "https://example.com/image.jpg",
      "icon": "https://example.com/icon.png",
      "active": true,
      "closed": false,
      "archived": false,
      "new": false,
      "featured": true,
      "restricted": false,
      "liquidity": 1500.75,
      "volume": 5000.50,
      "openInterest": 2000.25,
      "sortBy": "creationDate",
      "category": "Crypto",
      "subcategory": "Price Prediction"
    }
  ],
  "tags": [
    {
      "id": "tag_id_1",
      "name": "crypto"
    }
  ],
  "profiles": [
    {
      "id": "profile_id_1",
      "username": "user123"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "pageSize": 20
  }
}
```
```

--------------------------------

### Get Top Holders for Markets (OpenAPI)

Source: https://docs.polymarket.com/api-reference/core/get-top-holders-for-markets

This OpenAPI specification defines the '/holders' GET endpoint for the Polymarket Data API. It allows clients to retrieve a list of top holders for specified markets, with options to control the number of results and minimum balance. The endpoint requires market IDs and returns holder information or error responses.

```yaml
openapi: 3.0.3
info:
  title: Polymarket Data API
  version: 1.0.0
  description: >
    HTTP API for Polymarket data. This specification documents all public
    routes.
servers:
  - url: https://data-api.polymarket.com
    description: Relative server (same host)
security: []
tags:
  - name: Data API Status
    description: Data API health check
  - name: Core
  - name: Builders
  - name: Misc
paths:
  /holders:
    get:
      tags:
        - Core
      summary: Get top holders for markets
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
            minimum: 0
            maximum: 20
          description: Maximum number of holders to return per token. Capped at 20.
        - in: query
          name: market
          required: true
          style: form
          explode: false
          schema:
            type: array
            items:
              $ref: '#/components/schemas/Hash64'
          description: Comma-separated list of condition IDs.
        - in: query
          name: minBalance
          schema:
            type: integer
            default: 1
            minimum: 0
            maximum: 999999
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MetaHolder'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    Hash64:
      type: string
      description: 0x-prefixed 64-hex string
      pattern: '^0x[a-fA-F0-9]{64}$'
      example: '0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917'
    MetaHolder:
      type: object
      properties:
        token:
          type: string
        holders:
          type: array
          items:
            $ref: '#/components/schemas/Holder'
    ErrorResponse:
      type: object
      properties:
        error:
          type: string
      required:
        - error
    Holder:
      type: object
      properties:
        proxyWallet:
          $ref: '#/components/schemas/Address'
        bio:
          type: string
        asset:
          type: string
        pseudonym:
          type: string
        amount:
          type: number
        displayUsernamePublic:
          type: boolean
        outcomeIndex:
          type: integer
        name:
          type: string
        profileImage:
          type: string
        profileImageOptimized:
          type: string
    Address:
      type: string
      description: User Profile Address (0x-prefixed, 40 hex chars)
      pattern: '^0x[a-fA-F0-9]{40}$'
      example: '0x56687bf447db6ffa42ffe2204a05edaa20f55839'

```

--------------------------------

### Create and Post Limit Order (TypeScript)

Source: https://docs.polymarket.com/trading/orders/create

Creates, signs, and submits a Good-Til-Cancelled (GTC) limit order using the ClobClient. Requires token ID, price, size, side, tick size, and negative risk preference. Returns the order ID and status.

```typescript
import { ClobClient, Side, OrderType } from "@polymarket/clob-client";

const response = await client.createAndPostOrder(
  {
    tokenID: "TOKEN_ID",
    price: 0.5,
    size: 10,
    side: Side.BUY,
  },
  {
    tickSize: "0.01",
    negRisk: false,
  },
  OrderType.GTC,
);

console.log("Order ID:", response.orderID);
console.log("Status:", response.status);
```

--------------------------------

### Get Order Scoring Status - OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/trade/get-order-scoring-status

This OpenAPI specification defines the `GET /order-scoring` endpoint for the Polymarket CLOB API. It allows checking if a given order is currently scoring for rewards based on market eligibility, size requirements, spread range, and duration. The endpoint requires an `order_id` and returns a boolean indicating the scoring status, along with potential error responses for invalid input or server issues.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /order-scoring:
    get:
      tags:
        - Trade
      summary: Get order scoring status
      description: >
        Checks if a specific order is currently scoring for rewards.


        An order is considered "scoring" if it meets all the criteria for
        earning maker rewards:

        - The order is live on a rewards-eligible market

        - The order meets the minimum size requirements

        - The order is within the valid spread range

        - The order has been live for the required duration
      operationId: getOrderScoring
      parameters:
        - name: order_id
          in: query
          description: The order ID (order hash) to check scoring status for
          required: true
          schema:
            type: string
          example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      responses:
        '200':
          description: Successfully retrieved order scoring status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OrderScoringResponse'
              examples:
                scoring:
                  summary: Order is scoring
                  value:
                    scoring: true
                not_scoring:
                  summary: Order is not scoring
                  value:
                    scoring: false
        '400':
          description: Bad request - Invalid order ID
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid order_id
        '401':
          description: Unauthorized - Invalid API key or order doesn't belong to user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid API key
        '404':
          description: Market not found for the order
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: market not found
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Internal server error
        '503':
          description: Service unavailable - Trading disabled
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: >-
                  Trading is currently disabled. Check polymarket.com for
                  updates
      security:
        - polyApiKey: []
          polyAddress: []
          polySignature: []
          polyPassphrase: []
          polyTimestamp: []
components:
  schemas:
    OrderScoringResponse:
      type: object
      description: Response indicating whether an order is currently scoring for rewards
      required:
        - scoring
      properties:
        scoring:
          type: boolean
          description: Whether the order is currently scoring for maker rewards
          example: true
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message
  securitySchemes:
    polyApiKey:
      type: apiKey
      in: header
      name: POLY_API_KEY
      description: Your API key
    polyAddress:
      type: apiKey
      in: header
      name: POLY_ADDRESS
      description: Ethereum address associated with the API key
    polySignature:
      type: apiKey
      in: header
      name: POLY_SIGNATURE
      description: HMAC signature of the request
    polyPassphrase:
      type: apiKey
      in: header
      name: POLY_PASSPHRASE
      description: API key passphrase
    polyTimestamp:
      type: apiKey
      in: header
      name: POLY_TIMESTAMP
      description: Unix timestamp of the request

```

--------------------------------

### GET /events/slug/{slug}

Source: https://docs.polymarket.com/api-reference/events/get-event-by-slug

Retrieves detailed information about a specific event using its slug. Supports optional query parameters to include chat and template data.

```APIDOC
## GET /events/slug/{slug}

### Description
Retrieves detailed information about a specific event using its slug. Supports optional query parameters to include chat and template data.

### Method
GET

### Endpoint
/events/slug/{slug}

### Parameters
#### Path Parameters
- **slug** (string) - Required - The unique slug identifier for the event.

#### Query Parameters
- **include_chat** (boolean) - Optional - Whether to include chat data in the response.
- **include_template** (boolean) - Optional - Whether to include template data in the response.

### Request Example
```json
{
  "example": "GET /events/slug/example-event-slug?include_chat=true&include_template=false"
}
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the event.
- **ticker** (string) - The ticker symbol for the event (nullable).
- **slug** (string) - The slug identifier for the event (nullable).
- **title** (string) - The title of the event (nullable).
- **subtitle** (string) - The subtitle of the event (nullable).
- **description** (string) - The description of the event (nullable).
- **resolutionSource** (string) - The source for event resolution (nullable).
- **startDate** (string) - The start date and time of the event (nullable).
- **creationDate** (string) - The creation date and time of the event (nullable).
- **endDate** (string) - The end date and time of the event (nullable).
- **image** (string) - URL for the event's image (nullable).
- **icon** (string) - URL for the event's icon (nullable).
- **active** (boolean) - Indicates if the event is active (nullable).
- **closed** (boolean) - Indicates if the event is closed (nullable).
- **archived** (boolean) - Indicates if the event is archived (nullable).
- **new** (boolean) - Indicates if the event is new (nullable).
- **featured** (boolean) - Indicates if the event is featured (nullable).
- **restricted** (boolean) - Indicates if the event is restricted (nullable).
- **liquidity** (number) - The liquidity of the event (nullable).
- **volume** (number) - The trading volume of the event (nullable).
- **openInterest** (number) - The open interest for the event (nullable).
- **sortBy** (string) - The sorting criteria for the event (nullable).
- **category** (string) - The category of the event (nullable).
- **subcategory** (string) - The subcategory of the event (nullable).
- **isTemplate** (boolean) - Indicates if the event is a template (nullable).
- **templateVariables** (string) - Template variables for the event (nullable).
- **published_at** (string) - The publication timestamp of the event (nullable).
- **createdBy** (string) - The user ID who created the event (nullable).
- **updatedBy** (string) - The user ID who last updated the event (nullable).
- **createdAt** (string) - The creation timestamp of the record (nullable).
- **updatedAt** (string) - The last update timestamp of the record (nullable).
- **commentsEnabled** (boolean) - Indicates if comments are enabled for the event (nullable).
- **competitive** (number) - Competitive score for the event (nullable).
- **volume24hr** (number) - Trading volume in the last 24 hours (nullable).
- **volume1wk** (number) - Trading volume in the last week (nullable).
- **volume1mo** (number) - Trading volume in the last month (nullable).
- **volume1yr** (number) - Trading volume in the last year (nullable).
- **featuredImage** (string) - URL for the featured image of the event (nullable).
- **disqusThread** (string) - Disqus thread ID for comments (nullable).
- **parentEvent** (string) - The slug of the parent event, if applicable (nullable).
- **enableOrderBook** (boolean) - Indicates if the order book is enabled (nullable).
- **liquidityAmm** (number) - Liquidity provided by AMM (nullable).
- **liquidityClob** (number) - Liquidity provided by CLOB (nullable).
- **negRisk** (boolean) - Indicates if the event has negative risk (nullable).
- **negRiskMarketID** (string) - The market ID associated with negative risk (nullable).

#### Response Example
```json
{
  "id": "evt_12345",
  "ticker": "SPX",
  "slug": "example-event-slug",
  "title": "Example Event",
  "subtitle": "A sample event for demonstration",
  "description": "This is a detailed description of the example event.",
  "resolutionSource": "polymarket.com",
  "startDate": "2023-10-27T10:00:00Z",
  "creationDate": "2023-10-26T09:00:00Z",
  "endDate": "2023-11-30T17:00:00Z",
  "image": "https://example.com/images/event.png",
  "icon": "https://example.com/icons/event.svg",
  "active": true,
  "closed": false,
  "archived": false,
  "new": false,
  "featured": true,
  "restricted": false,
  "liquidity": 15000.50,
  "volume": 25000.75,
  "openInterest": 10000,
  "sortBy": "end_date",
  "category": "Finance",
  "subcategory": "Stocks",
  "isTemplate": false,
  "templateVariables": null,
  "published_at": "2023-10-26T09:30:00Z",
  "createdBy": "user_abc",
  "updatedBy": "user_xyz",
  "createdAt": "2023-10-26T09:00:00Z",
  "updatedAt": "2023-10-26T11:00:00Z",
  "commentsEnabled": true,
  "competitive": 0.8,
  "volume24hr": 5000.25,
  "volume1wk": 15000.75,
  "volume1mo": 20000.00,
  "volume1yr": 22000.50,
  "featuredImage": "https://example.com/images/featured_event.jpg",
  "disqusThread": "thread_123",
  "parentEvent": null,
  "enableOrderBook": true,
  "liquidityAmm": 10000.00,
  "liquidityClob": 5000.50,
  "negRisk": false,
  "negRiskMarketID": null
}
```

#### Error Response (404)
- **description**: Not found
```

--------------------------------

### Get Midpoint Prices via OpenAPI

Source: https://docs.polymarket.com/api-reference/market-data/get-midpoint-prices-query-parameters

This OpenAPI specification defines the 'get /midpoints' endpoint for retrieving midpoint prices for multiple token IDs. The midpoint is calculated as the average of the best bid and ask prices. It accepts a comma-separated list of token IDs as a query parameter and returns a JSON object mapping token IDs to their midpoint prices.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /midpoints:
    get:
      tags:
        - Market Data
      summary: Get midpoint prices (query parameters)
      description: >
        Retrieves midpoint prices for multiple token IDs using query parameters.

        The midpoint is calculated as the average of the best bid and ask
        prices.
      operationId: getMidpointsGet
      parameters:
        - name: token_ids
          in: query
          description: Comma-separated list of token IDs
          required: true
          schema:
            type: string
          example: 0xabc123...,0xdef456...
      responses:
        '200':
          description: Successfully retrieved midpoint prices
          content:
            application/json:
              schema:
                type: object
                additionalProperties:
                  type: string
                description: Map of token ID to midpoint price
              example:
                0xabc123def456...: '0.45'
                0xdef456abc123...: '0.52'
        '400':
          description: Bad request - Invalid payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid payload
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: error getting the mid price
      security: []
components:
  schemas:
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message

```

--------------------------------

### Get Tag by ID

Source: https://docs.polymarket.com/api-reference/tags/get-tag-by-id

Retrieves a specific tag by its unique identifier. Supports optional query parameters to customize the response.

```APIDOC
## GET /tags/{id}

### Description
Retrieves a specific tag by its unique identifier. Supports optional query parameters to customize the response.

### Method
GET

### Endpoint
/tags/{id}

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the tag.

#### Query Parameters
- **include_template** (boolean) - Optional - Whether to include template information in the response.

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the tag.
- **label** (string) - The display label for the tag (nullable).
- **slug** (string) - The URL-friendly slug for the tag (nullable).
- **forceShow** (boolean) - Flag to force display of the tag (nullable).
- **publishedAt** (string) - The timestamp when the tag was published (nullable).
- **createdBy** (integer) - The ID of the user who created the tag (nullable).
- **updatedBy** (integer) - The ID of the user who last updated the tag (nullable).
- **createdAt** (string) - The timestamp when the tag was created (nullable).
- **updatedAt** (string) - The timestamp when the tag was last updated (nullable).
- **forceHide** (boolean) - Flag to force hide the tag (nullable).
- **isCarousel** (boolean) - Flag indicating if the tag is a carousel (nullable).

#### Response Example
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "label": "Technology",
  "slug": "technology",
  "forceShow": false,
  "publishedAt": "2023-10-27T10:00:00Z",
  "createdBy": 1,
  "updatedBy": 1,
  "createdAt": "2023-10-27T09:00:00Z",
  "updatedAt": "2023-10-27T09:30:00Z",
  "forceHide": false,
  "isCarousel": true
}
```
```

--------------------------------

### GET /tick-size

Source: https://docs.polymarket.com/api-reference/market-data/get-tick-size

Retrieves the minimum tick size (price increment) for a specific token ID. The tick size can be provided either as a query parameter.

```APIDOC
## GET /tick-size

### Description
Retrieves the minimum tick size (price increment) for a specific token ID.

### Method
GET

### Endpoint
/tick-size

### Parameters
#### Query Parameters
- **token_id** (string) - Optional - Token ID (asset ID)

### Request Example
```json
{
  "token_id": "0xabc123def456..."
}
```

### Response
#### Success Response (200)
- **minimum_tick_size** (number) - Minimum tick size (price increment)

#### Response Example
```json
{
  "minimum_tick_size": 0.01
}
```

#### Error Response (400)
- **error** (string) - Error message

#### Error Response Example (400)
```json
{
  "error": "Invalid token id"
}
```

#### Error Response (404)
- **error** (string) - Error message

#### Error Response Example (404)
```json
{
  "error": "market not found"
}
```
```

--------------------------------

### GET /openOrders

Source: https://docs.polymarket.com/trading/clients/builder

Retrieves all open orders attributed to the builder. When called from a builder-configured client, it returns orders placed through the builder rather than orders owned by the authenticated user.

```APIDOC
## GET /openOrders

### Description
Retrieves all open orders attributed to the builder. When called from a builder-configured client, returns orders placed through the builder rather than orders owned by the authenticated user.

### Method
GET

### Endpoint
/websites/polymarket/openOrders

### Parameters
#### Query Parameters
- **id** (string) - Optional - Filter by order ID.
- **market** (string) - Optional - Filter by market condition ID.
- **asset_id** (string) - Optional - Filter by token ID.

### Request Example
```typescript
// All open orders for this builder
const orders = await clobClient.getOpenOrders();

// Filtered by market
const marketOrders = await clobClient.getOpenOrders({
  market: "0xbd31dc8a...",
});
```

### Response
#### Success Response (200)
- **OpenOrder[]** - An array of open order objects.

#### Response Example
```json
[
  {
    "id": "string",
    "market": "string",
    "assetId": "string",
    "orderType": "string",
    "side": "string",
    "size": "string",
    "price": "string",
    "status": "string",
    "outcome": "string",
    "outcomeIndex": 0,
    "owner": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```
```

--------------------------------

### Initialize Polymarket API Credentials in TypeScript

Source: https://docs.polymarket.com/builders/api-keys

Load Polymarket Builder API keys from environment variables into a TypeScript object. This snippet demonstrates how to use the `@polymarket/builder-signing-sdk` to create a `BuilderApiKeyCreds` object, ensuring your application can authenticate with the Polymarket relayer.

```typescript
import { BuilderApiKeyCreds } from "@polymarket/builder-signing-sdk";

const builderCreds: BuilderApiKeyCreds = {
  key: process.env.POLY_BUILDER_API_KEY!,
  secret: process.env.POLY_BUILDER_SECRET!,
  passphrase: process.env.POLY_BUILDER_PASSPHRASE!,
};
```

--------------------------------

### Get Market Prices

Source: https://docs.polymarket.com/api-reference/market-data/get-market-prices-query-parameters

Retrieves market prices for multiple token IDs and sides using query parameters. This endpoint is useful for fetching real-time pricing information for specific markets.

```APIDOC
## GET /prices

### Description
Retrieves market prices for multiple token IDs and sides using query parameters.

### Method
GET

### Endpoint
/prices

### Parameters
#### Query Parameters
- **token_ids** (string) - Required - Comma-separated list of token IDs
- **sides** (string) - Required - Comma-separated list of sides (BUY or SELL) corresponding to token IDs

### Request Example
```json
{
  "example": "GET /prices?token_ids=0xabc123...,0xdef456...&sides=BUY,SELL"
}
```

### Response
#### Success Response (200)
- **object** (object) - A map where keys are token IDs and values are objects mapping sides to prices.
  - **additionalProperties** (object) - Maps sides (e.g., BUY, SELL) to their corresponding prices.
    - **additionalProperties** (number) - The price for a given side.

#### Response Example
```json
{
  "example": {
    "0xabc123def456...": {
      "BUY": 0.45
    },
    "0xdef456abc123...": {
      "SELL": 0.52
    }
  }
}
```

#### Error Response (400)
- **error** (string) - Description of the error (e.g., Invalid payload or side).

#### Error Response (404)
- **error** (string) - "Not found - No orderbook exists for the requested token id"

#### Error Response (500)
- **error** (string) - "Internal server error"
```

--------------------------------

### GET /series

Source: https://docs.polymarket.com/api-reference/series/list-series

Retrieves a list of series with various filtering and sorting options. This endpoint is useful for fetching series data for display or analysis.

```APIDOC
## GET /series

### Description
Retrieves a list of series with various filtering and sorting options. This endpoint is useful for fetching series data for display or analysis.

### Method
GET

### Endpoint
/series

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of series to return.
- **offset** (integer) - Optional - Number of series to skip before starting to collect the result set.
- **order** (string) - Optional - Comma-separated list of fields to order by.
- **ascending** (boolean) - Optional - Whether to sort in ascending order.
- **slug** (array of strings) - Optional - Filter series by their slugs.
- **categories_ids** (array of integers) - Optional - Filter series by category IDs.
- **categories_labels** (array of strings) - Optional - Filter series by category labels.
- **closed** (boolean) - Optional - Filter by series closed status.
- **include_chat** (boolean) - Optional - Whether to include chat information.
- **recurrence** (string) - Optional - Filter series by recurrence type.

### Response
#### Success Response (200)
- **Series** (array) - An array of Series objects.

#### Response Example
```json
[
  {
    "id": "string",
    "ticker": "string | null",
    "slug": "string | null",
    "title": "string | null",
    "subtitle": "string | null",
    "seriesType": "string | null",
    "recurrence": "string | null",
    "description": "string | null",
    "image": "string | null",
    "icon": "string | null",
    "layout": "string | null",
    "active": "boolean | null",
    "closed": "boolean | null",
    "archived": "boolean | null",
    "new": "boolean | null",
    "featured": "boolean | null",
    "restricted": "boolean | null",
    "isTemplate": "boolean | null",
    "templateVariables": "boolean | null",
    "publishedAt": "string | null",
    "createdBy": "string | null",
    "updatedBy": "string | null",
    "createdAt": "string | null",
    "updatedAt": "string | null",
    "commentsEnabled": "boolean | null",
    "competitive": "string | null",
    "volume24hr": "number | null",
    "volume": "number | null",
    "liquidity": "number | null",
    "startDate": "string | null",
    "pythTokenID": "string | null",
    "cgAssetName": "string | null"
  }
]
```
```

--------------------------------

### Initialize CLOB Client (TypeScript, Python)

Source: https://docs.polymarket.com/trading/clients/public

Initializes the CLOB client with a host URL and Polygon chain ID. This client can then be used to call public methods for reading market data. Ensure the correct host and chain ID are provided for your environment.

```typescript
import { ClobClient } from "@polymarket/clob-client";

const client = new ClobClient(
  "https://clob.polymarket.com",
  137
);

// Ready to call public methods
const markets = await client.getMarkets();
```

```python
from py_clob_client.client import ClobClient

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137
)

# Ready to call public methods
markets = client.get_markets()
```

--------------------------------

### GET /ohlc

Source: https://docs.polymarket.com/resources/error-codes

Retrieves OHLC (Open, High, Low, Close) data for a market.

```APIDOC
## GET /ohlc

### Description
Retrieves OHLC (Open, High, Low, Close) data for a market.

### Method
GET

### Endpoint
/ohlc

### Parameters
#### Query Parameters
- **startTs** (integer) - Required - The start timestamp (Unix epoch seconds).
- **asset_id** (string) - Required - The asset ID (token ID).
- **fidelity** (string) - Required - The time fidelity (e.g., '1m', '5m', '1h', '1d'). Must be one of: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`.
- **limit** (integer) - Optional - The maximum number of data points to return (max 1000).

### Response
#### Success Response (200)
- **ohlc** (array[object]) - An array of OHLC data points.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `startTs is required`, `asset_id is required`, `invalid fidelity: {val}`, `limit cannot exceed 1000`).
```

--------------------------------

### Get Prices History

Source: https://docs.polymarket.com/api-reference/markets/get-prices-history

Retrieve historical price data for a specific market. You can filter the data by timestamp ranges and specify the interval for aggregation.

```APIDOC
## GET /prices-history

### Description
Retrieve historical price data for a market. This endpoint allows you to fetch price history with options to filter by time range and data aggregation interval.

### Method
GET

### Endpoint
/prices-history

### Parameters
#### Query Parameters
- **market** (string) - Required - The market (asset id) to query.
- **startTs** (number) - Optional - Filter by items after this unix timestamp.
- **endTs** (number) - Optional - Filter by items before this unix timestamp.
- **interval** (string) - Optional - Time interval for data aggregation. Allowed values: `max`, `all`, `1m`, `1w`, `1d`, `6h`, `1h`.
- **fidelity** (integer) - Optional - Accuracy of the data expressed in minutes. Default is 1 minute.

### Request Example
```json
{
  "example": "GET /prices-history?market=0xabc123&startTs=1678886400&endTs=1678972800&interval=1h"
}
```

### Response
#### Success Response (200)
- **history** (array) - An array of market price objects, where each object contains `t` (timestamp) and `p` (price).

#### Response Example
```json
{
  "history": [
    {
      "t": 1678886400,
      "p": 1.23
    },
    {
      "t": 1678890000,
      "p": 1.25
    }
  ]
}
```

#### Error Response (400, 500)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "error": "Missing or invalid query parameters"
}
```
```

--------------------------------

### Initialize Relay Client (TypeScript)

Source: https://docs.polymarket.com/trading/gasless

Initializes the RelayClient with the relayer URL, chain ID, private key, and builder configuration. The builder configuration includes details for remote signing.

```typescript
builder_config = BuilderConfig(
    remote_builder_config=RemoteBuilderConfig(
        url="https://your-server.com/sign"
    )
)

client = RelayClient(
    "https://relayer-v2.polymarket.com",
    137,
    private_key,
    builder_config
)
```

--------------------------------

### Get Open Orders (TypeScript, Python)

Source: https://docs.polymarket.com/trading/orders/cancel

Retrieves a list of all open orders. Can be filtered by market ID or asset ID to narrow down the results. Requires L2 authentication.

```typescript
// All open orders
const orders = await client.getOpenOrders();

// Filtered by market
const marketOrders = await client.getOpenOrders({
    market: "0xbd31dc8a...",
  });

// Filtered by token
const tokenOrders = await client.getOpenOrders({
    asset_id: "52114319501245...",
  });
```

```python
from py_clob_client.clob_types import OpenOrderParams

# All open orders
orders = client.get_orders()

# Filtered by market
market_orders = client.get_orders(
      OpenOrderParams(market="0xbd31dc8a...")
  )
```

--------------------------------

### GET /status/{address}

Source: https://docs.polymarket.com/api-reference/bridge/get-transaction-status

Retrieves the transaction status for a given address. This endpoint is useful for tracking the progress of bridge and swap operations initiated through the Polymarket platform.

```APIDOC
## GET /status/{address}

### Description
Retrieves the transaction status for a given address. This endpoint is useful for tracking the progress of bridge and swap operations initiated through the Polymarket platform.

### Method
GET

### Endpoint
/status/{address}

### Parameters
#### Path Parameters
- **address** (string) - Required - The address to query for transaction status (EVM, SVM, or BTC address from the `/deposit` or `/withdraw` response)

### Request Example
```json
{
  "example": ""
}
```

### Response
#### Success Response (200)
- **transactions** (array) - List of transactions for the given address
  - **fromChainId** (string) - Source chain ID
  - **fromTokenAddress** (string) - Source token contract address
  - **fromAmountBaseUnit** (string) - Amount in base units (without decimals)
  - **toChainId** (string) - Destination chain ID
  - **toTokenAddress** (string) - Destination token contract address
  - **status** (string) - Current status of the transaction (e.g., DEPOSIT_DETECTED, PROCESSING, COMPLETED, FAILED)
  - **txHash** (string) - Transaction hash (only available when status is COMPLETED)
  - **createdTimeMs** (number) - Unix timestamp in milliseconds when transaction was created (missing when status is DEPOSIT_DETECTED)

#### Response Example
```json
{
  "transactions": [
    {
      "fromChainId": "1151111081099710",
      "fromTokenAddress": "11111111111111111111111111111111",
      "fromAmountBaseUnit": "13566635",
      "toChainId": "137",
      "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "status": "DEPOSIT_DETECTED"
    },
    {
      "fromChainId": "1151111081099710",
      "fromTokenAddress": "11111111111111111111111111111111",
      "fromAmountBaseUnit": "13400000",
      "toChainId": "137",
      "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "createdTimeMs": 1757646914535,
      "status": "PROCESSING"
    },
    {
      "fromChainId": "1151111081099710",
      "fromTokenAddress": "11111111111111111111111111111111",
      "fromAmountBaseUnit": "13500152",
      "toChainId": "137",
      "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "txHash": "3atr19NAiNCYt24RHM1WnzZp47RXskpTDzspJoCBBaMFwUB8fk37hFkxz35P5UEnnmWz21rb2t5wJ8pq3EE2XnxU",
      "createdTimeMs": 1757531217339,
      "status": "COMPLETED"
    }
  ]
}
```

#### Error Response (400)
- **error** (string) - Bad Request - Missing address parameter

#### Error Response (500)
- **error** (string) - Server Error
```

--------------------------------

### Get Open Orders (TypeScript, Python)

Source: https://docs.polymarket.com/trading/orders/overview

Fetches a list of the user's currently open orders. This functionality can be used to retrieve all open orders or to filter them by a specific market or asset ID. Requires L2 authentication.

```typescript
// All open orders
const orders = await client.getOpenOrders();

// Filtered by market
const marketOrders = await client.getOpenOrders({
    market: "0xbd31dc8a...",
  });

// Filtered by asset
const assetOrders = await client.getOpenOrders({
    asset_id: "52114319501245...",
  });
```

```python
from py_clob_client.clob_types import OpenOrderParams

# All open orders
orders = client.get_orders()

# Filtered by market
market_orders = client.get_orders(
      OpenOrderParams(
          market="0xbd31dc8a...",
      )
  )
```

--------------------------------

### GET /websites/polymarket/trades

Source: https://docs.polymarket.com/api-reference/trade/get-trades

Retrieves a paginated list of trades. Supports filtering and sorting through query parameters. Includes details about pagination and trade data.

```APIDOC
## GET /websites/polymarket/trades

### Description
Retrieves a paginated list of trades. The response includes pagination details such as the limit, next cursor, and the total count of items. Each trade object contains comprehensive information about the transaction.

### Method
GET

### Endpoint
/websites/polymarket/trades

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of items per page. Defaults to 100.
- **cursor** (string) - Optional - Cursor for next page (base64 encoded offset). Use 'LTE=' to indicate no more pages.

### Request Example
```
GET /websites/polymarket/trades?limit=50&cursor=MTAw
```

### Response
#### Success Response (200)
- **limit** (integer) - Maximum number of items per page.
- **next_cursor** (string) - Cursor for the next page. 'LTE=' indicates no more pages.
- **count** (integer) - Number of items in the current response.
- **data** (array) - Array of trade objects.
  - **id** (string) - Trade ID.
  - **taker_order_id** (string) - Taker order ID (hash).
  - **market** (string) - Market (condition ID).
  - **asset_id** (string) - Asset ID (token ID).
  - **side** (string) - Trade side (BUY or SELL).
  - **size** (string) - Trade size.
  - **fee_rate_bps** (string) - Fee rate in basis points.
  - **price** (string) - Trade price.
  - **status** (string) - Trade status (e.g., TRADE_STATUS_CONFIRMED).
  - **match_time** (string) - Match time (Unix timestamp).
  - **match_time_nano** (string) - Match time in nanoseconds.
  - **last_update** (string) - Last update time (Unix timestamp).
  - **outcome** (string) - Market outcome.
  - **bucket_index** (integer) - Bucket index.
  - **owner** (string) - Owner UUID.
  - **maker_address** (string) - Maker address.
  - **transaction_hash** (string) - Transaction hash.
  - **err_msg** (string or null) - Error message, if any.
  - **maker_orders** (array) - Array of maker orders associated with this trade.

#### Response Example
```json
{
  "limit": 100,
  "next_cursor": "MTAw",
  "count": 2,
  "data": [
    {
      "id": "trade-123",
      "taker_order_id": "0xabcdef1234567890abcdef1234567890abcdef12",
      "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "asset_id": "15871154585880608648532107628464183779895785213830018178010423617714102767076",
      "side": "BUY",
      "size": "100000000",
      "fee_rate_bps": "30",
      "price": "0.5",
      "status": "TRADE_STATUS_CONFIRMED",
      "match_time": "1700000000",
      "match_time_nano": "1700000000000000000",
      "last_update": "1700000000",
      "outcome": "YES",
      "bucket_index": 0,
      "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
      "maker_address": "0x1234567890123456789012345678901234567890",
      "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "err_msg": null,
      "maker_orders": [
        {
          "order_id": "0xabc...",
          "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
          "maker_address": "0x123...",
          "matched_amount": "100000000",
          "price": "0.5"
        }
      ]
    }
  ]
}
```

#### Error Response (4xx/5xx)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "error": "Internal server error"
}
```
```

--------------------------------

### Create and Post Order (TypeScript)

Source: https://docs.polymarket.com/trading/orders/create

Creates, signs, and submits a limit order in a single call using the Polymarket SDK.

```APIDOC
## POST /api/orders

### Description
Creates, signs, and submits a limit order in a single call using the Polymarket SDK.

### Method
POST

### Endpoint
/api/orders

### Parameters
#### Request Body
- **tokenID** (string) - Required - The ID of the token for the order.
- **price** (number) - Required - The price of the order.
- **size** (number) - Required - The size of the order.
- **side** (string) - Required - The side of the order (BUY or SELL).
- **orderType** (string) - Required - The type of order (GTC, GTD, FOK, FAK).

#### Request Body Options
- **tickSize** (string) - Optional - The tick size for the order.
- **negRisk** (boolean) - Optional - Whether the order is negatively risked.

### Request Example
```typescript
import { ClobClient, Side, OrderType } from "@polymarket/clob-client";

const client = new ClobClient(/* ... */);
const response = await client.createAndPostOrder(
  {
    tokenID: "TOKEN_ID",
    price: 0.5,
    size: 10,
    side: Side.BUY,
  },
  {
    tickSize: "0.01",
    negRisk: false,
  },
  OrderType.GTC,
);

console.log("Order ID:", response.orderID);
console.log("Status:", response.status);
```

### Response
#### Success Response (200)
- **orderID** (string) - The ID of the created order.
- **status** (string) - The status of the order.

#### Response Example
```json
{
  "orderID": "some_order_id",
  "status": "success"
}
```
```

--------------------------------

### Set Environment Variables for Polymarket API Keys

Source: https://docs.polymarket.com/builders/api-keys

Store your Polymarket Builder API credentials as environment variables. This is a common practice for securely managing sensitive information, especially in development and production environments. Ensure these variables are loaded before your application starts.

```bash
POLY_BUILDER_API_KEY=your-api-key
POLY_BUILDER_SECRET=your-secret
POLY_BUILDER_PASSPHRASE=your-passphrase
```

--------------------------------

### Place Order on Multi-Outcome Market (TypeScript, Python)

Source: https://docs.polymarket.com/trading/orders/overview

Demonstrates how to place an order on a multi-outcome market by setting the `negRisk: true` option. This is crucial for events with more than two possible outcomes. The code requires a client instance and order details like token ID, price, and size.

```typescript
const response = await client.createAndPostOrder(
    {
      tokenID: "TOKEN_ID",
      price: 0.5,
      size: 10,
      side: Side.BUY,
    },
    {
      tickSize: "0.01",
      negRisk: true, // Required for multi-outcome markets
    },
  );
```

```python
response = client.create_and_post_order(
      OrderArgs(
          token_id="TOKEN_ID",
          price=0.50,
          size=10,
          side=BUY,
      ),
      options={
          "tick_size": "0.01",
          "neg_risk": True,  # Required for multi-outcome markets
      }
  )
```

--------------------------------

### GET /neg-risk

Source: https://docs.polymarket.com/resources/error-codes

Retrieves the negative risk information for a market associated with a token ID.

```APIDOC
## GET /neg-risk

### Description
Retrieves the negative risk information for a market associated with a token ID.

### Method
GET

### Endpoint
/neg-risk

### Parameters
#### Query Parameters
- **token_id** (string) - Required - The ID of the token.

### Response
#### Success Response (200)
- **negRisk** (object) - Contains negative risk information.

#### Error Response (400)
- **error** (string) - Description of the error (e.g., `Invalid token id`).
#### Error Response (404)
- **error** (string) - Description of the error (e.g., `market not found`).
```

--------------------------------

### Get Trades Paginated API

Source: https://docs.polymarket.com/trading/orders/cancel

Retrieves a paginated list of trades. This is recommended for large result sets.

```APIDOC
## GET /trades/paginated

### Description
Retrieves a paginated list of trades. This is recommended for large result sets.

### Method
GET

### Endpoint
/trades/paginated

### Parameters
#### Query Parameters
- **market** (string) - Optional - Filter trades by market ID.
- **id** (string) - Optional - Filter trades by trade ID.
- **maker_address** (string) - Optional - Filter trades by maker address.
- **asset_id** (string) - Optional - Filter trades by asset ID.
- **before** (string) - Optional - Filter trades before a specific timestamp.
- **after** (string) - Optional - Filter trades after a specific timestamp.
- **limit** (number) - Optional - Number of trades per page. Defaults to 100.
- **offset** (number) - Optional - Offset for pagination. Defaults to 0.

### Request Example
```json
{
  "market": "0xbd31dc8a...",
  "limit": 50,
  "offset": 100
}
```

### Response
#### Success Response (200)
- **trades** (Trade[]) - An array of Trade objects for the current page.
- **count** (number) - The total number of trades matching the query.

#### Response Example
```json
{
  "trades": [
    {
      "id": "string",
      "taker_order_id": "string",
      "market": "string",
      "asset_id": "string",
      "side": "string",
      "size": "string",
      "price": "string",
      "fee_rate_bps": "string",
      "status": "string",
      "match_time": "string",
      "last_update": "string",
      "outcome": "string",
      "maker_address": "string",
      "owner": "string",
      "transaction_hash": "string",
      "bucket_index": 0,
      "trader_side": "string",
      "maker_orders": [
        {
          "id": "string",
          "size": "string",
          "fee_rate_bps": "string"
        }
      ]
    }
  ],
  "count": 100
}
```
```

--------------------------------

### Submit Signed Order (Python)

Source: https://docs.polymarket.com/trading/orders/create

Submits a pre-signed order to the CLOB.

```APIDOC
## POST /api/orders/submit

### Description
Submits a pre-signed order to the CLOB.

### Method
POST

### Endpoint
/api/orders/submit

### Parameters
#### Request Body
- **signed_order** (dict) - Required - The locally signed order object.
- **order_type** (string) - Required - The type of order (GTC, GTD, FOK, FAK).

### Request Example
```python
from py_clob_client.clob_types import OrderType

# Assuming 'client' is an initialized CLOB client instance
# Assume signed_order is obtained from client.create_order()
# signed_order = client.create_order(...)

response = client.post_order(signed_order, OrderType.GTC)

print("Order ID:", response["orderID"])
print("Status:", response["status"])
```

### Response
#### Success Response (200)
- **orderID** (string) - The ID of the submitted order.
- **status** (string) - The status of the order.

#### Response Example
```json
{
  "orderID": "some_order_id",
  "status": "submitted"
}
```
```

--------------------------------

### Market Data Structure Example

Source: https://docs.polymarket.com/market-data/overview

Illustrates the structure of market data, specifically focusing on outcomes and their corresponding probabilities. This JSON snippet shows how 'outcomes' and 'outcomePrices' arrays map to each other.

```json
{
  "outcomes": "[\"Yes\", \"No\"]",
  "outcomePrices": "[\"0.20\", \"0.80\"]"
}
// Index 0: "Yes" → 0.20 (20% probability)
// Index 1: "No" → 0.80 (80% probability)
```

--------------------------------

### Order Book and Price Calculation

Source: https://docs.polymarket.com/trading/clients/public

Endpoints for calculating market prices, retrieving order books, and getting current prices.

```APIDOC
## POST /websites/polymarket/calculateMarketPrice

### Description
Calculate the estimated price for a market order of a given size.

### Method
POST

### Endpoint
/websites/polymarket/calculateMarketPrice

### Parameters
#### Request Body
- **tokenID** (string) - Required - The token ID to calculate the market price for.
- **side** (Side) - Required - The side of the order. One of: `BUY`, `SELL`
- **amount** (number) - Required - The size of the order to calculate price for.
- **orderType** (OrderType) - Optional - The order type. One of: `GTC`, `FOK`, `GTD`, `FAK`. Defaults to `FOK`.

### Request Example
```json
{
  "tokenID": "0xabc...",
  "side": "BUY",
  "amount": 10,
  "orderType": "FOK"
}
```

### Response
#### Success Response (200)
- **returns** (number) - The calculated estimated market price for the given order size.

#### Response Example
```json
{
  "returns": 0.55
}
```

## GET /websites/polymarket/getOrderBook

### Description
Get the order book for a specific token ID.

### Method
GET

### Endpoint
/websites/polymarket/getOrderBook

### Parameters
#### Query Parameters
- **tokenID** (string) - Required - The token ID to fetch the order book for.

### Response
#### Success Response (200)
- **market** (string) - The market condition ID.
- **asset_id** (string) - The token/asset ID for this order book.
- **timestamp** (string) - Timestamp of the order book snapshot.
- **bids** (OrderSummary[]) - Array of bid entries.
- **asks** (OrderSummary[]) - Array of ask entries.
- **min_order_size** (string) - Minimum order size for this market.
- **tick_size** (string) - Minimum price increment for this market.
- **neg_risk** (boolean) - Whether the market uses negative risk.
- **hash** (string) - Hash of the order book state.

#### Response Example
```json
{
  "market": "0x123...",
  "asset_id": "0xabc...",
  "timestamp": "2023-10-27T10:00:00Z",
  "bids": [
    { "price": "0.50", "size": "10" }
  ],
  "asks": [
    { "price": "0.55", "size": "5" }
  ],
  "min_order_size": "0.01",
  "tick_size": "0.001",
  "neg_risk": false,
  "hash": "0xabcdef..."
}
```

## POST /websites/polymarket/getOrderBooks

### Description
Get order books for multiple token IDs.

### Method
POST

### Endpoint
/websites/polymarket/getOrderBooks

### Parameters
#### Request Body
- **params** (BookParams[]) - Required - An array of objects, each specifying a token ID and optionally a side.
  - **token_id** (string) - Required - The token ID to fetch the order book for.
  - **side** (Side) - Optional - The side of the book to query. One of: `BUY`, `SELL`

### Request Example
```json
{
  "params": [
    { "token_id": "0xabc...", "side": "BUY" },
    { "token_id": "0xdef..." }
  ]
}
```

### Response
#### Success Response (200)
- **returns** (OrderBookSummary[]) - Array of OrderBookSummary objects.

#### Response Example
```json
{
  "returns": [
    { ... OrderBookSummary object ... },
    { ... OrderBookSummary object ... }
  ]
}
```

## GET /websites/polymarket/getPrice

### Description
Get the current best price for buying or selling a token ID.

### Method
GET

### Endpoint
/websites/polymarket/getPrice

### Parameters
#### Query Parameters
- **tokenID** (string) - Required - The token ID to get the price for.
- **side** (string) - Required - The side of the order. One of: `BUY`, `SELL`

### Response
#### Success Response (200)
- **price** (string) - The current best price for the requested side.

#### Response Example
```json
{
  "price": "0.52"
}
```
```

--------------------------------

### Initialize Polymarket Client with Local Signing (TypeScript)

Source: https://docs.polymarket.com/trading/gasless

Initializes the Polymarket relayer client using local signing. This method is suitable when your backend securely handles all transactions. It requires environment variables for private key, RPC URL, and builder API credentials.

```typescript
import { createWalletClient, http, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);
const wallet = createWalletClient({
  account,
  chain: polygon,
  transport: http(process.env.RPC_URL),
});

const builderConfig = new BuilderConfig({
  localBuilderCreds: {
    key: process.env.POLY_BUILDER_API_KEY!,
    secret: process.env.POLY_BUILDER_SECRET!,
    passphrase: process.env.POLY_BUILDER_PASSPHRASE!,
  },
});

const client = new RelayClient(
  "https://relayer-v2.polymarket.com/",
  137,
  wallet,
  builderConfig,
);
```

--------------------------------

### GET /events

Source: https://docs.polymarket.com/api-reference/events/list-events

Retrieves a list of events based on various filtering and sorting criteria. This endpoint is useful for fetching event data for display or analysis.

```APIDOC
## GET /events

### Description
Retrieves a list of events. Supports filtering by ID, tag, slug, status (active, archived, featured, cyom), and date ranges. Allows for sorting and pagination.

### Method
GET

### Endpoint
/events

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of events to return.
- **offset** (integer) - Optional - Number of events to skip for pagination.
- **order** (string) - Optional - Comma-separated list of fields to order by.
- **ascending** (boolean) - Optional - Whether to sort in ascending order.
- **id** (array of integers) - Optional - Filter by event IDs.
- **tag_id** (integer) - Optional - Filter by tag ID.
- **exclude_tag_id** (array of integers) - Optional - Exclude events with specific tag IDs.
- **slug** (array of strings) - Optional - Filter by event slugs.
- **tag_slug** (string) - Optional - Filter by tag slug.
- **related_tags** (boolean) - Optional - Include events related to specified tags.
- **active** (boolean) - Optional - Filter for active events.
- **archived** (boolean) - Optional - Filter for archived events.
- **featured** (boolean) - Optional - Filter for featured events.
- **cyom** (boolean) - Optional - Filter for 'create your own market' events.
- **include_chat** (boolean) - Optional - Include chat information with events.
- **include_template** (boolean) - Optional - Include template information with events.
- **recurrence** (string) - Optional - Filter by recurrence type.
- **closed** (boolean) - Optional - Filter for closed events.
- **liquidity_min** (number) - Optional - Minimum liquidity for filtering.
- **liquidity_max** (number) - Optional - Maximum liquidity for filtering.
- **volume_min** (number) - Optional - Minimum volume for filtering.
- **volume_max** (number) - Optional - Maximum volume for filtering.
- **start_date_min** (string) - Optional - Minimum start date (ISO 8601 format).
- **start_date_max** (string) - Optional - Maximum start date (ISO 8601 format).
- **end_date_min** (string) - Optional - Minimum end date (ISO 8601 format).
- **end_date_max** (string) - Optional - Maximum end date (ISO 8601 format).

### Response
#### Success Response (200)
- **Event** (object) - An array of event objects, each containing details like id, ticker, slug, title, description, dates, etc.

#### Response Example
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "ticker": "BTC-USD",
    "slug": "bitcoin-price-usd-100k",
    "title": "Will Bitcoin reach $100,000 by December 31, 2024?",
    "subtitle": "A market on the price of Bitcoin.",
    "description": "This market resolves based on the highest price Bitcoin reaches on Coinbase Pro.",
    "resolutionSource": "Coinbase Pro",
    "startDate": "2024-01-01T00:00:00Z",
    "creationDate": "2023-12-01T10:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }
]
```
```

--------------------------------

### GET /midpoint

Source: https://docs.polymarket.com/trading/orderbook

Calculate and retrieve the midpoint price for a token, which is the average of the best bid and best ask.

```APIDOC
## GET /midpoint

### Description
Calculates and returns the midpoint price for a given token. The midpoint is defined as the average of the best bid and best ask prices. This value is typically displayed as the market's implied probability on Polymarket, unless the bid-ask spread is wider than $0.10, in which case the last traded price is shown.

### Method
GET

### Endpoint
`/midpoint`

### Query Parameters
- **token_id** (string) - Required - The unique identifier for the token.

### Request Example
```bash
curl "https://clob.polymarket.com/midpoint?token_id=TOKEN_ID"
```

### Response
#### Success Response (200)
- **mid** (string) - The calculated midpoint price.

#### Response Example
```json
{
  "mid": "0.50"
}
```
```

--------------------------------

### Get Trades API

Source: https://docs.polymarket.com/trading/orders/overview

Retrieve trades from the Polymarket API. Supports fetching all trades, filtering by market, and paginated results.

```APIDOC
## GET /trades

### Description
Retrieves a list of trades. Can be filtered by market and supports pagination.

### Method
GET

### Endpoint
/trades

### Query Parameters
- **market** (string) - Optional - Filter trades by a specific market ID.
- **limit** (integer) - Optional - Number of trades to return per page.
- **offset** (integer) - Optional - Offset for pagination.

### Request Example
```typescript
// All trades
const trades = await client.getTrades();

// Filtered by market
const marketTrades = await client.getTrades({ market: "0xbd31dc8a..." });

// With pagination
const paginatedTrades = await client.getTradesPaginated({ market: "0xbd31dc8a..." });
```
```python
from py_clob_client.clob_types import TradeParams

# All trades
trades = client.get_trades()

# Filtered by market
market_trades = client.get_trades(
    TradeParams(
        market="0xbd31dc8a..."
    )
)
```

### Response
#### Success Response (200)
- **maker_orders** (array) - An array of maker order objects.
  - **order_id** (string) - Maker order ID (hash).
  - **owner** (string) - Maker's API key ID.
  - **maker_address** (string) - Maker's funder address.
  - **matched_amount** (string) - Amount matched in this trade.
  - **price** (string) - Maker order price.
  - **fee_rate_bps** (string) - Maker fee rate in bps.
  - **asset_id** (string) - Token ID.
  - **outcome** (string) - Outcome name.
  - **side** (string) - `BUY` or `SELL`.

#### Response Example
```json
{
  "maker_orders": [
    {
      "order_id": "0xabc123...",
      "owner": "api_key_123",
      "maker_address": "0x123...",
      "matched_amount": "100.0",
      "price": "0.5",
      "fee_rate_bps": "10",
      "asset_id": "0xasset1...",
      "outcome": "Yes",
      "side": "BUY"
    }
  ]
}
```
```

--------------------------------

### Get Sports Market Types

Source: https://docs.polymarket.com/api-reference/sports/get-valid-sports-market-types

Retrieves a list of all valid sports market types available through the Polymarket API.

```APIDOC
## GET /sports/market-types

### Description
Retrieves a list of all valid sports market types.

### Method
GET

### Endpoint
/sports/market-types

### Parameters
#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **marketTypes** (array[string]) - List of all valid sports market types

#### Response Example
```json
{
  "marketTypes": [
    "moneyline",
    "spread",
    "total"
  ]
}
```
```

--------------------------------

### Fetch All Active Markets using cURL

Source: https://docs.polymarket.com/market-data/fetching-markets

Retrieves all currently active markets from the Polymarket API. This is an efficient method as the events endpoint includes associated markets. The example limits the results to 100 per page.

```bash
curl "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100"
```

--------------------------------

### Configure CLOB Client for Local Signing (TypeScript, Python)

Source: https://docs.polymarket.com/trading/orders/attribution

Configure the CLOB client for local signing using API key credentials. This involves creating a BuilderConfig with local builder credentials, including key, secret, and passphrase, typically loaded from environment variables. The client is then initialized with this configuration.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import {
  BuilderConfig,
  BuilderApiKeyCreds,
} from "@polymarket/builder-signing-sdk";

const builderCreds: BuilderApiKeyCreds = {
  key: process.env.POLY_BUILDER_API_KEY!,
  secret: process.env.POLY_BUILDER_SECRET!,
  passphrase: process.env.POLY_BUILDER_PASSPHRASE!,
};

const builderConfig = new BuilderConfig({
  localBuilderCreds: builderCreds,
});

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds,
  2,
  funderAddress,
  undefined,
  false,
  builderConfig,
);

// Orders automatically include builder headers
const response = await client.createAndPostOrder(/* ... */);
```

```python
import os
from py_clob_client.client import ClobClient
from py_builder_signing_sdk import BuilderConfig, BuilderApiKeyCreds

builder_creds = BuilderApiKeyCreds(
    key=os.environ["POLY_BUILDER_API_KEY"],
    secret=os.environ["POLY_BUILDER_SECRET"],
    passphrase=os.environ["POLY_BUILDER_PASSPHRASE"],
)

builder_config = BuilderConfig(
    local_builder_creds=builder_creds,
)

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=private_key,
    creds=api_creds,
    signature_type=2,
    funder=funder_address,
    builder_config=builder_config
)

# Orders automatically include builder headers
response = client.create_and_post_order(...)
```

--------------------------------

### Get Server Time

Source: https://docs.polymarket.com/api-reference/data/get-server-time

Retrieves the current Unix timestamp of the server, useful for synchronizing client and server times.

```APIDOC
## GET /time

### Description
Returns the current Unix timestamp of the server. This can be used to synchronize client time with server time.

### Method
GET

### Endpoint
/time

### Parameters

#### Path Parameters
None

#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **Unix timestamp** (integer) - Unix timestamp (seconds since epoch)

#### Response Example
```json
1234567890
```

#### Error Response (400)
- **error** (string) - Error message
```

--------------------------------

### Get Trades

Source: https://docs.polymarket.com/api-reference/trade/get-trades

Retrieves trades for the authenticated user. Returns paginated results. Requires readonly or level 2 API key authentication.

```APIDOC
## GET /websites/polymarket/trades

### Description
Retrieves trades for the authenticated user. Returns paginated results.

### Method
GET

### Endpoint
/websites/polymarket/trades

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - The maximum number of trades to return per page.
- **offset** (integer) - Optional - The number of trades to skip before starting to collect the result set.

### Request Example
```http
GET /websites/polymarket/trades?limit=10&offset=0 HTTP/1.1
Host: api.polymarket.com
Authorization: Bearer YOUR_API_KEY
```

### Response
#### Success Response (200)
- **trades** (array) - A list of trade objects.
  - **trade_id** (string) - The unique identifier for the trade.
  - **market_id** (string) - The identifier for the market the trade occurred in.
  - **outcome** (string) - The outcome of the market at the time of the trade.
  - **amount** (number) - The amount of the trade.
  - **price** (number) - The price at which the trade occurred.
  - **timestamp** (string) - The timestamp of the trade (ISO 8601 format).

#### Response Example
```json
{
  "trades": [
    {
      "trade_id": "tx_12345",
      "market_id": "0xabc123",
      "outcome": "yes",
      "amount": 10,
      "price": 0.5,
      "timestamp": "2023-10-27T10:00:00Z"
    }
  ]
}
```
```

--------------------------------

### POST /quote

Source: https://docs.polymarket.com/api-reference/bridge/get-a-quote

Retrieves a quote for a bridge or swap operation. This endpoint allows users to get estimated costs, fees, and output amounts before initiating a transaction.

```APIDOC
## POST /quote

### Description
Retrieves a quote for a bridge or swap operation. This endpoint allows users to get estimated costs, fees, and output amounts before initiating a transaction.

### Method
POST

### Endpoint
/quote

### Parameters
#### Request Body
- **fromAmountBaseUnit** (string) - Required - Amount of tokens to send
- **fromChainId** (string) - Required - Source Chain ID
- **fromTokenAddress** (string) - Required - Source token address
- **recipientAddress** (string) - Required - Address of the recipient
- **toChainId** (string) - Required - Destination Chain ID
- **toTokenAddress** (string) - Required - Destination token address

### Request Example
```json
{
  "fromAmountBaseUnit": "10000000",
  "fromChainId": "137",
  "fromTokenAddress": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  "recipientAddress": "0x17eC161f126e82A8ba337f4022d574DBEaFef575",
  "toChainId": "137",
  "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
}
```

### Response
#### Success Response (200)
- **estCheckoutTimeMs** (integer) - Estimated time to complete the checkout in milliseconds
- **estFeeBreakdown** (object) - Breakdown of estimated fees
- **estInputUsd** (number) - Estimated token amount received in USD
- **estOutputUsd** (number) - Estimated token amount sent in USD
- **estToTokenBaseUnit** (string) - Estimated token amount received
- **quoteId** (string) - Unique quote id of the request

#### Response Example
```json
{
  "estCheckoutTimeMs": 25000,
  "estFeeBreakdown": {
    "appFeeLabel": "Fun.xyz fee",
    "appFeePercent": 0,
    "appFeeUsd": 0,
    "fillCostPercent": 0,
    "fillCostUsd": 0,
    "gasUsd": 0.003854,
    "maxSlippage": 0,
    "minReceived": 14.488305,
    "swapImpact": 0,
    "swapImpactUsd": 0,
    "totalImpact": 0,
    "totalImpactUsd": 0
  },
  "estInputUsd": 14.488305,
  "estOutputUsd": 14.488305,
  "estToTokenBaseUnit": "14491203",
  "quoteId": "0x00c34ba467184b0146406d62b0e60aaa24ed52460bd456222b6155a0d9de0ad5"
}
```

#### Error Response (400)
- **error** (string) - Description of the error (e.g., missing required field)

#### Error Response Example
```json
{
  "error": "fromAmountBaseUnit is required"
}
```

#### Error Response (500)
- **error** (string) - Description of the server error

#### Error Response Example
```json
{
  "error": "cannot get quote"
}
```
```

--------------------------------

### Get API Credentials using CLOB Client SDK

Source: https://docs.polymarket.com/api-reference/authentication

Demonstrates how to obtain API credentials (apiKey, secret, passphrase) using the CLOB client SDK. This process involves creating new credentials or deriving existing ones using L1 authentication with a private key. Ensure your private key is securely managed using environment variables.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers"; // v5.8.0

const client = new ClobClient(
  "https://clob.polymarket.com",
  137, // Polygon mainnet
  new Wallet(process.env.PRIVATE_KEY)
);

// Creates new credentials or derives existing ones
const credentials = await client.createOrDeriveApiKey();

console.log(credentials);
// {
//   apiKey: "550e8400-e29b-41d4-a716-446655440000",
//   secret: "base64EncodedSecretString",
//   passphrase: "randomPassphraseString"
// }
```

```python
from py_clob_client.client import ClobClient
import os

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,  # Polygon mainnet
    key=os.getenv("PRIVATE_KEY")
)

# Creates new credentials or derives existing ones
credentials = client.create_or_derive_api_creds()

print(credentials)
# {
#     "apiKey": "550e8400-e29b-41d4-a716-446655440000",
#     "secret": "base64EncodedSecretString",
#     "passphrase": "randomPassphraseString"
# }
```

--------------------------------

### Post Order API

Source: https://docs.polymarket.com/trading/clients/l2

Posts a pre-signed order to the CLOB. Use with `createOrder()` or `createMarketOrder()` from L1 methods.

```APIDOC
## POST /websites/polymarket/postOrder

### Description
Posts a pre-signed order to the CLOB. Use with [`createOrder()`](/trading/clients/l1#createorder) or [`createMarketOrder()`](/trading/clients/l1#createmarketorder) from L1 methods.

### Method
POST

### Endpoint
/websites/polymarket/postOrder

### Parameters
#### Request Body
- **order** (SignedOrder) - Required - The pre-signed order to post.
- **orderType** (OrderType) - Optional - The order type (e.g. GTC, FOK, FAK). Defaults to GTC.
- **postOnly** (boolean) - Optional - Whether to post the order as post-only. Defaults to false.

### Response
#### Success Response (200)
- **success** (boolean) - Whether the order was successfully placed.
- **errorMsg** (string) - Error message if the order was not successful.
- **orderID** (string) - The ID of the placed order.
- **transactionsHashes** (string[]) - Array of transaction hashes associated with the order.
- **status** (string) - The current status of the order.
- **takingAmount** (string) - The amount being taken in the order.
- **makingAmount** (string) - The amount being made in the order.

#### Response Example
```json
{
  "success": true,
  "orderID": "0x123abc",
  "transactionsHashes": ["0xhash1", "0xhash2"],
  "status": "open"
}
```
```

--------------------------------

### Initialize ClobClient for Orderbook Access (TypeScript, Python, REST)

Source: https://docs.polymarket.com/trading/orderbook

Initializes the ClobClient for interacting with the Polymarket orderbook. Supports TypeScript, Python, and direct REST API calls. Requires the CLOB base URL and chain ID for SDKs.

```typescript
import { ClobClient } from "@polymarket/clob-client";

const client = new ClobClient("https://clob.polymarket.com", 137);
```

```python
from py_clob_client.client import ClobClient

client = ClobClient("https://clob.polymarket.com", chain_id=137)
```

```bash
# Base URL for all orderbook endpoints
https://clob.polymarket.com
```

--------------------------------

### Get Order Details by ID using Builder Authentication (Python)

Source: https://docs.polymarket.com/trading/clients/builder

Retrieves details for a specific order using its ID. When called with a builder-configured client, it automatically uses builder headers for authentication and returns orders attributed to the builder.

```python
order = clob_client.get_order("0xb816482a...")
print(order)
```

--------------------------------

### Get Public Profile by Wallet Address (OpenAPI)

Source: https://docs.polymarket.com/api-reference/profiles/get-public-profile-by-wallet-address

This OpenAPI specification defines the endpoint for retrieving a public user profile using a wallet address. It includes request parameters, response schemas for success and error cases, and server information. The endpoint requires a valid Ethereum wallet address as a query parameter.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /public-profile:
    get:
      tags:
        - Profiles
      summary: Get public profile by wallet address
      operationId: getPublicProfile
      parameters:
        - name: address
          in: query
          required: true
          description: The wallet address (proxy wallet or user address)
          schema:
            type: string
            pattern: '^0x[a-fA-F0-9]{40}$'
          example: '0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b'
      responses:
        '200':
          description: Public profile information
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicProfileResponse'
        '400':
          description: Invalid address format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicProfileError'
              example:
                type: validation error
                error: invalid address
        '404':
          description: Profile not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PublicProfileError'
              example:
                type: not found error
                error: profile not found
components:
  schemas:
    PublicProfileResponse:
      type: object
      properties:
        createdAt:
          type: string
          format: date-time
          description: ISO 8601 timestamp of when the profile was created
          nullable: true
        proxyWallet:
          type: string
          description: The proxy wallet address
          nullable: true
        profileImage:
          type: string
          format: uri
          description: URL to the profile image
          nullable: true
        displayUsernamePublic:
          type: boolean
          description: Whether the username is displayed publicly
          nullable: true
        bio:
          type: string
          description: Profile bio
          nullable: true
        pseudonym:
          type: string
          description: Auto-generated pseudonym
          nullable: true
        name:
          type: string
          description: User-chosen display name
          nullable: true
        users:
          type: array
          description: Array of associated user objects
          nullable: true
          items:
            $ref: '#/components/schemas/PublicProfileUser'
        xUsername:
          type: string
          description: X (Twitter) username
          nullable: true
        verifiedBadge:
          type: boolean
          description: Whether the profile has a verified badge
          nullable: true
    PublicProfileError:
      type: object
      description: Error response for public profile endpoint
      properties:
        type:
          type: string
          description: Error type classification
        error:
          type: string
          description: Error message
    PublicProfileUser:
      type: object
      description: User object associated with a public profile
      properties:
        id:
          type: string
          description: User ID
        creator:
          type: boolean
          description: Whether the user is a creator
        mod:
          type: boolean
          description: Whether the user is a moderator

```

--------------------------------

### GET /events/{id}

Source: https://docs.polymarket.com/api-reference/events/get-event-by-id

Retrieves detailed information about a specific event using its unique identifier. Supports optional query parameters to include chat data or template information.

```APIDOC
## GET /events/{id}

### Description
Retrieves detailed information about a specific event using its unique identifier. Supports optional query parameters to include chat data or template information.

### Method
GET

### Endpoint
/events/{id}

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the event.

#### Query Parameters
- **include_chat** (boolean) - Optional - Whether to include chat data in the response.
- **include_template** (boolean) - Optional - Whether to include template information in the response.

### Request Example
```json
{
  "example": "GET /events/123?include_chat=true"
}
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the event.
- **ticker** (string) - The ticker symbol for the event (nullable).
- **slug** (string) - The slug for the event (nullable).
- **title** (string) - The title of the event (nullable).
- **subtitle** (string) - The subtitle of the event (nullable).
- **description** (string) - The description of the event (nullable).
- **resolutionSource** (string) - The source of event resolution (nullable).
- **startDate** (string) - The start date of the event (format: date-time, nullable).
- **creationDate** (string) - The creation date of the event (format: date-time, nullable).
- **endDate** (string) - The end date of the event (format: date-time, nullable).
- **image** (string) - URL of the event image (nullable).
- **icon** (string) - URL of the event icon (nullable).
- **active** (boolean) - Indicates if the event is active (nullable).
- **closed** (boolean) - Indicates if the event is closed (nullable).
- **archived** (boolean) - Indicates if the event is archived (nullable).
- **new** (boolean) - Indicates if the event is new (nullable).
- **featured** (boolean) - Indicates if the event is featured (nullable).
- **restricted** (boolean) - Indicates if the event is restricted (nullable).
- **liquidity** (number) - The liquidity of the event (nullable).
- **volume** (number) - The trading volume of the event (nullable).
- **openInterest** (number) - The open interest for the event (nullable).
- **sortBy** (string) - Sorting criteria for the event (nullable).
- **category** (string) - The category of the event (nullable).
- **subcategory** (string) - The subcategory of the event (nullable).
- **isTemplate** (boolean) - Indicates if the event is a template (nullable).
- **templateVariables** (string) - Template variables for the event (nullable).
- **published_at** (string) - The publication timestamp of the event (nullable).
- **createdBy** (string) - The user ID who created the event (nullable).
- **updatedBy** (string) - The user ID who last updated the event (nullable).
- **createdAt** (string) - The creation timestamp of the record (format: date-time, nullable).
- **updatedAt** (string) - The last update timestamp of the record (format: date-time, nullable).
- **commentsEnabled** (boolean) - Indicates if comments are enabled for the event (nullable).
- **competitive** (number) - Competitive score for the event (nullable).
- **volume24hr** (number) - Trading volume in the last 24 hours (nullable).
- **volume1wk** (number) - Trading volume in the last week (nullable).
- **volume1mo** (number) - Trading volume in the last month (nullable).
- **volume1yr** (number) - Trading volume in the last year (nullable).
- **featuredImage** (string) - URL of the featured image for the event (nullable).
- **disqusThread** (string) - Disqus thread ID for comments (nullable).
- **parentEvent** (string) - ID of the parent event, if applicable (nullable).
- **enableOrderBook** (boolean) - Indicates if the order book is enabled (nullable).
- **liquidityAmm** (number) - Liquidity provided by Automated Market Maker (nullable).
- **liquidityClob** (number) - Liquidity provided by Central Limit Order Book (nullable).
- **negRisk** (boolean) - Indicates if the event has negative risk (nullable).
- **negRiskMarketID** (string) - The market ID associated with negative risk (nullable).
- **negRiskFeeBips** (number) - Fee in basis points for negative risk (nullable).

#### Response Example
```json
{
  "id": "123",
  "ticker": "BTC-USD",
  "slug": "bitcoin-price-usd",
  "title": "Will Bitcoin price be above $50,000 on December 31st, 2023?",
  "subtitle": "A market on Polymarket",
  "description": "This market resolves based on the price of Bitcoin (BTC) against the US Dollar (USD) on December 31st, 2023.",
  "resolutionSource": "CoinGecko",
  "startDate": "2023-01-01T00:00:00Z",
  "creationDate": "2022-12-01T10:00:00Z",
  "endDate": "2023-12-31T23:59:59Z",
  "image": "https://example.com/images/btc.png",
  "icon": "https://example.com/icons/btc.svg",
  "active": true,
  "closed": false,
  "archived": false,
  "new": false,
  "featured": true,
  "restricted": false,
  "liquidity": 100000.50,
  "volume": 500000.75,
  "openInterest": 25000.00,
  "sortBy": "end_date",
  "category": "Crypto",
  "subcategory": "Price Prediction",
  "isTemplate": false,
  "templateVariables": null,
  "published_at": "2022-12-01T10:05:00Z",
  "createdBy": "user123",
  "updatedBy": "user456",
  "createdAt": "2022-12-01T10:00:00Z",
  "updatedAt": "2023-11-15T14:30:00Z",
  "commentsEnabled": true,
  "competitive": 0.8,
  "volume24hr": 15000.25,
  "volume1wk": 75000.50,
  "volume1mo": 300000.00,
  "volume1yr": 1500000.00,
  "featuredImage": "https://example.com/images/btc_featured.png",
  "disqusThread": "abc123xyz",
  "parentEvent": null,
  "enableOrderBook": true,
  "liquidityAmm": 50000.25,
  "liquidityClob": 50000.25,
  "negRisk": false,
  "negRiskMarketID": null,
  "negRiskFeeBips": null
}
```

#### Error Response (404)
- **description**: Not found
```

--------------------------------

### Post Multiple Orders in Batch with CLOB Client

Source: https://docs.polymarket.com/market-makers/trading

This snippet demonstrates how to submit multiple orders efficiently in a single request using the `postOrders` method. It first creates individual orders using `createOrder` and then bundles them into a batch request. This is preferred over individual calls for reduced latency.

```typescript
const orders = await Promise.all([
  client.createOrder({ tokenID, side: Side.BUY, price: 0.48, size: 500 }),
  client.createOrder({ tokenID, side: Side.BUY, price: 0.47, size: 500 }),
  client.createOrder({ tokenID, side: Side.SELL, price: 0.52, size: 500 }),
  client.createOrder({ tokenID, side: Side.SELL, price: 0.53, size: 500 }),
]);

const response = await client.postOrders(
  orders.map((order) => ({ order, orderType: OrderType.GTC })),
);
```

```python
from py_clob_client.clob_types import OrderArgs, OrderType, PostOrdersArgs
from py_clob_client.order_builder.constants import BUY, SELL

response = client.post_orders([
    PostOrdersArgs(
        order=client.create_order(OrderArgs(
            price=0.48, size=500, side=BUY, token_id=token_id,
        )),
        order_type=OrderType.GTC,
    ),
    PostOrdersArgs(
        order=client.create_order(OrderArgs(
            price=0.47, size=500, side=BUY, token_id=token_id,
        )),
        order_type=OrderType.GTC,
    ),
    PostOrdersArgs(
        order=client.create_order(OrderArgs(
            price=0.52, size=500, side=SELL, token_id=token_id,
        )),
        order_type=OrderType.GTC,
    ),
    PostOrdersArgs(
        order=client.create_order(OrderArgs(
            price=0.53, size=500, side=SELL, token_id=token_id,
        )),
        order_type=OrderType.GTC,
    ),
])
```

--------------------------------

### Get Condition ID - Solidity

Source: https://docs.polymarket.com/trading/ctf/overview

Generates a unique identifier for a market condition. Requires the oracle address, a hash of the question ID, and the number of outcome slots.

```solidity
function getConditionId(address oracle, bytes32 questionId, uint outcomeSlotCount) public pure returns (bytes32)
```

--------------------------------

### Getting API Credentials (SDK)

Source: https://docs.polymarket.com/api-reference/authentication

Obtain API credentials (apiKey, secret, passphrase) by using the CLOB client SDK with your private key. This process either creates new credentials or derives existing ones associated with your wallet.

```APIDOC
## Getting API Credentials using the SDK

Before making authenticated requests, obtain API credentials using L1 authentication via the CLOB SDK.

### TypeScript Example

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { Wallet } from "ethers"; // v5.8.0

const client = new ClobClient(
  "https://clob.polymarket.com",
  137, // Polygon mainnet
  new Wallet(process.env.PRIVATE_KEY)
);

// Creates new credentials or derives existing ones
const credentials = await client.createOrDeriveApiKey();

console.log(credentials);
// {
//   apiKey: "550e8400-e29b-41d4-a716-446655440000",
//   secret: "base64EncodedSecretString",
//   passphrase: "randomPassphraseString"
// }
```

### Python Example

```python
from py_clob_client.client import ClobClient
import os

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,  # Polygon mainnet
    key=os.getenv("PRIVATE_KEY")
)

# Creates new credentials or derives existing ones
credentials = client.create_or_derive_api_creds()

print(credentials)
# {
#     "apiKey": "550e8400-e29b-41d4-a716-446655440000",
#     "secret": "base64EncodedSecretString",
#     "passphrase": "randomPassphraseString"
# }
```

**Warning:** Never commit private keys to version control. Always use environment variables or secure key management systems.
```

--------------------------------

### Order Parameters

Source: https://docs.polymarket.com/api-reference/trade/get-single-order-by-id

Details on the parameters required for creating an order on Polymarket.

```APIDOC
## Order Parameters

### Description
This section details the fields used when placing an order, including side, size, price, and expiration.

### Parameters
#### Request Body
- **example** (string) - Example value for a field.
- **side** (string) - Required - Order side. Enum: [BUY, SELL]. Example: BUY
- **original_size** (string) - Required - Original order size in fixed-math with 6 decimals. Example: '100000000'
- **size_matched** (string) - Required - Size that has been matched in fixed-math with 6 decimals. Example: '0'
- **price** (string) - Required - Order price. Example: '0.5'
- **outcome** (string) - Required - Market outcome (YES/NO). Example: 'YES'
- **expiration** (string) - Required - Unix timestamp when the order expires. Example: '1735689600'
- **order_type** (string) - Required - Order type. Enum: [GTC, FOK, GTD, FAK]. Example: GTC
- **associate_trades** (array) - Optional - Array of associated trade IDs. Items: string. Example: ["trade-123"]
- **created_at** (integer) - Required - Unix timestamp when the order was created. Example: 1700000000

### Response
#### Success Response (200)
- **field1** (type) - Description

#### Response Example
```json
{
  "example": "response body"
}
```
```

--------------------------------

### GET /closed-positions

Source: https://docs.polymarket.com/api-reference/core/get-closed-positions-for-a-user

Retrieves a list of closed positions for a specified user. Supports filtering by market, title, or event ID, and allows for pagination and sorting.

```APIDOC
## GET /closed-positions

### Description
Retrieves a list of closed positions for a specified user. Supports filtering by market, title, or event ID, and allows for pagination and sorting.

### Method
GET

### Endpoint
/closed-positions

### Parameters
#### Query Parameters
- **user** (Address) - Required - The address of the user in question.
- **market** (array of Hash64) - Optional - The conditionId of the market in question. Supports multiple csv separated values. Cannot be used with the eventId param.
- **title** (string) - Optional - Filter by market title. Maximum length is 100.
- **eventId** (array of integer) - Optional - The event id of the event in question. Supports multiple csv separated values. Returns positions for all markets for those event ids. Cannot be used with the market param. Minimum value is 1.
- **limit** (integer) - Optional - The max number of positions to return. Default is 10. Minimum is 0, maximum is 50.
- **offset** (integer) - Optional - The starting index for pagination. Default is 0. Minimum is 0, maximum is 100000.
- **sortBy** (string) - Optional - The sort criteria. Enum: REALIZEDPNL, TITLE, PRICE, AVGPRICE, TIMESTAMP. Default is REALIZEDPNL.
- **sortDirection** (string) - Optional - The sort direction. Enum: ASC, DESC. Default is DESC.

### Request Example
```json
{
  "example": "GET /closed-positions?user=0x56687bf447db6ffa42ffe2204a05edaa20f55839&limit=20&sortBy=TIMESTAMP"
}
```

### Response
#### Success Response (200)
- **proxyWallet** (Address) - The wallet address associated with the position.
- **asset** (string) - The asset of the market.
- **conditionId** (Hash64) - The condition ID of the market.
- **avgPrice** (number) - The average price of the position.
- **totalBought** (number) - The total amount bought for the position.
- **realizedPnl** (number) - The realized profit or loss for the position.
- **curPrice** (number) - The current price of the asset.
- **timestamp** (integer) - The timestamp of the position event.
- **title** (string) - The title of the market.
- **slug** (string) - The slug of the market.
- **icon** (string) - The icon associated with the market.
- **eventSlug** (string) - The slug of the event.
- **outcome** (string) - The outcome of the market.
- **outcomeIndex** (integer) - The index of the outcome.
- **oppositeOutcome** (string) - The opposite outcome of the market.
- **oppositeAsset** (string) - The opposite asset of the market.
- **endDate** (string) - The end date of the market.

#### Response Example
```json
{
  "example": [
    {
      "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
      "asset": "USDC",
      "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
      "avgPrice": 0.5,
      "totalBought": 100,
      "realizedPnl": 50,
      "curPrice": 0.75,
      "timestamp": 1678886400,
      "title": "Will ETH be above $2000 on March 31st?",
      "slug": "eth-above-2000-mar-31",
      "icon": "eth",
      "eventSlug": "eth-price-mar-31",
      "outcome": "YES",
      "outcomeIndex": 1,
      "oppositeOutcome": "NO",
      "oppositeAsset": "USDC",
      "endDate": "2023-03-31T00:00:00.000Z"
    }
  ]
}
```

#### Error Response (400, 401, 500)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "example": {
    "error": "Invalid parameter provided."
  }
}
```
```

--------------------------------

### Get Open Orders (TypeScript)

Source: https://docs.polymarket.com/trading/clients/builder

Retrieves all open orders associated with a builder. When called from a builder-configured client, it returns orders placed through the builder. Supports filtering by order ID, market, or asset ID.

```typescript
async getOpenOrders(
  params?: OpenOrderParams,
  only_first_page?: boolean,
): Promise<OpenOrder[]>
```

```typescript
// All open orders for this builder
const orders = await clobClient.getOpenOrders();

// Filtered by market
const marketOrders = await clobClient.getOpenOrders({
  market: "0xbd31dc8a...",
});
```

--------------------------------

### Get Trades - Polymarket CLOB API (OpenAPI)

Source: https://docs.polymarket.com/api-reference/trade/get-trades

Retrieves trades for the authenticated user from the Polymarket CLOB API. Supports filtering by various parameters such as trade ID, maker address, market, asset ID, and time range. Returns paginated results with cursor-based pagination. Requires readonly or level 2 API key authentication.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /trades:
    get:
      tags:
        - Trade
      summary: Get trades
      description: |
        Retrieves trades for the authenticated user. Returns paginated results.
        Requires readonly or level 2 API key authentication.
      operationId: getTrades
      parameters:
        - name: id
          in: query
          description: Trade ID to filter by specific trade
          required: false
          schema:
            type: string
          example: trade-123
        - name: maker_address
          in: query
          description: Maker address to filter trades
          required: true
          schema:
            type: string
            pattern: ^0x[a-fA-F0-9]{40}$
          example: '0x1234567890123456789012345678901234567890'
        - name: market
          in: query
          description: Market (condition ID) to filter trades
          required: false
          schema:
            type: string
            pattern: ^0x[a-fA-F0-9]{64}$
          example: '0x0000000000000000000000000000000000000000000000000000000000000001'
        - name: asset_id
          in: query
          description: Asset ID (token ID) to filter trades
          required: false
          schema:
            type: string
          example: >-
            15871154585880608648532107628464183779895785213830018178010423617714102767076
        - name: before
          in: query
          description: Filter trades before this Unix timestamp
          required: false
          schema:
            type: string
            pattern: ^\d+$
          example: '1700000000'
        - name: after
          in: query
          description: Filter trades after this Unix timestamp
          required: false
          schema:
            type: string
            pattern: ^\d+$
          example: '1600000000'
        - name: next_cursor
          in: query
          description: Cursor for pagination (base64 encoded offset)
          required: false
          schema:
            type: string
          example: MA==
      responses:
        '200':
          description: Successfully retrieved trades
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TradesResponse'
              examples:
                example:
                  summary: User trades response
                  value:
                    limit: 100
                    next_cursor: MTAw
                    count: 2
                    data:
                      - id: trade-123
                        taker_order_id: '0xabcdef1234567890abcdef1234567890abcdef12'
                        market: >-
                          0x0000000000000000000000000000000000000000000000000000000000000001
                        asset_id: >-
                          15871154585880608648532107628464183779895785213830018178010423617714102767076
                        side: BUY
                        size: '100000000'
                        fee_rate_bps: '30'
                        price: '0.5'
                        status: TRADE_STATUS_CONFIRMED
                        match_time: '1700000000'
                        last_update: '1700000000'
                        outcome: 'YES'
                        bucket_index: 0
                        owner: f4f247b7-4ac7-ff29-a152-04fda0a8755a
                        maker_address: '0x1234567890123456789012345678901234567890'
                        transaction_hash: >-
                          0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
                        trader_side: TAKER
                        maker_orders: []
        '400':
          description: Bad request - Invalid parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid trade params payload
        '401':
          description: Unauthorized - Invalid API key or authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Invalid API key
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

```

--------------------------------

### GET /series/{id}

Source: https://docs.polymarket.com/api-reference/series/get-series-by-id

Retrieves a specific series by its unique identifier. This endpoint is part of the Series management API.

```APIDOC
## GET /series/{id}

### Description
Retrieves a specific series by its unique identifier. This endpoint is part of the Series management API.

### Method
GET

### Endpoint
/series/{id}

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the series to retrieve.

#### Query Parameters
- **include_chat** (boolean) - Optional - Whether to include chat information in the response.

### Request Example
```json
{
  "example": "GET /series/123?include_chat=true"
}
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the series.
- **ticker** (string) - The ticker symbol for the series.
- **slug** (string) - A URL-friendly identifier for the series.
- **title** (string) - The title of the series.
- **subtitle** (string) - A subtitle for the series.
- **seriesType** (string) - The type of the series.
- **recurrence** (string) - The recurrence pattern of the series.
- **description** (string) - A detailed description of the series.
- **image** (string) - URL of the series image.
- **icon** (string) - URL of the series icon.
- **layout** (string) - The layout type for the series.
- **active** (boolean) - Indicates if the series is currently active.
- **closed** (boolean) - Indicates if the series is closed.
- **archived** (boolean) - Indicates if the series is archived.
- **new** (boolean) - Indicates if the series is new.
- **featured** (boolean) - Indicates if the series is featured.
- **restricted** (boolean) - Indicates if the series is restricted.
- **isTemplate** (boolean) - Indicates if the series is a template.
- **templateVariables** (boolean) - Indicates if the series has template variables.
- **publishedAt** (string) - The date and time the series was published.
- **createdBy** (string) - The identifier of the user who created the series.
- **updatedBy** (string) - The identifier of the user who last updated the series.
- **createdAt** (string) - The date and time the series was created.
- **updatedAt** (string) - The date and time the series was last updated.
- **commentsEnabled** (boolean) - Indicates if comments are enabled for the series.
- **competitive** (string) - Information about the competitive nature of the series.
- **volume24hr** (number) - Trading volume in the last 24 hours.
- **volume** (number) - Total trading volume.
- **liquidity** (number) - The liquidity of the series.
- **startDate** (string) - The start date of the series.
- **pythTokenID** (string) - The Pyth token ID associated with the series.
- **cgAssetName** (string) - The CoinGecko asset name for the series.
- **score** (integer) - A score associated with the series.
- **events** (array) - An array of events related to the series.
- **collections** (array) - An array of collections the series belongs to.
- **categories** (array) - An array of categories the series belongs to.
- **tags** (array) - An array of tags associated with the series.
- **commentCount** (integer) - The number of comments on the series.
- **chats** (array) - An array of chats related to the series.

#### Response Example
```json
{
  "example": {
    "id": "123",
    "ticker": "TSLA",
    "slug": "tesla-stock-market",
    "title": "Tesla Stock Price",
    "subtitle": "Predict the price of Tesla stock",
    "seriesType": "stock",
    "recurrence": "daily",
    "description": "A series tracking the daily price of Tesla stock.",
    "image": "https://example.com/images/tesla.png",
    "icon": "https://example.com/icons/tesla.png",
    "layout": "default",
    "active": true,
    "closed": false,
    "archived": false,
    "new": false,
    "featured": true,
    "restricted": false,
    "isTemplate": false,
    "templateVariables": false,
    "publishedAt": "2023-01-01T10:00:00Z",
    "createdBy": "user123",
    "updatedBy": "user456",
    "createdAt": "2023-01-01T09:00:00Z",
    "updatedAt": "2023-01-01T11:00:00Z",
    "commentsEnabled": true,
    "competitive": "high",
    "volume24hr": 1000000,
    "volume": 50000000,
    "liquidity": 200000,
    "startDate": "2023-01-01T00:00:00Z",
    "pythTokenID": "0xabc123",
    "cgAssetName": "tesla",
    "score": 95,
    "events": [],
    "collections": [],
    "categories": [],
    "tags": [],
    "commentCount": 50,
    "chats": []
  }
}
```

#### Error Response (404)
- **description**: Not found
```

--------------------------------

### Initialize Proxy Wallet Client (Python)

Source: https://docs.polymarket.com/trading/gasless

Initializes the RelayClient using the PROXY transaction type. This wallet type auto-deploys on the first transaction, simplifying the user experience.

```python
from py_builder_relayer_client.client import RelayClient

# client initialized with builder_config (see Client Setup above)
# No deploy needed - auto-deploys on first transaction
```

--------------------------------

### Get Quote for Deposit/Withdrawal (Bash)

Source: https://docs.polymarket.com/trading/bridge/quote

This snippet demonstrates how to request a quote for a deposit or withdrawal using cURL. It specifies the amount, token addresses, and chain IDs for the transaction. The response provides estimated checkout time, input/output values, and a detailed fee breakdown.

```bash
curl -X POST https://bridge.polymarket.com/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fromAmountBaseUnit": "10000000",
    "fromChainId": "137",
    "fromTokenAddress": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "recipientAddress": "0x17eC161f126e82A8ba337f4022d574DBEaFef575",
    "toChainId": "137",
    "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
  }'
```

--------------------------------

### Retrieve Trades with Polymarket SDK

Source: https://docs.polymarket.com/trading/orders/overview

Fetches trades from the Polymarket exchange. Supports retrieving all trades, filtering by market, and paginated results. Requires an initialized client instance.

```typescript
const trades = await client.getTrades();

const marketTrades = await client.getTrades({
  market: "0xbd31dc8a...",
});

const paginatedTrades = await client.getTradesPaginated({
  market: "0xbd31dc8a...",
});
```

```python
from py_clob_client.clob_types import TradeParams

trades = client.get_trades()

market_trades = client.get_trades(
    TradeParams(
        market="0xbd31dc8a...",
    )
)
```

--------------------------------

### Create Order API

Source: https://docs.polymarket.com/trading/clients/l1

Allows for the creation and local signing of limit orders without immediate submission to the CLOB. This is useful for pre-signing orders or implementing custom submission logic.

```APIDOC
## POST /websites/polymarket/createOrder

### Description
Create and sign a limit order locally without posting it to the CLOB. Use this when you want to sign orders in advance or implement custom submission logic. Submit via [`postOrder()`](/trading/clients/l2#postorder) or [`postOrders()`](/trading/clients/l2#postorders).

### Method
POST

### Endpoint
/websites/polymarket/createOrder

### Parameters
#### Request Body
- **userOrder** (UserOrder) - Required - Represents the user's order details.
- **options** (Partial<CreateOrderOptions>) - Optional - Additional options for order creation.

### Request Example
```json
{
  "userOrder": {
    "tokenID": "0x123...",
    "price": 1.50,
    "size": 10,
    "side": "BUY",
    "feeRateBps": 10,
    "nonce": 12345,
    "expiration": 1678886400,
    "taker": "0xabc...",
    "tickSize": "SMALLEST_UNIT",
    "negRisk": false
  },
  "options": {
    "tickSize": "SMALLEST_UNIT",
    "negRisk": false
  }
}
```

### Response
#### Success Response (200)
- **tokenID** (string) - The token ID of the market outcome to trade.
- **price** (number) - The limit price for the order.
- **size** (number) - The size (number of shares) for the order.
- **side** (Side) - The side of the order (buy or sell).
- **feeRateBps** (number) - Optional fee rate in basis points.
- **nonce** (number) - Optional nonce for the order.
- **expiration** (number) - Optional expiration timestamp for the order.
- **taker** (string) - Optional taker address for the order.
- **tickSize** (TickSize) - The tick size used for order validation.
- **negRisk** (boolean) - Optional flag for negative risk markets.
- **salt** (string) - A random salt value for the signed order.
- **maker** (string) - The maker's address.
- **signer** (string) - The signer's address.
- **taker** (string) - The taker's address in the signed order.
- **tokenId** (string) - The token ID in the signed order.
- **makerAmount** (string) - The maker amount as a string.
- **takerAmount** (string) - The taker amount as a string.
- **side** (number) - The side of the order as a number (0 = BUY, 1 = SELL).
- **expiration** (string) - The expiration timestamp as a string.
- **nonce** (string) - The nonce as a string.
- **feeRateBps** (string) - The fee rate in basis points as a string.
- **signatureType** (number) - The type identifier for the signature scheme used.
- **signature** (string) - The cryptographic signature of the order.

#### Response Example
```json
{
  "tokenID": "0x123...",
  "price": 1.50,
  "size": 10,
  "side": "BUY",
  "feeRateBps": 10,
  "nonce": 12345,
  "expiration": 1678886400,
  "taker": "0xabc...",
  "tickSize": "SMALLEST_UNIT",
  "negRisk": false,
  "salt": "0xrandomsalt",
  "maker": "0xmakeraddress",
  "signer": "0xsigneraddress",
  "tokenId": "0x123...",
  "makerAmount": "1500000000000000000",
  "takerAmount": "10000000000000000000",
  "side": 0,
  "expiration": "1678886400",
  "nonce": "12345",
  "feeRateBps": "10",
  "signatureType": 1,
  "signature": "0x...signature..."
}
```
```

--------------------------------

### POST /order

Source: https://docs.polymarket.com/api-reference/trade/post-a-new-order

Creates a new order in the order book. This endpoint allows users to post buy or sell orders with various parameters like amount, price, and expiration.

```APIDOC
## POST /order

### Description
Creates a new order in the order book.

### Method
POST

### Endpoint
/order

### Parameters
#### Request Body
- **order** (object) - Required - Details of the order to be sent.
  - **maker** (string) - Required - The maker's address.
  - **signer** (string) - Required - The signer's address.
  - **taker** (string) - Required - The taker's address.
  - **tokenId** (string) - Required - The token ID for the order.
  - **makerAmount** (string) - Required - The amount the maker is offering.
  - **takerAmount** (string) - Required - The amount the taker is offering.
  - **side** (string) - Required - The side of the order (BUY or SELL).
  - **expiration** (string) - Required - The expiration timestamp for the order.
  - **nonce** (string) - Required - The nonce for the order.
  - **feeRateBps** (string) - Required - The fee rate in basis points.
  - **signature** (string) - Required - The signature for the order.
  - **salt** (number) - Required - A salt value for the order.
  - **signatureType** (number) - Required - The type of signature.
- **owner** (string) - Required - The owner of the order.
- **orderType** (string) - Required - The type of order (e.g., GTC - Good 'Til Canceled).
- **deferExec** (boolean) - Required - Whether to defer execution.

### Request Example
```json
{
  "order": {
    "maker": "0x1234567890123456789012345678901234567890",
    "signer": "0x1234567890123456789012345678901234567890",
    "taker": "0x0000000000000000000000000000000000000000",
    "tokenId": "0xabc123def456...",
    "makerAmount": "100000000",
    "takerAmount": "200000000",
    "side": "BUY",
    "expiration": "1735689600",
    "nonce": "0",
    "feeRateBps": "30",
    "signature": "0x1234abcd...",
    "salt": 1234567890,
    "signatureType": 0
  },
  "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
  "orderType": "GTC",
  "deferExec": false
}
```

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the order was processed successfully.
- **orderID** (string) - The unique identifier for the order.
- **status** (string) - The current status of the order (e.g., 'live', 'matched', 'delayed').
- **makingAmount** (string) - The amount being made by the order.
- **takingAmount** (string) - The amount being taken by the order.
- **transactionsHashes** (array) - (Optional) Hashes of related transactions if the order was matched.
- **tradeIDs** (array) - (Optional) IDs of related trades if the order was matched.
- **errorMsg** (string) - An error message if applicable.

#### Response Example
```json
{
  "success": true,
  "orderID": "0xabcdef1234567890abcdef1234567890abcdef12",
  "status": "live",
  "makingAmount": "100000000",
  "takingAmount": "200000000",
  "errorMsg": ""
}
```

#### Error Response (400)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "error": "Invalid order payload"
}
```

#### Error Response (401)
- **error** (string) - A message describing the authentication error.

#### Error Response Example
```json
{
  "error": "Unauthorized - Invalid API key or authentication failed"
}
```
```

--------------------------------

### Server Implementation for Remote Signing (TypeScript)

Source: https://docs.polymarket.com/trading/orders/attribution

This TypeScript code demonstrates how to implement a server endpoint to handle signing requests for order attribution. It uses the `@polymarket/builder-signing-sdk` to generate HMAC signatures based on request details and builder credentials. The function `handleSignRequest` takes request parameters, generates a signature, and returns authentication headers.

```typescript
import {
  buildHmacSignature,
  BuilderApiKeyCreds,
} from "@polymarket/builder-signing-sdk";

const BUILDER_CREDENTIALS: BuilderApiKeyCreds = {
  key: process.env.POLY_BUILDER_API_KEY!,
  secret: process.env.POLY_BUILDER_SECRET!,
  passphrase: process.env.POLY_BUILDER_PASSPHRASE!,
};

// POST /sign - receives { method, path, body } from the client SDK
export async function handleSignRequest(request) {
  const { method, path, body } = await request.json();
  const timestamp = Date.now().toString();

  const signature = buildHmacSignature(
    BUILDER_CREDENTIALS.secret,
    parseInt(timestamp),
    method,
    path,
    body,
  );

  return {
    POLY_BUILDER_SIGNATURE: signature,
    POLY_BUILDER_TIMESTAMP: timestamp,
    POLY_BUILDER_API_KEY: BUILDER_CREDENTIALS.key,
    POLY_BUILDER_PASSPHRASE: BUILDER_CREDENTIALS.passphrase,
  };
}
```

--------------------------------

### GET /comments

Source: https://docs.polymarket.com/api-reference/comments/list-comments

Retrieves a list of comments. This endpoint supports filtering by parent entity type and ID, as well as pagination and sorting options.

```APIDOC
## GET /comments

### Description
Retrieves a list of comments. This endpoint supports filtering by parent entity type and ID, as well as pagination and sorting options.

### Method
GET

### Endpoint
/comments

### Parameters
#### Query Parameters
- **limit** (integer) - Optional - Maximum number of comments to return.
- **offset** (integer) - Optional - Number of comments to skip before starting to collect the result set.
- **order** (string) - Optional - Comma-separated list of fields to order by.
- **ascending** (boolean) - Optional - Whether to sort in ascending order.
- **parent_entity_type** (string) - Optional - Type of the parent entity (e.g., 'Event', 'Series', 'market').
- **parent_entity_id** (integer) - Optional - ID of the parent entity.
- **get_positions** (boolean) - Optional - Whether to include user positions in the comments.
- **holders_only** (boolean) - Optional - Whether to only return comments from holders.

### Request Example
```json
{
  "example": "GET /comments?limit=10&parent_entity_type=market&parent_entity_id=123"
}
```

### Response
#### Success Response (200)
- **Comment** (object) - An array of comment objects.

#### Response Example
```json
{
  "example": [
    {
      "id": "string",
      "body": "string",
      "parentEntityType": "string",
      "parentEntityID": 123,
      "parentCommentID": "string",
      "userAddress": "string",
      "replyAddress": "string",
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T10:00:00Z",
      "profile": { ... },
      "reactions": [ ... ],
      "reportCount": 0,
      "reactionCount": 0
    }
  ]
}
```
```

--------------------------------

### Get Current Prices for Multiple Tokens (TypeScript)

Source: https://docs.polymarket.com/trading/clients/public

Retrieves the current best buy and sell prices for a list of token IDs. It takes an array of BookParams objects and returns a PricesResponse object mapping token IDs to their prices.

```typescript
async getPrices(params: BookParams[]): Promise<PricesResponse>
```

--------------------------------

### Get Last Trade Prices (OpenAPI Specification)

Source: https://docs.polymarket.com/api-reference/market-data/get-last-trade-prices-query-parameters

This OpenAPI specification defines the 'get /last-trades-prices' endpoint for the Polymarket CLOB API. It allows fetching the last trade prices for multiple token IDs using query parameters, with a maximum of 500 token IDs per request. The response includes token ID, price, and side (BUY/SELL). Error responses are provided for invalid payloads or exceeding the limit.

```yaml
openapi: 3.1.0
info:
  title: Polymarket CLOB API
  description: Polymarket CLOB API Reference
  license:
    name: MIT
    identifier: MIT
  version: 1.0.0
servers:
  - url: https://clob.polymarket.com
    description: Production CLOB API
  - url: https://clob-staging.polymarket.com
    description: Staging CLOB API
security: []
tags:
  - name: Trade
    description: Trade endpoints
  - name: Markets
    description: Market data endpoints
  - name: Account
    description: Account and authentication endpoints
  - name: Notifications
    description: User notification endpoints
  - name: Rewards
    description: Rewards and earnings endpoints
paths:
  /last-trades-prices:
    get:
      tags:
        - Market Data
      summary: Get last trade prices (query parameters)
      description: >
        Retrieves last trade prices for multiple token IDs using query
        parameters.

        Maximum 500 token IDs can be requested per call.
      operationId: getLastTradesPricesGet
      parameters:
        - name: token_ids
          in: query
          description: Comma-separated list of token IDs (max 500)
          required: true
          schema:
            type: string
          example: 0xabc123...,0xdef456...
      responses:
        '200':
          description: Successfully retrieved last trade prices
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  required:
                    - token_id
                    - price
                    - side
                  properties:
                    token_id:
                      type: string
                      description: Token ID (asset ID)
                      example: 0xabc123def456...
                    price:
                      type: string
                      description: Last trade price
                      example: '0.45'
                    side:
                      type: string
                      description: Last trade side (BUY or SELL)
                      enum:
                        - BUY
                        - SELL
                      example: BUY
              example: 
                - token_id: 0xabc123def456...
                  price: '0.45'
                  side: BUY
                - token_id: 0xdef456abc123...
                  price: '0.52'
                  side: SELL
        '400':
          description: Bad request - Invalid payload or exceeds limit
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                invalid_payload:
                  summary: Invalid payload
                  value:
                    error: Invalid payload
                exceeds_limit:
                  summary: Payload exceeds limit
                  value:
                    error: Payload exceeds the limit
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Internal server error
      security: []
components:
  schemas:
    ErrorResponse:
      type: object
      required:
        - error
      properties:
        error:
          type: string
          description: Error message

```

--------------------------------

### GET /order/{orderID}

Source: https://docs.polymarket.com/api-reference/trade/get-single-order-by-id

Retrieves a specific order by its ID (order hash) for the authenticated user. Builder-authenticated clients can also use this endpoint to retrieve orders attributed to their builder account.

```APIDOC
## GET /order/{orderID}

### Description
Retrieves a specific order by its ID (order hash) for the authenticated user. Builder-authenticated clients can also use this endpoint to retrieve orders attributed to their builder account.

### Method
GET

### Endpoint
/order/{orderID}

#### Path Parameters
- **orderID** (string) - Required - Order ID (order hash)

### Request Example
(No request body for GET requests)

### Response
#### Success Response (200)
- **id** (string) - Order ID (order hash)
- **status** (string) - Order status
- **owner** (string) - UUID of the order owner
- **maker_address** (string) - Ethereum address of the maker
- **market** (string) - Market (condition ID)
- **asset_id** (string) - Asset ID (token ID)
- **side** (string) - BUY or SELL
- **original_size** (string) - The original size of the order
- **size_matched** (string) - The amount of the order that has been matched
- **price** (string) - The price of the order
- **outcome** (string) - The outcome the order is for (e.g., YES, NO)
- **expiration** (string) - The expiration timestamp of the order
- **order_type** (string) - The type of order (e.g., GTC - Good 'Til Canceled)
- **associate_trades** (array) - List of trades associated with this order
- **created_at** (string) - Timestamp when the order was created

#### Response Example
```json
{
  "id": "0xabcdef1234567890abcdef1234567890abcdef12",
  "status": "ORDER_STATUS_LIVE",
  "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
  "maker_address": "0x1234567890123456789012345678901234567890",
  "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
  "asset_id": "0xabc123def456...",
  "side": "BUY",
  "original_size": "100000000",
  "size_matched": "0",
  "price": "0.5",
  "outcome": "YES",
  "expiration": "1735689600",
  "order_type": "GTC",
  "associate_trades": [],
  "created_at": "1700000000"
}
```

#### Error Responses
- **400 Bad Request**: Invalid order ID
- **401 Unauthorized**: Invalid API key or authentication failed
- **404 Not Found**: Order not found
- **500 Internal Server Error**: Server error
```

--------------------------------

### Create and Sign Limit Order Locally (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l1

The `createOrder` function in TypeScript allows for the creation and signing of a limit order locally. It takes a `UserOrder` object, which includes details like `tokenID`, `price`, `size`, and `side`, along with optional `CreateOrderOptions` such as `feeRateBps`, `nonce`, `expiration`, `taker`, `tickSize`, `negRisk`, `salt`, `maker`, and `signer`. The function returns a `SignedOrder` containing the signed order details including `maker`, `signer`, `taker`, `tokenId`, `makerAmount`, `takerAmount`, `side`, `expiration`, `nonce`, `feeRateBps`, `signatureType`, and `signature`.

```typescript
async createOrder(
  userOrder: UserOrder,
  options?: Partial<CreateOrderOptions>
): Promise<SignedOrder>
```

--------------------------------

### GET /fee-rate

Source: https://docs.polymarket.com/api-reference/market-data/get-fee-rate

Retrieves the base fee rate for a specific token ID. The fee rate can be provided either as a query parameter or as a path parameter.

```APIDOC
## GET /fee-rate

### Description
Retrieves the base fee rate for a specific token ID.

### Method
GET

### Endpoint
/fee-rate

### Parameters
#### Query Parameters
- **token_id** (string) - Optional - Token ID (asset ID)

### Request Example
```json
{
  "token_id": "0xabc123def456..."
}
```

### Response
#### Success Response (200)
- **base_fee** (integer) - Base fee in basis points

#### Response Example
```json
{
  "base_fee": 30
}
```

#### Error Response (400)
- **error** (string) - Error message

#### Response Example
```json
{
  "error": "Invalid token id"
}
```

#### Error Response (404)
- **error** (string) - Error message

#### Response Example
```json
{
  "error": "fee rate not found for market"
}
```

#### Error Response (500)
- **error** (string) - Error message

#### Response Example
```json
{
  "error": "Internal server error"
}
```
```

--------------------------------

### GET /live-volume

Source: https://docs.polymarket.com/api-reference/misc/get-live-volume-for-an-event

Fetches the live trading volume for a specified event. This endpoint requires an event ID and returns the total volume along with volume breakdowns for individual markets within the event.

```APIDOC
## GET /live-volume

### Description
Fetches the live trading volume for a specified event. This endpoint requires an event ID and returns the total volume along with volume breakdowns for individual markets within the event.

### Method
GET

### Endpoint
https://data-api.polymarket.com/live-volume

### Parameters
#### Query Parameters
- **id** (integer) - Required - The unique identifier for the event.

### Request Example
```json
{
  "example": "GET /live-volume?id=123"
}
```

### Response
#### Success Response (200)
- **total** (number) - The total live trading volume for the event.
- **markets** (array) - An array of market volumes, where each item contains:
  - **market** (string) - The 0x-prefixed 64-hex string identifier for the market.
  - **value** (number) - The live trading volume for that specific market.

#### Response Example
```json
{
  "example": {
    "total": 150000.75,
    "markets": [
      {
        "market": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
        "value": 120000.50
      },
      {
        "market": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "value": 30000.25
      }
    ]
  }
}
```

#### Error Response (400, 500)
- **error** (string) - A message describing the error.

#### Error Response Example
```json
{
  "example": {
    "error": "Invalid event ID provided."
  }
}
```
```

--------------------------------

### Fetch Market Data with Curl

Source: https://docs.polymarket.com/market-data/overview

Demonstrates how to fetch market data using a simple curl command. This endpoint requires no authentication and returns a list of events with a specified limit.

```bash
curl "https://gamma-api.polymarket.com/events?limit=5"
```

--------------------------------

### Get Single Order Details (TypeScript, Python)

Source: https://docs.polymarket.com/trading/orders/cancel

Retrieves the details of a specific order using its ID. The response includes order status and size matched information.

```typescript
const order = await client.getOrder("0xb816482a...");
console.log(order.status, order.size_matched);
```

```python
order = client.get_order("0xb816482a...")
print(order["status"], order["size_matched"])
```

--------------------------------

### Deposit Status Response Example (JSON)

Source: https://docs.polymarket.com/trading/bridge/status

This JSON object represents an active deposit transaction. It includes details about the source and destination chains and tokens, the current status of the transaction, the transaction hash (if completed), and the creation timestamp. The 'transactions' array can contain multiple objects if there are several active deposits.

```json
{
  "transactions": [
    {
      "fromChainId": "1",
      "fromTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "fromAmountBaseUnit": "1000000000",
      "toChainId": "137",
      "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "status": "COMPLETED",
      "txHash": "0xabc123...",
      "createdTimeMs": 1697875200000
    }
  ]
}
```

--------------------------------

### Events API

Source: https://docs.polymarket.com/api-reference/clob

Endpoints for retrieving information about events on Polymarket, including listing all events, getting a specific event by ID or slug, and fetching event tags.

```APIDOC
## GET /events

### Description
Lists all available events on Polymarket.

### Method
GET

### Endpoint
/events

### Parameters
None

### Request Example
None

### Response
#### Success Response (200)
- **events** (array) - A list of event objects.

#### Response Example
```json
{
  "events": [
    {
      "id": "event_id_1",
      "title": "Example Event 1",
      "slug": "example-event-1"
    },
    {
      "id": "event_id_2",
      "title": "Example Event 2",
      "slug": "example-event-2"
    }
  ]
}
```

## GET /events/{id}

### Description
Retrieves a specific event by its unique ID.

### Method
GET

### Endpoint
/events/{id}

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the event.

### Request Example
None

### Response
#### Success Response (200)
- **event** (object) - The event object.

#### Response Example
```json
{
  "event": {
    "id": "event_id_1",
    "title": "Example Event 1",
    "slug": "example-event-1"
  }
}
```

## GET /events/slug/{slug}

### Description
Retrieves a specific event by its slug.

### Method
GET

### Endpoint
/events/slug/{slug}

### Parameters
#### Path Parameters
- **slug** (string) - Required - The slug of the event.

### Request Example
None

### Response
#### Success Response (200)
- **event** (object) - The event object.

#### Response Example
```json
{
  "event": {
    "id": "event_id_1",
    "title": "Example Event 1",
    "slug": "example-event-1"
  }
}
```

## GET /events/{id}/tags

### Description
Retrieves the tags associated with a specific event.

### Method
GET

### Endpoint
/events/{id}/tags

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the event.

### Request Example
None

### Response
#### Success Response (200)
- **tags** (array) - A list of tag strings associated with the event.

#### Response Example
```json
{
  "tags": ["tag1", "tag2"]
}
```
```

--------------------------------

### Get Simplified Sampling Markets Paginated - TypeScript

Source: https://docs.polymarket.com/trading/clients/public

Fetches simplified market data for markets eligible for sampling or liquidity rewards, paginated. This provides a faster way to access essential data for reward-eligible markets.

```typescript
async getSamplingSimplifiedMarkets(): Promise<PaginationPayload>
```

--------------------------------

### Create API Key (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l1

Creates a new API key (L2 credentials) for the wallet signer. Note that each wallet can only have one active API key; creating a new one invalidates the previous one. An optional nonce can be provided for deterministic key generation.

```typescript
async createApiKey(nonce?: number): Promise<ApiKeyCreds>
```

--------------------------------

### Initialize Polymarket Client with Local Signing (Python)

Source: https://docs.polymarket.com/trading/gasless

Initializes the Polymarket relayer client using local signing in Python. This approach is for backends managing transaction security. It relies on environment variables for private key and builder API credentials.

```python
import os
from py_builder_relayer_client.client import RelayClient
from py_builder_signing_sdk import BuilderConfig, BuilderApiKeyCreds

builder_config = BuilderConfig(
    local_builder_creds=BuilderApiKeyCreds(
        key=os.getenv("POLY_BUILDER_API_KEY"),
        secret=os.getenv("POLY_BUILDER_SECRET"),
        passphrase=os.getenv("POLY_BUILDER_PASSPHRASE"),
    )
)

client = RelayClient(
    "https://relayer-v2.polymarket.com",
    137,
    os.getenv("PRIVATE_KEY"),
    builder_config
)
```

--------------------------------

### EIP-712 Signing for Authentication

Source: https://docs.polymarket.com/api-reference/authentication

Examples of generating an EIP-712 signature for L1 authentication. This involves defining the domain, types, and values for the signature, and then signing the typed data. Requires a signer object and chain ID.

```typescript
const domain = {
  name: "ClobAuthDomain",
  version: "1",
  chainId: chainId, // Polygon Chain ID 137
};

const types = {
  ClobAuth: [
    { name: "address", type: "address" },
    { name: "timestamp", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "message", type: "string" },
  ],
};

const value = {
  address: signingAddress, // The Signing address
  timestamp: ts,            // The CLOB API server timestamp
  nonce: nonce,             // The nonce used
  message: "This message attests that I control the given wallet",
};

const sig = await signer._signTypedData(domain, types, value);
```

```python
domain = {
    "name": "ClobAuthDomain",
    "version": "1",
    "chainId": chainId,  # Polygon Chain ID 137
}

types = {
    "ClobAuth": [
        {"name": "address", "type": "address"},
        {"name": "timestamp", "type": "string"},
        {"name": "nonce", "type": "uint256"},
        {"name": "message", "type": "string"},
    ]
}

value = {
    "address": signingAddress,  # The signing address
    "timestamp": ts,            # The CLOB API server timestamp
    "nonce": nonce,             # The nonce used
    "message": "This message attests that I control the given wallet",
}

sig = signer.sign_typed_data(domain, types, value)
```

--------------------------------

### Get Trades API

Source: https://docs.polymarket.com/trading/orders/cancel

Retrieves a list of trades. Trades can be filtered by market or other parameters. For large result sets, use the paginated variant.

```APIDOC
## GET /trades

### Description
Retrieves a list of trades. Trades can be filtered by market or other parameters. For large result sets, use the paginated variant.

### Method
GET

### Endpoint
/trades

### Parameters
#### Query Parameters
- **market** (string) - Optional - Filter trades by market ID.
- **id** (string) - Optional - Filter trades by trade ID.
- **maker_address** (string) - Optional - Filter trades by maker address.
- **asset_id** (string) - Optional - Filter trades by asset ID.
- **before** (string) - Optional - Filter trades before a specific timestamp.
- **after** (string) - Optional - Filter trades after a specific timestamp.

### Request Example
```json
{
  "market": "0xbd31dc8a..."
}
```

### Response
#### Success Response (200)
- **trades** (Trade[]) - An array of Trade objects.
- **count** (number) - The total number of trades matching the query.

#### Response Example
```json
{
  "trades": [
    {
      "id": "string",
      "taker_order_id": "string",
      "market": "string",
      "asset_id": "string",
      "side": "string",
      "size": "string",
      "price": "string",
      "fee_rate_bps": "string",
      "status": "string",
      "match_time": "string",
      "last_update": "string",
      "outcome": "string",
      "maker_address": "string",
      "owner": "string",
      "transaction_hash": "string",
      "bucket_index": 0,
      "trader_side": "string",
      "maker_orders": [
        {
          "id": "string",
          "size": "string",
          "fee_rate_bps": "string"
        }
      ]
    }
  ],
  "count": 100
}
```
```

--------------------------------

### Get Position ID - Solidity

Source: https://docs.polymarket.com/trading/ctf/overview

Generates a unique identifier for a market position (ERC1155 token ID). It requires the collateral token address and the collection ID.

```solidity
function getPositionId(IERC20 collateralToken, bytes32 collectionId) public pure returns (uint256)
```

--------------------------------

### Initialize Safe Wallet Client (Python)

Source: https://docs.polymarket.com/trading/gasless

Initializes the RelayClient using the SAFE transaction type. This requires a separate deployment step before the first transaction.

```python
from py_builder_relayer_client.client import RelayClient

# client initialized with builder_config (see Client Setup above)

# Deploy before first transaction
response = client.deploy()
result = response.wait()
print("Safe Address:", result.get("proxyAddress"))
```

--------------------------------

### GET /trades

Source: https://docs.polymarket.com/api-reference/trade/get-trades

Retrieves trades for the authenticated user. Returns paginated results and supports filtering by various parameters such as trade ID, maker address, market, asset ID, and time range.

```APIDOC
## GET /trades

### Description
Retrieves trades for the authenticated user. Returns paginated results.
Requires readonly or level 2 API key authentication.

### Method
GET

### Endpoint
/trades

### Parameters
#### Query Parameters
- **id** (string) - Optional - Trade ID to filter by specific trade
- **maker_address** (string) - Required - Maker address to filter trades. Must be a valid Ethereum address (e.g., `0x1234567890123456789012345678901234567890`).
- **market** (string) - Optional - Market (condition ID) to filter trades. Must be a valid 64-character hexadecimal string (e.g., `0x0000000000000000000000000000000000000000000000000000000000000001`).
- **asset_id** (string) - Optional - Asset ID (token ID) to filter trades.
- **before** (string) - Optional - Filter trades before this Unix timestamp. Must be a string of digits (e.g., `1700000000`).
- **after** (string) - Optional - Filter trades after this Unix timestamp. Must be a string of digits (e.g., `1600000000`).
- **next_cursor** (string) - Optional - Cursor for pagination (base64 encoded offset).

### Request Example
```http
GET /trades?maker_address=0x1234567890123456789012345678901234567890&market=0x0000000000000000000000000000000000000000000000000000000000000001&limit=100
```

### Response
#### Success Response (200)
- **limit** (integer) - The number of items per page.
- **next_cursor** (string) - Cursor for the next page of results.
- **count** (integer) - The total number of trades returned.
- **data** (array) - An array of trade objects.
  - **id** (string) - Unique identifier for the trade.
  - **taker_order_id** (string) - The ID of the taker order.
  - **market** (string) - The market (condition ID) where the trade occurred.
  - **asset_id** (string) - The asset ID (token ID) involved in the trade.
  - **side** (string) - The side of the trade (e.g., BUY, SELL).
  - **size** (string) - The size of the trade.
  - **fee_rate_bps** (string) - The fee rate in basis points.
  - **price** (string) - The price of the trade.
  - **status** (string) - The status of the trade (e.g., TRADE_STATUS_CONFIRMED).
  - **match_time** (string) - The Unix timestamp when the trade was matched.
  - **last_update** (string) - The Unix timestamp of the last update.
  - **outcome** (string) - The outcome of the market for this trade (e.g., YES, NO).
  - **bucket_index** (integer) - The index of the bucket for the outcome.
  - **owner** (string) - The owner of the trade.
  - **maker_address** (string) - The maker's address.
  - **transaction_hash** (string) - The hash of the transaction associated with the trade.
  - **trader_side** (string) - The side the trader took in the trade (e.g., MAKER, TAKER).
  - **maker_orders** (array) - An array of maker orders.

#### Response Example (200 OK)
```json
{
  "limit": 100,
  "next_cursor": "MTAw",
  "count": 2,
  "data": [
    {
      "id": "trade-123",
      "taker_order_id": "0xabcdef1234567890abcdef1234567890abcdef12",
      "market": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "asset_id": "15871154585880608648532107628464183779895785213830018178010423617714102767076",
      "side": "BUY",
      "size": "100000000",
      "fee_rate_bps": "30",
      "price": "0.5",
      "status": "TRADE_STATUS_CONFIRMED",
      "match_time": "1700000000",
      "last_update": "1700000000",
      "outcome": "YES",
      "bucket_index": 0,
      "owner": "f4f247b7-4ac7-ff29-a152-04fda0a8755a",
      "maker_address": "0x1234567890123456789012345678901234567890",
      "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "trader_side": "TAKER",
      "maker_orders": []
    }
  ]
}
```

#### Error Response (400 Bad Request)
- **error** (string) - Description of the error.

#### Response Example (400 Bad Request)
```json
{
  "error": "Invalid trade params payload"
}
```

#### Error Response (401 Unauthorized)
- **error** (string) - Description of the error.

#### Response Example (401 Unauthorized)
```json
{
  "error": "Invalid API key"
}
```

#### Error Response (500 Internal Server Error)
(No specific schema provided for 500 error in the input)
```

--------------------------------

### Get Event Tags

Source: https://docs.polymarket.com/api-reference/events/get-event-tags

Retrieves a list of tags associated with a specific event. This endpoint is part of the Markets API and is used for event-related operations.

```APIDOC
## GET /events/{id}/tags

### Description
Fetches the tags associated with a specific event.

### Method
GET

### Endpoint
/events/{id}/tags

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the event.

### Request Example
```json
{
  "example": "No request body needed for GET request."
}
```

### Response
#### Success Response (200)
- **Array of Tag objects**: Each Tag object contains details like id, label, slug, and timestamps.
  - **id** (string) - The unique identifier of the tag.
  - **label** (string) - The display name of the tag.
  - **slug** (string) - A URL-friendly version of the tag label.
  - **forceShow** (boolean) - Indicates if the tag should always be shown.
  - **publishedAt** (string) - The timestamp when the tag was published.
  - **createdBy** (integer) - The ID of the user who created the tag.
  - **updatedBy** (integer) - The ID of the user who last updated the tag.
  - **createdAt** (string) - The timestamp when the tag was created.
  - **updatedAt** (string) - The timestamp when the tag was last updated.
  - **forceHide** (boolean) - Indicates if the tag should always be hidden.
  - **isCarousel** (boolean) - Indicates if the tag is displayed as a carousel.

#### Response Example
```json
{
  "example": [
    {
      "id": "tag123",
      "label": "Sports",
      "slug": "sports",
      "forceShow": false,
      "publishedAt": null,
      "createdBy": 1,
      "updatedBy": 1,
      "createdAt": "2023-10-27T10:00:00Z",
      "updatedAt": "2023-10-27T10:00:00Z",
      "forceHide": false,
      "isCarousel": false
    }
  ]
}
```

#### Error Response (404)
- **Description**: Not found.
```

--------------------------------

### Configure CLOB Client for Remote Signing (TypeScript, Python)

Source: https://docs.polymarket.com/trading/orders/attribution

Configure the CLOB client to point to a remote signing server. This involves setting up a BuilderConfig with remote signing details, including the server URL and an optional authentication token. The client is then initialized with this configuration.

```typescript
import { ClobClient } from "@polymarket/clob-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";

const builderConfig = new BuilderConfig({
  remoteBuilderConfig: {
    url: "https://your-server.com/sign",
    token: "optional-auth-token", // optional
  },
});

const client = new ClobClient(
  "https://clob.polymarket.com",
  137,
  signer,
  apiCreds,
  2, // signature type
  funderAddress,
  undefined,
  false,
  builderConfig,
);

// Orders automatically include builder headers
const response = await client.createAndPostOrder(/* ... */);
```

```python
from py_clob_client.client import ClobClient
from py_builder_signing_sdk import BuilderConfig, RemoteBuilderConfig

builder_config = BuilderConfig(
    remote_builder_config=RemoteBuilderConfig(
        url="https://your-server.com/sign",
        token="optional-auth-token",  # optional
    )
)

client = ClobClient(
    host="https://clob.polymarket.com",
    chain_id=137,
    key=private_key,
    creds=api_creds,
    signature_type=2,
    funder=funder_address,
    builder_config=builder_config
)

# Orders automatically include builder headers
response = client.create_and_post_order(...)
```

--------------------------------

### Get total value of a user's positions

Source: https://docs.polymarket.com/api-reference/core/get-total-value-of-a-users-positions

Fetches the total value of a user's positions across specified markets. Requires a user address and an array of market hashes.

```APIDOC
## GET /value

### Description
Retrieves the total value of a user's positions for a given set of markets.

### Method
GET

### Endpoint
/value

### Parameters
#### Query Parameters
- **user** (string) - Required - User Profile Address (0x-prefixed, 40 hex chars). Example: '0x56687bf447db6ffa42ffe2204a05edaa20f55839'
- **market** (array of strings) - Required - Array of market hashes (0x-prefixed, 64 hex chars). Example: ['0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917']

### Request Example
```json
{
  "example": "GET /value?user=0x56687bf447db6ffa42ffe2204a05edaa20f55839&market=0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917"
}
```

### Response
#### Success Response (200)
- **user** (string) - The user's address.
- **value** (number) - The total value of the user's positions.

#### Response Example
```json
{
  "example": [
    {
      "user": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
      "value": 123.45
    }
  ]
}
```

#### Error Response (400, 500)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "example": {
    "error": "Invalid user address format"
  }
}
```
```

--------------------------------

### Get Current Server Time (TypeScript)

Source: https://docs.polymarket.com/trading/clients/public

Fetches the current timestamp from the server. The returned value is a Unix timestamp in seconds, useful for synchronizing operations or logging.

```typescript
async getServerTime(): Promise<number>
```

--------------------------------

### Get Order Scoring Status

Source: https://docs.polymarket.com/api-reference/trade/get-order-scoring-status

Checks if a specific order is currently scoring for rewards. An order is considered 'scoring' if it meets all the criteria for earning maker rewards.

```APIDOC
## GET /orders/{orderId}/scoring-status

### Description
Checks if a specific order is currently scoring for rewards. An order is considered "scoring" if it meets all the criteria for earning maker rewards: the order is live on a rewards-eligible market, meets minimum size requirements, is within the valid spread range, and has been live for the required duration.

### Method
GET

### Endpoint
/orders/{orderId}/scoring-status

### Parameters
#### Path Parameters
- **orderId** (string) - Required - The unique identifier of the order.

### Response
#### Success Response (200)
- **isScoring** (boolean) - Indicates whether the order is currently scoring for rewards.

#### Response Example
```json
{
  "isScoring": true
}
```
```

--------------------------------

### Get Simplified Markets Paginated - TypeScript

Source: https://docs.polymarket.com/trading/clients/public

Fetches simplified market data for faster loading, paginated. The response includes a PaginationPayload with SimplifiedMarket objects, which contain essential order and token information. Ideal for scenarios where full market details are not required.

```typescript
async getSimplifiedMarkets(): Promise<PaginationPayload>
```

--------------------------------

### Get All Open Orders (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l2

Fetches a list of all currently open orders for the user. This function can optionally accept parameters to filter the results by order ID, market, or asset ID, and a boolean to only retrieve the first page of results. It returns an array of OpenOrder objects.

```typescript
async getOpenOrders(
  params?: OpenOrderParams,
  only_first_page?: boolean,
): Promise<OpenOrder[]>
```

--------------------------------

### Create and Sign Market Order (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l1

The `createMarketOrder` function allows users to generate and sign a market order locally. This function takes a `UserMarketOrder` object and optional `CreateOrderOptions` as input, returning a `SignedOrder`. It is crucial for preparing orders before submission via `postOrder()` or `postOrders()`.

```typescript
async createMarketOrder(
  userMarketOrder: UserMarketOrder,
  options?: Partial<CreateOrderOptions>
): Promise<SignedOrder>
```

--------------------------------

### Get daily builder volume time-series

Source: https://docs.polymarket.com/api-reference/builders/get-daily-builder-volume-time-series

Fetches a time-series of daily trading volume for builders. You can specify the time period for the records.

```APIDOC
## GET /v1/builders/volume

### Description
Fetches a time-series of daily trading volume for builders. You can specify the time period for the records.

### Method
GET

### Endpoint
/v1/builders/volume

### Parameters
#### Query Parameters
- **timePeriod** (string) - Optional - The time period to fetch daily records for. Allowed values: DAY, WEEK, MONTH, ALL. Defaults to DAY.

### Response
#### Success Response (200)
- **dt** (string) - The timestamp for this volume entry in ISO 8601 format.
- **builder** (string) - The builder name or identifier.
- **builderLogo** (string) - URL to the builder's logo image.
- **verified** (boolean) - Whether the builder is verified.
- **volume** (number) - Trading volume for this builder on this date.
- **activeUsers** (integer) - Number of active users for this builder on this date.
- **rank** (string) - The rank position of the builder on this date

#### Response Example
```json
[
  {
    "dt": "2025-11-15T00:00:00Z",
    "builder": "ExampleBuilder",
    "builderLogo": "https://example.com/logo.png",
    "verified": true,
    "volume": 1500.75,
    "activeUsers": 120,
    "rank": "1"
  }
]
```

#### Error Response (400, 500)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "error": "Invalid timePeriod parameter"
}
```
```

--------------------------------

### Client Methods Overview

Source: https://docs.polymarket.com/trading/overview

An overview of the different client methods available for interacting with the Polymarket API, categorized by their functionality and authentication requirements.

```APIDOC
## Client Methods

<CardGroup cols={2}>
  <Card title="Public Methods" icon="globe" href="/trading/clients/public">
    Market data, orderbooks, prices, and spreads — no auth required.
  </Card>

  <Card title="L1 Methods" icon="key" href="/trading/clients/l1">
    Sign orders and derive API credentials with your private key.
  </Card>

  <Card title="L2 Methods" icon="lock" href="/trading/clients/l2">
    Place orders, cancel orders, query trades, and manage notifications.
  </Card>

  <Card title="Builder Methods" icon="hammer" href="/trading/clients/builder">
    Track attributed trades and manage builder credentials.
  </Card>
</CardGroup>
```

--------------------------------

### Get Order Details by ID using Builder Authentication (TypeScript)

Source: https://docs.polymarket.com/trading/clients/builder

Retrieves details for a specific order using its ID. When called with a builder-configured client, it automatically uses builder headers for authentication and returns orders attributed to the builder.

```typescript
const order = await clobClient.getOrder("0xb816482a...");
console.log(order);
```

--------------------------------

### Get Order Books for Multiple Token IDs - TypeScript

Source: https://docs.polymarket.com/trading/clients/public

Fetches order books for multiple token IDs simultaneously. It accepts an array of BookParams, each specifying a token ID and optionally a side. Returns an array of OrderBookSummary objects.

```typescript
async getOrderBooks(params: BookParams[]): Promise<OrderBookSummary[]>
```

--------------------------------

### Approve Token Spending (TypeScript)

Source: https://docs.polymarket.com/trading/gasless

Generates and executes a transaction to approve a specified contract (spender) to spend a certain amount of tokens (USDC in this example). It uses viem for encoding the function data and sets the amount to the maximum possible value.

```typescript
import { encodeFunctionData, maxUint256 } from "viem";

const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const CTF = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";

const approveTx = {
  to: USDC,
  data: encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "approve",
    args: [CTF, maxUint256],
  }),
  value: "0",
};

const response = await client.execute([approveTx], "Approve USDC.e for CTF");
await response.wait();
```

--------------------------------

### Get Supported Assets

Source: https://docs.polymarket.com/trading/bridge/supported-assets

Retrieve the full list of supported chains and tokens, including their minimum deposit amounts. This endpoint is crucial for understanding deposit requirements before initiating a transaction.

```APIDOC
## GET /supported-assets

### Description
Retrieve the full list of supported chains and tokens with their minimum deposit amounts. This endpoint provides essential information for users planning to deposit assets to Polymarket.

### Method
GET

### Endpoint
https://bridge.polymarket.com/supported-assets

### Parameters
#### Query Parameters
None

### Request Example
```bash
curl https://bridge.polymarket.com/supported-assets
```

### Response
#### Success Response (200)
- **chains** (array) - A list of supported blockchain networks.
  - **name** (string) - The name of the blockchain network.
  - **address_type** (string) - The type of address (e.g., EVM, SVM, BTC, TVM).
  - **min_deposit** (string) - The minimum deposit amount in USD.
  - **example_tokens** (array) - A list of example tokens supported on the chain.
- **minimum_amounts** (object) - An object detailing minimum deposit amounts for specific chains.
  - **ethereum** (string) - Minimum deposit for Ethereum.
  - **polygon** (string) - Minimum deposit for Polygon.
  - **arbitrum** (string) - Minimum deposit for Arbitrum.
  - **base** (string) - Minimum deposit for Base.
  - **optimism** (string) - Minimum deposit for Optimism.
  - **bnb_smart_chain** (string) - Minimum deposit for BNB Smart Chain.
  - **solana** (string) - Minimum deposit for Solana.
  - **bitcoin** (string) - Minimum deposit for Bitcoin.
  - **tron** (string) - Minimum deposit for Tron.
  - **hyperevm** (string) - Minimum deposit for HyperEVM.
  - **abstract** (string) - Minimum deposit for Abstract.
  - **monad** (string) - Minimum deposit for Monad.
  - **ethereal** (string) - Minimum deposit for Ethereal.
  - **katana** (string) - Minimum deposit for Katana.
  - **lighter** (string) - Minimum deposit for Lighter.

#### Response Example
```json
{
  "chains": [
    {
      "name": "Ethereum",
      "address_type": "EVM",
      "min_deposit": "$7",
      "example_tokens": ["ETH", "USDC", "USDT", "WBTC", "DAI", "LINK", "UNI", "AAVE"]
    },
    {
      "name": "Polygon",
      "address_type": "EVM",
      "min_deposit": "$2",
      "example_tokens": ["POL", "USDC", "USDT", "DAI", "WETH", "SAND"]
    }
    // ... other chains
  ],
  "minimum_amounts": {
    "ethereum": "$7",
    "polygon": "$2",
    "arbitrum": "$2",
    "base": "$2",
    "optimism": "$2",
    "bnb_smart_chain": "$2",
    "solana": "$2",
    "bitcoin": "$9",
    "tron": "$9",
    "hyperevm": "$2",
    "abstract": "$2",
    "monad": "$2",
    "ethereal": "$2",
    "katana": "$2",
    "lighter": "$2"
  }
}
```
```

--------------------------------

### Get Fee Rate in Basis Points (TypeScript)

Source: https://docs.polymarket.com/trading/clients/public

Fetches the fee rate in basis points for a given token ID. This is useful for understanding the transaction costs associated with trading that token.

```typescript
async getFeeRateBps(tokenID: string): Promise<number>
```

--------------------------------

### Submit Signed Order (TypeScript)

Source: https://docs.polymarket.com/trading/orders/create

Submits a pre-signed order to the CLOB.

```APIDOC
## POST /api/orders/submit

### Description
Submits a pre-signed order to the CLOB.

### Method
POST

### Endpoint
/api/orders/submit

### Parameters
#### Request Body
- **signedOrder** (object) - Required - The locally signed order object.
- **orderType** (string) - Required - The type of order (GTC, GTD, FOK, FAK).

### Request Example
```typescript
import { ClobClient, OrderType } from "@polymarket/clob-client";

const client = new ClobClient(/* ... */);
// Assume signedOrder is obtained from client.createOrder()
// const signedOrder = await client.createOrder(...);

const response = await client.postOrder(signedOrder, OrderType.GTC);

console.log("Order ID:", response.orderID);
console.log("Status:", response.status);
```

### Response
#### Success Response (200)
- **orderID** (string) - The ID of the submitted order.
- **status** (string) - The status of the order.

#### Response Example
```json
{
  "orderID": "some_order_id",
  "status": "submitted"
}
```
```

--------------------------------

### GET /markets/{id}/tags

Source: https://docs.polymarket.com/api-reference/markets/get-market-tags-by-id

Retrieves a list of tags associated with a specific market ID. This endpoint is part of the Markets and Tags API.

```APIDOC
## GET /markets/{id}/tags

### Description
Fetches the tags associated with a specific market ID.

### Method
GET

### Endpoint
/markets/{id}/tags

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the market.

### Request Example
(No request body for GET requests)

### Response
#### Success Response (200)
- **Array of Tag objects** - A list of tags attached to the market.
  - **id** (string) - The unique identifier of the tag.
  - **label** (string) - The display name of the tag (nullable).
  - **slug** (string) - A URL-friendly version of the tag name (nullable).
  - **forceShow** (boolean) - Indicates if the tag should always be shown (nullable).
  - **publishedAt** (string) - The timestamp when the tag was published (nullable).
  - **createdBy** (integer) - The ID of the user who created the tag (nullable).
  - **updatedBy** (integer) - The ID of the user who last updated the tag (nullable).
  - **createdAt** (string) - The timestamp when the tag was created (nullable).
  - **updatedAt** (string) - The timestamp when the tag was last updated (nullable).
  - **forceHide** (boolean) - Indicates if the tag should be hidden (nullable).
  - **isCarousel** (boolean) - Indicates if the tag is part of a carousel (nullable).

#### Response Example
```json
[
  {
    "id": "tag-123",
    "label": "Technology",
    "slug": "technology",
    "forceShow": false,
    "publishedAt": "2023-10-27T10:00:00Z",
    "createdBy": 1,
    "updatedBy": 1,
    "createdAt": "2023-10-27T09:00:00Z",
    "updatedAt": "2023-10-27T09:30:00Z",
    "forceHide": false,
    "isCarousel": true
  }
]
```

#### Error Response (404)
- **Not found** - Returned if the market ID does not exist.
```

--------------------------------

### Get Single Order by ID

Source: https://docs.polymarket.com/api-reference/trade/get-single-order-by-id

Retrieves a specific order by its ID (order hash) for the authenticated user. Builder-authenticated clients can also use this endpoint to retrieve orders attributed to their builder account.

```APIDOC
## GET /websites/polymarket/orders/{order_hash}

### Description
Retrieves a specific order by its ID (order hash) for the authenticated user. Builder-authenticated clients can also use this endpoint to retrieve orders attributed to their builder account.

### Method
GET

### Endpoint
/websites/polymarket/orders/{order_hash}

### Parameters
#### Path Parameters
- **order_hash** (string) - Required - The unique identifier (hash) of the order to retrieve.

#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **order_data** (object) - Contains the details of the requested order.

#### Response Example
```json
{
  "order_data": {
    "id": "0xabc123...",
    "market_id": "0xdef456...",
    "outcome": "yes",
    "amount": "100",
    "price": "0.5",
    "timestamp": "2023-10-27T10:00:00Z"
  }
}
```
```

--------------------------------

### Markets API

Source: https://docs.polymarket.com/api-reference/clob

Endpoints for retrieving information about markets on Polymarket, including listing markets, getting markets by ID or slug, and fetching market-related data like tags, holders, and volume.

```APIDOC
## GET /markets

### Description
Lists all available markets on Polymarket.

### Method
GET

### Endpoint
/markets

### Parameters
None

### Request Example
None

### Response
#### Success Response (200)
- **markets** (array) - A list of market objects.

#### Response Example
```json
{
  "markets": [
    {
      "id": "market_id_1",
      "title": "Example Market 1"
    },
    {
      "id": "market_id_2",
      "title": "Example Market 2"
    }
  ]
}
```

## GET /markets/{id}

### Description
Retrieves a specific market by its unique ID.

### Method
GET

### Endpoint
/markets/{id}

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the market.

### Request Example
None

### Response
#### Success Response (200)
- **market** (object) - The market object.

#### Response Example
```json
{
  "market": {
    "id": "market_id_1",
    "title": "Example Market 1"
  }
}
```

## GET /markets/slug/{slug}

### Description
Retrieves a specific market by its slug.

### Method
GET

### Endpoint
/markets/slug/{slug}

### Parameters
#### Path Parameters
- **slug** (string) - Required - The slug of the market.

### Request Example
None

### Response
#### Success Response (200)
- **market** (object) - The market object.

#### Response Example
```json
{
  "market": {
    "id": "market_id_1",
    "title": "Example Market 1"
  }
}
```

## GET /markets/{id}/tags

### Description
Retrieves the tags associated with a specific market.

### Method
GET

### Endpoint
/markets/{id}/tags

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the market.

### Request Example
None

### Response
#### Success Response (200)
- **tags** (array) - A list of tag strings associated with the market.

#### Response Example
```json
{
  "tags": ["tagA", "tagB"]
}
```

## GET /markets/{id}/top_holders

### Description
Retrieves the top holders for a specific market.

### Method
GET

### Endpoint
/markets/{id}/top_holders

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the market.

### Request Example
None

### Response
#### Success Response (200)
- **holders** (array) - A list of top holder objects.

#### Response Example
```json
{
  "holders": [
    {
      "address": "0x123...",
      "amount": "100"
    }
  ]
}
```

## GET /markets/{id}/open_interest

### Description
Retrieves the open interest for a specific market.

### Method
GET

### Endpoint
/markets/{id}/open_interest

### Parameters
#### Path Parameters
- **id** (string) - Required - The unique identifier of the market.

### Request Example
None

### Response
#### Success Response (200)
- **open_interest** (string) - The open interest value.

#### Response Example
```json
{
  "open_interest": "5000"
}
```

## GET /events/{eventId}/live_volume

### Description
Retrieves the live trading volume for a specific event.

### Method
GET

### Endpoint
/events/{eventId}/live_volume

### Parameters
#### Path Parameters
- **eventId** (string) - Required - The unique identifier of the event.

### Request Example
None

### Response
#### Success Response (200)
- **live_volume** (string) - The live volume value.

#### Response Example
```json
{
  "live_volume": "10000"
}
```
```

--------------------------------

### Create and Post Order (Negative Risk)

Source: https://docs.polymarket.com/trading/orders/overview

This endpoint is used to create and post orders, with a specific option `negRisk: true` required for multi-outcome markets.

```APIDOC
## POST /api/orders

### Description
Creates and posts an order to the exchange. For multi-outcome markets, the `negRisk` option must be set to `true`.

### Method
POST

### Endpoint
/api/orders

### Parameters
#### Query Parameters
- **tickSize** (string) - Required - The tick size for the order.
- **negRisk** (boolean) - Required - Set to `true` for multi-outcome markets.

#### Request Body
- **tokenID** (string) - Required - The ID of the token for the order.
- **price** (number) - Required - The price of the order.
- **size** (number) - Required - The size of the order.
- **side** (string) - Required - The side of the order (e.g., BUY, SELL).

### Request Example
```json
{
  "tokenID": "TOKEN_ID",
  "price": 0.5,
  "size": 10,
  "side": "BUY"
}
```

### Response
#### Success Response (200)
- **order** (object) - Details of the created order.

#### Response Example
```json
{
  "order": {
    "id": "ORDER_ID",
    "status": "OPEN"
  }
}
```
```

--------------------------------

### Get Sports Metadata

Source: https://docs.polymarket.com/api-reference/sports/get-sports-metadata-information

Fetches a list of sports metadata objects. Each object contains sport configuration details, visual assets, and related identifiers.

```APIDOC
## GET /sports

### Description
Fetches a list of sports metadata objects containing sport configuration details, visual assets, and related identifiers.

### Method
GET

### Endpoint
https://gamma-api.polymarket.com/sports

### Parameters
#### Query Parameters
None

#### Request Body
None

### Request Example
None

### Response
#### Success Response (200)
- **sports** (array) - A list of sports metadata objects.
  - **sport** (string) - The sport identifier or abbreviation.
  - **image** (string) - URL to the sport's logo or image asset.
  - **resolution** (string) - URL to the official resolution source for the sport.
  - **ordering** (string) - Preferred ordering for sport display.
  - **tags** (string) - Comma-separated list of tag IDs associated with the sport.
  - **series** (string) - Series identifier linking the sport to a specific tournament or season series.

#### Response Example
```json
[
  {
    "sport": "nfl",
    "image": "https://example.com/images/nfl.png",
    "resolution": "https://example.com/resolutions/nfl",
    "ordering": "home",
    "tags": "football,american",
    "series": "nfl-2023"
  }
]
```
```

--------------------------------

### Get Builder Trades (TypeScript)

Source: https://docs.polymarket.com/trading/clients/builder

Retrieves all trades attributed to a builder account, allowing tracking of trades routed through the platform. Supports filtering by trade ID, maker address, market, asset ID, and pagination using before/after cursors.

```typescript
async getBuilderTrades(
  params?: TradeParams,
): Promise<BuilderTradesPaginatedResponse>
```

--------------------------------

### POST /quote

Source: https://docs.polymarket.com/trading/bridge/quote

Preview fees and estimated output for deposits and withdrawals. Quotes include estimated output amounts, checkout time, and a detailed fee breakdown.

```APIDOC
## POST /quote

### Description
Get an estimated quote before executing a deposit or withdrawal. Quotes include estimated output amounts, checkout time, and a detailed fee breakdown.

### Method
POST

### Endpoint
https://bridge.polymarket.com/quote

### Parameters
#### Request Body
- **fromAmountBaseUnit** (string) - Required - Amount to send in base units (e.g., "10000000" for 10 USDC)
- **fromChainId** (string) - Required - Source chain ID (e.g., "137" for Polygon)
- **fromTokenAddress** (string) - Required - Token contract address on the source chain
- **recipientAddress** (string) - Required - Destination wallet address to receive funds
- **toChainId** (string) - Required - Destination chain ID
- **toTokenAddress** (string) - Required - Token contract address on the destination chain

### Request Example
```json
{
  "fromAmountBaseUnit": "10000000",
  "fromChainId": "137",
  "fromTokenAddress": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  "recipientAddress": "0x17eC161f126e82A8ba337f4022d574DBEaFef575",
  "toChainId": "137",
  "toTokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
}
```

### Response
#### Success Response (200)
- **estCheckoutTimeMs** (number) - Estimated checkout time in milliseconds
- **estInputUsd** (number) - Estimated input value in USD
- **estOutputUsd** (number) - Estimated output value in USD
- **estToTokenBaseUnit** (string) - Estimated output amount in base units
- **quoteId** (string) - Unique identifier for this quote
- **estFeeBreakdown** (object) - Detailed fee breakdown

##### Fee Breakdown Object
- **gasUsd** (number) - Gas fee in USD
- **appFeeLabel** (string) - Label of the app fee
- **appFeePercent** (number) - App fee as a percentage of the total amount
- **appFeeUsd** (number) - App fee in USD
- **fillCostPercent** (number) - Fill cost as a percentage of the total amount
- **fillCostUsd** (number) - Fill cost in USD
- **maxSlippage** (number) - Maximum potential slippage as a percentage
- **minReceived** (number) - Minimum amount received after slippage
- **swapImpact** (number) - Swap impact as a percentage of the total amount
- **swapImpactUsd** (number) - Swap impact in USD
- **totalImpact** (number) - Total impact as a percentage of the total amount
- **totalImpactUsd** (number) - Total impact cost in USD

#### Response Example
```json
{
  "estCheckoutTimeMs": 120000,
  "estInputUsd": 1000,
  "estOutputUsd": 995,
  "estToTokenBaseUnit": "995000000",
  "quoteId": "q_abc123xyz",
  "estFeeBreakdown": {
    "gasUsd": 0.5,
    "appFeeLabel": "Polymarket Fee",
    "appFeePercent": 0.1,
    "appFeeUsd": 1.0,
    "fillCostPercent": 0.05,
    "fillCostUsd": 0.5,
    "maxSlippage": 0.01,
    "minReceived": 993.05,
    "swapImpact": 0.02,
    "swapImpactUsd": 0.2,
    "totalImpact": 0.03,
    "totalImpactUsd": 0.7
  }
}
```

### Notes
Quotes are estimates. Actual amounts may vary slightly due to market conditions.
```

--------------------------------

### GET /getTradesPaginated

Source: https://docs.polymarket.com/trading/clients/l2

Retrieves trade history with pagination, suitable for handling large result sets. Returns a paginated response containing trades and pagination metadata.

```APIDOC
## GET /getTradesPaginated

### Description
Get trade history with pagination for large result sets.

### Method
GET

### Endpoint
/getTradesPaginated

### Parameters
#### Query Parameters
- **id** (string) - Optional - Filter by trade ID.
- **maker_address** (string) - Optional - Filter by maker address.
- **market** (string) - Optional - Filter by market condition ID.
- **asset_id** (string) - Optional - Filter by token ID.
- **before** (string) - Optional - Return trades before this timestamp.
- **after** (string) - Optional - Return trades after this timestamp.

### Response
#### Success Response (200)
- **trades** (Trade[]) - Array of trade objects for the current page.
- **limit** (number) - The maximum number of trades returned per page.
- **count** (number) - The total number of trades matching the query.

#### Response Example
{
  "trades": [
    {
      "id": "0x123abc",
      "taker_order_id": "0x456def",
      "market": "0x789ghi",
      "asset_id": "0xabc123",
      "side": "BUY",
      "size": "10.5",
      "fee_rate_bps": "100",
      "price": "0.5",
      "status": "FILLED",
      "match_time": "2023-10-27T10:00:00Z",
      "last_update": "2023-10-27T10:05:00Z",
      "outcome": "Yes",
      "bucket_index": 1,
      "owner": "user_api_key",
      "maker_address": "0xmakeraddress",
      "maker_orders": [
        {
          "order_id": "0xmakerorder1",
          "owner": "maker_api_key",
          "maker_address": "0xmakeraddress",
          "matched_amount": "5.0",
          "price": "0.5",
          "fee_rate_bps": "100",
          "asset_id": "0xabc123",
          "outcome": "Yes",
          "side": "SELL"
        }
      ],
      "transaction_hash": "0xtransactionhash",
      "trader_side": "TAKER"
    }
  ],
  "limit": 50,
  "count": 120
}
```

--------------------------------

### Get Tick Size (Python)

Source: https://docs.polymarket.com/trading/orders/create

Fetches the tick size associated with a specific token ID, defining the acceptable price granularity for orders. Adhering to this tick size is crucial for successful order placement.

```python
tick_size = client.get_tick_size("TOKEN_ID")
```

--------------------------------

### POST /spreads

Source: https://docs.polymarket.com/api-reference/market-data/get-spreads

Retrieves the spread for multiple token IDs. The spread is calculated as the difference between the best ask and best bid prices.

```APIDOC
## POST /spreads

### Description
Retrieves spreads for multiple token IDs. The spread is the difference between the best ask and best bid prices.

### Method
POST

### Endpoint
/spreads

### Parameters
#### Request Body
- **token_id** (string) - Required - Token ID (asset ID)
- **side** (string) - Optional - Order side (not used for midpoint calculation). Enum: BUY, SELL

### Request Example
```json
[
  {
    "token_id": "0xabc123def456..."
  },
  {
    "token_id": "0xdef456abc123..."
  }
]
```

### Response
#### Success Response (200)
- **(object)** - Map of token ID to spread. The value is a string representing the spread.

#### Response Example
```json
{
  "0xabc123def456...": "0.02",
  "0xdef456abc123...": "0.015"
}
```

#### Error Response (400)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "error": "Invalid payload"
}
```

#### Error Response (500)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "error": "error getting the spread"
}
```
```

--------------------------------

### Get Public Profile by Wallet Address

Source: https://docs.polymarket.com/api-reference/profiles/get-public-profile-by-wallet-address

Retrieves the public profile information associated with a given wallet address. This endpoint is useful for displaying user profiles and associated data.

```APIDOC
## GET /public-profile

### Description
Fetches the public profile information for a given wallet address. This includes details like creation date, profile image, bio, and associated user information.

### Method
GET

### Endpoint
https://gamma-api.polymarket.com/public-profile

### Parameters
#### Query Parameters
- **address** (string) - Required - The wallet address (proxy wallet or user address). Must follow the pattern `^0x[a-fA-F0-9]{40}$`.

### Request Example
```json
{
  "example": ""
}
```

### Response
#### Success Response (200)
- **createdAt** (string) - ISO 8601 timestamp of when the profile was created.
- **proxyWallet** (string) - The proxy wallet address.
- **profileImage** (string) - URL to the profile image.
- **displayUsernamePublic** (boolean) - Whether the username is displayed publicly.
- **bio** (string) - Profile bio.
- **pseudonym** (string) - Auto-generated pseudonym.
- **name** (string) - User-chosen display name.
- **users** (array) - Array of associated user objects.
- **xUsername** (string) - X (Twitter) username.
- **verifiedBadge** (boolean) - Whether the profile has a verified badge.

#### Response Example
```json
{
  "createdAt": "2023-01-01T12:00:00Z",
  "proxyWallet": "0x123...",
  "profileImage": "https://example.com/image.jpg",
  "displayUsernamePublic": true,
  "bio": "This is a sample bio.",
  "pseudonym": "user123",
  "name": "John Doe",
  "users": [
    {
      "id": "user-id-1",
      "creator": true,
      "mod": false
    }
  ],
  "xUsername": "johndoe",
  "verifiedBadge": true
}
```

#### Error Response (400)
- **type** (string) - Error type classification (e.g., "validation error").
- **error** (string) - Error message (e.g., "invalid address").

#### Error Response (404)
- **type** (string) - Error type classification (e.g., "not found error").
- **error** (string) - Error message (e.g., "profile not found").
```

--------------------------------

### Initialize Proxy Wallet Client (TypeScript)

Source: https://docs.polymarket.com/trading/gasless

Initializes the RelayClient using the PROXY transaction type. This wallet type auto-deploys on the first transaction, simplifying the user experience.

```typescript
import { RelayClient, RelayerTxType } from "@polymarket/builder-relayer-client";

const client = new RelayClient(
  "https://relayer-v2.polymarket.com/",
  137,
  wallet,
  builderConfig,
  RelayerTxType.PROXY,
);

// No deploy needed - auto-deploys on first transaction
```

--------------------------------

### GET /markets/slug/{slug}

Source: https://docs.polymarket.com/api-reference/markets/get-market-by-slug

Retrieves a specific market by its unique slug. This endpoint is useful for fetching detailed information about a particular market, including its question, outcomes, liquidity, and status.

```APIDOC
## GET /markets/slug/{slug}

### Description
Retrieves a specific market by its unique slug. This endpoint is useful for fetching detailed information about a particular market, including its question, outcomes, liquidity, and status.

### Method
GET

### Endpoint
/markets/slug/{slug}

### Parameters
#### Path Parameters
- **slug** (string) - Required - The unique slug of the market to retrieve.

#### Query Parameters
- **include_tag** (boolean) - Optional - Whether to include tag information in the response.

### Request Example
```bash
GET /markets/slug/example-market-slug?include_tag=true
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the market.
- **question** (string) - The question posed by the market.
- **conditionId** (string) - The ID of the market's condition.
- **slug** (string) - The unique slug of the market.
- **twitterCardImage** (string) - URL for the Twitter card image.
- **resolutionSource** (string) - The source for market resolution.
- **endDate** (string) - The end date of the market (ISO 8601 format).
- **category** (string) - The category the market belongs to.
- **ammType** (string) - The Automated Market Maker type used.
- **liquidity** (string) - The total liquidity of the market.
- **sponsorName** (string) - The name of the market sponsor.
- **sponsorImage** (string) - URL for the sponsor's image.
- **startDate** (string) - The start date of the market (ISO 8601 format).
- **xAxisValue** (string) - Value for the X-axis in charts.
- **yAxisValue** (string) - Value for the Y-axis in charts.
- **denominationToken** (string) - The token used for denomination.
- **fee** (string) - The fee associated with the market.
- **image** (string) - URL for the market's image.
- **icon** (string) - URL for the market's icon.
- **lowerBound** (string) - The lower bound of the market's range.
- **upperBound** (string) - The upper bound of the market's range.
- **description** (string) - A detailed description of the market.
- **outcomes** (string) - Information about the possible outcomes.
- **outcomePrices** (string) - The prices of the different outcomes.
- **volume** (string) - The trading volume of the market.
- **active** (boolean) - Indicates if the market is currently active.
- **marketType** (string) - The type of market (e.g., prediction, binary).
- **formatType** (string) - The format type of the market.
- **lowerBoundDate** (string) - The date for the lower bound.
- **upperBoundDate** (string) - The date for the upper bound.
- **closed** (boolean) - Indicates if the market has been closed.
- **marketMakerAddress** (string) - The address of the market maker.
- **createdBy** (integer) - The ID of the user who created the market.
- **updatedBy** (integer) - The ID of the user who last updated the market.
- **createdAt** (string) - The timestamp when the market was created (ISO 8601 format).
- **updatedAt** (string) - The timestamp when the market was last updated (ISO 8601 format).
- **closedTime** (string) - The timestamp when the market was closed.
- **wideFormat** (boolean) - Indicates if the market uses a wide format.
- **new** (boolean) - Indicates if the market is new.
- **mailchimpTag** (string) - Mailchimp tag associated with the market.
- **featured** (boolean) - Indicates if the market is featured.
- **archived** (boolean) - Indicates if the market is archived.
- **resolvedBy** (string) - The entity that resolved the market.
- **restricted** (boolean) - Indicates if the market is restricted.
- **marketGroup** (integer) - The ID of the market group.
- **groupItemTitle** (string) - The title of the group item.
- **groupItemThreshold** (string) - The threshold for the group item.

#### Response Example
```json
{
  "id": "mk_12345",
  "question": "Will Bitcoin reach $100,000 by December 31, 2024?",
  "conditionId": "cond_abcde",
  "slug": "bitcoin-100k-dec2024",
  "twitterCardImage": "https://gamma-api.polymarket.com/images/twitter/mk_12345.png",
  "resolutionSource": "CoinGecko",
  "endDate": "2024-12-31T23:59:59Z",
  "category": "Crypto",
  "ammType": "BAMM",
  "liquidity": "1000000.00",
  "sponsorName": "Polymarket",
  "sponsorImage": "https://gamma-api.polymarket.com/images/sponsors/polymarket.png",
  "startDate": "2024-01-01T00:00:00Z",
  "xAxisValue": "Date",
  "yAxisValue": "Price",
  "denominationToken": "USDC",
  "fee": "0.02",
  "image": "https://gamma-api.polymarket.com/images/mk_12345.png",
  "icon": "https://gamma-api.polymarket.com/icons/crypto.svg",
  "lowerBound": "0",
  "upperBound": "100000",
  "description": "A market to bet on whether Bitcoin will surpass $100,000 in value by the end of 2024.",
  "outcomes": "[\"Yes\", \"No\"]",
  "outcomePrices": "{\"Yes\": 0.5, \"No\": 0.5}",
  "volume": "500000.00",
  "active": true,
  "marketType": "binary",
  "formatType": "standard",
  "lowerBoundDate": null,
  "upperBoundDate": null,
  "closed": false,
  "marketMakerAddress": "0x123...abc",
  "createdBy": 1,
  "updatedBy": 1,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z",
  "closedTime": null,
  "wideFormat": false,
  "new": false,
  "mailchimpTag": "crypto-markets",
  "featured": true,
  "archived": false,
  "resolvedBy": null,
  "restricted": false,
  "marketGroup": 10,
  "groupItemTitle": "Major Crypto Bets",
  "groupItemThreshold": "50000"
}
```

#### Error Response (404)
- **description** (string) - "Not found"

```

--------------------------------

### Place Multiple Orders (Python)

Source: https://docs.polymarket.com/trading/orders/create

Enables submitting up to 15 orders concurrently via the CLOB client. This involves specifying order parameters like token ID, price, side, and size, along with the order type and market-specific settings such as tick size and negative risk.

```python
from py_clob_client.clob_types import OrderArgs, OrderType, PostOrdersArgs
from py_clob_client.order_builder.constants import BUY, SELL

response = client.post_orders([
    PostOrdersArgs(
        order=client.create_order(OrderArgs(
            price=0.48,
            size=500,
            side=BUY,
            token_id="TOKEN_ID",
        ), options={"tick_size": "0.01", "neg_risk": False}),
        orderType=OrderType.GTC,
    ),
    PostOrdersArgs(
        order=client.create_order(OrderArgs(
            price=0.52,
            size=500,
            side=SELL,
            token_id="TOKEN_ID",
        ), options={"tick_size": "0.01", "neg_risk": False}),
        orderType=OrderType.GTC,
    ),
])
```

--------------------------------

### Get Trader Leaderboard Rankings

Source: https://docs.polymarket.com/api-reference/core/get-trader-leaderboard-rankings

Fetches trader leaderboard rankings based on specified criteria such as category, time period, ordering, and pagination. You can also filter by a specific user's address or username.

```APIDOC
## GET /v1/leaderboard

### Description
Fetches trader leaderboard rankings. Allows filtering by market category, time period, ordering criteria (PNL or Volume), and pagination. Can also filter results for a specific user by their address or username.

### Method
GET

### Endpoint
/v1/leaderboard

### Parameters
#### Query Parameters
- **category** (string) - Optional - Market category for the leaderboard. Enum: OVERALL, POLITICS, SPORTS, CRYPTO, CULTURE, MENTIONS, WEATHER, ECONOMICS, TECH, FINANCE. Default: OVERALL.
- **timePeriod** (string) - Optional - Time period for leaderboard results. Enum: DAY, WEEK, MONTH, ALL. Default: DAY.
- **orderBy** (string) - Optional - Leaderboard ordering criteria. Enum: PNL, VOL. Default: PNL.
- **limit** (integer) - Optional - Max number of leaderboard traders to return. Minimum: 1, Maximum: 50. Default: 25.
- **offset** (integer) - Optional - Starting index for pagination. Minimum: 0, Maximum: 1000. Default: 0.
- **user** (string) - Optional - Limit leaderboard to a single user by address (0x-prefixed, 40 hex chars).
- **userName** (string) - Optional - Limit leaderboard to a single username.

### Response
#### Success Response (200)
- **rank** (string) - The rank position of the trader.
- **proxyWallet** (string) - User Profile Address (0x-prefixed, 40 hex chars).
- **userName** (string) - The trader's username.
- **vol** (number) - Trading volume for this trader.
- **pnl** (number) - Profit and loss for this trader.
- **profileImage** (string) - URL to the trader's profile image.
- **xUsername** (string) - The trader's X (Twitter) username.
- **verifiedBadge** (boolean) - Whether the trader has a verified badge.

#### Response Example
```json
[
  {
    "rank": "1",
    "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
    "userName": "TraderJoe",
    "vol": 100000.50,
    "pnl": 50000.75,
    "profileImage": "https://example.com/image.jpg",
    "xUsername": "@traderjoe",
    "verifiedBadge": true
  }
]
```

#### Error Response (400, 500)
- **error** (string) - Description of the error.

#### Error Response Example
```json
{
  "error": "Invalid category parameter"
}
```
```

--------------------------------

### Get Sampling Markets Paginated - TypeScript

Source: https://docs.polymarket.com/trading/clients/public

Retrieves markets that are eligible for sampling or liquidity rewards, with pagination. This function is specific to markets participating in reward programs.

```typescript
async getSamplingMarkets(): Promise<PaginationPayload>
```

--------------------------------

### Create and Post Limit Order (TypeScript)

Source: https://docs.polymarket.com/trading/clients/l2

A convenience method to create, sign, and post a limit order in a single call. Use this method when you need to buy or sell at a specific price. It requires user order details and optional parameters like fee rate and expiration.

```typescript
async createAndPostOrder(
  userOrder: UserOrder,
  options?: Partial<CreateOrderOptions>,
  orderType?: OrderType.GTC | OrderType.GTD, // Defaults to GTC
): Promise<OrderResponse>
```

--------------------------------

### Get Collection ID - Solidity

Source: https://docs.polymarket.com/trading/ctf/overview

Generates a unique identifier for a collection of outcomes. It takes the parent collection ID, the condition ID, and a bitmask representing the index set of outcomes.

```solidity
function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint indexSet) public pure returns (bytes32)
```

--------------------------------

### Get Live Volume for an Event (OpenAPI)

Source: https://docs.polymarket.com/api-reference/misc/get-live-volume-for-an-event

This OpenAPI specification defines the '/live-volume' endpoint for the Polymarket Data API. It allows clients to retrieve the live trading volume for a given event by providing an event ID. The response includes total volume and volume per market, along with error handling for bad requests and server errors.

```yaml
openapi: 3.0.3
info:
  title: Polymarket Data API
  version: 1.0.0
  description: >
    HTTP API for Polymarket data. This specification documents all public
    routes.
servers:
  - url: https://data-api.polymarket.com
    description: Relative server (same host)
security: []
tags:
  - name: Data API Status
    description: Data API health check
  - name: Core
  - name: Builders
  - name: Misc
paths:
  /live-volume:
    get:
      tags:
        - Misc
      summary: Get live volume for an event
      parameters:
        - in: query
          name: id
          required: true
          schema:
            type: integer
            minimum: 1
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/LiveVolume'
        '400':
          description: Bad Request
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: Server Error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
components:
  schemas:
    LiveVolume:
      type: object
      properties:
        total:
          type: number
        markets:
          type: array
          items:
            $ref: '#/components/schemas/MarketVolume'
    ErrorResponse:
      type: object
      properties:
        error:
          type: string
      required:
        - error
    MarketVolume:
      type: object
      properties:
        market:
          $ref: '#/components/schemas/Hash64'
        value:
          type: number
    Hash64:
      type: string
      description: 0x-prefixed 64-hex string
      pattern: '^0x[a-fA-F0-9]{64}$'
      example: '0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917'

```

--------------------------------

### Two-Sided Quoting

Source: https://docs.polymarket.com/market-makers/trading

Place a bid and an ask order around your fair value using the `createAndPostOrder` method. This is the core workflow for market making.

```APIDOC
## POST /clob/orders (createAndPostOrder)

### Description
Creates and posts a single order (bid or ask) to the CLOB.

### Method
POST

### Endpoint
/clob/orders

### Parameters
#### Path Parameters
None

#### Query Parameters
None

#### Request Body
- **tokenID** (string) - Required - The unique identifier for the market token.
- **side** (enum: BUY, SELL) - Required - The side of the order (bid or ask).
- **price** (number) - Required - The price at which to place the order.
- **size** (number) - Required - The quantity of the order.
- **orderType** (enum: GTC, GTD, FOK, FAK) - Required - The type of order.

### Request Example
```json
{
  "tokenID": "3409705850427531082723332342151729...",
  "side": "BUY",
  "price": 0.48,
  "size": 1000,
  "orderType": "GTC"
}
```

### Response
#### Success Response (200)
- **orderID** (string) - The unique identifier for the placed order.

#### Response Example
```json
{
  "orderID": "some_order_id"
}
```
```

--------------------------------

### GET /comments/{id}

Source: https://docs.polymarket.com/api-reference/comments/get-comments-by-comment-id

Retrieves comments associated with a specific comment ID. This endpoint allows fetching detailed comment information, including user profiles, reactions, and related metadata.

```APIDOC
## GET /comments/{id}

### Description
Retrieves comments by comment ID. This endpoint allows fetching detailed comment information, including user profiles, reactions, and related metadata.

### Method
GET

### Endpoint
/comments/{id}

### Parameters
#### Path Parameters
- **id** (integer) - Required - The unique identifier of the comment.

#### Query Parameters
- **get_positions** (boolean) - Optional - A flag to include position data in the response.

### Request Example
```json
{
  "example": "GET /comments/123?get_positions=true"
}
```

### Response
#### Success Response (200)
- **id** (string) - The unique identifier of the comment.
- **body** (string) - The content of the comment (nullable).
- **parentEntityType** (string) - The type of the parent entity the comment belongs to (nullable).
- **parentEntityID** (integer) - The ID of the parent entity (nullable).
- **parentCommentID** (string) - The ID of the parent comment if this is a reply (nullable).
- **userAddress** (string) - The blockchain address of the user who posted the comment (nullable).
- **replyAddress** (string) - The blockchain address of the user to whom this comment is a reply (nullable).
- **createdAt** (string) - The timestamp when the comment was created (nullable).
- **updatedAt** (string) - The timestamp when the comment was last updated (nullable).
- **profile** (object) - User profile information associated with the comment.
- **reactions** (array) - A list of reactions to the comment.
- **reportCount** (integer) - The number of reports for the comment (nullable).
- **reactionCount** (integer) - The total number of reactions to the comment (nullable).

#### Response Example
```json
{
  "example": [
    {
      "id": "123",
      "body": "This is a great comment!",
      "parentEntityType": "market",
      "parentEntityID": 456,
      "userAddress": "0x123...",
      "createdAt": "2023-10-27T10:00:00Z",
      "profile": {
        "name": "User1",
        "pseudonym": "Polly",
        "displayUsernamePublic": true,
        "isMod": false,
        "isCreator": false,
        "profileImage": "http://example.com/image.png"
      },
      "reactions": [],
      "reportCount": 0,
      "reactionCount": 5
    }
  ]
}
```
```

--------------------------------

### List Tags - OpenAPI Specification

Source: https://docs.polymarket.com/api-reference/tags/list-tags

This OpenAPI 3.0.3 specification defines the GET /tags endpoint for the Polymarket Gamma API. It allows listing tags with various query parameters for filtering and sorting, returning a list of Tag objects.

```yaml
openapi: 3.0.3
info:
  title: Markets API
  version: 1.0.0
  description: REST API specification for public endpoints used by the Markets service.
servers:
  - url: https://gamma-api.polymarket.com
    description: Polymarket Gamma API Production Server
security: []
tags:
  - name: Gamma Status
    description: Gamma API status and health check
  - name: Sports
    description: Sports-related endpoints including teams and game data
  - name: Tags
    description: Tag management and related tag operations
  - name: Events
    description: Event management and event-related operations
  - name: Markets
    description: Market data and market-related operations
  - name: Comments
    description: Comment system and user interactions
  - name: Series
    description: Series management and related operations
  - name: Profiles
    description: User profile management
  - name: Search
    description: Search functionality across different entity types
paths:
  /tags:
    get:
      tags:
        - Tags
      summary: List tags
      operationId: listTags
      parameters:
        - $ref: '#/components/parameters/limit'
        - $ref: '#/components/parameters/offset'
        - $ref: '#/components/parameters/order'
        - $ref: '#/components/parameters/ascending'
        - name: include_template
          in: query
          schema:
            type: boolean
        - name: is_carousel
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of tags
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Tag'
components:
  parameters:
    limit:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 0
    offset:
      name: offset
      in: query
      schema:
        type: integer
        minimum: 0
    order:
      name: order
      in: query
      schema:
        type: string
      description: Comma-separated list of fields to order by
    ascending:
      name: ascending
      in: query
      schema:
        type: boolean
  schemas:
    Tag:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
          nullable: true
        slug:
          type: string
          nullable: true
        forceShow:
          type: boolean
          nullable: true
        publishedAt:
          type: string
          nullable: true
        createdBy:
          type: integer
          nullable: true
        updatedBy:
          type: integer
          nullable: true
        createdAt:
          type: string
          format: date-time
          nullable: true
        updatedAt:
          type: string
          format: date-time
          nullable: true
        forceHide:
          type: boolean
          nullable: true
        isCarousel:
          type: boolean
          nullable: true

```

--------------------------------

### Get Spread for a Token (TypeScript)

Source: https://docs.polymarket.com/trading/clients/public

Calculates and returns the spread (difference between best ask and best bid) for a single token ID. It requires a tokenID string and returns the spread value as a string.

```typescript
async getSpread(tokenID: string): Promise<SpreadResponse>
```

--------------------------------

### Create Market Order

Source: https://docs.polymarket.com/trading/clients/l1

Creates and signs a market order locally without posting it to the CLOB. This order can then be submitted via `postOrder()` or `postOrders()`.

```APIDOC
## POST /websites/polymarket/createMarketOrder

### Description
Creates and signs a market order locally without posting it to the CLOB. Submit via [`postOrder()`](/trading/clients/l2#postorder) or [`postOrders()`](/trading/clients/l2#postorders).

### Method
POST

### Endpoint
/websites/polymarket/createMarketOrder

### Parameters
#### Request Body
- **userMarketOrder** (UserMarketOrder) - Required - The user's market order details.
- **options** (Partial<CreateOrderOptions>) - Optional - Additional options for creating the order.

### Request Example
```json
{
  "userMarketOrder": {
    "tokenID": "0x123...",
    "amount": 100,
    "side": "BUY",
    "price": 1.50,
    "feeRateBps": 10,
    "nonce": 12345,
    "taker": "0xabc...",
    "orderType": "FOK"
  },
  "options": {
    "taker": "0xdef..."
  }
}
```

### Response
#### Success Response (200)
- **SignedOrder** (object) - The signed order details.
  - **salt** (string) - A random salt value for the signed order.
  - **maker** (string) - The maker's address.
  - **signer** (string) - The signer's address.
  - **taker** (string) - The taker's address in the signed order.
  - **tokenId** (string) - The token ID in the signed order.
  - **makerAmount** (string) - The maker amount as a string.
  - **takerAmount** (string) - The taker amount as a string.
  - **side** (number) - The side of the order as a number (0 = BUY, 1 = SELL).
  - **expiration** (string) - The expiration timestamp as a string.
  - **nonce** (string) - The nonce as a string.
  - **feeRateBps** (string) - The fee rate in basis points as a string.
  - **signatureType** (number) - The type identifier for the signature scheme used.
  - **signature** (string) - The cryptographic signature of the order.

#### Response Example
```json
{
  "signedOrder": {
    "salt": "0xabcdef123456",
    "maker": "0x111...",
    "signer": "0x222...",
    "taker": "0x333...",
    "tokenId": "0x123...",
    "makerAmount": "100000000000000000000",
    "takerAmount": "150000000000000000000",
    "side": 0,
    "expiration": "1678886400",
    "nonce": "12345",
    "feeRateBps": "10",
    "signatureType": 2,
    "signature": "0x..."
  }
}
```
```