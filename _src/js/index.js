import expand_image from "../images/expand.png";
import speaker_image from "../images/speaker.png";
import waveform_image from "../images/waveform.png";
import volume_minus from "../images/minus.png";
import volume_plus from "../images/plus.png";

require("../images/favicon.ico");
require('jquery')
require("modaal/dist/js/modaal.js");
import "modaal/dist/css/modaal.css"
import { updateLinkUrls } from "./common.js";
import * as Tone from "tone";
require("../css/index.css");

var AC = undefined;

if(AC == null) {
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  if(!AudioContext) {
    alert("WebAudio not supported");
  }
  AC = new AudioContext();
  Tone.setContext(AC);
}

var VF = undefined;

import(
  /* webpackChunkName: "vexflow" */
  /* webpackMode: "lazy" */
  "vexflow/releases/vexflow-debug.js").then(module => {
    VF = module.default.Flow;
  });

const mod12 = n => { return n % 12; };

// 異名同音調があるときの表示モード
const EnharmonicMode = {
  kSharp: "sharp",
  kFlat: "flat",
};

// 短調のモード
const MinorScaleMode = {
  kNatural: "natural",
  kHarmonic: "harmonic",
  kMelodic: "melodic",
};

const WaveformType = {
  kSine: "sine",
  kSawtooth: "sawtooth",
  kSquare: "square",
  kTriangle: "triangle",
  kPiano: "piano",
  kStrings: "strings",
  kGuitar: "guitar",
};

var SamplerTable = new Map();
const kSampleFileNames = ["A3", "E4", "B4", "Fsharp5", "Csharp6"];

function isSynthesizerBasedWaveformType(waveform_type) {
  const list = [
    WaveformType.kSine,
    WaveformType.kSawtooth,
    WaveformType.kSquare,
    WaveformType.kTriangle,
  ];

  return list.indexOf(waveform_type) != -1;
}

function isSamplerBasedWaveformType(waveform_type) {
  return isSynthesizerBasedWaveformType(waveform_type) == false;
}

const kDefaultKey = "C";

const kDefaultEnharmonicMode = EnharmonicMode.kSharp;
var kCurrentEnharmonicMode = kDefaultEnharmonicMode;

const kDefaultMinorScaleMode = MinorScaleMode.kNatural;
var kCurrentMinorScaleMode = kDefaultMinorScaleMode;

var kCurrentLanguage = "";

var kCurrentWaveformType = WaveformType.kStrings;

//! dB で表す
var kCurrentVolume = -6;

const ScaleShiftDirection = {
  kDominant: 0,
  kSubdominant: 1,
}

const kCMajorScale         = ["C", "D", "E", "F", "G", "A", "B"];
const kANaturalMinorScale  = ["A", "B", "C", "D", "E", "F", "G"];

const kKeyNameToRootIndexMap = new Map([
  [ "C", 0 ],
  [ "Am", 0 ],
  [ "G", 1 ],
  [ "Em", 1 ],
  [ "D", 2 ],
  [ "Bm", 2 ],
  [ "A", 3 ],
  [ "F#m", 3 ],
  [ "E", 4 ],
  [ "C#m", 4 ],
  [ "B", 5 ],
  [ "Cb", 5 ],
  [ "G#m", 5 ],
  [ "Abm", 5 ],
  [ "F#", 6 ],
  [ "Gb", 6 ],
  [ "D#m", 6 ],
  [ "Ebm", 6 ],
  [ "C#", 7 ],
  [ "Db", 7 ],
  [ "A#m", 7 ],
  [ "Bbm", 7 ],
  [ "Ab", 8 ],
  [ "Fm", 8 ],
  [ "Eb", 9 ],
  [ "Cm", 9 ],
  [ "Bb", 10 ],
  [ "Gm", 10 ],
  [ "F", 11 ],
  [ "Dm", 11 ],
]);

