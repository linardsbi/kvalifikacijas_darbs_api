// TODO: everything in here

import { DeviceModel } from "../../../models/Device";

(function ($) {
    "use strict";

    function newDevice() {
        addModalListeners();
    }

    function addModalListeners() {
        $("#add-device-confirm").on("click", async function () {
            // TODO: Loading animation, loading scaffold
            const deviceForm = $(this).parent().siblings(".modal-body").find("form");
            const formData = deviceForm.serialize();
            const formattedData = formatFormData(formData);

            try {
                const response: DeviceModel = await sendApiPost("/devices/create", formattedData);
                handleResponse(response);
            } catch (err) {
                console.error(err);
            }
        });
    }

    function handleResponse(response) {
        console.log(response);
    }

    function formatFormData(formData) {
        const formatted = {
            "name": formData.name,
            "machine_name": formData.machine_name,
            "_controllerID": formData._controllerID,
            "used_pins": formData.used_pins
        };

        console.log(formData);
        return formatted;
    }

    function sendApiPost(url: string, formData: object): DeviceModel | any {
        return new Promise((resolve) => {
            $.post(url, formData, (response) => {
                if (response.errors)
                    throw new Error(response.errors);

                resolve(response);
            });
        });
    }

    function editDevice() {

    }

    $(window).on("load", async function () {
        $(".device-new").on("click", function () {
            newDevice();
        });

        $(".device-edit").on("click", function () {
            editDevice();
        });
    });
})(jQuery);


