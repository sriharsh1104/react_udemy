import { useState, useRef, useEffect } from 'react'
import './AIChat.css'

const MAX_FREE_CHATS = 10

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI (GPT-4)',
    icon: '🤖',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  perplexity: {
    name: 'Perplexity AI',
    icon: '🧠',
    apiEndpoint: 'https://api.perplexity.ai/chat/completions',
    model: 'llama-3.1-sonar-large-128k-online'
  },
  gemini: {
    name: 'Google Gemini',
    icon: '💎',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro'
  }
}

function AIChat() {
  const [selectedProvider, setSelectedProvider] = useState('openai')
  const [apiKeys, setApiKeys] = useState({
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    perplexity: import.meta.env.VITE_PERPLEXITY_API_KEY || '',
    gemini: import.meta.env.VITE_GEMINI_API_KEY || ''
  })
  const [userApiKeys, setUserApiKeys] = useState({
    openai: '',
    perplexity: '',
    gemini: ''
  })
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatCount, setChatCount] = useState(() => {
    const saved = localStorage.getItem('ai_chat_count')
    return saved ? parseInt(saved, 10) : 0
  })
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    localStorage.setItem('ai_chat_count', chatCount.toString())
  }, [chatCount])

  const getApiKey = (provider) => {
    return userApiKeys[provider] || apiKeys[provider] || ''
  }

  const handleApiKeyChange = (provider, value) => {
    setUserApiKeys(prev => ({
      ...prev,
      [provider]: value
    }))
  }

  const resetApiKey = (provider) => {
    setUserApiKeys(prev => ({
      ...prev,
      [provider]: ''
    }))
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Check free chat limit
    if (chatCount >= MAX_FREE_CHATS && !getApiKey(selectedProvider)) {
      alert(`Free chat limit reached (${MAX_FREE_CHATS} chats). Please add your own API key to continue.`)
      return
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    // Increment chat count if using default API key
    if (!userApiKeys[selectedProvider] && getApiKey(selectedProvider)) {
      setChatCount(prev => prev + 1)
    }

    try {
      const response = await callAIProvider(selectedProvider, newMessages, getApiKey(selectedProvider))
      
      if (response.error) {
        throw new Error(response.error)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.content }])
    } catch (error) {
      console.error('AI Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message || 'Failed to get response. Please check your API key.'}`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const callAIProvider = async (provider, messages, apiKey) => {
    if (!apiKey) {
      return { error: 'API key not found. Please add your API key in settings.' }
    }

    const providerConfig = AI_PROVIDERS[provider]

    switch (provider) {
      case 'openai':
        return await callOpenAI(messages, apiKey, providerConfig)
      
      case 'perplexity':
        return await callPerplexity(messages, apiKey, providerConfig)
      
      case 'gemini':
        return await callGemini(messages, apiKey, providerConfig)
      
      default:
        return { error: 'Unknown provider' }
    }
  }

  const callOpenAI = async (messages, apiKey, config) => {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { content: data.choices[0].message.content }
  }

  const callPerplexity = async (messages, apiKey, config) => {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { content: data.choices[0].message.content }
  }

  const callGemini = async (messages, apiKey, config) => {
    // Gemini uses different format
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    const conversationHistory = messages.slice(0, -1)

    const parts = []
    
    // Add conversation history
    for (const msg of conversationHistory) {
      parts.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    }

    // Add current message
    parts.push({
      role: 'user',
      parts: [{ text: lastUserMessage.content }]
    })

    const url = `${config.apiEndpoint}?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: parts
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    return { content: data.candidates[0].content.parts[0].text }
  }

  const clearChat = () => {
    setMessages([])
  }

  const resetChatCount = () => {
    setChatCount(0)
    localStorage.setItem('ai_chat_count', '0')
  }

  const remainingChats = MAX_FREE_CHATS - chatCount
  const hasApiKey = !!getApiKey(selectedProvider)
  const canChat = hasApiKey && (chatCount < MAX_FREE_CHATS || userApiKeys[selectedProvider])

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <h2 className="ai-chat-title">AI Chat Assistant</h2>
        <div className="ai-chat-info">
          {!userApiKeys[selectedProvider] && (
            <span className="chat-counter">
              Free chats: {remainingChats}/{MAX_FREE_CHATS}
            </span>
          )}
          <button 
            className="api-key-toggle-btn"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            {showApiKeyInput ? 'Hide' : 'Show'} API Keys
          </button>
        </div>
      </div>

      {showApiKeyInput && (
        <div className="api-keys-panel">
          <h3>API Key Settings</h3>
          {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
            <div key={key} className="api-key-input-group">
              <label>
                {provider.icon} {provider.name}
                {apiKeys[key] && !userApiKeys[key] && (
                  <span className="default-key-badge">Using default</span>
                )}
                {userApiKeys[key] && (
                  <span className="custom-key-badge">Using your key</span>
                )}
              </label>
              <div className="api-key-input-wrapper">
                <input
                  type="password"
                  value={userApiKeys[key] || ''}
                  onChange={(e) => handleApiKeyChange(key, e.target.value)}
                  placeholder={apiKeys[key] ? 'Leave empty to use default' : 'Enter your API key'}
                  className="api-key-input"
                />
                {userApiKeys[key] && (
                  <button 
                    className="reset-key-btn"
                    onClick={() => resetApiKey(key)}
                    title="Reset to default"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="api-key-info">
            <p>💡 Tips:</p>
            <ul>
              <li>Add your own API key to bypass free chat limits</li>
              <li>Your API keys are stored locally and never sent to our servers</li>
              <li>Get API keys from: OpenAI, Perplexity, Google AI Studio (Gemini)</li>
            </ul>
          </div>
        </div>
      )}

      <div className="provider-selector">
        {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
          <button
            key={key}
            className={`provider-btn ${selectedProvider === key ? 'active' : ''}`}
            onClick={() => setSelectedProvider(key)}
          >
            <span className="provider-icon">{provider.icon}</span>
            <span>{provider.name}</span>
          </button>
        ))}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <p>Start a conversation with AI</p>
            <p className="empty-chat-subtitle">Select a provider and type your message</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.role === 'user' ? (
                <div className="message-bubble user-bubble">
                  {message.content}
                </div>
              ) : (
                <div className="message-bubble assistant-bubble">
                  {message.content}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-bubble assistant-bubble">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={canChat ? "Type your message..." : "Add API key to start chatting"}
            disabled={!canChat || isLoading}
            className="chat-input"
          />
          <button
            onClick={sendMessage}
            disabled={!canChat || isLoading || !inputMessage.trim()}
            className="send-btn"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        
        <div className="chat-actions">
          <button onClick={clearChat} className="clear-btn" disabled={messages.length === 0}>
            Clear Chat
          </button>
          {chatCount > 0 && (
            <button onClick={resetChatCount} className="reset-count-btn">
              Reset Counter
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIChat

