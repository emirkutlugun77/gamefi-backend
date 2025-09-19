import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { NftType } from './nft-type.entity';

@Entity('nft_collections')
export class NftCollection {
  @PrimaryColumn()
  id: string; // Collection mint address

  @Column()
  admin: string; // Admin public key

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column()
  uri: string;

  @Column()
  royalty: number;

  @Column()
  isActive: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @OneToMany(() => NftType, (nftType) => nftType.collection)
  nftTypes: NftType[];
}
