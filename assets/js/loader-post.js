async function load_posts() {
    var data = await get_all_posts();
    var div = document.getElementById('post-content');
    data.forEach(function (object) { load_post(div, object) });
}

function load_post(element, post) {
    element.innerHTML += `
                    <article class="post">
                        <header class="entry-header">
                            <div class="entry-meta">
                                <span class="posted-on"><time class="entry-date published" date="2022-10-01">`+ post.time + `</time></span>
                            </div>
                            <h1 class="entry-title"><a href="/post.html?postId=`+ post.id + `" rel="bookmark">` + post.title + `</a></h1>
                        </header>
                        <div class="entry-content">
                            `+ post.content + `
                        </div>
                    </article>
`;
}

async function load_page_post() {
    var postId = /postId=([^&]+)/.exec(location.search)[1];
    var element = document.getElementById('post-id');

    var post = await get_post(postId);
    load_post(element, post);
}


async function get_all_posts() {
    var data = await fetch('/assets/data/posts.json');
    var json = await data.json();
    return json;
}

async function get_post(id) {
    var data = await get_all_posts();
    return data[0];
}