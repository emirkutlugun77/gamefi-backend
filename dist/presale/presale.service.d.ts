export interface PresaleInfo {
    publicKey: string;
    admin: string;
    startTs: number;
    endTs: number;
    totalRaised: number;
    totalRaisedSol: string;
    targetLamports: number;
    targetSol: string;
    isActive: boolean;
    timeRemaining: number;
    progress: number;
}
export declare class PresaleService {
    private connection;
    private program;
    constructor();
    private getPresalePDA;
    private getContributionPDA;
    getPresaleInfo(): Promise<PresaleInfo>;
    getContribution(walletAddress: string): Promise<any>;
    prepareInitializePresale(adminWallet: string): Promise<any>;
    prepareContributePresale(contributorWallet: string, amountSol: number): Promise<any>;
    prepareEndPresale(adminWallet: string): Promise<any>;
    prepareRestartPresale(adminWallet: string): Promise<any>;
}
