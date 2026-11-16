
import React, { useState, useRef, useEffect } from 'react';
import { 
  ProcessingStatus, 
  EditOptions, 
  ClosetItem,
  Product,
  CartItem,
  OrderStatus,
  HAIR_COLORS, 
  HAIR_STYLES, 
  MAKEUP_LOOKS,
  LIP_COLORS,
  BLUSH_COLORS,
  EYESHADOW_COLORS,
  EYESHADOW_STYLES,
  EYELINER_STYLES,
  EYELASH_STYLES,
  CONTOUR_COLORS,
  CONTOUR_MODES,
  OUTFIT_STYLES, 
  BACKGROUNDS,
  STYLE_STRENGTH_OPTIONS,
  MOCK_PRODUCTS
} from './types';
import { generateEditedImage } from './services/geminiService';
import { downloadLook, shareLook } from './services/exportLook';
import { applyTryOnOptions, getProductTryOn } from './services/tryOn';
import { 
  Button, 
  Slider, 
  Alert, 
  MiniFileUpload, 
  ProductCard, 
  ClosetItemCard, 
  CartSidebar, 
  TipCard,
  ColorSwatch,
  StyleTile,
  CategoryButton,
  ScrollableRow,
  CompareSlider
} from './components/UIComponents';

// ... (Keep Educational Content and Style Images maps as is from previous version, not repeating here for brevity but they exist in context) ...
// Re-declaring them briefly for context in the output if needed, but assuming file replacement works via CDATA
const MAKEUP_TIPS: Record<string, { title: string; description: string }> = {
  'Smokey Eye': { title: 'Technique: Smokey Eye', description: 'Apply the darkest shadow along the lash line and blend upwards.' },
  'Cut Crease': { title: 'Technique: Cut Crease', description: 'Use a dark shade to define the socket line, then "cut" the lid with concealer.' },
  'Halo Eye': { title: 'Technique: Halo Eye', description: 'Dark corners, bright center lid.' },
  'Smudged/Grunge': { title: 'Technique: Grunge', description: 'Messy, lived-in liner and shadow.' },
  'Winged Out': { title: 'Technique: Winged', description: 'Elongate eye shape outwards.' },
  'Glitter Topper': { title: 'Technique: Glitter', description: 'Pat glitter on center lid.' },
  'Graphic': { title: 'Technique: Graphic', description: 'Sharp geometric shapes.' },
  'Matte Blend': { title: 'Technique: Matte', description: 'Soft gradient of matte shadows.' },
  'Soft Sculpt (Natural)': { title: 'Tip: Soft Sculpt', description: 'Blend slightly above hollows.' },
  'Sharp Definition (Glam)': { title: 'Tip: Sharp Definition', description: 'Cool tone in hollows, bake underneath.' },
  'Sun-Kissed (Bronzer)': { title: 'Tip: Sun-Kissed', description: 'High points: forehead, nose, cheeks.' },
  'Chiseled Jawline': { title: 'Tip: Jawline', description: 'Blend downwards towards neck.' },
  'Blush': { title: 'Tip: Blush', description: 'Tops of cheeks for lift, apples for fullness.' },
  'Lips': { title: 'Tip: Lip Shaping', description: 'Overline slightly for pouty look.' }
};

