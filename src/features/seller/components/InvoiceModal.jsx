import { X, Printer } from "lucide-react";

export default function InvoiceModal({ isOpen, order, shop, onClose }) {
  if (!isOpen || !order) return null;

  const invoiceDate = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subtotal = order.shopSubtotal;
  const delivery = order.address ? (subtotal >= 499 ? 0 : 49) : 0;
  const tax = Math.round(subtotal * 0.18); // Simplified GST (18%) included
  const total = subtotal + delivery;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0">
      {/* Container */}
      <div className="relative flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl print:h-auto print:max-h-none print:border-none print:bg-white print:shadow-none">
        
        {/* Modal Controls (Hidden on Print) */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 print:hidden">
          <h3 className="text-lg font-bold text-slate-900">Tax Invoice</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Content */}
        <div className="flex-1 overflow-y-auto p-8 text-slate-900 bg-white print:overflow-visible print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                {shop?.name || "BridgeOne Vendor"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {shop?.city}, {shop?.state}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-500">Retail Invoice</h2>
              <p className="text-xs text-slate-500 mt-1">Invoice Date: {invoiceDate}</p>
              <p className="text-xs text-slate-500">Invoice No: INV-{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-slate-500">Order ID: #{order.id.toUpperCase()}</p>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-200 py-6 mb-8 text-sm">
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">Sold By</h4>
              <p className="font-semibold text-slate-900">{shop?.name || "BridgeOne Vendor"}</p>
              <p className="text-slate-500 mt-0.5">{shop?.city}, {shop?.state}</p>
              <p className="text-slate-500">Email: {shop?.email || "support@bridgeone.com"}</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">Shipping Address</h4>
              {order.address ? (
                <>
                  <p className="font-semibold text-slate-900">{order.address.name}</p>
                  <p className="text-slate-500 mt-0.5">{order.address.phone}</p>
                  <p className="text-slate-500 mt-0.5">
                    {order.address.address_line1}
                    {order.address.address_line2 ? `, ${order.address.address_line2}` : ""}
                    <br />
                    {order.address.city}, {order.address.state} — {order.address.pincode}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Guest Customer</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <th className="py-2.5">Product Description</th>
                <th className="py-2.5">SKU</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Qty</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item) => {
                const price = item.discountPrice ? Number(item.discountPrice) : Number(item.price);
                return (
                  <tr key={item.id} className="text-slate-800">
                    <td className="py-3 font-medium">{item.product?.name || "—"}</td>
                    <td className="py-3 font-mono text-xs text-slate-500">{item.product?.sku || "—"}</td>
                    <td className="py-3 text-right">₹{price.toLocaleString()}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right font-semibold">₹{item.total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Calculation breakdown */}
          <div className="flex justify-end text-sm">
            <div className="w-64 space-y-2.5">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18% Included)</span>
                <span className="font-semibold text-slate-900">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charges</span>
                <span className="font-semibold text-slate-900">
                  {delivery === 0 ? "FREE" : `₹${delivery}`}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-slate-200 pt-2.5 text-base font-bold text-slate-900">
                <span>Grand Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="mt-16 text-center text-xs text-slate-500 border-t border-slate-100 pt-6">
            <p>This is a computer-generated tax invoice. No signature required.</p>
            <p className="mt-0.5">Thank you for shopping with us!</p>
          </div>

        </div>

      </div>
    </div>
  );
}
