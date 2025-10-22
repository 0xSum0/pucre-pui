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

  // Initialize invisible reCAPTCHA once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        siteKey: "6LfK4nMrAAAAAPPXJzeC2-lpyikjS7UPb9VWsQYv",
        callback: () => console.log("✅ reCAPTCHA solved"),
      });

      window.recaptchaVerifier.render().catch(console.error);
    }
  }, []);

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const limited = digits.substring(0, 11);
    if (limited.length >= 8) return `${limited.substring(0, 3)}-${limited.substring(3, 7)}-${limited.substring(7)}`;
    if (limited.length >= 4) return `${limited.substring(0, 3)}-${limited.substring(3)}`;
    return limited;
  };

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

    const digits = phoneNumber.replace(/\D/g, "");
    const fullPhone = "+81" + digits; // Japan default

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier!);
      localStorage.setItem("verificationId", confirmationResult.verificationId); // ✅ Save only verificationId
      console.log("📨 SMS sent successfully to", fullPhone);

      router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (err: any) {
      console.error("❌ Error sending SMS:", err);
      if (err.code === "auth/too-many-requests") {
        setError("リクエストが多すぎます。しばらく待ってからもう一度お試しください。");
      } else if (err.code === "auth/invalid-phone-number") {
        setError("無効な電話番号です。正しい番号を入力してください。");
      } else {
        setError(`SMS送信に失敗しました: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center space-y-6 mb-8">
          <div className="w-16 h-16 mx-auto">
            <Image src="/images/app.png" alt="App Logo" width={64} height={64} />
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
                  className="flex-1 h-14 text-lg border-0 bg-transparent focus:ring-0 pl-4 pr-12 placeholder:text-gray-400"
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
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-3/4 h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-2xl"
          >
            {isLoading ? "送信中..." : (
              <div className="flex items-center space-x-2">
                <span>続ける</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          <div id="recaptcha-container"></div>

          <p className="text-xs text-gray-500 text-center">
            Pucreにログインすることで
            <a href="https://pucre.life/privacy" target="_blank" className="underline mx-1">
              プライバシーポリシー
            </a>
            と
            <a href="https://pucre.life/term" target="_blank" className="underline mx-1">
              利用規約
            </a>
            に同意したものとみなされます。
          </p>
        </form>
      </div>
    </div>
  );
}
