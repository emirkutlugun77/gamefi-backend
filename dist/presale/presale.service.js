"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresaleService = void 0;
const common_1 = require("@nestjs/common");
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_2 = require("@solana/web3.js");
const IDL = __importStar(require("../nft/nft_marketplace_idl.json"));
const PROGRAM_ID = new web3_js_1.PublicKey('6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm');
let PresaleService = class PresaleService {
    connection;
    program;
    constructor() {
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        const dummyKeypair = web3_js_2.Keypair.generate();
        const wallet = new anchor_1.Wallet(dummyKeypair);
        const provider = new anchor_1.AnchorProvider(this.connection, wallet, {
            commitment: 'confirmed',
        });
        this.program = new anchor_1.Program(IDL, provider);
    }
    getPresalePDA() {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('presale')], PROGRAM_ID);
    }
    getContributionPDA(presalePda, contributor) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('contrib'), presalePda.toBuffer(), contributor.toBuffer()], PROGRAM_ID);
    }
    async getPresaleInfo() {
        try {
            const [presalePDA] = this.getPresalePDA();
            const presaleAccount = await this.program.account.presale.fetch(presalePDA);
            const currentTime = Math.floor(Date.now() / 1000);
            const timeRemaining = Math.max(0, presaleAccount.endTs.toNumber() - currentTime);
            const progress = Math.min(100, (presaleAccount.totalRaised.toNumber() /
                presaleAccount.targetLamports.toNumber()) *
                100);
            return {
                publicKey: presalePDA.toString(),
                admin: presaleAccount.admin.toString(),
                startTs: presaleAccount.startTs.toNumber(),
                endTs: presaleAccount.endTs.toNumber(),
                totalRaised: presaleAccount.totalRaised.toNumber(),
                totalRaisedSol: (presaleAccount.totalRaised.toNumber() / 1e9).toFixed(2),
                targetLamports: presaleAccount.targetLamports.toNumber(),
                targetSol: (presaleAccount.targetLamports.toNumber() / 1e9).toFixed(0),
                isActive: presaleAccount.isActive,
                timeRemaining,
                progress,
            };
        }
        catch (error) {
            console.error('Error fetching presale info:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch presale info',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getContribution(walletAddress) {
        try {
            const contributor = new web3_js_1.PublicKey(walletAddress);
            const [presalePDA] = this.getPresalePDA();
            const [contributionPDA] = this.getContributionPDA(presalePDA, contributor);
            try {
                const contribution = await this.program.account.presaleContribution.fetch(contributionPDA);
                return {
                    success: true,
                    contribution: {
                        publicKey: contributionPDA.toString(),
                        presale: contribution.presale.toString(),
                        contributor: contribution.contributor.toString(),
                        amount: contribution.amount.toNumber(),
                        amountSol: (contribution.amount.toNumber() / 1e9).toFixed(2),
                    },
                };
            }
            catch (err) {
                return {
                    success: true,
                    contribution: null,
                    message: 'No contribution found for this wallet',
                };
            }
        }
        catch (error) {
            console.error('Error fetching contribution:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to fetch contribution',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async prepareInitializePresale(adminWallet) {
        try {
            console.log('🚀 Preparing initialize presale transaction...');
            const admin = new web3_js_1.PublicKey(adminWallet);
            const [presalePDA] = this.getPresalePDA();
            console.log('Admin:', admin.toString());
            console.log('Presale PDA:', presalePDA.toString());
            const instruction = await this.program.methods
                .initializePresale()
                .accounts({
                presale: presalePDA,
                admin: admin,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .instruction();
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                units: 300000,
            }));
            transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1,
            }));
            transaction.add(instruction);
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = admin;
            const serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });
            console.log('✅ Initialize presale transaction prepared');
            return {
                success: true,
                message: 'Transaction prepared. Please sign with your wallet.',
                transaction: serializedTransaction.toString('base64'),
                presalePda: presalePDA.toString(),
            };
        }
        catch (error) {
            console.error('Error preparing initialize presale transaction:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to prepare initialize presale transaction',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async prepareContributePresale(contributorWallet, amountSol) {
        try {
            console.log('💰 Preparing contribute presale transaction:', amountSol, 'SOL');
            const contributor = new web3_js_1.PublicKey(contributorWallet);
            const [presalePDA] = this.getPresalePDA();
            const [contributionPDA] = this.getContributionPDA(presalePDA, contributor);
            const lamports = Math.floor(amountSol * 1e9);
            console.log('Contributor:', contributor.toString());
            console.log('Presale PDA:', presalePDA.toString());
            console.log('Contribution PDA:', contributionPDA.toString());
            console.log('Amount:', lamports, 'lamports');
            const instruction = await this.program.methods
                .contributePresale(new anchor_1.BN(lamports))
                .accounts({
                presale: presalePDA,
                contribution: contributionPDA,
                contributor: contributor,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .instruction();
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                units: 300000,
            }));
            transaction.add(instruction);
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = contributor;
            const serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });
            console.log('✅ Contribute presale transaction prepared');
            return {
                success: true,
                message: 'Transaction prepared. Please sign with your wallet.',
                transaction: serializedTransaction.toString('base64'),
                contributionPda: contributionPDA.toString(),
            };
        }
        catch (error) {
            console.error('Error preparing contribute presale transaction:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to prepare contribute presale transaction',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async prepareEndPresale(adminWallet) {
        try {
            console.log('🏁 Preparing end presale transaction...');
            const admin = new web3_js_1.PublicKey(adminWallet);
            const [presalePDA] = this.getPresalePDA();
            console.log('Admin:', admin.toString());
            console.log('Presale PDA:', presalePDA.toString());
            const instruction = await this.program.methods
                .endPresale()
                .accounts({
                presale: presalePDA,
                admin: admin,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .instruction();
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                units: 300000,
            }));
            transaction.add(instruction);
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = admin;
            const serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });
            console.log('✅ End presale transaction prepared');
            return {
                success: true,
                message: 'Transaction prepared. Please sign with your wallet.',
                transaction: serializedTransaction.toString('base64'),
            };
        }
        catch (error) {
            console.error('Error preparing end presale transaction:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to prepare end presale transaction',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async prepareRestartPresale(adminWallet) {
        try {
            console.log('🔄 Preparing restart presale transaction...');
            const admin = new web3_js_1.PublicKey(adminWallet);
            const [presalePDA] = this.getPresalePDA();
            console.log('Admin:', admin.toString());
            console.log('Presale PDA:', presalePDA.toString());
            const instruction = await this.program.methods
                .restartPresale()
                .accounts({
                presale: presalePDA,
                admin: admin,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .instruction();
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                units: 300000,
            }));
            transaction.add(instruction);
            const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = admin;
            const serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            });
            console.log('✅ Restart presale transaction prepared');
            return {
                success: true,
                message: 'Transaction prepared. Please sign with your wallet.',
                transaction: serializedTransaction.toString('base64'),
            };
        }
        catch (error) {
            console.error('Error preparing restart presale transaction:', error);
            throw new common_1.HttpException({
                success: false,
                message: 'Failed to prepare restart presale transaction',
                error: error.message,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.PresaleService = PresaleService;
exports.PresaleService = PresaleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PresaleService);
//# sourceMappingURL=presale.service.js.map