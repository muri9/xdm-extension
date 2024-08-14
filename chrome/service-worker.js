chrome.runtime.onInstalled.addListener(() => {

    chrome.contextMenus.create({
        id: 'download-any-link',
        title: "Download with XDM",
        contexts: ["link", "image"]
    });

});

chrome.contextMenus.onClicked.addListener(onClicked)

async function onClicked(item, tab) {
    console.log('contextMenus.onClicked', item)
    let url = item.srcUrl ?? item.linkUrl
    console.log(url)
    //let cookies = await chrome.cookies.getAll({"url": url});
    //let cookieStr = '';
    //if (cookies) {
    //    cookieStr = cookies.map(cookie => cookie.name + "=" + cookie.value).join("; ");
    //}
    let requestHeaders = {"User-Agent": [navigator.userAgent]}
    if (item.pageUrl) {
        requestHeaders["Referer"] = [item.pageUrl];
    }
    let data = {
        "url": url,
        "cookie": '',//cookieStr,
        "requestHeaders": requestHeaders,
        "responseHeaders": {},
        "filename": null,
        "fileSize": null,
        "mimeType": null
    }
    sendXDM("/download", data)
}

function sendXDM(url, data) {
    console.log(data)
    fetch(
        "http://127.0.0.1:8597" + url,
        {method: "POST", body: JSON.stringify(data)}
    ).then(res => {
        res.json().then(json => {
            console.log('res json:', json)
        }).catch(err => {
            console.log('bad json:', err)
        })
    })
}

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    console.log(item)
    suggest({filename: item.filename, conflict_action: 'prompt', conflictAction: 'prompt'});
    // conflict_action was renamed to conflictAction in
    // https://chromium.googlesource.com/chromium/src/+/f1d784d6938b8fe8e0d257e41b26341992c2552c
    // which was first picked up in branch 1580.

    chrome.storage.local.get('handle_downloads', (value) => {
        if (value.handle_downloads) {
            chrome.downloads.cancel(item.id);

            let referer = item.referrer;
            if (!referer && item.finalUrl !== item.url) {
                referer = item.url;
            }

            let data = {
                "url": item.finalUrl ?? item.url,
                "cookie": '',
                "requestHeaders": {"User-Agent": [navigator.userAgent], "Referer": referer},
                "responseHeaders": {"Content-Length": item.fileSize, "Content-Type": item.mime},
                "filename": item.filename,
                "fileSize": item.fileSize,
                "mimeType": item.mime
            }
            sendXDM("/download", data)
        }
    });
})