function getRootIndexFromKeyName(key_name) {
  // C, Am を 0 とする。
  return kKeyNameToRootIndexMap.get(key_name);
};

// @param ms minor_scale_mode
function makeShiftedScale(shift_amount, direction, is_major, ms) {
  var s;
  if(is_major) {
    s = kCMajorScale.slice();
  } else {
    s = kANaturalMinorScale.slice();
  }

  if(!(0 <= shift_amount && shift_amount <= 7)) {
    console.log("unexpected shift amount.");
  }

  var index = 0;
  var slice_pos;
  var accidental_pos

  if(direction == ScaleShiftDirection.kDominant) {
    slice_pos = 4;
    accidental_pos = (is_major ? 6 : 1);
  } else {
    slice_pos = 3;
    accidental_pos = (is_major ? 3 : 5);
  }

  for(var i = 0; i < shift_amount; ++i) {
    s = s.slice(slice_pos, 7).concat(s.slice(0, slice_pos));
    if(direction == ScaleShiftDirection.kDominant) {
      s[accidental_pos] += "#";
    } else {
      s[accidental_pos] += "b";
    }
  }

  function add_sharp(cur) {
    if(cur.length === 2 && cur[1] === "b") { return cur[0] + "n"; }
    else { return cur + "#"; }
  }

  if(!is_major) {
    if(ms === MinorScaleMode.kHarmonic) {
      s[6] = add_sharp(s[6]);
    } else if(ms === MinorScaleMode.kMelodic) {
      s[5] = add_sharp(s[5]);
      s[6] = add_sharp(s[6]);
    }
  }

  return s;
}

class Scale
{
  constructor(p) {
    this.p = p;
  }

  pitches() {
    return this.p;
  }
};

function getScale(root_index, is_major, enharmonic_mode, minor_scale_mode) {
  if(root_index < 5) {
    return new Scale(makeShiftedScale(root_index, ScaleShiftDirection.kDominant, is_major, minor_scale_mode));
  } else if(root_index < 8) {
    if(enharmonic_mode == EnharmonicMode.kSharp) {
      return new Scale(makeShiftedScale(root_index, ScaleShiftDirection.kDominant, is_major, minor_scale_mode));
    } else {
      return new Scale(makeShiftedScale(12 - root_index, ScaleShiftDirection.kSubdominant, is_major, minor_scale_mode));
    }
  } else {
    return new Scale(makeShiftedScale(12 - root_index, ScaleShiftDirection.kSubdominant, is_major, minor_scale_mode));
  }
}

function getScaleChordList(is_major, minor_scale_mode) {
  if(is_major) {
    return [ "M7", "m7", "m7", "M7", "7", "m7", "m7-5" ];
  } else if(minor_scale_mode == MinorScaleMode.kNatural) {
    return [ "m7", "m7-5", "M7", "m7", "m7", "M7", "7" ];
  } else if(minor_scale_mode == MinorScaleMode.kHarmonic) {
    return [ "mM7", "m7-5", "M7+5", "m7", "7", "M7", "dim7" ];
  } else {
    return [ "mM7", "m7", "M7+5", "7", "7", "m7-5", "m7-5" ];
  }
}

const kEnharmonicKeys = [
  "B", "Cb",
  "F#", "Gb",
  "C#", "Db",
  "G#m", "Abm",
  "D#m", "Ebm",
  "A#m", "Bbm"
];

