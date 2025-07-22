import { UserEntity } from '@bmk/nest-lib/bmk-auth';
import { StampableEntity, WithStampable } from '@bmk/nest-lib/bmk-core';
import mixin from 'ts-mixin-extended';
import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';

export class DHrUserBase {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Employee, (employee) => employee.dHrUser, {
    nullable: true,
  })
  employee: Employee;
}

@Entity()
@Reflect.metadata(WithStampable, true)
export class DHrUser extends mixin(DHrUserBase, UserEntity, StampableEntity) {}
