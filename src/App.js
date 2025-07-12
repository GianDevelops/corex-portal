import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, onSnapshot, query, where, serverTimestamp, arrayUnion, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { CheckCircle, MessageSquare, Plus, Edit, Send, Image as ImageIcon, ThumbsUp, XCircle, Clock, Trash2, Save, LogOut, Filter } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 flex justify-between items-center"><h3 className="text-2xl font-bold text-white">{title}</h3><button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><XCircle size={28} /></button></div>
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
                if (!name) {
                    setNotification({ message: 'Please enter your name.', type: 'error' });
                    setIsLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    name: name,
                    email: email,
                    role: role
                });
            }
        } catch (error) {
            setNotification({ message: error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white">CoreX Social Hub</h1>
                    <p className="text-slate-400 mt-2">{isLogin ? 'Welcome back! Please sign in.' : 'Create your account to get started.'}</p>
                </div>
                <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                    <form onSubmit={handleAuthAction} className="space-y-6">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 transition" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
                                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 transition">
                                        <option value="client">Client</option>
                                        <option value="designer">Designer</option>
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 transition" />
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>
                    <div className="text-center mt-6">
                        <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
                            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
                        </button>
                    </div>
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
            case 'Pending Review': return <div className="flex items-center text-sm font-medium text-yellow-300 bg-yellow-900/50 px-3 py-1 rounded-full"><Clock size={14} className="mr-1.5" />{status}</div>;
            case 'Revisions Requested': return <div className="flex items-center text-sm font-medium text-orange-300 bg-orange-900/50 px-3 py-1 rounded-full"><Edit size={14} className="mr-1.5" />{status}</div>;
            case 'Approved': return <div className="flex items-center text-sm font-medium text-green-300 bg-green-900/50 px-3 py-1 rounded-full"><CheckCircle size={14} className="mr-1.5" />{status}</div>;
            default: return <div className="text-sm font-medium text-slate-300 bg-slate-700 px-3 py-1 rounded-full">{status}</div>;
        }
    };
    return (
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-indigo-500 transition-all duration-300 flex flex-col">
            <div className="relative">
                <img src={post.imageUrls?.[0] || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt="Social media post graphic" className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/1e293b/ffffff?text=Image+Error`; }}/>
                {post.imageUrls?.length > 1 && (<div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center backdrop-blur-sm"><ImageIcon size={12} className="mr-1.5" /> {post.imageUrls.length}</div>)}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2"><span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">{post.platform}</span>{getStatusChip(post.status)}</div>
                <p className="text-slate-300 text-sm mb-3 flex-grow line-clamp-3">{post.caption}</p>
                <p className="text-xs text-slate-400 mb-4 break-all line-clamp-2">{post.hashtags}</p>
                <div className="border-t border-slate-700 pt-3 mt-auto">
                    <div className="flex justify-between items-center">
                        <button onClick={() => onReview(post)} className="flex items-center text-sm text-slate-300 hover:text-white transition-colors"><MessageSquare size={16} className="mr-2" /><span>{post.feedback?.length || 0} Comments</span></button>
                        {canTakeAction && (<button onClick={() => onApprove(post.id)} className="flex items-center text-sm bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"><ThumbsUp size={16} className="mr-2" />Approve</button>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const NewPostForm = ({ user, clients, onPostCreated, onCancel }) => {
    const [platform, setPlatform] = useState('Instagram');
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [imageUrls, setImageUrls] = useState(['']);
    const [selectedClientId, setSelectedClientId] = useState('');

    useEffect(() => { if (clients.length > 0) { setSelectedClientId(clients[0].id); } }, [clients]);
    const handleImageUrlChange = (index, value) => { const newUrls = [...imageUrls]; newUrls[index] = value; setImageUrls(newUrls); };
    const addImageUrlInput = () => { if (imageUrls.length < 5) { setImageUrls([...imageUrls, '']); } };
    const removeImageUrlInput = (index) => { const newUrls = imageUrls.filter((_, i) => i !== index); setImageUrls(newUrls); };
    const handleSubmit = (e) => {
        e.preventDefault();
        const finalImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');
        if (!caption || finalImageUrls.length === 0 || !selectedClientId) { alert("Please fill all fields and select a client."); return; }
        const newPost = { platform, caption, hashtags, imageUrls: finalImageUrls, clientId: selectedClientId, designerId: user.uid, status: 'Pending Review', feedback: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        onPostCreated(newPost);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 text-slate-300">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Assign to Client</label><select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition"><option value="" disabled>Select a client...</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Platform</label><select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition"><option>Instagram</option><option>Facebook</option><option>LinkedIn</option></select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Caption</label><textarea value={caption} onChange={e => setCaption(e.target.value)} rows="4" placeholder="Write a compelling caption..." className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition"></textarea></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Hashtags</label><input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#realestate #newlisting #dreamhome" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Image URLs (up to 5)</label><div className="space-y-2">{imageUrls.map((url, index) => (<div key={index} className="flex items-center gap-2"><input type="text" value={url} onChange={e => handleImageUrlChange(index, e.target.value)} placeholder="https://example.com/image.png" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition" /><button type="button" onClick={() => removeImageUrlInput(index)} className="p-3 bg-red-800/50 hover:bg-red-700/50 text-red-300 rounded-lg transition-colors"><Trash2 size={16} /></button></div>))}</div>{imageUrls.length < 5 && (<button type="button" onClick={addImageUrlInput} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold">+ Add another image</button>)}</div>
            <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold transition-colors">Cancel</button><button type="submit" className="py-2 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center"><Plus size={18} className="mr-2" /> Create Post</button></div>
        </form>
    );
};

const ReviewModal = ({ post, user, onAddFeedback, onClose, onUpdatePost }) => {
    const [comment, setComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const feedbackContainerRef = React.useRef(null);

    useEffect(() => { if (post) { setEditData({ caption: post.caption, hashtags: post.hashtags, imageUrls: post.imageUrls || [''] }); setCurrentImageIndex(0); } }, [post]);
    useEffect(() => { if (feedbackContainerRef.current) { feedbackContainerRef.current.scrollTop = feedbackContainerRef.current.scrollHeight; } }, [post?.feedback]);

    const handleFeedbackSubmit = () => { if (!comment.trim()) return; const feedbackData = { authorId: user.uid, authorName: user.name, text: comment, timestamp: new Date().toISOString(), authorRole: user.role }; onAddFeedback(post.id, feedbackData); setComment(''); };
    const handleSaveChanges = () => { const finalImageUrls = editData.imageUrls.map(url => url.trim()).filter(url => url !== ''); if (!editData.caption || finalImageUrls.length === 0) { alert("Please provide a caption and at least one image URL."); return; } onUpdatePost(post.id, { ...editData, imageUrls: finalImageUrls }); setIsEditing(false); };
    const handleEditFieldChange = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));
    const handleEditImageUrlChange = (index, value) => { const newUrls = [...editData.imageUrls]; newUrls[index] = value; setEditData(prev => ({ ...prev, imageUrls: newUrls })); };
    const addEditImageUrlInput = () => { if (editData.imageUrls.length < 5) { setEditData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] })); } };
    const removeEditImageUrlInput = (index) => { const newUrls = editData.imageUrls.filter((_, i) => i !== index); setEditData(prev => ({ ...prev, imageUrls: newUrls })); };
    const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % (post?.imageUrls?.length || 1));
    const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + (post?.imageUrls?.length || 1)) % (post?.imageUrls?.length || 1));

    if (!post || !editData) return null;

    return (
        <Modal isOpen={!!post} onClose={onClose} title={`${isEditing ? 'Editing' : 'Reviewing'}: ${post?.platform} Post`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Image URLs (up to 5)</label><div className="space-y-2">{editData.imageUrls.map((url, index) => (<div key={index} className="flex items-center gap-2"><input type="text" value={url} onChange={e => handleEditImageUrlChange(index, e.target.value)} placeholder="https://example.com/image.png" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition" /><button type="button" onClick={() => removeEditImageUrlInput(index)} className="p-3 bg-red-800/50 hover:bg-red-700/50 text-red-300 rounded-lg transition-colors"><Trash2 size={16} /></button></div>))}</div>{editData.imageUrls.length < 5 && <button type="button" onClick={addEditImageUrlInput} className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold">+ Add another image</button>}</div>
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Caption</label><textarea value={editData.caption} onChange={e => handleEditFieldChange('caption', e.target.value)} rows="6" className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition"></textarea></div>
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Hashtags</label><input type="text" value={editData.hashtags} onChange={e => handleEditFieldChange('hashtags', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition" /></div>
                            <div className="flex justify-end gap-4 pt-4"><button onClick={() => setIsEditing(false)} className="py-2 px-5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold transition-colors">Cancel</button><button onClick={handleSaveChanges} className="py-2 px-5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center"><Save size={18} className="mr-2" /> Save Changes</button></div>
                        </>
                    ) : (
                        <>
                            <div className="relative"><img src={post.imageUrls?.[currentImageIndex] || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt="Social media post" className="rounded-lg w-full h-80 object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x400/1e293b/ffffff?text=Image+Error`; }}/><> {post.imageUrls?.length > 1 && (<><button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">‹</button><button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors">›</button><div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{currentImageIndex + 1} / {post.imageUrls.length}</div></>)}</></div>
                            <div><h4 className="font-bold text-lg text-white mb-1">Caption</h4><p className="text-slate-300 bg-slate-900/50 p-3 rounded-lg whitespace-pre-wrap">{post?.caption}</p></div>
                            <div><h4 className="font-bold text-lg text-white mb-1">Hashtags</h4><p className="text-slate-400 bg-slate-900/50 p-3 rounded-lg break-all">{post?.hashtags}</p></div>
                        </>
                    )}
                </div>
                <div className="flex flex-col h-full"><div className="flex justify-between items-center mb-3"><h4 className="font-bold text-lg text-white">Feedback & Revisions</h4>{user.role === 'designer' && (post.status === 'Revisions Requested' || post.status === 'Pending Review') && !isEditing && (<button onClick={() => setIsEditing(true)} className="flex items-center text-sm bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"><Edit size={16} className="mr-2" /> Edit Post</button>)}</div><div ref={feedbackContainerRef} className="flex-grow bg-slate-900/50 rounded-lg p-4 space-y-4 overflow-y-auto mb-4 min-h-[200px] max-h-[40vh]">{post?.feedback?.length > 0 ? (post.feedback.map((fb, index) => (<div key={index} className={`flex flex-col ${fb.authorRole === 'client' ? 'items-start' : 'items-end'}`}><div className={`p-3 rounded-lg max-w-[80%] ${fb.authorRole === 'client' ? 'bg-sky-800' : 'bg-slate-700'}`}><p className="text-white text-sm whitespace-pre-wrap">{fb.text}</p></div><span className="text-xs text-slate-400 mt-1">{fb.authorName}</span></div>))) : (<div className="text-center text-slate-400 pt-8">No feedback yet.</div>)}</div>{post?.status !== 'Approved' && !isEditing && (<div className="mt-auto flex items-center gap-2"><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 transition text-white" rows="2" onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFeedbackSubmit(); } }} /><button onClick={handleFeedbackSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={!comment.trim()}><Send size={20} /></button></div>)}</div>
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
        <div className="bg-slate-900 text-white min-h-screen font-sans flex flex-col">
            <header className="bg-slate-900/70 backdrop-blur-lg p-4 sticky top-0 z-30 border-b border-slate-700">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3"><h1 className="text-2xl font-bold text-white">CoreX</h1><span className="text-2xl font-light text-slate-400">Social Hub</span></div>
                    <div className="flex items-center gap-6">
                        <div className="text-right"><div className="font-semibold">{user.name}</div><div className="text-xs text-slate-400 capitalize">{user.role}</div></div>
                        {user.role === 'designer' && (<button onClick={() => setIsNewPostModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300 transform hover:scale-105"><Plus size={20} className="mr-2" /> New Post</button>)}
                        <button onClick={handleSignOut} className="p-2 text-slate-400 hover:text-white transition-colors"><LogOut size={20} /></button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-grow flex flex-col">
                {user.role === 'designer' && (
                    <div className="mb-6 flex justify-end">
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-slate-400" />
                            <select onChange={(e) => setClientFilter(e.target.value)} value={clientFilter} className="bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 transition">
                                <option value="all">All Clients</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                {isLoading ? (<div className="text-center py-20 text-slate-400">Loading posts...</div>) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                        {Object.entries(columns).map(([status, postsInColumn]) => (
                            <div key={status} className="bg-slate-800/50 rounded-xl p-4 flex flex-col h-full">
                                <h2 className="text-lg font-bold text-white mb-4 px-2 flex items-center flex-shrink-0">{status} <span className="ml-2 bg-slate-700 text-slate-300 text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center">{postsInColumn.length}</span></h2>
                                <div className="space-y-4 overflow-y-auto flex-grow">
                                    {postsInColumn.length > 0 ? (postsInColumn.map(post => (<PostCard key={post.id} post={post} user={user} onReview={setReviewingPost} onApprove={handleApprovePost}/>))) : (<div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">No posts in this stage.</div>)}
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
        return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">Authenticating...</div>;
    }

    return (
        <>
            <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification({ message: '', type: 'info' })} />
            {user ? <Portal user={user} setNotification={setNotification} /> : <AuthScreen setNotification={setNotification} />}
        </>
    );
}
