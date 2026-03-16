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
  cpu_cooler?: BuildComponent;
};

export function validateBuild(build: PcBuildState): ValidationMessage[] {
  const messages: ValidationMessage[] = [];

  const { cpu, motherboard, ram, gpu, psu, case: pcCase, cpu_cooler } = build;

  // 1. CPU & Motherboard Socket Validation
  if (cpu?.normalized_specs?.socket && motherboard?.normalized_specs?.socket) {
    if (cpu.normalized_specs.socket !== motherboard.normalized_specs.socket) {
      messages.push({
        type: 'error',
        message: `Incompatible Socket! CPU requires ${cpu.normalized_specs.socket} but Motherboard is ${motherboard.normalized_specs.socket}.`
      });
    } else {
      messages.push({
        type: 'success',
        message: `Motherboard and CPU socket (${cpu.normalized_specs.socket}) match.`
      });
    }
  }

  // 2. CPU Cooler compatibility
  if (cpu_cooler?.normalized_specs?.supported_sockets && motherboard?.normalized_specs?.socket) {
    if (!cpu_cooler.normalized_specs.supported_sockets.includes(motherboard.normalized_specs.socket)) {
      messages.push({
        type: 'error',
        message: `CPU Cooler does not support socket ${motherboard.normalized_specs.socket}. Supported: ${cpu_cooler.normalized_specs.supported_sockets.join(', ')}`
      });
    }
  }

  // Warning if no cooler is included with CPU and no cooler is selected
  if (cpu && !cpu_cooler) {
    if (cpu.normalized_specs?.includes_cooler === false) {
       messages.push({
         type: 'warning',
         message: 'This CPU does not include a stock cooler. You need to add a CPU Cooler.'
       });
    }
  }

  // 3. RAM & Motherboard
  if (ram?.normalized_specs?.memory_type && motherboard?.normalized_specs?.memory_type) {
    if (ram.normalized_specs.memory_type !== motherboard.normalized_specs.memory_type) {
      messages.push({
        type: 'error',
        message: `Incompatible Memory! RAM is ${ram.normalized_specs.memory_type} but Motherboard supports ${motherboard.normalized_specs.memory_type}.`
      });
    } else {
      messages.push({
        type: 'success',
        message: `Memory type (${ram.normalized_specs.memory_type}) matches Motherboard.`
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
