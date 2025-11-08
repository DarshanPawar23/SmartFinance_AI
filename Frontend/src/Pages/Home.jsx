import React from 'react';
import { Link } from 'react-router-dom'; 

function Home() {
    return (
        <div className="relative min-h-screen w-full bg-gray-950 text-white 
                      bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] 
                      [background-size:60px_60px]">
            
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/50 to-transparent"></div>

            <div className="relative z-10 mx-auto max-w-7xl px-6">
                
                <header className="flex items-center justify-between py-6">
                    <Link to="/" className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                            Smart Finance AI
                        </span>
                    </Link>
                    
                    <nav className="hidden items-center space-x-8 md:flex">
                        <a href="#" className="text-gray-300 transition-colors hover:text-green-400">Features</a>
                        <a href="#" className="text-gray-300 transition-colors hover:text-green-400">Tech Stack</a>
                        <a href="#" className="text-gray-300 transition-colors hover:text-green-400">Demo</a>
                        <a href="#" className="rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20">
                            Contact
                        </a>
                    </nav>

                    <div className="md:hidden">
                        <button className="text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main className="flex min-h-[calc(100vh-100px)] flex-col items-center justify-center pb-24 text-center">
                    
                    <div className="mb-6 rounded-full border border-green-400/30 bg-green-900/20 px-4 py-1.5">
                        <span className="text-sm font-medium text-green-300">
                            AI-POWERED FINANCIAL GUIDANCE
                        </span>
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                        <span className="bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x">
                            Smart Finance AI
                        </span>
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 md:text-xl">
                        Harness the power of artificial intelligence to analyze your spending,
                        optimize investments, and achieve your financial goals in real-time.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                        
                        <Link to="/agent" className="flex items-center gap-2 rounded-full bg-green-500 px-7 py-3.5 text-base font-bold text-gray-900 
                                          shadow-lg shadow-green-500/50 transition-all duration-300 
                                          hover:scale-105 hover:bg-green-400 
                                          hover:shadow-2xl hover:shadow-green-500/40">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
                            </svg>
                            Launch Agent
                        </Link>
                        
                        <a href="#" className="rounded-full bg-white/10 px-7 py-3.5 text-base font-medium text-white 
                                          backdrop-blur-sm transition-all duration-300 
                                          hover:scale-105 hover:bg-white/20">
                            View Features
                        </a>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default Home;