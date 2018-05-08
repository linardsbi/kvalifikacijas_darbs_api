// TODO: everything in here

(function ($) {
    "use strict";

    function newDevice() {
        addModalListeners();
    }

    function getFormData() {
        const used_pins: object[] = [];
        const allPins = $("#new-device-modal .pin:not(.add-pin)");

        const info_types = allPins.find("div.information_type");
        const pin_names = allPins.find("div.pin-name");
        const pin_modes = allPins.find("div.pin-mode");

        info_types.each(function (index) {
            used_pins.push({
                pin_name: $(pin_names[index]).find(".selected").data("value"),
                information_type: $(this).find(".selected").data("value"),
                pin_mode: $(pin_modes[index]).find(".selected").data("value"),
            });
        });
        console.log(used_pins);
        return {
            "_controllerID": $("#controller-list").val(),
            "machine_name": $("#device-list").val(),
            "name": $("#new-device-name").val(),
            "used_pins": used_pins
        };
    }

    function addModalListeners() {
        $("#add-device-confirm").off().on("click", async function () {
            // TODO: Loading animation, loading scaffold
            const formattedData = getFormData();

            try {
                const response: any = await sendApiPost("/devices/create", formattedData);
                updateDOM(response, formattedData);
            } catch (err) {
                console.error(err);
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
                    newPin.find(".left-label").text(pin.find(".pin-name").val());
                    newPin.appendTo(pin.parent());
                }
            });
    }

    function updateDOM(response, formattedData) {
        const device = $("<div class='device'></div>");
        const currentController = $(document.getElementById(formattedData._controllerID));

        for (const item of response) {
            if (item && item.device) {
                device.html(item.device.name).appendTo(currentController.find(".controller-devices"));
                $("#new-device-modal").modal("hide");
            }
        }
    }


    function sendApiPost(url: string, formData: object): any {
        return new Promise((resolve) => {
            $.ajax({
                headers: {
                    authtoken: $("#apiToken").val()
                },
                dataType: "json",
                method: "post",
                url: url,
                data: formData,
                success: (response) => {
                    resolve(response);
                },
                error: (response) => {
                    throw new Error(response);
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


