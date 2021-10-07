import { BaseEntity, Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Token extends BaseEntity {

  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ unique: true })
  token: string;
  
  @Column()
  ip: string;
  
  @ManyToOne(() => User, (us) => us.ID) 
  user: User;

  @Column("datetime")
  until: Date
}

const makeToken = async (length: number) => {
  let result           = '';
  const characters     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  do {
    result = '';
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  } while (await Token.count({ where: { token: result } }) > 0)

  return result;
}

export { makeToken }