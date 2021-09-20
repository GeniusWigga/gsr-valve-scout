const $ = require("jquery");

const closeButtonSel = ".busch-mfp-close-btn";
const _ = require("lodash");

function registerPopupImage($obj, { mainClass, callbacks, ...options } = {}, language) {
  const closeWord =
    typeof buschjost !== "undefined" ? buschjost.language : language == "en" ? "Close" : "Schließen";

  if ($obj.size() < 1) {
    return;
  }

  return $obj.magnificPopup({
    type: "image",
    closeMarkup: `<a href="#" title="%title%" class="busch-mfp-close-btn"><i class="fa fa-times"></i><span>${closeWord}</span></a>`,
    showCloseBtn: true,
    closeOnContentClick: false,
    closeOnBgClick: false,
    closeBtnInside: true,
    fixedContentPos: true,
    removalDelay: 500, // delay removal by X to allow out-animation,
    callbacks: {
      beforeOpen() {
        this.st.mainClass = _.compact(["mfp-zoom-in", mainClass]).join(" "); // this.st.el.attr('data-effect');
      },
      open() {
        $(closeButtonSel).on("click", () => {
          $.magnificPopup.close();
        });
      },
      ...callbacks,
    },
    midClick: true, // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
    ...options,
  });
}

function registerPopupGallery($obj) {
  const closeWord = buschjost.language == "en" ? "Close" : "Schließen";
  let items = [];

  const galleryKey = _.toLower($obj.data("gallerykey"));
  const regEx = new RegExp(`^${galleryKey}(\\d+)$`);
  const dataAttributes = $obj.data();

  _.forEach(dataAttributes, (value, key) => {
    const matches = regEx.exec(key);
    if (matches) {
      items.push({
        src: $obj.data(matches[0]),
        type: "image",
        title: $obj.data(`${galleryKey}desc${matches[1]}`) || " ",
      });
    }
  });

  items = items.reverse();

  return $obj.magnificPopup({
    type: "image",
    items,
    closeMarkup: `<a href="#" title="%title%" class="busch-mfp-close-btn"><i class="fa fa-times"></i><span>${closeWord}</span></a>`,
    showCloseBtn: true,
    closeOnContentClick: false,
    closeOnBgClick: false,
    closeBtnInside: true,
    fixedContentPos: true,
    removalDelay: 500, // delay removal by X to allow out-animation
    callbacks: {
      beforeOpen() {
        this.st.mainClass = "mfp-zoom-in"; // this.st.el.attr('data-effect');
      },
      open() {
        $(closeButtonSel).on("click", (e) => {
          e.preventDefault();
          $.magnificPopup.close();
        });
      },
    },
    midClick: true,
    gallery: {
      enabled: true,
      preload: [0, 2],
      navigateByImgClick: true,
      arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',
      tPrev: "Previous (Left arrow key)",
      tNext: "Next (Right arrow key)",
      tCounter: '<span class="mfp-counter">%curr% / %total%</span>',
    },
  });
}

module.exports = {
  registerImage: registerPopupImage,
  registerGallery: registerPopupGallery,
};
