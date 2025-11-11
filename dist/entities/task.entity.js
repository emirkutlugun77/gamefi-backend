"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = exports.TaskCategory = exports.TaskPriority = exports.TaskDifficulty = exports.TaskStatus = exports.TaskType = void 0;
const typeorm_1 = require("typeorm");
var TaskType;
(function (TaskType) {
    TaskType["TWITTER_FOLLOW"] = "TWITTER_FOLLOW";
    TaskType["TWITTER_RETWEET"] = "TWITTER_RETWEET";
    TaskType["TWITTER_LIKE"] = "TWITTER_LIKE";
    TaskType["TWITTER_COMMENT"] = "TWITTER_COMMENT";
    TaskType["TWITTER_TWEET"] = "TWITTER_TWEET";
    TaskType["TWITTER_QUOTE"] = "TWITTER_QUOTE";
    TaskType["INSTAGRAM_FOLLOW"] = "INSTAGRAM_FOLLOW";
    TaskType["INSTAGRAM_LIKE"] = "INSTAGRAM_LIKE";
    TaskType["INSTAGRAM_COMMENT"] = "INSTAGRAM_COMMENT";
    TaskType["INSTAGRAM_SHARE_STORY"] = "INSTAGRAM_SHARE_STORY";
    TaskType["INSTAGRAM_POST"] = "INSTAGRAM_POST";
    TaskType["INSTAGRAM_REEL"] = "INSTAGRAM_REEL";
    TaskType["FACEBOOK_FOLLOW"] = "FACEBOOK_FOLLOW";
    TaskType["FACEBOOK_LIKE"] = "FACEBOOK_LIKE";
    TaskType["FACEBOOK_SHARE"] = "FACEBOOK_SHARE";
    TaskType["FACEBOOK_COMMENT"] = "FACEBOOK_COMMENT";
    TaskType["FACEBOOK_JOIN_GROUP"] = "FACEBOOK_JOIN_GROUP";
    TaskType["TELEGRAM_JOIN"] = "TELEGRAM_JOIN";
    TaskType["TELEGRAM_SHARE"] = "TELEGRAM_SHARE";
    TaskType["TELEGRAM_REACT"] = "TELEGRAM_REACT";
    TaskType["TELEGRAM_INVITE"] = "TELEGRAM_INVITE";
    TaskType["DISCORD_JOIN"] = "DISCORD_JOIN";
    TaskType["DISCORD_VERIFY"] = "DISCORD_VERIFY";
    TaskType["DISCORD_MESSAGE"] = "DISCORD_MESSAGE";
    TaskType["DISCORD_REACT"] = "DISCORD_REACT";
    TaskType["YOUTUBE_SUBSCRIBE"] = "YOUTUBE_SUBSCRIBE";
    TaskType["YOUTUBE_LIKE"] = "YOUTUBE_LIKE";
    TaskType["YOUTUBE_COMMENT"] = "YOUTUBE_COMMENT";
    TaskType["YOUTUBE_WATCH"] = "YOUTUBE_WATCH";
    TaskType["TIKTOK_FOLLOW"] = "TIKTOK_FOLLOW";
    TaskType["TIKTOK_LIKE"] = "TIKTOK_LIKE";
    TaskType["TIKTOK_SHARE"] = "TIKTOK_SHARE";
    TaskType["TIKTOK_COMMENT"] = "TIKTOK_COMMENT";
    TaskType["NFT_HOLD"] = "NFT_HOLD";
    TaskType["NFT_MINT"] = "NFT_MINT";
    TaskType["WALLET_CONNECT"] = "WALLET_CONNECT";
    TaskType["TOKEN_SWAP"] = "TOKEN_SWAP";
    TaskType["LIQUIDITY_PROVIDE"] = "LIQUIDITY_PROVIDE";
    TaskType["STAKE_TOKENS"] = "STAKE_TOKENS";
    TaskType["DAILY_LOGIN"] = "DAILY_LOGIN";
    TaskType["STREAK_MAINTAIN"] = "STREAK_MAINTAIN";
    TaskType["QUIZ"] = "QUIZ";
    TaskType["SURVEY"] = "SURVEY";
    TaskType["REFERRAL"] = "REFERRAL";
    TaskType["VISIT_WEBSITE"] = "VISIT_WEBSITE";
    TaskType["DOWNLOAD_APP"] = "DOWNLOAD_APP";
    TaskType["SUBMIT_TEXT"] = "SUBMIT_TEXT";
    TaskType["SUBMIT_IMAGE"] = "SUBMIT_IMAGE";
    TaskType["CUSTOM"] = "CUSTOM";
})(TaskType || (exports.TaskType = TaskType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["ACTIVE"] = "ACTIVE";
    TaskStatus["INACTIVE"] = "INACTIVE";
    TaskStatus["EXPIRED"] = "EXPIRED";
    TaskStatus["SCHEDULED"] = "SCHEDULED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskDifficulty;
(function (TaskDifficulty) {
    TaskDifficulty["EASY"] = "EASY";
    TaskDifficulty["MEDIUM"] = "MEDIUM";
    TaskDifficulty["HARD"] = "HARD";
    TaskDifficulty["EXPERT"] = "EXPERT";
})(TaskDifficulty || (exports.TaskDifficulty = TaskDifficulty = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "LOW";
    TaskPriority["NORMAL"] = "NORMAL";
    TaskPriority["HIGH"] = "HIGH";
    TaskPriority["URGENT"] = "URGENT";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var TaskCategory;
(function (TaskCategory) {
    TaskCategory["SOCIAL_MEDIA"] = "SOCIAL_MEDIA";
    TaskCategory["WEB3"] = "WEB3";
    TaskCategory["ENGAGEMENT"] = "ENGAGEMENT";
    TaskCategory["COMMUNITY"] = "COMMUNITY";
    TaskCategory["SPECIAL_EVENT"] = "SPECIAL_EVENT";
})(TaskCategory || (exports.TaskCategory = TaskCategory = {}));
let Task = class Task {
    id;
    title;
    description;
    type;
    submission_prompt;
    reward_points;
    status;
    config;
    verification_config;
    is_repeatable;
    max_completions;
    start_date;
    end_date;
    display_order;
    difficulty;
    priority;
    category;
    tags;
    icon_url;
    required_level;
    prerequisite_task_ids;
    prerequisite_conditions;
    reward_multiplier;
    total_completions;
    estimated_time_minutes;
    requires_transaction;
    transaction_config;
    star_rate;
    created_at;
    updated_at;
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Task.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TaskType }),
    __metadata("design:type", String)
], Task.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Task.prototype, "submission_prompt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Task.prototype, "reward_points", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TaskStatus, default: TaskStatus.ACTIVE }),
    __metadata("design:type", String)
], Task.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "verification_config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Task.prototype, "is_repeatable", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Task.prototype, "max_completions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Task.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Task.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TaskDifficulty, default: TaskDifficulty.EASY }),
    __metadata("design:type", String)
], Task.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TaskPriority, default: TaskPriority.NORMAL }),
    __metadata("design:type", String)
], Task.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TaskCategory,
        default: TaskCategory.SOCIAL_MEDIA,
    }),
    __metadata("design:type", String)
], Task.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Task.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Task.prototype, "icon_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "required_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Task.prototype, "prerequisite_task_ids", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "prerequisite_conditions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 1.0 }),
    __metadata("design:type", Number)
], Task.prototype, "reward_multiplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Task.prototype, "total_completions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Task.prototype, "estimated_time_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Task.prototype, "requires_transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "transaction_config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 2, scale: 1, nullable: true }),
    __metadata("design:type", Number)
], Task.prototype, "star_rate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Task.prototype, "updated_at", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)('tasks')
], Task);
//# sourceMappingURL=task.entity.js.map