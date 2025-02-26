export type FileFormat = 'timero' | 'manual' | 'progress';

export interface BillbackRow {
  rowId: string;
  employeeId: string;
  job_date: string;
  hours: number;
  rate: number;
  billing_rate: number;
  mileage?: number;
  propertyId: string;
  entityId: string;
  categoryId: string;
  notes?: string;
  removed?: boolean;
  jobTotal: string | number;
  billingTotal: string | number;
}

export interface ValidationErrors {
  [rowId: string]: {
    [field: string]: string;
  };
}

export interface SelectedCorrections {
  [rowId: string]: {
    [field: string]: string;
  };
}

export interface TableColumn {
  column: string;
  label: string;
  canSort: boolean;
  sticky?: boolean;
  width?: string;
  canEdit?: boolean;
  renderHeader?: () => JSX.Element;
}

export interface Employee {
  id: string;
  name: string;
}

export interface Property {
  id: string;
  name: string;
  group?: string;
}

export interface Entity {
  id: string;
  name: string;
}

export interface BillingAccount {
  id: string;
  name: string;
  rate?: number;
  isbilledback: boolean;
}

export interface PropertyGroup {
  id: string;
  name: string;
  billingAccounts: string[];
} 
