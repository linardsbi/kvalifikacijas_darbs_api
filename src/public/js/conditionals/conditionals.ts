(function ($) {
    "use strict";

    interface ConditionalInterface {
        name: string;
        listenSubject: { subjectControllerID: string, pin_name: string, subjectControllerMachineName: string };
        triggerOn: {
            value: number[],
            condition: string,
            applyCalculation: boolean
        };
        run: { action: string, value: string, subjects: string[] }[];
    }

    class Conditional {
        private static wrapperElement: any;

        static listen() {
            const that = this;

            $(".add-new-conditional").on("click", function () {
                that.wrapperElement = $(this).parent();
                that.save();
            });

            $(".add-another-field").on("click", function (e) {
                e.preventDefault();
                const toCopy = $(this).parent().parent();
                const clone = toCopy.clone(true);

                toCopy.find(".add-another-field").parent().remove();
                clone.find("input").val("");
                clone.appendTo(toCopy.parent());
            });

            $(".add-another-action").on("click", function () {
                const container = $(".container.actions");
                const clone = container.children().first().clone();
                clone.insertBefore($(this).parent());
            });

            $(".edit-conditional").on("click", function () {
                const saveButton = $(this).siblings(".save-conditional");
                if (saveButton.hasClass("hidden"))
                    saveButton.removeClass("hidden");
                else
                    saveButton.addClass("hidden");
            });

            $(".save-conditional").on("click", function () {
                that.wrapperElement = $(this).parent();
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
                    method: "post",
                    url: "/conditionals",
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
            // TODO loads of formatting
            const formatted = {
                name: "",
                listenSubject: {
                    subjectControllerID: "",
                    pin_name: "",
                    subjectControllerMachineName: ""
                },
                triggerOn: {
                    value: [""],
                    condition: "",
                    applyCalculation: false
                },
                run: {
                    action: "",
                    value: "",
                    subjects: [""]
                }
            };

            return formatted;
        }

        static save(wrapper?: any) {
            if (wrapper)
                this.wrapperElement = wrapper;

            wrapper = this.wrapperElement;

            const fields = wrapper.find("input:not(.hidden), select:not(.hidden)");
            console.log(fields);

            const formatted = this.formatFormData(fields);

            this.sendFormData(formatted).then((result) => {
                console.log(result);
            })
            .catch((err) => {
                const errorMessage = `An error occurred while fetching the device you clicked on.\n
                 the error: <pre>${err}</pre>`;

                ModalDialog.alert("An error occurred", errorMessage, true);
            });
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

    $(window).on("load", function () {
        hideFields();
        Conditional.listen();
    });
})(jQuery);