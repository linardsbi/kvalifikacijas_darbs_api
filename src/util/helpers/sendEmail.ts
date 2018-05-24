"use strict";
import nodemailer, { Transporter } from "nodemailer";

export class Email {
    private transporter: Transporter;
    private static toText: string;
    private static fromText: string;
    private static subjectText: string;
    private static textBody: string;
    private static htmlBody: string;

    constructor() {
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
                }
            };
        }

        this.transporter = nodemailer.createTransport(mailConfig);
    }

    static to(name: string) {
        this.toText = name;
        return this;
    }
    static from(name: string) {
        this.fromText = name;
        return this;
    }
    static subject(subject: string) {
        this.subjectText = subject;
        return this;
    }
    static text(text: string) {
        this.textBody = text;
        return this;
    }
    static html(html: string) {
        this.htmlBody = html;
        return this;
    }
    private static checkFilledFields(): string[] | undefined {
        const errors: string[] = [];
        if (!this.from)
            errors.push("Missing 'from' field");
        if (!this.to)
            errors.push("Missing 'to' field");
        if (!this.subject)
            errors.push("Missing 'subject' field");
        if (!this.text && !this.html)
            errors.push("Missing 'email body' field");

        return (errors[0]) ? errors : undefined;
    }
    static send(cb?: Function) {
        const errors = this.checkFilledFields();

        if (errors) {
            cb(errors);
        } else {
            const mailOptions: any = {
                to: this.to,
                from: this.from,
                subject: this.subject,
            };

            if (this.text)
                mailOptions.text = this.text;
            else if (this.html)
                mailOptions.html = this.html;

            this.transporter.sendMail(mailOptions, (err: any) => {
                cb(err);
            });
        }
    }
}