import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Token } from "./Token";

export enum Permissions {
  USER = "user", ADMIN = "admin"
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  ID: number;
  
  @Column({ unique: true })
  username: string;
  
  @Column()
  password: string;
  
  @Column("enum", { enum: Permissions,  })
  permission: Permissions;
  
  @Column({ type: 'boolean' })
  isActive: boolean;

  @OneToMany(() => Token, (to) => to.ID)
  tokens: Token[]
}

const generatePassword = (length: number) => {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

const makeUsername = async (username: string): Promise<string> => {
  let base = 0;
  while (await User.count({ where: { username: `${username}${base === 0 ? '' : base}` } }) > 0) {
    base++;
  }
  return `${username}${base === 0 ? '' : base}`;
}

export { generatePassword, makeUsername }