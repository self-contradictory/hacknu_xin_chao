import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";


export default function JobSearchBar({ value, onChange, filters, onFiltersChange }) {
const [local, setLocal] = useState(value);


useEffect(() => {
const id = setTimeout(() => onChange(local), 220);
return () => clearTimeout(id);
}, [local, onChange]);


const locations = useMemo(() => ["Remote", "Astana", "Almaty", "EU", "US"], []);
const levels = useMemo(() => ["Junior", "Middle", "Senior", "Lead"], []);
const types = useMemo(() => ["Full-time", "Part-time", "Contract", "Internship"], []);


const setFilter = (name, val) => onFiltersChange({ ...filters, [name]: val });


return (
<motion.section
className="card"
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.35 }}
style={{ marginBottom: 18 }}
>
<div className="field">
<label htmlFor="q">Search jobs</label>
<input
id="q"
placeholder="e.g., React, Node, Data Analyst"
value={local}
onChange={(e) => setLocal(e.target.value)}
/>
</div>


<div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
<div className="field">
<label htmlFor="loc">Location</label>
<select id="loc" value={filters.location} onChange={(e) => setFilter("location", e.target.value)}>
<option value="">Any</option>
{locations.map((l) => (
<option key={l} value={l}>{l}</option>
))}
</select>
</div>


<div className="field">
<label htmlFor="lvl">Level</label>
<select id="lvl" value={filters.level} onChange={(e) => setFilter("level", e.target.value)}>
<option value="">Any</option>
{levels.map((l) => (
<option key={l} value={l}>{l}</option>
))}
</select>
</div>


<div className="field">
<label htmlFor="type">Type</label>
<select id="type" value={filters.type} onChange={(e) => setFilter("type", e.target.value)}>
<option value="">Any</option>
{types.map((t) => (
<option key={t} value={t}>{t}</option>
))}
</select>
</div>
</div>
</motion.section>
);
}