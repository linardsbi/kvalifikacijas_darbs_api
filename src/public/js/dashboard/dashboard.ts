import {initChart} from "./charts";

(function ($) {
    "use strict";

    interface BridgeData {
        status: string,
        item: string
    }

    let socket: any = null;

    function getDevices(): string[] {
        const controllerIDs: string[] = [];
        $(".controller-machine-name").each((index, element) => {
            if (element.innerText) {
                controllerIDs.push(`controllers/${element.innerText}/presence`);
            }
        });

        return controllerIDs;
    }

    function getPresenceData() {
        const devices: string[] = getDevices();
        if (devices[0]) {
            const data = {
                apiToken: $("#apiToken").val(),
                action: "subscribe",
                topics: devices
            };

            send(data);
        }
    }

    function updateDOM(data: BridgeData) {
        // TODO: make more robust to handle other actions
        if (data && data.item && data.status) {
            const status = $(document.getElementById(data.item)).find(".status");

            if (data.status === "connected") {
                status.removeClass("disconnected").addClass("connected");
            } else {
                status.removeClass("connected").addClass("disconnected");
            }

        } else {
            // $(".controller-page").text("No devices added yet!").addClass("no-devices");
        }
    }

    function send(message: object) {
        socket.send(JSON.stringify(message));
    }

    function connect() {
        return new Promise((resolve) => {
            socket = new WebSocket(`ws://${window.location.hostname}:8080`);

            // Connection opened
            socket.addEventListener("open", function () {
                getPresenceData();
                resolve();
            });

            // Listen for messages
            socket.addEventListener("message", function (event: any) {
                const data: BridgeData = JSON.parse(event.data);
                updateDOM(data);
            });
        });
    }

    function initAccordion() {
        $(".info").on("click", function () {
            if ($(this).hasClass("open")) {
                $(this).removeClass("open");
                $(this).next().slideUp();
            } else {
                $(this).addClass("open");
                $(this).next().slideDown();
            }
        });
    }

    function deviceClick() {
        $(".device").on("click", function () {
            $(".device-overview").css({"width": "50%"});
        });
        $(".device-overview .close").on("click", function () {
            $(".device-overview").css({"width": "0"});
        });
        $(".device-new").on("click", function () {
            const modal: any = $("#new-device-modal");
            const controller = $(this).parent().parent().parent();

            modal.modal("show");
            modal.find(`option[value='${controller.attr("id")}']`).attr("selected", "");
        });
    }

    function graphs() {
        $(".graph-button").on("click", async function () {
            const graph = $(this).parent().siblings(".graph");
            if (!graph.hasClass("loading") && !graph.hasClass("opened")) {
                graph.addClass("loading");
                $(this).attr("disabled", "");

                await initChart(graph);

                $(this).removeAttr("disabled");
                graph.removeClass("loading").addClass("opened");
            } else if (graph.hasClass("opened")) {
                graph.removeClass("opened");
            }
        });
    }

    $(window).on("load", async function () {
        initAccordion();

        deviceClick();

        graphs();

        await connect();
    });

})(jQuery);





