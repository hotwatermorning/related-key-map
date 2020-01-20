var express = require('express');
var router = express.Router();
var debug_app = require("debug")("app");

const kLanguageTable = {
  "ja": "日本語",
  "en": "English",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};

function getTextResource(lang) {
  debug_app(`getTextResource: ${lang}`);

  var tr = {};

  tr["url"] = "https://related-key-map.diatonic.jp";
  tr["title"] = "Related Key Map";
  tr["current_language"] = kLanguageTable[lang];
  tr["language_list"] = kLanguageTable;
  tr["privacy_policy_link_name"] = "Privacy Policy";
  tr["disclaimer_link_name"] = "Disclaimer";

  switch(lang) {
    case "ja":
      tr["keywords"] = "調, 五度圏, 近親調, 同主調, 平行調";
      tr["description"] = "ある音楽の調に対する近親調を表示します。";
      tr["dominant_key"] = "属調";
      tr["subdominant_key"] = "下属調";
      tr["relative_key"] = "平行調";
      tr["parallel_key"] = "同主調";
      tr["privacy_policy_link_name"] = "プライバシーポリシー";
      tr["privacy_policy_title"] = "プライバシーポリシー";
      tr["disclaimer_link_name"] = "免責事項";
      tr["disclaimer_title"] = "免責事項";
      break;
    case "zh-Hans":
      tr["keywords"] = "调, 五度圈, 近关系调, 同主音调, 平行调";
      tr["description"] = "显示近关系调于给的调。";
      tr["dominant_key"] = "属调";
      tr["subdominant_key"] = "下属调";
      tr["relative_key"] = "平行调";
      tr["parallel_key"] = "同主音调";
      break;
    case "zh-Hant":
      tr["keywords"] = "調, 五度圈, 近關係調, 同主音調, 平行調";
      tr["description"] = "顯示近關係調於給的調。";
      tr["dominant_key"] = "屬調";
      tr["subdominant_key"] = "下屬調";
      tr["relative_key"] = "平行調";
      tr["parallel_key"] = "同主音調";
      break;
    case "en":
    default:
      tr["keywords"] = "Musical Keys, Circle of Fifth, Closely Related Key, Parallel Key, Relative Key";
      tr["description"] = "Show the closely related keys to a musical key.";
      tr["dominant_key"] = "Dominant";
      tr["subdominant_key"] = "Subdominant";
      tr["relative_key"] = "Relative";
      tr["parallel_key"] = "Parallel";
      tr["current_language"] = "English";
      break;
  }

  return tr;
}

function getLanguageId(req) {
  var lang = req.query.lang;
  if(lang == null) { lang = ""; }
  lang = lang.toString();
  debug_app("Language in query: " + lang);

  for(key in kLanguageTable) {
    if(key.toLowerCase() === lang.toLowerCase()) {
      return key;
    }
  }

  return undefined;
}

// @return true if redirected.
function redirect(req, res, next, lang) {
  var url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
  url.searchParams.delete("lang");
  url.searchParams.append("lang", lang);
  debug_app(`new url: ${url.toString()}`);
  res.redirect(url);
  return true;
}

function create_handler(page_name) {
  return function(req, res, next) {
    const query_lang = getLanguageId(req);
    debug_app("Language queried: " + query_lang);

    if(query_lang == null) {
      var accept_langs = req.get("Accept-Language");
      debug_app("Accept-Language: " + accept_langs);
      if(accept_langs == null) {
        debug_app("Accept-Language is not defined.");
        // クローラによるアクセスとみなす。
      } else {
        var accepted_lang = req.acceptsLanguages(Object.keys(kLanguageTable));
        debug_app("Language accepted: " + accepted_lang);
        if(accepted_lang === false) {
          accepted_lang = "en";
        }

        redirect(req, res, next, accepted_lang);
        return;
      }
    }

    debug_app(`page_name: ${page_name}`);
    debug_app(`url: ${req.url}`);
    debug_app(`originalUrl: ${req.originalUrl}`);
    debug_app(`host: ${req.headers.host}`);

    var lang_to_use = (query_lang || "en");
    var tr = getTextResource(lang_to_use);

    debug_app(`TextResource: ${tr}`);
    debug_app(`language_list: ${tr.language_list}`);
    for(id in tr.language_list) {
      debug_app(`language: ${id} => ${tr.language_list[id]}`);
    }

    res.render(page_name, tr);
  };
};

router.get("/privacy-policy", create_handler("privacy-policy"));
router.get("/disclaimer", create_handler("disclaimer"));
router.get("/:root_key", create_handler("index"));
router.get("/", create_handler("index"));

module.exports = router;
