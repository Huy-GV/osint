import { inject, Injectable, resource, Signal } from '@angular/core';
import { MapService } from './map.service';
import { ScoreService } from './score.service';
import { ImageService } from './image.service';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {
  private static STORAGE_KEY = "osint-session";
  private readonly imageService = inject(ImageService);
  private readonly mapService = inject(MapService);
  private readonly scoreService = inject(ScoreService);
  private readonly storeService = inject(StoreService);

  readonly cachedSessionResource = resource({
    loader: async () => {
      const cachedId = localStorage.getItem(GameSessionService.STORAGE_KEY);
      if (!cachedId) {
        return undefined;
      }

      try {
        const session = await this.getSessionSummary(cachedId);
        return session;
      } catch {
        localStorage.removeItem(GameSessionService.STORAGE_KEY);
        return undefined;
      }
    }
  });

  async confirmGuess({
    imageId,
    sessionId,
    longitude,
    latitude
  }: {
    imageId: string,
    sessionId: string,
    longitude: number,
    latitude: number
  }) {
    const image = this.imageService.getImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    const session = await this.findSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.endedAt) {
      throw new Error('Session has already ended');
    }

    const existingGuess = await this.storeService.findGuess({ imageId, sessionId });
    if (existingGuess) {
      throw new Error("Image already contains guess");
    }

    const distance = this.mapService.calculateDistanceMeters(
      { latitude, longitude },
      { latitude: image.latitude, longitude: image.longitude }
    );

    const score = this.scoreService.calculateScore(distance);
    const guess = {
      imageId,
      sessionId,
      longitude,
      latitude,
      imageLongitude: image.longitude,
      imageLatitude: image.latitude,
      score,
      distanceMeters: distance,
    };

    return await this.storeService.confirmGuess(guess);
  }

  async startNewSession() {
    const session = await this.storeService.startNewSession();
    localStorage.setItem(GameSessionService.STORAGE_KEY, session.id);
    return session;
  }

  async endSession(sessionId: string) {
    await this.storeService.endSession(sessionId);
    localStorage.removeItem(GameSessionService.STORAGE_KEY);
    this.cachedSessionResource.reload();
  }

  async getCurrentSessionProgress(sessionId: string) {
    const imageCount = await this.imageService.getImageCount();
    const { guessCount } = await this.storeService.getSessionProgress(sessionId);

    return {
      sessionId,
      imageCount,
      guessCount,
    };
  }

  async findGuess({ imageId, sessionId }: { imageId: string; sessionId: string; }) {
    return await this.storeService.findGuess({ imageId, sessionId });
  }

  async findSession(sessionId: string) {
    return await this.storeService.findSession(sessionId);
  }

  async getSessionSummary(sessionId: string) {
    const summary = await this.storeService.getSessionSummary(sessionId);
    if (!summary) {
      throw new Error("Session summary not found");
    }

    const { session, guesses } = summary;
    return {
      sessionId,
      guesses,
      meta: {
        gameStartedAt: session.startedAt.toDate(),
        gameEndedAt: session.endedAt?.toDate(),
        totalScore: guesses
          .map(g => g.score)
          .reduce((sum, score) => sum + score, 0),
        averageDistance: guesses.length === 0
          ? 0
          : guesses
            .map(g => g.distanceMeters)
            .reduce((sum, distanceMeters) => sum + distanceMeters, 0) / guesses.length,
      }
    }
  }

  getGuessResource(imageId: Signal<string | undefined>, sessionId: Signal<string | undefined>) {
    return resource({
      params: () => ({ imageId: imageId(), sessionId: sessionId() }),
      loader: ({ params: { imageId, sessionId } }) => {
        return imageId && sessionId ? this.findGuess({ imageId, sessionId }) : Promise.resolve(undefined);
      }
    });
  }

  getSessionProgressResource(imageId: Signal<string | undefined>, sessionId: Signal<string | undefined>) {
    return resource({
      params: () => ({ imageId: imageId(), sessionId: sessionId() }),
      loader: ({ params: { imageId, sessionId }}) => {
        return imageId && sessionId ? this.getCurrentSessionProgress(sessionId) : Promise.resolve(undefined);
      }
    });
  }

  getSessionSummaryResource(sessionId: Signal<string | undefined>) {
    return resource({
      params: () => ({ sessionId: sessionId() }),
      loader: ({ params: { sessionId }}) => {
        return sessionId ? this.getSessionSummary(sessionId) : Promise.resolve(undefined);
      }
    });
  }
}
