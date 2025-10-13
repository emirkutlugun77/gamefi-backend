# Task Configuration Examples

This document provides real-world examples of how to configure different task types in the VYBE GameFi system.

## Twitter/X Tasks

### Twitter Follow
```json
{
  "title": "Follow VYBE on X",
  "description": "Follow @VYBEofficial on X to stay updated with latest news",
  "type": "TWITTER_FOLLOW",
  "reward_points": 50,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 1,
  "config": {
    "username": "@VYBEofficial",
    "profile_url": "https://twitter.com/VYBEofficial"
  },
  "verification_config": {
    "method": "automatic",
    "api_endpoint": "/api/verify/twitter/follow",
    "require_captcha": true
  }
}
```

### Twitter Like
```json
{
  "title": "Like VYBE Launch Tweet",
  "description": "Show your support by liking our launch announcement",
  "type": "TWITTER_LIKE",
  "reward_points": 25,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 1,
  "config": {
    "tweet_url": "https://twitter.com/VYBEofficial/status/1234567890",
    "tweet_id": "1234567890"
  },
  "verification_config": {
    "method": "semi_automatic",
    "proof_type": "screenshot",
    "proof_required": true
  }
}
```

### Twitter Retweet with Quote
```json
{
  "title": "Quote Retweet with Your Thoughts",
  "description": "Share what you love about VYBE with your followers",
  "type": "TWITTER_QUOTE",
  "reward_points": 100,
  "difficulty": "MEDIUM",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 5,
  "config": {
    "tweet_url": "https://twitter.com/VYBEofficial/status/1234567890",
    "min_length": 50,
    "required_hashtags": ["#VYBE", "#Solana"]
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "url",
    "proof_instructions": "Paste the URL of your quote tweet"
  }
}
```

### Twitter Original Tweet
```json
{
  "title": "Tweet About VYBE Superheroes",
  "description": "Create an original tweet about your favorite VYBE Superhero",
  "type": "TWITTER_TWEET",
  "reward_points": 150,
  "difficulty": "MEDIUM",
  "category": "SOCIAL_MEDIA",
  "reward_multiplier": 2.0,
  "estimated_time_minutes": 10,
  "tags": ["viral", "content-creation", "high-reward"],
  "config": {
    "required_hashtags": ["#VYBESuperheroes", "#SolanaNFT"],
    "required_mentions": ["@VYBEofficial"],
    "min_length": 100,
    "require_media": true
  },
  "verification_config": {
    "method": "manual",
    "proof_type": "url",
    "require_admin_approval": true,
    "min_followers": 50
  }
}
```

### Twitter Comment
```json
{
  "title": "Comment on VYBE's Latest Post",
  "description": "Engage with our community by leaving a thoughtful comment",
  "type": "TWITTER_COMMENT",
  "reward_points": 75,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 3,
  "config": {
    "tweet_url": "https://twitter.com/VYBEofficial/status/1234567890",
    "min_length": 30,
    "required_keywords": ["VYBE", "superhero"]
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot",
    "block_suspicious_accounts": true
  }
}
```

## Instagram Tasks

### Instagram Follow
```json
{
  "title": "Follow VYBE on Instagram",
  "description": "Join our Instagram community for exclusive content",
  "type": "INSTAGRAM_FOLLOW",
  "reward_points": 50,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 1,
  "config": {
    "username": "vybeofficial",
    "profile_url": "https://instagram.com/vybeofficial"
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot",
    "proof_instructions": "Screenshot your follow confirmation"
  }
}
```

### Instagram Like Post
```json
{
  "title": "Like Our Latest Instagram Post",
  "description": "Show some love to our newest superhero reveal",
  "type": "INSTAGRAM_LIKE",
  "reward_points": 30,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 1,
  "config": {
    "post_url": "https://instagram.com/p/ABC123",
    "post_id": "ABC123"
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot"
  }
}
```