const setKey = (target_dom, root_index, is_major, enharmonic_mode, minor_scale_mode) => {
  const scale = getScale(root_index, is_major, enharmonic_mode, minor_scale_mode);
  const chords = getScaleChordList(is_major, minor_scale_mode);

  const key_name = scale.pitches()[0] + (is_major ? "" : "m");
  target_dom.find(".key-name-box").text(toDisplay(key_name));

  const show_enharmonic_mode = (kEnharmonicKeys.indexOf(key_name) !== -1 ? "visible" : "hidden");
  const show_minor_scale_mode = (is_major == false ? "visible" : "hidden");
  target_dom.find(".switch-enharmonic-mode").css("visibility", show_enharmonic_mode);
  target_dom.find(".switch-minor-scale-mode").css("visibility", show_minor_scale_mode);

  var cb = target_dom.find(".chords-box");

  var text1 = "", text2 = "";
  for(var i = 0; i < 3; ++i) {
    text1 += removeNaturalAccidental(toDisplay(scale.pitches()[i])) + chords[i];
    text1 += (i == 3 ? "" : " ");
  }

  for(var i = 3; i < 7; ++i) {
    text2 += removeNaturalAccidental(toDisplay(scale.pitches()[i])) + chords[i];
    text2 += (i == 6 ? "" : " ");
  }

  var cblines = $(".chords-line", cb);
  cblines.eq(0).text(text1);
  cblines.eq(1).text(text2);
};

// url format:
// https://<host>/([A-G](sharp|flat)?m?em=(sharp|flat)&ms=(natural|harmonic|melodic))?

function makeURL(key, enharmonic_mode, minor_scale_mode)
{
  var new_href
    = window.location.origin + "/" 
    + key.replace("#", "sharp").replace("b", "flat")
    + "?em=" + enharmonic_mode
    + "&ms=" + minor_scale_mode;
  if(kCurrentLanguage) {
    new_href += "&lang=" + kCurrentLanguage;
  }

  return new_href;
}

function getKeyFromURL(url_string)
{
  const url = new URL(url_string);

  if(url.pathname.length < 2) { return; }

  var result = {};

  result.key = url.pathname.substr(1).replace("sharp", "#").replace("flat", "b");
  if(result.key.length > 3) { return; }

  // URLで、keyとemの指定が矛盾した場合(ex. /Csharp&em=flat)は、
  // keyを優先する。

  const em = url.searchParams.get("em");
  if(em && Object.values(EnharmonicMode).indexOf(em) !== -1) {
    result.enharmonic_mode = em;
  }

  const en_index = kEnharmonicKeys.indexOf(result.key);
  if(en_index !== -1) {
    result.enharmonic_mode = (en_index % 2 == 0) ? EnharmonicMode.kSharp : EnharmonicMode.kFlat;
  } else {
    result.enharmonic_mode = (result.enharmonic_mode || kCurrentEnharmonicMode);
  }

  const ms = url.searchParams.get("ms");
  if(ms && Object.values(MinorScaleMode).indexOf(ms) !== -1) {
    result.minor_scale_mode = ms;
  } else {
    result.minor_scale_mode = MinorScaleMode.kNatural;
  }

  return result;
}

// enharmonic_modeの設定は、クエリ文字列になっている方が良さそう
function changeTargetKeyByURL(url_string)
{
  var res = getKeyFromURL(url_string);

  if(res) {
    window.history.replaceState("", "", makeURL(res.key, res.enharmonic_mode, res.minor_scale_mode));
    updateLinkUrls();
    kCurrentEnharmonicMode = res.enharmonic_mode;
    kCurrentMinorScaleMode = res.minor_scale_mode;
    if(changeTargetKey(res.key)) {
      return;
    }
  }

  // URLからキーとenharmonic modeを決定できなかった場合は、
  // EnharmonicModeをデフォルト値に戻して、"/"へのアクセスにする
  kCurrentEnharmonicMode = kDefaultEnharmonicMode;

  const url = new URL(url_string);
  window.history.replaceState("", "", url.toString());
  updateLinkUrls();
  changeTargetKey("C");
};

