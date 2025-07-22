import {
  BeforeUpdate,
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeLevelColumn,
  TreeParent,
} from 'typeorm';
import { PositionSlot } from './position-slot.entity';
import { IsString } from 'class-validator';

@Entity()
@Tree('materialized-path')
export class OrgUnit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @IsString()
  name: string; // ชื่อหน่วย

  @Column({ nullable: true })
  code: string; // เลขกอง

  @Column({ nullable: true, default: false })
  isExecutive: boolean;

  @Column({ nullable: true })
  tag1: string;

  @Column({ nullable: true })
  tag2: string;

  @OneToOne(() => PositionSlot, (positionSlot) => positionSlot.orgUnit, {
    nullable: true,
  })
  positionSlot: PositionSlot;

  @TreeChildren()
  children: OrgUnit[];

  @TreeParent()
  parent: OrgUnit;

  @TreeLevelColumn()
  @Column({ nullable: true })
  depth: number;
}
