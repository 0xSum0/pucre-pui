"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function AuthSuccessPage() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get authorization code from URL parameter
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      const url = `https://pui.onelink.me/kFYQ/?code=${code}`;
      setRedirectUrl(url);
    }
  }, []);

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
          </div>

          <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto animate-pulse"></div>

          <div className="mt-4 flex flex-col items-center">
            {redirectUrl ? (
              <a href={redirectUrl} className="w-3/4" aria-label="Open app">
                <Button className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded-2xl flex items-center justify-center space-x-3">
                  <Check className="w-5 h-5 text-white" />
                  <span>タップして連携完了</span>
                </Button>
              </a>
            ) : (
              <div className="w-3/4">
                <Button
                  className="w-full h-14 text-lg font-semibold bg-blue-600 disabled:bg-gray-300 rounded-2xl"
                  disabled
                >
                  読み込み中...
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
