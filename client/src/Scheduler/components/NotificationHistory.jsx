import React, { useState, useEffect } from 'react';
import { useReminders } from '../context/ReminderContext';
import { Link } from 'react-router-dom';

export default function NotificationHistory() {
  const { 
    notificationHistory, 
    notificationHistoryPagination, 
    fetchNotificationHistory 
  } = useReminders();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search input to avoid hammering the backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
      setCurrentPage(1); // Reset to page 1 on search change
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1); // Reset to page 1 on status change
  };

  useEffect(() => {
    fetchNotificationHistory({ status: statusFilter, search: searchTerm, page: currentPage, limit });
  }, [statusFilter, searchTerm, currentPage, limit, fetchNotificationHistory]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered': return 'badge-completed';
      case 'sent': return 'badge-pending';
      case 'failed': return 'badge-overdue';
      default: return 'badge-cancelled';
    }
  };

  const getChannelBadge = (channel) => {
    const channelColors = {
      whatsapp: { bg: 'rgba(16, 185, 129, 0.08)', text: '#10b981', border: '1px solid rgba(16, 185, 129, 0.16)' },
      email: { bg: 'rgba(37, 99, 235, 0.08)', text: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.16)' },
      inapp: { bg: 'rgba(79, 70, 229, 0.08)', text: '#4f46e5', border: '1px solid rgba(79, 70, 229, 0.16)' }
    };

    const style = channelColors[channel.toLowerCase()] || { bg: '#f1f5f9', text: 'var(--text-secondary)' };

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        fontSize: '0.725rem',
        fontWeight: '800',
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style
      }}>
        {channel}
      </span>
    );
  };

  return (
    <div className="fade-in">
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Notification Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Complete real-time audit logs of dispatched and queued reminder notifications.
          </p>
        </div>
        <Link to="/task/scheduler/" className="btn btn-secondary" style={{ padding: '10px 18px' }}>
          Back to Dashboard
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card" style={{ 
        padding: '16px 24px', 
        marginBottom: '24px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        
        {/* Status filters */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
          {['all', 'delivered', 'sent', 'failed', 'pending'].map((filter) => (
            <button
              key={filter}
              onClick={() => handleStatusFilterChange(filter)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: statusFilter === filter ? '#ffffff' : 'transparent',
                color: statusFilter === filter ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: statusFilter === filter ? 'var(--shadow-sm)' : 'none',
                border: statusFilter === filter ? '1px solid var(--border-glass)' : '1px solid transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '340px', maxWidth: '100%' }}>
          <input
            type="text"
            placeholder="Search logs by employee or title..."
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

      {/* Logs Table */}
      <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '16px' }}>
        {notificationHistory.length === 0 ? (
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
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>No Audit Logs Found</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 0' }}>
              Logs will populate automatically as the background daemon triggers active reminder schedules.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reminder Source</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Channel</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message Body Content</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatch Timestamp</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {notificationHistory.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background var(--transition-fast)' }} className="table-row">
                    
                    {/* Employee */}
                    <td style={{ padding: '18px 20px' }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{log.employee_name}</p>
                    </td>

                    {/* Title */}
                    <td style={{ padding: '18px 20px' }}>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{log.reminder_title}</p>
                    </td>

                    {/* Channel */}
                    <td style={{ padding: '18px 20px' }}>
                      {getChannelBadge(log.channel_type)}
                    </td>

                    {/* Message Preview */}
                    <td style={{ padding: '18px 20px', maxWidth: '340px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                        {log.channel_type === 'email' ? '📧 Email' : log.channel_type === 'whatsapp' ? '💬 WhatsApp' : '🔔 In-App'} notification{' '}
                        {log.delivery_status === 'delivered' ? 'sent successfully' : log.delivery_status === 'failed' ? 'failed to send' : 'is ' + log.delivery_status}{' '}
                        to {log.employee_name} for '{log.reminder_title}'
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', margin: '4px 0 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        Preview: "{log.message_body}"
                      </p>
                    </td>

                    {/* Dispatched Time */}
                    <td style={{ padding: '18px 20px', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : (log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A')}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '18px 20px' }}>
                      <div>
                        <span className={`badge ${getStatusBadge(log.delivery_status)}`}>
                          {log.delivery_status}
                        </span>
                        {log.failure_reason && (
                          <p style={{ fontSize: '0.725rem', color: 'var(--danger)', marginTop: '4px', maxWidth: '180px', fontWeight: 600 }}>
                            Reason: {log.failure_reason}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination Controls ── */}
      {notificationHistoryPagination && notificationHistoryPagination.totalCount > 0 && (
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
            Showing page <span style={{ color: 'var(--text-primary)' }}>{notificationHistoryPagination.currentPage}</span> of <span style={{ color: 'var(--text-primary)' }}>{notificationHistoryPagination.totalPages || 1}</span> ({notificationHistoryPagination.totalCount} total logs)
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={notificationHistoryPagination.currentPage === 1}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: notificationHistoryPagination.currentPage === 1 ? 0.5 : 1, cursor: notificationHistoryPagination.currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            
            {Array.from({ length: notificationHistoryPagination.totalPages || 1 }, (_, i) => i + 1)
              .filter(p => p === 1 || p === notificationHistoryPagination.totalPages || Math.abs(p - notificationHistoryPagination.currentPage) <= 2)
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
                      background: notificationHistoryPagination.currentPage === pageNo ? 'var(--primary)' : 'transparent',
                      color: notificationHistoryPagination.currentPage === pageNo ? '#ffffff' : 'var(--text-secondary)',
                      border: notificationHistoryPagination.currentPage === pageNo ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {pageNo}
                  </button>
                );
                return elements;
              })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, notificationHistoryPagination.totalPages || 1))}
              disabled={notificationHistoryPagination.currentPage === (notificationHistoryPagination.totalPages || 1)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: notificationHistoryPagination.currentPage === (notificationHistoryPagination.totalPages || 1) ? 0.5 : 1, cursor: notificationHistoryPagination.currentPage === (notificationHistoryPagination.totalPages || 1) ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
