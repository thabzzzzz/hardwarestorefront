import { validateBuild } from "./lib/compatibilityEngine";

async function testCompat() {
  const reqUrl = "http://localhost:8080/api/";
  console.log("Fetching DB data via API locally...");
  try {
    const cpusRes = await fetch(reqUrl + "cpus?per_page=100");
    const cpusData = await cpusRes.json();
    const cpus = cpusData.data.slice(0, 20); // Top 20 CPUs

    const mbRes = await fetch(reqUrl + "motherboards?per_page=100");
    const mbData = await mbRes.json();
    const motherboards = mbData.data.slice(0, 20); // Top 20 Motherboards

    let errorCount = 0;
    let successCount = 0;

    for (const cpu of cpus) {
      for (const mb of motherboards) {
        const result = validateBuild({ cpu, motherboard: mb });
        const errors = result.filter((r) => r.type === "error");
        
        let msg = "";
        if (errors.length > 0) {
            errorCount++;
            console.log(`[x INCOMPATIBLE ]: CPU: ${cpu.title.substring(0, 30).padEnd(30)} | MOBO: ${mb.title.substring(0, 25).padEnd(25)}`);
            console.log(`   --> ${errors[0].message}`);
        } else {
            successCount++;
        }
      }
    }
    console.log(`\n==== RUN RESULTS: ${errorCount} flagged as incompatible, ${successCount} paired successfully. ====`);
  } catch (err) {
    console.error("API Error", err);
  }
}
testCompat();
