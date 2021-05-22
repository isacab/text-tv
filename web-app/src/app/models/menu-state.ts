export interface MenuState {
    [key:string]: MenuItemState;
}

export interface MenuItemState {
    disabled: boolean;
    checked: boolean;
}