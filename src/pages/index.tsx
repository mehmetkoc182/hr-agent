// This is the main page of the application. It contains the chat interface and logic for sending and receiving messages.

import React, { useState, useEffect, useRef } from 'react';
import { parseCookies, destroyCookie } from 'nookies';

interface Message {
  type: 'user' | 'ai';
  text: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastMessageRef = useRef<HTMLDivElement>(null); 
  
  useEffect(() => {
    const cookies = parseCookies();
    const conversationId = cookies.conversationId;

    if (conversationId) {
      fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId: Number(conversationId) }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (Array.isArray(data.messages)) {
            setMessages(data.messages);
          } else {
            console.error('Expected messages to be an array:', data.messages);
          }
        })
        .catch((error) => console.error('Error fetching conversation history:', error));
    }
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    // Add user message to chat
    setMessages((prevMessages) => [...prevMessages, { type: 'user', text: input }]);
    setInput('');
    setIsLoading(true);  // Show loader while waiting for AI response

    try {
      // Send the user's message to the backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      if (data && data.message) {
        // Add AI's response to chat
        setMessages((prevMessages) => [...prevMessages, { type: 'ai', text: data.message }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);  // Hide loader
    }
  };

  const handleStartNewConversation = () => {
    // Clear cookies
    destroyCookie(null, 'conversationId');
    destroyCookie(null, 'messages');
    // Reset messages
    setMessages([]);
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-grow p-4 overflow-auto">
        <div className="flex flex-col space-y-4">
        <div
              key={0}
              className={`p-4 rounded-lg ${
                 'bg-gray-300'
              }`}
            >
              <p>I'm your AI job-seeking assistant.</p>
              <p>Talk to me.</p>
            </div>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                msg.type === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300'
              }`}
              ref={index === messages.length - 1 ? lastMessageRef : null}  // Add ref to the last message
            >
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div className="p-4 fade rounded-lg text-left">
              <span role="img">🤔</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            className="ml-2 p-2 bg-blue-500 text-white rounded-md"
          >
            Send
          </button>
        </div>
        <button
          onClick={handleStartNewConversation}
          className="mt-2 w-full p-2 bg-red-500 text-white rounded-md"
        >
          Start New Conversation
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
