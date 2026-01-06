export interface Guess {
  id: string;
  createdAt: Date;
  imageId: string;
  sessionId: string;
  longitude: number;
  latitude: number;
  score: number;
  distanceMeters: number;
}
