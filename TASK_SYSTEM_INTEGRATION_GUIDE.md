# VYBE Task System - Integration Guide

## Overview

This guide provides comprehensive documentation for integrating with VYBE's enhanced task system, which includes:

1. **Dynamic Prerequisite System** - Complex prerequisite validation with AND/OR logic
2. **Transaction-Based Tasks** - Tasks that require blockchain transactions with confirmation tracking
3. **Code Generation & Verification** - Unique code generation for task verification
4. **Twitter Verification** - Automated verification of tweets with code and video embed
5. **Telegram Integration** - Code verification for Telegram bot workflows

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)
- [Gateway Integration](#gateway-integration)
- [Telegram Bot Integration](#telegram-bot-integration)
- [Database Schema](#database-schema)
- [Code Examples](#code-examples)

---

## Architecture Overview

### New Entities

1. **TaskTransaction** - Tracks blockchain transactions for tasks
2. **UserCode** - Stores generated verification codes
3. **Task** (Enhanced) - Added fields:
   - `prerequisite_conditions` - Dynamic prerequisite logic
   - `requires_transaction` - Whether task needs transaction
   - `transaction_config` - Transaction requirements

### Services

1. **TaskTransactionService** - Transaction tracking and confirmation
2. **UserCodeService** - Code generation and verification
3. **TwitterVerificationService** - Twitter verification logic
4. **PrerequisiteValidatorService** - Complex prerequisite validation
5. **TelegramCodeVerificationService** - Telegram-specific code workflows

---

## API Endpoints

### Base URL
```
https://your-api.com/achievements
```

### 1. Transaction-Based Tasks

#### Submit Transaction Task
```http
POST /achievements/submit-transaction-task
```

**Request Body:**
```json
{
  "task_id": 1,
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA8...",
  "signature": "5wHu7QRv9C6n4R7K3Z8W2T6V...",
  "transaction_type": "TOKEN_SWAP",
  "transaction_config": {
    "amount": 10.5,
    "from_token": "So11111111111111111111111111111111111111112",
    "to_token": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  },
  "required_confirmations": 32
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userTask": {
      "id": 123,
      "status": "IN_PROGRESS",
      "task_id": 1,
      "user_id": 45
    },
    "transaction": {
      "id": 789,
      "signature": "5wHu7QRv9C6n4R7K3Z8W2T6V...",
      "status": "CONFIRMING",
      "confirmations": 0,
      "required_confirmations": 32
    }
  },
  "message": "Transaction task submitted. Waiting for confirmation..."
}
```

#### Check Transaction Status
```http
POST /achievements/check-transaction-status
```

**Request Body:**
```json
{
  "signature": "5wHu7QRv9C6n4R7K3Z8W2T6V..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "signature": "5wHu7QRv9C6n4R7K3Z8W2T6V...",
    "status": "CONFIRMED",
    "confirmations": 45,
    "required_confirmations": 32,
    "block_time": "2025-01-09T10:30:00Z",
    "transaction_metadata": {
      "slot": 123456789,
      "fee": 5000
    }
  }
}
```

### 2. Code Generation & Verification

#### Generate Code
```http
POST /achievements/generate-code
```

**Request Body:**
```json
{
  "publicKey": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA8...",
  "task_id": 1,
  "code_type": "TWITTER_EMBED",
  "metadata": {
    "video_url": "https://example.com/video.mp4",
    "required_platform": "twitter"
  },
  "expires_in_hours": 72
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "ABCD-EFGH-IJKL",
    "expires_at": "2025-01-12T10:30:00Z",
    "metadata": {
      "video_url": "https://example.com/video.mp4",
      "required_platform": "twitter"
    }
  },
  "message": "Code generated successfully"
}
```

#### Get My Codes
```http
GET /achievements/my-codes?publicKey=7xKXtg2CW87d97TXJSDpbD5jBkheTqA8...
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "ABCD-EFGH-IJKL",
      "code_type": "TWITTER_EMBED",
      "status": "ACTIVE",
      "expires_at": "2025-01-12T10:30:00Z",
      "task": {
        "id": 1,
        "title": "Tweet with Video Embed",
        "reward_points": 150
      }
    }
  ],
  "count": 1
}
```

#### Verify Twitter Code
```http
POST /achievements/verify-twitter-code
```

**Request Body:**
```json
{
  "code": "ABCD-EFGH-IJKL",
  "tweet_url": "https://twitter.com/user/status/123456789",
  "video_url": "https://example.com/video.mp4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "codeFound": true,
    "videoEmbedFound": true,
    "tweetUrl": "https://twitter.com/user/status/123456789",
    "message": "Tweet verified successfully"
  },
  "message": "Tweet verified successfully"
}
```

### 3. Prerequisite Validation

#### Check Prerequisites
```http
GET /achievements/check-prerequisites/1?publicKey=7xKXtg2CW87d97TXJSDpbD5jBkheTqA8...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "failedConditions": []
  },
  "message": "All prerequisites met"
}
```

**Failed Prerequisites Response:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "failedConditions": [
      "Must complete tasks: 1, 2",
      "Need 100 points (have 75)",
      "Wallet balance: Need 1 SOL (have 0.5)"
    ]
  },
  "message": "Some prerequisites are not met"
}
```

---

## Frontend Integration

### React/Next.js Example

```typescript
// lib/api/tasks.ts

const API_BASE_URL = 'https://your-api.com/achievements';

export async function generateTaskCode(
  publicKey: string,
  taskId: number,
  videoUrl?: string
) {
  const response = await fetch(`${API_BASE_URL}/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publicKey,
      task_id: taskId,
      code_type: 'TWITTER_EMBED',
      metadata: {
        video_url: videoUrl,
        required_platform: 'twitter',
      },
      expires_in_hours: 72,
    }),
  });

  return response.json();
}

export async function verifyTwitterCode(
  code: string,
  tweetUrl: string,
  videoUrl?: string
) {
  const response = await fetch(`${API_BASE_URL}/verify-twitter-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      tweet_url: tweetUrl,
      video_url: videoUrl,
    }),
  });

  return response.json();
}

