// global.d.ts — TS shim for @paystack/inline-js

declare module "@paystack/inline-js" {
  export class PaystackPop {
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;          // in kobo
      ref?: string;
      currency?: string;       // e.g., "NGN"
      metadata?: any;
      onSuccess?: (trxn: { reference: string } & Record<string, any>) => void;
      onCancel?: () => void;
      onError?: (err: any) => void;
      [key: string]: any;      // allow other optional props
    }): void;
  }
}
// global.d.ts — TS shim for @paystack/inline-js

declare module "@paystack/inline-js" {
  export default class PaystackPop {
    newTransaction(options: {
      key: string;
      email: string;
      amount: number;          // in kobo
      ref?: string;
      currency?: string;       // e.g., "NGN"
      metadata?: any;
      onSuccess?: (trxn: { reference: string } & Record<string, any>) => void;
      onCancel?: () => void;
      onError?: (err: any) => void;
      [key: string]: any;
    }): void;
  }
}
