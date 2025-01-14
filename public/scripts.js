// Constants
const API_ENDPOINTS = {
  FORMS: {
    CONTACT: "/api/forms/submit",
    LOGIN: "/api/auth/login",
  },
  AUTH: {
    LOGOUT: "/api/auth/logout",
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
  },
  MESSAGES: {
    GET: "/api/forms",
    DELETE_ALL: "/api/forms",
    DELETE: "/api/forms/:id",
  },
  REDIRECTS: {
    AFTER_LOGIN: "/dashboard",
    AFTER_REGISTER: "/dashboard",
    AFTER_LOGOUT: "/login",
  },
};

const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  CERTIFICATIONS: "/certifications",
  GALLERY: "/gallery",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
};

class App {
  constructor() {
    this.currentPage = document.body.dataset.page;
    this.authManager = new AuthManager(); // Initialize AuthManager once
    this.initializeModules();
  }

  initializeModules() {
    this.navigation = new Navigation();
    this.formManager = new FormManager();
    this.galleryManager = new GalleryManager();

    switch (this.currentPage) {
      case "home":
        this.formManager.initContactForm();
        break;
      case "gallery":
        this.galleryManager.init();
        break;
      default:
        break;
    }
  }
}

class Navigation {
  constructor() {
    this.DOM = {
      hamburgerMenu: document.querySelector("[data-hamburger]"),
      dropdownMenu: document.querySelector("[data-dropdown]"),
      navLinks: document.querySelectorAll("[data-nav-link]"),
    };
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    if (!this.DOM.hamburgerMenu || !this.DOM.dropdownMenu) return;

    this.DOM.hamburgerMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    document.addEventListener("click", (e) => {
      if (
        !this.DOM.dropdownMenu.contains(e.target) &&
        !this.DOM.hamburgerMenu.contains(e.target)
      ) {
        this.closeMenu();
      }
    });

    this.DOM.navLinks.forEach((link) => {
      link.addEventListener("click", () => this.closeMenu());
    });
  }

  toggleMenu() {
    this.DOM.hamburgerMenu.classList.toggle("is-active");
    this.DOM.dropdownMenu.classList.toggle("nav__dropdown--visible");
  }

  closeMenu() {
    this.DOM.hamburgerMenu.classList.remove("is-active");
    this.DOM.dropdownMenu.classList.remove("nav__dropdown--visible");
  }
}

class FormManager {
  constructor() {
    this.DOM = {
      contactForm: document.querySelector('[data-form="contact"]'),
      nameInput: document.querySelector('[data-input="name"]'),
      emailInput: document.querySelector('[data-input="email"]'),
      phoneInput: document.querySelector('[data-input="phone"]'),
      messageInput: document.querySelector('[data-input="message"]'),
      submitButton: document.querySelector('[data-action="submit"]'),
      errorSpans: {
        name: document.querySelector('[data-error="name"]'),
        email: document.querySelector('[data-error="email"]'),
        phone: document.querySelector('[data-error="phone"]'),
        message: document.querySelector('[data-error="message"]'),
      },
    };

    this.initContactForm();
  }

  initContactForm() {
    if (this.DOM.contactForm) {
      this.DOM.contactForm.addEventListener("submit", (e) =>
        this.handleSubmit(e)
      );
      this.addInputValidationListeners();
    }
  }

  addInputValidationListeners() {
    ["name", "email", "phone", "message"].forEach((field) => {
      const input = this.DOM[`${field}Input`];
      if (input) {
        input.addEventListener("input", () => {
          this.validateField(field, input.value);
          this.DOM.errorSpans[field].textContent = "";
        });
        input.addEventListener("blur", () => {
          this.validateField(field, input.value);
        });
      }
    });
  }

  validateField(field, value) {
    const errors = {};

    switch (field) {
      case "name":
        if (!value.trim()) errors.name = "Name is required";
        else if (value.length < 2)
          errors.name = "Name must be at least 2 characters";
        else if (value.length > 50)
          errors.name = "Name cannot exceed 50 characters";
        break;

      case "email":
        const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
        if (!value.trim()) errors.email = "Email is required";
        else if (!emailRegex.test(value))
          errors.email = "Please enter a valid email address";
        break;

      case "phone":
        const phoneRegex =
          /^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
        if (!value.trim()) errors.phone = "Phone number is required";
        else if (!phoneRegex.test(value))
          errors.phone = "Please enter a valid phone number";
        break;

      case "message":
        if (!value.trim()) errors.message = "Message is required";
        else if (value.length < 10)
          errors.message = "Message must be at least 10 characters";
        else if (value.length > 1000)
          errors.message = "Message cannot exceed 1000 characters";
        break;
    }

    if (errors[field]) {
      this.DOM.errorSpans[field].textContent = errors[field];
      return false;
    }
    return true;
  }

