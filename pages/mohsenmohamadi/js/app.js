





async function updateAge() {
    const DOB_ISO = '2000-09-25T00:00:00Z';
    const EL = document.getElementById('ageValue');
    if (!EL) return;

    const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.2425;
    function update() {
        const dob = new Date(DOB_ISO);
        if (isNaN(dob)) { EL.textContent = '—'; return; }
        const years = (Date.now() - dob.getTime()) / MS_PER_YEAR;
        EL.textContent = years.toFixed(11);
    }
    update();
    setInterval(update, 60);
};


(async () => {

    await updateAge();

    try { import('../../../js/notification.js').then(m => new m.default().notify()); } catch { }

})();