import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private static readonly MERCATOR_LATITUDE_LIMIT = 85.05113;

  calculateDistanceMeters(
    a: { longitude: number, latitude: number },
    b: { longitude: number, latitude: number }
  ) {
    return google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(a.latitude, a.longitude),
      new google.maps.LatLng(b.latitude, b.longitude)
    );
  }

  renderedLatitude(value: number) {
    return value > 0 ? Math.min(value, MapService.MERCATOR_LATITUDE_LIMIT) : Math.max(value, MapService.MERCATOR_LATITUDE_LIMIT);
  }
}
