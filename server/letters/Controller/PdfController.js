const db = require('../Config/DB');

const saveOfferLetter = async (req, res) => {
  const {
    name,
    address,
    phoneNumber,
    email,
    gender,
    offerReleaseDate,
    joiningDate,
    designation,
    salary,
    probationPeriod,
    noticePeriod,
    confirmationNoticePeriod,
    jobResponsibilities,
    signatory
  } = req.body;

  console.log('Saving offer letter data for:', { name, email, designation });

  const query = `
    INSERT INTO offer_letters (
      name, 
      address, 
      phoneNumber, 
      email, 
      gender,
      offerReleaseDate, 
      joiningDate, 
      designation, 
      salary, 
      probationPeriod, 
      noticePeriod, 
      confirmationNoticePeriod, 
      jobResponsibilities,
      signatory,
      createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

  const values = [
    name,
    address,
    phoneNumber,
    email,
    gender || null,
    new Date(offerReleaseDate).toISOString().split('T')[0],
    new Date(joiningDate).toISOString().split('T')[0],
    designation,
    salary,
    probationPeriod,
    noticePeriod,
    confirmationNoticePeriod,
    JSON.stringify(jobResponsibilities),
    signatory || null
  ];

  try {
    console.log('Saving offer letter data to database...');
    const [results] = await db.query(query, values);

    console.log('Offer letter data saved successfully');
    res.status(200).json({
      success: true,
      message: 'Offer letter data saved successfully',
      data: {
        id: results.insertId,
        name,
        email,
        designation,
        gender: gender || null,
        signatory: signatory || null,
        joiningDate: new Date(joiningDate).toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Failed to save offer letter data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save offer letter data',
      error: error.message
    });
  }
};

module.exports = {
  saveOfferLetter,
};
