const fs = require('fs');
let code = fs.readFileSync('components/pcbuilder/BudgetTracker.tsx', 'utf8');

code = code.replace(
  /export const BudgetTracker = \({ selectedComponents, targetBudget, activeProfile[\s\n\r]*}: any\) => \{/,
  `export const BudgetTracker = ({ selectedComponents, targetBudget, activeProfile, setActiveCategory }: any) => {
    const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null);`
);

code = code.replace(
    /<div style={{ height: "48px", background: "#f0f0f0", borderRadius: "12px", overflow: "hidden", display: "flex", boxShadow: "inset 0 2px 4px rgba\(0,0,0,0\.05\)", marginBottom: "16px" }}>/g,
    `<div style={{ height: "48px", background: "#f0f0f0", borderRadius: "12px", display: "flex", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)", marginBottom: "16px" }}>`
);

fs.writeFileSync('components/pcbuilder/BudgetTracker.tsx', code);
console.log('Fixed BudgetTracker');