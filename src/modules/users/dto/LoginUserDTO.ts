import { IsEmail, IsString } from '@nestjs/class-validator';

export class LoginUserDTO {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
