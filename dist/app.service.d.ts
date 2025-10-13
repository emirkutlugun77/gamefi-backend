import { UserService } from './user/user.service';
export declare class AppService {
    private connection;
    private program;
    private presaleService;
    private userService;
    constructor(userService: UserService);
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
    contributePresale(wallet: string, amount: number): Promise<{
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
    endPresale(adminWallet: string): Promise<{
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
    restartPresale(adminWallet: string): Promise<{
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
    chooseSide(publicKey: string, side: string): Promise<{
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
