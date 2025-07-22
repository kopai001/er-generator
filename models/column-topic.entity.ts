import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { ColumnTopicTypeEnum } from 'src/enums/column-topic-type.enum';
import mixin from 'ts-mixin-extended';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export class ColumnTopicBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  topicName: string; // หัวข้อ

  @Column({ nullable: true, type: 'enum', enum: ColumnTopicTypeEnum })
  type: ColumnTopicTypeEnum;

  @Column({ nullable: true })
  sysKey: string;

  @Column({ type: 'simple-array', nullable: true })
  aliasList: string[];

  @Expose({ toPlainOnly: true })
  get displayText() {
    return this.topicName;
  }
}

@Entity()
export class ColumnTopic extends mixin(ColumnTopicBase) {}
