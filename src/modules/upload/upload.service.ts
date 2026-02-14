import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async upload(file: any, subscriberId: number, folder: string) {
    const key = subscriberId + '/' + folder + '/' + Date.now() + '-' + file.originalname;
    // TODO: implement S3 upload
    return { key, url: key };
  }

  async getSignedUrl(key: string) {
    // TODO: implement S3 presigned URL
    return { url: key };
  }
}
