export function updateLinkUrls()
{
    const path = window.location.origin + window.location.pathname;
    var query = new URLSearchParams(window.location.search);

    var links = window.document.querySelectorAll("link[rel=\"alternate\"]");
    links.forEach(function(elem) {
        query.delete("lang");
        const hreflang = elem.getAttribute("hreflang");
        if(hreflang !== "x-default") {
            query.set("lang", hreflang);
        }
        const query_string = query.toString();
        elem.href = path + (query_string !== "" ? "?" : "") + query_string;
    });

    var language_menu_items = $(".language-box > ul > li > a");

    $.each(language_menu_items, function(i, elem) {
        const regex = /^\S*/;
        const selected_lang_id = elem.className.slice(5).match(regex)[0];
        query.delete("lang");
        query.set("lang", selected_lang_id);
        elem.href = path + "?" + query;
    });
}

