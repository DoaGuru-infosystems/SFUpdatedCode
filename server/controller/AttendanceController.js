const { db } = require("../config/db");
const multer = require("multer");
const moment = require("moment-timezone");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const ExcelJS = require("exceljs");
dotenv.config();

const applyForBackDateAttendance = (req, res) => {
  try {
    const {
      employee_id,
      request_date,
      abr_reason,
      request_type,
      requested_login_time,
      requested_logout_time,
    } = req.body;
    const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    const reqType = request_type || "backdate";

    if (!employee_id || !request_date || !abr_reason) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "All fields (employee ID, request date, and reason) are required.",
        });
    }

    // Step 1: Validate request date format and ensure it's not a future date
    const todayStr = moment().tz("Asia/Kolkata").format("DD-MM-YYYY");
    const requestMoment = moment(request_date, "DD-MM-YYYY");
    const todayMoment = moment(todayStr, "DD-MM-YYYY");

    if (!requestMoment.isValid()) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Invalid date format: ${request_date}. Expected format: DD-MM-YYYY.`,
        });
    }

    if (requestMoment.isAfter(todayMoment)) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot request backdated attendance for a future date (${request_date}).`,
        });
    }

    // Step 2: Validate requested times for 'edit' request type
    if (reqType === "edit") {
      if (!requested_login_time || !requested_logout_time) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Both requested login and logout times are required for time edit requests.",
          });
      }
      const start = moment(requested_login_time, ["HH:mm:ss", "HH:mm"]);
      const end = moment(requested_logout_time, ["HH:mm:ss", "HH:mm"]);
      if (!start.isValid() || !end.isValid()) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid login or logout time format. Expected format: HH:mm or HH:mm:ss",
          });
      }
    }

    // Step 3: Check if there is already a pending or approved request for this employee and date
    const checkRequestQuery = `
      SELECT abr_status FROM attendance_backdate_requests 
      WHERE employee_id = ? AND request_date = ? AND abr_status IN ('pending', 'approved')
    `;
    db.query(
      checkRequestQuery,
      [employee_id, request_date],
      (err, reqResult) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }

        if (reqResult.length > 0) {
          const status = reqResult[0].abr_status;
          if (status === "pending") {
            return res.status(400).json({
              success: false,
              message: `A pending backdate or edit request for ${request_date} already exists.`,
            });
          } else if (status === "approved") {
            return res.status(400).json({
              success: false,
              message: `A request for ${request_date} is already approved. Please finalize it in your attendance logs.`,
            });
          }
        }

        // Step 4: Validate according to request type
        const checkAttendQuery = `SELECT * FROM attendance WHERE user_id = ? AND attend_date = ?`;
        db.query(
          checkAttendQuery,
          [employee_id, request_date],
          (err, attendResult) => {
            if (err) {
              return res
                .status(500)
                .json({ success: false, message: err.message });
            }

            const recordExists = attendResult.length > 0;
            const dayStatus = recordExists ? attendResult[0].day_status : null;
            const logoutTime = recordExists
              ? attendResult[0].logout_time
              : null;

            const isAbsent = !recordExists || dayStatus === "absent";
            const isLogoutMissing =
              recordExists &&
              (!logoutTime ||
                logoutTime === "undefined" ||
                dayStatus === "logged-in");

            if (reqType === "backdate") {
              // Standard backdate requests only allowed if status is absent, no attendance is marked, or logout is missing.
              if (!isAbsent && !isLogoutMissing) {
                return res.status(400).json({
                  success: false,
                  message:
                    "Backdate request allowed only if status is 'absent', if no attendance is marked, or if logout is missing",
                });
              }
            } else if (reqType === "edit") {
              // Time edit requests are only allowed if a marked attendance record exists
              if (!recordExists) {
                return res.status(400).json({
                  success: false,
                  message:
                    "No attendance record found for this date. Please use a Backdate Request instead.",
                });
              }
            }

            // Step 5: Insert the request
            const insertQuery = `
          INSERT INTO attendance_backdate_requests 
          (employee_id, request_date, abr_reason, requested_at, request_type, requested_login_time, requested_logout_time) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
            const insertParams = [
              employee_id,
              request_date,
              abr_reason,
              dateTime,
              reqType,
              reqType === "edit" ? requested_login_time : null,
              reqType === "edit" ? requested_logout_time : null,
            ];

            db.query(insertQuery, insertParams, (err, result) => {
              if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                  return res
                    .status(400)
                    .json({
                      success: false,
                      message: `A request for ${request_date} already exists.`,
                    });
                }
                return res
                  .status(500)
                  .json({ success: false, message: err.message });
              }

              res.status(200).json({
                success: true,
                message:
                  reqType === "edit"
                    ? `Time edit request for ${request_date} submitted successfully.`
                    : `Backdated attendance request for ${request_date} submitted successfully.`,
              });
            });
          },
        );
      },
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllBackDateRequestBYId = (req, res) => {
  try {
    const userId = req.params.uid;
    const selectQuery = `SELECT * FROM attendance_backdate_requests WHERE employee_id = ?`;
    db.query(selectQuery, userId, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBackDateRequest = (req, res) => {
  try {
    const reqId = req.params.reqId;

    // First, check the status of the request
    const checkStatusQuery = `SELECT abr_status FROM attendance_backdate_requests WHERE request_id = ?`;
    db.query(checkStatusQuery, [reqId], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid request ID" });
      }

      const status = result[0].abr_status.toLowerCase();
      if (status === "approved") {
        return res.status(403).json({
          success: false,
          message: "Approved requests cannot be deleted",
        });
      }

      // Proceed to delete the request if not approved
      const deleteQuery = `DELETE FROM attendance_backdate_requests WHERE request_id = ?`;
      db.query(deleteQuery, [reqId], (err, result) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        if (result.affectedRows === 0) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid request ID" });
        }

        res.status(200).json({
          success: true,
          message: "Request deleted successfully",
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBackDateRequest = (req, res) => {
  try {
    const selectQuery = `SELECT * FROM attendance_backdate_requests left join task_users on task_users.id = attendance_backdate_requests.employee_id`;
    db.query(selectQuery, (err, result) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      res.status(200).send(result);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateBackDateRequestStatus = (req, res) => {
  try {
    const reqId = req.params.reqId;
    const { status, reviewBy } = req.body;
    const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    if (!status && !reviewBy) {
      return res.send("status is required");
    }

    // First, check the status of the request
    const checkStatusQuery = `SELECT abr_status FROM attendance_backdate_requests WHERE request_id = ?`;
    db.query(checkStatusQuery, [reqId], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid request ID" });
      }

      if (status === "approved") {
        const getReqQuery = `SELECT * FROM attendance_backdate_requests WHERE request_id = ?`;
        db.query(getReqQuery, [reqId], (err, reqRows) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: err.message });
          if (reqRows.length === 0)
            return res
              .status(404)
              .json({ success: false, message: "Request not found" });

          const reqData = reqRows[0];
          const loginTime = reqData.requested_login_time || "09:30:00";
          const logoutTime = reqData.requested_logout_time || "18:30:00";
          const attendDate = reqData.request_date;
          const userId = reqData.employee_id;

          const start = moment(loginTime, ["HH:mm:ss", "HH:mm"]);
          const end = moment(logoutTime, ["HH:mm:ss", "HH:mm"]);
          const workMinute = end.diff(start, "minutes");
          const dayStatus = workMinute < 300 ? "half" : "full";

          const checkExistQuery = `SELECT * FROM attendance WHERE user_id = ? AND attend_date = ?`;
          db.query(checkExistQuery, [userId, attendDate], (err, rows) => {
            if (err)
              return res
                .status(400)
                .json({ success: false, message: err.message });

            const handleFinalize = () => {
              const updateQuery = `UPDATE attendance_backdate_requests SET abr_status = 'finalized', reviewed_at = ?, reviewed_by = ? WHERE request_id = ?`;
              db.query(updateQuery, [dateTime, reviewBy, reqId], (err) => {
                if (err)
                  return res
                    .status(400)
                    .json({ success: false, message: err.message });
                res
                  .status(200)
                  .json({
                    success: true,
                    message:
                      "Request approved and attendance updated successfully",
                  });
              });
            };

            if (rows.length > 0) {
              const updateQuery = `UPDATE attendance SET login_time = ?, logout_time = ?, work_minutes = ?, day_status = ?, record_created_at = ? WHERE user_id = ? AND attend_date = ?`;
              db.query(
                updateQuery,
                [
                  loginTime,
                  logoutTime,
                  workMinute,
                  dayStatus,
                  dateTime,
                  userId,
                  attendDate,
                ],
                (err) => {
                  if (err)
                    return res
                      .status(400)
                      .json({ success: false, message: err.message });
                  handleFinalize();
                },
              );
            } else {
              const insertQuery = `INSERT INTO attendance (user_id, attend_date, login_time, logout_time, work_minutes, day_status, record_created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
              db.query(
                insertQuery,
                [
                  userId,
                  attendDate,
                  loginTime,
                  logoutTime,
                  workMinute,
                  dayStatus,
                  dateTime,
                ],
                (err) => {
                  if (err)
                    return res
                      .status(400)
                      .json({ success: false, message: err.message });
                  handleFinalize();
                },
              );
            }
          });
        });
      } else {
        const updateQuery = `UPDATE attendance_backdate_requests SET abr_status = ?, reviewed_at = ?, reviewed_by = ? WHERE request_id = ?`;
        db.query(
          updateQuery,
          [status, dateTime, reviewBy, reqId],
          (err, result) => {
            if (err)
              return res
                .status(400)
                .json({ success: false, message: err.message });
            res
              .status(200)
              .json({
                success: true,
                message: `Request ${status} successfully`,
              });
          },
        );
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markBackDateAttendance = (req, res) => {
  try {
    const { userId, loginTime, logoutTime, attendDate, requestId } = req.body;
    const dateTime = moment().tz("Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");

    // Calculate work minutes
    const start = moment(loginTime, ["HH:mm:ss", "HH:mm"]);
    const end = moment(logoutTime, ["HH:mm:ss", "HH:mm"]);

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid login or logout time format. Expected format: HH:mm or HH:mm:ss",
      });
    }

    const workMinute = end.diff(start, "minutes");

    // Determine day status
    const dayStatus = workMinute < 300 ? "half" : "full";

    const checkExistQuery = `SELECT * FROM attendance WHERE user_id = ? AND attend_date = ?`;
    db.query(checkExistQuery, [userId, attendDate], (err, rows) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (rows.length > 0) {
        const updateQuery = `
          UPDATE attendance 
          SET login_time = ?, 
              logout_time = ?, 
              work_minutes = ?, 
              day_status = ?, 
              record_created_at = ? 
          WHERE user_id = ? AND attend_date = ?
        `;
        const updateParams = [
          loginTime,
          logoutTime,
          workMinute,
          dayStatus,
          dateTime,
          userId,
          attendDate,
        ];

        db.query(updateQuery, updateParams, (err, result) => {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: err.message });
          }

          if (requestId) {
            db.query(
              `UPDATE attendance_backdate_requests SET abr_status = 'finalized' WHERE request_id = ?`,
              [requestId],
              (reqErr) => {
                if (reqErr) {
                  console.error("Error finalizing backdate request:", reqErr);
                }
                res.status(200).json({
                  success: true,
                  message: "Back Date Attendance Updated Successfully",
                });
              },
            );
          } else {
            res.status(200).json({
              success: true,
              message: "Back Date Attendance Updated Successfully",
            });
          }
        });
      } else {
        const insertQuery = `
          INSERT INTO attendance 
          (user_id, attend_date, login_time, logout_time, work_minutes, day_status, record_created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          userId,
          attendDate,
          loginTime,
          logoutTime,
          workMinute,
          dayStatus,
          dateTime,
        ];

        db.query(insertQuery, insertParams, (err, result) => {
          if (err) {
            return res
              .status(400)
              .json({ success: false, message: err.message });
          }

          if (requestId) {
            db.query(
              `UPDATE attendance_backdate_requests SET abr_status = 'finalized' WHERE request_id = ?`,
              [requestId],
              (reqErr) => {
                if (reqErr) {
                  console.error("Error finalizing backdate request:", reqErr);
                }
                res.status(200).json({
                  success: true,
                  message: "Back Date Attendance Inserted Successfully",
                });
              },
            );
          } else {
            res.status(200).json({
              success: true,
              message: "Back Date Attendance Inserted Successfully",
            });
          }
        });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const downloadMonthlyAttendanceReport = (req, res) => {
  const { month, year } = req.params;

  const query = `
    SELECT 
        tu.id AS user_id,
        tu.full_name,
        tu.email_id,
        att.attend_date,
        att.login_time,
        att.logout_time,
         att.day_status
    FROM task_users tu
    LEFT JOIN attendance att 
        ON tu.id = att.user_id
        AND MONTH(STR_TO_DATE(att.attend_date, '%d-%m-%Y')) = ?
        AND YEAR(STR_TO_DATE(att.attend_date, '%d-%m-%Y')) = ?
    WHERE tu.employment_status = 'active'
    ORDER BY tu.id, STR_TO_DATE(att.attend_date, '%d-%m-%Y');
  `;

  db.query(query, [month, year], async (err, result) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Attendance_${month}-${year}`);

      sheet.columns = [
        { header: "User ID", key: "user_id", width: 10 },
        { header: "Name", key: "full_name", width: 25 },
        { header: "Email", key: "email_id", width: 30 },
        { header: "Date", key: "attend_date", width: 15 },
        { header: "Login Time", key: "login_time", width: 15 },
        { header: "Logout Time", key: "logout_time", width: 15 },
        { header: "Day Status", key: "day_status", width: 15 },
      ];

      result.forEach((row) => sheet.addRow(row));

      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFB0E0E6" },
        };
      });

      const fileName = `Attendance_Report_${month}-${year}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (e) {
      res
        .status(500)
        .json({ success: false, message: "Error generating Excel" });
    }
  });
};

module.exports = {
  applyForBackDateAttendance,
  getAllBackDateRequestBYId,
  deleteBackDateRequest,
  getAllBackDateRequest,
  updateBackDateRequestStatus,
  markBackDateAttendance,
  downloadMonthlyAttendanceReport,
};
