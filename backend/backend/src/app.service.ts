import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { readFileSync } from 'fs';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getCallPage(): string {
    const filePath = join(process.cwd(), 'client/call.html');
    return readFileSync(filePath, 'utf8');
  }
}
