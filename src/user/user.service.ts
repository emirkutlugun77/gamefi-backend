import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async register(publicKey: string,telegramId?: string): Promise<User> {
    const existing = await this.userRepository.findOne({ where: { publicKey } });
    if (existing) {
      throw new BadRequestException('User already exists');
    }
    const user = this.userRepository.create({ publicKey, telegramId });
    return this.userRepository.save(user);
  }

  async chooseSide(publicKey: string, side: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Award 100 points if side is chosen for the first time
    const wasNotChosen = user.chosenSide === 'NOT_CHOSEN';

    user.chosenSide = side as any;

    if (wasNotChosen && side !== 'NOT_CHOSEN') {
      user.airdrop_point += 100;
    }

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPublicKey(publicKey: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { publicKey } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByTelegramId(telegramId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { telegramId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}


