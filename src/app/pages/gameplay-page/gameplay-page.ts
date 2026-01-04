import { Component, inject, signal } from '@angular/core';
import { ImageService } from '../../services/image.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-gameplay-page',
  imports: [RouterLink],
  templateUrl: './gameplay-page.html',
  styleUrl: './gameplay-page.css',
})
export class GameplayPage {
  private readonly imageService = inject(ImageService);

  images = signal(this.imageService.getAllImages());
}
