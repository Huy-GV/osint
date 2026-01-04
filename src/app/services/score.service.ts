import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScoreService {
  calculateScore(distanceMeters: number) {
    if (distanceMeters > 50) {
      return 0;
    }

    if (distanceMeters >= 40) {
      return 1;
    }

    if (distanceMeters >= 30) {
      return 3;
    }

    if (distanceMeters >= 20) {
      return 6;
    }

    if (distanceMeters >= 10) {
      return 9;
    }

    if (distanceMeters >= 1) {
      return 12;
    }

    return 15;
  }
}
