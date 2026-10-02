import Link from "next/link";

export default function AccountLayout({ children }) {
  return (
    <div className="account-layout">
      <header className="account-header">
        <Link className="brand" href="/" aria-label="Utshob home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>utshob</span>
        </Link>
        <Link className="account-back" href="/">Back to events <span aria-hidden="true">&#8599;</span></Link>
      </header>
      {children}
      <footer className="account-footer">
        <span>Utshob</span>
        <span>Make room for a good time.</span>
      </footer>
    </div>
  );
}