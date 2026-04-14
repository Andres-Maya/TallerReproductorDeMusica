import { Playlist } from './Playlist';

describe('Playlist Entity', () => {
  const testUserId = 'user_123';

  describe('constructor', () => {
    it('should create a playlist with required fields', () => {
      const playlist = new Playlist('My Favorites', testUserId);
      
      expect(playlist.name).toBe('My Favorites');
      expect(playlist.userId).toBe(testUserId);
      expect(playlist.id).toMatch(/^pl_/);
      expect(playlist.createdAt).toBeInstanceOf(Date);
      expect(playlist.updatedAt).toBeInstanceOf(Date);
    });

    it('should trim whitespace from name', () => {
      const playlist = new Playlist('  Spaced Name  ', testUserId);
      
      expect(playlist.name).toBe('Spaced Name');
    });

    it('should accept optional id parameter', () => {
      const customId = 'pl_custom_123';
      const playlist = new Playlist('Test', testUserId, customId);
      
      expect(playlist.id).toBe(customId);
    });

    it('should accept optional createdAt and updatedAt parameters', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-02T00:00:00Z');
      const playlist = new Playlist('Test', testUserId, undefined, createdAt, updatedAt);
      
      expect(playlist.createdAt).toEqual(createdAt);
      expect(playlist.updatedAt).toEqual(updatedAt);
    });
  });

  describe('create', () => {
    it('should create a valid playlist', () => {
      const playlist = Playlist.create('My Playlist', testUserId);
      
      expect(playlist.name).toBe('My Playlist');
      expect(playlist.userId).toBe(testUserId);
      expect(playlist.isValid()).toBe(true);
    });

    it('should reject empty name', () => {
      expect(() => Playlist.create('', testUserId))
        .toThrow('name is required');
    });

    it('should reject name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => Playlist.create(longName, testUserId))
        .toThrow('name must not exceed 100 characters');
    });

    it('should reject missing userId', () => {
      expect(() => Playlist.create('Test', ''))
        .toThrow('userId is required');
    });
  });

  describe('rename', () => {
    it('should update name and updatedAt timestamp', () => {
      const playlist = new Playlist('Original', testUserId);
      const originalUpdatedAt = playlist.updatedAt;
      
      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        playlist.rename('New Name');
        
        expect(playlist.name).toBe('New Name');
        expect(playlist.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should trim whitespace from new name', () => {
      const playlist = new Playlist('Original', testUserId);
      playlist.rename('  Trimmed  ');
      
      expect(playlist.name).toBe('Trimmed');
    });
  });

  describe('validate', () => {
    it('should return empty array for valid playlist', () => {
      const playlist = new Playlist('Valid Name', testUserId);
      const errors = playlist.validate();
      
      expect(errors).toHaveLength(0);
      expect(playlist.isValid()).toBe(true);
    });

    it('should return error for empty name', () => {
      const playlist = new Playlist('', testUserId);
      const errors = playlist.validate();
      
      expect(errors).toContain('name is required');
      expect(playlist.isValid()).toBe(false);
    });

    it('should return error for name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      const playlist = new Playlist(longName, testUserId);
      const errors = playlist.validate();
      
      expect(errors).toContain('name must not exceed 100 characters');
      expect(playlist.isValid()).toBe(false);
    });

    it('should return error for missing userId', () => {
      const playlist = new Playlist('Test', '');
      const errors = playlist.validate();
      
      expect(errors).toContain('userId is required');
      expect(playlist.isValid()).toBe(false);
    });

    it('should return multiple errors when multiple validations fail', () => {
      const playlist = new Playlist('', '');
      const errors = playlist.validate();
      
      expect(errors.length).toBeGreaterThan(1);
      expect(errors).toContain('name is required');
      expect(errors).toContain('userId is required');
    });
  });

  describe('toJSON', () => {
    it('should serialize to DTO format', () => {
      const playlist = new Playlist('Test Playlist', testUserId, 'pl_123');
      const dto = playlist.toJSON();
      
      expect(dto.id).toBe('pl_123');
      expect(dto.userId).toBe(testUserId);
      expect(dto.name).toBe('Test Playlist');
      expect(dto.createdAt).toBeDefined();
      expect(dto.updatedAt).toBeDefined();
      expect(typeof dto.createdAt).toBe('string');
      expect(typeof dto.updatedAt).toBe('string');
    });

    it('should include all required fields in DTO', () => {
      const playlist = new Playlist('Test', testUserId);
      const dto = playlist.toJSON();
      
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('userId');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('createdAt');
      expect(dto).toHaveProperty('updatedAt');
    });
  });

  describe('fromDTO', () => {
    it('should reconstruct playlist from DTO', () => {
      const originalPlaylist = new Playlist('Test Playlist', testUserId, 'pl_123');
      const dto = originalPlaylist.toJSON();
      const restoredPlaylist = Playlist.fromDTO(dto);
      
      expect(restoredPlaylist.id).toBe(originalPlaylist.id);
      expect(restoredPlaylist.userId).toBe(originalPlaylist.userId);
      expect(restoredPlaylist.name).toBe(originalPlaylist.name);
      expect(restoredPlaylist.createdAt.toISOString()).toBe(originalPlaylist.createdAt.toISOString());
      expect(restoredPlaylist.updatedAt.toISOString()).toBe(originalPlaylist.updatedAt.toISOString());
    });

    it('should maintain validity after deserialization', () => {
      const playlist = Playlist.create('Valid Playlist', testUserId);
      const dto = playlist.toJSON();
      const restored = Playlist.fromDTO(dto);
      
      expect(restored.isValid()).toBe(true);
      expect(restored.validate()).toHaveLength(0);
    });
  });

  describe('backward compatibility', () => {
    it('should maintain existing Playlist interface for name and id', () => {
      const playlist = new Playlist('Test', testUserId);
      
      // These properties should still be accessible as before
      expect(playlist.id).toBeDefined();
      expect(playlist.name).toBeDefined();
      expect(playlist.createdAt).toBeDefined();
      expect(playlist.updatedAt).toBeDefined();
    });

    it('should support rename method as before', () => {
      const playlist = new Playlist('Original', testUserId);
      playlist.rename('Updated');
      
      expect(playlist.name).toBe('Updated');
    });

    it('should support validate and isValid methods as before', () => {
      const playlist = new Playlist('Test', testUserId);
      
      expect(typeof playlist.validate).toBe('function');
      expect(typeof playlist.isValid).toBe('function');
      expect(playlist.isValid()).toBe(true);
    });

    it('should support toJSON method as before', () => {
      const playlist = new Playlist('Test', testUserId);
      const json = playlist.toJSON();
      
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});
