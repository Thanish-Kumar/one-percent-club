'use client';

import Link from "next/link";
import { PublicRoute } from "@/components/auth/ProtectedRoute";

export default function Home() {
  return (
    <PublicRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to 1% Club
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Join our community and start your journey to becoming 1% better every day.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Sign In
            </Link>
            
            <Link
              href="/signup"
              className="w-full flex justify-center py-3 px-4 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Create Account
            </Link>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}
