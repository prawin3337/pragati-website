const nodemailer = require('nodemailer');

const sendEnquiryMail = (params, calback) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.in",
        secure: true,
        port: 465,
        auth: {
            user: 'admin@pragatienter.com',
            pass: process.env.SMTP_ZOHO_MAIL_PASS
        }
    });

    const { mailTo = null, mailCC = null, subject = "Enquiry from website", name, emailId, contactNumber,
        company, details, productDetails } = params;
    const mailOptions = {
        from: 'admin@pragatienter.com',
        to: (mailTo != null) ? mailTo : 'sales@pragatienter.com',
        cc: (mailCC != null) ? mailCC : 'admin@pragatienter.com,pragatienterprises00@gmail.com',
        subject,
        html: `<html>
            <body>
                <table>
                    <tbody>
                        <tr>
                            <td>Name</td><td>${name}</td>
                        </tr>
                        <tr>
                            <td>Email</td><td>${emailId}</td>
                        </tr>
                        <tr>
                            <td>Contact Number</td><td>${contactNumber}</td>
                        </tr>
                        <tr>
                            <td>Company</td><td>${company}</td>
                        </tr>
                        <tr>
                            <td>Detals</td><td>${details}</td>
                        </tr>
                        <tr>
                            <td>Product</td><td>${productDetails}</td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            calback({ error });
        } else {
            calback({ error: false });
        }
    });
}

module.exports = {
    sendEnquiryMail
}