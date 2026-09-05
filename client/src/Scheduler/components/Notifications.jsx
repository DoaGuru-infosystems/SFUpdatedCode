import React, { useEffect, useState } from 'react';
import { useReminders } from '../context/ReminderContext';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import '../scheduler.css';

const API_BASE = "https://sf.doaguru.com";

const parseNotificationBody = (messageBody) => {
  if (!messageBody) return null;
  // 1. Digital Marketing / SEO targets
  // Example: "Team Leader Anas Shah has assigned you a new task: Project sf - Targets: Post 10, Video 5, Shoot 2 for 7/2026 - Note: some notes."
  const targetRegex = /Team Leader (.*?) has assigned you a new task:\s*Project\s*(.*?)\s*-\s*Targets:\s*Post\s*(\d+),\s*Video\s*(\d+),\s*Shoot\s*(\d+)\s*for\s*(.*?)(?:\s*-\s*Note:\s*(.*))?$/i;
  
  // Also support "Admin has assigned you a new task: ..." or generic structures
  const genericTargetRegex = /(Team Leader|Admin|.*?)\s+(?:has\s+)?assigned\s+you\s+a\s+new\s+task:\s*Project\s*(.*?)\s*-\s*Targets:\s*Post\s*(\d+),\s*Video\s*(\d+),\s*Shoot\s*(\d+)\s*for\s*(.*?)(?:\s*-\s*Note:\s*(.*))?$/i;
  
  const match = messageBody.match(targetRegex) || messageBody.match(genericTargetRegex);
  if (match) {
    return {
      type: 'target',
      assignedBy: match[1].trim(),
      projectName: match[2].trim(),
      postCount: parseInt(match[3], 10),
      videoCount: parseInt(match[4], 10),
      shootCount: parseInt(match[5], 10),
      period: match[6].trim().replace(/\.$/, ''),
      note: match[7] ? match[7].trim().replace(/\.$/, '') : null
    };
  }

  // 2. Development tasks
  // Example: "Team Leader Anas Shah has assigned you a new task: Project: sf - Task: Complete landing page - Note: some notes."
  const devRegex = /Team Leader (.*?) has assigned you a new task:\s*Project:\s*(.*?)\s*-\s*Task:\s*(.*?)(?:\s*-\s*Note:\s*(.*))?$/i;
  const genericDevRegex = /(Team Leader|Admin|.*?)\s+(?:has\s+)?assigned\s+you\s+a\s+new\s+task:\s*Project:\s*(.*?)\s*-\s*Task:\s*(.*?)(?:\s*-\s*Note:\s*(.*))?$/i;
  
  const matchDev = messageBody.match(devRegex) || messageBody.match(genericDevRegex);
  if (matchDev) {
    return {
      type: 'dev',
      assignedBy: matchDev[1].trim(),
      projectName: matchDev[2].trim(),
      description: matchDev[3].trim().replace(/\.$/, ''),
      note: matchDev[4] ? matchDev[4].trim().replace(/\.$/, '') : null
    };
  }

  return null;
};

const formatPeriod = (periodStr) => {
  if (!periodStr) return '';
  const parts = periodStr.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parts[1];
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (month >= 1 && month <= 12) {
      return `${monthNames[month - 1]} ${year}`;
    }
  }
  return periodStr;
};

const findTargetNote = (projectName, periodStr, employeeTargets) => {
  if (!periodStr || !projectName || !employeeTargets || employeeTargets.length === 0) return null;
  const parts = periodStr.split('/');
  if (parts.length !== 2) return null;
  const targetMonth = parseInt(parts[0], 10);
  const targetYear = parseInt(parts[1], 10);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const targetMonthName = monthNames[targetMonth - 1] || "";

  const match = employeeTargets.find(t => {
    const pNameMatch = t.projectName && t.projectName.trim().toLowerCase() === projectName.trim().toLowerCase();
    
    let monthMatch = false;
    if (t.month) {
      const tMonthStr = String(t.month).trim().toLowerCase();
      monthMatch = tMonthStr === String(targetMonth) || 
                   tMonthStr === targetMonthName.toLowerCase() ||
                   tMonthStr === `0${targetMonth}`;
    }

    const yearMatch = t.year && parseInt(t.year, 10) === targetYear;

    return pNameMatch && monthMatch && yearMatch;
  });

  return match ? match.note : null;
};

