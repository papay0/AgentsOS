# Migration Plan: Multi-Repository Support with Dynamic Port Allocation

## Overview
This document outlines the step-by-step migration plan to transform AgentsOS from a fixed multi-repo system to a dynamic system supporting up to 1000 repositories with automatic port allocation.

## 🚀 Current Progress

### ✅ Completed (Phase 1 & Initial Phase 2)
- **Type System**: New simplified interfaces (Repository, UserWorkspace)
- **Port Manager**: Simple slot-based allocation (8080+N, 10000+N, 4000+N)
- **Source Types**: Support for 'default', 'github', 'manual' workspaces
- **Workspace Services**: Updated to use PortManager instead of hardcoded ports
- **Unit Tests**: 20 tests passing (port-manager: 15, workspace-services: 5)

### 🔄 In Progress
- **Next**: Update workspace-creator.ts and Firebase integration

### ⏳ Remaining
- API endpoint updates, UI simplification, testing & migration

## Current State
- Fixed support for 2 repositories (AgentsPod, Pettitude)
- Hardcoded port allocation:
  - Repo 1: VSCode 8080, Terminal 9999, Claude 9998
  - Repo 2: VSCode 8081, Terminal 9989, Claude 9988

## Target State
- Dynamic support for up to 1000 repositories
- Default workspace always available (cannot be deleted)
- Port allocation scheme:
  - Main ports: VSCode 8080, Terminal 10000, Claude 4000
  - Subsequent repos: Increment by 1 (VSCode 8081, Terminal 10001, Claude 4001, etc.)
  - Port reuse when repositories are deleted
- Firebase storage for repository-port mappings
- Simplified onboarding with one-screen setup
- Lazy service startup (on-demand only)

## Migration Tasks

### Phase 1: Data Structure Design

#### 1.1 Firebase Schema Update
- [x] Design new Firestore data structure for workspaces
  ```typescript
  interface WorkspaceRepository {
    id: string;                    // Unique repo ID (UUID)
    url: string;                   // Git URL (empty for default)
    name: string;                  // Display name
    description?: string;
    sourceType: 'default' | 'github' | 'gitlab' | 'manual';
    isDefault?: boolean;           // Explicit flag for clarity
    ports: {
      vscode: number;              // 8080, 8081, 8082...
      terminal: number;            // 10000, 10001, 10002...
      claude: number;              // 4000, 4001, 4002...
    };
    status: 'active' | 'inactive' | 'starting' | 'error';
    servicesStarted: boolean;      // Track if services are running
    createdAt: Timestamp;
    lastAccessed?: Timestamp;
  }

  interface UserWorkspace {
    id: string;
    sandboxId: string;
    repositories: WorkspaceRepository[];     // All repos in one array (default first)
    portPool: {
      available: number[];       // Available port slots [1, 3, 5] if 2,4 deleted
      nextSlot: number;         // Next slot to allocate if no available
    };
    status: 'creating' | 'running' | 'stopped' | 'error';
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  ```

#### 1.2 Port Allocation Strategy  
- [x] Base ports for default workspace: VSCode 8080, Terminal 10000, Claude 4000
- [x] Port slot allocation (slot 0 = default, slot 1 = first additional repo)
- [x] Port calculation: basePort + slotNumber
- [x] Added 'manual' sourceType for new projects

### Phase 2: Core Library Updates

#### 2.1 Update `/lib/workspace-services.ts`
- [x] Remove hardcoded port allocation
- [x] Implement dynamic port allocation based on repository index
- [x] Add PortManager integration
- [x] Unit tests created and passing (5 tests)

#### 2.2 Update `/lib/workspace-creator.ts`
- [ ] Modify to handle dynamic repository list
- [ ] Implement default workspace creation
- [ ] Add repository limit validation (max 1000)
- [ ] Update logging for multi-repo scenarios

#### 2.3 Update `/lib/daytona.ts`
- [ ] Update `createWorkspace` to accept dynamic repository list
- [ ] Add methods for managing individual repository services
- [ ] Implement port mapping persistence

#### 2.4 Create `/lib/port-manager.ts`
- [x] Centralized port allocation logic with slot management
- [x] Simple getPortsForSlot() method
- [x] Default repository creation
- [x] Unit tests created and passing (15 tests)
- [x] Support for 'default', 'github', 'manual' source types

