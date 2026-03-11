const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const clientForm = document.getElementById("clientForm")
const clientIdInput = document.getElementById("clientId")
const nameInput = document.getElementById("name")
const emailInput = document.getElementById("email")
const phoneInput = document.getElementById("phone")
const companyInput = document.getElementById("company")
const statusInput = document.getElementById("status")
const notesInput = document.getElementById("notes")
const message = document.getElementById("message")
const submitButton = document.getElementById("submitButton")
const cancelEditButton = document.getElementById("cancelEditButton")
const clientsTableBody = document.getElementById("clientsTableBody")
const searchInput = document.getElementById("searchInput")

let clients = []

function showMessage(text, color) {
    message.textContent = text
    message.style.color = color
}

function resetForm() {
    clientForm.reset()
    clientIdInput.value = ""
    submitButton.textContent = "Save Client"
    cancelEditButton.style.display = "none"
}

function renderClients(list) {
    clientsTableBody.innerHTML = ""

    if (list.length === 0) {
        clientsTableBody.innerHTML = `
            <tr>
                <td colspan="7>No clients found.</td>
            </tr>
        `
        return
    }

    list.forEach((client) => {
        const row = document.createElement("tr")

        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td>${client.company}</td>
            <td>
                <span class="status-badge status-${client.status.toLowerCase()}">
                    ${client.status}
                </span>
            </td>
            <td>${client.notes || ""}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="editClient(${client.id})">Edit</button>
                    <button onclick="deleteClient(${client.id})">Delete</button>
                </div>
            </td>
        `

        clientsTableBody.appendChild(row)
    })
}

async function fetchClients() {
    const { data, error } = await supabaseClient
        .from("clients")
        .select("*")
        .order("id", { ascending: false })

    if (error) {
        console.error(error)
        showMessage("Error loading clients.", "red")
        return
    }

    clients = data
    renderClients(clients)
}

clientForm.addEventListener("submit", async function (event) {
    event.preventDefault()

    const clientId = clientIdInput.value
    const clientData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        company: companyInput.value.trim(),
        status: statusInput.value.trim(),
        notes: notesInput.value.trim()
    }

    if (
        !clientData.name ||
        !clientData.email ||
        !clientData.phone ||
        !clientData.company ||
        !clientData.status
    ) {
        showMessage("Please fill in all required fields.", "red")
        return
    }

    submitButton.disabled = true
    submitButton.textContent = clientId ? "Updating..." : "Saving..."

    let error

    if (clientId) {
        const response = await supabaseClient
            .from("clients")
            .update(clientData)
            .eq("id", clientId)

        error = response.error
    } else {
        const response = await supabaseClient
            .from("clients")
            .insert([clientData])
        
        error = response.error
    }

    if (error) {
        console.error("Supabase error:", error)
        showMessage(`Error: ${error.message}`, "red")
        submitButton.disabled = false
        submitButton.textContent = "Save Client"
        return
    }

    showMessage(clientId ? "Client updated successfully!" : "Client created successfully!", "green")
    resetForm()
    submitButton.disabled = false
    await fetchClients()
})

cancelEditButton.addEventListener("click", function () {
    resetForm()
    showMessage("", "")
})

searchInput.addEventListener("input", function () {
    const searchTerm = searchInput.value.toLowerCase()

    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchTerm)
    )

    renderClients(filteredClients)
})

async function deleteClient(id) {
    const confirmed = confirm("Are you sure you want to delete this client?")

    if (!confirmed) return

    const { error } = await supabaseClient
        .from("clients")
        .delete()
        .eq("id", id)

    if (error) {
        console.error(error)
        showMessage("Error deleting client.", "red")
        return
    }

    showMessage("Client deleted successfully!", "green")
    await fetchClients()
}

function editClient(id) {
    const client = clients.find((item) => item.id === id)

    if (!client) return

    clientIdInput.value = client.id
    nameInput.value = client.name
    emailInput.value = client.email
    phoneInput.value = client.phone
    companyInput.value = client.company
    statusInput.value = client.status
    notesInput.value = client.notes || ""

    submitButton.textContent = "Update Client"
    cancelEditButton.style.display = "block"
    window.scrollTo({ top: 0, behavior: "smooth" })
}

cancelEditButton.style.display = "none"

fetchClients()