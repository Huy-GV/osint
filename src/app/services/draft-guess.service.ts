import { Injectable, resource, Signal } from '@angular/core';
import { DraftGuess } from '../models/draft-guess';

@Injectable({
  providedIn: 'root',
})
export class DraftGuessService {
  private static DRAFT_KEY = "draft-guess"

  private buildStorageKey(sessionId: string) {
    return  `${DraftGuessService.DRAFT_KEY}:${sessionId}`
  }

  private loadJson(sessionId: string) {
    const loadedData = localStorage.getItem(this.buildStorageKey(sessionId));
    if (!loadedData) {
      return {};
    }

    return JSON.parse(loadedData) as DraftGuess;
  }

  private saveChanges(sessionId: string, newData: DraftGuess) {
    localStorage.setItem(this.buildStorageKey(sessionId), JSON.stringify(newData));
  }

  addDraftGuess({
    imageId,
    sessionId,
    guessLatitude,
    guessLongitude
  }: {
    imageId: string,
    sessionId: string,
    guessLatitude: number,
    guessLongitude: number,
  }) {
    const sessionDraft = this.loadJson(sessionId);
    const newDraftGuess = {
      id: crypto.randomUUID(),
      longitude: guessLongitude,
      latitude: guessLatitude,
      createdAt: new Date(),
    };
    if (sessionDraft[imageId]) {
      sessionDraft[imageId] = sessionDraft[imageId].length >= 3
        ? sessionDraft[imageId].concat(newDraftGuess).slice(1)
        : sessionDraft[imageId].concat(newDraftGuess)
    } else {
      sessionDraft[imageId] = [newDraftGuess];
    }

    this.saveChanges(sessionId, sessionDraft);
  }

  getDraftGuesses(imageId: string, sessionId: string) {
    const sessionDraft = this.loadJson(sessionId);
    return sessionDraft[imageId] ?? [];
  }

  deleteSessionDraft(sessionId: string) {
    localStorage.removeItem(this.buildStorageKey(sessionId));
  }

  getDraftResource(imageId: Signal<string | undefined>, sessionId: Signal<string | undefined>) {
    return resource({
    params: () => ({ imageId: imageId(), sessionId: sessionId() }),
    loader: ({ params: { imageId, sessionId } }) => {
      return Promise.resolve(imageId && sessionId ? this.getDraftGuesses(imageId, sessionId) : []);
    }
  });
  }
}
