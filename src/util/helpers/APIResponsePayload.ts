"use strict";

// TODO: attach as global var, destroy after response sent

export interface Payload {
    errors?: object;
    data: object;
}

export class APIResponsePayload {
    private formattedPayload: Payload;
    private unformattedPayload: object = [];

    addUnformattedData(unformattedData: object): void {
        // TODO: rework so payload isn't in an array
        this.unformattedPayload.push(unformattedData);
    }

    formatPayload(): void {
        // TODO: array payload followup rework
        const formattedPayload: Payload = {"data": [], "errors": []};

        for (const key in this.unformattedPayload) {
            let value: any = "";
            const tmp: object = [];

            if (this.unformattedPayload.hasOwnProperty(key)) {
                value = this.unformattedPayload[key];
            }

            for (const objectKey in value) {
                let objectValue = "";
                if (value.hasOwnProperty(objectKey)) {
                    objectValue = value[objectKey];
                }

                if (objectKey == "error") {
                    formattedPayload.errors.push({ [objectKey]: objectValue });
                } else {
                    formattedPayload.data.push({ [objectKey]: objectValue });
                }
            }
        }

        this.formattedPayload = formattedPayload;
    }

    getFormattedPayload(): Payload {
        this.formatPayload();
        return this.formattedPayload;
    }
}