#### 2.5 Create `/lib/service-manager.ts`
- [ ] Lazy service startup (only when accessed)
- [ ] Service lifecycle management per repository
- [ ] Health monitoring for individual services
- [ ] Graceful service shutdown and cleanup

### Phase 3: API Endpoint Updates

#### 3.1 Update `/app/api/create-workspace/route.ts`
- [ ] Accept optional repository URL parameter
- [ ] Create default workspace if no repo specified
- [ ] Allocate ports dynamically
- [ ] Save port mappings to Firebase
- [ ] Return workspace with all port information

#### 3.2 Update `/app/api/fix-services/[sandboxId]/route.ts`
- [ ] Remove hardcoded repository references
- [ ] Dynamically restart services based on stored port mappings
- [ ] Handle variable number of repositories

#### 3.3 Update `/app/api/debug-services/[sandboxId]/route.ts`
- [ ] Check ports dynamically based on workspace configuration
- [ ] Report status for all configured repositories

#### 3.4 Create `/app/api/add-repository/route.ts`
- [ ] New endpoint to add repository to existing workspace
- [ ] Allocate next available port set
- [ ] Update Firebase with new repository
- [ ] Start services for new repository

#### 3.5 Create `/app/api/remove-repository/route.ts`
- [ ] Remove repository from workspace
- [ ] Stop associated services
- [ ] Update Firebase (keep port allocation for potential re-add)

### Phase 4: Firebase Integration Updates

#### 4.1 Update `/lib/services/user-service-admin.ts`
- [ ] Modify workspace creation to support new schema
- [ ] Add methods for repository management
- [ ] Implement port mapping storage/retrieval
- [ ] Add migration logic for existing workspaces

#### 4.2 Update `/types/user.ts`
- [ ] Update interfaces to match new Firebase schema
- [ ] Add repository and port mapping types

### Phase 5: UI Component Updates

#### 5.1 Simplify `/app/home-os/components/desktop/Onboarding.tsx`
- [ ] Remove multi-step wizard
- [ ] Create single-screen explanation of AgentsOS
- [ ] Single "Launch Workspace" button
- [ ] Remove hardcoded repository selection

#### 5.2 Simplify `/app/home-os/components/mobile/Onboarding.tsx`
- [ ] Mirror desktop simplification
- [ ] Ensure mobile-optimized single screen

#### 5.3 Create Repository Management UI (Post-launch)
- [ ] New settings screen for managing repositories
- [ ] GitHub integration for repository selection
- [ ] Add/remove repository functionality
- [ ] Display port allocations

### Phase 6: Workspace URL Generation

#### 6.1 Update `/app/api/workspace-urls/[sandboxId]/route.ts`
- [ ] Generate URLs dynamically based on port mappings
- [ ] Return URLs for all active repositories

#### 6.2 Update workspace components
- [ ] Update VSCode/Terminal components to use dynamic URLs
- [ ] Handle multiple repository tabs/windows

### Phase 7: Testing & Migration

#### 7.1 Testing Strategy
- [ ] Test default workspace creation
- [ ] Test adding repositories incrementally
- [ ] Test port conflict handling
- [ ] Test service restart with dynamic ports
- [ ] Test Firebase data persistence

#### 7.2 Migration Strategy
- [ ] Create migration script for existing workspaces
- [ ] Backup current Firebase data
- [ ] Test migration on staging environment
- [ ] Plan rollback strategy

### Phase 8: Documentation & Cleanup

#### 8.1 Update Documentation
- [ ] Update CLAUDE.md with new architecture
- [ ] Document port allocation scheme
- [ ] Add troubleshooting guide

#### 8.2 Code Cleanup
- [ ] Remove hardcoded repository references
- [ ] Remove unused variables and functions
- [ ] Update type definitions

## Implementation Order

### Priority 0: Validation (Days 1-2)
1. **CRITICAL**: Test Daytona port exposure limits with multiple ports
2. Validate Firebase document size with 1000 repository simulation
3. Confirm port ranges are accessible from browser
4. Test service startup performance with incremental repositories

### Priority 1: Core Infrastructure (Week 1)
1. Firebase schema design (Phase 1.1)
2. Port manager creation (Phase 2.4)
3. Core library updates (Phase 2.1-2.3)
4. Firebase integration updates (Phase 4)

### Priority 2: API Updates (Week 1-2)
1. Update create-workspace API (Phase 3.1)
2. Update fix-services API (Phase 3.2)
3. Update debug-services API (Phase 3.3)
4. Create add/remove repository APIs (Phase 3.4-3.5)

