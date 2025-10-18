import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('store_configs')
export class StoreConfig {
  @PrimaryColumn()
  tabName: string; // 'building', 'troops', 'others'

  @Column()
  collectionName: string; // Name of the collection to fetch from

  @Column({ nullable: true })
  collectionId: string; // Collection mint address (optional)

  @Column()
  displayName: string; // Display name for the tab

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // Order in which tabs appear

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
