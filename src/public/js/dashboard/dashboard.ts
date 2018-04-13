"use strict";

let socket: any = null;

function getDevices() {
    const controllerIDs: string[] = [];
    $(".controller-machine-name").each((index, element) => {
        if (element.innerText) {
            controllerIDs.push(`controllers/${element.innerText}/presence`);
        }
    });

    return controllerIDs;
}

function getPresenceData() {
    const devices = getDevices();
    if (devices[0]) {
        const data = {
            apiToken: $("#apiToken").val(),
            action: "subscribe",
            topics: devices
        };

        send(data);
    }
}

function updateDOM(data: object) {
    if (data && data.item) {
        $(`[id=${data.item}]`).find(".status").removeClass("disconnected").addClass("connected");
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
            const data = JSON.parse(event.data);
            updateDOM(data);
        });
    });
}

$(window).on('load', async function () {
    await connect();

    // retain test
    setTimeout(() => {
        const payload = {
            action: "publish",
            topic: "controllers/aaa/presence",
            payload: "get",
            apiToken: $("#apiToken").val(),
            options: {
                retain: true
            }
        };

        send(payload);
    }, 5000);
});


