function $(element) {
    if(typeof(element) === 'string') {
        element = document.getElementById(element);
    }
    return element;
}

function paintInputRed(input) {
    input = $(input);
    input.style.borderBottom='3px solid red';
    input.parentElement.style.borderBottom = 'none';
}

function paintInputGrey(input) {
    input = $(input);
    input.style.borderBottom='2px solid var(--gray)';
    input.parentElement.style.borderBottom = '1px solid white';
}

function paintInputBlue(input) {
    input = $(input);
    input.style.borderBottom='3px solid var(--blue)';
    input.parentElement.style.borderBottom = 'none';
}

function paintInputsGrey() {
    for (let input of document.getElementsByTagName('input')) {
        paintInputGrey(input);
    }
    paintInputGrey($('wallet-id-input'));
}

function wrongInputAlert(labelId, text) {
    const label = $(labelId);
    label.innerHTML = text;
    label.style.visibility = 'visible';
}

function hideWrongInputAlert(labelId) {
    const label = $(labelId);
    label.style.visibility = 'hidden';
}

function hideScreen(screen) {
    $(screen).style.display = 'none';
}

function showScreen(screen) {
    $(screen).style.display = 'flex';
}

function switchScreen(oldScreen, newScreen) {
    hideScreen(oldScreen), showScreen(newScreen);
}

function setPublicAddress(labelId, address) {
    const label = $(labelId);
    label.innerHTML = address;
}

class QRManager {
    QRcodes
    constructor() {
        this.QRcodes = new Map();
    }
    drawQRcode(containerId, data, isBinary, scale) {
        if(this.QRcodes.has(containerId)) {
            this.QRcodes.get(containerId).clear();
        }
        this.QRcodes.set(containerId, new QRCode($(containerId), {
            text: data,
            binary: isBinary,
            width: window.innerHeight * scale,
            height: window.innerHeight * scale,
            correctLevel: QRCode.CorrectLevel.L
        }));
    }
}

function createMethodShowQRPopup(id) {
    return () => {
        $('qr-overlay-' + id).style.display = 'flex';
    };
}

function createMethodHideQRPopup(id) {
    return (e) => {
        if(e.target !== e.currentTarget) {
            return;
        }
        $('qr-overlay-' + id).style.display = 'none';
    }
}

function switchHelpPopup() {
    const label = $('seqno-help-label');
    if(label.style.visibility === 'visible') {
        label.style.visibility = 'hidden';
    } else {
        label.style.visibility = 'visible';
    }
}

function hideHelpPopup(e) {
    const label = $('seqno-help-label');
    if(e.target == label || 
    e.target == $('seqno-help-button')) {
        return;
    }
    label.style.visibility = 'hidden';
}

function modifyMnemonicPageForCreation() {
    $('mnemonic-header').innerHTML = 
    'Generate your 24-word seed phrase here or in any convenient way. Write it down, and enter here';
    $('generate-mnemonic-button').style.display = 'inline-block';
}

function modifyMnemonicPageForTxn() {
    $('mnemonic-header').innerHTML = 'Enter your 24-word seed phrase';
    $('generate-mnemonic-button').style.display = 'none';
}

function setInputAnimation(input) {
    input.onfocus = () => {
        paintInputBlue(input);
    };
    input.addEventListener('focusout', () => {
        paintInputGrey(input);
    });
}

function setQRAnimation(id) {
    if(id !== 3) {
        $('show-address-qr-button-' + id).addEventListener('click', createMethodShowQRPopup(id));
    }
    $('qr-overlay-' + id).onclick = createMethodHideQRPopup(id);
}

function setAnimations() {
    for (let input of document.getElementsByTagName('input')) {
        setInputAnimation(input);
    }
    setQRAnimation(1);
    setQRAnimation(2);
    setQRAnimation(3);
    $('seqno-help-button').onclick = switchHelpPopup;
    $('txn-elements').onclick = hideHelpPopup;
    $('mnemonic-back-button').onclick = () => {
        hideWrongInputAlert('wrong-mnemonic-alert-label');
        paintInputsGrey();
        switchScreen('mnemonic-screen', 'start-screen');
    }
    $('new-wallet-back-button').onclick = () => {
        switchScreen('new-wallet-screen', 'mnemonic-screen');
    }
    $('txn-back-button').onclick = () => {
        switchScreen('txn-screen', 'mnemonic-screen');
    }
}

setAnimations();

