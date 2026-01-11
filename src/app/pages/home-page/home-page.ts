import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GameSessionService } from '../../services/game-session.service';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private readonly gameService = inject(GameSessionService);
  private readonly router = inject(Router);
  private readonly imageService = inject(ImageService);

  readonly cachedSession = this.gameService.cachedSessionResource;
  readonly images = this.imageService.getAllImagesResource();

  readonly activeTooltip = signal<string | null>(null);
  readonly helpContent: Record<string, { title: string, detail: string }> = {
    INSPECT: {
      title: 'Analyse',
      detail: 'Examine the provided image for geographical clues: shadows, vegetation, architecture, or license plates'
    },
    LOCATE: {
      title: 'Triangulate',
      detail: 'Use the street layout and landmarks to pinpoint the exact latitude and longitude'
    },
    EXTRACT: {
      title: 'Score',
      detail: 'Perfect (0m): 15pt | <10m: 9pt | <20m: 6pt | <30m: 3pt | <40m: 1pt | <50m: 0pt'
    }
  };

  async startNewSession() {
    const { id } = await this.gameService.startNewSession();
    if (this.images.hasValue()) {
      this.router.navigate(["gameplay", id, "image", this.images.value()[0].id])
    }
  }

  async resumeSession() {
    if (this.cachedSession.hasValue() && this.images.hasValue()) {
      this.router.navigate(["gameplay", this.cachedSession.value().sessionId, "image", this.images.value()[0].id]);
    }
  }
}
