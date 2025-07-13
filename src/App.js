import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, arrayUnion, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CheckCircle, MessageSquare, Plus, Edit, Send, Image as ImageIcon, ThumbsUp, XCircle, Clock, LogOut, Filter, UploadCloud, Save } from 'lucide-react';

// --- Firebase Configuration ---
/* eslint-disable no-undef */
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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
const PostCard = ({ post, user, onReview, onApprove }) => {
    const canTakeAction = user.role === 'client' && (post.status === 'Pending Review' || post.status === 'Revisions Requested');
    const getStatusChip = (status) => {
        switch (status) {
            case 'Pending Review': return <div className="flex items-center text-sm font-medium text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full"><Clock size={14} className="mr-1.5" />{status}</div>;
            case 'Revisions Requested': return <div className="flex items-center text-sm font-medium text-orange-800 bg-orange-100 px-3 py-1 rounded-full"><Edit size={14} className="mr-1.5" />{status}</div>;
            case 'Approved': return <div className="flex items-center text-sm font-medium text-green-800 bg-green-100 px-3 py-1 rounded-full"><CheckCircle size={14} className="mr-1.5" />{status}</div>;
            default: return <div className="text-sm font-medium text-gray-700 bg-gray-200 px-3 py-1 rounded-full">{status}</div>;
        }
    };
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 hover:border-green-500 transition-all duration-300 flex flex-col">
            <div className="relative"><img src={post.imageUrls?.[0] || 'https://placehold.co/600x400/f0f0f0/333333?text=No+Image'} alt="Social media post graphic" className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f0f0f0/333333?text=Image+Error`; }}/><> {post.imageUrls?.length > 1 && (<div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center backdrop-blur-sm"><ImageIcon size={12} className="mr-1.5" /> {post.imageUrls.length}</div>)}</></div>
            <div className="p-4 flex flex-col flex-grow"><div className="flex justify-between items-start mb-2"><span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{post.platform}</span>{getStatusChip(post.status)}</div><p className="text-gray-700 text-sm mb-3 flex-grow line-clamp-3">{post.caption}</p><p className="text-xs text-gray-500 mb-4 break-all line-clamp-2">{post.hashtags}</p><div className="border-t border-gray-200 pt-3 mt-auto"><div className="flex justify-between items-center"><button onClick={() => onReview(post)} className="flex items-center text-sm text-gray-600 hover:text-black transition-colors"><MessageSquare size={16} className="mr-2" /><span>{post.feedback?.length || 0} Comments</span></button>{canTakeAction && (<button onClick={() => onApprove(post.id)} className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"><ThumbsUp size={16} className="mr-2" />Approve</button>)}</div></div></div>
        </div>
    );
};

const NewPostForm = ({ user, clients, onPostCreated, onCancel }) => {
    const [platform, setPlatform] = useState('Instagram');
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { if (clients.length > 0) { setSelectedClientId(clients[0].id); } }, [clients]);

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
        if (!caption || imageFiles.length === 0 || !selectedClientId) { alert("Please fill all fields and upload at least one image."); return; }
        setIsUploading(true);
        try {
            const uploadedImageUrls = await uploadImages(imageFiles);
            const newPost = { platform, caption, hashtags, imageUrls: uploadedImageUrls, clientId: selectedClientId, designerId: user.uid, status: 'Pending Review', feedback: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
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
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"><option>Instagram</option><option>Facebook</option><option>LinkedIn</option></select></div>
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

const ReviewModal = ({ post, user, onAddFeedback, onClose, onUpdatePost }) => {
    const [comment, setComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ caption: '', hashtags: '', imageUrls: [] });
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (post) {
            setEditData({ caption: post.caption, hashtags: post.hashtags, imageUrls: post.imageUrls || [] });
            setImagePreviews(post.imageUrls || []);
            setNewImageFiles([]);
            setCurrentImageIndex(0);
        }
    }, [post, isEditing]);

    const handleFeedbackSubmit = () => { if (!comment.trim()) return; const feedbackData = { authorId: user.uid, authorName: user.name, text: comment, timestamp: new Date().toISOString(), authorRole: user.role }; onAddFeedback(post.id, feedbackData); setComment(''); };
    
    const handleFileChange = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if ((editData.imageUrls.length + newImageFiles.length + files.length) > 5) { alert("You can only have a maximum of 5 images."); return; }
            setNewImageFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index, isExisting) => {
        if (isExisting) {
            setEditData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        } else {
            const newFileIndex = index - editData.imageUrls.length;
            setNewImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const uploadImages = async (files) => {
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
            const newUploadedUrls = await uploadImages(newImageFiles);
            const finalImageUrls = [...editData.imageUrls, ...newUploadedUrls];
            const finalPostData = { caption: editData.caption, hashtags: editData.hashtags, imageUrls: finalImageUrls };
            onUpdatePost(post.id, finalPostData);
            setIsEditing(false);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Update failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % (imagePreviews.length || 1));
    const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + (imagePreviews.length || 1)) % (imagePreviews.length || 1));

    if (!post) return null;

    return (
        <Modal isOpen={!!post} onClose={onClose} title={`${isEditing ? 'Editing' : 'Reviewing'}: ${post?.platform} Post`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Images ({editData.imageUrls.length + newImageFiles.length} / 5)</label>
                                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10"><div className="text-center"><UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" /><div className="mt-4 flex text-sm leading-6 text-gray-600"><label htmlFor="edit-file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-green-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-600 focus-within:ring-offset-2 hover:text-green-500"><span>Upload files</span><input id="edit-file-upload" name="edit-file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p></div></div>
                                {imagePreviews.length > 0 && (<div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">{imagePreviews.map((preview, index) => (<div key={preview} className="relative group"><img src={preview} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-md" /><button type="button" onClick={() => removeImage(index, index < editData.imageUrls.length)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><XCircle size={16} /></button></div>))}</div>)}
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Caption</label><textarea value={editData.caption} onChange={e => setEditData({...editData, caption: e.target.value})} rows="6" className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition"></textarea></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label><input type="text" value={editData.hashtags} onChange={e => setEditData({...editData, hashtags: e.target.value})} className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition" /></div>
                            <div className="flex justify-end gap-4 pt-4"><button onClick={() => setIsEditing(false)} className="py-2 px-5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors">Cancel</button><button onClick={handleSaveChanges} disabled={isUploading} className="py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center disabled:bg-gray-400">{isUploading ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Changes</>}</button></div>
                        </>
                    ) : (
                        <>
                            <div className="relative"><img src={post.imageUrls?.[currentImageIndex] || 'https://placehold.co/600x400/f0f0f0/333333?text=No+Image'} alt="Social media post" className="rounded-lg w-full h-80 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/f0f0f0/333333?text=Image+Error`; }}/><> {post.imageUrls?.length > 1 && (<><button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">‹</button><button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">›</button><div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{currentImageIndex + 1} / {post.imageUrls.length}</div></>)}</></div>
                            <div><h4 className="font-bold text-lg text-gray-800 mb-1">Caption</h4><p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{post?.caption}</p></div>
                            <div><h4 className="font-bold text-lg text-gray-800 mb-1">Hashtags</h4><p className="text-gray-500 bg-gray-50 p-3 rounded-lg break-all">{post?.hashtags}</p></div>
                        </>
                    )}
                </div>
                <div className="flex flex-col h-full"><div className="flex justify-between items-center mb-3"><h4 className="font-bold text-lg text-gray-800">Feedback & Revisions</h4>{user.role === 'designer' && (post.status === 'Revisions Requested' || post.status === 'Pending Review') && !isEditing && (<button onClick={() => setIsEditing(true)} className="flex items-center text-sm bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg transition-colors"><Edit size={16} className="mr-2" /> Edit Post</button>)}</div><div className="flex-grow bg-gray-50 rounded-lg p-4 space-y-4 overflow-y-auto mb-4 min-h-[200px] max-h-[40vh]">{post?.feedback?.length > 0 ? (post.feedback.map((fb, index) => (<div key={index} className={`flex flex-col ${fb.authorRole === 'client' ? 'items-start' : 'items-end'}`}><div className={`p-3 rounded-lg max-w-[80%] ${fb.authorRole === 'client' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}><p className="text-sm whitespace-pre-wrap">{fb.text}</p></div><span className="text-xs text-gray-500 mt-1">{fb.authorName}</span></div>))) : (<div className="text-center text-gray-500 pt-8">No feedback yet.</div>)}</div>{post?.status !== 'Approved' && !isEditing && (<div className="mt-auto flex items-center gap-2"><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="w-full bg-gray-100 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 transition text-gray-800" rows="2" onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFeedbackSubmit(); } }} /><button onClick={handleFeedbackSubmit} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!comment.trim()}><Send size={20} /></button></div>)}</div>
            </div>
        </Modal>
    );
};

const Portal = ({ user, setNotification }) => {
    const [posts, setPosts] = useState([]);
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
    const [reviewingPost, setReviewingPost] = useState(null);
    const [clientFilter, setClientFilter] = useState('all');

    useEffect(() => {
        setIsLoading(true);
        const postsCollection = collection(db, `artifacts/${appId}/public/data/social_media_posts`);
        const q = user.role === 'designer' ? postsCollection : query(postsCollection, where("clientId", "==", user.uid));
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

    const handleCreatePost = async (newPostData) => { try { await addDoc(collection(db, `artifacts/${appId}/public/data/social_media_posts`), newPostData); setIsNewPostModalOpen(false); setNotification({ message: 'Post created!', type: 'success' }); } catch (e) { setNotification({ message: 'Failed to create post.', type: 'error' }); } };
    const handleUpdatePost = async (postId, updatedData) => { try { await updateDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId), { ...updatedData, status: 'Pending Review', updatedAt: serverTimestamp() }); setNotification({ message: 'Post updated!', type: 'success' }); } catch (e) { setNotification({ message: 'Failed to update post.', type: 'error' }); } };
    const handleApprovePost = async (postId) => { try { await updateDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId), { status: 'Approved', updatedAt: serverTimestamp() }); setNotification({ message: 'Post approved!', type: 'success' }); } catch (e) { setNotification({ message: 'Failed to approve post.', type: 'error' }); } };
    const handleAddFeedback = async (postId, feedbackData) => { try { const updatePayload = { feedback: arrayUnion(feedbackData), updatedAt: serverTimestamp() }; if (user.role === 'client') { updatePayload.status = 'Revisions Requested'; } await updateDoc(doc(db, `artifacts/${appId}/public/data/social_media_posts`, postId), updatePayload); setNotification({ message: 'Comment posted.', type: 'info' }); } catch (e) { setNotification({ message: 'Failed to add feedback.', type: 'error' }); } };
    const handleSignOut = async () => { try { await signOut(auth); setNotification({ message: 'Signed out.', type: 'info' }); } catch (error) { setNotification({ message: 'Failed to sign out.', type: 'error' }); } };

    const filteredPosts = useMemo(() => {
        if (user.role === 'designer' && clientFilter !== 'all') {
            return posts.filter(post => post.clientId === clientFilter);
        }
        return posts;
    }, [posts, clientFilter, user.role]);

    const columns = useMemo(() => ({
        'Pending Review': filteredPosts.filter(p => p.status === 'Pending Review'),
        'Revisions Requested': filteredPosts.filter(p => p.status === 'Revisions Requested'),
        'Approved': filteredPosts.filter(p => p.status === 'Approved'),
    }), [filteredPosts]);

    return (
        <div className="bg-gray-50 text-gray-800 h-screen font-sans flex flex-col">
            <header className="bg-white/80 backdrop-blur-lg p-4 sticky top-0 z-30 border-b border-gray-200 flex-shrink-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-gray-800">CoreX</h1><span className="text-2xl font-light text-gray-500">Social Hub</span></div>
                    <div className="flex items-center gap-6">
                        <div className="text-right"><div className="font-semibold">{user.name}</div><div className="text-xs text-gray-500 capitalize">{user.role}</div></div>
                        {user.role === 'designer' && (<button onClick={() => setIsNewPostModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105"><Plus size={20} className="mr-2" /> New Post</button>)}
                        <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-gray-800 transition-colors"><LogOut size={20} /></button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1 flex flex-col min-h-0">
                {user.role === 'designer' && (
                    <div className="mb-6 flex justify-end flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-gray-500" />
                            <select onChange={(e) => setClientFilter(e.target.value)} value={clientFilter} className="bg-white border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-green-500 transition">
                                <option value="all">All Clients</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                {isLoading ? (<div className="text-center py-20 text-gray-500">Loading posts...</div>) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        {Object.entries(columns).map(([status, postsInColumn]) => (
                            <div key={status} className="bg-gray-100 rounded-xl p-4 flex flex-col min-h-0">
                                <h2 className="text-lg font-bold text-gray-800 mb-4 px-2 flex items-center flex-shrink-0">{status} <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center">{postsInColumn.length}</span></h2>
                                <div className="space-y-4 overflow-y-auto flex-1 p-1">
                                    {postsInColumn.length > 0 ? (postsInColumn.map(post => (<PostCard key={post.id} post={post} user={user} onReview={setReviewingPost} onApprove={handleApprovePost}/>))) : (<div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">No posts in this stage.</div>)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Modal isOpen={isNewPostModalOpen} onClose={() => setIsNewPostModalOpen(false)} title="Create New Social Media Post">
                <NewPostForm user={user} clients={clients} onPostCreated={handleCreatePost} onCancel={() => setIsNewPostModalOpen(false)} />
            </Modal>
            {reviewingPost && (<ReviewModal post={reviewingPost} user={user} onClose={() => setReviewingPost(null)} onAddFeedback={handleAddFeedback} onUpdatePost={handleUpdatePost} />)}
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
