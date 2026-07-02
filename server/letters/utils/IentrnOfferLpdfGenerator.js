const PDFDocument = require('pdfkit');
const moment = require('moment'); // Import moment for date formatting
const path = require('path'); // Import path for better path handling
const fs = require('fs'); // Import fs to check if logo exists

const generatePDF = (employee, res) => {
  try {
    const pdfDoc = new PDFDocument();
    let buffers = [];

    pdfDoc.on('data', buffers.push.bind(buffers));
    pdfDoc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Disposition', `attachment; filename=experience_letter_${employee.name}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.end(pdfData);
    });

    // Set font and size for the document
    pdfDoc.font('Helvetica').fontSize(12);


    //Header Image top corner 
        const topRightImgPath = path.join(__dirname, '1headerLetterimg.jpg');
        console.log('Top-Right Image Path:', topRightImgPath);
        try {
          if (fs.existsSync(topRightImgPath)) {
            const imageWidth = 100; // Set image width
            const xPosition = pdfDoc.page.width - imageWidth - 0; // Calculate dynamic X position (10 units from right edge)
            const yPosition = 0; // Fixed position 10 units from the top
    
            pdfDoc.image(topRightImgPath, xPosition, yPosition, { width: imageWidth, height: 100 }); // Add image at the top-right
          } else {
            console.error('Top-right image not found at path:', topRightImgPath);
          }
        } catch (imageError) {
          console.error('Error loading top-right image:', imageError.message);
        }
    pdfDoc.fillColor('black');

    // Add a title
    pdfDoc.font('Helvetica-Bold').fontSize(16).text('Internship Offer Letter', { align: 'center', underline: true });
    pdfDoc.moveDown(); // Add some space
    pdfDoc.moveDown(); // Add some space..
    pdfDoc.font('Helvetica').fontSize(12); // is ke ange ke font ke liye

// Add header (Logo)
const logoPath = path.join(__dirname, 'logo.jpg'); 

try {
  if (fs.existsSync(logoPath)) {
    pdfDoc.image(logoPath, 75, 15, { width: 100, height: 40 }); // Add logo at the top
  } else {
    console.error('Logo not found at path:', logoPath);
  }
} catch (imageError) {
  console.error('Error loading image:', imageError.message);
}

    
    // Add company address
    pdfDoc.text('DOAGuru Infosystems', { align: 'left', underline: false });
    pdfDoc.text(`1815 Wright Town,Jabalpur, 
Madhya pradesh INDIA 482002`, { align: 'left' });
    pdfDoc.text('Phone: 7440992424 ', { align: 'left' });
    pdfDoc.text('Email: info@doaguru.com', { align: 'left' });
    pdfDoc.text('https://doaguru.com', { align: 'left' });
    
    pdfDoc.moveDown();

    // Add employee information
    pdfDoc.text(`Date: ${moment().format('MMMM D, YYYY')}`, {align: 'right'});
    pdfDoc.moveDown();
    pdfDoc.text(`To Whom It May Concern,`);
    pdfDoc.moveDown();

    pdfDoc.font('Helvetica').text(`This is to certify that `, {continued: true});
    pdfDoc.font('Helvetica-Bold').text(`${employee.name}`, {continued: true});
    pdfDoc.font('Helvetica').text(` was employed at `, {continued: true});
    pdfDoc.font('Helvetica-Bold').text(`DOAGuru Infosystems`, {continued: true});
    pdfDoc.font('Helvetica').text(` as a `, {continued: true});
    pdfDoc.font('Helvetica-Bold').text(`${employee.designation},`, {continued: true});
    pdfDoc.font('Helvetica').text(` from `, {continued: true});
    pdfDoc.font('Helvetica-Bold').text(`${moment(employee.joining_date).format('MMMM D, YYYY')} to ${moment(employee.resignation_date).format('MMMM D, YYYY')}.`, {continued: true});
    pdfDoc.font('Helvetica').text(`  During their tenure, they exhibited exceptional skills, professionalism, and a strong work ethic.`, {continued: false});
    pdfDoc.moveDown();
    pdfDoc.font('Helvetica').text(`We found `, {continued: true});
    pdfDoc.font('Helvetica-Bold').text(`${employee.name}`, {continued: true});
    pdfDoc.font('Helvetica').text(` to be proficient in communication, time management, and problem-solving. Their ability to effectively collaborate with team members, meet deadlines, and deliver high-quality work made them a valuable contributor to our organization. `, {continued: false});
    
    pdfDoc.moveDown();
    pdfDoc.text(`We wish them continued success in their future endeavors.`);
    pdfDoc.moveDown();

    pdfDoc.text(`Sincerely,`);
    pdfDoc.moveDown();
    pdfDoc.moveDown();



// Signature Image on the left
const sigPath = path.join(__dirname, 'signature.jpg'); 
console.log('Signature Path', sigPath);

try {
  if (fs.existsSync(sigPath)) {
    pdfDoc.image(sigPath, 50, 450, { width: 100, height: 40 }); // Adjust '50' for left alignment
  } else {
    console.error('Signature not found at path:', sigPath);
  }
} catch (imageError) {
  console.error('Error loading image:', imageError.message);
}


    pdfDoc.moveDown();
    pdfDoc.moveDown();
    pdfDoc.moveDown();
    // Closing statement
    pdfDoc.text(`Signature,`, { align: 'left' });
    pdfDoc.text(`R.S. Pandey`, { align: 'left' });
    pdfDoc.text(`CEO, DOAGuru Infosystems`, { align: 'left' });
    
    // Add footer line (red line)
    // pdfDoc.moveDown();
    // pdfDoc.fillColor('red').rect(0, pdfDoc.page.height - 20, pdfDoc.page.width, 5).fill(); // Footer line
    // pdfDoc.fillColor('green').rect(0, pdfDoc.page.height - 25, pdfDoc.page.width, 5).fill(); // Footer line
        //Signature Image
    const footerImgPath = path.join(__dirname, '1footerLetterimg.jpg');
    console.log('Footer Image Path:', footerImgPath);

    try {
      if (fs.existsSync(footerImgPath)) {
        const imageHeight = 100; // Set image height
        const yPosition = pdfDoc.page.height - imageHeight - 0; // Calculate dynamic Y position (10 units from bottom)

        pdfDoc.image(footerImgPath, 0, yPosition, { width: 700, height: imageHeight }); // Add footer image at the bottom-right
      } else {
        console.error('Footer image not found at path:', footerImgPath);
      }
    } catch (imageError) {
      console.error('Error loading image:', imageError.message);
    }


    pdfDoc.end(); // End the PDF document
  } catch (error) {
    console.error('Error generating PDF:', error.message); // Log the error
    res.status(500).send({ error: error.message }); // Send error response
  }
};

module.exports = generatePDF;
