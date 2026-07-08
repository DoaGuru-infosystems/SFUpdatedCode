import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ReminderContext = createContext(null);

const API_BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/scheduler`;

export const ReminderProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [remindersPagination, setRemindersPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, overdue: 0 });
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [notificationHistoryPagination, setNotificationHistoryPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch Employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/employees`);
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees');
    }
  }, []);

  // 2. Fetch Reminders (with optional filters)
  const fetchReminders = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const { status, search, page = 1, limit = 10, startDate, endDate } = filters;
      const params = {};
      if (status) params.status = status;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.page = page;
      params.limit = limit;

      const response = await axios.get(`${API_BASE}/reminders`, { params });
      if (response.data && response.data.pagination) {
        setReminders(response.data.data);
        setRemindersPagination(response.data.pagination);
      } else {
        setReminders(response.data);
        setRemindersPagination({
          totalCount: response.data.length,
          totalPages: 1,
          currentPage: 1,
          limit: response.data.length || 10
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Fetch Statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/reminders/stats`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const getLoggedInUser = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) return JSON.parse(userStr);
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // 4. Fetch Unread Notifications
  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const user = getLoggedInUser();
      const params = {};
      if (user && user.role !== 'admin') {
        params.employee_id = user.id;
      }
      const response = await axios.get(`${API_BASE}/notifications/unread`, { params });
      setUnreadNotifications(response.data);
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
    }
  }, []);

  // 5. Fetch Notification History
  const fetchNotificationHistory = useCallback(async (filters = {}) => {
    try {
      const { status, search, page = 1, limit = 10 } = filters;
      const user = getLoggedInUser();
      const params = {};
      if (user && user.role !== 'admin') {
        params.employee_id = user.id;
      }
      if (status) params.status = status;
      if (search) params.search = search;
      params.page = page;
      params.limit = limit;

      const response = await axios.get(`${API_BASE}/notifications/history`, { params });
      if (response.data && response.data.pagination) {
        setNotificationHistory(response.data.data);
        setNotificationHistoryPagination(response.data.pagination);
      } else {
        setNotificationHistory(response.data);
        setNotificationHistoryPagination({
          totalCount: response.data.length,
          totalPages: 1,
          currentPage: 1,
          limit: response.data.length || 10
        });
      }
    } catch (err) {
      console.error('Error fetching notification history:', err);
    }
  }, []);

  // 6. Create Reminder
  const createReminder = async (reminderData) => {
    try {
      const response = await axios.post(`${API_BASE}/reminders`, reminderData);
      await refreshAll();
      return response.data;
    } catch (err) {
      console.error('Error creating reminder:', err);
      throw err.response?.data || { message: 'Failed to create reminder' };
    }
  };

  // 7. Update Reminder
  const updateReminder = async (id, reminderData) => {
    try {
      const response = await axios.put(`${API_BASE}/reminders/${id}`, reminderData);
      await refreshAll();
      return response.data;
    } catch (err) {
      console.error('Error updating reminder:', err);
      throw err.response?.data || { message: 'Failed to update reminder' };
    }
  };

  // 8. Delete Reminder
  const deleteReminder = async (id) => {
    try {
      await axios.delete(`${API_BASE}/reminders/${id}`);
      await refreshAll();
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder');
      throw err;
    }
  };

  // 9. Mark Reminder as Complete
  const completeReminder = async (id) => {
    try {
      await axios.patch(`${API_BASE}/reminders/${id}/complete`);
      await refreshAll();
    } catch (err) {
      console.error('Error completing reminder:', err);
      setError('Failed to complete reminder');
      throw err;
    }
  };

  const triggerReminder = async (id) => {
    try {
      await axios.post(`${API_BASE}/reminders/${id}/trigger`);
      await refreshAll();
    } catch (err) {
      console.error('Error triggering reminder:', err);
      setError('Failed to trigger reminder');
      throw err;
    }
  };

  const testWhatsAppConnection = async (phoneNumber) => {
    try {
      const response = await axios.post(`${API_BASE}/test-whatsapp`, { phone_number: phoneNumber });
      return response.data;
    } catch (err) {
      console.error('Error testing WhatsApp connection:', err);
      throw err.response?.data || { message: 'Failed to send test WhatsApp message' };
    }
  };

  // 10. Mark Notification as Read
  const markNotifRead = async (id) => {
    try {
      await axios.patch(`${API_BASE}/notifications/${id}/read`);
      await fetchUnreadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // 11. Mark All Notifications as Read
  const markAllNotifsRead = async () => {
    try {
      const user = getLoggedInUser();
      let url = `${API_BASE}/notifications/mark-all-read`;
      if (user && user.role !== 'admin') {
        url += `?employee_id=${user.id}`;
      }
      await axios.patch(url);
      await fetchUnreadNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Bulk refresh
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchReminders(),
      fetchStats(),
      fetchUnreadNotifications(),
      fetchEmployees()
    ]);
  }, [fetchReminders, fetchStats, fetchUnreadNotifications, fetchEmployees]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <ReminderContext.Provider
      value={{
        employees,
        reminders,
        remindersPagination,
        stats,
        unreadNotifications,
        notificationHistory,
        notificationHistoryPagination,
        loading,
        error,
        fetchEmployees,
        fetchReminders,
        fetchStats,
        fetchUnreadNotifications,
        fetchNotificationHistory,
        createReminder,
        updateReminder,
        deleteReminder,
        completeReminder,
        triggerReminder,
        testWhatsAppConnection,
        markNotifRead,
        markAllNotifsRead,
        refreshAll
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};
