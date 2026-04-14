# Persistence Layer

This directory contains the persistence layer for the Waveline Music Player backend. The persistence layer provides data storage and retrieval functionality using a file-based approach.

## Architecture

The persistence layer follows the Repository pattern, providing a clean abstraction over data storage mechanisms. This allows the application to switch between different storage backends (files, databases) without changing business logic.

## UserRepository

### Overview

The `UserRepository` interface defines the contract for user data persistence. The `FileUserRepository` implementation stores users as individual JSON files with an index for fast username lookups.

### Storage Structure

```
data/
├── users/
│   ├── user_123.json
│   ├── user_456.json
│   └── ...
└── metadata/
    └── indexes.json
```

- **users/**: Contains individual user files named `{userId}.json`
- **metadata/indexes.json**: Contains username-to-ID mappings for fast lookups

### User File Format

Each user file contains:

```json
{
  "id": "user_1234567890_abc123",
  "username": "johndoe",
  "passwordHash": "$2b$12$...",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Index File Format

The index file maintains username-to-ID mappings:

```json
{
  "usernameToId": {
    "johndoe": "user_1234567890_abc123",
    "janedoe": "user_0987654321_xyz789"
  }
}
```

**Note**: Usernames are stored in lowercase in the index for case-insensitive lookups.

## Usage

### Creating a Repository

```typescript
import { FileUserRepository } from './persistence/UserRepository';

// Use default data directory (./data)
const repository = new FileUserRepository();

// Or specify custom data directory
const repository = new FileUserRepository('./custom-data');
```

### CRUD Operations

```typescript
import { User } from './domain/User';

// Create a new user
const user = await User.create('johndoe', 'SecurePass123');
await repository.create(user);

// Find by ID
const foundById = await repository.findById(user.id);

// Find by username (case-insensitive)
const foundByUsername = await repository.findByUsername('johndoe');

// Update user
await user.updatePassword('NewPassword456');
await repository.update(user);

// Delete user
await repository.delete(user.id);

// Check if username exists
const exists = await repository.exists('johndoe');
```

## Features

### Username Uniqueness

- Usernames are unique across the system
- Username lookups are case-insensitive
- Attempting to create a user with an existing username throws an error

### Index Management

- The username index is automatically maintained
- Index is updated on create, update (username change), and delete operations
- Index provides O(1) lookup time for username-to-ID mappings

### Directory Initialization

- Required directories are created automatically on repository instantiation
- If the index file doesn't exist, it's initialized with an empty structure

### Error Handling

- Operations throw descriptive errors for common failure cases:
  - Creating user with duplicate username
  - Updating non-existent user
  - Deleting non-existent user
  - Changing username to one that already exists

## Testing

The persistence layer includes comprehensive test coverage:

- **Unit Tests** (`UserRepository.test.ts`): Test individual operations and edge cases
- **Integration Tests** (`UserRepository.integration.test.ts`): Test complete workflows and data persistence

Run tests:

```bash
# Run all persistence tests
npm test -- src/backend/persistence/

# Run unit tests only
npm test -- src/backend/persistence/UserRepository.test.ts

# Run integration tests only
npm test -- src/backend/persistence/UserRepository.integration.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 3.2**: File-based storage for user data
- **Requirement 3.3**: Unique user identifiers and username lookups
- **Requirement 3.4**: CRUD operations for user management

## Future Enhancements

Potential improvements for the persistence layer:

1. **Database Implementation**: Add `SQLiteUserRepository` or `PostgreSQLUserRepository` for production use
2. **Caching**: Implement in-memory caching for frequently accessed users
3. **Transactions**: Add transaction support for atomic multi-operation updates
4. **Backup**: Implement automated backup and restore functionality
5. **Migration**: Add data migration tools for schema changes
