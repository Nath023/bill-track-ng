// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const billForm = document.getElementById('billForm');
    const messageDiv = document.getElementById('message');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = generateBtn.querySelector('.btn-text'); // For button text
    const spinner = generateBtn.querySelector('.spinner');   // For spinner element

    // Determine backend URL - for local dev and deployed environments
    const IS_LOCALHOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Replace 'your-render-backend-url.onrender.com' with your actual Render backend URL
    const BACKEND_URL = IS_LOCALHOST ? 'http://localhost:3000' : 'https://your-render-backend-url.onrender.com'; // UPDATE THIS FOR DEPLOYMENT

    // Function to show/hide loading state on the button
    function showLoading(isLoading) {
        if (isLoading) {
            generateBtn.disabled = true;
            if (btnText) btnText.textContent = 'Generating...';
            if (spinner) spinner.style.display = 'inline-block';
        } else {
            generateBtn.disabled = false;
            if (btnText) btnText.textContent = 'Generate Statement';
            if (spinner) spinner.style.display = 'none';
        }
    }

    billForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        messageDiv.textContent = '';
        messageDiv.className = 'message'; // Reset classes
        showLoading(true); // Show loading state

        const formData = new FormData(billForm);
        // MODIFIED: Removed consumption and date period fields from data object
        const data = {
            fullName: formData.get('fullName'),
            address: formData.get('address'),
            meterNumber: formData.get('meterNumber'),
            selectedDisco: formData.get('disco')
        };

        // MODIFIED: Updated client-side validation
        if (!data.fullName || !data.address || !data.meterNumber || !data.selectedDisco) {
            showMessage('Full Name, Address, Meter Number, and DISCO selection are required.', 'error');
            showLoading(false); // Hide loading
            return;
        }
        // MODIFIED: Updated meter number pattern check to be more generic for client-side
        // The server-side will do the more specific prefix check based on DISCO
        if (!/^\d{11}$/.test(data.meterNumber)) { // Checks for exactly 11 digits
             showMessage('Invalid Meter Number. Must be exactly 11 digits.', 'error');
             showLoading(false); // Hide loading
             return;
        }
        // REMOVED: Client-side validation for consumption and date periods

        try {
            const response = await fetch(`${BACKEND_URL}/generate-bill`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data), // Send only the required data
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;

                const contentDisposition = response.headers.get('content-disposition');
                let fileName = `utility_statement_${data.meterNumber}.pdf`;
                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                    if (fileNameMatch && fileNameMatch.length === 2)
                        fileName = fileNameMatch[1];
                }
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);
                showMessage('Statement generated and download started!', 'success');
            } else {
                const errorData = await response.json();
                showMessage(errorData.error || 'Failed to generate statement. Please check your inputs.', 'error');
            }
        } catch (error) {
            console.error('Error during fetch or PDF processing:', error);
            showMessage('An unexpected network error occurred. Please try again.', 'error');
        } finally {
            showLoading(false); // Hide loading state in all cases
        }
    });

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`;
    }
});