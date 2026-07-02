import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import './scheduler.css';
import { ReminderProvider, useReminders } from './context/ReminderContext';
import ReminderDashboard from './components/ReminderDashboard';
import ReminderForm from './components/ReminderForm';
import NotificationHistory from './components/NotificationHistory';
import Notifications from './components/Notifications';

function Navigation() {
  const { unreadNotifications } = useReminders();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/task/scheduler') {
      return location.pathname === '/task/scheduler' || location.pathname === '/task/scheduler/';
    }
    return location.pathname === path;
  };

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-glass)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)',
      marginBottom: '20px',
      borderRadius: '12px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
      }}>
        {/* Brand/Logo */}
        <Link to="/task/scheduler" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-primary)' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Remindify
            </span>
            <span style={{ 
              display: 'block', 
              fontSize: '0.675rem', 
              fontWeight: 700, 
              color: 'var(--primary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              lineHeight: 1,
              marginTop: '1px'
            }}>
              Scheduler Engine v1.0
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <Link
            to="/task/scheduler"
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: isActive('/task/scheduler') ? '#ffffff' : 'transparent',
              color: isActive('/task/scheduler') ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isActive('/task/scheduler') ? '0 2px 8px rgba(15, 23, 42, 0.05)' : 'none',
              border: isActive('/task/scheduler') ? '1px solid var(--border-glass)' : '1px solid transparent',
              borderRadius: '8px',
              transition: 'all var(--transition-fast)'
            }}
          >
            Dashboard
          </Link>
          
          <Link
            to="/task/scheduler/history"
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: isActive('/task/scheduler/history') ? '#ffffff' : 'transparent',
              color: isActive('/task/scheduler/history') ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isActive('/task/scheduler/history') ? '0 2px 8px rgba(15, 23, 42, 0.05)' : 'none',
              border: isActive('/task/scheduler/history') ? '1px solid var(--border-glass)' : '1px solid transparent',
              borderRadius: '8px',
              transition: 'all var(--transition-fast)'
            }}
          >
            History Logs
          </Link>

          <Link
            to="/task/scheduler/notifications"
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: isActive('/task/scheduler/notifications') ? '#ffffff' : 'transparent',
              color: isActive('/task/scheduler/notifications') ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isActive('/task/scheduler/notifications') ? '0 2px 8px rgba(15, 23, 42, 0.05)' : 'none',
              border: isActive('/task/scheduler/notifications') ? '1px solid var(--border-glass)' : '1px solid transparent',
              borderRadius: '8px',
              position: 'relative',
              transition: 'all var(--transition-fast)'
            }}
          >
            Notifications
            {unreadNotifications.length > 0 && (
              <span className="fade-in" style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: 'white',
                fontSize: '0.625rem',
                fontWeight: 'bold',
                height: '18px',
                minWidth: '18px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                animation: 'pulse-glow 2s infinite'
              }}>
                {unreadNotifications.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

// Scheduler Plugin - Integrated into SF as /task/scheduler/* routes
export default function SchedulerApp() {
  return (
    <ReminderProvider>
      <div className="scheduler-app" style={{ padding: '24px', minHeight: '100vh' }}>
        <Navigation />
        <Routes>
          <Route index element={<ReminderDashboard />} />
          <Route path="create" element={<ReminderForm />} />
          <Route path="edit/:id" element={<ReminderForm />} />
          <Route path="history" element={<NotificationHistory />} />
          <Route path="notifications" element={<Notifications />} />
        </Routes>
      </div>
    </ReminderProvider>
  );
}

