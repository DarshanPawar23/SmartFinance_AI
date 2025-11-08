const db = require('../config/db');

const applicationService = {
  /**
   * Gets the latest application status for a given PAN.
   * @param {string} pan - The user's PAN number.
   * @returns {Promise<object|null>} - The status object or null if not found.
   */
  getStatusByPan: async (pan) => {
    const sql = `
        SELECT application_id, application_status, submission_date 
        FROM loan_applications 
        WHERE pan_number = ? 
        ORDER BY submission_date DESC 
        LIMIT 1
    `;
    
    const [rows] = await db.query(sql, [pan]);

    if (!rows || rows.length === 0) {
      return null; // Return null instead of sending a 404 response
    }
    return rows[0];
  }
};

module.exports = applicationService;