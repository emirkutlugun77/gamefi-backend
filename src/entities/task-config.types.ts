/**
 * Task Configuration Types
 * Defines the structure of the `config` field for each TaskType
 */

// ============================================
// TWITTER/X TASK CONFIGURATIONS
// ============================================

export interface TwitterFollowConfig {
  username: string; // @VYBEofficial
  profile_url?: string; // Full URL fallback
}

export interface TwitterLikeConfig {
  tweet_url: string;
  tweet_id?: string;
}

export interface TwitterRetweetConfig {
  tweet_url: string;
  tweet_id?: string;
  require_quote?: boolean; // Must be a quote retweet, not just RT
}

export interface TwitterCommentConfig {
  tweet_url: string;
  tweet_id?: string;
  min_length?: number; // Minimum comment length
  required_keywords?: string[]; // Must include these words
  required_hashtags?: string[]; // Must include these hashtags
}

export interface TwitterTweetConfig {
  required_hashtags?: string[]; // e.g., ["#VYBE", "#Solana"]
  required_keywords?: string[]; // e.g., ["VYBE", "NFT"]
  required_mentions?: string[]; // e.g., ["@VYBEofficial"]
  min_length?: number; // Minimum tweet length
  max_length?: number; // Maximum tweet length
  require_media?: boolean; // Must include image/video
}

export interface TwitterQuoteConfig {
  tweet_url: string;
  tweet_id?: string;
  min_length?: number;
  required_hashtags?: string[];
}

// ============================================
// INSTAGRAM TASK CONFIGURATIONS
// ============================================

export interface InstagramFollowConfig {
  username: string; // vybeofficial
  profile_url?: string;
}

export interface InstagramLikeConfig {
  post_url: string;
  post_id?: string;
}

export interface InstagramCommentConfig {
  post_url: string;
  post_id?: string;
  min_length?: number;
  required_keywords?: string[];
  required_hashtags?: string[];
  banned_words?: string[]; // Spam filter
}

export interface InstagramShareStoryConfig {
  post_url?: string; // If sharing specific post
  required_hashtags?: string[];
  required_mentions?: string[];
  require_tag?: boolean; // Must tag the brand account
}

export interface InstagramPostConfig {
  required_hashtags?: string[];
  required_mentions?: string[];
  min_hashtags?: number;
  require_location?: boolean;
  caption_min_length?: number;
}

export interface InstagramReelConfig {
  required_hashtags?: string[];
  required_mentions?: string[];
  min_duration_seconds?: number;
  required_audio?: string; // Specific audio track
}

// ============================================
// FACEBOOK TASK CONFIGURATIONS
// ============================================

export interface FacebookFollowConfig {
  page_name: string;
  page_url: string;
  page_id?: string;
}

export interface FacebookLikeConfig {
  post_url: string;
  post_id?: string;
}

export interface FacebookShareConfig {
  post_url: string;
  post_id?: string;
  share_type?: 'public' | 'friends' | 'any'; // Privacy level required
  require_comment?: boolean; // Must add comment when sharing
}

export interface FacebookCommentConfig {
  post_url: string;
  post_id?: string;
  min_length?: number;
  required_keywords?: string[];
}

export interface FacebookJoinGroupConfig {
  group_name: string;
  group_url: string;
  group_id?: string;
  require_post?: boolean; // Must make introductory post
}

// ============================================
// TELEGRAM TASK CONFIGURATIONS
// ============================================

export interface TelegramJoinConfig {
  channel_username: string; // @vybechannel
  channel_url?: string; // t.me/vybechannel
  channel_id?: string;
  require_notifications?: boolean; // Must enable notifications
}

export interface TelegramShareConfig {
  message_url?: string; // Specific message to share
  channel_username?: string;
  min_shares?: number; // Minimum number of forwards
}

export interface TelegramReactConfig {
  message_url: string;
  channel_username: string;
  message_id?: number;
  required_emoji?: string; // Specific emoji required
}

export interface TelegramInviteConfig {
  channel_username: string;
  min_invites: number; // Number of friends to invite
  require_active?: boolean; // Invited users must be active
}

// ============================================
// DISCORD TASK CONFIGURATIONS
// ============================================

export interface DiscordJoinConfig {
  server_name: string;
  invite_url: string;
  server_id?: string;
}

export interface DiscordVerifyConfig {
  server_id: string;
  role_id?: string; // Specific role to obtain
  verification_channel?: string;
}

export interface DiscordMessageConfig {
  server_id: string;
  channel_id?: string;
  channel_name?: string;
  min_messages?: number; // Number of messages to send
  min_length?: number; // Minimum message length
  required_keywords?: string[];
}

export interface DiscordReactConfig {
  server_id: string;
  channel_id: string;
  message_id: string;
  required_emoji?: string;
}

// ============================================
// YOUTUBE TASK CONFIGURATIONS
// ============================================

export interface YouTubeSubscribeConfig {
  channel_name: string;
  channel_url: string;
  channel_id?: string;
  require_notifications?: boolean; // Must enable bell notifications
}

export interface YouTubeLikeConfig {
  video_url: string;
  video_id?: string;
}

export interface YouTubeCommentConfig {
  video_url: string;
  video_id?: string;
  min_length?: number;
  required_keywords?: string[];
}

export interface YouTubeWatchConfig {
  video_url: string;
  video_id?: string;
  min_watch_time_seconds?: number; // Must watch at least X seconds
  require_full_watch?: boolean; // Must watch entire video
}

// ============================================
// TIKTOK TASK CONFIGURATIONS
// ============================================

export interface TikTokFollowConfig {
  username: string; // @vybeofficial
  profile_url?: string;
}

