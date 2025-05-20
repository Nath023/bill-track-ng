# Bill Track NG - Utility Statement Generator

Bill Track NG is a web application that allows users to generate a mock utility statement in PDF format for Nigerian prepaid electricity meters. It features mock DISCO selection, meter number verification against mock DISCO prefixes, and dynamic data for consumption and last recharge details.

## Features

*   **User-Friendly Interface:** Clean and responsive single-page application for data input.
*   **DISCO Selection:** Users can select their supposed Distribution Company (DISCO).
*   **Meter Number Verification:**
    *   Validates 11-digit numeric meter numbers.
    *   Mock verification against predefined DISCO prefixes.
*   **Dynamic Data (Mocked):**
    *   Last recharge details (date, amount, token) are fetched from mock data based on meter number and DISCO.
    *   Electricity consumption and statement period are also sourced from mock backend data.
*   **PDF Statement Generation:**
    *   Generates a downloadable PDF statement.
    *   Includes Account Holder and Service Address.
    *   Displays Meter Number and (mock) Registered Name.
    *   Shows (mock) Consumption details and the period it covers.
    *   Displays (mock) Last Recharge details.
    *   Includes a "VERIFIED" watermark and a digital stamp image.
    *   Features a branded header with "Bill Track NG" and a logo placeholder.
*   **Responsive Design:** Mobile-friendly for accessibility on various devices.

## Tech Stack

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   Vanilla JavaScript
*   **Backend:**
    *   Node.js
    *   Express.js
*   **PDF Generation:**
    *   `pdfkit` (npm package)
*   **Mock Data:** Implemented directly within the backend `server.js`.

## Project Structure

utility-bill-generator/
├── public/ # Frontend files
│ ├── assets/
│ │ ├── fonts/ # NotoSans-Regular.ttf, NotoSans-Bold.ttf
│ │ ├── logos/ # aedc_logo.png, brand_logo.png, etc.
│ │ └── stamp.png
│ ├── index.html
│ ├── style.css
│ └── script.js
├── server.js # Backend Express server & PDF generation logic
├── package.json
├── package-lock.json
└── .gitignore



## Setup and Running Locally

1.  **Clone the repository (if you've pushed it to GitHub):**
    ```bash
    git clone https://github.com/Nath023/bill-track-ng.git
    cd bill-track-ng
    ```
    (Or just navigate to your existing project folder if you're working locally).

2.  **Install dependencies:**
    Make sure you have Node.js and npm installed.
    ```bash
    npm install
    ```

3.  **Prepare Assets:**
    *   Ensure you have the Noto Sans font files (`NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`) in `public/assets/fonts/`.
    *   Place your `stamp.png` in `public/assets/`.
    *   Place your `brand_logo.png` in `public/assets/`.
    *   Place individual DISCO logos (e.g., `aedc_logo.png`) in `public/assets/logos/` if you are using the DISCO-specific header (Note: current version uses a generic brand header).

4.  **Run the backend server:**
    ```bash
    npm start
    ```
    The server will typically start on `http://localhost:3000`.

5.  **Access the application:**
    Open `public/index.html` in your browser (e.g., using a live server extension or by navigating to `http://localhost:3000` if your server is configured to serve it).

## How it Works (Mock Logic)

*   **Meter Verification:** The backend checks if the meter number is 11 digits, numeric, and starts with a (mock) prefix associated with the selected DISCO (defined in `DISCO_PREFIXES` in `server.js`).
*   **Data Fetching:** Last recharge details and consumption/period data are retrieved from mock JavaScript objects (`MOCK_LAST_RECHARGE_DATA`, `MOCK_CONSUMPTION_PERIOD_DATA`) in `server.js`. This data is keyed by `DISCO_ACRONYM-METER_NUMBER` or uses a default.

## Future Enhancements (Ideas)

*   Integrate with a real database (e.g., SQLite, MongoDB, PostgreSQL) for storing user data, DISCO info, and transaction history.
*   Implement user authentication.
*   Develop actual (or more sophisticated mock) API endpoints for fetching data.
*   Add more detailed error handling and user feedback on the frontend.
*   Implement unit and integration tests.
*   Option to email the generated PDF.

## Contributing

This is a personal/learning project. However, suggestions or improvements are welcome via issues or pull requests (if applicable).

## License
