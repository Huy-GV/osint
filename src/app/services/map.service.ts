import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  async calculateDistanceMeters(longitude: number, latitude: number): Promise<number> {
    return 0;
  }
}
