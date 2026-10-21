import { useState, useEffect } from 'react';

const links = [
  { name: 'Home', url: '/' },
  { name: 'Writing', url: '/writing' },
  { name: 'Projects', url: '/projects' },
  { name: 'About', url: '/about' },
  { name: 'Contact', url: '/contact' },
];

const socials = [
  { name: 'LinkedIn', url: 'https://linkedin.com/in/andreasodysseos' },
  { name: 'GitHub', url: 'https://github.com/aodysseos' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        className="mobile-nav-trigger"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 200,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 190,
            backgroundColor: 'var(--color-background)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'center' }}>
              {links.map((link) => (
                <li key={link.name} style={{ marginBottom: '1.5rem' }}>
                  <a
                    href={link.url}
                    onClick={() => setOpen(false)}
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 400,
                  color: 'var(--color-secondary)',
                  textDecoration: 'none',
                }}
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (min-width: 1200px) {
          .mobile-nav-trigger { display: none !important; }
        }
      `}</style>
    </>
  );
}
