import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, arrayUnion, setDoc, getDoc, getDocs, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CheckCircle, MessageSquare, Plus, Edit, Send, Image as ImageIcon, ThumbsUp, XCircle, Clock, LogOut, Filter, UploadCloud, Save } from 'lucide-react';

// --- Firebase Configuration ---
/* eslint-disable no-undef */
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyDakANta9S4ABmkry8hIzgaRusvWgShz9E",
    authDomain: "social-hub-d1682.firebaseapp.com",
    projectId: "social-hub-d1682",
    storageBucket: "social-hub-d1682.firebasestorage.app",
    messagingSenderId: "629544933010",
    appId: "1:629544933010:web:54d6b73ca31dd5dcbcb84b"
};
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
                <div className="text-center mb-8"><h1 className="text-4xl font-bold text-gray-800">CoreX Social Hub</h1><p className="text-gray-500 mt-2">{isLogin ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}</p></div>
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
const PostCard = ({ post, user, onReview, onApprove, onRevise }) => {
    const canApprove = user.role === 'client' && (post.status === 'Pending Review' || post.status === 'Revisions Requested');
    const canRevise = user.role === 'client' && post.status === 'Pending Review' && (post.revisionCount || 0) < 2;

    const hasUnreadComments = useMemo(() => {
        if (!post.feedback || post.feedback.length === 0) return false;
        const lastCommenterId = post.feedback[post.feedback.length - 1].authorId;
        const seenBy = post.seenBy || [];
        return lastCommenterId !== user.uid && !seenBy.includes(user.uid);
    }, [post.feedback, post.seenBy, user.uid]);

    const getStatusChip = (status) => {
        switch (status) {
            case 'Pending Review': return <div className="flex items-center text-sm font-medium text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full"><Clock size={14} className="mr-1.5" />{status}</div>;
            case 'Revisions Requested': return <div className="flex items-center text-sm font-medium text-orange-800 bg-orange-100 px-3 py-1 rounded-full"><Edit size={14} className="mr-1.5" />{status}</div>;
            case 'Approved': return <div className="flex items-center text-sm font-medium text-green-800 bg-green-100 px-3 py-1 rounded-full"><CheckCircle size={14} className="mr-1.5" />{status}</div>;
            default: return <div className="text-sm font-medium text-gray-700 bg-gray-200 px-3 py-1 rounded-full">{status}</div>;
        }
    };

    const revisionCountText = (count) => {
        if (!count || count === 0) return null;
        const suffix = count === 1 ? 'st' : count === 2 ? 'nd' : count === 3 ? 'rd' : 'th';
        return `${count}${suffix} Revision`;
    };

    return (
        <div onClick={() => onReview(post)} className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:border-green-500 transition-all duration-300 flex flex-col cursor-pointer">
            <div className="relative"><img src={post.imageUrls?.[0] || 'https://placehold.co/600x400/f0f0f0/333333?text=No+Image'} alt="Social media post graphic" className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f0f0f0/333333?text=Image+Error`; }}/><> {post.imageUrls?.length > 1 && (<div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center backdrop-blur-sm"><ImageIcon size={12} className="mr-1.5" /> {post.imageUrls.length}</div>)}</></div>
            <div className="p-4 flex flex-col flex-grow"><div className="flex justify-between items-start mb-2"><div className="text-xs font-semibold text-green-600 uppercase tracking-wider flex flex-wrap gap-x-2">{post.platforms?.join(', ')}</div>{getStatusChip(post.status)}</div><p className="text-gray-700 text-sm mb-3 flex-grow line-clamp-3">{post.caption}</p><p className="text-xs text-gray-500 mb-4 break-all line-clamp-2">{post.hashtags}</p><div className="border-t border-gray-200 pt-3 mt-auto"><div className="flex justify-between items-center"><div className="flex items-center text-sm text-gray-600 hover:text-black transition-colors"><MessageSquare size={16} className="mr-2" /><span>{post.feedback?.length || 0} Comments</span>{hasUnreadComments && <div className="ml-2 w-2 h-2 bg-red-500 rounded-full"></div>}</div><div className="flex items-center gap-2">{canRevise && (<button onClick={(e) => {e.stopPropagation(); onRevise(post.id);}} className="flex items-center text-sm bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-3 rounded-lg transition-colors"><Edit size={16} className="mr-2" />Revise</button>)}{canApprove && (<button onClick={(e) => {e.stopPropagation(); onApprove(post.id);}} className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-colors"><ThumbsUp size={16} className="mr-2" />Approve</button>)}</div></div>{post.revisionCount > 0 && <div className="text-xs text-orange-600 font-semibold mt-2">{revisionCountText(post.revisionCount)}</div>}</div></div>
        </div>
    );
};

const platformOptions = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok'];
const NewPostForm = ({ user, clients, onPostCreated, onCancel }) => {
    const [platforms, setPlatforms] = useState([]);
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { if (clients.length > 0) { setSelectedClientId(clients[0].id); } }, [clients]);

    const handlePlatformChange = (platform) => {
        setPlatforms(prev => prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if ((imageFiles.length + files.length) > 5) { alert("You can only upload a maximum of 5 images."); return; }
            setImageFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadImages = async (files) => {
        const imageUrls = [];
        for (const file of files) {
            const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            imageUrls.push(downloadURL);
        }
        return imageUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caption || imageFiles.length === 0 || !selectedClientId || platforms.length === 0) { alert("Please fill all fields, select at least one platform, and upload at least one image."); return; }
        setIsUploading(true);
        try {
            const uploadedImageUrls = await uploadImages(imageFiles);
            const newPost = { platforms, caption, hashtags, imageUrls: uploadedImageUrls, clientId: selectedClientId, designerId: user.uid, status: 'Pending Review', feedback: [], revisionCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), seenBy: [user.uid] };
            onPostCreated(newPost);
        } catch (error) {
            console.error("Image upload failed:", error);
            alert("Image upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Assign to Client</label><select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"><option value="" disabled>Select a client...</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">{platformOptions.map(p => (<label key={p} className="flex items-center space-x-2"><input type="checkbox" checked={platforms.includes(p)} onChange={() => handlePlatformChange(p)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" /><span>{p}</span></label>))}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Caption</label><textarea value={caption} onChange={e => setCaption(e.target.value)} rows="4" placeholder="Write a compelling caption..." className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"></textarea></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label><input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#realestate #newlisting #dreamhome" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition" /></div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images (up to 5)</label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500">
                                <span>Upload files</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
                {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                                <img src={preview} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-md" />
                                <button type="button" onClick={() => removeImage(index)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">Cancel</button><button type="submit" disabled={isUploading} className="py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center disabled:bg-gray-400">{isUploading ? 'Uploading...' : <><Plus size={18} className="mr-2" /> Create Post</>}</button></div>
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
    const diffDays = M