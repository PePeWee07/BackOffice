export interface ApiErrorModel {
  status: number;
  message?: string;
  errors?: ErrorsModel[];
}

export interface ErrorsModel {
  field?: string;
  rejectedValue?: string;
  message?: string;
  error?: string;
}
