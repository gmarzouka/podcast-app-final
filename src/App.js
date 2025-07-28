import React, { useState, useEffect, useRef } from 'react';

// --- HELPER FUNCTIONS & ICONS ---
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";
  const floorSeconds = Math.floor(seconds);
  const min = Math.floor(floorSeconds / 60);
  const sec = floorSeconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};
const MicIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg> );
const LoaderIcon = ({className = "h-5 w-5 mr-3"}) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> );
const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M8 5v14l11-7z" /></svg> );
const PauseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> );
const TokenIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-yellow-400"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z"/><path d="M12 6v4"/><path d="m16 10-2 2-2-2"/><path d="M12 18.01v.01"/></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);

// --- CHILD COMPONENTS ---
const AudioPlayer = ({ podcast }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        if (audio.readyState > 0) setAudioData();
        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        };
    }, [podcast.audioUrl]);

    useEffect(() => {
        if (podcast.audioUrl) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed", e));
        }
    }, [podcast.audioUrl]);

    const togglePlayPause = () => {
        setIsPlaying(prev => {
            if (prev) audioRef.current.pause();
            else audioRef.current.play();
            return !prev;
        });
    };

    const handleSeek = (e) => {
        audioRef.current.currentTime = e.target.value;
        setCurrentTime(e.target.value);
    };

    return (
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
            <audio ref={audioRef} src={podcast.audioUrl} onEnded={() => setIsPlaying(false)} preload="metadata"></audio>
            <div className="flex items-center">
                <button onClick={togglePlayPause} className="text-white p-2 rounded-full bg-pink-500 hover:bg-pink-600 transition-colors duration-200 shadow-md">
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <div className="ml-4 w-full">
                    <h3 className="text-lg font-bold text-white">{podcast.title}</h3>
                    <p className="text-sm text-gray-300">Your custom AI-generated podcast.</p>
                    <div className="mt-2 flex items-center">
                        <input type="range" min="0" max={duration} value={currentTime} onChange={handleSeek} className="w-full h-2 bg-gray-500/50 rounded-lg appearance-none cursor-pointer accent-pink-500"/>
                        <span className="text-xs text-gray-300 w-24 text-right">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            {podcast.script && (
                <div className="mt-4 pt-4 border-t border-white/20">
                    <h4 className="font-bold text-white mb-2">Generated Script:</h4>
                    <p className="text-sm text-gray-200 whitespace-pre-wrap bg-gray-900/50 p-4 rounded-lg">{podcast.script}</p>
                </div>
            )}
        </div>
    );
};

