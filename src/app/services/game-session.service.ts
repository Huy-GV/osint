import { inject, Injectable, resource, Signal } from '@angular/core';
import { MapService } from './map.service';
import { ScoreService } from './score.service';
import { ImageService } from './image.service';
import { GameSession } from '../models/game-session';
import { Guess } from '../models/guess';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';

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

  readonly currentSessionResource = resource({
    loader: () => this.getCurrentSession(),
  });

  readonly cachedSessionResource = resource({
    loader: async () => {
      const cachedId = localStorage.getItem(GameSessionService.STORAGE_KEY);
      if (!cachedId) {
        return undefined;
      }

      try {
        const session = await this.getSessionSummary(cachedId);
        return session || null;
      } catch {
        localStorage.removeItem(GameSessionService.STORAGE_KEY);
        return null;
      }
    }
  });

  async confirmGuess({
    imageId,
    longitude,
    latitude
  }: {
    imageId: string,
    longitude: number,
    latitude: number
  }) {
    const image = this.imageService.getImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    const session = await this.getCurrentSession();
    if (!session) {
      throw new Error('Session not found');
    }

    const existingGuess = await this.findGuess({ imageId, sessionId: session.id });
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
      sessionId: session.id,
      longitude,
      latitude,
      imageLongitude: image.longitude,
      imageLatitude: image.latitude,
      score,
      distanceMeters: distance,
      createdAt: serverTimestamp(),
    };

    const guessCollection = this.getGuessCollection(session.id);
    const guessDoc = await addDoc(guessCollection, guess)
    return {
      ...guess,
      id: guessDoc.id,
    };
  }

  async getCurrentSession() {
    const sessionQuery = query(this.sessionCollection, where("endedAt", "==", null));
    const sessionDocs = await getDocs(sessionQuery);
    if (sessionDocs.empty) {
      return undefined;
    }

    return {
      ...sessionDocs.docs[0].data(),
      id: sessionDocs.docs[0].id,
    } as GameSession;
  }

  async startNewSession() {
    await this.endCurrentSession();

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

  async endCurrentSession() {
    const current = await this.getCurrentSession();
    if (current) {
      const docRef = doc(this.firestore, `sessions/${current.id}`);
      await updateDoc(docRef, { endedAt: serverTimestamp() });
    }
  }

  async getCurrentSessionProgress() {
    const session = await this.getCurrentSession();
    const imageCount = await this.imageService.getImageCount();
    if (!session) {
      return undefined;
    }

    const guessQuery = query(this.getGuessCollection(session.id));
    const guessDocCount = await getCountFromServer(guessQuery);

    return {
      sessionId: session.id,
      imageCount,
      guessCount: guessDocCount.data().count,
    };
  }

  async findGuess({ imageId, sessionId }: { imageId: string; sessionId?: string; }) {
    const guessSessionId = sessionId ?? (await this.getCurrentSession())?.id;
    if (!guessSessionId) {
      return undefined;
    }

    const guessQuery = query(
      this.getGuessCollection(guessSessionId),
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

  getGuessResource(id: Signal<string | undefined>) {
    return resource({
      params: () => ({ id: id() }),
      loader: ({ params: { id } }) => {
        return id ? this.findGuess({ imageId: id! }) : Promise.resolve(undefined);
      }
    });
  }

  getSessionProgressResource(imageId: Signal<string | undefined>) {
    return resource({
      params: () => ({ imageId: imageId() }),
      loader: ({ params: { imageId }}) => {
        return imageId ? this.getCurrentSessionProgress() : Promise.resolve(undefined);
      }
    });
  }
}
