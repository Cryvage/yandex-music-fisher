if (PLATFORM_EDGE) {
    chrome = browser;
}

const $ = document.getElementById.bind(document);
const checkboxes = [
    'shouldDownloadCover',
    'enumerateAlbums',
    'enumeratePlaylists',
    'singleClickDownload',
    'shouldUseFolder'
];
const selects = [
    'downloadThreadCount',
    'albumCoverSize',
    'albumCoverSizeId3'
];
const texts = [
    'folder'
];
const backgroundPermission = {
    permissions: ['background']
};

let background;

window.addEventListener('error', (e) => {
    background.console.warn(e.error.stack);
    e.returnValue = false;
});

window.addEventListener('unhandledrejection', (e) => {
    background.console.warn(e.reason);
    e.returnValue = false;
});

if (PLATFORM_CHROMIUM) {
    $('backgroundDownload').parentNode.parentNode.parentNode.style.display = '';
    checkboxes.push('backgroundDownload');
}

function afterCheckboxChanged(checkbox) { // изменение UI
    const checked = $(checkbox).checked;

    if (checkbox === 'shouldDownloadCover') {
        if (checked) {
            $('albumCoverSize').removeAttribute('disabled');
        } else {
            $('albumCoverSize').setAttribute('disabled', 'disabled');
        }
    } else if (checkbox === 'shouldUseFolder') {
        if (checked) {
            $('folder').removeAttribute('disabled');
        } else {
            $('folder').setAttribute('disabled', 'disabled');
        }
    } else if (checkbox === 'backgroundDownload') {
        chrome.permissions.contains(backgroundPermission, (contains) => {
            if (contains && !checked) { // btnReset
                chrome.permissions.remove(backgroundPermission);
            }
        });
    }
}

checkboxes.forEach((checkbox) => {
    $(checkbox).addEventListener('click', () => {
        const checked = $(checkbox).checked;

        background.fisher.storage.setItem(checkbox, checked);
        afterCheckboxChanged(checkbox);

        if (checkbox === 'backgroundDownload') {
            if (checked) {
                chrome.permissions.request(backgroundPermission);
            } else {
                chrome.permissions.remove(backgroundPermission);
            }
        }
    });
});

selects.forEach((select) => {
    $(select).addEventListener('click', () => {
        let value = $(select).value;

        if (select === 'downloadThreadCount') {
            value = parseInt(value, 10);
        }
        background.fisher.storage.setItem(select, value);
    });
});

texts.forEach((text) => {
    $(text).addEventListener('input', () => {
        let value = $(text).value;

        if (text === 'folder') {
            value = background.fisher.utils.clearPath(value, true);
            if (value === '') {
                return; // не сохраняем
            }
        }
        background.fisher.storage.setItem(text, value);
    });
});

$('btnReset').addEventListener('click', () => {
    background.fisher.storage.reset();
    loadOptions();
});

function getBackgroundPage() {
    return new Promise((resolve) => {
        chrome.runtime.getBackgroundPage(resolve);
    });
}

async function loadOptions() {
    background = await getBackgroundPage();

    checkboxes.forEach((checkbox) => {
        $(checkbox).checked = background.fisher.storage.getItem(checkbox);
        afterCheckboxChanged(checkbox);
    });

    selects.forEach((select) => {
        $(select).value = background.fisher.storage.getItem(select);
    });

    texts.forEach((text) => {
        $(text).value = background.fisher.storage.getItem(text);
    });
}

loadOptions();
