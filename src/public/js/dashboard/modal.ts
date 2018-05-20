// TODO: everything in here

(function ($) {
    "use strict";

    const formElements: any = {
        "#controller-list": "controller list",
        "#device-list": "device list",
        "#new-device-name": "device name",
        ".pin-name": "pin name",
        ".information_type": "information type",
        ".pin-mode": "pin mode"
    };

    function newDevice() {
        addModalListeners();
    }

    function getFormData(formElement: any) {
        const errorArray: object[] = [];

        for (const key in Object.keys(formElements)) {
            let error: boolean = false;
            const currentElement = formElement.find(key);

            if (key === ".pin-name" || key === ".information_type" || key === ".pin-mode") {
                if (currentElement.find(".selected").data("value"))
                    error = true;
            } else if (currentElement.val() === "")
                error = true;

            if (error)
                errorArray.push({error: `Field ${formElements[key]} cannot be empty`});
        }

        if (errorArray[0])
            return errorArray;

        const pinMode = formElement.find("#pin-mode").val();

        return {
            "_controllerID": formElement.find("#controller-list").val(),
            "machine_name": formElement.find("#device-list").val(),
            "name": formElement.find("#new-device-name").val(),
            "used_pins": {
                "pin_name": formElement.find("#pin-name").val(),
                "information_type": formElement.find("#information_type").val(),
                "pin_mode": pinMode,
                "suffix": (pinMode.toLowerCase() === "input") ? formElement.find("#data-suffix").val() : "",
                "equation": (pinMode.toLowerCase() === "input") ? formElement.find("#data-equation").val() : ""
            }
        };
    }

    function addModalListeners() {
        $("#pin-mode").on("change", function () {
            const value = $(this).next().find(".selected").data("value");

            if (value.toString().toLowerCase() === "input") {
                $(".read-group").show();
            } else {
                $(".read-group").hide();
            }
        });
        $("#add-device-confirm").off().on("click", function () {
            // TODO: Loading animation, loading scaffold
            const formattedData: any = getFormData($("#new-device-modal"));
            console.log(formattedData);

            if (!formattedData.error) {
                sendAjaxRequest("/devices/create", formattedData, "POST").then((response: any) => {
                    updateDOM(response, formattedData);
                })
                    .catch((err: any) => {
                        console.log(err);
                        const errorMessage = `An error occurred while fetching the device you clicked on.\n
                        the error: <pre>${err.responseJSON.error.message}</pre>`;

                        ModalDialog.alert("An error occurred", errorMessage, true);
                    });
            } else {
                updateDOM(undefined, formattedData);
            }
        });
        // $(".pins").off().on("click", ".top-part", function () {
        //     // const form = $(this).find(".right-form");
        //     if ($(this).parent().hasClass("opened")) {
        //         $(this).parent().removeClass("opened");
        //     } else {
        //         $(this).parent().addClass("opened");
        //     }
        // })
        //     .on("click", ".save-pin", function () {
        //         // const form = $(this).find(".right-form");
        //         const pin = $(this).parent().parent();
        //
        //         pin.removeClass("opened");
        //         if (pin.hasClass("add-pin")) {
        //             const newPin = pin.clone();
        //
        //             newPin.removeClass("add-pin");
        //             newPin.find(".left-label").text(pin.find(".pin-name").val().toString());
        //             newPin.appendTo(pin.parent());
        //         }
        //     });
    }

    function updateDOM(response: any, formattedData: any) {
        if (formattedData && formattedData.error) {
            // TODO: error message
            console.log(formattedData.error);
        } else {
            const device = $(`<div class='device col-lg-2 col-md-3 col-sm-6'><i class="fa fa-trash"></i><div class="device-name"></div></div>`);
            const currentController = $(document.getElementById(formattedData._controllerID));
            const newDeviceModal: any = $("#new-device-modal");

            for (const item of response) {
                if (item && item.device) {
                    device.find(".device-name").html(item.device.name);
                    device.find(".device-id").html(item.device._id);
                    device.appendTo(currentController.find(".controller-devices"));
                }
            }
            newDeviceModal.modal("hide");
        }
    }


    function sendAjaxRequest(url: string, data: object, method?: string) {
        return new Promise((resolve, reject) => {
            $.ajax({
                headers: {
                    authtoken: $("#apiToken").val().toString()
                },
                dataType: "json",
                method: method,
                url: url,
                data: data,
                success: (response) => {
                    resolve(response);
                },
                error: (response: any) => {
                    reject(response);
                }
            });
        });
    }

    function saveDevice() {

    }

    function formatEditForm() {
        // TODO: finish
        const form = $("#new-device-modal").find(".modal-body").clone();
        for (const key of Object.keys(formElements)) {
            const currentElement = form.find(key);


        }
        return form;
    }

    function editDevice(deviceID: string) {
        sendAjaxRequest("/devices/get", {_id: deviceID})
            .then(result => {
                const form = formatEditForm();
                const buttons = [
                    {
                        html: "<button class='btn btn-primary'>Save</button>",
                        cb: saveDevice()
                    }
                ];

                console.log(result);
                ModalDialog.make("Edit device", form, buttons);
            })
            .catch(err => {
                const errorMessage = `An error occurred while fetching the device you clicked on.\n
                 the error: <pre>${err}</pre>`;

                ModalDialog.alert("An error occurred", errorMessage, true);
            });
    }

    function deleteDevice(deviceID: string) {
        ModalDialog.confirm("Delete device", "<b>This action is irreversible! Are you sure?</b>", true, function () {
            sendAjaxRequest("/devices/delete", {_id: deviceID}, "DELETE")
                .then(result => {
                    console.log("result", result);
                })
                .catch(error => {
                    const errorMessage = `An error occurred while deleting the device.\n
                    the error: <pre>${error}</pre>`;

                    ModalDialog.alert("An error occurred", errorMessage, true);
                });
        });
    }

    $(window).on("load", async function () {
        $(".device-new").on("click", function () {
            newDevice();
        });

        $(".controller-page").on("click", ".edit-device", function () {
            const deviceId: string = $(this).find(".device-id").text();
            editDevice(deviceId);
        });

        $(".controller-page").on("click", ".delete-device", function () {
            const deviceId: string = $(this).find(".device-id").text();
            deleteDevice(deviceId);
        });
    });
})(jQuery);


