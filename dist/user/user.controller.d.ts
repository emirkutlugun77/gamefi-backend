import { UserService } from './user.service';
import { User } from '../entities/user.entity';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUsers(): Promise<User[]>;
    getByPublicKey(publicKey: string): Promise<User>;
    getUser(id: number): Promise<User>;
    register(publicKey: string): Promise<User>;
    chooseSide(publicKey: string, side: string): Promise<User>;
}
