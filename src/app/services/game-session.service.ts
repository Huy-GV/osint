import { inject, Injectable } from '@angular/core';
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

  private readonly imageService = inject(ImageService);
  private readonly mapService = inject(MapService);
  private readonly scoreService = inject(ScoreService);
  private readonly firestore = inject(Firestore);

  private sessionCollection = collection(this.firestore, "sessions");

  private getGuessCollection(sessionId: string) {
    return collection(this.firestore, `sessions/${sessionId}/guesses`);
  }

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
    const session = await this.getCurrentSession();
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
    return {
      ...newSession,
      id: session.id,
    };
  }

  async endCurrentSession() {
    const current = await this.getCurrentSession();
    if (current) {
      current.endedAt = new Date();
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
      imageCount,
      guessCount: guessDocCount.data().count,
    };
  }

  async findGuess({ imageId }: { imageId: string }) {
    const session = await this.getCurrentSession();
    if (!session) {
      return undefined;
    }

    const guessQuery = query(
      this.getGuessCollection(session.id),
      where("imageId", "==", imageId),
    );

    const guessDocs = await getDocs(guessQuery);
    if (guessDocs.empty) {
      return undefined;
    }

    const guessDoc = guessDocs.docs[0];
    // TODO: use converters here
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
        // TODO: review the timestamp values here
        gameStartedAt: session.startedAt,
        gameEndAt: session.endedAt,
        totalScore: guesses.map(g => g.score).reduce((sum, score) => sum + score, 0),
        averageDistance: guesses.map(g => g.distanceMeters).reduce((sum, distanceMeters) => sum + distanceMeters, 0) / guesses.length,
      }
    }
  }
}
