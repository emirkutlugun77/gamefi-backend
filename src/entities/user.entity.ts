import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export enum PlayerSide {
  DARK = 'DARK',
  HOLY = 'HOLY',
  NOT_CHOSEN = 'NOT_CHOSEN',
}


@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index({ unique: true })
  publicKey: string;

  @Column({ unique: true, nullable: true })
  @Index({ unique: true })
  telegramId: string;

  @Column({ type: 'text', default: PlayerSide.NOT_CHOSEN })
  chosenSide: PlayerSide;

  @Column({ type: 'int', default: 0 })
  airdrop_point: number;
}




