class ModalDialog {
    private static modal: any;

    static make(title: string, body: any, ...buttons: any[]) {
        this.modal = $(".action-modal");

        this.modal.find(".modal-title").text(title);
        this.modal.find(".modal-body").html(body);
        this.modal.find(".button-ok").hide();
        this.modal.find(".button-true").hide();
        this.modal.find(".button-false").hide();

        if (buttons[0] instanceof Array)
            buttons = buttons[0];

        buttons.forEach((button) => {
            let {html} = button;
            const {cb} = button;
            html = $(html);

            if ($(html[0])) {
                $(html[0]).off().on("click", () => {
                    if (cb instanceof Function) {
                        cb();
                    }
                    this.hide(this.modal);
                });
            }

            this.modal.find(".modal-footer").append(html);
        });

        this.show(this.modal);
    }

    static confirm(title: string, body: any, danger: boolean = false, cbTrue: Function, cbFalse?: Function) {
        const modalClass = removeScriptTags(title).split(" ").join("-").toLowerCase();

        this.modal = $(".action-modal");

        this.modal.find(".modal-title").text(title);
        this.modal.find(".modal-body").html(body);
        this.modal.find(".modal-dialog").addClass(`modal-${modalClass}`);
        this.modal.find(".button-true").show();
        this.modal.find(".button-false").show();

        const confirmButton = this.modal.find(".button-true");

        if (danger) {
            confirmButton.removeClass("btn-primary").addClass("btn-danger");
        } else if (confirmButton.hasClass("btn-danger")) {
            confirmButton.removeClass("btn-danger").addClass("btn-primary");
        }

        confirmButton.off().on("click", () => {
            if (cbTrue) {
                cbTrue();
            }
            this.hide(this.modal);

            this.modal.find(".modal-dialog").removeClass(`modal-${modalClass}`);
        });
        this.modal.find(".button-false").off().on("click", () => {
            if (cbFalse) {
                cbFalse();
            }
            this.hide(this.modal);

            this.modal.find(".modal-dialog").removeClass(`modal-${modalClass}`);
        });

        this.show(this.modal);
    }

    static alert(title: string, body: any, danger: boolean = false, cb?: Function) {
        const modalClass = removeScriptTags(title).split(" ").join("-").toLowerCase();
        body = removeScriptTags(body);

        this.modal = $(".action-modal");

        this.modal.find(".modal-title").text(title);
        this.modal.find(".modal-dialog").addClass("modal-sm");
        this.modal.find(".modal-dialog").addClass(`modal-${modalClass}`);
        this.modal.find(".modal-body").html(body);
        this.modal.find(".button-ok").show();

        const confirmButton = this.modal.find(".button-ok");

        if (danger) {
            confirmButton.removeClass("btn-primary").addClass("btn-danger");
        } else if (confirmButton.hasClass("btn-danger")) {
            confirmButton.removeClass("btn-danger").addClass("btn-primary");
        }

        this.show(this.modal);

        confirmButton.off().on("click", () => {
            if (cb) {
                cb();
            }

            this.hide(this.modal);
            this.modal.find(".modal-dialog").removeClass("modal-sm");
            this.modal.find(".modal-dialog").removeClass(`modal-${modalClass}`);
        });
    }

    static hide(element: any) {
        this.modal.find(".modal-footer > button").each((button: any) => {
            if (!($(button).hasClass("button-true") || $(button).hasClass("button-false") || $(button).hasClass("button-ok"))) {
                $(button).remove();
            } else {
                $(button).hide();
            }
        });

        element.modal("hide");
    }

    static show(element: any) {
        element.modal("show");
    }
}

function removeScriptTags(string: string): string {
    return string.replace("/<(\\/|)script.*?(>|)/gi", "");
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

(($) => {


    async function getConvertedText(text: string): Promise<any> {
        const splitText = text.split("\n");
        const wrapper: any = $("<ol class='converted-code'>");

        splitText.forEach((value: string) => {
            value = value.replace( /(\t|\s{4})/g, "<span class='tab'></span>");
            const highlighted: any = value.replace(/".*?"/g, '<span class="highlighted-green">$&</span>');

            wrapper.append($(`<li class='code-line'><div class="wrapper">${highlighted}</div></li>`));
        });

        return wrapper;
    }

    async function convertTextToCode(): Promise<void> {
        $("div.convert-to-code").each( (index, value) => {
            const $this = $(value);
            let text: string;
            let result: any;

            if ($this.hasClass("json-data")) {
                text = $this.text();
                result = getConvertedText(text);
            }

            result.then((item: any) => {
                console.log(item);
                $this.html(item);
            });
        });
    }


    $(window).on("load", function () {
        $("select").niceSelect();
        convertTextToCode();
    });
    $(window).on("error", function () {
        console.log("error");
    });
})(jQuery);