const BuyTokensModal = ({ setShowModal, setTokenBalance }) => { /* ... No changes ... */ };

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null); 
  const [tokenBalance, setTokenBalance] = useState(0); 
  const [showBuyTokensModal, setShowBuyTokensModal] = useState(false);
  
  const [topic, setTopic] = useState('');
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('');
  const [gradeLevel, setGradeLevel] = useState("Kindergarten - 1st Grade");
  const [voice, setVoice] = useState('Friendly Male');
  const [interests, setInterests] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  
  const [scriptPreview, setScriptPreview] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [generatedPodcast, setGeneratedPodcast] = useState(null);
  
  const pollingIntervalRef = useRef(null);

  const voiceOptions = {
      'Friendly Male': '21m00Tcm4TlvDq8ikWAM',
      'Calm Female': '29vD33N1CtxCmqQRPO9B',
      'Energetic Narrator': 'MF3mGyEYCl7XYWbV9V6O',
      'Wise Storyteller': '5Q0t7uMcjvnagumLfvZi'
  };

  // --- MOCK AUTH FUNCTIONS ---
  const handleLogin = () => {
    console.log("Simulating user login.");
    setUser({ email: 'parent@example.com', id: 'user-123' });
    setTokenBalance(3); 
  };
  const handleLogout = () => {
    setUser(null);
    setTokenBalance(0);
    setGeneratedPodcast(null);
    setScriptPreview(null);
    setJobId(null);
  };
  
  // --- API ENDPOINT CONFIGURATION ---
  const API_BASE_URL = 'https://if0q6p8bt4.execute-api.us-east-2.amazonaws.com/Prod';

  // --- POLLING FUNCTION FOR JOB STATUS ---
  useEffect(() => {
    if (jobId) {
        pollingIntervalRef.current = setInterval(async () => {
            console.log(`Polling for job status: ${jobId}`);
            try {
                const response = await fetch(`${API_BASE_URL}/check-job-status`, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to check status");

                if (data.status === 'COMPLETE') {
                    console.log("Job complete!", data);
                    clearInterval(pollingIntervalRef.current);
                    setGeneratedPodcast({
                        title: `A Special Podcast for ${childName}`,
                        script: data.script,
                        audioUrl: data.audioUrl
                    });
                    setJobId(null);
                    setIsLoading(false);
                    setLoadingStep('');
                } else if (data.status === 'FAILED') {
                    console.error("Job failed:", data);
                    clearInterval(pollingIntervalRef.current);
                    setError("The audio generation failed in the background. Please try again.");
                    setJobId(null);
                    setIsLoading(false);
                    setLoadingStep('');
                } else {
                    console.log("Job status:", data.status);
                    setLoadingStep(`Creating audio... (Status: ${data.status || 'PENDING'})`);
                }
            } catch (err) {
                console.error("Polling error:", err);
                clearInterval(pollingIntervalRef.current);
                setError("An error occurred while checking the podcast status.");
                setIsLoading(false);
            }
        }, 7000); // Check every 7 seconds
    }

    return () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
    };
  }, [jobId, childName, API_BASE_URL]);

  // --- WORKFLOW STEP 1: GENERATE SCRIPT FOR PREVIEW ---
  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (!user) { setError("Please log in to create a podcast."); return; }
    if (tokenBalance < 1) { setError("You need at least 1 token to generate a script."); setShowBuyTokensModal(true); return; }
    if (!topic.trim() || !childName.trim() || !age.trim()) { setError('Please fill out the topic, child\'s name, and age.'); return; }

    setIsLoading(true);
    setError(null);
    setGeneratedPodcast(null);
    setScriptPreview(null);
    setLoadingStep('Generating script for preview...');

    try {
        const response = await fetch(`${API_BASE_URL}/generate-script`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, childName, age, gradeLevel, interests, userId: user.id })
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || "API Error");
        if (!responseData.script) throw new Error("The backend didn't return a script. Check the Lambda logs.");
        setScriptPreview(responseData.script);
    } catch (err) {
        console.error("Failed to generate script:", err);
        setError(err.message);
    } finally {
        setIsLoading(false);
        setLoadingStep('');
    }
  };

  // --- WORKFLOW STEP 2: APPROVE SCRIPT AND CREATE AUDIO JOB ---
  const handleApproveScript = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Submitting your request...');

    try {
        const response = await fetch(`${API_BASE_URL}/create-audio-job`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: scriptPreview, voiceId: voiceOptions[voice], userId: user.id })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to create job");

        setTokenBalance(data.newTokeBalance);
        setScriptPreview(null);
        setJobId(data.jobId); // This triggers the polling useEffect
        setLoadingStep("Your podcast is in the queue...");
    } catch (err) {
        console.error("Failed to create audio job:", err);
        setError(err.message);
        setIsLoading(false);
    }
  };

  const handleDisapproveScript = () => {
    setScriptPreview(null); 
    console.log("Script disapproved. No token was used.");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4">
      {showBuyTokensModal && <BuyTokensModal setShowModal={setShowBuyTokensModal} setTokenBalance={setTokenBalance} />}
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-10">
            <div className="flex items-center text-3xl font-bold text-white">
                <MicIcon />
                <h1 className="ml-1">Podcast-on-the-Fly</h1>
            </div>
            {user ? (
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                        <TokenIcon />
                        <span className="font-bold text-lg">{tokenBalance}</span>
                        <button onClick={() => setShowBuyTokensModal(true)} className="ml-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-1 px-2 rounded-md">+</button>
                    </div>
                    <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">Logout</button>
                </div>
            ) : (
                <button onClick={handleLogin} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg">
                    Login / Sign Up
                </button>
            )}
        </header>

        <main>
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            {isLoading && (
                <div className="text-center py-12">
                    <LoaderIcon className="h-12 w-12 mx-auto text-pink-500"/>
                    <p className="text-lg mt-4">{loadingStep}</p>
                </div>
            )}
            {!isLoading && scriptPreview && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Preview Your Script</h2>
                <div className="bg-gray-900/70 p-4 rounded-lg max-h-60 overflow-y-auto mb-6">
                    <p className="text-gray-300 whitespace-pre-wrap">{scriptPreview}</p>
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={handleDisapproveScript} className="px-6 py-3 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-all">
                        Cancel & Edit
                    </button>
                    <button onClick={handleApproveScript} className="px-6 py-3 font-bold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-all">
                        Approve & Create Audio (1 Token)
                    </button>
                </div>
              </div>
            )}
            {!isLoading && !scriptPreview && (
              <form onSubmit={handleGenerateScript}>
                <div className="mb-6">
                    <label htmlFor="topic" className="block mb-2 text-lg font-medium text-gray-300">Podcast Topic</label>
                    <input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="e.g., 'Why is the sky is blue'"/>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div><label htmlFor="child-name" className="block mb-2 font-medium text-gray-300">Child's First Name</label><input type="text" id="child-name" value={childName} onChange={e => setChildName(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="e.g., Alex"/></div>
                    <div><label htmlFor="age" className="block mb-2 font-medium text-gray-300">Child's Age</label><input type="number" id="age" value={age} min="4" onChange={e => setAge(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="e.g., 8"/></div>
                    <div><label htmlFor="grade-level" className="block mb-2 font-medium text-gray-300">Grade Level</label><select id="grade-level" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500">{["Kindergarten - 1st Grade", "2nd Grade - 3rd Grade", "4th Grade - 5th Grade", "6th Grade - 7th Grade", "8th Grade - 9th Grade", "10th Grade - 11th Grade", "12th Grade+"].map(o => (<option key={o} value={o}>{o}</option>))}</select></div>
                    <div><label htmlFor="interests" className="block mb-2 font-medium text-gray-300">Interests</label><input type="text" id="interests" value={interests} onChange={e => setInterests(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="e.g., Minecraft, Dragons"/></div>
                </div>
                <div className="mb-8">
                    <label htmlFor="voice" className="block mb-2 font-medium text-gray-300">Voice Style</label>
                    <select id="voice" value={voice} onChange={e => setVoice(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                        {['Friendly Male', 'Calm Female', 'Energetic Narrator', 'Wise Storyteller'].map(name => (<option key={name} value={name}>{name}</option>))}
                    </select>
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
                    {isLoading ? ( <> <LoaderIcon /> <span>{loadingStep}</span> </> ) : ( '✨ Generate Script Preview ✨' )}
                </button>
              </form>
            )}
            {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
          </div>
          
          <div className="mt-12">
            {generatedPodcast && (<div className="animate-fade-in-up"><h2 className="text-2xl font-bold text-center mb-4">Your masterpiece is ready!</h2><AudioPlayer podcast={generatedPodcast} /></div>)}
          </div>
        </main>
      </div>
    </div>
  );
}
