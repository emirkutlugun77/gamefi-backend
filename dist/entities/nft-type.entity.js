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
exports.NftType = void 0;
const typeorm_1 = require("typeorm");
const nft_collection_entity_1 = require("./nft-collection.entity");
const user_nft_entity_1 = require("./user-nft.entity");
let NftType = class NftType {
    id;
    collectionId;
    name;
    uri;
    price;
    maxSupply;
    currentSupply;
    createdAt;
    updatedAt;
    collection;
    userNfts;
};
exports.NftType = NftType;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], NftType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftType.prototype, "collectionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftType.prototype, "uri", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", String)
], NftType.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", String)
], NftType.prototype, "maxSupply", void 0);
__decorate([
    (0, typeorm_1.Column)('bigint'),
    __metadata("design:type", String)
], NftType.prototype, "currentSupply", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], NftType.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], NftType.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => nft_collection_entity_1.NftCollection, (collection) => collection.nftTypes),
    (0, typeorm_1.JoinColumn)({ name: 'collectionId' }),
    __metadata("design:type", nft_collection_entity_1.NftCollection)
], NftType.prototype, "collection", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_nft_entity_1.UserNft, (userNft) => userNft.nftType),
    __metadata("design:type", Array)
], NftType.prototype, "userNfts", void 0);
exports.NftType = NftType = __decorate([
    (0, typeorm_1.Entity)('nft_types')
], NftType);
//# sourceMappingURL=nft-type.entity.js.map