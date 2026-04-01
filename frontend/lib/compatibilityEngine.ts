export interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

// These match what normalizer produces
export interface ComponentSpecs {
  socket?: string;
  includes_cooler?: boolean;
  form_factor?: string;
  memory_type?: string;
  memory_slots?: number;
  modules?: { count: number; size_gb: number };
  wattage?: number;
  length_mm?: number;
  recommended_psu?: number;
  max_gpu_length_mm?: number;
  max_psu_length_mm?: number;
  mb_form_factors?: string[];
  case_type?: string;
  supported_sockets?: string[];
  cooler_type?: string;
  size_mm?: number;
}

export interface BuildComponent {
  product_id?: string;
  slug?: string;
  title: string;
  normalized_specs?: ComponentSpecs;
}

export type PcBuildState = {
  cpu?: BuildComponent;
  motherboard?: BuildComponent;
  ram?: BuildComponent;
  gpu?: BuildComponent;
  psu?: BuildComponent;
  case?: BuildComponent;
  system_cooling?: BuildComponent;
};

export function validateBuild(build: PcBuildState): ValidationMessage[] {
  const messages: ValidationMessage[] = [];

  const { cpu, motherboard, ram, gpu, psu, case: pcCase, system_cooling } = build;

const normalizeStr = (s?: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  
  // 1. CPU & Motherboard Socket Validation
  const cpuTitle = cpu?.title || '';
  const mbTitle = motherboard?.title || '';

  const cpuSocket = cpu?.normalized_specs?.socket || (cpuTitle.match(/(AM[345]|LGA[\s-]?\w+|sTRX4|TR4|sWRX8|SP3)/i)?.[0] || null);
  const mbSocket = motherboard?.normalized_specs?.socket || (mbTitle.match(/(AM[345]|LGA[\s-]?\w+|sTRX4|TR4|sWRX8|SP3)/i)?.[0] || null);

  if (cpuSocket && mbSocket) {
    const cNorm = normalizeStr(cpuSocket);
    const mNorm = normalizeStr(mbSocket);

    if (cNorm !== mNorm && !cNorm.includes(mNorm) && !mNorm.includes(cNorm)) {
      messages.push({
        type: 'error',
        message: `Incompatible Socket! CPU is ${cpuSocket.toUpperCase()} but Motherboard is ${mbSocket.toUpperCase()}.`
      });
    } else {
      messages.push({
        type: 'success',
        message: `Motherboard and CPU socket match.`
      });
    }
  } else if (cpuTitle && mbTitle) {
      // Vendor mismatch fallback
      const cpuIsIntel = cpuTitle.toLowerCase().includes('intel') || cpuTitle.toLowerCase().includes('core i');
      const cpuIsAMD = cpuTitle.toLowerCase().includes('amd') || cpuTitle.toLowerCase().includes('ryzen') || cpuTitle.toLowerCase().includes('threadripper');
      
      const intelChipsets = /([HZb]\d[169]0|X299|Z590|Z690|Z790|Z890|B760)/i;
      const amdChipsets = /([ABX]\d[257]0|TRX[45]0|WRX[89]0)/i;
      
      const mbIsIntel = mbTitle.toLowerCase().includes('intel') || intelChipsets.test(mbTitle);
      const mbIsAMD = mbTitle.toLowerCase().includes('amd') || amdChipsets.test(mbTitle);

      if ((cpuIsIntel && mbIsAMD) || (cpuIsAMD && mbIsIntel)) {
          messages.push({
            type: 'error',
            message: `Brand mismatch! You paired an ${cpuIsIntel ? 'Intel' : 'AMD'} CPU with an ${mbIsIntel ? 'Intel' : 'AMD'} Motherboard.`
          });
      }
  }

  // 2. CPU Cooler compatibility
  if (system_cooling?.normalized_specs?.supported_sockets && motherboard?.normalized_specs?.socket) {
    if (!system_cooling.normalized_specs.supported_sockets.includes(motherboard.normalized_specs.socket)) {
      messages.push({
        type: 'error',
        message: `CPU Cooler does not support socket ${motherboard.normalized_specs.socket}. Supported: ${system_cooling.normalized_specs.supported_sockets.join(', ')}`
      });
    }
  }

  // Warning if no cooler is included with CPU
  if (cpu) {
    if (cpu.normalized_specs?.includes_cooler === false) {
       messages.push({
         type: 'warning',
         message: 'This CPU does not include a stock cooler. Because this store currently only stocks system cooling fans, please ensure to purchase a compatible CPU cooler independently.'
       });
    }
  }

  // 3. RAM & Motherboard
  const ramType = ram?.normalized_specs?.memory_type || (ram?.title?.match(/DDR[345]/i) ? ram.title.match(/DDR[345]/i)![0].toUpperCase() : null);
  const mbType = motherboard?.normalized_specs?.memory_type || (motherboard?.title?.match(/DDR[345]/i) ? motherboard.title.match(/DDR[345]/i)![0].toUpperCase() : null);

  if (ramType && mbType) {
    if (normalizeStr(ramType) !== normalizeStr(mbType)) {
      messages.push({
        type: 'error',
        message: `Incompatible Memory! RAM is ${ramType} but Motherboard supports ${mbType}.`
      });
    } else {
      messages.push({
        type: 'success',
        message: `Memory type (${ramType}) matches.`
      });
    }
  }

  // RAM slots check
  if (ram?.normalized_specs?.modules && motherboard?.normalized_specs?.memory_slots) {
    if (ram.normalized_specs.modules.count > motherboard.normalized_specs.memory_slots) {
       messages.push({
         type: 'error',
         message: `Motherboard only has ${motherboard.normalized_specs.memory_slots} RAM slots, but your RAM kit has ${ram.normalized_specs.modules.count} modules.`
       });
    }
  }

  // 4. Case & Motherboard Form Factor
  if (pcCase?.normalized_specs?.mb_form_factors && motherboard?.normalized_specs?.form_factor) {
    // Normalizer lowercases and compares. E.g. "ATX" vs ["ATX", "Micro ATX"]
    const caseSupports = pcCase.normalized_specs.mb_form_factors.map((f: string) => f.toUpperCase());
    const mbFormFactor = motherboard.normalized_specs.form_factor.toUpperCase();
    
    if (!caseSupports.includes(mbFormFactor)) {
       messages.push({
         type: 'error',
         message: `Case does not support ${motherboard.normalized_specs.form_factor} motherboards. Supported: ${pcCase.normalized_specs.mb_form_factors.join(', ')}`
       });
    } else {
       messages.push({
         type: 'success',
         message: `Case supports Motherboard form factor (${motherboard.normalized_specs.form_factor}).`
       });
    }
  }

  // 5. GPU & Case clearance
  if (gpu?.normalized_specs?.length_mm && pcCase?.normalized_specs?.max_gpu_length_mm) {
     if (gpu.normalized_specs.length_mm > pcCase.normalized_specs.max_gpu_length_mm) {
        messages.push({
          type: 'error',
          message: `GPU is ${gpu.normalized_specs.length_mm}mm long, but the case only supports up to ${pcCase.normalized_specs.max_gpu_length_mm}mm.`
        });
     } else if (pcCase.normalized_specs.max_gpu_length_mm - gpu.normalized_specs.length_mm < 20) {
        messages.push({
          type: 'warning',
          message: `GPU is a tight fit! It is ${gpu.normalized_specs.length_mm}mm long and the case limit is ${pcCase.normalized_specs.max_gpu_length_mm}mm. Ensure you have room for front fans/radiators.`
        });
     } else {
        messages.push({
          type: 'success',
          message: `GPU fits safely inside the Case (${gpu.normalized_specs.length_mm}mm / ${pcCase.normalized_specs.max_gpu_length_mm}mm).`
        });
     }
  }

  // 6. PSU Wattage vs GPU Requirement
  if (psu?.normalized_specs?.wattage) {
      if (gpu?.normalized_specs?.recommended_psu) {
          if (psu.normalized_specs.wattage < gpu.normalized_specs.recommended_psu) {
              messages.push({
                  type: 'error',
                  message: `GPU recommends a ${gpu.normalized_specs.recommended_psu}W power supply, but yours is only ${psu.normalized_specs.wattage}W.`
              });
          } else {
              messages.push({
                  type: 'success',
                  message: `Power Supply (${psu.normalized_specs.wattage}W) meets GPU requirements (${gpu.normalized_specs.recommended_psu}W).`
              });
          }
      } else {
         // rough fallback system checks
         messages.push({
             type: 'info',
             message: `Selected Power Supply is ${psu.normalized_specs.wattage}W.`
         });
      }
  } else if (gpu?.normalized_specs?.recommended_psu && !psu) {
      messages.push({
          type: 'info',
          message: `Your selected GPU recommends at least a ${gpu.normalized_specs.recommended_psu}W power supply.`
      });
  }

  return messages;
}

export function getComponentCompatibility(category: string, product: any, currentBuild: PcBuildState): ValidationMessage | null {
  const testBuild: PcBuildState = { ...currentBuild } as PcBuildState;
  
  if (category === 'cpus') testBuild.cpu = product;
  else if (category === 'motherboards') testBuild.motherboard = product;
  else if (category === 'ram') testBuild.ram = product;
  else if (category === 'gpus') testBuild.gpu = product;
  else if (category === 'psus') testBuild.psu = product;
  else if (category === 'cases') testBuild.case = product;
  else if (category === 'coolers') testBuild.system_cooling = product;
  else return null;

  const baselineMessages = validateBuild(currentBuild);
  const newMessages = validateBuild(testBuild);
  const baselineErrors = baselineMessages.filter(m => m.type === 'error').map(m => m.message);
  const newError = newMessages.find(m => m.type === 'error' && !baselineErrors.includes(m.message));
  if (newError) return newError;

  return null;

  return null;
}

