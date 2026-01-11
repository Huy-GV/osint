import { Injectable, resource, Signal } from '@angular/core';
import { AnonymousImage, Image } from '../models/image';

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
      name: "Sydney",
      prevId: null,
      nextId: '2',
    },
    {
      id: '2',
      url: '/images/image2.jpg',
      latitude: 43.0763447,
      longitude: 25.6332728,
      name: "Bulgaria",
      prevId: '1',
      nextId: '3',
    },
    {
      id: '3',
      url: '/images/image3.png',
      latitude: 46.5008485,
      longitude: 7.7061998,
      name: "Swiss Alps",
      prevId: '2',
      nextId: null,
    },
  ];

  private readonly anonymousImages: AnonymousImage[] = this.images.map(({ id, url, nextId, prevId }) => ({ id, url, nextId, prevId }));

  getAllImages() {
    return Promise.resolve(this.anonymousImages);
  }

  getImageCount() {
    return Promise.resolve(this.images.length);
  }

  getAnonymousImageById(id: Image["id"]) {
    return Promise.resolve(this.anonymousImages.find(image => image.id === id));
  }

  getImageById(id: Image["id"]): Image | undefined {
    return this.images.find(image => image.id === id);
  }

  getNavigationIds(id: Image["id"]) {
    const currentIndex = this.images.findIndex(img => img.id === id);
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

  getImageResource(id: Signal<string | undefined>) {
    return resource({
      params: () => ({ id: id() }),
      loader: ({ params: { id } }) => {
        return id ? this.getAnonymousImageById(id) : Promise.resolve(undefined);
      }
    });
  }

  getAllImagesResource() {
    return resource({
      loader: () => {
        return this.getAllImages();
      }
    })
  }
}
