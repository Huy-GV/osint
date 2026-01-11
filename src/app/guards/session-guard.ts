import { inject } from '@angular/core';import { CanActivateFn, Router } from '@angular/router';
import { GameSessionService } from '../services/game-session.service';

export const sessionGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const gameSessionService = inject(GameSessionService);
  const redirectNotFound = () => router.parseUrl('/not-found')

  const sessionId = route.paramMap.get('sessionId');
  if (!sessionId?.trim()) {
    return redirectNotFound();
  }

  const existingSession = await gameSessionService.findSession(sessionId);
  if (!existingSession) {
    return redirectNotFound();
  }

  return true;
};
