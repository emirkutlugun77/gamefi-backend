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
exports.PresaleService = void 0;
const common_1 = require("@nestjs/common");
const web3_js_1 = require("@solana/web3.js");
const PROGRAM_ID = new web3_js_1.PublicKey('ptcbSp1UEqYLmod2jgFxGPZnFMqBECcrRyU1fTmnJ5b');
let PresaleService = class PresaleService {
    connection;
    program;
    constructor(connection) {
        this.connection = connection;
    }
    getPresalePDA() {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('presale')], PROGRAM_ID);
    }
    getContributionPDA(presalePDA, contributor) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('contrib'), presalePDA.toBuffer(), contributor.toBuffer()], PROGRAM_ID);
    }
    async getPresaleInfo() {
        try {
            const [presalePDA] = this.getPresalePDA();
            const accountInfo = await this.connection.getAccountInfo(presalePDA);
            if (!accountInfo || accountInfo.data.length === 0) {
                throw new Error('Presale not initialized');
            }
            const data = accountInfo.data;
            let offset = 8;
            const admin = new web3_js_1.PublicKey(data.slice(offset, offset + 32));
            offset += 32;
            const startTs = Number(data.readBigInt64LE(offset));
            offset += 8;
            const endTs = Number(data.readBigInt64LE(offset));
            offset += 8;
            const totalRaised = Number(data.readBigUInt64LE(offset));
            offset += 8;
            const targetLamports = Number(data.readBigUInt64LE(offset));
            offset += 8;
            const isActive = data.readUInt8(offset) === 1;
            offset += 1;
            const bump = data.readUInt8(offset);
            return {
                admin: admin.toString(),
                startTs,
                endTs,
                totalRaised,
                targetLamports,
                isActive,
                bump,
            };
        }
        catch (error) {
            console.error('Error fetching presale info:', error);
            throw error;
        }
    }
    async contributePresale(walletAddress, amount) {
        try {
            const contributor = new web3_js_1.PublicKey(walletAddress);
            const [presalePDA] = this.getPresalePDA();
            const [contributionPDA] = this.getContributionPDA(presalePDA, contributor);
            const transaction = new web3_js_1.Transaction();
            const lamports = Math.floor(amount * 1e9);
            const transferInstruction = web3_js_1.SystemProgram.transfer({
                fromPubkey: contributor,
                toPubkey: presalePDA,
                lamports: lamports,
            });
            transaction.add(transferInstruction);
            return 'simulated_transaction_signature';
        }
        catch (error) {
            console.error('Error contributing to presale:', error);
            throw error;
        }
    }
    async endPresale(adminWallet) {
        try {
            const admin = new web3_js_1.PublicKey(adminWallet);
            const [presalePDA] = this.getPresalePDA();
            const transaction = new web3_js_1.Transaction();
            return 'simulated_end_transaction_signature';
        }
        catch (error) {
            console.error('Error ending presale:', error);
            throw error;
        }
    }
    async restartPresale(adminWallet) {
        try {
            const admin = new web3_js_1.PublicKey(adminWallet);
            const [presalePDA] = this.getPresalePDA();
            const transaction = new web3_js_1.Transaction();
            return 'simulated_restart_transaction_signature';
        }
        catch (error) {
            console.error('Error restarting presale:', error);
            throw error;
        }
    }
};
exports.PresaleService = PresaleService;
exports.PresaleService = PresaleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3_js_1.Connection])
], PresaleService);
//# sourceMappingURL=presale.service.js.map