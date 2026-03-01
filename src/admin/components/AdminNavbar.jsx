import React from 'react';
import { Link } from 'react-router-dom';
import './AdminNavbar.css';

const AdminNavbar = () => {
  return (
    <nav className="admin-navbar">
      <div className="admin-nav-links">
        <Link to="/admin" className="admin-nav-link">Dashboard</Link>
        <Link to="/admin/users" className="admin-nav-link">Users</Link>
        <Link to="/admin/analytics" className="admin-nav-link">Analytics</Link>
      </div>
      <Link to="/" className="view-site-btn">View Site ✨</Link>
    </nav>
  );
};

export default AdminNavbar;
