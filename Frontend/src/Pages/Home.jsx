import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ShieldIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v2.25A2.25 2.25 0 0 0 4.5 11.25v6.75a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25V6.75A5.25 5.25 0 0 0 12 1.5ZM8.25 6.75a3.75 3.75 0 1 1 7.5 0v2.25a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75V6.75Z" clipRule="evenodd" />
    </svg>
);
const DiamondIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
        <path d="M11.645 20.91l-.007-.003-.021-.009a12.79 12.79 0 0 1-2.108-.946 11.83 11.83 0 0 1-3.682-2.583 11.85 11.85 0 0 1-2.56-3.805 12.39 12.39 0 0 1-.944-4.814V4.7c0-.77.584-1.39 1.34-1.523l.119-.022h.11l.114.022a1.35 1.35 0 0 1 1.34 1.523v.475h14.735V4.7c0-.77-.584-1.39-1.34-1.523l-.119-.022h-.11l-.114.022a1.35 1.35 0 0 1-1.34 1.523v5.03c0 2.05-.515 4.025-1.527 5.797a11.84 11.84 0 0 1-2.56 3.805 11.82 11.82 0 0 1-3.682 2.583 12.79 12.79 0 0 1-2.108.946l-.021.009-.007.003h-.001Z" />
    </svg>
);
const HandShakeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${className}`}>
        <path d="M11.645 20.91l-.007-.003-.021-.009a12.79 12.79 0 0 1-2.108-.946 11.83 11.83 0 0 1-3.682-2.583 11.85 11.85 0 0 1-2.56-3.805 12.39 12.39 0 0 1-.944-4.814V4.7c0-.77.584-1.39 1.34-1.523l.119-.022h.11l.114.022a1.35 1.35 0 0 1 1.34 1.523v.475h14.735V4.7c0-.77-.584-1.39-1.34-1.523l-.119-.022h-.11l-.114.022a1.35 1.35 0 0 1-1.34 1.523v5.03c0 2.05-.515 4.025-1.527 5.797a11.84 11.84 0 0 1-2.56 3.805 11.82 11.82 0 0 1-3.682 2.583 12.79 12.79 0 0 1-2.108.946l-.021-.009-.007-.003h-.001Z" />
    </svg>
);

const TechStackModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const techs = [
        { name: 'Data Security Protocol', icon: <ShieldIcon className="text-red-500" />, desc: 'Tier 1 bank-grade encryption and audited security infrastructure.' },
        { name: 'Compliance Layer (RegTech)', icon: <DiamondIcon className="text-sky-400" />, desc: 'Real-time adherence to global financial regulations and mandates.' },
        { name: 'AI Decision Engine', icon: <HandShakeIcon className="text-amber-500" />, desc: 'Proprietary models ensuring ethical, risk-mitigated investment decisions.' },
    ];

    return (
        <div 
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl rounded-xl bg-slate-900 border border-slate-700 p-10 shadow-2xl transition-all duration-300 animate-scale-in"
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 rounded-full hover:bg-slate-800 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <h2 className="text-3xl font-bold font-serif text-center mb-8 text-white tracking-tight">
                    <span className="text-amber-500">Foundation</span> of Institutional Trust
                </h2>
                
                <ul className="space-y-4">
                    {techs.map((tech) => (
                        <li 
                            key={tech.name} 
                            className="group flex items-center gap-4 p-5 bg-slate-800/50 rounded-lg border-l-4 border-slate-700 
                                       hover:bg-slate-800 hover:border-amber-500 transition-all duration-300 cursor-default"
                        >
                            <span className="flex-shrink-0">{tech.icon}</span>
                            <div>
                                <h3 className="font-semibold text-white text-lg">{tech.name}</h3>
                                <p className="text-sm text-slate-400">{tech.desc}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const MobileMenu = ({ isOpen, onLinkClick }) => {
    return (
        <div 
            className={`md:hidden absolute top-[80px] left-0 right-0 z-40 bg-gray-950 border-b border-slate-800 shadow-2xl
                transition-all duration-300 ease-in-out transform origin-top
                ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}
        >
            <nav className="flex flex-col items-center space-y-1 p-6">
                <button type="button" onClick={onLinkClick} className="w-full py-3 text-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors cursor-not-allowed opacity-70">Solutions</button>
                <button type="button" onClick={onLinkClick} className="w-full py-3 text-lg text-slate-200 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors">Compliance</button>
                <button type="button" onClick={onLinkClick} className="w-full py-3 text-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors cursor-not-allowed opacity-70">Research</button>
                <a 
                    href="mailto:darshan07@gmail.com"
                    className="w-full mt-4 rounded-lg bg-amber-500 py-3 text-base font-semibold text-gray-900 text-center shadow-lg transition-colors hover:bg-amber-400"
                >
                    Inquire Now
                </a>
            </nav>
        </div>
    );
};

