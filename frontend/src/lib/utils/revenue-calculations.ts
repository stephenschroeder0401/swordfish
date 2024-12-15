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
    
    // Calculate percentage for each property
    const allocations = propertyIds.map((id, index) => ({
      propertyId: id,
      revenue: revenues[index],
      percentage: totalRevenue > 0 ? (revenues[index] / totalRevenue) * 100 : 0
    }));

    return allocations;
  } catch (error) {
    console.error('Error calculating revenue allocations:', error);
    throw error;
  }
};
