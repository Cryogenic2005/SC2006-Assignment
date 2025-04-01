# For Developers: How to Set Up This Project

## Backend Setup

1. Add the `.env` file to the `server` directory.
2. Open a terminal and navigate to the `server` folder:

   ```bash
   cd Lab4/HawkerGo/server
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the backend server:

   ```bash
   npm run server
   ```

5. If you see the following output:

   ```
   Connected to MongoDB
   Server running on port 3000
   ```

   The backend is up and running.

**Important:** Keep this terminal open and do not close it while working with the app.

---

## Frontend Setup (Using Expo)

1. Download the **Expo Go** app on your physical phone.

2. Open a **new terminal** (separate from the one running the backend).

3. Navigate to the frontend folder:

   ```bash
   cd Lab4/HawkerGo/client
   ```

4. Install frontend dependencies:

   ```bash
   npm install
   ```

5. Start the Expo development server:

   ```bash
   npx expo start
   ```

6. A QR code will appear in the terminal or browser. Use the **Expo Go** app on your phone to scan the QR code.
7. Ensure that your phone and laptop are connected to the same wifi network.

8. The app will launch on your phone.

---

## Debugging Tips

- After making changes to a file, return to the Expo terminal.
- Press `r` to refresh the app on your phone and reflect the changes.

# Running Backend Tests

## Instructions

1. **Navigate to the tests directory**  
   In your terminal, move into the `tests` directory:

   ```bash
   cd Lab4/HawkerGo/server/tests
   ```

2. **Run the test suite**  
   Execute the following command:

   ```bash
   npm test
   ```

3. **Check the logs**  
   Review the console output to see:
   - Which tests passed
   - Which tests failed
   - Any related error messages or stack traces

## Notes

- Similar to the backend setup, ensure your `.env` file exists in the `server` directory and contains valid values (e.g. `JWT_SECRET`, `MONGO_URI`, etc.).
- Tests use `Jest` and `Supertest` to simulate API calls and verify behavior.

# Running Frontend Tests

## Instructions

1. **Navigate to the client/tests directory**  
   In your terminal, move into the `__tests__` directory:

   ```bash
   cd Lab4/HawkerGo/client/__tests__
   ```

2. **Run the test suite**  
   Execute the following command:

   ```bash
   npm test
   ```

3. **Check the logs**  
   Review the console output to see:
   - Which tests passed
   - Which tests failed
   - Any related error messages or stack traces

## Notes

- Tests that fail for screens can be ignored for now.
