"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchievementsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const achievements_controller_1 = require("./achievements.controller");
const achievements_service_1 = require("./achievements.service");
const task_validator_service_1 = require("./task-validator.service");
const task_transaction_service_1 = require("./services/task-transaction.service");
const user_code_service_1 = require("./services/user-code.service");
const twitter_verification_service_1 = require("./services/twitter-verification.service");
const prerequisite_validator_service_1 = require("./services/prerequisite-validator.service");
const telegram_code_verification_service_1 = require("./services/telegram-code-verification.service");
const task_entity_1 = require("../entities/task.entity");
const user_task_entity_1 = require("../entities/user-task.entity");
const user_entity_1 = require("../entities/user.entity");
const task_transaction_entity_1 = require("../entities/task-transaction.entity");
const nft_collection_entity_1 = require("../entities/nft-collection.entity");
const nft_type_entity_1 = require("../entities/nft-type.entity");
const user_code_entity_1 = require("../entities/user-code.entity");
let AchievementsModule = class AchievementsModule {
};
exports.AchievementsModule = AchievementsModule;
exports.AchievementsModule = AchievementsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                task_entity_1.Task,
                user_task_entity_1.UserTask,
                user_entity_1.User,
                task_transaction_entity_1.TaskTransaction,
                user_code_entity_1.UserCode,
                nft_collection_entity_1.NftCollection,
                nft_type_entity_1.NftType,
            ]),
        ],
        controllers: [achievements_controller_1.AchievementsController],
        providers: [
            achievements_service_1.AchievementsService,
            task_validator_service_1.TaskValidatorService,
            task_transaction_service_1.TaskTransactionService,
            user_code_service_1.UserCodeService,
            twitter_verification_service_1.TwitterVerificationService,
            prerequisite_validator_service_1.PrerequisiteValidatorService,
            telegram_code_verification_service_1.TelegramCodeVerificationService,
        ],
        exports: [
            achievements_service_1.AchievementsService,
            task_validator_service_1.TaskValidatorService,
            task_transaction_service_1.TaskTransactionService,
            user_code_service_1.UserCodeService,
            twitter_verification_service_1.TwitterVerificationService,
            prerequisite_validator_service_1.PrerequisiteValidatorService,
            telegram_code_verification_service_1.TelegramCodeVerificationService,
        ],
    })
], AchievementsModule);
//# sourceMappingURL=achievements.module.js.map