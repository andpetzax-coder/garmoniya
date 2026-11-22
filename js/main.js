// Гармония v3 - мелочи: слайды hero, форма-демо и «поделиться»
(function () {
  "use strict";

  // Hero: кроссфейд слайдов раз в 5,5 с, подпись и точки синхронно, крутится только пока hero виден.
  var box = document.querySelector(".hero__slidebox");
  if (box) {
    var slides = box.querySelectorAll(".hero__slide");
    var dots = document.querySelectorAll(".hero__dot");
    var cap = document.querySelector("[data-cap]");
    var captions = [
      "<b>Наталья Петровна Еван</b> - руководитель коллектива",
      "<b>Галина Петровна Лазутина</b> - педагог по вокалу",
      "<b>Коллектив «Гармония»</b> - люди, которые поют для вас"
    ];
    if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var i = 0, timer = null, DELAY = 5500;
      function show(n) {
        slides[i].classList.remove("is-on");
        if (dots[i]) dots[i].classList.remove("is-on");
        i = (n + slides.length) % slides.length;
        slides[i].classList.add("is-on");
        if (dots[i]) dots[i].classList.add("is-on");
        if (cap) cap.innerHTML = captions[i];
      }
      function next() { show(i + 1); }
      function start() { if (!timer) timer = setInterval(next, DELAY); }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      dots.forEach(function (d, n) {
        d.addEventListener("click", function () { stop(); show(n); start(); });
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }, { threshold: 0.15 }).observe(box);
      } else { start(); }
      document.addEventListener("visibilitychange", function () {
        document.hidden ? stop() : start();
      });
    }
  }

  // Маска телефона: по мере ввода приводим к виду +7 (926) 123-45-67.
  // Восьмерку в начале понимаем как +7, код страны можно не вводить. Буквы и @ не трогаем (это e-mail).
  function phoneDigits(v) {
    var d = v.replace(/\D/g, "");
    if (!d) return "";
    if (d.charAt(0) === "8") d = "7" + d.slice(1);
    else if (d.charAt(0) !== "7") d = "7" + d;
    return d.slice(0, 11);
  }
  function phonePretty(d) {
    var t = d.slice(1), s = "+7";
    if (!t.length) return s;
    s += " (" + t.slice(0, 3);
    if (t.length <= 3) return s + (t.length === 3 ? ")" : "");
    s += ") " + t.slice(3, 6);
    if (t.length > 6) s += "-" + t.slice(6, 8);
    if (t.length > 8) s += "-" + t.slice(8, 10);
    return s;
  }
  function bindPhone(el) {
    var soft = el.getAttribute("data-tel") === "soft";
    var prev = "";
    el.addEventListener("input", function (e) {
      var v = el.value;
      if (soft && (v.indexOf("@") >= 0 || /[a-zа-яё]/i.test(v))) { prev = v; return; }
      var d = phoneDigits(v);
      if (e.inputType === "deleteContentBackward" && prev && d.length === prev.replace(/\D/g, "").length) {
        d = d.slice(0, -1);
      }
      if (!d) { el.value = ""; prev = ""; return; }
      var pretty = phonePretty(d);
      el.value = pretty;
      prev = pretty;
      el.setSelectionRange(pretty.length, pretty.length);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-tel]"), bindPhone);

  // Формы: заявки уходят в Google-таблицу «Заявки - Гармония».
  var FORMS_URL = "https://script.google.com/macros/s/AKfycbygXpl-bI7OcflaZFmQUF74QGjtqKRGR0EN1fDCakWLqaL5v8F5i4tStkpMxTPV_7M9/exec"; // обновлён 19.11: доступ «Все», владелец andpetzax@gmail.com
  var forms = document.querySelectorAll("[data-form]");
  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var data = { form: form.getAttribute("data-form") || "form", page: location.href };
      var raw = {};
      new FormData(form).forEach(function (v, k) { (raw[k] = raw[k] || []).push(v); });
      Object.keys(raw).forEach(function (k) { data[k] = raw[k].length > 1 ? raw[k] : raw[k][0]; });
      var btn = form.querySelector('button[type="submit"]');
      var oldText = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Отправляем..."; }
      form.classList.remove("is-error");
      fetch(FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) { if (!res || res.ok !== true) throw new Error("bad"); })
        .then(function () {
          form.classList.add("is-sent");
          form.reset();
          var ok = form.querySelector(".form__ok");
          if (ok) ok.setAttribute("tabindex", "-1"), ok.focus();
        })
        .catch(function () { form.classList.add("is-error"); })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = oldText; } });
    });
  });

  // Отзывы: опубликованы карточки-цитаты - строку «скоро» убираем.
  var soon = document.querySelector("[data-quotes-soon]");
  if (soon && document.querySelectorAll(".quotes .quote").length) soon.style.display = "none";

  // «Поделиться»: на телефоне открывается штатное окно, на десктопе - ссылка копируется.
  var shareBtn = document.querySelector("[data-share]");
  var tip = document.querySelector("[data-share-tip]");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var url = window.location.href;
      var text = "Народный вокальный коллектив «Гармония» из Ногинска - послушайте!";
      if (navigator.share) {
        navigator.share({ title: document.title, text: text, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url + " - " + text).then(function () {
          if (tip) {
            tip.classList.add("is-on");
            setTimeout(function () { tip.classList.remove("is-on"); }, 2500);
          }
        });
      }
    });
  }
})();
