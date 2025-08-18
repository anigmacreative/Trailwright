// Simple per-tab rate limiter + LRU-ish cache for Directions requests.
export class RateGate {
  private last = 0;
  constructor(private minMs = 1200) {} // Google recommends ~1 QPS per user
  async wait() {
    const now = Date.now();
    const delta = now - this.last;
    const sleepMs = this.minMs - delta;
    if (sleepMs > 0) await new Promise(r => setTimeout(r, sleepMs));
    this.last = Date.now();
  }
}

export type RouteKey = string;
export type RouteVal = google.maps.DirectionsResult;

export class RouteCache {
  private max: number;
  private map = new Map<RouteKey, RouteVal>();
  constructor(maxEntries = 20) { this.max = maxEntries; }
  key(waypoints: {lat:number;lng:number}[], mode: string) {
    return `${mode}|` + waypoints.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(';');
  }
  get(k: RouteKey) { return this.map.get(k); }
  set(k: RouteKey, v: RouteVal) {
    this.map.set(k, v);
    if (this.map.size > this.max) {
      // drop oldest
      const firstKey = this.map.keys().next().value;
      if (firstKey) {
        this.map.delete(firstKey);
      }
    }
  }
}