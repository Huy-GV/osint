import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  getAllImages() {
    // return all images here
  }

  addGuess(imageId: string, longitude: number, latitude: number) {
    // add a guess here
  }

  confirmGuess(guessId: string) {
    // confirm a guess here
    // use map service to calculate distance
  }
}
