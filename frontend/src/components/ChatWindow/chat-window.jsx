import React, { useState, useRef, useEffect } from 'react';
import './chat-window.css';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // You might want to store this in a more persistent way depending on your app
  const sessionId = localStorage.getItem('chatSessionId') || '67cba367b6c160aa2f280288';

  // Fetch message history when component mounts
  useEffect(() => {
    fetchMessageHistory();
  }, []);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessageHistory = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint for logs
      const response = await fetch(`http://localhost:5000/api/logs/${sessionId}`);
      const data = await response.json();

      // Transform the API data to match our message format
      const formattedMessages = [];

      data.forEach((item) => {
        // Add bot message (context)
        formattedMessages.push({
          id: `bot-${item._id}`,
          text: item.context,
          sender: 'bot',
          timestamp: new Date(item.timestamp)
        });

        // Add user message if it exists
        if (item.userInput) {
          formattedMessages.push({
            id: `user-${item._id}`,
            text: item.userInput,
            sender: 'user',
            timestamp: new Date(item.timestamp)
          });
        }
      });

      // Sort messages by timestamp
      formattedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching message history:', error);
      setMessages([
        { id: 'default-1', text: 'Failed to load chat history.', sender: 'bot' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageText = newMessage;

    // Immediately add user message to the UI
    const userMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage(''); // Clear input field
    setIsTyping(true); // Show typing indicator

    try {
      // Send user message to the API
      const response = await fetch('http://localhost:5000/api/play-turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          playerChoice: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      // Get bot response
      const data = await response.json();

      // Add bot response to chat
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: data.storyState || "No response",
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Show error message
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `error-${Date.now()}`,
          text: 'Sorry, I couldn\'t process your message. Please try again.',
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false); // Hide typing indicator
    }
  };

  return (
    <div className="chat-container">
      {/* Chat history scrollable area */}
      <div className="message-area">
        {loading ? (
          <div className="loading-message">Loading conversation history...</div>
        ) : messages.length === 0 ? (
          <div className="empty-message">No messages yet. Start a conversation!</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              {message.text}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="message bot-message typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="input-area">
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="message-input"
            disabled={loading || isTyping}
          />
          <button
            onClick={handleSendMessage}
            className="send-button"
            disabled={loading || isTyping || newMessage.trim() === ''}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;