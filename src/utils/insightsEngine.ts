export interface Insight {
  id: string;
  text: string;
  type: 'warning' | 'info' | 'success';
}

export const generateInsights = (data: {
  currentYear: number;
  expensesByYear: Record<number, Record<string, number>>;
  chandaByYear: Record<number, number>;
  budgetByYear: Record<number, Record<string, number>>;
  inventoryWaste: Record<number, number>;
}): Insight[] => {
  const insights: Insight[] = [];
  const years = Object.keys(data.expensesByYear).map(Number).sort((a, b) => b - a);
  
  if (years.length >= 2) {
    const curYear = years[0];
    const prevYear = years[1];
    
    // Growth insight
    const curDecoration = data.expensesByYear[curYear]?.['Decoration'] || 0;
    const prevDecoration = data.expensesByYear[prevYear]?.['Decoration'] || 0;
    if (prevDecoration > 0) {
      const growth = ((curDecoration - prevDecoration) / prevDecoration) * 100;
      if (Math.abs(growth) > 5) {
        insights.push({
          id: 'deco-growth',
          text: `Decoration cost ${growth > 0 ? 'grew' : 'decreased'} ${Math.abs(growth).toFixed(0)}% from ${prevYear} to ${curYear}`,
          type: growth > 20 ? 'warning' : 'info'
        });
      }
    }
    
    // Chanda comparison
    const curChanda = data.chandaByYear[curYear] || 0;
    const prevChanda = data.chandaByYear[prevYear] || 0;
    if (prevChanda > 0 && curChanda < prevChanda) {
      const drop = ((prevChanda - curChanda) / prevChanda) * 100;
      insights.push({
        id: 'chanda-drop',
        text: `Chanda collection is ${drop.toFixed(0)}% below last year`,
        type: 'warning'
      });
    }
  }
  
  // Budget exceed check
  const latestYear = years[0];
  if (latestYear) {
    const expenses = data.expensesByYear[latestYear] || {};
    const budgets = data.budgetByYear[latestYear] || {};
    Object.keys(budgets).forEach(cat => {
      const spent = expenses[cat] || 0;
      const budget = budgets[cat] || 0;
      if (spent > budget) {
        insights.push({
          id: `budget-exceed-${cat}`,
          text: `${cat} expenses exceed budget by ₹${(spent - budget).toLocaleString()}`,
          type: 'warning'
        });
      }
    });
  }

  return insights;
};
