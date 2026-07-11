import { X, Printer } from "lucide-react";

export default function CustomerInvoiceModal({ isOpen, order, onClose }) {
  if (!isOpen || !order) return null;

  const invoiceDate = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subtotal = Number(order.subtotal);
  const delivery = Number(order.delivery_fee);
  const discount = Number(order.discount);
  const total = Number(order.total);
  const tax = Math.round(subtotal * 0.18); // GST included

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:p-0">
      {/* Container */}
      <div className="relative flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl print:h-auto print:max-h-none print:border-none print:bg-white print:shadow-none">
        
        {/* Modal Controls (Hidden on Print) */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 print:hidden">
          <h3 className="text-lg font-bold text-slate-900">Download Invoice</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900"
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
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">B</div>
                <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                  BridgeOne Marketplace
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Live Video Commerce India
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold uppercase tracking-wider text-slate-500">Retail Tax Invoice</h2>
              <p className="text-xs text-slate-500 mt-1">Invoice Date: {invoiceDate}</p>
              <p className="text-xs text-slate-500">Invoice No: B1-INV-{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-slate-500">Order ID: #{order.id.toUpperCase()}</p>
            </div>
          </div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-200 py-6 mb-8 text-sm">
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">Billed To</h4>
              {order.addresses ? (
                <>
                  <p className="font-semibold text-slate-900">{order.addresses.name}</p>
                  <p className="text-slate-500 mt-0.5">{order.addresses.phone}</p>
                  <p className="text-slate-500 mt-0.5">
                    {order.addresses.address_line1}
                    {order.addresses.address_line2 ? `, ${order.addresses.address_line2}` : ""}
                    <br />
                    {order.addresses.city}, {order.addresses.state} — {order.addresses.pincode}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Guest Profile</p>
              )}
            </div>
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">Payment Info</h4>
              <p className="text-slate-500">Method: <span className="font-semibold text-slate-900 capitalize">{order.payment_method}</span></p>
              {order.payment_id && (
                <p className="text-slate-500 mt-0.5">Txn ID: <span className="font-mono text-slate-900">{order.payment_id}</span></p>
              )}
              <p className="text-slate-500 mt-0.5">Status: <span className="font-semibold text-emerald-600">PAID</span></p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse mb-8 text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-600 font-bold uppercase tracking-wider text-xs">
                <th className="py-2.5">Item Details</th>
                <th className="py-2.5">Shop / Vendor</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Qty</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.order_items?.map((item) => {
                const itemPrice = item.discount_price ? Number(item.discount_price) : Number(item.price);
                return (
                  <tr key={item.id} className="text-slate-800">
                    <td className="py-3 font-medium">
                      {item.products?.name || "—"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {item.shops?.name || "BridgeOne Seller"}
                    </td>
                    <td className="py-3 text-right">₹{itemPrice.toLocaleString()}</td>
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
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
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
              <div className="flex justify-between border-t-2 border-slate-300 pt-2.5 text-base font-bold text-slate-900">
                <span>Total Amount Paid</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="mt-16 text-center text-xs text-slate-500 border-t border-slate-100 pt-6">
            <p>This is a system-generated official receipt for your BridgeOne marketplace order.</p>
            <p className="mt-0.5">Thank you for your purchase!</p>
          </div>

        </div>

      </div>
    </div>
  );
}
