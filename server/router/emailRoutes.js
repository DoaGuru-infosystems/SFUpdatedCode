// ✅ Cleaned Email Routes for Weekly Report Only

const express = require('express');
const router = express.Router();
const schedule = require('node-schedule');
const {
  generateWeeklyReport,
  scheduleWeeklyReport,
  cancelScheduledReport
} = require('../controller/sheduler/weeklyTaskReport');

// Auto start scheduler
scheduleWeeklyReport();

// GET /api/email/test-weekly-report
router.get('/test-weekly-report', async (req, res) => {
  try {
    console.log(' Manual weekly report test triggered');
    const result = await generateWeeklyReport();

    res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.success ? 'Report sent successfully' : 'Report generation failed',
      details: result
    });
  } catch (error) {
    console.error(' Error in test-weekly-report:', error);
    res.status(500).json({
      success: false,
      message: 'Unexpected server error',
      error: error.message
    });
  }
});


// GET /api/email/schedule-status
router.get('/schedule-status', (req, res) => {
  const jobs = schedule.scheduledJobs;
  const info = Object.keys(jobs).map(name => {
    const job = jobs[name];
    return {
      name,
      nextRun: job.nextInvocation()?.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'long'
      }) || 'Not scheduled'
    };
  });
  res.status(200).json({ success: true, jobs: info });
});

// POST /api/email/reschedule
router.post('/reschedule', (req, res) => {
  const cancelled = cancelScheduledReport();
  const scheduled = scheduleWeeklyReport();
  res.status(200).json({
    success: true,
    message: 'Rescheduled successfully',
    previousCancelled: cancelled,
    newJobScheduled: !!scheduled
  });
});

// DELETE /api/email/cancel-schedule
router.delete('/cancel-schedule', (req, res) => {
  const cancelled = cancelScheduledReport();
  res.status(200).json({
    success: cancelled,
    message: cancelled ? 'Schedule cancelled' : 'No active schedule found'
  });
});

module.exports = router;
