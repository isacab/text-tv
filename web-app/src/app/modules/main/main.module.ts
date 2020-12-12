import { Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from './containers/main/main.component';
import { RendererComponent } from './components/renderer/renderer.component';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { PageNumberInputComponent } from './components/page-number-input/page-number-input.component';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { TextTvService } from 'src/app/services/text-tv.service';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { HotkeyModule } from 'angular2-hotkeys';
import { SwipeContainerComponent, Direction } from './components/swipe-container/swipe-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { HAMMER_GESTURE_CONFIG, HammerGestureConfig } from '@angular/platform-browser';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
    overrides = <any> {
      "pan": { enable: true, direction: Direction.ALL },
      'pinch': { enable: false },
      'rotate': { enable: false }
    }
}

@NgModule({
  declarations: [
    MainComponent,
    RendererComponent,
    MenuBarComponent,
    PageNumberInputComponent,
    SafeHtmlPipe,
    SwipeContainerComponent,
    LoadingOverlayComponent,
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    FormsModule,
    HotkeyModule.forRoot(),
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    TextTvService,
    { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig },
  ],
})
export class MainModule { }
