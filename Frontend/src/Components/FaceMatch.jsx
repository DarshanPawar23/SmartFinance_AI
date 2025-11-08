import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const API_URL = 'http://localhost:5002/api';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let faceLandmarker;
let lastVideoTime = -1;

const FaceMatch = ({ pan, updateField, verified, faceImage, faceApiReady }) => {
    const webcamRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('Initializing AI...');
    const [masterDescriptor, setMasterDescriptor] = useState(null);
    
    const [masterImageUrl, setMasterImageUrl] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isComparing, setIsComparing] = useState(false);

    const [livenessStatus, setLivenessStatus] = useState('Initializing...');
    const [faceCentered, setFaceCentered] = useState(false);
    const [livenessPassed, setLivenessPassed] = useState(false);
    
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
                setStatus('Ready. Please look at the camera.');
                setLivenessStatus('Please center your face...');
            } catch (err) {
                console.error("MediaPipe setup failed:", err);
                setError('Failed to load liveness check.');
                setStatus('Error');
            }
        };
        createFaceLandmarker();
    }, []);

    useEffect(() => {
        const setupMatcher = async () => {
            if (!faceApiReady || !pan || !window.faceapi) return;
            
            try {
                const res = await fetch(`${API_URL}/profile-image/${pan}`);
                const data = await res.json();
                if (!data.success || !data.imageUrl) throw new Error(data.message || 'Could not find profile image.');

                const masterImage = await window.faceapi.fetchImage(data.imageUrl);
                setMasterImageUrl(data.imageUrl); 
                
                const masterDetection = await window.faceapi.detectSingleFace(masterImage, new window.faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!masterDetection) throw new Error('Could not detect face in profile image.');
                
                setMasterDescriptor(masterDetection.descriptor);
            } catch (err) {
                console.error("Face-API setup failed:", err);
                setError(`Setup Failed: ${err.message}`);
                if (status !== 'Error') setStatus('Error');
            }
        };

        setupMatcher();
    }, [faceApiReady, pan, status]);

    useEffect(() => {
        if (livenessPassed || !faceLandmarker || !webcamRef.current) {
            return;
        }

        const video = webcamRef.current.video;
        if (!video) return;

        let animationFrameId;

        const predictWebcam = () => {
            if (livenessPassed || !faceLandmarker) {
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

        return () => {
            cancelAnimationFrame(animationFrameId);
            lastVideoTime = -1;
        };

    }, [faceLandmarker, livenessPassed, faceCentered]);

    const captureAndVerify = useCallback(async () => {
        if (!webcamRef.current || !masterDescriptor || !window.faceapi) {
            alert("Components are not ready. Please wait.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setError("Could not capture image from webcam.");
            setIsLoading(false);
            return;
        }

        setCapturedImage(imageSrc);
        setIsComparing(true);
        setStatus('Comparing faces...');

        const [verificationResult] = await Promise.all([
            (async () => {
                try {
                    const capturedImgEl = await window.faceapi.fetchImage(imageSrc);
                    const detection = await window.faceapi.detectSingleFace(capturedImgEl, new window.faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (!detection) {
                        return { success: false, error: "No face detected in the snapshot. Please try again." };
                    }
                    
                    const faceMatcher = new window.faceapi.FaceMatcher([masterDescriptor]);
                    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

                    if (bestMatch.label === 'person 1' && bestMatch.distance < 0.5) {
                        return { success: true, imageSrc: imageSrc };
                    } else {
                        return { success: false, error: `Verification Failed. Faces do not match.` };
                    }
                } catch (err) {
                    console.error("Verification error:", err);
                    return { success: false, error: "An error occurred during verification." };
                }
            })(),
            wait(3000)
        ]);

        setIsComparing(false);
        setIsLoading(false);

        if (verificationResult.success) {
            setStatus('Verified!');
            updateField('personal', 'faceImage', verificationResult.imageSrc); 
            updateField('personal', 'faceVerified', true);
        } else {
            setStatus('Failed');
            setError(verificationResult.error);
            setCapturedImage(null); 
            setLivenessPassed(false);
            setFaceCentered(false);
            setLivenessStatus('Please center your face...');
        }
    }, [webcamRef, masterDescriptor, updateField]);


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

    return (
        <div className="space-y-6">
            <style>{animationStyle}</style>
            
            <h4 className="text-xl font-semibold text-gray-700">5. Face Match Verification</h4>
            <p className="text-sm text-gray-600 text-center">
                Please look directly at the camera. We will scan your face to ensure you are a live person.
            </p>
            
            <div className="grid grid-cols-2 gap-4 items-center">
                
                <div className="flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-500 mb-2">Profile Image</label>
                    <div className="w-full max-w-xs h-48 bg-gray-200 rounded-lg overflow-hidden shadow-inner relative">
                        {masterImageUrl ? (
                            <img src={masterImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">Loading...</div>
                        )}
                        {isComparing && <div className="scan-bar"></div>}
                    </div>
                </div>
                
                <div className="flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-500 mb-2">Live Capture</label>
                    <div className="w-full max-w-xs h-48 bg-gray-200 rounded-lg overflow-hidden shadow-inner relative">
                        {capturedImage && (
                            <img 
                                src={capturedImage} 
                                alt="Capture" 
                                className="w-full h-full object-cover absolute top-0 left-0 z-10"
                            />
                        )}
                        
                        {!verified && (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width="100%"
                                height="100%"
                                className="object-cover"
                                videoConstraints={{ facingMode: "user" }}
                            />
                        )}

                        {verified && faceImage && (
                            <img 
                                src={faceImage} 
                                alt="Verified Capture" 
                                className="w-full h-full object-cover"
                            />
                        )}
                        
                        {isComparing && <div className="scan-bar"></div>}
                    </div>
                </div>
            </div>

            <div className="text-center">
                <div className={`p-3 rounded-lg text-lg font-medium ${
                    error ? 'bg-red-100 text-red-700' : 
                    isComparing ? 'bg-blue-100 text-blue-700' :
                    livenessPassed ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {error ? status : (livenessPassed ? "✅ Liveness Confirmed!" : livenessStatus)}
                </div>
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

            <div className="flex flex-col items-center space-y-4">
                {!verified ? (
                    <button
                        onClick={captureAndVerify}
                        disabled={!livenessPassed || isLoading || isComparing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isComparing ? 'Comparing...' : 'Capture & Verify Face'}
                    </button>
                ) : (
                    <p className="text-2xl font-semibold text-green-600">✅ Face Verified Successfully!</p>
                )}
            </div>
        </div>
    );
};

export default FaceMatch;