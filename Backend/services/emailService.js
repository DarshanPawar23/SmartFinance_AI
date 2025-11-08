const nodemailer = require('nodemailer');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Email Verification Code',
        text: `Your verification code for Smart Finance AI is: ${otp}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Verification OTP sent to ${email}`);
        return { success: true, otp: otp };
    } catch (error) {
        console.error(`[Email Service] Error sending email: ${error.message}`);
        return { success: false, message: 'Failed to send OTP email.' };
    }
}

function base64ToUint8Array(base64) {
    if (!base64 || !base64.includes(',')) {
        console.error('[PDF Service] Invalid base64 image string received.');
        return null; 
    }
    const base64Data = base64.split(',')[1];
    return Buffer.from(base64Data, 'base64');
}

const maskPAN = (pan) => pan ? `******${pan.slice(-4)}` : 'N/A';
const maskAccount = (num) => num ? `****${num.slice(-4)}` : 'N/A';


async function createLoanPdf(formData) {
    const { personal, bank, salary, guarantor, loan } = formData;
    const pdfDoc = await PDFDocument.create();
    
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595.28, 842.52]); 
    const { width, height } = page.getSize();

    const fontBytes = fs.readFileSync(path.join(__dirname, '../assets/NotoSans-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(__dirname, '../assets/NotoSans-Bold.ttf'));
    const italicsFontBytes = fs.readFileSync(path.join(__dirname, '../assets/NotoSans-Italic.ttf'));

    const customFont = await pdfDoc.embedFont(fontBytes);
    const customBoldFont = await pdfDoc.embedFont(boldFontBytes);
    const customItalicsFont = await pdfDoc.embedFont(italicsFontBytes);
    
    const colors = {
        text: rgb(0.2, 0.2, 0.2), 
        heading: rgb(0.1, 0.3, 0.7), 
        gray: rgb(0.5, 0.5, 0.5), 
        line: rgb(0.9, 0.9, 0.9), 
        box: rgb(0.97, 0.97, 0.97) 
    };

    const margin = 50;
    let y = height - margin;
    const lineSpacing = 16;
    const sectionSpacing = 25;
    const titleSize = 20;
    const headingSize = 14;
    const bodySize = 10;
    const smallSize = 8;
    const valueX = 175; // X position for all values

    // --- Helper Function for rows ---
    const drawDetailRow = (label, value, yPos) => {
        page.drawText(label, {
            x: margin,
            y: yPos,
            size: bodySize,
            font: customFont,
            color: colors.gray,
        });
        page.drawText(value, {
            x: valueX,
            y: yPos,
            size: bodySize,
            font: customBoldFont,
            color: colors.text,
        });
        return yPos - lineSpacing;
    };

    const drawSectionLine = (yPos) => {
        page.drawLine({
            start: { x: margin, y: yPos },
            end: { x: width - margin, y: yPos },
            thickness: 1,
            color: colors.line,
        });
        return yPos - sectionSpacing;
    };

    // --- Header ---
    page.drawText('Smart Finance AI', {
        x: margin,
        y: y,
        size: titleSize,
        font: customBoldFont,
        color: colors.heading,
    });
    page.drawText('Official Loan Sanction Letter', {
        x: width - margin - 170,
        y: y,
        size: headingSize,
        font: customFont,
        color: colors.gray,
    });
    y -= 30;
    page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 2,
        color: colors.heading,
    });
    y -= sectionSpacing;

    // --- Subject ---
    page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, { x: width - margin - 80, y: y, size: bodySize, font: customFont });
    y -= lineSpacing;
    page.drawText(`Subject: Approval of Personal Loan Application`, { x: margin, y: y, size: bodySize, font: customBoldFont });
    y -= lineSpacing * 1.5;

    // --- Body ---
    page.drawText(`Dear ${personal.name},`, { x: margin, y: y, size: bodySize, font: customFont });
    y -= lineSpacing;
    page.drawText('We are pleased to inform you that your personal loan application submitted to Smart Finance AI has been reviewed and approved.', {
        x: margin,
        y: y,
        size: bodySize,
        font: customFont,
        maxWidth: width - margin * 2,
    });
    y -= sectionSpacing;

    // --- Loan Details Section ---
    y = drawSectionLine(y);
    page.drawText('Loan Sanction Details', { x: margin, y: y, size: headingSize, font: customBoldFont, color: colors.heading });
    y -= (lineSpacing * 1.5);
    
    y = drawDetailRow('Loan Amount:', `₹ ${parseFloat(loan.amount).toLocaleString('en-IN')}`, y);
    y = drawDetailRow('Interest Rate:', `${loan.interestRate} % p.a.`, y);
    y = drawDetailRow('Loan Tenure:', loan.tenure, y);
    y -= 10; // Extra space after section

    // --- Applicant Information Section ---
    y = drawSectionLine(y);
    page.drawText('Applicant Information', { x: margin, y: y, size: headingSize, font: customBoldFont, color: colors.heading });
    y -= (lineSpacing * 1.5);

    // Applicant Image
    if (personal.faceImage) {
        const applicantImgBytes = base64ToUint8Array(personal.faceImage);
        if (applicantImgBytes) {
            const applicantImg = await pdfDoc.embedJpg(applicantImgBytes);
            page.drawImage(applicantImg, { x: margin, y: y - 100, width: 100, height: 100 });
            y -= 115; // Move down past the image + padding
        }
    }
    
    // --- THIS IS THE CORRECTED BLOCK ---
    y = drawDetailRow('Name:', personal.name, y);
    y = drawDetailRow('Email:', personal.email, y);
    y = drawDetailRow('Phone:', personal.phone, y);
    y = drawDetailRow('Date of Birth:', personal.dob, y); // <-- ADDED
    y = drawDetailRow('Bank Account:', maskAccount(bank.accountNumber), y);
    y = drawDetailRow('Verified Salary:', `₹ ${parseFloat(salary.extractedSalary || 0).toLocaleString('en-IN')}`, y);
    // --- END OF CORRECTION ---
    y -= 10;

    // --- Guarantor Information Section ---
    y = drawSectionLine(y);
    page.drawText('Guarantor Information', { x: margin, y: y, size: headingSize, font: customBoldFont, color: colors.heading });
    y -= (lineSpacing * 1.5);

    // Guarantor Image
    if (guarantor.documentImage) {
        const guarantorImgBytes = base64ToUint8Array(guarantor.documentImage);
        if (guarantorImgBytes) {
            const guarantorImg = await pdfDoc.embedJpg(guarantorImgBytes);
            page.drawImage(guarantorImg, { x: margin, y: y - 100, width: 100, height: 100 });
            y -= 115; // Move down past the image + padding
        }
    }
    
    y = drawDetailRow('Name:', guarantor.name, y);
    y = drawDetailRow('Relationship:', guarantor.relationship, y);
    y = drawDetailRow('Phone:', guarantor.phone, y);
    y = drawDetailRow('Date of Birth:', guarantor.dob, y);
    y = drawDetailRow('Gender:', guarantor.gender, y);

    // --- Footer & Disclaimer ---
    y = 50; // Set Y to a fixed position at the bottom
    page.drawLine({
        start: { x: margin, y: y },
        end: { x: width - margin, y: y },
        thickness: 1,
        color: colors.line,
    });
    y -= (lineSpacing * 1.2);

    page.drawText('This is a digitally generated document and does not require a signature.', {
        x: margin,
        y: y,
        size: smallSize,
        font: customItalicsFont,
        color: colors.gray,
    });
    y -= (lineSpacing - 4);
    page.drawText('This sanction is subject to the acceptance of the terms and conditions outlined in the final loan agreement.', {
        x: margin,
        y: y,
        size: smallSize,
        font: customItalicsFont,
        color: colors.gray,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}


async function sendApprovalEmail(userEmail, formData) {
    const pdfBytes = await createLoanPdf(formData);
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Congratulations! Your Personal Loan is Approved!',
        text: `Dear ${formData.personal.name},\n\nCongratulations! Your loan application has been approved. Please find your sanction letter attached.\n\nThank you,\nSmart Finance AI Team`,
        attachments: [
            {
                filename: 'Loan_Sanction_Letter.pdf',
                content: Buffer.from(pdfBytes), // Convert Uint8Array to Buffer for Nodemailer
                contentType: 'application/pdf',
            },
        ],
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Approval PDF sent to ${userEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`[Email Service] Error sending approval email: ${error.message}`);
        return { success: false, message: 'Failed to send approval email.' };
    }
}

module.exports = {
    sendVerificationEmail,
    generateOtp,
    sendApprovalEmail,
};