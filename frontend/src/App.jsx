import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, Monitor, Image as ImageIcon, Type, Video, 
  MousePointer2, Save, Upload, Download, Play, 
  Plus, Trash2, Settings, Layers, ChevronLeft, 
  ChevronRight, Move, X, Minimize2, Maximize2,
  Clock, MapPin, Grid, DollarSign, Box
} from 'lucide-react';

/**
 * UTILITIES
 */
const generateId = () => Math.random().toString(36).substr(2, 9);

const TILE_TYPES = [
  { type: 'text', icon: Type, label: 'Text Block' },
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'video', icon: Video, label: 'Video Player' },
  { type: 'price', icon: DollarSign, label: 'Price Tag' },
  { type: 'shape', icon: Box, label: 'Shape/Panel' },
  // Simulating the "46 tile types" with placeholders
  { type: 'weather', icon: Grid, label: 'Weather Widget' },
  { type: 'social', icon: Grid, label: 'Social Feed' },
  { type: 'qr', icon: Grid, label: 'QR Code' },
];

const DEFAULT_SLIDE_DURATION = 5000;

// Mock Data
const INITIAL_DATA = {
  locations: [
    {
      id: 'loc1',
      name: 'Downtown Burger Bar',
      screens: [
        { 
          id: 'screen1', 
          name: 'Main Menu Board', 
          x: 100, 
          y: 100, 
          slides: ['slide1', 'slide2'],
          rotation: 8000
        },
        { 
          id: 'screen2', 
          name: 'Promo Vertical', 
          x: 400, 
          y: 100, 
          slides: ['slide3'],
          rotation: 5000 
        }
      ]
    }
  ],
  slides: [
    {
      id: 'slide1',
      name: 'Burger Specials',
      background: '#1a1a1a',
      elements: [
        { id: 'el1', type: 'text', content: 'CLASSIC BURGER', x: 50, y: 50, width: 400, height: 60, fontSize: 40, color: '#ffffff', fontFamily: 'sans-serif', zIndex: 2 },
        { id: 'el2', type: 'price', content: '$12.99', x: 500, y: 50, width: 150, height: 60, fontSize: 40, color: '#fbbf24', fontFamily: 'sans-serif', zIndex: 2 },
        { id: 'el3', type: 'shape', content: '', x: 20, y: 20, width: 600, height: 120, backgroundColor: '#333333', zIndex: 1, opacity: 0.8 },
      ]
    },
    {
      id: 'slide2',
      name: 'Drinks Menu',
      background: '#2d1b1b',
      elements: [
        { id: 'el4', type: 'text', content: 'Cold Drinks', x: 100, y: 100, width: 300, height: 50, fontSize: 32, color: '#fff', zIndex: 1 }
      ]
    },
    {
      id: 'slide3',
      name: 'Weekend Promo',
      background: '#0f172a',
      elements: []
    }
  ]
};

/**
 * MAIN COMPONENT
 */
