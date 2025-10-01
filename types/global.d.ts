import type { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    recaptchaWidgetId: any;
    confirmationResult: ConfirmationResult | null;
    grecaptcha: any;
  }
}

export {};
