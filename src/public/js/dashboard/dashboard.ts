(function ($) {
    "use strict";

    interface BridgeData {
        item: string;
        id: string;
        status: string;
        error: string;
        data: string;
    }

    let socket: any = undefined;

    function getControllers(online?: boolean): string[] {
        const controllerIDs: string[] = [];
        if (online) {
            $(".controller-machine-name").each((index, element) => {
                if (element.innerText && $(element).parent().siblings(".info").find(".status").hasClass("connected")) {
                    controllerIDs.push(element.innerText);
                }
            });
        } else {
            $(".controller-machine-name").each((index, element) => {
                if (element.innerText) {
                    controllerIDs.push(element.innerText);
                }
            });
        }

        return controllerIDs;
    }

    function getPresenceData() {
        let controllers: string[] = getControllers();

        controllers = controllers.map((device) => {
            return `controllers/${device}/presence`;
        });

        if (controllers[0]) {
            const data = {
                apiToken: $("#apiToken").val(),
                action: "subscribe",
                topics: controllers
            };

            send(data);
        }
    }

    function updateDOM(data: BridgeData) {
        // TODO: make more robust to handle other actions
        if (data && data.item) {
            switch (data.item) {
                case "controller":
                    const status = $(document.getElementById(data.id)).find(".status");

                    if (data.status === "connected") {
                        status.removeClass("disconnected").addClass("connected");
                    } else {
                        status.removeClass("connected").addClass("disconnected");
                    }
                    break;
                case "device":
                    handleIncomingDeviceData(data);
                    break;
                default:
                    console.log(data.item);
            }
        } else {
            // $(".controller-page").text("No devices added yet!").addClass("no-devices");
        }
    }

    function handleIncomingDeviceData(data: any) {
        const dataContainer = $(".device-overview .data");

        if ($(".graph").hasClass("opened")) {
            const chart = $(".graph").highcharts();

            // chart.addSeries({
            //     name: 'Rainfall',
            //     type: 'column',
            //     color: '#08F',
            //     yAxis: 'rainfall-axis',
            //     data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
            // }, false, false);
        } else {
            if (!document.querySelectorAll(`.${data.id}`).length) {
                $(".device-overview .data").append(`<div class="${data.id}">${data.data}</div>`);
            }
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
                console.log(data);
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
        // $(".device").on("click", function () {
        //     $(".device-overview").css({"width": "50%"});
        // });
        // $(".device-overview .close").on("click", function () {
        //     $(".device-overview").css({"width": "0"});
        // });
        $(".device-new").on("click", function () {
            const modal: any = $("#new-device-modal");
            const controller = $(this).parent().parent().parent();

            modal.modal("show");
            modal.find(`option[value='${controller.attr("id")}']`).attr("selected", "");
        });
    }

    function incomingDataListener() {
        let controllers: string[] = getControllers();

        controllers = controllers.map((controller) => {
            return `controllers/${controller}/read/device/#`;
        });

        if (controllers[0]) {
            const data = {
                apiToken: $("#apiToken").val(),
                action: "subscribe",
                topics: controllers
            };

            send(data);
        }
    }

    function addUDListeners() {
        const input = $("<input class='controller-name-input' type='text'>");
        let temp: any;
        $(".delete-controller").on("click", function () {
            const id = $(this).parent().next().find(".controller-machine-name").text();


        });
        $(".edit-controller").on("click", function () {
            const name = $(this).siblings(".controller-name");
            $(this).hide();
            $(this).next().show();

            input.val(name.text());
            temp = name;

            name.replaceWith(input);
        });
        $(".save-controller").on("click", function () {
            const name = $(this).siblings(".controller-name-input");
            $(this).hide();
            $(this).prev().show();
            temp.text(name.val());

            name.replaceWith(temp);
        });
    }


    $(window).on("load", async function () {
        initAccordion();

        deviceClick();

        await connect();

        incomingDataListener();

        addUDListeners();
    });

})(jQuery);





