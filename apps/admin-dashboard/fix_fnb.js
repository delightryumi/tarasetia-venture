const fs = require('fs');
const path = require('path');

const pnlEngineDir = path.join(__dirname, 'lib', 'pnl-engine');
const filesToUpdate = [
  path.join(pnlEngineDir, 'process.ts'),
  path.join(pnlEngineDir, 'drilldown', 'fnb.ts'),
  path.join(pnlEngineDir, 'drilldown', 'other.ts'),
  path.join(pnlEngineDir, 'drilldown', 'expenses.ts')
];

const newFilterLogic = `
        const cleanString = (str: string) => str.replace(/food\\s*&\\s*beverage/g, '').replace(/f\\s*&\\s*b/g, '');
        const cleanCat = cleanString(catLower);
        const cleanName = cleanString(nameLower);
        const cleanDesc = cleanString(e.description ? e.description.toLowerCase() : "");
        
        const isBanquet = (e.eventCategory || "").toLowerCase().includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
        const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
        const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
        
        return isBanquet || isBeverage || isFood;
`;

const processUpdateLogic = `
      const isHousekeeping = deptLower === 'housekeeping';
      const cleanString = (str: string) => str.replace(/food\\s*&\\s*beverage/g, '').replace(/f\\s*&\\s*b/g, '');
      const cleanCat = cleanString(catLower);
      const cleanName = cleanString(nameLower);
      const cleanDesc = cleanString(e.description ? e.description.toLowerCase() : "");
      
      const isBanquet = (e.eventCategory || "").toLowerCase().includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
      const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
      const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
      
      const isFB = isBanquet || isBeverage || isFood;
      const isFOorPurchasing = deptLower === 'front office' || deptLower === 'purchasing';
`;

for (const file of filesToUpdate) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the fbExpenses filter logic
  content = content.replace(/return \(\s*deptLower\.includes\('food & beverage'\)[\s\S]*?fbCatLower\.includes\('makanan'\)\s*\);/g, newFilterLogic.trim());
  
  // Also replace in otherManualExpenses logic inside process.ts
  if (file.includes('process.ts')) {
      content = content.replace(/const isHousekeeping = deptLower === 'housekeeping';[\s\S]*?const isFOorPurchasing = deptLower === 'front office' \|\| deptLower === 'purchasing';/g, processUpdateLogic.trim());
      
      // Update isBeverage, isBanquet, isFood assignment
      const innerLoop = `
    const cleanString = (str: string) => str.replace(/food\\s*&\\s*beverage/g, '').replace(/f\\s*&\\s*b/g, '');
    const cleanCat = cleanString(catLower);
    const cleanName = cleanString(nameLower);
    const cleanDesc = cleanString(descLower);

    const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
    const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
    const isAlacarte = !isBanquet;
    const isFood = !isBeverage && isAlacarte; // Fallback if it reached here it must be food
      `;
      content = content.replace(/\/\/ Check if Banquet vs A la Carte[\s\S]*?const isAlacarte = !isBanquet;/g, innerLoop.trim());
  }

  // Update inner filter for fnb.ts and other.ts
  if (file.includes('fnb.ts') || file.includes('other.ts')) {
      const innerFilter = `
            const cleanString = (str: string) => str.replace(/food\\s*&\\s*beverage/g, '').replace(/f\\s*&\\s*b/g, '');
            const cleanCat = cleanString(catLower);
            const cleanName = cleanString(nameLower);
            const cleanDesc = cleanString(descLower);

            const isBanquet = evCatLower.includes('banquet') || cleanName.includes('banquet') || cleanDesc.includes('banquet') || cleanCat.includes('banquet') || fbCatLower.includes('banquet');
            const isBeverage = fbCatLower.includes('beverage') || fbCatLower.includes('drink') || fbCatLower.includes('minuman') || cleanCat.includes('beverage') || cleanCat.includes('drink') || cleanCat.includes('minuman') || cleanName.includes('beverage') || cleanName.includes('drink') || cleanName.includes('minuman') || cleanDesc.includes('beverage') || cleanDesc.includes('drink') || cleanDesc.includes('minuman');
            const isFood = fbCatLower.includes('food') || fbCatLower.includes('makanan') || cleanCat.includes('food') || cleanCat.includes('makanan') || cleanName.includes('food') || cleanName.includes('makanan') || cleanDesc.includes('food') || cleanDesc.includes('makanan');
      `;
      content = content.replace(/const isBanquet =[\s\S]*?fbCatLower\.includes\('banquet'\);/g, innerFilter.trim());
      // Clean up any remaining isBeverage let assignments in fnb.ts
      content = content.replace(/let isBeverage =[\s\S]*?cleanDesc\.includes\('minuman'\);\s*}/g, '');
  }
  
  if (file.includes('expenses.ts')) {
      content = content.replace(/const isFb = deptLower\.includes\('food & beverage'\)[\s\S]*?fbCatLower !== "";/g, processUpdateLogic.trim().replace('const isHousekeeping = deptLower === \'housekeeping\';', 'const isHk = deptLower === \'housekeeping\';').replace('const isFB = isBanquet || isBeverage || isFood;', 'const isFb = isBanquet || isBeverage || isFood;'));
  }

  fs.writeFileSync(file, content);
}
console.log("Done");