  validateForm() {
    const fields = ["name", "email", "phone", "message"];
    let isValid = true;

    fields.forEach((field) => {
      const input = this.DOM[`${field}Input`];
      if (input && !this.validateField(field, input.value)) {
        isValid = false;
      }
    });

    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.clearErrors();

    try {
      const formData = {
        name: this.DOM.nameInput.value,
        email: this.DOM.emailInput.value,
        phone: this.DOM.phoneInput.value,
        message: this.DOM.messageInput.value,
      };

      const response = await fetch(API_ENDPOINTS.FORMS.CONTACT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.status === "success") {
        this.showSuccess(result.message);
        this.DOM.contactForm.reset();
      } else {
        // Handle validation errors from Joi
        const errors = result.message.split(", ").reduce((acc, error) => {
          const field = error.toLowerCase().split(" ")[0];
          acc[field] = error;
          return acc;
        }, {});
        this.showErrors(errors);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      this.showErrors({ general: "Error sending message. Please try again." });
    }
  }

  showSuccess(message) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "alert alert--success";
    alertDiv.textContent = message;
    this.DOM.contactForm.insertBefore(
      alertDiv,
      this.DOM.contactForm.firstChild
    );
    setTimeout(() => alertDiv.remove(), 5000);
  }

  showErrors(errors) {
    this.clearErrors();
    Object.entries(errors).forEach(([field, message]) => {
      if (field === "general") {
        const alertDiv = document.createElement("div");
        alertDiv.className = "alert alert--error";
        alertDiv.textContent = message;
        this.DOM.contactForm.insertBefore(
          alertDiv,
          this.DOM.contactForm.firstChild
        );
      } else if (this.DOM.errorSpans[field]) {
        this.DOM.errorSpans[field].textContent = message;
      }
    });
  }

  clearErrors() {
    Object.values(this.DOM.errorSpans).forEach((span) => {
      if (span) span.textContent = "";
    });
    this.DOM.contactForm
      .querySelectorAll(".alert")
      .forEach((alert) => alert.remove());
  }
}

class AuthManager {
  constructor() {
    this.DOM = {
      registerForm: document.querySelector('[data-form="register"]'),
      loginForm: document.querySelector('[data-form="login"]'),
      loginEmail: document.querySelector("[data-login-email]"),
      loginPassword: document.querySelector("[data-login-password]"),
      registerEmail: document.querySelector("[data-register-email]"),
      registerPassword: document.querySelector("[data-register-password]"),
      registerConfirmPassword: document.querySelector(
        "[data-register-confirm-password]"
      ),
      passwordToggle: document.querySelector("[data-password-toggle]"),
      errorMessages: document.querySelectorAll("[data-error]"),
    };

    // Initialize password toggle for login form
    if (this.DOM.passwordToggle && this.DOM.loginPassword) {
      this.DOM.passwordToggle.addEventListener("click", () =>
        this.toggleLoginPasswordVisibility()
      );
    }

    // Initialize event listeners
    this.initEventListeners();
  }

  initEventListeners() {
    if (this.DOM.loginForm) {
      this.DOM.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    if (this.DOM.registerForm) {
      this.DOM.registerForm.addEventListener("submit", (e) =>
        this.handleRegister(e)
      );
    }
  }

  clearErrors(form) {
    const errorMessages = form.querySelectorAll(".error-message");
    errorMessages.forEach((span) => {
      span.textContent = "";
    });
  }

  async handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(this.DOM.loginForm);
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        window.location.href = API_ENDPOINTS.REDIRECTS.AFTER_LOGIN;
      } else {
        this.showErrors(this.DOM.loginForm, result.message);
      }
    } catch (error) {
      alert("An unexpected error occurred. Please try again.");
    }
  }

  async handleRegister(e) {
    e.preventDefault(); // Prevent default form submission

    // Collect form data
    const formData = new FormData(this.DOM.registerForm);
    const data = {
      email: formData.get("email").trim().toLowerCase(),
      password: formData.get("password"),
      confirmPassword: formData.get("confirm-password"),
    };

    try {
      // Send registration data to the server
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        // Redirect the user on success
        window.location.href = API_ENDPOINTS.REDIRECTS.AFTER_REGISTER;
      } else {
        // Display the error message returned by the server
        alert(result.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      // Handle unexpected errors
      alert("An unexpected error occurred. Please try again.");
    }
  }

  showErrors(form, message) {
    const generalError = form.querySelector('[data-error="general"]');
    if (generalError) {
      generalError.textContent = message;
    }
  }

  initLogin() {
    if (!this.DOM.loginForm) return;
    console.log("Login form initialized");

    this.DOM.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleLogin(e);
    });
  }

  initRegister() {
    if (!this.DOM.registerForm) return;

    this.DOM.registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleRegister(e);
    });

    if (this.DOM.passwordToggle) {
      this.DOM.passwordToggle.addEventListener("click", () =>
        this.togglePasswordVisibility()
      );
    }
  }

  togglePasswordVisibility() {
    const passwordType =
      this.DOM.registerPassword.type === "password" ? "text" : "password";
    this.DOM.registerPassword.type = passwordType;
    this.DOM.registerConfirmPassword.type = passwordType;
    this.DOM.passwordToggle.textContent =
      passwordType === "password" ? "👀" : "🙈";
  }
}

