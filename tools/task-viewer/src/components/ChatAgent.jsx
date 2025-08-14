import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

function ChatAgent({ 
  currentPage, 
  currentTask, 
  tasks, 
  profileId,
  projectRoot,
  showToast,
  onTaskUpdate 
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAgents, setSelectedAgents] = useState({ openai: true });
  const [availableAgents, setAvailableAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openAIKey, setOpenAIKey] = useState('');
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Load available agents and OpenAI key
  useEffect(() => {
    loadAvailableAgents();
    loadOpenAIKey();
  }, [profileId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadOpenAIKey = async () => {
    try {
      const response = await fetch('/api/global-settings');
      if (response.ok) {
        const settings = await response.json();
        setOpenAIKey(settings.openAIKey || '');
      }
    } catch (err) {
      console.error('Error loading OpenAI key:', err);
    }
  };

  const loadAvailableAgents = async () => {
    if (!profileId) return;
    
    try {
      const response = await fetch(`/api/agents/${profileId}`);
      if (response.ok) {
        const agents = await response.json();
        setAvailableAgents(agents);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  const getPageContext = () => {
    const context = {
      currentPage,
      timestamp: new Date().toISOString()
    };

    if (currentTask) {
      context.currentTask = {
        id: currentTask.id,
        name: currentTask.name,
        description: currentTask.description,
        status: currentTask.status,
        dependencies: currentTask.dependencies,
        relatedFiles: currentTask.relatedFiles,
        implementationGuide: currentTask.implementationGuide,
        verificationCriteria: currentTask.verificationCriteria,
        notes: currentTask.notes
      };
    }

    if (tasks && tasks.length > 0) {
      context.tasksSummary = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        pending: tasks.filter(t => t.status === 'pending').length
      };
      
      // Include task list for list page
      if (currentPage === 'task-list') {
        context.tasks = tasks.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          dependencies: t.dependencies?.length || 0
        }));
      }
    }

    return context;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const selectedAgentsList = Object.entries(selectedAgents)
        .filter(([_, selected]) => selected)
        .map(([agentId, _]) => agentId);

      if (selectedAgentsList.length === 0) {
        throw new Error('Please select at least one agent to chat with');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          agents: selectedAgentsList,
          context: getPageContext(),
          profileId,
          openAIKey,
          availableAgents: availableAgents.map(a => ({
            id: a.id,
            name: a.name,
            description: a.description
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agents');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        agents: data.respondingAgents || selectedAgentsList,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle task modifications if suggested
      if (data.taskModification && currentTask) {
        const shouldModify = window.confirm(
          'The AI suggests modifying the current task. Would you like to apply these changes?'
        );
        
        if (shouldModify && onTaskUpdate) {
          await onTaskUpdate(currentTask.id, data.taskModification);
          showToast('Task updated successfully', 'success');
        }
      }

    } catch (err) {
      console.error('Error sending message:', err);
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  if (!isOpen) {
    return (
      <button
        className="chat-agent-fab"
        onClick={() => setIsOpen(true)}
        title="Open AI Chat Assistant"
      >
        💬
      </button>
    );
  }

  return (
    <div className={`chat-agent-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="chat-agent-header">
        <div className="chat-agent-title">
          <span className="chat-icon">🤖</span>
          <span>AI Chat Assistant</span>
        </div>
        <div className="chat-agent-controls">
          <button
            className="chat-control-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            className="chat-control-btn"
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-agent-agents">
            <div className="agents-selection-header">
              <span className="agents-label">Chat with:</span>
              <div className="agents-checkboxes">
                <label className="agent-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedAgents.openai || false}
                    onChange={() => toggleAgent('openai')}
                  />
                  <span>OpenAI</span>
                </label>
                {availableAgents.map(agent => (
                  <label key={agent.id} className="agent-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedAgents[agent.id] || false}
                      onChange={() => toggleAgent(agent.id)}
                    />
                    <span title={agent.description}>
                      {agent.name || agent.id}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="chat-agent-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>Welcome! I can help you with:</p>
                <ul>
                  <li>• Understanding and analyzing tasks</li>
                  <li>• Suggesting task assignments to agents</li>
                  <li>• Answering questions about your project</li>
                  <li>• Modifying current task details</li>
                </ul>
                <p className="chat-context-info">
                  Current context: <strong>{currentPage}</strong>
                  {currentTask && ` - Task: ${currentTask.name}`}
                </p>
              </div>
            )}
            
            {messages.map(message => (
              <div key={message.id} className={`chat-message ${message.role}`}>
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? '👤 You' : '🤖 AI'}
                  </span>
                  {message.agents && message.agents.length > 0 && (
                    <span className="message-agents">
                      ({message.agents.join(', ')})
                    </span>
                  )}
                </div>
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant loading">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-agent-input">
            <textarea
              ref={chatInputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              disabled={isLoading}
              rows="2"
            />
            <button
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatAgent;