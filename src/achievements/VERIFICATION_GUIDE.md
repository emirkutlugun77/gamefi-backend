# Task Verification Guide

This guide explains how task verification works in the VYBE GameFi system and provides implementation guidance.

## Verification Methods

### 1. Automatic Verification
Tasks are verified automatically without manual intervention.

**Use Cases:**
- Wallet connections (verify on-chain)
- NFT holdings (check blockchain)
- Daily logins (track server-side)
- Quiz completions (validate answers)

**Implementation:**
```typescript
{
  "verification_config": {
    "method": "automatic",
    "api_endpoint": "/api/verify/nft/hold" // Optional custom endpoint
  }
}
```

### 2. Proof Required
User must submit proof (screenshot, URL, code, etc.) which is then automatically validated or queued for review.

**Use Cases:**
- Social media follows
- Likes and shares
- Comments
- Story posts

**Implementation:**
```typescript
{
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot" | "url" | "transaction_hash" | "code" | "text",
    "proof_instructions": "Screenshot showing you followed our account",
    "proof_required": true
  }
}
```

### 3. Semi-Automatic
Combines automatic checks with proof submission. System validates format/structure, then checks additional criteria.

**Use Cases:**
- Twitter posts with specific hashtags
- Instagram posts with mentions
- Comments with required keywords

**Implementation:**
```typescript
{
  "verification_config": {
    "method": "semi_automatic",
    "proof_type": "url",
    "api_endpoint": "/api/verify/twitter/tweet",
    "require_captcha": true
  }
}
```

### 4. Manual Review
Requires admin approval. Used for high-value or subjective tasks.

**Use Cases:**
- Content creation tasks
- Community contributions
- Special event entries

**Implementation:**
```typescript
{
  "verification_config": {
    "method": "manual",
    "require_admin_approval": true,
    "proof_type": "url",
    "proof_instructions": "Share the link to your content"
  }
}
```

## Anti-Fraud Measures

### CAPTCHA Protection
Prevent bot submissions:
```typescript
{
  "verification_config": {
    "require_captcha": true
  }
}
```

### Account Age Verification
Ensure genuine accounts (for social media tasks):
```typescript
{
  "verification_config": {
    "min_account_age_days": 30, // Account must be 30+ days old
    "min_followers": 50 // Minimum follower count
  }
}
```

### Suspicious Activity Detection
```typescript
{
  "verification_config": {
    "block_suspicious_accounts": true,
    "auto_reject_criteria": ["spam", "bot", "fake"]
  }
}
```

### Verification Delays
Prevent instant claims, allow for fraud detection:
```typescript
{
  "verification_config": {
    "verification_delay_hours": 24, // Wait 24h before reward
    "expires_after_hours": 72 // Submission expires after 72h
  }
}
```

## Verification Workflows

### Workflow 1: Twitter Follow (Proof-Based)
```
1. User clicks "Start Task"
2. User follows @VYBEofficial
3. User submits screenshot as proof
4. System validates screenshot format
5. Optional: OCR to verify username visible
6. Optional: Admin review if flagged
7. Reward granted
```

### Workflow 2: NFT Holding (Automatic)
```
1. User clicks "Start Task"
2. System queries blockchain for user's wallet
3. System checks if wallet holds required NFT
4. If yes → reward granted immediately
5. If no → task marked as failed
```

### Workflow 3: Quiz (Automatic)
```
1. User starts quiz
2. User answers questions
3. System validates answers against correct_answer_index
4. System calculates score
5. If score >= min_correct_answers → reward granted
6. If not → task can be retried (if repeatable)
```

### Workflow 4: Content Creation (Manual)
```
1. User creates content (tweet, video, etc.)
2. User submits URL as proof
3. System validates URL format
4. System checks basic requirements (hashtags, mentions)
5. Task queued for admin review
6. Admin reviews content quality
7. Admin approves/rejects
8. If approved → reward granted
```

### Workflow 5: Referral (Semi-Automatic + Delayed)
```
1. User shares referral link
2. Friends sign up via link
3. System tracks referrals automatically
4. System waits 24-48h (verification_delay_hours)
5. System checks if referred users are active
6. If requirements met → reward granted
```

## Verification Response Format

### Success Response
```typescript
{
  "verified": true,
  "points_awarded": 150,
  "verification_result": {
    "method": "automatic",
    "timestamp": "2025-01-15T10:30:00Z",
    "details": {
      "nft_count": 2,
      "collection": "VYBE_SUPERHEROES"
    }
  }
}
```

### Pending Review Response
```typescript
{
  "verified": false,
  "status": "pending_review",
  "message": "Your submission is under review. Please check back in 24 hours.",
  "verification_result": {
    "submitted_at": "2025-01-15T10:30:00Z",
    "review_deadline": "2025-01-16T10:30:00Z"
  }
}
```

### Failed Verification Response
```typescript
{
  "verified": false,
  "status": "rejected",
  "message": "Verification failed: Required hashtags not found",
  "verification_result": {
    "errors": [
      "Missing hashtag: #VYBE",
      "Missing hashtag: #Solana"
    ],
    "can_resubmit": true
  }
}
```

## API Integration Examples

