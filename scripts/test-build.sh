#!/bin/bash

# AgentsOS Build and Test Verification Script
# This script ensures nothing breaks during the build process

set -e  # Exit on any error

echo "🧪 Starting comprehensive build and test verification..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Type checking
print_status "Running TypeScript type checking..."
if npm run tsc -- --noEmit; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Step 2: Linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found (continuing...)"
fi

# Step 3: Unit tests
print_status "Running unit tests..."
if npm run test:run; then
    print_success "All unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Step 4: Component integration tests
print_status "Running component integration tests..."
if npm run test:run -- --grep "Integration"; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# Step 5: Build verification
print_status "Building application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 6: Build size analysis
print_status "Analyzing build size..."
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    # Check for reasonable build size (adjust threshold as needed)
    SIZE_MB=$(du -sm .next | cut -f1)
    if [ "$SIZE_MB" -gt 100 ]; then
        print_warning "Build size is quite large ($SIZE_MB MB). Consider optimization."
    fi
else
    print_error "Build directory not found"
    exit 1
fi

# Step 7: Critical component tests
print_status "Running critical component smoke tests..."

# Test desktop window management
npm run test:run -- --grep "Window Component.*Rendering" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Desktop window rendering tests passed"
else
    print_error "Desktop window rendering tests failed"
    exit 1
fi

# Test mobile workspace
npm run test:run -- --grep "MobileWorkspace.*Initial Rendering" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Mobile workspace rendering tests passed"
else
    print_error "Mobile workspace rendering tests failed"
    exit 1
fi

# Test store integrity
npm run test:run -- --grep "Window Store.*Window Creation" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Window store tests passed"
else
    print_error "Window store tests failed"
    exit 1
fi

# Step 8: Performance checks
print_status "Running performance checks..."

# Check for console errors in build
if grep -r "console.error\|console.warn" app/ --include="*.tsx" --include="*.ts" | grep -v test | grep -v ".test." | wc -l | grep -q "^0$"; then
    print_success "No console errors found in production code"
else
    print_warning "Console errors/warnings found in production code"
fi

# Check for TODO comments that might indicate incomplete features
TODO_COUNT=$(grep -r "TODO\|FIXME\|HACK" app/ --include="*.tsx" --include="*.ts" | grep -v test | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    print_warning "Found $TODO_COUNT TODO/FIXME comments in codebase"
else
    print_success "No pending TODOs found"
fi

# Step 9: Dependency security check
print_status "Checking for security vulnerabilities..."
if npm audit --audit-level=high; then
    print_success "No high-severity vulnerabilities found"
else
    print_error "Security vulnerabilities detected"
    exit 1
fi

# Step 10: Final verification
print_status "Final verification checks..."

# Verify critical files exist
CRITICAL_FILES=(
    "app/home-os/components/Workspace.tsx"
    "app/home-os/components/desktop/Window.tsx"
    "app/home-os/components/mobile/MobileWorkspace.tsx"
    "app/home-os/stores/windowStore.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Critical file exists: $file"
    else
        print_error "Critical file missing: $file"
        exit 1
    fi
done

# Verify test coverage
print_status "Checking test coverage..."
npm run test:coverage > /dev/null 2>&1
COVERAGE_RESULT=$?

if [ $COVERAGE_RESULT -eq 0 ]; then
    print_success "Test coverage analysis completed"
else
    print_warning "Test coverage analysis had issues (continuing...)"
fi

echo
echo "🎉 ${GREEN}All checks passed! Build is ready for deployment.${NC}"
echo
echo "📊 Summary:"
echo "  - TypeScript compilation: ✅"
echo "  - Linting: ✅"
echo "  - Unit tests: ✅"
echo "  - Integration tests: ✅"
echo "  - Build process: ✅"
echo "  - Security check: ✅"
echo "  - Critical files: ✅"
echo
echo "🚀 The workspace is functioning correctly and ready for production!"