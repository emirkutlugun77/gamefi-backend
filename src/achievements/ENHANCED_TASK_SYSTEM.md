# Enhanced Task System - VYBE GameFi

## Overview

The VYBE GameFi task system has been significantly enhanced based on research into Web3 Telegram airdrop patterns and social media engagement strategies. This document outlines all the improvements and new features.

## Key Enhancements

### 1. Expanded Task Types (50+ Types)

#### Social Media Platforms
- **Twitter/X** (6 types): Follow, Like, Retweet, Comment, Tweet, Quote
- **Instagram** (6 types): Follow, Like, Comment, Share Story, Post, Reel
- **Facebook** (5 types): Follow, Like, Share, Comment, Join Group
- **Telegram** (4 types): Join, Share, React, Invite
- **Discord** (4 types): Join, Verify, Message, React
- **YouTube** (4 types): Subscribe, Like, Comment, Watch
- **TikTok** (4 types): Follow, Like, Share, Comment

#### Web3 Activities
- **Blockchain** (6 types): NFT Hold, NFT Mint, Wallet Connect, Token Swap, Liquidity Provide, Stake Tokens

#### Engagement
- **Gamification** (7 types): Daily Login, Streak Maintain, Quiz, Survey, Referral, Visit Website, Download App

### 2. Dynamic Task Configuration System

Each task type now has a strongly-typed configuration interface:

```typescript
// Example: Instagram Like Task
{
  "type": "INSTAGRAM_LIKE",
  "config": {
    "post_url": "https://instagram.com/p/ABC123",
    "post_id": "ABC123"
  }
}

// Example: Twitter Tweet Task
{
  "type": "TWITTER_TWEET",
  "config": {
    "required_hashtags": ["#VYBE", "#Solana"],
    "required_mentions": ["@VYBEofficial"],
    "min_length": 100,
    "require_media": true
  }
}

// Example: Quiz Task
{
  "type": "QUIZ",
  "config": {
    "questions": [
      {
        "question": "Which blockchain is VYBE on?",
        "answers": ["Ethereum", "Solana", "Polygon"],
        "correct_answer_index": 1,
        "points": 100
      }
    ],
    "min_correct_answers": 1,
    "time_limit_seconds": 180
  }
}
```

### 3. Advanced Task Properties

#### Task Difficulty
- `EASY` - Simple tasks (follows, likes, wallet connects)
- `MEDIUM` - Moderate effort (comments, shares, quizzes)
- `HARD` - Significant effort (content creation, NFT purchases)
- `EXPERT` - Complex challenges (large referrals, multiple prerequisites)

#### Task Priority
- `LOW` - Optional tasks
- `NORMAL` - Standard tasks
- `HIGH` - Featured/recommended tasks
- `URGENT` - Limited-time offers

#### Task Category
- `SOCIAL_MEDIA` - Twitter, Instagram, Facebook, etc.
- `WEB3` - Blockchain interactions
- `ENGAGEMENT` - Daily logins, streaks, quizzes
- `COMMUNITY` - Discord, Telegram, referrals
- `SPECIAL_EVENT` - Limited-time campaigns

#### Additional Fields
```typescript
{
  "tags": ["viral", "beginner-friendly", "high-reward"],
  "icon_url": "https://cdn.vybe.com/icons/twitter.png",
  "required_level": 5,
  "prerequisite_task_ids": [1, 2],
  "reward_multiplier": 2.0,
  "estimated_time_minutes": 10,
  "total_completions": 1523
}
```

### 4. Comprehensive Verification System

#### Verification Methods
1. **Automatic** - System verifies without user action (blockchain checks, login tracking)
2. **Proof Required** - User submits proof (screenshots, URLs, codes)
3. **Semi-Automatic** - Proof + automatic validation (URL format + API check)
4. **Manual** - Admin review required (content quality, subjective tasks)

#### Anti-Fraud Measures
```typescript
{
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot",
    "require_captcha": true,
    "min_account_age_days": 30,
    "min_followers": 50,
    "block_suspicious_accounts": true,
    "verification_delay_hours": 24,
    "expires_after_hours": 72,
    "require_admin_approval": false
  }
}
```

### 5. Task Dependencies and Progression

#### Prerequisites
Tasks can require completion of other tasks first:
```typescript
{
  "id": 3,
  "title": "Advanced Challenge",
  "prerequisite_task_ids": [1, 2],
  // User must complete tasks 1 and 2 before accessing this
}
```

#### Level Requirements
```typescript
{
  "title": "Expert NFT Trader",
  "required_level": 10,
  // Only users level 10+ can access
}
```

#### Task Chains
Create progressive learning paths:
```
Beginner → Intermediate → Expert
   ↓            ↓            ↓
Task 1      Task 2        Task 3
(100pts)    (300pts)     (1000pts)
```

### 6. Reward Multipliers and Bonuses

