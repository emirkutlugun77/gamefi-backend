"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nft_controller_1 = require("./nft.controller");
const nft_service_1 = require("./nft.service");
const nft_admin_controller_1 = require("./nft-admin.controller");
const nft_admin_service_1 = require("./nft-admin.service");
const solana_contract_service_1 = require("./solana-contract.service");
const auth_module_1 = require("../auth/auth.module");
const nft_collection_entity_1 = require("../entities/nft-collection.entity");
const nft_type_entity_1 = require("../entities/nft-type.entity");
const store_config_entity_1 = require("../entities/store-config.entity");
let NftModule = class NftModule {
};
exports.NftModule = NftModule;
exports.NftModule = NftModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([nft_collection_entity_1.NftCollection, nft_type_entity_1.NftType, store_config_entity_1.StoreConfig]),
            auth_module_1.AuthModule,
        ],
        controllers: [nft_controller_1.NftController, nft_admin_controller_1.NftAdminController],
        providers: [nft_service_1.NftService, nft_admin_service_1.NftAdminService, solana_contract_service_1.SolanaContractService],
        exports: [nft_service_1.NftService, nft_admin_service_1.NftAdminService, solana_contract_service_1.SolanaContractService],
    })
], NftModule);
//# sourceMappingURL=nft.module.js.map