const STYLE_IMAGES: Record<string, string> = {
  'Natural / No-Makeup Look': 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&q=80',
  'Soft Glam': 'https://images.unsplash.com/photo-1512413316925-fd4b93f31521?w=300&q=80',
  'Full Glam': 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=300&q=80',
  'Smokey Eye': 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=300&q=80',
  'Vintage / Red Lip': 'https://images.unsplash.com/photo-1512850692650-c382e34f7fb2?w=300&q=80',
  'Goth': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80',
  'Cyberpunk': 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&q=80',
  'Euphoria Style': 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?w=300&q=80',
  'Bridal': 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?w=300&q=80',
  'Cut Crease': 'https://placehold.co/200x200/333/fff?text=Cut+Crease',
  'Halo Eye': 'https://placehold.co/200x200/333/fff?text=Halo',
  'Smudged/Grunge': 'https://placehold.co/200x200/333/fff?text=Grunge',
  'Winged Out': 'https://placehold.co/200x200/333/fff?text=Winged',
  'Glitter Topper': 'https://placehold.co/200x200/333/fff?text=Glitter',
  'Matte Blend': 'https://placehold.co/200x200/333/fff?text=Matte',
  'Graphic': 'https://placehold.co/200x200/333/fff?text=Graphic',
  'Straight': 'https://images.unsplash.com/photo-1519699047748-68e1431a49b2?w=300&q=80',
  'Wavy': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&q=80',
  'Curly': 'https://images.unsplash.com/photo-1582095133179-bfd08d2fc6a8?w=300&q=80',
  'Afro': 'https://images.unsplash.com/photo-1584297091622-af8e55da6391?w=300&q=80',
  'Bob Cut': 'https://images.unsplash.com/photo-1620364956897-42220668022d?w=300&q=80',
  'Pixie Cut': 'https://images.unsplash.com/photo-1629214704773-677026529323?w=300&q=80',
  'Long Layers': 'https://images.unsplash.com/photo-1595476104052-a6372d8479e3?w=300&q=80',
  'Braids': 'https://images.unsplash.com/photo-1629838089457-37c28c679093?w=300&q=80',
  'Ponytail': 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=300&q=80',
  'Messy Bun': 'https://images.unsplash.com/photo-1552699615-52822a912a20?w=300&q=80',
  'Bald': 'https://images.unsplash.com/photo-1563178406-4cdc2923acce?w=300&q=80',
  'Wolf Cut': 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=300&q=80', 
  'Curtain Bangs': 'https://images.unsplash.com/photo-1517462964-21fdcec3f25e?w=300&q=80', 
  'Beach Waves': 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=300&q=80', 
  'Hollywood Waves': 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=300&q=80', 
  'Buzz Cut': 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&q=80', 
  'Casual T-Shirt & Jeans': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80',
  'Business Suit': 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&q=80',
  'Evening Gown': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=300&q=80',
  'Summer Dress': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&q=80',
  'Leather Jacket & Black Jeans': 'https://images.unsplash.com/photo-1551488852-080175cff774?w=300&q=80',
  'Cyberpunk Techwear': 'https://images.unsplash.com/photo-1614726365723-49fb6b00918c?w=300&q=80',
  'Vintage 90s': 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&q=80',
  'Streetwear': 'https://images.unsplash.com/photo-1523396896200-fb9268e08979?w=300&q=80',
  'Bohemian': 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=300&q=80',
  'Superhero Costume': 'https://placehold.co/200x200/222/fff?text=Superhero',
  'Old Money': 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=300&q=80', 
  'Y2K Pop': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80', 
  'Athleisure': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=80', 
  'Cottagecore': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&q=80', 
  'Dark Academia': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
  'White Studio Background': 'https://placehold.co/200x200/fff/ccc?text=Studio',
  'City Street at Night': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=300&q=80',
  'Tropical Beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=80',
  'Cozy Coffee Shop': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80',
  'Luxury Penthouse': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=300&q=80',
  'Neon Cyberpunk City': 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=300&q=80',
  'Forest Nature': 'https://images.unsplash.com/photo-1448375240586-dfd8f3793300?w=300&q=80',
  'Space Station': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&q=80',
  'Abstract Gradient': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&q=80',
  'Soft Sculpt (Natural)': 'https://placehold.co/200x200/d7ccc8/5d4037?text=Soft',
  'Sharp Definition (Glam)': 'https://placehold.co/200x200/a1887f/3e2723?text=Sharp',
  'Sun-Kissed (Bronzer)': 'https://placehold.co/200x200/ffccbc/bf360c?text=Bronze',
  'Chiseled Jawline': 'https://placehold.co/200x200/8d6e63/212121?text=Jawline',
  'Subtle Line': 'https://placehold.co/200x200/333/fff?text=Subtle',
  'Classic Wing': 'https://placehold.co/200x200/333/fff?text=Wing',
  'Thick Wing': 'https://placehold.co/200x200/333/fff?text=Thick',
  'Cat Eye': 'https://placehold.co/200x200/333/fff?text=Cat+Eye',
  'Natural': 'https://placehold.co/200x200/333/fff?text=Natural',
  'Volume': 'https://placehold.co/200x200/333/fff?text=Volume',
  'Lengthening': 'https://placehold.co/200x200/333/fff?text=Long',
  'Wispy': 'https://placehold.co/200x200/333/fff?text=Wispy',
  'Dramatic/Falsies': 'https://placehold.co/200x200/333/fff?text=Dramatic'
};

const getColorHex = (name: string): string => {
  const map: Record<string, string> = {
    'Red': '#D32F2F', 'Pink': '#EC407A', 'Nude': '#D7CCC8', 'Berry': '#880E4F', 'Coral': '#FF7043', 
    'Purple': '#7B1FA2', 'Brown': '#5D4037', 'Glossy Clear': '#F5F5F5',
    'Peach': '#FFCCBC', 'Rose': '#F48FB1', 'Bronze': '#A1887F', 'Plum': '#4A148C',
    'Neutral/Browns': '#8D6E63', 'Smokey Black': '#212121', 'Gold Shimmer': '#FFD54F', 'Green': '#388E3C', 'Blue': '#1976D2', 'Glitter': '#E0E0E0',
    'Blonde': '#FFF59D', 'Platinum Blonde': '#F5F5F5', 'Honey Blonde': '#FFECB3', 
    'Brunette': '#4E342E', 'Dark Brown': '#3E2723', 'Black': '#000000', 'Jet Black': '#0A0A0A',
    'Auburn': '#A52A2A', 'Copper': '#BF360C', 'Silver/Grey': '#BDBDBD',
    'Cool Taupe': '#8D6E63', 'Deep Espresso': '#3E2723', 'Neutral Beige': '#D7CCC8', 'Terracotta': '#E64A19', 'Soft Brown': '#A1887F', 'Warm Bronze': '#CD7F32',
    'Shimmer Pink': '#F06292', 'Shimmer Nude': '#E0B0FF', 'Metallic Red': '#B71C1C', 'Rose Gloss': '#F8BBD0',
    'No Change': 'transparent'
  };
  if (name.includes('Ombre')) return 'linear-gradient(135deg, #333 30%, #f0f 100%)';
  return map[name] || '#ccc';
};

