import {
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
} from "lucide-react";

import StatCard from "../components/StatCard";

export default function SellerDashboardPage() {
  return (
    <div className="space-y-8">

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Products"
          value="128"
          icon={Package}
          color="bg-blue-600"
          change="+8 this month"
        />

        <StatCard
          title="Orders"
          value="542"
          icon={ShoppingCart}
          color="bg-green-600"
          change="+24 today"
        />

        <StatCard
          title="Customers"
          value="1,245"
          icon={Users}
          color="bg-purple-600"
          change="+52 this week"
        />

        <StatCard
          title="Revenue"
          value="₹1,84,250"
          icon={IndianRupee}
          color="bg-orange-600"
          change="+18%"
        />

      </div>

      {/* Bottom Section */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">

        {/* Recent Orders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold text-white">
            Recent Orders
          </h2>

          <div className="space-y-4">

            <div className="flex items-center justify-between rounded-xl bg-slate-800 p-4">
              <div>
                <p className="font-medium text-white">
                  #ORD-1001
                </p>

                <p className="text-sm text-slate-400">
                  Smart Watch
                </p>
              </div>

              <span className="font-semibold text-green-400">
                ₹2,999
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-800 p-4">
              <div>
                <p className="font-medium text-white">
                  #ORD-1002
                </p>

                <p className="text-sm text-slate-400">
                  Bluetooth Speaker
                </p>
              </div>

              <span className="font-semibold text-green-400">
                ₹1,499
              </span>
            </div>

          </div>

        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="mb-5 text-xl font-semibold text-white">
            Quick Actions
          </h2>

          <div className="grid gap-4">

            <button className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-500">
              Add Product
            </button>

            <button className="rounded-xl bg-green-600 px-5 py-3 text-white hover:bg-green-500">
              Start Live Selling
            </button>

            <button className="rounded-xl bg-purple-600 px-5 py-3 text-white hover:bg-purple-500">
              View Analytics
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}