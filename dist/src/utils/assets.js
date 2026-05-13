import QRCode from 'qrcode';
import bwipjs from 'bwip-js';
export async function createQrCodeDataUrl(value) {
    if (!value)
        return '';
    return QRCode.toDataURL(value, { margin: 0, width: 160 });
}
export async function createCode128DataUrl(value) {
    if (!value)
        return '';
    const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: value,
        scale: 2,
        height: 12,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0
    });
    return `data:image/png;base64,${png.toString('base64')}`;
}
//# sourceMappingURL=assets.js.map