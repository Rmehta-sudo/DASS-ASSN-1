import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { API_URL, SOCKET_URL } from '../apiConfig';

const socket = io.connect(SOCKET_URL);

const TeamChat = ({ teamId, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const room = `team_${teamId}`;

    useEffect(() => {
        if (!teamId) return;

        // Fetch History
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${API_URL}/chat/team/${teamId}`, {
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
            const msgObj = {
                _id: Date.now(),
                content: data.content,
                sender: { _id: data.senderId, firstName: data.senderName },
                createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, msgObj]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, [teamId, room]);

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
            senderName: user.firstName,
            type: 'team',
            objectId: teamId,
            time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes()
        };

        await socket.emit("send_message", messageData);
        setNewMessage("");
    };

    return (
        <div className="bg-white rounded-lg shadow-inner h-80 flex flex-col mt-4 border border-gray-200">
            <div className="bg-gray-800 text-white p-3 rounded-t-lg flex justify-between items-center">
                <h4 className="font-bold text-sm">Team Chat</h4>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {messages.map((msg, index) => {
                    const isMe = msg.sender._id === user._id || msg.sender === user._id;
                    const senderName = msg.sender.firstName || "Unknown";

                    return (
                        <div key={index} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm 
                                ${isMe ? "bg-indigo-100 text-indigo-900" : "bg-white border text-gray-800"}`}>
                                {!isMe && <p className="text-[10px] font-bold text-gray-500">{senderName}</p>}
                                <p>{msg.content}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-2 border-t bg-white flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message team..."
                    className="flex-1 border border-gray-300 rounded-l-md px-3 py-1 text-sm focus:outline-none"
                />
                <button type="submit" className="bg-gray-800 text-white px-4 py-1 rounded-r-md hover:bg-gray-900 text-sm">
                    Send
                </button>
            </form>
        </div>
    );
};

export default TeamChat;
