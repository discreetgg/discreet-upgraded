import { Injectable } from '@nestjs/common';
import checkDiskSpace from 'check-disk-space';

@Injectable()
export class SystemService {
  async getDiskSpaceWindows(): Promise<any> {
    const result = await checkDiskSpace('C:/');

    console.log(result);
    return {
      total: await this.formatBytesDecimal(result.size),
      free: await this.formatBytesDecimal(result.free),
      used: await this.formatBytesDecimal(result.size - result.free),
    };
  }

  async getDiskSpaceLinuxMacOs(): Promise<any> {
    const result = await checkDiskSpace('/');

    console.log(result);

    return {
      total: await this.formatBytesDecimal(result.size),
      free: await this.formatBytesDecimal(result.free),
      used: await this.formatBytesDecimal(result.size - result.free),
    };
  }

  async formatBytesDecimal(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1000; // base 10
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${formatted} ${sizes[i]}`;
  }
}
