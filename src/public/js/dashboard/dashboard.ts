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
            const data = JSON.parse(event.data);
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
        $("#new-device-modal").modal("show");
    });
}

$(window).on("load", async function () {
    initAccordion();
    deviceClick();
    await connect();
});


