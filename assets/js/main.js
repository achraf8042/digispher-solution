(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Header behaviour
     --------------------------------------------------------------------- */

  var header = document.querySelector(".site-header");

  function updateHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile navigation
     --------------------------------------------------------------------- */

  var nav = document.getElementById("mainNav");
  var toggler = document.querySelector(".navbar-toggler");

  if (nav && toggler) {
    nav.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) {
        return;
      }
      if (
        window.matchMedia("(max-width: 991.98px)").matches &&
        nav.classList.contains("show")
      ) {
        toggler.click();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("show")) {
        toggler.click();
        toggler.focus();
      }
    });

    nav.addEventListener("shown.bs.collapse", function () {
      toggler.setAttribute("aria-label", "Close menu");
    });

    nav.addEventListener("hidden.bs.collapse", function () {
      toggler.setAttribute("aria-label", "Open menu");
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */

  var year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------------------
     Contact form
     --------------------------------------------------------------------- */

  var form = document.getElementById("contact-form");
  if (!form) {
    return;
  }

  var openedAt = Date.now();
  var params = new URLSearchParams(window.location.search);
  var topic = params.get("topic");
  var inquiry = form.querySelector("#inquiry");

  if (topic && inquiry) {
    Array.prototype.forEach.call(inquiry.options, function (option) {
      if (option.value === topic) {
        inquiry.value = topic;
      }
    });
  }

  var subjectParam = params.get("subject");
  var subjectField = form.querySelector("#subject");
  if (subjectParam && subjectField) {
    subjectField.value = subjectParam;
  }

  var status = document.getElementById("form-status");

  function field(id) {
    return form.querySelector("#" + id);
  }

  function setError(id, message) {
    var error = document.getElementById(id + "-error");
    var input = field(id);
    if (!error) {
      return;
    }
    error.textContent = message || "";
    if (input) {
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }
  }

  function clearErrors() {
    ["name", "email", "inquiry", "subject", "message"].forEach(function (id) {
      setError(id, "");
    });
  }

  function showStatus(kind, content) {
    if (!status) {
      return;
    }
    status.className = "alert-ds " + kind;
    status.replaceChildren();
    if (typeof content === "string") {
      status.textContent = content;
    } else if (content) {
      status.appendChild(content);
    }
    status.hidden = false;
  }

  function readStorage(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      /* Storage can be unavailable in private modes. The form still works. */
    }
  }

  /* Clear a field error as soon as the visitor starts correcting it. */
  ["name", "email", "inquiry", "subject", "message"].forEach(function (id) {
    var input = field(id);
    if (input) {
      input.addEventListener("input", function () {
        setError(id, "");
      });
      input.addEventListener("change", function () {
        setError(id, "");
      });
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (status) {
      status.hidden = true;
    }
    clearErrors();

    var honeypot = form.querySelector("#company_website");
    if (honeypot && honeypot.value) {
      showStatus("ok", "Thank you. Your message has been sent.");
      form.reset();
      return;
    }

    if (Date.now() - openedAt < 1500) {
      showStatus("bad", "Please take a moment to complete the form, then send it again.");
      return;
    }

    var last = Number(readStorage("ds-contact-at") || 0);
    if (last && Date.now() - last < 30000) {
      showStatus("bad", "Please wait a few seconds before sending another message.");
      return;
    }

    var nameInput = field("name");
    var emailInput = field("email");
    var companyInput = field("company");
    var subjectInput = field("subject");
    var messageInput = field("message");

    var name = nameInput ? nameInput.value.trim() : "";
    var email = emailInput ? emailInput.value.trim() : "";
    var company = companyInput ? companyInput.value.trim() : "";
    var inquiryValue = inquiry ? inquiry.value : "";
    var subject = subjectInput ? subjectInput.value.trim() : "";
    var message = messageInput ? messageInput.value.trim() : "";
    var valid = true;

    if (!name) {
      setError("name", "Enter your full name.");
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email", "Enter a valid work email.");
      valid = false;
    }
    if (!inquiryValue) {
      setError("inquiry", "Choose an inquiry type.");
      valid = false;
    }
    if (!subject) {
      setError("subject", "Enter a subject.");
      valid = false;
    }
    if (message.length < 10) {
      setError("message", "Enter a message of at least a few words.");
      valid = false;
    }

    if (!valid) {
      showStatus("bad", "Check the highlighted fields and try again.");
      var firstInvalid = form.querySelector("[aria-invalid='true']");
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    var body = [
      "Name: " + name,
      "Email: " + email,
      "Company: " + (company || "Not provided"),
      "Inquiry: " + inquiryValue,
      "",
      message,
      "",
      "Sent from the DigiSpher website contact form."
    ].join("\n");

    var submitButton = form.querySelector('button[type="submit"]');

    function setSending(sending) {
      if (!submitButton) {
        return;
      }
      submitButton.disabled = sending;
      submitButton.setAttribute("aria-busy", sending ? "true" : "false");
    }

    writeStorage("ds-contact-at", String(Date.now()));
    setSending(true);

    fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("Form post failed with status " + response.status);
      }
      form.reset();
      setSending(false);
      showStatus("ok", "Thank you. Your message has been sent, and we will reply by email.");
    }).catch(function () {
      /* The post did not go through. Offer the email client as a fallback. */
      var mailto =
        "mailto:info@digispher.online?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      var fragment = document.createDocumentFragment();
      fragment.appendChild(
        document.createTextNode("The message could not be sent. You can ")
      );

      var sendLink = document.createElement("a");
      sendLink.href = mailto;
      sendLink.textContent = "send it with your email app";
      fragment.appendChild(sendLink);

      fragment.appendChild(
        document.createTextNode(" to info@digispher.online instead.")
      );

      setSending(false);
      showStatus("bad", fragment);
      sendLink.focus();
    });
  });
})();
