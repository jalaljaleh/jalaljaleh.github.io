function closeModal(modal, pass, funaction) {
    modal.style.display = "none";
    var password = document.getElementById("labelPassword").value;
    if (password == pass) {
        funaction();
    }
}

function createModal() {
    var body = document.getElementsByTagName("body")[0];

    body.innerHTML +=
        `
    <div id="myModal" class="modal">
        <div class="modal-content">
          <img src="https://jalaljaleh.github.io/static/tools/password-modal/media/lock.png" alt="Lock" 
style="
    height: 200px;
    width: 200px;
">
            <p>جهت ورود به وبلاگ رمز عبور را وارد کنید.</p>
            <input class="modal-button" id="labelPassword" placeholder="رمز عبور">
                <button class="modal-button" id="btnSubmitPassword">ثبت</button>
        </div>

    </div>
`;
}

function showModal(pass, funaction) {

    createModal();

    var modal = document.getElementById("myModal");
    modal.style.display = "block";


    window.onclick = function (event) {
        if (event.target == modal) {
            closeModal(modal, pass, funaction);
        }
    }

    var btnCloseModal = document.getElementById("btnSubmitPassword");
    btnCloseModal.onclick = function () {
        closeModal(modal, pass, funaction)
    };

};

function initialize(pass, funaction) {

    var fileref = document.createElement("link");
    fileref.rel = "stylesheet";
    fileref.type = "text/css";
    fileref.href = "https://jalaljaleh.github.io/static/tools/password-modal/css/style.css";
    document.getElementsByTagName("head")[0].appendChild(fileref);

    showModal(pass, funaction);
}

