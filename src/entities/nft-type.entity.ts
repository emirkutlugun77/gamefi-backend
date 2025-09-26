import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { NftCollection } from './nft-collection.entity';
import { UserNft } from './user-nft.entity';

@Entity('nft_types')
export class NftType {
  @PrimaryColumn()
  id: string; // Type PDA address

  @Column()
  collectionId: string; // Collection reference

  @Column()
  name: string;

  @Column()
  uri: string;

  @Column('bigint')
  price: string; // Price in lamports

  @Column('bigint')
  maxSupply: string;

  @Column('bigint')
  currentSupply: string;

  @Column({ nullable: true })
  mainImage: string; // Main image URL

  @Column('text', { nullable: true })
  additionalImages: string; // JSON array of additional image URLs

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @ManyToOne(() => NftCollection, (collection) => collection.nftTypes)
  @JoinColumn({ name: 'collectionId' })
  collection: NftCollection;

  @OneToMany(() => UserNft, (userNft) => userNft.nftType)
  userNfts: UserNft[];
}
