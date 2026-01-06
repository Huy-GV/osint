import { Component, inject, resource } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { ImageService } from '../../services/image.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameSessionService } from '../../services/game-session.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-guess-image',
  imports: [ReactiveFormsModule, GoogleMapsModule, RouterModule],
  templateUrl: './guess-image.html',
  styleUrl: './guess-image.css',
})
export class GuessImagePage {
  private readonly imageService = inject(ImageService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly gameService = inject(GameSessionService);
  private readonly router = inject(Router);

  private readonly id = toSignal(
    this.activatedRoute.params.pipe(map(p => p['id'] as string))
  );

  image = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params: { id }}) => {
      return this.imageService.getAnonymousImageById(this.id()!);
    }
  })

  answer = resource({
    params: () => ({ id: this.id() }),
    loader: ({ params: { id }}) => {
      const existingGuess = this.gameService.findGuess({ imageId: id! });
      return Promise.resolve(existingGuess ? {
        latitude: existingGuess.imageLatitude,
        longitude: existingGuess.imageLongitude,
        distanceMeters: existingGuess.distanceMeters,
        guessLatitude: existingGuess.latitude,
        guessLongitude: existingGuess.longitude,
        score: existingGuess.score,
      } : undefined);
    }
  })

  form = new FormGroup({
    // TODO: need to review the bounds here
    latitude: new FormControl(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  async submitGuess() {
    if (this.form.valid) {
      // TODO: display error message
      const latitude = this.form.get('latitude')!.value!;
      const longitude = this.form.get('longitude')!.value!;
      const guess = await this.gameService.confirmGuess(this.id()!, longitude, latitude);
      const progress = await this.gameService.getCurrentSessionProgress();
      if (progress) {
        const isFinished = progress.guessCount === progress.imageCount;
        if (isFinished) {
          this.router.navigate(["gameplay", "summary", guess.sessionId])
        }
      }
      this.answer.reload()
    }
  }

  onMapReady(map: google.maps.Map) {
    if (!this.answer.hasValue()) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng({ lat: this.answer.value().latitude, lng: this.answer.value().longitude }));
    bounds.extend(new google.maps.LatLng({ lat: this.answer.value().guessLatitude, lng: this.answer.value().guessLongitude }));
    map.fitBounds(bounds);
  }

  onImageClicked(id: string | null) {
    if (id) {
      this.form.reset();
      this.router.navigate(["gameplay", "image", id]);
    }
  }
}
