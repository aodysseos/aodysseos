import { useState } from 'react';

interface FormState {
  name: string;
  email: string;
  message: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // Replace with your actual form endpoint (e.g. AWS API Gateway, Formspree, etc.)
      const endpoint = import.meta.env.PUBLIC_CONTACT_FORM_API;
      if (!endpoint) {
        console.warn('Contact form API endpoint not configured');
        setStatus('sent');
        return;
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center' }}>
        <p style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '1.125rem',
          fontWeight: 300,
          color: 'var(--color-primary)',
        }}>
          Thanks for reaching out. I'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '520px', marginTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="name" style={labelStyle}>Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="message" style={labelStyle}>Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={form.message}
          onChange={handleChange}
          style={{ ...inputStyle, resize: 'vertical' as const, height: 'auto' }}
        />
      </div>
      {status === 'error' && (
        <p style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Something went wrong. Please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '0.85rem',
          fontWeight: 800,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          padding: '0.75rem 2rem',
          border: '2px solid var(--color-primary)',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-background)',
          cursor: status === 'sending' ? 'wait' : 'pointer',
          opacity: status === 'sending' ? 0.6 : 1,
          transition: 'opacity 0.2s ease',
        }}
      >
        {status === 'sending' ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Montserrat', sans-serif",
  fontSize: '0.85rem',
  fontWeight: 400,
  marginBottom: '0.5rem',
  color: 'var(--color-primary)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '42px',
  padding: '0.5rem 0.75rem',
  fontFamily: "'Montserrat', sans-serif",
  fontSize: '0.9rem',
  fontWeight: 300,
  border: '1px solid var(--color-border)',
  borderRadius: '2px',
  backgroundColor: 'transparent',
  color: 'var(--color-primary)',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};
