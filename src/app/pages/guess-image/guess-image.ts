import { Component, computed, effect, ElementRef, inject, Renderer2, signal, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { ImageService } from '../../services/image.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameSessionService } from '../../services/game-session.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MapService } from '../../services/map.service';
import { DraftGuessService } from '../../services/draft-guess.service';

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
  private readonly draftService = inject(DraftGuessService);
  private renderer = inject(Renderer2);

  private readonly imageId = toSignal(
    this.activatedRoute.params.pipe(map(p => p['id'] as string))
  );

  private readonly sessionId = toSignal(
    this.activatedRoute.params.pipe(map(p => p['sessionId'] as string))
  );

  readonly image = this.imageService.getImageResource(this.imageId);
  readonly answer = this.gameService.getGuessResource(this.imageId, this.sessionId);
  readonly sessionProgress = this.gameService.getSessionProgressResource(this.imageId, this.sessionId);
  readonly draftGuesses = this.draftService.getDraftResource(this.imageId, this.sessionId);

  readonly mapOptions: google.maps.MapOptions = {
    mapId: "1d003da39cfe4e7de50ae138",
    minZoom: 2,
    maxZoom: 50,
    restriction: {
      latLngBounds: {
        north: 89,
        south: -89,
        west: -180,
        east: 180,
      },
      strictBounds: true,
    },
    fullscreenControl: true,
    disableDefaultUI: true,
    clickableIcons: false,
  };

  readonly displayMarkers = computed(() => {
    if (this.answer.hasValue()) {
      const { longitude, latitude, imageLatitude, imageLongitude } = this.answer.value();
      return {
        imageLatitude: this.mapService.renderedLatitude(imageLatitude),
        imageLongitude: imageLongitude,
        guessLatitude:  this.mapService.renderedLatitude(latitude),
        guessLongitude: longitude,
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
    latitude: new FormControl<number | null>(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl<number | null>(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  readonly imageDialog = viewChild<ElementRef<HTMLDialogElement>>("fullScreenDialog");
  readonly isZoomed = signal(false);
  readonly selectedDraftId = signal<string>("")

  constructor() {
    this.form.valueChanges.subscribe(value => {
      if (value.latitude === null || value.longitude === null) {
        return;
      }

      const matchingDraft = this.draftGuesses.value()?.find(
        ({ longitude, latitude }) => longitude === value.longitude && latitude === value.latitude
      );
      this.selectedDraftId.set(matchingDraft?.id ?? "");
    });

    effect(() => {
      if (this.answer.isLoading() || this.answer.hasValue()) {
        this.form.disable({ emitEvent: false });
        if (this.answer.hasValue()) {
          this.form.patchValue({
            latitude: this.answer.value().latitude,
            longitude: this.answer.value().longitude,
          });
        }
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  async submitGuess() {
    if (!this.form.valid) {
      return;
    }

    const latitude = this.form.get('latitude')!.value!;
    const longitude = this.form.get('longitude')!.value!;
    await this.gameService.confirmGuess({ imageId: this.imageId()!, longitude, latitude, sessionId: this.sessionId()! });
    this.answer.reload();
    this.sessionProgress.reload();
  }

  async navigateToSummary() {
    if (this.canNavigateToSummary()) {
      await this.gameService.endSession(this.sessionId()!);
      this.router.navigate(["gameplay", this.sessionId(), "summary"]);
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
      this.router.navigate(["gameplay", this.sessionId(), "image", id]);
    }
  }

  draftSelected(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const draftId = selectElement.value;
    if (!draftId) {
      return;
    }

    this.selectedDraftId.set(draftId);
    const selectedDraft = this.draftGuesses.value()?.find(draftGuess => draftGuess.id === draftId);
    if (!selectedDraft) {
      return;
    }

    this.form.patchValue({
      latitude: selectedDraft.latitude,
      longitude: selectedDraft.longitude,
    });
  }

  draftSaved() {
    const imageId = this.imageId();
    const sessionId = this.sessionId();
    if (this.form.valid && imageId && sessionId) {
      const latitude = this.form.get('latitude')!.value!;
      const longitude = this.form.get('longitude')!.value!;
      this.draftService.addDraftGuess({
        imageId,
        sessionId,
        guessLatitude: latitude,
        guessLongitude: longitude,
      });
      this.draftGuesses.reload();
      this.form.reset();
    }
  }

  toggleZoom() {
    this.isZoomed.update(zoomed => !zoomed);
  }

  openFullScreen() {
    this.imageDialog()?.nativeElement.showModal();
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  closeFullScreen() {
    this.isZoomed.set(false);
    this.imageDialog()?.nativeElement.close();
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }
}
