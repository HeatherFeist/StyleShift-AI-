
import React, { useState, useRef, useEffect } from 'react';
import { 
  ProcessingStatus, 
  EditOptions, 
  SavedStyle,
  ClosetItem,
  Product,
  CartItem,
  OrderStatus,
  HAIR_COLORS, 
  HAIR_STYLES, 
  MAKEUP_LOOKS, 
  OUTFIT_STYLES, 
  BACKGROUNDS,
  RESOLUTION_OPTIONS,
  STYLE_STRENGTH_OPTIONS,
  MOCK_PRODUCTS
} from './types';
import { generateEditedImage, generateOutfitPreview } from './services/geminiService';
import { Button, SelectGroup, Card, CardHeader, CardContent, Alert, MiniFileUpload, Tabs, ProductCard, ClosetItemCard, CartSidebar } from './components/UIComponents';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('studio');

  // Customizable Lists
  const [availableOutfits, setAvailableOutfits] = useState<string[]>(OUTFIT_STYLES);

  // Outfit Creator State
  const [showOutfitCreator, setShowOutfitCreator] = useState(false);
  const [outfitPrompt, setOutfitPrompt] = useState('');
  const [outfitPreviewUrl, setOutfitPreviewUrl] = useState<string | null>(null);
  const [isGeneratingOutfit, setIsGeneratingOutfit] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.IDLE);

  // Shop Search State
  const [shopSearchQuery, setShopSearchQuery] = useState('');

  // Styling Options State
  const INITIAL_OPTIONS: EditOptions = {
    hairColor: 'No Change',
    hairStyle: 'No Change',
    makeupLook: 'No Change',
    outfit: 'No Change',
    background: 'No Change',
    customPrompt: '',
    resolution: 'Standard',
    styleStrength: 'Balanced',
    hairReference: null,
    makeupReference: null,
    outfitReference: null,
  };

  const [options, setOptions] = useState<EditOptions>(INITIAL_OPTIONS);
  
  // History State for Undo/Redo
  const [history, setHistory] = useState<EditOptions[]>([INITIAL_OPTIONS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Saved Styles & Closet State
  const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [newStyleName, setNewStyleName] = useState('');
  const [isSavingStyle, setIsSavingStyle] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved styles and closet from local storage on mount
  useEffect(() => {
    const storedStyles = localStorage.getItem('styleShift_savedStyles');
    if (storedStyles) {
      try {
        setSavedStyles(JSON.parse(storedStyles));
      } catch (e) { console.error(e); }
    }
    
    const storedCloset = localStorage.getItem('styleShift_closet');
    if (storedCloset) {
      try {
        setClosetItems(JSON.parse(storedCloset));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setGeneratedImage(null);
      setStatus(ProcessingStatus.IDLE);
      setErrorMsg(null);
    }
  };

  const handleOptionChange = (key: keyof EditOptions, value: string | File | null) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newOptions);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setOptions(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setOptions(history[newIndex]);
    }
  };

  const saveCurrentStyle = () => {
    if (!newStyleName.trim()) return;
    const styleToSave: SavedStyle = {
      id: Date.now().toString(),
      name: newStyleName.trim(),
      options: { 
        ...options,
        hairReference: null, 
        makeupReference: null, 
        outfitReference: null 
      },
      createdAt: Date.now()
    };
    const updatedStyles = [...savedStyles, styleToSave];
    setSavedStyles(updatedStyles);
    localStorage.setItem('styleShift_savedStyles', JSON.stringify(updatedStyles));
    setNewStyleName('');
    setIsSavingStyle(false);
  };

  const loadSavedStyle = (style: SavedStyle) => {
    const optionsToLoad = {
      ...style.options,
      hairReference: options.hairReference,
      makeupReference: options.makeupReference,
      outfitReference: options.outfitReference
    };
    setOptions(optionsToLoad);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(optionsToLoad);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const deleteSavedStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedStyles = savedStyles.filter(s => s.id !== id);
    setSavedStyles(updatedStyles);
    localStorage.setItem('styleShift_savedStyles', JSON.stringify(updatedStyles));
  };

  // --- Closet Functions ---
  const addToCloset = () => {
    if (options.outfit === 'No Change') return;
    
    const newItem: ClosetItem = {
      id: Date.now().toString(),
      name: options.outfit,
      description: options.outfit,
      category: 'outfit',
      addedAt: Date.now()
    };
    
    // Check if already exists
    if (!closetItems.find(i => i.name === newItem.name)) {
      const updatedCloset = [...closetItems, newItem];
      setClosetItems(updatedCloset);
      localStorage.setItem('styleShift_closet', JSON.stringify(updatedCloset));
    }
    setActiveTab('closet');
  };

  const deleteClosetItem = (id: string) => {
    const updatedCloset = closetItems.filter(i => i.id !== id);
    setClosetItems(updatedCloset);
    localStorage.setItem('styleShift_closet', JSON.stringify(updatedCloset));
  };

  const wearClosetItem = (item: ClosetItem) => {
    if (item.category === 'outfit') {
      handleOptionChange('outfit', item.description);
      // Ensure the option exists in the dropdown if it was custom
      if (!OUTFIT_STYLES.includes(item.description) && !availableOutfits.includes(item.description)) {
        setAvailableOutfits(prev => [item.description, ...prev]);
      }
    } else if (item.category === 'makeup') {
      handleOptionChange('makeupLook', item.description);
    }
    setActiveTab('studio');
  };

  // --- Shop & Cart Functions ---
  const handleTryOnProduct = (product: Product) => {
    if (product.category === 'outfit') {
      // Add to available styles first if not present
      if (!availableOutfits.includes(product.styleValue)) {
        setAvailableOutfits(prev => [product.styleValue, ...prev]);
      }
      handleOptionChange('outfit', product.styleValue);
    } else if (product.category === 'makeup') {
       handleOptionChange('makeupLook', product.styleValue);
    }
    setActiveTab('studio');
  };

  const addToCart = (product: Product) => {
    const newItem: CartItem = {
      ...product,
      cartId: Date.now().toString(),
      quantity: 1
    };
    setCart(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handleCheckout = () => {
    // Start automated backend flow simulation
    setOrderStatus(OrderStatus.PROCESSING_PAYMENT);
    
    // Simulate Payment
    setTimeout(() => {
      setOrderStatus(OrderStatus.PAYMENT_CONFIRMED);
      
      // Simulate Sending Order to Supplier
      setTimeout(() => {
        setOrderStatus(OrderStatus.SENDING_TO_SUPPLIER);
        
        // Simulate Supplier Confirmation
        setTimeout(() => {
           setOrderStatus(OrderStatus.SUPPLIER_CONFIRMED);
           
           // Simulate Shipping
           setTimeout(() => {
             setOrderStatus(OrderStatus.SHIPPED);
             
             // Clear Cart after successful flow
             setTimeout(() => {
                setCart([]);
             }, 3000);
           }, 2000);
        }, 2000);
      }, 1500);
    }, 2000);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    // Reset status only if completed so user sees animation
    if (orderStatus === OrderStatus.SHIPPED) {
      setTimeout(() => setOrderStatus(OrderStatus.IDLE), 500);
    }
  };

  // Filter Products based on search
  const filteredProducts = MOCK_PRODUCTS.filter(product => 
    product.name.toLowerCase().includes(shopSearchQuery.toLowerCase()) || 
    product.category.toLowerCase().includes(shopSearchQuery.toLowerCase())
  );


  // --- Iterative Editing ---
  const handleContinueEditing = async () => {
    if (!generatedImage) return;
    
    try {
      // Convert Data URL to File
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const newFile = new File([blob], "edited-result.png", { type: "image/png" });
      
      setFile(newFile);
      setPreviewUrl(URL.createObjectURL(newFile));
      setGeneratedImage(null);
      
      // We keep the options as is, or maybe reset them?
      // Resetting options makes sense so they don't apply the same transform again on top.
      setOptions({
        ...INITIAL_OPTIONS,
        resolution: options.resolution, // keep technical settings
        styleStrength: options.styleStrength
      });
      setHistory([{...INITIAL_OPTIONS}]);
      setHistoryIndex(0);
      
      setStatus(ProcessingStatus.IDLE);
    } catch (e) {
      console.error("Error converting generated image for editing:", e);
      setErrorMsg("Failed to prepare image for further editing.");
    }
  };

  const handleApiKeySelect = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      }
    } catch (e) {
      console.error("Failed to open API key selector", e);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setErrorMsg("Please upload a selfie first.");
      return;
    }

    if (options.resolution === 'High (Pro)') {
      try {
        if (window.aistudio) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          if (!hasKey) {
            await window.aistudio.openSelectKey();
          }
        }
      } catch (e) { console.warn(e); }
    }

    setStatus(ProcessingStatus.GENERATING);
    setErrorMsg(null);

    try {
      const resultImageUrl = await generateEditedImage(file, options);
      setGeneratedImage(resultImageUrl);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (err: any) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg(err.message || "Failed to generate image. Please try again.");
    }
  };

  const handleGenerateOutfitPreview = async () => {
    if (!outfitPrompt.trim()) return;
    setIsGeneratingOutfit(true);
    setErrorMsg(null);
    try {
      const url = await generateOutfitPreview(outfitPrompt);
      setOutfitPreviewUrl(url);
    } catch (err: any) {
      setErrorMsg("Failed to generate outfit preview: " + (err.message || "Unknown error"));
    } finally {
      setIsGeneratingOutfit(false);
    }
  };

  const handleConfirmOutfit = () => {
    if (!outfitPrompt.trim()) return;
    const newStyle = outfitPrompt.trim();
    setAvailableOutfits(prev => {
      if (prev.includes(newStyle)) return prev;
      return [newStyle, ...prev];
    });
    handleOptionChange('outfit', newStyle);
    setShowOutfitCreator(false);
    setOutfitPrompt('');
    setOutfitPreviewUrl(null);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err: any) {
      setErrorMsg("Could not access camera. " + err.message);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie-capture.png", { type: "image/png" });
            setFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setGeneratedImage(null);
            setStatus(ProcessingStatus.IDLE);
            stopCamera();
          }
        }, 'image/png');
      }
    }
  };

  const resetAll = () => {
    stopCamera();
    setFile(null);
    setPreviewUrl(null);
    setGeneratedImage(null);
    setStatus(ProcessingStatus.IDLE);
    setOptions(INITIAL_OPTIONS);
    setHistory([INITIAL_OPTIONS]);
    setHistoryIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cartItems={cart}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        orderStatus={orderStatus}
      />

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                StyleShift AI
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <Button variant="outline" onClick={handleApiKeySelect} className="text-xs px-3 py-1.5 h-8 border-gray-700">
                <span className="mr-2">🔑</span> API Key
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 1. Upload Section */}
            <Card>
              <CardHeader title="1. Upload Selfie" subtitle="Choose a clear photo of your face." />
              <CardContent>
                 <div className="flex items-center justify-center w-full flex-col">
                    {isCameraOpen ? (
                      <div className="w-full flex flex-col items-center space-y-4 animate-fade-in">
                        <div className="relative w-full rounded-lg overflow-hidden bg-black border border-gray-700 aspect-video">
                           <video 
                             ref={videoRef} 
                             autoPlay 
                             playsInline 
                             muted 
                             className="w-full h-full object-cover transform scale-x-[-1]"
                           />
                        </div>
                        <div className="flex space-x-3 w-full">
                          <Button 
                            onClick={capturePhoto} 
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
                          >
                             Capture
                          </Button>
                          <Button variant="ghost" onClick={stopCamera}>Cancel</Button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    ) : (
                      <>
                        <label 
                          htmlFor="dropzone-file" 
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${file ? 'border-indigo-500 bg-indigo-900/10' : 'border-gray-700 hover:border-indigo-500 hover:bg-gray-800'}`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                  <>
                                    <svg className="w-8 h-8 mb-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                    <p className="text-sm text-gray-300 font-medium truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs text-indigo-400 mt-1">Click to change</p>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    <p className="text-sm text-gray-400"><span className="font-semibold text-indigo-400">Click to upload</span></p>
                                  </>
                                )}
                            </div>
                            <input 
                              id="dropzone-file" 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileChange}
                              ref={fileInputRef}
                            />
                        </label>
                        
                        <div className="relative flex items-center py-4 w-full">
                           <div className="flex-grow border-t border-gray-700"></div>
                           <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase font-medium">Or</span>
                           <div className="flex-grow border-t border-gray-700"></div>
                        </div>

                        <Button 
                           variant="secondary" 
                           onClick={startCamera} 
                           className="w-full flex items-center justify-center"
                        >
                           <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                           Take a Selfie
                        </Button>
                      </>
                    )}
                </div> 
              </CardContent>
            </Card>

            {/* 2. Styling Hub */}
            <Card className={!file ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader 
                title="2. Customize Style" 
                subtitle="Design your look or shop the trends." 
                action={
                  <div className="flex space-x-1">
                    <button onClick={undo} disabled={historyIndex === 0} className="p-1.5 text-gray-400 hover:text-white rounded-md disabled:opacity-30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    </button>
                    <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-1.5 text-gray-400 hover:text-white rounded-md disabled:opacity-30">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
                    </button>
                  </div>
                }
              />
              <CardContent>
                <Tabs 
                   tabs={[
                     { id: 'studio', label: 'Studio' },
                     { id: 'closet', label: 'My Closet' },
                     { id: 'shop', label: 'Shop' }
                   ]}
                   activeTab={activeTab}
                   onTabChange={setActiveTab}
                />

                {/* --- STUDIO TAB --- */}
                {activeTab === 'studio' && (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Saved Styles Section */}
                    <div className="pb-4 border-b border-gray-800">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Saved Presets</h4>
                        <button 
                          onClick={() => setIsSavingStyle(!isSavingStyle)} 
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                          Save Current
                        </button>
                      </div>
                      
                      {isSavingStyle && (
                        <div className="flex gap-2 mb-3 animate-fade-in">
                           <input 
                             type="text" 
                             value={newStyleName}
                             onChange={(e) => setNewStyleName(e.target.value)}
                             placeholder="Name (e.g., Summer Vibe)"
                             className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:ring-1 focus:ring-indigo-500"
                             onKeyDown={(e) => e.key === 'Enter' && saveCurrentStyle()}
                           />
                           <Button variant="primary" className="px-3 py-1 text-xs" onClick={saveCurrentStyle}>Save</Button>
                        </div>
                      )}

                      {savedStyles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {savedStyles.map(style => (
                            <div 
                              key={style.id} 
                              onClick={() => loadSavedStyle(style)}
                              className="group relative px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 hover:text-white cursor-pointer transition-colors"
                            >
                              {style.name}
                              <button onClick={(e) => deleteSavedStyle(style.id, e)} className="ml-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 italic">No saved styles yet.</p>
                      )}
                    </div>

                    {/* Quality */}
                    <div className="grid grid-cols-2 gap-4">
                      <SelectGroup label="Resolution" options={RESOLUTION_OPTIONS} value={options.resolution} onChange={(e) => handleOptionChange('resolution', e.target.value)} />
                      <SelectGroup label="Style Strength" options={STYLE_STRENGTH_OPTIONS} value={options.styleStrength} onChange={(e) => handleOptionChange('styleStrength', e.target.value)} />
                    </div>

                    {/* Hair */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center space-x-2 pb-1 border-b border-gray-800">
                         <span className="text-indigo-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                         </span>
                         <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Hair & Makeup</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <SelectGroup label="Hair Color" options={HAIR_COLORS} value={options.hairColor} onChange={(e) => handleOptionChange('hairColor', e.target.value)} disabled={!!options.hairReference} />
                        <SelectGroup label="Hair Style" options={HAIR_STYLES} value={options.hairStyle} onChange={(e) => handleOptionChange('hairStyle', e.target.value)} disabled={!!options.hairReference} />
                      </div>
                      <MiniFileUpload label="Or Upload Hair Ref" file={options.hairReference} onFileChange={(f) => handleOptionChange('hairReference', f)} />
                      
                      <div className="pt-2">
                        <SelectGroup label="Makeup Look" options={MAKEUP_LOOKS} value={options.makeupLook} onChange={(e) => handleOptionChange('makeupLook', e.target.value)} disabled={!!options.makeupReference} />
                        <MiniFileUpload label="Or Upload Makeup Ref" file={options.makeupReference} onFileChange={(f) => handleOptionChange('makeupReference', f)} />
                      </div>
                    </div>

                    {/* Outfit */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between pb-1 border-b border-gray-800">
                         <div className="flex items-center space-x-2">
                           <span className="text-pink-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                           </span>
                           <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Outfit & Scene</h4>
                         </div>
                         <button onClick={addToCloset} className="text-xs text-pink-400 hover:text-pink-300 font-medium">+ Add to Closet</button>
                      </div>
                      
                      <div>
                        <SelectGroup label="Outfit Style" options={availableOutfits} value={options.outfit} onChange={(e) => handleOptionChange('outfit', e.target.value)} disabled={!!options.outfitReference} />
                        <MiniFileUpload label="Or Upload Outfit Ref" file={options.outfitReference} onFileChange={(f) => handleOptionChange('outfitReference', f)} />
                        
                        {!options.outfitReference && (
                          <>
                            <button onClick={() => setShowOutfitCreator(!showOutfitCreator)} className="text-xs text-pink-400 hover:text-pink-300 mt-2 flex items-center space-x-1 font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                              <span>Create Custom Outfit</span>
                            </button>
                            {showOutfitCreator && (
                              <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-2 animate-fade-in">
                                <textarea className="w-full bg-black/30 border border-gray-600 rounded p-2 text-xs text-white" placeholder="Describe outfit..." value={outfitPrompt} onChange={(e) => setOutfitPrompt(e.target.value)} />
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="flex-1 text-xs py-1" onClick={handleGenerateOutfitPreview} disabled={isGeneratingOutfit || !outfitPrompt.trim()} isLoading={isGeneratingOutfit}>Visualize</Button>
                                </div>
                                {outfitPreviewUrl && (
                                  <div className="space-y-2">
                                    <div className="relative aspect-square rounded overflow-hidden border border-gray-600"><img src={outfitPreviewUrl} className="w-full h-full object-cover" /></div>
                                    <Button variant="primary" className="w-full text-xs py-1" onClick={handleConfirmOutfit}>Use This</Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <SelectGroup label="Background" options={BACKGROUNDS} value={options.background} onChange={(e) => handleOptionChange('background', e.target.value)} />
                    </div>

                    <div className="pt-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Custom Instructions</label>
                        <textarea className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm h-16 resize-none" placeholder="e.g. Add silver hoop earrings..." value={options.customPrompt} onChange={(e) => handleOptionChange('customPrompt', e.target.value)} />
                    </div>
                  </div>
                )}

                {/* --- CLOSET TAB --- */}
                {activeTab === 'closet' && (
                  <div className="space-y-3 animate-fade-in min-h-[300px]">
                     {closetItems.length > 0 ? (
                       closetItems.map(item => (
                         <ClosetItemCard 
                           key={item.id} 
                           name={item.name} 
                           description={item.description} 
                           category={item.category}
                           onWear={() => wearClosetItem(item)}
                           onDelete={() => deleteClosetItem(item.id)}
                         />
                       ))
                     ) : (
                       <div className="text-center py-10 text-gray-500">
                         <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                         <p className="text-sm">Your closet is empty.</p>
                         <p className="text-xs mt-1">Add items from the Studio or Shop.</p>
                       </div>
                     )}
                  </div>
                )}

                {/* --- SHOP TAB --- */}
                {activeTab === 'shop' && (
                  <div className="space-y-3 animate-fade-in min-h-[300px]">
                    <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg leading-5 bg-gray-900 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 sm:text-sm transition-colors"
                        placeholder="Search products..."
                        value={shopSearchQuery}
                        onChange={(e) => setShopSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredProducts.map(product => (
                        <ProductCard 
                          key={product.id}
                          name={product.name}
                          price={product.price}
                          category={product.category}
                          description={product.description}
                          imageUrl={product.imageUrl}
                          supplierSku={product.supplierSku}
                          purchaseUrl={product.purchaseUrl}
                          onTryOn={() => handleTryOnProduct(product)}
                          onAddToCart={() => addToCart(product)}
                        />
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-gray-500">
                          <p>No products found matching "{shopSearchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>

            <div className={!file ? 'opacity-50 pointer-events-none' : ''}>
               {errorMsg && <div className="mb-4"><Alert type="error" message={errorMsg} /></div>}
               <Button onClick={handleGenerate} className="w-full h-12 text-lg" isLoading={status === ProcessingStatus.GENERATING} disabled={status === ProcessingStatus.GENERATING}>
                {status === ProcessingStatus.GENERATING ? 'Transforming...' : 'Generate New Look'}
              </Button>
            </div>
          </div>

          {/* Right Column: Preview Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-2 min-h-[600px] flex flex-col relative overflow-hidden">
               <div className="absolute top-4 right-4 z-10 flex space-x-2">
                 {generatedImage && <Button variant="outline" className="bg-black/50 backdrop-blur" onClick={resetAll}>Start Over</Button>}
               </div>

               <div className="flex-1 flex flex-col md:flex-row gap-2 h-full">
                  <div className={`relative flex-1 bg-black rounded-xl overflow-hidden transition-all duration-500 ${generatedImage ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'}`}>
                      {previewUrl ? (
                         <img src={previewUrl} alt="Original" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col text-gray-600">
                          <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                          <p>Upload an image to start</p>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm">Original</div>
                  </div>

                  {generatedImage && (
                    <div className="relative flex-1 bg-black rounded-xl overflow-hidden animate-fade-in h-1/2 md:h-full md:w-1/2 group">
                       <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                       <div className="absolute bottom-4 left-4 bg-indigo-600/90 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-lg shadow-indigo-500/20">AI Styled</div>
                       
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 backdrop-blur-[1px]">
                          <a href={generatedImage} download="styleshift-result.png" className="p-3 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-colors transform hover:scale-110" title="Download">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          </a>
                          <button onClick={handleContinueEditing} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors transform hover:scale-110" title="Edit this Result">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                       </div>
                    </div>
                  )}

                  {status === ProcessingStatus.GENERATING && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                        <div className="relative w-24 h-24">
                           <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full"></div>
                           <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-6 text-xl font-medium text-white animate-pulse">Designing your new look...</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Hint / Call to Action */}
            {generatedImage && (
               <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                     <span className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                     </span>
                     <div>
                       <h5 className="font-medium text-white text-sm">Love this look?</h5>
                       <p className="text-xs text-gray-400">Click the edit button on the image to refine it further, or check the Shop tab to buy matching items.</p>
                     </div>
                  </div>
                  <Button variant="ghost" onClick={() => setActiveTab('shop')} className="text-indigo-400 hover:text-white">Go to Shop &rarr;</Button>
               </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
