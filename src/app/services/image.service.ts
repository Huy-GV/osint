import { inject, Injectable } from '@angular/core';
import { AnonymousImage, Image } from '../models/image';
import { MapService } from './map.service';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private readonly mapService = inject(MapService);

  // TODO: move these to Firebase
  private readonly anonymousImages: AnonymousImage[] = [
    { id: '1', url: '/images/image1.jpg', },
    { id: '2', url: '/images/image2.jpg', },
    { id: '3', url: '/images/image3.png', },
  ]

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

  private guesses: {
    id: string;
    imageId: string;
    longitude: number;
    latitude: number;
    confirmed: boolean;
  } [] = []

  getAllImages() {
    return this.anonymousImages;
  }

  getImageById(id: Image["id"]): AnonymousImage | undefined {
    return this.anonymousImages.find(image => image.id === id);
  }

  addGuess(imageId: string, longitude: number, latitude: number) {
    // add a guess here
    const newGuess = {
      id: crypto.randomUUID(),
      imageId,
      longitude,
      latitude,
      confirmed: false,
    }
    this.guesses.push(newGuess);

    return newGuess;
  }

  confirmGuess(guessId: string) {
    const guess = this.guesses.find(g => g.id === guessId);
    if (!guess) {
      throw new Error('Guess not found');
    }

    guess.confirmed = true;
    this.guesses = this.guesses.map(g => g.id === guessId ? guess : g);

    const image = this.images.find(i => i.id === guess.imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    const distance = this.mapService.calculateDistanceMeters(
      { latitude: guess.latitude, longitude: guess.longitude },
      { latitude: image.latitude, longitude: image.longitude }
    );

    return {
      distanceMeters: distance,
      latitude: image.latitude,
      longitude: image.longitude,
    };
  }
}
