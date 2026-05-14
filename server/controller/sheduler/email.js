const cron = require('node-cron');
const nodemailer = require('nodemailer');
const {db} = require('../../config/db')

let transporter = nodemailer.createTransport({
  host: 'doaguru.com',
  port: 465,
  secure: true,
  auth: {
    user: 'info@doaguru.com',
    pass: 'abhi@doaguru123',
  }
});

const sendingMail = (userEmail, clientName, date) => {
  
  let mailOptions = {
    from: 'info@doaguru.com',
    to: `${userEmail}`,
    subject: `Reminder: Scheduled Meeting with client name`,
    text: `I hope this email finds you well. This is just a gentle reminder regarding your scheduled meeting with ${clientName} on ${date.toGMTString()}.

    Agenda:
    Crack This Deal 
    
    Please ensure you are well-prepared for the meeting and have ready all necessary materials/documents. If you have any questions or need assistance before the meeting, feel free to contact me.
    
    Best regards,
    DOAGuru Infotech
    Sales Team `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Email sending failed:', error);
    } else {
      console.log('Email sent:', info.response);
     }
  });
}

// const remindUpdate = (remindData, userData) => {

// }

const getAllAssociates = () => {
  const qry = 'SELECT id AS u_Id, email_id AS email from task_users';
  db.query(qry, (err, res) => {
    if(err) {
      console.log('Error fetching users:', err);
      return;
    }
    
    console.log('Successfully get all user');
    nextLeadsToMeet(res)
  })
}

