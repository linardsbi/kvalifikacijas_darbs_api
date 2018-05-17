// TODO: everything in here

(function ($) {
    "use strict";

    function newDevice() {
        addModalListeners();
    }

    function getFormData() {
        const used_pins: object[] = [];
        const deviceName = $("#new-device-name");

        if (deviceName.val() === "") {
            return {error: "name is not defined"};
        }

        return {
            "_controllerID": $("#controller-list").val(),
            "machine_name": $("#device-list").val(),
            "name": $("#new-device-name").val(),
            "used_pins": {
                "pin_name": $("div.pin-name").find(".selected").data("value"),
                "information_type": $("div.information_type").find(".selected").data("value"),
                "pin_mode": $("div.pin-mode").find(".selected").data("value"),
            },
            "suffix": $("#data-suffix").val(),
            "equation": $("#data-equation").val()
        };
    }

    function addModalListeners() {
        $("#add-device-confirm").off().on("click", function () {
            // TODO: Loading animation, loading scaffold
            const formattedData: any = getFormData();

            if (!formattedData.error) {
                sendApiPost("/devices/create", formattedData).then((response: any) => {
                    updateDOM(response, formattedData);
                })
                    .catch((err: any) => {
                        console.log(err);
                    });
            }
        });
        $(".pins").off().on("click", ".top-part", function () {
            // const form = $(this).find(".right-form");
            if ($(this).parent().hasClass("opened")) {
                $(this).parent().removeClass("opened");
            } else {
                $(this).parent().addClass("opened");
            }
        })
            .on("click", ".save-pin", function () {
                // const form = $(this).find(".right-form");
                const pin = $(this).parent().parent();

                pin.removeClass("opened");
                if (pin.hasClass("add-pin")) {
                    const newPin = pin.clone();

                    newPin.removeClass("add-pin");
                    newPin.find(".left-label").text(pin.find(".pin-name").val().toString());
                    newPin.appendTo(pin.parent());
                }
            });
    }

    function updateDOM(response: any, formattedData: any) {
        const device = $("<div class='device col-lg-2 col-md-3 col-sm-6'></div>");
        const currentController = $(document.getElementById(formattedData._controllerID));
        const newDeviceModal: any = $("#new-device-modal");

        for (const item of response) {
            if (item && item.device) {
                device.html(item.device.name).appendTo(currentController.find(".controller-devices"));
                newDeviceModal.modal("hide");
            }
        }
    }


    function sendApiPost(url: string, formData: object): any {
        return new Promise((resolve, reject) => {
            $.ajax({
                headers: {
                    authtoken: $("#apiToken").val().toString()
                },
                dataType: "json",
                method: "post",
                url: url,
                data: formData,
                success: (response) => {
                    resolve(response);
                },
                error: (response: any) => {
                    reject(response);
                }
            });
        });
    }

    function editDevice() {

    }

    $(window).on("load", async function () {
        $(".device-new").on("click", function () {
            console.log("new click");
            newDevice();
        });

        $(".device-edit").on("click", function () {
            editDevice();
        });
    });
})(jQuery);


