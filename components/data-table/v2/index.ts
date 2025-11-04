/**
 * EnhancedAGGrid V2 - Pluggable Architecture
 *
 * This module exports the next generation of EnhancedAGGrid with a composable,
 * feature-based architecture.
 *
 * @example
 * ```typescript
 * import { EnhancedAGGridV2 } from '@/components/data-table/v2';
 *
 * <EnhancedAGGridV2
 *   data={myData}
 *   columns={myColumns}
 *   enableBatchEditing={true}
 *   enableUndoRedo={true}
 *   enableRowActions={true}
 * />
 * ```
 */

export type { EnhancedAGGridV2Props } from "./enhanced-ag-grid-v2";
export { EnhancedAGGridV2 } from "./enhanced-ag-grid-v2";
