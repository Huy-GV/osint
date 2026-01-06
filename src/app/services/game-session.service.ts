import { inject, Injectable } from '@angular/core';
import { MapService } from './map.service';
import { ScoreService } from './score.service';
import { ImageService } from './image.service';
import { GameSession } from '../models/game-session';
import { Guess } from '../models/guess';

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {

  private readonly imageService = inject(ImageService);
  private readonly mapService = inject(MapService);
  private readonly scoreService = inject(ScoreService);

  // TODO: move these to Firebase
  private guesses: Guess[] = [];
  private sessions: GameSession[] = [];

  confirmGuess(imageId: string, longitude: number, latitude: number) {
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

    const guess: Guess = {
      id: crypto.randomUUID(),
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

    this.guesses.push(guess);

    return Promise.resolve(guess);
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
    return Promise.resolve(session ? {
      imageCount,
      guessCount: this.guesses.filter(g => g.sessionId === session.id).length,
    } : undefined)
  }

  findGuess({ sessionId, imageId }: { sessionId?: string, imageId: string }) {
    const session = this.sessions.find(s => s.id === sessionId) ?? this.getCurrentSession();
    if (!session) {
      return null;
    }

    return this.guesses.find(g => g.imageId === imageId && g.sessionId === session.id);
  }

  async getSessionSummary(sessionId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) {
      return undefined;
    }

    const guesses = this.guesses.filter(g => g.sessionId === sessionId);
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
