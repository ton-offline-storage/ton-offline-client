const tonweb = new window.TonWeb();
const tonMnemonic = window.TonWeb.mnemonic;
const DEFAULT_WALLET_VERSION = 'v3R2';
const MNEMONIC_WORDS_COUNT = 24;
const WalletClass = tonweb.wallet.all[DEFAULT_WALLET_VERSION];
const qrManager = new QRManager();
let txnCreator;


async function generateMnemonic() {
    const mnemonic = await tonMnemonic.generateMnemonic();
    for(let i = 1; i <= MNEMONIC_WORDS_COUNT; ++i) {
        $('word-input-' + i).value = mnemonic[i - 1];
    }
    paintInputsGrey();
    hideWrongInputAlert('wrong-mnemonic-alert-label');
}

function isWordInList(word) {
    return tonMnemonic.wordlists.EN.includes(word);
}

async function processMnemonic() {
    hideWrongInputAlert('wrong-mnemonic-alert-label');
    paintInputsGrey();
    const mnemonic = [];
    for(let i = 1; i <= MNEMONIC_WORDS_COUNT; ++i) {
        mnemonic.push($('word-input-' + i).value.trim());
    }
    if(mnemonic.includes('')) {
        for(let i = 1; i <= MNEMONIC_WORDS_COUNT; ++i) {
            if(mnemonic[i - 1] === '') {
                paintInputRed('word-input-' + i);
            }
        }
        wrongInputAlert('wrong-mnemonic-alert-label', 'Some words are empty!');
        return null;
    } else if(mnemonic.some((value) => {return !isWordInList(value);})) {
        mnemonic.forEach((value, index, array) => {
            if(!isWordInList(value)) {
                paintInputRed('word-input-' + (index + 1));
            }
        });
        wrongInputAlert('wrong-mnemonic-alert-label', 'Some words are not in list!');
        return null;
    } else if(! await tonMnemonic.validateMnemonic(mnemonic)) {
        wrongInputAlert('wrong-mnemonic-alert-label', 'This mnemonic doesn\'t follow TON standart!');
        return null;
    } else {
        return mnemonic;
    }
}


async function createWallet() {
    const mnemonic = await processMnemonic();
    if(!mnemonic) {
        return;
    }
    const keyPair = await tonMnemonic.mnemonicToKeyPair(mnemonic);
    const wallet = new WalletClass(undefined, {publicKey: keyPair.publicKey, wc: 0});
    const address = await wallet.getAddress();
    setPublicAddress('public-address-label', address.toString(true, true, true));

    const deploy = await wallet.deploy(keyPair.secretKey);
    const deployQuery = await deploy.getQuery();
    const boc = await deployQuery.toBoc(false);
    $('download-boc-link').href = 'data:application/octet-stream;base64,' 
    + tonweb.utils.bytesToBase64(boc);
    qrManager.drawQRcode('deployment-qr-code', String.fromCharCode.apply(null, boc), true, 0.35);
    qrManager.drawQRcode('qr-container-1', address.toString(true, true, true), false, 0.4);
    switchScreen('mnemonic-screen', 'new-wallet-screen');
}

class TxnCreator {
    #keyPair
    #wallet
    constructor(keyPair) {
        this.#keyPair = keyPair;
        this.#wallet = new WalletClass(undefined, {publicKey: keyPair.publicKey, wc: 0});
    }
    async myAddress() {
        const address = await this.#wallet.getAddress();
        return address.toString(true, true, true);
    }
    async sign(address, nanoAmount, seqno, comment) {
        const txn = await this.#wallet.methods.transfer({
            secretKey: this.#keyPair.secretKey,
            toAddress: address,
            amount: nanoAmount,
            seqno: seqno,
            payload: comment
        });
        const query = await txn.getQuery().then((res) => res).catch((err) => {throw err});
        const boc = await query.toBoc(false);
        return boc;
    }
}

async function prepareForTxn() {
    const mnemonic = await processMnemonic();
    if(!mnemonic) {
        return;
    }
    txnCreator = new TxnCreator(await tonMnemonic.mnemonicToKeyPair(mnemonic));
    const address = await txnCreator.myAddress();
    qrManager.drawQRcode('qr-container-2', address, false, 0.4);
    setPublicAddress('public-address-label-2', address);
    switchScreen('mnemonic-screen', 'txn-screen');
}

function noMoreThan9Decimals(x) {
    return Number(x) === Number(Number(x).toFixed(9));
}

function createMethodAssertInput(alertLabelId) {
    return (condition, inputId, message) => {
        if(!condition) {
            paintInputRed(inputId);
            wrongInputAlert(alertLabelId, message);
            throw message;
        }
    };
}

const assertTxnInput = createMethodAssertInput('wrong-txn-alert-label');

async function createTransaction() {
    hideWrongInputAlert('wrong-txn-alert-label');
    paintInputGrey('recipient-address-input');
    paintInputGrey('amount-input');
    paintInputGrey('seqno-input');

    const recepientAdress = $('recipient-address-input').value;
    assertTxnInput(tonweb.Address.isValid(recepientAdress), 'recipient-address-input', 
    'Recepient address is invalid!');
    let amount = $('amount-input').value;
    assertTxnInput(isFinite(amount), 'amount-input', 'The amount is completely invalid!');
    assertTxnInput(noMoreThan9Decimals(amount), 'amount-input', 'No more than 9 digits after the decimal point are allowed');
    amount = Number(amount).toFixed(9);
    let nanoAmount = new tonweb.utils.BN(0);
    try {
        nanoAmount = tonweb.utils.toNano(amount);
    } catch(e) {
        assertTxnInput(false, 'amount-input', 'Amount is invalid');
    }
    assertTxnInput(nanoAmount.gt(new tonweb.utils.BN(0)), 'amount-input', 'Amount must be positive!');

    assertTxnInput($('seqno-input').value !== '', 'seqno-input', 
    'Enter seqno number');
    const seqno = Number($('seqno-input').value);
    assertTxnInput(Number.isInteger(seqno), 'seqno-input', 'Seqno must be an integer!');
    assertTxnInput(seqno >= 0, 'seqno-input', 'Seqno must be non-negative!');

    const comment = $('comment-input').value;
   
    const boc = await txnCreator.sign(recepientAdress, nanoAmount, seqno, comment)
    .then((res) => res).catch((err) => {
        if(err.message == "BitString overflow") {
            assertTxnInput(false, 'comment-input', 'Comment is too long, takes too much bytes')
        } else {
            wrongInputAlert('wrong-txn-alert-label', "Unknown error " + err.message)
        }
    });
    $('download-boc-link-2').href = 'data:application/octet-stream;base64,' 
    + tonweb.utils.bytesToBase64(boc);
    qrManager.drawQRcode('qr-container-3', String.fromCharCode.apply(null, boc), true, 0.4);
}

$('generate-mnemonic-button').onclick = generateMnemonic;

$('choose-create-wallet-button').onclick = () => {
    $('confirm-mnemonic-button').onclick = createWallet;
    modifyMnemonicPageForCreation();
    switchScreen('start-screen', 'mnemonic-screen');
};

$('choose-make-txn-button').onclick = () => {
    $('confirm-mnemonic-button').onclick = prepareForTxn;
    modifyMnemonicPageForTxn();
    switchScreen('start-screen', 'mnemonic-screen');
};

$('sign-transaction-button').onclick = async () => {
    try {
        await createTransaction();
    } catch(e) {
        return;
    }
    createMethodShowQRPopup(3)();
}