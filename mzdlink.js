(function () {

    function startMzdlink() {
        $(document).ready(function () {

            var ws = new ReconnectingWebSocket("ws://127.0.0.1:8080/mzdlink");

            var MOBILE_SCREEN = {
                x: 1920,
                y: 1080
            };

            var MAZDA_SCREEN = {
                x: 800,
                y: 480
            };

            var PORTRAIT_MODE = {
                width: Math.floor(MAZDA_SCREEN.y * (MAZDA_SCREEN.y / MAZDA_SCREEN.x)),
                x: Math.floor((MAZDA_SCREEN.x - MAZDA_SCREEN.y * (MAZDA_SCREEN.y / MAZDA_SCREEN.x)) / 2)
            };

            var BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

            var canvas = document.createElement("canvas");
            canvas.id = "mobile-screen";
            canvas.width = MAZDA_SCREEN.x;
            canvas.height = MAZDA_SCREEN.y;
            canvas.style.left = 0;
            canvas.style.top = 0;
            canvas.style.zIndex = 1010;
            canvas.style.position = "absolute";
            canvas.style.border = "1px solid";
            document.body.appendChild(canvas);

            var g = canvas.getContext('2d');

            var landscape = false;

            ws.onmessage = function (evt) {
                var img = new Image();
                img.onload = function () {
                    if (landscape = (img.width > img.height)) {
                        g.drawImage(img, 0, 0, canvas.width, canvas.height);
                    } else {
                        g.clearRect(0, 0, canvas.width, canvas.height);
                        g.drawImage(img, PORTRAIT_MODE.x, 0, PORTRAIT_MODE.width, canvas.height);
                    }
                    img.onload = null;
                    img.src = BLANK_IMG;
                    img = null;
                };
                img.src = "data:image/png;base64," + evt.data;
            };

            // Touch hook
            var hammer = new Hammer.Manager(canvas);
			hammer.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
			hammer.add( new Hammer.Press() );
			hammer.add( new Hammer.Tap() );
			
            hammer.on("tap press pressup panstart panmove panend", function (evt) {
                var origX = evt.center.x;
                var origY = evt.center.y;
                var x;
                var y;
                console.log(origX + " : " + origY + " - " + evt.type);
                if (ws.readyState !== WebSocket.OPEN) {
                    return;
                }
                if (landscape) {
                    x = Math.floor(MOBILE_SCREEN.x * origX / MAZDA_SCREEN.x);
                    y = MOBILE_SCREEN.y - Math.floor(MOBILE_SCREEN.y * origY / MAZDA_SCREEN.y);
                } else {
                    if (origX < PORTRAIT_MODE.x || origX > PORTRAIT_MODE.x + PORTRAIT_MODE.width) {
                        ws.send("u 0\nc\n");
                        return;
                    }
                    y = Math.floor(MOBILE_SCREEN.y * (origX - PORTRAIT_MODE.x) / PORTRAIT_MODE.width);
                    x = Math.floor(MOBILE_SCREEN.x * origY / MAZDA_SCREEN.y);
                }
                switch (evt.type) {
                    case "tap":
                        ws.send("d 0 " + y + " " + x + "\nc\nu 0\nc\n");
                        break;
					case "press":
                        ws.send("d 0 " + y + " " + x + "\nc\n");
                        break;
					case "pressup":
                        ws.send("u 0\nc\n");
                        break;
					case "panstart":
						ws.send("d 0 " + y + " " + x + "\nc\n");
						break;
                    case "panmove":
                        ws.send("m 0 " + y + " " + x + "\nc\n");
                        break;
					case "panend":
						ws.send("m 0 " + y + " " + x + "\nc\nu 0\nc\n");
                        break;			
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById("jquery-script")) {
            var docBody = document.getElementsByTagName("body")[0];
            if (docBody) {
                var script = document.createElement("script");
                script.setAttribute("id", "jquery-script");
                script.setAttribute("src", "/jci/gui/mzdlink/jquery-3.1.1.min.js"); // https://code.jquery.com/jquery-3.1.1.min.js
                script.addEventListener('load', function () {
                    var script = document.createElement("script");
                    script.setAttribute("id", "hammer-script");
                    script.setAttribute("src", "/jci/gui/mzdlink/hammer.min.js"); // http://hammerjs.github.io/dist/hammer.min.js
                    script.addEventListener('load', function () {
                        var script = document.createElement("script");
                        script.setAttribute("id", "websocket-script");
                        script.setAttribute("src", "/jci/gui/mzdlink/reconnecting-websocket.min.js"); // https://rawgit.com/joewalnes/reconnecting-websocket/master/reconnecting-websocket.min.js
                        script.addEventListener('load', function () {
                            var script = document.createElement("script");
                            script.textContent = "(" + startMzdlink.toString() + ")();";
                            docBody.appendChild(script);
                        }, false);
                        docBody.appendChild(script);
                    }, false);
                    docBody.appendChild(script);
                }, false);
                docBody.appendChild(script);
            }
        }
    });
})();
