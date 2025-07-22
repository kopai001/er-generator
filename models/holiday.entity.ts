import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { IsString } from 'class-validator';
import mixin from 'ts-mixin-extended';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export class HolidayBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  @IsString()
  name: string;

  @Column({ nullable: true })
  @IsString()
  description: string;

  @Column({ nullable: false })
  eventDate: Date;

  @Column({ nullable: false })
  year: string;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class Holiday extends mixin(HolidayBase, StampableEntity) {}
