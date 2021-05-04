export interface StatusMessage {
  id: string;
  active: boolean;
  title: string;
  body: string;
  type: StatusMessageType;
}

export enum StatusMessageType {
  DialogOnStartup = 1,
  DialogOnce = 2
}