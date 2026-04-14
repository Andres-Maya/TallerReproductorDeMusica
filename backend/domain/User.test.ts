import { User } from './User';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid credentials', async () => {
      const user = await User.create('testuser', 'Password123');
      
      expect(user.username).toBe('testuser');
      expect(user.id).toMatch(/^user_/);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.isValid()).toBe(true);
    });

    it('should reject username shorter than 3 characters', async () => {
      await expect(User.create('ab', 'Password123'))
        .rejects.toThrow('username must be between 3 and 30 characters');
    });

    it('should reject username longer than 30 characters', async () => {
      const longUsername = 'a'.repeat(31);
      await expect(User.create(longUsername, 'Password123'))
        .rejects.toThrow('username must be between 3 and 30 characters');
    });

    it('should reject username with invalid characters', async () => {
      await expect(User.create('test@user', 'Password123'))
        .rejects.toThrow('username must contain only letters, numbers, and underscores');
    });

    it('should reject password shorter than 8 characters', async () => {
      await expect(User.create('testuser', 'Pass1'))
        .rejects.toThrow('password must be at least 8 characters');
    });

    it('should reject password without uppercase letter', async () => {
      await expect(User.create('testuser', 'password123'))
        .rejects.toThrow('password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letter', async () => {
      await expect(User.create('testuser', 'PASSWORD123'))
        .rejects.toThrow('password must contain at least one lowercase letter');
    });

    it('should reject password without number', async () => {
      await expect(User.create('testuser', 'Password'))
        .rejects.toThrow('password must contain at least one number');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const user = await User.create('testuser', 'Password123');
      const isValid = await user.validatePassword('Password123');
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.create('testuser', 'Password123');
      const isValid = await user.validatePassword('WrongPassword');
      
      expect(isValid).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password with valid new password', async () => {
      const user = await User.create('testuser', 'Password123');
      await user.updatePassword('NewPassword456');
      
      const isOldValid = await user.validatePassword('Password123');
      const isNewValid = await user.validatePassword('NewPassword456');
      
      expect(isOldValid).toBe(false);
      expect(isNewValid).toBe(true);
    });

    it('should reject weak password on update', async () => {
      const user = await User.create('testuser', 'Password123');
      
      await expect(user.updatePassword('weak'))
        .rejects.toThrow('Password validation failed');
    });
  });

  describe('toJSON and fromDTO', () => {
    it('should serialize and deserialize correctly', async () => {
      const user = await User.create('testuser', 'Password123');
      const dto = user.toJSON();
      
      expect(dto.id).toBe(user.id);
      expect(dto.username).toBe('testuser');
      expect(dto.passwordHash).toBeDefined();
      expect(dto.createdAt).toBeDefined();
      
      const restored = User.fromDTO(dto);
      expect(restored.id).toBe(user.id);
      expect(restored.username).toBe(user.username);
      expect(restored.createdAt.toISOString()).toBe(user.createdAt.toISOString());
    });

    it('should maintain password validation after deserialization', async () => {
      const user = await User.create('testuser', 'Password123');
      const dto = user.toJSON();
      const restored = User.fromDTO(dto);
      
      const isValid = await restored.validatePassword('Password123');
      expect(isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('should validate a properly constructed user', async () => {
      const user = await User.create('testuser', 'Password123');
      const errors = user.validate();
      
      expect(errors).toHaveLength(0);
      expect(user.isValid()).toBe(true);
    });
  });
});
