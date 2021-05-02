import { Injectable, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from './containers/main/main.component';
import { RendererComponent } from './components/renderer/renderer.component';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { PageNumberInputComponent } from './components/page-number-input/page-number-input.component';
import { SafeHtmlPipe } from 'src/app/pipes/safe-html.pipe';
import { AppRoutingModule } from 'src/app/app-routing.module';
import { SwipeContainerComponent, Direction } from './components/swipe-container/swipe-container.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser';
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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    HammerModule,
    ScrollingModule
  ],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig },
  ],
})
export class MainModule { }
