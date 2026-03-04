document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // avoid any cached response so we always get the latest data
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // reset dropdown so we don't keep appending duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants section
        let participantsHtml = '<p><strong>Participants:</strong></p>';
        if (details.participants.length > 0) {
          participantsHtml += '<ul class="participants-list">';
          details.participants.forEach(p => {
            // include delete icon with a data-email attribute so we can identify the participant
            participantsHtml += `<li>${p} <span class="remove" data-activity="${name}" data-email="${p}" title="Remove">✖</span></li>`;
          });
          participantsHtml += '</ul>';
        } else {
          participantsHtml += '<p class="no-participants">None yet</p>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities list so new participant appears
        try {
          await fetchActivities();
        } catch (e) {
          console.error("Failed to refresh activities after signup", e);
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });


  // listener for remove icons (event delegation)
  activitiesList.addEventListener("click", async (evt) => {
    if (evt.target.classList.contains("remove")) {
      const activity = evt.target.getAttribute("data-activity");
      const email = evt.target.getAttribute("data-email");
      try {
        const resp = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const resJson = await resp.json();
        if (resp.ok) {
          messageDiv.textContent = resJson.message;
          messageDiv.className = "success";
          messageDiv.classList.remove("hidden");
          setTimeout(() => messageDiv.classList.add("hidden"), 5000);
          fetchActivities();
        } else {
          messageDiv.textContent = resJson.detail || "Could not remove participant";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Error removing participant:", error);
      }
    }
  });

  // Initialize app
  fetchActivities();
});

