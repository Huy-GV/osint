import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { ImageService } from '../../services/image.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-guess-image',
  imports: [ReactiveFormsModule, GoogleMapsModule],
  templateUrl: './guess-image.html',
  styleUrl: './guess-image.css',
})
export class GuessImagePage {
  private readonly imageService = inject(ImageService);
  private readonly activatedRoute = inject(ActivatedRoute);

  googleMapElement = viewChild<ElementRef<GoogleMap>>("googleMap")
  showAnswer = signal(false);
  answer = signal<{
    latitude: number;
    longitude: number;
    distanceMeters: number;
    guessLatitude: number;
    guessLongitude: number;
  } | null>(null);

  image = signal(this.imageService.getImageById(this.activatedRoute.snapshot.params['id'])!);
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
      const guess = this.imageService.addGuess(this.image().id, longitude, latitude);
      const {
        latitude: answerLatitude,
        longitude: answerLongitude,
        distanceMeters,
      } = this.imageService.confirmGuess(guess.id);

      this.answer.set({
        latitude: answerLatitude,
        longitude: answerLongitude,
        distanceMeters,
        guessLatitude: guess.latitude,
        guessLongitude: guess.longitude,
      });

      this.showAnswer.set(true);
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
}
