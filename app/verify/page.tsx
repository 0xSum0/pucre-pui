"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  PhoneAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import AuthApi from "@/lib/api/authApi";

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
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- EFFECTS ---

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // --- HANDLERS ---

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut(auth);
      console.log("Signed out");
    } catch (err) {
      console.error("Sign-out error:", err);
    } finally {
      if (redirectUrl) window.location.href = redirectUrl;
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");

    if (value && index < 5) inputRefs.current[index + 1]?.focus();

    const complete = newCode.every((d) => d !== "");
    setIsComplete(complete);
    if (complete) setTimeout(() => handleVerify(newCode), 300);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const arr = [...code];
    for (let i = 0; i < pasted.length; i++) arr[i] = pasted[i];
    setCode(arr);
    const complete = arr.every((d) => d !== "");
    setIsComplete(complete);
    if (complete) setTimeout(() => handleVerify(arr), 300);
  };

  // 🔐 Step 3: Verify using signInWithCredential
  const handleVerify = async (codeToVerify = code) => {
    setIsVerifying(true);
    setError("");

    try {
      const codeStr = codeToVerify.join("");
      const verificationId =
        localStorage.getItem("verificationId") || window.verificationId;

      if (!verificationId) throw new Error("認証情報が見つかりません");

      // Reconstruct credential
      const credential = PhoneAuthProvider.credential(verificationId, codeStr);

      // Complete sign-in
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      const token = await user.getIdToken(true);

      console.log("✅ Firebase sign-in successful:", user.uid);

      const apiResponse = await AuthApi.phoneNumberSignIn({
        uid: user.uid,
        email: "",
        screenName: "",
      });

      const redirect = `https://pui.onelink.me/kFYQ/pucreauth?uid=${encodeURIComponent(
        user.uid
      )}&token=${encodeURIComponent(apiResponse.token)}`;

      setRedirectUrl(redirect);
      setIsVerified(true);
      setIsVerifying(false);
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
      setCode(["", "", "", "", "", ""]);
      setIsComplete(false);
      inputRefs.current[0]?.focus();
    }
  };

  // 🔁 Step 2: Resend SMS (stores new verificationId)
  const handleResend = async () => {
    setResendCooldown(60);
    setError("");
    const digits = phoneNumber.replace(/\D/g, "");
    const fullPhone = "+81" + digits;

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-resend", {
          size: "invisible",
        });
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhone,
        window.recaptchaVerifier
      );

      // Save verificationId
      localStorage.setItem("verificationId", confirmationResult.verificationId);
      window.verificationId = confirmationResult.verificationId;

      console.log("📩 SMS resent successfully");
    } catch (error: any) {
      console.error("Error resending SMS:", error);
      setError("SMS再送信に失敗しました");
      setResendCooldown(0);
      window.recaptchaVerifier?.clear();
      window.recaptchaVerifier = undefined as any;
    }
  };

  // --- VERIFIED UI ---
  if (isVerified) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto text-center space-y-6">
          <div className="w-24 h-24 mx-auto">
            <Image
              src="/images/character.png"
              alt="Character"
              width={96}
              height={96}
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900">認証完了！</h2>

          <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto animate-pulse" />

          <div className="mt-4 flex flex-col items-center">
            {redirectUrl ? (
              <a href={redirectUrl} onClick={handleComplete} className="w-3/4">
                <Button className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center space-x-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>タップして連携完了</span>
                </Button>
              </a>
            ) : (
              <Button disabled className="w-3/4 h-14 text-lg font-semibold bg-gray-300 rounded-2xl">
                読み込み中...
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- DEFAULT (INPUT) UI ---
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

          {error && <p className="text-sm text-red-600 text-center animate-fade-in">{error}</p>}

          {isVerifying && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">認証中...</span>
            </div>
          )}

          {/* Resend */}
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

        <div className="mt-8 text-center text-xs text-gray-500">
          コードが届かない場合は、迷惑メールフォルダを確認するか、<br />
          しばらく待ってから再送信してください
        </div>
      </div>
    </div>
  );
}
