(function ($) {
    "use strict";
    interface BridgeData {
        item: string;
        id: string;
        status: string;
        error: string;
        data: string;
    }

    let chart: any;
    let socket: any = undefined;

    Highcharts.setOptions({
        global: {
            useUTC: false
        },
        plotOptions: {
            series: {
                marker: {
                    enabled: false
                }
            }
        },
        tooltip: {
            enabled: true
        },
        legend: {
            enabled: true
        }
    });

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

    function getPresenceData() {
        const data = {
            apiToken: $("#apiToken").val(),
            action: "subscribe",
            topics: ["controller/+/presence"]
        };

        send(data);
    }

    function send(message: object) {
        socket.send(JSON.stringify(message));
    }

    function updateDOM(data: BridgeData) {
        if (data && data.item && data.item === "controller" && data.status) {
            const item = $(".online-controllers");
            const count = parseInt(item.text());

            if (data.status === "connected") {
                item.text(count + 1);
            } else if (count > 0) {
                item.text(count - 1);
            }
        }
    }

    async function loadPieSeries() {
        let result;

        try {
            result = await sendAjaxRequest("/admin/statistics", {});
        } catch (e) {
            const errorMessage = `An error occurred while fetching the device you clicked on.\n
                    the error: <pre>${e.message}</pre>`;

            ModalDialog.alert("An error occurred", errorMessage, true);
        }

        if (result) {
            const series = chart.get("statsSeries");

            for (const key in result) {
                if (result.hasOwnProperty(key)) {
                    series.addPoint({
                        name: key,
                        y: result[key].count,
                        avgSize: `${result[key].avgObjSize.value}${result[key].avgObjSize.suffix}`,
                        size: `${result[key].size.value}${result[key].size.suffix}`,
                    });
                }
            }
        }
    }

    function initChart(chartName: string) {
        return new Promise((resolve) => {
            chart = Highcharts.chart(chartName, {
                chart: {
                    type: "pie",
                    events: {
                        load: async function () {
                            await loadPieSeries();
                            resolve();
                        }
                    }
                },
                title: {
                    text: "Database statistics"
                },
                tooltip: {
                    formatter: function () {
                        return `Total documents: ${this.y}<br />
                                Total collection size: ${this.point.options.size}<br />
                                Avg. document size: ${this.point.options.avgSize}`;
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: false,
                        size: "90%",
                        center: ["25%", "40%"],
                        cursor: "pointer",
                        dataLabels: {
                            enabled: true,
                            format: "<b>{point.name}</b>: {point.y}",
                            style: {
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || "black"
                            }
                        },
                        showInLegend: true
                    },
                },
                exporting: {
                    enabled: true
                },
                legend: {
                    enabled: true,
                    floating: true,
                    align: "right",
                    layout: "vertical",
                    x: -150,
                    y: -50,
                    labelFormatter : function() {
                        return `Collection: <span style="color: ${this.color}">${this.name}</span><br />
                                total documents: <span style="color: ${this.color}">${this.y}</span><br />
                                total collection size: <span style="color: ${this.color}">${this.size}</span><br />
                                avg. document size: <span style="color: ${this.color}">${this.avgSize}</span>`;
                    }

                },
                series: [{
                    name: "Statistics",
                    id: "statsSeries",
                    type: "pie",
                    data: []
                }]
            });
        });
    }

    function sendAjaxRequest(url: string, data: object, method?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            $.ajax({
                headers: {
                    _csrf: $("#_csrf").val().toString(),
                    authtoken: $("#apiToken").val().toString()
                },
                dataType: "json",
                method: method || "get",
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

    function moveToTable(table: string, row: any): void {
        if (table === "users") {
            const makeAdminButton: any = row.find(".make-admin");
            const uid: string = row.find(".revoke-admin").data("uid");

            row.find(".revoke-admin").removeClass("revoke-admin").addClass("delete-user");

            if (makeAdminButton.length > 0) {
                makeAdminButton.show();
            } else {
                row.find(".revoke").append($(`<button class="make-admin btn btn-success" data-uid="${uid}">Make admin</button>`));
            }

            row.appendTo($("#users").find(".bs-table-body"));
        } else if (table === "admins") {
            row.find(".delete-user").removeClass("delete-user").addClass("revoke-admin");
            row.find(".make-admin").hide();
            row.appendTo($("#admins").find(".bs-table-body"));
        }
    }

    $(window).on("load", async function () {
        const usersTable = $("#users");
        await initChart("total-stats-graph");
        $("div.loading").removeClass("loading");
        await connect();

        usersTable.on("click", ".make-admin", async function () {
            const payload = {
                id: $(this).data("uid").toString(),
                action: "make"
            };
            try {
                await sendAjaxRequest("/admin", payload, "POST");
                moveToTable("admins", $(this).parent().parent());
            } catch (e) {
                const errorMessage = `An error occurred while doing the thing you wanted to do.\n
                    the error: <pre>${e.message}</pre>`;

                ModalDialog.alert("An error occurred", errorMessage, true);
            }
        });

        usersTable.on("click", ".delete-user", async function () {
            const id = {
                id: $(this).data("uid").toString()
            };
            try {
                await sendAjaxRequest("/account/delete", id, "POST");
                $(this).parent().remove();
            } catch (e) {
                const errorMessage = `An error occurred while doing the thing you wanted to do.\n
                    the error: <pre>${e.message}</pre>`;

                ModalDialog.alert("An error occurred", errorMessage, true);
            }
        });

        $("#admins").on("click", ".revoke-admin", async function () {
            const payload = {
                id: $(this).data("uid").toString(),
                action: "revoke"
            };

            try {
                await await sendAjaxRequest("/admin", payload, "POST");
                moveToTable("users", $(this).parent());
            } catch (e) {
                const errorMessage = `An error occurred while doing the thing you wanted to do.\n
                    the error: <pre>${e.message}</pre>`;

                ModalDialog.alert("An error occurred", errorMessage, true);
            }
        });
    });
})(jQuery);