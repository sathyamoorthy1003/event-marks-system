import React, { useState, useEffect } from "react";
import { setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Trash2, Plus, Save } from "lucide-react";
import { getDocRef, getCollectionRef } from "../lib/firebase";
import { Card, Button, Input } from "../components/UIComponents";

const SettingsView = ({ rubric, setRubric, addToast, currentAppId }) => {
  const [localRubric, setLocalRubric] = useState(rubric || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rubric.length > 0 && localRubric.length === 0) setLocalRubric(rubric);
  }, [rubric]);

  const handleFieldChange = (index, field, value) => {
    const updated = [...localRubric];
    updated[index][field] = value;
    setLocalRubric(updated);
  };
  const addCriterion = () =>
    setLocalRubric([
      ...localRubric,
      {
        id: Date.now().toString(),
        name: "",
        min: 0,
        max: 10,
        weight: 1.0,
        inputType: "number",
      },
    ]);
  const removeCriterion = (index) => {
    const updated = [...localRubric];
    updated.splice(index, 1);
    setLocalRubric(updated);
  };

  const saveRubric = async () => {
    setIsSaving(true);
    try {
      const sanitizedRubric = localRubric.map((r) => ({
        ...r,
        min: r.min === "" ? 0 : Number(r.min),
        max: r.max === "" ? 0 : Number(r.max),
        weight: r.weight === "" ? 0 : Number(r.weight),
        inputType: r.inputType || "number",
      }));

      await setDoc(getDocRef(currentAppId, "rubric_config", "main"), {
        criteria: sanitizedRubric,
        updatedAt: serverTimestamp(),
      });
      await addDoc(getCollectionRef(currentAppId, "audit_logs"), {
        action: "rubric_update",
        details: { criteriaCount: sanitizedRubric.length },
        timestamp: serverTimestamp(),
      });
      addToast("Rubric Config Saved!", "success");
    } catch (e) {
      console.error(e);
      addToast("Error saving.", "error");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Scoring Rubric</h2>
        <p className="text-slate-500">Configure evaluation criteria.</p>
      </div>
      <div className="space-y-4">
        {localRubric.map((item, index) => (
          <Card
            key={item.id || index}
            className="p-6 transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Criterion {index + 1}
              </h4>
              <button
                onClick={() => removeCriterion(index)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <Input
                  label="Criterion Name"
                  value={item.name}
                  onChange={(e) =>
                    handleFieldChange(index, "name", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Input Type
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={item.inputType || "number"}
                  onChange={(e) =>
                    handleFieldChange(index, "inputType", e.target.value)
                  }
                >
                  <option value="number">Number Input (Slider)</option>
                  <option value="stars">Star Rating</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Max Score"
                  type="number"
                  value={item.max}
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "max",
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Weight (Multiplier)"
                  type="number"
                  step="0.1"
                  value={item.weight}
                  onChange={(e) =>
                    handleFieldChange(
                      index,
                      "weight",
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <button
        onClick={addCriterion}
        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-blue-400 hover:text-blue-600"
      >
        <Plus size={20} /> Add Criterion
      </button>
      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-slate-200 flex justify-end gap-4 z-10">
        <Button variant="secondary" onClick={() => setLocalRubric(rubric)}>
          Reset
        </Button>
        <Button onClick={saveRubric} disabled={isSaving} icon={Save}>
          {isSaving ? "Saving..." : "Save Rubric"}
        </Button>
      </div>
    </div>
  );
};

export default SettingsView;
