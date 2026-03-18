const fs = require("fs");
let code = fs.readFileSync("lib/compatibilityEngine.ts", "utf8");
code = code.replace(
  "  const messages = validateBuild(testBuild);\n  const error = messages.find((m) => m.type === 'error');\n  if (error) return error;",
  `  const baselineMessages = validateBuild(currentBuild);
  const newMessages = validateBuild(testBuild);
  const baselineErrors = baselineMessages.filter(m => m.type === 'error').map(m => m.message);
  const newError = newMessages.find(m => m.type === 'error' && !baselineErrors.includes(m.message));
  if (newError) return newError;`
);
code = code.replace(
  "  const messages = validateBuild(testBuild);\r\n  const error = messages.find((m) => m.type === 'error');\r\n  if (error) return error;",
  `  const baselineMessages = validateBuild(currentBuild);
  const newMessages = validateBuild(testBuild);
  const baselineErrors = baselineMessages.filter(m => m.type === 'error').map(m => m.message);
  const newError = newMessages.find(m => m.type === 'error' && !baselineErrors.includes(m.message));
  if (newError) return newError;`
);
fs.writeFileSync("lib/compatibilityEngine.ts", code);
