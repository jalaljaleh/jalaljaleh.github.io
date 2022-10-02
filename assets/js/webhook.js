
async function send_view() {
    var embed = {
        "title": getCookie("name"),
        "description": "Visited " + document.URL + "\nReferrer" + document.referrer + " .",
        "color": 13212425,
        "footer": {
            "text": "Time " + new Date()
        }
    };
    var params = {
        username: "",
        avatar_url: "",
        content: "",
        embeds: [embed]
    }
    await send(params);
}
function send(params) {
    var request = new XMLHttpRequest();

    request.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                alert('Thanks, your comment sent.');
            } else {
                alert("Unknown Error, try a vpn");
            }
        }
    };
    request.open("POST", '');
    request.setRequestHeader('Content-type', 'application/json');
    var json = JSON.stringify(params);
    request.send(json);
}
