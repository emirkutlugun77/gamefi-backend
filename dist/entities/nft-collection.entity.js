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
exports.NftCollection = void 0;
const typeorm_1 = require("typeorm");
const nft_type_entity_1 = require("./nft-type.entity");
let NftCollection = class NftCollection {
    id;
    admin;
    name;
    symbol;
    uri;
    royalty;
    isActive;
    createdAt;
    updatedAt;
    nftTypes;
};
exports.NftCollection = NftCollection;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], NftCollection.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftCollection.prototype, "admin", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftCollection.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftCollection.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], NftCollection.prototype, "uri", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NftCollection.prototype, "royalty", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], NftCollection.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], NftCollection.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], NftCollection.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => nft_type_entity_1.NftType, (nftType) => nftType.collection),
    __metadata("design:type", Array)
], NftCollection.prototype, "nftTypes", void 0);
exports.NftCollection = NftCollection = __decorate([
    (0, typeorm_1.Entity)('nft_collections')
], NftCollection);
//# sourceMappingURL=nft-collection.entity.js.map