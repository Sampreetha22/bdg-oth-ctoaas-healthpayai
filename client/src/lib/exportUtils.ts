export function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = columns.map(col => col.label).join(",");
  
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      if (value === null || value === undefined) {
        return "";
      }
      
      if (typeof value === "object") {
        value = JSON.stringify(value);
      }
      
      value = String(value).replace(/"/g, '""');
      
      if (value.includes(",") || value.includes("\n") || value.includes('"')) {
        return `"${value}"`;
      }
      
      return value;
    }).join(",");
  });

  const csv = [headers, ...rows].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
