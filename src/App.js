import React, { useState, useEffect, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import { signUp } from '@aws-amplify/auth';
import { post as apiPost } from '@aws-amplify/api';
import { fetchAuthSession } from '@aws-amplify/auth';
import { Authenticator, Heading } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// --- CONFIGURE AWS AMPLIFY ---
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'us-east-2_RuimWB23M',
            userPoolClientId: 'dqakk5tcec94d4rednkgi92o2',
        }
    },
    API: {
        REST: {
            "HootpodsAPI": {
                endpoint: "https://if0q6p8bt4.execute-api.us-east-2.amazonaws.com/Prod",
            }
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
const LoaderIcon = ({ className = "h-5 w-5 mr-3" }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>);
const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>);
const PauseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>);
const HootIcon = ({ className = "h-6 w-6 inline-block" }) => (<img src="/images/IMG_4365.png" alt="Hoot Token" className={className} />);
const TokenIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9.5c.83 0 1.5-.67 1.5-1.5S10.83 7.5 10 7.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm4 0c.83 0 1.5-.67 1.5-1.5S14.83 7.5 14 7.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-4 4c1.67 0 3-1.33 3-3h-6c0 1.67 1.33 3 3 3z"></path></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);

// --- CENTRALIZED API CALL FUNCTION ---
const apiCall = async (method, path, body) => {
    try {
        if (method.toLowerCase() !== 'post') {
            throw new Error(`API method ${method} not supported.`);
        }
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) throw new Error("Authentication error: No ID token found.");
        const headers = { 'Authorization': `Bearer ${idToken}` };
        const { body: responseBody } = await (apiPost({
            apiName: "HootpodsAPI", path, options: { body, headers }
        })).response;
        const data = await responseBody.json();
        if (data.message && data.statusCode >= 400) throw new Error(data.message);
        return data;
    } catch (error) {
        console.error(`API call to ${path} failed:`, error);
        const errorMessage = error.message || "An unknown error occurred during the API call.";
        throw new Error(errorMessage);
    }
};

