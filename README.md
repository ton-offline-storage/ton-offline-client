# ton-offline-client

This is an offline part of [TON Air Gap Wallet](https://github.com/ton-offline-storage), supposed to work on an offline device

It creates and signs transactions. To broadcast transactions use [Online client](https://github.com/mcnckc/ton-airgap-client)

## Usage
Download latest release(`ton-offline-client.zip`), unzip, and open `index.html` in browser

## Libs
If you don't trust libraries put in this repository, you can get them from official repositories, and manually put into `libs` folder.

- [tonweb](https://github.com/toncenter/tonweb/tree/master/dist)
- [tonweb-mnemonic](https://github.com/toncenter/tonweb-mnemonic/blob/e8ab8c7c523455f2f3e0f79142febb6dc0071f2e/dist/tonweb-mnemonic.js)
- [EasyQRCodeJS](https://github.com/ushelp/EasyQRCodeJS/tree/master/dist)

Note that new versions of libraries may appear, so if you want to check SHA256 hash, you need to calculate this for your custom zip yourself.

