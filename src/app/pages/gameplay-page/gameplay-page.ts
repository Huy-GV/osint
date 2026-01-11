import { Component, inject, resource } from '@angular/core';
import { ImageService } from '../../services/image.service';
import { ActivatedRoute, Router } from "@angular/router";
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-gameplay-page',
  templateUrl: './gameplay-page.html',
  styleUrl: './gameplay-page.css',
})
export class GameplayPage {
  private readonly imageService = inject(ImageService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly sessionId = toSignal(
    this.activatedRoute.params.pipe(map(p => p['sessionId'] as string))
  );

  images = resource({
    loader: () => {
      return this.imageService.getAllImages();
    }
  });

  startGame() {
    if (this.images.hasValue() && this.images.value()[0]) {
      this.router.navigate(["gameplay", this.sessionId(), "image", this.images.value()[0].id])
    }
  }
}
