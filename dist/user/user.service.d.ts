import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    register(publicKey: string, telegramId?: string): Promise<User>;
    chooseSide(publicKey: string, side: string): Promise<User>;
    findAll(): Promise<User[]>;
    findOneById(id: number): Promise<User>;
    findByPublicKey(publicKey: string): Promise<User>;
    findByTelegramId(telegramId: string): Promise<User>;
}
