import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import {
  FileEntry,
  FileEntryColumn,
  WithFileLinkable,
} from '@bmk/nest-lib/bmk-file';
import { SetMetadata } from '@nestjs/common';
import { CoordinatesCache } from 'src/embedded/coordinates.embedded';
import { CheckpointTypeEnum } from 'src/enums/checkpoint-type.enum';
import { CHECKPOINT_RULE_NAME } from 'src/services/ruler/ruler';
import mixin from 'ts-mixin-extended';
import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { IsString } from 'class-validator';
import { EmployeeCheckpoint } from './employee-checkpoint.entity';

export class CheckpointBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  @IsString()
  name: string;

  @Column({ nullable: false })
  @IsString()
  code: string;

  @Column({
    type: 'enum',
    enum: CheckpointTypeEnum,
    default: CheckpointTypeEnum.COORDINATES,
  })
  type: CheckpointTypeEnum;

  @Column(() => CoordinatesCache)
  coordinates: CoordinatesCache | null;

  @Column({ default: true })
  isAvailable: boolean;

  @OneToMany(
    () => EmployeeCheckpoint,
    (employeeCheckpoint) => employeeCheckpoint.checkpoint,
  )
  employeeCheckpointList: EmployeeCheckpoint[];
}

@Entity()
@Reflect.metadata(WithStampable, true)
@SetMetadata(WithFileLinkable, true)
export class Checkpoint extends mixin(CheckpointBase, StampableEntity) {
  @FileEntryColumn({
    nullable: true,
    grantRule: CHECKPOINT_RULE_NAME,
  })
  faceScanPointFile: FileEntry;
}