// --- CHILD MANAGEMENT MODAL COMPONENT ---
const ChildManagementModal = ({ isOpen, onClose, children, setChildren, userId }) => {
    const [name, setName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [interests, setInterests] = useState('');
    const handleSaveChild = async (e) => {
        e.preventDefault();
        if (!name || !birthdate) return alert("Name and birthdate are required.");
        const newChild = { id: `child_${Date.now()}`, name, birthdate, interests: interests.split(',').map(i => i.trim()).filter(Boolean) };
        const updatedChildren = [...children, newChild];
        try {
            await apiCall('post', '/update-user-profile', { userId, children: updatedChildren });
            setChildren(updatedChildren);
            setName(''); setBirthdate(''); setInterests('');
        } catch (error) {
            alert(`Error saving child: ${error.message}`);
        }
    };
    const handleDeleteChild = async (childId) => {
        if (!window.confirm("Are you sure you want to remove this child's profile?")) return;
        const updatedChildren = children.filter(c => c.id !== childId);
        try {
            await apiCall('post', '/update-user-profile', { userId, children: updatedChildren });
            setChildren(updatedChildren);
        } catch (error) {
            alert(`Error deleting child: ${error.message}`);
        }
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4">Manage Children</h2>
                <form onSubmit={handleSaveChild} className="bg-gray-700 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-2">Add a New Child</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Child's Name" className="bg-gray-800 border border-gray-600 rounded p-2 focus:ring-blue-500 focus:border-blue-500"/>
                        <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="bg-gray-800 border border-gray-600 rounded p-2 focus:ring-blue-500 focus:border-blue-500"/>
                    </div>
                    <input type="text" value={interests} onChange={e => setInterests(e.target.value)} placeholder="Interests (e.g., dinosaurs, space, animals)" className="w-full mt-4 bg-gray-800 border border-gray-600 rounded p-2 focus:ring-blue-500 focus:border-blue-500"/>
                     <p className="text-xs text-gray-400 mt-1">Separate interests with a comma.</p>
                    <button type="submit" className="mt-4 w-full bg-yellow-600 hover:bg-green-800 rounded-md px-4 py-2 font-semibold">Save Child</button>
                </form>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {children.map(child => (
                        <div key={child.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                            <div>
                               <p className="font-bold">{child.name}</p>
                               <p className="text-sm text-gray-400">Born: {child.birthdate}</p>
                               <p className="text-sm text-gray-400">Interests: {child.interests.join(', ')}</p>
                            </div>
                            <button onClick={() => handleDeleteChild(child.id)} className="text-red-500 hover:text-red-400 font-semibold">Remove</button>
                        </div>
                    ))}
                    {children.length === 0 && <p className="text-gray-400 text-center">No children saved yet.</p>}
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-500 rounded-md px-4 py-2 font-semibold">Close</button>
            </div>
        </div>
    );
};

// --- CHILD SELECTOR COMPONENT ---
const ChildSelector = ({ children, selectedChildren, setSelectedChildren }) => {
    const handleSelect = (childId) => {
        const newSelection = new Set(selectedChildren);
        if (newSelection.has(childId)) newSelection.delete(childId);
        else newSelection.add(childId);
        setSelectedChildren(Array.from(newSelection));
    };
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <label className="block text-lg font-semibold text-white mb-2">Who is this podcast for?</label>
            <div className="space-y-2">
                {children.map(child => (
                    <label key={child.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600">
                        <input type="checkbox" checked={selectedChildren.includes(child.id)} onChange={() => handleSelect(child.id)} className="h-5 w-5 rounded bg-gray-900 border-gray-600 text-blue-600 focus:ring-blue-500"/>
                        <span className="text-white font-medium">{child.name}</span>
                    </label>
                ))}
                 {children.length === 0 && <p className="text-gray-400">Please add a child profile via the "Manage Children" button.</p>}
            </div>
        </div>
    );
};
// -- Code for purchasing Hoots
const BuyTokensModal = ({ setShowModal, user }) => {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState(null);
    // Note: This endpoint is not yet functional.
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
            const response = await fetch(`${API_BASE_URL}/create-payment-session`, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, userId: user.userId })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to create payment session.");
            }
            window.location.href = data.url;
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
                    {/* This button is now only visible when not in the middle of a purchase */}
                    {!isPurchasing && (
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                            <CloseIcon />
                        </button>
                    )}
                </div>
                <p className="text-gray-400 mb-6">Each Hoot lets you create one magical audio podcast.</p>
                <div className="space-y-4">
                    {isPurchasing ? (
                        <div className="text-center py-10">
                            <LoaderIcon className="h-10 w-10 mx-auto text-[#e28b07]" />
                            <p className="mt-4">Redirecting to our secure payment processor...</p>
                        </div>
                    ) : (
                        tokenPacks.map(pack => (
                            <button key={pack.priceId} onClick={() => handlePurchase(pack.priceId)} className="w-full flex justify-between items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                                <div className="flex items-center">
                                    <TokenIcon />
                                    <span className="ml-3 font-bold text-lg">{pack.amount} Hoots</span>
                                </div>
                                <span className="text-lg font-bold text-[#e28b07]">${pack.price.toFixed(2)}</span>
                            </button>
                        ))
                    )}
                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

// --- PODCAST GENERATOR (MAIN AUTHENTICATED VIEW) ---
const PodcastGenerator = ({ signOut, user }) => {
    const userId = user.userId; 
    const [firstName, setFirstName] = useState('');
    const [hoots, setHoots] = useState(0);
    const [children, setChildren] = useState([]);
    const [topic, setTopic] = useState('');
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [script, setScript] = useState('');
    const [jobId, setJobId] = useState(null);
    const [history, setHistory] = useState([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isChildModalOpen, setIsChildModalOpen] = useState(false);
    const [showBuyTokensModal, setShowBuyTokensModal] = useState(false);
    const [sortOrder, setSortOrder] = useState('date'); // 'date' or 'topic'
    
    const voiceOptions = {
  'Friendly Male': 'pNInz6obpgDQGcFmaJgB',      // Adam
  'Calm Female': '21m00Tcm4TlvDq8ikWAM',        // Rachel
  'Energetic Narrator': 'ErXwobaYiN019PkySvjV', // Antoni
  'Female Villain': 'flHkNRp1BlvT73UL6gyz', // Jessica Anne Bogart
  'American Grandpa': 'NOpBlnGInO9m6vDvFkFC', // Grandpa Spud Oxley
  'Texan Boy': 'Bj9UqZbhQsanLzgalpEG' //Austin
  };

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) return;
            try {
                const profile = await apiCall('post', '/get-user-profile', { userId });
                setHoots(profile.hoots);
                setFirstName(profile.firstName || 'Friend');
                setChildren(profile.children || []);
                fetchHistory(userId);
            } catch (err) { setError(`Error fetching user data: ${err.message}`); }
        };
        fetchUserData();
    }, [userId]);

    useEffect(() => {
    if (!jobId || !isLoading || !userId) return;

    let attempts = 0;
    const maxAttempts = 24; // Poll for 2 minutes (24 attempts * 5 seconds)

    const interval = setInterval(async () => {
        attempts++;

        // Check if we've hit the timeout
        if (attempts > maxAttempts) {
            clearInterval(interval);
            setError("Audio generation is taking longer than expected. Please check back in a few minutes or try again.");
            setIsLoading(false);
            setJobId(null);
            return;
        }

        try {
            const res = await apiCall('post', '/get-history', { userId });
            const latestJob = res.history.find(j => j.jobId === jobId);

            if (latestJob && latestJob.status && latestJob.status.toLowerCase() === 'complete') {
                clearInterval(interval); // Success, so we stop polling
                setHistory(res.history);
                setIsLoading(false);
                setJobId(null);
                setScript('');
                setTopic('');
                setCurrentTrack({ url: latestJob.audioUrl, title: latestJob.title });
            } else if (latestJob?.status === 'FAILED') {
                clearInterval(interval); // Failure, so we stop polling
                throw new Error(latestJob.errorMessage || 'The podcast generation failed.');
            }
            // If status is still PENDING, we do nothing and let the next interval run.
        } catch (err) {
            clearInterval(interval); // Stop polling on any error
            setError(`Error checking job status: ${err.message}`);
            setIsLoading(false);
            setJobId(null);
        }
    }, 5000);

    return () => clearInterval(interval); // Cleanup function to stop polling if the component unmounts
}, [jobId, isLoading, userId]);

    const fetchHistory = async (id) => {
        setIsHistoryLoading(true);
        try {
            const res = await apiCall('post', '/get-history', { userId: id });
            setHistory(res.history || []);
        } catch (err) { setError(`Error fetching history: ${err.message}`); }
        setIsHistoryLoading(false);
    };

    const handleGenerateScript = async (e) => {
        e.preventDefault();
        setError('');
        if (!topic) return setError("Please enter a topic.");
        if (!isAnonymous && selectedChildren.length === 0) return setError("Please select at least one child or check the anonymous option.");
        setIsLoading(true); setScript('');
        const selectedChildData = children.filter(c => selectedChildren.includes(c.id));
        try {
            const res = await apiCall('post', '/generate-script', { userId, topic, children: selectedChildData, isNeutral: isAnonymous });
            setScript(res.script);
        } catch (err) { setError(`Script generation failed: ${err.message}`); }
        setIsLoading(false);
    };

    const handleCreateAudio = async () => {
        setError('');
        if (hoots < 1) return setError("You don't have enough Hoots to create a podcast.");
        setIsLoading(true);
        const selectedChildData = children.filter(c => selectedChildren.includes(c.id));
        const childNameForJob = selectedChildData.length > 0 ? selectedChildData.map(c => c.name).join(' & ') : "Everyone";
        try {
            const res = await apiCall('post', '/create-audio-job', { userId, script, topic, voiceId, children: selectedChildData, childName: childNameForJob, isNeutral: isAnonymous });
            setJobId(res.jobId);
            setHoots(hoots - 1);
        } catch (err) {
            setError(`Audio creation failed: ${err.message}`);
            setIsLoading(false);
        }
    };

    const togglePlayPause = () => {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
    const handleLoadedMetadata = () => setDuration(audioRef.current.duration);
    const handleSeek = (e) => { audioRef.current.currentTime = e.target.value; setCurrentTime(e.target.value); };
const sortedHistory = [...history].sort((a, b) => {
    if (sortOrder === 'topic') {
        // Safely handle cases where a title might be missing
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB);
    }
    // Default: sort by date, newest first
    return new Date(b.createdAt) - new Date(a.createdAt);
});

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <ChildManagementModal isOpen={isChildModalOpen} onClose={() => setIsChildModalOpen(false)} children={children} setChildren={setChildren} userId={userId}/>
            <header className="bg-gray-800/50 backdrop-blur-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-700">
                <div className="flex items-center text-2xl font-bold text-white"><HootIcon className="h-10 w-10" /><h1 className="ml-1">HootPODS</h1></div>
                 <div className="text-center"><h2 className="text-xl">Welcome, {firstName}!</h2></div>
     <div className="flex items-center gap-4">
    <div className="bg-gray-700 rounded-full px-4 py-2 flex items-center gap-2">
        <HootIcon />
        <span className="font-bold text-lg">{hoots}</span>
        <button onClick={() => setShowBuyTokensModal(true)} className="ml-1 bg-yellow-600 hover:bg-green-800 text-black w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110">
    <PlusIcon />
