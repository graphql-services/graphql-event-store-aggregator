import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Meta {
  @PrimaryColumn()
  key: string;

  @Column()
  value: string;
}
