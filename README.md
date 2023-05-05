## FundFuture

Welcome to FundFuture! This is a project aimed at providing a platform for individuals and organizations to create and donate to fundraising campaigns.
Features

## FundFuture provides a variety of features to make your donation experience as easy and secure as possible. Some of our key features include:

    User authentication and authorization with JWT and Google Login
    Creation, editing, and deletion of fundraising campaigns
    Donation functionality with Stripe integration
    Dashboard with detailed statistics and analytics
    Multi-language support with i18text
    Responsive UI with Tailwind CSS and Daisy UI
    Real-time updates with Firebase
    Secure text editing with Jaudit Editor and Dompurify
    Data visualization with Recharts
    Enhanced user experience with Framer Motion
    Audit trail for donations
    Campaign report generation
    Success story
    Email verification
    Communication via Email



## Installation

To run FundFuture on your local machine, follow these steps:

    Clone the repository:

bash

## git clone https://github.com/Asaduzzama-n/funde-future-server.git

     Install dependencies:

## npm install

##    Create a .env file and add the following environment variables:

## makefile

PORT=5000
DB_USERNAME=<your DB_USERNAME>
DB_PASS=<your DB_PASS>
SECRET_ACCESS_TOKEN=<your SECRET_ACCESS_TOKEN>
STRIPE_SECRET_KEY=<your STRIPE_SECRET_KEY>
EMAIL_DOMAIN=<your EMAIL_DOMAIN>
EMAIL_SEND_KEY=<your EMAIL_SEND_KEY>
GOOGLE_EMAIL_PASS=<your GOOGLE_EMAIL_PASS>
ACCESS_TOKEN=<your ACCESS_TOKEN>

##    Start the server:

sql

## npm start

    Access FundFuture on http://localhost:5000



## Tools Used

    Node.js: A JavaScript runtime built on Chrome's V8 JavaScript engine.
    Express: A web application framework for Node.js.
    MongoDB: A NoSQL database used to store application data.
    Mongoose: An Object Data Modeling (ODM) library for MongoDB and Node.js.
    Passport: An authentication middleware for Node.js.
    JSON Web Token (JWT): A standard for securely transmitting information between parties as a JSON object.
    Stripe: An online payment processing platform used to handle donations.
    i18next: A library used to enable multi-language support in the application.
    Tailwind CSS: A utility-first CSS framework used to build responsive UI components.
    Daisy UI: A lightweight CSS framework built on top of Tailwind CSS to provide pre-built UI components.
    Firebase: A cloud-based service used to provide real-time updates in the application.
    Jaudit Editor: A library used to sanitize user inputs and prevent cross-site scripting (XSS) attacks.
    Dompurify: A library used to sanitize user inputs and prevent cross-site scripting (XSS) attacks.
    Recharts: A charting library used to visualize application data.
    Framer Motion: A library used to add animation and motion to UI components.

## Support

If you have any questions or concerns about FundFuture, please don't hesitate to contact us. Our support team is available to help you with any issues you may encounter.
Conclusion

Thank you for choosing FundFuture for your fundraising needs. We hope our platform will help you raise funds for your cause and make a positive impact on the world.