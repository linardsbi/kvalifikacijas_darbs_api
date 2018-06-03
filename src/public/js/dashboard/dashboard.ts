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
        // TODO: make more robust to error other actions
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
        const noDataOverlay: any = $("div.no-data");

        noDataOverlay.hide();

        const chart = $("#sensor-graph").highcharts();
        if (chart) {
            const existingSeries = chart.get(data.id);
            if (existingSeries) {
                existingSeries.addPoint([(new Date()).getTime(), parseInt(data.data.payload)]);
            } else {
                if (data.data.device) {
                    chart.addSeries({
                        name: `${data.data.device.name} (${data.data.device.pin_name})`,
                        type: "line",
                        yAxis: "1",
                        id: data.id,
                        data: [
                            [(new Date()).getTime(), parseInt(data.data.payload)]
                        ]
                    });
                }
            }
        }

        if (!$("#sensor-graph").find(".overlay").length) {
            // chart.addSeries({
            //     name: 'Rainfall',
            //     type: 'column',
            //     color: '#08F',
            //     yAxis: 'rainfall-axis',
            //     data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
            // }, false, false);
        } else {

        }
    }

    function send(message: object) {
        socket.send(JSON.stringify(message));
    }

    function connect() {
        return new Promise((resolve) => {
            socket = new WebSocket(`ws://${window.location.hostname}:8080`);

            socket.addEventListener("open", function () {
                getPresenceData();
                resolve();
            });

            socket.addEventListener("close", async function () {
                setTimeout(async () => {
                    $("footer").addClass("active");
                    await connect();
                    $("footer").removeClass("active");
                }, 500);
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
        $(".bs-table-head").on("click", function() {
            const parent = $(this).parent();
            if (parent.hasClass("active")) {
                parent.removeClass("active");
            } else {
                parent.addClass("active");
            }
        });
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
        const input = $("<input autofocus class='controller-name-input form-control' type='text'>");
        let temp: any;
        $(".delete-controller").on("click", function () {
            const id = $(this).siblings(".controller-id").text();

            ModalDialog.confirm("Delete device", "<b>This action is irreversible! Are you sure?</b>", true, function () {
                sendAjaxRequest("/controllers/delete", {_id: id}, "DELETE")
                    .then(result => {
                        console.log("result", result);
                        $(this).parent().parent().parent().remove();
                    })
                    .catch(error => {
                        const errorMessage = `An error occurred while deleting the controller.\n
                    the error: <pre>${error}</pre>`;

                        ModalDialog.alert("An error occurred", errorMessage, true);
                    });
            });
        });
        $(".edit-controller").on("click", function () {
            const item = $(this).parent().siblings(".controller-name");
            const checkMark = $(this).parent().siblings(".save-controller");

            $(this).hide();
            item.show();
            checkMark.show();
            input.val(item.text());
            temp = item.text();

            item.text("");
            item.append(input);
            input.focus();
        });
        $(".save-controller").on("click", function () {
            const name = $(this).siblings(".actions").find(".edit-controller");
            const input = $(this).siblings(".controller-name").find("input");
            const controllerId = $(this).siblings(".actions").find(".controller-id").text();

            $(this).hide();
            $(this).siblings(".controller-name").text(input.val().toString());
            name.show();

            temp = input.val();

            input.remove();

            sendAjaxRequest("/controllers/edit", {_id: controllerId, name: temp}, "PATCH")
                .then((result) => {
                    console.log(result);
                })
                .catch((err) => {
                    console.log(err);
                });
        });
    }

    function writeActionListeners() {
        $(".device-toggle").on("click", function (item) {
            const target = $(item.target);
            const machineName = target.parent().parent().parent().siblings(".controller-machine-name").text();
            const data = {
                apiToken: $("#apiToken").val(),
                topic: `controllers/${machineName}/write/device/digital/${$(this).attr("id")}`,
                action: "publish",
                payload: "",
                options: {
                    retain: true,
                    qos: 1
                }
            };

            if (target.is(":checked")) {
                data.payload = "HIGH";
            } else {
                data.payload = "LOW";
            }

            send(data);
        });
    }

    $(window).on("load", async function () {
        initAccordion();

        deviceClick();

        await connect();

        incomingDataListener();

        addUDListeners();

        writeActionListeners();
    });

})(jQuery);





