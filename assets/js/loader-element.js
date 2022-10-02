

function load_footer() {
    fetch('/assets/elements/footer.html')
        .then(function (response) {
            return response.text();
        }).then(function (txt) {
            var div = document.getElementById('footer');
            div.innerHTML += txt;
        });
}

function load_header(background, image, title, tagline, mode) {
    fetch('/assets/elements/header.html')
        .then(function (response) {
            return response.text();
        }).then(function (txt) {

            if (background == null) {
                background = "/assets/images/background.jpg";
            }
            if (image == null) {
                image = "/assets/images/person-green.jpg";
            }
            if (title == null) {
                title = "Jalal Jaleh"
            }
            if (tagline == null) {
                tagline = "Mohammed Jalal Jaleh";
            }
            if (mode == null) {
                mode = "center";
            }

            txt = txt
                .replace("{image}", image)
                .replace("{background}", background)
                .replace("{title}", title)
                .replace("{tagline}", tagline)
                .replace("{mode}", mode);

            var div = document.getElementById('header');
            div.innerHTML = txt;
        });
}