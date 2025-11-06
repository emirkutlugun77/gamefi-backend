"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskValidatorService = void 0;
const common_1 = require("@nestjs/common");
const task_entity_1 = require("../entities/task.entity");
let TaskValidatorService = class TaskValidatorService {
    validateTaskConfig(type, config) {
        const errors = [];
        switch (type) {
            case task_entity_1.TaskType.TWITTER_FOLLOW:
                if (!config?.username)
                    errors.push('Twitter username is required');
                break;
            case task_entity_1.TaskType.TWITTER_LIKE:
            case task_entity_1.TaskType.TWITTER_RETWEET:
                if (!config?.tweet_url && !config?.tweet_id) {
                    errors.push('Tweet URL or Tweet ID is required');
                }
                break;
            case task_entity_1.TaskType.TWITTER_COMMENT:
                if (!config?.tweet_url && !config?.tweet_id) {
                    errors.push('Tweet URL or Tweet ID is required');
                }
                if (config?.min_length && config.min_length < 1) {
                    errors.push('Minimum length must be at least 1 character');
                }
                break;
            case task_entity_1.TaskType.TWITTER_TWEET:
            case task_entity_1.TaskType.TWITTER_QUOTE:
                if (config?.required_hashtags &&
                    !Array.isArray(config.required_hashtags)) {
                    errors.push('Required hashtags must be an array');
                }
                if (config?.required_mentions &&
                    !Array.isArray(config.required_mentions)) {
                    errors.push('Required mentions must be an array');
                }
                break;
            case task_entity_1.TaskType.INSTAGRAM_FOLLOW:
                if (!config?.username)
                    errors.push('Instagram username is required');
                break;
            case task_entity_1.TaskType.INSTAGRAM_LIKE:
            case task_entity_1.TaskType.INSTAGRAM_COMMENT:
            case task_entity_1.TaskType.INSTAGRAM_SHARE_STORY:
                if (!config?.post_url && !config?.post_id) {
                    errors.push('Instagram post URL or post ID is required');
                }
                break;
            case task_entity_1.TaskType.FACEBOOK_FOLLOW:
                if (!config?.page_name && !config?.page_url) {
                    errors.push('Facebook page name or URL is required');
                }
                break;
            case task_entity_1.TaskType.FACEBOOK_JOIN_GROUP:
                if (!config?.group_name && !config?.group_url) {
                    errors.push('Facebook group name or URL is required');
                }
                break;
            case task_entity_1.TaskType.TELEGRAM_JOIN:
                if (!config?.channel_username && !config?.channel_url) {
                    errors.push('Telegram channel username or URL is required');
                }
                break;
            case task_entity_1.TaskType.TELEGRAM_INVITE:
                if (!config?.min_invites || config.min_invites < 1) {
                    errors.push('Minimum invites must be at least 1');
                }
                break;
            case task_entity_1.TaskType.DISCORD_JOIN:
                if (!config?.invite_url)
                    errors.push('Discord invite URL is required');
                break;
            case task_entity_1.TaskType.DISCORD_VERIFY:
                if (!config?.server_id)
                    errors.push('Discord server ID is required');
                break;
            case task_entity_1.TaskType.YOUTUBE_SUBSCRIBE:
                if (!config?.channel_name && !config?.channel_url) {
                    errors.push('YouTube channel name or URL is required');
                }
                break;
            case task_entity_1.TaskType.YOUTUBE_WATCH:
                if (!config?.video_url && !config?.video_id) {
                    errors.push('YouTube video URL or ID is required');
                }
                if (config?.min_watch_time_seconds &&
                    config.min_watch_time_seconds < 1) {
                    errors.push('Minimum watch time must be at least 1 second');
                }
                break;
            case task_entity_1.TaskType.NFT_HOLD:
                if (!config?.collection_mint) {
                    errors.push('NFT collection mint address is required');
                }
                if (config?.min_amount && config.min_amount < 1) {
                    errors.push('Minimum NFT amount must be at least 1');
                }
                break;
            case task_entity_1.TaskType.NFT_MINT:
                if (!config?.collection_mint) {
                    errors.push('NFT collection mint address is required');
                }
                break;
            case task_entity_1.TaskType.TOKEN_SWAP:
                if (!config?.from_token || !config?.to_token) {
                    errors.push('From token and to token addresses are required');
                }
                break;
            case task_entity_1.TaskType.LIQUIDITY_PROVIDE:
                if (!config?.pool_address) {
                    errors.push('Pool address is required');
                }
                break;
            case task_entity_1.TaskType.STAKE_TOKENS:
                if (!config?.token_mint || !config?.staking_program) {
                    errors.push('Token mint and staking program addresses are required');
                }
                break;
            case task_entity_1.TaskType.STREAK_MAINTAIN:
                if (!config?.min_streak_days || config.min_streak_days < 1) {
                    errors.push('Minimum streak days must be at least 1');
                }
                break;
            case task_entity_1.TaskType.QUIZ:
                if (!config?.questions || !Array.isArray(config.questions)) {
                    errors.push('Quiz questions array is required');
                }
                else if (config.questions.length === 0) {
                    errors.push('Quiz must have at least one question');
                }
                else {
                    config.questions.forEach((q, index) => {
                        if (!q.question)
                            errors.push(`Question ${index + 1} is missing question text`);
                        if (!Array.isArray(q.answers) || q.answers.length < 2) {
                            errors.push(`Question ${index + 1} must have at least 2 answers`);
                        }
                        if (q.correct_answer_index === undefined ||
                            q.correct_answer_index < 0) {
                            errors.push(`Question ${index + 1} must have a valid correct answer index`);
                        }
                    });
                }
                break;
            case task_entity_1.TaskType.REFERRAL:
                if (!config?.min_referrals || config.min_referrals < 1) {
                    errors.push('Minimum referrals must be at least 1');
                }
                break;
            case task_entity_1.TaskType.VISIT_WEBSITE:
                if (!config?.website_url) {
                    errors.push('Website URL is required');
                }
                break;
            case task_entity_1.TaskType.DOWNLOAD_APP:
                if (!config?.app_name) {
                    errors.push('App name is required');
                }
                if (!config?.platform) {
                    errors.push('Platform (ios/android/both) is required');
                }
                break;
            case task_entity_1.TaskType.CUSTOM:
                break;
            default:
                break;
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    validateSubmission(type, config, submissionData) {
        const errors = [];
        if (!submissionData) {
            errors.push('Submission data is required');
            return { valid: false, errors };
        }
        const verificationConfig = config?.verification_config;
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
                    }
                    else if (!this.isValidUrl(submissionData.url)) {
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
        switch (type) {
            case task_entity_1.TaskType.TWITTER_TWEET:
            case task_entity_1.TaskType.TWITTER_COMMENT:
            case task_entity_1.TaskType.TWITTER_QUOTE:
                if (submissionData.url && !this.isTwitterUrl(submissionData.url)) {
                    errors.push('Must be a valid Twitter/X URL');
                }
                break;
            case task_entity_1.TaskType.INSTAGRAM_POST:
            case task_entity_1.TaskType.INSTAGRAM_COMMENT:
                if (submissionData.url && !this.isInstagramUrl(submissionData.url)) {
                    errors.push('Must be a valid Instagram URL');
                }
                break;
            case task_entity_1.TaskType.QUIZ:
                if (!Array.isArray(submissionData.answers)) {
                    errors.push('Quiz answers must be an array');
                }
                else if (submissionData.answers.length !== config.questions?.length) {
                    errors.push('Must answer all quiz questions');
                }
                break;
            case task_entity_1.TaskType.REFERRAL:
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
    async validatePrerequisites(prerequisiteTaskIds, userId, getUserTasksFunc) {
        if (!prerequisiteTaskIds || prerequisiteTaskIds.length === 0) {
            return { valid: true, missingTaskIds: [] };
        }
        const userTasks = await getUserTasksFunc(userId, prerequisiteTaskIds);
        const completedTaskIds = userTasks
            .filter((ut) => ut.status === 'COMPLETED')
            .map((ut) => ut.task_id);
        const missingTaskIds = prerequisiteTaskIds.filter((id) => !completedTaskIds.includes(id));
        return {
            valid: missingTaskIds.length === 0,
            missingTaskIds,
        };
    }
    validateTaskAvailability(task) {
        const now = new Date();
        if (task.status !== 'ACTIVE') {
            return { available: false, reason: 'Task is not active' };
        }
        if (task.start_date && new Date(task.start_date) > now) {
            return { available: false, reason: 'Task has not started yet' };
        }
        if (task.end_date && new Date(task.end_date) < now) {
            return { available: false, reason: 'Task has expired' };
        }
        return { available: true };
    }
    validateRepeatableTask(task, currentCompletions) {
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
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    isTwitterUrl(url) {
        try {
            const urlObj = new URL(url);
            return (urlObj.hostname === 'twitter.com' ||
                urlObj.hostname === 'x.com' ||
                urlObj.hostname === 'www.twitter.com' ||
                urlObj.hostname === 'www.x.com');
        }
        catch {
            return false;
        }
    }
    isInstagramUrl(url) {
        try {
            const urlObj = new URL(url);
            return (urlObj.hostname === 'instagram.com' ||
                urlObj.hostname === 'www.instagram.com');
        }
        catch {
            return false;
        }
    }
    calculateRewardPoints(basePoints, multiplier = 1.0) {
        return Math.floor(basePoints * multiplier);
    }
    validateHashtags(text, requiredHashtags) {
        const textLower = text.toLowerCase();
        const missing = requiredHashtags.filter((hashtag) => !textLower.includes(hashtag.toLowerCase()));
        return {
            valid: missing.length === 0,
            missing,
        };
    }
    validateMentions(text, requiredMentions) {
        const textLower = text.toLowerCase();
        const missing = requiredMentions.filter((mention) => !textLower.includes(mention.toLowerCase()));
        return {
            valid: missing.length === 0,
            missing,
        };
    }
    validateKeywords(text, requiredKeywords) {
        const textLower = text.toLowerCase();
        const missing = requiredKeywords.filter((keyword) => !textLower.includes(keyword.toLowerCase()));
        return {
            valid: missing.length === 0,
            missing,
        };
    }
    validateQuizAnswers(questions, userAnswers) {
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
};
exports.TaskValidatorService = TaskValidatorService;
exports.TaskValidatorService = TaskValidatorService = __decorate([
    (0, common_1.Injectable)()
], TaskValidatorService);
//# sourceMappingURL=task-validator.service.js.map