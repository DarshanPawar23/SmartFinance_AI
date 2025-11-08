const applicationService = require('../services/applicationService');

const getApplicationStatus = async (req, res) => {
    try {
        const { pan } = req.params;
        if (!pan) {
            return res.status(400).json({ success: false, message: 'PAN is required.' });
        }

        const status = await applicationService.getStatusByPan(pan);

        if (!status) {
        
            return res.status(404).json({ success: false, message: 'No application found for this PAN.' });
        }

        // Success! Send the status
        res.json({ success: true, status: status });

    } catch (error) {
        console.error("Error fetching application status:", error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = { getApplicationStatus };