const App: React.FC = () => {
  // --- Main State ---
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Zoom/Pan State ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // --- Magic Eraser State ---
  const [isEraserDrawing, setIsEraserDrawing] = useState(false);
  const [eraserBrushSize, setEraserBrushSize] = useState(20);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // --- UI Navigation State ---
  const [activeCategory, setActiveCategory] = useState<'looks' | 'makeup' | 'hair' | 'outfit' | 'shop' | 'closet' | 'ask-ai' | 'eraser'>('looks');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('lips'); 
  const [showCompare, setShowCompare] = useState(false);
  const [comparePos, setComparePos] = useState(50);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [cameraConsentOpen, setCameraConsentOpen] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false); 

  // --- Styling Options State ---
  const INITIAL_OPTIONS: EditOptions = {
    hairColor: 'No Change',
    hairStyle: 'No Change',
    lipColor: 'No Change',
    lipIntensity: 70,
    blushColor: 'No Change',
    blushIntensity: 50,
    eyeshadowColor: 'No Change',
    eyeshadowStyle: 'No Change',
    eyeshadowIntensity: 60,
    eyelinerStyle: 'No Change',
    eyelashesStyle: 'No Change',
    contourColor: 'No Change',
    contourMode: 'No Change',
    contourIntensity: 60,
    contourReference: null,
    maskImage: null,
    makeupLook: 'No Change',
    makeupIntensity: 75,
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
  const [history, setHistory] = useState<EditOptions[]>([INITIAL_OPTIONS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Feature specific states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.IDLE);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [availableOutfits, setAvailableOutfits] = useState<string[]>(OUTFIT_STYLES);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [makeupSaveName, setMakeupSaveName] = useState('');
  const [isSavingMakeup, setIsSavingMakeup] = useState(false);
  const [closetView, setClosetView] = useState<'items' | 'looks'>('looks'); 
  
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    const storedCloset = localStorage.getItem('styleShift_closet');
    if (storedCloset) {
      try {
        setClosetItems(JSON.parse(storedCloset));
      } catch (e) { console.error(e); }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopCamera();
    };
  }, [previewUrl]);

  // Sync Canvas Size with Image
  useEffect(() => {
    if (maskCanvasRef.current && imageContainerRef.current) {
      const img = imageContainerRef.current.querySelector('img');
      if (img) {
        // Wait for image load or if already loaded
        const resizeCanvas = () => {
           if (maskCanvasRef.current && img) {
              maskCanvasRef.current.width = img.naturalWidth;
              maskCanvasRef.current.height = img.naturalHeight;
           }
        };
        if (img.complete) resizeCanvas();
        else img.onload = resizeCanvas;
      }
    }
  }, [previewUrl, generatedImage, activeCategory]);

  // --- Mock API Call for Products ---
  const fetchProducts = async () => {
    // setTimeout(() => setProducts(MOCK_PRODUCTS), 500); 
  };

  // --- Drawing Logic (Eraser) ---
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    if (!maskCanvasRef.current || !imageContainerRef.current) return null;
    const canvas = maskCanvasRef.current;
    const img = imageContainerRef.current.querySelector('img');
    if (!img) return null;

    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (activeCategory !== 'eraser') return;
    setIsEraserDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isEraserDrawing || activeCategory !== 'eraser' || !maskCanvasRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineWidth = eraserBrushSize * 4; // Scale brush relative to high-res image
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const stopDrawing = () => {
    if (!isEraserDrawing || !maskCanvasRef.current) return;
    setIsEraserDrawing(false);
    const ctx = maskCanvasRef.current.getContext('2d');
    ctx?.beginPath();
    
    const display = maskCanvasRef.current;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = display.width;
    exportCanvas.height = display.height;
    const exportCtx = exportCanvas.getContext('2d');
    const displayCtx = display.getContext('2d');
    if (exportCtx && displayCtx) {
      const pixels = displayCtx.getImageData(0, 0, display.width, display.height);
      const mask = exportCtx.createImageData(display.width, display.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const painted = pixels.data[i + 3] > 0;
        mask.data[i] = 255;
        mask.data[i + 1] = 255;
        mask.data[i + 2] = 255;
        mask.data[i + 3] = painted ? 255 : 0;
      }
      exportCtx.putImageData(mask, 0, 0);
    }
    exportCanvas.toBlob((blob) => {
       if (blob) {
          const file = new File([blob], "mask.png", { type: "image/png" });
          handleCommitOption('maskImage', file);
       }
    });
  };
  
  const clearMask = () => {
     if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        handleCommitOption('maskImage', null);
     }
  };

  // --- Zoom Logic ---
  const handleWheel = (e: React.WheelEvent) => {
    if (activeCategory === 'eraser') return; // Disable zoom scroll when erasing
    e.preventDefault();
    if (!file && !generatedImage) return;
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(1, zoom + scaleAmount), 4);
    setZoom(newZoom);
    if (newZoom === 1) setPan({ x: 0, y: 0 }); 
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeCategory === 'eraser') {
       startDrawing(e);
    } else if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeCategory === 'eraser') {
       draw(e);
    } else if (isDragging && zoom > 1) {
      e.preventDefault();
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    if (activeCategory === 'eraser') {
       stopDrawing();
    } else {
       setIsDragging(false);
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setGeneratedImage(null);
      setStatus(ProcessingStatus.IDLE);
      setErrorMsg(null);
      setActiveCategory('looks');
      resetZoom();
    }
  };

  // Update only state (preview)
  const handlePreviewOption = (key: keyof EditOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Update state AND push to history (commit)
  const handleCommitOption = (key: keyof EditOptions, value: any) => {
    handleCommitOptions({ [key]: value } as Partial<EditOptions>);
  };

  const handleCommitOptions = (patch: Partial<EditOptions>) => {
    const newOptions = { ...options, ...patch };
    setOptions(newOptions);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newOptions);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleProductTryOn = (product: Product) => {
    const mapping = getProductTryOn(product);
    if (!mapping) {
      setErrorMsg(`“${product.name}” is not mapped to an editor slot yet.`);
      return;
    }
    handleCommitOptions(applyTryOnOptions(options, mapping.optionsPatch));
    setActiveCategory(mapping.category);
    if (mapping.subCategory) setActiveSubCategory(mapping.subCategory);
    setActionMsg(`Trying on ${mapping.optionsPatch && product.tryOn?.label ? product.tryOn.label : product.name}. Click Generate to apply.`);
  };

  const handleExportLook = async (mode: 'download' | 'share') => {
    const src = generatedImage || previewUrl;
    if (!src) return;
    try {
      if (mode === 'share') {
        const result = await shareLook(src);
        setActionMsg(result === 'shared' ? 'Share sheet opened.' : 'Share is unavailable here, so the look was downloaded instead.');
      } else {
        await downloadLook(src);
        setActionMsg('Look downloaded.');
      }
    } catch (error: any) {
      setErrorMsg(error?.message || 'Could not export this look.');
    }
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

  const handleGenerate = async () => {
    if (!file) {
      setErrorMsg("Please upload a selfie first.");
      return;
    }
    if (options.resolution === 'High (Pro)') {
       try { if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) await window.aistudio.openSelectKey(); } catch (e) {}
    }
    setStatus(ProcessingStatus.GENERATING);
    setErrorMsg(null);
    try {
      // Use current generated image as source if available for refinement
      const sourceFile = generatedImage && activeCategory === 'eraser' ? 
         await (await fetch(generatedImage)).blob().then(b => new File([b], "base.png", { type: "image/png" })) : 
         file;

      const resultImageUrl = await generateEditedImage(sourceFile, options);
      setGeneratedImage(resultImageUrl);
      setStatus(ProcessingStatus.SUCCESS);
      if (activeCategory === 'eraser') clearMask(); // Clear mask after applying
      resetZoom();
    } catch (err: any) {
      setStatus(ProcessingStatus.ERROR);
      if (err.status === 403 || (err.message && err.message.toLowerCase().includes("permission"))) {
         setErrorMsg("Permission denied. Opening API Key selector.");
         try { if (window.aistudio) await window.aistudio.openSelectKey(); } catch(e){}
      } else {
         setErrorMsg(err.message || "Failed to generate image.");
      }
    }
  };

  const handleSmartRefine = async () => {
    if (!generatedImage || !options.customPrompt.trim()) return;
    if (options.resolution === 'High (Pro)') {
      try { if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) await window.aistudio.openSelectKey(); } catch (e) {}
    }
    try {
      setStatus(ProcessingStatus.GENERATING);
      const res = await fetch(generatedImage);
      const blob = await res.blob();
      const newBaseFile = new File([blob], "refined-source.png", { type: "image/png" });
      
      const refineOptions: EditOptions = {
        ...INITIAL_OPTIONS,
        customPrompt: options.customPrompt,
        resolution: options.resolution,
        styleStrength: options.styleStrength
      };
      
      setFile(newBaseFile);
      setPreviewUrl(URL.createObjectURL(newBaseFile));
      setOptions(refineOptions);
      setHistory([refineOptions]); 
      setHistoryIndex(0);
      setGeneratedImage(null); 
      resetZoom();
      
      const resultUrl = await generateEditedImage(newBaseFile, refineOptions);
      setGeneratedImage(resultUrl);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (e: any) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg("Failed to refine image. " + (e.message || ""));
    }
  };

  const handleSaveLookToCloset = () => {
    if (!generatedImage) return;
    const newItem: ClosetItem = {
      id: Date.now().toString(),
      name: `Look ${new Date().toLocaleDateString()}`,
      description: options.customPrompt || `Generated Style ${closetItems.length + 1}`,
      category: 'look',
      addedAt: Date.now(),
      image: generatedImage 
    };
    try {
      const updatedCloset = [newItem, ...closetItems];
      setClosetItems(updatedCloset);
      localStorage.setItem('styleShift_closet', JSON.stringify(updatedCloset));
      setClosetView('looks');
      setActiveCategory('closet');
    } catch (e) {
      alert("Storage full. Could not save image to closet. Try downloading instead.");
    }
  };

  const loadSavedLook = (item: ClosetItem) => {
      if (!item.image) return;
      setGeneratedImage(item.image);
      setActiveCategory('looks'); 
  };

  // --- Camera/Reset Logic --- 
  const requestCamera = () => {
    setCameraConsentOpen(true);
  };

  const startCamera = async () => { 
    if (!ageConfirmed) {
      setCameraConsentOpen(true);
      return;
    }
    setCameraConsentOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setIsCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err: any) {
      setErrorMsg("Could not access camera.");
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
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie-capture.png", { type: "image/png" });
            setFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setGeneratedImage(null);
            setStatus(ProcessingStatus.IDLE);
            stopCamera();
            setActiveCategory('looks');
            resetZoom();
          }
        }, 'image/png');
      }
    }
  };
  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setGeneratedImage(null);
    setOptions(INITIAL_OPTIONS);
    setHistory([INITIAL_OPTIONS]);
    setHistoryIndex(0);
    resetZoom();
    clearMask();
  };
  
  const addToCart = (product: Product, openCart = true) => {
    setCart(prev => [...prev, { ...product, cartId: Date.now().toString(), quantity: 1 }]);
    if (openCart) setIsCartOpen(true);
  };

  const buyProduct = (product: Product) => {
    if (product.purchaseUrl) {
      window.open(product.purchaseUrl, '_blank', 'noopener,noreferrer');
      setActionMsg('Opened the retailer in a new tab. That purchase is not a StyleShift order.');
      return;
    }
    addToCart(product, true);
  };
  
  const handleCheckout = () => {
      setOrderStatus(OrderStatus.DEMO_PROCESSING);
      setTimeout(() => {
          setOrderStatus(OrderStatus.DEMO_COMPLETE);
      }, 1200);
  };

  const addMakeupToCloset = () => {
      if (!makeupSaveName.trim()) return;
      const makeupData: Partial<EditOptions> = {
          lipColor: options.lipColor, lipIntensity: options.lipIntensity,
          blushColor: options.blushColor, blushIntensity: options.blushIntensity,
          eyeshadowColor: options.eyeshadowColor, eyeshadowStyle: options.eyeshadowStyle, eyeshadowIntensity: options.eyeshadowIntensity,
          eyelinerStyle: options.eyelinerStyle, eyelashesStyle: options.eyelashesStyle,
          contourColor: options.contourColor, contourMode: options.contourMode, contourIntensity: options.contourIntensity
      };
      const newItem: ClosetItem = {
          id: Date.now().toString(),
          name: makeupSaveName,
          description: `Custom Makeup: ${makeupSaveName}`,
          category: 'makeup',
          addedAt: Date.now(),
          customData: makeupData
      };
      const updatedCloset = [newItem, ...closetItems];
      setClosetItems(updatedCloset);
      localStorage.setItem('styleShift_closet', JSON.stringify(updatedCloset));
      setMakeupSaveName('');
      setIsSavingMakeup(false);
  };

  const wearClosetItem = (item: ClosetItem) => {
    if (item.category === 'makeup' && item.customData) {
        const newOptions = { ...options, ...item.customData };
        setOptions(newOptions);
        setHistory(prev => [...prev, newOptions]);
        setHistoryIndex(prev => prev + 1);
        setActiveCategory('makeup');
    } else if (item.category === 'outfit') {
      handleCommitOption('outfit', item.description);
      if (!OUTFIT_STYLES.includes(item.description) && !availableOutfits.includes(item.description)) {
        setAvailableOutfits(prev => [item.description, ...prev]);
      }
      setActiveCategory('outfit');
    } else if (item.category === 'makeup') {
      handleCommitOption('makeupLook', item.description);
      setActiveCategory('makeup');
    } else if (item.category === 'look' && item.image) {
      setGeneratedImage(item.image);
      setActiveCategory('looks');
    }
  };

  // --- Render Helpers ---
  const renderEditorControls = () => {
    switch (activeCategory) {
      case 'looks': return ( 
          <div className="space-y-4">
             <div className="flex justify-between items-center px-4">
               <span className="text-xs font-bold text-gray-400 uppercase">Preset Looks</span>
             </div>
             <ScrollableRow className="px-4">
                {MAKEUP_LOOKS.map(look => (
                  <StyleTile key={look} label={look} image={STYLE_IMAGES[look]} isActive={options.makeupLook === look} onClick={() => handleCommitOption('makeupLook', look)} />
                ))}
             </ScrollableRow>
             <div className="px-4"><Slider label="Intensity" value={options.makeupIntensity} onChange={(e) => handlePreviewOption('makeupIntensity', parseInt(e.target.value))} onAfterChange={(val) => handleCommitOption('makeupIntensity', val)} /></div>
             <div className="px-4 space-y-2">
               <span className="text-[10px] font-bold text-gray-500 uppercase">Style strength</span>
               <div className="flex gap-2">
                 {STYLE_STRENGTH_OPTIONS.map((strength) => (
                   <button
                     key={strength}
                     onClick={() => handleCommitOption('styleStrength', strength)}
                     className={`text-[10px] px-3 py-1.5 rounded-full border ${options.styleStrength === strength ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-gray-700 text-gray-400'}`}
                   >
                     {strength}
                   </button>
                 ))}
               </div>
             </div>
          </div>
      );
      case 'makeup': return ( 
          <div className="space-y-4">
            <div className="px-4 flex justify-between items-center">
               <div className="flex space-x-6 text-sm font-medium border-b border-gray-800 flex-1">
                 {['lips', 'eyes', 'face', 'contour'].map(sub => (
                   <button key={sub} onClick={() => setActiveSubCategory(sub)} className={`pb-2 capitalize ${activeSubCategory === sub ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}>{sub}</button>
                 ))}
               </div>
               <div className="ml-2 relative">
                  {!isSavingMakeup ? (
                    <button onClick={() => setIsSavingMakeup(true)} className="text-pink-400 hover:text-pink-300 text-xs flex items-center">
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                       Save Look
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1 animate-fade-in absolute right-0 top-0 bg-gray-900 p-1 rounded-lg border border-gray-700 shadow-xl z-10 w-48">
                       <input type="text" className="bg-black/50 border border-gray-600 rounded px-2 py-1 text-xs w-full text-white" placeholder="Name" value={makeupSaveName} onChange={(e) => setMakeupSaveName(e.target.value)} autoFocus />
                       <button onClick={addMakeupToCloset} className="text-green-400 hover:text-green-300 p-1">✓</button>
                       <button onClick={() => setIsSavingMakeup(false)} className="text-gray-400 hover:text-white p-1">✕</button>
                    </div>
                  )}
               </div>
            </div>
            <div className="px-4">
              <MiniFileUpload label="Makeup reference" file={options.makeupReference || null} onFileChange={(f) => handleCommitOption('makeupReference', f)} />
            </div>
            {activeSubCategory === 'lips' && (
              <div className="px-4 space-y-4">
                 <ScrollableRow>{LIP_COLORS.map(color => <ColorSwatch key={color} color={getColorHex(color)} label={color} isActive={options.lipColor === color} onClick={() => handleCommitOption('lipColor', color)} />)}</ScrollableRow>
                 <Slider label="Lip Intensity" value={options.lipIntensity} onChange={(e) => handlePreviewOption('lipIntensity', parseInt(e.target.value))} onAfterChange={(val) => handleCommitOption('lipIntensity', val)} />
                 <TipCard title={MAKEUP_TIPS['Lips'].title} description={MAKEUP_TIPS['Lips'].description} />
              </div>
            )}
            {activeSubCategory === 'eyes' && (
              <div className="px-4 space-y-4">
                 <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 uppercase">Eyeshadow Color</span><ScrollableRow>{EYESHADOW_COLORS.map(color => <ColorSwatch key={color} color={getColorHex(color)} label={color} isActive={options.eyeshadowColor === color} onClick={() => handleCommitOption('eyeshadowColor', color)} />)}</ScrollableRow></div>
                 <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 uppercase">Style</span><ScrollableRow>{EYESHADOW_STYLES.map(style => <StyleTile key={style} label={style} image={STYLE_IMAGES[style]} isActive={options.eyeshadowStyle === style} onClick={() => handleCommitOption('eyeshadowStyle', style)} />)}</ScrollableRow></div>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                    <div><span className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Liner</span><ScrollableRow>{EYELINER_STYLES.map(style => <StyleTile key={style} label={style} image={STYLE_IMAGES[style]} isActive={options.eyelinerStyle === style} onClick={() => handleCommitOption('eyelinerStyle', style)} />)}</ScrollableRow></div>
                    <div><span className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Lashes</span><ScrollableRow>{EYELASH_STYLES.map(style => <StyleTile key={style} label={style} image={STYLE_IMAGES[style]} isActive={options.eyelashesStyle === style} onClick={() => handleCommitOption('eyelashesStyle', style)} />)}</ScrollableRow></div>
                 </div>
                 {(options.eyeshadowStyle !== 'No Change' && MAKEUP_TIPS[options.eyeshadowStyle]) && (
                    <TipCard title={MAKEUP_TIPS[options.eyeshadowStyle].title} description={MAKEUP_TIPS[options.eyeshadowStyle].description} />
                 )}
                 <Slider label="Intensity" value={options.eyeshadowIntensity} onChange={(e) => handlePreviewOption('eyeshadowIntensity', parseInt(e.target.value))} onAfterChange={(val) => handleCommitOption('eyeshadowIntensity', val)} />
              </div>
            )}
            {activeSubCategory === 'face' && (
               <div className="px-4 space-y-4"><span className="text-[10px] font-bold text-gray-500 uppercase">Blush Color</span><ScrollableRow>{BLUSH_COLORS.map(color => <ColorSwatch key={color} color={getColorHex(color)} label={color} isActive={options.blushColor === color} onClick={() => handleCommitOption('blushColor', color)} />)}</ScrollableRow><Slider label="Blush Intensity" value={options.blushIntensity} onChange={(e) => handlePreviewOption('blushIntensity', parseInt(e.target.value))} onAfterChange={(val) => handleCommitOption('blushIntensity', val)} /><TipCard title={MAKEUP_TIPS['Blush'].title} description={MAKEUP_TIPS['Blush'].description} /></div>
            )}
            {activeSubCategory === 'contour' && (
               <div className="px-4 space-y-4"><MiniFileUpload label="Upload Guide" file={options.contourReference} onFileChange={(f) => handleCommitOption('contourReference', f)} /><span className="text-[10px] font-bold text-gray-500 uppercase">Shade</span><ScrollableRow>{CONTOUR_COLORS.map(color => <ColorSwatch key={color} color={getColorHex(color)} label={color} isActive={options.contourColor === color} onClick={() => handleCommitOption('contourColor', color)} />)}</ScrollableRow><span className="text-[10px] font-bold text-gray-500 uppercase">Sculpt Mode</span><ScrollableRow>{CONTOUR_MODES.map(mode => <StyleTile key={mode} label={mode} image={STYLE_IMAGES[mode]} isActive={options.contourMode === mode} onClick={() => handleCommitOption('contourMode', mode)} />)}</ScrollableRow><Slider label="Contour Intensity" value={options.contourIntensity} onChange={(e) => handlePreviewOption('contourIntensity', parseInt(e.target.value))} onAfterChange={(val) => handleCommitOption('contourIntensity', val)} />
               {(options.contourMode !== 'No Change' && MAKEUP_TIPS[options.contourMode]) && (
                    <TipCard title={MAKEUP_TIPS[options.contourMode].title} description={MAKEUP_TIPS[options.contourMode].description} />
               )}
               </div>
            )}
          </div>
      );
      case 'hair': return ( 
          <div className="space-y-4 px-4">
             <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 uppercase">Hair Color</span><ScrollableRow>{HAIR_COLORS.map(color => <ColorSwatch key={color} color={getColorHex(color)} label={color} isActive={options.hairColor === color} onClick={() => handleCommitOption('hairColor', color)} />)}</ScrollableRow></div>
             <div className="space-y-2"><span className="text-[10px] font-bold text-gray-500 uppercase">Hair Style</span><ScrollableRow>{HAIR_STYLES.map(style => <StyleTile key={style} label={style} image={STYLE_IMAGES[style]} isActive={options.hairStyle === style} onClick={() => handleCommitOption('hairStyle', style)} />)}</ScrollableRow></div>
             <MiniFileUpload label="Reference Image" file={options.hairReference} onFileChange={(f) => handleCommitOption('hairReference', f)} />
          </div>
      );
      case 'outfit': return ( 
          <div className="space-y-4 px-4">
             <span className="text-[10px] font-bold text-gray-500 uppercase">Style</span><ScrollableRow>{availableOutfits.map(outfit => <StyleTile key={outfit} label={outfit} image={STYLE_IMAGES[outfit]} isActive={options.outfit === outfit} onClick={() => handleCommitOption('outfit', outfit)} />)}</ScrollableRow>
             <MiniFileUpload label="Upload Outfit Reference" file={options.outfitReference} onFileChange={(f) => handleCommitOption('outfitReference', f)} />
             <div className="pt-2"><p className="text-xs text-gray-400 mb-1">Background</p><ScrollableRow>{BACKGROUNDS.map(bg => <StyleTile key={bg} label={bg} image={STYLE_IMAGES[bg]} isActive={options.background === bg} onClick={() => handleCommitOption('background', bg)} />)}</ScrollableRow></div>
          </div>
      );
      case 'eraser': return (
         <div className="space-y-4 px-4">
             <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3 text-xs text-gray-300">
                <p className="font-bold text-indigo-300 mb-1">How to use Magic Eraser:</p>
                <ol className="list-decimal list-inside space-y-1">
                   <li>Drag over the object you want to remove.</li>
                   <li>Click "Apply Eraser" to process.</li>
                </ol>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Brush Size</label>
                <Slider min={5} max={50} value={eraserBrushSize} onChange={(e) => setEraserBrushSize(parseInt(e.target.value))} />
             </div>
             <div className="flex gap-2">
                <Button variant="outline" onClick={clearMask} className="flex-1 text-xs py-2">Clear Selection</Button>
                <Button variant="primary" onClick={handleGenerate} disabled={status === ProcessingStatus.GENERATING || !options.maskImage} isLoading={status === ProcessingStatus.GENERATING} className="flex-1 text-xs py-2">Apply Eraser</Button>
             </div>
         </div>
      );
      case 'shop': return ( 
           <div className="px-4 space-y-4 h-full overflow-y-auto">
              <input type="text" placeholder="Search products..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" value={shopSearchQuery} onChange={(e) => setShopSearchQuery(e.target.value)} />
              <div className="grid grid-cols-2 gap-3 pb-20">{products.filter(p => p.name.toLowerCase().includes(shopSearchQuery.toLowerCase())).map(product => (<ProductCard key={product.id} {...product} onTryOn={() => handleProductTryOn(product)} onAddToCart={() => addToCart(product, false)} onBuyNow={() => buyProduct(product)} />))}</div>
           </div>
      );
      case 'closet': return (
           <div className="px-4 space-y-3 h-full overflow-y-auto pb-20">
              <div className="flex border-b border-gray-800 pb-2 mb-2 space-x-4">
                 <button onClick={() => setClosetView('looks')} className={`text-xs font-bold pb-1 border-b-2 transition-colors ${closetView === 'looks' ? 'text-white border-white' : 'text-gray-500 border-transparent'}`}>My Favorite Looks</button>
                 <button onClick={() => setClosetView('items')} className={`text-xs font-bold pb-1 border-b-2 transition-colors ${closetView === 'items' ? 'text-white border-white' : 'text-gray-500 border-transparent'}`}>Saved Items</button>
              </div>
              
              {closetView === 'looks' ? (
                 <div className="grid grid-cols-2 gap-3">
                    {closetItems.filter(i => i.category === 'look').length === 0 ? (
                       <div className="col-span-2 text-center py-10 text-gray-500 text-sm">No saved looks yet. Click the heart icon to save!</div>
                    ) : (
                       closetItems.filter(i => i.category === 'look').map(item => (
                          <div key={item.id} className="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                             {item.image && <img src={item.image} alt={item.description} className="w-full h-32 object-cover cursor-pointer" onClick={() => loadSavedLook(item)} />}
                             <div className="p-2">
                                <p className="text-[10px] text-gray-300 truncate">{item.description}</p>
                                <button onClick={() => { const updated = closetItems.filter(i => i.id !== item.id); setClosetItems(updated); localStorage.setItem('styleShift_closet', JSON.stringify(updated)); }} className="text-[10px] text-red-400 mt-1 hover:text-red-300">Delete</button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              ) : (
                 <div className="space-y-2">
                    {closetItems.filter(i => i.category !== 'look').map(item => (
                        <ClosetItemCard 
                           key={item.id} 
                           {...item} 
                           onWear={() => wearClosetItem(item)} 
                           onDelete={() => { const updated = closetItems.filter(i => i.id !== item.id); setClosetItems(updated); localStorage.setItem('styleShift_closet', JSON.stringify(updated)); }} 
                        />
                    ))}
                    {closetItems.filter(i => i.category !== 'look').length === 0 && <div className="text-center py-10 text-gray-500 text-sm">No saved items.</div>}
                 </div>
              )}
           </div>
      );
      case 'ask-ai': return ( 
           <div className="px-4 space-y-4 h-full overflow-y-auto">
               <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-2 text-indigo-300">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                     <h3 className="text-sm font-bold">Ask AI Stylist</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Describe specific changes or additions you want to make to the photo.</p>
                  <textarea className="w-full bg-black/50 border border-indigo-500/30 rounded-lg p-3 text-sm text-white placeholder-gray-500 min-h-[80px]" placeholder="e.g. Add a red beret, make me smile, add sunglasses..." value={options.customPrompt} onChange={(e) => handlePreviewOption('customPrompt', e.target.value)} onBlur={(e) => handleCommitOption('customPrompt', e.target.value)} />
                  <div className="flex flex-wrap gap-2 mt-3">
                     {['Make me smile', 'Add sunglasses', 'Change lighting to sunset', 'Add gold hoop earrings', 'Make hair windblown', 'Add a red beret'].map(sugg => (
                        <button key={sugg} onClick={() => handleCommitOption('customPrompt', sugg)} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-full border border-gray-700">{sugg}</button>
                     ))}
                  </div>
                  {generatedImage && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                       <Button variant="secondary" onClick={handleSmartRefine} className="w-full text-xs" disabled={!options.customPrompt.trim()} isLoading={status === ProcessingStatus.GENERATING}>✨ Apply to Current Result</Button>
                       <p className="text-[9px] text-gray-500 text-center mt-1">This uses the current edited image as the new base.</p>
                    </div>
                  )}
               </div>
           </div>
      );
      default: return null;
    }
  };

  // --- Main View ---
  return (
    <div className="fixed inset-0 bg-black text-gray-100 font-sans overflow-hidden flex flex-col">
      <CartSidebar isOpen={isCartOpen} onClose={() => {
        setIsCartOpen(false);
        if (orderStatus === OrderStatus.DEMO_COMPLETE) {
          setCart([]);
          setOrderStatus(OrderStatus.IDLE);
        }
      }} cartItems={cart} onRemoveItem={(id) => setCart(prev => prev.filter(i => i.cartId !== id))} onCheckout={handleCheckout} orderStatus={orderStatus} />

      {cameraConsentOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-white">Camera consent</h3>
            <p className="text-sm text-gray-400">StyleShift uses your camera only to capture a selfie for try-on. The photo stays in this browser unless you download or save a look.</p>
            <label className="flex items-start gap-2 text-sm text-gray-300">
              <input type="checkbox" className="mt-1" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
              I confirm I am 18 or older.
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCameraConsentOpen(false)}>Cancel</Button>
              <Button disabled={!ageConfirmed} onClick={startCamera}>Continue</Button>
            </div>
          </div>
        </div>
      )}

      <header className="flex-shrink-0 h-14 bg-black/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 z-20">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
             <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" /></svg>
           </div>
           <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">StyleShift</span>
        </div>
        <div className="flex items-center space-x-4">
           {/* Global Undo/Redo */}
           {file && (
             <div className="flex space-x-1 mr-2 bg-gray-800 rounded-md p-0.5">
                <button onClick={undo} disabled={historyIndex === 0} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg></button>
                <div className="w-px bg-gray-700"></div>
                <button onClick={redo} disabled={historyIndex === history.length-1} className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg></button>
             </div>
           )}
           {(generatedImage || previewUrl) && (
             <>
               <button onClick={() => handleExportLook('download')} className="text-xs font-medium text-gray-400 hover:text-white transition-colors" title="Download look">Download</button>
               <button onClick={() => handleExportLook('share')} className="text-xs font-medium text-gray-400 hover:text-white transition-colors" title="Share look">Share</button>
             </>
           )}
           {generatedImage && (
             <button onClick={handleSaveLookToCloset} className="text-pink-500 hover:text-pink-400 transition-colors bg-pink-500/10 p-2 rounded-full" title="Save to Closet">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
             </button>
           )}
           {generatedImage && previewUrl && (
             <button onClick={() => { setShowCompare(!showCompare); setComparePos(50); }} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
               {showCompare ? 'Hide Compare' : 'Compare'}
             </button>
           )}
           <button onClick={() => setIsCartOpen(true)} className="relative text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{cart.length}</span>}
           </button>
        </div>
      </header>

      {/* Main Canvas with Zoom/Pan and Eraser Overlay */}
      <main className="flex-1 relative bg-gray-900 overflow-hidden flex items-center justify-center cursor-move" onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {!file && !isCameraOpen ? (
          <div className="text-center p-6 max-w-sm animate-fade-in">
             <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Virtual Makeup Studio</h2>
             <p className="text-gray-400 mb-8">Upload a selfie to try on makeup, hairstyles, and outfits instantly.</p>
             <div className="space-y-3">
               <label className="block w-full">
                  <div className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg cursor-pointer text-center transition-colors shadow-lg shadow-indigo-500/30">Upload Photo</div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
               </label>
               <button onClick={requestCamera} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors">Take Selfie</button>
               <p className="text-[10px] text-gray-500">Photos stay in this browser unless you download or save a look. Confirm you are 18+ before using the camera.</p>
             </div>
          </div>
        ) : isCameraOpen ? (
           <div className="relative w-full h-full">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4">
                 <button onClick={stopCamera} className="bg-gray-800/80 text-white px-6 py-2 rounded-full">Cancel</button>
                 <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 ring-4 ring-white/50"></button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
           </div>
        ) : (
           <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden p-6 md:p-12">
              <div ref={imageContainerRef} style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transition: (isDragging || isEraserDrawing) ? 'none' : 'transform 0.1s ease-out' }} className="w-full h-full flex items-center justify-center relative">
                  {generatedImage && showCompare && previewUrl ? (
                     <CompareSlider originalSrc={previewUrl} editedSrc={generatedImage} position={comparePos} onPositionChange={setComparePos} />
                  ) : generatedImage && !showCompare ? (
                     <img src={generatedImage} alt="Styled" className="w-full h-full object-contain pointer-events-none shadow-2xl drop-shadow-2xl" />
                  ) : (
                     <img src={previewUrl!} alt="Original" className="w-full h-full object-contain pointer-events-none shadow-2xl drop-shadow-2xl" />
                  )}
                  
                  {/* Eraser Canvas Overlay */}
                  <canvas 
                     ref={maskCanvasRef} 
                     className={`absolute inset-0 w-full h-full object-contain ${activeCategory === 'eraser' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                     style={{ zIndex: 10 }}
                  />
              </div>
              
              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-4 left-4 z-30 flex flex-col space-y-2">
                 <button onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg></button>
                 <button onClick={() => { setZoom(1); setPan({x:0,y:0}); }} className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80 text-xs font-bold">{Math.round(zoom * 100)}%</button>
                 <button onClick={() => setZoom(z => Math.max(z - 0.5, 1))} className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg></button>
              </div>

              {status === ProcessingStatus.GENERATING && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center">
                   <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-indigo-200 font-medium animate-pulse">Applying AI Styling...</p>
                </div>
              )}
              
              <button onClick={resetAll} className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md z-20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              {generatedImage && !showCompare && <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider backdrop-blur-md z-20 pointer-events-none">After</div>}
           </div>
        )}
      </main>

      {/* 3. Bottom Editor Panel (Only show if file loaded) */}
      {file && !isCameraOpen && (
        <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 flex flex-col h-[40vh] md:h-[350px]">
           <div className="flex-1 overflow-y-auto py-4 bg-gray-900 relative">
              <div className="absolute bottom-4 right-4 z-20">
                 {status !== ProcessingStatus.GENERATING && activeCategory !== 'eraser' && (
                   <button onClick={handleGenerate} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 rounded-full px-6 py-3 font-bold flex items-center space-x-2 transition-transform active:scale-95"><span>✨ Generate</span></button>
                 )}
              </div>
              {renderEditorControls()}
              {actionMsg && <div className="px-4 mt-2"><Alert type="success" message={actionMsg} /></div>}
              {errorMsg && <div className="px-4 mt-2"><Alert type="error" message={errorMsg} /></div>}
           </div>
           {/* Bottom Category Navigation */}
           <div className="h-16 bg-black border-t border-gray-800 flex items-center justify-around px-2 z-30">
              <CategoryButton label="Looks" isActive={activeCategory === 'looks'} onClick={() => setActiveCategory('looks')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>} />
              <CategoryButton label="Makeup" isActive={activeCategory === 'makeup'} onClick={() => setActiveCategory('makeup')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>} />
              <CategoryButton label="Hair" isActive={activeCategory === 'hair'} onClick={() => setActiveCategory('hair')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
              <CategoryButton label="Outfit" isActive={activeCategory === 'outfit'} onClick={() => setActiveCategory('outfit')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>} />
              <CategoryButton label="Ask AI" isActive={activeCategory === 'ask-ai'} onClick={() => setActiveCategory('ask-ai')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>} />
              <CategoryButton label="Eraser" isActive={activeCategory === 'eraser'} onClick={() => setActiveCategory('eraser')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>} />
              <CategoryButton label="Shop" isActive={activeCategory === 'shop'} onClick={() => setActiveCategory('shop')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>} />
              <CategoryButton label="Closet" isActive={activeCategory === 'closet'} onClick={() => setActiveCategory('closet')} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>} />
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
