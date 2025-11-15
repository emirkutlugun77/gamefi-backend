import { UserService } from './user/user.service';
export declare class AppService {
    private readonly userService;
    constructor(userService: UserService);
    getHello(): string;
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
