import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, arrayUnion, setDoc, getDoc, getDocs, increment, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { CheckCircle, MessageSquare, Plus, Edit, Send, Image as ImageIcon, Video, ThumbsUp, XCircle, Clock, LogOut, Filter, UploadCloud, Save, Archive, FolderOpen, Calendar as CalendarIcon, Columns, Lightbulb, Trash2, AlertTriangle, Download, List, LayoutGrid, SendHorizonal } from 'lucide-react';

// --- Firebase Configuration ---
/* eslint-disable no-undef */
let firebaseConfig;
if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
} else {
    firebaseConfig = {
    apiKey: "AIzaSyDakANta9S4ABmkry8hIzgaRusvWgShz9E",
    authDomain: "social-hub-d1682.firebaseapp.com",
    projectId: "social-hub-d1682",
    storageBucket: "social-hub-d1682.firebasestorage.app",
    messagingSenderId: "629544933010",
    appId: "1:629544933010:web:54d6b73ca31dd5dcbcb84b"
    };
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-social-approval-app';
/* eslint-enable no-undef */

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Helper Components ---
const Notification = ({ message, type, onDismiss }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => onDismiss(), 4000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);
    if (!message) return null;
    const baseStyle = "fixed top-5 right-5 p-4 rounded-lg shadow-xl text-white flex items-center z-50 transition-transform transform translate-x-0";
    const typeStyles = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
    return (
        <div className={`${baseStyle} ${typeStyles[type] || 'bg-gray-800'}`}>
            {type === 'success' && <CheckCircle className="mr-3" />}
            {type === 'error' && <XCircle className="mr-3" />}
            {type === 'info' && <MessageSquare className="mr-3" />}
            {message}
        </div>
    );
};

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex justify-between items-center"><h3 className="text-2xl font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XCircle size={28} /></button></div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// --- Authentication Components ---
const AuthScreen = ({ setNotification }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('client');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if (!name) { setNotification({ message: 'Please enter your name.', type: 'error' }); setIsLoading(false); return; }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), { name, email, role });
            }
        } catch (error) {
            setNotification({ message: error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8"><h1 className="text-4xl font-bold text-gray-800">Core<span className="text-green-600">X</span> Social Hub</h1><p className="text-gray-500 mt-2">{isLogin ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}</p></div>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <form onSubmit={handleAuthAction} className="space-y-6">
                        {!isLogin && (<><div><label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-green-500 transition" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label><select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-green-500 transition"><option value="client">Client</option><option value="designer">Designer</option></select></div></>)}
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-green-500 transition" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-2">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-green-500 transition" /></div>
                        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">{isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
                    </form>
                    <div className="text-center mt-6"><button onClick={() => setIsLogin(!isLogin)} className="text-sm text-green-600 hover:text-green-700 font-semibold">{isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}</button></div>
                </div>
            </div>
        </div>
    );
};

// --- Portal Components ---
const getStatusChip = (status) => {
    switch (status) {
        case 'Post Idea': return <div className="flex items-center text-xs font-medium text-gray-800 bg-gray-200 px-2 py-1 rounded-full"><Lightbulb size={12} className="mr-1.5" />{status}</div>;
        case 'Scheduled': return <div className="flex items-center text-xs font-medium text-blue-800 bg-blue-100 px-2 py-1 rounded-full"><CalendarIcon size={12} className="mr-1.5" />{status}</div>;
        case 'Pending Review': return <div className="flex items-center text-xs font-medium text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full"><Clock size={12} className="mr-1.5" />{status}</div>;
        case 'Revisions Requested': return <div className="flex items-center text-xs font-medium text-orange-800 bg-orange-100 px-2 py-1 rounded-full"><Edit size={12} className="mr-1.5" />{status}</div>;
        case 'Approved': return <div className="flex items-center text-xs font-medium text-green-800 bg-green-100 px-2 py-1 rounded-full"><CheckCircle size={12} className="mr-1.5" />{status}</div>;
        case 'Archived': return <div className="flex items-center text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded-full"><Archive size={12} className="mr-1.5" />{status}</div>;
        default: return <div className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded-full">{status}</div>;
    }
};

const DelayedLoopVideo = ({ src, className }) => {
    const videoRef = useRef(null);
    const handleVideoEnd = () => { setTimeout(() => { if (videoRef.current) { videoRef.current.play(); } }, 20000); };
    return (<video ref={videoRef} src={src} className={className} autoPlay muted playsInline onEnded={handleVideoEnd} />);
};

const PostCard = ({ post, user, onReview, onApprove, onRevise, onArchive, onDelete }) => {
    const canApprove = user.role === 'client' && (post.status === 'Pending Review' || post.status === 'Revisions Requested');
    const canRevise = user.role === 'client' && post.status === 'Pending Review' && (post.revisionCount || 0) < 2;
    const canArchive = user.role === 'designer' && post.status === 'Approved';
    const canDelete = user.role === 'designer' && post.status === 'Archived';
    
    const hasUnreadComments = useMemo(() => {
        if (!post.feedback || post.feedback.length === 0) return false;
        const lastCommenterId = post.feedback[post.feedback.length - 1].authorId;
        const seenBy = post.seenBy || [];
        return lastCommenterId !== user.uid && !seenBy.includes(user.uid);
    }, [post.feedback, post.seenBy, user.uid]);

    const revisionCountText = (count) => {
        if (!count || count === 0) return null;
        const suffix = count === 1 ? 'st' : count === 2 ? 'nd' : count === 3 ? 'rd' : 'th';
        return `${count}${suffix} Revision`;
    };

    const isVideo = post.mediaUrls?.[0]?.toLowerCase().includes('.mp4') || post.mediaUrls?.[0]?.toLowerCase().includes('.mov');

    return (
        <div onClick={() => onReview(post)} className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:border-green-500 transition-all duration-300 flex flex-col cursor-pointer">
            <div className="relative">
                {isVideo ? (
                    <DelayedLoopVideo src={post.mediaUrls?.[0]} className="w-full h-32 object-cover bg-black" />
                ) : (
                    <img src={post.mediaUrls?.[0] || 'https://placehold.co/600x400/f0f0f0/333333?text=No+Media'} alt="Social media post" className="w-full h-32 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f0f0f0/333333?text=Media+Error`; }}/>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center backdrop-blur-sm">
                    {isVideo ? <Video size={12} className="mr-1.5" /> : <ImageIcon size={12} className="mr-1.5" />}
                    {post.mediaUrls?.length || 0}
                </div>
            </div>
            <div className="p-4 flex flex-col flex-grow"><div className="flex justify-between items-start mb-2"><div className="text-xs font-semibold text-green-600 uppercase tracking-wider flex flex-wrap gap-x-2">{post.platforms?.join(', ')}</div>{getStatusChip(post.status)}</div><p className="text-gray-700 text-sm mb-3 flex-grow line-clamp-2">{post.caption}</p><p className="text-xs text-gray-500 mb-4 break-all line-clamp-1">{post.hashtags}</p><div className="border-t border-gray-200 pt-3 mt-auto"><div className="flex justify-between items-center"><div className="flex items-center text-sm text-gray-600 hover:text-black transition-colors"><MessageSquare size={16} className="mr-2" /><span>{post.feedback?.length || 0} Comments</span>{hasUnreadComments && <div className="ml-2 w-2 h-2 bg-red-500 rounded-full"></div>}</div><div className="flex items-center gap-2">{canRevise && (<button onClick={(e) => {e.stopPropagation(); onRevise(post.id);}} className="flex items-center text-sm bg-gray-700 hover:bg-black text-white font-bold py-2 px-3 rounded-lg transition-colors"><Edit size={16} className="mr-2" />Revise</button>)}{canApprove && (<button onClick={(e) => {e.stopPropagation(); onApprove(post.id);}} className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors"><ThumbsUp size={16} className="mr-2" />Approve</button>)}{canArchive && (<button onClick={(e) => {e.stopPropagation(); onArchive(post.id);}} className="flex items-center text-sm bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors"><Archive size={16} className="mr-2" />Archive</button>)}{canDelete && (<button onClick={(e) => {e.stopPropagation(); onDelete(post);}} className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>)}</div></div>{post.revisionCount > 0 && <div className="text-xs text-orange-600 font-semibold mt-2">{revisionCountText(post.revisionCount)}</div>}</div></div>
        </div>
    );
};

const PostListItem = ({ post, user, onReview, clients }) => {
    const clientName = useMemo(() => {
        if (user.role !== 'designer' || !clients) return '';
        const client = clients.find(c => c.id === post.clientId);
        return client ? client.name : 'Unknown Client';
    }, [post.clientId, clients, user.role]);

    return (
        <tr onClick={() => onReview(post)} className="bg-white hover:bg-gray-50 border-b border-gray-200 cursor-pointer">
            <td className="px-4 py-3 w-16">
                {post.mediaUrls && post.mediaUrls.length > 0 ? (
                    <img src={post.mediaUrls[0]} alt="media" className="w-12 h-12 object-cover rounded-md" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/f0f0f0/333333?text=N/A'; }} />
                ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-400" />
                    </div>
                )}
            </td>
            <td className="px-4 py-3">
                <p className="font-medium text-gray-800 line-clamp-2">{post.caption}</p>
                {user.role === 'designer' && <p className="text-xs text-gray-500">{clientName}</p>}
            </td>
            <td className="px-4 py-3">{getStatusChip(post.status)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{post.scheduledAt?.toDate ? post.scheduledAt.toDate().toLocaleDateString() : 'Unscheduled'}</td>
            <td className="px-4 py-3 text-sm text-gray-600 text-center">{post.feedback?.length || 0}</td>
        </tr>
    );
};

const ListView = ({ posts, user, onReview, clients }) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-2 font-semibold text-gray-600">Media</th>
                        <th className="px-4 py-2 font-semibold text-gray-600">Caption</th>
                        <th className="px-4 py-2 font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-2 font-semibold text-gray-600">Scheduled</th>
                        <th className="px-4 py-2 font-semibold text-gray-600 text-center">Comments</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.length > 0 ? (
                        posts.map(post => <PostListItem key={post.id} post={post} user={user} onReview={onReview} clients={clients} />)
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center py-10 text-gray-400 text-sm">No posts in this view.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const platformOptions = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok'];
const NewPostForm = ({ user, clients, onPostCreated, onCancel, initialData, selectedDate }) => {
    const [platforms, setPlatforms] = useState([]);
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setCaption(initialData.caption || '');
            setMediaPreviews(initialData.mediaUrls?.map(url => ({ url, type: url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') ? 'video/mp4' : 'image/jpeg', isExisting: true })) || []);
            setSelectedClientId(initialData.clientId || '');
        } else if (clients.length > 0) {
            setSelectedClientId(clients[0].id);
        }

        if (selectedDate) {
            const date = new Date(selectedDate);
            date.setHours(10, 0, 0, 0);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            setScheduledAt(formattedDate);
        }

    }, [initialData, clients, selectedDate]);


    const handlePlatformChange = (platform) => {
        setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if ((mediaFiles.length + files.length) > 5) { alert("You can only upload a maximum of 5 files."); return; }
            setMediaFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type
            }));
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeMedia = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadMedia = async (files) => {
        const mediaUrls = [];
        for (const file of files) {
            const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            mediaUrls.push(downloadURL);
        }
        return mediaUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caption || !selectedClientId || platforms.length === 0 || !scheduledAt) { alert("Please fill all fields: Client, Schedule Date, and Platforms."); return; }
        setIsUploading(true);
        try {
            const uploadedMediaUrls = await uploadMedia(mediaFiles);
            const existingMediaUrls = mediaPreviews.filter(p => p.isExisting).map(p => p.url);
            const finalMediaUrls = [...existingMediaUrls, ...uploadedMediaUrls];

            const newPost = { platforms, caption, hashtags, mediaUrls: finalMediaUrls, clientId: selectedClientId, designerId: user.uid, status: 'Scheduled', feedback: [], revisionCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), seenBy: [user.uid], scheduledAt: new Date(scheduledAt) };
            onPostCreated(newPost, initialData?.id);
        } catch (error) {
            console.error("Media upload failed:", error);
            alert("Media upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Assign to Client</label><select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"><option value="" disabled>Select a client...</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label><input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">{platformOptions.map(p => (<label key={p} className="flex items-center space-x-2"><input type="checkbox" checked={platforms.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" /><span>{p}</span></label>))}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Caption</label><textarea value={caption} onChange={e => setCaption(e.target.value)} rows="4" placeholder="Write a compelling caption..." className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"></textarea></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label><input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#realestate #newlisting #dreamhome" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition" /></div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images & Videos (up to 5, optional for scheduling)</label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500">
                                <span>Upload files</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,video/mp4,video/quicktime" onChange={handleFileChange} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF, MP4, MOV up to 50MB</p>
                    </div>
                </div>
                {mediaPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {mediaPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                                {preview.type.startsWith('video') ? (
                                    <DelayedLoopVideo src={preview.url} className="h-24 w-24 object-cover rounded-md bg-black" />
                                ) : (
                                    <img src={preview.url} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-md" />
                                )}
                                <button type="button" onClick={() => removeMedia(index)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">Cancel</button><button type="submit" disabled={isUploading} className="py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center disabled:bg-gray-400">{isUploading ? 'Scheduling...' : <><CalendarIcon size={18} className="mr-2" /> Schedule</>}</button></div>
        </form>
    );
};

const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.round((now - date) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ReviewModal = ({ post, user, onAddFeedback, onClose, onUpdatePost, onDelete, onSendToReview }) => {
    const [comment, setComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ caption: '', hashtags: '', mediaUrls: [], platforms: [], scheduledAt: '' });
    const [newMediaFiles, setNewMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    useEffect(() => {
        if (post) {
            if(post.status === 'Post Idea' && user.role === 'designer'){
                setIsEditing(true);
            }
            const scheduledAtDate = post.scheduledAt?.toDate ? post.scheduledAt.toDate() : post.scheduledAt ? new Date(post.scheduledAt) : null;
            const formattedScheduleDate = scheduledAtDate ? `${scheduledAtDate.getFullYear()}-${String(scheduledAtDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledAtDate.getDate()).padStart(2, '0')}T${String(scheduledAtDate.getHours()).padStart(2, '0')}:${String(scheduledAtDate.getMinutes()).padStart(2, '0')}`: '';
            
            setEditData({ 
                caption: post.caption, 
                hashtags: post.hashtags || '', 
                mediaUrls: post.mediaUrls || [], 
                platforms: post.platforms || [],
                scheduledAt: formattedScheduleDate
            });
            setMediaPreviews((post.mediaUrls || []).map(url => ({ url, type: url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov') ? 'video' : 'image' })));
            setNewMediaFiles([]);
            setCurrentMediaIndex(0);
        }
    }, [post, user.role]);

    const handleFeedbackSubmit = () => { if (!comment.trim()) return; const feedbackData = { authorId: user.uid, authorName: user.name, text: comment, timestamp: new Date().toISOString(), authorRole: user.role }; onAddFeedback(post.id, feedbackData); setComment(''); };
    
    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if ((editData.mediaUrls.length + newMediaFiles.length + files.length) > 5) { alert("You can only have a maximum of 5 files."); return; }
            setNewMediaFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type
            }));
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeMedia = (index, isExisting) => {
        if (isExisting) {
            setEditData(prev => ({ ...prev, mediaUrls: prev.mediaUrls.filter((_, i) => i !== index) }));
            const newMediaPreviews = [...mediaPreviews];
            newMediaPreviews.splice(index, 1);
            setMediaPreviews(newMediaPreviews);
        } else {
            const newFileIndex = index - editData.mediaUrls.length;
            setNewMediaFiles(prev => prev.filter((_, i) => i !== newFileIndex));
            const newMediaPreviews = [...mediaPreviews];
            newMediaPreviews.splice(index, 1);
            setMediaPreviews(newMediaPreviews);
        }
    };

    const uploadMedia = async (files) => {
        const urls = [];
        for (const file of files) {
            const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            urls.push(downloadURL);
        }
        return urls;
    };

    const handleSaveChanges = async () => {
        setIsUploading(true);
        try {
            const newUploadedUrls = await uploadMedia(newMediaFiles);
            const finalMediaUrls = [...editData.mediaUrls, ...newUploadedUrls];
            const finalPostData = { 
                caption: editData.caption, 
                hashtags: editData.hashtags, 
                mediaUrls: finalMediaUrls, 
                platforms: editData.platforms, 
                seenBy: [user.uid],
                scheduledAt: new Date(editData.scheduledAt),
            };
            
            if(post.status === 'Post Idea') {
                finalPostData.status = 'Scheduled';
            }
            onUpdatePost(post.id, finalPostData);
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Update failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handlePlatformChange = (platform) => {
        setEditData(prev => ({...prev, platforms: prev.platforms.includes(platform) ? prev.platforms.filter(p => p !== platform) : [...prev.platforms, platform]}));
    };

    const nextMedia = () => setCurrentMediaIndex(prev => (prev + 1) % (mediaPreviews.length || 1));
    const prevMedia = () => setCurrentMediaIndex(prev => (prev - 1 + (mediaPreviews.length || 1)) % (mediaPreviews.length || 1));

    if (!post) return null;
    
    const currentMedia = mediaPreviews[currentMediaIndex];
    
    const handleDownload = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0];
            link.download = decodeURIComponent(fileName) || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    return (
        <Modal isOpen={!!post} onClose={onClose} title={`${isEditing ? 'Editing' : 'Reviewing'}: ${post.platforms?.join(', ') || 'Post Idea'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label><input type="datetime-local" value={editData.scheduledAt} onChange={e => setEditData({...editData, scheduledAt: e.target.value})} required className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">{platformOptions.map(p => (<label key={p} className="flex items-center space-x-2"><input type="checkbox" checked={editData.platforms.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" /><span>{p}</span></label>))}</div></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Media ({mediaPreviews.length} / 5)</label>
                                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"><div className="text-center"><UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" /><div className="mt-4 flex text-sm leading-6 text-gray-600"><label htmlFor="edit-file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500"><span>Upload files</span><input id="edit-file-upload" name="edit-file-upload" type="file" className="sr-only" multiple accept="image/*,video/mp4,video/quicktime" onChange={handleFileChange} /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF, MP4, MOV up to 50MB</p></div></div>
                                {mediaPreviews.length > 0 && (<div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">{mediaPreviews.map((preview, index) => (<div key={preview.url} className="relative group">{preview.type.startsWith('video') ? <DelayedLoopVideo src={preview.url} className="h-24 w-24 object-cover rounded-md bg-black" /> : <img src={preview.url} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-md" />}<button type="button" onClick={() => removeMedia(index, index < editData.mediaUrls.length)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle size={16} /></button></div>))}</div>)}
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Caption</label><textarea value={editData.caption} onChange={e => setEditData({...editData, caption: e.target.value})} rows="6" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"></textarea></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label><input type="text" value={editData.hashtags} onChange={e => setEditData({...editData, hashtags: e.target.value})} className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition" /></div>
                            <div className="flex justify-end gap-4 pt-4"><button onClick={() => setIsEditing(false)} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">Cancel</button><button onClick={handleSaveChanges} disabled={isUploading} className="py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center disabled:bg-gray-400">{isUploading ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Changes</>}</button></div>
                        </>
                    ) : (
                        <>
                           <div className="relative">
                                {currentMedia?.type.startsWith('video') ? (
                                    <video src={currentMedia.url} controls className="rounded-lg w-full h-80 object-contain bg-black" />
                                ) : (
                                    <img src={currentMedia?.url || 'https://placehold.co/600x400/f0f0f0/333333?text=No+Media'} alt="Social media post" className="rounded-lg w-full h-80 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f0f0f0/333333?text=Media+Error`; }}/>
                                )}
                                {mediaPreviews?.length > 1 && (<><button onClick={prevMedia} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">‹</button><button onClick={nextMedia} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">›</button><div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{currentMediaIndex + 1} / {mediaPreviews.length}</div></>)}
                                {user.role === 'designer' && currentMedia && (
                                    <button 
                                        onClick={() => handleDownload(currentMedia.url)} 
                                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                                        title="Download Media"
                                    >
                                        <Download size={18} />
                                    </button>
                                )}
                            </div>
                            <div><h4 className="font-bold text-lg text-gray-800 mb-1">Scheduled for</h4><p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{editData.scheduledAt ? new Date(editData.scheduledAt).toLocaleString() : 'Not scheduled'}</p></div>
                            <div><h4 className="font-bold text-lg text-gray-800 mb-1">Caption</h4><p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{post?.caption}</p></div>
                            <div><h4 className="font-bold text-lg text-gray-800 mb-1">Hashtags</h4><p className="text-gray-500 bg-gray-50 p-3 rounded-lg break-all">{post?.hashtags}</p></div>
                        </>
                    )}
                </div>
                <div className="flex flex-col h-full"><div className="flex justify-between items-center mb-3"><h4 className="font-bold text-lg text-gray-800">Feedback & Revisions</h4>{user.role === 'designer' && (post.status !== 'Post Idea') && !isEditing && (<button onClick={() => setIsEditing(true)} className="flex items-center text-sm bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors"><Edit size={16} className="mr-2" /> Edit Post</button>)}</div><div className="flex-grow bg-gray-50 rounded-lg p-4 space-y-4 overflow-y-auto mb-4 min-h-[200px] max-h-[40vh]">{post?.feedback?.length > 0 ? (post.feedback.map((fb, index) => (<div key={index} className={`flex flex-col ${fb.authorRole === 'client' ? 'items-start' : 'items-end'}`}><div className={`p-3 rounded-lg max-w-[80%] ${fb.authorRole === 'client' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}><p className="text-sm whitespace-pre-wrap">{fb.text}</p></div><span className="text-xs text-gray-500 mt-1">{fb.authorName} - {formatTimestamp(fb.timestamp)}</span></div>))) : (<div className="text-center text-gray-500 pt-8">No feedback yet.</div>)}</div>{post?.status !== 'Approved' && post.status !== 'Post Idea' && !isEditing && (<div className="mt-auto flex items-center gap-2"><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition text-gray-800" rows="2" onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFeedbackSubmit(); } }} /><button onClick={handleFeedbackSubmit} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!comment.trim()}><Send size={20} /></button></div>)}</div>
            </div>
             <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end items-center gap-4">
                {user.role === 'designer' && post.status === 'Scheduled' && !isEditing && (
                    <button onClick={() => { onSendToReview(post); onClose(); }} className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"><SendHorizonal size={16} className="mr-2" /> Send to Review</button>
                )}
                {user.role === 'designer' && (
                    <button onClick={() => onDelete(post)} className="flex items-center text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"><Trash2 size={16} className="mr-2" /> Delete Post</button>
                )}
            </div>
        </Modal>
    );
};

const CalendarView = ({ posts, onSelectEvent, onSelectSlot, userRole }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const days = [];
    let date = new Date(startDate);
    while (days.length < 42) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    
    const postsByDay = useMemo(() => {
        const map = new Map();
        posts.forEach(post => {
            if (post.scheduledAt?.toDate) {
                const postDate = post.scheduledAt.toDate().toDateString();
                if (!map.has(postDate)) {
                    map.set(postDate, []);
                }
                map.get(postDate).push(post);
            }
        });
        return map;
    }, [posts]);

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200">‹</button>
                <h2 className="text-xl font-bold">
                    {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600">
                {weekDays.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const dayKey = day.toDateString();
                    const dayPosts = postsByDay.get(dayKey) || [];
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    return (
                        <div key={index} className={`border rounded-lg p-2 h-32 flex flex-col ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${userRole === 'designer' ? 'cursor-pointer hover:bg-gray-100' : ''}`} onClick={() => userRole === 'designer' && onSelectSlot(day)}>
                            <span className={`font-bold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>{day.getDate()}</span>
                            <div className="flex-grow overflow-y-auto text-left text-xs space-y-1 mt-1">
                                {dayPosts.map(post => {
                                    let bgColor = 'bg-gray-200 text-gray-800';
                                    if(post.status === 'Post Idea') bgColor = 'bg-gray-200 text-gray-800';
                                    if (post.status === 'Scheduled') bgColor = 'bg-blue-200 text-blue-800';
                                    if (post.status === 'Approved') bgColor = 'bg-green-200 text-green-800';
                                    if (post.status === 'Revisions Requested') bgColor = 'bg-red-200 text-red-800';
                                    if (post.status === 'Pending Review') bgColor = 'bg-yellow-200 text-yellow-800';

                                    return (
                                        <div key={post.id} onClick={(e) => { e.stopPropagation(); onSelectEvent(post); }} className={`p-1 rounded cursor-pointer hover:opacity-75 ${bgColor}`}>
                                            <p className="truncate font-semibold">{post.caption}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ClientIdeaModal = ({ isOpen, onClose, onShare, setNotification }) => {
    const [idea, setIdea] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if ((mediaFiles.length + files.length) > 5) {
                setNotification({ message: "You can only upload a maximum of 5 files.", type: 'error' });
                return;
            }
            setMediaFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type
            }));
            setMediaPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeMedia = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setIdea('');
        setMediaFiles([]);
        setMediaPreviews([]);
        setIsUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!idea.trim()) {
            setNotification({ message: "Please describe your idea.", type: 'error' });
            return;
        }
        setIsUploading(true);
        try {
            const mediaUrls = [];
            for (const file of mediaFiles) {
                const storageRef = ref(storage, `ideas/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                mediaUrls.push(downloadURL);
            }
            await onShare({ idea, mediaUrls });
            resetForm();
            onClose();
        } catch (error) {
            console.error("Idea submission failed:", error);
            setNotification({ message: "Idea submission failed. Please try again.", type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share a New Idea">
            <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Idea</label>
                    <textarea value={idea} onChange={e => setIdea(e.target.value)} rows="4" placeholder="Describe your idea for a post. e.g., 'A video walkthrough of the new property on 123 Main St.'" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Images or Videos (up to 5)</label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                        <div className="text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label htmlFor="idea-file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500">
                                    <span>Upload files</span>
                                    <input id="idea-file-upload" name="idea-file-upload" type="file" className="sr-only" multiple accept="image/*,video/mp4,video/quicktime" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF, MP4, MOV up to 50MB</p>
                        </div>
                    </div>
                    {mediaPreviews.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                            {mediaPreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    {preview.type.startsWith('video') ? (
                                        <DelayedLoopVideo src={preview.url} className="h-24 w-24 object-cover rounded-md bg-black" />
                                    ) : (
                                        <img src={preview.url} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-md" />
                                    )}
                                    <button type="button" onClick={() => removeMedia(index)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle size={16} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => { resetForm(); onClose(); }} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">Cancel</button>
                    <button type="submit" disabled={isUploading} className="py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center disabled:bg-gray-400">
                        {isUploading ? 'Sharing...' : <><Send size={18} className="mr-2" /> Share Idea</>}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0">
                           <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4 text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">{message}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                    <button onClick={onConfirm} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">
                        Confirm
                    </button>
                    <button onClick={onClose} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};


const Portal = ({ user, setNotification }) => {
    const [posts, setPosts] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
    const [isClientIdeaModalOpen, setIsClientIdeaModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [reviewingPost, setReviewingPost] = useState(null);
    const [clientFilter, setClientFilter] = useState('all');
    const [viewMode, setViewMode] = useState('overview'); // 'overview', 'pending', 'revision', 'approved', 'calendar', 'archived'
    const [subViewMode, setSubViewMode] = useState('bucket'); // 'bucket', 'list'
    const [postToDelete, setPostToDelete] = useState(null);

    const markAsSeen = async (postId) => {
        const postRef = doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId);
        await updateDoc(postRef, { seenBy: arrayUnion(user.uid) });
    };

    const handleOpenReview = (post) => {
        setReviewingPost(post);
        if(post.id) {
            markAsSeen(post.id);
        }
    };

    const handleSelectSlot = (date) => {
        setSelectedDate(date);
        setIsNewPostModalOpen(true);
    };

    const handleShareIdea = async ({ idea, mediaUrls }) => {
        let designerId = null;
        const userPosts = posts
            .filter(p => p.clientId === user.uid && p.designerId)
            .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
        if (userPosts.length > 0) {
            designerId = userPosts[0].designerId;
        }

        const newIdeaPost = {
            caption: idea,
            mediaUrls,
            clientId: user.uid,
            designerId: designerId,
            status: 'Post Idea',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            seenBy: [user.uid],
            feedback: [],
            platforms: [],
            hashtags: '',
            revisionCount: 0,
            scheduledAt: null,
        };
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/social_media_posts`), newIdeaPost);
            setNotification({ message: 'Idea shared! Your designer will be notified.', type: 'success' });
        } catch (e) {
            setNotification({ message: 'Failed to share idea.', type: 'error' });
            console.error("Error sharing idea: ", e);
        }
    };


    useEffect(() => {
        setIsLoading(true);
        const postsCollection = collection(db, `artifacts/${appId}/public/data/social_media_posts`);
        const q = user.role === 'designer' ? postsCollection : query(postsCollection, where("clientId", "==", user.uid), where("status", "!=", "Scheduled"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            postsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setPosts(postsData);
            setIsLoading(false);
        }, (error) => { console.error("Firestore Error:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (user.role === 'designer') {
            const fetchClients = async () => {
                const usersCollection = collection(db, "users");
                const q = query(usersCollection, where("role", "==", "client"));
                const querySnapshot = await getDocs(q);
                const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(clientsData);
            };
            fetchClients();
        }
    }, [user.role]);
    
    useEffect(() => { if (reviewingPost) { const updatedPost = posts.find(p => p.id === reviewingPost.id); if (updatedPost) setReviewingPost(updatedPost); } }, [posts, reviewingPost]);

    const handleCreatePost = async (newPostData, ideaIdToDelete) => { 
        try { 
            await addDoc(collection(db, `artifacts/${appId}/public/data/social_media_posts`), newPostData); 
            if (ideaIdToDelete) {
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, ideaIdToDelete));
            }
            setIsNewPostModalOpen(false); 
            setNotification({ message: 'Post scheduled!', type: 'success' }); 
        } catch (e) { 
            setNotification({ message: 'Failed to schedule post.', type: 'error' }); 
        } 
    };
    const handleUpdatePost = async (postId, updatedData) => { try { await updateDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId), { ...updatedData, updatedAt: serverTimestamp() }); setNotification({ message: 'Post updated!', type: 'success' }); } catch (e) { setNotification({ message: 'Failed to update post.', type: 'error' }); } };
    const handleApprovePost = async (postId) => { try { await updateDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId), { status: 'Approved', updatedAt: serverTimestamp() }); setNotification({ message: 'Post approved!', type: 'success' }); } catch (e) { setNotification({ message: 'Failed to approve post.', type: 'error' }); } };
    const handleAddFeedback = async (postId, feedbackData) => { try { const updatePayload = { feedback: arrayUnion(feedbackData), updatedAt: serverTimestamp(), seenBy: [user.uid] }; await updateDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId), updatePayload); setNotification({ message: 'Comment posted.', type: 'info' }); } catch (e) { setNotification({ message: 'Failed to add feedback.', type: 'error' }); } };
    const handleRequestRevision = async (postId) => { try { const postRef = doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId); await updateDoc(postRef, { status: 'Revisions Requested', revisionCount: increment(1), updatedAt: serverTimestamp(), seenBy: [user.uid] }); setNotification({ message: 'Revision requested.', type: 'info' }); } catch (e) { setNotification({ message: 'Failed to request revision.', type: 'error' }); }};
    const handleArchivePost = async (postId) => { try { const postRef = doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId); await updateDoc(postRef, { status: 'Archived', updatedAt: serverTimestamp() }); setNotification({ message: 'Post archived.', type: 'info' }); } catch (e) { setNotification({ message: 'Failed to archive post.', type: 'error' }); }};
    const handleSendToReview = async (post) => { 
        if (!post.mediaUrls || post.mediaUrls.length === 0) {
            setNotification({ message: 'Please add media to the post before sending for review.', type: 'error' });
            return;
        }
        try { 
            const postRef = doc(db, `artifacts/${appId}/public/data/social_media_posts`, post.id); 
            await updateDoc(postRef, { status: 'Pending Review', updatedAt: serverTimestamp() }); 
            setNotification({ message: 'Post sent for review!', type: 'success' }); 
        } catch (e) { 
            setNotification({ message: 'Failed to send for review.', type: 'error' }); 
        }
    };
    const handleSignOut = async () => { try { await signOut(auth); setNotification({ message: 'Signed out.', type: 'info' }); } catch (error) { setNotification({ message: 'Failed to sign out.', type: 'error' }); } };

    const handleDeletePost = async () => {
        if (!postToDelete) return;

        try {
            if (postToDelete.mediaUrls && postToDelete.mediaUrls.length > 0) {
                for (const url of postToDelete.mediaUrls) {
                    const fileRef = ref(storage, url);
                    await deleteObject(fileRef);
                }
            }
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postToDelete.id));

            setNotification({ message: 'Post permanently deleted.', type: 'success' });
            setReviewingPost(null);
        } catch (error) {
            console.error("Error deleting post:", error);
            setNotification({ message: 'Failed to delete post.', type: 'error' });
        } finally {
            setPostToDelete(null);
        }
    };

    const clientFilteredPosts = useMemo(() => {
        if (user.role === 'designer' && clientFilter !== 'all') {
            return posts.filter(post => post.clientId === clientFilter);
        }
        return posts;
    }, [posts, clientFilter, user.role]);

    const activePosts = useMemo(() => clientFilteredPosts.filter(p => p.status !== 'Archived'), [clientFilteredPosts]);
    const archivedPosts = useMemo(() => clientFilteredPosts.filter(p => p.status === 'Archived'), [clientFilteredPosts]);
    
    const columns = useMemo(() => {
        const allActive = activePosts;
        return {
            'Post Ideas': allActive.filter(p => p.status === 'Post Idea'),
            'Scheduled': allActive.filter(p => p.status === 'Scheduled'),
            'Pending Review': allActive.filter(p => p.status === 'Pending Review'),
            'Revisions Requested': allActive.filter(p => p.status === 'Revisions Requested'),
            'Approved': allActive.filter(p => p.status === 'Approved'),
        };
    }, [activePosts]);

    const viewPosts = useMemo(() => {
        switch(viewMode) {
            case 'overview': return activePosts;
            case 'pending': return columns['Pending Review'];
            case 'revision': return columns['Revisions Requested'];
            case 'approved': return columns['Approved'];
            case 'archived': return archivedPosts;
            default: return [];
        }
    }, [viewMode, activePosts, archivedPosts, columns]);

    const statusTitles = {
        overview: 'Overview',
        pending: 'Pending Review',
        revision: 'Revisions Requested',
        approved: 'Approved',
        archived: 'Archived Posts'
    };

    const renderContent = () => {
        if (viewMode === 'calendar') {
            return <CalendarView posts={clientFilteredPosts} onSelectEvent={handleOpenReview} onSelectSlot={handleSelectSlot} userRole={user.role} />;
        }

        if (subViewMode === 'list') {
            return <ListView posts={viewPosts} user={user} onReview={handleOpenReview} clients={clients} />;
        }
        
        // Bucket View Logic
        if (viewMode === 'overview') {
            return (
                <div className="grid gap-6 flex-1 min-h-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
                    {Object.entries(columns).map(([status, postsInColumn]) => (
                        <div key={status} className="bg-gray-100 rounded-xl flex flex-col">
                            <h2 className="text-lg font-bold text-gray-800 p-4 pb-2 flex-shrink-0 flex items-center">{status} <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-semibold px-2 py-1 rounded-full">{postsInColumn.length}</span></h2>
                            <div className="overflow-y-auto p-4 pt-0">
                                <div className="space-y-4">
                                    {postsInColumn.length > 0 ? (postsInColumn.map(post => (<PostCard key={post.id} post={post} user={user} onReview={handleOpenReview} onApprove={handleApprovePost} onRevise={handleRequestRevision} onArchive={handleArchivePost} onDelete={setPostToDelete}/>))) : (<div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">No posts in this stage.</div>)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {viewPosts.length > 0 ? (viewPosts.map(post => (<PostCard key={post.id} post={post} user={user} onReview={handleOpenReview} onApprove={handleApprovePost} onRevise={handleRequestRevision} onArchive={handleArchivePost} onDelete={setPostToDelete}/>))) : (<div className="col-span-full text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">No posts in this stage.</div>)}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen font-sans flex flex-col">
            <header className="sticky top-0 bg-white/80 backdrop-blur-lg p-4 z-30 border-b border-gray-200">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-gray-800">Core<span className="text-green-600">X</span></h1><span className="text-2xl font-light text-gray-500">Social Hub</span></div>
                    <div className="flex items-center gap-6">
                        <div className="text-right"><div className="font-semibold">{user.name}</div><div className="text-xs text-gray-500 capitalize">{user.role}</div></div>
                        {user.role === 'designer' && (<button onClick={() => { setSelectedDate(null); setIsNewPostModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105"><Plus size={20} className="mr-2" /> New Post</button>)}
                        {user.role === 'client' && (<button onClick={() => setIsClientIdeaModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105"><Lightbulb size={20} className="mr-2" /> Share Idea</button>)}
                        <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-gray-800 transition-colors"><LogOut size={20} /></button>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col min-h-0">
                <div className="max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col flex-1">
                     <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                         <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg flex-wrap">
                            <button onClick={() => setViewMode('overview')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'overview' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}><Columns size={16} className="inline mr-1.5" />Overview</button>
                            <button onClick={() => setViewMode('pending')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'pending' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}>Pending</button>
                            <button onClick={() => setViewMode('revision')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'revision' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}>Revision</button>
                            <button onClick={() => setViewMode('approved')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'approved' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}>Approved</button>
                            <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}><CalendarIcon size={16} className="inline mr-1.5" />Calendar</button>
                            <button onClick={() => setViewMode('archived')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'archived' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}><FolderOpen size={16} className="inline mr-1.5" />Archived</button>
                        </div>
                        <div className="flex items-center gap-4">
                            {user.role === 'designer' && (
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-500" />
                                <select onChange={(e) => setClientFilter(e.target.value)} value={clientFilter} className="bg-white border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-green-500 transition">
                                    <option value="all">All Clients</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            )}
                            {viewMode !== 'calendar' && (
                                <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                                    <button onClick={() => setSubViewMode('bucket')} className={`p-1.5 rounded-md transition-colors ${subViewMode === 'bucket' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}><LayoutGrid size={18} /></button>
                                    <button onClick={() => setSubViewMode('list')} className={`p-1.5 rounded-md transition-colors ${subViewMode === 'list' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:bg-gray-300'}`}><List size={18} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{statusTitles[viewMode]} <span className="ml-2 bg-gray-200 text-gray-600 text-base font-semibold px-3 py-1 rounded-full">{viewPosts.length}</span></h2>
                    </div>
                    {isLoading ? (<div className="text-center py-20 text-gray-500">Loading...</div>) : renderContent()}
                </div>
            </main>
            <Modal isOpen={isNewPostModalOpen} onClose={() => setIsNewPostModalOpen(false)} title="Create New Social Media Post">
                <NewPostForm user={user} clients={clients} onPostCreated={handleCreatePost} onCancel={() => setIsNewPostModalOpen(false)} selectedDate={selectedDate} />
            </Modal>
            <ClientIdeaModal 
                isOpen={isClientIdeaModalOpen} 
                onClose={() => setIsClientIdeaModalOpen(false)} 
                onShare={handleShareIdea}
                setNotification={setNotification}
            />
            {reviewingPost && (<ReviewModal post={reviewingPost} user={user} onClose={() => setReviewingPost(null)} onAddFeedback={handleAddFeedback} onUpdatePost={handleUpdatePost} onDelete={setPostToDelete} onSendToReview={handleSendToReview} />)}
            <ConfirmationModal 
                isOpen={!!postToDelete}
                onClose={() => setPostToDelete(null)}
                onConfirm={handleDeletePost}
                title="Delete Post"
                message="Are you sure you want to permanently delete this post and all its media? This action cannot be undone."
            />
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: 'info' });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ uid: firebaseUser.uid, ...userDoc.data() });
                } else {
                    setNotification({ message: 'User profile not found. Please register again.', type: 'error' });
                    await signOut(auth);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (authLoading) {
        return <div className="bg-gray-50 min-h-screen flex items-center justify-center text-gray-800">Authenticating...</div>;
    }

    return (
        <>
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: 'info' })} />
            {user ? <Portal user={user} setNotification={setNotification} /> : <AuthScreen setNotification={setNotification} />}
        </>
    );
}
