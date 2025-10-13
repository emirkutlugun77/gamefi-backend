import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getPresaleInfo(): Promise<{
        success: boolean;
        data: import("./presale/presale.service").PresaleInfo;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    contributePresale(body: {
        wallet: string;
        amount: number;
    }): Promise<{
        success: boolean;
        data: string;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    endPresale(body: {
        adminWallet: string;
    }): Promise<{
        success: boolean;
        data: string;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    restartPresale(body: {
        adminWallet: string;
    }): Promise<{
        success: boolean;
        data: string;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    chooseSide(body: {
        publicKey: string;
        side: string;
    }): Promise<{
        success: boolean;
        data: import("./entities/user.entity").User;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
}
