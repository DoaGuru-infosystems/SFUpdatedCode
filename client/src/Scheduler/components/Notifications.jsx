import React, { useEffect } from 'react';
import { useReminders } from '../context/ReminderContext';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import '../scheduler.css';

export default function Notifications() {
  const { unreadNotifications, fetchUnreadNotifications, markNotifRead, markAllNotifsRead } = useReminders();

  const userStr = localStorage.getItem("user");
  const loggedInUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = loggedInUser?.role === 'admin';

  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    const socket = io(window.location.host === 'localhost:3000' ? "http://localhost:8080" : "/", {
      transports: ["polling", "websocket"],
      withCredentials: true
    });

    socket.on("new-scheduler-notification", (notif) => {
      if (loggedInUser && (isAdmin || notif.employee_id === loggedInUser.id)) {
        fetchUnreadNotifications();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchUnreadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotifRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotifsRead();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '12px 0', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            In-App Notification Feed
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Active alerts and system notifications dispatched to you in real-time.
          </p>
        </div>

        {unreadNotifications.length > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary" style={{ fontSize: '0.825rem', padding: '8px 16px' }}>
            Mark All Read
          </button>
        )}
      </div>

      {/* Feed list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {unreadNotifications.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{
              padding: '16px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.08)',
              color: 'var(--secondary)',
              display: 'inline-flex',
              marginBottom: '16px'
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Your feed is clean!</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>You have 0 unread alerts at this moment.</p>
            {isAdmin && (
              <div style={{ marginTop: '20px' }}>
                <Link to="/task/scheduler/history" className="btn btn-secondary" style={{ fontSize: '0.825rem', padding: '10px 18px' }}>
                  View Sent History Logs
                </Link>
              </div>
            )}
          </div>
        ) : (
          unreadNotifications.map((notif) => (
            <div
              key={notif.id}
              className="glass-card fade-in"
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '20px',
                borderLeft: '4px solid var(--primary)',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(79, 70, 229, 0.01) 100%)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    boxShadow: '0 0 8px var(--primary)'
                  }}></span>
                  <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {notif.reminder_title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    • {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                  {isAdmin ? (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {notif.channel_type === 'email' ? '📧 Email' : notif.channel_type === 'whatsapp' ? '💬 WhatsApp' : '🔔 In-App'} notification{' '}
                        <span style={{ color: notif.delivery_status === 'delivered' ? '#10b981' : '#ef4444' }}>
                          {notif.delivery_status === 'delivered' ? 'sent successfully' : 'failed to send'}
                        </span>{' '}
                        to {notif.employee_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                        Preview: "{notif.message_body}"
                      </div>
                    </div>
                  ) : (
                    notif.message_body
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Recipient:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{notif.employee_name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Channel:</span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--primary)',
                    background: 'var(--primary-glow)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    border: '1px solid rgba(79, 70, 229, 0.15)'
                  }}>{notif.channel_type}</span>
                </div>
              </div>

              <button
                onClick={() => handleMarkRead(notif.id)}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                title="Mark Read"
              >
                Mark Read
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
