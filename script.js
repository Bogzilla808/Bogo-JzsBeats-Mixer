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

const highSliderA = document.getElementById('eqHighSliderA');
const midSliderA = document.getElementById('eqMidSliderA');
const lowSliderA = document.getElementById('eqLowSliderA');
const highSliderB = document.getElementById('eqHighSliderB');
const midSliderB = document.getElementById('eqMidSliderB');
const lowSliderB = document.getElementById('eqLowSliderB');

//Creating the filters for each slider in each deck
deckA.lowFilter = audioCtx.createBiquadFilter();
deckA.lowFilter.type = 'lowshelf';
deckA.lowFilter.frequency.setValueAtTime(250,audioCtx.currentTime);
deckA.midFilter = audioCtx.createBiquadFilter();
deckA.midFilter.type = 'peaking';
deckA.midFilter.frequency.setValueAtTime(1250,audioCtx.currentTime);
deckA.midFilter.Q.setValueAtTime(0.7, audioCtx.currentTime);
deckA.highFilter = audioCtx.createBiquadFilter();
deckA.highFilter.type = 'highshelf';
deckA.highFilter.frequency.setValueAtTime(4000,audioCtx.currentTime);

deckB.lowFilter = audioCtx.createBiquadFilter();
deckB.lowFilter.type = 'lowshelf';
deckB.lowFilter.frequency.setValueAtTime(250, audioCtx.currentTime);
deckB.midFilter = audioCtx.createBiquadFilter();
deckB.midFilter.type = 'peaking';
deckB.midFilter.frequency.setValueAtTime(1250, audioCtx.currentTime);
deckB.midFilter.Q.setValueAtTime(0.7, audioCtx.currentTime);
deckB.highFilter = audioCtx.createBiquadFilter();
deckB.highFilter.type = 'highshelf';
deckB.highFilter.frequency.setValueAtTime(4000, audioCtx.currentTime);

//Chaining Source -> Low -> Mid -> High -> GainNode
deckA.lowFilter.connect(deckA.midFilter);
deckA.midFilter.connect(deckA.highFilter);
deckA.highFilter.connect(deckA.gainNode);

deckB.lowFilter.connect(deckB.midFilter);
deckB.midFilter.connect(deckB.highFilter);
deckB.highFilter.connect(deckB.gainNode);


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
    source.connect(deck.lowFilter);
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

//EQ sliders
//Displaying the values
 
const createValueDisplay = (slider, lblText) =>
{
const display = document.createElement('span');
display.id = `${slider.id}Value`;
display.textContent = `${slider.value} dB`;
slider.parentNode.insertBefore(display,slider.nextSibling);
return display;
}

const highValueDisplayA = createValueDisplay(highSliderA,'High');
const midValueDisplayA = createValueDisplay(midSliderA,'Mid');
const lowValueDisplayA = createValueDisplay(lowSliderA, 'Low');

const highValueDisplayB = createValueDisplay(highSliderB,'High');
const midValueDisplayB = createValueDisplay(midSliderB,'Mid');
const lowValueDisplayB = createValueDisplay(lowSliderB, 'Low');

// Event listener for displaying the new values

function handleSliderChange (event)
{
    const slider = event.target;
    const value = slider.value;
    document.getElementById(`${slider.id}Value`).textContent = `${value} dB`;
    applyEQGain(slider.id,value);
}

highSliderA.addEventListener('input',handleSliderChange);
midSliderA.addEventListener('input',handleSliderChange);
lowSliderA.addEventListener('input',handleSliderChange);
highSliderB.addEventListener('input',handleSliderChange);
midSliderB.addEventListener('input',handleSliderChange);
lowSliderB.addEventListener('input',handleSliderChange);

function applyEQGain(sliderId, gainValue) 
{
const valueInDB = parseFloat(gainValue);


if(sliderId.endsWith('A'))
{
    const deck = deckA;
    if(sliderId.startsWith('eqHigh'))
    {
        deck.highFilter.gain.setValueAtTime(valueInDB,audioCtx.currentTime);
    }
    else if(sliderId.startsWith('eqMid'))
    {
        deck.midFilter.gain.setValueAtTime(valueInDB,audioCtx.currentTime);
    }
    else if(sliderId.startsWith('eqLow'))
    {
        deck.lowFilter.gain.setValueAtTime(valueInDB, audioCtx.currentTime)
    }
}
if(sliderId.endsWith('B'))
{
    const deck = deckB;
    if(sliderId.startsWith('eqHigh'))
    {
        deck.highFilter.gain.setValueAtTime(valueInDB,audioCtx.currentTime);
    }
    else if(sliderId.startsWith('eqMid'))
    {
        deck.midFilter.gain.setValueAtTime(valueInDB,audioCtx.currentTime);
    }
    else if(sliderId.startsWith('eqLow'))
    {
        deck.lowFilter.gain.setValueAtTime(valueInDB, audioCtx.currentTime)
    }
}

}




