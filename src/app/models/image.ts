export interface Image {
  id: string;
  url: string;
  name: string;
  longitude: number;
  latitude: number;
}

export interface AnonymousImage extends Omit<Image, "longitude" | "latitude" | "name"> { }
