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

// Store decks in memory
let deckA = {
    buffer: null,
    source: null,
    gainNode: audioCtx.createGain(),
    pitch: 1.0
};

let deckB = {
    buffer: null,
    source: null,
    gainNode: audioCtx.createGain(),
    pitch: 1.0
};

// Connect gains to destination
deckA.gainNode.connect(audioCtx.destination);
deckB.gainNode.connect(audioCtx.destination);

// Load audio from file inputs
function loadTrack(file, deck) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
            deck.buffer = audioBuffer; // save decoded audio
        });
    }
    reader.readAsArrayBuffer(file);
}

// Deck A file input
labelA.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const el = document.querySelector('#deckA .file');
        el.querySelector('.btn').textContent = file.name;
        loadTrack(file, deckA);
    }
});

// Deck B file input
labelB.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const el = document.querySelector('#deckB .file');
        el.querySelector('.btn').textContent = file.name;
        loadTrack(file, deckB);
    }
});

// Play functionality
function playDeck(deck) {
    if(!deck.buffer) return; // No track loaded

    // Stop previous source if playing
    if(deck.source) deck.source.stop();

    // Create a new buffer source
    const source = audioCtx.createBufferSource();
    source.buffer = deck.buffer;

    // Apply pitch
    source.playbackRate.value = deck.pitch;

    // Connect source -> gain --> destination
    source.connect(deck.gainNode);

    source.start();
    deck.source = source;
}

function stopDeck(deck) {
    if(deck.source) {
        deck.source.stop();
        deck.source = null;
    }
}

// Add event listeners for play/pause buttons
btnPlayA.addEventListener('click', () => playDeck(deckA));
btnPauseA.addEventListener('click', () => stopDeck(deckA)); // placeholder

btnPlayB.addEventListener('click', () => playDeck(deckB));
btnPauseB.addEventListener('click', () => stopDeck(deckB)); // placeholder

// Master Volume control (GainNodes)
mstVolSlider.addEventListener('input', (e) => {
    const vol = e.target.value / 100; // convert 0-100 to 0-1
    deckA.gainNode.gain.value = vol;
    deckB.gainNode.gain.value = vol;
});

// TODO: individual deck volume can be added similarly
// deckA.gainNode.gain.value = valueFromKnob;
// deckB.gainNode.gain.value = valueFromKnob;


// Pitch control
pitchSliderA.addEventListener('input', (e) => {
    const semitones = parseFloat(e.target.value);
    // convert semitone to playbackRate
    deckA.pitch = Math.pow(2, semitones / 12);
    if (deckA.source) 
        deckA.source.playbackRate.value = deckA.pitch;
});

pitchSliderB.addEventListener('input', (e) => {
    const semitones = parseFloat(e.target.value);
    deckB.pitch = Math.pow(2, semitones / 12);
    if (deckB.source) 
        deckB.source.playbackRate.value = deckB.pitch;
});

// Crossfader functionality
fadeSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value) // 0 to 100
    const gainA = (100 - value) / 100;
    const gainB = value / 100;

    deckA.gainNode.gain.value = gainA;
    deckB.gainNode.gain.value = gainB;
});

// TODO: FIX BUG - when changing mst vol after crossfade, the crossfade resets