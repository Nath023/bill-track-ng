// server.js
const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// --- APP INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// --- END APP INITIALIZATION ---

const regularFontPath = path.join(__dirname, 'public', 'assets', 'fonts', 'NotoSans-Regular.ttf');
const boldFontPath = path.join(__dirname, 'public', 'assets', 'fonts', 'NotoSans-Bold.ttf');

function getFont(fontPath, fallback) {
    if (fs.existsSync(fontPath)) { console.log(`Using font: ${fontPath}`); return fontPath; }
    console.warn(`Font not found: ${fontPath}. Using fallback: ${fallback}`); return fallback;
}

const AppRegularFont = getFont(regularFontPath, 'Helvetica');
const AppBoldFont = getFont(boldFontPath, 'Helvetica-Bold');

// --- DISCO Information & MOCK Prefixes ---
const DISCO_PREFIXES = { /* ... same as your provided version ... */
    "AEDC": ["0401", "0402", "0403", "04123"], "IE": ["0410", "0411", "0412"], "EKEDC": ["0415", "0416"],
    "EEDC": ["0420", "0421"], "BEDC": ["0430", "0431"], "KEDCO": ["0440", "0441"], "JED": ["0450", "0451"],
    "PHED": ["0460", "0461"], "KAEDCO": ["0470", "0471"], "YEDC": ["0480", "0481"], "IBEDC": ["0490", "0491", "0492"]
};
const DISCO_INFO = { /* ... same as your provided version ... */
    "AEDC": { name: "Abuja Electricity Distribution Company", address: "No. 1 Ziguinchor Street, Wuse Zone 4, Abuja", logo: "aedc_logo.png" },
    "IE": { name: "Ikeja Electric Plc", address: "Oba Akran Avenue, Ikeja, Lagos", logo: "ie_logo.png" },
    "EKEDC": { name: "Eko Electricity Distribution Company", address: "24/25 Marina Road, Lagos Island, Lagos", logo: "ekedc_logo.png" },
    "EEDC": { name: "Enugu Electricity Distribution Company", address: "Plot 1 Okpara Avenue, Enugu", logo: "eedc_logo.png" },
    "BEDC": { name: "Benin Electricity Distribution Company", address: "No. 5, Akpakpava Street, Benin City", logo: "bedc_logo.png" },
    "KEDCO": { name: "Kano Electricity Distribution Company", address: "No. 1 Niger Street, Kano", logo: "kedco_logo.png" },
    "JED": { name: "Jos Electricity Distribution Company", address: "No. 9 Ahmadu Bello Way, Jos", logo: "jed_logo.png" },
    "PHED": { name: "Port Harcourt Electricity Distribution Company", address: "Moscow Road, Port Harcourt", logo: "phed_logo.png" },
    "KAEDCO": { name: "Kaduna Electricity Distribution Company", address: "No. 1-2 Ahmadu Bello Way, Kaduna", logo: "kaedco_logo.png" },
    "YEDC": { name: "Yola Electricity Distribution Company", address: "No. 2 Atiku Abubakar Way, Yola", logo: "yedc_logo.png" },
    "IBEDC": { name: "Ibadan Electricity Distribution Company", address: "Capital Building, Ring Road, Ibadan", logo: "ibedc_logo.png" }
};

// --- MOCK LAST RECHARGE DATA ---
const MOCK_LAST_RECHARGE_DATA = { /* ... same as your provided version ... */
    "AEDC-04123456789": { date: "25/04/2024", amount: "₦5,000.00", token: "1234-5678-9012-3456" },
    "IE-04101112233": { date: "28/04/2024", amount: "₦2,500.00", token: "7890-1234-5678-9012" },
};
function getMockLastRecharge(meterNumber, selectedDisco) { /* ... same as your provided version ... */
    const key = `${selectedDisco}-${meterNumber}`;
    const data = MOCK_LAST_RECHARGE_DATA[key] || null;
    console.log(data ? `Found last recharge for ${key}` : `No last recharge for ${key}`);
    return data;
}

