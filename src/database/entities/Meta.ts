import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Meta {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'text' })
  value: string;
}
