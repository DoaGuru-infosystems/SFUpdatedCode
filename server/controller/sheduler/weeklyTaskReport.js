//  Cleaned & working Weekly Report Controller using cPanel SMTP

const schedule = require('node-schedule');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { db } = require('../../config/db');

// cPanel SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'doaguru.com',
  port: 465,
  secure: true,
  auth: {
    user: 'noreply@doaguru.com',
    pass: 'Doaguru@123'
  }
});

const uploadsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const RECIPIENTS = [
  'impriyanshu.garg@gmail.com',
  'doaguruinfosystems@gmail.com'
];

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getCurrentWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: formatDate(startDate),
    end: formatDate(endDate),
    startFormatted: startDate.toLocaleDateString('en-IN'),
    endFormatted: endDate.toLocaleDateString('en-IN')
  };
}

async function fetchWeeklyTaskData(startDate, endDate) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        t.user_id,
        u.full_name AS employee_name,
        t.ProjectOrClientName AS project_name,
        SUM(CASE WHEN t.SubCategory = 'Video Edittor' THEN IFNULL(t.videoCount, 0) ELSE 0 END) AS video_count,
        SUM(CASE WHEN t.SubCategory = 'POST Create ' THEN IFNULL(t.postCount, 0) ELSE 0 END) AS post_count,
        SUM(IFNULL(t.ConsumingTimeInMin, 0)) AS total_minutes
      FROM tasks t
      JOIN task_users u ON t.user_id = u.id
      WHERE t.task_date BETWEEN ? AND ?
      GROUP BY t.user_id, u.full_name, t.ProjectOrClientName
      ORDER BY u.full_name, t.ProjectOrClientName`;

    db.query(query, [startDate, endDate], (err, results) => {
      if (err) return reject(err);
      const employeeData = {};
      results.forEach(row => {
        if (!employeeData[row.user_id]) {
          employeeData[row.user_id] = {
            employee_name: row.employee_name,
            projects: [],
            total_video_count: 0,
            total_post_count: 0,
            total_minutes: 0
          };
        }
        employeeData[row.user_id].projects.push({
          project_name: row.project_name,
          video_count: row.video_count,
          post_count: row.post_count,
          minutes: row.total_minutes
        });
        employeeData[row.user_id].total_video_count += row.video_count;
        employeeData[row.user_id].total_post_count += row.post_count;
        employeeData[row.user_id].total_minutes += row.total_minutes;
      });
      resolve(employeeData);
    });
  });
}

async function generateExcelReport(data, weekDates) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Weekly Task Report');
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Weekly Task Report (${weekDates.startFormatted} to ${weekDates.endFormatted})`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.addRow([]);

  const headerRow = worksheet.addRow([
    'Employee Name', 'Project Name', 'Video Posts', 'Other Posts', 'Time (Minutes)', 'Time (Hours)'
  ]);

  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  Object.values(data).forEach(employee => {
    const summaryRow = worksheet.addRow([
      employee.employee_name, 'TOTAL', employee.total_video_count,
      employee.total_post_count, employee.total_minutes,
      (employee.total_minutes / 60).toFixed(2)
    ]);
    summaryRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' }
      };
    });
    employee.projects.forEach(project => {
      worksheet.addRow([
        '', project.project_name, project.video_count,
        project.post_count, project.minutes,
        (project.minutes / 60).toFixed(2)
      ]);
    });
    worksheet.addRow([]);
  });

  worksheet.columns.forEach(col => {
    let max = 10;
    col.eachCell({ includeEmpty: true }, cell => {
      const val = cell.value ? cell.value.toString().length : 10;
      if (val > max) max = val;
    });
    col.width = max + 2;
  });

  const fileName = `WeeklyTaskReport_${weekDates.start}_to_${weekDates.end}.xlsx`;
  const filePath = path.join(uploadsDir, fileName);
  await workbook.xlsx.writeFile(filePath);
  return { filePath, fileName };
}

function generateEmailHTML(data, weekDates) {
  let totalVideos = 0, totalPosts = 0, totalHours = 0;
  const employeeCount = Object.keys(data).length;
  Object.values(data).forEach(emp => {
    totalVideos += emp.total_video_count;
    totalPosts += emp.total_post_count;
    totalHours += emp.total_minutes / 60;
  });
  return `
    <h2>Weekly Task Report</h2>
    <p>Week: ${weekDates.startFormatted} to ${weekDates.endFormatted}</p>
    <p>Total Employees: ${employeeCount}</p>
    <p>Video Posts: ${totalVideos} | Other Posts: ${totalPosts} | Total Hours: ${totalHours.toFixed(2)}</p>
    <p>Attached is the full Excel report.</p>
  `;
}

async function sendWeeklyReport(filePath, fileName, data, weekDates) {
  const mailOptions = {
    from: `"DOAGuru Sf.Efforts Reports" <noreply@doaguru.com>`,
    to: RECIPIENTS.join(', '),
    subject: `Employee Sf.Efforts Weekly Task Report - ${weekDates.startFormatted} to ${weekDates.endFormatted}`,
    html: generateEmailHTML(data, weekDates),
    attachments: [{ filename: fileName, path: filePath }]
  };

  try {
    console.log(' Sending mail now...');
    const info = await transporter.sendMail(mailOptions);
    console.log(' Mail sent:', info.messageId);
    return true;
  } catch (err) {
    console.error(' Mail send failed:', err.message);
    throw err; // important so it bubbles up to response
  }
}


async function generateWeeklyReport() {
  try {
    const weekDates = getCurrentWeekDates();
    const data = await fetchWeeklyTaskData(weekDates.start, weekDates.end);
    if (Object.keys(data).length === 0) return { success: true, message: 'No data to report' };
    const { filePath, fileName } = await generateExcelReport(data, weekDates);
    const sent = await sendWeeklyReport(filePath, fileName, data, weekDates);
    return sent ? { success: true, fileName } : { success: false, message: 'Email send failed' };
  } catch (err) {
    console.error(' Error:', err.message);
    return { success: false, message: err.message };
  }
}

function scheduleWeeklyReport() {
//   return schedule.scheduleJob('weekly-report-saturday', '0 55 12 * * *', async () => {
//     console.log(' Running scheduled weekly report...');
//     await generateWeeklyReport();
//   });
  
  return schedule.scheduleJob(
  'run-1259pm-today',
  { rule: '0 59 12 * * *', tz: 'Asia/Kolkata' }, // ⏰ 12:59 PM IST today
  async () => {
    console.log('🚀 Triggered at 12:59 PM IST');
    await generateWeeklyReport(); // 👈 Make sure this function is imported
  }
);
  
//     //  Friday at 8:00 PM IST
//   schedule.scheduleJob('weekly-report-friday', '0 20 * * 5', async () => {
//     console.log('Friday 8PM schedule triggered');
//     await generateWeeklyReport();
//   });
}

function cancelScheduledReport() {
  const job = schedule.scheduledJobs['weekly-report'];
  if (job) job.cancel();
  return !!job;
}



module.exports = {
  generateWeeklyReport,
  scheduleWeeklyReport,
  cancelScheduledReport
};
