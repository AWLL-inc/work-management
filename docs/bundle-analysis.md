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

AG Grid's module-based architecture requires **AG Grid Enterprise** packages:
- `@ag-grid-community/core`
- `@ag-grid-community/client-side-row-model`
- `@ag-grid-community/csv-export`
- etc.

Our project uses **AG Grid Community** packages:
- `ag-grid-community` (monolithic package)
- `ag-grid-react`

**Key Differences:**

| Feature | Community (Current) | Enterprise (Not Used) |
|---------|--------------------|-----------------------|
| Package structure | Monolithic | Modular |
| Module imports | ❌ Not supported | ✅ Supported |
| Tree-shaking | Limited | Better |
| Bundle size | Larger | Smaller (with modules) |
| License | Free | Commercial |

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

### Future Optimization Options

If bundle size becomes a critical issue, consider:

1. **Upgrade to AG Grid Enterprise**
   - Requires commercial license
   - Enables module-based imports
   - Estimated savings: 30-50% of AG Grid bundle size

2. **Alternative Table Libraries**
   - TanStack Table (already in use for some tables)
   - React Table
   - Consideration: Feature parity and migration cost

3. **Dynamic Imports** (if not already applied)
   - Lazy load AG Grid pages
   - Load on user interaction

## Optimization Checklist

- [x] Bundle analyzer configured
- [x] Analysis command available (`pnpm run analyze`)
- [ ] Baseline bundle metrics documented
- [ ] Regular bundle size monitoring in CI
- [ ] Tree-shaking verification
- [ ] Dynamic import opportunities identified

## Baseline Metrics

To be updated after first analysis run:

```
Initial Bundle Sizes (before optimization):
- Client Bundle: TBD
- AG Grid Chunk: TBD
- Total JS: TBD

Target Bundle Sizes:
- Client Bundle: < 200KB (gzipped)
- AG Grid Chunk: < 150KB (gzipped)
```

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
    ACTUAL_SIZE=$(stat -f%z .next/static/chunks/main-*.js)
    if [ $ACTUAL_SIZE -gt $MAX_SIZE ]; then
      echo "Bundle size exceeded: $ACTUAL_SIZE > $MAX_SIZE"
      exit 1
    fi
```

### Regular Checks

Run bundle analysis:
- Before major releases
- After adding new dependencies
- When performance issues are reported

## References

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [AG Grid Modules Documentation](https://www.ag-grid.com/react-data-grid/modules/)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
