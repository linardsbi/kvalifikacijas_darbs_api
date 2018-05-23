"use strict";
import nodemailer from "nodemailer";
import * as Mail from "nodemailer/lib/mailer";

class Email {
    private transporter: any;
    private to: string;
    private from: string;
    private subject: string;
    private text: string;
    private html: string;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
                user: process.env.SENDGRID_USER,
                pass: process.env.SENDGRID_PASSWORD
            }
        });
    }

    static to(name: string) {
        return this;
    }
    static from(name: string) {
        return this;
    }
    static subject(subject: string) {
        return this;
    }
    static text(text: string) {
        return this;
    }
    static html(html: string) {
        return this;
    }
    static send(cb?: Function) {
        const mailOptions: any = {
            to: this.to,
            from: this.from,
            subject: this.subject,
        };

        if (this.text)
            mailOptions.text = this.text;
        if (this.html)
            mailOptions.html = this.html;
        
        this.transporter.sendMail(mailOptions, (err) => {
            req.flash("success", {msg: "Success! Your password has been changed."});
            done(err);
        });
    }
}