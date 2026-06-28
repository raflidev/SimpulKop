export const BIAYA_PER_KM = 10000; // Rp/km estimasi truk

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 +
    Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

// Greedy nearest-neighbor TSP. Returns ordered array starting and ending at `start`.
export function greedyRoute(start, waypoints) {
  if (!waypoints.length) return [start, start];
  const remaining = [...waypoints];
  const route = [start];
  let current = start;
  while (remaining.length) {
    let ni = 0, nd = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < nd) { nd = d; ni = i; }
    }
    current = remaining.splice(ni, 1)[0];
    route.push(current);
  }
  route.push(start);
  return route;
}

export function routeDistanceKm(route) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += haversineKm(route[i], route[i+1]);
  return d;
}

// Each kopdes makes separate round trips to each vendor
export function separateDistanceKm(kopdesList, vendors) {
  let d = 0;
  for (const k of kopdesList) for (const v of vendors) d += haversineKm(k, v) * 2;
  return d;
}

export function calcSavings(vendors, kopdesList) {
  const hub = kopdesList[0];
  const waypoints = [
    ...vendors.map(v => ({ ...v, type: 'vendor' })),
    ...kopdesList.slice(1).map(k => ({ ...k, type: 'kopdes' }))
  ];
  const route = greedyRoute({ ...hub, type: 'kopdes' }, waypoints);
  const combinedKm = routeDistanceKm(route);
  const separateKm = separateDistanceKm(kopdesList, vendors);
  const savingsPct = ((separateKm - combinedKm) / separateKm * 100);
  return {
    route,
    combinedKm: +combinedKm.toFixed(1),
    separateKm: +separateKm.toFixed(1),
    savingsPct: +savingsPct.toFixed(1),
    biayaBersama: Math.round(combinedKm * BIAYA_PER_KM),
    biayaTerpisah: Math.round(separateKm * BIAYA_PER_KM),
    hematRupiah: Math.round((separateKm - combinedKm) * BIAYA_PER_KM)
  };
}

export function formatRp(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}
