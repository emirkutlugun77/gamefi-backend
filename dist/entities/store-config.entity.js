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
exports.StoreConfig = void 0;
const typeorm_1 = require("typeorm");
let StoreConfig = class StoreConfig {
    tabName;
    collectionName;
    collectionId;
    displayName;
    isActive;
    sortOrder;
    createdAt;
    updatedAt;
};
exports.StoreConfig = StoreConfig;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], StoreConfig.prototype, "tabName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StoreConfig.prototype, "collectionName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], StoreConfig.prototype, "collectionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StoreConfig.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StoreConfig.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], StoreConfig.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], StoreConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], StoreConfig.prototype, "updatedAt", void 0);
exports.StoreConfig = StoreConfig = __decorate([
    (0, typeorm_1.Entity)('store_configs')
], StoreConfig);
//# sourceMappingURL=store-config.entity.js.map