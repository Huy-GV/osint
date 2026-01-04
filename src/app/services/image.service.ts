import { Injectable } from '@angular/core';
import { AnonymousImage, Image } from '../models/image';

@Injectable({
  providedIn: 'root',
})
export class ImageService {

  private readonly anonymousImages: AnonymousImage[] = [
    { id: '1', url: '/images/image1.jpg',},
    { id: '2', url: '/images/image2.jpg', },
    { id: '3', url: '/images/image3.png', },
    // { id: '4', url: '/images/image3.png', },
    // { id: '5', url: '/images/image3.png', },
    // { id: '6', url: '/images/image2.jpg', },
    // { id: '7', url: '/images/image3.png', },
    // { id: '8', url: '/images/image2.jpg', },
  ]

  getAllImages() {
    return this.anonymousImages;
  }

  addGuess(imageId: string, longitude: number, latitude: number) {
    // add a guess here
  }

  confirmGuess(guessId: string) {
    // confirm a guess here
    // use map service to calculate distance
  }
}
