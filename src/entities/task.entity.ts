import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaskType {
  // Twitter/X Tasks
  TWITTER_FOLLOW = 'TWITTER_FOLLOW',
  TWITTER_RETWEET = 'TWITTER_RETWEET',
  TWITTER_LIKE = 'TWITTER_LIKE',
  TWITTER_COMMENT = 'TWITTER_COMMENT',
  TWITTER_TWEET = 'TWITTER_TWEET',
  TWITTER_QUOTE = 'TWITTER_QUOTE',

  // Instagram Tasks
  INSTAGRAM_FOLLOW = 'INSTAGRAM_FOLLOW',
  INSTAGRAM_LIKE = 'INSTAGRAM_LIKE',
  INSTAGRAM_COMMENT = 'INSTAGRAM_COMMENT',
  INSTAGRAM_SHARE_STORY = 'INSTAGRAM_SHARE_STORY',
  INSTAGRAM_POST = 'INSTAGRAM_POST',
  INSTAGRAM_REEL = 'INSTAGRAM_REEL',

  // Facebook Tasks
  FACEBOOK_FOLLOW = 'FACEBOOK_FOLLOW',
  FACEBOOK_LIKE = 'FACEBOOK_LIKE',
  FACEBOOK_SHARE = 'FACEBOOK_SHARE',
  FACEBOOK_COMMENT = 'FACEBOOK_COMMENT',
  FACEBOOK_JOIN_GROUP = 'FACEBOOK_JOIN_GROUP',

  // Telegram Tasks
  TELEGRAM_JOIN = 'TELEGRAM_JOIN',
  TELEGRAM_SHARE = 'TELEGRAM_SHARE',
  TELEGRAM_REACT = 'TELEGRAM_REACT',
  TELEGRAM_INVITE = 'TELEGRAM_INVITE',

  // Discord Tasks
  DISCORD_JOIN = 'DISCORD_JOIN',
  DISCORD_VERIFY = 'DISCORD_VERIFY',
  DISCORD_MESSAGE = 'DISCORD_MESSAGE',
  DISCORD_REACT = 'DISCORD_REACT',

  // YouTube Tasks
  YOUTUBE_SUBSCRIBE = 'YOUTUBE_SUBSCRIBE',
  YOUTUBE_LIKE = 'YOUTUBE_LIKE',
  YOUTUBE_COMMENT = 'YOUTUBE_COMMENT',
  YOUTUBE_WATCH = 'YOUTUBE_WATCH',

  // TikTok Tasks
  TIKTOK_FOLLOW = 'TIKTOK_FOLLOW',
  TIKTOK_LIKE = 'TIKTOK_LIKE',
  TIKTOK_SHARE = 'TIKTOK_SHARE',
  TIKTOK_COMMENT = 'TIKTOK_COMMENT',

  // Web3 Tasks
  NFT_HOLD = 'NFT_HOLD',
  NFT_MINT = 'NFT_MINT',
  WALLET_CONNECT = 'WALLET_CONNECT',
  TOKEN_SWAP = 'TOKEN_SWAP',
  LIQUIDITY_PROVIDE = 'LIQUIDITY_PROVIDE',
  STAKE_TOKENS = 'STAKE_TOKENS',

  // Engagement Tasks
  DAILY_LOGIN = 'DAILY_LOGIN',
  STREAK_MAINTAIN = 'STREAK_MAINTAIN',
  QUIZ = 'QUIZ',
  SURVEY = 'SURVEY',
  REFERRAL = 'REFERRAL',
  VISIT_WEBSITE = 'VISIT_WEBSITE',
  DOWNLOAD_APP = 'DOWNLOAD_APP',

  // Submission Tasks
  SUBMIT_TEXT = 'SUBMIT_TEXT',
  SUBMIT_IMAGE = 'SUBMIT_IMAGE',

  // Custom
  CUSTOM = 'CUSTOM',
}

export enum TaskStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SCHEDULED = 'SCHEDULED',
}

export enum TaskDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskCategory {
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  WEB3 = 'WEB3',
  ENGAGEMENT = 'ENGAGEMENT',
  COMMUNITY = 'COMMUNITY',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TaskType })
  type: TaskType;

  // Prompt/header for text or image submission tasks
  // Example: "Share your creative idea", "Upload your artwork"
  @Column({ type: 'varchar', length: 500, nullable: true })
  submission_prompt: string;

  @Column({ type: 'int' })
  reward_points: number;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE })
  status: TaskStatus;

  // Dynamic configuration stored as JSON
  // Example for TWITTER_TWEET: { "hashtags": ["#VYBE", "#Solana"], "minLength": 50 }
  // Example for TWITTER_FOLLOW: { "username": "@VYBEofficial" }
  // Example for NFT_HOLD: { "collectionMint": "DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN", "minAmount": 1 }
  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  // Verification configuration
  // Example: { "requireManualApproval": false, "autoVerify": true }
  @Column({ type: 'jsonb', nullable: true })
  verification_config: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  is_repeatable: boolean;

  @Column({ type: 'int', nullable: true })
  max_completions: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'enum', enum: TaskDifficulty, default: TaskDifficulty.EASY })
  difficulty: TaskDifficulty;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.NORMAL })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskCategory,
    default: TaskCategory.SOCIAL_MEDIA,
  })
  category: TaskCategory;

  // Tags for better organization and filtering (e.g., ["viral", "beginner-friendly", "high-reward"])
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  // Icon/image URL for the task
  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string;

  // Required level or prerequisites
  @Column({ type: 'int', default: 0 })
  required_level: number;

  // Task dependencies (must complete these tasks first)
  @Column({ type: 'simple-array', nullable: true })
  prerequisite_task_ids: number[];

  // Dynamic prerequisite conditions
  // Supports complex prerequisite logic with AND/OR operators
  // Example: {
  //   "operator": "AND",
  //   "conditions": [
  //     { "type": "task_completed", "task_ids": [1, 2] },
  //     { "type": "min_points", "points": 100 },
  //     { "type": "min_level", "level": 5 },
  //     { "type": "nft_hold", "collection_mint": "...", "min_amount": 1 },
  //     { "type": "transaction_completed", "transaction_type": "TOKEN_SWAP", "min_amount": 10 }
  //   ]
  // }
  @Column({ type: 'jsonb', nullable: true })
  prerequisite_conditions: Record<string, any>;

  // Bonus multiplier for special events or limited time
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  reward_multiplier: number;

  // Total completions by all users (for analytics)
  @Column({ type: 'int', default: 0 })
  total_completions: number;

  // Estimated time to complete (in minutes)
  @Column({ type: 'int', nullable: true })
  estimated_time_minutes: number;

  // Whether this task requires a blockchain transaction
  @Column({ type: 'boolean', default: false })
  requires_transaction: boolean;

  // Transaction configuration for transaction-based tasks
  // Example: {
  //   "transaction_type": "TOKEN_SWAP",
  //   "min_amount": 10,
  //   "max_amount": 1000,
  //   "required_confirmations": 32,
  //   "from_token": "So11111111111111111111111111111111111111112",
  //   "to_token": "...",
  //   "allow_any_amount": false
  // }
  @Column({ type: 'jsonb', nullable: true })
  transaction_config: Record<string, any>;

  // Star rating for tasks (0 to 5 in increments of 0.5)
  // Allowed values: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  star_rate: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
