import {getStore} from 'reduxPath/store';
import {availableLocales, activeBundle} from 'basePath/i18n/index';
import {getProxyUrl} from 'api/apiRequest';
import {ESDEV_POPUP_CONTAINER_CLASSNAME} from 'basePath/const';

let pixieEditor;
let localeConfig;
let editorLocale;


export function init(locale = 'en', cb) {

    editorLocale = availableLocales.indexOf(locale) > -1 ? locale : 'en';
    localeConfig = {
        active: editorLocale,
        custom: {
            [`${locale}`]: getLanguageBundle()
        }
    };


    if (pixieEditor) {
        cb();
        return;
    }

    const imageEditorContainer = $(`.${ESDEV_POPUP_CONTAINER_CLASSNAME}`);
    imageEditorContainer.find('pixie-editor').remove();
    imageEditorContainer.prepend('<pixie-editor style="position: fixed"></pixie-editor>');

    pixieEditor = new Pixie({
        crossOrigin: true,
        urls: {
            assets: `${window.Stripo.bp}assets/imageeditor/`,
        },
        ui: {
            openImageDialog: false,
            mode: 'overlay',
            toolbar: {
                hideCloseButton: false
            }
        },
        onLoad: () => {
            cb();
        }
    });
}

export function openEditor(imgId, imgSrc, saveCallback, closeCallback, onOpenStartCallback, onOpenedCallback) {
    onOpenStartCallback && onOpenStartCallback();
    pixieEditor.setConfig('languages', localeConfig);
    pixieEditor.setConfig('onOpen', () => {
        onOpenedCallback && onOpenedCallback();
    });
    pixieEditor.setConfig('onSave', function (data, name) {
        saveCallback(imgId, data, name);
        pixieEditor.close();
    }.bind(this));
    pixieEditor.setConfig('onClose', function () {
        closeCallback && closeCallback();
    }.bind(this));
    const fileFormat = imgSrc && (imgSrc.endsWith('.jpg') || imgSrc.endsWith('.jpeg')) ? 'jpeg' : 'png';
    pixieEditor.setConfig('tools.export.defaultFormat', fileFormat);
    pixieEditor.setConfig('crossOrigin', 'use-credentials'); // fix for sending cookies on get img in safari browser
    pixieEditor.resetAndOpenEditor('image', createImageSrcProxy(imgSrc));
}

export function destroy() {
    if (pixieEditor) {
        pixieEditor.destroyEditor();
        pixieEditor = null;
    }
}

function getLanguageBundle() {
    const languageBundle = {};
    for (let k of Object.keys(activeBundle)) {
        if (k.startsWith('pixie.')) {
            languageBundle[k.replace('pixie.', '')] = activeBundle[k];
        }
    }
    return languageBundle;
}

function createImageSrcProxy(imgSrc) {
    const config = getStore().getState().config;
    const proxyUrl = config.pluginMode ? getProxyUrl() : config.imagesProxy;
    return `${proxyUrl}?url=${imgSrc}`;
}