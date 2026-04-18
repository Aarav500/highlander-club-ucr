"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("auth_token", token);
      router.replace("/");
    } else {
      setError(true);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-destructive text-2xl font-bold mb-4">Authentication Failed</h2>
        <p className="text-muted-foreground mb-6">No token received. Please try again.</p>
        <button
          onClick={() => router.push("/")}
          className="text-accent hover:underline font-medium"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
      <h2 className="text-2xl font-bold text-accent mb-2">Signing you in...</h2>
      <p className="text-muted-foreground">Please wait while we verify your UCR credentials.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
