'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, MicOff, Send, X, MessageSquare, Volume2, Info } from 'lucide-react';

export default function AIAssistant({ isOpen, onClose, defaultTab = 'chat' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [chatMessage, setChatMessage] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      content: 'Salam! I am your NearLink Guide. Ask me anything about our AI multi-agent service orchestrator, how to book services, or how our features work!'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListeningInChat, setIsListeningInChat] = useState(false); // mic in chat input
  const chatRecognitionRef = useRef(null);

  // Vapi Credentials State
  const [vapiPublicKey, setVapiPublicKey] = useState('');
  const [vapiAssistantId, setVapiAssistantId] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Voice States
  const [voiceStatus, setVoiceStatus] = useState('idle'); // 'idle', 'connecting', 'listening', 'speaking', 'connected'
  const [voiceText, setVoiceText] = useState('Click start to speak with our AI agent.');
  const [vapiInstance, setVapiInstance] = useState(null);
  const [isVapiActive, setIsVapiActive] = useState(false);

  // Web Speech Fallback refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef(null);

  const chatEndRef = useRef(null);

  // Suggested questions
  const suggestions = [
    "How does NearLink work?",
    "What are the 4 AI Agents?",
    "How do I book a Plumber?",
    "Can I negotiate prices?",
    "Bhai ye app kaise chalani hai?"
  ];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Load Vapi Web SDK and fetch config on mount safely
  useEffect(() => {
    // Fetch Vapi config from backend
    fetch('http://localhost:8000/api/guide/config')
      .then(res => res.json())
      .then(data => {
        if (data.vapi_public_key && data.vapi_assistant_id) {
          setVapiPublicKey(data.vapi_public_key);
          setVapiAssistantId(data.vapi_assistant_id);
          console.log('✅ Loaded Vapi credentials from backend environment variables');
        }
      })
      .catch(err => console.warn('Could not load Vapi configuration from backend.', err));

    import('@vapi-ai/web')
      .then((module) => {
        setVapiInstance(new module.default('')); // Dummy instantiation
      })
      .catch((err) => console.warn('Could not load Vapi SDK. Web Speech simulation is active.', err));

    // Cleanup speech synthesis on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle Chat Submit
  const handleChatSend = async (textToSend) => {
    const text = textToSend || chatMessage;
    if (!text.trim()) return;

    if (!textToSend) setChatMessage('');

    const newHistory = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-10) // Send last 10 messages for context
        })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setChatHistory([...newHistory, { role: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Failed to fetch response');
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'Sorry, I am facing a connection issue. Please make sure the backend is running at http://localhost:8000.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Voice-to-Text directly in Chat Input ---
  const startChatVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Aapka browser Speech Recognition support nahi karta. Google Chrome use karein.');
      return;
    }

    setIsListeningInChat(true);
    setChatMessage('');

    const rec = new SpeechRecognition();
    rec.lang = 'ur-PK';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    chatRecognitionRef.current = rec;

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setChatMessage(transcript);
    };

    rec.onerror = (e) => {
      console.warn('Chat voice error:', e);
      setIsListeningInChat(false);
    };

    rec.onend = () => {
      setIsListeningInChat(false);
    };

    rec.start();
  };

  const stopChatVoice = () => {
    if (chatRecognitionRef.current) {
      chatRecognitionRef.current.stop();
    }
    setIsListeningInChat(false);
  };

  const handleChatMicToggle = () => {
    if (isListeningInChat) {
      stopChatVoice();
    } else {
      startChatVoice();
    }
  };

  // --- Vapi Direct Live Integration ---
  const startVapiCall = () => {
    if (!vapiPublicKey || !vapiAssistantId) {
      alert('Please fill in your Vapi Public Key and Assistant ID in the configuration panel below.');
      return;
    }
    
    try {
      setVoiceStatus('connecting');
      setVoiceText('Connecting to Vapi agent...');
      
      // Initialize with user keys
      const vapi = vapiInstance;
      vapi.publicKey = vapiPublicKey;
      
      vapi.start(vapiAssistantId);
      setIsVapiActive(true);

      vapi.on('call-start', () => {
        setVoiceStatus('connected');
        setVoiceText('Connected! Speak now.');
      });

      vapi.on('call-end', () => {
        setVoiceStatus('idle');
        setVoiceText('Call ended.');
        setIsVapiActive(false);
      });

      vapi.on('speech-start', () => {
        setVoiceStatus('speaking');
      });

      vapi.on('speech-end', () => {
        setVoiceStatus('listening');
      });

      vapi.on('error', (e) => {
        console.error(e);
        setVoiceStatus('idle');
        setVoiceText(`Vapi Connection Error: ${e.message || 'Unknown error'}`);
        setIsVapiActive(false);
      });

    } catch (err) {
      setVoiceStatus('idle');
      setVoiceText(`Failed to load Voice Agent: ${err.message}`);
      setIsVapiActive(false);
    }
  };

  const stopVapiCall = () => {
    if (vapiInstance) {
      vapiInstance.stop();
    }
    setIsVapiActive(false);
    setVoiceStatus('idle');
    setVoiceText('Call stopped.');
  };

  // --- HTML5 Native Web Speech Simulation ---
  const startSpeechSimulation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition. Please try Google Chrome.');
      return;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setVoiceStatus('listening');
    setVoiceText('Listening... Speak now.');

    const rec = new SpeechRecognition();
    rec.lang = 'ur-PK'; // support Roman Urdu / Urdu / English
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onstart = () => {
      isSpeakingRef.current = false;
    };

    rec.onresult = async (event) => {
      const speechToText = event.results[0][0].transcript;
      setVoiceText(`You said: "${speechToText}"`);
      setVoiceStatus('connecting');

      // Query Backend guide chatbot
      try {
        const res = await fetch('http://localhost:8000/api/guide/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: speechToText })
        });
        const data = await res.json();
        if (data.status === 'success') {
          speakOutput(data.reply);
        } else {
          speakOutput("Sorry, I could not fetch a response.");
        }
      } catch (err) {
        speakOutput("Backend connection error. Please make sure the backend is running.");
      }
    };

    rec.onerror = (e) => {
      console.warn("Speech recognition error", e);
      if (e.error !== 'no-speech') {
        setVoiceStatus('idle');
        setVoiceText(`Speech Error: ${e.error}`);
      } else {
        setVoiceStatus('idle');
        setVoiceText('No speech detected. Click mic to try again.');
      }
    };

    rec.onend = () => {
      if (voiceStatus === 'listening') {
        setVoiceStatus('idle');
      }
    };

    rec.start();
  };

  const speakOutput = (text) => {
    if (!window.speechSynthesis) {
      setVoiceText(text);
      setVoiceStatus('idle');
      return;
    }

    setVoiceStatus('speaking');
    setVoiceText(text);

    // Filter emojis or special chars
    const cleanedText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Attempt to pick a local Urdu voice or English voice based on content
    const voices = window.speechSynthesis.getVoices();
    const urduVoice = voices.find(v => v.lang.includes('ur') || v.lang.includes('hi'));
    if (urduVoice) {
      utterance.voice = urduVoice;
    }

    utterance.onend = () => {
      setVoiceStatus('idle');
    };

    utterance.onerror = (e) => {
      console.error(e);
      setVoiceStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeechSimulation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceStatus('idle');
    setVoiceText('Call simulation stopped.');
  };

  // Toggle active call depending on config
  const handleVoiceToggle = () => {
    if (vapiPublicKey && vapiAssistantId) {
      if (isVapiActive) {
        stopVapiCall();
      } else {
        startVapiCall();
      }
    } else {
      if (voiceStatus !== 'idle') {
        stopSpeechSimulation();
      } else {
        startSpeechSimulation();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div
        className="ai-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '80vh',
          borderRadius: '30px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Animated ambient background spots */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '250px', height: '250px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%', width: '250px', height: '250px',
          background: 'radial-gradient(circle, rgba(0, 177, 64, 0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Header */}
        <div className="ai-header" style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(0,177,64,0.2))',
              border: '1px solid var(--border-gold)',
              padding: '10px',
              borderRadius: '15px'
            }}>
              <Bot size={24} style={{ color: 'var(--gold-light)' }} />
            </div>
            <div>
              <h3 className="ai-title" style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                NearLink AI Assistant
                <span style={{ fontSize: '10px', background: 'rgba(0,177,64,0.15)', color: 'var(--green-light)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(0,177,64,0.3)', fontWeight: '900' }}>
                  PERSONALIZED
                </span>
              </h3>
              <p className="ai-subtitle" style={{ fontSize: '12px', margin: '2px 0 0 0' }}>
                Guided support for features, agents, and platform navigation
              </p>
            </div>
          </div>
          <button
            className="ai-close-btn"
            onClick={onClose}
            style={{
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="ai-tab-bar" style={{
          display: 'flex',
          zIndex: 10
        }}>
          <button 
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '3px solid var(--gold-light)' : '3px solid transparent',
              color: activeTab === 'chat' ? 'var(--gold-light)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <MessageSquare size={18} /> Chatbot Guide
          </button>
          <button 
            onClick={() => setActiveTab('voice')}
            style={{
              flex: 1,
              padding: '16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'voice' ? '3px solid var(--green-light)' : '3px solid transparent',
              color: activeTab === 'voice' ? 'var(--green-light)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <Mic size={18} /> Voice Agent Guide
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
          
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div 
                key="chat-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                {/* Chat History */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                  maxHeight: '320px',
                  paddingRight: '6px'
                }}>
                  {chatHistory.map((msg, i) => (
                    <div 
                      key={i} 
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div
                        className={msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'}
                        style={{
                          maxWidth: '80%',
                          padding: '14px 20px',
                          borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          fontSize: '14.5px',
                          lineHeight: '1.6',
                          whiteSpace: 'pre-line'
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div className="ai-loading-bubble" style={{
                        padding: '14px 20px',
                        borderRadius: '20px 20px 20px 4px',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center'
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-light)', animation: 'pulse 1s infinite alternate' }} />
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-light)', animation: 'pulse 1s infinite alternate', animationDelay: '0.2s' }} />
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-light)', animation: 'pulse 1s infinite alternate', animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestions Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {suggestions.map((text, i) => (
                    <button
                      key={i}
                      className="ai-suggestion-chip"
                      onClick={() => handleChatSend(text)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div style={{ display: 'flex', gap: '10px', position: 'relative', alignItems: 'center' }}>
                  {/* Mic button for voice-to-text in chat */}
                  <motion.button
                    onClick={handleChatMicToggle}
                    animate={isListeningInChat ? {
                      boxShadow: ['0 0 0px rgba(0,177,64,0.4)', '0 0 18px rgba(0,177,64,0.8)', '0 0 0px rgba(0,177,64,0.4)']
                    } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                    title={isListeningInChat ? 'Sunna band karo' : 'Bolo — voice se likho'}
                    style={{
                      background: isListeningInChat
                        ? 'linear-gradient(135deg, #00b140, #007a2b)'
                        : 'rgba(0,177,64,0.12)',
                      border: `2px solid ${isListeningInChat ? '#00b140' : 'rgba(0,177,64,0.4)'}`,
                      color: isListeningInChat ? '#fff' : '#00b140',
                      width: '54px',
                      height: '54px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s'
                    }}
                  >
                    {isListeningInChat ? <MicOff size={20} /> : <Mic size={20} />}
                  </motion.button>

                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      className="ai-chat-input"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' ? handleChatSend() : null}
                      placeholder={isListeningInChat ? '🎙️ Bol raha hoon... sunna band karo to send hoga' : 'Likhain ya mic se baat karein...'}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: '14px',
                        fontSize: '14.5px',
                        transition: 'all 0.3s',
                        ...(isListeningInChat && { borderColor: 'rgba(0,177,64,0.5)' })
                      }}
                    />
                    {isListeningInChat && (
                      <div style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        gap: '3px',
                        alignItems: 'center'
                      }}>
                        {[...Array(4)].map((_, i) => (
                          <div key={i} style={{
                            width: '3px',
                            height: '14px',
                            background: '#00b140',
                            borderRadius: '2px',
                            animation: 'soundwave 0.4s infinite ease-in-out alternate',
                            animationDelay: `${i * 0.1}s`
                          }} />
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => { stopChatVoice(); handleChatSend(); }}
                    disabled={!chatMessage.trim()}
                    style={{
                      background: chatMessage.trim()
                        ? 'linear-gradient(135deg, var(--gold), var(--gold-dark))'
                        : 'rgba(212,175,55,0.15)',
                      color: chatMessage.trim() ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      width: '54px',
                      height: '54px',
                      borderRadius: '14px',
                      cursor: chatMessage.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: chatMessage.trim() ? '0 4px 15px rgba(212,175,55,0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { if (chatMessage.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="voice-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                {/* Visualizer Sphere */}
                <div style={{ position: 'relative', marginBottom: '30px' }}>
                  <motion.div 
                    animate={voiceStatus === 'listening' ? {
                      scale: [1, 1.2, 1],
                      boxShadow: [
                        '0 0 20px rgba(0, 177, 64, 0.4)',
                        '0 0 50px rgba(0, 177, 64, 0.7)',
                        '0 0 20px rgba(0, 177, 64, 0.4)'
                      ]
                    } : voiceStatus === 'speaking' ? {
                      scale: [1, 1.15, 1.05, 1.2, 1],
                      boxShadow: [
                        '0 0 25px rgba(212, 175, 55, 0.5)',
                        '0 0 60px rgba(212, 175, 55, 0.8)',
                        '0 0 25px rgba(212, 175, 55, 0.5)'
                      ]
                    } : voiceStatus === 'connecting' ? {
                      rotate: 360
                    } : {}}
                    transition={{
                      duration: voiceStatus === 'connecting' ? 2 : 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    style={{
                      width: '140px',
                      height: '140px',
                      borderRadius: '50%',
                      background: voiceStatus === 'listening' 
                        ? 'radial-gradient(circle, var(--green-light) 0%, var(--green-dark) 100%)'
                        : voiceStatus === 'speaking'
                        ? 'radial-gradient(circle, var(--gold-light) 0%, var(--gold-dark) 100%)'
                        : voiceStatus === 'connecting'
                        ? 'radial-gradient(circle, #3b82f6 0%, #1d4ed8 100%)'
                        : 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
                      border: voiceStatus !== 'idle'
                        ? 'none'
                        : '2px dashed var(--border-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 20
                    }}
                    onClick={handleVoiceToggle}
                  >
                    {voiceStatus === 'idle' ? (
                      <Mic size={48} style={{ color: 'var(--gold-light)', opacity: 0.8 }} />
                    ) : voiceStatus === 'listening' ? (
                      <Mic size={48} style={{ color: '#fff' }} />
                    ) : voiceStatus === 'speaking' ? (
                      <Volume2 size={48} style={{ color: '#000' }} />
                    ) : (
                      <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', boxShadow: 'none' }} />
                    )}
                  </motion.div>

                  {/* Pulsing soundwave equalizer bars under sphere */}
                  {voiceStatus !== 'idle' && (
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      justifyContent: 'center',
                      marginTop: '25px',
                      height: '35px',
                      alignItems: 'center'
                    }}>
                      {[...Array(9)].map((_, idx) => (
                        <div 
                          key={idx}
                          style={{
                            width: '4px',
                            height: '100%',
                            background: voiceStatus === 'listening' ? 'var(--green-light)' : 'var(--gold-light)',
                            borderRadius: '2px',
                            animation: 'soundwave 0.5s infinite ease-in-out alternate',
                            animationDelay: `${idx * 0.08}s`,
                            transformOrigin: 'bottom'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitle text / status */}
                <div style={{ textAlign: 'center', maxWidth: '500px', marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: '800', 
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: voiceStatus === 'listening' ? 'var(--green-light)' 
                      : voiceStatus === 'speaking' ? 'var(--gold-light)'
                      : voiceStatus === 'connecting' ? '#3b82f6'
                      : 'var(--text-muted)',
                    marginBottom: '8px'
                  }}>
                    {voiceStatus === 'idle' ? 'VOICE DISCONNECTED' 
                      : voiceStatus === 'listening' ? 'LISTENING (SPEECH SIMULATOR)'
                      : voiceStatus === 'speaking' ? 'SPEAKING'
                      : 'ESTABLISHING HANDSHAKE...'}
                  </div>
                  <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                    "{voiceText}"
                  </p>
                </div>

                {/* Sleek platform details info card */}
                <div className="ai-voice-info" style={{
                  width: '100%',
                  maxWidth: '500px',
                  borderRadius: '15px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Info size={20} style={{ color: 'var(--gold-light)', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    NearLink Guide is powered by advanced LLM orchestration. Click the microphone to discuss features, search filters, or our 4-Agent architecture.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}
