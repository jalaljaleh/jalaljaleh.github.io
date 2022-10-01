

//function setCookie(cname, cvalue, exdays) {
//    const d = new Date();
//    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
//    let expires = "expires=" + d.toUTCString();
//    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
//}

//function getCookie(cname) {
//    let name = cname + "=";
//    let decodedCookie = decodeURIComponent(document.cookie);
//    let ca = decodedCookie.split(';');
//    for (let i = 0; i < ca.length; i++) {
//        let c = ca[i];
//        while (c.charAt(0) == ' ') {
//            c = c.substring(1);
//        }
//        if (c.indexOf(name) == 0) {
//            return c.substring(name.length, c.length);
//        }
//    }
//    return "";
//}


//if (getCookie("name") === "" || getCookie("name") === null || getCookie("name").length === 0) {
//    let person = prompt("Please enter your name, لطفا یک نام وارد کنید", "Unknown" + Math.floor(Math.random() * 10000));
//    setCookie("name", person, 1000000);
//}

//var request = new XMLHttpRequest();
//request.open("POST", 'WebHook');
//request.setRequestHeader('Content-type', 'application/json');
//var embed = {
//    "title": getCookie("name"),
//    "description": "Visited " + document.URL + "\nReferrer" + document.referrer + " .",
//    "color": 13212425,
//    "footer": {
//        "text": "Time " + new Date()
//    }
//};
//var params = {
//    username: "",
//    avatar_url: "",
//    content: "",
//    embeds: [embed]
//}
//request.send(JSON.stringify(params));
