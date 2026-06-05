import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  getUsers() {
    return [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30,
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        age: 25,
      },
    ];
  }
}
