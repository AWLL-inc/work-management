# Bundle Analysis Guide

## Overview

This document describes how to analyze and optimize bundle sizes in the work-management application.

## Bundle Analyzer Setup

The project uses `@next/bundle-analyzer` to visualize bundle sizes and identify optimization opportunities.

### Running Bundle Analysis

```bash
# Analyze production bundle
pnpm run analyze

# This will:
# 1. Generate documentation
# 2. Build the application for production
# 3. Open bundle analysis reports in your browser
```

### Analysis Reports

The analyzer generates three HTML reports:

- **Client Bundle**: Shows all JavaScript sent to the browser
- **Server Bundle**: Shows code running on the Node.js server
- **Edge Bundle**: Shows code running on Edge runtime (API routes)

### What to Look For

1. **Large Chunks**: Identify any chunks over 100KB (gzipped)
2. **Duplicate Dependencies**: Check if the same library appears in multiple chunks
3. **Unused Code**: Look for imported but unused modules
4. **Heavy Dependencies**: Identify libraries that contribute significantly to bundle size

## AG Grid Optimization Limitations

### Why AG Grid Module Splitting is Not Implemented

**Issue #93 originally proposed** using AG Grid's module-based imports:

```typescript
// Proposed but NOT implemented
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
```

**Reason for NOT implementing:**

This project uses the **monolithic package approach** with AG Grid Community Edition. While modular imports (`@ag-grid-community/*` packages) are available for both Community and Enterprise editions, migrating to the modular approach requires significant refactoring.

**Current Package Configuration:**

Our project uses monolithic packages:
- `ag-grid-community` (monolithic package)
- `ag-grid-react`

**Available Package Approaches:**

| Approach | Packages | Tree-shaking | Migration Cost | License |
|----------|----------|--------------|----------------|---------|
| **Monolithic (Current)** | `ag-grid-community` | Limited | N/A | Free |
| **Modular Community** | `@ag-grid-community/*` | Better | High (refactor all imports) | Free |
| **Modular Enterprise** | `@ag-grid-community/*` + `@ag-grid-enterprise/*` | Best | Very High + License Cost | Commercial |

**Why Not Modular Packages:**
1. **High Migration Cost**: Requires refactoring all AG Grid imports across the codebase
2. **Limited Benefit**: Community modular packages provide better tree-shaking but not enterprise features
3. **Existing Optimization**: Next.js code splitting already handles most optimization needs

### Current Bundle Optimization Strategy

Since AG Grid module splitting is not available, we rely on:

1. **Next.js Automatic Code Splitting**
   - Server Components automatically split from Client Components
   - AG Grid is only loaded when needed (lazy initialization)