const renderTargetNotificationCard = (notif, handleMarkRead, employeeTargets = []) => {
  const parsed = parseNotificationBody(notif.message_body);
  if (!parsed || parsed.type !== 'target') return null;

  const formattedPeriod = formatPeriod(parsed.period);
  const formattedDate = new Date(notif.created_at).toLocaleString();
  const displayNote = parsed.note || findTargetNote(parsed.projectName, parsed.period, employeeTargets);

  return (
    <div
      key={notif.id}
      className="fade-in"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #6366f1',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }}></span>
          <h4 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
            Target Assigned: {parsed.projectName}
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({formattedPeriod})</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formattedDate}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#374151', flex: 1 }}>
          <span><strong>By:</strong> {parsed.assignedBy}</span>
          <span style={{ color: '#d1d5db' }}>|</span>
          <span style={{ display: 'flex', gap: '12px', fontWeight: 500 }}>
             <span>P: {parsed.postCount}</span>
             <span>V: {parsed.videoCount}</span>
             <span>S: {parsed.shootCount}</span>
          </span>
          {displayNote && (
            <>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span style={{ color: '#6b7280', fontStyle: 'italic', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={displayNote}>Note: {displayNote}</span>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/task/AssignProjectTarget-Details"
            style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
          >
            View & Submit &rarr;
          </Link>
          <button
            onClick={() => handleMarkRead(notif.id)}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', color: '#374151', cursor: 'pointer' }}
          >
            Mark Read
          </button>
        </div>
      </div>
    </div>
  );
};

const renderDevNotificationCard = (notif, handleMarkRead) => {
  const parsed = parseNotificationBody(notif.message_body);
  if (!parsed || parsed.type !== 'dev') return null;

  const formattedDate = new Date(notif.created_at).toLocaleString();

  return (
    <div
      key={notif.id}
      className="fade-in"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #6366f1',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }}></span>
          <h4 style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
            Dev Task: {parsed.projectName}
          </h4>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formattedDate}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#374151', flex: 1 }}>
          <span><strong>By:</strong> {parsed.assignedBy}</span>
          <span style={{ color: '#d1d5db' }}>|</span>
          <span style={{ color: '#374151', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={parsed.description}><strong>Task:</strong> {parsed.description}</span>
          {parsed.note && (
            <>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span style={{ color: '#6b7280', fontStyle: 'italic', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={parsed.note}>Note: {parsed.note}</span>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/task/check-assigned-development-task"
            style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}
          >
            View Task &rarr;
          </Link>
          <button
            onClick={() => handleMarkRead(notif.id)}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', color: '#374151', cursor: 'pointer' }}
          >
            Mark Read
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusBadgeStyle = (status) => {
  const s = status ? status.toLowerCase().replace(/\.$/, '').trim() : '';
  let bg = '#e5e7eb';
  let color = '#374151';
  if (s === 'completed') {
    bg = '#d1fae5';
    color = '#065f46';
  } else if (s === 'in progress') {
    bg = '#fef3c7';
    color = '#92400e';
  } else if (s === 'in pipeline') {
    bg = '#e0f2fe';
    color = '#0369a1';
  } else if (s === 'hold') {
    bg = '#fee2e2';
    color = '#991b1b';
  } else if (s === 'pending') {
    bg = '#f3f4f6';
    color = '#374151';
  }
  return {
    backgroundColor: bg,
    color: color,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.725rem',
    fontWeight: 700,
    textTransform: 'capitalize',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1
  };
};

const renderUpdateNotificationCard = (notif, handleMarkRead) => {
  const messageBody = notif.message_body;
  if (!messageBody) return null;

  const targetUpdateRegex = /Employee (.*?) updated monthly targets for project (.*?)\s*\((.*?)\)\s*to:\s*Status:\s*(.*?)(?:\s*-\s*Note:\s*(.*))?$/i;
  const matchTarget = messageBody.match(targetUpdateRegex);

  const devUpdateRegex = /Employee (.*?) updated development task for project (.*?)\s*to:\s*Status:\s*(.*)/i;
  const matchDev = messageBody.match(devUpdateRegex);

  const filledTaskRegex = /Employee (.*?) filled a daily task for project (.*?)\s*-\s*Task:\s*(.*)/i;
  const matchFilled = messageBody.match(filledTaskRegex);

  if (!matchTarget && !matchDev && !matchFilled) return null;

  const formattedDate = new Date(notif.created_at).toLocaleString();

  let employeeName = "";
  let projectName = "";
  let period = "";
  let status = "";
  let note = null;
  let isTarget = false;
  let taskDesc = null;

  if (matchTarget) {
    isTarget = true;
    employeeName = matchTarget[1].trim();
    projectName = matchTarget[2].trim();
    period = formatPeriod(matchTarget[3].trim());
    status = matchTarget[4].trim().replace(/\.$/, '');
    note = matchTarget[5] ? matchTarget[5].trim().replace(/\.$/, '') : null;
  } else if (matchDev) {
    employeeName = matchDev[1].trim();
    projectName = matchDev[2].trim();
    status = matchDev[3].trim().replace(/\.$/, '');
  } else if (matchFilled) {
    employeeName = matchFilled[1].trim();
    projectName = matchFilled[2].trim();
    taskDesc = matchFilled[3].trim().replace(/\.$/, '');
    status = 'Submitted';
  }

  return (
    <div
      key={notif.id}
      className="fade-in"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #10b981',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)'
          }}></span>
          
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.975rem', color: '#111827' }}>
            System Task Update
          </h4>
          
          <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#d1d5db' }}>•</span>
            {formattedDate}
            <span style={{ color: '#d1d5db' }}>|</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', color: '#9ca3af' }}>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span style={{ fontWeight: 500 }}>Recipient: {notif.employee_name}</span>
          </span>
        </div>

        <button
          onClick={() => handleMarkRead(notif.id)}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          style={{
            background: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Mark Read
        </button>
      </div>

      {/* Horizontal Divider Line */}
      <hr style={{ border: 0, borderTop: '1px solid #f3f4f6', margin: 0 }} />

      {/* Content Metadata Row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', fontSize: '0.85rem', color: '#4b5563' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <strong>Employee:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{employeeName}</span>
        </span>

        <span style={{ color: '#e5e7eb' }} className="hidden sm:inline">|</span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <strong>Project:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{projectName}</span>
        </span>

        {isTarget && (
          <>
            <span style={{ color: '#e5e7eb' }} className="hidden sm:inline">|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <strong>Period:</strong> <span style={{ color: '#111827', fontWeight: 600 }}>{period}</span>
            </span>
          </>
        )}

        <span style={{ color: '#e5e7eb' }} className="hidden sm:inline">|</span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <strong>Status:</strong>
          <span style={getStatusBadgeStyle(status)}>{status}</span>
        </span>
      </div>

      {taskDesc && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '4px',
          backgroundColor: '#f3f4f6',
          borderLeft: '4px solid #6366f1',
          fontSize: '0.925rem',
          color: '#374151',
          lineHeight: 1.5,
          marginTop: '6px'
        }}>
          <strong>Task:</strong> {taskDesc}
        </div>
      )}

      {note && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '4px',
          backgroundColor: '#fffbeb',
          borderLeft: '4px solid #f59e0b',
          fontSize: '0.925rem',
          color: '#374151',
          lineHeight: 1.5,
          marginTop: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <strong style={{ color: '#d97706', marginRight: '4px' }}>Note:</strong> "{note}"
        </div>
      )}
    </div>
  );
};

export default function Notifications() {
  const { unreadNotifications, fetchUnreadNotifications, markNotifRead, markAllNotifsRead } = useReminders();

  const userStr = localStorage.getItem("user");
  const loggedInUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = loggedInUser?.role === 'admin';

  const [employeeTargets, setEmployeeTargets] = useState([]);

  useEffect(() => {
    if (loggedInUser && loggedInUser.id) {
      axios.get(`${API_BASE}/api/getEmployeeWiseProjectTarget/${loggedInUser.id}`)
        .then(res => {
          setEmployeeTargets(res.data.data || []);
        })
        .catch(err => console.error("Error fetching employee targets for notes lookup:", err));
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchUnreadNotifications();
  }, [fetchUnreadNotifications]);

  useEffect(() => {
    const socket = io(window.location.host === 'localhost:3000' ? window.API_BASE : "/", {
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
          unreadNotifications.map((notif) => {
            const targetCard = renderTargetNotificationCard(notif, handleMarkRead, employeeTargets);
            if (targetCard) return targetCard;

            const devCard = renderDevNotificationCard(notif, handleMarkRead);
            if (devCard) return devCard;

            const updateCard = renderUpdateNotificationCard(notif, handleMarkRead);
            if (updateCard) return updateCard;

            return (
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
            );
          })
        )}
      </div>

    </div>
  );
}
