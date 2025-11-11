export interface TwitterFollowConfig {
    username: string;
    profile_url?: string;
}
export interface TwitterLikeConfig {
    tweet_url: string;
    tweet_id?: string;
}
export interface TwitterRetweetConfig {
    tweet_url: string;
    tweet_id?: string;
    require_quote?: boolean;
}
export interface TwitterCommentConfig {
    tweet_url: string;
    tweet_id?: string;
    min_length?: number;
    required_keywords?: string[];
    required_hashtags?: string[];
}
export interface TwitterTweetConfig {
    required_hashtags?: string[];
    required_keywords?: string[];
    required_mentions?: string[];
    min_length?: number;
    max_length?: number;
    require_media?: boolean;
}
export interface TwitterQuoteConfig {
    tweet_url: string;
    tweet_id?: string;
    min_length?: number;
    required_hashtags?: string[];
}
export interface InstagramFollowConfig {
    username: string;
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
    banned_words?: string[];
}
export interface InstagramShareStoryConfig {
    post_url?: string;
    required_hashtags?: string[];
    required_mentions?: string[];
    require_tag?: boolean;
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
    required_audio?: string;
}
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
    share_type?: 'public' | 'friends' | 'any';
    require_comment?: boolean;
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
    require_post?: boolean;
}
export interface TelegramJoinConfig {
    channel_username: string;
    channel_url?: string;
    channel_id?: string;
    require_notifications?: boolean;
}
export interface TelegramShareConfig {
    message_url?: string;
    channel_username?: string;
    min_shares?: number;
}
export interface TelegramReactConfig {
    message_url: string;
    channel_username: string;
    message_id?: number;
    required_emoji?: string;
}
export interface TelegramInviteConfig {
    channel_username: string;
    min_invites: number;
    require_active?: boolean;
}
export interface DiscordJoinConfig {
    server_name: string;
    invite_url: string;
    server_id?: string;
}
export interface DiscordVerifyConfig {
    server_id: string;
    role_id?: string;
    verification_channel?: string;
}
export interface DiscordMessageConfig {
    server_id: string;
    channel_id?: string;
    channel_name?: string;
    min_messages?: number;
    min_length?: number;
    required_keywords?: string[];
}
export interface DiscordReactConfig {
    server_id: string;
    channel_id: string;
    message_id: string;
    required_emoji?: string;
}
export interface YouTubeSubscribeConfig {
    channel_name: string;
    channel_url: string;
    channel_id?: string;
    require_notifications?: boolean;
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
    min_watch_time_seconds?: number;
    require_full_watch?: boolean;
}
export interface TikTokFollowConfig {
    username: string;
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
export interface NftHoldConfig {
    collection_mint: string;
    min_amount?: number;
    specific_trait?: {
        trait_type: string;
        value: string;
    };
}
export interface NftMintConfig {
    collection_mint: string;
    mint_url?: string;
    max_price?: number;
}
export interface WalletConnectConfig {
    required_network?: string;
    min_balance?: number;
}
export interface TokenSwapConfig {
    from_token: string;
    to_token: string;
    min_amount?: number;
    dex?: string;
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
export interface DailyLoginConfig {
    required_consecutive_days?: number;
    time_window_hours?: number;
}
export interface StreakMaintainConfig {
    min_streak_days: number;
    action_type: 'login' | 'task_completion' | 'any';
}
export interface QuizConfig {
    questions: QuizQuestion[];
    min_correct_answers?: number;
    time_limit_seconds?: number;
    randomize_questions?: boolean;
    randomize_answers?: boolean;
}
export interface QuizQuestion {
    question: string;
    answers: string[];
    correct_answer_index: number;
    points?: number;
}
export interface SurveyConfig {
    survey_url?: string;
    questions?: SurveyQuestion[];
    min_answers?: number;
}
export interface SurveyQuestion {
    question: string;
    type: 'text' | 'multiple_choice' | 'rating' | 'yes_no';
    options?: string[];
    required?: boolean;
}
export interface ReferralConfig {
    min_referrals: number;
    require_active?: boolean;
    bonus_per_referral?: number;
    max_referrals?: number;
}
export interface VisitWebsiteConfig {
    website_url: string;
    min_time_seconds?: number;
    require_interaction?: boolean;
    verification_code?: string;
}
export interface DownloadAppConfig {
    app_name: string;
    platform: 'ios' | 'android' | 'both';
    app_store_url?: string;
    play_store_url?: string;
    require_open?: boolean;
}
export interface SubmitTextConfig {
    min_length?: number;
    max_length?: number;
    required_keywords?: string[];
    banned_words?: string[];
    placeholder?: string;
    allow_multiline?: boolean;
    require_unique?: boolean;
}
export interface SubmitImageConfig {
    max_file_size_mb?: number;
    allowed_formats?: string[];
    min_width?: number;
    min_height?: number;
    max_width?: number;
    max_height?: number;
    require_moderation?: boolean;
    description_required?: boolean;
    description_min_length?: number;
}
export interface VerificationConfig {
    method: 'manual' | 'automatic' | 'semi_automatic' | 'proof_required';
    api_endpoint?: string;
    api_key_required?: boolean;
    proof_type?: 'screenshot' | 'url' | 'transaction_hash' | 'code' | 'text';
    proof_required?: boolean;
    proof_instructions?: string;
    require_captcha?: boolean;
    min_account_age_days?: number;
    min_followers?: number;
    block_suspicious_accounts?: boolean;
    verification_delay_hours?: number;
    expires_after_hours?: number;
    require_admin_approval?: boolean;
    auto_reject_criteria?: string[];
}
export type TaskConfig = TwitterFollowConfig | TwitterLikeConfig | TwitterRetweetConfig | TwitterCommentConfig | TwitterTweetConfig | TwitterQuoteConfig | InstagramFollowConfig | InstagramLikeConfig | InstagramCommentConfig | InstagramShareStoryConfig | InstagramPostConfig | InstagramReelConfig | FacebookFollowConfig | FacebookLikeConfig | FacebookShareConfig | FacebookCommentConfig | FacebookJoinGroupConfig | TelegramJoinConfig | TelegramShareConfig | TelegramReactConfig | TelegramInviteConfig | DiscordJoinConfig | DiscordVerifyConfig | DiscordMessageConfig | DiscordReactConfig | YouTubeSubscribeConfig | YouTubeLikeConfig | YouTubeCommentConfig | YouTubeWatchConfig | TikTokFollowConfig | TikTokLikeConfig | TikTokShareConfig | TikTokCommentConfig | NftHoldConfig | NftMintConfig | WalletConnectConfig | TokenSwapConfig | LiquidityProvideConfig | StakeTokensConfig | DailyLoginConfig | StreakMaintainConfig | QuizConfig | SurveyConfig | ReferralConfig | VisitWebsiteConfig | DownloadAppConfig | SubmitTextConfig | SubmitImageConfig | Record<string, any>;
