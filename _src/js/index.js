import expand_image from "../images/expand.png";
require("../images/favicon.ico");
require("modaal/dist/js/modaal.js");
import "modaal/dist/css/modaal.css"
var VF = undefined;
import(
    /* webpackChunkName: "vexflow" */
    /* webpackMode: "lazy" */
    "vexflow/releases/vexflow-min.js").then(module => {
    VF = module.Flow;
});
import "../css/index.css";

const mod12 = n => { return n % 12; };

// 異名同音調があるときの表示モード
const EnharmonicMode = {
    kSharp: "sharp",
    kFlat: "flat",
};

var kCurrentEnharmonicMode = EnharmonicMode.kSharp;

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
    //    * key1 = EnharmonicMode::kSharpで表示する調
    //    * key2 = EnharmonicMode::kFlatで表示する調
    constructor(pitches1, pitches2) {
        this.pitches1 = pitches1;
        this.pitches2 = pitches2 || pitches1;
    }

    pitches(enharmonic_mode = kCurrentEnharmonicMode) {
        return (enharmonic_mode === EnharmonicMode.kSharp
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

const kEnharmonicKeys = [
    "B", "Cb", 
    "F#", "Gb", 
    "C#", "Db", 
    "G#m", "Abm", 
    "D#m", "Ebm", 
    "A#m", "Bbm"
];

const setKey = (targetDom, rootIndex, isMajor) => {
    const scale = (isMajor ? kMajorScales : kMinorScales)[rootIndex];
    const chords = (isMajor ? majorScaleChords : naturalMinorScaleChords);

    const keyName = scale.pitches()[0] + (isMajor ? "" : "m");
    targetDom.find(".key-name-box").text(keyName);

    const enharmonic_mode = (kEnharmonicKeys.indexOf(keyName) !== -1 ? "visible" : "hidden");
    targetDom.find(".switch-enharmonic-mode").css("visibility", enharmonic_mode);

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

// url format:
// https://<host>/[A-G](sharp|flat)m?\?em=(sharp|flat)

function getKeyFromURL(url_string)
{
    const url = new URL(url_string);

    if(url.pathname.length < 2) { return; }

    var result = {};

    result.key = url.pathname.substr(1).replace("sharp", "#").replace("flat", "b");

    if(result.key.length >= 4) { return; }

    const em = url.searchParams.get("em");
    if(em && Object.values(EnharmonicMode).indexOf(em) !== -1) {
        result.enharmonic_mode = em;
    }

    if(!("enharmonic_mode" in result)) {
        const en_index = kEnharmonicKeys.indexOf(result.key);
        if(en_index === -1) { 
            result.enharmonic_mode = kCurrentEnharmonicMode;
        } else {
            result.enharmonic_mode = (en_index % 2 == 0) ? EnharmonicMode.kSharp : EnharmonicMode.kFlat;
        }
    }

    return result;
}

// enharmonic_modeの設定は、クエリ文字列になっている方が良さそう
function changeTargetKeyByURL(url_string)
{
    var res = getKeyFromURL(url_string);

    if(res) {
        const saved_enharmonic_mode = kCurrentEnharmonicMode;
        kCurrentEnharmonicMode = res.enharmonic_mode;
        if(changeTargetKey(res.key)) {
            return;
        } else {
            kCurrentEnharmonicMode = saved_enharmonic_mode;
        }
    }

    const url = new URL(url_string);
    window.history.replaceState("", "", url.origin + "/C?em=" + kCurrentEnharmonicMode);
    changeTargetKey("C");
};

function setKeyToURL(key, enharmonic_mode) {

    var url = new URL(window.location.href);
    var new_href 
    = url.origin + "/" 
    + key.replace("#", "sharp").replace("b", "flat")
    + "?em=" + enharmonic_mode
    ;

    if(window.location.href !== new_href) {
        window.history.pushState("", "", new_href);
    }

    const encoded_url = encodeURIComponent(window.location.href);
    const encoded_title = encodeURIComponent($(".header-text-box > h1").text());
    const encoded_url_for_hatebu = encodeURIComponent(window.location.origin);
    // update sns link url
    $(".sns-button.twitter > a").attr("href", `https://twitter.com/share?url=${encoded_url}&text=${encoded_title}`);
    $(".sns-button.facebook > a").attr("href", `https://www.facebook.com/sharer/sharer.php?u=${encoded_url}`);
    $(".sns-button.google > a").attr("href", `https://plus.google.com/share?url=${encoded_url}`);
    $(".sns-button.hatebu > a").attr("href", `http://b.hatena.ne.jp/entry/s/${encoded_url_for_hatebu}`);
}

//! キー名が無効な場合（D#メジャーなど）は、falseを返す。
function changeTargetKey(keyName) {
    keyName = "" + keyName;
    var isMajor = keyName.endsWith("m") == false;
    var scales = (isMajor ? kMajorScales : kMinorScales);

    var pitch = keyName.replace("m", "");

    var index = scales.findIndex(function(elem) {
        return elem.pitches(EnharmonicMode.kSharp)[0] == pitch ||
               elem.pitches(EnharmonicMode.kFlat)[0] == pitch;
    });

    if(index === -1) { return false; }

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

    setKeyToURL($("#key5 .key-name-box").text(), kCurrentEnharmonicMode);
    return true;
};

const kPitchIndex = {
    "Cb": -1,
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "Fb": 4,
    "E#": 5,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
    "B#": 12,
};

function setDetailedKey(keyName, staff, context)
{
    keyName = "" + keyName;
    const isMajor = keyName.endsWith("m") == false;
    const scales = (isMajor ? kMajorScales : kMinorScales);
    const chords = (isMajor ? majorScaleChords : naturalMinorScaleChords);

    const pitch = keyName.replace("m", "");

    const index = scales.findIndex(function(elem) {
        return elem.pitches(EnharmonicMode.kSharp)[0] == pitch ||
               elem.pitches(EnharmonicMode.kFlat)[0] == pitch;
    });

    if(index === -1) { return; }

    const scale = scales[index];

    $(".key-detail-heading > .key-title").text(keyName);

    var notes = [];
    var notes2 = [];
    var lastRootPitchIndex = 0;
    var rootOctave = ((kPitchIndex[scale.pitches()[0]] + 12) % 12 < kPitchIndex["G"]) ? 4 : 3;
    for(var i = 0; i < 7; ++i) {
        var root = scale.pitches()[i];
        var third = scale.pitches()[(i + 2) % 7];
        var fifth = scale.pitches()[(i + 4) % 7];
        var seventh = scale.pitches()[(i + 6) % 7];

        if(lastRootPitchIndex > kPitchIndex[root]) {
            rootOctave += 1;
        }
        lastRootPitchIndex = kPitchIndex[root];

        var thirdOctave = rootOctave + (kPitchIndex[root] > kPitchIndex[third]);
        var fifthOctave = thirdOctave + (kPitchIndex[third] > kPitchIndex[fifth])
        var seventhOctave = fifthOctave + (kPitchIndex[fifth] > kPitchIndex[seventh]);

        const chordName = scale.pitches()[i] + chords[i];
        // cd.eq(i).text(chordName);

        var tetrad = new VF.StaveNote({
            clef: "treble",
            keys: [
                `${root.toLowerCase()}/${rootOctave}`,
                `${third.toLowerCase()}/${thirdOctave}`,
                `${fifth.toLowerCase()}/${fifthOctave}`,
                `${seventh.toLowerCase()}/${seventhOctave}`,
            ], 
            duration: "h"
         });

         notes.push(tetrad);
         
         var text = new VF.TextNote({
            text: chordName,
            duration: "h",
            line: 12,
            font: {
                 family: "Serif",
                 size: 12,
                 weight: ""
            },
         });
         text = text.setJustification(VF.TextNote.Justification.RIGHT);

         notes2.push(text);
    }

    notes.forEach(function(note) {note.setContext(context)});
    notes2.forEach(function(note) {note.setContext(context)});

    var voice = new VF.Voice({num_beats: 7, beat_value: 2}); 
    var voice2 = new VF.Voice({num_beats: 7, beat_value: 2});

    voice.addTickables(notes);
    voice2.addTickables(notes2);

    staff.setKeySignature(keyName);
    staff.format();
    staff.setContext(context);

    context.clear();

    var formatter = new VF.Formatter().joinVoices([voice, voice2]).formatToStave([voice, voice2], staff);

    staff.draw();
    voice.draw(context, staff);
    voice2.draw(context, staff);

    staff.setContext(undefined);
}

$(() => {
    $(".header-text-box > h1 > a").attr("href", window.location.origin);
    $(".expand-image").attr("src", expand_image);

    for(var i = 1; i <= 9; ++i) {
        $(`#key${i}`).on("click", function(e) {
            const target_name_box = $(".key-name-box", e.delegateTarget);
            changeTargetKey(target_name_box.text());
        });
    }

    changeTargetKeyByURL(window.location.href);

    $(".switch-enharmonic-mode").on("click", e => {
        e.stopPropagation();
        const currentTargetKey = $(".tonic-key > .key-name-box").text();
        kCurrentEnharmonicMode 
        = (kCurrentEnharmonicMode === EnharmonicMode.kSharp)
        ? EnharmonicMode.kFlat
        : EnharmonicMode.kSharp;
        changeTargetKey(currentTargetKey);
    });
});

$(window).on("load", () => {
    window.onpopstate = function(e) {
        changeTargetKeyByURL(window.location.href);
    };

    $(".inline").modaal({
        animation_speed: 200,
        width: 720,
        height: 300,
        before_open: function(e) {
            e.stopPropagation();

            var staffDom = $("#staff");
            $("svg", staffDom).remove();
            var st = new VF.Stave(0, 30, 0, { fill_style: "#444444" });
            st.setWidth(staffDom.width()-1);
            st.addClef("treble");
            var target_key_name = $(".key-name-box", $(e.delegateTarget).parent()).text();

            var renderer = new VF.Renderer(staffDom[0], VF.Renderer.Backends.SVG);
            renderer.resize(staffDom.width(), staffDom.height());

            var context = renderer.getContext();
            setDetailedKey(target_key_name, st, context);
        },
    });
});