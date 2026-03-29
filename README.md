\# Assignment 4



\## Test Login Accounts



Username: admin1  

Password: password123



Username: admin2  

Password: letmein456



\## How to Run



1\. Make sure MongoDB is running.

2\. Run:

&#x20;  npm install

3\. Start the server:

&#x20;  npm start

4\. Open:

&#x20;  http://127.0.0.1:8000



\## Notes



\- This assignment uses custom sessions stored in MongoDB.

\- Session timeout is 5 minutes.

\- Each valid request extends the session by another 5 minutes.

\- All routes except /login and /logout are protected.

\- Employee photos are served through a protected route.

