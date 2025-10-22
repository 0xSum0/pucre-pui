export {};

declare global {
  interface Window {
    recaptchaVerifier: import("firebase/auth").RecaptchaVerifier | null;
    verificationId?: string;
    confirmationResult?: import("firebase/auth").ConfirmationResult;
  }
}