#### Time-Limited Bonuses
```typescript
{
  "title": "🔥 2X POINTS Weekend Special",
  "reward_points": 150,
  "reward_multiplier": 2.0, // Actual reward: 300 points
  "start_date": "2025-01-15T00:00:00Z",
  "end_date": "2025-01-17T23:59:59Z"
}
```

#### Streak Bonuses
```typescript
{
  "title": "7-Day Login Streak",
  "type": "STREAK_MAINTAIN",
  "reward_points": 500,
  "reward_multiplier": 1.5, // 750 points total
}
```

### 7. Repeatable Tasks

```typescript
{
  "title": "Daily Check-In",
  "is_repeatable": true,
  "max_completions": null, // Unlimited
  // User can complete once per day
}

{
  "title": "Weekly Challenge",
  "is_repeatable": true,
  "max_completions": 4, // Can complete 4 times (once per week for a month)
}
```

### 8. Task Status Management

- `ACTIVE` - Currently available
- `INACTIVE` - Hidden from users
- `EXPIRED` - Past end date
- `SCHEDULED` - Future start date

User Task Status:
- `PENDING` - Task discovered but not started
- `IN_PROGRESS` - Task started
- `SUBMITTED` - Proof submitted, awaiting verification
- `COMPLETED` - Successfully verified
- `REJECTED` - Verification failed

## Architecture

### Database Schema

#### Tasks Table
```sql
- id (PK)
- title
- description
- type (enum)
- reward_points
- status (enum)
- config (jsonb)
- verification_config (jsonb)
- is_repeatable
- max_completions
- start_date
- end_date
- display_order
- difficulty (enum)
- priority (enum)
- category (enum)
- tags (array)
- icon_url
- required_level
- prerequisite_task_ids (array)
- reward_multiplier
- total_completions
- estimated_time_minutes
- created_at
- updated_at
```

#### User Tasks Table
```sql
- id (PK)
- user_id (FK)
- task_id (FK)
- status (enum)
- submission_data (jsonb)
- verification_result (jsonb)
- completion_count
- points_earned
- started_at
- completed_at
- rejection_reason
- created_at
- updated_at
```

### Services

#### TaskValidatorService
Validates task configurations and submissions:
- `validateTaskConfig()` - Ensures config is valid for task type
- `validateSubmission()` - Validates proof/submission data
- `validatePrerequisites()` - Checks prerequisite completion
- `validateTaskAvailability()` - Checks if task is currently available
- `validateRepeatableTask()` - Checks completion limits
- `validateHashtags()` - Validates required hashtags
- `validateMentions()` - Validates required mentions
- `validateKeywords()` - Validates required keywords
- `validateQuizAnswers()` - Scores quiz submissions

### API Endpoints

```
POST   /achievements/tasks              Create new task (admin)
GET    /achievements/tasks              List all tasks
GET    /achievements/tasks/:id          Get task details
PATCH  /achievements/tasks/:id          Update task (admin)
DELETE /achievements/tasks/:id          Delete task (admin)

GET    /achievements/tasks/available    Get available tasks for user
GET    /achievements/tasks/completed    Get user's completed tasks
POST   /achievements/tasks/start        Start a task
POST   /achievements/tasks/submit       Submit task proof
GET    /achievements/tasks/:id/status   Check task status

POST   /achievements/verify/:taskId     Verify task (admin)
POST   /achievements/reject/:taskId     Reject task (admin)
GET    /achievements/pending            Get pending verifications (admin)
```

## Usage Examples

### Creating an Instagram Story Share Task
```typescript
POST /achievements/tasks
{
  "title": "Share VYBE to Your Story",
  "description": "Share our post to your Instagram story with our tag",
  "type": "INSTAGRAM_SHARE_STORY",
  "reward_points": 200,
  "difficulty": "MEDIUM",
  "priority": "HIGH",
  "category": "SOCIAL_MEDIA",
  "reward_multiplier": 1.5,
  "estimated_time_minutes": 3,
  "tags": ["viral", "instagram", "high-reward"],
  "icon_url": "https://cdn.vybe.com/icons/instagram-story.png",
  "config": {
    "post_url": "https://instagram.com/p/ABC123",
    "required_hashtags": ["#VYBE"],
    "required_mentions": ["@vybeofficial"],
    "require_tag": true
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot",
    "proof_instructions": "Screenshot your story with our tag visible",
    "expires_after_hours": 24,
    "require_captcha": true
  },
  "start_date": "2025-01-15T00:00:00Z",
  "end_date": "2025-02-15T23:59:59Z",
  "status": "ACTIVE"
}
```

