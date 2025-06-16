"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthCodeError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const description = searchParams.get("description");

  const getErrorMessage = () => {
    if (error === "server_error" && description?.includes("Database error")) {
      return {
        title: "Database Configuration Error",
        message:
          "The database is not properly configured. Please ensure the database schema has been set up correctly.",
        details: description,
      };
    }

    if (
      error === "validation_failed" &&
      description?.includes("provider is not enabled")
    ) {
      return {
        title: "OAuth Provider Not Enabled",
        message:
          "The social login provider is not enabled in the authentication settings.",
        details: description,
      };
    }

    return {
      title: "Authentication Error",
      message: "Sorry, we couldn't authenticate you. Please try again.",
      details:
        description || "An unknown error occurred during authentication.",
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{errorInfo.message}</p>
          {errorInfo.details && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700 font-mono">
                {errorInfo.details}
              </p>
            </div>
          )}
        </div>
        <div>
          <Link
            href="/login"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
