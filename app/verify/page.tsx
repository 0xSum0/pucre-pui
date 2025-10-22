"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { PhoneAuthProvider, signInWithCredential, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import AuthApi from "@/lib/api/authApi";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneNumber = searchParams.get("phone") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== "")) setTimeout(() => handleVerify(newCode), 300);
  };

  const handleVerify = async (codeToVerify = code) => {
    setIsVerifying(true);
    setError("");

    try {
      const verificationId = localStorage.getItem("verificationId");
      if (!verificationId) throw new Error("認証情報が見つかりません");

      const smsCode = codeToVerify.join("");
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);

      // ✅ Use same logic as mobile app
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      const token = await user.getIdToken(true);

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
      await signOut(auth); // ✅ Clear session
    } catch (err: any) {
      console.error("Verification error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("認証コードが正しくありません");
      } else if (err.code === "auth/code-expired") {
        setError("認証コードの有効期限が切れています");
      } else {
        setError("認証に失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <Image src="/images/character.png" alt="Character" width={96} height={96} className="mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">認証完了！</h2>
          <a href={redirectUrl || "#"} className="w-3/4 mx-auto block">
            <Button className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-2xl flex items-center justify-center space-x-3">
              <Check className="w-5 h-5 text-white" />
              <span>アプリで続行</span>
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 pt-8">
      <div className="w-full max-w-md mx-auto">
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

        <div className="text-center space-y-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900">認証コードを入力</h2>
          <p className="text-base text-gray-600">
            {phoneNumber} に送信された6桁のコードを入力してください
          </p>
        </div>

        <div className="flex justify-center space-x-3 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(i, e.target.value)}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl ${
                digit
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : error
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300"
              }`}
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        {isVerifying && (
          <div className="flex items-center justify-center text-blue-600 space-x-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>認証中...</span>
          </div>
        )}
      </div>
    </div>
  );
}
