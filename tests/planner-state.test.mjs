import test from "node:test"; import assert from "node:assert/strict";
import { emptyPlan, addSkill, updateSkill, removeSkill, moveSkill, setRole, validatePlan, parseImportedPlan, loadStoredPlan, MAX_IMPORT_BYTES, deriveEditorPresentation } from "../planner-state.mjs";
const add = (plan,id,name=`Skill ${id}`) => addSkill(plan,{id,name,note:"manual reminder"});
test("plans are capped at eight unique slots",()=>{let plan=emptyPlan();for(let i=1;i<=8;i++){const r=add(plan,`s${i}`);assert.equal(r.ok,true);plan=r.value}assert.equal(add(plan,"s9").ok,false);assert.equal(add(plan,"s1").ok,false)});
test("edit, delete, reorder, and role updates preserve valid data",()=>{let p=add(emptyPlan(),"a","First").value;p=add(p,"b","Second").value;p=updateSkill(p,"a",{name:"Changed",note:"Manual only"}).value;p=moveSkill(p,"b",-1).value;assert.deepEqual(p.slots.map(s=>s.name),["Second","Changed"]);p=setRole(p,"Mage").value;p=removeSkill(p,"b").value;assert.equal(p.role,"Mage");assert.equal(p.slots.length,1);assert.equal(p.slots[0].note,"Manual only")});
test("import rejects arrays, unknown keys, duplicate identifiers, and oversized files",()=>{assert.equal(validatePlan([]).ok,false);assert.equal(validatePlan({...emptyPlan(),unexpected:true}).ok,false);const dup={...emptyPlan(),slots:[{id:"same",name:"A",note:""},{id:"same",name:"B",note:""}]};assert.equal(validatePlan(dup).ok,false);assert.equal(parseImportedPlan(JSON.stringify(emptyPlan()),MAX_IMPORT_BYTES+1).ok,false)});
test("import and local storage require the app schema and bounded text",()=>{const p={...emptyPlan(),role:"Rogue",slots:[{id:"one",name:"Skill",note:"Use manually"}]};const s=JSON.stringify(p);assert.deepEqual(parseImportedPlan(s,Buffer.byteLength(s)).value,p);assert.equal(parseImportedPlan("null",4).ok,false);assert.equal(loadStoredPlan("not json").ok,false);assert.equal(validatePlan({...p,slots:[{...p.slots[0],name:"x".repeat(49)}]}).ok,false)});

test("full plans allow editing but disable adding; cancel restores full-state controls", () => {
  let plan = emptyPlan();
  for (let i = 1; i <= 8; i += 1) plan = add(plan, `s${i}`).value;

  const addView = deriveEditorPresentation(plan, null);
  assert.equal(addView.saveDisabled, true);
  assert.equal(addView.saveLabel, "All slots full");
  assert.equal(addView.cancelVisible, false);

  const editView = deriveEditorPresentation(plan, "s4");
  assert.equal(editView.saveDisabled, false);
  assert.equal(editView.saveLabel, "Save changes");
  assert.equal(editView.cancelVisible, true);

  const cancelView = deriveEditorPresentation(plan, null);
  assert.equal(cancelView.saveDisabled, true);
  assert.equal(cancelView.cancelVisible, false);
  assert.equal(deriveEditorPresentation(plan, "missing").saveDisabled, true);
});
