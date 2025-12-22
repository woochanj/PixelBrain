import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Define the structure for our analyzed data chunks
interface SheetSummary {
    name: string;
    rows: number;
    preview: any[];
    status: 'WAITING' | 'ANALYZING' | 'DONE';
    analysis?: string;
}

function Excel() {
    const [file, setFile] = useState<File | null>(null);
    const [sheets, setSheets] = useState<SheetSummary[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });

            // Parse all sheets
            const sheetData: SheetSummary[] = wb.SheetNames.map(name => {
                const ws = wb.Sheets[name];
                const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
                return {
                    name,
                    rows: json.length,
                    preview: json.slice(0, 3), // Save top 3 rows for preview
                    status: 'WAITING'
                };
            });

            setSheets(sheetData);
            setIsProcessing(false);
        };
        reader.readAsBinaryString(selectedFile);
    };

    return (
        <div className="w-full h-screen flex flex-col bg-[#202020] border-x-4 border-black mx-auto max-w-[800px]">
            {/* Header */}
            <header className="p-5 border-b-4 border-black flex items-center justify-between gap-4 shadow-[0_4px_0_rgba(0,0,0,0.2)] z-10 shrink-0" style={{ backgroundColor: '#9b59b6' }}>
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center justify-center w-8 h-8 p-0 no-underline bg-white border-2 border-black shadow-[2px_2px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-transform hover:bg-gray-100">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="black" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                            <rect x="6" y="2" width="2" height="2" />
                            <rect x="4" y="4" width="2" height="2" />
                            <rect x="2" y="6" width="2" height="2" />
                            <rect x="0" y="8" width="2" height="2" />
                            <rect x="2" y="10" width="2" height="2" />
                            <rect x="4" y="12" width="2" height="2" />
                            <rect x="6" y="14" width="2" height="2" />
                            <rect x="6" y="8" width="10" height="2" />
                        </svg>
                    </Link>
                    <h1 className="font-['Press_Start_2P',cursive] text-[20px] text-white m-0 drop-shadow-[2px_2px_0_#000]">Excel Tool</h1>
                </div>
            </header>

            {/* Content area */}
            <div className="flex-1 flex flex-col p-5 overflow-hidden">
                {!file ? (
                    // Upload Screen
                    <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-[#555] bg-[#2d2d2d] m-5 text-[#9b59b6] font-['DungGeunMo',sans-serif]">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="mb-4 animate-bounce">
                            <path d="M12 2L12 16M12 16L8 12M12 16L16 12" stroke="currentColor" strokeWidth="2" />
                            <rect x="4" y="18" width="16" height="2" fill="currentColor" />
                        </svg>
                        <p className="text-xl mb-4">DRAG & DROP EXCEL FILE</p>
                        <label className="cursor-pointer bg-[#9b59b6] text-black border-[3px] border-black px-6 py-3 font-['Press_Start_2P',cursive] text-sm shadow-[4px_4px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                            CLICK TO UPLOAD
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                ) : (
                    // Analysis Dashboard
                    <div className="flex-1 flex flex-col gap-5 overflow-hidden">
                        {/* Status Bar */}
                        <div className="bg-black p-3 border-2 border-[#555] font-['DungGeunMo',sans-serif] text-white flex justify-between items-center">
                            <span>FILE: {file.name}</span>
                            <span className="text-[#f7d51d]">SHEETS: {sheets.length}</span>
                        </div>

                        {/* Sheet Grid (Disk Defrag Style) */}
                        <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-4 border-2 border-black shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                                {sheets.map((sheet, idx) => (
                                    <div key={idx} className={`aspect-square p-2 border-2 border-black relative group cursor-pointer transition-all hover:scale-105 ${sheet.status === 'DONE' ? 'bg-[#2ecc71]' :
                                            sheet.status === 'ANALYZING' ? 'bg-[#f1c40f] animate-pulse' :
                                                'bg-[#34495e]'
                                        }`}>
                                        <div className="text-[10px] text-white font-['Press_Start_2P',cursive] truncate mb-1">
                                            {idx + 1}
                                        </div>
                                        <div className="text-[12px] font-bold text-white font-['DungGeunMo',sans-serif] break-all leading-tight">
                                            {sheet.name}
                                        </div>
                                        <div className="absolute bottom-1 right-2 text-[10px] text-gray-300">
                                            {sheet.rows}R
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Control Panel */}
                        <div className="h-[80px] bg-[#2d2d2d] border-t-4 border-black p-3 flex justify-end items-center gap-4">
                            <button className="bg-[#9b59b6] text-white border-[3px] border-black px-6 py-2 font-['Press_Start_2P',cursive] text-xs shadow-[4px_4px_0_#000] hover:bg-[#8e44ad]">
                                START ANALYSIS
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Excel;
