"use strict";

interface Payload {
    errors?: object,
    data: object
}

export class APIResponsePayload {
    private formattedPayload: Payload;
    private unformattedPayload: object = [];

    addUnformattedData(unformattedData: object): void {
        this.unformattedPayload.push(unformattedData);
    }

    formatPayload(): void {
        let formattedPayload: Payload = {"data":[], "errors": []};

        for (const key in this.unformattedPayload) {
            let value: any = "";
            let tmp: object = [];

            if (this.unformattedPayload.hasOwnProperty(key)) {
                value = this.unformattedPayload[key];
            }

            console.log();
            if (key == "error") {
                formattedPayload.errors.push({ [key]: value });
            } else {
                formattedPayload.data.push({ [key]: value });
            }
        }

        this.formattedPayload = formattedPayload;
    }

    getFormattedPayload(): Payload {
        console.log(this.unformattedPayload);
        this.formatPayload();
        return this.formattedPayload;
    }
}