import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes, RouteReuseStrategy } from '@angular/router';
import { ReuseOnSameComponentStrategy } from './strategies/reuse-on-same-component.strategy';
import { environment } from 'src/environments/environment';
import { MainComponent } from './modules/main/containers/main/main.component';

const routes: Routes = [
  { path: '', redirectTo: '//', pathMatch: 'full' },
  { path: ':page', component: MainComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: environment.client === 'android' }),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
