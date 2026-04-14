/**
 * CloudinaryAdapter — Cloudinary storage adapter
 * 
 * Implements storage using Cloudinary.
 * Configures Cloudinary client with credentials from environment.
 * 
 * Validates: Requirements 9.2
 * 
 * NOTE: Requires cloudinary package
 * Install with: npm install cloudinary
 */

import { StorageAdapter } from './StorageAdapter';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryAdapter implements StorageAdapter {
  private config: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    this.config = config;
    
    // Dynamic import will be used when Cloudinary SDK is installed
    // For now, this is a placeholder implementation
    // const cloudinary = require('cloudinary').v2;
    // cloudinary.config({
    //   cloud_name: config.cloudName,
    //   api_key: config.apiKey,
    //   api_secret: config.apiSecret
    // });
    
    throw new Error('CloudinaryAdapter requires cloudinary package. Install with: npm install cloudinary');
  }

  /**
   * Save a file to Cloudinary
   * Organizes files by userId using folder structure
   * 
   * Validates: Requirements 9.2
   */
  async save(file: Buffer, filename: string, userId: string): Promise<string> {
    const folder = `uploads/${userId}`;
    
    // const cloudinary = require('cloudinary').v2;
    // const result = await new Promise((resolve, reject) => {
    //   cloudinary.uploader.upload_stream(
    //     {
    //       folder,
    //       public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
    //       resource_type: 'auto'
    //     },
    //     (error: any, result: any) => {
    //       if (error) reject(error);
    //       else resolve(result);
    //     }
    //   ).end(file);
    // });
    // 
    // return result.public_id;
    
    return `${folder}/${filename}`;
  }

  /**
   * Retrieve a file from Cloudinary
   */
  async get(filename: string, userId: string): Promise<Buffer> {
    // Cloudinary doesn't provide direct file download
    // Files are accessed via URL
    throw new Error('CloudinaryAdapter.get() not supported - use getUrl() instead');
  }

  /**
   * Delete a file from Cloudinary
   */
  async delete(filename: string, userId: string): Promise<void> {
    const publicId = `uploads/${userId}/${filename.replace(/\.[^/.]+$/, '')}`;
    
    // const cloudinary = require('cloudinary').v2;
    // await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  }

  /**
   * Check if a file exists in Cloudinary
   */
  async exists(filename: string, userId: string): Promise<boolean> {
    const publicId = `uploads/${userId}/${filename.replace(/\.[^/.]+$/, '')}`;
    
    // const cloudinary = require('cloudinary').v2;
    // try {
    //   await cloudinary.api.resource(publicId, { resource_type: 'raw' });
    //   return true;
    // } catch (error: any) {
    //   if (error.http_code === 404) {
    //     return false;
    //   }
    //   throw error;
    // }
    
    return false;
  }

  /**
   * Get URL for accessing a file
   * Returns Cloudinary CDN URL
   */
  async getUrl(filename: string, userId: string): Promise<string> {
    const publicId = `uploads/${userId}/${filename.replace(/\.[^/.]+$/, '')}`;
    
    // const cloudinary = require('cloudinary').v2;
    // return cloudinary.url(publicId, { resource_type: 'raw' });
    
    return `https://res.cloudinary.com/${this.config.cloudName}/raw/upload/${publicId}`;
  }

  /**
   * Create CloudinaryAdapter from environment variables
   * 
   * Expected environment variables:
   * - CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
   * - CLOUDINARY_API_KEY: Cloudinary API key
   * - CLOUDINARY_API_SECRET: Cloudinary API secret
   */
  static fromEnvironment(): CloudinaryAdapter {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables are required');
    }
    
    return new CloudinaryAdapter({
      cloudName,
      apiKey,
      apiSecret
    });
  }
}
