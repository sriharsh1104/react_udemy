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
  const [theme, setTheme] = useState(() => localStorage.getItem('chat_theme') || 'dark')
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const [showJumpToTop, setShowJumpToTop] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const fileInputRef = useRef(null)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const userScrolledUpRef = useRef(false)

  const appendMessage = (newMsg) => {
    setMessages(prev => {
      const next = [...prev, newMsg]
      // Only count user messages toward the 100 limit
      // System messages (welcome/left) are excluded from the count
      const userMessages = next.filter(msg => msg.type === 'user')
      const systemMessages = next.filter(msg => msg.type === 'system')
      
      // Keep only last 100 user messages
      const limitedUserMessages = userMessages.length > 100 
        ? userMessages.slice(userMessages.length - 100)
        : userMessages
      
      // Combine system messages with limited user messages, sorted by timestamp
      const combined = [...limitedUserMessages, ...systemMessages]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      return combined
    })
  }

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
      
      // Load message history if available
      if (data.messageHistory && data.messageHistory.length > 0) {
        const historyMessages = data.messageHistory.map(msg => ({
          type: 'user',
          userId: msg.userId,
          userName: msg.userName,
          message: msg.message,
          imageUrl: msg.imageUrl || null,
          timestamp: msg.timestamp,
          isOwn: msg.userId === socketRef.current?.id
        }))
        setMessages(historyMessages)
      }
      
      appendMessage({
        type: 'system',
        message: `Welcome ${data.userName}! You joined the chat.`,
        timestamp: new Date().toISOString()
      })
    })

    socketRef.current.on('userJoined', (data) => {
      appendMessage({
        type: 'system',
        message: `${data.userName} joined the chat`,
        timestamp: new Date().toISOString()
      })
      setConnectedUsers(prev => prev + 1)
    })

    socketRef.current.on('userLeft', (data) => {
      appendMessage({
        type: 'system',
        message: `${data.userName} left the chat`,
        timestamp: new Date().toISOString()
      })
      setConnectedUsers(prev => Math.max(0, prev - 1))
    })

    socketRef.current.on('newMessage', (data) => {
      appendMessage({
        type: 'user',
        userId: data.userId,
        userName: data.userName,
        message: data.message,
        imageUrl: data.imageUrl || null,
        timestamp: data.timestamp,
        isOwn: data.userId === socketRef.current?.id
      })
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('chat_theme', theme)
  }, [theme])

  // Handle ESC key to close fullscreen image
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [fullscreenImage])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive (only if user hasn't manually scrolled up)
    if (isOpen && !userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Track scroll position to show/hide jump buttons
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (!messagesContainer || !isOpen) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer
      const isAtTop = scrollTop < 50
      // Show jump to bottom immediately when even 1px scrolled up from bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight <= 1

      setShowJumpToTop(!isAtTop && messages.length > 0)
      // Show jump to bottom button if not exactly at bottom (even 1px scroll up)
      setShowJumpToBottom(!isAtBottom && messages.length > 0 && scrollHeight > clientHeight)

      // Track if user manually scrolled up (don't auto-scroll if they did)
      if (!isAtBottom && scrollTop > 0) {
        userScrolledUpRef.current = true
      } else if (isAtBottom) {
        userScrolledUpRef.current = false
      }
    }

    messagesContainer.addEventListener('scroll', handleScroll)
    // Initial check
    handleScroll()

    return () => {
      messagesContainer.removeEventListener('scroll', handleScroll)
    }
  }, [messages, isOpen])

  const jumpToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const jumpToBottom = () => {
    userScrolledUpRef.current = false
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' })
    // Also scroll the end ref into view
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return

    socketRef.current.emit('sendMessage', {
      message: inputMessage.trim()
    })

    setInputMessage('')
    // Reset scroll tracking when user sends a message
    userScrolledUpRef.current = false
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Only image files allowed')
      return
    }
    if (file.size > 1024 * 1024) {
      alert('Image must be 1MB or less')
      return
    }
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch(`${BACKEND_URL}/api/chat/upload-image`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed')
      socketRef.current?.emit('sendMessage', { imageUrl: data.url })
      // Reset scroll tracking when user sends an image
      userScrolledUpRef.current = false
    } catch (err) {
      console.error('Image upload error:', err)
      alert('Failed to upload image')
    }
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
        <div className={`global-chat-container ${theme === 'light' ? 'light' : 'dark'}`}>
          <div className="global-chat-header">
            <div className="chat-header-info">
              <h3>Global Chat</h3>
              <span className="user-name-badge">{userName}</span>
              {connectedUsers > 0 && (
                <span className="online-users">{connectedUsers} online</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="chat-close-btn"
                title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
                onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button 
                className="chat-close-btn"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="global-chat-messages" ref={messagesContainerRef}>
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
                    {msg.imageUrl ? (
                      <img 
                        src={msg.imageUrl} 
                        alt="shared" 
                        className="chat-image"
                        onClick={() => setFullscreenImage(msg.imageUrl)}
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      msg.message
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />

            {/* Jump to Top Button - inside messages container */}
            {showJumpToTop && (
              <button 
                className="jump-button jump-to-top"
                onClick={jumpToTop}
                title="Jump to top"
              >
                ↑
              </button>
            )}
          </div>

          {/* Jump to Bottom Button - fixed at bottom right, above send button */}
          {showJumpToBottom && (
            <button 
              className="jump-button jump-to-bottom"
              onClick={jumpToBottom}
              title="Jump to bottom"
            >
              ↓
            </button>
          )}

          <div className="global-chat-input">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} style={{ display: 'none' }} />
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="chat-input-field"
            />
            <button onClick={handleImageButtonClick} className="chat-send-btn" title="Send image (<=1MB)">📷</button>
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

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fullscreen-image-modal"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="close-fullscreen-btn"
            onClick={() => setFullscreenImage(null)}
            title="Close (ESC)"
          >
            ✕
          </button>
          <img 
            src={fullscreenImage} 
            alt="Fullscreen" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default GlobalChat

