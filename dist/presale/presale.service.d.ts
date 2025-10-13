import { Connection } from '@solana/web3.js';
export interface PresaleInfo {
    admin: string;
    startTs: number;
    endTs: number;
    totalRaised: number;
    targetLamports: number;
    isActive: boolean;
    bump: number;
}
export declare class PresaleService {
    private connection;
    private program;
    constructor(connection: Connection);
    private getPresalePDA;
    private getContributionPDA;
    getPresaleInfo(): Promise<PresaleInfo>;
    contributePresale(walletAddress: string, amount: number): Promise<string>;
    endPresale(adminWallet: string): Promise<string>;
    restartPresale(adminWallet: string): Promise<string>;
}
