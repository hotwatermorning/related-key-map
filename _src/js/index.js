import "../css/index.css";
import "../../node_modules/popups/css/popupS.css";
import expand_image from "../images/expand.png";
const ps = require("../../node_modules/popups/dist/popupS.js");
const $ = require("jquery");

const mod12 = n => { return n % 12; };

class RootName
{
    constructor(sharpKeyName, flatKeyName) {
        this.sharpKeyName_ = sharpKeyName;
        this.flatKeyName_ = (flatKeyName ? flatKeyName : sharpKeyName);
    }

    get sharpKeyName() { return this.sharpKeyName_; }
    get flatKeyName() { return this.flatKeyName_; }
};

const rootNames = [
    new RootName("C"),
    new RootName("C#", "Db"),
    new RootName("D"),
    new RootName("D#", "Eb"),
    new RootName("E"),
    new RootName("F"),
    new RootName("F#", "Gb"),
    new RootName("G"),
    new RootName("G#", "Ab"),
    new RootName("A"),
    new RootName("A#", "Bb"),
    new RootName("B"),
];

const intervalNames = [
    new RootName("Ⅰ"),
    new RootName("I#", "Ⅱb"),
    new RootName("Ⅱ"),
    new RootName("Ⅱ#", "Ⅲb"),
    new RootName("Ⅲ"),
    new RootName("Ⅳ"),
    new RootName("Ⅳ#", "Ⅴb"),
    new RootName("Ⅴ"),
    new RootName("Ⅴ#", "Ⅵb"),
    new RootName("Ⅵ"),
    new RootName("Ⅵ#", "Ⅶb"),
    new RootName("Ⅶ"),
];

class ScaleChord
{
    constructor(index, chordType) {
        this.index_ = index;
        this.chordType_ = chordType;
    }

    get sharpIntervalName() {
        return intervalNames[this.index_].sharpKeyName + this.chordType_;
    };

    get flatIntervalName() {
        return intervalNames[this.index_].flatKeyName + this.chordType_;
    };

    sharpChordName(rootIndex) {
        return rootNames[mod12(this.index_ + rootIndex)].sharpKeyName + this.chordType_;
    };

    flatChordName(rootIndex) {
        return rootNames[mod12(this.index_ + rootIndex)].flatKeyName + this.chordType_;
    };
};

const majorScale = [
    new ScaleChord(0, "M7"),
    new ScaleChord(2, "m7"),
    new ScaleChord(4, "m7"),
    new ScaleChord(5, "M7"),
    new ScaleChord(7, "7"),
    new ScaleChord(9, "m7"),
    new ScaleChord(11, "m7-5"),
];

const naturalMinorScale = [
    new ScaleChord(0, "m7"),
    new ScaleChord(2, "m7-5"),
    new ScaleChord(3, "M7"),
    new ScaleChord(5, "m7"),
    new ScaleChord(7, "m7"),
    new ScaleChord(8, "M7"),
    new ScaleChord(10, "7"),
];

const setKey = (key, rootIndex, isMajor) => {
    const keyName = rootNames[rootIndex].sharpKeyName + (isMajor ? "" : "m");
    key.find(".key-name-box").text(keyName);
    var cb = key.find(".chords-box");
    
    var scale = (isMajor ? majorScale : naturalMinorScale);

    var text1 = "", text2 = "";
    for(var i = 0; i < 4; ++i) {
        text1 += scale[i].sharpChordName(rootIndex);
        text1 += (i == 3 ? "" : " ");
    }

    for(var i = 4; i < 7; ++i) {
        text2 += scale[i].sharpChordName(rootIndex);
        text2 += (i == 6 ? "" : " ");
    }

    var cblines = cb.find(".chords-line");
    cblines.eq(0).text(text1);
    cblines.eq(1).text(text2);
};

const changeTargetKey = (keyName) => {
    keyName = "" + keyName;
    var isMajor = keyName.endsWith("m") == false;

    var majorKey = keyName.replace("m", "");
    var index = rootNames.findIndex(function(elem) {
        return elem.sharpKeyName == majorKey ||
               elem.flatKeyName == majorKey;
    });

    if(index === -1) { return; }

    var toRelative = (isMajor ? 9 : 3);

    setKey($("#key1"), mod12(index + 7), !isMajor);
    setKey($("#key2"), mod12(index + 7), isMajor);
    setKey($("#key3"), mod12(index + 7 + toRelative), !isMajor);

    setKey($("#key4"), mod12(index + 0), !isMajor);
    setKey($("#key5"), mod12(index + 0), isMajor);
    setKey($("#key6"), mod12(index + toRelative), !isMajor);

    setKey($("#key7"), mod12(index + 5), !isMajor);
    setKey($("#key8"), mod12(index + 5), isMajor);
    setKey($("#key9"), mod12(index + 5 + toRelative), !isMajor);
};

$(function(){
    var ex = $(".expand-image");
    ex.on('click', function(e) {
        e.stopPropagation();
        console.log("Show Key Detail!");
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