export async function submitTransactionTask(
  publicKey: string,
  taskId: number,
  signature: string,
  transactionType: string,
  config?: any
) {
  const response = await fetch(`${API_BASE_URL}/submit-transaction-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task_id: taskId,
      publicKey,
      signature,
      transaction_type: transactionType,
      transaction_config: config,
      required_confirmations: 32,
    }),
  });

  return response.json();
}

export async function checkTransactionStatus(signature: string) {
  const response = await fetch(`${API_BASE_URL}/check-transaction-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      signature,
    }),
  });

  return response.json();
}
```

### React Component Example

```typescript
// components/TaskWithCode.tsx

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateTaskCode, verifyTwitterCode } from '@/lib/api/tasks';

export function TaskWithCode({ task }) {
  const { publicKey } = useWallet();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tweetUrl, setTweetUrl] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Generate code when component mounts
  useEffect(() => {
    if (publicKey && task.id) {
      handleGenerateCode();
    }
  }, [publicKey, task.id]);

  const handleGenerateCode = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const result = await generateTaskCode(
        publicKey.toString(),
        task.id,
        task.config?.video_url
      );

      if (result.success) {
        setCode(result.data.code);
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTweet = async () => {
    if (!code || !tweetUrl) return;

    setVerifying(true);
    try {
      const result = await verifyTwitterCode(
        code,
        tweetUrl,
        task.config?.video_url
      );

      if (result.success && result.data.verified) {
        alert('Tweet verified! Task completed!');
      } else {
        alert(`Verification failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>

      {loading ? (
        <p>Generating code...</p>
      ) : code ? (
        <div>
          <div className="code-display">
            <label>Your Code:</label>
            <code>{code}</code>
          </div>

          <div className="instructions">
            <p>Instructions:</p>
            <ol>
              <li>Copy the code above</li>
              <li>Create a tweet with the code</li>
              <li>Embed the video: {task.config?.video_url}</li>
              <li>Paste the tweet URL below</li>
            </ol>
          </div>

          <div className="verification">
            <input
              type="text"
              placeholder="https://twitter.com/user/status/..."
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
            />
            <button
              onClick={handleVerifyTweet}
              disabled={!tweetUrl || verifying}
            >
              {verifying ? 'Verifying...' : 'Verify Tweet'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleGenerateCode}>Generate Code</button>
      )}
    </div>
  );
}
```

### Transaction Task Component

```typescript
// components/TransactionTask.tsx

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { submitTransactionTask, checkTransactionStatus } from '@/lib/api/tasks';
import { Transaction, PublicKey } from '@solana/web3.js';

export function TransactionTask({ task }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const handleSubmitTransaction = async () => {
    if (!publicKey || !task.transaction_config) return;

    setSubmitting(true);
    try {
      // Build and send transaction
      // (Transaction building logic depends on task.transaction_type)
      const transaction = new Transaction();
      // ... add instructions based on task.transaction_config

      const sig = await sendTransaction(transaction, connection);
      setSignature(sig);

      // Submit to backend
      const result = await submitTransactionTask(
        publicKey.toString(),
        task.id,
        sig,
        task.transaction_config.transaction_type,
        task.transaction_config
      );

      if (result.success) {
        // Start polling for confirmation
        pollTransactionStatus(sig);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const pollTransactionStatus = async (sig: string) => {
    const interval = setInterval(async () => {
      const result = await checkTransactionStatus(sig);

      if (result.data.status === 'CONFIRMED') {
        clearInterval(interval);
        alert('Transaction confirmed! Task completed!');
      } else if (result.data.status === 'FAILED') {
        clearInterval(interval);
        alert('Transaction failed. Please try again.');
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  return (
    <div className="transaction-task">
      <h3>{task.title}</h3>
      <p>{task.description}</p>

      {task.transaction_config && (
        <div className="tx-requirements">
          <p>Requirements:</p>
          <ul>
            <li>Type: {task.transaction_config.transaction_type}</li>
            {task.transaction_config.min_amount && (
              <li>Min Amount: {task.transaction_config.min_amount}</li>
            )}
          </ul>
        </div>
      )}

      <button onClick={handleSubmitTransaction} disabled={submitting || !publicKey}>
        {submitting ? 'Processing...' : 'Complete Task'}
      </button>

      {signature && (
        <div className="tx-status">
          <p>Transaction submitted!</p>
          <p>Signature: {signature}</p>
          <p>Waiting for confirmation...</p>
        </div>
      )}
    </div>
  );
}
```

---

## Gateway Integration

If you're using an API gateway, configure the following routes:

### Gateway Configuration (Express.js Example)

```javascript
// gateway/routes/tasks.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

const MARKETPLACE_API = 'https://marketplace-backend.com/achievements';

// Proxy endpoints
router.post('/generate-code', async (req, res) => {
  try {
    const response = await axios.post(`${MARKETPLACE_API}/generate-code`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post('/verify-twitter-code', async (req, res) => {
  try {
    const response = await axios.post(`${MARKETPLACE_API}/verify-twitter-code`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post('/submit-transaction-task', async (req, res) => {
  try {
    const response = await axios.post(`${MARKETPLACE_API}/submit-transaction-task`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post('/check-transaction-status', async (req, res) => {
  try {
    const response = await axios.post(`${MARKETPLACE_API}/check-transaction-status`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
```

---

## Telegram Bot Integration

### Using TelegramCodeVerificationService

```typescript
// telegram-bot/services/task-service.ts

import { TelegramCodeVerificationService } from '@marketplace-backend/achievements';

export class TelegramTaskService {
  constructor(
    private readonly codeService: TelegramCodeVerificationService
  ) {}

  async handleStartTask(
    telegramUserId: string,
    publicKey: string,
    taskId: number
  ) {
    // Generate code for user
    const { code, expiresAt } = await this.codeService.generateCodeForTelegramUser(
      publicKey,
      taskId,
      telegramUserId,
      72 // expires in 72 hours
    );

    // Send message to user
    return {
      message: `
🎯 Task Started!

Your verification code: \`${code}\`

This code expires at: ${expiresAt.toLocaleString()}

Instructions:
1. Complete the task
2. Include this code in your submission
3. Send proof to verify
      `,
      code,
    };
  }

  async handleVerifySubmission(
    code: string,
    proofData: { tweet_url?: string; screenshot_url?: string }
  ) {
    // Verify code
    const result = await this.codeService.verifyCodeSubmission(code, proofData);

    if (result.valid) {
      return {
        success: true,
        message: '✅ Task verified! Points will be awarded shortly.',
        points: result.userCode?.task?.reward_points,
      };
    } else {
      return {
        success: false,
        message: `❌ Verification failed: ${result.message}`,
      };
    }
  }

  async handleCheckCode(publicKey: string, taskId: number) {
    // Get active code for user and task
    const codeInfo = await this.codeService.getActiveCodeForUserAndTask(
      publicKey,
      taskId
    );

    if (!codeInfo) {
      return {
        found: false,
        message: 'No active code found for this task.',
      };
    }

    return {
      found: true,
      code: codeInfo.code,
      expiresAt: codeInfo.expiresAt,
    };
  }
}
```

### Telegram Bot Handler Example

```typescript
// telegram-bot/handlers/task-handlers.ts

import TelegramBot from 'node-telegram-bot-api';
import { TelegramTaskService } from '../services/task-service';

export function registerTaskHandlers(
  bot: TelegramBot,
  taskService: TelegramTaskService
) {
  // Start task command
  bot.onText(/\/starttask (\d+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = parseInt(match![1]);
    const publicKey = match![2];
    const telegramUserId = msg.from?.id.toString();

    if (!telegramUserId) {
      bot.sendMessage(chatId, 'Error: Could not identify Telegram user');
      return;
    }

    try {
      const result = await taskService.handleStartTask(
        telegramUserId,
        publicKey,
        taskId
      );

      bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
    } catch (error) {
      bot.sendMessage(chatId, `Error: ${error.message}`);
    }
  });

  // Verify task command
  bot.onText(/\/verifytask (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const code = match![1];
    const proofUrl = match![2];

    try {
      const result = await taskService.handleVerifySubmission(code, {
        tweet_url: proofUrl,
      });

      bot.sendMessage(chatId, result.message);
    } catch (error) {
      bot.sendMessage(chatId, `Error: ${error.message}`);
    }
  });

  // Check code command
  bot.onText(/\/checkcode (\d+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const taskId = parseInt(match![1]);
    const publicKey = match![2];

    try {
      const result = await taskService.handleCheckCode(publicKey, taskId);

      if (result.found) {
        bot.sendMessage(
          chatId,
          `Your code: \`${result.code}\`\nExpires: ${result.expiresAt.toLocaleString()}`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(chatId, result.message);
      }
    } catch (error) {
      bot.sendMessage(chatId, `Error: ${error.message}`);
    }
  });
}
```

---

## Database Schema

### TaskTransaction

```sql
CREATE TABLE task_transactions (
  id SERIAL PRIMARY KEY,
  user_task_id INTEGER NOT NULL REFERENCES user_tasks(id),
  signature VARCHAR(255) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  transaction_config JSONB,
  transaction_metadata JSONB,
  confirmations INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 1,
  slot BIGINT,
  block_time TIMESTAMP,
  error_message TEXT,
  fee BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_transactions_signature ON task_transactions(signature);
CREATE INDEX idx_task_transactions_status ON task_transactions(status);
```

### UserCode

```sql
CREATE TABLE user_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  task_id INTEGER REFERENCES tasks(id),
  code VARCHAR(100) UNIQUE NOT NULL,
  code_type VARCHAR(50) DEFAULT 'TASK_VERIFICATION',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  metadata JSONB,
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  verification_result JSONB,
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_codes_code ON user_codes(code);
CREATE INDEX idx_user_codes_user_task ON user_codes(user_id, task_id);
```

### Task (Additional Fields)

```sql
ALTER TABLE tasks ADD COLUMN prerequisite_conditions JSONB;
ALTER TABLE tasks ADD COLUMN requires_transaction BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN transaction_config JSONB;
```

---

## Code Examples

### Creating a Task with Prerequisites

```typescript
// Create task with complex prerequisites

const taskData = {
  title: 'Advanced Trading Task',
  description: 'Complete a swap of at least 100 tokens',
  type: 'TOKEN_SWAP',
  reward_points: 500,
  requires_transaction: true,
  transaction_config: {
    transaction_type: 'TOKEN_SWAP',
    min_amount: 100,
    required_confirmations: 32,
  },
  prerequisite_conditions: {
    operator: 'AND',
    conditions: [
      { type: 'task_completed', task_ids: [1, 2, 3] },
      { type: 'min_points', points: 1000 },
      { type: 'wallet_balance', min_balance: 1 }, // 1 SOL minimum
      { type: 'nft_hold', collection_mint: 'DoJfRjtn...', min_amount: 1 },
    ],
  },
};

const response = await fetch('https://api.com/achievements/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(taskData),
});
```

### Full Workflow Example

```typescript
// Complete workflow: Generate code → User tweets → Verify → Auto-approve

// Step 1: Generate code
const codeResult = await generateTaskCode(userPublicKey, taskId);
const code = codeResult.data.code; // "ABCD-EFGH-IJKL"

// Step 2: User creates tweet with code and video embed
// (User does this manually on Twitter)

// Step 3: Verify tweet
const verifyResult = await verifyTwitterCode(
  code,
  'https://twitter.com/user/status/123456789',
  videoUrl
);

// Step 4: If verified, task is auto-completed
if (verifyResult.data.verified) {
  console.log('Task completed! Points awarded!');
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (user/task/code not found)
- `500` - Internal Server Error

---

## Best Practices

1. **Code Expiry**: Always set appropriate expiry times for codes (default: 72 hours)
2. **Transaction Confirmation**: For high-value tasks, require more confirmations (32+)
3. **Prerequisite Validation**: Always check prerequisites before allowing task start
4. **Error Handling**: Implement proper error handling for all API calls
5. **Polling**: When checking transaction status, use exponential backoff
6. **Security**: Never expose sensitive user data in frontend code

---

## Support

For questions or issues, please contact:
- Email: support@vybe.com
- Telegram: @vybe_support
- GitHub: https://github.com/vybe/marketplace-backend/issues

---

## Changelog

### Version 1.0.0 (2025-01-09)
- Initial release
- Dynamic prerequisite system
- Transaction-based tasks
- Code generation and verification
- Twitter verification
- Telegram integration
