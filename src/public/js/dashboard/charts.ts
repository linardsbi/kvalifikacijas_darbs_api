// import * as Highcharts from "highcharts";
// TODO: customisable charts (more db stuff), chart wrapper object, switch to webpack

(function ($) {
    "use strict";
    let chart: any;

    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    function queryLatestData() {
        return new Promise((resolve, reject) => {
            const query = {
                query: {
                    select: [
                        {
                            createdAt$between: ["NOW", "5d ago"]
                        }
                    ]
                }
            };
            const url = `data/get?query=${JSON.stringify(query)}`;

            $.ajax({
                headers: {
                    authtoken: $("#apiToken").val().toString()
                },
                method: "get",
                url: url,
                success: (response) => {
                    resolve(response);
                },
                error: (response: any) => {
                    const errorMessage = `An error occurred while fetching the device you clicked on.\n
                    the error: <pre>${response.responseJSON.error}</pre>`;

                    ModalDialog.alert("An error occurred", errorMessage, true);
                }
            });
        });
    }

    async function getLatestData() {
        const response: any = await queryLatestData();
        const deviceIDs: any = {};
        const currentSeries: any = {};


        if (response[0] && response[0].success) {
            response.splice(0, 1);
        }
        console.log(response);

        response.forEach((value: any, index: number) => {

            if (value[index]) {
                value = value[index];

                if (!deviceIDs[`${value.device.name} (${value.device.pin_name})`]) {
                    deviceIDs[`${value.device.name} (${value.device.pin_name})`] = value.device._id;
                }

                if (!currentSeries[`${value.device.name} (${value.device.pin_name})`]) {
                    currentSeries[`${value.device.name} (${value.device.pin_name})`] = [[Date.parse(value.createdAt), parseFloat(value.payload.payload_body)]];
                } else {
                    currentSeries[`${value.device.name} (${value.device.pin_name})`]
                        .push(
                            [Date.parse(value.createdAt), parseFloat(value.payload.payload_body)]);
                }
            }
        });

        Object.keys(currentSeries).forEach((value) => {
            chart.addSeries({
                name: value,
                type: "line",
                yAxis: "1",
                id: deviceIDs[value],
                data: currentSeries[value]
            });
        });

    }

    function initChart() {
        return new Promise(async (resolve) => {
            // const dataSeries = await getLatestData();
            // const firstSeriesName = Object.keys(dataSeries)[0];
            // console.log(firstSeriesName, dataSeries[firstSeriesName]);
            Highcharts.error = function (code) {
                // See https://github.com/highcharts/highcharts/blob/master/errors/errors.xml
                // for error id's
                $("#sensor-graph").text(`An error occurred: ${code}`);
            };

            chart = Highcharts.stockChart("sensor-graph", {
                chart: {
                    type: 'spline',
                    animation: Highcharts.svg,
                    events: {
                        load: async function () {
                            await getLatestData();
                            resolve();
                        }
                    }
                },
                title: {
                    text: 'Sensor Data'
                },
                xAxis: {
                    type: "datetime",
                    tickPixelInterval: 150
                },
                yAxis: {
                    title: {
                        text: 'Value'
                    },
                    id: "1",
                    plotLines: [{
                        value: 0,
                        width: 1,
                        color: '#808080'
                    }]
                },
                rangeSelector: {
                    enabled: true
                },
                legend: {
                    enabled: true
                },
                exporting: {
                    enabled: true
                },
                series: [

                ]
            });
        });
    }

    function graphs() {
        $(".graph-button").on("click", async function () {
            const graph = $(this).parent().siblings(".graph");
            if (!graph.hasClass("loading") && !graph.hasClass("opened")) {
                graph.addClass("loading");
                $(this).attr("disabled", "");

                await initChart();

                $(this).text("Refresh");
                $(this).removeAttr("disabled");
                graph.removeClass("loading").addClass("opened");
            } else if (graph.hasClass("opened")) {
                graph.removeClass("opened");
            }
        });
    }

    $(window).on("load", function () {
        graphs();
    });


})(jQuery);