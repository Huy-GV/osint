import { inject, Injectable } from '@angular/core';
import { AnonymousImage, Image } from '../models/image';
import { MapService } from './map.service';
import { ScoreService } from './score.service';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly images: Image[] = [
    {
      id: '1',
      url: '/images/image1.jpg',
      latitude: -33.8468002,
      longitude: 151.1600887,
      name: "Sydney"
    },
    {
      id: '2',
      url: '/images/image2.jpg',
      latitude: 43.0763447,
      longitude: 25.6332728,
      name: "Bulgaria"
    },
    {
      id: '3',
      url: '/images/image3.png',
      latitude: 46.5008485,
      longitude: 7.7061998,
      name: "Swiss Alps"
    },
  ];


  // TODO: move these to Firebase
  private readonly anonymousImages: AnonymousImage[] = this.images.map(({ id, url }) => ({ id, url }));

  getAllImages() {
    return this.anonymousImages;
  }

  getAnonymousImageById(id: Image["id"]): AnonymousImage | undefined {
    return this.anonymousImages.find(image => image.id === id);
  }

  getImageById(id: Image["id"]): Image | undefined {
    return this.images.find(image => image.id === id);
  }

  getNavigationIds(id: Image["id"]) {
    const currentIndex = this.images.findIndex(img => img.id === id);

    // If image not found, return null for both
    if (currentIndex === -1) {
      return { prevId: null, nextId: null };
    }

    const prevId = currentIndex > 0 ? this.images[currentIndex - 1].id : null;
    const nextId = currentIndex < this.images.length - 1 ? this.images[currentIndex + 1].id : null;

    return {
      prevId,
      nextId
    };
  }
}
