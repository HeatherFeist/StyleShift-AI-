
import React, { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, useRef, useState } from 'react';
import { CartItem, OrderStatus } from '../types';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 focus:ring-indigo-500 border border-transparent",
    secondary: "bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/30 focus:ring-pink-500 border border-transparent",
    outline: "bg-transparent border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white focus:ring-gray-500",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-gray-800",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 focus:ring-green-500 border border-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// --- Select ---
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

export const SelectGroup: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative">
        <select 
          className="appearance-none w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

// --- Card Components ---
export const Card: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: ReactNode }> = ({ title, subtitle, action }) => (
  <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/30 flex justify-between items-center">
    <div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

// --- Alert ---
interface AlertProps {
  type: 'error' | 'success';
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type, message }) => {
  const bg = type === 'error' ? 'bg-red-900/50' : 'bg-green-900/50';
  const border = type === 'error' ? 'border-red-700' : 'border-green-700';
  const text = type === 'error' ? 'text-red-200' : 'text-green-200';
  
  return (
    <div className={`${bg} border ${border} ${text} px-4 py-3 rounded-lg text-sm flex items-start`}>
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {type === 'error' ? (
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        ) : (
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        )}
      </svg>
      <span>{message}</span>
    </div>
  );
};

// --- MiniFileUpload ---
interface MiniFileUploadProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const MiniFileUpload: React.FC<MiniFileUploadProps> = ({ label, file, onFileChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
        {file && (
          <button 
            onClick={() => onFileChange(null)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>
      
      <div 
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex items-center justify-center border-2 border-dashed rounded-lg p-3 cursor-pointer transition-colors
          ${file ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}
        `}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files?.[0]) onFileChange(e.target.files[0]);
          }}
        />
        
        {file ? (
          <div className="flex items-center space-x-2 overflow-hidden w-full">
            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="text-sm text-indigo-200 truncate">{file.name}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-gray-500">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
             <span className="text-xs">Upload Reference Image</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ProductCard ---
interface ProductCardProps {
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl?: string;
  supplierSku?: string;
  purchaseUrl?: string;
  onTryOn: () => void;
  onAddToCart: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  description, 
  category, 
  imageUrl, 
  supplierSku,
  onTryOn,
  onAddToCart
}) => {
  return (
    <div className="group bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-indigo-500 transition-colors flex flex-col h-full">
      <div className="h-28 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-600 via-gray-900 to-black"></div>
            <svg className="w-8 h-8 text-gray-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {category === 'makeup' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              )}
            </svg>
          </>
        )}
        <div className="absolute bottom-0 right-0 bg-black/70 px-2 py-0.5 rounded-tl-lg">
          <span className="text-xs font-mono text-green-400 font-bold">${price}</span>
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <div className="mb-1">
           <h4 className="text-sm font-semibold text-white leading-tight line-clamp-1">{name}</h4>
           {supplierSku && (
             <p className="text-[10px] text-gray-500 font-mono mt-0.5">SKU: {supplierSku}</p>
           )}
        </div>
        
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 flex-1">{description}</p>
        
        <div className="flex gap-2 mt-auto">
          <button 
            onClick={onTryOn}
            className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs py-1.5 rounded transition-colors border border-indigo-500/30 font-medium"
          >
            Try On
          </button>
          
          <button 
            onClick={onAddToCart}
            className="flex-1 bg-gray-100 hover:bg-white text-gray-900 text-xs py-1.5 rounded text-center transition-colors font-bold flex items-center justify-center shadow-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ClosetItemCard ---
interface ClosetItemProps {
  name: string;
  description: string;
  category: string;
  onWear: () => void;
  onDelete: () => void;
}

export const ClosetItemCard: React.FC<ClosetItemProps> = ({ name, description, category, onWear, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg group hover:border-pink-500/50 transition-colors">
    <div className="flex items-center space-x-3 overflow-hidden">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${category === 'outfit' ? 'bg-pink-900/50 text-pink-400' : 'bg-purple-900/50 text-purple-400'}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-white truncate">{name}</h4>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <button 
        onClick={onWear}
        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
      >
        Wear
      </button>
      <button 
        onClick={onDelete}
        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  </div>
);

// --- Tabs ---
interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg mb-4">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`
          flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200
          ${activeTab === tab.id 
            ? 'bg-gray-700 text-white shadow-sm' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }
        `}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// --- Cart Sidebar ---
interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  orderStatus: OrderStatus;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  onCheckout, 
  orderStatus 
}) => {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  // Status Step Helper
  const Step = ({ active, completed, label }: { active: boolean, completed: boolean, label: string }) => (
    <div className={`flex items-center space-x-2 ${active || completed ? 'text-white' : 'text-gray-600'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
        completed ? 'bg-green-500 border-green-500' : active ? 'border-indigo-500 text-indigo-500' : 'border-gray-600'
      }`}>
        {completed ? '✓' : ''}
      </div>
      <span className="text-xs font-medium">{label}</span>
      {active && <span className="animate-pulse ml-2 text-indigo-400 text-xs">...</span>}
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
             <h2 className="text-lg font-bold text-white flex items-center">
               <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
               Your Bag ({cartItems.length})
             </h2>
             <button onClick={onClose} className="text-gray-500 hover:text-white p-2">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {orderStatus === OrderStatus.IDLE ? (
              <>
                 {cartItems.length > 0 ? (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.cartId} className="flex gap-4 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                        <div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                             <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-1">No Image</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">SKU: {item.supplierSku || 'N/A'}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm font-bold text-green-400">${item.price}</span>
                            <button onClick={() => onRemoveItem(item.cartId)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                      <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                      <p>Your bag is empty.</p>
                      <Button variant="outline" onClick={onClose} className="mt-4">Start Shopping</Button>
                   </div>
                 )}
              </>
            ) : (
              // Order Processing Status View
              <div className="space-y-6 animate-fade-in">
                 <div className="text-center mb-8">
                   <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   </div>
                   <h3 className="text-xl font-bold text-white">Order Processing</h3>
                   <p className="text-sm text-gray-400">Sit tight, we're automating your shipment.</p>
                 </div>

                 <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-5">
                    <Step 
                      label="Payment Processing" 
                      active={orderStatus === OrderStatus.PROCESSING_PAYMENT} 
                      completed={orderStatus !== OrderStatus.PROCESSING_PAYMENT}
                    />
                    <Step 
                      label="Order Sent to Supplier System" 
                      active={orderStatus === OrderStatus.SENDING_TO_SUPPLIER} 
                      completed={[OrderStatus.SUPPLIER_CONFIRMED, OrderStatus.SHIPPED].includes(orderStatus)}
                    />
                    <Step 
                      label="Supplier Confirmation Received" 
                      active={orderStatus === OrderStatus.SUPPLIER_CONFIRMED} 
                      completed={orderStatus === OrderStatus.SHIPPED}
                    />
                    <Step 
                      label="Shipped to Buyer" 
                      active={false} 
                      completed={orderStatus === OrderStatus.SHIPPED}
                    />
                 </div>

                 {orderStatus === OrderStatus.SHIPPED && (
                   <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center animate-fade-in">
                      <p className="text-green-300 font-medium mb-1">Success!</p>
                      <p className="text-xs text-green-400/80">Your order has been automatically routed and shipped.</p>
                      <Button onClick={onClose} className="mt-4 w-full" variant="success">Continue Shopping</Button>
                   </div>
                 )}
              </div>
            )}

          </div>

          {/* Footer */}
          {cartItems.length > 0 && orderStatus === OrderStatus.IDLE && (
            <div className="bg-gray-800 p-6 border-t border-gray-700">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-gray-400">Subtotal</span>
                 <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
               </div>
               <Button onClick={onCheckout} className="w-full h-12 text-lg shadow-xl shadow-indigo-900/20">
                 Pay Now
               </Button>
               <p className="text-[10px] text-gray-500 text-center mt-3">
                 Secure checkout powered by Stripe. Orders are automatically fulfilled.
               </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
