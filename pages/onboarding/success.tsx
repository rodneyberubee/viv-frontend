"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingSuccess() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/login");
    }, 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold">Success 🎉</h1>
        <p className="mt-2 text-gray-600">You’re all set. Redirecting to login…</p>
        <p className="mt-4 text-sm text-gray-400">
          If you’re not redirected,{" "}
          <a href="/login" className="text-blue-600 underline">
            click here
          </a>.
        </p>
      </div>
    </div>
  );
}

