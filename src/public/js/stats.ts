(function ($) {
    "use strict";
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

    function initChart(chartObject: any) {
        return new Promise((resolve) => {
            chartObject.highcharts({
                chart: {
                    type: "pie",
                    events: {
                        load: async function () {
                            resolve();
                        }
                    }
                },
                title: {
                    text: "Database statistics"
                },
                xAxis: {

                },
                yAxis: {},
                tooltip: {

                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
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
                legend: {
                    enabled: true
                },
                exporting: {
                    enabled: true
                },
                series: [{
                    name: "Data",
                    keys: ["name", "y", "selected", "sliced"],
                    data: getSeries(),
                    showInLegend: true
                }]
            });
        });
    }

    function sendAjaxRequest(url: string, data: object, method?: string) {
        return new Promise((resolve, reject) => {
            $.ajax({
                headers: {
                    _csrf: $("#_csrf").val().toString()
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
        console.log(getSeries());
        await initChart($("#total-stats-graph"));

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