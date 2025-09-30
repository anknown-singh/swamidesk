import { MapPin, Phone, Mail, Pill, Heart, Laptop } from 'lucide-react';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  mrp: number;
}

interface CustomerDetails {
  name: string;
  address: string;
  phone: string;
  email?: string;
}

interface CompactPharmacyInvoiceProps {
  invoiceNumber: string;
  date: string;
  customerDetails: CustomerDetails;
  items: InvoiceItem[];
  copyType: 'pharmacy' | 'customer';
  discount?: number;
}

export function CompactPharmacyInvoice({
  invoiceNumber,
  date,
  customerDetails,
  items,
  copyType,
  discount = 0
}: CompactPharmacyInvoiceProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.mrp), 0);
  const gstRate = 0.12; // 12% GST
  const gstAmount = subtotal * gstRate;
  const discountAmount = discount;
  const total = subtotal + gstAmount - discountAmount;

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden relative border border-gray-200 print:shadow-none print:border-0">
      {/* Corner Copy Indicator */}
      <div className="absolute top-0 right-0 bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-medium rounded-bl-lg print:bg-black">
        {copyType === 'pharmacy' ? 'PHARMACY' : 'CUSTOMER'}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200 print:bg-white print:border-b print:border-gray-400">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="font-bold uppercase tracking-wider text-gray-900">SwamiCare Pharmacy</h1>
            <p className="text-sm text-gray-600 mt-1">Your Health, Our Priority</p>
            <div className="mt-3 text-xs text-gray-600 space-y-1">
              <p className="flex items-center">
                <MapPin className="w-3 h-3 mr-2" />
                123 Health Street, Medical District
              </p>
              <p className="flex items-center">
                <Phone className="w-3 h-3 mr-2" />
                City - 123456 | +91 98765 43210
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm print:shadow-none">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Invoice</p>
              <p className="font-bold text-gray-900 mt-1">{invoiceNumber}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2">{date}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
          <div className="text-xs">
            <p className="text-gray-500 uppercase tracking-wide">DL Number</p>
            <p className="font-medium text-gray-700">DL-MH-20-12345</p>
          </div>
          <div className="text-xs">
            <p className="text-gray-500 uppercase tracking-wide">GST Number</p>
            <p className="font-medium text-gray-700">27ABCDE1234F1Z5</p>
          </div>
          <div className="text-xs">
            <p className="text-gray-500 uppercase tracking-wide">FSSAI</p>
            <p className="font-medium text-gray-700">12345678901234</p>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Bill To</p>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">{customerDetails.name}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{customerDetails.address}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">Contact</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-700 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                {customerDetails.phone}
              </p>
              {customerDetails.email && (
                <p className="text-sm text-gray-600 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {customerDetails.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="px-6 py-4">
        <div className="mb-3 flex items-center">
          <Pill className="w-4 h-4 text-gray-700 mr-2" />
          <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Medical Items</h3>
        </div>

        <div className="overflow-hidden border border-gray-200 rounded-lg print:border-gray-400">
          <table className="w-full">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">#</th>
                <th className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Item Name</th>
                <th className="text-center py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Qty</th>
                <th className="text-center py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Exp Date</th>
                <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">MRP</th>
                <th className="text-right py-3 px-3 text-xs font-medium uppercase tracking-wider text-gray-500 print:border-b print:border-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 print:divide-gray-300">
              {items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                  <td className="py-3 px-3 text-sm text-gray-500 print:border-b print:border-gray-200">{index + 1}</td>
                  <td className="py-3 px-3 text-sm font-medium text-gray-900 print:border-b print:border-gray-200">{item.name}</td>
                  <td className="py-3 px-3 text-sm text-center text-gray-700 print:border-b print:border-gray-200">{item.quantity}</td>
                  <td className="py-3 px-3 text-sm text-center text-gray-600 print:border-b print:border-gray-200">{item.expiryDate}</td>
                  <td className="py-3 px-3 text-sm text-right text-gray-700 print:border-b print:border-gray-200">₹{item.mrp.toFixed(2)}</td>
                  <td className="py-3 px-3 text-sm text-right font-medium text-gray-900 print:border-b print:border-gray-200">₹{(item.quantity * item.mrp).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 print:bg-white print:border-t print:border-gray-400">
        <div className="flex justify-between items-start">
          <div className="text-xs text-gray-600 max-w-xs">
            <p className="flex items-center mb-1">
              <Heart className="w-3 h-3 mr-2" />
              Thank you for choosing SwamiCare Pharmacy!
            </p>
            <p className="text-gray-500">
              Terms: Medicines are not returnable. Please check expiry dates before use.
            </p>
          </div>

          <div className="min-w-[220px] bg-white rounded-lg border border-gray-200 p-4 shadow-sm print:shadow-none print:border-gray-400">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>TOTAL:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-100 text-center print:bg-white print:border-t print:border-gray-300">
        <p className="text-xs text-gray-500 flex items-center justify-center">
          <Laptop className="w-3 h-3 mr-1" />
          Computer generated invoice. No signature required.
          <span className="mx-2">•</span>
          <Phone className="w-3 h-3 mx-1" />
          For queries: +91 98765 43210
        </p>
      </div>
    </div>
  );
}