### Instagram Story Share
```json
{
  "title": "Share VYBE to Your Story",
  "description": "Spread the word by sharing our post to your Instagram story",
  "type": "INSTAGRAM_SHARE_STORY",
  "reward_points": 200,
  "difficulty": "MEDIUM",
  "category": "SOCIAL_MEDIA",
  "reward_multiplier": 1.5,
  "estimated_time_minutes": 3,
  "tags": ["viral", "high-reward"],
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
    "expires_after_hours": 24
  }
}
```

### Instagram Comment
```json
{
  "title": "Comment Your Favorite Superhero Power",
  "description": "Tell us which superhero power you'd choose",
  "type": "INSTAGRAM_COMMENT",
  "reward_points": 80,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 3,
  "config": {
    "post_url": "https://instagram.com/p/ABC123",
    "min_length": 20,
    "required_hashtags": ["#VYBESuperheroes"],
    "banned_words": ["spam", "fake", "scam"]
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot",
    "block_suspicious_accounts": true
  }
}
```

## Facebook Tasks

### Facebook Follow Page
```json
{
  "title": "Like VYBE Facebook Page",
  "description": "Join our Facebook community for daily updates",
  "type": "FACEBOOK_FOLLOW",
  "reward_points": 50,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 1,
  "config": {
    "page_name": "VYBE Superheroes",
    "page_url": "https://facebook.com/vybesuperheroes"
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot"
  }
}
```

### Facebook Share
```json
{
  "title": "Share VYBE on Facebook",
  "description": "Share our latest announcement with your Facebook friends",
  "type": "FACEBOOK_SHARE",
  "reward_points": 120,
  "difficulty": "MEDIUM",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 2,
  "config": {
    "post_url": "https://facebook.com/vybesuperheroes/posts/123",
    "share_type": "public",
    "require_comment": true
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "url",
    "proof_instructions": "Paste the URL of your shared post"
  }
}
```

### Facebook Join Group
```json
{
  "title": "Join VYBE Community Group",
  "description": "Become part of our exclusive Facebook community",
  "type": "FACEBOOK_JOIN_GROUP",
  "reward_points": 100,
  "difficulty": "EASY",
  "category": "COMMUNITY",
  "estimated_time_minutes": 2,
  "config": {
    "group_name": "VYBE Superheroes Community",
    "group_url": "https://facebook.com/groups/vybesuperheroes",
    "require_post": true
  },
  "verification_config": {
    "method": "manual",
    "require_admin_approval": true,
    "proof_type": "screenshot"
  }
}
```

## Telegram Tasks

### Telegram Join Channel
```json
{
  "title": "Join VYBE Telegram",
  "description": "Join our official Telegram channel for real-time updates",
  "type": "TELEGRAM_JOIN",
  "reward_points": 75,
  "difficulty": "EASY",
  "category": "COMMUNITY",
  "estimated_time_minutes": 1,
  "config": {
    "channel_username": "@vybechannel",
    "channel_url": "https://t.me/vybechannel",
    "require_notifications": false
  },
  "verification_config": {
    "method": "automatic",
    "api_endpoint": "/api/verify/telegram/join"
  }
}
```

### Telegram Invite Friends
```json
{
  "title": "Invite 5 Friends to Telegram",
  "description": "Grow our community by inviting your friends",
  "type": "TELEGRAM_INVITE",
  "reward_points": 500,
  "difficulty": "HARD",
  "category": "COMMUNITY",
  "reward_multiplier": 2.0,
  "estimated_time_minutes": 30,
  "tags": ["referral", "high-reward"],
  "config": {
    "channel_username": "@vybechannel",
    "min_invites": 5,
    "require_active": true
  },
  "verification_config": {
    "method": "automatic",
    "verification_delay_hours": 24
  }
}
```

## Discord Tasks

### Discord Join Server
```json
{
  "title": "Join VYBE Discord",
  "description": "Join our Discord server to connect with the community",
  "type": "DISCORD_JOIN",
  "reward_points": 75,
  "difficulty": "EASY",
  "category": "COMMUNITY",
  "estimated_time_minutes": 2,
  "config": {
    "server_name": "VYBE Superheroes",
    "invite_url": "https://discord.gg/vybe"
  },
  "verification_config": {
    "method": "automatic",
    "api_endpoint": "/api/verify/discord/join"
  }
}
```