2. **React Compiler Optimization** (#91)
   - Automatic memoization reduces re-renders
   - Smaller runtime overhead

3. **Bundle Analysis** (this PR)
   - Identify actual optimization opportunities
   - Make data-driven decisions

### Package Cleanup (Completed)

**✅ Completed**: `ag-grid-enterprise` has been removed from `package.json`

**What was removed:**
- `ag-grid-enterprise` package and 4 dependencies
- ~2-3MB reduction in node_modules size

**Why it was safe:**
- Not imported in any source files (verified via code search)
- Legacy dependency from commit `c6b605d` where Enterprise imports were removed
- No functionality depends on this package

**History:**
- Added during experimentation with Enterprise features
- Removed from code in commit `c6b605d: fix: remove AG Grid Enterprise dependencies completely for stable Community edition`
- Package removed in this PR (commit `b629a93`)

### Future Optimization Options

If bundle size becomes a critical issue, consider:

1. **Migrate to Modular Community Packages**
   - Use `@ag-grid-community/*` packages for better tree-shaking
   - Free, no license required
   - Estimated savings: 20-30% of AG Grid bundle size
   - Cost: High refactoring effort

2. **Upgrade to AG Grid Enterprise** (if business requires advanced features)
   - Requires commercial license
   - Access to Enterprise-only features (Advanced Filtering, Excel Export, etc.)
   - Use `@ag-grid-community/*` + `@ag-grid-enterprise/*` modular packages
   - Estimated savings: 30-50% of AG Grid bundle size with modules

3. **Alternative Table Libraries**
   - TanStack Table (already in use for some tables)
   - Consider migrating all tables to TanStack Table for consistency
   - Consideration: Feature parity and migration cost

4. **Dynamic Imports** (if not already applied)
   - Lazy load AG Grid pages
   - Load on user interaction
   - Implement route-based code splitting

## Optimization Checklist

- [x] Bundle analyzer configured
- [x] Analysis command available (`pnpm run analyze`)
- [ ] Baseline bundle metrics documented
- [ ] Regular bundle size monitoring in CI
- [ ] Tree-shaking verification
- [ ] Dynamic import opportunities identified

## Baseline Metrics

### How to Measure Baseline

Run the following commands to establish baseline metrics:

```bash
# 1. Build the production bundle
pnpm run build

# 2. Analyze bundle with visualization
pnpm run analyze

# 3. Check .next/static/chunks/ for actual file sizes
ls -lh .next/static/chunks/*.js

# 4. Get gzipped sizes (more accurate for network transfer)
gzip -c .next/static/chunks/app-*.js | wc -c
```

### Expected Baseline (Post-Cleanup)

After removing `ag-grid-enterprise` (~1.3MB reduction):

```
Initial Bundle Sizes (after ag-grid-enterprise removal):
- Client Bundle: TBD (measure with pnpm run analyze)
- AG Grid Chunk: TBD (measure with pnpm run analyze)
- Total JS: TBD (measure with pnpm run analyze)

Target Bundle Sizes:
- Client Bundle: < 200KB (gzipped)
- AG Grid Chunk: < 150KB (gzipped)
```

**Status**: ✅ Environment ready for measurement. Run `pnpm run analyze` to establish baseline.

### Measurement Checklist

- [ ] Run `pnpm run build` successfully
- [ ] Run `pnpm run analyze` and capture screenshots
- [ ] Record Client Bundle size (gzipped)
- [ ] Record AG Grid chunk size (gzipped)
- [ ] Record Total JS size
- [ ] Update this document with actual numbers
- [ ] Calculate reduction percentage vs. pre-cleanup baseline (if available)

## Monitoring

### CI Integration

Consider adding bundle size monitoring to CI:

```yaml
# .github/workflows/bundle-size.yml
- name: Analyze bundle size
  run: pnpm run analyze

- name: Check bundle size limits
  run: |
    # Fail if bundle exceeds threshold
    MAX_SIZE=250000  # 250KB

    # Cross-platform stat command (Linux uses -c%s, macOS uses -f%z)
    if stat -c%s .next/static/chunks/*.js >/dev/null 2>&1; then
      # Linux
      ACTUAL_SIZE=$(stat -c%s .next/static/chunks/app-*.js 2>/dev/null | sort -n | tail -1)
    else
      # macOS/BSD
      ACTUAL_SIZE=$(stat -f%z .next/static/chunks/app-*.js 2>/dev/null | sort -n | tail -1)
    fi

    if [ -z "$ACTUAL_SIZE" ]; then
      echo "Warning: Could not find bundle chunks"
      exit 0
    fi

    if [ $ACTUAL_SIZE -gt $MAX_SIZE ]; then
      echo "Bundle size exceeded: $ACTUAL_SIZE > $MAX_SIZE"
      exit 1
    fi

    echo "Bundle size OK: $ACTUAL_SIZE <= $MAX_SIZE"
```

> **Note**: This example demonstrates the concept but needs adjustment based on actual Next.js 15 output structure. The chunk file naming (e.g., `app-*.js`, `framework-*.js`, `main-*.js`) may vary. Run `pnpm run build` and inspect `.next/static/chunks/` to determine the correct filenames for your monitoring.

### Regular Checks

Run bundle analysis:
- Before major releases
- After adding new dependencies
- When performance issues are reported

## References

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [AG Grid Modules Documentation](https://www.ag-grid.com/react-data-grid/modules/)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
