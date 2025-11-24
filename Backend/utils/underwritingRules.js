function calculateEmi(P, annualRatePercent, months) {
    const r = (annualRatePercent / 100) / 12;
    if (!r || r <= 0 || months <= 0) return +(P / months).toFixed(2);
    const emi = P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
    return +emi.toFixed(2);
}

function getPreApprovedLimit(creditScore) {
    if (creditScore < 700) return 0;
    if (creditScore < 750) return 150000;
    if (creditScore < 800) return 300000;
    return 500000;
}

function decideOffer(creditScore, requestedAmount, salary) {
    if (requestedAmount > 500000) {
        return {
            status: 'REJECTED',
            reason: 'The maximum loan amount we can offer is ₹5,00,000. Please try a lower amount.'
        };
    }

    if (requestedAmount < 100000) {
        return {
            status: 'APPROVED',
            amount: requestedAmount,
            interest: 13.0,
            tenure: 24,
            isSpecialOffer: true
        };
    }

    const preApprovedLimit = getPreApprovedLimit(creditScore);
    let interest = 14.0;
    if (creditScore >= 800) interest = 10.5;
    else if (creditScore >= 750) interest = 12.0;
    else if (creditScore >= 700) interest = 13.5;

    if (creditScore < 700) {
        return {
            status: 'REJECTED',
            reason: `Your credit score of ${creditScore} is below our minimum requirement of 700.`
        };
    }
    if (requestedAmount > 300000) {
        return {
            status: 'APPROVED',
            amount: requestedAmount,
            interest: interest + 0.5, 
            tenure: 60, 
            preApprovedLimit: preApprovedLimit
        };
    }

    if (requestedAmount > (preApprovedLimit * 2)) {
        return {
            status: 'REJECTED',
            reason: `The requested amount of ₹${requestedAmount.toLocaleString()} is significantly higher than your pre-approved limit of ₹${preApprovedLimit.toLocaleString()}.`,
            preApprovedLimit: preApprovedLimit
        };
    }

    if (requestedAmount <= preApprovedLimit) {
        return {
            status: 'APPROVED',
            amount: requestedAmount,
            interest: interest - 1.0,
            tenure: 36,
            preApprovedLimit: preApprovedLimit
        };
    }
    if (requestedAmount <= (preApprovedLimit * 2)) {
        const tenure = 48;
        const emi = calculateEmi(requestedAmount, interest, tenure);
        
        if (emi <= salary * 0.50) {
            return {
                status: 'APPROVED',
                amount: requestedAmount,
                interest: interest,
                tenure: tenure,
                preApprovedLimit: preApprovedLimit
            };
        } else {
            return {
                status: 'REJECTED',
                reason: `The estimated EMI for this loan is ₹${emi.toFixed(0)}, which exceeds 50% of your reported monthly salary of ₹${salary.toLocaleString()}. For your financial well-being, we cannot proceed.`,
                preApprovedLimit: preApprovedLimit
            };
        }
    }

    return {
        status: 'REJECTED',
        reason: 'We are unable to process the request with the provided details.',
        preApprovedLimit: preApprovedLimit
    };
}

module.exports = { calculateEmi, decideOffer, getPreApprovedLimit };