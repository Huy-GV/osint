import { Timestamp } from "firebase/firestore";

export interface Guess {
  id: string;
  createdAt: Timestamp;
  imageId: string;
  sessionId: string;
  longitude: number;
  latitude: number;
  imageLongitude: number;
  imageLatitude: number;
  score: number;
  distanceMeters: number;
}
