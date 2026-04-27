import React, { useState } from "react";

const Billing = () => {
  const [cart, setCart] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h1 className="text-3xl font-black text-slate-900">
              POS Terminal
            </h1>
            <p className="text-slate-400 mt-1">
              Improved alignment layout
            </p>
          </div>

          {/* Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="h-40 bg-slate-100 rounded-2xl mb-4"></div>
                <h3 className="font-bold text-lg">
                  Product {item}
                </h3>
                <p className="text-slate-400 text-sm">
                  Category
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="font-black text-xl">
                    ₹999
                  </span>

                  <button
                    onClick={() =>
                      setCart((prev) => [
                        ...prev,
                        item
                      ])
                    }
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="h-fit sticky top-6 bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-black">
              Active Bill
            </h2>
            <p className="text-slate-400 text-sm">
              Perfect aligned checkout
            </p>
          </div>

          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                No Items Added
              </div>
            ) : (
              cart.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50"
                >
                  Product {item}
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t bg-slate-50 space-y-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>
                ₹{cart.length * 999}
              </span>
            </div>

            <button className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold">
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
