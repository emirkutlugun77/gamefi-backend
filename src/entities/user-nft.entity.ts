import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { NftType } from './nft-type.entity';

@Entity('user_nfts')
export class UserNft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ownerPublicKey: string; // User's public key

  @Column()
  nftMintAddress: string; // Mint address of the NFT

  @Column()
  nftTypeId: string; // Reference to NFT type

  @Column()
  purchaseTransaction: string; // Transaction signature

  @Column('bigint')
  purchasePrice: string; // Price paid in lamports

  @Column({ nullable: true })
  mainImage: string; // Main image URL

  @Column('text', { nullable: true })
  additionalImages: string; // JSON array of additional image URLs

  @Column()
  purchasedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => NftType, (nftType) => nftType.userNfts)
  @JoinColumn({ name: 'nftTypeId' })
  nftType: NftType;
}
