const fs = require('fs');
let text = fs.readFileSync('lib/compatibilityEngine.ts', 'utf8');

const idx = text.indexOf('export function getComponentCompatibility');
if (idx !== -1) {
  text = text.substring(0, idx);
}
text = text.trim();
if (!text.endsWith('}')) {
    text += '\n}';
}

text += `

export function getComponentCompatibility(category: string, product: any, currentBuild: PcBuildState): ValidationMessage | null {
  const testBuild: PcBuildState = { ...currentBuild } as PcBuildState;
  
  if (category === 'cpus') testBuild.cpu = product;
  else if (category === 'motherboards') testBuild.motherboard = product;
  else if (category === 'ram') testBuild.ram = product;
  else if (category === 'gpus') testBuild.gpu = product;
  else if (category === 'psus') testBuild.psu = product;
  else if (category === 'cases') testBuild.case = product;
  else if (category === 'coolers') testBuild.cpu_cooler = product;
  else return null;

  const messages = validateBuild(testBuild);
  const error = messages.find((m) => m.type === 'error');
  if (error) return error;

  return null;
}
`;

fs.writeFileSync('lib/compatibilityEngine.ts', text);
