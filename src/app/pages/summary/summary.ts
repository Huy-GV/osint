import { Component, inject, resource } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GameSessionService } from '../../services/game-session.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-summary',
  imports: [DatePipe],
  templateUrl: './summary.html',
  styleUrl: './summary.css',
})
export class Summary {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly gameService = inject(GameSessionService);
  private readonly sessionId = toSignal(
    this.activatedRoute.params.pipe(map(p => p['sessionId'] as string))
  );

  summary = resource({
    params: () => ({ sessionId: this.sessionId()! }),
    loader: ({ params: { sessionId } }) => {
      return this.gameService.getSessionSummary(sessionId!);
    }
  });

  async startNewGame() {
    await this.gameService.endSession(this.sessionId()!);
    this.router.navigate(["home"]);
  }

  answerSelected(imageId: string) {
    this.router.navigate(["gameplay", this.sessionId(), "image", imageId]);
  }
}
