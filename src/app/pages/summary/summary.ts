import { Component, inject, resource } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly gameService = inject(GameSessionService);
  private readonly id = toSignal(
    this.activatedRoute.params.pipe(map(p => p['id'] as string))
  );

  summary = resource({
    params: () => ({ id: this.id()! }),
    loader: ({ params: { id } }) => {
      return this.gameService.getSessionSummary(id!);
    }
  })
}
