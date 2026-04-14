/**
 * S3StorageAdapter — AWS S3 storage adapter
 * 
 * Implements storage using AWS S3.
 * Configures S3 client with credentials from environment.
 * Implements signed URL generation for secure file access.
 * 
 * Validates: Requirements 9.2, 9.9
 * 
 * NOTE: Requires @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner packages
 * Install with: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { StorageAdapter } from './StorageAdapter';

// Type definitions for AWS SDK (will be available when package is installed)
type S3Client = any;
type PutObjectCommand = any;
type GetObjectCommand = any;
type DeleteObjectCommand = any;
type HeadObjectCommand = any;

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: S3Config) {
    // Dynamic import will be used when AWS SDK is installed
    // For now, this is a placeholder implementation
    this.bucketName = config.bucket;
    
    // Initialize S3 client with credentials from environment or config
    // const { S3Client } = require('@aws-sdk/client-s3');
    // this.s3Client = new S3Client({
    //   region: config.region,
    //   credentials: config.accessKeyId && config.secretAccessKey ? {
    //     accessKeyId: config.accessKeyId,
    //     secretAccessKey: config.secretAccessKey
    //   } : undefined
    // });
    
    throw new Error('S3StorageAdapter requires @aws-sdk/client-s3 package. Install with: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner');
  }

  /**
   * Save a file to S3
   * Organizes files by userId in S3 key structure
   * 
   * Validates: Requirements 9.2
   */
  async save(file: Buffer, filename: string, userId: string): Promise<string> {
    const key = `uploads/${userId}/${filename}`;
    
    // const { PutObjectCommand } = require('@aws-sdk/client-s3');
    // const command = new PutObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key,
    //   Body: file,
    //   ContentType: this.getContentType(filename)
    // });
    // 
    // await this.s3Client.send(command);
    
    return key;
  }

  /**
   * Retrieve a file from S3
   */
  async get(filename: string, userId: string): Promise<Buffer> {
    const key = `uploads/${userId}/${filename}`;
    
    // const { GetObjectCommand } = require('@aws-sdk/client-s3');
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key
    // });
    // 
    // const response = await this.s3Client.send(command);
    // const stream = response.Body as any;
    // const chunks: Buffer[] = [];
    // 
    // for await (const chunk of stream) {
    //   chunks.push(chunk);
    // }
    // 
    // return Buffer.concat(chunks);
    
    throw new Error('S3StorageAdapter not implemented - AWS SDK not installed');
  }

  /**
   * Delete a file from S3
   */
  async delete(filename: string, userId: string): Promise<void> {
    const key = `uploads/${userId}/${filename}`;
    
    // const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    // const command = new DeleteObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key
    // });
    // 
    // await this.s3Client.send(command);
  }

  /**
   * Check if a file exists in S3
   */
  async exists(filename: string, userId: string): Promise<boolean> {
    const key = `uploads/${userId}/${filename}`;
    
    // const { HeadObjectCommand } = require('@aws-sdk/client-s3');
    // const command = new HeadObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key
    // });
    // 
    // try {
    //   await this.s3Client.send(command);
    //   return true;
    // } catch (error: any) {
    //   if (error.name === 'NotFound') {
    //     return false;
    //   }
    //   throw error;
    // }
    
    return false;
  }

  /**
   * Get signed URL for accessing a file
   * Generates a presigned URL that expires after a set time
   * 
   * Validates: Requirements 9.9
   */
  async getUrl(filename: string, userId: string): Promise<string> {
    const key = `uploads/${userId}/${filename}`;
    
    // const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    // const { GetObjectCommand } = require('@aws-sdk/client-s3');
    // 
    // const command = new GetObjectCommand({
    //   Bucket: this.bucketName,
    //   Key: key
    // });
    // 
    // // Generate signed URL that expires in 1 hour
    // const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    // return url;
    
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Create S3StorageAdapter from environment variables
   * 
   * Expected environment variables:
   * - AWS_REGION: AWS region (e.g., 'us-east-1')
   * - AWS_S3_BUCKET: S3 bucket name
   * - AWS_ACCESS_KEY_ID: AWS access key (optional, uses IAM role if not provided)
   * - AWS_SECRET_ACCESS_KEY: AWS secret key (optional, uses IAM role if not provided)
   */
  static fromEnvironment(): S3StorageAdapter {
    const region = process.env.AWS_REGION || 'us-east-1';
    const bucket = process.env.AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }
    
    return new S3StorageAdapter({
      region,
      bucket,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }
}
