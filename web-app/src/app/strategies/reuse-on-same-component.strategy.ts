import {ActivatedRouteSnapshot, RouteReuseStrategy, DetachedRouteHandle} from '@angular/router';

export class ReuseOnSameComponentStrategy implements RouteReuseStrategy {
    shouldDetach(route: ActivatedRouteSnapshot): boolean { return false; }
    store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {}
    shouldAttach(route: ActivatedRouteSnapshot): boolean { return false; }
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle|null { return null; }
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return this.getLastChild(future).component && this.getLastChild(future).component === this.getLastChild(curr).component;
    }

    private getLastChild(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
        if (!snapshot.children || !snapshot.children.length) {
            return snapshot;
        }
        return snapshot.children[snapshot.children.length - 1];
    }
}