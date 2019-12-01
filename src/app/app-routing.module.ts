import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainComponent } from './modules/main/containers/main/main.component';
import { environment } from 'src/environments/environment';

const routes: Routes = [
  { path: ':page', component: MainComponent },
  { path: '', component: MainComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true /*environment.client === 'android'*/ })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
