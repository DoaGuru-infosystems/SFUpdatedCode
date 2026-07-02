import React, { useState, useEffect } from 'react';
import { useReminders } from '../context/ReminderContext';
import { Link } from 'react-router-dom';

export default function ReminderDashboard() {
  const {
    reminders,
    remindersPagination,
    stats,
    loading,
    error,
    fetchReminders,
    fetchStats,
    completeReminder,
    deleteReminder,
    triggerReminder,
    testWhatsAppConnection
  } = useReminders();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input to avoid hammering the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleSendTestWhatsApp = async () => {
    if (!testPhone) {
      alert('Please enter a valid phone number');
      return;
    }
    setTestLoading(true);
    try {
      const res = await testWhatsAppConnection(testPhone);
      alert('✅ SUCCESS: ' + (res.message || 'Test message triggered! Check your WhatsApp.'));
    } catch (err) {
      const errMsg = err.error?.message || err.message || JSON.stringify(err);
      alert('❌ FAILED: ' + errMsg);
    } finally {
      setTestLoading(false);
    }
  };

  // Refresh lists on search/tab/page/date changes
  useEffect(() => {
    fetchReminders({ 
      status: activeTab, 
      search: searchTerm, 
      page: currentPage, 
      limit, 
      startDate, 
      endDate 
    });
    fetchStats();
  }, [activeTab, searchTerm, currentPage, limit, startDate, endDate, fetchReminders, fetchStats]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset page on tab change
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await deleteReminder(id);
      } catch (err) {
        alert('Failed to delete reminder');
      }
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await completeReminder(id);
    } catch (err) {
      alert('Failed to complete reminder');
    }
  };

  const handleTrigger = async (id) => {
    try {
      await triggerReminder(id);
      alert('⚡ Dispatch Triggered! Notifications sent successfully via In-App Feed, Email, and WhatsApp.');
    } catch (err) {
      alert('Failed to trigger notification: ' + err.message);
    }
  };

  // Helper for delivery method labels
  const getDeliveryLabel = (method) => {
    const labels = {
      whatsapp_only: 'WhatsApp',
      email_only: 'Email',
      whatsapp_email: 'WhatsApp & Email',
      inapp_only: 'In-App Alert',
      inapp_whatsapp: 'In-App & WhatsApp',
      inapp_email: 'In-App & Email',
      all_channels: 'All Channels'
    };
    return labels[method] || method;
  };

  // Helper for repeat type labels
  const getRepeatLabel = (type) => {
    const labels = {
      none: 'One-time',
      hourly: 'Hourly',
      daily: 'Daily Sync',
      alternate_days: 'Every 2 Days',
      weekly: 'Weekly Standup',
      monthly: 'Monthly Report',
      custom: 'Custom Recurrence',
      never_ends: 'Continuous'
    };
    return labels[type] || type;
  };

  // Helper to determine badge color class
  const getStatusBadgeClass = (status, date, time) => {
    if (status === 'completed') return 'badge-completed';
    if (status === 'cancelled') return 'badge-cancelled';
    
    // Check if overdue
    const scheduled = new Date(`${date.split('T')[0]}T${time}`);
    if (scheduled < new Date()) {
      return 'badge-overdue';
    }
    return 'badge-pending';
  };

  const getStatusLabel = (status, date, time) => {
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    const scheduled = new Date(`${date.split('T')[0]}T${time}`);
    if (scheduled < new Date()) {
      return 'Overdue';
    }
    return 'Pending';
  };

  return (
    <div className="fade-in">
      
      {/* ── Top Header ────────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '20px', 
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Reminder Engine Control
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Manage notification distribution models, trigger rules, and scheduled logs.
          </p>
        </div>
        <Link to="/task/scheduler/create" className="btn btn-primary" style={{ padding: '12px 22px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 4v16m8-8H4"/>
          </svg>
          New Schedule Rule
        </Link>
      </div>

      {/* ── Statistics Cards ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        
        {/* Card 1 */}
        <div className="glass-card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(79, 70, 229, 0.02) 100%)'
        }}>
          <div style={{ 
            padding: '12px', 
            borderRadius: '12px', 
            background: 'rgba(79, 70, 229, 0.08)', 
            color: 'var(--primary)',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.05)'
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Reminders</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1 }}>
              {stats.total}
            </h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{ 
            padding: '12px', 
            borderRadius: '12px', 
            background: 'rgba(16, 185, 129, 0.08)', 
            color: 'var(--secondary)',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)'
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Upcoming Alerts</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1 }}>
              {stats.upcoming}
            </h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(37, 99, 235, 0.02) 100%)'
        }}>
          <div style={{ 
            padding: '12px', 
            borderRadius: '12px', 
            background: 'rgba(37, 99, 235, 0.08)', 
            color: 'var(--info)',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)'
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1 }}>
              {stats.completed}
            </h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card" style={{ 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(239, 68, 68, 0.02) 100%)'
        }}>
          <div style={{ 
            padding: '12px', 
            borderRadius: '12px', 
            background: 'rgba(239, 68, 68, 0.08)', 
            color: 'var(--danger)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
          }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overdue Runs</p>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1 }}>
              {stats.overdue}
            </h3>
          </div>
        </div>

      </div>

      {/* ── WhatsApp Tester Panel ── */}
      <div className="glass-card" style={{ 
        padding: '24px', 
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              WhatsApp API Connection Tester
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
              Verify your WhatsApp Meta Cloud API configuration by sending a test message instantly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter WhatsApp Number (e.g. 919806324244)"
              className="form-input"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              style={{
                width: '320px',
                padding: '10px 16px',
                fontSize: '0.875rem',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            />
            <button
              onClick={handleSendTestWhatsApp}
              disabled={testLoading}
              className="btn btn-primary"
              style={{
                padding: '10px 20px',
                background: '#10b981',
                borderColor: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {testLoading ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Sending...
                </>
              ) : (
                'Send Test Message'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="glass-card" style={{ 
        padding: '16px 24px', 
        marginBottom: '24px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          {['all', 'today', 'upcoming', 'completed', 'overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: activeTab === tab ? '#ffffff' : 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none',
                border: activeTab === tab ? '1px solid var(--border-glass)' : '1px solid transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>From:</span>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                width: '135px'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To:</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                width: '135px'
              }}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              style={{
                background: '#fee2e2',
                border: 'none',
                color: '#ef4444',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search triggers by title..."
            className="form-input"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={{ 
              paddingLeft: '40px', 
              paddingRight: '16px', 
              paddingTop: '10px', 
              paddingBottom: '10px', 
              fontSize: '0.875rem',
              borderRadius: '10px'
            }}
          />
          <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>

      </div>

      {/* ── Reminders List Table ── */}
      <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '16px' }}>
        {loading ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              border: '3px solid var(--border-glass)', 
              borderTopColor: 'var(--primary)', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite', 
              margin: '0 auto 16px' 
            }} />
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Fetching reminder rules...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--danger)' }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '12px' }}>
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p style={{ fontWeight: 700 }}>Connection Error</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>{error}</p>
          </div>
        ) : reminders.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ 
              padding: '16px', 
              borderRadius: '50%', 
              background: 'rgba(79, 70, 229, 0.05)', 
              color: 'var(--primary)', 
              display: 'inline-flex',
              marginBottom: '16px' 
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>No Active Reminders</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 0' }}>
              We couldn't find any reminder schedules matching your filter. Try adjusting your parameters or create a new scheduler rule.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reminder Title / Goal</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channels</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((rem) => {
                  const badgeClass = getStatusBadgeClass(rem.status, rem.reminder_date, rem.reminder_time);
                  const displayStatus = getStatusLabel(rem.status, rem.reminder_date, rem.reminder_time);
                  
                  let assigneeText = '';
                  let assigneeSub = '';
                  if (rem.assignment_type === 'self') {
                    assigneeText = 'Self Reminder';
                    assigneeSub = 'Admin account';
                  } else if (rem.assignment_type === 'single') {
                    assigneeText = rem.employee_name || 'Unassigned';
                    assigneeSub = 'Single Employee';
                  } else if (rem.assignment_type === 'multiple') {
                    assigneeText = rem.assigned_employees ? `${rem.assigned_employees.length} Employees` : 'Multiple';
                    assigneeSub = 'Custom Distribution';
                  } else if (rem.assignment_type === 'team') {
                    assigneeText = 'Full Team';
                    assigneeSub = 'All active staff';
                  }

                  return (
                    <tr key={rem.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background var(--transition-fast)' }} className="table-row">
                      
                      {/* Assignment */}
                      <td style={{ padding: '18px 20px' }}>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{assigneeText}</p>
                          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 500 }}>
                            {assigneeSub}
                          </p>
                        </div>
                      </td>

                      {/* Title */}
                      <td style={{ padding: '18px 20px' }}>
                        <div style={{ maxWidth: '280px' }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {rem.title}
                          </p>
                          {rem.note && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {rem.note}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '18px 20px' }}>
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {new Date(rem.reminder_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 500 }}>
                            at {rem.reminder_time.slice(0, 5)}
                          </p>
                        </div>
                      </td>

                      {/* Repeat */}
                      <td style={{ padding: '18px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {getRepeatLabel(rem.repeat_type)}
                      </td>

                      {/* Delivery */}
                      <td style={{ padding: '18px 20px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5">
                            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                          </svg>
                          {getDeliveryLabel(rem.delivery_method)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '18px 20px' }}>
                        <span className={`badge ${badgeClass}`}>{displayStatus}</span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleTrigger(rem.id)}
                            className="btn btn-secondary"
                            title="Trigger Test Dispatch"
                            style={{ padding: '6px 10px', borderRadius: '8px' }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5">
                              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                          </button>
                          {rem.status === 'pending' && (
                            <button
                              onClick={() => handleMarkComplete(rem.id)}
                              className="btn btn-secondary"
                              title="Mark Complete"
                              style={{ padding: '6px 10px', borderRadius: '8px' }}
                            >
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth="3">
                                <path d="M5 13l4 4L19 7"/>
                              </svg>
                            </button>
                          )}
                          <Link
                            to={`/task/scheduler/edit/${rem.id}`}
                            className="btn btn-secondary"
                            title="Edit Reminder"
                            style={{ padding: '6px 10px', borderRadius: '8px' }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(rem.id)}
                            className="btn btn-secondary"
                            title="Delete"
                            style={{ padding: '6px 10px', borderRadius: '8px' }}
                          >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth="2">
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination Controls ── */}
      {remindersPagination && remindersPagination.totalCount > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.4)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          backdropFilter: 'blur(8px)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Show</span>
            <select
              value={limit}
              onChange={(e) => { setLimit(parseInt(e.target.value)); setCurrentPage(1); }}
              className="form-input"
              style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px', width: '80px', border: '1px solid var(--border-glass)', background: '#ffffff' }}
            >
              {[5, 10, 25, 50].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>entries</span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing page <span style={{ color: 'var(--text-primary)' }}>{remindersPagination.currentPage}</span> of <span style={{ color: 'var(--text-primary)' }}>{remindersPagination.totalPages || 1}</span> ({remindersPagination.totalCount} total records)
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={remindersPagination.currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: remindersPagination.currentPage === 1 ? 0.5 : 1, cursor: remindersPagination.currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            
            {Array.from({ length: remindersPagination.totalPages || 1 }, (_, i) => i + 1)
              .filter(p => p === 1 || p === remindersPagination.totalPages || Math.abs(p - remindersPagination.currentPage) <= 2)
              .map((pageNo, idx, arr) => {
                const elements = [];
                if (idx > 0 && pageNo - arr[idx - 1] > 1) {
                  elements.push(<span key={`ellipsis-${pageNo}`} style={{ color: 'var(--text-muted)', padding: '0 4px', alignSelf: 'center' }}>...</span>);
                }
                elements.push(
                  <button
                    key={pageNo}
                    onClick={() => setCurrentPage(pageNo)}
                    className="btn"
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      borderRadius: '8px',
                      background: remindersPagination.currentPage === pageNo ? 'var(--primary)' : 'transparent',
                      color: remindersPagination.currentPage === pageNo ? '#ffffff' : 'var(--text-secondary)',
                      border: remindersPagination.currentPage === pageNo ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {pageNo}
                  </button>
                );
                return elements;
              })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, remindersPagination.totalPages || 1))}
              disabled={remindersPagination.currentPage === (remindersPagination.totalPages || 1)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: remindersPagination.currentPage === (remindersPagination.totalPages || 1) ? 0.5 : 1, cursor: remindersPagination.currentPage === (remindersPagination.totalPages || 1) ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
