const labelA = document.getElementById('fileA');
const labelB = document.getElementById('fileB');

const btnPlayA = document.getElementById('playA');
const btnPauseA = document.getElementById('pauseA');
const btnPlayB = document.getElementById('playB');
const btnPauseB = document.getElementById('pauseB');

const mstVolSlider = document.getElementById('masterVol');
const pitchSliderA = document.getElementById('pitchA');
const pitchSliderB = document.getElementById('pitchB');
const fadeSlider = document.getElementById('crossfader');

// Create main audio context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Master gain node (final stage)
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);

// Deck structures
let deckA = {
    buffer: null,
    source: null,
    gainNode: audioCtx.createGain(),
    pitch: 1.0,
    canvas: document.getElementById('waveA')
};

let deckB = {
    buffer: null,
    source: null,
    gainNode: audioCtx.createGain(),
    pitch: 1.0,
    canvas: document.getElementById('waveB')
};

// Connect to master
deckA.gainNode.connect(masterGain);
deckB.gainNode.connect(masterGain);

// Load and draw waveform once
function loadTrack(file, deck) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
            deck.buffer = audioBuffer;
            drawWaveform(audioBuffer, deck.canvas);
        });
    };
    reader.readAsArrayBuffer(file);
}

function drawWaveform(audioBuffer, canvas) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#12001c';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#00b7ff";
    ctx.shadowBlur = 0;
    ctx.beginPath();

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    for (let i = 0; i < width; i++) {
        const slice = data.slice(i * step, (i + 1) * step);
        const min = Math.min(...slice);
        const max = Math.max(...slice);
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.stroke();
}

// File input listeners
labelA.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.querySelector('#deckA .file .btn').textContent = file.name;
        loadTrack(file, deckA);
    }
});

labelB.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.querySelector('#deckB .file .btn').textContent = file.name;
        loadTrack(file, deckB);
    }
});

// Playback
function playDeck(deck) {
    if (!deck.buffer) return;
    if (deck.source) deck.source.stop();

    const source = audioCtx.createBufferSource();
    source.buffer = deck.buffer;
    source.playbackRate.value = deck.pitch;
    source.connect(deck.gainNode);
    source.start();

    deck.source = source;
}

function stopDeck(deck) {
    if (deck.source) {
        deck.source.stop();
        deck.source = null;
    }
}

// Buttons
btnPlayA.addEventListener('click', () => playDeck(deckA));
btnPauseA.addEventListener('click', () => stopDeck(deckA));
btnPlayB.addEventListener('click', () => playDeck(deckB));
btnPauseB.addEventListener('click', () => stopDeck(deckB));

// Master volume
mstVolSlider.addEventListener('input', (e) => {
    masterGain.gain.value = e.target.value / 100;
});

// Pitch handling (simple version)
function setPitch(deck, semitones) {
    const newPitch = Math.pow(2, semitones / 12);
    deck.pitch = newPitch;
    if (deck.source) {
        deck.source.playbackRate.value = newPitch;
    }
}

pitchSliderA.addEventListener('input', (e) => setPitch(deckA, parseFloat(e.target.value)));
pitchSliderB.addEventListener('input', (e) => setPitch(deckB, parseFloat(e.target.value)));

// Crossfader
fadeSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    deckA.gainNode.gain.value = (100 - value) / 100;
    deckB.gainNode.gain.value = value / 100;
});
