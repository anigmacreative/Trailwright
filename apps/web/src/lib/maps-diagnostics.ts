export type MapsDiagResult = {
  placesStatus?: string;
  directionsStatus?: string;
  message: string;
};

export async function runMapsDiagnostics(g: typeof google): Promise<MapsDiagResult> {
  try {
    const placesStatus = await new Promise<string>((resolve) => {
      const svc = new g.maps.places.AutocompleteService();
      svc.getPlacePredictions({ input: "Reykjavik" }, (_preds, status) => resolve(status as unknown as string));
    });
    const directionsStatus = await new Promise<string>((resolve) => {
      const ds = new g.maps.DirectionsService();
      ds.route(
        {
          origin: { lat: 64.1265, lng: -21.8174 },
          destination: { lat: 64.1355, lng: -21.8954 },
          travelMode: g.maps.TravelMode.DRIVING,
        },
        (res, status) => resolve(status as unknown as string)
      );
    });
    const msg = `[Trailwright] Diagnostics — Places: ${placesStatus}, Directions: ${directionsStatus}`;
    console.info(msg);
    return { placesStatus, directionsStatus, message: msg };
  } catch (e: any) {
    const msg = `[Trailwright] Diagnostics failed: ${e?.message || e}`;
    console.error(msg);
    return { message: msg };
  }
}