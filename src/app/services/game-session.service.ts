import { inject, Injectable, resource, Signal } from '@angular/core';
import { MapService } from './map.service';
import { ScoreService } from './score.service';
import { ImageService } from './image.service';
import { GameSession } from '../models/game-session';
import { Guess } from '../models/guess';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {
  private static STORAGE_KEY = "osint-session";
  private readonly imageService = inject(ImageService);
  private readonly mapService = inject(MapService);
  private readonly scoreService = inject(ScoreService);
  private readonly firestore = inject(Firestore);

  private sessionCollection = collection(this.firestore, "sessions");

  private getGuessCollection(sessionId: string) {
    return collection(this.firestore, `sessions/${sessionId}/guesses`);
  }

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

    const existingGuess = await this.findGuess({ imageId, sessionId: sessionId });
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
      createdAt: serverTimestamp(),
    };

    const guessCollection = this.getGuessCollection(sessionId);
    const guessDoc = await addDoc(guessCollection, guess)
    return {
      ...guess,
      id: guessDoc.id,
    };
  }

  async startNewSession() {
    const newSession = {
      startedAt: serverTimestamp(),
      endedAt: null,
    }

    const session = await addDoc(this.sessionCollection, newSession);
    localStorage.setItem(GameSessionService.STORAGE_KEY, session.id);
    return {
      ...newSession,
      id: session.id,
    };
  }

  async endSession(sessionId: string) {
    const docRef = doc(this.firestore, `sessions/${sessionId}`);
    await updateDoc(docRef, { endedAt: serverTimestamp() });
    localStorage.removeItem(GameSessionService.STORAGE_KEY);
    this.cachedSessionResource.reload();
  }

  async getCurrentSessionProgress(sessionId: string) {
    const imageCount = await this.imageService.getImageCount();
    const guessQuery = query(this.getGuessCollection(sessionId));
    const guessDocCount = await getCountFromServer(guessQuery);

    return {
      sessionId,
      imageCount,
      guessCount: guessDocCount.data().count,
    };
  }

  async findGuess({ imageId, sessionId }: { imageId: string; sessionId: string; }) {
    if (!sessionId) {
      return undefined;
    }

    const guessQuery = query(
      this.getGuessCollection(sessionId),
      where("imageId", "==", imageId),
    );

    const guessDocs = await getDocs(guessQuery);
    if (guessDocs.empty) {
      return undefined;
    }

    const guessDoc = guessDocs.docs[0];
    return {
      ...guessDoc.data(),
      id: guessDoc.id,
    } as unknown as Guess;
  }

  async sessionExists(sessionId: string) {
    const sessionDoc = await getDoc(doc(this.firestore, `sessions/${sessionId}`));
    return sessionDoc.exists();
  }

  async getSessionSummary(sessionId: string) {
    const sessionDoc = await getDoc(doc(this.firestore, `sessions/${sessionId}`));
    if (!sessionDoc.exists()) {
      return undefined;
    }

    const guessQuery = query(this.getGuessCollection(sessionDoc.id));
    const guessDocs = await getDocs(guessQuery);
    const guesses = guessDocs.docs.map(d => ({ ...d.data(), id: d.id, } as Guess));
    const session = sessionDoc.data() as GameSession;

    return {
      sessionId,
      guesses,
      meta: {
        gameStartedAt: session.startedAt.toDate(),
        gameEndAt: session.endedAt?.toDate(),
        totalScore: guesses
          .map(g => g.score)
          .reduce((sum, score) => sum + score, 0),
        averageDistance: guesses
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
}
