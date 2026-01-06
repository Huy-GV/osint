import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
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

  image = computed(() => this.imageService.getAnonymousImageById(this.id()!)!);
  navigationIds = computed(() => this.imageService.getNavigationIds(this.image().id));

  // TODO: combine this with answer??
  showAnswer = linkedSignal({
    source: this.id,
    computation: (id) => !!this.gameService.findGuess({ imageId: id! })
  });

  // TODO: convert this to a pure compute or resource ??
  answer = linkedSignal<string | undefined, {
    latitude: number;
    longitude: number;
    distanceMeters: number;
    guessLatitude: number;
    guessLongitude: number;
    score: number;
  } | null>({
    source: this.id,
    computation: (id) => {
      const existing = this.gameService.findGuess({ imageId: id! });
      if (existing) {
        const image = this.imageService.getImageById(id!);
        return {
          latitude: image!.latitude,
          longitude: image!.longitude,
          distanceMeters: existing.distanceMeters,
          guessLatitude: existing.latitude,
          guessLongitude: existing.longitude,
          score: existing.score,
        };
      }
      return null;
    }
  });

  form = new FormGroup({
    // TODO: need to review the bounds here
    latitude: new FormControl(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  submitGuess() {
    if (this.form.valid) {
      // TODO: display error message
      const latitude = this.form.get('latitude')!.value!;
      const longitude = this.form.get('longitude')!.value!;
      const {
        latitude: answerLatitude,
        longitude: answerLongitude,
        distanceMeters,
        score,
      } = this.gameService.confirmGuess(this.id()!, longitude, latitude);

      this.answer.set({
        latitude: answerLatitude,
        longitude: answerLongitude,
        distanceMeters,
        guessLatitude: latitude,
        guessLongitude: longitude,
        score,
      });

      this.showAnswer.set(true)
    }
  }

  onMapReady(map: google.maps.Map) {
    if (!this.answer() || !this.showAnswer()) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng({ lat: this.answer()!.latitude, lng: this.answer()!.longitude }));
    bounds.extend(new google.maps.LatLng({ lat: this.answer()!.guessLatitude, lng: this.answer()!.guessLongitude }));
    map.fitBounds(bounds);
  }

  onImageClicked(id: string | null) {
    if (id) {
      this.form.reset();
      this.router.navigate(["gameplay", "image", id]);
    }
  }
}
