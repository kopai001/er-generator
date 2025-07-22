import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import { CheckpointCache } from 'src/embedded/checkpoint.embedded';
import { DirectionEnum } from 'src/enums/direction.enum';
import mixin from 'ts-mixin-extended';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';

export class TimeAttendanceBase {
  @Column({ nullable: false })
  authenDateTime: Date;

  @Column({
    nullable: false,
    type: 'enum',
    enum: DirectionEnum,
  })
  direction: DirectionEnum; // time attendance type

  @Column({ nullable: true })
  workingDateTime: Date;

  @Column(() => CheckpointCache)
  checkpoint: CheckpointCache | null;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class TimeAttendance extends mixin(TimeAttendanceBase, StampableEntity) {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Employee, (employee) => employee.timeAttendanceList)
  employee: Employee;
}
