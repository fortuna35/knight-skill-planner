import { STORAGE_KEY, MAX_IMPORT_BYTES, emptyPlan, addSkill, updateSkill, removeSkill, moveSkill, setRole, parseImportedPlan, loadStoredPlan, deriveEditorPresentation } from "./planner-state.mjs";
const byId = (id) => document.getElementById(id); const roleSelect = byId("role"); const list = byId("skill-list"); const form = byId("skill-form"); const nameInput = byId("skill-name"); const noteInput = byId("cooldown-note"); const status = byId("data-status"); const formError = byId("form-error");
let plan = emptyPlan(); let editingId = null;
function announce(message) { status.textContent = message; }
function createSlotId() { return globalThis.crypto?.randomUUID?.() ?? `slot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`; }
function syncEditorControls() {
  const view = deriveEditorPresentation(plan, editingId);
  byId("form-title").textContent = view.title;
  byId("form-mode").textContent = view.mode;
  byId("save-skill").textContent = view.saveLabel;
  byId("save-skill").disabled = view.saveDisabled;
  byId("cancel-edit").classList.toggle("hidden", !view.cancelVisible);
}
function savePlan() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); announce("Plan saved in this browser on this device."); } catch { announce("This browser could not save locally. Export a JSON copy to keep your notes."); } }
function applyResult(result) { if (!result.ok) { formError.textContent = result.error; return false; } plan = result.value; formError.textContent = ""; savePlan(); render(); return true; }
function resetForm() { editingId = null; form.reset(); formError.textContent = ""; syncEditorControls(); }
function beginEdit(slot) { editingId = slot.id; nameInput.value = slot.name; noteInput.value = slot.note; formError.textContent = ""; syncEditorControls(); nameInput.focus(); }
function makeButton(label, symbol, className, onClick, disabled = false) { const button = document.createElement("button"); button.type = "button"; button.className = className; button.textContent = symbol || label; button.setAttribute("aria-label", label); button.disabled = disabled; button.addEventListener("click", onClick); return button; }
function render() {
  list.replaceChildren(); byId("slot-count").textContent = `${plan.slots.length} / 8 slots`; byId("empty-state").classList.toggle("hidden", plan.slots.length > 0);
  plan.slots.forEach((slot, index) => {
    const item = document.createElement("li"); item.className = "skill-card";
    const number = document.createElement("span"); number.className = "slot-number"; number.textContent = String(index + 1).padStart(2, "0"); number.setAttribute("aria-label", `Slot ${index + 1}`);
    const content = document.createElement("div"); content.className = "skill-content"; const title = document.createElement("h3"); title.textContent = slot.name; content.append(title);
    const note = document.createElement("p"); note.className = "skill-note"; note.textContent = slot.note || "No reminder note"; content.append(note);
    const actions = document.createElement("div"); actions.className = "skill-actions";
    actions.append(makeButton("Move up", "↑", "icon-button", () => applyResult(moveSkill(plan, slot.id, -1)), index === 0));
    actions.append(makeButton("Move down", "↓", "icon-button", () => applyResult(moveSkill(plan, slot.id, 1)), index === plan.slots.length - 1));
    actions.append(makeButton("Edit", "Edit", "small-button", () => beginEdit(slot)));
    actions.append(makeButton("Delete", "Delete", "small-button danger-button", () => { if (editingId === slot.id) resetForm(); applyResult(removeSkill(plan, slot.id)); announce("Skill note removed."); }));
    item.append(number, content, actions); list.append(item);
  });
  roleSelect.value = plan.role; syncEditorControls();
}
form.addEventListener("submit", (event) => { event.preventDefault(); const input = { name: nameInput.value, note: noteInput.value }; const result = editingId ? updateSkill(plan, editingId, input) : addSkill(plan, { ...input, id: createSlotId() }); const wasEditing = Boolean(editingId); if (applyResult(result)) { resetForm(); nameInput.focus(); announce(wasEditing ? "Skill note updated." : "Skill note added."); } });
byId("cancel-edit").addEventListener("click", () => { resetForm(); nameInput.focus(); });
roleSelect.addEventListener("change", () => { const result = setRole(plan, roleSelect.value); if (result.ok) { plan = result.value; savePlan(); announce("Role updated."); } else announce(result.error); });
byId("export-plan").addEventListener("click", () => { const blob = new Blob([`${JSON.stringify(plan, null, 2)}\n`], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "knight-skill-plan.json"; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); announce("Your planner JSON was exported."); });
byId("import-plan").addEventListener("click", () => byId("import-file").click());
byId("import-file").addEventListener("change", async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; if (file.size > MAX_IMPORT_BYTES) { announce("Import rejected: JSON files must be 100 KB or smaller."); return; } try { const result = parseImportedPlan(await file.text(), file.size); if (!result.ok) { announce(`Import rejected: ${result.error}`); return; } plan = result.value; resetForm(); savePlan(); render(); announce("Planner JSON imported and validated."); } catch { announce("Import rejected: the file could not be read."); } });
byId("clear-plan").addEventListener("click", () => { plan = emptyPlan(); resetForm(); savePlan(); render(); announce("Plan cleared."); });
let savedText = null; try { savedText = localStorage.getItem(STORAGE_KEY); } catch { announce("Local storage is unavailable. You can still export your plan as JSON."); } const saved = loadStoredPlan(savedText); if (saved.ok) { plan = saved.value; announce("Saved plan loaded from this browser."); } else if (savedText !== null) { announce("Saved data was invalid or from an unsupported version; start a new plan or import a valid JSON copy."); } else if (savedText === null) announce("Ready. Your plan stays in this browser unless you export it."); render();



