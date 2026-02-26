import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Link as LinkIcon } from 'lucide-react';
import MathPreview from './MathPreview'; 
import api from '../api';
import { Link } from 'react-router-dom';
import styles from './AITutor.module.css';

const AITutor = ({ questionId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi! I am Vivek, your AI Tutor. Ask me any doubt about this question!' }
    ]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Prepare history for context (simplified for this example)
            const history = messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await api.post('/ai/chat', {
                message: userMsg.text,
                questionId: questionId, // Context for RAG
                history: history
            });

            // Add AI response
            setMessages(prev => [...prev, { role: 'model', text: res.data.text }]);

            // If backend found related questions, show them
            if (res.data.relatedIds && res.data.relatedIds.length > 0) {
                 const linksMsg = {
                     role: 'system',
                     isLinks: true,
                     ids: res.data.relatedIds
                 };
                 setMessages(prev => [...prev, linksMsg]);
            }

        } catch (err) {
            console.error("AI Chat Error", err);
            setMessages(prev => [...prev, { role: 'model', text: "Hey there!  I’m just doing a bit of self-improvement so I can help you even better. Please try again after sometime." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Launcher Button */}
            {!isOpen && (
                <button className={styles.launcher} onClick={() => setIsOpen(true)}>
                    <Sparkles size={20} />
                    <span>Ask AI Tutor</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.header}>
                        <div className={styles.title}>
                            <Bot size={20} /> Mathem Solvex AI
                        </div>
                        <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className={styles.messages} ref={scrollRef}>
                        {messages.map((m, i) => {
                            if (m.isLinks) {
                                return (
                                    <div key={i} className={styles.relatedBox}>
                                        <span className={styles.relatedLabel}>Found similar PYQs:</span>
                                        {m.ids.map(id => (
                                            <Link to={`/question/${id}`} key={id} className={styles.relatedLink}>
                                                <LinkIcon size={12} /> View Related Question
                                            </Link>
                                        ))}
                                    </div>
                                )
                            }
                            return (
                                <div key={i} className={`${styles.message} ${styles[m.role]}`}>
                                    <MathPreview latexString={m.text} />
                                </div>
                            );
                        })}
                        {loading && (
                            <div className={styles.message + ' ' + styles.model}>
                                <span className={styles.typingDot}></span>
                                <span className={styles.typingDot}></span>
                                <span className={styles.typingDot}></span>
                            </div>
                        )}
                    </div>

                    <div className={styles.inputArea}>
                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a doubt..."
                            disabled={loading}
                        />
                        <button onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AITutor;