export default function RestaurantSignageApp() {
  // Global State
  const [data, setData] = useState(INITIAL_DATA);
  const [currentLocationId, setCurrentLocationId] = useState(INITIAL_DATA.locations[0].id);
  
  // Navigation State
  const [view, setView] = useState('dashboard'); // dashboard, editor, display
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [displayScreenId, setDisplayScreenId] = useState(null);

  // Persistence
  const handleExport = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "restaurant_design.json";
    link.click();
  };

  const handleImport = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        setData(parsed);
      } catch (err) {
        alert("Invalid design file");
      }
    };
  };

  const activeLocation = data.locations.find(l => l.id === currentLocationId);

  return (
    <div className="w-full h-screen bg-neutral-900 text-white overflow-hidden font-sans">
      {/* HEADER (Only visible in Dashboard/Editor) */}
      {view !== 'display' && (
        <header className="h-14 border-b border-neutral-700 flex items-center justify-between px-4 bg-neutral-800">
          <div className="flex items-center gap-4">
            <Layout className="text-orange-500" />
            <h1 className="font-bold text-lg">AccelMenu <span className="text-xs font-normal text-neutral-400">Manager v2.0</span></h1>
            
            <div className="h-6 w-px bg-neutral-600 mx-2" />
            
            <select 
              className="bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm outline-none focus:border-orange-500"
              value={currentLocationId}
              onChange={(e) => setCurrentLocationId(e.target.value)}
            >
              {data.locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => document.getElementById('file-upload').click()}
              className="p-2 hover:bg-neutral-700 rounded text-neutral-300 transition-colors" title="Import"
            >
              <Upload size={18} />
              <input id="file-upload" type="file" className="hidden" onChange={handleImport} accept=".json" />
            </button>
            <button 
              onClick={handleExport}
              className="p-2 hover:bg-neutral-700 rounded text-neutral-300 transition-colors" title="Export"
            >
              <Download size={18} />
            </button>
            {view === 'editor' && (
              <button 
                onClick={() => setView('dashboard')}
                className="ml-4 px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </header>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="h-full relative">
        {view === 'dashboard' && (
          <Dashboard 
            location={activeLocation} 
            allSlides={data.slides}
            updateData={setData}
            onEditSlide={(slideId) => {
              setEditingSlideId(slideId);
              setView('editor');
            }}
            onPlayScreen={(screenId) => {
              setDisplayScreenId(screenId);
              setView('display');
            }}
          />
        )}

        {view === 'editor' && (
          <SlideEditor 
            slideId={editingSlideId}
            allSlides={data.slides}
            updateData={setData}
          />
        )}

        {view === 'display' && (
          <DisplayPlayer 
            screen={activeLocation.screens.find(s => s.id === displayScreenId)}
            allSlides={data.slides}
            onExit={() => setView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

/**
 * DASHBOARD COMPONENT
 * Manages physical layout of screens and slide stacks
 */
function Dashboard({ location, allSlides, updateData, onEditSlide, onPlayScreen }) {
  const [draggedScreen, setDraggedScreen] = useState(null);
  const [selectedScreenId, setSelectedScreenId] = useState(null);

  // Move screens around the "restaurant map"
  const handleDragStart = (e, screenId) => {
    setDraggedScreen(screenId);
  };

  const handleDropScreen = (e) => {
    e.preventDefault();
    if (!draggedScreen) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 50; // offset to center
    const y = e.clientY - rect.top - 50;

    updateData(prev => {
      const newLocs = [...prev.locations];
      const locIndex = newLocs.findIndex(l => l.id === location.id);
      const screenIndex = newLocs[locIndex].screens.findIndex(s => s.id === draggedScreen);
      newLocs[locIndex].screens[screenIndex] = {
        ...newLocs[locIndex].screens[screenIndex],
        x, y
      };
      return { ...prev, locations: newLocs };
    });
    setDraggedScreen(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  // Create new Slide
  const createSlide = () => {
    const newSlide = {
      id: generateId(),
      name: 'New Slide',
      background: '#111111',
      elements: []
    };
    updateData(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
  };

  // Assign slide to screen (Slide Stack)
  const addSlideToScreen = (screenId, slideId) => {
     updateData(prev => {
      const newLocs = [...prev.locations];
      const locIndex = newLocs.findIndex(l => l.id === location.id);
      const sIndex = newLocs[locIndex].screens.findIndex(s => s.id === screenId);
      const currentSlides = newLocs[locIndex].screens[sIndex].slides || [];
      
      if (!currentSlides.includes(slideId)) {
        newLocs[locIndex].screens[sIndex].slides = [...currentSlides, slideId];
      }
      return { ...prev, locations: newLocs };
    });
  };

  const selectedScreen = location.screens.find(s => s.id === selectedScreenId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* LEFT: Slide Repository */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-300">Slide Library</h2>
          <button onClick={createSlide} className="p-1 hover:bg-neutral-700 rounded"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allSlides.map(slide => (
            <div 
              key={slide.id} 
              draggable
              onDragStart={(e) => e.dataTransfer.setData('slideId', slide.id)}
              className="bg-neutral-800 p-3 rounded border border-neutral-700 hover:border-orange-500 cursor-move group"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{slide.name}</span>
                <button 
                  onClick={() => onEditSlide(slide.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-600 rounded text-xs"
                >
                  Edit
                </button>
              </div>
              <div 
                className="w-full h-20 rounded bg-neutral-900 overflow-hidden relative"
                style={{ backgroundColor: slide.background }}
              >
                {/* Mini preview */}
                {slide.elements.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-xs">
                    {slide.elements.length} items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: Layout Canvas */}
      <div className="flex-1 bg-neutral-950 relative overflow-hidden" 
           onDrop={handleDropScreen} 
           onDragOver={handleDragOver}
           style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <div className="absolute top-4 left-4 bg-neutral-800/80 p-2 rounded text-xs text-neutral-400 backdrop-blur">
          Location: {location.name} Layout View
        </div>

        {location.screens.map(screen => (
          <div
            key={screen.id}
            draggable
            onDragStart={(e) => handleDragStart(e, screen.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const slideId = e.dataTransfer.getData('slideId');
              if (slideId) {
                e.stopPropagation(); // Don't drop screen on map
                addSlideToScreen(screen.id, slideId);
              }
            }}
            onClick={() => setSelectedScreenId(screen.id)}
            style={{ 
              left: screen.x, 
              top: screen.y,
              borderWidth: selectedScreenId === screen.id ? '2px' : '1px'
            }}
            className={`absolute w-32 h-24 bg-neutral-800 rounded-lg shadow-xl cursor-move border-neutral-600 flex flex-col items-center justify-center transition-colors hover:border-orange-400 ${selectedScreenId === screen.id ? 'border-orange-500 bg-neutral-800' : ''}`}
          >
            <Monitor className="text-neutral-500 mb-1" size={20} />
            <span className="text-xs font-medium text-center px-1 truncate w-full">{screen.name}</span>
            <span className="text-[10px] text-neutral-500">{(screen.slides || []).length} Slides</span>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onPlayScreen(screen.id); }}
              className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-1 shadow-lg hover:bg-green-500 hover:scale-110 transition-all"
            >
              <Play size={10} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>

      {/* RIGHT: Selected Screen Properties / Stack Manager */}
      <div className={`w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col transition-all duration-300 ${selectedScreenId ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
        {selectedScreen && (
          <>
            <div className="p-4 border-b border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">{selectedScreen.name}</h2>
                <button onClick={() => setSelectedScreenId(null)}><X size={16} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Rotation (ms)</label>
                  <input 
                    type="number" 
                    value={selectedScreen.rotation}
                    onChange={(e) => {
                      updateData(prev => {
                        const newLocs = [...prev.locations];
                        const s = newLocs.find(l => l.id === location.id).screens.find(sc => sc.id === selectedScreen.id);
                        s.rotation = parseInt(e.target.value);
                        return { ...prev, locations: newLocs };
                      })
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-3">Slide Stack</h3>
              <div className="space-y-2">
                {selectedScreen.slides.map((sId, idx) => {
                  const slideObj = allSlides.find(s => s.id === sId);
                  if (!slideObj) return null;
                  return (
                    <div key={idx} className="bg-neutral-800 p-2 rounded flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-4">{idx + 1}</span>
                        <span className="text-sm">{slideObj.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => onEditSlide(sId)}
                            className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                          >
                            <Settings size={14} />
                        </button>
                        <button 
                          onClick={() => {
                             updateData(prev => {
                              const newLocs = [...prev.locations];
                              const s = newLocs.find(l => l.id === location.id).screens.find(sc => sc.id === selectedScreen.id);
                              s.slides = s.slides.filter((_, i) => i !== idx);
                              return { ...prev, locations: newLocs };
                             });
                          }}
                          className="p-1 hover:bg-red-900/50 rounded text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {selectedScreen.slides.length === 0 && (
                   <div className="text-center py-8 text-neutral-600 text-sm border-2 border-dashed border-neutral-800 rounded">
                     Drag slides here from the library
                   </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


/**
 * SLIDE EDITOR COMPONENT
 * Photoshop-like drag/drop editing
 */
function SlideEditor({ slideId, allSlides, updateData }) {
  const slide = allSlides.find(s => s.id === slideId);
  const [selectedElId, setSelectedElId] = useState(null);
  const [panelsMinimized, setPanelsMinimized] = useState(false);
  const canvasRef = useRef(null);
  
  // Drag State
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!slide) return <div>Slide not found</div>;

  // -- Element Handlers --

  const handleAddElement = (type) => {
    const newEl = {
      id: generateId(),
      type,
      content: type === 'price' ? '$0.00' : (type === 'text' ? 'New Text' : ''),
      x: 100, y: 100,
      width: type === 'text' || type === 'price' ? 200 : 150,
      height: type === 'text' || type === 'price' ? 60 : 150,
      color: '#ffffff',
      backgroundColor: type === 'shape' ? '#333333' : 'transparent',
      fontSize: 24,
      zIndex: slide.elements.length + 1,
      opacity: 1
    };

    updateSlideElements([...slide.elements, newEl]);
  };

  const updateSlideElements = (newElements) => {
    updateData(prev => ({
      ...prev,
      slides: prev.slides.map(s => s.id === slideId ? { ...s, elements: newElements } : s)
    }));
  };

  const updateSelectedElement = (updates) => {
    if (!selectedElId) return;
    const newElements = slide.elements.map(el => 
      el.id === selectedElId ? { ...el, ...updates } : el
    );
    updateSlideElements(newElements);
  };

  const handleMouseDown = (e, elId) => {
    e.stopPropagation();
    setSelectedElId(elId);
    setDragging(true);
    
    const el = slide.elements.find(e => e.id === elId);
    // Calculate offset from top-left of element
    // We need to account for canvas offset/scaling in a real app, keeping it simple here
    setDragOffset({
      x: e.nativeEvent.offsetX, 
      y: e.nativeEvent.offsetY
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !selectedElId) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    updateSelectedElement({ x, y });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const selectedElement = slide.elements.find(e => e.id === selectedElId);

  return (
    <div 
      className="flex h-[calc(100vh-3.5rem)] bg-neutral-900 overflow-hidden relative"
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* TOOLBAR */}
      <div className={`absolute left-0 top-0 bottom-0 bg-neutral-800 border-r border-neutral-700 z-20 transition-all duration-300 ${panelsMinimized ? '-translate-x-full' : 'w-16 flex flex-col items-center py-4 gap-4'}`}>
        {TILE_TYPES.map((t) => (
          <button 
            key={t.type}
            onClick={() => handleAddElement(t.type)}
            className="w-10 h-10 rounded hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors relative group"
            title={t.label}
          >
            <t.icon size={20} />
            <span className="absolute left-full ml-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* CANVAS AREA */}
      <div 
        className={`flex-1 flex items-center justify-center bg-neutral-900 relative transition-all duration-300 ${panelsMinimized ? 'ml-0 mr-0' : 'ml-16 mr-80'}`}
        onClick={() => setSelectedElId(null)}
      >
        <button 
          onClick={() => setPanelsMinimized(!panelsMinimized)}
          className="absolute top-4 right-4 z-30 p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white shadow-lg"
        >
          {panelsMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
        </button>

        {/* The Slide "Artboard" */}
        <div 
          ref={canvasRef}
          className="relative shadow-2xl overflow-hidden"
          style={{ 
            width: '800px', 
            height: '450px', // 16:9 Aspect Ratio
            backgroundColor: slide.background,
            backgroundImage: slide.background === 'transparent' ? 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)' : 'none',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' 
          }}
        >
          {slide.elements.sort((a,b) => a.zIndex - b.zIndex).map(el => (
             <RndElement 
                key={el.id} 
                data={el} 
                isSelected={selectedElId === el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
             />
          ))}
        </div>
      </div>

      {/* PROPERTIES PANEL */}
      <div className={`absolute right-0 top-0 bottom-0 bg-neutral-800 border-l border-neutral-700 z-20 transition-all duration-300 ${panelsMinimized ? 'translate-x-full' : 'w-80 translate-x-0'}`}>
        <div className="p-4 border-b border-neutral-700">
          <h3 className="font-semibold text-neutral-200">Properties</h3>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
          {selectedElement ? (
            <>
              <div>
                <label className="text-xs text-neutral-500 uppercase mb-1 block">Content</label>
                {(selectedElement.type === 'text' || selectedElement.type === 'price') ? (
                  <textarea 
                    value={selectedElement.content}
                    onChange={(e) => updateSelectedElement({ content: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-orange-500 outline-none"
                    rows={3}
                  />
                ) : (
                  <div className="text-sm text-neutral-500 italic">Content editing not implemented for this type in demo.</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase mb-1 block">X Position</label>
                  <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => updateSelectedElement({ x: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase mb-1 block">Y Position</label>
                  <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => updateSelectedElement({ y: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase mb-1 block">Width</label>
                  <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => updateSelectedElement({ width: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase mb-1 block">Height</label>
                  <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => updateSelectedElement({ height: Number(e.target.value) })} className="w-full bg-neutral-900 border border-neutral-700 rounded p-1 text-sm"/>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase mb-1 block">Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={selectedElement.color || '#ffffff'}
                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                  />
                  <span className="text-sm text-neutral-400">{selectedElement.color}</span>
                </div>
              </div>

              {selectedElement.type === 'shape' && (
                 <div>
                 <label className="text-xs text-neutral-500 uppercase mb-1 block">Background Color</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="color" 
                     value={selectedElement.backgroundColor || '#333333'}
                     onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                     className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                   />
                 </div>
               </div>
              )}

              {(selectedElement.type === 'text' || selectedElement.type === 'price') && (
                <div>
                   <label className="text-xs text-neutral-500 uppercase mb-1 block">Font Size</label>
                   <input 
                    type="range" min="12" max="120" 
                    value={selectedElement.fontSize}
                    onChange={(e) => updateSelectedElement({ fontSize: Number(e.target.value) })}
                    className="w-full"
                   />
                   <div className="text-right text-xs text-neutral-400">{selectedElement.fontSize}px</div>
                </div>
              )}

               <div className="pt-4 border-t border-neutral-700">
                  <label className="text-xs text-neutral-500 uppercase mb-1 block">Layering</label>
                  <div className="flex gap-2">
                    <button onClick={() => updateSelectedElement({ zIndex: selectedElement.zIndex + 1 })} className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded text-xs">Bring Forward</button>
                    <button onClick={() => updateSelectedElement({ zIndex: Math.max(0, selectedElement.zIndex - 1) })} className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded text-xs">Send Backward</button>
                  </div>
               </div>
               
               <button 
                onClick={() => {
                  const newEls = slide.elements.filter(e => e.id !== selectedElId);
                  updateSlideElements(newEls);
                  setSelectedElId(null);
                }}
                className="w-full py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded mt-4 flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Trash2 size={16} /> Delete Element
              </button>
            </>
          ) : (
            // Slide Properties (No element selected)
            <>
              <div>
                <label className="text-xs text-neutral-500 uppercase mb-1 block">Slide Name</label>
                <input 
                  type="text" 
                  value={slide.name}
                  onChange={(e) => updateData(prev => ({
                    ...prev,
                    slides: prev.slides.map(s => s.id === slideId ? { ...s, name: e.target.value } : s)
                  }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 uppercase mb-1 block">Background Color</label>
                <div className="flex items-center gap-2">
                   <input 
                     type="color" 
                     value={slide.background}
                     onChange={(e) => updateData(prev => ({
                       ...prev,
                       slides: prev.slides.map(s => s.id === slideId ? { ...s, background: e.target.value } : s)
                     }))}
                     className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                   />
                 </div>
              </div>
              <div className="mt-8 text-neutral-500 text-sm p-4 bg-neutral-900 rounded border border-neutral-800">
                 Select an element on the canvas to edit its properties.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * COMPONENT: Single Renderable Element (Shared between Editor and Player)
 */
function RndElement({ data, isSelected, onMouseDown }) {
  const style = {
    position: 'absolute',
    left: `${data.x}px`,
    top: `${data.y}px`,
    width: `${data.width}px`,
    height: `${data.height}px`,
    zIndex: data.zIndex,
    cursor: onMouseDown ? 'move' : 'default',
    color: data.color,
    fontSize: `${data.fontSize}px`,
    fontFamily: data.fontFamily || 'sans-serif',
    backgroundColor: data.backgroundColor || 'transparent',
    opacity: data.opacity || 1
  };

  const renderContent = () => {
    switch (data.type) {
      case 'text':
      case 'price':
        return (
          <div className="w-full h-full flex items-center leading-tight whitespace-pre-wrap">
             {data.content}
          </div>
        );
      case 'shape':
        return <div className="w-full h-full border border-white/10" />;
      case 'image':
        return (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-600">
             <ImageIcon size={32} />
             <span className="text-xs ml-2">Image Placeholder</span>
          </div>
        );
      case 'video':
        return (
           <div className="w-full h-full bg-black flex items-center justify-center text-neutral-500">
             <Video size={32} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      style={style} 
      onMouseDown={onMouseDown}
      className={`${isSelected ? 'ring-2 ring-orange-500' : ''} hover:ring-1 hover:ring-white/30 transition-shadow select-none`}
    >
       {renderContent()}
       {/* Visual Handle for selected state */}
       {isSelected && (
         <>
           <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-500 rounded-full" />
           <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
         </>
       )}
    </div>
  );
}

/**
 * DISPLAY PLAYER COMPONENT
 * Fullscreen, no UI, auto-rotating
 */
function DisplayPlayer({ screen, allSlides, onExit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const slidesToPlay = screen.slides.map(id => allSlides.find(s => s.id === id)).filter(Boolean);
  const currentSlide = slidesToPlay[currentIndex];

  useEffect(() => {
    if (slidesToPlay.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slidesToPlay.length);
    }, screen.rotation || DEFAULT_SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [screen.rotation, slidesToPlay.length]);

  if (!currentSlide) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold mb-4">No Signal</h1>
        <p className="text-neutral-500">Screen: {screen.name}</p>
        <p className="text-neutral-500">No slides configured.</p>
        <button onClick={onExit} className="mt-8 px-4 py-2 bg-neutral-800 rounded">Exit</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-none">
       {/* RENDER SLIDE (Scaled to fit screen) */}
       {/* In a real app, we'd use CSS transform scale to fit the viewport perfectly */}
       <div 
         className="w-full h-full relative"
         style={{ 
           backgroundColor: currentSlide.background,
         }}
       >
          {currentSlide.elements.sort((a,b) => a.zIndex - b.zIndex).map(el => (
             // We need to scale positions based on viewport vs canvas size. 
             // For this demo, we assume 1:1 or rely on CSS scaling if implemented.
             // Here we just render them absolutely.
             <div 
              key={el.id}
              style={{
                position: 'absolute',
                left: el.x, // Simplified: In real app use percentages or scale transform
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
                color: el.color,
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                backgroundColor: el.backgroundColor,
                opacity: el.opacity,
                // Simple centering text for demo
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'pre-wrap'
              }}
             >
                {el.type === 'text' || el.type === 'price' ? el.content : ''}
                {el.type === 'image' && <div className="w-full h-full bg-neutral-800 flex items-center justify-center"><ImageIcon className="opacity-50" size={48} /></div>}
                {el.type === 'video' && <div className="w-full h-full bg-black flex items-center justify-center"><Video className="opacity-50" size={48} /></div>}
             </div>
          ))}
       </div>

       {/* THE INVISIBLE BUTTON */}
       <div 
        onClick={onExit}
        className="fixed bottom-0 right-0 w-16 h-16 opacity-0 hover:opacity-10 z-50 cursor-pointer flex items-center justify-center bg-white transition-opacity"
        title="Exit Display Mode"
       >
         <span className="text-black font-bold text-xs">EXIT</span>
       </div>
    </div>
  );
}