export default function Home() {
    const [isTechStackOpen, setIsTechStackOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleMobileLinkClick = (e) => {
        setIsMobileMenuOpen(false);
        if (e.target.textContent.includes('Compliance')) {
            setIsTechStackOpen(true);
        }
    };

    const animationStyles = `
        @keyframes gradient-move {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
            animation: gradient-move 12s ease-in-out infinite;
            background-size: 400% 400%;
        }
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
            animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
    `;

    return (
        <div className="relative min-h-screen w-full bg-gray-950 text-white font-serif overflow-x-hidden selection:bg-amber-500/30">
            
            <style>{animationStyles}</style>
            
            <div className="absolute inset-0 z-0 opacity-70 pointer-events-none 
                        bg-[radial-gradient(ellipse_at_top,_var(--tw-color-indigo-900)_0%,_transparent_60%)]"></div>
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none 
                        bg-[linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(0deg,#fff_1px,transparent_1px)] 
                        [background-size:150px_150px]"></div>

            <div className="relative z-10 mx-auto max-w-7xl px-6">
                
                <header className="relative z-50 flex items-center justify-between py-6 md:py-8 border-b border-slate-700/50">
                    <Link to="/" className="text-3xl font-bold tracking-tight">
                        <span className="text-white">Smart</span> 
                        <span className="text-amber-500">Finance</span>
                        <span className="text-sky-400"> AI</span>
                    </Link>
                    
                    <nav className="hidden items-center space-x-10 md:flex">
                        <button type="button" className="text-base font-medium text-slate-400 transition-colors hover:text-amber-400 cursor-not-allowed">Solutions</button>
                        <button 
                            onClick={() => setIsTechStackOpen(true)}
                            className="text-base font-medium text-slate-200 transition-colors hover:text-amber-400"
                        >
                            Trust & Compliance
                        </button>
                        <button type="button" className="text-base font-medium text-slate-400 transition-colors hover:text-amber-400 cursor-not-allowed">Research</button>
                        <a 
                            href="mailto:darshan07@gmail.com" 
                            className="rounded-lg bg-amber-500 px-6 py-2.5 text-base font-bold text-gray-950 transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/30"
                        >
                            Inquire Now
                        </a>
                    </nav>

                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-200 hover:text-white transition-colors">
                            {isMobileMenuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-7 w-7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="h-7 w-7">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            )}
                        </button>
                    </div>
                </header>

                <MobileMenu 
                    isOpen={isMobileMenuOpen} 
                    onLinkClick={(e) => {
                        if (e.target.textContent.includes('Compliance')) {
                            handleMobileLinkClick(e);
                        } else {
                            setIsMobileMenuOpen(false);
                        }
                    }}
                />

                <main className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center pb-24 text-center">
                    
                    <div className="animate-fade-in [animation-delay:100ms] [animation-fill-mode:forwards] mb-8 inline-flex items-center rounded-full border-2 border-amber-600/50 bg-amber-900/20 px-6 py-2 backdrop-blur-sm">
                        <span className="text-sm font-semibold tracking-wider text-amber-400 uppercase">
                            Your Wealth. Our Intelligence.
                        </span>
                    </div>

                    <h1 className="animate-fade-in [animation-delay:300ms] [animation-fill-mode:forwards] text-6xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[100px] leading-none max-w-6xl">
                        Institutional-Grade <br />
                        <span className="bg-gradient-to-r from-amber-400 via-white to-amber-400 bg-clip-text text-transparent animate-gradient-move">
                            Smart Finance AI
                            <span>Dsp</span>
                        </span>
                    </h1>

                    <p className="animate-fade-in [animation-delay:500ms] [animation-fill-mode:forwards] mx-auto mt-8 max-w-4xl text-xl text-slate-300 md:text-2xl leading-relaxed font-light">
                        Deploy dedicated financial intelligence agents built on proprietary data models to secure and grow your portfolio with unmatched rigor and speed.
                    </p>

                    <div className="animate-fade-in [animation-delay:700ms] [animation-fill-mode:forwards] mt-16 flex flex-col items-center gap-6 sm:flex-row">
                        
                        <Link to="/agent" className="group relative flex items-center gap-3 rounded-lg bg-amber-500 px-10 py-4 text-base font-bold text-gray-950 
                                                  shadow-2xl shadow-amber-500/50 transition-all duration-300 
                                                  hover:scale-[1.03] hover:bg-amber-400 hover:shadow-amber-400/70">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 transition-transform group-hover:translate-x-1">
                                <path d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v2.25C6.75 10.39 7.36 10.79 8 10.79v-2.25a3.75 3.75 0 1 1 7.5 0v2.25c.64 0 1.25-.4 1.25-1.25V6.75A5.25 5.25 0 0 0 12 1.5ZM8 12.5v2.5a.75.75 0 0 0 .75.75h6.5a.75.75 0 0 0 .75-.75v-2.5a.75.75 0 0 0-1.5 0v1.75h-5.5v-1.75a.75.75 0 0 0-1.5 0Z" />
                                <path fillRule="evenodd" d="M12 17.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 .75-.75V11.5a.75.75 0 0 0-1.5 0v5.25h-5.25Z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M12 17.25a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1-.75-.75V11.5a.75.75 0 0 1 1.5 0v5.25h5.25Z" clipRule="evenodd" />
                            </svg>
                            Connect with Agent
                        </Link>
                        
                        <button type="button" className="group rounded-lg border-2 border-slate-700 px-10 py-4 text-base font-medium text-slate-300 
                                                       backdrop-blur-sm transition-all duration-300 
                                                       hover:scale-[1.03] hover:border-white hover:text-white cursor-not-allowed opacity-80">
                            Schedule Consultation
                        </button>
                    </div>

                    <div className="animate-fade-in [animation-delay:1000ms] [animation-fill-mode:forwards] mt-24 w-full max-w-5xl rounded-lg border-4 border-amber-500/50 bg-slate-900/50 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-900/50">
                        <div className="flex justify-between items-center border-b-2 border-slate-700 pb-4 mb-4">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Client Portfolio Snapshot</h3>
                            <span className="text-sm font-semibold text-amber-500">Compliance Check: Passed</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left pt-2">
                            <div className="p-3">
                                <p className="text-sm text-slate-400 mb-1">Total AUM</p>
                                <p className="text-2xl font-bold text-white">$452,109<span className="text-sm font-normal text-amber-500 ml-2">+1.2% YTD</span></p>
                            </div>
                            <div className="p-3">
                                <p className="text-sm text-slate-400 mb-1">Liquidity Rating</p>
                                <p className="text-2xl font-bold text-sky-400">Excellent</p>
                            </div>
                            <div className="p-3">
                                <p className="text-sm text-slate-400 mb-1">AI Risk Buffer</p>
                                <p className="text-2xl font-bold text-white">40%</p>
                            </div>
                            <div className="p-3">
                                <p className="text-sm text-slate-400 mb-1">Transaction Security</p>
                                <p className="text-2xl font-bold text-red-400">256-bit AES</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            
            <TechStackModal isOpen={isTechStackOpen} onClose={() => setIsTechStackOpen(false)} />
            
        </div>
    );
}