function setKeyToURL(key, enharmonic_mode, minor_scale_mode) {

  const new_href = makeURL(key, enharmonic_mode, minor_scale_mode);

  // "/"へのリクエストのときは、locationを変更しない
  function get_lang_query(lang) { return (lang ? `?lang=${lang}` : ""); };
  const test_url = window.location.origin + "/" + get_lang_query(kCurrentLanguage);
  const useCurrentURL
    = (window.location.href === test_url)
    && key === kDefaultKey
    && enharmonic_mode === kDefaultEnharmonicMode;

  if( !useCurrentURL && window.location.href !== new_href )
  {
    window.history.pushState("", "", new_href);
    updateLinkUrls();
  }

  const encoded_url = encodeURIComponent(window.location.href);
  const encoded_title = encodeURIComponent($(".header-text-box > h1").text());
  const encoded_url_for_hatebu = encodeURIComponent(window.location.origin.replace("https://", ""));

  // update sns link urls
  $(".sns-button.twitter > a").attr("href", `https://twitter.com/share?url=${encoded_url}&text=${encoded_title}`);
  $(".sns-button.facebook > a").attr("href", `https://www.facebook.com/sharer/sharer.php?u=${encoded_url}`);
  $(".sns-button.google > a").attr("href", `https://plus.google.com/share?url=${encoded_url}`);
  $(".sns-button.hatebu > a").attr("href", `http://b.hatena.ne.jp/entry/s/${encoded_url_for_hatebu}`);
  $(".sns-button.github > a").attr("href", "https://github.com/hotwatermorning/related-key-map");
}

//! キー名が無効な場合（D#メジャーなど）は、falseを返す。
function changeTargetKey(key_name) {
  key_name = "" + key_name;
  var is_major = key_name.endsWith("m") == false;
  var em = kCurrentEnharmonicMode;
  var ms = kCurrentMinorScaleMode;

  var index = getRootIndexFromKeyName(key_name);

  if(index === -1) { return false; }

  var toParallel = (is_major ? 9 : 3);

  setKey($("#key1"), mod12(index + 1 + toParallel), !is_major, em, ms);
  setKey($("#key2"), mod12(index + 1), is_major, em, ms);
  setKey($("#key3"), mod12(index + 1), !is_major, em, ms);

  setKey($("#key4"), mod12(index + 0 + toParallel), !is_major, em, ms);
  setKey($("#key5"), mod12(index + 0), is_major, em, ms);
  setKey($("#key6"), mod12(index + 0), !is_major, em, ms);

  setKey($("#key7"), mod12(index + 11 + toParallel), !is_major, em, ms);
  setKey($("#key8"), mod12(index + 11), is_major, em, ms);
  setKey($("#key9"), mod12(index + 11), !is_major, em, ms);

  var minor_scale_text = "";

  switch(ms) {
    case MinorScaleMode.kNatural:
      minor_scale_text = "Nm";
      break;
    case MinorScaleMode.kHarmonic:
      minor_scale_text = "Hm";
      break;
    case MinorScaleMode.kMelodic:
      minor_scale_text = "Mm";
      break;
  }

  $(".minor-scale-mode-name").text(minor_scale_text);

  setKeyToURL(toInternal($("#key5 .key-name-box").text()), em, ms);
  return true;
};

const kPitchIndex = {
  "Cb": -1,
  "C": 0,
  "Cn": 0,
  "C#": 1,
  "Db": 1,
  "C##": 2,
  "D": 2,
  "Dn": 2,
  "D#": 3,
  "Eb": 3,
  "D##": 4,
  "E": 4,
  "En": 4,
  "Fb": 4,
  "E#": 5,
  "F": 5,
  "Fn": 5,
  "E##": 6,
  "F#": 6,
  "Gb": 6,
  "F##": 7,
  "G": 7,
  "Gn": 7,
  "G#": 8,
  "Ab": 8,
  "G##": 9,
  "A": 9,
  "An": 9,
  "A#": 10,
  "Bb": 10,
  "A##": 11,
  "B": 11,
  "Bn": 11,
  "B#": 12,
  "B##": 13,
};

