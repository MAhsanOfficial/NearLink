'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

const customerLinks = [
  { href: '/dashboard',    icon: '🏠', label: 'Home'    },
  { href: '/request',      icon: '✨', label: 'Request'  },
  { href: '/history',      icon: '📋', label: 'History'  },
  { href: '/followup',     icon: '🔔', label: 'Alerts'   },
  { href: '/admin/traces', icon: '🔍', label: 'Traces'   },
];

const providerLinks = [
  { href: '/provider/dashboard', icon: '🏠', label: 'Home'    },
  { href: '/provider/edit',      icon: '⚙️', label: 'Profile' },
  { href: '/admin/traces',       icon: '🔍', label: 'Traces'  },
];

export default function BottomNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = user.user_type === 'provider' ? providerLinks : customerLinks;

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== '/' && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <motion.span
              className="bottom-nav-icon"
              animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {link.icon}
            </motion.span>
            <span className="bottom-nav-label">{link.label}</span>

            {isActive && (
              <motion.div
                layoutId="bnav-indicator"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 3,
                  borderRadius: 2,
                  background: 'var(--green)',
                  boxShadow: '0 0 10px var(--green-neon)',
                }}
              />
            )}
          </Link>
        );
      })}

      {/* Logout pill at far right */}
      <button
        onClick={logout}
        className="bottom-nav-item"
        aria-label="Logout"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span className="bottom-nav-icon">🚪</span>
        <span className="bottom-nav-label" style={{ color: 'var(--error)' }}>
          Logout
        </span>
      </button>
    </nav>
  );
}
