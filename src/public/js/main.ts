class ModalDialog {
    private static modal: any;

    static make(title: string, body: any, ...buttons: any[]) {
        this.modal = $(".action-modal");

        this.modal.find(".modal-title").text(title);
        this.modal.find(".modal-body").html(body);
        this.modal.find(".button-ok").hide();
        this.modal.find(".button-true").hide();
        this.modal.find(".button-false").hide();

        buttons.forEach((button) => {
            let {html} = button;
            const {cb} = button;
            html = $(html);

            html.off().on("click", () => {
                if (cb instanceof Function) {
                    cb();
                }
                this.hide(this.modal);
            });

            this.modal.find(".modal-footer").append(html);
        });
    }

    static confirm(title: string, body: any, danger: boolean = false, cbTrue: Function, cbFalse?: Function) {
        this.modal = $(".action-modal");

        this.modal.find(".modal-title").text(title);
        this.modal.find(".modal-body").html(body);
        this.modal.find(".button-ok").hide();
        this.modal.find(".button-true").show();
        this.modal.find(".button-false").show();

        const confirmButton = this.modal.find(".button-true");

        if (danger) {
            confirmButton.removeClass("btn-primary").addClass("btn-danger");
        } else if (confirmButton.hasClass("btn-danger")) {
            confirmButton.removeClass("btn-danger").addClass("btn-primary");
        }

        confirmButton.off().on("click", function () {
            if (cbTrue() instanceof Function) {
                cbTrue();
            }
            this.hide(this.modal);
        });
        this.modal.find(".button-false").off().on("click", function () {
            if (cbFalse() instanceof Function) {
                cbFalse();
            }
            this.hide(this.modal);
        });

        this.show(this.modal);
    }

    static alert(title: string, body: any, danger: boolean = false, cb?: Function) {
        this.modal = $(".action-modal");

        this.modal.find(".modal-title").text(title);
        this.modal.find(".modal-body").html(body);
        this.modal.find(".button-ok").show();
        this.modal.find(".button-true").hide();
        this.modal.find(".button-false").hide();

        const confirmButton = this.modal.find(".button-ok");

        if (danger) {
            confirmButton.removeClass("btn-primary").addClass("btn-danger");
        } else if (confirmButton.hasClass("btn-danger")) {
            confirmButton.removeClass("btn-danger").addClass("btn-primary");
        }

        confirmButton.off().on("click", function () {
            if (cb() instanceof Function) {
                cb();
            }
            this.hide(this.modal);
        });
    }

    static hide(element: any) {
        element.modal("hide");
    }

    static show(element: any) {
        element.modal("show");
    }
}

function sendAjaxRequest() {

}

(($) => {
    $(window).on("load", function () {
        $("select").niceSelect();
    });

})(jQuery);