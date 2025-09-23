import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message?: string;

  data?: T;

  constructor(data?: T, message?: string, success = true) {
    this.success = success;
    this.data = data;
    this.message = message;
  }
}