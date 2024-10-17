export interface RMQBasePayload {
  resourceId: string;
  oldData?: any;
  newData?: any;
  data?: any;
  user: any;
}