### Creating a Quiz Task
```typescript
POST /achievements/tasks
{
  "title": "VYBE Superhero Trivia",
  "description": "Test your knowledge about VYBE Superheroes",
  "type": "QUIZ",
  "reward_points": 300,
  "difficulty": "MEDIUM",
  "category": "ENGAGEMENT",
  "estimated_time_minutes": 5,
  "config": {
    "questions": [
      {
        "question": "Which blockchain is VYBE built on?",
        "answers": ["Ethereum", "Solana", "Polygon", "Binance"],
        "correct_answer_index": 1,
        "points": 100
      },
      {
        "question": "What are the two sides in VYBE?",
        "answers": ["Light & Shadow", "DARK & HOLY", "Good & Evil"],
        "correct_answer_index": 1,
        "points": 100
      }
    ],
    "min_correct_answers": 2,
    "time_limit_seconds": 180,
    "randomize_questions": true
  },
  "verification_config": {
    "method": "automatic"
  }
}
```

### Creating a Referral Task
```typescript
POST /achievements/tasks
{
  "title": "Invite 5 Friends",
  "description": "Refer friends and earn bonus points",
  "type": "REFERRAL",
  "reward_points": 1000,
  "difficulty": "HARD",
  "category": "ENGAGEMENT",
  "reward_multiplier": 2.0,
  "tags": ["referral", "high-reward"],
  "config": {
    "min_referrals": 5,
    "require_active": true,
    "bonus_per_referral": 200,
    "max_referrals": 20
  },
  "verification_config": {
    "method": "automatic",
    "verification_delay_hours": 48
  }
}
```

### Submitting a Task
```typescript
POST /achievements/tasks/submit
{
  "task_id": 42,
  "publicKey": "7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe",
  "submission_data": {
    "screenshot_url": "https://storage.vybe.com/proofs/user123_task42.png",
    "timestamp": "2025-01-15T10:30:00Z",
    "notes": "Completed as requested"
  }
}
```

## Benefits of Enhanced System

### 1. Flexibility
- Easy to add new task types
- Configurable per-task rules
- Dynamic reward structures

### 2. Engagement
- Diverse task types keep users engaged
- Progressive difficulty encourages growth
- Streaks and multipliers drive daily activity

### 3. Fraud Prevention
- Multi-layered verification
- Anti-bot measures
- Manual review for high-value tasks

### 4. Analytics
- Track completion rates by type
- Identify popular tasks
- Optimize reward structures

### 5. Scalability
- JSONB configs avoid schema changes
- Cached verification results
- Batch verification processing

## Migration Guide

### Existing Tasks
No breaking changes. Existing tasks will continue to work with new fields defaulting to:
- `difficulty: EASY`
- `priority: NORMAL`
- `category: SOCIAL_MEDIA`
- `reward_multiplier: 1.0`

### Database Migration
```sql
-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN difficulty VARCHAR(20) DEFAULT 'EASY',
  ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL',
  ADD COLUMN category VARCHAR(50) DEFAULT 'SOCIAL_MEDIA',
  ADD COLUMN tags TEXT[],
  ADD COLUMN icon_url VARCHAR(500),
  ADD COLUMN required_level INTEGER DEFAULT 0,
  ADD COLUMN prerequisite_task_ids INTEGER[],
  ADD COLUMN reward_multiplier DECIMAL(5,2) DEFAULT 1.0,
  ADD COLUMN total_completions INTEGER DEFAULT 0,
  ADD COLUMN estimated_time_minutes INTEGER;

-- Update task status enum
ALTER TYPE task_status ADD VALUE 'SCHEDULED';
```

## Best Practices

### 1. Task Design
- Start simple, add complexity gradually
- Clear, actionable titles
- Detailed descriptions with examples
- Realistic time estimates

### 2. Reward Balance
- Low effort = low rewards (25-50 points)
- Medium effort = medium rewards (100-200 points)
- High effort = high rewards (500-1000 points)
- Use multipliers for special events

### 3. Verification Strategy
- Automatic for trusted data sources
- Proof required for social media
- Manual for subjective/creative tasks
- Always implement anti-fraud measures

### 4. User Experience
- Provide clear instructions
- Show progress indicators
- Give instant feedback
- Allow resubmission when appropriate

## Future Enhancements

### Planned Features
- [ ] AI-powered content verification
- [ ] Blockchain-based proof storage
- [ ] Social graph analysis
- [ ] Reputation scoring system
- [ ] Task recommendations based on user behavior
- [ ] A/B testing framework for tasks
- [ ] Seasonal task campaigns
- [ ] Community-created tasks
- [ ] NFT rewards for task completion
- [ ] Leaderboards and competitions

## Support & Documentation

- **Task Examples**: See `task-examples.md` for 30+ real-world examples
- **Verification Guide**: See `VERIFICATION_GUIDE.md` for implementation details
- **Configuration Types**: See `task-config.types.ts` for all config interfaces
- **Validator Service**: See `task-validator.service.ts` for validation logic

## Questions?

Contact the VYBE development team or open an issue in the project repository.
