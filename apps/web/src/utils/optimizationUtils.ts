import { OptimizeDayResponse } from "@/types/optimization";

export interface Stop {
  id: string;
  title: string;
  lat: number;
  lng: number;
  note?: string;
  cost?: number;
}

/**
 * Apply optimization result to reorder stops array
 * This is a pure function that doesn't mutate the input
 */
export function applyOptimizationOrder(
  currentStops: Stop[],
  optimizationResult: OptimizeDayResponse
): Stop[] {
  const { order } = optimizationResult;
  const stopMap = new Map(currentStops.map(stop => [stop.id, stop]));
  
  // Create new order based on the optimization result
  const reorderedStops = order
    .map(id => stopMap.get(id))
    .filter((stop): stop is Stop => Boolean(stop));
  
  // Ensure we didn't lose any stops
  if (reorderedStops.length !== currentStops.length) {
    throw new Error('Optimization result doesn\'t match current stops');
  }
  
  return reorderedStops;
}

/**
 * Generate the sequence of moves needed to transform current order to target order
 * This is used to apply the reordering through the existing reorderStops function
 */
export function generateReorderMoves(
  currentStops: Stop[],
  targetOrder: string[]
): Array<{ from: number; to: number }> {
  const moves: Array<{ from: number; to: number }> = [];
  const workingStops = [...currentStops];
  
  for (let targetIndex = 0; targetIndex < targetOrder.length; targetIndex++) {
    const targetId = targetOrder[targetIndex];
    const currentIndex = workingStops.findIndex(s => s.id === targetId);
    
    if (currentIndex !== targetIndex && currentIndex !== -1) {
      moves.push({ from: currentIndex, to: targetIndex });
      
      // Update our working array to simulate the move
      const [moved] = workingStops.splice(currentIndex, 1);
      workingStops.splice(targetIndex, 0, moved);
    }
  }
  
  return moves;
}