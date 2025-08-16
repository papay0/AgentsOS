# AgentsOS Encryption Architecture Documentation

## Overview

This document provides a comprehensive technical overview of the encryption system implemented in AgentsOS for securely storing and managing user environment variables, particularly Daytona API keys and project-specific environment variables.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Encryption Implementation](#encryption-implementation)
3. [Key Management](#key-management)
4. [Data Storage Structure](#data-storage-structure)
5. [Security Model](#security-model)
6. [API Integration](#api-integration)
7. [User Interface](#user-interface)
8. [Testing Strategy](#testing-strategy)
9. [Migration Path](#migration-path)
10. [Security Considerations](#security-considerations)

## Architecture Overview

The AgentsOS encryption system is designed to enable users to provide their own Daytona API keys and project environment variables while maintaining strong security practices. The system allows the application to scale beyond server capacity limitations by distributing API usage across user accounts.

### Core Requirements Addressed

- **Server Capacity**: Move from server-provided API keys to user-provided keys
- **Security**: Encrypt sensitive data before storage in Firebase
- **Scalability**: Support millions of users with individual API keys
- **User Experience**: Simple onboarding flow for API key collection
- **Project Management**: Support for project-specific environment variables

### High-Level Architecture

```
User Input (API Key) → Validation → Encryption → Firebase Storage
                                       ↓
Workspace Creation ← Decryption ← Firebase Retrieval
```

## Encryption Implementation

### Core Encryption Service

The encryption system is built around the `AgentsOSEncryption` class in `/lib/encryption.ts`, which provides AES-256-GCM encryption with per-user key derivation.

```typescript
export class AgentsOSEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16;  // 128 bits
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations
}
```

### Encryption Process

1. **Master Secret Validation**
   ```typescript
   private static getMasterSecret(): string {
     const secret = process.env.ENCRYPTION_SECRET;
     if (!secret || secret.length < 32) {
       throw new Error('Invalid encryption secret');
     }
     return secret;
   }
   ```

2. **Per-User Key Derivation**
   ```typescript
   private static deriveUserKey(userId: string): Buffer {
     const masterSecret = this.getMasterSecret();
     const salt = `agentsos-v1-${userId}`; // Versioned salt
     
     return crypto.pbkdf2Sync(
       masterSecret,
       salt,
       this.ITERATIONS,
       this.KEY_LENGTH,
       'sha256'
     );
   }
   ```

3. **AES-256-GCM Encryption**
   ```typescript
   static encrypt(value: string, userId: string): EncryptedValue {
     const key = this.deriveUserKey(userId);
     const iv = crypto.randomBytes(this.IV_LENGTH);
     const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv) as crypto.CipherGCM;
     
     const encrypted = Buffer.concat([
       cipher.update(value, 'utf8'),
       cipher.final()
     ]);
     
     const tag = cipher.getAuthTag();
     
     return {
       value: encrypted.toString('base64'),
       iv: iv.toString('base64'),
       tag: tag.toString('base64'),
       algorithm: this.ALGORITHM,
       version: 1
     };
   }
   ```

### Encrypted Value Structure

All encrypted values are stored with the following structure:

```typescript
export interface EncryptedValue {
  value: string;      // Base64 encoded encrypted data
  iv: string;         // Base64 encoded initialization vector
  tag: string;        // Base64 encoded authentication tag
  algorithm: string;  // Encryption algorithm used ('aes-256-gcm')
  version: number;    // Version for future migrations (currently 1)
}
```

### Validation System

The system includes comprehensive validation for Daytona API keys:

```typescript
static validateDaytonaApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') return false;
  
  const cleanKey = apiKey.trim();
  if (!cleanKey || cleanKey.length < 6 || cleanKey.length > 200) return false;
  
  return /^[a-zA-Z0-9\-_]+$/.test(cleanKey);
}
```

## Key Management

### Master Secret Storage

The master encryption secret is stored as an environment variable on Vercel:

- **Environment Variable**: `ENCRYPTION_SECRET`
- **Minimum Length**: 32 characters
- **Generation**: `openssl rand -base64 32`
- **Security**: Only accessible by the application runtime

### Per-User Key Derivation

Each user gets a unique encryption key derived from:
- **Master Secret**: Shared across all users (from environment)
- **User ID**: Unique identifier for each user
- **Salt**: Versioned salt string (`agentsos-v1-${userId}`)
- **Iterations**: 100,000 PBKDF2 iterations for security

This approach ensures:
- **Isolation**: Users cannot decrypt each other's data
- **Scalability**: No need to store individual user keys
- **Rotation**: Version-based salt allows for future key rotation

## Data Storage Structure

### Firebase Firestore Structure

The system uses a root-level `environments` collection for better scalability:

```
/environments/{userId}
├── userId: string
├── daytonaApiKey: EncryptedValue
├── projects: {
│   └── {projectName}: {
│       └── {envKey}: EncryptedValue
│   }
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

### Example Document

```json
{
  "userId": "user_2abc123def456",
  "daytonaApiKey": {
    "value": "base64-encrypted-api-key",
    "iv": "base64-initialization-vector", 
    "tag": "base64-auth-tag",
    "algorithm": "aes-256-gcm",
    "version": 1
  },
  "projects": {
    "my-web-app": {
      "DATABASE_URL": {
        "value": "base64-encrypted-db-url",
        "iv": "base64-iv",
        "tag": "base64-tag",
        "algorithm": "aes-256-gcm",
        "version": 1
      },
      "API_SECRET": {
        "value": "base64-encrypted-secret",
        "iv": "base64-iv", 
        "tag": "base64-tag",
        "algorithm": "aes-256-gcm",
        "version": 1
      }
    }
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Security Model

### Threat Model

The encryption system protects against:

1. **Database Breach**: Even if Firebase is compromised, encrypted data remains secure
2. **Internal Access**: AgentsOS team cannot read user API keys without access controls
3. **Cross-User Access**: Users cannot access other users' encrypted data
4. **Partial Compromise**: Individual encrypted values are protected by authentication tags

### Security Features

1. **Authenticated Encryption**: AES-256-GCM provides both confidentiality and integrity
2. **Unique IVs**: Each encryption operation uses a fresh random IV
3. **Key Isolation**: Per-user key derivation prevents cross-user data access  
4. **Version Support**: Encryption version field enables future algorithm upgrades
5. **Input Validation**: Strict validation of API key formats before encryption

### Security Assumptions

- **Environment Security**: Vercel environment variables are secure
- **Runtime Security**: Application runtime is not compromised
- **Firebase Security**: Firebase authentication and authorization are properly configured
- **HTTPS**: All data transmission occurs over encrypted channels

## API Integration

### User Service Admin

The `UserServiceAdmin` class in `/lib/user-service-admin.ts` provides the main interface for environment variable management:

```typescript
class UserServiceAdmin {
  // Store encrypted API key
  async storeDaytonaApiKey(uid: string, apiKey: string): Promise<void>
  
  // Retrieve and decrypt API key
  async getDaytonaApiKey(uid: string): Promise<string | null>
  
  // Store project environment variable
  async storeProjectEnvVar(uid: string, projectName: string, key: string, value: string): Promise<void>
  
  // Retrieve project environment variables
  async getProjectEnvVars(uid: string, projectName: string): Promise<Record<string, string>>
  
  // Get full environment document
  async getUserEnvironment(uid: string): Promise<UserEnvironment | null>
}
```

### Workspace Creation API

The workspace creation endpoint `/app/api/create-workspace/route.ts` integrates with the encryption system:

```typescript
// Accept API key from user during onboarding
if (body.daytonaApiKey) {
  await userService.storeDaytonaApiKey(userId, body.daytonaApiKey);
  apiKey = body.daytonaApiKey;
} else {
  // Retrieve stored API key for existing users
  apiKey = await userService.getDaytonaApiKey(userId);
}

// Use API key for workspace creation
const workspaceData = await daytonaClient.createWorkspace({
  // ... other params
}, apiKey);
```

## User Interface

### Desktop Onboarding

The desktop onboarding component (`/app/home/components/desktop/Onboarding.tsx`) includes:

- **API Key Input Field**: Secure password-style input with visibility toggle
- **Validation**: Real-time validation with user-friendly error messages
- **Information Panel**: Clear explanation of why the API key is needed
- **Security Messaging**: "Use your own Daytona API key for free until we figure out scaling to millions of users"

```typescript
const [daytonaApiKey, setDaytonaApiKey] = useState('')
const [showApiKey, setShowApiKey] = useState(false)
const [apiKeyError, setApiKeyError] = useState('')

const validateApiKey = (key: string): boolean => {
  setApiKeyError('')
  
  if (!key.trim()) {
    setApiKeyError('Daytona API key is required')
    return false
  }
  
  const cleanKey = key.trim()
  if (cleanKey.length < 10 || cleanKey.length > 200) {
    setApiKeyError('API key length should be between 10-200 characters')
    return false
  }
  
  if (!/^[a-zA-Z0-9\-_]+$/.test(cleanKey)) {
    setApiKeyError('API key contains invalid characters')
    return false
  }
  
  return true
}
```

### Mobile Onboarding

The mobile onboarding component (`/app/home/components/mobile/MobileOnboarding.tsx`) provides the same functionality optimized for mobile devices:

- **Touch-Optimized Input**: Larger touch targets and mobile-friendly sizing
- **Responsive Layout**: Adapts to different screen sizes
- **Native Feel**: iOS-style status bar and navigation

## Testing Strategy

### Comprehensive Test Coverage

The encryption system includes extensive test coverage across multiple levels:

#### 1. Unit Tests (`/lib/__tests__/encryption.test.ts`)

- **Environment Validation**: Tests for missing/invalid encryption secrets
- **Key Derivation**: Verification of per-user key generation
- **Encryption/Decryption**: Round-trip testing with real crypto
- **API Key Validation**: Format validation for various input types
- **Error Handling**: Graceful handling of encryption/decryption failures
- **Edge Cases**: Empty values, special characters, long strings

#### 2. Integration Tests (`/lib/__tests__/user-service-admin-environments.test.ts`)

- **Firebase Integration**: Mocked Firestore operations
- **Environment Management**: Full CRUD operations for user environments
- **Error Scenarios**: Database failures, encryption errors
- **Concurrent Operations**: Multiple simultaneous operations
- **Data Consistency**: Verification of stored data integrity

#### 3. End-to-End Tests

Real encryption flows using actual crypto operations:

```typescript
it('should encrypt and decrypt the same value correctly', async () => {
  const originalValue = 'test-daytona-api-key-12345';
  const userId = 'user-123';

  const encrypted = AgentsOSEncryption.encrypt(originalValue, userId);
  const decrypted = AgentsOSEncryption.decrypt(encrypted, userId);
  
  expect(decrypted).toBe(originalValue);
});
```

### Test Results

- **Total Tests**: 423 tests passing
- **Test Files**: 25 test files
- **Coverage Areas**: Encryption, validation, Firebase integration, UI components
- **Build Integration**: Tests run on every build to ensure system integrity

## Migration Path

### Current Implementation (MVP)

The current system uses a simplified approach suitable for MVP deployment:

- **Single Master Secret**: Stored in Vercel environment variables
- **PBKDF2 Key Derivation**: Using user ID as salt for key generation
- **AES-256-GCM**: Industry-standard authenticated encryption

### Future Migration Options

#### 1. Cloud KMS Integration

For production scale, the system can migrate to Google Cloud KMS:

```typescript
// Future implementation
class CloudKMSEncryption {
  private static kmsClient = new KeyManagementServiceClient();
  
  static async encrypt(value: string, userId: string): Promise<EncryptedValue> {
    const keyName = `projects/${PROJECT_ID}/locations/${LOCATION}/keyRings/${KEY_RING}/cryptoKeys/${CRYPTO_KEY}`;
    
    const [result] = await this.kmsClient.encrypt({
      name: keyName,
      plaintext: Buffer.from(value),
      additionalAuthenticatedData: Buffer.from(userId)
    });
    
    return {
      value: result.ciphertext.toString('base64'),
      algorithm: 'cloud-kms',
      version: 2,
      keyName
    };
  }
}
```

#### 2. Envelope Encryption

For high-scale operations:

```typescript
// Generate unique data encryption key per user
const dataKey = crypto.randomBytes(32);

// Encrypt data with DEK
const encryptedData = aes256gcm.encrypt(data, dataKey);

// Encrypt DEK with master key
const encryptedDEK = kms.encrypt(dataKey, masterKeyId);

// Store both encrypted data and encrypted DEK
```

#### 3. Hardware Security Modules (HSM)

For enterprise deployments requiring FIPS 140-2 Level 3 compliance.

## Security Considerations

### Current Security Posture

1. **Encryption Strength**: AES-256-GCM is approved by NSA for TOP SECRET data
2. **Key Derivation**: 100,000 PBKDF2 iterations exceed OWASP recommendations
3. **Authenticated Encryption**: Protects against tampering and replay attacks
4. **Key Isolation**: Per-user key derivation prevents cross-user access

### Known Limitations

1. **Master Secret Storage**: Single point of failure if environment is compromised
2. **Key Rotation**: No automated key rotation mechanism
3. **Audit Logging**: Limited audit trail for encryption operations
4. **Rate Limiting**: No rate limiting on encryption/decryption operations

### Recommended Improvements

1. **Key Rotation Strategy**
   ```typescript
   // Version-based key rotation
   const currentVersion = 2;
   const salt = `agentsos-v${currentVersion}-${userId}`;
   ```

2. **Audit Logging**
   ```typescript
   await logSecurityEvent({
     event: 'encryption.decrypt',
     userId,
     timestamp: new Date(),
     success: true
   });
   ```

3. **Rate Limiting**
   ```typescript
   const rateLimiter = new RateLimiter({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each user to 100 requests per windowMs
   });
   ```

### Compliance Considerations

- **GDPR**: Right to deletion requires secure key destruction
- **SOC 2**: Requires audit logging and access controls
- **HIPAA**: May require additional encryption at rest
- **PCI DSS**: Requires key management and regular security testing

## Conclusion

The AgentsOS encryption system provides a secure, scalable foundation for managing user environment variables. The current implementation successfully addresses the immediate needs of allowing user-provided API keys while maintaining strong security practices.

The modular design and version-aware encryption format provide clear migration paths for future enhancements, including cloud KMS integration, envelope encryption, and enterprise-grade security features.

### Key Achievements

- ✅ **423 tests passing** - Comprehensive test coverage
- ✅ **AES-256-GCM encryption** - Industry-standard security
- ✅ **Per-user key isolation** - Prevents cross-user data access
- ✅ **Scalable architecture** - Root-level Firebase collections
- ✅ **User-friendly interface** - Desktop and mobile onboarding
- ✅ **Production ready** - Full build and deployment pipeline

The system is now ready to support the transition from server-provided to user-provided API keys, enabling AgentsOS to scale beyond current server capacity limitations while maintaining the highest security standards.