export interface TikTokLikeConfig {
  video_url: string;
  video_id?: string;
}

export interface TikTokShareConfig {
  video_url: string;
  video_id?: string;
  min_shares?: number;
}

export interface TikTokCommentConfig {
  video_url: string;
  video_id?: string;
  min_length?: number;
  required_keywords?: string[];
  required_hashtags?: string[];
}

// ============================================
// WEB3 TASK CONFIGURATIONS
// ============================================

export interface NftHoldConfig {
  collection_mint: string; // Solana collection mint address
  min_amount?: number; // Minimum NFTs to hold
  specific_trait?: { trait_type: string; value: string }; // Must have specific trait
}

export interface NftMintConfig {
  collection_mint: string;
  mint_url?: string;
  max_price?: number; // Maximum price in SOL
}

export interface WalletConnectConfig {
  required_network?: string; // 'solana', 'ethereum', etc.
  min_balance?: number; // Minimum wallet balance
}

export interface TokenSwapConfig {
  from_token: string; // Token mint address
  to_token: string; // Token mint address
  min_amount?: number; // Minimum swap amount
  dex?: string; // Specific DEX to use (Jupiter, Raydium, etc.)
}

export interface LiquidityProvideConfig {
  pool_address: string;
  token_a: string;
  token_b: string;
  min_liquidity_usd?: number;
}

export interface StakeTokensConfig {
  token_mint: string;
  staking_program: string;
  min_amount?: number;
  min_duration_days?: number;
}

// ============================================
// ENGAGEMENT TASK CONFIGURATIONS
// ============================================

export interface DailyLoginConfig {
  required_consecutive_days?: number; // For streak requirements
  time_window_hours?: number; // Must login within X hours
}

export interface StreakMaintainConfig {
  min_streak_days: number;
  action_type: 'login' | 'task_completion' | 'any';
}

export interface QuizConfig {
  questions: QuizQuestion[];
  min_correct_answers?: number; // Minimum to pass
  time_limit_seconds?: number;
  randomize_questions?: boolean;
  randomize_answers?: boolean;
}

export interface QuizQuestion {
  question: string;
  answers: string[];
  correct_answer_index: number;
  points?: number; // Points for this specific question
}

export interface SurveyConfig {
  survey_url?: string; // External survey link
  questions?: SurveyQuestion[]; // Or inline questions
  min_answers?: number; // Minimum questions to answer
}

export interface SurveyQuestion {
  question: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  options?: string[]; // For multiple choice
  required?: boolean;
}

export interface ReferralConfig {
  min_referrals: number;
  require_active?: boolean; // Referred users must complete X tasks
  bonus_per_referral?: number; // Extra points per referral
  max_referrals?: number; // Cap on referrals
}

export interface VisitWebsiteConfig {
  website_url: string;
  min_time_seconds?: number; // Minimum time on site
  require_interaction?: boolean; // Must click something
  verification_code?: string; // Code shown on website
}

export interface DownloadAppConfig {
  app_name: string;
  platform: 'ios' | 'android' | 'both';
  app_store_url?: string;
  play_store_url?: string;
  require_open?: boolean; // Must open the app
}

// ============================================
// VERIFICATION CONFIGURATIONS
// ============================================

export interface VerificationConfig {
  method: 'manual' | 'automatic' | 'semi_automatic' | 'proof_required';

  // For automatic verification
  api_endpoint?: string; // External API to verify
  api_key_required?: boolean;

  // For proof-based verification
  proof_type?: 'screenshot' | 'url' | 'transaction_hash' | 'code' | 'text';
  proof_required?: boolean;
  proof_instructions?: string;

  // Anti-fraud measures
  require_captcha?: boolean;
  min_account_age_days?: number; // Social media account age
  min_followers?: number; // Minimum follower count
  block_suspicious_accounts?: boolean;

  // Timing
  verification_delay_hours?: number; // Delay before can claim reward
  expires_after_hours?: number; // Submission expires after X hours

  // Manual review
  require_admin_approval?: boolean;
  auto_reject_criteria?: string[]; // Auto-reject if contains these
}

// ============================================
// TYPE UNION FOR ALL CONFIGS
// ============================================

export type TaskConfig =
  | TwitterFollowConfig
  | TwitterLikeConfig
  | TwitterRetweetConfig
  | TwitterCommentConfig
  | TwitterTweetConfig
  | TwitterQuoteConfig
  | InstagramFollowConfig
  | InstagramLikeConfig
  | InstagramCommentConfig
  | InstagramShareStoryConfig
  | InstagramPostConfig
  | InstagramReelConfig
  | FacebookFollowConfig
  | FacebookLikeConfig
  | FacebookShareConfig
  | FacebookCommentConfig
  | FacebookJoinGroupConfig
  | TelegramJoinConfig
  | TelegramShareConfig
  | TelegramReactConfig
  | TelegramInviteConfig
  | DiscordJoinConfig
  | DiscordVerifyConfig
  | DiscordMessageConfig
  | DiscordReactConfig
  | YouTubeSubscribeConfig
  | YouTubeLikeConfig
  | YouTubeCommentConfig
  | YouTubeWatchConfig
  | TikTokFollowConfig
  | TikTokLikeConfig
  | TikTokShareConfig
  | TikTokCommentConfig
  | NftHoldConfig
  | NftMintConfig
  | WalletConnectConfig
  | TokenSwapConfig
  | LiquidityProvideConfig
  | StakeTokensConfig
  | DailyLoginConfig
  | StreakMaintainConfig
  | QuizConfig
  | SurveyConfig
  | ReferralConfig
  | VisitWebsiteConfig
  | DownloadAppConfig
  | Record<string, any>; // For CUSTOM tasks
