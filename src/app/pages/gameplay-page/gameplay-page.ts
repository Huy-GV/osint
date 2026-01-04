import { Component, inject, signal } from '@angular/core';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-gameplay-page',
  imports: [],
  templateUrl: './gameplay-page.html',
  styleUrl: './gameplay-page.css',
})
export class GameplayPage {
  private readonly imageService = inject(ImageService);

  images = signal(this.imageService.getAllImages());
}
