/**
 * Common error handler for documentation generation scripts
 * Provides consistent error reporting and exit behavior
 */

export interface ErrorHandlerOptions {
  scriptName: string;
  troubleshootingTips?: string[];
}

/**
 * Handle script errors with consistent formatting and exit
 *
 * @param error - The error to handle
 * @param options - Configuration options including script name and tips
 * @returns Never returns (calls process.exit(1))
 */
export function handleScriptError(
  error: unknown,
  options: ErrorHandlerOptions,
): never {
  console.error(`❌ Error in ${options.scriptName}:`);

  if (error instanceof Error) {
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack trace:\n${error.stack}`);
    }
  } else {
    console.error(`   Unknown error: ${String(error)}`);
  }

  if (options.troubleshootingTips && options.troubleshootingTips.length > 0) {
    console.error("\n💡 Troubleshooting tips:");
    for (const tip of options.troubleshootingTips) {
      console.error(`   - ${tip}`);
    }
  }

  process.exit(1);
}

/**
 * Common troubleshooting tips for database documentation scripts
 */
export const DB_TROUBLESHOOTING_TIPS = [
  "Ensure drizzle/schema.ts is valid and can be imported",
  "Verify all table configurations have proper structure",
  "Check that foreign key references are valid",
  "Run 'pnpm run db:generate' if schema changes were made",
];

/**
 * Common troubleshooting tips for file operations
 */
export const FILE_TROUBLESHOOTING_TIPS = [
  "Ensure output directory is writable",
  "Check file system permissions",
  "Verify parent directories exist",
];
