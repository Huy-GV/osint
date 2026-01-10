import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { GameplayPage } from './pages/gameplay-page/gameplay-page';
import { GuessImagePage } from './pages/guess-image/guess-image';
import { Summary } from './pages/summary/summary';
import { NotFoundPage } from './pages/not-found/not-found';
import { sessionGuard } from './guards/session-guard';

export const routes: Routes = [
    {
        component: HomePage,
        path: "home"
    },
    {
        component: GameplayPage,
        path: "gameplay/:sessionId",
        canActivate: [sessionGuard],
    },
    {
        component: GuessImagePage,
        path: "gameplay/:sessionId/image/:id",
        canActivate: [sessionGuard],
    },
    {
        component: Summary,
        path: "gameplay/:sessionId/summary",
        canActivate: [sessionGuard],
    },
    {
        redirectTo: "home",
        path: "",
        pathMatch: "full"
    },
    {
        component: NotFoundPage,
        path: 'not-found',
    },
    {
        path: '**',
        redirectTo: '/not-found',
    }
];
