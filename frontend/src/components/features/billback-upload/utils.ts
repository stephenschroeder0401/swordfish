import { BillbackRow, FileFormat } from './types';

export const detectFileFormat = async (file: File): Promise<FileFormat> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        reject(new Error('Could not read file content'));
        return;
      }

      const headers = content.split('\n')[0].toLowerCase();

      if (headers.includes('timero')) {
        resolve('timero');
      } else if (headers.includes('progress')) {
        resolve('progress');
      } else {
        resolve('manual');
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
};

export const calculateTotals = (
  hours: number,
  laborRate: number,
  billingRate: number,
  mileage?: number
) => {
  const laborTotal = hours * laborRate;
  const billingTotal = hours * billingRate;
  const mileageTotal = (mileage || 0) * 0.655; // Standard mileage rate
  const jobTotal = billingTotal + mileageTotal;

  return {
    laborTotal,
    billingTotal,
    mileageTotal,
    jobTotal,
  };
};

export const calculateSummaryTotals = (billbackData: BillbackRow[]) => {
  return {
    entryCount: billbackData.length,
    totalHours: billbackData.reduce((sum, item) => {
      const hours = typeof item.hours === 'string' ? parseFloat(item.hours) : (item.hours || 0);
      return sum + hours;
    }, 0),
    totalBilled: billbackData.reduce((sum, item) => {
      const total = typeof item.jobTotal === 'string' ? parseFloat(item.jobTotal) : (item.jobTotal || 0);
      return sum + total;
    }, 0)
  };
};

export const filterBillbackData = (
  data: BillbackRow[],
  employeeFilter: string,
  propertyFilter: string,
  entityFilter: string,
  categoryFilter: string
): BillbackRow[] => {
  return data.filter((row) => {
    const matchesEmployee = !employeeFilter || row.employeeId === employeeFilter;
    const matchesProperty = !propertyFilter || row.propertyId === propertyFilter;
    const matchesEntity = !entityFilter || row.entityId === entityFilter;
    const matchesCategory = !categoryFilter || row.categoryId === categoryFilter;

    return matchesEmployee && matchesProperty && matchesEntity && matchesCategory;
  });
}; 
