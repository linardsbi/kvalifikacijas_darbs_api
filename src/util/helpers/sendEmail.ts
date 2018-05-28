"use strict";
import nodemailer, { Transporter } from "nodemailer";

export class Email {
    private toText: string;
    private fromText: string;
    private subjectText: string;
    private textBody: string;
    private htmlBody: string;

    to(name: string): this {
        this.toText = name;
        return this;
    }
    from(name: string): this {
        this.fromText = name;
        return this;
    }
    subject(subject: string): this {
        this.subjectText = subject;
        return this;
    }
    text(text: string): this {
        this.textBody = text;
        return this;
    }
    html(html: string): this {
        this.htmlBody = html;
        return this;
    }

    private createTransporter(): any {
        let mailConfig;

        if (process.env.NODE_ENV === "production" ) {
            mailConfig = {
                service: "SendGrid",
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                }
            };
        } else {
            mailConfig = {
                host: "smtp.ethereal.email",
                port: 587,
                auth: {
                    user: process.env.ETHEMAIL_USER,
                    pass: process.env.ETHEMAIL_PASSWORD
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                }
            };
        }

        return nodemailer.createTransport(mailConfig);
    }
    private checkFilledFields(): string[] | undefined {
        const errors: string[] = [];
        if (!this.fromText)
            errors.push("Missing 'from' field");
        if (!this.toText)
            errors.push("Missing 'to' field");
        if (!this.subjectText)
            errors.push("Missing 'subject' field");
        if (!this.textBody && !this.htmlBody)
            errors.push("Missing 'email body' field");

        return (errors[0]) ? errors : undefined;
    }
    test() {
        console.log("test");
    }
    send(cb?: Function) {
        const errors = this.checkFilledFields();

        if (errors) {
            cb(errors);
        } else {
            const mailOptions: any = {
                to: this.toText,
                from: this.fromText,
                subject: this.subjectText,
            };

            if (this.textBody)
                mailOptions.text = this.textBody;
            else if (this.htmlBody)
                mailOptions.html = this.htmlBody;

            this.createTransporter().sendMail(mailOptions, (err: any) => {
                cb(err);
            });
        }
    }
}