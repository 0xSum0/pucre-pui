"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ArrowRight } from "lucide-react";

export default function PhoneNumberInput() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize reCAPTCHA once (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        siteKey: "6LfK4nMrAAAAAPPXJzeC2-lpyikjS7UPb9VWsQYv",
        callback: () => console.log("reCAPTCHA solved"),
      });

      window.recaptchaVerifier.render().catch(console.error);
    }
  }, []);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limited = digits.substring(0, 11);

    if (limited.length >= 8) {
      return `${limited.substring(0, 3)}-${limited.substring(3, 7)}-${limited.substring(7)}`;
    } else if (limited.length >= 4) {
      return `${limited.substring(0, 3)}-${limited.substring(3)}`;
    } else {
      return limited;
    }
  };

  // Validate phone number
  const validatePhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 10 || digits.length === 11;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setIsValid(validatePhoneNumber(formatted));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError("");

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const fullPhone = "+81" + cleanPhone; // 🇯🇵 Japan default

    console.log("Attempting to send SMS to:", fullPhone);

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhone,
        window.recaptchaVerifier!
      );
      window.confirmationResult = confirmationResult;
      
      console.log("SMS sent successfully");
      setIsLoading(false);
      router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "auth/too-many-requests") {
        setError("リクエストが多すぎます。しばらく待ってからもう一度お試しください。");
      } else if (error.code === "auth/invalid-app-credential") {
        setError(
          "アプリの認証情報が無効です。Firebase Consoleでlocalhostが許可されているか確認してください。"
        );
      } else if (error.code === "auth/invalid-phone-number") {
        setError("無効な電話番号です。正しい番号を入力してください。");
      } else if (error.code === "auth/captcha-check-failed") {
        setError("reCAPTCHA認証に失敗しました。もう一度お試しください。");
      } else {
        setError(`SMS送信に失敗しました: ${error.message}`);
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-6 mb-8">
          <div className="w-16 h-16 mx-auto">
            <Image
              src="/images/app.png"
              alt="App Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Pucre</h2>
          <div className="w-full h-px bg-gray-300"></div>
          <p className="text-base text-gray-600">電話番号を入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          <div className="w-full relative">
            <div
              className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                phoneNumber
                  ? isValid
                    ? "border-green-400 shadow-lg shadow-green-100"
                    : "border-red-400 shadow-lg shadow-red-100"
                  : "border-gray-200 hover:border-blue-300 focus-within:border-blue-400 focus-within:shadow-lg focus-within:shadow-blue-100"
              }`}
            >
              <div className="relative flex items-center">
                <div className="flex items-center justify-center w-16 h-14 bg-gray-50 border-r border-gray-200">
                  <span className="text-lg font-semibold text-gray-600">🇯🇵</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="090-1234-5678"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="flex-1 h-14 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 pr-12 placeholder:text-gray-400"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {phoneNumber && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {isValid ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {phoneNumber && !isValid && (
              <p className="text-sm text-red-600 mt-2 animate-shake">
                有効な電話番号を入力してください
              </p>
            )}
            {phoneNumber && isValid && (
              <p className="text-sm text-green-600 mt-2 animate-fade-in">✓ 有効な電話番号</p>
            )}
          </div>

          {error && <p className="text-sm text-red-600 text-center animate-shake">{error}</p>}

          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-3/4 h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded-2xl"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Continue</span>
                {isValid && <ArrowRight className="w-5 h-5" />}
              </div>
            )}
          </Button>

          {/* reCAPTCHA container */}
          <div id="recaptcha-container"></div>

          <p className="text-xs text-gray-500 text-center">
            Pucreにログインすることで以下のことに同意したものとみなされます。{" "}
            <a
              href="https://pucre.life/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 transition-colors"
            >
              PRIVACY POLICY
            </a>{" "}
            &{" "}
            <a
              href="https://pucre.life/term"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 transition-colors"
            >
              TERMS
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
