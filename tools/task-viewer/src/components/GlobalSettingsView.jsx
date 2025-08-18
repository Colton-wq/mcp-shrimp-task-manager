import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function GlobalSettingsView({ showToast }) {
  const { t } = useTranslation();
  const [claudeFolderPath, setClaudeFolderPath] = useState('');
  const [openAIKey, setOpenAIKey] = useState('');
  const [modelName, setModelName] = useState('gpt-4-turbo-preview');
  const [customModelName, setCustomModelName] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [apiUrl, setApiUrl] = useState('https://api.openai.com/v1');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Predefined model options
  const modelOptions = [
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-32k', label: 'GPT-4 32K' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' },
    { value: 'custom', label: 'Custom Model (Enter Below)' }
  ];

  // Load settings from server on mount
  useEffect(() => {
    loadGlobalSettings();
  }, []);


  const loadGlobalSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/global-settings');
      if (response.ok) {
        const settings = await response.json();
        setClaudeFolderPath(settings.claudeFolderPath || '');
        setOpenAIKey(settings.openAIKey || '');
        const loadedModelName = settings.modelName || 'gpt-4-turbo-preview';

        // Check if the loaded model is in predefined options
        const isPredefinedModel = modelOptions.some(opt => opt.value === loadedModelName && opt.value !== 'custom');

        if (isPredefinedModel) {
          setModelName(loadedModelName);
          setIsCustomModel(false);
          setCustomModelName('');
        } else {
          setModelName('custom');
          setIsCustomModel(true);
          setCustomModelName(loadedModelName);
        }

        setApiUrl(settings.apiUrl || 'https://api.openai.com/v1');
      } else {
        console.error('Failed to load global settings');
        if (showToast) {
          showToast('Failed to load settings', 'error');
        }
      }
    } catch (err) {
      console.error('Error loading global settings:', err);
      if (showToast) {
        showToast('Error loading settings', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/global-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeFolderPath: claudeFolderPath,
          openAIKey: openAIKey,
          modelName: isCustomModel ? customModelName : modelName,
          apiUrl: apiUrl,
        }),
      });

      if (response.ok) {
        if (showToast) {
          showToast(t('settingsSaved'), 'success');
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving global settings:', err);
      if (showToast) {
        showToast('Error saving settings', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const testApiConnection = async () => {
    if (!openAIKey || !apiUrl) {
      if (showToast) {
        showToast('Please configure API Key and URL first', 'error');
      }
      return;
    }

    setTestingConnection(true);
    try {
      // Test API connection by making a simple request
      const testResponse = await fetch('/api/test-openai-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: openAIKey,
          apiUrl: apiUrl,
          modelName: isCustomModel ? customModelName : modelName
        })
      });

      if (testResponse.ok) {
        const result = await testResponse.json();
        if (showToast) {
          showToast('API connection successful!', 'success');
        }
      } else {
        const error = await testResponse.json();
        throw new Error(error.message || 'Connection test failed');
      }
    } catch (err) {
      console.error('API connection test failed:', err);
      if (showToast) {
        showToast(`Connection test failed: ${err.message}`, 'error');
      }
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="content-container">
        <div className="loading">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div className="settings-panel">
        <h2>{t('globalSettings')}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="claudeFolderPath">{t('claudeFolderPath')}:</label>
            <input
              type="text"
              id="claudeFolderPath"
              value={claudeFolderPath}
              onChange={(e) => setClaudeFolderPath(e.target.value)}
              placeholder={t('claudeFolderPathPlaceholder')}
              title={t('claudeFolderPath')}
              disabled={saving}
            />
            <span className="form-hint">
              {t('claudeFolderPathDesc')}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="openAIKey">
              OpenAI API Key
              {openAIKey && (
                <span style={{ 
                  marginLeft: '10px', 
                  fontSize: '12px', 
                  color: '#22c55e',
                  fontWeight: 'normal'
                }}>
                  ✓ Configured
                </span>
              )}
            </label>
            <div className="api-key-input-wrapper">
              <input
                type={showApiKey ? "text" : "password"}
                id="openAIKey"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                placeholder="sk-proj-..."
                title="OpenAI API Key for AI agent assignment"
                disabled={saving}
                className="api-key-input"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="api-key-toggle"
                title={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="form-hint">
              <strong>Used for:</strong> AI-powered agent assignment to automatically match agents to tasks.<br/>
              <strong>Get your key:</strong>{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                platform.openai.com/api-keys
              </a>
              {' '}(requires OpenAI account)
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="modelName">
              Model Name
              <span style={{
                marginLeft: '10px',
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: 'normal'
              }}>
                Current: {isCustomModel ? customModelName : modelName}
              </span>
            </label>
            <select
              id="modelName"
              value={isCustomModel ? 'custom' : modelName}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setIsCustomModel(true);
                  setModelName('custom');
                  // Keep existing custom model name or set a default
                  if (!customModelName) {
                    setCustomModelName('gpt-4-turbo-preview');
                  }
                } else {
                  setIsCustomModel(false);
                  setModelName(e.target.value);
                  setCustomModelName('');
                }
              }}
              disabled={saving}
              className="model-select"
            >
              {modelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isCustomModel && (
              <input
                type="text"
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                placeholder="Enter custom model name (e.g., gpt-4-turbo-preview, claude-3-opus, llama-2-70b)"
                disabled={saving}
                className="custom-model-input"
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            )}
            <span className="form-hint">
              <strong>Used for:</strong> Specifies which AI model to use for chat responses and agent assignment.<br/>
              <strong>OpenAI models:</strong> gpt-4-turbo-preview (recommended), gpt-4, gpt-3.5-turbo<br/>
              <strong>Other providers:</strong> claude-3-opus, claude-3-sonnet, llama-2-70b, mixtral-8x7b<br/>
              <strong>Note:</strong> Custom models require compatible API endpoints
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="apiUrl">
              API Endpoint URL
              <span style={{
                marginLeft: '10px',
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: 'normal'
              }}>
                {apiUrl === 'https://api.openai.com/v1' ? 'Default OpenAI' : 'Custom'}
              </span>
            </label>
            <input
              type="url"
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              title="API endpoint URL for OpenAI-compatible service"
              disabled={saving}
              className="api-url-input"
            />
            <span className="form-hint">
              <strong>Used for:</strong> API server endpoint for AI model requests.<br/>
              <strong>Default:</strong> https://api.openai.com/v1 (OpenAI official)<br/>
              <strong>Custom:</strong> Use for OpenAI-compatible services like Azure OpenAI, local deployments, etc.
            </span>
          </div>

          <div className="form-group">
            <button
              type="button"
              onClick={testApiConnection}
              disabled={testingConnection || saving || !openAIKey || !apiUrl}
              className="test-connection-button"
              style={{
                padding: '8px 16px',
                backgroundColor: testingConnection ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: testingConnection || saving || !openAIKey || !apiUrl ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                marginBottom: '16px'
              }}
            >
              {testingConnection ? 'Testing Connection...' : 'Test API Connection'}
            </button>
            <span className="form-hint" style={{ display: 'block', marginTop: '4px' }}>
              Test your API configuration to ensure it works correctly before saving.
            </span>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GlobalSettingsView;