export const STORAGE_KEY = "peyywado.knight-skill-planner.v1";
export const SCHEMA = "peyywado.knight-skill-planner";
export const VERSION = 1;
export const MAX_SLOTS = 8;
export const MAX_NAME_LENGTH = 48;
export const MAX_NOTE_LENGTH = 120;
export const MAX_IMPORT_BYTES = 100 * 1024;
export const ROLES = Object.freeze(["", "Warrior", "Rogue", "Priest", "Mage", "Other"]);
export function emptyPlan() { return { schema: SCHEMA, version: VERSION, role: "", slots: [] }; }
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function boundedText(value, max, { required = false } = {}) { if (typeof value !== "string") return null; const clean = value.trim(); if (clean.length > max || (required && clean.length === 0)) return null; return clean; }
export function validatePlan(input) {
  if (!isRecord(input)) return { ok: false, error: "Plan must be a JSON object." };
  const keys = Object.keys(input).sort();
  if (keys.join(",") !== ["role", "schema", "slots", "version"].sort().join(",")) return { ok: false, error: "Plan has unsupported or missing fields." };
  if (input.schema !== SCHEMA || input.version !== VERSION) return { ok: false, error: "Unsupported planner schema or version." };
  if (!ROLES.includes(input.role)) return { ok: false, error: "Choose a supported role value." };
  if (!Array.isArray(input.slots) || input.slots.length > MAX_SLOTS) return { ok: false, error: "A plan can contain at most eight skill slots." };
  const seen = new Set(); const slots = [];
  for (const slot of input.slots) {
    if (!isRecord(slot)) return { ok: false, error: "Each slot must be an object." };
    const slotKeys = Object.keys(slot).sort();
    if (slotKeys.join(",") !== ["id", "name", "note"].sort().join(",")) return { ok: false, error: "A skill slot has unsupported or missing fields." };
    if (typeof slot.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(slot.id) || seen.has(slot.id)) return { ok: false, error: "Skill slot identifiers must be unique and valid." };
    const name = boundedText(slot.name, MAX_NAME_LENGTH, { required: true }); const note = boundedText(slot.note, MAX_NOTE_LENGTH);
    if (name === null || note === null) return { ok: false, error: "Skill names or notes exceed their allowed limits." };
    seen.add(slot.id); slots.push({ id: slot.id, name, note });
  }
  return { ok: true, value: { schema: SCHEMA, version: VERSION, role: input.role, slots } };
}
export function addSkill(plan, { id, name, note = "" }) {
  const checked = validatePlan(plan); if (!checked.ok) return checked;
  const cleanName = boundedText(name, MAX_NAME_LENGTH, { required: true }); const cleanNote = boundedText(note, MAX_NOTE_LENGTH);
  if (!cleanName || cleanNote === null || typeof id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return { ok: false, error: "Enter a valid skill name and note." };
  if (checked.value.slots.length >= MAX_SLOTS) return { ok: false, error: "All eight slots are in use." };
  if (checked.value.slots.some((slot) => slot.id === id)) return { ok: false, error: "Slot identifier already exists." };
  return validatePlan({ ...checked.value, slots: [...checked.value.slots, { id, name: cleanName, note: cleanNote }] });
}
export function updateSkill(plan, id, { name, note = "" }) {
  const checked = validatePlan(plan); if (!checked.ok) return checked;
  const cleanName = boundedText(name, MAX_NAME_LENGTH, { required: true }); const cleanNote = boundedText(note, MAX_NOTE_LENGTH);
  if (!cleanName || cleanNote === null) return { ok: false, error: "Enter a valid skill name and note." };
  if (!checked.value.slots.some((slot) => slot.id === id)) return { ok: false, error: "Skill slot was not found." };
  return validatePlan({ ...checked.value, slots: checked.value.slots.map((slot) => slot.id === id ? { ...slot, name: cleanName, note: cleanNote } : slot) });
}
export function removeSkill(plan, id) { const checked = validatePlan(plan); if (!checked.ok) return checked; return validatePlan({ ...checked.value, slots: checked.value.slots.filter((slot) => slot.id !== id) }); }
export function moveSkill(plan, id, direction) {
  const checked = validatePlan(plan); if (!checked.ok) return checked;
  if (direction !== -1 && direction !== 1) return { ok: false, error: "Move direction must be up or down." };
  const slots = [...checked.value.slots]; const index = slots.findIndex((slot) => slot.id === id); const next = index + direction;
  if (index < 0 || next < 0 || next >= slots.length) return { ok: false, error: "Skill cannot move farther in that direction." };
  [slots[index], slots[next]] = [slots[next], slots[index]];
  return validatePlan({ ...checked.value, slots });
}
export function setRole(plan, role) { const checked = validatePlan(plan); if (!checked.ok) return checked; if (!ROLES.includes(role)) return { ok: false, error: "Choose a supported role value." }; return validatePlan({ ...checked.value, role }); }
export function deriveEditorPresentation(plan, editingId) {
  const checked = validatePlan(plan);
  if (!checked.ok) {
    return {
      editing: false,
      saveDisabled: true,
      saveLabel: "Unavailable",
      title: "Plan unavailable",
      mode: "",
      cancelVisible: false,
    };
  }

  const editing = typeof editingId === "string"
    && checked.value.slots.some((slot) => slot.id === editingId);
  const full = checked.value.slots.length >= MAX_SLOTS;

  return {
    editing,
    saveDisabled: !editing && full,
    saveLabel: editing ? "Save changes" : full ? "All slots full" : "Add skill",
    title: editing ? "Edit skill note" : "Add to your plan",
    mode: editing ? "EDIT YOUR NOTE" : "ADD A SKILL NOTE",
    cancelVisible: editing,
  };
}
export function parseImportedPlan(text, byteLength) {
  if (!Number.isInteger(byteLength) || byteLength < 0 || byteLength > MAX_IMPORT_BYTES) return { ok: false, error: "JSON files must be 100 KB or smaller." };
  if (typeof text !== "string") return { ok: false, error: "File contents must be text." };
  let parsed; try { parsed = JSON.parse(text); } catch { return { ok: false, error: "That file is not valid JSON." }; }
  return validatePlan(parsed);
}
export function loadStoredPlan(serialized) { if (typeof serialized !== "string") return { ok: false, error: "No saved plan." }; let parsed; try { parsed = JSON.parse(serialized); } catch { return { ok: false, error: "Saved plan could not be read." }; } return validatePlan(parsed); }
