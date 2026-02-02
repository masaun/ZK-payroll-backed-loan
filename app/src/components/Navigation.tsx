'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/lend', label: 'Lend' },
    { href: '/borrow', label: 'Borrow' },
    { href: '/credential', label: 'Credentials' },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand" style={{ fontWeight: 700, fontSize: '1.25rem' }}>
          ZK Payroll-Backed Loan
        </Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {navItems.map((item) => (
              <li className="nav-item" key={item.href}>
                <Link 
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  style={{ fontWeight: 500 }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
