// const PDFDocument = require('pdfkit');


// const WarningLetterPDF = ((req, res) => {
//   const { name , offerReleaseDate, warningDetails } = req.body;

//   const doc = new PDFDocument();
//   let buffers = [];
//   doc.on('data', buffers.push.bind(buffers));
//   doc.on('end', () => {
//     let pdfData = Buffer.concat(buffers);
//     res.writeHead(200, {
//       'Content-Length': Buffer.byteLength(pdfData),
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': 'attachment;filename=warning_letter.pdf',
//     }).end(pdfData);
//   });

//   // Customize your offer letter content here
//   doc.fontSize(20).text('OFFER & APPOINTMENT LETTER', { align: 'center' });
//   doc.moveDown();
//   doc.fontSize(12).text('1815, Wright Town, Jabalpur\nMadhya Pradesh, 482002\nwww.doaguru.com', { align: 'left' });
//   doc.moveDown();
//   doc.text(`Offer Release Date: ${offerReleaseDate}`, { align: 'right' });
//   doc.moveDown();
//   doc.text(`Dear ${name},`);
//   doc.moveDown();
//   doc.text(`Details`);
//   doc.list(warningDetails);
//   doc.moveDown();
//   doc.text(`We hope that this letter will act as a warning to avoid complications in the future. If you have any say in this regard you may feel free to contact any person in management and report your grievances.`);
//   doc.moveDown();
//   doc.text(`We expect you to have good behavior and observe good conduct here after.`);
//   doc.moveDown();
//   doc.moveDown();
//   doc.moveDown();
//   doc.moveDown();
//   doc.moveDown();
//   doc.text('R.S.Pandey', { align: 'left' });
//   doc.text('(CEO) DOAGuru InfoSystems.', { align: 'left' });
  
//   doc.end();
// })

// module.exports = {
//   WarningLetterPDF
// }


const db = require('../Config/DB');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Load images
const loadImage = async (filePath) => {
  const imageBytes = fs.readFileSync(filePath);
  return imageBytes;
};

const saveWarningLetter = async (req, res) => {
  const { name, date , warningDetails, letter } = req.body;

  const uploadDir = path.join(__dirname, 'upload');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const pdfPath = path.join(uploadDir, `${name}_warning_letter.pdf`);

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 750]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Load logo and signature images
    const logoImageBytes = await loadImage(path.join(__dirname, 'images', 'logo.png'));
    const signatureImageBytes = await loadImage(path.join(__dirname, 'images', 'signature.png'));

    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

    const logoDims = logoImage.scale(0.2);
    const signatureDims = signatureImage.scale(0.4);

    
    // Drawing header
    page.drawText('WARNING LETTER', {
      x: width / 2 - 70,
      y: height - logoDims.height - 5,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw logo
    page.drawImage(logoImage, {
      x: width / 7 - logoDims.width / 2,
      y: height - logoDims.height -70,
      width: logoDims.width,
      height: logoDims.height,
    });

    // Company Address content
    page.drawText(
      `     1815, Wright Town, Jabalpur
      Madhya Pradesh, 482002
      www.doaguru.com
      `,
      {
        x: 20,
        y: height - logoDims.height - 72,
        size: 12,
        font: boldFont,
        lineHeight: 14,

    })

    // Drawing the rest of the content
    page.drawText(` Warning Release Date: ${date}`, {
      x: width - 230,
      y: height - logoDims.height - 100,
      size: 12,
      font: boldFont,
    });

    // page.drawText(`Subject: Warning,`, {
    //   x: 40,
    //   y: height - logoDims.height - 160,
    //   size: 12,
    //   font: boldFont,
    // });

    page.drawText(`Dear ${name},`, {
      x: 40,
      y: height - logoDims.height - 175,
      size: 12,
      font: boldFont,
      lineHeight: 6,
    });
    let currentY = height - logoDims.height - 330;
      page.drawText(`${warningDetails}`, {
        x: 40,
        y: currentY + 135,
        size: 12,
        font,
      });
      

    const footerContent = `We hope that this letter will act as a warning to avoid complications in the future. If you have any say in this regard you may feel free to contact any person in management and report your grievances.
    `;

    page.drawText(footerContent, {
      x: 40,
      y: currentY + 115,
      size: 12,
      font,
      maxWidth: 500,
      lineHeight: 16,
    });
    
    const footerConten = `We expect you to have good behavior and observe good conduct here after..
    `;

    page.drawText(footerConten, {
      x: 40,
      y: currentY + 65,
      size: 12,
      font,
      maxWidth: 500,
      lineHeight: 16,
    });

    // Adding signature
    page.drawImage(signatureImage, {
      x: 40,
      y: currentY - 20,
      width: signatureDims.width,
      height: signatureDims.height,
    });

    // Adding footer
    page.drawText('R.S. Pandey', {
      x: 40,
      y: currentY - 55,
      size: 12,
      font: boldFont,
    });

    page.drawText('CEO, DOAGuru InfoSystems', {
      x: 40,
      y: currentY - 75,
      size: 12,
      font:boldFont,
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, pdfBytes);

    

    // Save PDF path in the database
    const values = [name, date, warningDetails, pdfPath, letter];
    const query = 'INSERT INTO warnings (name,date,warningDetails, pdfPath, letter) VALUES (?, ?, ?, ?, ?)';

    const [results] = await db.query(query, values);
    console.log(results);
    res.status(200).send('warning letter data saved successfully');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }
};

module.exports = {
  saveWarningLetter,
};