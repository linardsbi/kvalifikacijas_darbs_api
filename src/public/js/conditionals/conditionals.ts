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

            $(".conditions").on("change", function () {
                const value = $(this).val();

                if (value === "between") {
                    $(this).siblings(".hidden").show();
                } else {
                    $(this).siblings(".hidden").hide();
                }
            });

            $(".action-select").on("change", function () {
                const value = $(this).val();
                if (value === "email") {
                    $(this).siblings("*:not(.email)").addClass("hidden");
                    $(this).siblings(".email").removeClass("hidden");
                } else if (value === "write") {
                    $(this).siblings("*:not(.subjects)").addClass("hidden");
                    $(this).siblings(".subjects").removeClass("hidden");
                } else if (value === "sendMessage") {
                    $(this).siblings("*:not(.phone)").addClass("hidden");
                    $(this).siblings(".phone").removeClass("hidden");
                }
            });

            $(".add-another-field").on("click", function () {
                const toCopy = $(this).siblings("*:not(.hidden)");
                const clone = toCopy.clone();

                toCopy.find("input").val("");
                clone.appendTo($(this).parent());
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
                console.log(err);
            });
        }
    }

    $(window).on("load", function () {
        Conditional.listen();
    });
})(jQuery);