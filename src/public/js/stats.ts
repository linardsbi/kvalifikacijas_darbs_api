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
                        center:['25%', '40%'],
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: "<b>{point.name}</b>: {point.y}",
                            style: {
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
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
                    align:'right',
                    layout: 'vertical',
                    x: -150,
                    y: -50,
                    labelFormatter : function() {
                        console.log(this);
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

    function sendAjaxRequest(url: string, data: object, method?: string) {
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

    $(window).on("load", async function () {
        await initChart("total-stats-graph");

        $(".make-admin").on("click", function () {
            const payload = {
                id: $(this).data("uid").toString(),
                action: "make"
            };
            const response = sendAjaxRequest("/admin", payload, "POST");
            console.log(response);
        });
        $(".delete-user").on("click", function () {
            const id = {
                id: $(this).data("uid").toString()
            };
            const response = sendAjaxRequest("/account/delete", id, "POST");
            console.log(response);
        });
        $(".revoke-admin").on("click", function () {
            const payload = {
                id: $(this).data("uid").toString(),
                action: "revoke"
            };
            const response = sendAjaxRequest("/admin", payload, "POST");
            console.log(response);
        });
    });
})(jQuery);