// --- START: MOCK CONSUMPTION AND PERIOD DATA ---
const MOCK_CONSUMPTION_PERIOD_DATA = {
    "AEDC-04123456789": { consumption: 210.5, periodStart: "01/04/2024", periodEnd: "30/04/2024" },
    "IE-04101112233": { consumption: 175, periodStart: "15/04/2024", periodEnd: "14/05/2024" },
    "DEFAULT": {
        consumption: 150,
        periodStart: (() => {
            const date = new Date(); date.setDate(date.getDate() - 30);
            return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        })(),
        periodEnd: new Date().toLocaleDateString('en-GB') // Generates DD/MM/YYYY
    }
};

function getMockConsumptionAndPeriod(meterNumber, selectedDisco) {
    const key = `${selectedDisco}-${meterNumber}`;
    const specificData = MOCK_CONSUMPTION_PERIOD_DATA[key];
    if (specificData) {
        console.log(`Found specific consumption/period for ${key}:`, specificData);
        return specificData;
    }
    console.log(`No specific consumption/period for ${key}, using DEFAULT.`);
    return MOCK_CONSUMPTION_PERIOD_DATA["DEFAULT"];
}
// --- END: MOCK CONSUMPTION AND PERIOD DATA ---


function verifyMeterNumber(meterNumber, selectedDisco) { /* ... same as your provided version ... */
    console.log(`--- INSIDE verifyMeterNumber --- Meter: '${meterNumber}', DISCO: '${selectedDisco}'`);
    if (!meterNumber || !selectedDisco || meterNumber === null || meterNumber === undefined) { console.log(`--> Validation Fail: Null/undefined meter or no DISCO selected.`); return false; }
    if (typeof meterNumber !== 'string') { console.log(`--> Validation Fail: Meter number is not a string (Type: ${typeof meterNumber}).`); return false; }
    if (!/^\d+$/.test(meterNumber)) { console.log(`--> Validation Fail: Meter '${meterNumber}' contains non-numeric characters.`); return false; }
    if (meterNumber.length !== 11) { console.log(`--> Validation Fail: Meter '${meterNumber}' length is ${meterNumber.length}, expected 11.`); return false; }
    const prefixesForSelectedDisco = DISCO_PREFIXES[selectedDisco];
    if (!prefixesForSelectedDisco) { console.log(`--> Validation Fail: No prefixes defined for unknown DISCO '${selectedDisco}'.`); return false; }
    let hasValidPrefix = false;
    for (const prefix of prefixesForSelectedDisco) { if (meterNumber.startsWith(prefix)) { hasValidPrefix = true; break; } }
    if (!hasValidPrefix) { console.log(`--> Validation Fail: Meter '${meterNumber}' does not start with a recognized prefix for DISCO '${selectedDisco}'. Expected one of: [${prefixesForSelectedDisco.join(', ')}]`); return false; }
    console.log(`--> Validation Success: Meter '${meterNumber}' for DISCO '${selectedDisco}'.`); return true;
}
function getMeterRegisteredName(meterNumber, selectedDisco) { /* ... same as your provided version ... */
    const discoInfo = DISCO_INFO[selectedDisco] || { name: selectedDisco };
    return `Customer (${discoInfo.name.split(" ")[0]} - ${meterNumber ? meterNumber.slice(-4) : "XXXX"})`;
}
function formatDate(dateString) { /* ... same as your provided version ... */
    if (!dateString || typeof dateString !== 'string') return 'N/A';
    try { if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) { return dateString; }
        const parts = dateString.split('-');
        if (parts.length === 3) { const [year, month, day] = parts; if (year && month && day && year.length === 4 && parseInt(month,10)>=1 && parseInt(month,10)<=12 && parseInt(day,10)>=1 && parseInt(day,10)<=31) { const pM = month.padStart(2,'0'); const pD = day.padStart(2,'0'); return `${pD}/${pM}/${year}`;}}
        console.warn(`formatDate unexpected: ${dateString}`); return dateString;
    } catch (e) { console.error(`Error formatting date: ${dateString}`,e); return dateString;}
}

const BRAND_NAME = "Bill Track NG";
const BRAND_LOGO_PLACEHOLDER_TEXT = "[Logo]";
const BRAND_LOGO_PATH = path.join(__dirname, 'public', 'assets', 'brand_logo.png');

