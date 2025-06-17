"use client";

import { createClient } from "@/lib/supabase/client";
import { getOrCreateProfileClient } from "@/lib/profile-utils-client";
import { useEffect, useState } from "react";
import { Coins, CreditCard, Star, Zap, Crown } from "lucide-react";

interface PointsTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface UserProfile {
  points: number;
}

export default function PointsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const supabase = createClient();

  const pointsPackages = [
    {
      id: "basic",
      name: "Basic Pack",
      points: 100,
      price: 999, // $9.99
      icon: Star,
      popular: false,
    },
    {
      id: "premium",
      name: "Premium Pack",
      points: 500,
      price: 3999, // $39.99
      icon: Zap,
      popular: true,
      bonus: 50, // bonus points
    },
    {
      id: "pro",
      name: "Pro Pack",
      points: 1000,
      price: 6999, // $69.99
      icon: Crown,
      popular: false,
      bonus: 200, // bonus points
    },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Get or create user profile
      const profileData = await getOrCreateProfileClient(
        user.id,
        user.email || undefined
      );

      if (!profileData) {
        throw new Error("Failed to fetch or create user profile");
      }

      setProfile({ points: profileData.points });

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("points_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const purchasePoints = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const selectedPackage = pointsPackages.find((p) => p.id === packageId);
      if (!selectedPackage) return;

      // Create Stripe checkout session
      const response = await fetch("/api/checkout/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          points: selectedPackage.points + (selectedPackage.bonus || 0),
          price: selectedPackage.price,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (err: any) {
      alert("Error purchasing points: " + err.message);
    } finally {
      setPurchasing(null);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading points data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Error loading points data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Points & Subscriptions
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Purchase points to buy AI-generated images
          </p>
        </div>

        {/* Current Points Balance */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-center">
            <Coins className="h-8 w-8 text-indigo-600 mr-3" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.points || 0} Points
              </h2>
              <p className="text-gray-600">Your current balance</p>
            </div>
          </div>
        </div>

        {/* Points Packages */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Purchase Points
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pointsPackages.map((pkg) => {
              const IconComponent = pkg.icon;
              return (
                <div
                  key={pkg.id}
                  className={`relative bg-white rounded-lg shadow-sm p-6 ${
                    pkg.popular ? "ring-2 ring-indigo-600" : ""
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center">
                    <IconComponent className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {pkg.points}
                      </span>
                      {pkg.bonus && (
                        <span className="text-lg text-indigo-600 ml-1">
                          +{pkg.bonus}
                        </span>
                      )}
                      <span className="text-gray-600 ml-1">points</span>
                    </div>
                    <div className="mb-6">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(pkg.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => purchasePoints(pkg.id)}
                      disabled={purchasing === pkg.id}
                      className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                        pkg.popular
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {purchasing === pkg.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No transactions yet
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        transaction.amount > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount} points
                    </span>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