class GalleryManager {
  constructor() {
    this.DOM = {
      container: document.querySelector("[data-gallery-container]"),
      items: document.querySelectorAll("[data-gallery-item]"),
      filterButtons: document.querySelectorAll("[data-filter]"),
      lightbox: document.querySelector("[data-lightbox]"),
      lightboxImage: document.querySelector("[data-lightbox-image]"),
      lightboxClose: document.querySelector("[data-lightbox-close]"),
      lightboxPrev: document.querySelector("[data-lightbox-prev]"),
      lightboxNext: document.querySelector("[data-lightbox-next]"),
      lightboxDescription: document.querySelector(
        "[data-lightbox-description]"
      ),
      lightboxCounter: document.querySelector("[data-lightbox-counter]"),
      filterContainer: document.querySelector("[data-filter-container]"),
    };

    this.currentIndex = 0;
    this.images = Array.from(this.DOM.items);
  }

  init() {
    // Check if we're on the gallery page
    if (!document.querySelector(".gallery")) return;

    console.log("Gallery initialized", {
      container: !!this.DOM.container,
      items: this.images.length,
      lightbox: !!this.DOM.lightbox,
    });

    this.bindGalleryEvents();
    this.bindLightboxEvents();
  }

  bindLightboxEvents() {
    this.DOM.lightboxClose?.addEventListener("click", () =>
      this.closeLightbox()
    );
    this.DOM.lightboxPrev?.addEventListener("click", () => this.navigate(-1));
    this.DOM.lightboxNext?.addEventListener("click", () => this.navigate(1));

    let touchStartX = 0;
    this.DOM.lightbox?.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    });

    this.DOM.lightbox?.addEventListener("touchend", (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const difference = touchStartX - touchEndX;
      if (Math.abs(difference) > 50) {
        this.navigate(difference > 0 ? 1 : -1);
      }
    });

    document.addEventListener("keydown", (e) => this.handleKeyboard(e));
  }

  bindGalleryEvents() {
    this.images.forEach((item) => {
      item.addEventListener("click", (e) => this.openLightbox(e));
      //on hover add
    });

    this.DOM.filterButtons?.forEach((button) => {
      button.addEventListener("click", (e) => this.filterImages(e));
    });
  }

  openLightbox(e) {
    const item = e.currentTarget;
    this.currentIndex = parseInt(item.dataset.index, 10);
    this.updateLightboxContent();
    this.DOM.lightbox?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  closeLightbox() {
    this.DOM.lightbox?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  updateLightboxContent() {
    const currentItem = this.images[this.currentIndex];
    if (!currentItem) return;

    const img = currentItem.querySelector("[data-gallery-image]");
    if (this.DOM.lightboxImage) {
      this.DOM.lightboxImage.src = img.src;
      this.DOM.lightboxImage.alt = img.alt;
    }
    if (this.DOM.lightboxDescription) {
      this.DOM.lightboxDescription.textContent = img.dataset.description;
    }
    if (this.DOM.lightboxCounter) {
      this.DOM.lightboxCounter.textContent = `${this.currentIndex + 1} / ${
        this.images.length
      }`;
    }
  }

  navigate(direction) {
    this.currentIndex =
      (this.currentIndex + direction + this.images.length) % this.images.length;
    this.updateLightboxContent();
  }

  handleKeyboard(e) {
    if (this.DOM.lightbox?.getAttribute("aria-hidden") === "true") return;

    switch (e.key) {
      case "Escape":
        this.closeLightbox();
        break;
      case "ArrowLeft":
        this.navigate(-1);
        break;
      case "ArrowRight":
        this.navigate(1);
        break;
    }
  }

  filterImages(e) {
    const filter = e.target.dataset.filter;

    this.DOM.filterButtons?.forEach((btn) =>
      btn.classList.toggle("active", btn === e.target)
    );

    this.images.forEach((item) => {
      const shouldShow = filter === "all" || item.dataset.category === filter;
      item.style.display = shouldShow ? "" : "none";
    });
  }
}

function showCustomAlert(message) {
  const alertElement = document.createElement("div");
  alertElement.className = "custom-alert";
  alertElement.textContent = message;
  document.body.appendChild(alertElement);
  setTimeout(() => alertElement.remove(), 3000);
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