app.post('/generate-bill', (req, res) => {
    // MODIFIED: consumption, statementPeriodStart, statementPeriodEnd are NO LONGER taken from req.body here
    let { fullName, address, meterNumber, selectedDisco } = req.body;

    console.log('RAW DATA FROM REQUEST BODY (consumption/dates removed from form):', JSON.stringify(req.body));
    if (typeof meterNumber === 'string') meterNumber = meterNumber.trim();
    if (typeof fullName === 'string') fullName = fullName.trim();
    if (typeof address === 'string') address = address.trim();
    // MODIFIED: Log reflects that consumption/dates are not from req.body for PDF content
    console.log('Data from form for processing:', { fullName, address, meterNumber, selectedDisco });

    // MODIFIED: Validation updated
    if (!fullName || !address || !meterNumber || !selectedDisco) { // consumption, dates removed from this check
        return res.status(400).json({ error: 'Full Name, Address, Meter Number and DISCO selection are required.' });
    }
    if (!DISCO_INFO[selectedDisco] || !DISCO_PREFIXES[selectedDisco]) {
        return res.status(400).json({ error: 'Invalid DISCO selection or configuration.' });
    }
    // MODIFIED: consumptionValue validation from req.body removed

    if (!verifyMeterNumber(meterNumber, selectedDisco)) {
        const discoName = DISCO_INFO[selectedDisco] ? DISCO_INFO[selectedDisco].name : selectedDisco;
        return res.status(400).json({ error: `Invalid or unrecognized Meter Number for ${discoName}. Please check the number and try again.` });
    }

    console.log('Validation PASSED. Proceeding to PDF generation.');
    const meterRegisteredName = getMeterRegisteredName(meterNumber, selectedDisco);
    const stampPath = path.join(__dirname, 'public', 'assets', 'stamp.png');
    const lastRechargeData = getMockLastRecharge(meterNumber, selectedDisco);

    // --- FETCH MOCK CONSUMPTION AND PERIOD DATA (INSTEAD OF FROM req.body) ---
    const consumptionPeriodDetails = getMockConsumptionAndPeriod(meterNumber, selectedDisco);
    const consumptionValue = consumptionPeriodDetails.consumption;
    const statementPeriodStart = consumptionPeriodDetails.periodStart; // These are now from mock
    const statementPeriodEnd = consumptionPeriodDetails.periodEnd;     // These are now from mock
    // --- END FETCH ---

    let pdfDoc;
    try {
        pdfDoc = new PDFDocument({
            size: 'A4', margin: 40, autoFirstPage: false
        });
        // ... (res.setHeader, pdfDoc.pipe(res), event listeners - same)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="utility_statement_${selectedDisco}_${meterNumber}.pdf"`);
        pdfDoc.pipe(res);
        res.on('finish', () => { console.log('Response stream finished successfully.'); });
        pdfDoc.on('error', (err) => { console.error('PDFDocument stream error:', err); if(pdfDoc && !pdfDoc.destroyed) pdfDoc.destroy(); if (!res.headersSent) res.status(500).send('Error'); });


        pdfDoc.addPage();

        const pageTopMargin = pdfDoc.page.margins.top;
        const pageLeftMargin = pdfDoc.page.margins.left;
        const pageRightMargin = pdfDoc.page.margins.right;
        const pageBottomMargin = pdfDoc.page.margins.bottom;
        const contentWidth = pdfDoc.page.width - pageLeftMargin - pageRightMargin;

        let currentY = pageTopMargin;
        const lineSpacing = 2;
        const itemSpacing = 3;
        const subSectionSpacing = 8;
        const sectionSpacing = 15;

        // --- BRANDED HEADER --- (Same as your provided version)
        const brandLogoMaxHeight = 30; const brandLogoEstimatedWidth = 90; const brandTextPadding = 8;
        let brandHeaderBottomY = currentY; let logoDrawn = false;
        if (fs.existsSync(BRAND_LOGO_PATH)) { try { pdfDoc.image(BRAND_LOGO_PATH, pageLeftMargin, currentY, { height: brandLogoMaxHeight }); brandHeaderBottomY = currentY + brandLogoMaxHeight; logoDrawn = true; } catch (e) { console.error("Error adding brand logo:", e);}}
        if (!logoDrawn) { pdfDoc.font(AppRegularFont).fontSize(9).fillColor('gray').text(BRAND_LOGO_PLACEHOLDER_TEXT, pageLeftMargin, currentY + (brandLogoMaxHeight / 2) - 6 ).fillColor('black'); brandHeaderBottomY = currentY + brandLogoMaxHeight; console.warn(`Brand logo missing.`); }
        const brandNameX = logoDrawn ? (pageLeftMargin + brandLogoEstimatedWidth + brandTextPadding) : pageLeftMargin;
        const brandNameMaxWidth = logoDrawn ? (contentWidth - (brandLogoEstimatedWidth + brandTextPadding)) : contentWidth;
        const brandNameVerticalOffset = logoDrawn ? (brandLogoMaxHeight / 2) : (brandLogoMaxHeight / 2);
        pdfDoc.font(AppBoldFont).fontSize(16); const brandNameTextHeight = pdfDoc.heightOfString(BRAND_NAME, {width: brandNameMaxWidth});
        pdfDoc.text(BRAND_NAME, brandNameX, currentY + brandNameVerticalOffset - (brandNameTextHeight / 2) , { width: brandNameMaxWidth, align: logoDrawn ? 'left' : 'center' });
        brandHeaderBottomY = Math.max(brandHeaderBottomY, currentY + brandNameTextHeight + (logoDrawn ? 0 : brandNameVerticalOffset));
        currentY = brandHeaderBottomY + sectionSpacing;

        // --- Main "Utility Statement" Title --- (Same as your provided version)
        const headerText = 'Utility Statement';
        pdfDoc.font(AppBoldFont).fontSize(20);
        const mainHeaderHeight = pdfDoc.heightOfString(headerText, { width: contentWidth });
        pdfDoc.text(headerText, pageLeftMargin, currentY, { width: contentWidth, align: 'center' });
        currentY += mainHeaderHeight + subSectionSpacing;

        // --- User Information --- (Same as your provided version)
        pdfDoc.font(AppRegularFont).fontSize(10); pdfDoc.text('Account Holder:', pageLeftMargin, currentY); currentY += pdfDoc.currentLineHeight() + lineSpacing;
        pdfDoc.font(AppBoldFont).fontSize(12); pdfDoc.text(fullName, pageLeftMargin, currentY); currentY += pdfDoc.currentLineHeight() + lineSpacing;
        pdfDoc.font(AppRegularFont).fontSize(10); const addressContentWidth = contentWidth * 0.7; const addressActualHeight = pdfDoc.heightOfString(address, { width: addressContentWidth });
        pdfDoc.text(address, pageLeftMargin, currentY, { width: addressContentWidth }); currentY += addressActualHeight + sectionSpacing;

        // --- Meter Information --- (Same as your provided version)
        pdfDoc.font(AppRegularFont).fontSize(10); pdfDoc.text('Meter Details:', pageLeftMargin, currentY); currentY += pdfDoc.currentLineHeight() + itemSpacing;
        pdfDoc.text(`Meter Number: ${meterNumber}`, pageLeftMargin, currentY); currentY += pdfDoc.currentLineHeight() + itemSpacing;
        pdfDoc.text(`Registered Name: ${meterRegisteredName}`, pageLeftMargin, currentY); currentY += pdfDoc.currentLineHeight() + sectionSpacing;


        // --- ACCOUNT & CONSUMPTION DETAILS (using backend-sourced data for consumption/period) ---
        pdfDoc.font(AppBoldFont).fontSize(12);
        pdfDoc.text('Account & Consumption Details:', pageLeftMargin, currentY, { underline: true });
        currentY += pdfDoc.currentLineHeight() + subSectionSpacing;

        pdfDoc.font(AppRegularFont).fontSize(10);
        const labelColWidth = contentWidth * 0.50;
        const valueColX = pageLeftMargin + labelColWidth + 10;
        const valueColWidth = contentWidth - labelColWidth - 10;

        if (lastRechargeData) {
            pdfDoc.text('Last Recharge Date:', pageLeftMargin, currentY, { width: labelColWidth });
            pdfDoc.text(lastRechargeData.date || 'N/A', valueColX, currentY, { width: valueColWidth, align: 'left' });
            currentY += pdfDoc.currentLineHeight() + itemSpacing;
            pdfDoc.text('Last Recharge Amount:', pageLeftMargin, currentY, { width: labelColWidth });
            pdfDoc.text(lastRechargeData.amount || 'N/A', valueColX, currentY, { width: valueColWidth, align: 'left' });
            currentY += pdfDoc.currentLineHeight() + itemSpacing;
            pdfDoc.text('Token Received:', pageLeftMargin, currentY, { width: labelColWidth });
            pdfDoc.text(lastRechargeData.token || 'N/A', valueColX, currentY, { width: valueColWidth, align: 'left' });
            currentY += pdfDoc.currentLineHeight() + itemSpacing;
        } else {
            pdfDoc.text('Last Recharge Information:', pageLeftMargin, currentY, { width: labelColWidth });
            pdfDoc.text("Not Available", valueColX, currentY, { width: valueColWidth, align: 'left', color: 'gray' }); // Added color
            currentY += pdfDoc.currentLineHeight() + itemSpacing;
        }

        // Uses consumptionValue, statementPeriodStart, statementPeriodEnd from getMockConsumptionAndPeriod
        pdfDoc.text('Electricity Consumed (KWh):', pageLeftMargin, currentY, { width: labelColWidth });
        pdfDoc.text(consumptionValue.toString(), valueColX, currentY, { width: valueColWidth, align: 'left' });
        currentY += pdfDoc.currentLineHeight() + itemSpacing;
        
        pdfDoc.text('For Period:', pageLeftMargin, currentY, { width: labelColWidth });
        pdfDoc.text(`${statementPeriodStart} - ${statementPeriodEnd}`, valueColX, currentY, { width: valueColWidth, align: 'left' }); // No need to call formatDate if mock data is already formatted
        currentY += pdfDoc.currentLineHeight() + sectionSpacing;
        // --- END ACCOUNT & CONSUMPTION DETAILS ---


        // --- Footer and Stamp --- (Same as your provided version)
        const stampSize = 60; const footerText = 'This is a statement of your prepaid electricity account.';
        pdfDoc.font(AppRegularFont).fontSize(8); const footerMeasuredHeight = pdfDoc.heightOfString(footerText, { width: contentWidth, align: 'center' });
        const footerSpaceRequired = footerMeasuredHeight + 10;
        let stampY = pdfDoc.page.height - pageBottomMargin - footerSpaceRequired - stampSize - 5;
        let stampX = pageLeftMargin + contentWidth - stampSize;
        if (currentY > stampY) { stampY = currentY + subSectionSpacing; console.warn("Content pushing stamp"); }
        if (fs.existsSync(stampPath)) { try { pdfDoc.image(stampPath, stampX, stampY, { fit: [stampSize, stampSize] }); } catch (e) {console.error("Stamp error", e)} }
        const finalFooterY = pdfDoc.page.height - pageBottomMargin - footerMeasuredHeight -2;
        pdfDoc.font(AppRegularFont).fontSize(8); pdfDoc.text(footerText, pageLeftMargin, finalFooterY, { width: contentWidth, align: 'center' });

        // --- Watermark (DRAW THIS LAST) --- (Same as your provided version)
        console.log('Adding Watermark (last)...'); pdfDoc.save();
        pdfDoc.font(AppBoldFont).fontSize(70).fillColor('#e0e0e0').opacity(0.35)
           .rotate(-45, { origin: [pdfDoc.page.width / 2, pdfDoc.page.height / 2] })
           .text('VERIFIED', 0, pdfDoc.page.height / 2 - 35, { align: 'center', width: pdfDoc.page.width });
        pdfDoc.restore(); console.log('Watermark added.');

        console.log(`Final currentY before end: ${currentY}`);
        pdfDoc.end();

    } catch (error) {
        console.error('Outer Catch - PDF Generation Error:', error);
        if (pdfDoc && !pdfDoc.destroyed) pdfDoc.destroy();
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF due to an internal error.' });
        } else {
            console.error('Headers already sent, could not send JSON error response for PDF error.');
        }
    }
});

app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));