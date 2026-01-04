import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { GameplayPage } from './pages/gameplay-page/gameplay-page';

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
        redirectTo: "home",
        path: "",
        pathMatch: "full"
    },
];
