export interface DraftGuess {
    [imageId: string]: {
        id: string;
        longitude: number;
        latitude: number;
        createdAt: Date;
    }[];
}
