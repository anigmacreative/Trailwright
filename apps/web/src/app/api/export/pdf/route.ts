import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  if (!state) return new Response("Missing state", { status: 400 });
  
  try {
    const trip = JSON.parse(state);
    
    // Generate simple text-based "PDF" response for now
    // This can be enhanced later with proper PDF generation
    let content = `${trip.title || "Trip"}\n\n`;
    
    trip.days.forEach((d: any, di: number) => {
      content += `${d.title || `Day ${di + 1}`}\n`;
      content += `Distance: ${d.distanceText || "—"}   Duration: ${d.durationText || "—"}\n`;
      
      d.stops.forEach((s: any, i: number) => {
        content += `${i + 1}. ${s.title || "Untitled"} — ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`;
        if (s.cost) content += ` $${s.cost}`;
        content += `\n`;
      });
      content += `\n`;
    });
    
    const totalCost = trip.days.reduce((sum: number, d: any) => 
      sum + d.stops.reduce((s: number, p: any) => s + (p.cost || 0), 0), 0
    );
    content += `Trip total cost: $${totalCost.toFixed(0)}`;
    
    return new Response(content, { 
      headers: { 
        "Content-Type": "text/plain",
        "Content-Disposition": "attachment; filename=trip.txt"
      } 
    });
  } catch (error: unknown) {
    return new Response("Invalid trip data", { status: 400 });
  }
}