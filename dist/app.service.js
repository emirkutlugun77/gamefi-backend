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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const web3_js_1 = require("@solana/web3.js");
const presale_service_1 = require("./presale/presale.service");
const user_service_1 = require("./user/user.service");
let AppService = class AppService {
    connection;
    program;
    presaleService;
    userService;
    constructor(userService) {
        this.connection = new web3_js_1.Connection('https://api.devnet.solana.com', 'confirmed');
        this.presaleService = new presale_service_1.PresaleService(this.connection);
        this.userService = userService;
    }
    getHello() {
        return 'Hello World!';
    }
    async getPresaleInfo() {
        try {
            const presaleInfo = await this.presaleService.getPresaleInfo();
            return {
                success: true,
                data: presaleInfo,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to fetch presale info',
                error: error.message,
            };
        }
    }
    async contributePresale(wallet, amount) {
        try {
            const result = await this.presaleService.contributePresale(wallet, amount);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to contribute to presale',
                error: error.message,
            };
        }
    }
    async endPresale(adminWallet) {
        try {
            const result = await this.presaleService.endPresale(adminWallet);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to end presale',
                error: error.message,
            };
        }
    }
    async restartPresale(adminWallet) {
        try {
            const result = await this.presaleService.restartPresale(adminWallet);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to restart presale',
                error: error.message,
            };
        }
    }
    async chooseSide(publicKey, side) {
        try {
            const result = await this.userService.chooseSide(publicKey, side);
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to choose side',
                error: error.message,
            };
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], AppService);
//# sourceMappingURL=app.service.js.map