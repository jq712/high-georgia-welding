// Constants
const API_ENDPOINTS = {
  AUTH_LOGOUT: "/api/auth/logout",
  FORMS: "/api/forms",
  GALLERY: "/api/gallery",
  ALLOWED_EMAILS: "/api/allowed-emails",
};

class Dashboard {
  constructor() {
    this.DOM = {
      hamburgerMenu: document.querySelector(".nav__hamburger"),
      dropdownMenu: document.querySelector(".nav__dropdown"),
      logoutBtn: document.querySelectorAll("[data-action='logout']"),
      messagesTable: document.querySelector("#messagesTable tbody"),
      deleteAllMessagesBtn: document.getElementById("deleteAllMessages"),
      galleryContainer: document.getElementById("gallery-container"),
      overlay: document.getElementById("overlay"),
      currentImage: document.getElementById("current-image"),
      prevButton: document.getElementById("prev"),
      nextButton: document.getElementById("next"),
      filterContainer: document.getElementById("filter-data-btn-container"),
    };

    this.currentPage = document.body.dataset.page;
    this.navigation = new Navigation(this.DOM);
    this.messageManager = new MessageManager(this.DOM);
    this.galleryManager = new GalleryManager(this.DOM);
    this.allowedEmailsManager = new AllowedEmailsManager(this.DOM);

    this.initializeModules();
    this.bindLogoutEvent();
  }

  initializeModules() {
    switch (this.currentPage) {
      case "messages":
        this.messageManager.init();
        break;
      case "gallery":
        this.galleryManager.init();
        break;
      case "allowed-emails":
        this.allowedEmailsManager.init();
        break;
    }
  }

  bindLogoutEvent() {
    this.DOM.logoutBtn.forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const response = await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
            method: "POST",
            credentials: "include",
          });
          if (response.ok) {
            window.location.href = "/login";
          } else {
            showCustomAlert("Logout failed");
          }
        } catch (error) {
          console.error("Error during logout:", error);
          showCustomAlert("Error during logout");
        }
      });
    });
  }
}

class Navigation {
  constructor(DOM) {
    this.hamburgerMenu = DOM.hamburgerMenu;
    this.dropdownMenu = DOM.dropdownMenu;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    if (!this.hamburgerMenu || !this.dropdownMenu) return;

    this.hamburgerMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    document.addEventListener("click", (e) => {
      if (
        !this.dropdownMenu.contains(e.target) &&
        !this.hamburgerMenu.contains(e.target)
      ) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    this.hamburgerMenu.classList.toggle("is-active");
    this.dropdownMenu.classList.toggle("nav__dropdown--visible");
  }

  closeMenu() {
    this.hamburgerMenu.classList.remove("is-active");
    this.dropdownMenu.classList.remove("nav__dropdown--visible");
  }
}

class MessageManager {
  constructor(DOM) {
    this.messagesTable = DOM.messagesTable;
    this.deleteAllMessagesBtn = DOM.deleteAllMessagesBtn;
    this.bindEvents();
  }

  bindEvents() {
    if (this.deleteAllMessagesBtn) {
      this.deleteAllMessagesBtn.addEventListener("click", () =>
        this.deleteAllMessages()
      );
    }

    // Add event delegation for delete buttons
    if (this.messagesTable) {
      this.messagesTable.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".delete-message");
        if (deleteBtn) {
          const messageId = deleteBtn.dataset.id;
          this.deleteMessage(messageId);
        }
      });
    }
  }

  async init() {
    await this.loadMessages();
  }

  async loadMessages() {
    try {
      const response = await fetch(API_ENDPOINTS.FORMS, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch messages");

      const result = await response.json();
      this.updateMessagesTable(result.data.forms);
    } catch (error) {
      console.error("Error loading messages:", error);
      showCustomAlert("Error loading messages");
    }
  }

  updateMessagesTable(messages) {
    if (!this.messagesTable) return;
    this.messagesTable.innerHTML = messages
      .map((message) => this.createMessageRow(message))
      .join("");
  }

  createMessageRow(message) {
    return `
      <tr>
        <td data-label="Name">${escapeHtml(message.name)}</td>
        <td data-label="Email">${escapeHtml(message.email)}</td>
        <td data-label="Phone">${escapeHtml(message.phone)}</td>
        <td data-label="Message">${escapeHtml(message.message)}</td>
        <td data-label="Date">${formatDate(message.submittedAt)}</td>
        <td data-label="Actions">
          <button class="btn btn--danger delete-message" data-id="${
            message._id
          }">Delete</button>
        </td>
      </tr>
    `;
  }

  async deleteMessage(id) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.FORMS}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete message");
      showCustomAlert("Message deleted successfully");
      await this.loadMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      showCustomAlert("Error deleting message");
    }
  }

  async deleteAllMessages() {
    if (!confirm("Are you sure you want to delete all messages?")) return;

    try {
      const response = await fetch(API_ENDPOINTS.FORMS, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete all messages");
      showCustomAlert("All messages deleted successfully");
      await this.loadMessages();
    } catch (error) {
      console.error("Error deleting all messages:", error);
      showCustomAlert("Error deleting all messages");
    }
  }
}

class GalleryManager {
  constructor() {
    this.container = document.getElementById("gallery-container");
    this.modal = document.getElementById("editModal");
    this.editForm = document.getElementById("editImageForm");
    this.currentImageId = null;
    this.bindEvents();
  }

