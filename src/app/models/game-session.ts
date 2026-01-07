import { Timestamp } from "firebase/firestore";

export interface GameSession {
    id: string;
    startedAt: Timestamp;
    endedAt?: Timestamp;
}
