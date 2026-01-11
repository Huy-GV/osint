import { inject, Injectable } from '@angular/core';
import { collection, serverTimestamp, addDoc, doc, updateDoc, query, getCountFromServer, where, getDocs, getDoc } from 'firebase/firestore';
import { GameSession } from '../models/game-session';
import { Guess } from '../models/guess';
import { Firestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private readonly firestore = inject(Firestore);

  private sessionCollection = collection(this.firestore, "sessions");

  private getGuessCollection(sessionId: string) {
    return collection(this.firestore, `sessions/${sessionId}/guesses`);
  }

  async confirmGuess({
    imageId,
    sessionId,
    longitude,
    latitude,
    imageLatitude,
    imageLongitude,
    score,
    distanceMeters,
  }: Pick<Guess, "imageId" | "sessionId" | "longitude" | "latitude" | "imageLongitude" | "imageLatitude" | "distanceMeters" | "score">) {
    const guess = {
      imageId,
      sessionId,
      longitude,
      latitude,
      imageLongitude,
      imageLatitude,
      score,
      distanceMeters,
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
    return {
      ...newSession,
      id: session.id,
    };
  }

  async endSession(sessionId: string) {
    const docRef = doc(this.firestore, `sessions/${sessionId}`);
    await updateDoc(docRef, { endedAt: serverTimestamp() });
  }

  async getSessionProgress(sessionId: string) {
    const guessQuery = query(this.getGuessCollection(sessionId));
    const guessDocCount = await getCountFromServer(guessQuery);

    return {
      guessCount: guessDocCount.data().count,
    };
  }

  async findGuess({ imageId, sessionId }: { imageId: string; sessionId: string; }) {
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

  async findSession(sessionId: string) {
    const sessionDoc = await getDoc(doc(this.firestore, `sessions/${sessionId}`));
    return sessionDoc.exists()
      ? {
        ...sessionDoc.data(),
        id: sessionDoc.id,
      } as unknown as GameSession
      : undefined;
  }

  async getSessionSummary(sessionId: string) {
    const session = await this.findSession(sessionId);
    if (!session) {
      return undefined;
    }

    const guessQuery = query(this.getGuessCollection(session.id));
    const guessDocs = await getDocs(guessQuery);
    const guesses = guessDocs.docs
      .map(d => ({ ...d.data(), id: d.id, } as Guess))
      .sort((a, b) => a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime());;

    return {
      session,
      guesses,
    }
  }
}
