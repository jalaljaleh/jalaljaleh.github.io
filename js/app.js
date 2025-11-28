
async function updateAge() {
    const DOB_ISO = '2001-07-05T16:30:00Z';
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

    import('./visit.js')
        .then(m => new m.default().sendMinimal())
        .catch(console.error);


    import('./message.js')
        .then(m => new m.default().init())
        .catch(console.error);


    import('./githubRepositories.js')
        .then(mod => mod.renderProjects())
        .catch(console.error);

    import('./posts.js')
        .then(mod => {
            const page = new URL(location.href).searchParams.get("page");
            mod.renderWeblogPosts({ page: Number(page) || 1 });
        })
        .catch(console.error);


})();

