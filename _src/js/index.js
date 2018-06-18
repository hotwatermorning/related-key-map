import "../css/index.css";
import "../../node_modules/popups/css/popupS.css";
import expand_image from "../images/expand.png";
const ps = require("../../node_modules/popups/dist/popupS.js");
const $ = require("jquery");

const mod12 = n => { return n % 12; };

// 異名同音調があるときの表示モード
const DisplayMode = {
    kSharp: 0,
    kFlat: 1
};

const kCurrentDisplayMode = DisplayMode.kSharp;

const ScaleShiftDirection = {
    kDominant: 0,
    kSubdominant: 1,
}

const kCMajorScale = ["C", "D", "E", "F", "G", "A", "B"];
const kAMinorScale = ["A", "B", "C", "D", "E", "F", "G"];

function shiftScale(step, direction, isMajor) {
    var tmp = (isMajor ? kCMajorScale : kAMinorScale).slice();

    console.assert(step <= 7);
    for(var i = 0; i < step; ++i) {
        if(direction == ScaleShiftDirection.kDominant) {
            tmp = tmp.slice(4, 7).concat(tmp.slice(0, 4));
            tmp[(isMajor ? 6 : 1)] += "#";
        } else {
            tmp = tmp.slice(3, 7).concat(tmp.slice(0, 3));
            tmp[(isMajor ? 3 : 5)] += "b";
        }
    }
    
    return tmp;
}

class Scale
{
    // key1のみを渡した場合: 異名同音調なし
    // key1, key2両方を渡した場合
    //    * key1 = DisplayMode::kSharpで表示する調
    //    * key2 = DisplayMode::kFlatで表示する調
    constructor(pitches1, pitches2) {
        this.pitches1 = pitches1;
        this.pitches2 = pitches2 || pitches1;
    }

    pitches(display_mode = kCurrentDisplayMode) {
        return (display_mode == DisplayMode.kSharp
                ? this.pitches1
                : this.pitches2
        );
    }
};

function makeScales(isMajor) {
    var scales = [];
    for(var i = 0; i < 12; ++i) {
        if(i < 5) {
            scales.push(new Scale(shiftScale(i, ScaleShiftDirection.kDominant, isMajor)));
        } else if(i < 8) {
            scales.push(new Scale(shiftScale(i, ScaleShiftDirection.kDominant, isMajor),
                                  shiftScale(12 - i, ScaleShiftDirection.kSubdominant, isMajor)));
        } else {
            scales.push(new Scale(shiftScale(12 - i, ScaleShiftDirection.kSubdominant, isMajor)));
        }
    }

    return scales;
}

const kMajorScales = makeScales(true);
const kMinorScales = makeScales(false);

const majorScaleChords = [ 
    "M7", "m7", "m7", "M7", "7", "m7", "m7-5", 
];

const naturalMinorScaleChords = [
    "m7", "m7-5", "M7", "m7", "m7", "M7", "7",
];

const setKey = (targetDom, rootIndex, isMajor) => {
    const scale = (isMajor ? kMajorScales : kMinorScales)[rootIndex];
    const chords = (isMajor ? majorScaleChords : naturalMinorScaleChords);

    const keyName = scale.pitches()[0] + (isMajor ? "" : "m");
    targetDom.find(".key-name-box").text(keyName);
    var cb = targetDom.find(".chords-box");

    var text1 = "", text2 = "";
    for(var i = 0; i < 4; ++i) {
        text1 += scale.pitches()[i] + chords[i];
        text1 += (i == 3 ? "" : " ");
    }

    for(var i = 4; i < 7; ++i) {
        text2 += scale.pitches()[i] + chords[i];
        text2 += (i == 6 ? "" : " ");
    }

    var cblines = $(".chords-line", cb);
    cblines.eq(0).text(text1);
    cblines.eq(1).text(text2);
};

function changeTargetKey(keyName) {
    keyName = "" + keyName;
    var isMajor = keyName.endsWith("m") == false;
    var scales = (isMajor ? kMajorScales : kMinorScales);

    var pitch = keyName.replace("m", "");

    var index = scales.findIndex(function(elem) {
        return elem.pitches(DisplayMode.kSharp)[0] == pitch ||
               elem.pitches(DisplayMode.kFlat)[0] == pitch;
    });

    if(index === -1) { return; }

    var toParallel = (isMajor ? 9 : 3);

    setKey($("#key1"), mod12(index + 1 + toParallel), !isMajor);
    setKey($("#key2"), mod12(index + 1), isMajor);
    setKey($("#key3"), mod12(index + 1), !isMajor);

    setKey($("#key4"), mod12(index + 0 + toParallel), !isMajor);
    setKey($("#key5"), mod12(index + 0), isMajor);
    setKey($("#key6"), mod12(index + 0), !isMajor);

    setKey($("#key7"), mod12(index + 11 + toParallel), !isMajor);
    setKey($("#key8"), mod12(index + 11), isMajor);
    setKey($("#key9"), mod12(index + 11), !isMajor);
};

function setDetailedKey(keyName)
{
    keyName = "" + keyName;
    const isMajor = keyName.endsWith("m") == false;
    const scales = (isMajor ? kMajorScales : kMinorScales);
    const chords = (isMajor ? majorScaleChords : naturalMinorScaleChords);

    const pitch = keyName.replace("m", "");

    const index = scales.findIndex(function(elem) {
        return elem.pitches(DisplayMode.kSharp)[0] == pitch ||
               elem.pitches(DisplayMode.kFlat)[0] == pitch;
    });

    if(index === -1) { return; }

    const scale = scales[index];

    $(".key-detail-heading > .key-title").text(keyName);

    var cd = $(".chord-detail");

    for(var i = 0; i < 7; ++i) {
        cd.eq(i).text(scale.pitches()[i] + chords[i]);
    }
}

$(function(){
    var ex = $(".expand-image");
    ex.on('click', function(e) {
        e.stopPropagation();
        const target_name_box = $(".key-name-box", $(e.delegateTarget).parent());
        setDetailedKey(target_name_box.text());
        ps.modal({
            content: "<div>" + $(".key-detail-box").html() + "</div>",
            className: "key-detail-box"
        });
    });
    ex.attr("src", expand_image);

    for(var i = 1; i <= 9; ++i) {
        $(`#key${i}`).on("click", function(e) {
            const target_name_box = $(".key-name-box", e.delegateTarget);
            changeTargetKey(target_name_box.text());
        });
    }

    changeTargetKey("C");
});
