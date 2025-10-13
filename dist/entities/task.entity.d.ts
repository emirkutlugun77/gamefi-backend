export declare enum TaskType {
    TWITTER_FOLLOW = "TWITTER_FOLLOW",
    TWITTER_RETWEET = "TWITTER_RETWEET",
    TWITTER_LIKE = "TWITTER_LIKE",
    TWITTER_COMMENT = "TWITTER_COMMENT",
    TWITTER_TWEET = "TWITTER_TWEET",
    TWITTER_QUOTE = "TWITTER_QUOTE",
    INSTAGRAM_FOLLOW = "INSTAGRAM_FOLLOW",
    INSTAGRAM_LIKE = "INSTAGRAM_LIKE",
    INSTAGRAM_COMMENT = "INSTAGRAM_COMMENT",
    INSTAGRAM_SHARE_STORY = "INSTAGRAM_SHARE_STORY",
    INSTAGRAM_POST = "INSTAGRAM_POST",
    INSTAGRAM_REEL = "INSTAGRAM_REEL",
    FACEBOOK_FOLLOW = "FACEBOOK_FOLLOW",
    FACEBOOK_LIKE = "FACEBOOK_LIKE",
    FACEBOOK_SHARE = "FACEBOOK_SHARE",
    FACEBOOK_COMMENT = "FACEBOOK_COMMENT",
    FACEBOOK_JOIN_GROUP = "FACEBOOK_JOIN_GROUP",
    TELEGRAM_JOIN = "TELEGRAM_JOIN",
    TELEGRAM_SHARE = "TELEGRAM_SHARE",
    TELEGRAM_REACT = "TELEGRAM_REACT",
    TELEGRAM_INVITE = "TELEGRAM_INVITE",
    DISCORD_JOIN = "DISCORD_JOIN",
    DISCORD_VERIFY = "DISCORD_VERIFY",
    DISCORD_MESSAGE = "DISCORD_MESSAGE",
    DISCORD_REACT = "DISCORD_REACT",
    YOUTUBE_SUBSCRIBE = "YOUTUBE_SUBSCRIBE",
    YOUTUBE_LIKE = "YOUTUBE_LIKE",
    YOUTUBE_COMMENT = "YOUTUBE_COMMENT",
    YOUTUBE_WATCH = "YOUTUBE_WATCH",
    TIKTOK_FOLLOW = "TIKTOK_FOLLOW",
    TIKTOK_LIKE = "TIKTOK_LIKE",
    TIKTOK_SHARE = "TIKTOK_SHARE",
    TIKTOK_COMMENT = "TIKTOK_COMMENT",
    NFT_HOLD = "NFT_HOLD",
    NFT_MINT = "NFT_MINT",
    WALLET_CONNECT = "WALLET_CONNECT",
    TOKEN_SWAP = "TOKEN_SWAP",
    LIQUIDITY_PROVIDE = "LIQUIDITY_PROVIDE",
    STAKE_TOKENS = "STAKE_TOKENS",
    DAILY_LOGIN = "DAILY_LOGIN",
    STREAK_MAINTAIN = "STREAK_MAINTAIN",
    QUIZ = "QUIZ",
    SURVEY = "SURVEY",
    REFERRAL = "REFERRAL",
    VISIT_WEBSITE = "VISIT_WEBSITE",
    DOWNLOAD_APP = "DOWNLOAD_APP",
    CUSTOM = "CUSTOM"
}
export declare enum TaskStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    EXPIRED = "EXPIRED",
    SCHEDULED = "SCHEDULED"
}
export declare enum TaskDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
    EXPERT = "EXPERT"
}
export declare enum TaskPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum TaskCategory {
    SOCIAL_MEDIA = "SOCIAL_MEDIA",
    WEB3 = "WEB3",
    ENGAGEMENT = "ENGAGEMENT",
    COMMUNITY = "COMMUNITY",
    SPECIAL_EVENT = "SPECIAL_EVENT"
}
export declare class Task {
    id: number;
    title: string;
    description: string;
    type: TaskType;
    reward_points: number;
    status: TaskStatus;
    config: Record<string, any>;
    verification_config: Record<string, any>;
    is_repeatable: boolean;
    max_completions: number;
    start_date: Date;
    end_date: Date;
    display_order: number;
    difficulty: TaskDifficulty;
    priority: TaskPriority;
    category: TaskCategory;
    tags: string[];
    icon_url: string;
    required_level: number;
    prerequisite_task_ids: number[];
    reward_multiplier: number;
    total_completions: number;
    estimated_time_minutes: number;
    created_at: Date;
    updated_at: Date;
}
