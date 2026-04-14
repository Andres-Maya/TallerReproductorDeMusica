# Database Migrations

This directory contains migration scripts for updating the database schema and data structures.

## Available Migrations

### migrate-songs-add-source-fields.ts

**Purpose**: Adds `sourceType` and `fileId` fields to existing Song records for the audio upload and YouTube integration feature.

**What it does**:
- Scans all playlist JSON files in the data directory
- Adds `sourceType: 'url'` to songs that don't have this field
- Adds `fileId: null` to songs that don't have this field
- Preserves existing songs that already have these fields
- Maintains backward compatibility with existing URL-based songs

**Usage**:

```bash
# Run migration on default data directory (../../data)
npm run migrate:songs

# Run migration on custom data directory
npm run migrate:songs -- /path/to/data
```

**When to run**:
- After deploying the audio upload feature
- Before using the new upload or YouTube extraction features
- When upgrading from a version without sourceType/fileId fields

**Safety**:
- Non-destructive: Only adds missing fields, never removes data
- Idempotent: Safe to run multiple times
- Validates data before and after migration
- Creates backups automatically (recommended to backup manually first)

**Testing**:

```bash
# Run migration tests
npm test migrate-songs-add-source-fields.test.ts
```

## Running Migrations

### Development

```bash
cd TallerReproductorDeMusica
npm run migrate:songs
```

### Production

```bash
# Backup data first
cp -r data data-backup-$(date +%Y%m%d)

# Run migration
npm run migrate:songs

# Verify migration
npm test migrate-songs-add-source-fields.test.ts
```

## Creating New Migrations

1. Create a new migration file: `migrate-<description>.ts`
2. Implement the migration logic
3. Create corresponding test file: `migrate-<description>.test.ts`
4. Add npm script to package.json
5. Document the migration in this README

## Migration Best Practices

- Always backup data before running migrations
- Test migrations on a copy of production data first
- Make migrations idempotent (safe to run multiple times)
- Include rollback instructions if possible
- Log all migration operations
- Validate data before and after migration
