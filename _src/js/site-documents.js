require("../images/favicon.ico");
import "../css/index.css";
import { updateLinkUrls } from "./common.js";

$(window).on("load", () => {
    window.onpopstate = function(e) {
        changeTargetKeyByURL(window.location.href);
    };

    updateLinkUrls();
});
