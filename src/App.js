import React, { useState, useEffect, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import { signUp, fetchAuthSession } from '@aws-amplify/auth';
import { post as apiPost } from '@aws-amplify/api';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { I18n } from '@aws-amplify/core';
import '@aws-amplify/ui-react/styles.css';

// ADD THIS LINE TO OVERRIDE THE LABEL
const vocabularies = {
  en: {
    'Given Name': 'First Name',
  },
};

I18n.putVocabularies(vocabularies);
I18n.setLanguage('en');

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
const LoaderIcon = ({ className = "h-5 w-5 mr-3" }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`animate-spin ${className}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>);
const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>);
const PauseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>);
const HootIcon = ({ className = "h-6 w-6 inline-block" }) => (<img src="/images/IMG_4365.png" alt="Hoot Token" className={className} />);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>);
const ChevronDownIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const ShareIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>);

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
// --- CHILD MANAGEMENT MODAL COMPONENT ---
const ChildManagementModal = ({ isOpen, onClose, children, setChildren, userId }) => {
    // --- STATE ---
    const [name, setName] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [interests, setInterests] = useState('');
    const [editingChildId, setEditingChildId] = useState(null); // New state to track which child is being edited

    // --- HANDLERS ---
    const handleSaveOrUpdateChild = async (e) => {
        e.preventDefault();
        if (!name || !birthdate) return alert("Name and birthdate are required.");

        let updatedChildren;

        if (editingChildId) {
            // This is an UPDATE operation
            updatedChildren = children.map(child =>
                child.id === editingChildId
                    ? { ...child, name, birthdate, interests: interests.split(',').map(i => i.trim()).filter(Boolean) }
                    : child
            );
        } else {
            // This is a CREATE (add new) operation
            const newChild = { id: `child_${Date.now()}`, name, birthdate, interests: interests.split(',').map(i => i.trim()).filter(Boolean) };
            updatedChildren = [...children, newChild];
        }

        try {
            // API call to save the entire updated list of children
            await apiCall('post', '/update-user-profile', { userId, children: updatedChildren });
            setChildren(updatedChildren);
            resetFormAndExitEditMode(); // Reset the form after successful save/update
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
    
    // New function to handle populating the form for an edit
    const startEditing = (child) => {
        setEditingChildId(child.id);
        setName(child.name);
        setBirthdate(child.birthdate);
        setInterests(child.interests.join(', ')); // Convert array back to string for the input field
    };
    
    // New function to clear the form and exit edit mode
    const resetFormAndExitEditMode = () => {
        setEditingChildId(null);
        setName('');
        setBirthdate('');
        setInterests('');
    };

    if (!isOpen) return null;

    // --- JSX ---
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-surface text-text-main rounded-lg p-6 w-full max-w-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4">Manage Children</h2>
                
                {/* The form now handles both adding and updating */}
                <form onSubmit={handleSaveOrUpdateChild} className="bg-muted p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-2">
                        {editingChildId ? "Edit Child's Profile" : "Add a New Child"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Child's Name" className="bg-surface border border-muted rounded p-2 focus:ring-primary focus:border-primary"/>
                        <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="bg-surface border border-muted rounded p-2 focus:ring-primary focus:border-primary"/>
                    </div>
                    <input type="text" value={interests} onChange={e => setInterests(e.target.value)} placeholder="Interests (e.g., dinosaurs, space, animals)" className="w-full mt-4 bg-surface border border-muted rounded p-2 focus:ring-primary focus:border-primary"/>
                    <p className="text-xs text-text-muted mt-1">Separate interests with a comma.</p>
                    <div className="flex items-center gap-4 mt-4">
                        <button type="submit" className="w-full bg-primary hover:bg-primary-hover rounded-md px-4 py-2 font-semibold">
                            {editingChildId ? 'Update Child' : 'Save Child'}
                        </button>
                        {editingChildId && (
                            <button type="button" onClick={resetFormAndExitEditMode} className="w-full bg-gray-600 hover:bg-gray-500 rounded-md px-4 py-2 font-semibold">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                {/* List of saved children */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {children.map(child => (
                        <div key={child.id} className="bg-muted p-3 rounded-md flex justify-between items-center">
                            <div>
                               <p className="font-bold">{child.name}</p>
                               <p className="text-sm text-text-muted">Born: {child.birthdate}</p>
                               <p className="text-sm text-text-muted">Interests: {child.interests.join(', ')}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button onClick={() => startEditing(child)} className="text-blue-400 hover:text-blue-300 font-semibold text-sm">Edit</button>
                                <button onClick={() => handleDeleteChild(child.id)} className="text-red-500 hover:text-red-400 font-semibold text-sm">Remove</button>
                            </div>
                        </div>
                    ))}
                    {children.length === 0 && <p className="text-text-muted text-center">No children saved yet.</p>}
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
        <div className="bg-surface border border-muted rounded-lg p-4">
            <label className="block text-lg font-semibold text-text-main mb-2">Who is this podcast for?</label>
            <div className="space-y-2">
                {children.map(child => (
                    <label key={child.id} className="flex items-center space-x-3 p-3 bg-muted rounded-md cursor-pointer hover:bg-gray-600">
                        <input type="checkbox" checked={selectedChildren.includes(child.id)} onChange={() => handleSelect(child.id)} className="h-5 w-5 rounded bg-background border-muted text-blue-600 focus:ring-primary"/>
                        <span className="text-text-main font-medium">{child.name}</span>
                    </label>
                ))}
                 {children.length === 0 && <p className="text-text-muted">Please add a child profile via the "Manage Children" button.</p>}
            </div>
        </div>
    );
};


// --- PODCAST LIST ITEM COMPONENT ---
const PodcastListItem = ({ job, isPlaying, onPlayPause, onDelete, onShare, currentTrackUrl, currentTime, duration, onSeek }) => {
    const isActive = currentTrackUrl === job.audioUrl;

    return (
        <div className={`bg-muted rounded-lg p-4 transition-all ${isActive ? 'ring-2 ring-accent' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{job.title}</p>
                    <p className="text-sm text-text-muted">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {/* Share Button (New) */}
                    <button onClick={() => onShare(job)} title="Share Podcast" className="text-text-muted hover:text-blue-400 p-2 rounded-full transition-colors">
                        <ShareIcon />
                    </button>
                    {/* Delete Button */}
                    <button onClick={() => onDelete(job.jobId)} title="Delete Podcast" className="text-text-muted hover:text-red-500 p-2 rounded-full transition-colors">
                        <TrashIcon />
                    </button>
                    {/* Play/Pause Button */}
                    <button onClick={() => onPlayPause(job)} className="bg-primary hover:bg-primary-hover rounded-full p-3">
                        {isActive && isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                </div>
            </div>
            {isActive && (
                <div className="mt-4 pt-4 border-t border-muted">
                    <div className="flex items-center gap-2 text-sm">
                        <span>{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration} value={currentTime} onChange={onSeek} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent"/>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- FOOTER COMPONENT ---
const Footer = ({ setTheme }) => {
    return (
        <footer className="w-full bg-background text-center p-6 mt-auto">
            <div className="max-w-4xl mx-auto text-xs text-text-muted space-y-2">
                <p className="font-bold text-text-muted mb-1">Disclaimer</p>
                <p>
                    The content of these podcasts is generated by artificial intelligence. We strongly advise parents to review each script for accuracy and appropriateness before sharing it with children. All content is provided "as is" without warranty of any kind. By using HootPODS, you agree that its creators are not liable for any claims or damages arising from the generated content.
                </p>
                
                {/* --- THEME SWITCHER BUTTONS --- */}
                <div className="pt-4 flex justify-center items-center gap-4">
                    <span className="text-sm font-semibold">Change Theme:</span>
                    <span className="text-sm font">Dark Themes:</span>
                    <button onClick={() => setTheme('default')} title="Yellow Theme" className="h-6 w-6 bg-yellow-600 rounded-full border-2 border-surface focus:outline-none focus:ring-2 focus:ring-accent"></button>
                    <button onClick={() => setTheme('ocean')} title="Ocean Theme" className="h-6 w-6 bg-blue-500 rounded-full border-2 border-surface focus:outline-none focus:ring-2 focus:ring-blue-400"></button>
                    <button onClick={() => setTheme('forest')} title="Forest Theme" className="h-6 w-6 bg-green-600 rounded-full border-2 border-surface focus:outline-none focus:ring-2 focus:ring-green-400"></button>
                <span className="text-sm font">Light Themes:</span>
                 <button onClick={() => setTheme('light')} title="Light Theme" className="h-6 w-6 bg-white rounded-full border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"></button>
                </div>
            </div>
        </footer>
    );
};
// --- THEME DEFINITIONS (MOVED HERE) ---
const themes = {
    default: {
        '--color-primary': '202 138 4',      /* yellow-600 */
        '--color-primary-hover': '22 101 52', /* green-800 */
        '--color-accent': '234 179 8',       /* yellow-500 */
        '--color-accent-alt': '226 139 7',    /* custom orange #e28b07 */
        '--color-background': '17 24 39',      /* gray-900 */
        '--color-surface': '31 41 55',      /* gray-800 */
        '--color-muted': '55 65 81',        /* gray-700 */
        '--color-text-main': '243 244 246',   /* gray-100 */
        '--color-text-muted': '156 163 175',  /* gray-400 */
        '--color-border': '107 114 128',     /* gray-500 */
    },
    ocean: {
        '--color-primary': '59 130 246',     /* blue-500 */
        '--color-primary-hover': '37 99 235', /* blue-600 */
        '--color-accent': '96 165 250',      /* blue-400 */
        '--color-accent-alt': '226 139 7',    /* custom orange #e28b07 */
        '--color-background': '17 24 39',      /* gray-900 */
        '--color-surface': '31 41 55',      /* gray-800 */
        '--color-muted': '55 65 81',        /* gray-700 */
        '--color-text-main': '243 244 246',   /* gray-100 */
        '--color-text-muted': '156 163 175',  /* gray-400 */
        '--color-border': '107 114 128',     /* gray-500 */
    },
    forest: {
        '--color-primary': '22 163 74',      /* green-600 */
        '--color-primary-hover': '21 128 61', /* green-700 */
        '--color-accent': '74 222 128',      /* green-400 */
        '--color-accent-alt': '226 139 7',    /* custom orange #e28b07 */
        '--color-background': '17 24 39',      /* gray-900 */
        '--color-surface': '31 41 55',      /* gray-800 */
        '--color-muted': '55 65 81',        /* gray-700 */
        '--color-text-main': '243 244 246',   /* gray-100 */
        '--color-text-muted': '156 163 175',  /* gray-400 */
        '--color-border': '107 114 128',     /* gray-500 */
    },
    light: {
        '--color-primary': '37 99 235',      /* blue-600 */
        '--color-primary-hover': '29 78 216', /* blue-700 */
        '--color-accent': '59 130 246',      /* blue-500 */
        '--color-accent-alt': '234 179 8',    /* yellow-500 */
        '--color-background': '249 250 251', /* gray-50 */
        '--color-surface': '255 255 255',     /* white */
        '--color-muted': '229 231 235',      /* gray-200 */
        '--color-text-main': '17 24 39',      /* gray-900 */
        '--color-text-muted': '75 85 99',      /* gray-600 */
        '--color-border': '209 213 219',     /* gray-300 */
    }
};
// --- BUY HOOTS MODAL ---
const BuyTokensModal = ({ setShowModal, user }) => {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState(null);

    const hootPacks = [
        { amount: 5,  price: 2.50, priceId: 'price_1Rr8iCBKrdK3UUm6xoWijZW5' },
        { amount: 15, price: 5.00, priceId: 'price_1Rr6t2BKrdK3UUm6aOfwDN1C' },
        { amount: 20, price: 10.00, priceId: 'price_1Rr8iwBKrdK3UUm6Gb5NBhWq' },
        { amount: 30, price: 25.00, priceId: 'price_1Rr8jUBKrdK3UUm6Re99Vycl' },
    ];

   const handlePurchase = async (priceId) => {
    setIsPurchasing(true);
    setError(null);
    try {
        // This uses the authenticated apiCall helper function
        const data = await apiCall('post', '/create-payment-session', { priceId, userId: user.userId });

        if (data.url) {
            window.location.href = data.url; // Redirect to Stripe
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
                    {!isPurchasing && <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><CloseIcon /></button>}
                </div>

                {isPurchasing ? (
                    <div className="text-center py-10">
                        <LoaderIcon className="h-10 w-10 mx-auto text-yellow-500" />
                        <p className="mt-4">Redirecting to our secure payment processor...</p>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-400 mb-6">Each Hoot lets you create one magical audio podcast.</p>
                        <div className="space-y-4">
                            {hootPacks.map(pack => (
                                <button
                                    key={pack.priceId}
                                    onClick={() => handlePurchase(pack.priceId)}
                                    className="w-full flex justify-between items-center p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={isPurchasing}
                                >
                                    <div className="flex items-center">
                                        <HootIcon />
                                        <span className="ml-3 font-bold text-lg">{pack.amount} Hoots</span>
                                    </div>
                                    <span className="text-lg font-bold text-yellow-500">${pack.price.toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
};
// --- PODCAST GENERATOR (MAIN APP) COMPONENT ---
const PodcastGenerator = ({ signOut, user }) => {
    const userId = user.userId; 
    const [firstName, setFirstName] = useState('');
    const [hoots, setHoots] = useState(0);
    const [children, setChildren] = useState([]);
    const [topic, setTopic] = useState('');
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
    const [gradeLevel, setGradeLevel] = useState('5th Grade'); // Default to 5th Grade
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
  //  const [editedScript, setEditedScript] = useState(''); 
    const [script, setScript] = useState(''); // This is the only state we need for the script
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
    const [sortOrder, setSortOrder] = useState('date');
    const [isCreatorOpen, setIsCreatorOpen] = useState(true);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const voiceOptions = { 'Friendly Male': 'pNInz6obpgDQGcFmaJgB', 'Calm Female': '21m00Tcm4TlvDq8ikWAM', 'Energetic Narrator': 'ErXwobaYiN019PkySvjV', 'Female Villain': 'flHkNRp1BlvT73UL6gyz', 'American Grandpa': 'NOpBlnGInO9m6vDvFkFC', 'Texan Boy': 'Bj9UqZbhQsanLzgalpEG' };
       
    // --- THEME STATE AND LOGIC ---
    const [theme, setTheme] = useState(() => localStorage.getItem('hootpods-theme') || 'default');
   
   useEffect(() => {
    const currentTheme = themes[theme];
    const root = document.documentElement;
    Object.keys(currentTheme).forEach(key => {
        root.style.setProperty(key, currentTheme[key]);
    });
    // Save the current theme choice to local storage
    localStorage.setItem('hootpods-theme', theme);
}, [theme]);
    // Find and replace this entire useEffect block in the PodcastGenerator component
useEffect(() => {
    const fetchUserData = async () => {
        if (!userId) return;
        try {
            const profile = await apiCall('post', '/get-user-profile', { userId });
            setHoots(profile.hoots);
            setFirstName(profile.firstName || 'Friend');
            setChildren(profile.children || []);
            fetchHistory(userId);
        } catch (err) {
            setError(`Error fetching user data: ${err.message}`);
        }
    };

    fetchUserData();

    // Check for payment status in the URL after fetching initial data
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('payment') === 'success') {
        alert("Purchase successful! Your Hoots have been added.");
        fetchUserData(); // Refetch the user data to get the new balance
        // Clean the URL so the message doesn't appear on a page refresh
        window.history.replaceState(null, null, window.location.pathname);
    }
    if (queryParams.get('payment') === 'cancelled') {
        // Optional: Show a message if the user cancelled the purchase
        alert("Your purchase was cancelled. You have not been charged.");
        window.history.replaceState(null, null, window.location.pathname);
    }
}, [userId]); // The dependency array remains the same

    useEffect(() => {
        if (!jobId || !isLoading || !userId) return;
        let attempts = 0; const maxAttempts = 24;
        const interval = setInterval(async () => {
            attempts++; if (attempts > maxAttempts) { clearInterval(interval); setError("Audio generation is taking longer than expected. Please check back later."); setIsLoading(false); setJobId(null); return; }
            try {
                const res = await apiCall('post', '/get-history', { userId });
                const latestJob = res.history.find(j => j.jobId === jobId);
                if (latestJob?.status?.toLowerCase() === 'complete') { clearInterval(interval); await fetchHistory(userId); setIsLoading(false); setJobId(null); setScript(''); setTopic(''); setCurrentTrack({ url: latestJob.audioUrl, title: latestJob.title }); setIsLibraryOpen(true); setIsCreatorOpen(false); } 
                else if (latestJob?.status === 'FAILED') { clearInterval(interval); throw new Error(latestJob.errorMessage || 'The podcast generation failed.'); }
            } catch (err) { clearInterval(interval); setError(`Error checking job status: ${err.message}`); setIsLoading(false); setJobId(null); }
        }, 5000);
        return () => clearInterval(interval);
    }, [jobId, isLoading, userId]);
    
    useEffect(() => { if (currentTrack && audioRef.current) { audioRef.current.src = currentTrack.url; audioRef.current.play().catch(e => console.error("Autoplay was prevented:", e)); } }, [currentTrack]);

    const fetchHistory = async (id) => { setIsHistoryLoading(true); try { const res = await apiCall('post', '/get-history', { userId: id }); setHistory(res.history || []); } catch (err) { setError(`Error fetching history: ${err.message}`); } setIsHistoryLoading(false); };
const handleGenerateScript = async (e) => {
    e.preventDefault();
    setError('');
    if (!topic) return setError("Please enter a topic.");
    if (!isAnonymous && selectedChildren.length === 0) return setError("Please select a child or check the anonymous option.");
    setIsLoading(true);
    setScript(''); // Clear the script
    const selectedChildData = children.filter(c => selectedChildren.includes(c.id));
    try {
        const res = await apiCall('post', '/generate-script', { userId, topic, children: selectedChildData, isNeutral: isAnonymous });
        setScript(res.script); // Set the script state
    } catch (err) {
        setError(`Script generation failed: ${err.message}`);
    }
    setIsLoading(false);
};
const handleCreateAudio = async () => {
    setError('');
    if (hoots < 1) return setError("You don't have enough Hoots.");
    setIsLoading(true);
    const selectedChildData = children.filter(c => selectedChildren.includes(c.id));
    const childNameForJob = selectedChildData.length > 0 ? selectedChildData.map(c => c.name).join(' & ') : "Everyone";
    try {
        // This now correctly uses the 'script' state, which holds your edits.
        const res = await apiCall('post', '/create-audio-job', { userId, script, topic, voiceId, gradeLevel, children: selectedChildData, childName: childNameForJob, isNeutral: isAnonymous });
        setJobId(res.jobId);
        setHoots(hoots - 1);
    } catch (err) {
        setError(`Audio creation failed: ${err.message}`);
        setIsLoading(false);
    }
};
const handlePlayPause = (job) => {
    if (currentTrack?.url === job.audioUrl) {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    } else {
        setCurrentTrack({ url: job.audioUrl, title: job.title });
    }
};
const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
const handleLoadedMetadata = () => setDuration(audioRef.current.duration);
const handleSeek = (e) => {
    audioRef.current.currentTime = e.target.value;
    setCurrentTime(e.target.value);
};

    // New delete handler
const handleDeletePodcast = async (jobIdToDelete) => {
    if (!window.confirm("Are you sure you want to permanently delete this podcast? This cannot be undone.")) {
        return;
    }
    try {
        await apiCall('post', '/delete-podcast', { userId, jobId: jobIdToDelete });
        // Remove from local state to update UI instantly
        setHistory(currentHistory => currentHistory.filter(job => job.jobId !== jobIdToDelete));
    } catch (err) {
        setError(`Failed to delete podcast: ${err.message}`);
    }
};
// New share handler
const handleSharePodcast = async (job) => {
    const shareData = {
        title: `Listen to: ${job.title}`,
        text: `I made a HootPOD about "${job.title}"! You can listen to it here:`,
        url: job.audioUrl,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            console.log('Podcast shared successfully!');
        } catch (err) {
            console.error('Error sharing podcast:', err);
        }
    } else {
        // Fallback for browsers that do not support the Web Share API
        try {
            await navigator.clipboard.writeText(job.audioUrl);
            alert('Link copied to clipboard!'); // You could replace this with a more elegant notification
        } catch (err) {
            console.error('Failed to copy link:', err);
            alert('Failed to copy link. Please copy it manually.');
        }
    }
};
    const sortedHistory = [...history].filter(job => job.status && job.status.toLowerCase() === 'complete').sort((a, b) => { if (sortOrder === 'topic') { return (a.title || '').localeCompare(b.title || ''); } return new Date(b.createdAt) - new Date(a.createdAt); });

    return (
        <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} className="hidden" />
            <ChildManagementModal isOpen={isChildModalOpen} onClose={() => setIsChildModalOpen(false)} children={children} setChildren={setChildren} userId={userId}/>
            <header className="bg-surface/50 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-muted">
                <div className="flex justify-between items-center">
                    <div className="flex items-center text-2xl font-bold text-text-main"> <HootIcon className="h-10 w-10" /> <h1 className="ml-1">HootPODS</h1> </div>
                    <div className="hidden md:block text-center"> <h2 className="text-xl">Welcome, {firstName}!</h2> </div>
                    <div className="flex items-center gap-4"> <div className="bg-muted rounded-full px-4 py-2 flex items-center gap-2"> <HootIcon /> <span className="font-bold text-lg">{hoots}</span> <button onClick={() => setShowBuyTokensModal(true)} className="ml-1 bg-primary hover:bg-primary-hover text-background w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"><PlusIcon /></button> </div> <button onClick={signOut} className="bg-primary hover:bg-primary-hover text-text-main font-bold py-2 px-4 rounded-full">Sign Out</button> </div>
                </div>
                <div className="md:hidden text-center mt-2"> <h2 className="text-lg">Welcome, {firstName}!</h2> </div>
            </header>
            
            <main className="p-4 md:p-8 max-w-4xl mx-auto w-full flex-grow">
                <div className="space-y-4">
                    <div className="bg-surface rounded-xl shadow-lg">
                        <button onClick={() => setIsCreatorOpen(!isCreatorOpen)} className="w-full flex justify-between items-center p-6 text-left"> <h2 className="text-3xl font-bold">Create a New Podcast</h2> <ChevronDownIcon className={`h-6 w-6 transition-transform ${isCreatorOpen ? 'rotate-180' : ''}`} /> </button>
                        {isCreatorOpen && ( <div className="p-6 pt-0 space-y-6"> <form onSubmit={handleGenerateScript} className="space-y-4"> <div className="flex justify-end"> <button type="button" onClick={() => setIsChildModalOpen(true)} className="bg-primary hover:bg-primary text-text-main font-bold py-2 px-4 rounded-md">Manage Children</button> </div> <ChildSelector children={children} selectedChildren={selectedChildren} setSelectedChildren={setSelectedChildren} /> <div className="flex items-center"><input id="anonymous-check" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="h-4 w-4 rounded bg-background border-muted text-blue-600 focus:ring-primary"/><label htmlFor="anonymous-check" className="ml-2 block text-sm text-text-muted">Make podcast anonymous</label></div> 
                        <div><label htmlFor="topic" className="block text-lg font-semibold text-text-main mb-2">Topic?</label><input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Why is the sky blue?" className="w-full bg-background border-2 border-muted rounded-lg p-3 focus:ring-primary focus:border-primary"/></div> 
                        <div>
    <label htmlFor="gradeLevel" className="block text-lg font-semibold text-text-main mb-2">Academic Level</label>
    <select 
        id="gradeLevel" 
        value={gradeLevel} 
        onChange={e => setGradeLevel(e.target.value)} 
        className="w-full bg-background border-2 border-muted rounded-lg p-3 focus:ring-primary focus:border-primary"
    >
        <option>Preschool</option>
        <option>Kindergarten</option>
        <option>1st Grade</option>
        <option>2nd Grade</option>
        <option>3rd Grade</option>
        <option>4th Grade</option>
        <option>5th Grade</option>
        <option>6th Grade</option>
        <option>7th Grade</option>
        <option>8th Grade</option>
        <option>9th Grade</option>
        <option>10th Grade</option>
        <option>11th Grade</option>
        <option>12th Grade</option>
        <option>College</option>
        <option>Adult</option>
    </select>
</div>
                        <div><label className="block text-lg font-semibold text-text-main mb-2">Voice</label><select value={voiceId} onChange={e => setVoiceId(e.target.value)} className="w-full bg-background border-2 border-muted rounded-lg p-3 focus:ring-primary focus:border-primary">{Object.entries(voiceOptions).map(([label, id]) => (<option key={id} value={id}>{label}</option>))}</select></div> <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold text-text-main bg-primary rounded-lg hover:bg-primary-hover disabled:bg-muted"> {isLoading ? ( <><LoaderIcon /> Loading...</> ) : ( '✨ Generate Script Preview ✨' )} </button> </form> {script && (<div className="border-t-2 border-muted pt-6 space-y-4"><h3 className="text-2xl font-bold">Script Preview</h3> <span className="text-sm text-text-muted">(Don't like the output? No problem, change the topic or question and click "Generate Preview" for a new script. Want to make minor changes? Feel free to click below to edit the script before submitting for audio generation.)</span>
                        <textarea 
    value={script} 
    onChange={(e) => setScript(e.target.value)}
    className="w-full h-64 bg-background border border-muted rounded-lg p-3 text-text-muted focus:ring-accent focus:border-accent"
></textarea><button onClick={handleCreateAudio} disabled={isLoading} className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg disabled:bg-muted">{isLoading ? <LoaderIcon /> : <HootIcon className="h-6 w-6 mr-2" />} Approve & Create (1 Hoot)</button></div>)} {isLoading && !script && <p className="text-center text-blue-400">Generating script...</p>} {isLoading && jobId && <p className="text-center text-green-400">Creating audio... this can take a minute.</p>} {error && <p className="text-center text-red-400 font-semibold bg-red-900/50 p-3 rounded-lg">{error}</p>} </div> )}
                    </div>
                    <div className="bg-surface rounded-xl shadow-lg">
                        <button onClick={() => setIsLibraryOpen(!isLibraryOpen)} className="w-full flex justify-between items-center p-6 text-left"> <h2 className="text-3xl font-bold">Your Podcast Library</h2> <ChevronDownIcon className={`h-6 w-6 transition-transform ${isLibraryOpen ? 'rotate-180' : ''}`} /> </button>
                        {isLibraryOpen && ( <div className="p-6 pt-0"> <div className="flex justify-center gap-4 mb-4"><button onClick={() => setSortOrder('date')} className={`px-4 py-2 rounded-full font-semibold ${sortOrder === 'date' ? 'bg-primary text-text-main' : 'bg-muted text-text-muted'}`}>Sort by Date</button><button onClick={() => setSortOrder('topic')} className={`px-4 py-2 rounded-full font-semibold ${sortOrder === 'topic' ? 'bg-primary text-text-main' : 'bg-muted text-text-muted'}`}>Sort by Topic</button></div> {isHistoryLoading ? (<div className="flex justify-center"><LoaderIcon className="h-8 w-8"/></div>) : (<div className="space-y-4 max-h-[80vh] overflow-y-auto pr-3">{sortedHistory.map(job => ( <PodcastListItem key={job.jobId} job={job} isPlaying={isPlaying} currentTrackUrl={currentTrack?.url} onPlayPause={handlePlayPause} onDelete={handleDeletePodcast} onShare={handleSharePodcast} currentTime={currentTime} duration={duration} onSeek={handleSeek} /> ))}{sortedHistory.length === 0 && <p className="text-center text-text-muted">Your library is empty.</p>}</div>)} </div> )}
                    </div>
                </div>
            </main>

            <Footer setTheme={setTheme} />
            {showBuyTokensModal && (<BuyTokensModal setShowModal={setShowBuyTokensModal} user={user} />)}
        </div>
    );
};

// --- AUTH WRAPPER & LOGIN PAGE ---
const AboutModal = ({ isOpen, onClose }) => { if (!isOpen) return null; return ( <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"> <div className="bg-surface rounded-2xl shadow-2xl border border-muted p-8 w-full max-w-lg m-4 relative"> <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-main"><CloseIcon /></button> <h2 className="text-2xl font-bold text-text-main mb-4">About HootPODS</h2> <div className="text-text-muted space-y-4"> <p>HootPODS uses advanced AI to create custom, educational, and fun audio podcasts for children on any topic you can imagine.</p> <p>Simply choose a topic, provide a few details about your child, and let our AI storyteller and narrator craft a unique audio adventure they'll love. It's a perfect way to make learning exciting and reduce screen time.</p> <p>Sign up to get started with some free "Hoots" to create your first podcasts!</p> </div> </div> </div> ); };
const Login = () => {
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    return ( <div className="min-h-screen bg-background text-text-main font-sans flex items-center justify-center p-4 relative"> <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} /> <button onClick={() => setIsAboutModalOpen(true)} className="absolute top-4 right-4 bg-muted hover:bg-gray-600 text-text-main font-bold py-2 px-4 rounded-full transition-colors">About App</button> <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center"> <div className="text-center md:text-left"> <div className="flex items-center justify-center md:justify-start text-4xl font-bold text-text-main mb-4"><img src="/images/IMG_4365.png" alt="HootPODS Logo" className="h-12 w-12 mr-3" /><h1>HootPODS</h1></div> <p className="text-xl text-text-muted mb-6">Custom AI-generated podcasts for your kids. Turn any topic into a fun, educational audio adventure they'll love.</p> <p className="text-text-muted">Sign up or sign in to get started!</p> </div> <div> <Authenticator
  loginMechanisms={['email']}
  signUpAttributes={['given_name']}
  components={{
    Header() {
      return (<div className="text-center py-4"><HootIcon className="h-16 w-16 mx-auto" /></div>);
    },
    SignUp: {
      Footer() {
        return <p className="text-sm text-text-muted mt-2 text-center">First name is optional.</p>;
      }
    }
  }}
  services={{
    async handleSignUp(formData) {
      let { username, password, attributes } = formData;
      if (attributes && attributes.given_name) {
        attributes.given_name = attributes.given_name.charAt(0).toUpperCase() + attributes.given_name.slice(1);
      }
      return signUp({ username, password, options: { userAttributes: attributes } });
    }
  }}
/>
    </div> </div> </div> );
};
function App() {
  const { authStatus, user, signOut } = useAuthenticator(context => [context.authStatus, context.user, context.signOut]);
  if (authStatus === 'unauthenticated' || authStatus === 'configuring') { return <Login />; }
  if (!user) { return (<div className="min-h-screen bg-background flex items-center justify-center"><LoaderIcon className="h-12 w-12 text-accent" /></div>); }
  return <PodcastGenerator signOut={signOut} user={user} />;
}
function AppWithAuth() { return (<Authenticator.Provider><App /></Authenticator.Provider>); }
export default AppWithAuth