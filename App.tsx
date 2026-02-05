
import React, { useState, useEffect, useRef } from 'react';
import { AssetData, ChatMessage } from './types';
import { analyzeDashboardData } from './services/geminiService';
import { RAW_CSV_DATA } from './constants';

const App: React.FC = () => {
  const [data, setData] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const parseCSV = (csv: string): AssetData[] => {
    const lines = csv.split('\n');
    const result: AssetData[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;
      const matches = lines[i].match(regex);
      if (matches && matches.length >= 6) {
        const negeri = matches[0].trim();
        const bil = matches[1].trim();
        const nama = matches[2].replace(/"/g, '').trim();
        const alamat = matches[3].replace(/"/g, '').trim();
        const lat = parseFloat(matches[4]);
        const lon = parseFloat(matches[5]);
        const kategori = (matches[6] || "Balai Bomba").trim();
        const anggota = parseInt(matches[7]) || 0;
        const wanita = parseInt(matches[8]) || 0;
        const lelaki = parseInt(matches[9]) || 0;
        if (!isNaN(lat) && !isNaN(lon)) {
          result.push({
            id: `${negeri}-${bil}`,
            name: nama,
            category: kategori,
            location: negeri,
            status: "Aktif",
            capacity: anggota, femaleStaff: wanita, maleStaff: lelaki,
            coordinates: { lat, lng: lon }, address: alamat,
            attributes: {}
          });
        }
      }
    }
    return result;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(parseCSV(RAW_CSV_DATA));
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Initial greeting
  useEffect(() => {
    if (!isLoading && chatHistory.length === 0) {
      const greeting: ChatMessage = {
        role: 'model',
        content: "Hai! Saya BOMBAbot ! Ada apa-apa yang boleh saya bantu hari ini?",
        timestamp: new Date()
      };
      setChatHistory([greeting]);
    }
  }, [isLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isAnalyzing]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAnalyzing) return;
    const userMsg: ChatMessage = { role: 'user', content: inputMessage, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsAnalyzing(true);
    const response = await analyzeDashboardData(data, inputMessage);
    setChatHistory(prev => [...prev, { role: 'model', content: response, timestamp: new Date() }]);
    setIsAnalyzing(false);
  };

  if (isLoading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Menyiapkan BOMBAbot...</p>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden font-sans text-slate-200">
      {/* Header */}
      <nav className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-100 tracking-tight leading-none uppercase">BOMBA<span className="text-red-500">bot</span></h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Sedia Berkhidmat</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
           Dataset: <span className="text-slate-300 ml-1">{data.length} Balai Nasional</span>
        </div>
      </nav>

      {/* Chat Area */}
      <div className="flex-grow flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-3xl flex-grow overflow-y-auto px-4 py-6 space-y-6 chat-container">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-red-700 text-white rounded-tr-none border border-red-600/30' 
                  : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none font-medium'
              }`}>
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mb-2 opacity-60">
                    <div className="w-4 h-4 bg-red-600 rounded-md flex items-center justify-center text-white scale-75">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">BOMBAbot</span>
                  </div>
                )}
                <div 
                  className="prose prose-sm max-w-none prose-dark" 
                  dangerouslySetInnerHTML={{ 
                    __html: msg.content
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<b class="font-black text-white">$1</b>') 
                  }} 
                />
              </div>
            </div>
          ))}
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-lg animate-pulse">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Menyemak Data...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="w-full max-w-3xl p-4 shrink-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <div className="glass-card rounded-2xl p-2 border border-slate-800 shadow-2xl shadow-black">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                autoFocus
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanya BOMBAbot (cth: Berapa balai di Kedah?)"
                className="flex-grow bg-transparent border-none py-3 px-4 text-sm focus:ring-0 outline-none font-semibold placeholder:text-slate-600 text-slate-200"
              />
              <button 
                type="submit" 
                disabled={!inputMessage.trim() || isAnalyzing}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                  !inputMessage.trim() || isAnalyzing 
                    ? 'bg-slate-800 text-slate-600' 
                    : 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-900/40'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </div>
          <p className="text-center text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-4">
            BOMBAbot • Dataset v1.1 • Analisis Spatial & Atribut
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
