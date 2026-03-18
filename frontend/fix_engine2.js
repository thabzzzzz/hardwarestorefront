const fs = require('fs');
let code = fs.readFileSync('lib/compatibilityEngine.ts', 'utf8');

code = code.replace(
    /\(cpuTitle\.match\(\/\(AM\[345\]\|LGA\[\\s-\]\?\\w\+\|sTRX4\|TR4\)\/i\)\?\.\[0\] \|\| null\)/g,
    "(cpuTitle.match(/(AM[345]|LGA[\\s-]?\\w+|sTRX4|TR4|sWRX8|SP3)/i)?.[0] || null)"
);
code = code.replace(
    /\(mbTitle\.match\(\/\(AM\[345\]\|LGA\[\\s-\]\?\\w\+\|sTRX4\|TR4\)\/i\)\?\.\[0\] \|\| null\)/g,
    "(mbTitle.match(/(AM[345]|LGA[\\s-]?\\w+|sTRX4|TR4|sWRX8|SP3)/i)?.[0] || null)"
);

code = code.replace(
    /const cpuIsIntel = cpuTitle.toLowerCase\(\).includes\('intel'\);[\s\S]*?const mbIsAMD = mbTitle.toLowerCase\(\).includes\('amd'\) \|\| mbTitle.toLowerCase\(\).includes\('ryzen'\);/m,
    `const cpuIsIntel = cpuTitle.toLowerCase().includes('intel') || cpuTitle.toLowerCase().includes('core i');
      const cpuIsAMD = cpuTitle.toLowerCase().includes('amd') || cpuTitle.toLowerCase().includes('ryzen') || cpuTitle.toLowerCase().includes('threadripper');
      
      const intelChipsets = /([HZb]\\d[169]0|X299|Z590|Z690|Z790|Z890|B760)/i;
      const amdChipsets = /([ABX]\\d[257]0|TRX[45]0|WRX[89]0)/i;
      
      const mbIsIntel = mbTitle.toLowerCase().includes('intel') || intelChipsets.test(mbTitle);
      const mbIsAMD = mbTitle.toLowerCase().includes('amd') || amdChipsets.test(mbTitle);`
);

fs.writeFileSync('lib/compatibilityEngine.ts', code);