//! 指定した波形を読み込んだ sampler を作成する Promise を返す。
function loadSampler(waveform_type) {
  const load_audio_buffer = function(waveform_type, name) {
    return new Promise((resolve, reject) => {
      import(/* webpackChunkName: "sample" */ "../audio/" + waveform_type + "/" + name + ".mp3")
        .then(module => fetch(module.default))
        .then(file => file.arrayBuffer())
        .then(buffer => AC.decodeAudioData(buffer))
        .then(audio_buffer => resolve(audio_buffer))
        .catch(e => reject(e));
    });
  };

  return new Promise((resolve, reject) => {
    Promise.all(kSampleFileNames.map(name => load_audio_buffer(waveform_type, name)))
    .then(audio_buffers => {
      var sample_data_list = {};
      for(var i = 0; i < kSampleFileNames.length; i++) {
        sample_data_list[kSampleFileNames[i].replace("sharp", "#")] = audio_buffers[i];
      }
      var sampler = new Tone.Sampler(sample_data_list).toMaster();
      SamplerTable.set(waveform_type, sampler);
      resolve(sampler);
    })
    .catch(e => reject(e));
  });
}

function makeNotePlayable(id, pitches) {
  // A3 = 440Hz = 69とする
  var noteNumberToHz = function(note_number) {
    const kBaseNoteNumber = 69;
    return 440.0 * Math.pow(2.0, (note_number - kBaseNoteNumber) / 12.0);
  }

  // @param level 音量をデシベルで表したもの。最大を 0dB とする。
  // @param length ルート音の長さ（秒）
  // @param shift 音をずらして鳴らすタイミング（秒）
  function playbackSynthesized(waveform_type, level, duration, shift) {
    // サンプル波形よりも合成波形のほうが若干音が大きく聞こえるので、音量を下げる。
    level -= 3;
    // この2つの波形は音量が大きく聞こえがちなので、少し音量を下げる。
    if(waveform_type === WaveformType.kSquare || waveform_type === WaveformType.kSawtooth) {
      level -= 5;
    }
    const now = AC.currentTime;
    const attack_time = 0.01;
    const release_time = 0.05;

    const gain = Math.pow(10, level / 20.0)

    for(var i = 0; i < pitches.length; ++i) {

      const start_time = now + (i * shift)
      const note_duration = duration - attack_time - (i * shift) - release_time;
      if(note_duration <= 0) { continue; }

      var g = AC.createGain();
      g.gain.setValueAtTime(0.0, start_time);
      g.gain.linearRampToValueAtTime(gain, start_time + attack_time);
      g.gain.setValueAtTime(gain, start_time + attack_time + note_duration);
      g.gain.linearRampToValueAtTime(0, start_time + attack_time + note_duration + release_time);

      var vco = AC.createOscillator();
      vco.frequency.value = noteNumberToHz(pitches[i]);
      vco.type = waveform_type;
      vco.start(start_time);
      vco.stop(start_time + attack_time + note_duration + release_time);
      vco.connect(g);
      g.connect(AC.destination);
    }
  };

  function playbackSample(waveform_type, level, duration, shift) {

    // これがないと、モバイル環境で正しく音が鳴らなかった。
    Tone.setContext(AC);

    // String のサンプルは他のサンプルよりも若干音が小さく聞こえるので、大きくする。
    if(waveform_type == WaveformType.kStrings) {
      level += 3;
    }


    var promise = undefined;
    var sampler = SamplerTable.get(waveform_type);
    if(sampler) {
      promise = new Promise((resolve, reject) => {
        resolve(sampler);
      });
    } else {
      promise = new Promise((resolve, reject) => {
        var interval_id = setInterval(() => {
          var sampler = SamplerTable.get(waveform_type);
          if(sampler) {
            clearInterval(interval_id);
            resolve(sampler);
          }
        }, 50);
      });
    }

    promise.then(sampler => {
      sampler.volume.value = level;
      for(var i = 0; i < pitches.length; ++i) {
        const start_time = i * shift;
        const note_duration = duration - (i * shift);
        if(note_duration <= 0) { continue; }

        const pitch = pitches[i];
        const kPitchClasses = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const octave = ((pitch / 12) - 1).toString();
        const pitch_class = kPitchClasses[pitch % 12];

        sampler.triggerAttackRelease(pitch_class + octave, note_duration, "+" + start_time.toString());
      }
    });
  }

  function playback() {
    // モバイル環境で一度ブラウザを閉じていた場合は、
    // AudioContext が suspend 状態になっていて、音がならない。
    // なので、再生前に再開しておく。
    AC.resume();

    if(kCurrentVolume <= -48.0) { return; }
    const wt = kCurrentWaveformType;

    // スライダーの 0dB をそのまま再生すると、サンプルを同時に再生したときに音割れが起こるので、
    // 音量を1/4に下げておく。
    const vol = kCurrentVolume - 12;

    if(wt == WaveformType.kPiano || wt == WaveformType.kStrings || wt == WaveformType.kGuitar) {
      playbackSample(wt, vol, 1.4, 0.2);
    } else {
      playbackSynthesized(wt, vol, 1.4, 0.2);
    }
  }

  $(document).on("touchstart mousedown", `#vf-${id}`, function(e) {
    e.preventDefault();
    e.stopPropagation();
    if(AC.state == "suspended") {
      AC.resume().then(() => { playback(); });
    } else {
      playback();
    }
  });

  $(document).on("touchend mouseup", `#vf-${id}`, function(e) {
    e.preventDefault();
    e.stopPropagation();
  });
}

