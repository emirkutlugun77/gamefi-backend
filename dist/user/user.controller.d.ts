import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { ChooseSideDto } from './dto/choose-side.dto';
import { RegisterDto } from './dto/register.dto';
import { GetByPublicKeyDto } from './dto/get-by-public-key.dto';
import { GetByTelegramIdDto } from './dto/get-by-telegram-id.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUsers(): Promise<User[]>;
    getByPublicKey(publicKey: GetByPublicKeyDto['publicKey']): Promise<{
        success: boolean;
        data: User | null;
    }>;
    getByTelegramId(telegramId: GetByTelegramIdDto['telegramId']): Promise<{
        success: boolean;
        data: User | null;
    }>;
    getUser(id: number): Promise<User>;
    register(body: RegisterDto): Promise<{
        success: boolean;
        data: User;
    }>;
    chooseSide(body: ChooseSideDto): Promise<{
        success: boolean;
        data: User;
    }>;
}
