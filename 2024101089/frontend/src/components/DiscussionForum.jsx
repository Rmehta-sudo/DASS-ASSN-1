import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL, SOCKET_URL } from '../apiConfig';

const socket = io.connect(SOCKET_URL);

const DiscussionForum = ({ eventId, user, isOrganizer }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [replyTo, setReplyTo] = useState(null); // Message object being replied to
    const messagesEndRef = useRef(null);

    const room = `event_${eventId}`;

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${API_URL}/chat/event/${eventId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(data);
            } catch (err) {
                console.error("Error fetching chat history", err);
            }
        };
        fetchHistory();

        socket.emit("join_room", room);

        socket.on("receive_message", (data) => {
            setMessages((prev) => {
                // Prevent duplicates if optimistic UI was used (not used here yet)
                if (prev.some(m => m._id === data._id)) return prev;
                return [...prev, data];
            });
        });

        socket.on("message_updated", (updatedMsg) => {
            setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        });

        socket.on("message_deleted", (deletedId) => {
            setMessages((prev) => prev.filter(m => m._id !== deletedId));
        });

        return () => {
            socket.off("receive_message");
            socket.off("message_updated");
            socket.off("message_deleted");
        };
    }, [eventId, room]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        const messageData = {
            room,
            content: newMessage,
            senderId: user._id,
            type: 'event',
            objectId: eventId,
            parentMessage: replyTo ? replyTo._id : null
        };

        // We emit 'send_message' which triggers backend save + broadcast
        await socket.emit("send_message", messageData);

        setNewMessage("");
        setReplyTo(null);
    };

    const handlePin = async (msgId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/chat/message/${msgId}/pin`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/chat/message/${msgId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleReact = async (msgId, reaction) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/chat/message/${msgId}/react`, { reaction }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
        }
    };

    // Grouping for Threading (One level)
    // We filter out replies from main list, and render them under their parents
    // But backend returns flat list. 
    // Simplified approach: Render flat list but indented if it has a parent.
    // Better approach: Reconstruct tree.

    // For this assignment, let's keep it simple: Render flat, but if parentMessage exists, show "Replying to X"
    // OR: Sort by createdAt, messages with parentMessage are displayed, but maybe we can link them?
    // Let's stick to simple flat list for now to minimize complexity, but visualize the reply.

    const renderMessage = (msg) => {
        const isMe = msg.sender._id === user._id || msg.sender === user._id; // Handle populated vs raw ID
        const senderName = msg.sender.firstName ? `${msg.sender.firstName} ${msg.sender.lastName}` : "User";

        // Check reactions
        const reactions = msg.reactions || {};
        // Convert Map to object if needed (JSON from backend comes as object for Map)
        const reactionCounts = {};
        Object.values(reactions).forEach(r => {
            reactionCounts[r] = (reactionCounts[r] || 0) + 1;
        });

        return (
            <div key={msg._id} className={`flex flex-col mb-4 ${isMe ? "items-end" : "items-start"} w-full animate-fade-in`}>
                <div className={`relative max-w-[80%] md:max-w-md p-3 rounded-lg shadow-sm
                    ${msg.isPinned ? 'border-2 border-yellow-400 bg-yellow-50' : isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}
                `}>
                    {/* Pinned Indicator */}
                    {msg.isPinned && (
                        <div className="absolute -top-3 -right-2 bg-yellow-400 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                            📌 Pinned
                        </div>
                    )}

                    {/* Reply Context */}
                    {msg.parentMessage && (
                        <div className={`text-xs mb-1 pl-2 border-l-2 ${isMe ? "border-indigo-300 text-indigo-200" : "border-gray-300 text-gray-400"}`}>
                            Replying to message...
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-baseline gap-4 mb-1">
                        {!isMe && <span className="text-xs font-bold opacity-75">{senderName}</span>}
                        <span className={`text-[10px] ${isMe ? "text-indigo-200" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Content */}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Reactions Display */}
                    {Object.keys(reactionCounts).length > 0 && (
                        <div className="flex bg-white/90 rounded-full px-2 py-1 mt-2 w-fit gap-2 -mb-6 translate-y-4 shadow-sm border border-gray-100 z-10">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <span key={emoji} className="text-xs font-medium">{emoji} {count}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions Bar */}
                <div className={`flex gap-2 mt-1 px-1 text-gray-400 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <button onClick={() => setReplyTo(msg)} className="hover:text-indigo-600 text-xs transition-colors">Reply</button>

                    {/* Reactions */}
                    <div className="flex gap-1">
                        <button onClick={() => handleReact(msg._id, '❤️')} className="hover:scale-125 transition-transform text-xs">❤️</button>
                        <button onClick={() => handleReact(msg._id, '👍')} className="hover:scale-125 transition-transform text-xs">👍</button>
                    </div>

                    {(isOrganizer) && (
                        <button onClick={() => handlePin(msg._id)} className={`hover:text-yellow-600 text-xs ${msg.isPinned ? 'text-yellow-500' : ''}`}>
                            {msg.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                    )}

                    {(isOrganizer || isMe) && (
                        <button onClick={() => handleDelete(msg._id)} className="hover:text-red-600 text-xs">Delete</button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col h-[600px] border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
                <h3 className="font-bold text-lg">Live Discussion</h3>
                <p className="text-xs text-indigo-100 opacity-80">
                    {isOrganizer ? "Moderate questions and announcements" : "Ask questions and interact with others"}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                {/* Pinned Messages Section */}
                {messages.some(m => m.isPinned) && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 shadow-sm sticky top-0 z-20">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            📌 Pinned Messages
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {messages.filter(m => m.isPinned).map(msg => (
                                <div key={msg._id} className="text-sm text-yellow-900 bg-white/50 p-2 rounded-lg border border-yellow-100">
                                    <span className="font-semibold mr-1">{msg.sender.firstName}:</span>
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {messages.length === 0 && (
                    <div className="text-center text-gray-400 mt-20">
                        <p>No messages yet.</p>
                        <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                )}
                {messages.map(renderMessage)}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Indicator */}
            {replyTo && (
                <div className="bg-gray-100 px-4 py-2 flex justify-between items-center text-sm border-t">
                    <span className="text-gray-600 truncate max-w-xs">Replying to: <b>{replyTo.content.substring(0, 30)}...</b></span>
                    <button onClick={() => setReplyTo(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
                </div>
            )}

            <form onSubmit={sendMessage} className="p-3 bg-white border-t flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={replyTo ? "Write a reply..." : "Type a message..."}
                    className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-indigo-200 shadow-lg"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default DiscussionForum;
