import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ImageService } from '../../services/image.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-guess-image',
  imports: [ReactiveFormsModule],
  templateUrl: './guess-image.html',
  styleUrl: './guess-image.css',
})
export class GuessImagePage {
  private readonly imageService = inject(ImageService);
  private readonly activatedRoute = inject(ActivatedRoute);

  image = signal(this.imageService.getImageById(this.activatedRoute.snapshot.params['id'])!);
  form = new FormGroup({
    latitude: new FormControl(null, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl(null, [Validators.required, Validators.min(-180), Validators.max(180)]),
  });

  submitGuess() {
    if (this.form.valid) {
      // TODO: display error message
      const latitude = this.form.get('latitude')!.value!;
      const longitude = this.form.get('longitude')!.value!;
      this.imageService.addGuess(this.image().id, longitude, latitude);
      console.log(`guess: ${latitude}, ${longitude}`);
    }
  }
}
