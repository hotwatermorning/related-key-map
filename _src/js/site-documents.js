require("../images/favicon.ico");
import "../css/index.css";

$(window).on("load", () => {
    window.onpopstate = function(e) {
        changeTargetKeyByURL(window.location.href);
    };

    $(".language-box > ul > li > a").on("click", function(e) {
        console.log(`change language: ${e.delegateTarget.className}`);
        var query = new URLSearchParams(window.location.search);
        query.delete("lang");
        query.set("lang", e.delegateTarget.className.slice(5));
        window.location.search = query;
    });
});
