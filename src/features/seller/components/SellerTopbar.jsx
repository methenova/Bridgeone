import NotificationsDropdown from "@/components/common/Notifications/NotificationsDropdown";

export default function SellerTopbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-8">
      <h1 className="text-xl font-semibold text-white">
        Seller Dashboard
      </h1>

      <div className="flex items-center gap-4">
        <NotificationsDropdown />

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
          S
        </div>
      </div>
    </header>
  );
}