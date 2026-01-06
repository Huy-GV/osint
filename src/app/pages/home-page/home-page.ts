import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameSessionService } from '../../services/game-session.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly gameService = inject(GameSessionService);
  private readonly router = inject(Router);

  currentSession = signal(this.gameService.getCurrentSession());

  startNewSession() {
    this.gameService.startNewSession();
    this.router.navigate(["gameplay"]);
  }
}
