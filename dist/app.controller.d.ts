import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
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