### Priority 3: UI Simplification (Week 2)
1. Simplify onboarding components (Phase 5.1-5.2)
2. Update workspace URL generation (Phase 6)

### Priority 4: Testing & Launch (Week 2-3)
1. Comprehensive testing (Phase 7.1)
2. Migration preparation (Phase 7.2)
3. Documentation updates (Phase 8)

## Critical Issues & Solutions

### Issue 1: Service Startup Performance
**Problem**: Starting 1000 services would overwhelm the system and be extremely slow
**Solution**: 
- Implement lazy/on-demand service startup
- Only start services when user actually accesses them
- Track service state with `servicesStarted` flag
- Start services in background when repository is first accessed

### Issue 2: Port Pool Management  
**Problem**: Simple increment would lead to port exhaustion when repos are deleted
**Solution**:
- Implement port slot system with reuse pool
- When repo deleted: add slot to `available` array
- When adding repo: use `available` slot first, then `nextSlot`
- Example: Slots 0,1,2,3,4 → delete slot 2 → available=[2] → next repo gets slot 2

### Issue 3: Daytona Port Exposure Limits
**Problem**: Daytona may have limits on exposed ports, security concerns
**Solution**:
- Validate with Daytona SDK port exposure limits  
- Implement port range validation before allocation
- Consider port proxying if direct exposure is limited
- Document maximum supported repositories based on platform limits

### Issue 4: Firebase Document Size Limits
**Problem**: 1000 repositories in one document could exceed 1MB Firestore limit
**Solution**:
- Monitor document size during implementation
- If needed, split into subcollections:
  - `/users/{userId}/workspace` - metadata only
  - `/users/{userId}/repositories/{repoId}` - individual repo data
- Implement pagination for repository lists in UI

### Issue 5: Default Workspace Protection
**Problem**: User might accidentally delete default workspace
**Solution**:
- Default workspace cannot be deleted (UI prevents it)
- Always ensure one `sourceType: 'default'` exists
- If corrupted, auto-recreate default workspace
- Validation in all delete operations

### Issue 6: Port Conflict Detection
**Problem**: System process might use our allocated ports
**Solution**:
- Runtime port availability checking before service start
- Port conflict resolution with alternative port selection
- Health check endpoints to verify service accessibility
- Automatic port reallocation if conflicts detected

### Issue 7: Repository Uniqueness
**Problem**: Same repository added multiple times, ID conflicts
**Solution**:
- Check for duplicate repository URLs before adding
- Use UUID for repository IDs to prevent conflicts
- Validate repository URL format and accessibility
- Allow same repo with different branches (different IDs)

## Key Considerations

### Performance
- Lazy loading of repository services (critical)
- Efficient port slot allocation algorithm
- Caching of port mappings and service states
- Minimal Firestore reads/writes per operation

### Scalability  
- Port slot system designed for reuse and efficiency
- Consider Daytona platform limits (validate early)
- Firebase document size monitoring
- Plan for potential port range exhaustion

### User Experience
- Seamless default workspace creation (always works)
- Clear feedback during repository addition/service startup
- Graceful handling of port conflicts and failures
- Loading states for on-demand service startup

### Security
- Validate repository URLs and access permissions
- Prevent port scanning via exposed services
- Secure Firebase rules for workspace data
- Rate limiting on repository addition

### Backwards Compatibility
- Migration path for existing hardcoded workspaces
- Support for legacy port allocations during transition
- Gradual rollout with feature flags

## Success Criteria
- [ ] Default workspace launches in < 60 seconds
- [ ] Support for 1000 repositories without conflicts
- [ ] Simplified one-click onboarding
- [ ] All existing functionality preserved
- [ ] Zero downtime migration

## Risks & Mitigations
1. **Port Conflicts**: Implement robust port checking before allocation
2. **Firebase Performance**: Optimize queries, use proper indexing
3. **Service Startup Failures**: Implement retry logic with exponential backoff
4. **Migration Errors**: Comprehensive backup and rollback plan

## Notes
- Port ranges chosen to avoid common application ports and conflicts:
- VSCode: 8080-9079 (1000 ports) - Standard web dev range
- Terminal: 10000-10999 (1000 ports) - Rarely used, safe range  
- Claude: 4000-4999 (1000 ports) - Less conflicts than 2000s, avoids 3000s dev servers
- Port slot system allows efficient reuse when repositories are deleted
- Lazy service startup prevents system overload with many repositories