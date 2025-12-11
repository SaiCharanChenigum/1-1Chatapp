import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import type { Message, User } from '../types';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Chat() {
    const { user, logout } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string>('');
    const [partnerName, setPartnerName] = useState<string>('');
    const [users, setUsers] = useState<User[]>([]);
    const [activeChat, setActiveChat] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Fetch users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get('/api/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Failed to fetch users");
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            path: '/socket.io',
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join', user?.id);
        });

        newSocket.on('message:new', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('typing', ({ fromUserId, isTyping }) => {
            if (isTyping) {
                setTypingUser(fromUserId);
            } else {
                setTypingUser(null);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUser]);

    useEffect(() => {
        if (partnerId) {
            axios.get(`/api/messages?withUserId=${partnerId}`).then(res => {
                setMessages(res.data);
            }).catch(console.error);
        }
    }, [partnerId]);


    const startChat = (targetUser: User) => {
        setPartnerId(targetUser.id);
        setPartnerName(targetUser.username);
        setActiveChat(true);
    };

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && !uploading) || !partnerId || !socket) return;

        const text = inputText;
        setInputText('');

        socket.emit('message:send', { toUserId: partnerId, text });
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (!socket || !partnerId) return;

        socket.emit('typing', { toUserId: partnerId, isTyping: true });

        setTimeout(() => {
            socket.emit('typing', { toUserId: partnerId, isTyping: false });
        }, 1000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !partnerId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const { data } = await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            socket?.emit('message:send', { toUserId: partnerId, imageUrl: data.imageUrl });
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!activeChat) {
        return (
            <div className="flex flex-col items-center justify-center h-[100dvh] bg-gray-900 text-white p-4">
                <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 text-center">Start a Chat</h2>
                    <p className="mb-4 text-gray-400 text-center">Select a user to chat with:</p>

                    <div className="space-y-3">
                        {users.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No other users found. Create another account in a new incognito window!</p>
                        ) : (
                            users.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => startChat(u)}
                                    className="w-full text-left p-4 rounded bg-gray-700 hover:bg-gray-600 transition-colors flex items-center justify-between"
                                >
                                    <span className="font-semibold">{u.username}</span>
                                    <span className="text-xs text-green-400">Tap to chat</span>
                                </button>
                            ))
                        )}
                    </div>

                    <button onClick={logout} className="mt-8 w-full py-2 text-sm text-gray-500 hover:text-white border border-gray-700 rounded transition-colors">Logout</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-900 text-white">
            {/* Header */}
            <header className="p-4 bg-gray-800 shadow flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveChat(false)} className="text-gray-400 hover:text-white">
                        &larr; Back
                    </button>
                    <h1 className="font-bold text-lg">{partnerName}</h1>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => {
                    const isMe = msg.fromUserId === user?.id;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] p-3 rounded-2xl ${isMe
                                    ? 'bg-blue-600 rounded-tr-sm'
                                    : 'bg-gray-700 rounded-tl-sm'
                                    }`}
                            >
                                {msg.imageUrl && (
                                    <img src={msg.imageUrl} alt="Shared" className="rounded-lg mb-2 max-h-60 object-cover" />
                                )}
                                {msg.text && <p className="text-sm md:text-base">{msg.text}</p>}
                                <div className="text-[10px] text-gray-300 mt-1 flex justify-end">
                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {typingUser && <div className="text-xs text-gray-500 italic px-4">Partner is typing...</div>}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-800">
                <form onSubmit={sendMessage} className="flex gap-2 items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        disabled={uploading}
                    >
                        {uploading ? <Loader2 className="animate-spin w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                    </button>

                    <input
                        type="text"
                        value={inputText}
                        onChange={handleTyping}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
