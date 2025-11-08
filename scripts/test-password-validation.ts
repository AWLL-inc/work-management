/**
 * Test password validation
 */
import { validatePasswordStrength } from "@/lib/utils/password";

const testPasswords = [
  "NewPassword123",
  "NewPass123!",
  "SecureKey456",
  "SafeCode789",
  "MySecret2024",
];

console.log("🔐 Testing Password Validation\n");

for (const password of testPasswords) {
  console.log(`Testing: "${password}"`);
  const result = validatePasswordStrength(password);

  console.log(`  Valid: ${result.isValid}`);
  console.log(`  Score: ${result.score}/4`);

  if (result.errors.length > 0) {
    console.log(`  ❌ Errors:`);
    for (const error of result.errors) {
      console.log(`     - ${error}`);
    }
  } else {
    console.log(`  ✅ No errors`);
  }

  if (result.suggestions.length > 0) {
    console.log(`  💡 Suggestions:`);
    for (const suggestion of result.suggestions) {
      console.log(`     - ${suggestion}`);
    }
  }

  console.log("");
}