// キー名に含まれる b や # を音楽記号に変換する
function removeNaturalAccidental(key_name) {
  return key_name.replace(/n/, "");
}

function toDisplay(key_name) {
  return key_name.replace(/b/g, "♭").replace(/#/g, "♯");
}

function toInternal(key_name) {
  return key_name.replace(/♭/g, "b").replace(/♯/g, "#");
}

function setDetailedKey(key_name, staff, render_context)
{
  key_name = "" + key_name;
  const is_major = key_name.endsWith("m") == false;

  var index = getRootIndexFromKeyName(key_name);
  const em = kCurrentEnharmonicMode;
  const ms = kCurrentMinorScaleMode;
  const scale = getScale(index, is_major, em, ms);
  const chords = getScaleChordList(is_major, kCurrentMinorScaleMode);

  const pitch = key_name.replace("m", "");

  $(".key-detail-heading > .key-title").text(toDisplay(key_name));

  staff.setKeySignature(key_name);
  staff.setContext(render_context);
  staff.draw();

  var stave_notes = [];
  var text_notes = [];
  var note_numbers = [];
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

    const chordName = scale.pitches()[i].replace("n", "") + chords[i];

    var n1 = `${root.toLowerCase()}/${rootOctave}`;
    var n2 = `${third.toLowerCase()}/${thirdOctave}`;
    var n3 = `${fifth.toLowerCase()}/${fifthOctave}`;
    var n4 = `${seventh.toLowerCase()}/${seventhOctave}`;

    var tetrad = new VF.StaveNote({
      clef: "treble",
      keys: [ n1, n2, n3, n4 ],
      duration: "q"
    });

    // moved: HM, NM のスケールのために半音上げられた音
    function add_accidental(note, index, tetrad, moved) {
      if(note.includes("##")) {
        tetrad = tetrad.addAccidental(index, new VF.Accidental("##"));
      } else if(note.includes("n")) {
        tetrad = tetrad.addAccidental(index, new VF.Accidental("n"));
      } else if(moved && note.includes("#")) {
        tetrad = tetrad.addAccidental(index, new VF.Accidental("#"));
      }
    };

    // i: interval (0 start)
    // j: index in a chord (0 start)
    // ms: minor scale mode
    function is_moved(i, j, is_major, ms) {
      if(is_major || ms == MinorScaleMode.kNatural) { return false; }
      if(ms == MinorScaleMode.kHarmonic) {
        switch(i) {
          case 0: return j == 3;
          case 2: return j == 2;
          case 4: return j == 1;
          case 6: return j == 0;
          default: return false;
        }
      } else if(ms == MinorScaleMode.kMelodic) {
        switch(i) {
          case 0: return j == 3;
          case 1: return j == 2;
          case 2: return j == 2;
          case 3: return j == 1;
          case 4: return j == 1;
          case 5: return j == 0;
          case 6: return j == 0 || j == 3;
          default: return false;
        }
      } else {
        return false;
      }
    }

    add_accidental(n1, 0, tetrad, is_moved(i, 0, is_major, ms));
    add_accidental(n2, 1, tetrad, is_moved(i, 1, is_major, ms));
    add_accidental(n3, 2, tetrad, is_moved(i, 2, is_major, ms));
    add_accidental(n4, 3, tetrad, is_moved(i, 3, is_major, ms));

    stave_notes.push(tetrad);

    var text = new VF.TextNote({
      text: toDisplay(chordName),
      duration: "q",
      line: 12,
      font: {
        family: "minimum-key-signature, Cardo",
        size: 18 * 72.0 / 96.0 / 1.4,
        weight: "400"
      },
      smooth: false,
    });
    text.setJustification(VF.TextNote.Justification.CENTER);

    text_notes.push(text);

    note_numbers[i] = [];
    note_numbers[i][0] = (rootOctave + 1) * 12 + kPitchIndex[root];
    note_numbers[i][1] = (thirdOctave + 1) * 12 + kPitchIndex[third];
    note_numbers[i][2] = (fifthOctave + 1) * 12 + kPitchIndex[fifth];
    note_numbers[i][3] = (seventhOctave + 1) * 12 + kPitchIndex[seventh];
  }

  stave_notes.forEach(function(note) {note.setContext(render_context)});
  text_notes.forEach(function(note) {note.setContext(render_context)});

  var voice = new VF.Voice({num_beats: 7, beat_value: 4});
  var voice2 = new VF.Voice({num_beats: 7, beat_value: 4});

  voice.addTickables(stave_notes);
  voice2.addTickables(text_notes);

  var formatter = new VF.Formatter().joinVoices([voice, voice2]).formatToStave([voice, voice2], staff);

  voice.draw(render_context, staff);
  voice2.draw(render_context, staff);

  for(var i = 0; i < 7; ++i) {
    makeNotePlayable(stave_notes[i].attrs.id, note_numbers[i]);
  }

  staff.setContext(undefined);
}

