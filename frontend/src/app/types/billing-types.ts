export type BillingJob = {
    entity_id: string;
    property_id: string;
    billing_account_id: string;
    entity: string;
    total: number;
  };
  

  type BillingPeriod = {
    id: string;
    startDate: Date;
    endDate: Date;
  };


  export type AppfolioLineItem = {
    billPropertyCode: string;
    billUnitName: string;
    payeeName: string;
    amount: number;
    billAccountCode: number;
    billDescription: string;
    billDate: Date;
    dueDate: Date;
    billReference: string;
    billRemarks: string;
  };

  