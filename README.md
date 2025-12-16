# Wallet API

A simple wallet service built with NestJS, TypeScript, and PostgreSQL.

## Features

- Create wallets
- Fund wallets
- Transfer funds between wallets
- Fetch wallet details with transaction history
- Automatic database migrations (using TypeORM synchronize in development)

## Prerequisites

- Node.js (v18 or higher)
- Yarn package manager (or npm)
- PostgreSQL database (v12 or higher)

## Setup Instructions

1. **Install dependencies:**
```bash
yarn install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=wallet_db
PORT=3000
NODE_ENV=development
```

3. **Create the database:**
```sql
CREATE DATABASE wallet_db;
```

4. **Start PostgreSQL** (if not already running)

## Running the Application

```bash
# Development mode
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

**Note:** When the server starts, the application automatically creates and updates the database schema based on the entity definitions. No manual migration steps are required in development mode.

The API will be available at `http://localhost:3000`

## API Documentation

- **Swagger UI**: Once the application is running, visit `http://localhost:3000/api/v1/swagger` for interactive API documentation
- **Postman Collection**: [Import the Postman collection](https://app.getpostman.com/join-team?invite_code=9c32e0d22dc2e09dccf3f53a372e6356e258917b4cdcdc7bc9d28dc5eb7f5c36&target_code=81b473f8b9e34b07b52099de9b543c05)



## API Endpoints

### 1. Create Wallet
**POST** `/wallets`

Creates a new wallet with USD currency and zero balance.

**Request Body:**
```json
{
  "currency": "USD" // Optional, defaults to USD
}
```

**Response:**
```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Fund Wallet
**PUT** `/wallets/:id/fund`

Adds funds to a wallet.

**Request Body:**
```json
{
  "amount": 100.50
}
```

**Response:**
```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 100.50,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Transfer Between Wallets
**PUT** `/wallets/:id/transfer`

Transfers funds from one wallet to another.

**Request Body:**
```json
{
  "receiverWalletId": "receiver-uuid",
  "amount": 50.00
}
```

**Response:**
```json
{
  "sender": {
    "id": "sender-uuid",
    "currency": "USD",
    "balance": 50.50,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "receiver": {
    "id": "receiver-uuid",
    "currency": "USD",
    "balance": 50.00,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Get Wallet Details
**GET** `/wallets/:id`

Fetches wallet details including transaction history.

**Response:**
```json
{
  "id": "uuid",
  "currency": "USD",
  "balance": 100.50,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "transactions": [
    {
      "id": "transaction-uuid",
      "walletId": "wallet-uuid",
      "type": "FUND",
      "amount": 100.50,
      "relatedWalletId": null,
      "description": "Fund wallet with 100.5 USD",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Transaction Types

- `FUND`: Funds added to wallet
- `TRANSFER_OUT`: Funds transferred out of wallet
- `TRANSFER_IN`: Funds transferred into wallet

## Error Handling

The API returns appropriate HTTP status codes:
- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or business logic error (e.g., insufficient balance)
- `404 Not Found`: Wallet not found



## Testing

```bash
yarn test
```

## Assumptions

- Single PostgreSQL database instance
- In-memory idempotency (lost on restart, not suitable for multi-instance)
- Default currency is USD (no currency conversion)
- No authentication/authorization
- All operations are synchronous
- TypeORM auto-syncs schema in development mode

## Production Considerations

For production deployment, consider:
- Replacing in-memory idempotency with Redis
- Adding authentication and authorization
- Implementing database connection pooling
- Adding indexes on frequently queried columns
- Using proper database migrations instead of auto-sync
- Implementing pagination for transaction history
- Adding monitoring and logging

## License

MIT

