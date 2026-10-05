const videoElement = document.querySelector(".input_video");
const canvasElement = document.querySelector(".output_canvas");
const canvasCtx = canvasElement.getContext("2d");

const result = document.getElementById("result");
const sentence = document.getElementById("sentence");

let detectedSentence = [];
let lastSign = "";
let lastTime = 0;


// MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);


// Simple finger detection
function fingerOpen(landmarks, tip, pip) {
    return landmarks[tip].y < landmarks[pip].y;
}


// Recognize sign
function recognizeSign(lm) {

    const index = fingerOpen(lm, 8, 6);
    const middle = fingerOpen(lm, 12, 10);
    const ring = fingerOpen(lm, 16, 14);
    const pinky = fingerOpen(lm, 20, 18);

    // Open hand = HELLO
    if (index && middle && ring && pinky) {
        return "HELLO";
    }

    // Index + pinky = LOVE
    if (index && !middle && !ring && pinky) {
        return "LOVE";
    }

    // Closed hand = STOP
    if (!index && !middle && !ring && !pinky) {

        // Thumb pointing upward
        if (lm[4].y < lm[3].y) {
            return "YES";
        }

        // Otherwise closed fist
        return "STOP";
    }

    return "UNKNOWN";
}


// Add word
function addToSentence(sign) {

    const now = Date.now();

    if (
        sign === lastSign &&
        now - lastTime < 1500
    ) {
        return;
    }

    if (sign !== "UNKNOWN") {

        detectedSentence.push(sign);

        sentence.innerText =
            detectedSentence.join(" ");

        lastSign = sign;
        lastTime = now;
    }
}


// Camera results
function onResults(results) {

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    canvasCtx.save();

    canvasCtx.clearRect(
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );

    canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );


    if (results.multiHandLandmarks) {

        for (const landmarks of results.multiHandLandmarks) {

            drawConnectors(
                canvasCtx,
                landmarks,
                HAND_CONNECTIONS,
                {
                    color: "#00FF00",
                    lineWidth: 4
                }
            );

            drawLandmarks(
                canvasCtx,
                landmarks,
                {
                    color: "#FF0000",
                    lineWidth: 2
                }
            );


            const sign =
                recognizeSign(landmarks);


            if (sign === "UNKNOWN") {

                result.innerText =
                    "Hand detected ✋";

            } else {

                result.innerText =
                    sign;

                addToSentence(sign);
            }
        }

    } else {

        result.innerText =
            "Show your hand ✋";
    }

    canvasCtx.restore();
}


// START CAMERA
const camera = new Camera(videoElement, {

    onFrame: async () => {

        await hands.send({
            image: videoElement
        });

    },

    width: 640,
    height: 480
});

camera.start();


// Speak
function speakText() {

    const text =
        detectedSentence.join(" ");

    if (text === "") {
        alert("No text detected!");
        return;
    }

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
}


// Clear
function clearSentence() {

    detectedSentence = [];

    sentence.innerText = "";

    result.innerText =
        "Waiting...";

    lastSign = "";
    lastTime = 0;
}
function selectSign(sign) {

    result.innerText = sign;

    detectedSentence.push(sign);

    sentence.innerText =
        detectedSentence.join(" ");
}