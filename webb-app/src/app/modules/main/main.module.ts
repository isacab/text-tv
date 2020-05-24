import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from './containers/main/main.component';
import { RendererComponent } from './components/renderer/renderer.component';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { PageNumberInputComponent } from './components/page-number-input/page-number-input.component';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { TextTvService } from 'src/app/services/text-tv.service';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { HotkeyModule, HotkeysService } from 'angular2-hotkeys';
import { SwipeContainerComponent, Direction } from './components/swipe-container/swipe-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClientModule } from '@angular/common/http';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatToolbarModule } from '@angular/material/toolbar';

@NgModule({
  declarations: [
    MainComponent,
    RendererComponent,
    MenuBarComponent,
    PageNumberInputComponent,
    SafeHtmlPipe,
    SwipeContainerComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    HotkeyModule.forRoot(),
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatToolbarModule,
    ScrollingModule,
  ],
  exports: [
    MainComponent
  ],
  providers: [
    TextTvService,
  ]
})
export class MainModule { }
