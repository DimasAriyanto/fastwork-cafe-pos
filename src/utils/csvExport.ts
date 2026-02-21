/**
 * Utility to export data to CSV and trigger download
 * @param data Array of objects to export
 * @param headers Object mapping keys to header labels (e.g., { id: 'ID', name: 'Nama' })
 * @param filename Desired filename without extension
 */
export const exportToCSV = (data: any[], headers: Record<string, string>, filename: string) => {
  if (!data || !data.length) {
    alert("Tidak ada data untuk diekspor");
    return;
  }

  // 1. Create Headers Row
  const headerKeys = Object.keys(headers);
  const headerRow = headerKeys.map(key => `"${headers[key]}"`).join(',');

  // 2. Create Data Rows
  const dataRows = data.map(item => {
    return headerKeys.map(key => {
      let value = item[key];
      
      // Handle null/undefined
      if (value === null || value === undefined) value = '';
      
      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        // Double quotes to escape existing quotes
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });

  // 3. Combine into CSV String
  const csvString = [headerRow, ...dataRows].join('\n');

  // 4. Create Blob and Trigger Download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
