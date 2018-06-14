import "../css/index.css";
import "../../node_modules/popups/css/popupS.css";
const ps = require("../../node_modules/popups/dist/popupS.js");
const $ = require("jquery");

var count = 0;

$(window).on('load',function(){
    $(".expand-image").on('click', function(e) {
        e.stopPropagation();
        console.log("Show Key Detail!" + " " + count);
        count += 1;
        ps.alert("Hello World.");
    });

    $(".tonic-key").on('click', function() {
        console.log("[Tonic] Change Target Key!" + " " + count);
        count += 1;
        ps.alert("Hello World.");
    });

    $(".directly-related-key").on('click', function() {
        console.log("[DRK] Change Target Key!" + " " + count);
        count += 1;
        ps.alert("Hello World.");
    });

    $(".indirectly-related-key").on('click', function() {
        console.log("[IRK] Change Target Key!" + " " + count);
        count += 1;
        ps.alert("Hello World.");
    });
});