</button>
    </div>
    <button onClick={signOut} className="bg-yellow-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full">
        Sign Out
    </button>
</div>
            </header>
            <main className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-6">
                        <h2 className="text-3xl font-bold text-center">Create a New Podcast</h2>
                        <form onSubmit={handleGenerateScript} className="space-y-4">
                           <div className="flex justify-end">
                             <button type="button" onClick={() => setIsChildModalOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md">Manage Children</button>
                           </div>
                            <ChildSelector children={children} selectedChildren={selectedChildren} setSelectedChildren={setSelectedChildren} />
                            <div className="flex items-center">
                                <input id="anonymous-check" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-blue-600 focus:ring-blue-500"/>
                                <label htmlFor="anonymous-check" className="ml-2 block text-sm text-gray-300">Make podcast anonymous (no names mentioned)</label>
                            </div>
                            <div>
                                <label htmlFor="topic" className="block text-lg font-semibold text-white mb-2">What's the topic?</label>
                                <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Why is the sky blue?" className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"/>
                            </div>
                            <div>
                                <label className="block text-lg font-semibold text-white mb-2">Choose a Voice</label>
                                <select value={voiceId} onChange={e => setVoiceId(e.target.value)} className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500">
                                    {Object.entries(voiceOptions).map(([label, id]) => (
                                        <option key={id} value={id}>{label}</option>
                                    ))}                                 </select>
                            </div>
                              <button
  type="submit"
  disabled={isLoading}
  className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold text-white bg-yellow-600 rounded-lg hover:bg-green-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
>
  {isLoading ? ( <> <LoaderIcon /> Loading... </> ) : ( '✨ Generate Script Preview ✨' )}
</button>
                        </form>
                        {script && (
                            <div className="border-t-2 border-gray-700 pt-6 space-y-4">
                                <h3 className="text-2xl font-bold">Script Preview</h3>
                                <textarea readOnly value={script} className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-300"></textarea>
                                <button
  onClick={handleCreateAudio}
  disabled={isLoading}
  className="w-full bg-yellow-600 hover:bg-green-800 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg disabled:bg-gray-500"
>
  {isLoading ? <LoaderIcon /> : <HootIcon className="h-6 w-6 mr-2" />} Approve & Create Podcast (Costs 1 Hoot)
</button>
                            </div>
                        )}
                        {isLoading && !script && <p className="text-center text-blue-400">Generating your custom script...</p>}
                        {isLoading && jobId && <p className="text-center text-green-400">Creating your audio masterpiece... This can take a minute. Your podcast will appear in your library when ready.</p>}
                        {error && <p className="text-center text-red-400 font-semibold bg-red-900/50 p-3 rounded-lg">{error}</p>}
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                        <h2 className="text-3xl font-bold text-center mb-6">Your Podcast Library</h2>
                        <div className="flex justify-center gap-4 mb-4">
    <button 
        onClick={() => setSortOrder('date')}
        className={`px-4 py-2 rounded-full font-semibold ${sortOrder === 'date' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
    >
        Sort by Date
    </button>
    <button 
        onClick={() => setSortOrder('topic')}
        className={`px-4 py-2 rounded-full font-semibold ${sortOrder === 'topic' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
    >
        Sort by Topic
    </button>
</div>
                        {isHistoryLoading ? (
    <div className="flex justify-center">
        <LoaderIcon className="h-8 w-8"/>
    </div>
) : (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-3">
        {sortedHistory.map(job => (
            <div key={job.jobId} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                    <p className="font-bold text-lg">{job.title}</p>
                    <p className="text-sm text-gray-400">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                {(() => {
                    // Handle completed podcasts
                    if (job.status && job.status.toLowerCase() === 'complete') {
                        return <button onClick={() => setCurrentTrack({ url: job.audioUrl, title: job.title })} className="bg-yellow-600 hover:bg-green-800 rounded-full p-3"><PlayIcon /></button>;
                    }
                    // Handle pending or processing podcasts
                    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
                        const fiveMinutes = 5 * 60 * 1000;
                        const jobAge = new Date() - new Date(job.createdAt);
                        if (jobAge > fiveMinutes) {
                            return <span className="text-red-400">Failed</span>;
                        }
                        return <div className="flex items-center gap-2 text-yellow-400"><LoaderIcon className="h-5 w-5 mr-0" /><span>Processing</span></div>;
                    }
                    // Handle all other cases (e.g., explicitly FAILED)
                    return <span className="text-red-400">Failed</span>;
                })()}
            </div>
        ))}
        {history.length === 0 && <p className="text-center text-gray-400">You haven't created any podcasts yet.</p>}
    </div>
)}
                    </div>
                </div>
            </main>
            {currentTrack && (
                <div className="sticky bottom-0 bg-gray-700 text-white p-4 shadow-2xl border-t border-gray-600">
                    <audio ref={audioRef} src={currentTrack.url} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} autoPlay/>
                    <div className="max-w-7xl mx-auto flex items-center gap-4">
                        <p className="font-bold truncate w-1/4">{currentTrack.title}</p>
                        <button onClick={togglePlayPause} className="text-blue-400 hover:text-blue-300">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                        <span className="text-sm">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration} value={currentTime} onChange={handleSeek} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                        <span className="text-sm">{formatTime(duration)}</span>
                    </div>
                </div>
            )}
            {showBuyTokensModal && (
    <BuyTokensModal setShowModal={setShowBuyTokensModal} user={user} />
)}
        </div>
    );
};


// --- App Wrapper with Authentication ---
function App() {
    return (
        <div className="min-h-screen bg-gray-900">
            <Authenticator
                loginMechanisms={['email']}
                signUpAttributes={['given_name']}
                components={{
                    Header() {
                        return ( <div className="text-center p-4"><HootIcon className="h-16 w-16 mx-auto" /><Heading level={3} className="text-white">Welcome to HootPODS</Heading></div> );
                    },
                    SignUp: {
                        FormFields() {
                            return ( <> <Authenticator.SignUp.FormFields /> <p className="text-sm text-gray-400 mt-2">First name is optional.</p> </> );
                        }
                    },
                }}
                services={{
                    async handleSignUp(formData) {
                        let { username, password, attributes } = formData;
                        if(attributes.given_name) {
                            attributes.given_name = attributes.given_name.charAt(0).toUpperCase() + attributes.given_name.slice(1);
                        }
                        return signUp({ username, password, options: { userAttributes: attributes } });
                    },
                }}
            >
                {({ signOut, user }) => (<PodcastGenerator signOut={signOut} user={user} />)}
            </Authenticator>
        </div>
    );
}

export default App;

// eslint-disable-next-line no-unused-vars