(function ($) {
    "use strict";

    type runObject = {
        action: string;
        value: string;
        subjects: string[];
    };

    interface ConditionalInterface {
        name: string;
        listenSubject: {
            subjectControllerID: string,
            pin_name: string
        };
        triggerOn: {
            value: number[],
            condition: string,
            applyCalculation: boolean
        };
        run: runObject[];
    }

    class Conditional {
        private static wrapperElement: any;

        static listen() {
            const that = this;

            $(".add-new-conditional").on("click", function (e) {
                e.preventDefault();
                that.wrapperElement = $(this).parent().siblings(".panel-body");
                that.save();
            });

            $(".add-another-field").on("click", function (e) {
                e.preventDefault();
                const field: any = $(this).parent().siblings(".action-fields").find(".wrapper")[0];
                const toCopy: any = $(field);
                const clone = toCopy.clone(true, true);

                toCopy.find(".add-another-field").parent().remove();
                clone.find("input").val("");
                clone.appendTo(toCopy.parent());
            });

            $(".add-another-action").on("click", function (e) {
                e.preventDefault();
                const toCopy = $(this).parent().siblings(".actions").find(".condition-action").first();
                const clone = toCopy.clone(true, true);
                console.log(clone, clone.find(".wrapper:not(:first-child)"));
                clone.find(".wrapper:not(:first-child)").remove();
                clone.find("input").val("");
                clone.appendTo(toCopy.parent());
            });

            $(".edit-conditional").on("click", function () {
                const saveButton = $(this).siblings(".save-conditional");
                if (saveButton.hasClass("hidden"))
                    saveButton.removeClass("hidden");
                else
                    saveButton.addClass("hidden");
            });

            $(".save-conditional").on("click", function () {
                that.wrapperElement = $(this).parent().siblings(".panel-body");
                that.save();
            });
        }

        private static sendFormData(data: any) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    headers: {
                        authtoken: $("#apiToken").val().toString()
                    },
                    dataType: "json",
                    method: "POST",
                    contentType: "application/json; charset=utf-8",
                    url: "/conditionals/create",
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

        private static formatFormData(data: any) {
            const formatted: ConditionalInterface = {
                name: "",
                listenSubject: {
                    subjectControllerID: "",
                    pin_name: ""
                },
                triggerOn: {
                    value: [],
                    condition: "",
                    applyCalculation: false
                },
                run: []
            };
            const actions = data.find(".actions .condition-action");
            const errors: object[] = [];

            data = data.find(".conditions input, .conditions select");

            data.each(function (index: number) {
                if ($(this).hasClass("conditional-name") && $(this).val().toString() !== "")
                    formatted.name = $(this).val().toString();

                if ($(this).hasClass("devices") && $(this).val().toString() !== "") {
                    const controllerID = $(this).val().toString().split("@")[1];
                    const pinName = $(this).val().toString().split("@")[0];

                    formatted.listenSubject.subjectControllerID = controllerID;
                    formatted.listenSubject.pin_name = pinName;
                }

                if ($(this).hasClass("conditions") && $(this).val().toString() !== "") {
                    formatted.triggerOn.condition = $(this).val().toString();
                    if (formatted.triggerOn.condition === "between") {
                        formatted.triggerOn.value.push(data[index + 1].value, data[index + 2].value);
                    } else {
                        formatted.triggerOn.value.push(data[index + 1].value);
                    }
                }

                if ($(this).hasClass("apply-calc"))
                    formatted.triggerOn.applyCalculation = ($(this).is(":checked"));
            });
            actions.each(function (index: number, element: any) {
                const selectAction = $(element).children(".form-group").find(".nice-select .selected");
                let actionFields;
                let deviceSelect: any;
                const selectActionValue = selectAction.data("value");
                const runObject: runObject = {
                    action: "",
                    value: "",
                    subjects: []
                };

                runObject.action = selectActionValue;

                if (selectActionValue !== "") {
                    if (selectActionValue === "email") {
                        actionFields = $(element).find(".action-fields input.email");
                    } else if (selectActionValue === "textMessage") {
                        actionFields = $(element).find(".action-fields input.phone");
                    } else if (selectActionValue === "write") {
                        actionFields = $(element).find(".action-fields input.write-value");
                        deviceSelect = $(element).find(".action-fields .nice-select .selected");
                    }

                    actionFields.each(function (index: number) {
                        if ($(this).val().toString() !== "") {
                            if (deviceSelect && deviceSelect[index]) {
                                runObject.value = $(this).val().toString();
                                runObject.subjects.push($(deviceSelect[index]).data("value"));
                            } else
                                runObject.subjects.push($(this).val().toString());
                        } else {
                            errors.push({error: "Action fields are required"});
                        }
                    });
                    formatted.run.push(runObject);
                }
            });

            if (errors[0]) return errors;

            return formatted;
        }

        static save(wrapper?: any) {
            if (wrapper)
                this.wrapperElement = wrapper;

            wrapper = this.wrapperElement;

            const formatted = this.formatFormData(wrapper);
            console.log(formatted);
            if (formatted instanceof Array) {
                const alert = wrapper.find(".validation");
                let errorText = "You still need to fill out these fields:<br />";

                for (const obj of formatted) {
                    errorText += `<b>${obj.error}</b><br />`;
                }

                alert.find(".msg").html(errorText);
                alert.show();
            } else {

                this.sendFormData(JSON.stringify(formatted)).then((result) => {
                    location.reload();
                })
                    .catch((err) => {
                        const errorMessage = `An error occurred while saving the conditional.\n
                        the error: <pre>${err.responseJSON || err.statusText}</pre>`;
                        ModalDialog.alert("An error occurred", errorMessage, true);
                    });
            }
        }
    }

    function hideAnd(item: any) {
        const andGroup = item.parent().parent().parent().siblings(".and-group");
        if (item.val().toString() === "between") {
            andGroup.show();
        } else {
            andGroup.hide();
        }
    }

    function hideActions(item: any) {
        const writeGroup = item.parent().siblings(".action-fields").find(".write-group");
        const emailGroup = item.parent().siblings(".action-fields").find(".email-group");
        const phoneGroup = item.parent().siblings(".action-fields").find(".phone-group");

        if (item.val().toString() === "email") {
            writeGroup.hide();
            emailGroup.show();
            phoneGroup.hide();
        } else if (item.val().toString() === "textMessage") {
            writeGroup.hide();
            emailGroup.hide();
            phoneGroup.show();
        } else if (item.val().toString() === "write") {
            writeGroup.show();
            emailGroup.hide();
            phoneGroup.hide();
        }
    }

    function hideFields() {
        hideAnd($(".conditions"));
        hideActions($(".action-select"));

        $(".action-select").on("change", function () {
            hideActions($(this));
        });

        $(".conditions").on("change", function () {
            hideAnd($(this));
        });
    }

    function formRemoveIcons() {
        $(".delete-icon").on("click", function () {
            $(this).parent().parent().parent().parent().remove();
        });
        $(".delete-action").on("click", function () {
            $(this).parent().remove();
        });
    }

    $(window).on("load", function () {
        hideFields();
        formRemoveIcons();
        Conditional.listen();
    });
})(jQuery);