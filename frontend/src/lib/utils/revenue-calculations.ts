import { getPropertyRevenue } from '@/lib/data-access';

interface RevenueAllocation {
  propertyId: string;
  revenue: number;
  percentage: number;
}

export const getRevenueAllocation = async (propertyIds: string[]): Promise<RevenueAllocation[]> => {
  try {
    // Get revenue for each property
    const revenuePromises = propertyIds.map(id => getPropertyRevenue(id));
    const revenues = await Promise.all(revenuePromises);
    
    // Calculate total revenue
    const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0);
    
    // Calculate percentage for each property and round to nearest 0.05 (5%)
    const allocations = propertyIds.map((id, index) => ({
      propertyId: id,
      revenue: revenues[index],
      percentage: totalRevenue > 0 
        ? Number((Math.round((revenues[index] / totalRevenue * 100) * 20) / 20).toFixed(2))
        : 0
    }));

    return allocations;
  } catch (error) {
    console.error('Error calculating revenue allocations:', error);
    throw error;
  }
};
