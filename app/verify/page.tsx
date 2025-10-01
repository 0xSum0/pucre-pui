"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import AuthApi from "@/lib/api/authApi";

//declare global {
//  interface Window {
//    confirmationResult: import("firebase/auth").ConfirmationResult;
//  }
//}

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isComplete, setIsComplete] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last digit
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    const isComplete = newCode.every((digit) => digit !== "");
    setIsComplete(isComplete);

    // Auto-verify when complete
    if (isComplete) {
      setTimeout(() => handleVerify(newCode), 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);
    setError("");

    const isComplete = newCode.every((digit) => digit !== "");
    setIsComplete(isComplete);

    if (isComplete) {
      setTimeout(() => handleVerify(newCode), 300);
    }
  };

  const handleVerify = async (codeToVerify = code) => {
    setIsVerifying(true);
    setError("");

    try {
      const codeString = codeToVerify.join("");

      if (!window.confirmationResult) {
        throw new Error("認証情報が見つかりません");
      }

      // Use the confirm method from your working code
      const result = await window.confirmationResult.confirm(codeString);
      const user = result.user; // Firebase user object
      const token = await user.getIdToken();

      console.log("✅ Firebase sign-in successful:", user.uid, user.email);

      const apiResponse = await AuthApi.phoneNumberSignIn({
        uid: user.uid,
        email: user.phoneNumber || "",
        screenName: "",
      });

      // Success
      setIsVerified(true);
      setIsVerifying(false);

      const redirectUrl = `https://pui.onelink.me/kFYQ/pucreauth?uid=${encodeURIComponent(
        user.uid
      )}&token=${encodeURIComponent(apiResponse.token)}`;

      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 3000);
    } catch (error: any) {
      console.error("Verification error:", error);

      if (error.code === "auth/invalid-verification-code") {
        setError("認証コードが正しくありません");
      } else if (error.code === "auth/code-expired") {
        setError("認証コードの有効期限が切れています");
      } else {
        setError("認証に失敗しました。もう一度お試しください。");
      }

      setIsVerifying(false);
      // Clear the code and focus first input
      setCode(["", "", "", "", "", ""]);
      setIsComplete(false);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResendCooldown(60);
    setError("");

    // Convert to raw phone number for Firebase
    const digits = phoneNumber.replace(/\D/g, "");
    const fullPhone = "+81" + digits;

    try {
      // Setup reCAPTCHA verifier for resend (simpler approach)
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-resend", {
          size: "invisible",
        });
      }

      // Resend SMS
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhone,
        window.recaptchaVerifier
      );

      // Store confirmation result on window object
      window.confirmationResult = confirmationResult;
    } catch (error: any) {
      console.error("Error resending SMS:", error);
      setError("SMS再送信に失敗しました");
      setResendCooldown(0);

      // Reset reCAPTCHA on error
      window.recaptchaVerifier?.clear();
      window.recaptchaVerifier = undefined as any;
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto">
              <Image
                src="/images/character.png"
                alt="Character"
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">認証完了！</h2>
              <p className="text-gray-600">
                アプリに移動しています
                <br />
                <span className="text-red-600 font-semibold">このページを閉じないでください</span>
              </p>
            </div>
            <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 pt-8">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-start mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="text-center space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">認証コードを入力</h2>
          <p className="text-base text-gray-600">
            {phoneNumber} に送信された
            <br />
            6桁のコードを入力してください
          </p>
        </div>

        {/* Code Input */}
        <div className="space-y-6">
          <div className="flex justify-center space-x-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 ${
                  digit
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : error
                      ? "border-red-400 bg-red-50 animate-shake"
                      : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:bg-blue-50"
                } focus:outline-none focus:ring-0`}
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-red-600 text-center animate-fade-in">{error}</p>}

          {/* Loading State */}
          {isVerifying && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">認証中...</span>
            </div>
          )}

          {/* Resend Button */}
          <div className="text-center">
            <div id="recaptcha-container-resend"></div>
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-500">{resendCooldown}秒後に再送信できます</p>
            ) : (
              <Button
                variant="ghost"
                onClick={handleResend}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium"
                disabled={isVerifying}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                コードを再送信
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            コードが届かない場合は、迷惑メールフォルダを
            <br />
            確認するか、しばらく待ってから再送信してください
          </p>
        </div>
      </div>
    </div>
  );
}