const nextLeadsToMeet = (user) => {
  const qry = 'SELECT nextFollowDate, lead_Id,  u_Id, fullName, remind FROM leads'; // Added 'remind' column in the SELECT query
  db.query(qry, (err, res) => {
    if (err) {
      console.error('Error fetching leads:', err);
      return res.status(400).json({ err: 'Error fetching leads' });
    }

    const localTime = new Date();
    let UTC_STRING = localTime.toUTCString();
    let universalTime = new Date(UTC_STRING);
    
    const ISTOffset = 5 * 60 + 30; 
    const currentDate = new Date(universalTime.getTime() + ISTOffset * 60 * 1000);
    
    res.forEach((data) => {
      universalTime = new Date(data.nextFollowDate);
      const nextDate = new Date(universalTime.getTime() + ISTOffset * 60 * 1000);
      const oneDayBefore = new Date(nextDate.getTime() - (1 * 24 * 60 * 60 * 1000)); // 1 day before
      const sevenDaysBefore = new Date(nextDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before

      const foundUser = user.find((userData) => userData.u_Id === data.u_Id);
      if (foundUser) {
        const remindSettings = JSON.parse(data.remind || '{}'); // Parse existing remind JSON or default to empty object
        
        // Check and send emails based on remind settings

        if (remindSettings.week == 'false') {
           nextDaySchedule(sevenDaysBefore, '7 day before', 'week');
        }
        if (remindSettings.yesterday == 'false') {
          nextDaySchedule(oneDayBefore, '1 day before', 'yesterday');
        }
        if (nextDate.getTime() > currentDate.getTime()) {
          if (
            nextDate.getDate() === currentDate.getDate() &&
            nextDate.getMonth() === currentDate.getMonth() &&
            nextDate.getFullYear() === currentDate.getFullYear()
          ) {
            if (remindSettings.today == 'false') { 
              console.log('Next follow-up date is the current date.');
              sendingMail(foundUser.email, data.fullName, nextDate);
              remindSettings.today = "true";
            }

            if(remindSettings.onehour == 'false') {
              const halfHourBefore = new Date(nextDate.getTime() - (30 * 60000)); // 30 minutes before
             scheduleMail(halfHourBefore, '30 minutes before', 'halfhour');
            }

            if (remindSettings.onehour == 'false') {
              const oneHourBefore = new Date(nextDate.getTime() - (60 * 60000)); // 1 hour before
              scheduleMail(oneHourBefore, '1 hour before', 'onehour');
            }
          }
        }

        function nextDaySchedule(checkDate, label, day) {
          if (
            checkDate.getDate() === currentDate.getDate() &&
            checkDate.getMonth() === currentDate.getMonth() &&
            checkDate.getFullYear() === currentDate.getFullYear()
          ) {
            console.log(`Next follow-up date is exactly ${label} the current date.`);
             sendingMail(foundUser.email, data.fullName, nextDate);
             remindSettings[day] = "true";
           
          }
        }
        function scheduleMail(scheduleDate, label, day) {
          const adjustedScheduleDate = new Date(scheduleDate.getTime() - (5.5 * 60 * 60 * 1000));
          const cronTime = `${adjustedScheduleDate.getMinutes()} ${adjustedScheduleDate.getHours()} ${adjustedScheduleDate.getDate()} ${adjustedScheduleDate.getMonth() + 1} *`;
          // console.log('In the schedule main');
          console.log(cronTime);
          cron.schedule(cronTime, () => {
            console.log(`Sending email ${label} the follow-up time.`);
            sendingMail(foundUser.email, data.fullName, nextDate);
            console.log(cronTime);
            remindSettings[day] = "true";
          }, {
            timezone: "Asia/Kolkata"
          });
        
        }
        
        let jsonRemind = JSON.stringify(remindSettings);
        const qry = 'UPDATE leads SET remind=? WHERE lead_Id=?';
        const values = [jsonRemind, data.lead_Id];
        db.query(qry, values, (err, res) => {
          if (err) {
            console.error('Error updating remind JSON:', err);
            console.log('interval server error');
          }
          console.log('Successfully updated:');
        });

      }
    });
    
  });
};


// const nextLeadsToMeet = (user) => {
//   const qry = 'SELECT nextFollowDate, u_Id, fullName from leads';
//   db.query(qry, (err, res) => {
//     if (err) res.status(400).json({ err: 'This is error' });
    
//     const localTime = new Date();
//     let UTC_STRING = localTime.toUTCString();
//     let universalTime = new Date(UTC_STRING);
    
//       const ISTOffset = 5 * 60 + 30; 
//       const currentDate = new Date(universalTime.getTime() + ISTOffset * 60 * 1000);
      
//       res.forEach((data) => {
//           universalTime = new Date(data.nextFollowDate);
//           const nextDate = new Date(universalTime.getTime() + ISTOffset * 60 * 1000);
//           const oneDayBefore = new Date(nextDate.getTime() - (1 * 24 * 60 * 60 * 1000)); // 1 day before
//           const sevenDaysBefore = new Date(nextDate.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before

//           // Finding user
//           const foundUser = user.find((userData) => userData.u_Id === data.u_Id);

//         if(foundUser){

//           nextDaySchedule(sevenDaysBefore, '7 day before');
//           nextDaySchedule(oneDayBefore, '1 day before');

//           if(nextDate.getTime() > currentDate.getTime()){
//           if (
//               nextDate.getDate() === currentDate.getDate() && 
//               nextDate.getMonth() === currentDate.getMonth() && 
//               nextDate.getFullYear() === currentDate.getFullYear()
//             ) {
//                 console.log('Next follow-up date is the current date.');
//                 sendingMail(foundUser.email, data.fullName, nextDate);
                    
//                 const halfHourBefore = new Date(nextDate.getTime() - (30 * 60000)); // 30 minutes before
//                 const oneHourBefore = new Date(nextDate.getTime() - (60 * 60000));// 1 hour before
  
//                 scheduleMail(oneHourBefore, '1 hour before');
//                 scheduleMail(halfHourBefore, '30 minutes before'); 

//                 function scheduleMail (scheduleDate, label) {
//                   console.log(scheduleDate)
//                   const cronTime = `${scheduleDate.getMinutes()} ${scheduleDate.getHours()} ${scheduleDate.getDate()} ${scheduleDate.getMonth() + 1} *`;
//                   cron.schedule(cronTime, () => {
//                       console.log(`Sending email ${label} the follow-up time.`);
//                       sendingMail(foundUser.email, data.fullName, nextDate);    
//                   }, {
//                       timezone: "Asia/Kolkata"
//                   });
//               };
//           }}
          
//           function nextDaySchedule (checkDate, label) {
//             if (
//               checkDate.getDate() === currentDate.getDate() &&
//               checkDate.getMonth() === currentDate.getMonth() &&
//               checkDate.getFullYear() === currentDate.getFullYear()
//             ) {
//               console.log(`Next follow-up date is exactly ${label} the current date.`);
//               sendingMail(foundUser.email, data.fullName, nextDate);
//             }};
//         }}
//       );
//   });
// };

module.exports = {getAllAssociates}