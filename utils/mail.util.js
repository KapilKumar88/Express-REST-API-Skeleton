const nodemailer = require('nodemailer'); 
const { MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD, MAIL_SECURE, MAIL_PORT, MAIL_FROM_ADDRESS } = require('../config/mail.config');
const logger = require('../utils/winston.util');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE, // true for 465, false for other ports
    auth: {
        user: MAIL_USERNAME, 
        pass: MAIL_PASSWORD, 
    }
});

const sendMail = async (to, subject, html, bcc = [], cc = [], attachments = []) => {
    try {
        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: MAIL_FROM_ADDRESS,
            to: to,
            cc: cc,
            bcc: bcc,
            subject: subject,
            html: html,
            attachments: attachments
        });
        
        if(info.messageId){
            return true;
        }
        
        return false;
    } catch (error) {
        logger.error(`Error in sendmail function | ErrorCode: 500`);
        return false;
    }
}

module.exports = sendMail;