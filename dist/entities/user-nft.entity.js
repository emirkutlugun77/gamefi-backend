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
exports.UserNft = void 0;
const typeorm_1 = require("typeorm");
const nft_type_entity_1 = require("./nft-type.entity");
let UserNft = class UserNft {
    id;
    ownerPublicKey;
    nftMintAddress;
    nftTypeId;
    purchaseTransaction;
    purchasePrice;
    purchasedAt;
    isActive;
    nftType;
};
exports.UserNft = UserNft;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserNft.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserNft.prototype, "ownerPublicKey", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserNft.prototype, "nftMintAddress", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserNft.prototype, "nftTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserNft.prototype, "purchaseTransaction", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", String)
], UserNft.prototype, "purchasePrice", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], UserNft.prototype, "purchasedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], UserNft.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => nft_type_entity_1.NftType, (nftType) => nftType.userNfts),
    (0, typeorm_1.JoinColumn)({ name: 'nftTypeId' }),
    __metadata("design:type", nft_type_entity_1.NftType)
], UserNft.prototype, "nftType", void 0);
exports.UserNft = UserNft = __decorate([
    (0, typeorm_1.Entity)('user_nfts')
], UserNft);
//# sourceMappingURL=user-nft.entity.js.map