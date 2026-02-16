import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL, SOCKET_URL } from '../apiConfig';

const socket = io.connect(SOCKET_URL);

const DiscussionForum = ({ eventId, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const room = `event_${eventId}`;

    useEffect(() => {
        // Fetch History
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

        // Join Room
        socket.emit("join_room", room);

        // Listen for messages
        socket.on("receive_message", (data) => {
            // Only add if not already present (optimistic UI might add it, or duplicates)
            // For simplicity, we'll append. PROD would use IDs.
            // Also, constructing a message object similar to DB response
            const msgObj = {
                _id: Date.now(), // Temp ID
                content: data.content,
                sender: { _id: data.senderId, firstName: data.senderName }, // Simplified
                createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, msgObj]);
        });

        return () => {
            socket.off("receive_message");
            // socket.emit("leave_room", room); // Optional
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
            senderName: user.firstName, // Sending name to avoid extra fetch on receiver
            type: 'event',
            objectId: eventId,
            time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes()
        };

        await socket.emit("send_message", messageData);
        setNewMessage("");
        // Wait for receive_message to update UI or update optimistically here.
        // receive_message broadcasts to EVERYONE in room including sender, so we wait.
    };

    return (
        <div className="bg-white rounded-lg shadow-md h-96 flex flex-col mt-8 border border-gray-200">
            <div className="bg-indigo-600 text-white p-4 rounded-t-lg">
                <h3 className="font-bold">Discussion Forum</h3>
                <p className="text-xs text-indigo-200">Ask doubts or chat with other participants</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, index) => {
                    const isMe = msg.sender._id === user._id || msg.sender === user._id; // Handle populated vs raw ID
                    const senderName = msg.sender.firstName || "Unknown";

                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg shadow text-sm 
                                ${isMe ? "bg-indigo-500 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"}`}>
                                {!isMe && <p className="text-xs font-bold text-gray-500 mb-1">{senderName}</p>}
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 text-right ${isMe ? "text-indigo-200" : "text-gray-400"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t bg-white flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-r-md hover:bg-indigo-700 font-medium">
                    Send
                </button>
            </form>
        </div>
    );
};

export default DiscussionForum;
