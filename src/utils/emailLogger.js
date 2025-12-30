const nodemailer = require('nodemailer');

class EmailLogger {
    constructor(config) {
        this.logEmail = config?.logEmail;
        this.transporter = null;
        
        if (this.logEmail && config?.smtpUser && config?.smtpPass) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass
                }
            });
        }
    }

    async sendLog(subject, content) {
        if (!this.logEmail || !this.transporter) return;
        
        try {
            await this.transporter.sendMail({
                from: this.transporter.options.auth.user,
                to: this.logEmail,
                subject: `Jira CLI - ${subject}`,
                text: content,
                html: `<pre>${content}</pre>`
            });
        } catch (error) {
            console.log('(Email log failed)');
        }
    }
}

module.exports = EmailLogger;