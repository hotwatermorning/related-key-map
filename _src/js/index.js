import expand_image from "../images/expand.png";
require("modaal/dist/js/modaal.js");
import "modaal/dist/css/modaal.css"
var VF = require("vexflow").Flow;
import "../css/index.css";

const mod12 = n => { return n % 12; };

// 異名同音調があるときの表示モード
const DisplayMode = {
    kSharp: 0,
    kFlat: 1
};

var kCurrentDisplayMode = DisplayMode.kSharp;

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

    const display_mode = (kEnharmonicKeys.indexOf(keyName) != -1 ? "visible" : "hidden");
    targetDom.find(".switch-display-mode").css("visibility", display_mode);

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

const kPitchIndex = {
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
    "Cb": 11,
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
        return elem.pitches(DisplayMode.kSharp)[0] == pitch ||
               elem.pitches(DisplayMode.kFlat)[0] == pitch;
    });

    if(index === -1) { return; }

    const scale = scales[index];

    $(".key-detail-heading > .key-title").text(keyName);

    var notes = [];
    var notes2 = [];
    var lastRootPitchIndex = 0;
    var rootOctave = (kPitchIndex[scale.pitches()[0]] < kPitchIndex["G"]) ? 4 : 3;
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
    $(".expand-image").attr("src", expand_image);

    for(var i = 1; i <= 9; ++i) {
        $(`#key${i}`).on("click", function(e) {
            const target_name_box = $(".key-name-box", e.delegateTarget);
            changeTargetKey(target_name_box.text());
        });
    }

    changeTargetKey("C");

    $(".switch-display-mode").on("click", e => {
        e.stopPropagation();
        const currentTargetKey = $(".tonic-key > .key-name-box").text();
        kCurrentDisplayMode = 1 - kCurrentDisplayMode;
        changeTargetKey(currentTargetKey);
    });
});

$(window).on("load", () => {
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