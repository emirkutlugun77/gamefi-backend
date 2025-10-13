import { Injectable } from '@nestjs/common';
import { TaskType } from '../entities/task.entity';
import {
  TwitterFollowConfig,
  TwitterLikeConfig,
  TwitterRetweetConfig,
  TwitterCommentConfig,
  TwitterTweetConfig,
  InstagramFollowConfig,
  InstagramLikeConfig,
  InstagramCommentConfig,
  FacebookFollowConfig,
  TelegramJoinConfig,
  DiscordJoinConfig,
  YouTubeSubscribeConfig,
  NftHoldConfig,
  QuizConfig,
  ReferralConfig,
  VerificationConfig,
} from '../entities/task-config.types';

/**
 * Task Validator Service
 * Validates task configurations and submission data based on task type
 */
@Injectable()
export class TaskValidatorService {
  /**
   * Validates task configuration based on task type
   */
  validateTaskConfig(type: TaskType, config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      // Twitter Tasks
      case TaskType.TWITTER_FOLLOW:
        if (!config?.username) errors.push('Twitter username is required');
        break;

      case TaskType.TWITTER_LIKE:
      case TaskType.TWITTER_RETWEET:
        if (!config?.tweet_url && !config?.tweet_id) {
          errors.push('Tweet URL or Tweet ID is required');
        }
        break;

      case TaskType.TWITTER_COMMENT:
        if (!config?.tweet_url && !config?.tweet_id) {
          errors.push('Tweet URL or Tweet ID is required');
        }
        if (config?.min_length && config.min_length < 1) {
          errors.push('Minimum length must be at least 1 character');
        }
        break;

      case TaskType.TWITTER_TWEET:
      case TaskType.TWITTER_QUOTE:
        if (config?.required_hashtags && !Array.isArray(config.required_hashtags)) {
          errors.push('Required hashtags must be an array');
        }
        if (config?.required_mentions && !Array.isArray(config.required_mentions)) {
          errors.push('Required mentions must be an array');
        }
        break;

      // Instagram Tasks
      case TaskType.INSTAGRAM_FOLLOW:
        if (!config?.username) errors.push('Instagram username is required');
        break;

      case TaskType.INSTAGRAM_LIKE:
      case TaskType.INSTAGRAM_COMMENT:
      case TaskType.INSTAGRAM_SHARE_STORY:
        if (!config?.post_url && !config?.post_id) {
          errors.push('Instagram post URL or post ID is required');
        }
        break;

      // Facebook Tasks
      case TaskType.FACEBOOK_FOLLOW:
        if (!config?.page_name && !config?.page_url) {
          errors.push('Facebook page name or URL is required');
        }
        break;

      case TaskType.FACEBOOK_JOIN_GROUP:
        if (!config?.group_name && !config?.group_url) {
          errors.push('Facebook group name or URL is required');
        }
        break;

      // Telegram Tasks
      case TaskType.TELEGRAM_JOIN:
        if (!config?.channel_username && !config?.channel_url) {
          errors.push('Telegram channel username or URL is required');
        }
        break;

      case TaskType.TELEGRAM_INVITE:
        if (!config?.min_invites || config.min_invites < 1) {
          errors.push('Minimum invites must be at least 1');
        }
        break;

      // Discord Tasks
      case TaskType.DISCORD_JOIN:
        if (!config?.invite_url) errors.push('Discord invite URL is required');
        break;

      case TaskType.DISCORD_VERIFY:
        if (!config?.server_id) errors.push('Discord server ID is required');
        break;

      // YouTube Tasks
      case TaskType.YOUTUBE_SUBSCRIBE:
        if (!config?.channel_name && !config?.channel_url) {
          errors.push('YouTube channel name or URL is required');
        }
        break;

      case TaskType.YOUTUBE_WATCH:
        if (!config?.video_url && !config?.video_id) {
          errors.push('YouTube video URL or ID is required');
        }
        if (config?.min_watch_time_seconds && config.min_watch_time_seconds < 1) {
          errors.push('Minimum watch time must be at least 1 second');
        }
        break;

      // Web3 Tasks
      case TaskType.NFT_HOLD:
        if (!config?.collection_mint) {
          errors.push('NFT collection mint address is required');
        }
        if (config?.min_amount && config.min_amount < 1) {
          errors.push('Minimum NFT amount must be at least 1');
        }
        break;

      case TaskType.NFT_MINT:
        if (!config?.collection_mint) {
          errors.push('NFT collection mint address is required');
        }
        break;

      case TaskType.TOKEN_SWAP:
        if (!config?.from_token || !config?.to_token) {
          errors.push('From token and to token addresses are required');
        }
        break;

      case TaskType.LIQUIDITY_PROVIDE:
        if (!config?.pool_address) {
          errors.push('Pool address is required');
        }
        break;

      case TaskType.STAKE_TOKENS:
        if (!config?.token_mint || !config?.staking_program) {
          errors.push('Token mint and staking program addresses are required');
        }
        break;

      // Engagement Tasks
      case TaskType.STREAK_MAINTAIN:
        if (!config?.min_streak_days || config.min_streak_days < 1) {
          errors.push('Minimum streak days must be at least 1');
        }
        break;

      case TaskType.QUIZ:
        if (!config?.questions || !Array.isArray(config.questions)) {
          errors.push('Quiz questions array is required');
        } else if (config.questions.length === 0) {
          errors.push('Quiz must have at least one question');
        } else {
          config.questions.forEach((q: any, index: number) => {
            if (!q.question) errors.push(`Question ${index + 1} is missing question text`);
            if (!Array.isArray(q.answers) || q.answers.length < 2) {
              errors.push(`Question ${index + 1} must have at least 2 answers`);
            }
            if (q.correct_answer_index === undefined || q.correct_answer_index < 0) {
              errors.push(`Question ${index + 1} must have a valid correct answer index`);
            }
          });
        }
        break;

      case TaskType.REFERRAL:
        if (!config?.min_referrals || config.min_referrals < 1) {
          errors.push('Minimum referrals must be at least 1');
        }
        break;

      case TaskType.VISIT_WEBSITE:
        if (!config?.website_url) {
          errors.push('Website URL is required');
        }
        break;

      case TaskType.DOWNLOAD_APP:
        if (!config?.app_name) {
          errors.push('App name is required');
        }
        if (!config?.platform) {
          errors.push('Platform (ios/android/both) is required');
        }
        break;

      // Custom tasks don't have strict validation
      case TaskType.CUSTOM:
        break;

      default:
        // Other task types have optional configs
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates task submission data
   */
  validateSubmission(
    type: TaskType,
    config: any,
    submissionData: any,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!submissionData) {
      errors.push('Submission data is required');
      return { valid: false, errors };
    }

    const verificationConfig = config?.verification_config as VerificationConfig;

    // Check if proof is required
    if (verificationConfig?.proof_required) {
      const proofType = verificationConfig.proof_type;

      switch (proofType) {
        case 'screenshot':
          if (!submissionData.screenshot_url) {
            errors.push('Screenshot URL is required');
          }
          break;

        case 'url':
          if (!submissionData.url) {
            errors.push('URL proof is required');
          } else if (!this.isValidUrl(submissionData.url)) {
            errors.push('Invalid URL format');
          }
          break;

        case 'transaction_hash':
          if (!submissionData.transaction_hash) {
            errors.push('Transaction hash is required');
          }
          break;

        case 'code':
          if (!submissionData.verification_code) {
            errors.push('Verification code is required');
          }
          break;

        case 'text':
          if (!submissionData.text_response) {
            errors.push('Text response is required');
          }
          break;
      }
    }

    // Task-specific validation
    switch (type) {
      case TaskType.TWITTER_TWEET:
      case TaskType.TWITTER_COMMENT:
      case TaskType.TWITTER_QUOTE:
        if (submissionData.url && !this.isTwitterUrl(submissionData.url)) {
          errors.push('Must be a valid Twitter/X URL');
        }
        break;

      case TaskType.INSTAGRAM_POST:
      case TaskType.INSTAGRAM_COMMENT:
        if (submissionData.url && !this.isInstagramUrl(submissionData.url)) {
          errors.push('Must be a valid Instagram URL');
        }
        break;

      case TaskType.QUIZ:
        if (!Array.isArray(submissionData.answers)) {
          errors.push('Quiz answers must be an array');
        } else if (submissionData.answers.length !== config.questions?.length) {
          errors.push('Must answer all quiz questions');
        }
        break;

      case TaskType.REFERRAL:
        if (!Array.isArray(submissionData.referral_ids)) {
          errors.push('Referral IDs must be an array');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates if prerequisites are met
   */
  async validatePrerequisites(
    prerequisiteTaskIds: number[],
    userId: number,
    getUserTasksFunc: (userId: number, taskIds: number[]) => Promise<any[]>,
  ): Promise<{ valid: boolean; missingTaskIds: number[] }> {
    if (!prerequisiteTaskIds || prerequisiteTaskIds.length === 0) {
      return { valid: true, missingTaskIds: [] };
    }

    const userTasks = await getUserTasksFunc(userId, prerequisiteTaskIds);
    const completedTaskIds = userTasks
      .filter((ut) => ut.status === 'COMPLETED')
      .map((ut) => ut.task_id);

    const missingTaskIds = prerequisiteTaskIds.filter(
      (id) => !completedTaskIds.includes(id),
    );

    return {
      valid: missingTaskIds.length === 0,
      missingTaskIds,
    };
  }

  /**
   * Checks if task is currently active and available
   */
  validateTaskAvailability(task: any): { available: boolean; reason?: string } {
    const now = new Date();

    // Check status
    if (task.status !== 'ACTIVE') {
      return { available: false, reason: 'Task is not active' };
    }

    // Check start date
    if (task.start_date && new Date(task.start_date) > now) {
      return { available: false, reason: 'Task has not started yet' };
    }

    // Check end date
    if (task.end_date && new Date(task.end_date) < now) {
      return { available: false, reason: 'Task has expired' };
    }

    // Check if user meets level requirement (this would need user data)
    // Implemented separately in service layer

    return { available: true };
  }

  /**
   * Validates repeatable task limits
   */
  validateRepeatableTask(
    task: any,
    currentCompletions: number,
  ): { canRepeat: boolean; reason?: string } {
    if (!task.is_repeatable) {
      return currentCompletions === 0
        ? { canRepeat: true }
        : { canRepeat: false, reason: 'Task is not repeatable' };
    }

    if (task.max_completions && currentCompletions >= task.max_completions) {
      return { canRepeat: false, reason: 'Maximum completions reached' };
    }

    return { canRepeat: true };
  }

  /**
   * Helper: Check if string is valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if URL is from Twitter/X
   */
  private isTwitterUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === 'twitter.com' ||
        urlObj.hostname === 'x.com' ||
        urlObj.hostname === 'www.twitter.com' ||
        urlObj.hostname === 'www.x.com'
      );
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if URL is from Instagram
   */
  private isInstagramUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === 'instagram.com' || urlObj.hostname === 'www.instagram.com'
      );
    } catch {
      return false;
    }
  }

  /**
   * Calculates final reward points including multipliers
   */
  calculateRewardPoints(basePoints: number, multiplier: number = 1.0): number {
    return Math.floor(basePoints * multiplier);
  }

  /**
   * Validates hashtags in text content
   */
  validateHashtags(text: string, requiredHashtags: string[]): { valid: boolean; missing: string[] } {
    const textLower = text.toLowerCase();
    const missing = requiredHashtags.filter(
      (hashtag) => !textLower.includes(hashtag.toLowerCase()),
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validates mentions in text content
   */
  validateMentions(text: string, requiredMentions: string[]): { valid: boolean; missing: string[] } {
    const textLower = text.toLowerCase();
    const missing = requiredMentions.filter(
      (mention) => !textLower.includes(mention.toLowerCase()),
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validates keywords in text content
   */
  validateKeywords(text: string, requiredKeywords: string[]): { valid: boolean; missing: string[] } {
    const textLower = text.toLowerCase();
    const missing = requiredKeywords.filter(
      (keyword) => !textLower.includes(keyword.toLowerCase()),
    );

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Validates quiz answers
   */
  validateQuizAnswers(
    questions: any[],
    userAnswers: number[],
  ): { correct: number; total: number; passed: boolean; minRequired: number } {
    let correct = 0;
    const total = questions.length;

    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer_index) {
        correct++;
      }
    });

    return {
      correct,
      total,
      passed: correct >= total,
      minRequired: total,
    };
  }
}
