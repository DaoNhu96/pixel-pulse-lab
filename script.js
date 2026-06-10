const measurementId = "G-XXXXXXXXXX";

function trackEvent(name, params = {}) {
  if (typeof window.gtag === "function" && measurementId !== "G-XXXXXXXXXX") {
    window.gtag("event", name, params);
    return;
  }

  console.info("GA4 event preview", name, params);
}

const ctaButton = document.getElementById("cta-button");
const emailForm = document.getElementById("email-form");
const formStatus = document.getElementById("form-status");

ctaButton?.addEventListener("click", () => {
  trackEvent("cta_click", {
    location: "hero",
    label: "start_tracking",
  });
});

emailForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(emailForm);
  const goal = formData.get("goal");

  trackEvent("form_submit", {
    form_name: "ga4_test_form",
    goal,
  });

  formStatus.textContent = "Test submit recorded. Check GA4 Realtime after you add your Measurement ID.";
  emailForm.reset();
});
