document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select so options don't duplicate on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Title
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        // Description
        const desc = document.createElement("p");
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        // Schedule
        const sched = document.createElement("p");
        sched.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(sched);

        // Availability
        const avail = document.createElement("p");
        avail.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(avail);

        // Participants header + list
        const participantsHeader = document.createElement("p");
        participantsHeader.innerHTML = "<strong>Participants:</strong>";
        activityCard.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // email text
            const span = document.createElement("span");
            span.textContent = email;
            li.appendChild(span);

            // delete button (icon)
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "participant-delete";
            btn.setAttribute("aria-label", `Remove ${email} from ${name}`);
            btn.innerHTML = "✖";

            // Click handler to remove participant
            btn.addEventListener("click", async (e) => {
              e.stopPropagation();
              // confirm quick guard
              if (!confirm(`Remove ${email} from ${name}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const resJson = await resp.json();

                if (resp.ok) {
                  messageDiv.textContent = resJson.message;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  // refresh activities to reflect change
                  fetchActivities();
                } else {
                  messageDiv.textContent = resJson.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }

                // hide message after a short delay
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 4000);
              } catch (err) {
                console.error("Error removing participant:", err);
                messageDiv.textContent = "Failed to remove participant. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 4000);
              }
            });

            li.appendChild(btn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }
        activityCard.appendChild(ul);

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
        // Refresh activities so the new participant appears without a full page reload
        fetchActivities();
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

  // Initialize app
  fetchActivities();
});
