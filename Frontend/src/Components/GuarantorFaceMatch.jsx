import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let faceLandmarker;
let lastVideoTime = -1;

const GuarantorFaceMatch = ({
    formData,
    updateField,
    faceApiReady,
    modelsLoaded
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const uploadedImageRef = useRef(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [isComparing, setIsComparing] = useState(false);

    const [livenessStatus, setLivenessStatus] = useState('Initializing...');
    const [faceCentered, setFaceCentered] = useState(false);
    const [livenessPassed, setLivenessPassed] = useState(false);

    const animationStyle = `
        @keyframes scan {
            0% { transform: translateY(0); opacity: 0.6; }
            100% { transform: translateY(100%); opacity: 0.1; }
        }
        .scan-bar {
            position: absolute; top: 0; left: 0; right: 0;
            height: 40px;
            background: linear-gradient(to bottom, rgba(74, 144, 226, 0.1), rgba(74, 144, 226, 0.7), rgba(74, 144, 226, 0.1));
            border-bottom: 2px solid #4A90E2;
            animation: scan 2s ease-in-out infinite alternate;
            z-index: 10;
        }
    `;

    useEffect(() => {
        const createFaceLandmarker = async () => {
            try {
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO"
                });
                setLivenessStatus('Please start camera...');
            } catch (err) {
                console.error("MediaPipe setup failed:", err);
                setLivenessStatus('Liveness check failed to load.');
            }
        };
        createFaceLandmarker();
    }, []);

    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            if (isCameraOn && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        setLivenessStatus('Please center your face...');
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    let message = "Could not access camera.";
                    if (err.name === "NotAllowedError") {
                        message = "Camera permission was denied.";
                    } else if (err.name === "NotReadableError" || err.name === "AbortError" || err.name === "OverconstrainedError") {
                        message = "Camera is already in use by another application.";
                    } else if (err.name === "NotFoundError") {
                        message = "No camera was found.";
                    }
                    alert(message);
                    setIsCameraOn(false);
                }
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [isCameraOn]);

    useEffect(() => {
        if (!isCameraOn || livenessPassed || !faceLandmarker || !videoRef.current) {
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        let animationFrameId;

        const predictWebcam = () => {
            if (livenessPassed || !faceLandmarker || !isCameraOn) {
                cancelAnimationFrame(animationFrameId);
                return;
            }
            
            if (video.readyState === 4 && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const results = faceLandmarker.detectForVideo(video, performance.now());

                if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                    const blendshapes = results.faceBlendshapes[0].categories;
                    
                    if (!faceCentered) {
                        setLivenessStatus('Please center your face...');
                        setFaceCentered(true);
                        setLivenessStatus('Great! Now please blink...');
                    }

                    if (faceCentered) {
                        const leftBlink = blendshapes.find(shape => shape.categoryName === 'eyeBlinkLeft')?.score || 0;
                        const rightBlink = blendshapes.find(shape => shape.categoryName === 'eyeBlinkRight')?.score || 0;

                        if (leftBlink > 0.5 && rightBlink > 0.5) {
                            setLivenessStatus('✅ Liveness Confirmed!');
                            setLivenessPassed(true);
                            cancelAnimationFrame(animationFrameId);
                            return;
                        }
                    }
                } else {
                    if (faceCentered) setFaceCentered(false);
                    setLivenessStatus('Please center your face...');
                }
            }
            
            animationFrameId = requestAnimationFrame(predictWebcam);
        };
        
        animationFrameId = requestAnimationFrame(predictWebcam);
        // video.onloadeddata = predictWebcam; // <-- THIS LINE WAS THE BUG. IT IS NOW REMOVED.

        return () => {
            cancelAnimationFrame(animationFrameId);
            lastVideoTime = -1;
        };

    }, [faceLandmarker, livenessPassed, faceCentered, isCameraOn]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateField('guarantor', 'documentImage', event.target.result);
                setComparisonResult(null);
                updateField('guarantor', 'faceVerified', false);
                setLivenessPassed(false);
                setFaceCentered(false);
                if (isCameraOn) {
                    setLivenessStatus('Please center your face...');
                } else {
                    setLivenessStatus('Please start camera...');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const captureLiveFace = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            updateField('guarantor', 'faceImage', dataUrl);
            setComparisonResult(null);
            updateField('guarantor', 'faceVerified', false);
            setIsCameraOn(false);
            setLivenessPassed(false);
            setFaceCentered(false);
            setLivenessStatus('Please start camera...');
        }
    };

    const handleCompareFaces = useCallback(async () => {
        if (!faceApiReady || !modelsLoaded || !window.faceapi) {
            alert("Face matching models are not loaded yet. Please wait.");
            return;
        }
        if (!formData.documentImage || !formData.faceImage) {
            alert("Please upload a document photo and capture a live photo.");
            return;
        }

        setIsComparing(true);
        setComparisonResult(null);

        const [verificationResult] = await Promise.all([
            (async () => {
                try {
                    const faceapi = window.faceapi;
                    const guarantorDocImg = uploadedImageRef.current;
                    const guarantorLiveImg = new Image();
                    guarantorLiveImg.src = formData.faceImage;

                    await new Promise((res, rej) => { guarantorLiveImg.onload = res; guarantorLiveImg.onerror = rej; });

                    const [guarantorDocFace, guarantorLiveFace] = await Promise.all([
                        faceapi.detectSingleFace(guarantorDocImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor(),
                        faceapi.detectSingleFace(guarantorLiveImg, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
                    ]);

                    if (!guarantorDocFace) throw new Error("Could not detect a face in the guarantor's document.");
                    if (!guarantorLiveFace) throw new Error("Could not detect a face in the guarantor's live capture.");
                    
                    const guarantorMatcher = new faceapi.FaceMatcher(guarantorDocFace.descriptor);
                    const guarantorMatch = guarantorMatcher.findBestMatch(guarantorLiveFace.descriptor);
                    const distance = guarantorMatch.distance;
                    const matchPercentage = (1 - distance) * 100;

                    if (distance < 0.6) {
                        return {
                            success: true,
                            message: `✅ Guarantor Verified! Similarity: ${matchPercentage.toFixed(2)}%.`
                        };
                    } else {
                        return {
                            success: false,
                            message: `❌ Guarantor Mismatch. Live photo does not match document (Similarity: ${matchPercentage.toFixed(2)}%).`
                        };
                    }
                } catch (error) {
                    console.error("Face comparison error:", error);
                    return { success: false, message: `${error.message}` };
                }
            })(),
            wait(3000)
        ]);

        setIsComparing(false);
        setComparisonResult(verificationResult);

        if (verificationResult.success) {
            updateField('guarantor', 'faceVerified', true);
        } else {
            updateField('guarantor', 'faceVerified', false);
        }
    }, [faceApiReady, modelsLoaded, formData.documentImage, formData.faceImage, updateField]);

    return (
        <div className="space-y-6">
            <style>{animationStyle}</style>
            <h4 className="text-xl font-semibold text-gray-700">Step 2: Guarantor Face Verification</h4>
            <p className="text-sm text-gray-600">Upload a clear photo of the guarantor (e.g., from an ID) and then capture a live photo for comparison.</p>
            
            {!faceApiReady || !modelsLoaded ? (
                 <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
                     Loading face recognition models... Please wait.
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">1. Upload Guarantor Photo</label>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {formData.documentImage && (
                            <div className="relative mt-4 rounded-lg shadow-md overflow-hidden">
                                <img ref={uploadedImageRef} src={formData.documentImage} alt="Guarantor Document" className="w-full" />
                                {isComparing && <div className="scan-bar"></div>}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">2. Capture Live Photo</label>
                        {!isCameraOn && (
                            <button 
                                onClick={() => setIsCameraOn(true)} 
                                disabled={!formData.documentImage}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Start Camera
                            </button>
                        )}
                        {isCameraOn && (
                            <div className="relative">
                                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg shadow-md" />
                                <div className={`absolute top-0 left-0 right-0 p-2 text-white text-center text-sm font-medium ${livenessPassed ? 'bg-green-600' : 'bg-black bg-opacity-50'}`}>
                                    {livenessStatus}
                                </div>
                                <button 
                                    onClick={captureLiveFace} 
                                    disabled={!livenessPassed}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                                >
                                    Capture
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        {formData.faceImage && !isCameraOn && (
                             <div className="relative mt-4 rounded-lg shadow-md overflow-hidden">
                                <img src={formData.faceImage} alt="Guarantor Live Capture" className="w-full" />
                                {isComparing && <div className="scan-bar"></div>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {formData.documentImage && formData.faceImage && faceApiReady && (
                <div className="text-center space-y-4 pt-6">
                    <button 
                        onClick={handleCompareFaces} 
                        disabled={isComparing}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        {isComparing ? 'Comparing...' : '3. Compare Faces'}
                    </button>
                    {isComparing && (
                        <div className="flex items-center justify-center space-x-2 text-gray-600">
                           <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                            <span>Analyzing faces...</span>
                        </div>
                    )}
                    {comparisonResult && (
                        <div className={`p-4 rounded-lg font-semibold ${comparisonResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {comparisonResult.message}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GuarantorFaceMatch;