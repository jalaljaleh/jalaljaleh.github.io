function getPageId() {
    var pageParam = /page=([^&]+)/.exec(location.search);
    if (pageParam == null)
        return 1;
    else return pageParam[1];
}

async function load_blog_posts() {
    var pageId = getPageId();
    var data = await get_posts(pageId);
    var div = document.getElementById('post-content');
    data.forEach(
        function (object) {
            create_blog_post(div, pageId, object, false)
        });
}

async function load_page_post() {
    var pageId = getPageId();
    var postId = /postId=([^&]+)/.exec(location.search)[1];
    var element = document.getElementById('post-id');

    var post = await get_post(pageId, postId);
    create_blog_post(element, pageId, post, true);

    var elementComments = document.getElementById('comments-title');
    elementComments.innerText = post.comments.length + " Comment(s)";

    await create_comments(post.comments);
}


function create_blog_post(element, pageId, post, isPost) {

    var txt = `
                    <article class="post">
                        <header class="entry-header">
                            <div class="entry-meta">
                                <span class="posted-on"><time class="entry-date published" date="2022-10-01">`+ post.time + `</time></span>
                            </div>
                            <h1 class="entry-title"><a href="/page.html?pageId=`+ pageId + `&postId=` + post.id + `" rel="bookmark">` + post.title + `</a></h1>
                        </header>
                        <div class="entry-content">
                            `+ (isPost ? post.content : post.summary) + `
                        </div>
` + (isPost
            ? ''
            : `<h4 class="entry-content"><a href="/page.html?pageId=` + pageId + `&postId=` + post.id + `" rel="bookmark">ادامه نوشته..</a></h4>`) + `
                    </article>
`;
    element.innerHTML += txt;
}


async function get_posts(pageId) {
    var data = await fetch('/assets/data/pages/' + pageId + '.json');
    var json = await data.json();
    return json;
}

async function get_post(pageId, id) {
    var data = await get_posts(pageId);
    return data.find(a => a.id == id);
}


async function create_comments(comments) {
    var comment_template = await fetch('/assets/elements/comment.html');
    var comment_element = await comment_template.text();
    var element_parent = document.getElementById("comments-list");

    comments.forEach(
        function (comment) {
            element_parent.innerHTML +=
                comment_element
                    .replace("{image}", comment.image)
                    .replace("{author}", comment.author)
                    .replace("{author_link}", comment.author_link)
                    .replace("{date}", comment.date)
                    .replace("{content}", comment.content);
        });
}