### Example 1: Verifying Twitter Follow via Twitter API
```typescript
async verifyTwitterFollow(username: string, userId: string): Promise<boolean> {
  try {
    // Call Twitter API (requires Twitter API credentials)
    const response = await twitterClient.users.usersIdFollowing(userId, {
      'user.fields': ['username']
    });

    const following = response.data || [];
    return following.some(user => user.username === username.replace('@', ''));
  } catch (error) {
    console.error('Twitter verification failed:', error);
    return false;
  }
}
```

### Example 2: Verifying NFT Holding (Solana)
```typescript
async verifyNftHolding(
  walletAddress: string,
  collectionMint: string,
  minAmount: number
): Promise<boolean> {
  try {
    // Use DAS API to get user's NFTs
    const assets = await umi.rpc.getAssetsByOwner({
      owner: publicKey(walletAddress),
    });

    // Filter by collection
    const nftsInCollection = assets.items.filter(
      asset => asset.grouping?.some(
        g => g.group_key === 'collection' && g.group_value === collectionMint
      )
    );

    return nftsInCollection.length >= minAmount;
  } catch (error) {
    console.error('NFT verification failed:', error);
    return false;
  }
}
```

### Example 3: Verifying Telegram Join
```typescript
async verifyTelegramJoin(
  userId: string,
  channelUsername: string
): Promise<boolean> {
  try {
    // Use Telegram Bot API
    const chatMember = await bot.telegram.getChatMember(
      channelUsername,
      parseInt(userId)
    );

    return ['member', 'administrator', 'creator'].includes(chatMember.status);
  } catch (error) {
    console.error('Telegram verification failed:', error);
    return false;
  }
}
```

### Example 4: Verifying Discord Join
```typescript
async verifyDiscordJoin(
  userId: string,
  guildId: string
): Promise<boolean> {
  try {
    // Use Discord API
    const member = await discordClient.guilds.cache
      .get(guildId)
      ?.members.fetch(userId);

    return !!member;
  } catch (error) {
    console.error('Discord verification failed:', error);
    return false;
  }
}
```

## Best Practices

### 1. Choose the Right Verification Method
- **Low-value, high-volume tasks** → Automatic (wallet connect, daily login)
- **Social media engagement** → Proof required (follows, likes)
- **Content creation** → Manual review (tweets, videos)
- **High-value tasks** → Manual + delayed (large referrals, significant NFT purchases)

### 2. Balance Security and UX
- Don't over-verify simple tasks (frustrates users)
- Do verify high-value tasks thoroughly (prevents abuse)
- Provide clear error messages when verification fails
- Allow resubmission for rejected tasks (when appropriate)

### 3. Implement Rate Limiting
```typescript
{
  "verification_config": {
    "max_attempts_per_hour": 3,
    "cooldown_after_failure_minutes": 15
  }
}
```

### 4. Cache Verification Results
- Cache social media API responses (5-10 minutes)
- Cache blockchain queries (2-5 minutes)
- Clear cache when user explicitly retries

### 5. Provide Feedback
- Show verification progress in real-time
- Explain why verification failed
- Offer help/FAQ links for common issues
- Send notifications when manual reviews complete

## Security Considerations

### 1. Never Trust Client-Side Verification
Always validate on the server. Client checks are for UX only.

### 2. Protect Against Replay Attacks
```typescript
// Include timestamp and nonce in submissions
{
  "submission_data": {
    "proof_url": "https://twitter.com/...",
    "timestamp": "2025-01-15T10:30:00Z",
    "nonce": "abc123def456"
  }
}
```

### 3. Rate Limit Verification Attempts
Prevent brute force and abuse.

### 4. Sanitize User Input
Never trust URLs, screenshots, or text input. Validate and sanitize.

### 5. Monitor for Patterns
- Same IP submitting for multiple accounts → Sybil attack
- Rapid succession of successful verifications → Bot activity
- Identical proof across multiple users → Sharing proof

## Monitoring and Analytics

### Key Metrics to Track
- Verification success rate per task type
- Average verification time
- Manual review queue size
- Rejection reasons
- User retry attempts
- Task completion rates

### Dashboard Queries
```sql
-- Most completed tasks
SELECT task_id, title, COUNT(*) as completions
FROM user_tasks
WHERE status = 'COMPLETED'
GROUP BY task_id, title
ORDER BY completions DESC;

-- Verification rejection reasons
SELECT rejection_reason, COUNT(*) as count
FROM user_tasks
WHERE status = 'REJECTED'
GROUP BY rejection_reason
ORDER BY count DESC;

-- Average verification time
SELECT task_id,
       AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
FROM user_tasks
WHERE status = 'COMPLETED'
GROUP BY task_id;
```

## Future Enhancements

### 1. AI-Powered Verification
- Computer vision for screenshot validation
- NLP for comment quality assessment
- Pattern recognition for fraud detection

### 2. Reputation Scores
- Track user verification history
- Automatic approval for trusted users
- Extra scrutiny for suspicious users

### 3. Blockchain-Based Proof
- Store verification hashes on-chain
- Verifiable, tamper-proof history
- Cross-platform verification

### 4. Social Graph Analysis
- Verify genuine social connections
- Detect bot networks
- Reward authentic community builders
