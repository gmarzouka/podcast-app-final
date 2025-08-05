import React, { useState, useEffect, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator, useAuthenticator, View, useTheme } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// --- CONFIGURE AWS AMPLIFY ---
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_RuimWB23M', // Your Correct User Pool ID
      userPoolClientId: 'dqakk5tcec94d4rednkgi92o2', // Your Correct App Client ID
    }
  }
});

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
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M12 7v5l4 2"></path></svg>);


// --- CHILD COMPONENTS ---
const AudioPlayer = ({ podcast }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => setDuration(audio.duration);
        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const handleCanPlay = () => {
             audio.play().then(() => setIsPlaying(true)).catch(e => console.error("Autoplay failed", e));
        };
        
        setIsPlaying(false);
        setCurrentTime(0);

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('canplay', handleCanPlay);

        audio.load();

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [podcast.audioUrl]);


    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
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

const BuyTokensModal = ({ setShowModal, user }) => {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState(null);
    const API_BASE_URL = 'https://if0q6p8bt4.execute-api.us-east-2.amazonaws.com/Prod';

    const tokenPacks = [
        { amount: 5,  price: 2.50, priceId: 'price_1Rr8iCBKrdK3UUm6xoWijZW5' },
        { amount: 15, price: 5.00, priceId: 'price_1Rr6t2BKrdK3UUm6aOfwDN1C' },
        { amount: 20, price: 10.00, priceId: 'price_1Rr8iwBKrdK3UUm6Gb5NBhWq' },
        { amount: 30, price: 25.00, priceId: 'price_1Rr8jUBKrdK3UUm6Re99Vycl' },
    ];

   const handlePurchase = async (priceId) => {
    setIsPurchasing(true);
    setError(null);
    try {
        // Use the centralized apiCall function to automatically handle authentication
        const data = await apiCall('post', '/create-payment-session', { priceId, userId: user.userId });

        if (data.url) {
            // Redirect to Stripe's secure checkout page
            window.location.href = data.url;
        } else {
            throw new Error("No checkout URL was returned from the server.");
        }

    } catch (err) {
        console.error("Purchase error:", err);
        setError("Could not initiate purchase. Please try again.");
        setIsPurchasing(false);
    }
};

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Get More Hoots</h2>
                    <button onClick={() => !isPurchasing && setShowModal(false)} className="text-gray-400 hover:text-white disabled:opacity-50"><CloseIcon /></button>
                </div>
                <p className="text-gray-400 mb-6">Each Hoot lets you create one magical audio podcast.</p>
                <div className="space-y-4">
                    {isPurchasing ? (
                        <div className="text-center py-10">
                            <LoaderIcon className="h-10 w-10 mx-auto text-pink-500" />
                            <p className="mt-4">Redirecting to our secure payment processor...</p>
                        </div>
                    ) : (
                        tokenPacks.map(pack => (
                            <button key={pack.priceId} onClick={() => handlePurchase(pack.priceId)} className="w-full flex justify-between items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                                <div className="flex items-center">
                                    <TokenIcon />
                                    <span className="ml-3 font-bold text-lg">{pack.amount} Hoots</span>
                                </div>
                                <span className="text-lg font-bold text-pink-400">${pack.price.toFixed(2)}</span>
                            </button>
                        ))
                    )}
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

const PodcastHistoryModal = ({ setShowModal, history, onPlay }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Your Podcast History</h2>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                {history.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {history.map((item) => (
                            <div key={item.jobId} className="w-full flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                                <div>
                                    <p className="font-bold text-white">{item.title || "A Podcast"}</p>
                                    <p className="text-xs text-gray-400">Created: {new Date(item.createdAt).toLocaleString()}</p>
                                </div>
                                <button onClick={() => onPlay(item)} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg">
                                    Play
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">You haven't created any podcasts yet.</p>
                )}
            </div>
        </div>
    );
};


// --- This is the main application component that renders AFTER a user has logged in ---
function PodcastGenerator({ signOut, user }) {
  const [tokenBalance, setTokenBalance] = useState(0); 
  const [showBuyTokensModal, setShowBuyTokensModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [podcastHistory, setPodcastHistory] = useState([]);
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
      'Friendly Male': 'pNInz6obpgDQGcFmaJgB',      // Adam
      'Calm Female': '21m00Tcm4TlvDq8ikWAM',        // Rachel
      'Energetic Narrator': 'ErXwobaYiN019PkySvjV', // Antoni
      'Female Villain': 'flHkNRp1BlvT73UL6gyz', // Jessica Anne Bogart
      'American Grandpa': 'NOpBlnGInO9m6vDvFkFC', // Grandpa Spud Oxley
      'Texan Boy': 'Bj9UqZbhQsanLzgalpEG' //Austin
  };
  const API_BASE_URL = 'https://if0q6p8bt4.execute-api.us-east-2.amazonaws.com/Prod';

  const fetchUserData = async (userId) => {
      console.log("Fetching all user data for:", userId);
      setError(null);
      try {
          const profileResponse = await fetch(`${API_BASE_URL}/get-user-profile`, {
              method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
          });
          const profileData = await profileResponse.json();
          if (!profileResponse.ok) throw new Error(profileData.message || "Failed to fetch user profile");
          setTokenBalance(profileData.tokenBalance);

          const historyResponse = await fetch(`${API_BASE_URL}/get-history`, {
              method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
          });
          const historyData = await historyResponse.json();
          if (!historyResponse.ok) throw new Error(historyData.message || "Failed to fetch history");
          setPodcastHistory(historyData);

      } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Could not load your user data. Please try refreshing the page.");
      }
  };

  // Fetch user profile and history when the user logs in
  useEffect(() => {
    if (user?.userId) {
      fetchUserData(user.userId);
    }
  }, [user?.userId]);

  // Check for successful payment on page load
  useEffect(() => {
      const queryParams = new URLSearchParams(window.location.search);
      if (queryParams.get('payment') === 'success' && user?.userId) {
          alert("Purchase successful! Your Hoots have been added. Refreshing your balance...");
          fetchUserData(user.userId);
          window.history.replaceState(null, null, window.location.pathname);
      }
  }, [user?.userId]);
  
  // Polling function for job status
  useEffect(() => {
    if (jobId) {
        pollingIntervalRef.current = setInterval(async () => {
            console.log(`Polling for job status: ${jobId}`);
            try {
                const response = await fetch(`${API_BASE_URL}/check-job-status`, {
                    method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to check status");

                if (data.status === 'COMPLETE') {
                    console.log("Job complete!", data);
                    clearInterval(pollingIntervalRef.current);
                    setGeneratedPodcast({ title: data.title, script: data.script, audioUrl: data.audioUrl });
                    setJobId(null);
                    setIsLoading(false);
                    setLoadingStep('');
                    fetchUserData(user.userId);
                } else if (data.status === 'FAILED') {
                    clearInterval(pollingIntervalRef.current);
                    setError("The audio generation failed in the background. Please try again.");
                    setJobId(null);
                    setIsLoading(false);
                    setLoadingStep('');
                } else {
                    setLoadingStep(`Creating audio... (Status: ${data.status || 'PENDING'})`);
                }
            } catch (err) {
                console.error("Polling error:", err);
                clearInterval(pollingIntervalRef.current);
                setError("An error occurred while checking the podcast status.");
                setIsLoading(false);
            }
        }, 7000);
    }
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, [jobId, user?.userId, API_BASE_URL]);

  const handlePlayFromHistory = (podcast) => {
    setGeneratedPodcast(podcast);
    setShowHistoryModal(false);
  };

  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (tokenBalance < 1) { setError("You need at least 1 Hoot to generate a script."); setShowBuyTokensModal(true); return; }
    if (!topic.trim() || !childName.trim() || !age.trim()) { setError('Please fill out the topic, child\'s name, and age.'); return; }
    setIsLoading(true);
    setError(null);
    setGeneratedPodcast(null);
    setScriptPreview(null);
    setLoadingStep('Generating script for preview...');
    try {
        const response = await fetch(`${API_BASE_URL}/generate-script`, {
            method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, childName, age, gradeLevel, interests, userId: user.userId })
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

  const handleApproveScript = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Submitting your request...');
    try {
        const response = await fetch(`${API_BASE_URL}/create-audio-job`, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: scriptPreview, voiceId: voiceOptions[voice], userId: user.userId, topic: topic })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to create job");
        
        setTokenBalance(prev => prev - 1);
        setScriptPreview(null);
        setJobId(data.jobId);
        setLoadingStep("Your podcast is in the queue...");
    } catch (err) {
        console.error("Failed to create audio job:", err);
        setError(err.message);
        setIsLoading(false);
    }
  };

  const handleDisapproveScript = () => {
    setScriptPreview(null);
    console.log("Script disapproved. No Hoot was used.");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4">
      {showBuyTokensModal && <BuyTokensModal setShowModal={setShowBuyTokensModal} user={user} />}
      {showHistoryModal && <PodcastHistoryModal setShowModal={setShowHistoryModal} history={podcastHistory} onPlay={handlePlayFromHistory} />}
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-10">
            <div className="flex items-center text-3xl font-bold text-white">
                <MicIcon />
                <h1 className="ml-1">HootPODS</h1>
            </div>
            <div className="text-right">
                <div className="flex items-center space-x-4">
                    <button onClick={() => setShowHistoryModal(true)} className="text-gray-400 hover:text-white flex items-center">
                        <HistoryIcon />
                        <span className="ml-1.5">My Podcasts</span>
                    </button>
                    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                        <TokenIcon />
                        <span className="font-bold text-lg">{tokenBalance}</span>
                        <button onClick={() => setShowBuyTokensModal(true)} className="ml-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-1 px-2 rounded-md">+</button>
                    </div>
                    <button onClick={signOut} className="text-gray-400 hover:text-white text-sm">Sign Out</button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{user?.attributes?.email}</p>
            </div>
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
                        Approve & Create Audio (1 Hoot)
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
                    <div>
                        <label htmlFor="age" className="block mb-2 font-medium text-gray-300">Child's Age</label>
                        <input 
                            type="number" 
                            id="age" 
                            value={age} 
                            min="4" 
                            onChange={e => setAge(e.target.value)} 
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500" 
                            placeholder="e.g., 8"
                            autoComplete="off"
                        />
                    </div>
                    <div><label htmlFor="grade-level" className="block mb-2 font-medium text-gray-300">Grade Level</label><select id="grade-level" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500">{["Kindergarten - 1st Grade", "2nd Grade - 3rd Grade", "4th Grade - 5th Grade", "6th Grade - 7th Grade", "8th Grade - 9th Grade", "10th Grade - 11th Grade", "12th Grade+"].map(o => (<option key={o} value={o}>{o}</option>))}</select></div>
                    <div><label htmlFor="interests" className="block mb-2 font-medium text-gray-300">Interests</label><input type="text" id="interests" value={interests} onChange={e => setInterests(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="e.g., Minecraft, Dragons"/></div>
                </div>
                <div className="mb-8">
                    <label htmlFor="voice" className="block mb-2 font-medium text-gray-300">Voice Style</label>
                    <select id="voice" value={voice} onChange={e => setVoice(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500">
                        {Object.keys(voiceOptions).map(name => (<option key={name} value={name}>{name}</option>))}
                    </select>
                </div>
                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold text-black bg-pink-600 rounded-lg hover:bg-pink-700 disabled:bg-pink-800 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
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
        
        <footer className="text-center mt-12 text-xs text-gray-500 px-4">
          <p>
            <strong>Disclaimer:</strong> The content provided is generated by artificial intelligence. 
            Parents and guardians are advised to review all content for accuracy and appropriateness before sharing with children.
          </p>
          <p className="mt-2">
            © 2025 HootPODS. All Rights Reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

// --- Landing Page and Login Component ---
const Login = () => {
return (
  <div className="min-h-screen bg-gray-900 text-white font-sans flex items-center justify-center p-4">
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left Side: Marketing Content */}
        <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start text-4xl font-bold text-white mb-4">
                <MicIcon />
                <h1 className="ml-1">HootPODS</h1>
            </div>
            <p className="text-xl text-gray-300 mb-6">
                Custom AI-generated podcasts for your kids. Turn any topic into a fun, educational audio adventure they'll love.
            </p>
            <p className="text-gray-400">
                Sign up or sign in to get started!
            </p>
        </div>

        {/* Right Side: Authenticator */}
        <div>
             <Authenticator loginMechanisms={['email']} />
        </div>
    </div>
  </div>
);
};

// --- Main App component for routing ---
function App() {
  const { authStatus, signOut, user } = useAuthenticator((context) => [context.authStatus]);
  
  if (authStatus === 'authenticated') {
return <PodcastGenerator signOut={signOut} user={user} />;
  }

  return <Login />;
}

// --- Wrap the App with the Authenticator.Provider ---
const AppWithAuth = () => (
<Authenticator.Provider>
    <App />
</Authenticator.Provider>
);

export default AppWithAuth;
