import { format } from 'date-fns';

interface ExcelRow {
  [key: string]: string | number | boolean;
}

interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
}

// Simple CSV to Excel conversion (can be enhanced with actual Excel library)
export const exportToExcel = (
  data: ExcelRow[],
  options: ExcelExportOptions = {}
): void => {
  const {
    filename = `export-${format(new Date(), 'yyyy-MM-dd')}`,
    sheetName = 'Sheet1',
    headers = []
  } = options;

  try {
    // Convert data to CSV format
    let csvContent = '';
    
    // Add headers if provided
    if (headers.length > 0) {
      csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
    }
    
    // Add data rows
    data.forEach(row => {
      const rowData = Object.values(row).map(value => {
        // Handle different data types
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`; // Escape quotes
        } else if (value === null || value === undefined) {
          return '""';
        } else {
          return `"${value}"`;
        }
      });
      csvContent += rowData.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Excel file exported: ${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

// Export Chanda entries to Excel
export const exportChandaToExcel = (chandaEntries: any[], committeeName: string) => {
  const headers = [
    'Receipt Number',
    'Donor Name',
    'Donor Phone',
    'Donor Address',
    'Amount',
    'Date',
    'Collected By',
    'Status',
    'Approved By',
    'Approved At',
    'Notes'
  ];

  const data = chandaEntries.map(entry => ({
    'Receipt Number': entry.receiptNumber || '',
    'Donor Name': entry.donorName || '',
    'Donor Phone': entry.donorPhone || '',
    'Donor Address': entry.donorAddress || '',
    'Amount': entry.amount || 0,
    'Date': entry.date ? format(new Date(entry.date), 'dd MMM yyyy, hh:mm a') : '',
    'Collected By': entry.collectedBy || '',
    'Status': entry.status || '',
    'Approved By': entry.approvedBy || '',
    'Approved At': entry.approvedAt ? format(new Date(entry.approvedAt), 'dd MMM yyyy, hh:mm a') : '',
    'Notes': entry.notes || ''
  }));

  exportToExcel(data, {
    filename: `${committeeName}-chanda-entries-${format(new Date(), 'yyyy-MM-dd')}`,
    sheetName: 'Chanda Entries',
    headers
  });
};

// Export Donations to Excel
export const exportDonationsToExcel = (donations: any[], committeeName: string) => {
  const headers = [
    'Receipt Number',
    'Donor Name',
    'Donor Phone',
    'Amount',
    'Donation Type',
    'Kind Description',
    'Estimated Value',
    'Date',
    'Entered By',
    'Receipt Sent'
  ];

  const data = donations.map(donation => ({
    'Receipt Number': donation.receiptNumber || '',
    'Donor Name': donation.donorName || '',
    'Donor Phone': donation.donorPhone || '',
    'Amount': donation.amount || 0,
    'Donation Type': donation.donationType || '',
    'Kind Description': donation.kindDescription || '',
    'Estimated Value': donation.estimatedValue || 0,
    'Date': donation.date ? format(new Date(donation.date), 'dd MMM yyyy, hh:mm a') : '',
    'Entered By': donation.enteredBy || '',
    'Receipt Sent': donation.receiptSent ? 'Yes' : 'No'
  }));

  exportToExcel(data, {
    filename: `${committeeName}-donations-${format(new Date(), 'yyyy-MM-dd')}`,
    sheetName: 'Donations',
    headers
  });
};

// Export Expenses to Excel
export const exportExpensesToExcel = (expenses: any[], committeeName: string) => {
  const headers = [
    'Date',
    'Category',
    'Amount',
    'Reason/Particulars',
    'Vendor Name',
    'Entered By',
    'Entered By Role',
    'Dependent Member',
    'Bill Photo URL',
    'Year'
  ];

  const data = expenses.map(expense => ({
    'Date': expense.date ? format(new Date(expense.date), 'dd MMM yyyy, hh:mm a') : '',
    'Category': expense.category || '',
    'Amount': expense.amount || 0,
    'Reason/Particulars': expense.reason || '',
    'Vendor Name': expense.vendorName || '',
    'Entered By': expense.enteredBy || '',
    'Entered By Role': expense.enteredByRole || '',
    'Dependent Member': expense.dependentMemberName || '',
    'Bill Photo URL': expense.billPhotoURL || '',
    'Year': expense.year || ''
  }));

  exportToExcel(data, {
    filename: `${committeeName}-expenses-${format(new Date(), 'yyyy-MM-dd')}`,
    sheetName: 'Expenses',
    headers
  });
};

// Export Members to Excel
export const exportMembersToExcel = (members: any[], committeeName: string) => {
  const headers = [
    'Member ID',
    'Name',
    'Phone',
    'Role',
    'Address',
    'Added At',
    'Added By',
    'Is Active',
    'Login Code'
  ];

  const data = members.map(member => ({
    'Member ID': member.memberId || '',
    'Name': member.name || '',
    'Phone': member.phone || '',
    'Role': member.role || '',
    'Address': member.address || '',
    'Added At': member.addedAt ? format(new Date(member.addedAt), 'dd MMM yyyy, hh:mm a') : '',
    'Added By': member.addedBy || '',
    'Is Active': member.isActive ? 'Yes' : 'No',
    'Login Code': member.loginCode || ''
  }));

  exportToExcel(data, {
    filename: `${committeeName}-members-${format(new Date(), 'yyyy-MM-dd')}`,
    sheetName: 'Members',
    headers
  });
};

// Export Inventory to Excel
export const exportInventoryToExcel = (inventory: any[], committeeName: string) => {
  const headers = [
    'Module',
    'Item Name',
    'Unit',
    'Vendor Name',
    'Quantity Purchased',
    'Quantity Used',
    'Remaining',
    'Price Per Unit',
    'Total Value',
    'Year',
    'Entered By'
  ];

  const data = inventory.map(item => {
    const remaining = (item.quantityPurchased || 0) - (item.quantityUsed || 0);
    const totalValue = (item.quantityPurchased || 0) * (item.pricePerUnit || 0);
    
    return {
      'Module': item.module || '',
      'Item Name': item.itemName || '',
      'Unit': item.unit || '',
      'Vendor Name': item.vendorName || '',
      'Quantity Purchased': item.quantityPurchased || 0,
      'Quantity Used': item.quantityUsed || 0,
      'Remaining': remaining,
      'Price Per Unit': item.pricePerUnit || 0,
      'Total Value': totalValue,
      'Year': item.year || '',
      'Entered By': item.enteredBy || ''
    };
  });

  exportToExcel(data, {
    filename: `${committeeName}-inventory-${format(new Date(), 'yyyy-MM-dd')}`,
    sheetName: 'Inventory',
    headers
  });
};

// Export Analytics data to Excel
export const exportAnalyticsToExcel = (
  analyticsData: {
    totalDonations: number;
    totalChanda: number;
    totalExpenses: number;
    memberCount: number;
    expensesByCategory: Record<string, number>;
    monthlyData: any[];
  },
  committeeName: string
) => {
  // Summary sheet
  const summaryHeaders = ['Metric', 'Value', 'Description'];
  const summaryData = [
    {
      'Metric': 'Total Donations',
      'Value': analyticsData.totalDonations,
      'Description': 'Sum of all donations received'
    },
    {
      'Metric': 'Total Chanda',
      'Value': analyticsData.totalChanda,
      'Description': 'Sum of all chanda collections'
    },
    {
      'Metric': 'Total Expenses',
      'Value': analyticsData.totalExpenses,
      'Description': 'Sum of all expenses'
    },
    {
      'Metric': 'Net Surplus',
      'Value': analyticsData.totalDonations + analyticsData.totalChanda - analyticsData.totalExpenses,
      'Description': 'Total income minus total expenses'
    },
    {
      'Metric': 'Member Count',
      'Value': analyticsData.memberCount,
      'Description': 'Total number of members'
    }
  ];

  // Category breakdown sheet
  const categoryHeaders = ['Category', 'Amount', 'Percentage'];
  const totalIncome = analyticsData.totalDonations + analyticsData.totalChanda;
  const categoryData = Object.entries(analyticsData.expensesByCategory).map(([category, amount]) => ({
    'Category': category,
    'Amount': amount,
    'Percentage': totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(2) + '%' : '0%'
  }));

  // Monthly data sheet
  const monthlyHeaders = ['Month', 'Donations', 'Chanda', 'Expenses', 'Net'];
  const monthlyData = analyticsData.monthlyData.map(month => ({
    'Month': month.month || '',
    'Donations': month.donations || 0,
    'Chanda': month.chanda || 0,
    'Expenses': month.expenses || 0,
    'Net': (month.donations || 0) + (month.chanda || 0) - (month.expenses || 0)
  }));

  // Create multi-sheet workbook (simplified as separate files)
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  
  // Export summary
  exportToExcel(summaryData, {
    filename: `${committeeName}-analytics-summary-${timestamp}`,
    sheetName: 'Summary',
    headers: summaryHeaders
  });

  // Export category breakdown
  exportToExcel(categoryData, {
    filename: `${committeeName}-analytics-categories-${timestamp}`,
    sheetName: 'Categories',
    headers: categoryHeaders
  });

  // Export monthly data
  exportToExcel(monthlyData, {
    filename: `${committeeName}-analytics-monthly-${timestamp}`,
    sheetName: 'Monthly',
    headers: monthlyHeaders
  });
};
