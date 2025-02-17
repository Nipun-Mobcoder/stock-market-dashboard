import { Type } from 'class-transformer';
import { IsEmail, IsNumber, IsString, ValidateNested } from 'class-validator';

class AddressDTO {
  @IsString()
  state: string;

  @IsString()
  city: string;

  @IsString()
  country: string;
}

export class CreateUserDTO {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsNumber()
  phoneNumber: number;

  @ValidateNested()
  @Type(() => AddressDTO)
  address: AddressDTO;
}
