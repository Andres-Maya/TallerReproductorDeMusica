/**
 * Example usage of UserRepository
 * 
 * This file demonstrates how to use the FileUserRepository
 * for user management operations.
 */

import { FileUserRepository } from './UserRepository';
import { User } from '../domain/User';

async function main() {
  // Initialize repository with default data directory
  const repository = new FileUserRepository('./data');

  console.log('=== UserRepository Example ===\n');

  // 1. Create a new user
  console.log('1. Creating a new user...');
  const user = await User.create('johndoe', 'SecurePass123');
  await repository.create(user);
  console.log(`   Created user: ${user.username} (ID: ${user.id})\n`);

  // 2. Find user by ID
  console.log('2. Finding user by ID...');
  const foundById = await repository.findById(user.id);
  console.log(`   Found: ${foundById?.username}\n`);

  // 3. Find user by username (case-insensitive)
  console.log('3. Finding user by username...');
  const foundByUsername = await repository.findByUsername('JOHNDOE');
  console.log(`   Found: ${foundByUsername?.username}\n`);

  // 4. Check if username exists
  console.log('4. Checking if username exists...');
  const exists = await repository.exists('johndoe');
  console.log(`   Username 'johndoe' exists: ${exists}\n`);

  // 5. Validate password
  console.log('5. Validating password...');
  const isValid = await foundById!.validatePassword('SecurePass123');
  const isInvalid = await foundById!.validatePassword('WrongPassword');
  console.log(`   Correct password: ${isValid}`);
  console.log(`   Wrong password: ${isInvalid}\n`);

  // 6. Update user password
  console.log('6. Updating user password...');
  await foundById!.updatePassword('NewSecurePass456');
  await repository.update(foundById!);
  const updatedUser = await repository.findById(user.id);
  const newPasswordValid = await updatedUser!.validatePassword('NewSecurePass456');
  console.log(`   Password updated successfully: ${newPasswordValid}\n`);

  // 7. Create another user
  console.log('7. Creating another user...');
  const user2 = await User.create('janedoe', 'AnotherPass789');
  await repository.create(user2);
  console.log(`   Created user: ${user2.username} (ID: ${user2.id})\n`);

  // 8. Try to create duplicate username (will fail)
  console.log('8. Attempting to create duplicate username...');
  try {
    const duplicate = await User.create('johndoe', 'Password123');
    await repository.create(duplicate);
  } catch (error) {
    console.log(`   Error (expected): ${(error as Error).message}\n`);
  }

  // 9. Delete a user
  console.log('9. Deleting user...');
  await repository.delete(user2.id);
  const deletedUser = await repository.findById(user2.id);
  console.log(`   User deleted: ${deletedUser === null}\n`);

  // 10. Verify remaining user
  console.log('10. Verifying remaining user...');
  const remainingUser = await repository.findById(user.id);
  console.log(`    Remaining user: ${remainingUser?.username}\n`);

  console.log('=== Example completed successfully ===');
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running example:', error);
    process.exit(1);
  });
}

export { main };
