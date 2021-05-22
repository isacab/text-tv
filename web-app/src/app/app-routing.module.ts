import { NgModule } from '@angular/core';
import { Routes, RouterModule, RouteReuseStrategy } from '@angular/router';
import { MainComponent } from './modules/main/containers/main/main.component';
import { environment } from 'src/environments/environment';
import { ReuseOnSameComponentStrategy } from './strategies/reuse-on-same-component.strategy';
import { ClosePopupsGuard } from './guards/close-popups.guard';

const routes: Routes = [
  { path: ':page', component: MainComponent, canDeactivate: [ClosePopupsGuard] },
  { path: '', component: MainComponent, canDeactivate: [ClosePopupsGuard] }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: environment.client === 'android' })
  ],
  exports: [RouterModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: ReuseOnSameComponentStrategy }
  ]
})
export class AppRoutingModule { }
