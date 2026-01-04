import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  calculateDistanceMeters(
    a: { longitude: number, latitude: number },
    b: { longitude: number, latitude: number }
  ) {
    return google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(a.latitude, a.longitude),
      new google.maps.LatLng(b.latitude, b.longitude)
    );
  }
}
