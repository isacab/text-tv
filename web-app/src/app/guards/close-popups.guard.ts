import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ClosePopupsService } from '../services/close-popups.service';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ClosePopupsGuard implements CanDeactivate<unknown> {

  constructor(
    private closePopupsService: ClosePopupsService,
    private router: Router,
    private location: Location
  ) {}

  canDeactivate(
    component: unknown,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): any {
    const closed = this.closePopupsService.closeAll();
    if(closed > 0) {
      // Since state has been removed from history we need to add it back
      const currentUrlTree = this.router.createUrlTree([], currentRoute);
      const currentUrl = currentUrlTree.toString();
      this.location.go(currentUrl);
      return false;
    }
    return true;
  }
  
}