### Discord Verification
```json
{
  "title": "Get Verified on Discord",
  "description": "Complete Discord verification to unlock exclusive channels",
  "type": "DISCORD_VERIFY",
  "reward_points": 150,
  "difficulty": "MEDIUM",
  "category": "COMMUNITY",
  "prerequisite_task_ids": [10],
  "estimated_time_minutes": 5,
  "config": {
    "server_id": "123456789",
    "role_id": "987654321",
    "verification_channel": "verification"
  },
  "verification_config": {
    "method": "automatic"
  }
}
```

## YouTube Tasks

### YouTube Subscribe
```json
{
  "title": "Subscribe to VYBE YouTube",
  "description": "Subscribe and turn on notifications for video updates",
  "type": "YOUTUBE_SUBSCRIBE",
  "reward_points": 80,
  "difficulty": "EASY",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 1,
  "config": {
    "channel_name": "VYBE Superheroes",
    "channel_url": "https://youtube.com/@vybesuperheroes",
    "require_notifications": true
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot",
    "proof_instructions": "Screenshot showing subscription with bell icon enabled"
  }
}
```

### YouTube Watch and Comment
```json
{
  "title": "Watch and Comment on Launch Video",
  "description": "Watch our launch video and leave your thoughts",
  "type": "YOUTUBE_COMMENT",
  "reward_points": 120,
  "difficulty": "MEDIUM",
  "category": "SOCIAL_MEDIA",
  "estimated_time_minutes": 10,
  "config": {
    "video_url": "https://youtube.com/watch?v=ABC123",
    "min_length": 30,
    "required_keywords": ["VYBE", "superhero"]
  },
  "verification_config": {
    "method": "proof_required",
    "proof_type": "screenshot"
  }
}
```

## Web3 Tasks

### NFT Hold
```json
{
  "title": "Hold a VYBE Superhero NFT",
  "description": "Own at least 1 VYBE Superhero NFT in your wallet",
  "type": "NFT_HOLD",
  "reward_points": 500,
  "difficulty": "HARD",
  "category": "WEB3",
  "estimated_time_minutes": 30,
  "tags": ["web3", "nft", "high-reward"],
  "config": {
    "collection_mint": "DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN",
    "min_amount": 1
  },
  "verification_config": {
    "method": "automatic",
    "api_endpoint": "/api/verify/nft/hold"
  }
}
```

### Wallet Connect
```json
{
  "title": "Connect Your Solana Wallet",
  "description": "Connect your Solana wallet to get started",
  "type": "WALLET_CONNECT",
  "reward_points": 100,
  "difficulty": "EASY",
  "category": "WEB3",
  "estimated_time_minutes": 2,
  "config": {
    "required_network": "solana"
  },
  "verification_config": {
    "method": "automatic"
  }
}
```

### Token Swap
```json
{
  "title": "Swap on Jupiter",
  "description": "Make your first token swap on Jupiter DEX",
  "type": "TOKEN_SWAP",
  "reward_points": 200,
  "difficulty": "MEDIUM",
  "category": "WEB3",
  "estimated_time_minutes": 5,
  "config": {
    "from_token": "So11111111111111111111111111111111111111112",
    "to_token": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "min_amount": 0.1,
    "dex": "Jupiter"
  },
  "verification_config": {
    "method": "automatic",
    "proof_type": "transaction_hash",
    "proof_required": true
  }
}
```

## Engagement Tasks

### Daily Login
```json
{
  "title": "Daily Check-In",
  "description": "Log in every day to earn bonus points",
  "type": "DAILY_LOGIN",
  "reward_points": 25,
  "difficulty": "EASY",
  "category": "ENGAGEMENT",
  "is_repeatable": true,
  "estimated_time_minutes": 1,
  "config": {
    "time_window_hours": 24
  },
  "verification_config": {
    "method": "automatic"
  }
}
```

