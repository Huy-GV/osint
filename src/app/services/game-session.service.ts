import { inject, Injectable } from '@angular/core';
import { MapService } from './map.service';
import { ScoreService } from './score.service';
import { ImageService } from './image.service';
import { GameSession } from '../models/game-session';
import { Guess } from '../models/guess';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, getCountFromServer, getDoc, getDocs, getDocsFromServer, query, where } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {

  private readonly imageService = inject(ImageService);
  private readonly mapService = inject(MapService);
  private readonly scoreService = inject(ScoreService);
  private readonly firestore = inject(Firestore);

  // TODO: move these to Firebase
  private sessions: GameSession[] = [];

  private guessCollection = collection(this.firestore, "guesses");
  private sessionCollection = collection(this.firestore, "sessions");

  async confirmGuess(imageId: string, longitude: number, latitude: number) {
    const image = this.imageService.getImageById(imageId);
    if (!image) {
      throw new Error('Image not found');
    }

    const distance = this.mapService.calculateDistanceMeters(
      { latitude: latitude, longitude: longitude },
      { latitude: image.latitude, longitude: image.longitude }
    );

    const score = this.scoreService.calculateScore(distance);
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('Session not found');
    }

    const guess: Omit<Guess, "id"> = {
      imageId,
      sessionId: session.id,
      longitude,
      latitude,
      imageLongitude: image.longitude,
      imageLatitude: image.latitude,
      score,
      distanceMeters: distance,
      createdAt: new Date(),
    }

    const guessDoc = await addDoc(this.guessCollection, guess)
    return {
      ...guess,
      id: guessDoc.id,
    };
  }

  getCurrentSession(): GameSession | undefined {
    return this.sessions.find(s => !s.endedAt);
  }

  startNewSession(): GameSession {
    this.endCurrentSession();

    const newSession = {
      startedAt: new Date(),
      id: crypto.randomUUID(),
    }

    this.sessions.push(newSession);
    return newSession;
  }

  endCurrentSession() {
    const current = this.sessions.find(s => s.endedAt === null);
    if (current) {
      current.endedAt = new Date();
    }

    return Promise.resolve();
  }

  async getCurrentSessionProgress() {
    const session = this.getCurrentSession();
    const imageCount = await this.imageService.getImageCount();
    if (!session) {
      return undefined;
    }

    const guessQuery = query(this.guessCollection, where("sessionId", "==", session.id));
    const guessDocCount = await getCountFromServer(guessQuery);

    return {
      imageCount,
      guessCount: guessDocCount.data().count,
    };
  }

  async findGuess({ sessionId, imageId }: { sessionId?: string, imageId: string }) {
    const session = this.sessions.find(s => s.id === sessionId) ?? this.getCurrentSession();
    if (!session) {
      return undefined;
    }

    const guessQuery = query(this.guessCollection, where("imageId", "==", session.id));
    const guessDocs = await getDocs(guessQuery);
    if (guessDocs.empty) {
      return undefined;
    }

    const guessDoc = guessDocs.docs[0];
    // TODO: use converters here
    return guessDoc.data() as unknown as Guess;
  }

  async getSessionSummary(sessionId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) {
      return undefined;
    }

    const guessQuery = query(this.guessCollection, where("imageId", "==", session.id));
    const guesses = await getDocsFromServer(guessQuery) as unknown as Guess[];

    return {
      guesses,
      meta: {
        gameStartedAt: session.startedAt,
        gameEndAt: session.endedAt,
        totalScore: guesses.map(g => g.score).reduce((sum, score) => sum + score, 0),
        averageDistance: guesses.map(g => g.distanceMeters).reduce((sum, distanceMeters) => sum + distanceMeters, 0) / guesses.length,
      }
    }
  }
}