$(() => {
  const query = new URLSearchParams(window.location.search);
  var lang = query.get("lang");
  if(lang == null) {
    console.log("[Info]: lang query parameter is not defined");
  }
  kCurrentLanguage = lang;

  $(".header-text-box > h1 > a").attr("href", window.location.origin);
  $(".expand-image").attr("src", expand_image);
  $(".speaker-image").attr("src", speaker_image);
  $(".waveform-image").attr("src", waveform_image);

  var vdm = $(".volume-direction-minus");
  var vdp = $(".volume-direction-plus");

  vdm.attr("src", volume_minus);
  vdp.attr("src", volume_plus);

  vdm.on("click", function() {
    // todo: sliderの値を小さくする。
  });
  vdp.on("click", function() {
    // todo: sliderの値を大きくする。
  });

  var st = localStorage;

  var volume_slider = document.querySelector("#volume_slider");
  var wt_listbox = document.querySelector("#waveform_type_listbox");

  function loadSamplerIfNeeded(waveform_type) {
    if(isSamplerBasedWaveformType(waveform_type) && SamplerTable.get(waveform_type) == null) {
      loadSampler(waveform_type).then(sampler => {
        SamplerTable.set(waveform_type, sampler);
      });
    }
  }

  // waveform type の読み込み
  {
    var saved_wt = st.getItem("waveform-type");
    var index = Object.values(WaveformType).indexOf(saved_wt);
    if(index == -1) {
      saved_wt = WaveformType.kSine;
      index = 0;
    }

    kCurrentWaveformType = saved_wt;
    wt_listbox.options.selectedIndex = index;
    loadSamplerIfNeeded(kCurrentWaveformType);
  }

  // volume の読み込み
  {
    var saved_volume = st.getItem("volume");
    var volume = parseFloat(saved_volume);
    if(isNaN(volume)) {
      volume_slider.value = (-6).toString();
    } else {
      volume_slider.value = volume.toString();
    }
  }

  volume_slider.addEventListener("change", function(e) {
    kCurrentVolume = e.target.value;
    st.setItem("volume", kCurrentVolume.toString());
  });

  wt_listbox.addEventListener("change", function(e) {
    kCurrentWaveformType = e.target.value;
    st.setItem("waveform-type", kCurrentWaveformType);
    loadSamplerIfNeeded(kCurrentWaveformType);
  });

  document.querySelector('.menu-trigger').addEventListener('click', function() {
      document.querySelector('.menu-trigger').classList.toggle('active');
      document.querySelector('.key-detail-setting').classList.toggle('active');
  });

  for(var i = 1; i <= 9; ++i) {
    $(`#key${i}`).on("click", function(e) {
      const target_name_box = $(".key-name-box", e.delegateTarget);
      changeTargetKey(toInternal(target_name_box.text()));
    });
  }

  changeTargetKeyByURL(window.location.href);

  $(".switch-enharmonic-mode").on("click", e => {
    e.stopPropagation();
    const currentTargetKey = toInternal($(".tonic-key > .key-name-box").text());
    kCurrentEnharmonicMode
      = (kCurrentEnharmonicMode === EnharmonicMode.kSharp)
      ? EnharmonicMode.kFlat
      : EnharmonicMode.kSharp;
    changeTargetKey(currentTargetKey);
  });

  $(".switch-minor-scale-mode").on("click", e => {
    e.stopPropagation();
    switch(kCurrentMinorScaleMode) {
      case MinorScaleMode.kNatural:
        kCurrentMinorScaleMode = MinorScaleMode.kHarmonic;
        break;
      case MinorScaleMode.kHarmonic:
        kCurrentMinorScaleMode = MinorScaleMode.kMelodic;
        break;
      case MinorScaleMode.kMelodic:
        kCurrentMinorScaleMode = MinorScaleMode.kNatural;
        break;
    }

    const currentTargetKey = toInternal($(".tonic-key > .key-name-box").text());
    changeTargetKey(currentTargetKey);
  });
});

