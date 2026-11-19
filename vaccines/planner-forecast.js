// Project visits using the same clinical rules and a separate, hypothetical dose history.
(function (root) {
  'use strict';
  const rules = root ? root.VaccinePlannerRules : require('./planner-rules.js');
  const manual = new Set(['flu', 'covid', 'menB', 'rsv']);
  function canProject(item) {
    return ['eligible','wait'].includes(item.status) && Boolean(item.earliest) && !manual.has(item.id);
  }
  function targetDate(item, cursor, strategy) {
    return [cursor, item.earliest, strategy === 'usual' ? item.routine : null].filter(Boolean).sort().at(-1);
  }
  function project(patient, selectedIds, strategy, endDate) {
    const selected = new Set(selectedIds);
    if (!selected.size || !['usual','minimum'].includes(strategy)) return [];
    const visits = [];
    let cursor = patient.asOf;
    const history = patient.history.slice();
    // Each pass advances to a future date or records a visit. The pediatric age limit
    // or completion of the selected series ends the projection.
    while (!endDate || cursor <= endDate) {
      const check = rules.evaluate({...patient, history, asOf:cursor});
      const candidates = (check.results || []).filter(item => selected.has(item.id) && canProject(item));
      if (!candidates.length) break;
      const date = candidates.map(item => targetDate(item,cursor,strategy)).sort()[0];
      if (endDate && date > endDate) break;
      if (date > cursor) { cursor=date; continue; }
      const due = candidates.filter(item => item.status === 'eligible' && targetDate(item,cursor,strategy) === cursor);
      if (!due.length) break;
      visits.push({date:cursor, doses:due.map(item => ({id:item.id,label:item.label,number:item.doses+1}))});
      for (const item of due) {
        history.push({vaccine:item.id,date:cursor,product:item.id === 'hepB' ? 'pediatric' : 'unknown'});
      }
      // Recheck the accumulated history for all antigens after any proposed live dose.
      cursor = new Date(Date.parse(cursor + 'T00:00:00Z') + 86400000).toISOString().slice(0,10);
    }
    return visits;
  }
  const api = {canProject,project};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.VaccineForecast = api;
})(typeof window === 'undefined' ? null : window);
