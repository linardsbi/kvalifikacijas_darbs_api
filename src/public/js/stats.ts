(function ($) {
    "use strict";
    let chart: any;

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
            enabled: false
        }
    });

    function getSeries() {
        const series: Array<Array<any>> = [];
        $("#totals span").each((index, element) => {
            series.push([element.className, parseInt(element.innerText), true]);
        });

        return series;
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
                        console.log("key", this.key);
                        return "test";
                        // 'name: ' + this.key + ' <br/>y:' + this.y + '<br/>Size' + this.point.options.size + '<br/>Avg. object size' + this.point.options.size;
                        // else return 'name: ' + this.key + ' <br/>y:' + this.y;
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: false,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: "<b>{point.name}</b>: {point.y}",
                            style: {
                                color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                            }
                        }
                    }
                },
                exporting: {
                    enabled: true
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