$(window).on("load", () => {
  window.onpopstate = function(e) {
    changeTargetKeyByURL(window.location.href);
  };

  $(".sns-button").css("display", "block");

  $(".inline").modaal({
    animation_speed: 200,
    width: 900,
    height: 400,
    before_open: function(e) {
      document.querySelector('.menu-trigger').classList.remove('active');
      document.querySelector('.key-detail-setting').classList.remove('active');

      e.stopPropagation();

      var staffDom = $("#staff");

      // SVG の祖先となるこの要素をこの段階で可視化しておかないと
      // vexflow 内での SVG のサイズ計算（getBBox()）が正しく働かない。
      // なのでこの段階で可視化しておく。
      // このままだとモーダルウィンドウを閉じたときに余計な描画が残ってしまうので、
      // after_close で不可視化する。
      $("#inline").show();
      $("svg", staffDom).remove();
      var st = new VF.Stave(0, 70, 0);
      st.setWidth(staffDom.width() / 1.4 - 10);
      st.addClef("treble");
      var target_key_name = toInternal($(".key-name-box", $(e.delegateTarget).parent()).text());

      var renderer = new VF.Renderer(staffDom[0], VF.Renderer.Backends.SVG);
      renderer.resize(staffDom.width() / 1.4 - 2, staffDom.height());

      var render_context = renderer.getContext();
      setDetailedKey(target_key_name, st, render_context);
    },
    after_close: function() {
      $("#inline").hide();
    }
  });
});