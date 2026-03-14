import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

        .footer-root {
          background: rgb(44, 38, 56);
          font-family: 'DM Sans', sans-serif;
          padding: 56px 48px 32px;
          width: 100%;
        }

        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 32px;
          padding-bottom: 40px;
          border-bottom: 0.5px solid rgba(109, 84, 181, 0.3);
        }

        .footer-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: #fff;
          letter-spacing: -0.3px;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgb(109, 84, 181);
          display: inline-block;
          flex-shrink: 0;
        }

        .footer-tagline {
          font-size: 13px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 0.2px;
          margin: 0;
        }

        .footer-nav {
          display: flex;
          gap: 40px;
          flex-wrap: wrap;
          align-items: center;
        }

        .footer-nav a {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          letter-spacing: 0.2px;
          transition: color 0.2s;
          position: relative;
        }

        .footer-nav a::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: rgb(109, 84, 181);
          transition: width 0.25s ease;
        }

        .footer-nav a:hover {
          color: rgba(255, 255, 255, 0.9);
        }

        .footer-nav a:hover::after {
          width: 100%;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 28px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-copy {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.25);
          font-weight: 300;
          margin: 0;
        }

        .footer-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(109, 84, 181, 0.12);
          border: 0.5px solid rgba(109, 84, 181, 0.35);
          border-radius: 20px;
          padding: 5px 12px;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgb(109, 84, 181);
          animation: tmb-pulse 2s infinite;
        }

        .badge-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.3px;
          font-weight: 400;
        }

        @keyframes tmb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }

        @media (max-width: 600px) {
          .footer-root {
            padding: 40px 24px 24px;
          }
          .footer-top {
            flex-direction: column;
            gap: 24px;
          }
          .footer-nav {
            gap: 24px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <footer className="footer-root">

        <div className="footer-top">
          <div className="footer-brand">
            <h2 className="footer-logo">
              <span className="logo-dot" />
              Trust Me Bro
            </h2>
            <p className="footer-tagline">Work smart. Get paid safely.</p>
          </div>

          <nav className="footer-nav">
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How it Works</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </nav>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} Trust Me Bro. All rights reserved.
          </p>
          <div className="footer-badge">
            <span className="badge-dot" />
            <span className="badge-text">Escrow secured</span>
          </div>
        </div>

      </footer>
    </>
  );
}

