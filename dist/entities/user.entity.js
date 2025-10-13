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
exports.User = exports.PlayerSide = void 0;
const typeorm_1 = require("typeorm");
var PlayerSide;
(function (PlayerSide) {
    PlayerSide["DARK"] = "DARK";
    PlayerSide["HOLY"] = "HOLY";
    PlayerSide["NOT_CHOSEN"] = "NOT_CHOSEN";
})(PlayerSide || (exports.PlayerSide = PlayerSide = {}));
let User = class User {
    id;
    publicKey;
    telegramId;
    chosenSide;
    airdrop_point;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    (0, typeorm_1.Index)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "publicKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    (0, typeorm_1.Index)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "telegramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: PlayerSide.NOT_CHOSEN }),
    __metadata("design:type", String)
], User.prototype, "chosenSide", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "airdrop_point", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map