### Maintain Streak
```json
{
  "title": "7-Day Login Streak",
  "description": "Log in for 7 consecutive days",
  "type": "STREAK_MAINTAIN",
  "reward_points": 500,
  "difficulty": "MEDIUM",
  "category": "ENGAGEMENT",
  "reward_multiplier": 1.5,
  "estimated_time_minutes": 1,
  "tags": ["streak", "high-reward"],
  "config": {
    "min_streak_days": 7,
    "action_type": "login"
  },
  "verification_config": {
    "method": "automatic"
  }
}
```

### Quiz Challenge
```json
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
        "answers": ["Ethereum", "Solana", "Polygon", "Binance Smart Chain"],
        "correct_answer_index": 1,
        "points": 100
      },
      {
        "question": "What are the two sides in VYBE?",
        "answers": ["Light & Shadow", "DARK & HOLY", "Good & Evil", "Hero & Villain"],
        "correct_answer_index": 1,
        "points": 100
      },
      {
        "question": "How many VYBE Superheroes are in the collection?",
        "answers": ["5000", "10000", "3333", "7777"],
        "correct_answer_index": 2,
        "points": 100
      }
    ],
    "min_correct_answers": 2,
    "time_limit_seconds": 180,
    "randomize_questions": true,
    "randomize_answers": true
  },
  "verification_config": {
    "method": "automatic"
  }
}
```

### Referral Task
```json
{
  "title": "Invite 3 Friends",
  "description": "Refer 3 friends and earn bonus points when they complete tasks",
  "type": "REFERRAL",
  "reward_points": 750,
  "difficulty": "HARD",
  "category": "ENGAGEMENT",
  "reward_multiplier": 2.5,
  "estimated_time_minutes": 60,
  "tags": ["referral", "high-reward"],
  "config": {
    "min_referrals": 3,
    "require_active": true,
    "bonus_per_referral": 100,
    "max_referrals": 10
  },
  "verification_config": {
    "method": "automatic",
    "verification_delay_hours": 48
  }
}
```

## Special Event Tasks

### Limited Time Twitter Campaign
```json
{
  "title": "🔥 DOUBLE POINTS - Tweet About Launch",
  "description": "Limited time offer! Tweet about VYBE launch and earn 2X points",
  "type": "TWITTER_TWEET",
  "reward_points": 300,
  "difficulty": "MEDIUM",
  "priority": "URGENT",
  "category": "SPECIAL_EVENT",
  "reward_multiplier": 2.0,
  "status": "ACTIVE",
  "start_date": "2025-01-15T00:00:00Z",
  "end_date": "2025-01-20T23:59:59Z",
  "estimated_time_minutes": 10,
  "tags": ["limited-time", "double-points", "event"],
  "icon_url": "https://cdn.vybe.com/icons/fire.png",
  "config": {
    "required_hashtags": ["#VYBELaunch", "#SolanaNFT"],
    "required_mentions": ["@VYBEofficial"],
    "min_length": 100,
    "require_media": true
  },
  "verification_config": {
    "method": "manual",
    "proof_type": "url",
    "require_admin_approval": true
  }
}
```

## Task Chains (Prerequisites)

### Beginner → Intermediate → Expert Chain
```json
[
  {
    "id": 1,
    "title": "Beginner: Connect Wallet",
    "type": "WALLET_CONNECT",
    "reward_points": 100,
    "difficulty": "EASY"
  },
  {
    "id": 2,
    "title": "Intermediate: Join All Socials",
    "type": "CUSTOM",
    "reward_points": 300,
    "difficulty": "MEDIUM",
    "prerequisite_task_ids": [1]
  },
  {
    "id": 3,
    "title": "Expert: Hold NFT & Create Content",
    "type": "CUSTOM",
    "reward_points": 1000,
    "difficulty": "EXPERT",
    "prerequisite_task_ids": [1, 2]
  }
]
```
