import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { GameplayPage } from './pages/gameplay-page/gameplay-page';
import { GuessImagePage } from './pages/guess-image/guess-image';

export const routes: Routes = [
    {
        component: HomePage,
        path: "home"
    },
    {
        component: GameplayPage,
        path: "gameplay"
    },
    {
        component: GuessImagePage,
        path: "gameplay/image/:id"
    },
    {
        redirectTo: "home",
        path: "",
        pathMatch: "full"
    },
];