  bindEvents() {
    if (this.container) {
      this.container.addEventListener("click", (e) => this.handleImageClick(e));
    }

    if (this.modal) {
      // Close modal on backdrop click
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.closeModal();
        }
      });

      // Close modal on cancel button
      this.modal
        .querySelector('[data-action="close-modal"]')
        .addEventListener("click", () => this.closeModal());

      // Handle form submission
      this.editForm.addEventListener("submit", (e) => this.handleEditSubmit(e));
    }

    // Close modal on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeModal();
    });
  }

  handleImageClick(e) {
    const target = e.target;
    const card = target.closest(".gallery-card");
    if (!card) return;

    const imageId = card.dataset.imageId;

    if (target.matches('[data-action="edit"]')) {
      this.openEditModal(card, imageId);
    } else if (target.matches('[data-action="delete"]')) {
      this.handleDelete(card, imageId);
    }
  }

  openEditModal(card, imageId) {
    this.currentImageId = imageId;

    // Set current values
    const category = card
      .querySelector(".gallery-card__value")
      .textContent.trim();
    const description = card
      .querySelector(".gallery-card__field:nth-child(2) .gallery-card__value")
      .textContent.trim();

    this.editForm.querySelector("#editCategory").value = category;
    this.editForm.querySelector("#editDescription").value = description;

    // Show modal
    this.modal.classList.add("is-active");
  }

  closeModal() {
    this.modal.classList.remove("is-active");
    this.currentImageId = null;
    this.editForm.reset();
  }

  async handleEditSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.editForm);
    const data = {
      category: formData.get("category"),
      description: formData.get("description"),
    };

    try {
      const response = await fetch(
        `${API_ENDPOINTS.GALLERY}/${this.currentImageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error("Failed to update image");

      // Update card content
      const card = this.container.querySelector(
        `[data-image-id="${this.currentImageId}"]`
      );
      card.querySelector(".gallery-card__value").textContent = data.category;
      card.querySelector(
        ".gallery-card__field:nth-child(2) .gallery-card__value"
      ).textContent = data.description;

      this.closeModal();
      showCustomAlert("Image updated successfully");
    } catch (error) {
      console.error("Error updating image:", error);
      showCustomAlert("Error updating image", "error");
    }
  }

  async handleDelete(card, imageId) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.GALLERY}/${imageId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete image");

      card.remove();

      if (!this.container.querySelector(".gallery-card")) {
        this.container.innerHTML =
          '<p class="gallery-management__empty">No images found</p>';
      }

      showCustomAlert("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      showCustomAlert("Error deleting image", "error");
    }
  }
}

class AllowedEmailsManager {
  constructor(DOM) {
    this.emailsTable = document.getElementById("allowedEmailsTable");
    this.addEmailForm = document.getElementById("addEmailForm");
    this.bindEvents();
  }

  init() {
    // Initialize any necessary data or state
    console.log("AllowedEmailsManager initialized");
  }

  bindEvents() {
    if (this.emailsTable) {
      this.emailsTable.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn--edit");
        const deleteBtn = e.target.closest(".btn--delete");

        if (editBtn) {
          const id = editBtn.dataset.id;
          this.handleEdit(id);
        } else if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          this.handleDelete(id);
        }
      });
    }

    if (this.addEmailForm) {
      this.addEmailForm.addEventListener("submit", (e) => this.handleAdd(e));
    }
  }

  async handleEdit(id) {
    try {
      const emailRow = document
        .querySelector(`button[data-id="${id}"]`)
        .closest("tr");
      const currentEmail = emailRow.querySelector(
        '[data-label="Email"]'
      ).textContent;
      const currentRole = emailRow.querySelector(
        '[data-label="Role"]'
      ).textContent;

      const dialog = document.createElement("dialog");
      dialog.className = "modal";
      dialog.innerHTML = `
        <form>
          <h3>Edit Allowed Email</h3>
          <input type="email" name="email" value="${currentEmail}" required>
          <select name="role" required>
            <option value="user" ${
              currentRole === "user" ? "selected" : ""
            }>User</option>
            <option value="admin" ${
              currentRole === "admin" ? "selected" : ""
            }>Admin</option>
          </select>
          <div class="modal__actions">
            <button type="submit" class="btn">Save</button>
            <button type="button" class="btn btn--secondary" id="cancelBtn">Cancel</button>
          </div>
        </form>
      `;

      document.body.appendChild(dialog);
      dialog.showModal();

      const form = dialog.querySelector("form");
      const cancelBtn = dialog.querySelector("#cancelBtn");

      cancelBtn.addEventListener("click", () => {
        dialog.close();
        dialog.remove();
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        await this.saveEmailChanges(id, {
          email: formData.get("email"),
          role: formData.get("role"),
        });
        dialog.close();
        dialog.remove();
      });
    } catch (error) {
      console.error("Error editing email:", error);
      showCustomAlert("Error editing email");
    }
  }

  async handleDelete(id) {
    if (!confirm("Are you sure you want to delete this email?")) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.ALLOWED_EMAILS}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete email");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting email:", error);
      showCustomAlert("Error deleting email");
    }
  }

  async handleAdd(e) {
    e.preventDefault();

    const email = document.getElementById("newEmail").value;
    const role = document.getElementById("newRole").value;

    try {
      const response = await fetch(API_ENDPOINTS.ALLOWED_EMAILS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add email");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error adding email:", error);
      showCustomAlert("Error adding email: " + error.message);
    }
  }

  async saveEmailChanges(id, data) {
    try {
      const response = await fetch(`${API_ENDPOINTS.ALLOWED_EMAILS}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update email");
      }
      window.location.reload();
    } catch (error) {
      console.error("Error updating email:", error);
      showCustomAlert("Error updating email");
    }
  }
}

// Utility functions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showCustomAlert(message) {
  alert(message);
}
// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Dashboard();
});