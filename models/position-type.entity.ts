import mixin from 'ts-mixin-extended';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { Position } from './position.entity';

export class PositionTypeBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  name: string;

  @Column({ type: 'simple-array', nullable: true })
  levelList: string[]; // ระดับตำแหน่ง

  @OneToMany(() => Position, (position) => position.positionType)
  positionList: Position[];

  @Expose({ toPlainOnly: true })
  get displayText() {
    return this.name;
  }
}

@Entity()
export class PositionType extends mixin(PositionTypeBase) {}
