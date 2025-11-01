import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { BACKEND_URL } from '../constants'
import './GlobalChat.css'

const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [userName, setUserName] = useState('')
  const [connectedUsers, setConnectedUsers] = useState(0)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Connect to socket server with production-ready options
    // Use polling first for better compatibility, then upgrade to websocket
    socketRef.current = io(BACKEND_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      upgrade: true, // Allow upgrade from polling to websocket
      rememberUpgrade: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
      autoConnect: true
    })

    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error)
      // Don't show error message for every reconnect attempt
      // Only show once or on final failure
      if (error.message && !error.message.includes('xhr poll error')) {
        console.log('Connection error (will retry):', error.message)
      }
    })

    socketRef.current.on('connect', () => {
      console.log('Socket.io connected:', socketRef.current.id)
      setMessages(prev => {
        // Remove any previous connection error messages
        const filtered = prev.filter(msg => !msg.message.includes('Connection error'))
        return filtered
      })
    })

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected, need to reconnect manually
        socketRef.current.connect()
      }
    })

    socketRef.current.on('userConnected', (data) => {
      setUserName(data.userName)
      setConnectedUsers(data.connectedUsers?.length || 0)
      setMessages(prev => [...prev, {
        type: 'system',
        message: `Welcome ${data.userName}! You joined the chat.`,
        timestamp: new Date().toISOString()
      }])
    })

    socketRef.current.on('userJoined', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${data.userName} joined the chat`,
        timestamp: new Date().toISOString()
      }])
      setConnectedUsers(prev => prev + 1)
    })

    socketRef.current.on('userLeft', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${data.userName} left the chat`,
        timestamp: new Date().toISOString()
      }])
      setConnectedUsers(prev => Math.max(0, prev - 1))
    })

    socketRef.current.on('newMessage', (data) => {
      setMessages(prev => [...prev, {
        type: 'user',
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        timestamp: data.timestamp,
        isOwn: data.userId === socketRef.current?.id
      }])
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return

    socketRef.current.emit('sendMessage', {
      message: inputMessage.trim()
    })

    setInputMessage('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button - Fixed Right Corner */}
      <button 
        className={`global-chat-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Global Chat"
      >
        💬
        {connectedUsers > 0 && (
          <span className="chat-badge">{connectedUsers}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="global-chat-container">
          <div className="global-chat-header">
            <div className="chat-header-info">
              <h3>Global Chat</h3>
              <span className="user-name-badge">{userName}</span>
              {connectedUsers > 0 && (
                <span className="online-users">{connectedUsers} online</span>
              )}
            </div>
            <button 
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="global-chat-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>No messages yet. Start chatting!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${msg.type} ${msg.isOwn ? 'own-message' : ''}`}
                >
                  {msg.type === 'user' && (
                    <div className="message-header">
                      <span className="message-sender">{msg.userName}</span>
                      <span className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="message-content">
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="global-chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input-field"
            />
            <button 
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="chat-send-btn"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default GlobalChat

