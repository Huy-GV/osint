import { Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { ImageService } from '../../services/image.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameSessionService } from '../../services/game-session.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MapService } from '../../services/map.service';

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
  private readonly mapService = inject(MapService);

  private readonly id = toSignal(
    this.activatedRoute.params.pipe(map(p => p['id'] as string))
  );

  readonly image = this.imageService.getImageResource(this.id);
  readonly answer = this.gameService.getGuessResource(this.id);
  readonly sessionProgress = this.gameService.sessionProgress;
  readonly mapOptions: google.maps.MapOptions = {
    minZoom: 2,
    maxZoom: 20,
    restriction: {
      latLngBounds: {
        north: 89,
        south: -89,
        west: -180,
        east: 180,
      },
      strictBounds: true,
    },
    disableDefaultUI: true,
  };

  readonly displayMarkers = computed(() => {
    if (this.answer.hasValue()) {
      return {
        imageLatitude: this.mapService.renderedLatitude(this.answer.value().imageLatitude),
        imageLongitude: this.answer.value().imageLatitude,
        guessLatitude:  this.mapService.renderedLatitude(this.answer.value().latitude),
        guessLongitude: this.answer.value().longitude,
      }
    }

    return {
      imageLatitude: 0,
      imageLongitude: 0,
      guessLatitude: 0,
      guessLongitude: 0,
    }
  });


  readonly canNavigateToSummary = computed(() => this.sessionProgress.hasValue() && this.sessionProgress.value().guessCount >= this.sessionProgress.value().imageCount);

  readonly form = new FormGroup({
    latitude: new FormControl(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  async submitGuess() {
    if (this.form.valid) {
      const latitude = this.form.get('latitude')!.value!;
      const longitude = this.form.get('longitude')!.value!;
      await this.gameService.confirmGuess({ imageId: this.id()!, longitude, latitude });
      this.answer.reload();
      this.sessionProgress.reload();
    }
  }

  async navigateToSummary() {
    if (this.canNavigateToSummary()) {
      this.router.navigate(["gameplay", "summary", this.sessionProgress.value()!.sessionId]);
    }
  }

  onMapReady(map: google.maps.Map) {
    if (!this.answer.hasValue()) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng({ lat: this.answer.value().imageLatitude, lng: this.answer.value().imageLongitude }));
    bounds.extend(new google.maps.LatLng({ lat: this.answer.value().latitude, lng: this.answer.value().longitude }));
    map.fitBounds(bounds);
  }

  onImageClicked(id: string | null) {
    if (id) {
      this.form.reset();
      this.router.navigate(["gameplay", "image", id]);
    }
  }
}
