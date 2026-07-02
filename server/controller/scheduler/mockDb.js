// Mock Database for Scheduler - fallback when MySQL is unreachable
const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const tomorrowStr = new Date(new Date().setDate(now.getDate() + 1)).toISOString().split('T')[0];
const nextWeekStr = new Date(new Date().setDate(now.getDate() + 7)).toISOString().split('T')[0];
const yesterdayStr = new Date(new Date().setDate(now.getDate() - 1)).toISOString().split('T')[0];

const mockSFEmployees = [
  { id: 1, name: 'Admin User', email: 'hr@doaguru.com', phone_number: '9000000001', department: 'Admin', is_active: 1 },
  { id: 2, name: 'Sales Employee', email: 'sales@doaguru.com', phone_number: '9000000002', department: 'Sales', is_active: 1 },
];

const defaultTemplate = 'Hello {{employee_name}}, this is a reminder for {{title}} scheduled on {{date}} at {{time}}.';

const mockReminders = [
  {
    id: 1, employee_id: 1, assignment_type: 'self',
    title: 'Team Meeting', note: 'Weekly sync',
    reminder_date: tomorrowStr, reminder_time: '10:00:00',
    repeat_type: 'none', custom_repeat_data: null,
    remind_before: '10_minutes', custom_remind_minutes: null,
    delivery_method: 'inapp_only', message_template: defaultTemplate,
    dnd_enabled: 0, dnd_start_time: null, dnd_end_time: null,
    status: 'pending', next_trigger_at: `${tomorrowStr} 09:50:00`,
    created_at: new Date().toISOString()
  }
];

const mockReminderEmployees = [{ reminder_id: 1, employee_id: 1 }];
const mockNotifications = [];

module.exports = { mockSFEmployees, mockReminders, mockReminderEmployees, mockNotifications };
